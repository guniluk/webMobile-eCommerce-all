import { Review } from "../models/review.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";

/**
 * 상품의 평균 평점(averageRating) 및 총 리뷰 수(totalReviews) 최신화 헬퍼 함수
 */
const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$productId",
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      totalReviews: stats[0].totalReviews,
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      totalReviews: 0,
      averageRating: 0,
    });
  }
};

/**
 * 리뷰 작성 API
 */
export const createReview = async (req, res) => {
  try {
    const user = req.user;
    const { productId, rating, orderId } = req.body;

    // 1. 필수 입력값 검증
    if (!productId || rating === undefined || rating === null || !orderId) {
      return res.status(400).json({
        success: false,
        message: "모든 필수 정보(productId, rating, orderId)를 입력해 주세요.",
      });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "평점은 1점에서 5점 사이의 숫자여야 합니다.",
      });
    }

    // 2. 주문 존재 및 배송 완료 여부 확인
    const order = await Order.findById(orderId);
    if (!order || order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "배송이 완료된 주문 건에 대해서만 리뷰를 작성할 수 있습니다.",
      });
    }

    // 3. 본인 주문 건인지 권한 확인 (clerkId 또는 userId 비교)
    if (
      order.clerkId !== user.clerkId &&
      order.userId.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "해당 주문에 대한 리뷰 작성 권한이 없습니다.",
      });
    }

    // 4. 상품 존재 여부 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "존재하지 않는 상품입니다.",
      });
    }

    // 5. 주문 내 상품 포함 여부 검증
    const productInOrder = order.orderItems.find(
      (item) => item.productId.toString() === productId.toString(),
    );
    if (!productInOrder) {
      return res.status(400).json({
        success: false,
        message: "해당 주문 항목에 존재하지 않는 상품입니다.",
      });
    }

    // 6. 이미 작성된 리뷰 존재 여부 확인
    const existingReview = await Review.findOne({
      userId: user._id,
      productId,
    });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "해당 주문 상품에 대해 이미 작성된 리뷰가 존재합니다.",
      });
    }

    // 7. 리뷰 생성
    const review = await Review.create({
      userId: user._id,
      productId,
      orderId,
      rating: numericRating,
    });

    // 8. 상품 평점 및 리뷰 개수 갱신
    await updateProductRating(productId);

    return res.status(201).json({
      message: "리뷰가 성공적으로 등록되었습니다.",
      review,
    });
  } catch (error) {
    console.error("리뷰 등록 실패:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * 리뷰 삭제 API
 */
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "삭제할 리뷰를 찾을 수 없습니다.",
      });
    }

    // ObjectId 문자열 비교로 권한 검증
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "해당 리뷰를 삭제할 권한이 없습니다.",
      });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(reviewId);

    // 상품 평점 및 리뷰 개수 갱신
    await updateProductRating(productId);

    return res.status(200).json({
      message: "리뷰가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("리뷰 삭제 실패:", error);
    return res.status(500).json({ message: error.message });
  }
};
