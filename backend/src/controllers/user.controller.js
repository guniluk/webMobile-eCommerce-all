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
    // 보안: 로그인 인증 토큰(authUserId)이 존재하는 경우 최우선으로 사용하여 ID 변조 방지
    const targetClerkId = authUserId || clerkId;

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
    // protectRoute 미들웨어를 거쳐 이미 req.user가 조회된 경우 바로 반환
    if (req.user) {
      return res.status(200).json({ success: true, user: req.user });
    }

    const { userId } = getAuth(req);

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "인증되지 않은 사용자입니다." });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "MongoDB에서 사용자를 찾을 수 없습니다.",
      });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    const user = req.user;
    const {
      label,
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      isDefault,
    } = req.body;

    if (
      !label ||
      !fullName ||
      !streetAddress ||
      !city ||
      !state ||
      !zipCode ||
      !phoneNumber ||
      !isDefault
    ) {
      return res.status(400).json({
        success: false,
        message: "배송지 정보가 제공되지 않았습니다.",
      });
    }

    // 만약 isDefault가 true이면 다른 address의 isDefault를 false로 변경
    if (isDefault) {
      user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    const address = {
      label,
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      isDefault: isDefault || false,
    };
    user.addresses.push(address);
    await user.save();

    return res.status(201).json({
      message: "배송지가 추가되었습니다.",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("배송지 추가 실패:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({ addresses: user.addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const user = req.user;
    const { addressId } = req.params;
    const {
      label,
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      isDefault,
    } = req.body;

    const addressIndex = user.addresses.findIndex(
      (address) => address._id.toString() === addressId,
    );
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "주소를 찾을 수 없습니다.",
      });
    }

    // 만약 isDefault가 true이면 다른 address의 isDefault를 false로 변경
    if (isDefault) {
      user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    const address = {
      label: label || user.addresses[addressIndex].label,
      fullName: fullName || user.addresses[addressIndex].fullName,
      streetAddress:
        streetAddress || user.addresses[addressIndex].streetAddress,
      city: city || user.addresses[addressIndex].city,
      state: state || user.addresses[addressIndex].state,
      zipCode: zipCode || user.addresses[addressIndex].zipCode,
      phoneNumber: phoneNumber || user.addresses[addressIndex].phoneNumber,
      isDefault:
        isDefault !== undefined
          ? isDefault
          : user.addresses[addressIndex].isDefault,
    };

    user.addresses[addressIndex] = address;
    await user.save();
    return res.status(200).json({
      message: "주소가 성공적으로 수정되었습니다.",
      addresses: user.addresses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const user = req.user;
    const { addressId } = req.params;
    const address = user.addresses.find(
      (address) => address._id.toString() === addressId,
    );
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "주소를 찾을 수 없습니다.",
      });
    }
    if (address.isDefault) {
      return res.status(400).json({
        success: false,
        message: "기본 배송지는 삭제할 수 없습니다.",
      });
    }
    user.addresses.pull(addressId);
    await user.save();
    return res.status(200).json({
      message: "주소가 성공적으로 삭제되었습니다.",
      addresses: user.addresses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addWishlist = async (req, res) => {
  try {
    const user = req.user;
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "상품 ID가 제공되지 않았습니다.",
      });
    }
    if (user.wishList.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: "이미 위시리스트에 추가된 상품입니다.",
      });
    }
    user.wishList.push(productId);
    await user.save();
    return res.status(200).json({
      message: "상품이 성공적으로 위시리스트에 추가되었습니다.",
      wishList: user.wishList,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWishlists = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishList");
    if (!user) {
      return res.status(404).json({
        message: "사용자를 찾을 수 없습니다.",
      });
    }
    return res.status(200).json({ wishList: user.wishList });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteWishlist = async (req, res) => {
  try {
    const user = req.user;
    const { productId } = req.params;
    const productIndex = user.wishList.findIndex(
      (product) => product._id.toString() === productId,
    );
    if (productIndex === -1) {
      return res.status(404).json({
        message: "위시리스트에서 상품을 찾을 수 없습니다.",
      });
    }
    user.wishList.splice(productIndex, 1);
    await user.save();
    return res.status(200).json({
      message: "상품이 성공적으로 위시리스트에서 삭제되었습니다.",
      wishList: user.wishList,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
