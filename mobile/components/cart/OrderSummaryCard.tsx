import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OrderSummaryCardProps {
  totalAmount: number;
  loading: boolean;
  onCheckout: () => void;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = React.memo(function OrderSummaryCard({
  totalAmount,
  loading,
  onCheckout,
}) {
  return (
    <View>
      {/* 결제 요약 카드 */}
      <View className="dark:bg-slate-800 bg-white rounded-2xl p-5 border dark:border-slate-700 border-slate-200 shadow-md mb-6">
        <Text className="text-base font-bold dark:text-white text-slate-900 mb-3">
          결제 금액 요약
        </Text>
        <View className="flex-row justify-between mb-2">
          <Text className="text-xs dark:text-slate-400 text-slate-600">상품 금액</Text>
          <Text className="text-xs dark:text-slate-200 text-slate-800 font-semibold">
            ₩{totalAmount.toLocaleString()}
          </Text>
        </View>
        <View className="flex-row justify-between mb-3">
          <Text className="text-xs dark:text-slate-400 text-slate-600">배송비</Text>
          <Text className="text-xs dark:text-emerald-400 text-emerald-600 font-bold">무료</Text>
        </View>
        <View className="h-[1px] dark:bg-slate-700 bg-slate-200 my-2" />
        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-sm font-bold dark:text-white text-slate-900">최종 결제 금액</Text>
          <Text className="text-lg font-extrabold dark:text-cyan-400 text-sky-700">
            ₩{totalAmount.toLocaleString()}
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
              ₩{totalAmount.toLocaleString()} 주문하기
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
});
