import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types';
import { getProductImageSource } from '../../lib/productUtils';

interface ProductCardProps {
  product: Product;
  isWished: boolean;
  failedImages: Record<string, boolean>;
  onSelectProduct: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onOpenReviews: (product: Product) => void;
  onImageError: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(function ProductCard({
  product,
  isWished,
  failedImages,
  onSelectProduct,
  onToggleWishlist,
  onOpenReviews,
  onImageError,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onSelectProduct(product)}
      className="w-[48%] dark:bg-slate-800 bg-white rounded-2xl mb-4 overflow-hidden border dark:border-slate-700 border-slate-200 shadow-sm"
    >
      {/* 🖼️ 상품 이미지 & 위시리스트 버튼 */}
      <View className="h-40 bg-slate-100 dark:bg-slate-700 relative justify-center items-center">
        <Image
          source={getProductImageSource(product, failedImages)}
          onError={() => onImageError(product._id)}
          className="w-full h-full"
          resizeMode="cover"
        />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={(e) => {
            e.stopPropagation();
            onToggleWishlist(product._id);
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full dark:bg-slate-900/80 bg-white/80 items-center justify-center border dark:border-slate-700 border-slate-200 shadow-sm"
        >
          <Ionicons
            name={isWished ? 'heart' : 'heart-outline'}
            size={18}
            color={isWished ? '#ef4444' : '#64748b'}
          />
        </TouchableOpacity>

        {product.category && (
          <View className="absolute bottom-2 left-2 dark:bg-slate-900/80 bg-slate-900/60 px-2 py-0.5 rounded-md">
            <Text className="text-[10px] font-bold text-white uppercase">
              {product.category}
            </Text>
          </View>
        )}
      </View>

      {/* 📄 상품 정보 */}
      <View className="p-3">
        <Text
          numberOfLines={1}
          className="text-sm font-bold dark:text-white text-slate-900 mb-1"
        >
          {product.name}
        </Text>

        <Text className="text-xs dark:text-slate-400 text-slate-500 mb-2" numberOfLines={2}>
          {product.description || '상세 설명이 없습니다.'}
        </Text>

        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-sm font-extrabold dark:text-cyan-400 text-sky-700">
            ₩{(product.price || 0).toLocaleString()}
          </Text>
        </View>

        {/* 💬 리뷰 보기 버튼 */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation();
            onOpenReviews(product);
          }}
          className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <Ionicons name="chatbubble-ellipses-outline" size={13} color="#0284c7" />
            <Text className="text-[11px] font-semibold text-sky-600 dark:text-cyan-400 ml-1">
              리뷰 보기
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300 ml-0.5">
              {product.rating ? product.rating.toFixed(1) : '4.5'}
            </Text>
            <Text className="text-[10px] text-slate-400 dark:text-slate-500 ml-0.5">
              ({product.numReviews || 0})
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});
