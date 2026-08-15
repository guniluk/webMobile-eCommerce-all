import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  Menu,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '@clerk/react';
import NotificationModal from './NotificationModal';
import axiosInstance from '../lib/axios';
import { getHeaders } from '../services/apiHelper';

const tabNames = {
  dashboard: 'Dashboard Overview',
  products: 'Product Management',
  orders: 'Order Operations',
  customers: 'Customer Relationships',
};

const themes = [
  'forest',
  'dark',
  'emerald',
  'synthwave',
  'corporate',
  'coffee',
  'night',
  'dracula',
];

const Header = ({
  activeTab,
  setIsSidebarOpen,
  isSidebarCollapsed,
  toggleSidebarCollapse,
}) => {
  const { getToken } = useAuth();
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('daisyui-theme') || 'forest';
  });

  const [isNotiModalOpen, setIsNotiModalOpen] = useState(false);
  const [dbOrders, setDbOrders] = useState([]);

  // 🔔 읽은 알림 ID 상태 (LocalStorage 동기화)
  const [readNotiIds, setReadNotiIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('web_read_noti_ids') || '[]');
    } catch {
      return [];
    }
  });

  // 📦 실제 백엔드 DB 주문 내역 Fetch 함수
  const fetchDbOrders = useCallback(async () => {
    try {
      const headers = await getHeaders(getToken);
      // 관리자 API 또는 일반 유저 주문 API
      let res;
      try {
        res = await axiosInstance.get('/api/admin/orders', { headers });
      } catch {
        res = await axiosInstance.get('/api/orders', { headers });
      }

      const orderList =
        res.data?.orders || (Array.isArray(res.data) ? res.data : []);
      setDbOrders(orderList);
    } catch {
      // 오류 발생 시 빈 배열 유지
      setDbOrders([]);
    }
  }, [getToken]);

  // 🚀 DB 부하 완전 절감: 무한 폴링을 제거하고 스마트 이벤트 기반 (최초 1회 + 탭 재진입 + 주문 생성/변경 시 + 종 클릭 시) 갱신
  useEffect(() => {
    // 1. 최초 렌더링 시 1회 Fetch
    const loadInitialOrders = async () => {
      await fetchDbOrders();
    };
    loadInitialOrders();

    // 2. 사용자가 브라우저 탭으로 다시 돌아왔을 때 1회 Fetch (Visibility Change)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDbOrders();
      }
    };

    // 3. 앱 내 주문 생성/수정 이벤트 발생 시 즉시 Fetch (Custom Event)
    const handleOrderUpdate = () => {
      fetchDbOrders();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('orderUpdated', handleOrderUpdate);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('orderUpdated', handleOrderUpdate);
    };
  }, [fetchDbOrders]);

  // 🔔 실제 DB 주문 데이터를 기반으로 한 실시간 알림 생성 (샘플 하드코딩 완전 제거)
  const notifications = useMemo(() => {
    if (!Array.isArray(dbOrders) || dbOrders.length === 0) return [];
    const notis = [];

    dbOrders.forEach((ord) => {
      const prodName =
        ord.orderItems?.[0]?.name ||
        (typeof ord.orderItems?.[0]?.product === 'object'
          ? ord.orderItems[0].product?.name
          : '') ||
        '주문 상품';
      const extraCount = (ord.orderItems?.length || 1) - 1;
      const prodSummary =
        extraCount > 0 ? `${prodName} 외 ${extraCount}건` : prodName;
      const dateStr = ord.createdAt
        ? new Date(ord.createdAt).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '최근';

      const orderId = ord._id ? String(ord._id) : '';
      const orderNumber = orderId
        ? `#ORD-${orderId.slice(-8).toUpperCase()}`
        : '#ORD-UNKNOWN';
      const customerName =
        ord.shippingAddress?.fullName || ord.userId?.name || '고객';
      const customerEmail =
        ord.userId?.email || ord.paymentResult?.email_address || '';
      const customerPhone = ord.shippingAddress?.phoneNumber || '';
      const customerAddress = ord.shippingAddress
        ? [
            ord.shippingAddress.city,
            ord.shippingAddress.state,
            ord.shippingAddress.streetAddress,
          ]
            .filter(Boolean)
            .join(' ')
        : '';
      const totalPrice = ord.totalPrice || 0;

      const commonNotiData = {
        orderId: ord._id,
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        totalPrice,
        orderProductNames: prodSummary,
        createdAt: dateStr,
      };

      // 1. 배송 완료 상태 변동 알림
      if (ord.isDelivered || ord.status === 'delivered') {
        const notiId = `web-noti-delivered-${ord._id}`;
        notis.push({
          ...commonNotiData,
          id: notiId,
          title: '배송 완료 📦',
          message: `주문하신 [${prodSummary}] 상품이 성공적으로 배송 완료되었습니다.`,
          type: 'delivery_complete',
          statusBadge: '배송완료',
          read: readNotiIds.includes(notiId),
        });
      }

      // 2. 배송 시작 상태 변동 알림
      if (ord.status === 'shipped') {
        const notiId = `web-noti-shipped-${ord._id}`;
        notis.push({
          ...commonNotiData,
          id: notiId,
          title: '배송 시작 🚚',
          message: `[${prodSummary}] 상품이 출고되어 택배 수송 중입니다.`,
          type: 'delivery_start',
          statusBadge: '배송중',
          read: readNotiIds.includes(notiId),
        });
      }

      // 3. 신규 주문 생성 및 결제 완료 알림
      if (ord.isPaid || ord.status === 'pending' || ord.status === 'paid') {
        const notiId = `web-noti-paid-${ord._id}`;
        notis.push({
          ...commonNotiData,
          id: notiId,
          title: '주문 및 결제 완료 💳',
          message: `[${prodSummary}] 주문 결제가 확인되어 배송을 준비 중입니다.`,
          type: 'payment',
          statusBadge: '결제완료',
          read: readNotiIds.includes(notiId),
        });
      }
    });

    return notis;
  }, [dbOrders, readNotiIds]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const handleMarkAsRead = (id) => {
    setReadNotiIds((prev) => {
      const updated = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem('web_read_noti_ids', JSON.stringify(updated));
      return updated;
    });
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotiIds(allIds);
    localStorage.setItem('web_read_noti_ids', JSON.stringify(allIds));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setCurrentTheme(newTheme);
    localStorage.setItem('daisyui-theme', newTheme);
  };

  return (
    <>
      <header className="h-16 border-b border-base-300 bg-base-100/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 text-base-content shadow-sm">
        <div className="flex items-center gap-3">
          {/* Simple Sidebar Toggle Icon Button (Desktop) */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex btn btn-ghost btn-square btn-sm border border-base-300 text-base-content/80 hover:text-primary hover:border-primary/40 transition-all duration-200 cursor-pointer shadow-sm"
            title={
              isSidebarCollapsed
                ? '사이드바 전체 펼치기'
                : '사이드바 아이콘만 축소'
            }
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="btn btn-ghost btn-square btn-sm lg:hidden border border-base-300 text-base-content"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h2 className="text-base sm:text-xl font-extrabold text-base-content tracking-tight truncate pl-1">
            {tabNames[activeTab] || 'Admin Portal'}
          </h2>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Theme Selector */}
          <div className="flex items-center gap-1.5 bg-base-200 border border-base-300 px-2.5 py-1 rounded-xl shadow-inner">
            <Palette className="w-4 h-4 text-primary" />
            <select
              value={currentTheme}
              onChange={handleThemeChange}
              className="select select-ghost select-xs text-xs font-bold text-base-content focus:outline-none cursor-pointer capitalize"
            >
              {themes.map((th) => (
                <option
                  key={th}
                  value={th}
                  className="bg-base-100 text-base-content capitalize font-medium"
                >
                  Theme: {th}
                </option>
              ))}
            </select>
          </div>

          {/* Notification Bell Button */}
          <button
            onClick={() => {
              fetchDbOrders();
              setIsNotiModalOpen(true);
            }}
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-primary border border-base-300 relative shrink-0 transition-all cursor-pointer"
            title="주문 변동 알림 확인"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-error ring-2 ring-base-100"></span>
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 🔔 주문 변동 실시간 알림 창 모달 */}
      <NotificationModal
        isOpen={isNotiModalOpen}
        onClose={() => setIsNotiModalOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </>
  );
};

export default Header;
