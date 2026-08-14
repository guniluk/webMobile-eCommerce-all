import { useState } from 'react';
import {
  Bell,
  BellOff,
  X,
  CheckCheck,
  CreditCard,
  Truck,
  Package,
  Info,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import { formatCurrency } from '../lib/util';

const NotificationModal = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleCopyOrderNumber = (e, orderNumber) => {
    e.stopPropagation();
    if (!orderNumber) return;
    navigator.clipboard?.writeText(orderNumber);
    setCopiedId(orderNumber);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      case 'delivery_start':
        return <Truck className="w-5 h-5 text-sky-500" />;
      case 'delivery_complete':
        return <Package className="w-5 h-5 text-primary" />;
      default:
        return <Info className="w-5 h-5 text-amber-500" />;
    }
  };

  const getBadgeClass = (statusBadge) => {
    switch (statusBadge) {
      case '배송완료':
        return 'badge-success text-success-content';
      case '배송중':
        return 'badge-info text-info-content';
      case '결제완료':
      case '주문접수':
        return 'badge-primary text-primary-content';
      case '주문취소':
        return 'badge-error text-error-content';
      default:
        return 'badge-neutral text-neutral-content';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Modal Content Card */}
      <div className="relative w-full max-w-lg bg-base-100 border border-base-300 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden z-10 animate-scaleUp flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-base-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-base-content flex items-center gap-2">
                주문 변동 알림
                {unreadCount > 0 && (
                  <span className="badge badge-error badge-sm text-[10px] font-black text-white px-2 py-0.5">
                    N {unreadCount}
                  </span>
                )}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">
                주문번호 및 고객 배송 정보가 포함된 실시간 알림
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Header (Mark all as read) */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="flex justify-end pt-3 pb-1 shrink-0">
            <button
              onClick={onMarkAllAsRead}
              className="btn btn-ghost btn-xs text-primary font-bold hover:bg-primary/10 gap-1.5 rounded-lg"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              모두 읽음 처리
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="py-2 overflow-y-auto custom-scrollbar flex-1 space-y-3 pr-1">
          {notifications.length === 0 ? (
            /* 🔔 알림이 없는 상태 */
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-3 text-base-content/40 border border-base-300">
                <BellOff className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-base-content">
                새로운 알림이 없습니다 🔔
              </h4>
              <p className="text-xs text-base-content/60 mt-1.5 max-w-xs leading-relaxed">
                주문하신 상품의 결제 및 배송 상태가 변경되면 주문번호와 고객
                정보와 함께 실시간 알림이 표시됩니다.
              </p>
            </div>
          ) : (
            /* 알림 리스트 */
            notifications.map((noti) => {
              const orderNum =
                noti.orderNumber ||
                (noti.orderId
                  ? `#ORD-${String(noti.orderId).slice(-8).toUpperCase()}`
                  : '');
              const isCopied = copiedId === orderNum;

              return (
                <div
                  key={noti.id}
                  onClick={() => onMarkAsRead(noti.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    noti.read
                      ? 'bg-base-200/40 border-base-200 text-base-content/75 opacity-90'
                      : 'bg-base-100 border-primary/40 shadow-md ring-1 ring-primary/20 text-base-content hover:border-primary'
                  }`}
                >
                  {/* Unread Accent Indicator */}
                  {!noti.read && (
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary"></div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-base-200 border border-base-300 shrink-0">
                      {getIcon(noti.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title & Date */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className={`text-sm font-extrabold truncate ${
                              noti.read
                                ? 'text-base-content/85'
                                : 'text-base-content'
                            }`}
                          >
                            {noti.title}
                          </span>
                          {!noti.read && (
                            <span className="w-2 h-2 rounded-full bg-error shrink-0 animate-pulse"></span>
                          )}
                        </div>
                        <span className="text-[11px] text-base-content/50 shrink-0 font-medium">
                          {noti.createdAt}
                        </span>
                      </div>

                      {/* Main Message */}
                      <p className="text-xs text-base-content/85 leading-relaxed mb-3">
                        {noti.message}
                      </p>

                      {/* 📋 주문번호 및 고객 정보 카드 (High-Utility Order & Customer Info Box) */}
                      <div className="bg-base-200/80 rounded-xl p-3 border border-base-300/80 space-y-2 mb-3 text-xs">
                        {/* 1. 주문번호 및 결제 금액 */}
                        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-base-300/60">
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-[11px] font-semibold text-base-content/60">
                              주문번호:
                            </span>
                            <span className="font-mono font-bold text-xs text-base-content bg-base-100 px-2 py-0.5 rounded-md border border-base-300">
                              {orderNum || '주문번호 없음'}
                            </span>
                            {orderNum && (
                              <button
                                onClick={(e) =>
                                  handleCopyOrderNumber(e, orderNum)
                                }
                                className="btn btn-ghost btn-xs p-1 h-6 min-h-0 text-base-content/60 hover:text-primary rounded-md"
                                title="주문번호 복사"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-success" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>

                          {noti.totalPrice !== undefined &&
                            noti.totalPrice > 0 && (
                              <div className="text-[11px] font-extrabold text-primary">
                                {formatCurrency(noti.totalPrice)}
                              </div>
                            )}
                        </div>

                        {/* 2. 고객 정보 (Customer Information) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          {/* 고객 이름 */}
                          <div className="flex items-center gap-1.5 text-base-content/80 truncate">
                            <User className="w-3.5 h-3.5 text-base-content/50 shrink-0" />
                            <span className="font-semibold text-base-content/60">
                              고객:
                            </span>
                            <span className="font-bold text-base-content truncate">
                              {noti.customerName || '고객 정보 없음'}
                            </span>
                          </div>

                          {/* 연락처 또는 이메일 */}
                          {(noti.customerPhone || noti.customerEmail) && (
                            <div className="flex items-center gap-1.5 text-base-content/70 truncate">
                              {noti.customerPhone ? (
                                <>
                                  <Phone className="w-3.5 h-3.5 text-base-content/50 shrink-0" />
                                  <span className="truncate">
                                    {noti.customerPhone}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Mail className="w-3.5 h-3.5 text-base-content/50 shrink-0" />
                                  <span className="truncate">
                                    {noti.customerEmail}
                                  </span>
                                </>
                              )}
                            </div>
                          )}

                          {/* 배송지 주소 */}
                          {noti.customerAddress && (
                            <div className="flex items-center gap-1.5 text-base-content/70 truncate sm:col-span-2">
                              <MapPin className="w-3.5 h-3.5 text-base-content/50 shrink-0" />
                              <span className="font-semibold text-base-content/60">
                                배송지:
                              </span>
                              <span className="truncate">
                                {noti.customerAddress}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer: Order Product Name Summary & Status Badge */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] font-medium text-base-content/60 truncate flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                          <span className="truncate">
                            {noti.orderProductNames || '주문 상품'}
                          </span>
                        </span>

                        <span
                          className={`badge badge-sm font-bold text-[10px] px-2.5 py-0.5 shrink-0 uppercase ${getBadgeClass(
                            noti.statusBadge,
                          )}`}
                        >
                          {noti.statusBadge}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-base-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="btn btn-primary btn-sm rounded-xl font-bold px-6 w-full"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
