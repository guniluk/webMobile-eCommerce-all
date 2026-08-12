import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
} from "../controllers/review.controller.js";

const router = Router();

router.get("/product/:productId", getProductReviews);
router.post("/", protectRoute, createReview);
router.put("/:reviewId", protectRoute, updateReview);
router.delete("/:reviewId", protectRoute, deleteReview);

export default router;
