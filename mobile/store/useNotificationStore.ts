import { create } from 'zustand';
import { AppNotification, Order } from '../types';

interface NotificationState {
  readNotiIds: string[];
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (notifications: AppNotification[]) => void;
  getNotificationsFromOrders: (orders: Order[]) => AppNotification[];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  readNotiIds: [],
  isModalOpen: false,

  setModalOpen: (open) => set({ isModalOpen: open }),

  markAsRead: (id) =>
    set((state) => ({
      readNotiIds: state.readNotiIds.includes(id)
        ? state.readNotiIds
        : [...state.readNotiIds, id],
    })),

  markAllAsRead: (notifications) =>
    set({
      readNotiIds: notifications.map((n) => n.id),
    }),

  getNotificationsFromOrders: (orders) => {
    if (!orders || orders.length === 0) return [];
    const notis: AppNotification[] = [];
    const { readNotiIds } = get();

    orders.forEach((ord) => {
      const prodName =
        ord.orderItems?.[0]?.name ||
        (typeof ord.orderItems?.[0]?.product === 'object' ? ord.orderItems[0].product?.name : '') ||
        '주문 상품';
      const extraCount = (ord.orderItems?.length || 1) - 1;
      const prodSummary = extraCount > 0 ? `${prodName} 외 ${extraCount}건` : prodName;
      const dateStr = ord.createdAt
        ? new Date(ord.createdAt).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '최근';

      // 1. 배송 완료 상태 알림
      if (ord.isDelivered || ord.status === 'delivered') {
        const notiId = `noti-delivered-${ord._id}`;
        notis.push({
          id: notiId,
          orderId: ord._id,
          title: '배송 완료 📦',
          message: `주문하신 [${prodSummary}] 상품이 성공적으로 배송 완료되었습니다. 마음에 드셨다면 리뷰를 남겨보세요!`,
          type: 'delivery',
          statusBadge: '배송완료',
          read: readNotiIds.includes(notiId),
          createdAt: dateStr,
          orderProductNames: prodSummary,
        });
      }

      // 2. 결제 완료 / 배송 중 상태 알림
      if (ord.isPaid) {
        const notiId = `noti-paid-${ord._id}`;
        notis.push({
          id: notiId,
          orderId: ord._id,
          title: ord.status === 'shipped' ? '배송 시작 🚚' : '결제 완료 💳',
          message:
            ord.status === 'shipped'
              ? `[${prodSummary}] 상품이 출발하여 배송 중입니다.`
              : `[${prodSummary}] 결제가 확인되어 상품 배송을 준비 중입니다.`,
          type: ord.status === 'shipped' ? 'delivery' : 'payment',
          statusBadge: ord.status === 'shipped' ? '배송중' : '결제완료',
          read: readNotiIds.includes(notiId),
          createdAt: dateStr,
          orderProductNames: prodSummary,
        });
      }
    });

    return notis;
  },
}));
