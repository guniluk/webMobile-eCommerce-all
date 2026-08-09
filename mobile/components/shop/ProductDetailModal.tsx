import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types';
import { getProductImageSource } from '../../lib/productUtils';

interface ProductDetailModalProps {
  product: Product | null;
  isWished: boolean;
  failedImages: Record<string, boolean>;
  onClose: () => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onOpenReviews: (product: Product) => void;
  onImageError: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isWished,
  failedImages,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onOpenReviews,
  onImageError,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  if (!product) return null;

  const totalReviews = product.totalReviews || product.numReviews || 0;
  const avgRating = product.averageRating || product.rating || 0;

  // 🖼️ 슬라이드 이미지 목록 구성
  const imageList = useMemo(() => {
    let list: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      list = product.images.filter(
        (img) =>
          img &&
          typeof img === 'string' &&
          img.trim() !== '' &&
          !img.includes('placeholder'),
      );
    }
    if (list.length === 0 && product.image) {
      list = [product.image];
    }
    return list.length > 0 ? list : ['fallback'];
  }, [product]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (containerWidth <= 0) return;
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / containerWidth);
    if (index !== activeImageIndex && index >= 0 && index < imageList.length) {
      setActiveImageIndex(index);
    }
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <Modal
      visible={product !== null}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="dark:bg-slate-800 bg-white rounded-t-3xl p-6 max-h-[85%] border-t dark:border-slate-700 border-slate-200">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header: Category & Close */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-bold text-sky-600 dark:text-cyan-400 capitalize">
                {product.category || 'Product'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* 🖼️ 다중 이미지 슬라이더 영역 */}
            <View
              onLayout={handleLayout}
              className="w-full h-64 rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-700 relative"
            >
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={{ width: '100%', height: '100%' }}
              >
                {imageList.map((imgUrl, idx) => {
                  const tempProduct: Product = {
                    ...product,
                    image: imgUrl === 'fallback' ? undefined : imgUrl,
                  };
                  return (
                    <View
                      key={idx}
                      style={{ width: containerWidth || 320, height: '100%' }}
                      className="justify-center items-center"
                    >
                      <Image
                        source={getProductImageSource(tempProduct, failedImages)}
                        onError={() => onImageError(product._id)}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>
                  );
                })}
              </ScrollView>

              {/* ⭐ 모달 내부 리뷰 보기 뱃지 Overlay */}
              <TouchableOpacity
                onPress={() => onOpenReviews(product)}
                activeOpacity={0.8}
                className="absolute top-3 left-3 flex-row items-center bg-black/75 px-3 py-1.5 rounded-full border border-amber-500/40 shadow-sm z-10"
              >
                {totalReviews > 0 ? (
                  <>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text className="text-xs font-bold text-amber-400 ml-1.5">
                      {avgRating.toFixed(1)}점 (리뷰 {totalReviews}건 보기 💬)
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="chatbox-outline" size={13} color="#94a3b8" />
                    <Text className="text-xs font-bold text-slate-300 ml-1.5">
                      리뷰 목록 보기 💬
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* 🔢 이미지 페이지 카운터 뱃지 (2개 이상 시 표시) */}
              {imageList.length > 1 && (
                <View className="absolute top-3 right-3 bg-black/70 px-2.5 py-1 rounded-full border border-white/20 z-10">
                  <Text className="text-[11px] font-bold text-white">
                    {activeImageIndex + 1} / {imageList.length}
                  </Text>
                </View>
              )}

              {/* 🟢 하단 Dot Pagination Indicator (2개 이상 시 표시) */}
              {imageList.length > 1 && (
                <View className="absolute bottom-3 left-0 right-0 flex-row justify-center items-center gap-1.5 z-10">
                  {imageList.map((_, idx) => (
                    <View
                      key={idx}
                      className={`h-2 rounded-full ${
                        activeImageIndex === idx
                          ? 'w-5 bg-sky-500 dark:bg-cyan-400'
                          : 'w-2 bg-white/60'
                      }`}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* 상품 타이틀 & 가격 */}
            <Text className="text-xl font-bold dark:text-white text-slate-900 mb-1">
              {product.name}
            </Text>

            <Text className="text-2xl font-extrabold dark:text-cyan-400 text-sky-700 mb-4">
              ₩{product.price?.toLocaleString()}
            </Text>

            {/* 💬 상세 모달 전용 리뷰 보기 통합 버튼 */}
            <TouchableOpacity
              onPress={() => onOpenReviews(product)}
              activeOpacity={0.8}
              className="w-full bg-amber-500/10 dark:bg-amber-500/20 py-2.5 rounded-xl flex-row justify-center items-center border border-amber-500/30 mb-5"
            >
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
                상품 사용자 리뷰 목록 확인하기 ({totalReviews}건) 💬
              </Text>
            </TouchableOpacity>

            <Text className="text-sm font-bold dark:text-slate-300 text-slate-700 mb-1">
              상세 설명
            </Text>
            <Text className="text-xs dark:text-slate-400 text-slate-600 leading-5 mb-6">
              {product.description || '등록된 상세 설명이 없습니다.'}
            </Text>

            {/* 하단 액션 버튼 */}
            <View className="flex-row justify-between gap-3 mb-4">
              <TouchableOpacity
                onPress={() => onToggleWishlist(product._id)}
                className="flex-1 border border-rose-500 py-3 rounded-2xl flex-row justify-center items-center"
              >
                <Ionicons
                  name={isWished ? 'heart' : 'heart-outline'}
                  size={20}
                  color="#ef4444"
                />
                <Text className="text-rose-500 font-bold ml-2 text-sm">
                  위시리스트
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onAddToCart(product);
                  onClose();
                }}
                className="flex-1 bg-sky-600 dark:bg-cyan-500 py-3 rounded-2xl flex-row justify-center items-center shadow-md"
              >
                <Ionicons name="cart-outline" size={20} color="white" />
                <Text className="text-white font-bold ml-2 text-sm">
                  장바구니 담기
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
