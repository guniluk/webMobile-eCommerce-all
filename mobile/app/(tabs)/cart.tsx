import React, { useState, useMemo, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Header } from "../../components/Header";
import { Address, ShippingAddress } from "../../types";
import { CartItemRow } from "../../components/cart/CartItemRow";
import { OrderSummaryCard } from "../../components/cart/OrderSummaryCard";
import { SelectAddressModal } from "../../components/cart/SelectAddressModal";
import { api } from "../../lib/api";

import {
  useCartQuery,
  useUpdateCartMutation,
  useDeleteCartMutation,
  useClearCartMutation,
} from "../../hooks/useCartQuery";
import { useAddressesQuery } from "../../hooks/useAddressesQuery";
import { useCreateOrderMutation } from "../../hooks/useOrdersQuery";
import { useStripe } from "../../lib/stripe";
import * as Sentry from "@sentry/react-native";

export default function CartScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // ----------------- TanStack Queries & Mutations -----------------
  const {
    data: cartResponse,
    isLoading: isCartLoading,
    isRefetching: isCartRefetching,
    refetch: refetchCart,
  } = useCartQuery();

  const { data: addresses = [], refetch: refetchAddresses } =
    useAddressesQuery();

  const cartItems = useMemo(() => cartResponse?.items || [], [cartResponse]);

  const currentAddress = useMemo(() => {
    const defaultAddr =
      addresses.find((a) => a.isDefault) || addresses[0] || null;
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

  const handleDeleteItem = useCallback(
    (productId: string, productName?: string) => {
      const nameText = productName ? `'${productName}' ` : "해당 ";
      Alert.alert(
        "상품 삭제 확인 🗑️",
        `${nameText}상품을 장바구니에서 삭제하시겠습니까?`,
        [
          { text: "취소", style: "cancel" },
          {
            text: "삭제",
            style: "destructive",
            onPress: () => {
              deleteCartMutation.mutate(productId, {
                onError: (err: any) => {
                  Sentry.captureException(err, {
                    tags: { section: "delete_cart_item" },
                  });
                  Alert.alert("오류", err?.message || "삭제 실패");
                },
              });
            },
          },
        ],
      );
    },
    [deleteCartMutation],
  );

  const handleUpdateQuantity = useCallback(
    (productId: string, newQuantity: number, productName?: string) => {
      if (newQuantity < 1) {
        const nameText = productName ? `'${productName}' ` : "해당 ";
        Alert.alert(
          "상품 삭제 확인 🗑️",
          `수량이 0이 되었습니다. ${nameText}상품을 장바구니에서 삭제하시겠습니까?`,
          [
            { text: "취소", style: "cancel" },
            {
              text: "삭제",
              style: "destructive",
              onPress: () => {
                deleteCartMutation.mutate(productId, {
                  onError: (err: any) => {
                    Sentry.captureException(err, {
                      tags: { section: "delete_cart_item_zero_qty" },
                    });
                    Alert.alert("오류", err?.message || "삭제 실패");
                  },
                });
              },
            },
          ],
        );
        return;
      }
      updateCartMutation.mutate(
        { productId, quantity: newQuantity },
        {
          onError: (err: any) => {
            Sentry.captureException(err, {
              tags: { section: "update_cart_quantity" },
            });
            Alert.alert("오류", err?.message || "수량 변경 실패");
          },
        },
      );
    },
    [updateCartMutation, deleteCartMutation],
  );

  const handleClearCart = useCallback(() => {
    Alert.alert("장바구니 비우기", "장바구니의 모든 상품을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          clearCartMutation.mutate(undefined, {
            onError: (err: any) => {
              Sentry.captureException(err, {
                tags: { section: "clear_cart" },
              });
              Alert.alert("오류", err?.message || "비우기 실패");
            },
          });
        },
      },
    ]);
  }, [clearCartMutation]);

  const { subtotal, finalTotal } = useMemo(() => {
    const sub = cartItems.reduce((acc, item) => {
      const prod = item.product || item.productId;
      const price = typeof prod === "object" && prod ? prod.price : 0;
      return acc + price * item.quantity;
    }, 0);

    const shipping = sub > 0 && sub < 100000 ? 3000 : 0;
    const t = Math.round(sub * 0.1);
    const total = sub + shipping + t;

    return {
      subtotal: sub,
      shippingFee: shipping,
      tax: t,
      finalTotal: total,
    };
  }, [cartItems]);

  // 💳 Stripe 결제 및 주문 생성 핸들러
  const handleCheckout = useCallback(async () => {
    if (cartItems.length === 0 || isProcessingPayment) return;

    const validCartItems = cartItems.filter((item) => {
      const prod = item.product || item.productId;
      return item && prod;
    });

    if (validCartItems.length === 0) {
      Alert.alert("알림", "유효한 장바구니 상품이 없습니다.");
      return;
    }

    if (!currentAddress) {
      Alert.alert(
        "배송지 필요 📍",
        "주문을 진행하려면 먼저 배송지를 등록해 주세요.",
        [
          { text: "취소", style: "cancel" },
          {
            text: "배송지 관리/등록",
            onPress: () => setAddressModalOpen(true),
          },
        ],
      );
      return;
    }

    const shippingAddress: ShippingAddress = {
      fullName: currentAddress.fullName,
      streetAddress: currentAddress.streetAddress,
      city: currentAddress.city,
      state: currentAddress.state || "서울특별시",
      zipCode: currentAddress.zipCode,
      phoneNumber: currentAddress.phoneNumber,
    };

    // Sentry 결제 진행 브레드크럼 기록
    Sentry.addBreadcrumb({
      category: "checkout",
      message: "Cart checkout process initiated",
      level: "info",
      data: {
        itemCount: validCartItems.length,
        finalTotal,
        city: shippingAddress.city,
      },
    });

    const cartItemsForIntent = validCartItems.map((item) => {
      const prod = item.product || item.productId;
      const prodId =
        (typeof prod === "object" && prod ? prod._id : (prod as string)) || "";
      return {
        productId: prodId,
        quantity: item.quantity,
      };
    });

    setIsProcessingPayment(true);

    try {
      // 1. Stripe PaymentIntent 생성 요청 (백엔드 API)
      const token = await getToken();
      const intentResult = await api.createPaymentIntent(
        {
          cartItems: cartItemsForIntent,
          shippingAddress,
        },
        token,
      );

      if (!intentResult || !intentResult.clientSecret) {
        Sentry.captureMessage(
          `PaymentIntent creation failed: ${intentResult?.message || "No clientSecret"}`,
          "warning",
        );
        Alert.alert(
          "결제 준비 실패 ⚠️",
          intentResult?.message ||
            "결제 세션(clientSecret)을 생성하지 못했습니다.",
        );
        setIsProcessingPayment(false);
        return;
      }

      // 2. Stripe PaymentSheet 결제창 초기화
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: intentResult.clientSecret,
        merchantDisplayName: "BYH E-Commerce Test Store",
        defaultBillingDetails: {
          name: shippingAddress.fullName,
          phone: shippingAddress.phoneNumber,
        },
      });

      if (initError) {
        Sentry.captureException(initError, {
          tags: { section: "stripe_init_payment_sheet" },
        });
        Alert.alert("결제 초기화 오류 ❌", initError.message);
        setIsProcessingPayment(false);
        return;
      }

      // 3. Stripe 네이티브 결제모달(PaymentSheet) 표시
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          // 유저가 결제 모달을 취소한 것은 시스템/코드 에러가 아니므로 Sentry 수집 제외
          Alert.alert("안내 ℹ️", "결제가 취소되었습니다.");
        } else {
          // 결제 승인 실패 등 실제 결제 에러 시 수집
          Sentry.captureException(presentError, {
            tags: { section: "stripe_present_payment_sheet" },
          });
          Alert.alert("결제 실패 ❌", presentError.message);
        }
        setIsProcessingPayment(false);
        return;
      }

      // 4. 결제 완료 승인 후 주문(Order) DB 등록 요청
      const orderItems = validCartItems.map((item) => {
        const prod = item.product || item.productId;
        const prodId =
          (typeof prod === "object" && prod ? prod._id : (prod as string)) ||
          "";
        const name = typeof prod === "object" && prod ? prod.name : "상품";
        const price = typeof prod === "object" && prod ? prod.price : 0;
        const image =
          (typeof prod === "object" && prod
            ? prod.image || prod.images?.[0]
            : "") || "https://via.placeholder.com/150";

        return {
          productId: prodId,
          name,
          quantity: item.quantity,
          price,
          image,
        };
      });

      const paymentResult = {
        id: intentResult.paymentIntentId || "PAY_" + Date.now(),
        status: "COMPLETED",
        update_time: new Date().toISOString(),
        email_address:
          user?.primaryEmailAddress?.emailAddress || "user@example.com",
      };

      createOrderMutation.mutate(
        {
          orderItems,
          totalPrice: intentResult.amountDetails?.totalAmount || finalTotal,
          paymentMethod: "Stripe Credit Card",
          shippingAddress,
          paymentResult,
        },
        {
          onSuccess: () => {
            clearCartMutation.mutate();
            Sentry.addBreadcrumb({
              category: "checkout",
              message: "Order successfully created after payment",
              level: "info",
            });
            Alert.alert(
              "결제 및 주문 완료! 🎉",
              "Stripe 카드 결제가 성공적으로 완료되어 주문이 접수되었습니다.\nProfile 탭에서 주문 내역을 확인하실 수 있습니다.",
            );
          },
          onError: (err: any) => {
            Sentry.captureException(err, {
              tags: { section: "create_order_after_payment" },
              extra: { paymentIntentId: intentResult.paymentIntentId },
            });
            Alert.alert(
              "주문 생성 실패 ⚠️",
              err?.message ||
                "결제는 성공했으나 주문 기록 생성에 실패했습니다.",
            );
          },
          onSettled: () => {
            if (isMountedRef.current) {
              setIsProcessingPayment(false);
            }
          },
        },
      );
    } catch (err: any) {
      Sentry.captureException(err, {
        tags: { section: "cart_handle_checkout_catch" },
      });
      Alert.alert(
        "결제 처리 오류 ❌",
        err?.message || "결제 진행 중 오류가 발생했습니다.",
      );
      if (isMountedRef.current) {
        setIsProcessingPayment(false);
      }
    }
  }, [
    cartItems,
    currentAddress,
    isProcessingPayment,
    getToken,
    user,
    initPaymentSheet,
    presentPaymentSheet,
    createOrderMutation,
    clearCartMutation,
    finalTotal,
  ]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 dark:bg-slate-900 bg-slate-100"
    >
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
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#0284c7" />
            <Text className="mt-3 text-xs dark:text-slate-400 text-slate-500">
              장바구니 항목을 불러오는 중입니다...
            </Text>
          </View>
        ) : cartItems.length === 0 ? (
          <View className="items-center p-6 py-20 mt-4 border dark:bg-slate-800/50 bg-white/60 rounded-2xl dark:border-slate-700 border-slate-200">
            <Ionicons name="cart-outline" size={56} color="#94a3b8" />
            <Text className="mt-3 text-lg font-bold dark:text-slate-300 text-slate-700">
              장바구니가 비어 있습니다.
            </Text>
            <Text className="mt-1 text-xs text-center dark:text-slate-400 text-slate-500">
              Shop 탭에서 마음에 드는 상품을 담아보세요!
            </Text>
          </View>
        ) : (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold dark:text-slate-300 text-slate-700">
                총 {cartItems.length}개의 상품
              </Text>
              <TouchableOpacity
                onPress={handleClearCart}
                className="flex-row items-center"
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text className="ml-1 text-xs font-bold text-rose-500">
                  전체 삭제
                </Text>
              </TouchableOpacity>
            </View>

            {cartItems.map((item, index) => (
              <CartItemRow
                key={
                  (typeof item.product === "object" && item.product?._id) ||
                  (typeof item.productId === "object" && item.productId?._id) ||
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
            <View className="p-4 mt-2 mb-3 bg-white border shadow-sm dark:bg-slate-800 rounded-2xl dark:border-slate-700 border-slate-200">
              <View className="flex-row items-center justify-between mb-2">
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
                    {currentAddress.streetAddress}, {currentAddress.city} (
                    {currentAddress.zipCode})
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
              subtotal={subtotal}
              loading={createOrderMutation.isPending || isProcessingPayment}
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
