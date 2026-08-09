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
      {wishlist.map((item, idx) => {
        if (!item) return null;
        const prod = typeof item === 'object' && item !== null ? item : ({} as Product);
        if (!prod._id) return null;
        const price = prod.price || 0;
        const isAddingThis = addingProductId === prod._id;
        const isInCart = cartItemIds.includes(prod._id);

        return (
          <View
            key={prod._id}
            className="dark:bg-slate-800 bg-white rounded-2xl p-4 mb-3.5 border dark:border-slate-700 border-slate-200 shadow-sm"
          >
            {/* 1️⃣ 상단 레이아웃: 이미지, 상품명/가격, 삭제 버튼 */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 mr-3">
                  <Image
                    source={getProductImageSource(prod, failedImages)}
                    onError={() => onImageError(prod._id)}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>

                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-sm font-bold dark:text-white text-slate-900"
                  >
                    {prod.name || '상품'}
                  </Text>
                  <Text className="text-xs font-bold dark:text-cyan-400 text-sky-700 mt-0.5">
                    ₩{price.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* 삭제 버튼 */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onDeleteWishlist(prod._id)}
                className="p-2 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20"
              >
                <Ionicons name="trash-outline" size={17} color="#f43f5e" />
              </TouchableOpacity>
            </View>

            {/* 2️⃣ 하단 레이아웃: Add to Cart 버튼 (이미 Cart에 담긴 항목은 Disabled) */}
            {onAddToCart && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onAddToCart(prod)}
                disabled={isAddingThis || isInCart}
                className={`w-full py-2.5 rounded-xl flex-row items-center justify-center shadow-sm ${
                  isInCart
                    ? 'bg-slate-200 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600'
                    : 'bg-sky-600 dark:bg-cyan-500 active:bg-sky-700'
                }`}
              >
                {isAddingThis ? (
                  <ActivityIndicator size="small" color="white" />
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
