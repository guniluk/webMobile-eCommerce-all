import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createReview,
  deleteReview,
  getProductReviews,
} from "../controllers/review.controller.js";

const router = Router();

router.get("/product/:productId", getProductReviews);
router.post("/", protectRoute, createReview);
router.delete("/:reviewId", protectRoute, deleteReview);

export default router;
