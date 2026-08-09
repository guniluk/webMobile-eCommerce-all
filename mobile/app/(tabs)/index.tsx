import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Product } from '../../types';
import { CATEGORY_IMAGES } from '../../lib/productUtils';
import { ProductCard } from '../../components/shop/ProductCard';
import { ProductDetailModal } from '../../components/shop/ProductDetailModal';
import { ReviewsModal } from '../../components/shop/ReviewsModal';

import {
  useProductsQuery,
  useProductReviewsQuery,
} from '../../hooks/useProductsQuery';
import {
  useWishlistQuery,
  useToggleWishlistMutation,
} from '../../hooks/useWishlistQuery';
import { useAddToCartMutation } from '../../hooks/useCartQuery';

export default function ShopScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // 🖼️ 이미지 로드 실패 관리 맵
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // 🔍 상품 상세 모달 상태
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 💬 리뷰 리스트 모달 상태
  const [reviewsModalProduct, setReviewsModalProduct] =
    useState<Product | null>(null);

  // ----------------- TanStack Queries & Mutations -----------------
  const {
    data: products = [],
    isLoading: isProductsLoading,
    isRefetching: isProductsRefetching,
    refetch: refetchProducts,
  } = useProductsQuery(selectedCategory, debouncedSearchQuery);

  const { data: wishlist = [], refetch: refetchWishlist } = useWishlistQuery();

  const wishlistIds = useMemo(
    () => wishlist.map((item) => (typeof item === 'object' ? item._id : item)),
    [wishlist],
  );

  const { data: productReviews = [], isLoading: isReviewsLoading } =
    useProductReviewsQuery(reviewsModalProduct?._id);

  const addToCartMutation = useAddToCartMutation();
  const toggleWishlistMutation = useToggleWishlistMutation();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchProducts(), refetchWishlist()]);
  }, [refetchProducts, refetchWishlist]);

  const handleAddToCart = useCallback(
    (product: Product) => {
      addToCartMutation.mutate(
        { productId: product._id, quantity: 1 },
        {
          onSuccess: () => {
            Alert.alert(
              '장바구니 담기 성공 🎉',
              `${product.name} 상품이 장바구니에 담겼습니다.`,
            );
          },
          onError: (err: any) => {
            Alert.alert(
              '오류',
              err?.message || '장바구니 담기에 실패했습니다.',
            );
          },
        },
      );
    },
    [addToCartMutation],
  );

  const handleToggleWishlist = useCallback(
    (productId: string) => {
      const isWished = wishlistIds.includes(productId);
      toggleWishlistMutation.mutate(
        { productId, isWished },
        {
          onError: (err: any) => {
            Alert.alert('오류', err?.message || '위시리스트 반영 실패');
          },
        },
      );
    },
    [wishlistIds, toggleWishlistMutation],
  );

  const handleOpenReviewsModal = useCallback((product: Product) => {
    setSelectedProduct(null);
    setReviewsModalProduct(product);
  }, []);

  const handleImageError = useCallback((productId: string) => {
    setFailedImages((prev) => ({ ...prev, [productId]: true }));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        p?.category?.toLowerCase() === selectedCategory.toLowerCase();

      if (debouncedSearchQuery.length < 2) {
        return matchesCategory;
      }

      const query = debouncedSearchQuery.toLowerCase();
      const matchesName = p?.name?.toLowerCase().includes(query);
      const matchesCatName = p?.category?.toLowerCase().includes(query);

      return matchesCategory && (matchesName || matchesCatName);
    });
  }, [products, selectedCategory, debouncedSearchQuery]);

  // 📄 FlatList Header 컴포넌트
  const renderHeader = useCallback(() => {
    return (
      <View className="mb-2">
        <Header
          title="Explore Products 🛍️"
          subtitle="Find top trending items"
        />

        {/* 🔍 검색 바 */}
        <View className="mb-4 flex-row items-center bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 border dark:border-slate-700 border-slate-200 shadow-sm">
          <Ionicons name="search-outline" size={20} color="#0284c7" />
          <TextInput
            placeholder="상품명 또는 카테고리 검색..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-sm dark:text-white text-slate-800 font-medium"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* 🏷️ 카테고리 필터 */}
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['All', 'Books', 'Electronics', 'Fashion', 'Home', 'Sports'].map(
              (cat) => {
                const isSelected =
                  selectedCategory.toLowerCase() === cat.toLowerCase();
                const iconSrc = CATEGORY_IMAGES[cat.toLowerCase()];

                return (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.8}
                    onPress={() => setSelectedCategory(cat)}
                    className={`mr-3 px-4 py-2.5 rounded-2xl flex-row items-center border shadow-sm ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-500 dark:border-cyan-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {iconSrc ? (
                      <Image
                        source={iconSrc}
                        className="w-5 h-5 mr-1.5"
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons
                        name="grid-outline"
                        size={16}
                        color={isSelected ? '#0284c7' : '#64748b'}
                        style={{ marginRight: 6 }}
                      />
                    )}
                    <Text
                      className={`text-xs font-bold capitalize ${
                        isSelected
                          ? 'text-sky-600 dark:text-cyan-400 font-extrabold'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </ScrollView>
        </View>

        {/* 🛍️ 상품 리스트 헤더 */}
        <View className="flex-row justify-between items-center mb-3 px-1">
          <Text className="text-base font-bold dark:text-white text-slate-900">
            Products 🛍️
          </Text>
          <Text className="text-xs font-bold dark:text-cyan-400 text-sky-600">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>
    );
  }, [searchQuery, selectedCategory, filteredProducts.length]);

  // 📄 FlatList Item 렌더러
  const renderProductItem: ListRenderItem<Product> = useCallback(
    ({ item }) => (
      <ProductCard
        product={item}
        isWished={wishlistIds.includes(item._id)}
        isAdding={
          addToCartMutation.isPending &&
          addToCartMutation.variables?.productId === item._id
        }
        failedImages={failedImages}
        onSelectProduct={setSelectedProduct}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onOpenReviews={handleOpenReviewsModal}
        onImageError={handleImageError}
      />
    ),
    [
      wishlistIds,
      addToCartMutation.isPending,
      addToCartMutation.variables?.productId,
      failedImages,
      handleToggleWishlist,
      handleAddToCart,
      handleOpenReviewsModal,
      handleImageError,
    ],
  );

  // 📄 FlatList Empty Component
  const renderEmptyComponent = useCallback(() => {
    if (isProductsLoading && products.length === 0) {
      return (
        <View className="py-20 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
          <Text className="text-xs dark:text-slate-400 text-slate-500 mt-3">
            상품 정보를 불러오는 중입니다...
          </Text>
        </View>
      );
    }

    return (
      <View className="py-16 items-center dark:bg-slate-800/50 bg-white/60 rounded-2xl p-6 border dark:border-slate-700 border-slate-200">
        <Ionicons name="bag-remove-outline" size={48} color="#94a3b8" />
        <Text className="text-base font-bold dark:text-slate-300 text-slate-700 mt-3">
          등록된 상품이 없습니다.
        </Text>
      </View>
    );
  }, [isProductsLoading, products.length]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 dark:bg-slate-900 bg-slate-100"
    >
      {/* 🚀 고성능 Virtualized FlatList 2열 그리드 연동 */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        numColumns={2}
        renderItem={renderProductItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isProductsRefetching}
            onRefresh={onRefresh}
            tintColor="#0284c7"
          />
        }
      />

      {/* 🔍 상품 상세 모달 */}
      <ProductDetailModal
        product={selectedProduct}
        isWished={
          selectedProduct ? wishlistIds.includes(selectedProduct._id) : false
        }
        failedImages={failedImages}
        onClose={() => setSelectedProduct(null)}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onOpenReviews={handleOpenReviewsModal}
        onImageError={handleImageError}
      />

      {/* 💬 상품 리뷰 목록 모달 */}
      <ReviewsModal
        product={reviewsModalProduct}
        reviews={productReviews}
        loading={isReviewsLoading}
        onClose={() => setReviewsModalProduct(null)}
      />
    </SafeAreaView>
  );
}
