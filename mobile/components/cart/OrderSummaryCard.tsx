import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OrderSummaryCardProps {
  subtotal: number;
  loading: boolean;
  onCheckout: () => void;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = React.memo(
  function OrderSummaryCard({ subtotal, loading, onCheckout }) {
    const SHIPPING_FEE = 3000;
    const FREE_SHIPPING_THRESHOLD = 100000;
    const TAX_RATE = 0.1;
    const shippingFee =
      subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
    const tax = Math.round(subtotal * TAX_RATE);
    const finalTotal = subtotal + shippingFee + tax;
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

    return (
      <View>
        {/* 결제 요약 카드 */}
        <View className="dark:bg-slate-800 bg-white rounded-2xl p-5 border dark:border-slate-700 border-slate-200 shadow-md mb-6">
          <Text className="text-base font-bold dark:text-white text-slate-900 mb-3">
            결제 금액 요약 💳
          </Text>

          {/* 상품 금액 (소계) */}
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs dark:text-slate-400 text-slate-600">
              상품 금액
            </Text>
            <Text className="text-xs dark:text-slate-200 text-slate-800 font-semibold">
              ₩{subtotal.toLocaleString()}
            </Text>
          </View>

          {/* 배송비 */}
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs dark:text-slate-400 text-slate-600">
              배송비
            </Text>
            {isFreeShipping ? (
              <Text className="text-xs dark:text-emerald-400 text-emerald-600 font-bold">
                무료 🎉
              </Text>
            ) : (
              <Text className="text-xs dark:text-slate-200 text-slate-800 font-semibold">
                +₩{shippingFee.toLocaleString()}
              </Text>
            )}
          </View>

          {/* 세금 (10%) */}
          <View className="flex-row justify-between mb-3">
            <View className="flex-row items-center">
              <Text className="text-xs dark:text-slate-400 text-slate-600">
                부가가치세
              </Text>
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                (10%)
              </Text>
            </View>
            <Text className="text-xs dark:text-slate-200 text-slate-800 font-semibold">
              +₩{tax.toLocaleString()}
            </Text>
          </View>

          <View className="h-[1px] dark:bg-slate-700 bg-slate-200 my-2" />

          {/* 최종 결제 금액 */}
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-sm font-bold dark:text-white text-slate-900">
              최종 결제 금액
            </Text>
            <Text className="text-lg font-extrabold dark:text-cyan-400 text-sky-700">
              ₩{finalTotal.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* 주문하기 버튼 */}
        <TouchableOpacity
          onPress={onCheckout}
          disabled={loading}
          className="w-full bg-sky-600 dark:bg-cyan-500 py-4 rounded-2xl flex-row justify-center items-center active:bg-sky-700 shadow-md mb-6"
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="card-outline" size={20} color="white" />
              <Text className="text-base font-bold text-white ml-2">
                ₩{finalTotal.toLocaleString()} 주문하기
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  },
);
