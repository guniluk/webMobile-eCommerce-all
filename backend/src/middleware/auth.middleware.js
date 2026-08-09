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

    let user = await User.findOne({ clerkId: userId });

    // DB에 유저 정보가 아직 생성되지 않은 신규 가입자도 401 오류 없이 자동 동기화 생성
    if (!user) {
      user = await User.findOneAndUpdate(
        { clerkId: userId },
        {
          $setOnInsert: {
            clerkId: userId,
            email: `${userId}@clerk.user`,
            name: "User",
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      ).catch(() => null);
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * 2. 관리자 권한 확인 미들웨어 (adminOnly)
 * ADMIN_EMAIL 환경변수가 존재할 경우 해당 이메일 체크, 그렇지 않은 경우 인증된 사용자는 통과
 */
export const adminOnly = (req, res, next) => {
  const adminEmailsEnv = process.env.ADMIN_EMAIL;
  if (adminEmailsEnv && adminEmailsEnv.trim() !== "") {
    const adminEmails = adminEmailsEnv.split(",").map((e) => e.trim());
    if (!req.user || !adminEmails.includes(req.user.email)) {
      return res.status(403).json({ message: "Forbidden: 관리자 권한 필요" });
    }
  }
  next();
};
