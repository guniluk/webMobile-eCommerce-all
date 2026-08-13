import { Bell, BellOff, X, CheckCheck, CreditCard, Truck, Package, Info } from "lucide-react";

const NotificationModal = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case "payment":
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      case "delivery_start":
        return <Truck className="w-5 h-5 text-sky-500" />;
      case "delivery_complete":
        return <Package className="w-5 h-5 text-primary" />;
      default:
        return <Info className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Modal Content Card */}
      <div className="relative w-full max-w-md bg-base-100 border border-base-300 rounded-3xl shadow-2xl p-6 overflow-hidden z-10 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-base-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-base-content flex items-center gap-2">
                주문 변동 알림
                {unreadCount > 0 && (
                  <span className="badge badge-error badge-sm text-[10px] font-black text-white">
                    N {unreadCount}
                  </span>
                )}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">
                최신 상품 주문 및 배송 상태 업데이트
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

        {/* Content Body */}
        <div className="py-4 max-h-95 overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            /* 🔔 알림이 없는 상태 */
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-3 text-base-content/40 border border-base-300">
                <BellOff className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-base-content">
                새로운 알림이 없습니다 🔔
              </h4>
              <p className="text-xs text-base-content/60 mt-1.5 max-w-xs leading-relaxed">
                주문하신 상품의 결제 및 배송 상태가 변경되면 이곳에서 실시간 알림 메시지를 바로 확인하실 수 있습니다.
              </p>
            </div>
          ) : (
            /* 알림이 있는 상태 */
            <div className="space-y-3">
              {unreadCount > 0 && (
                <div className="flex justify-end pb-1">
                  <button
                    onClick={onMarkAllAsRead}
                    className="btn btn-ghost btn-xs text-primary font-bold hover:bg-primary/10 gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    모두 읽음 처리
                  </button>
                </div>
              )}

              {notifications.map((noti) => (
                <div
                  key={noti.id}
                  onClick={() => onMarkAsRead(noti.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    noti.read
                      ? "bg-base-200/50 border-base-200 text-base-content/70"
                      : "bg-primary/5 border-primary/30 text-base-content shadow-sm hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-base-100 border border-base-300 shrink-0">
                      {getIcon(noti.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className={`text-xs font-extrabold truncate ${
                              noti.read ? "text-base-content/80" : "text-base-content"
                            }`}
                          >
                            {noti.title}
                          </span>
                          {!noti.read && (
                            <span className="w-2 h-2 rounded-full bg-error shrink-0"></span>
                          )}
                        </div>
                        <span className="text-[10px] text-base-content/50 shrink-0">
                          {noti.createdAt}
                        </span>
                      </div>

                      <p className="text-xs text-base-content/80 leading-relaxed mb-2">
                        {noti.message}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-base-200/60">
                        <span className="text-[11px] font-bold text-base-content/50 truncate">
                          {noti.orderProductNames || "주문 상품"}
                        </span>
                        <span className="badge badge-primary badge-outline badge-xs text-[10px] font-bold px-2 py-1">
                          {noti.statusBadge}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-base-200 flex justify-end">
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
