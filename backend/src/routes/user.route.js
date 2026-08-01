import express from "express";
import {
  syncUser,
  handleClerkWebhook,
  getProfile,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  addWishlist,
  getWishlists,
  deleteWishlist,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// 1. 공개 라우트 (인증 미들웨어 미적용)
// Webhook: Clerk 서버에서 호출하는 외부 웹훅 (JWT 토큰 없음)
router.post("/webhook", handleClerkWebhook);

// Sync: 신규 회원가입 직후 MongoDB에 유저를 최초 생성(upsert)하는 라우트 (DB에 유저가 아직 없으므로 protectRoute 미적용)
router.post("/sync", syncUser);

// 2. 보호된 라우트 (DB 유저가 존재하는 로그인 상태 필요)
router.use(protectRoute);

router.get("/me", getProfile);

router.post("/addresses", addAddress);
router.get("/addresses", getAddresses);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);

router.post("/wishlists", addWishlist);
router.get("/wishlists", getWishlists);
router.delete("/wishlists/:productId", deleteWishlist);

export default router;
