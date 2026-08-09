import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useColorScheme } from 'nativewind';
import { Header } from '../../components/Header';
import { api } from '../../lib/api';

import { UserProfileCard } from '../../components/profile/UserProfileCard';
import { OrderListTab } from '../../components/profile/OrderListTab';
import { WishlistTab } from '../../components/profile/WishlistTab';
import { AddressListTab } from '../../components/profile/AddressListTab';
import { AddAddressModal } from '../../components/profile/AddAddressModal';
import { CreateReviewModal } from '../../components/profile/CreateReviewModal';

import { useOrdersQuery } from '../../hooks/useOrdersQuery';
import { useWishlistQuery, useDeleteWishlistMutation } from '../../hooks/useWishlistQuery';
import {
  useAddressesQuery,
  useAddAddressMutation,
  useDeleteAddressMutation,
} from '../../hooks/useAddressesQuery';
import { useCreateReviewMutation } from '../../hooks/useCreateReviewMutation';
import { useAddToCartMutation, useCartQuery } from '../../hooks/useCartQuery';
import { Product } from '../../types';

export default function ProfileScreen() {
  const { user } = useUser();
  const { getToken, signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses'>('orders');

  // 🖼️ 이미지 로드 실패 관리 맵
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // 📍 배송지 추가 모달 상태
  const [addAddressModalOpen, setAddAddressModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('집');
  const [newFullName, setNewFullName] = useState('');
  const [newStreetAddress, setNewStreetAddress] = useState('');
  const [newCity, setNewCity] = useState('서울');
  const [newState, setNewState] = useState('서울특별시');
  const [newZipCode, setNewZipCode] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);

  // ⭐ 리뷰 작성 모달 상태
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const isSyncedRef = useRef(false);

  // ----------------- TanStack Queries & Mutations -----------------
  const {
    data: orders = [],
    isLoading: isOrdersLoading,
    isRefetching: isOrdersRefetching,
    refetch: refetchOrders,
  } = useOrdersQuery();

  const {
    data: wishlist = [],
    isRefetching: isWishlistRefetching,
    refetch: refetchWishlist,
  } = useWishlistQuery();

  const {
    data: addresses = [],
    isRefetching: isAddressesRefetching,
    refetch: refetchAddresses,
  } = useAddressesQuery();

  const { data: cartResponse } = useCartQuery();
  const cartItemIds = useMemo(() => {
    const items = cartResponse?.items || [];
    return items
      .map((item) => {
        const prod = item.product || item.productId;
        return typeof prod === 'object' && prod ? prod._id : (prod as string);
      })
      .filter(Boolean);
  }, [cartResponse]);

  const deleteWishlistMutation = useDeleteWishlistMutation();
  const addAddressMutation = useAddAddressMutation();
  const deleteAddressMutation = useDeleteAddressMutation();
  const createReviewMutation = useCreateReviewMutation();
  const addToCartMutation = useAddToCartMutation();

  const handleAddToCart = (product: Product) => {
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
          Alert.alert('오류', err?.message || '장바구니 담기에 실패했습니다.');
        },
      },
    );
  };

  // 유저 DB 동기화
  useEffect(() => {
    if (!isSyncedRef.current && user) {
      const syncUserData = async () => {
        try {
          const token = await getToken();
          const realUserData = {
            email: user?.primaryEmailAddress?.emailAddress,
            name: (user?.fullName || user?.firstName || user?.username) || undefined,
            imageUrl: user?.imageUrl,
          };
          await api.syncUser(realUserData, token).catch(() => {});
          isSyncedRef.current = true;
        } catch {
          // ignore error
        }
      };
      syncUserData();
    }
  }, [user, getToken]);

  const onRefresh = async () => {
    await Promise.all([refetchOrders(), refetchWishlist(), refetchAddresses()]);
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          isSyncedRef.current = false;
          await signOut();
        },
      },
    ]);
  };

  const resetAddressForm = () => {
    setNewLabel('집');
    setNewFullName('');
    setNewStreetAddress('');
    setNewCity('서울');
    setNewState('서울특별시');
    setNewZipCode('');
    setNewPhone('');
    setNewIsDefault(addresses.length === 0);
  };

  const openAddressModal = () => {
    resetAddressForm();
    setAddAddressModalOpen(true);
  };

  const handleAddAddress = () => {
    if (!newLabel.trim()) {
      Alert.alert('입력 오류', '배송지 별칭(예: 집, 회사)을 입력해주세요.');
      return;
    }
    if (!newFullName.trim()) {
      Alert.alert('입력 오류', '수령인 성명을 입력해주세요.');
      return;
    }
    if (!newStreetAddress.trim()) {
      Alert.alert('입력 오류', '도로명 주소를 입력해주세요.');
      return;
    }
    if (!newZipCode.trim()) {
      Alert.alert('입력 오류', '우편번호를 입력해주세요.');
      return;
    }
    if (!newPhone.trim()) {
      Alert.alert('입력 오류', '연락처를 입력해주세요.');
      return;
    }

    addAddressMutation.mutate(
      {
        label: newLabel.trim(),
        fullName: newFullName.trim(),
        streetAddress: newStreetAddress.trim(),
        city: newCity.trim() || '서울',
        state: newState.trim() || '서울특별시',
        zipCode: newZipCode.trim(),
        phoneNumber: newPhone.trim(),
        isDefault: newIsDefault || addresses.length === 0,
      },
      {
        onSuccess: () => {
          setAddAddressModalOpen(false);
          resetAddressForm();
          Alert.alert('성공 🎉', '새로운 배송지가 성공적으로 등록되었습니다.');
        },
        onError: (err: any) => {
          Alert.alert('오류', err?.message || '배송지 추가 실패');
        },
      },
    );
  };

  const handleDeleteAddress = (addressId: string) => {
    deleteAddressMutation.mutate(addressId, {
      onError: (err: any) => {
        Alert.alert('오류', err?.message || '삭제 실패');
      },
    });
  };

  const handleDeleteWishlist = (productId: string) => {
    deleteWishlistMutation.mutate(productId, {
      onSuccess: () => {
        Alert.alert('완료', '위시리스트에서 삭제되었습니다.');
      },
      onError: (err: any) => {
        Alert.alert('오류', err?.message || '위시리스트 삭제 실패');
      },
    });
  };

  const handleImageError = (productId: string) => {
    setFailedImages((prev) => ({ ...prev, [productId]: true }));
  };

  const openReviewModal = (prodId: string, orderId: string, hasReviewed?: boolean) => {
    if (hasReviewed) {
      Alert.alert('알림 💡', '이미 해당 주문 상품에 대한 리뷰를 작성하셨습니다.');
      return;
    }
    setReviewProductId(prodId);
    setReviewOrderId(orderId);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = () => {
    if (!reviewProductId || !reviewOrderId) return;
    if (!reviewComment.trim()) {
      Alert.alert('입력 요청 💡', '솔직한 리뷰 소감 메시지를 작성해 주세요.');
      return;
    }

    createReviewMutation.mutate(
      {
        productId: reviewProductId,
        orderId: reviewOrderId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      },
      {
        onSuccess: () => {
          setReviewModalOpen(false);
          setReviewComment('');
          Alert.alert('성공 🎉', '소중한 리뷰 메시지가 성공적으로 등록되었습니다.');
        },
        onError: (err: any) => {
          const msg = err?.message || '리뷰 등록 실패';
          if (msg.includes('이미') || msg.includes('exist')) {
            Alert.alert('알림 💡', '이미 작성된 리뷰입니다. 추가 입력이 불가합니다.');
          } else {
            Alert.alert('오류', msg);
          }
        },
      },
    );
  };

  const isRefreshingAny = isOrdersRefetching || isWishlistRefetching || isAddressesRefetching;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 dark:bg-slate-900 bg-slate-100">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingAny}
            onRefresh={onRefresh}
            tintColor="#0284c7"
          />
        }
      >
        <Header title="Profile 👤" subtitle="Manage your account & preferences" />

        {/* 유저 프로필 카드 */}
        <UserProfileCard user={user} onLogout={handleLogout} />

        {/* 세그먼트 탭 선택 */}
        <View className="flex-row mb-4 bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab('orders')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: activeTab === 'orders' ? (isDark ? '#334155' : '#ffffff') : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: activeTab === 'orders' ? (isDark ? '#38bdf8' : '#0284c7') : '#94a3b8',
              }}
            >
              주문내역 📦 ({orders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab('wishlist')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: activeTab === 'wishlist' ? (isDark ? '#334155' : '#ffffff') : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: activeTab === 'wishlist' ? (isDark ? '#38bdf8' : '#0284c7') : '#94a3b8',
              }}
            >
              위시리스트 ❤️ ({wishlist.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab('addresses')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: activeTab === 'addresses' ? (isDark ? '#334155' : '#ffffff') : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: activeTab === 'addresses' ? (isDark ? '#38bdf8' : '#0284c7') : '#94a3b8',
              }}
            >
              배송지 📍 ({addresses.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1️⃣ 주문 내역 탭 */}
        {activeTab === 'orders' && (
          <OrderListTab
            orders={orders}
            loading={isOrdersLoading}
            refreshing={isOrdersRefetching}
            onOpenReviewModal={openReviewModal}
          />
        )}

        {/* 2️⃣ 위시리스트 탭 */}
        {activeTab === 'wishlist' && (
          <WishlistTab
            wishlist={wishlist}
            failedImages={failedImages}
            addingProductId={
              addToCartMutation.isPending
                ? addToCartMutation.variables?.productId
                : null
            }
            cartItemIds={cartItemIds}
            onAddToCart={handleAddToCart}
            onDeleteWishlist={handleDeleteWishlist}
            onImageError={handleImageError}
          />
        )}

        {/* 3️⃣ 배송지 관리 탭 */}
        {activeTab === 'addresses' && (
          <AddressListTab
            addresses={addresses}
            onOpenAddModal={openAddressModal}
            onDeleteAddress={handleDeleteAddress}
          />
        )}

        <View className="dark:bg-slate-800/80 bg-white/90 p-5 rounded-2xl border dark:border-slate-700 border-slate-200 shadow-sm mb-4">
          <Text className="text-sm font-bold dark:text-cyan-400 text-sky-600 mb-1.5">
            서비스 정보 📱
          </Text>
          <Text className="text-xs dark:text-slate-400 text-slate-600 leading-5">
            React Native + Expo Router + TanStack Query 풀스택 쇼핑몰 앱입니다. 위시리스트, 배송지 관리, 상품 리뷰 등 백엔드 모든 API 서비스가 실시간 연동됩니다.
          </Text>
        </View>
      </ScrollView>

      {/* 📍 새 배송지 등록 모달 */}
      <AddAddressModal
        visible={addAddressModalOpen}
        isDark={isDark}
        newLabel={newLabel}
        newFullName={newFullName}
        newStreetAddress={newStreetAddress}
        newCity={newCity}
        newState={newState}
        newZipCode={newZipCode}
        newPhone={newPhone}
        newIsDefault={newIsDefault}
        onChangeLabel={setNewLabel}
        onChangeFullName={setNewFullName}
        onChangeStreetAddress={setNewStreetAddress}
        onChangeCity={setNewCity}
        onChangeState={setNewState}
        onChangeZipCode={setNewZipCode}
        onChangePhone={setNewPhone}
        onChangeIsDefault={setNewIsDefault}
        onClose={() => setAddAddressModalOpen(false)}
        onSubmit={handleAddAddress}
      />

      {/* ⭐ 리뷰 작성 모달 */}
      <CreateReviewModal
        visible={reviewModalOpen}
        isDark={isDark}
        rating={reviewRating}
        comment={reviewComment}
        onChangeRating={setReviewRating}
        onChangeComment={setReviewComment}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={handleSubmitReview}
      />
    </SafeAreaView>
  );
}
