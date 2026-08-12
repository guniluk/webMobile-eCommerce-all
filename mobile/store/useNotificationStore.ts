import { create } from 'zustand';
import { AppNotification, Order } from '../types';

interface NotificationState {
  readNotiIds: string[];
  clearedNotiIds: string[];
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (notifications: AppNotification[]) => void;
  clearAllNotifications: (notifications: AppNotification[]) => void;
  deleteNotification: (id: string) => void;
  getNotificationsFromOrders: (orders: Order[]) => AppNotification[];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  readNotiIds: [],
  clearedNotiIds: [],
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

  clearAllNotifications: (notifications) =>
    set((state) => ({
      clearedNotiIds: [
        ...state.clearedNotiIds,
        ...notifications.map((n) => n.id),
      ],
    })),

  deleteNotification: (id) =>
    set((state) => ({
      clearedNotiIds: state.clearedNotiIds.includes(id)
        ? state.clearedNotiIds
        : [...state.clearedNotiIds, id],
    })),

  getNotificationsFromOrders: (orders) => {
    if (!orders || orders.length === 0) return [];
    const notis: AppNotification[] = [];
    const { readNotiIds, clearedNotiIds } = get();

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

      // 개별 주문당 1개의 최신 상태 알림만 매핑 (1 Order = 1 Notification)
      if (ord.isDelivered || ord.status === 'delivered') {
        const notiId = `noti-${ord._id}`;
        notis.push({
          id: notiId,
          orderId: ord._id,
          title: '배송 완료 📦',
          message: `주문하신 [${prodSummary}] 상품이 성공적으로 배송 완료되었습니다. 리뷰를 남겨보세요!`,
          type: 'delivery',
          statusBadge: '배송완료',
          read: readNotiIds.includes(notiId),
          createdAt: dateStr,
          orderProductNames: prodSummary,
        });
      } else if (ord.status === 'shipped') {
        const notiId = `noti-${ord._id}`;
        notis.push({
          id: notiId,
          orderId: ord._id,
          title: '배송 시작 🚚',
          message: `[${prodSummary}] 상품이 출발하여 현재 고객님께 배송 중입니다.`,
          type: 'delivery',
          statusBadge: '배송중',
          read: readNotiIds.includes(notiId),
          createdAt: dateStr,
          orderProductNames: prodSummary,
        });
      } else if (ord.isPaid || ord.status === 'processing' || ord.status === 'paid') {
        const notiId = `noti-${ord._id}`;
        notis.push({
          id: notiId,
          orderId: ord._id,
          title: '결제 완료 💳',
          message: `[${prodSummary}] 결제가 완료되어 배송 준비가 진행 중입니다.`,
          type: 'payment',
          statusBadge: '결제완료',
          read: readNotiIds.includes(notiId),
          createdAt: dateStr,
          orderProductNames: prodSummary,
        });
      } else if (ord.status === 'cancelled') {
        const notiId = `noti-${ord._id}`;
        notis.push({
          id: notiId,
          orderId: ord._id,
          title: '주문 취소 ❌',
          message: `[${prodSummary}] 주문이 취소되었습니다.`,
          type: 'info',
          statusBadge: '주문취소',
          read: readNotiIds.includes(notiId),
          createdAt: dateStr,
          orderProductNames: prodSummary,
        });
      } else {
        const notiId = `noti-${ord._id}`;
        notis.push({
          id: notiId,
          orderId: ord._id,
          title: '주문 접수 완료 📝',
          message: `[${prodSummary}] 주문(₩${ord.totalPrice?.toLocaleString()})이 성공적으로 접수되었습니다.`,
          type: 'info',
          statusBadge: '주문접수',
          read: readNotiIds.includes(notiId),
          createdAt: dateStr,
          orderProductNames: prodSummary,
        });
      }
    });

    return notis.filter((n) => !clearedNotiIds.includes(n.id));
  },
}));
