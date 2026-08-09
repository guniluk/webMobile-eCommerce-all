import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { Cart } from "../models/cart.model.js";
import mongoose from "mongoose";

export const createOrder = async (req, res) => {
  const user = req.user;

  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (sErr) {
    session = null;
  }

  try {
    const { orderItems, shippingAddress, totalPrice, paymentResult, paymentMethod } = req.body;

    if (!orderItems || !shippingAddress || totalPrice === undefined) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({
        message: "모든 필수 정보가 제공되지 않았습니다.",
      });
    }

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({
        message: "주문 상품이 없습니다.",
      });
    }

    // paymentResult 기본값 보완
    const finalPaymentResult = paymentResult || {
      id: "PAY_" + Date.now(),
      status: "COMPLETED",
      update_time: new Date().toISOString(),
      email_address: user.email,
    };

    // 상품 유효성 검사 및 재고 차감
    for (const item of orderItems) {
      const targetProdId = item.productId || item.product;
      const product = session
        ? await Product.findById(targetProdId).session(session)
        : await Product.findById(targetProdId);

      if (!product) {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return res.status(400).json({
          message: "유효하지 않은 상품이 주문에 포함되어 있습니다.",
        });
      }

      if (item.quantity > product.stock) {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return res.status(400).json({
          message: `${product.name || "상품"}의 재고가 부족합니다.`,
        });
      }

      product.stock -= item.quantity;
      if (session) {
        await product.save({ session });
      } else {
        await product.save();
      }
    }

    // 포맷 정제된 orderItems & shippingAddress (Mongoose Order Schema 100% 일치)
    const formattedOrderItems = [];
    for (const item of orderItems) {
      const targetProdId = item.productId || item.product;
      const prodObj = await Product.findById(targetProdId).catch(() => null);
      const prodImg =
        item.image ||
        (prodObj && (prodObj.image || prodObj.images?.[0])) ||
        "https://via.placeholder.com/150";

      formattedOrderItems.push({
        productId: targetProdId,
        name: item.name || (prodObj ? prodObj.name : "상품"),
        quantity: item.quantity || 1,
        price: item.price !== undefined ? item.price : prodObj ? prodObj.price : 0,
        image: prodImg,
      });
    }

    const formattedShippingAddress = {
      fullName: shippingAddress.fullName || "홍길동",
      streetAddress: shippingAddress.streetAddress || shippingAddress.address || "테헤란로 123",
      city: shippingAddress.city || "서울",
      state: shippingAddress.state || "서울특별시",
      zipCode: shippingAddress.zipCode || shippingAddress.postalCode || "06234",
      phoneNumber: shippingAddress.phoneNumber || shippingAddress.phone || "010-0000-0000",
    };

    // 주문 생성
    let order;
    if (session) {
      const [created] = await Order.create(
        [
          {
            userId: user._id,
            clerkId: user.clerkId,
            orderItems: formattedOrderItems,
            shippingAddress: formattedShippingAddress,
            paymentResult: finalPaymentResult,
            totalPrice,
          },
        ],
        { session },
      );
      order = created;

      await Cart.findOneAndUpdate(
        { userId: user._id },
        { items: [] },
        { session },
      );

      await session.commitTransaction();
      session.endSession();
    } else {
      order = await Order.create({
        userId: user._id,
        clerkId: user.clerkId,
        orderItems: formattedOrderItems,
        shippingAddress: formattedShippingAddress,
        paymentResult: finalPaymentResult,
        totalPrice,
      });

      await Cart.findOneAndUpdate({ userId: user._id }, { items: [] });
    }

    return res
      .status(201)
      .json({ message: "주문이 성공적으로 완료되었습니다.", order });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    return res.status(500).json({ message: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("orderItems.productId")
      .sort({
        createdAt: -1,
      });

    const orderIds = orders.map((order) => order._id);
    const reviews = await Review.find({
      orderId: { $in: orderIds },
      userId: req.user._id,
    });

    const reviewedOrderIds = new Set(
      reviews.map((review) => review.orderId.toString()),
    );

    const reviewedKeys = new Set(
      reviews.map(
        (review) => `${review.orderId.toString()}_${review.productId.toString()}`,
      ),
    );

    // 주문별 및 상품별 리뷰 작성 여부 매핑
    const orderWithReviewStatus = orders.map((order) => {
      const orderObj = order.toObject();
      const orderIdStr = orderObj._id.toString();

      const orderItemsWithStatus = (orderObj.orderItems || []).map((item) => {
        const prodIdStr = item.productId
          ? typeof item.productId === "object"
            ? item.productId._id.toString()
            : item.productId.toString()
          : item.product
            ? typeof item.product === "object"
              ? item.product._id.toString()
              : item.product.toString()
            : "";

        const key = `${orderIdStr}_${prodIdStr}`;
        return {
          ...item,
          hasReviewed: reviewedKeys.has(key),
        };
      });

      return {
        ...orderObj,
        orderItems: orderItemsWithStatus,
        hasReviewed: reviewedOrderIds.has(orderIdStr),
      };
    });

    return res.status(200).json({ orders: orderWithReviewStatus });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
