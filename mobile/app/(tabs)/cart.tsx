import React, { useState, useMemo, useCallback } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Address } from '../../types';
import { CartItemRow } from '../../components/cart/CartItemRow';
import { OrderSummaryCard } from '../../components/cart/OrderSummaryCard';
import { SelectAddressModal } from '../../components/cart/SelectAddressModal';

import {
  useCartQuery,
  useUpdateCartMutation,
  useDeleteCartMutation,
  useClearCartMutation,
} from '../../hooks/useCartQuery';
import { useAddressesQuery } from '../../hooks/useAddressesQuery';
import { useCreateOrderMutation } from '../../hooks/useOrdersQuery';

export default function CartScreen() {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // ----------------- TanStack Queries & Mutations -----------------
  const {
    data: cartResponse,
    isLoading: isCartLoading,
    isRefetching: isCartRefetching,
    refetch: refetchCart,
  } = useCartQuery();

  const { data: addresses = [], refetch: refetchAddresses } = useAddressesQuery();

  const cartItems = useMemo(() => cartResponse?.items || [], [cartResponse]);
  
  const currentAddress = useMemo(() => {
    const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0] || null;
    return selectedAddress || defaultAddr;
  }, [addresses, selectedAddress]);

  const updateCartMutation = useUpdateCartMutation();
  const deleteCartMutation = useDeleteCartMutation();
  const clearCartMutation = useClearCartMutation();
  const createOrderMutation = useCreateOrderMutation();

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchCart(), refetchAddresses()]);
  }, [refetchCart, refetchAddresses]);

  const handleImageError = useCallback((productId: string) => {
    setFailedImages((prev) => ({ ...prev, [productId]: true }));
  }, []);

  const handleDeleteItem = useCallback((productId: string) => {
    deleteCartMutation.mutate(productId, {
      onError: (err: any) => {
        Alert.alert('오류', err?.message || '삭제 실패');
      },
    });
  }, [deleteCartMutation]);

  const handleUpdateQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleDeleteItem(productId);
      return;
    }
    updateCartMutation.mutate(
      { productId, quantity: newQuantity },
      {
        onError: (err: any) => {
          Alert.alert('오류', err?.message || '수량 변경 실패');
        },
      },
    );
  }, [updateCartMutation, handleDeleteItem]);

  const handleClearCart = useCallback(() => {
    Alert.alert('장바구니 비우기', '장바구니의 모든 상품을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          clearCartMutation.mutate(undefined, {
            onError: (err: any) => {
              Alert.alert('오류', err?.message || '비우기 실패');
            },
          });
        },
      },
    ]);
  }, [clearCartMutation]);

  const calculateTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const prod = item.product || item.productId;
      const price = typeof prod === 'object' ? prod.price : 0;
      return acc + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) return;

    const validCartItems = cartItems.filter((item) => {
      const prod = item.product || item.productId;
      return item && prod;
    });

    if (validCartItems.length === 0) {
      Alert.alert('알림', '유효한 장바구니 상품이 없습니다.');
      return;
    }

    const orderItems = validCartItems.map((item) => {
      const prod = item.product || item.productId;
      const prodId = (typeof prod === 'object' && prod ? prod._id : (prod as string)) || '';
      const name = typeof prod === 'object' && prod ? prod.name : '상품';
      const price = typeof prod === 'object' && prod ? prod.price : 0;
      const image =
        (typeof prod === 'object' && prod ? (prod.image || prod.images?.[0]) : '') ||
        'https://via.placeholder.com/150';

      return {
        productId: prodId,
        name,
        quantity: item.quantity,
        price,
        image,
      };
    });

    const shippingAddress = currentAddress
      ? {
          fullName: currentAddress.fullName,
          streetAddress: currentAddress.streetAddress,
          city: currentAddress.city,
          state: currentAddress.state || '서울특별시',
          zipCode: currentAddress.zipCode,
          phoneNumber: currentAddress.phoneNumber,
        }
      : {
          fullName: '홍길동',
          streetAddress: '서울특별시 강남구 테헤란로 123',
          city: '서울',
          state: '서울특별시',
          zipCode: '06234',
          phoneNumber: '010-1234-5678',
        };

    const paymentResult = {
      id: 'PAY_' + Date.now(),
      status: 'COMPLETED',
      update_time: new Date().toISOString(),
      email_address: 'user@example.com',
    };

    createOrderMutation.mutate(
      {
        orderItems,
        totalPrice: calculateTotal,
        paymentMethod: 'Credit Card',
        shippingAddress,
        paymentResult,
      },
      {
        onSuccess: () => {
          clearCartMutation.mutate();
          Alert.alert(
            '주문 완료! 🎉',
            '주문이 성공적으로 접수되었습니다.\nProfile 탭에서 내 주문 내역을 확인하실 수 있습니다.',
          );
        },
        onError: (err: any) => {
          Alert.alert('주문 실패', err?.message || '주문 처리 중 오류가 발생했습니다.');
        },
      },
    );
  }, [cartItems, currentAddress, calculateTotal, createOrderMutation, clearCartMutation]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 dark:bg-slate-900 bg-slate-100">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isCartRefetching}
            onRefresh={onRefresh}
            tintColor="#0284c7"
          />
        }
      >
        <Header title="Cart 🛒" subtitle="Review & checkout your items" />

        {isCartLoading && cartItems.length === 0 ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#0284c7" />
            <Text className="text-xs dark:text-slate-400 text-slate-500 mt-3">
              장바구니 항목을 불러오는 중입니다...
            </Text>
          </View>
        ) : cartItems.length === 0 ? (
          <View className="py-20 items-center dark:bg-slate-800/50 bg-white/60 rounded-2xl p-6 border dark:border-slate-700 border-slate-200 mt-4">
            <Ionicons name="cart-outline" size={56} color="#94a3b8" />
            <Text className="text-lg font-bold dark:text-slate-300 text-slate-700 mt-3">
              장바구니가 비어 있습니다.
            </Text>
            <Text className="text-xs dark:text-slate-400 text-slate-500 mt-1 text-center">
              Shop 탭에서 마음에 드는 상품을 담아보세요!
            </Text>
          </View>
        ) : (
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-bold dark:text-slate-300 text-slate-700">
                총 {cartItems.length}개의 상품
              </Text>
              <TouchableOpacity onPress={handleClearCart} className="flex-row items-center">
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text className="text-xs font-bold text-rose-500 ml-1">전체 삭제</Text>
              </TouchableOpacity>
            </View>

            {cartItems.map((item, index) => (
              <CartItemRow
                key={
                  (typeof item.product === 'object' && item.product?._id) ||
                  (typeof item.productId === 'object' && item.productId?._id) ||
                  (item.productId as unknown as string) ||
                  index
                }
                item={item}
                failedImages={failedImages}
                onUpdateQuantity={handleUpdateQuantity}
                onDeleteItem={handleDeleteItem}
                onImageError={handleImageError}
              />
            ))}

            {/* 배송지 선택 카드 */}
            <View className="dark:bg-slate-800 bg-white rounded-2xl p-4 border dark:border-slate-700 border-slate-200 shadow-sm mt-2 mb-3">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-bold dark:text-cyan-400 text-sky-600">
                  배송지 선택 📍
                </Text>
                {addresses.length > 0 ? (
                  <TouchableOpacity onPress={() => setAddressModalOpen(true)}>
                    <Text className="text-xs font-semibold text-sky-600 dark:text-cyan-400">
                      변경하기
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {currentAddress ? (
                <View>
                  <Text className="text-sm font-bold dark:text-white text-slate-800">
                    [{currentAddress.label}] {currentAddress.fullName}
                  </Text>
                  <Text className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
                    {currentAddress.streetAddress}, {currentAddress.city} ({currentAddress.zipCode})
                  </Text>
                </View>
              ) : (
                <Text className="text-xs dark:text-slate-400 text-slate-500">
                  기본 배송지 (서울특별시 강남구 테헤란로 123)
                </Text>
              )}
            </View>

            {/* 결제 요약 카드 및 주문하기 버튼 */}
            <OrderSummaryCard
              totalAmount={calculateTotal}
              loading={createOrderMutation.isPending}
              onCheckout={handleCheckout}
            />
          </View>
        )}
      </ScrollView>

      {/* 배송지 선택 모달 */}
      <SelectAddressModal
        visible={addressModalOpen}
        addresses={addresses}
        selectedAddress={currentAddress}
        onClose={() => setAddressModalOpen(false)}
        onSelectAddress={(addr) => {
          setSelectedAddress(addr);
          setAddressModalOpen(false);
        }}
      />
    </SafeAreaView>
  );
}
