import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Header } from '../../components/Header';
import { api } from '../../lib/api';

import { UserProfileCard } from '../../components/profile/UserProfileCard';
import { OrderListTab } from '../../components/profile/OrderListTab';
import { WishlistTab } from '../../components/profile/WishlistTab';
import { AddressListTab } from '../../components/profile/AddressListTab';
import { AddAddressModal } from '../../components/profile/AddAddressModal';
import { CreateReviewModal } from '../../components/profile/CreateReviewModal';

import { useQueryClient } from '@tanstack/react-query';
import { useOrdersQuery } from '../../hooks/useOrdersQuery';
import { useNotificationsQuery } from '../../hooks/useNotificationsQuery';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useWishlistQuery, useDeleteWishlistMutation } from '../../hooks/useWishlistQuery';
import {
  useAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from '../../hooks/useAddressesQuery';
import { useCreateReviewMutation } from '../../hooks/useCreateReviewMutation';
import { useAddToCartMutation, useCartQuery } from '../../hooks/useCartQuery';
import { Product, AppNotification, Address } from '../../types';

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { getToken, signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses'>('orders');
  
  const {
    readNotiIds,
    clearedNotiIds,
    markAsRead,
    markAllAsRead,
    getNotificationsFromOrders,
  } = useNotificationStore();

  const {
    notifications: dbNotifications,
    unreadCount: dbUnreadCount,
    isFetched: isNotiFetched,
    markAllAsRead: markAllDbAsRead,
    refetch: refetchNotifications,
  } = useNotificationsQuery();

  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const [addAddressModalOpen, setAddAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [newLabel, setNewLabel] = useState('집');
  const [newFullName, setNewFullName] = useState('');
  const [newStreetAddress, setNewStreetAddress] = useState('');
  const [newCity, setNewCity] = useState('서울');
  const [newState, setNewState] = useState('서울특별시');
  const [newZipCode, setNewZipCode] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const isSyncedRef = useRef(false);

  const {
    data: orders = [],
    isLoading: isOrdersLoading,
    isRefetching: isOrdersRefetching,
    refetch: refetchOrders,
  } = useOrdersQuery();

  const {
    data: wishlist = [],
    refetch: refetchWishlist,
  } = useWishlistQuery();

  const {
    data: addresses = [],
    refetch: refetchAddresses,
  } = useAddressesQuery();

  const { data: cartData } = useCartQuery();
  const cartItemIds = useMemo(() => {
    const items = cartData?.items || [];
    return items
      .map((item) =>
        typeof item.productId === 'object' ? item.productId._id : item.productId,
      )
      .filter((id): id is string => Boolean(id));
  }, [cartData]);

  const deleteWishlistMutation = useDeleteWishlistMutation();
  const addAddressMutation = useAddAddressMutation();
  const updateAddressMutation = useUpdateAddressMutation();
  const deleteAddressMutation = useDeleteAddressMutation();
  const createReviewMutation = useCreateReviewMutation();
  const addToCartMutation = useAddToCartMutation();

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
          // ignore
        }
      };
      syncUserData();
    }
  }, [user, getToken]);

  // 🔔 백엔드 DB의 isRead === true 알림들을 로컬 readNotiIds에 동기화
  useEffect(() => {
    if (dbNotifications && dbNotifications.length > 0) {
      dbNotifications.forEach((noti) => {
        if (noti.isRead) {
          if (noti.orderId) {
            const notiId = `noti-${noti.orderId}`;
            markAsRead(notiId);
          }
          if (noti._id) {
            markAsRead(noti._id);
          }
        }
      });
    }
  }, [dbNotifications, markAsRead]);

  const generatedNotifications = useMemo<AppNotification[]>(() => {
    return getNotificationsFromOrders(orders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, getNotificationsFromOrders, readNotiIds, clearedNotiIds]);

  // 🔴 DB 알림 조회가 완료되면 DB의 unreadCount를 절대적 기준으로 적용 (0일 시 0으로 완벽 보장)
  const unreadNotiCount = useMemo(() => {
    if (isNotiFetched) {
      return dbUnreadCount;
    }
    return generatedNotifications.filter((n) => !n.read).length;
  }, [isNotiFetched, dbUnreadCount, generatedNotifications]);

  const handleSelectOrdersTab = useCallback(() => {
    setActiveTab('orders');
    markAllDbAsRead();
    if (generatedNotifications.length > 0) {
      markAllAsRead(generatedNotifications);
    }
  }, [generatedNotifications, markAllAsRead, markAllDbAsRead]);

  // 🔄 모바일에서 스크린 이동(포커스) 시 최신 DB 주문 및 알림 상태 즉시 Invalidate & Refetch
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refetchOrders();
      refetchNotifications();
    }, [queryClient, refetchOrders, refetchNotifications])
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await Promise.all([refetchOrders(), refetchWishlist(), refetchAddresses(), refetchNotifications()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, refetchOrders, refetchWishlist, refetchAddresses, refetchNotifications]);

  const handleLogout = () => {
    Alert.alert(
      '로그아웃 🚪',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch {
              Alert.alert('로그아웃 실패 ❌', '로그아웃 처리 중 문제가 발생했습니다.');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleAddToCart = (product: Product) => {
    const stockCount =
      typeof product.stock === 'number'
        ? product.stock
        : typeof product.stockQuantity === 'number'
        ? product.stockQuantity
        : 0;

    if (stockCount < 1 || product.inStock === false) {
      Alert.alert('장바구니 담기 불가 🚫', '해당 상품은 현재 재고가 없어 장바구니에 담을 수 없습니다.');
      return;
    }

    addToCartMutation.mutate(
      { productId: product._id, quantity: 1 },
      {
        onSuccess: () => {
          Alert.alert('성공 🛒', `${product.name} 상품이 장바구니에 담겼습니다.`);
        },
        onError: () => {
          Alert.alert('오류 ❌', '장바구니 추가 중 오류가 발생했습니다.');
        },
      },
    );
  };

  const handleDeleteWishlist = (productId: string) => {
    deleteWishlistMutation.mutate(productId, {
      onSuccess: () => {
        Alert.alert('완료', '위시리스트 항목이 삭제되었습니다.');
      },
      onError: () => {
        Alert.alert('오류', '위시리스트 삭제 중 오류가 발생했습니다.');
      },
    });
  };

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  const openAddressModal = () => {
    setEditingAddress(null);
    setNewLabel('집');
    setNewFullName(user?.fullName || user?.firstName || '');
    setNewStreetAddress('');
    setNewCity('서울');
    setNewState('서울특별시');
    setNewZipCode('');
    setNewPhone('');
    setNewIsDefault(false);
    setAddAddressModalOpen(true);
  };

  const openEditAddressModal = (address: Address) => {
    setEditingAddress(address);
    setNewLabel(address.label || '배송지');
    setNewFullName(address.fullName || '');
    setNewStreetAddress(address.streetAddress || '');
    setNewCity(address.city || '서울');
    setNewState(address.state || '서울특별시');
    setNewZipCode(address.zipCode || '');
    setNewPhone(address.phoneNumber || '');
    setNewIsDefault(address.isDefault || false);
    setAddAddressModalOpen(true);
  };

  const handleSaveAddress = () => {
    if (!newFullName || !newStreetAddress || !newCity || !newZipCode || !newPhone) {
      Alert.alert('입력 오류 ⚠️', '배송지 필수 항목을 모두 입력해 주세요.');
      return;
    }

    const payload = {
      label: newLabel || '배송지',
      fullName: newFullName,
      streetAddress: newStreetAddress,
      city: newCity,
      state: newState || '서울특별시',
      zipCode: newZipCode,
      phoneNumber: newPhone,
      isDefault: newIsDefault,
    };

    if (editingAddress && editingAddress._id) {
      // ✏️ 배송지 수정
      updateAddressMutation.mutate(
        {
          addressId: editingAddress._id,
          addressData: payload,
        },
        {
          onSuccess: () => {
            setAddAddressModalOpen(false);
            setEditingAddress(null);
            Alert.alert('수정 완료 ✏️', '배송지 정보가 변경되었습니다.');
          },
          onError: () => {
            Alert.alert('오류 ❌', '배송지 수정 중 오류가 발생했습니다.');
          },
        },
      );
    } else {
      // 📍 배송지 추가
      addAddressMutation.mutate(payload, {
        onSuccess: () => {
          setAddAddressModalOpen(false);
          setEditingAddress(null);
          Alert.alert('성공 📍', '새로운 배송지가 성공적으로 추가되었습니다.');
        },
        onError: () => {
          Alert.alert('오류 ❌', '배송지 추가 중 오류가 발생했습니다.');
        },
      });
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    const targetAddr = addresses.find((a) => a._id === addressId);
    const isDefault = targetAddr?.isDefault;

    if (isDefault) {
      Alert.alert(
        '기본 배송지 삭제 안내 📍',
        '기본 배송지는 직접 삭제하실 수 없습니다. 다른 배송지를 먼저 기본 배송지로 지정하신 후 삭제해 주세요.',
      );
      return;
    }

    Alert.alert(
      '배송지 삭제 🗑️',
      `'${targetAddr?.label || '선택한 배송지'}' 항목을 정말 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            deleteAddressMutation.mutate(addressId, {
              onSuccess: () => {
                Alert.alert('삭제 완료 ✅', '배송지가 성공적으로 삭제되었습니다.');
              },
              onError: (err: any) => {
                Alert.alert(
                  '삭제 실패 ⚠️',
                  err?.message || '기본 배송지는 삭제하실 수 없습니다. 다른 배송지를 먼저 기본 배송지로 지정해 주세요.',
                );
              },
            });
          },
        },
      ],
    );
  };

  const openReviewModal = (productId: string, orderId: string) => {
    setReviewProductId(productId);
    setReviewOrderId(orderId);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = () => {
    if (!reviewProductId || !reviewOrderId) return;
    if (!reviewComment.trim()) {
      Alert.alert('입력 오류', '리뷰 내용을 작성해 주세요.');
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
          Alert.alert('성공', '소중한 리뷰 메시지가 성공적으로 등록되었습니다.');
        },
        onError: (err: any) => {
          const msg = err?.message || '리뷰 등록 실패';
          if (msg.includes('이미') || msg.includes('exist')) {
            Alert.alert('알림', '이미 작성된 리뷰입니다.');
          } else {
            Alert.alert('오류', msg);
          }
        },
      },
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 dark:bg-slate-900 bg-slate-100">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#0284c7"
          />
        }
      >
        <Header title="Profile 👤" subtitle="Manage your account & preferences" />

        <UserProfileCard user={user} onLogout={handleLogout} />

        {/* Horizontal Scrollable Tab Bar */}
        <View className="mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 10 }}
            className="flex-row"
          >
            {/* Orders */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSelectOrdersTab}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 14,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: activeTab === 'orders' ? (isDark ? '#334155' : '#ffffff') : (isDark ? '#1e293b' : '#f1f5f9'),
                borderWidth: 1,
                borderColor: activeTab === 'orders' ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#334155' : '#e2e8f0'),
              }}
            >
              <Ionicons
                name="cube-outline"
                size={16}
                color={activeTab === 'orders' ? (isDark ? '#38bdf8' : '#0284c7') : '#94a3b8'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: activeTab === 'orders' ? '800' : '700',
                  color: activeTab === 'orders' ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#94a3b8' : '#64748b'),
                }}
              >
                주문내역
              </Text>
              {/* 🔴 알림 아이콘/도트 표시 (숫자 없이 알림 존재 유무만 시각화) */}
              {unreadNotiCount > 0 && (
                <View className="ml-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white dark:border-slate-800" />
              )}
            </TouchableOpacity>

            {/* Wishlist */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('wishlist')}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 14,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: activeTab === 'wishlist' ? (isDark ? '#334155' : '#ffffff') : (isDark ? '#1e293b' : '#f1f5f9'),
                borderWidth: 1,
                borderColor: activeTab === 'wishlist' ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#334155' : '#e2e8f0'),
              }}
            >
              <Ionicons
                name="heart-outline"
                size={16}
                color={activeTab === 'wishlist' ? (isDark ? '#38bdf8' : '#0284c7') : '#94a3b8'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: activeTab === 'wishlist' ? '800' : '700',
                  color: activeTab === 'wishlist' ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#94a3b8' : '#64748b'),
                }}
              >
                위시리스트
              </Text>
              <View
                className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                  activeTab === 'wishlist'
                    ? 'bg-sky-500/20 dark:bg-cyan-400/20'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: activeTab === 'wishlist' ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#94a3b8' : '#64748b'),
                  }}
                >
                  {wishlist.length}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Addresses */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('addresses')}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 14,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: activeTab === 'addresses' ? (isDark ? '#334155' : '#ffffff') : (isDark ? '#1e293b' : '#f1f5f9'),
                borderWidth: 1,
                borderColor: activeTab === 'addresses' ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#334155' : '#e2e8f0'),
              }}
            >
              <Ionicons
                name="location-outline"
                size={16}
                color={activeTab === 'addresses' ? (isDark ? '#38bdf8' : '#0284c7') : '#94a3b8'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: activeTab === 'addresses' ? '800' : '700',
                  color: activeTab === 'addresses' ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#94a3b8' : '#64748b'),
                }}
              >
                배송지
              </Text>
              <View
                className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                  activeTab === 'addresses'
                    ? 'bg-sky-500/20 dark:bg-cyan-400/20'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: activeTab === 'addresses' ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#94a3b8' : '#64748b'),
                  }}
                >
                  {addresses.length}
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Content Area */}
        <View className="mb-4">
          {activeTab === 'orders' && (
            <OrderListTab
              orders={orders}
              loading={isOrdersLoading}
              refreshing={isOrdersRefetching}
              onOpenReviewModal={openReviewModal}
            />
          )}

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

          {activeTab === 'addresses' && (
            <AddressListTab
              addresses={addresses}
              onOpenAddModal={openAddressModal}
              onEditAddress={openEditAddressModal}
              onDeleteAddress={handleDeleteAddress}
            />
          )}
        </View>

        {/* 서비스 정보 안내 */}
        <View className="dark:bg-slate-800/80 bg-white/90 p-4 rounded-2xl border dark:border-slate-700 border-slate-200 shadow-sm mb-4">
          <Text className="text-sm font-bold dark:text-cyan-400 text-sky-600 mb-1">
            서비스 정보 📱
          </Text>
          <Text className="text-xs dark:text-slate-400 text-slate-500 leading-5">
            주문 내역, 위시리스트 및 배송지 정보는 계정과 실시간 연동됩니다.
          </Text>
        </View>
      </ScrollView>

      <AddAddressModal
        visible={addAddressModalOpen}
        isDark={isDark}
        isEditing={!!editingAddress}
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
        onClose={() => {
          setAddAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSubmit={handleSaveAddress}
      />

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
