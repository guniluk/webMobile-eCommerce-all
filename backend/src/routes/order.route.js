import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createOrder, getUserOrders } from "../controllers/order.controller.js";

const router = Router();

// 보호된 라우트 (DB 유저가 존재하는 로그인 상태 필요)
router.use(protectRoute);
router.post("/", createOrder);
router.get("/", getUserOrders);

export default router;
