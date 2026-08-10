import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types';
import { getProductImageSource } from '../../lib/productUtils';

interface WishlistTabProps {
  wishlist: Product[];
  failedImages: Record<string, boolean>;
  addingProductId?: string | null;
  cartItemIds?: string[];
  onAddToCart?: (product: Product) => void;
  onDeleteWishlist: (productId: string) => void;
  onImageError: (productId: string) => void;
}

export const WishlistTab: React.FC<WishlistTabProps> = React.memo(function WishlistTab({
  wishlist,
  failedImages,
  addingProductId,
  cartItemIds = [],
  onAddToCart,
  onDeleteWishlist,
  onImageError,
}) {
  if (wishlist.length === 0) {
    return (
      <View className="py-14 items-center dark:bg-slate-800/50 bg-white/60 rounded-2xl p-6 border dark:border-slate-700 border-slate-200 mb-4">
        <Ionicons name="heart-dislike-outline" size={48} color="#94a3b8" />
        <Text className="text-base font-bold dark:text-slate-300 text-slate-700 mt-3">
          위시리스트가 비어 있습니다.
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-4">
      {wishlist.map((item) => {
        if (!item) return null;
        const prod = typeof item === 'object' && item !== null ? item : ({} as Product);
        if (!prod._id) return null;
        const price = prod.price || 0;
        const isAddingThis = addingProductId === prod._id;
        const isInCart = cartItemIds.includes(prod._id);

        // 📦 재고 수량 계산
        const stockCount =
          typeof prod.stock === 'number'
            ? prod.stock
            : typeof prod.stockQuantity === 'number'
            ? prod.stockQuantity
            : 0;
        const isOutOfStock = stockCount <= 0 || prod.inStock === false;
        const rating = prod.averageRating || prod.rating || 5.0;

        return (
          <View
            key={prod._id}
            className="dark:bg-slate-800 bg-white rounded-2xl p-4 mb-3.5 border dark:border-slate-700 border-slate-200 shadow-sm"
          >
            {/* 1️⃣ 상단 레이아웃: 이미지, 상품 정보(재고 뱃지 포함), 삭제 버튼 */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 mr-3 border dark:border-slate-600 border-slate-200/80">
                  <Image
                    source={getProductImageSource(prod, failedImages)}
                    onError={() => onImageError(prod._id)}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>

                <View className="flex-1">
                  {/* 카테고리 및 재고 뱃지 🏷️ */}
                  <View className="flex-row items-center flex-wrap gap-1 mb-1">
                    {prod.category && (
                      <View className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {prod.category}
                        </Text>
                      </View>
                    )}

                    {/* 📦 재고 개수 표시 뱃지 */}
                    {isOutOfStock ? (
                      <View className="px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30">
                        <Text className="text-[10px] font-black text-rose-600 dark:text-rose-400">
                          품절 🚫
                        </Text>
                      </View>
                    ) : (
                      <View className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                        <Text className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          재고 {stockCount}개 남음 📦
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    numberOfLines={1}
                    className="text-sm font-extrabold dark:text-white text-slate-900"
                  >
                    {prod.name || '상품'}
                  </Text>

                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="text-xs font-black dark:text-cyan-400 text-sky-700">
                      ₩{price.toLocaleString()}
                    </Text>

                    {/* 별점 */}
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <Text className="text-[11px] font-bold text-slate-600 dark:text-slate-400 ml-0.5">
                        {rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 삭제 버튼 */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onDeleteWishlist(prod._id)}
                className="p-2 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 ml-1"
              >
                <Ionicons name="trash-outline" size={17} color="#f43f5e" />
              </TouchableOpacity>
            </View>

            {/* 2️⃣ 하단 레이아웃: Add to Cart 버튼 (재고가 1개 이상 있을 시에만 동작) */}
            {onAddToCart && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (isOutOfStock) return;
                  onAddToCart(prod);
                }}
                disabled={isAddingThis || isInCart || isOutOfStock}
                className={`w-full py-2.5 rounded-xl flex-row items-center justify-center shadow-sm ${
                  isOutOfStock
                    ? 'bg-slate-200/80 dark:bg-slate-700/40 border border-slate-300/60 dark:border-slate-700'
                    : isInCart
                    ? 'bg-slate-200 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600'
                    : 'bg-sky-600 dark:bg-cyan-500 active:bg-sky-700'
                }`}
              >
                {isAddingThis ? (
                  <ActivityIndicator size="small" color="white" />
                ) : isOutOfStock ? (
                  <>
                    <Ionicons name="ban-outline" size={15} color="#94a3b8" />
                    <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1.5">
                      품절된 상품입니다 🚫
                    </Text>
                  </>
                ) : isInCart ? (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#64748b" />
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1.5">
                      Already in Cart 🛒
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cart" size={16} color="white" />
                    <Text className="text-xs font-bold text-white ml-1.5">
                      Add to Cart 🛒
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
});
