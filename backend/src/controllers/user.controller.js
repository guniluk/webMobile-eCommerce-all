import { getAuth } from "@clerk/express";
import { User } from "../models/user.model.js";

/**
 * 1. 프론트엔드 로그인 직후 자동 동기화 API (/api/user/sync)
 * Clerk 로그인 유저 정보를 백엔드로 전달받거나 req.auth로 확인하여
 * MongoDB에 유저가 없으면 신규 생성하고, 있으면 정보를 최신화합니다.
 */
export const syncUser = async (req, res) => {
  try {
    const auth = getAuth(req);
    const authUserId = auth?.userId;

    const { clerkId, email, name, imageUrl } = req.body || {};
    const targetClerkId = clerkId || authUserId;

    if (!targetClerkId) {
      console.warn("[syncUser 경고] Clerk User ID가 제공되지 않음");
      return res.status(400).json({
        success: false,
        message: "Clerk User ID가 제공되지 않았습니다.",
      });
    }

    const userData = {
      clerkId: targetClerkId,
      email:
        email && email.trim() !== "" ? email : `${targetClerkId}@clerk.user`,
      name: name && name.trim() !== "" ? name : "User",
      imageUrl: imageUrl || "",
    };

    console.log(
      `[syncUser 요청 수신] clerkId: ${targetClerkId}, email: ${userData.email}`,
    );

    // DB에 존재하면 업데이트, 없으면 생성 (Upsert)
    const user = await User.findOneAndUpdate(
      { clerkId: targetClerkId },
      { $set: userData },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    console.log(`[syncUser 성공] MongoDB User 저장완료 (_id: ${user._id})`);

    return res.status(200).json({
      success: true,
      message: "사용자 동기화 성공",
      user,
    });
  } catch (error) {
    console.error("[syncUser 에러 발생]:", error);
    return res.status(500).json({
      success: false,
      message: "사용자 동기화 실패: " + error.message,
    });
  }
};

/**
 * 2. Clerk Direct Webhook 수신 엔드포인트 (/api/user/webhook)
 * Clerk 대시보드 Webhook에서 Inngest를 거치지 않고 직접 쏠 때 처리합니다.
 */
export const handleClerkWebhook = async (req, res) => {
  try {
    const event = req.body || {};
    const { type, data } = event;

    if (!type || !data) {
      return res.status(400).json({ message: "유효하지 않은 Webhook Payload" });
    }

    const { id, first_name, last_name, email_addresses, image_url } = data;

    const email =
      email_addresses && email_addresses.length > 0
        ? email_addresses[0].email_address
        : data.email || `${id}@clerk.user`;
    const name = `${first_name || ""} ${last_name || ""}`.trim() || "User";
    const imageUrl = image_url || data.profile_image_url || "";

    if (type === "user.created" || type === "clerk/user.created") {
      const user = await User.findOneAndUpdate(
        { clerkId: id },
        { clerkId: id, email, name, imageUrl },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      console.log(`[Clerk Webhook] 유저 생성 완료: ${id} (_id: ${user._id})`);
    } else if (type === "user.updated" || type === "clerk/user.updated") {
      await User.findOneAndUpdate(
        { clerkId: id },
        { email, name, imageUrl },
        { returnDocument: "after" },
      );
      console.log(`[Clerk Webhook] 유저 수정 완료: ${id}`);
    } else if (type === "user.deleted" || type === "clerk/user.deleted") {
      await User.findOneAndDelete({ clerkId: id });
      console.log(`[Clerk Webhook] 유저 삭제 완료: ${id}`);
    }

    return res
      .status(200)
      .json({ success: true, message: "Webhook 처리 완료" });
  } catch (error) {
    console.error("[handleClerkWebhook Error]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. 현재 로그인 유저 프로필 조회 API (/api/user/me)
 */
export const getProfile = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "인증되지 않은 사용자입니다." });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          message: "MongoDB에서 사용자를 찾을 수 없습니다.",
        });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
