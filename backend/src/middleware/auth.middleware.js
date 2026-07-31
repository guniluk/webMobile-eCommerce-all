import { getAuth } from "@clerk/express";
import { User } from "../models/user.model.js";

/**
 * 1. 로그인 유저 인증 미들웨어 (protectRoute)
 * Clerk JWT 토큰을 확인하여 유효한 사용자인 경우 req.user에 DB 유저 객체를 주입합니다.
 */
export const protectRoute = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: 로그인 필요" });
    }
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found in Database" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * 2. 관리자 권한 확인 미들웨어 (adminOnly)
 * protectRoute 실행 후 req.user.role이 'admin'인지 검사합니다.
 */

const ADMIN_EMAILS = process.env.ADMIN_EMAIL?.split(",") || [];

export const adminOnly = (req, res, next) => {
  if (!req.user || !ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({ message: "Forbidden: 관리자 권한 필요" });
  }
  next();
};
