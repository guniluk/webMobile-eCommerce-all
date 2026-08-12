import { Notification } from "../models/notification.model.js";

/**
 * 주문 관련 알림을 Notification DB에 기록하는 공통 헬퍼 함수
 * @param {Object} params
 * @param {string|ObjectId} params.userId - 알림 수신 사용자 ID
 * @param {string|ObjectId} params.orderId - 관련 주문 ID
 * @param {string} params.status - 주문 상태 ('created', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')
 * @param {Array} [params.orderItems] - 주문 상품 목록
 * @param {number} [params.totalPrice] - 총 결제 금액
 */
export const createOrderNotification = async ({
  userId,
  orderId,
  status,
  orderItems = [],
  totalPrice = 0,
}) => {
  try {
    const prodName =
      orderItems?.[0]?.name ||
      (typeof orderItems?.[0]?.product === "object" ? orderItems[0].product?.name : "") ||
      "주문 상품";
    const extraCount = (orderItems?.length || 1) - 1;
    const prodSummary = extraCount > 0 ? `${prodName} 외 ${extraCount}건` : prodName;

    let title = "주문 알림 📦";
    let message = `[${prodSummary}] 주문 관련 상태가 업데이트되었습니다.`;
    let type = "info";
    let statusBadge = "주문안내";

    switch (status) {
      case "created":
        title = "주문 접수 완료 📝";
        message = `[${prodSummary}] 주문(₩${totalPrice?.toLocaleString()})이 성공적으로 접수되었습니다.`;
        type = "info";
        statusBadge = "주문접수";
        break;
      case "paid":
      case "processing":
        title = "결제 완료 💳";
        message = `[${prodSummary}] 결제가 확인되어 배송 준비가 진행 중입니다.`;
        type = "payment";
        statusBadge = "결제완료";
        break;
      case "shipped":
        title = "배송 시작 🚚";
        message = `[${prodSummary}] 상품이 출발하여 현재 고객님께 배송 중입니다.`;
        type = "delivery";
        statusBadge = "배송중";
        break;
      case "delivered":
        title = "배송 완료 📦";
        message = `[${prodSummary}] 상품이 성공적으로 배송 완료되었습니다. 리뷰를 작성해 보세요!`;
        type = "delivery";
        statusBadge = "배송완료";
        break;
      case "cancelled":
        title = "주문 취소 ❌";
        message = `[${prodSummary}] 주문이 취소되었습니다.`;
        type = "info";
        statusBadge = "주문취소";
        break;
      default:
        message = `[${prodSummary}] 주문 상태가 '${status}'(으)로 변경되었습니다.`;
        break;
    }

    const updateData = {
      userId,
      orderId,
      title,
      message,
      type,
      statusBadge,
      isRead: false, // 새로운 주문 상태 변경 시 읽지 않음(false)으로 재설정
    };

    // orderId 기준으로 기존 알림이 있으면 최신 상태로 업데이트, 없으면 새로 생성 (1 Order = 1 Notification 보장)
    const notification = await Notification.findOneAndUpdate(
      { orderId },
      { $set: updateData },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    return notification;
  } catch (error) {
    console.warn("[createOrderNotification Warning]:", error.message);
    return null;
  }
};
