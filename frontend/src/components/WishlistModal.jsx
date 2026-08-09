import { memo } from "react";
import { X, Heart, Package, Tag } from "lucide-react";

const WishlistModal = memo(({ isOpen, onClose, customer }) => {
  if (!isOpen || !customer) return null;

  const wishList = customer.wishList || [];

  return (
    <div className="modal modal-open z-50 transition-opacity duration-200">
      <div className="modal-box max-w-2xl bg-base-100 border border-base-300 shadow-2xl p-0 overflow-hidden rounded-3xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 bg-base-200/60 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Heart className="w-5 h-5 fill-primary/30" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-base-content flex items-center gap-2">
                <span>{customer.name || "고객"} 님의 위시리스트</span>
                <span className="badge badge-primary badge-sm font-bold">
                  {wishList.length}개
                </span>
              </h3>
              <p className="text-xs text-base-content/60 font-medium">
                {customer.email || "이메일 미등록"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {wishList.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center bg-base-200/40 rounded-2xl border border-dashed border-base-300">
              <Heart className="w-12 h-12 text-base-content/30 mb-3" />
              <p className="text-sm font-bold text-base-content/70">
                위시리스트에 담긴 상품이 없습니다.
              </p>
              <p className="text-xs text-base-content/40 mt-1">
                고객님이 관심 상품을 등록하면 이곳에 목록이 표시됩니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {wishList.map((item, index) => {
                const isObject = typeof item === "object" && item !== null;
                const productName = isObject ? item.name : "상품 정보";
                const productCategory = isObject ? item.category : "-";
                const productPrice = isObject ? item.price : 0;
                const productImage = isObject
                  ? item.image || item.images?.[0]
                  : null;

                return (
                  <div
                    key={isObject ? item._id : index}
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-base-200/50 border border-base-300 hover:border-primary/40 transition-all shadow-sm"
                  >
                    {/* 상품 이미지 */}
                    <div className="w-14 h-14 rounded-xl border border-base-300 overflow-hidden bg-base-100 shrink-0 flex items-center justify-center">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={productName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <Package className="w-6 h-6 text-base-content/30" />
                      )}
                    </div>

                    {/* 상품 정보 */}
                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-bold text-sm text-base-content truncate"
                        title={productName}
                      >
                        {productName}
                      </h4>
                      {productCategory && (
                        <div className="flex items-center gap-1 text-[11px] text-base-content/60 mt-0.5">
                          <Tag className="w-3 h-3 text-primary/70" />
                          <span className="truncate">{productCategory}</span>
                        </div>
                      )}
                      <p className="text-xs font-black text-primary mt-1">
                        ₩{productPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-base-200/60 border-t border-base-300 flex justify-end">
          <button onClick={onClose} className="btn btn-sm btn-ghost font-bold">
            닫기
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
});

WishlistModal.displayName = "WishlistModal";
export default WishlistModal;
