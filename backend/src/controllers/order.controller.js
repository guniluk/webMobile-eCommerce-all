import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { Cart } from "../models/cart.model.js";
import mongoose from "mongoose";

export const createOrder = async (req, res) => {
  const user = req.user;

  // 모든 로직이 트랜잭션 처리되어야 함 (성공 시 커밋, 실패 시 롤백)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderItems, shippingAddress, totalPrice, paymentResult } = req.body;
    if (
      !orderItems ||
      !shippingAddress ||
      totalPrice === undefined ||
      !paymentResult
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "모든 필수 정보가 제공되지 않았습니다.",
      });
    }

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "주문 상품이 없습니다.",
      });
    }

    // 상품 유효성 검사 및 재고 차감 (단일 루프 트랜잭션 내 수행)
    for (const item of orderItems) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: "유효하지 않은 상품이 주문에 포함되어 있습니다.",
        });
      }
      if (item.quantity > product.stock) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `${product.name || "상품"}의 재고가 부족합니다.`,
        });
      }
      product.stock -= item.quantity;
      await product.save({ session });
    }

    // 주문 생성 (트랜잭션 session 전달)
    const [order] = await Order.create(
      [
        {
          userId: user._id,
          clerkId: user.clerkId,
          orderItems,
          shippingAddress,
          paymentResult,
          totalPrice,
        },
      ],
      { session },
    );

    // 주문 완료 후 장바구니 비우기 (Cart 모델 사용)
    await Cart.findOneAndUpdate(
      { userId: user._id },
      { items: [] },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json({ message: "주문이 성공적으로 완료되었습니다.", order });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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
    });
    const reviewedOrderIds = new Set(
      reviews.map((review) => review.orderId.toString()),
    );

    // 주문별 리뷰 남김 여부 매핑 (동기 map 사용 및 Set 검색으로 최적화)
    const orderWithReviewStatus = orders.map((order) => ({
      ...order.toObject(),
      hasReviewed: reviewedOrderIds.has(order._id.toString()),
    }));

    return res.status(200).json({ orders: orderWithReviewStatus });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
