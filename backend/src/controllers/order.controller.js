import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { Cart } from "../models/cart.model.js";
import { createOrderNotification } from "../utils/notification.js";
import mongoose from "mongoose";

const SHIPPING_FEE_STANDARD = 3000;
const TAX_RATE = 0.1;

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
    const { orderItems, shippingAddress, totalPrice, paymentResult } = req.body;

    if (!orderItems || !shippingAddress || totalPrice === undefined) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({
        message: "모든 필수 정보가 제공되지 않았습니다.",
      });
    }

    // 🛡️ shippingAddress 모든 필드 유효성 검증
    if (typeof shippingAddress !== "object") {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({
        message: "배송지 정보(shippingAddress)가 올바르지 않습니다.",
      });
    }

    const fullName = String(shippingAddress.fullName || "").trim();
    const streetAddress = String(
      shippingAddress.streetAddress || shippingAddress.address || "",
    ).trim();
    const city = String(shippingAddress.city || "").trim();
    const state = String(shippingAddress.state || "").trim();
    const zipCode = String(
      shippingAddress.zipCode || shippingAddress.postalCode || "",
    ).trim();
    const phoneNumber = String(
      shippingAddress.phoneNumber || shippingAddress.phone || "",
    ).trim();

    if (
      !fullName ||
      !streetAddress ||
      !city ||
      !state ||
      !zipCode ||
      !phoneNumber
    ) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({
        message:
          "배송지 정보의 모든 필수 필드(이름, 주소, 도시, 도/시, 우편번호, 전화번호)를 입력해 주세요.",
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

    // 🛡️ 멱등성 단일 차감 가드: 동일한 paymentResult.id (Stripe PaymentIntent ID)로 이미 주문이 존재하는 경우 중복 차감 및 중복 생성 차단
    if (finalPaymentResult && finalPaymentResult.id) {
      const existingOrder = await Order.findOne({
        "paymentResult.id": finalPaymentResult.id,
      });
      if (existingOrder) {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return res.status(200).json({
          message: "이미 성공적으로 접수된 주문입니다. (이중 차감 방지 됨)",
          order: existingOrder,
        });
      }
    }

    // N+1 DB 쿼리 최적화: Batch Read
    const productIds = orderItems.map((item) => item.productId || item.product);
    const dbProducts = session
      ? await Product.find({ _id: { $in: productIds } }).session(session)
      : await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    let calculatedSubtotal = 0;
    const formattedOrderItems = [];

    // 상품 유효성 검사, 단 1회 재고 차감 및 orderItems 포맷팅을 루프에서 처리
    for (const item of orderItems) {
      const targetProdId = (item.productId || item.product)?.toString();
      const product = productMap.get(targetProdId);

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

      // 📦 주문 당 단 1회 재고(stock) 차감 처리
      product.stock -= item.quantity;
      if (session) {
        await product.save({ session });
      } else {
        await product.save();
      }

      const itemPrice = item.price !== undefined ? item.price : product.price;
      calculatedSubtotal += itemPrice * (item.quantity || 1);

      const prodImg =
        item.image ||
        product.image ||
        product.images?.[0] ||
        "https://via.placeholder.com/150";

      formattedOrderItems.push({
        productId: product._id,
        name: item.name || product.name,
        quantity: item.quantity || 1,
        price: itemPrice,
        image: prodImg,
      });
    }

    // 서버 측 배송비 및 세금 일관성 산정 (10만원 이상 무료배송, 10만원 미만 고정 3,000원)
    const calculatedShippingFee =
      calculatedSubtotal >= 100000 ? 0 : SHIPPING_FEE_STANDARD;
    const calculatedTaxAmount = Math.round(calculatedSubtotal * TAX_RATE);
    const calculatedTotalPrice = Math.round(
      calculatedSubtotal + calculatedShippingFee + calculatedTaxAmount,
    );

    // 🛡️ 클라이언트 전달 totalPrice와 서버 계산 calculatedTotalPrice 불일치 검증
    if (totalPrice === undefined || Number(totalPrice) !== calculatedTotalPrice) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({
        message: `주문 결제 금액이 일치하지 않습니다. (전달된 금액: ${totalPrice}원, 계산된 금액: ${calculatedTotalPrice}원)`,
      });
    }

    const formattedShippingAddress = {
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
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
            subtotal: calculatedSubtotal,
            shippingFee: calculatedShippingFee,
            taxAmount: calculatedTaxAmount,
            totalPrice: calculatedTotalPrice,
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
        subtotal: calculatedSubtotal,
        shippingFee: calculatedShippingFee,
        taxAmount: calculatedTaxAmount,
        totalPrice: calculatedTotalPrice,
      });

      await Cart.findOneAndUpdate({ userId: user._id }, { items: [] });
    }

    // 🔔 DB 알림 자동 연동 (주문 접수 완료)
    await createOrderNotification({
      userId: user._id,
      orderId: order._id,
      status: "created",
      orderItems: formattedOrderItems,
      totalPrice,
    });

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
      .populate("orderItems.productId", "name price image")
      .sort({
        createdAt: -1,
      })
      .lean();

    const orderIds = orders.map((order) => order._id);
    const reviews = await Review.find({
      orderId: { $in: orderIds },
      userId: req.user._id,
    }).lean();

    const reviewedOrderIds = new Set(
      reviews.map((review) => review.orderId.toString()),
    );

    const reviewedKeys = new Set(
      reviews.map(
        (review) =>
          `${review.orderId.toString()}_${review.productId.toString()}`,
      ),
    );

    // 주문별 및 상품별 리뷰 작성 여부 매핑
    const orderWithReviewStatus = orders.map((orderObj) => {
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

/**
 * 주문 상태 변경 및 DB 알림 트리거
 * PATCH /api/orders/:id/status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }

    order.status = status;
    if (status === "delivered") {
      order.deliveredAt = new Date();
    } else if (status === "shipped") {
      order.shippedAt = new Date();
    }
    await order.save();

    // 🔔 상태 변경 DB 알림 자동 연동
    await createOrderNotification({
      userId: order.userId,
      orderId: order._id,
      status,
      orderItems: order.orderItems,
      totalPrice: order.totalPrice,
    });

    return res
      .status(200)
      .json({ message: "주문 상태가 변경되었습니다.", order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
