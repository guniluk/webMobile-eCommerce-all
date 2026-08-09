import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types';

interface OrderListTabProps {
  orders: Order[];
  loading: boolean;
  refreshing: boolean;
  onOpenReviewModal: (productId: string, orderId: string, hasReviewed?: boolean) => void;
}

export const OrderListTab: React.FC<OrderListTabProps> = React.memo(function OrderListTab({
  orders,
  loading,
  refreshing,
  onOpenReviewModal,
}) {
  if (loading && orders.length === 0) {
    return (
      <View className="py-16 justify-center items-center">
        <ActivityIndicator size="large" color="#0284c7" />
        <Text className="text-xs dark:text-slate-400 text-slate-500 mt-3">
          주문 내역을 불러오는 중입니다...
        </Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View className="py-14 items-center dark:bg-slate-800/50 bg-white/60 rounded-2xl p-6 border dark:border-slate-700 border-slate-200 mb-4">
        <Ionicons name="cube-outline" size={48} color="#94a3b8" />
        <Text className="text-base font-bold dark:text-slate-300 text-slate-700 mt-3">
          아직 주문 내역이 없습니다.
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-4">
      {orders.map((order) => {
        const dateStr = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '주문일 정보 없음';

        return (
          <View
            key={order._id}
            className="dark:bg-slate-800 bg-white rounded-2xl p-4 mb-3.5 border dark:border-slate-700 border-slate-200 shadow-sm"
          >
            <View className="flex-row justify-between items-center pb-2.5 border-b dark:border-slate-700 border-slate-100 mb-3">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color="#0284c7" />
                <Text className="text-xs font-bold dark:text-slate-300 text-slate-700 ml-1">
                  {dateStr}
                </Text>
              </View>
              <View className="bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {order.isPaid ? '결제완료' : '주문접수'}
                </Text>
              </View>
            </View>

            {/* 주문 상품들 */}
            {(order.orderItems || []).map((item, idx) => {
              const rawProd = item.product || item.productId;
              const prodIdStr =
                typeof rawProd === 'object' && rawProd !== null
                  ? rawProd._id
                  : (rawProd as string) || '';

              const itemPrice = item.price || 0;
              const hasReviewed = !!(item.hasReviewed || item.isReviewed);

              return (
                <View key={idx} className="mb-3">
                  <View className="flex-row items-center">
                    <Image
                      source={{
                        uri:
                          item.image ||
                          (typeof item.product === 'object' && item.product?.image) ||
                          'https://via.placeholder.com/150',
                      }}
                      className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 mr-3"
                    />
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className="text-xs font-bold dark:text-white text-slate-800"
                      >
                        {item.name ||
                          (typeof item.product === 'object' && item.product?.name) ||
                          '상품명 없음'}
                      </Text>
                      <Text className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5">
                        ₩{itemPrice.toLocaleString()} × {item.quantity}개
                      </Text>
                    </View>

                    {/* 리뷰 작성 버튼 */}
                    {prodIdStr ? (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => onOpenReviewModal(prodIdStr, order._id, hasReviewed)}
                        disabled={hasReviewed}
                        className={`px-2.5 py-1.5 rounded-xl flex-row items-center border ${
                          hasReviewed
                            ? 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'
                            : 'bg-amber-500/10 border-amber-500/30'
                        }`}
                      >
                        <Ionicons
                          name={hasReviewed ? 'checkmark-circle' : 'star'}
                          size={12}
                          color={hasReviewed ? '#94a3b8' : '#f59e0b'}
                        />
                        <Text
                          className={`text-[10px] font-bold ml-1 ${
                            hasReviewed
                              ? 'text-slate-400 dark:text-slate-500'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {hasReviewed ? '작성완료' : '리뷰쓰기'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}

            <View className="flex-row justify-between items-center pt-2 border-t dark:border-slate-700/60 border-slate-100">
              <Text className="text-xs dark:text-slate-400 text-slate-500 font-medium">
                총 결제 금액
              </Text>
              <Text className="text-sm font-extrabold dark:text-cyan-400 text-sky-700">
                ₩{(order.totalPrice || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
});
