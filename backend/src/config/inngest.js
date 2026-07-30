import { Inngest } from "inngest";
import { User } from "../models/user.model.js";

// Inngest 인스턴스 초기화
export const inngest = new Inngest({ id: "ecommerce-app" });

/**
 * 1. Clerk 회원가입 이벤트 (clerk/user.created 및 user.created)
 * Clerk에서 새 사용자가 가입하면 MongoDB에 User 문서를 생성합니다.
 */
export const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [
      { event: "clerk/user.created" },
      { event: "user.created" },
    ],
  },
  async ({ event }) => {
    const data = event.data || {};
    const id = data.id;
    if (!id) return { success: false, message: "No user ID found" };

    const first_name = data.first_name || "";
    const last_name = data.last_name || "";
    const email_addresses = data.email_addresses || [];
    const image_url = data.image_url || data.profile_image_url || "";

    const email =
      email_addresses.length > 0
        ? email_addresses[0].email_address
        : data.email || "";

    const name = `${first_name} ${last_name}`.trim() || "User";

    const userData = {
      clerkId: id,
      email,
      name,
      imageUrl: image_url,
      addresses: [],
      wishList: [],
    };

    const user = await User.findOneAndUpdate({ clerkId: id }, userData, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    return {
      success: true,
      message: "MongoDB User created/synced successfully",
      userId: id,
    };
  }
);

/**
 * 2. Clerk 회원정보 수정 이벤트 (clerk/user.updated 및 user.updated)
 * Clerk에서 사용자 프로필이나 정보가 수정되면 MongoDB User 문서를 업데이트합니다.
 */
export const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [
      { event: "clerk/user.updated" },
      { event: "user.updated" },
    ],
  },
  async ({ event }) => {
    const data = event.data || {};
    const id = data.id;
    if (!id) return { success: false, message: "No user ID found" };

    const first_name = data.first_name || "";
    const last_name = data.last_name || "";
    const email_addresses = data.email_addresses || [];
    const image_url = data.image_url || data.profile_image_url || "";

    const email =
      email_addresses.length > 0
        ? email_addresses[0].email_address
        : data.email || "";

    const name = `${first_name} ${last_name}`.trim() || "User";

    const updatedData = {
      email,
      name,
      imageUrl: image_url,
    };

    await User.findOneAndUpdate({ clerkId: id }, updatedData, { new: true });
    return {
      success: true,
      message: "MongoDB User updated successfully",
      userId: id,
    };
  }
);

/**
 * 3. Clerk 회원탈퇴/삭제 이벤트 (clerk/user.deleted 및 user.deleted)
 * Clerk에서 계정이 삭제되면 MongoDB에서 해당 User 문서를 제거합니다.
 */
export const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-from-clerk",
    triggers: [
      { event: "clerk/user.deleted" },
      { event: "user.deleted" },
    ],
  },
  async ({ event }) => {
    const data = event.data || {};
    const id = data.id;

    if (id) {
      await User.findOneAndDelete({ clerkId: id });
    }
    return {
      success: true,
      message: "MongoDB User deleted successfully",
      userId: id,
    };
  }
);

