import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createPaymentIntent,
  handleStripeWebhook,
} from "../controllers/payment.controller.js";

const router = Router();

// 1. Stripe Webhook 엔드포인트 (Stripe 서버 비동기 수신용 - 인증 미적용)
router.post("/webhook", handleStripeWebhook);

// 2. 로그인 사용자 결제 세션 생성 엔드포인트 (인증 필요)
router.post("/create-intent", protectRoute, createPaymentIntent);

export default router;
