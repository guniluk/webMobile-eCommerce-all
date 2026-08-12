import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, Review } from '../../types';
import { getProductImageSource } from '../../lib/productUtils';

interface ProductDetailModalProps {
  product: Product | null;
  isWished: boolean;
  isInCart?: boolean;
  reviews?: Review[];
  failedImages: Record<string, boolean>;
  onClose: () => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenReviews: (product: Product) => void;
  onImageError: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isWished,
  isInCart = false,
  reviews = [],
  failedImages,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onOpenReviews,
  onImageError,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // 모달이 열리거나 상품이 변경될 때 수량을 1로 초기화
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setActiveImageIndex(0);
    }
  }, [product]);

  // ⭐ DB 저장 실제 데이터(averageRating, totalReviews) 기준 단일화 (ProductCard와 100% 데이터 일치화)
  const avgRating = useMemo(() => {
    if (!product) return 0;
    const dbAvg = product.averageRating ?? product.rating;
    if (typeof dbAvg === 'number' && dbAvg > 0) return dbAvg;
    if (Array.isArray(reviews) && reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      return Math.round((sum / reviews.length) * 10) / 10;
    }
    return 0;
  }, [product, reviews]);

  const totalReviews = useMemo(() => {
    if (!product) return 0;
    const dbTotal = product.totalReviews ?? product.numReviews;
    if (typeof dbTotal === 'number' && dbTotal > 0) return dbTotal;
    if (Array.isArray(reviews)) return reviews.length;
    return 0;
  }, [product, reviews]);

  // 🖼️ 슬라이드 이미지 목록 구성
  const imageList = useMemo(() => {
    if (!product) return ['fallback'];
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

  if (!product) return null;
  
  // 📦 재고 수량 계산 및 수량 한도 보정
  const rawStock = product.stock ?? product.stockQuantity;
  const stock = typeof rawStock === 'number' && rawStock >= 0 ? rawStock : (product.inStock !== false ? 99 : 0);
  const isOutOfStock = stock <= 0 || product.inStock === false;

  // 💰 가격 및 총 금액 계산
  const unitPrice = product.price || 0;
  const totalPrice = unitPrice * quantity;

  // 수량 감소 핸들러
  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // 수량 증가 핸들러 (재고 수량 초과 방지 🔒)
  const handleIncreaseQuantity = () => {
    if (isOutOfStock || isInCart) return;

    if (stock > 0 && quantity >= stock) {
      Alert.alert(
        '재고 제한 안내 📦',
        `이 상품은 최대 ${stock}개까지만 구매 가능합니다.`,
      );
      return;
    }

    setQuantity((prev) => (stock > 0 ? Math.min(stock, prev + 1) : prev + 1));
  };

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
        <View className="dark:bg-slate-800 bg-white rounded-t-3xl p-6 max-h-[88%] border-t dark:border-slate-700 border-slate-200">
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

            {/* 상품 타이틀 */}
            <Text className="text-xl font-bold dark:text-white text-slate-900 mb-1">
              {product.name}
            </Text>

            {/* ⭐ 평가 점수 & 리뷰 수 (평가점수가 있거나 리뷰가 있는 경우 표시) */}
            <View className="flex-row items-center mb-3">
              {avgRating > 0 ? (
                <View className="flex-row items-center bg-amber-500/10 dark:bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-500/30 mr-2">
                  <Ionicons name="star" size={15} color="#f59e0b" />
                  <Text className="text-sm font-extrabold text-amber-600 dark:text-amber-400 ml-1">
                    {avgRating.toFixed(1)} / 5.0
                  </Text>
                  {totalReviews > 0 && (
                    <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                      ({totalReviews}개 리뷰)
                    </Text>
                  )}
                </View>
              ) : (
                <View className="flex-row items-center bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg mr-2">
                  <Ionicons name="star-outline" size={14} color="#94a3b8" />
                  <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                    평가 없음
                  </Text>
                </View>
              )}

              {/* 📦 Stock 개수 표시 */}
              {isOutOfStock ? (
                <View className="bg-rose-500/10 dark:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30">
                  <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    🚫 품절 (Out of Stock)
                  </Text>
                </View>
              ) : (
                <View className="bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    📦 재고 {stock}개 남음
                  </Text>
                </View>
              )}
            </View>

            {/* 상품 개별 단가 */}
            <View className="flex-row items-baseline mb-4">
              <Text className="text-2xl font-extrabold dark:text-cyan-400 text-sky-700">
                ₩{unitPrice.toLocaleString()}
              </Text>
              <Text className="text-xs text-slate-400 ml-1.5 font-medium">
                / 개
              </Text>
            </View>

            {/* 💬 상세 모달 전용 리뷰 보기 통합 버튼 */}
            <TouchableOpacity
              onPress={() => onOpenReviews(product)}
              activeOpacity={0.8}
              className="w-full bg-amber-500/10 dark:bg-amber-500/20 py-2 rounded-xl flex-row justify-center items-center border border-amber-500/30 mb-5"
            >
              <Ionicons name="chatbubbles-outline" size={16} color="#f59e0b" />
              <Text className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
                상품 사용자 리뷰 목록 확인하기 ({totalReviews}건) 💬
              </Text>
            </TouchableOpacity>

            {/* 🔢 원하는 Quantity (수량 (+, -) 조정) & Total Price (총 금액) 영역 */}
            <View className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-5">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    수량 선택
                  </Text>
                  {stock > 0 && quantity >= stock && !isInCart && !isOutOfStock && (
                    <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      (최대 수량 도달)
                    </Text>
                  )}
                </View>

                {/* +, - 수량 조절 버튼 */}
                <View className="flex-row items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                  <TouchableOpacity
                    onPress={handleDecreaseQuantity}
                    disabled={quantity <= 1 || isOutOfStock || isInCart}
                    activeOpacity={0.7}
                    className={`w-9 h-9 justify-center items-center ${
                      quantity <= 1 || isOutOfStock || isInCart ? 'opacity-30' : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    <Ionicons name="remove" size={18} color="#0284c7" />
                  </TouchableOpacity>

                  <View className="w-12 justify-center items-center">
                    <Text className="text-base font-extrabold text-slate-800 dark:text-white">
                      {quantity}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleIncreaseQuantity}
                    disabled={isOutOfStock || isInCart || (stock > 0 && quantity >= stock)}
                    activeOpacity={0.7}
                    className={`w-9 h-9 justify-center items-center ${
                      isOutOfStock || isInCart || (stock > 0 && quantity >= stock)
                        ? 'opacity-30'
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    <Ionicons name="add" size={18} color="#0284c7" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 💳 총 금액 (Total Price) 표시 */}
              <View className="pt-3 border-t border-slate-200 dark:border-slate-600/60 flex-row justify-between items-center">
                <Text className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  총 금액 (Total Price)
                </Text>
                <Text className="text-xl font-black text-sky-600 dark:text-cyan-400">
                  ₩{totalPrice.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* 상세 설명 */}
            <Text className="text-sm font-bold dark:text-slate-300 text-slate-700 mb-1">
              상세 설명
            </Text>
            <Text className="text-xs dark:text-slate-400 text-slate-600 leading-5 mb-6">
              {product.description || '등록된 상세 설명이 없습니다.'}
            </Text>

            {/* 하단 액션 버튼 (위시리스트 & 장바구니 담기) */}
            <View className="flex-row justify-between gap-3 mb-4">
              {/* ❤️ 위시리스트 버튼 */}
              <TouchableOpacity
                onPress={() => !isWished && onToggleWishlist(product._id)}
                disabled={isWished}
                activeOpacity={0.8}
                className={`flex-1 py-3 rounded-2xl flex-row justify-center items-center ${
                  isWished
                    ? 'bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 opacity-70'
                    : 'border border-rose-500'
                }`}
              >
                <Ionicons
                  name={isWished ? 'heart' : 'heart-outline'}
                  size={20}
                  color="#ef4444"
                />
                <Text
                  className={`font-bold ml-2 text-xs ${
                    isWished
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-rose-500 text-sm'
                  }`}
                >
                  {isWished ? '이미 위시리스트에 담김' : '위시리스트'}
                </Text>
              </TouchableOpacity>

              {/* 🛒 장바구니 담기 버튼 */}
              <TouchableOpacity
                onPress={() => {
                  if (isOutOfStock || isInCart) return;
                  onAddToCart(product, quantity);
                  onClose();
                }}
                disabled={isOutOfStock || isInCart}
                activeOpacity={0.8}
                className={`flex-1 py-3 rounded-2xl flex-row justify-center items-center shadow-md ${
                  isOutOfStock
                    ? 'bg-slate-400 dark:bg-slate-600 opacity-60'
                    : isInCart
                    ? 'bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/40 opacity-80'
                    : 'bg-sky-600 dark:bg-cyan-500'
                }`}
              >
                <Ionicons
                  name={
                    isInCart
                      ? 'checkmark-circle'
                      : 'cart-outline'
                  }
                  size={20}
                  color={isInCart ? '#10b981' : 'white'}
                />
                <Text
                  className={`font-bold ml-2 ${
                    isInCart
                      ? 'text-emerald-600 dark:text-emerald-400 text-xs'
                      : 'text-white text-sm'
                  }`}
                >
                  {isOutOfStock
                    ? '품절된 상품'
                    : isInCart
                    ? '이미 장바구니에 담김'
                    : '장바구니 담기'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

