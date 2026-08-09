import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, Review } from '../../types';

interface ReviewsModalProps {
  product: Product | null;
  reviews: Review[];
  loading: boolean;
  onClose: () => void;
}

export const ReviewsModal: React.FC<ReviewsModalProps> = ({
  product,
  reviews,
  loading,
  onClose,
}) => {
  if (!product) return null;

  return (
    <Modal
      visible={product !== null}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="dark:bg-slate-800 bg-white rounded-t-3xl p-6 h-[80%] border-t dark:border-slate-700 border-slate-200">
          <View className="flex-1">
            {/* 헤더 */}
            <View className="flex-row justify-between items-center mb-4 pb-3 border-b dark:border-slate-700 border-slate-100">
              <View className="flex-1 mr-2">
                <Text
                  className="text-base font-bold dark:text-white text-slate-900"
                  numberOfLines={1}
                >
                  {product.name}
                </Text>
                <Text className="text-xs text-sky-600 dark:text-cyan-400 font-bold mt-0.5">
                  상품 고객 리뷰 ({reviews.length}건) 💬
                </Text>
              </View>

              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View className="py-20 justify-center items-center flex-1">
                <ActivityIndicator size="large" color="#0284c7" />
                <Text className="text-xs dark:text-slate-400 text-slate-500 mt-3 font-medium">
                  리뷰 목록을 불러오는 중입니다...
                </Text>
              </View>
            ) : reviews.length === 0 ? (
              <View className="py-16 items-center justify-center flex-1 bg-slate-100/80 dark:bg-slate-900/60 rounded-2xl p-6 border dark:border-slate-700 border-slate-200 my-2">
                <Ionicons name="chatbubbles-outline" size={48} color="#94a3b8" />
                <Text className="text-base font-bold dark:text-slate-200 text-slate-700 mt-3">
                  아직 작성된 리뷰가 없습니다.
                </Text>
                <Text className="text-xs text-slate-400 mt-1 text-center leading-5">
                  상품을 직접 구매하신 후 Profile 탭 ➔ 주문내역에서{'\n'}첫 번째 리뷰 소감을 남겨보세요!
                </Text>
              </View>
            ) : (
              <View className="flex-1">
                {/* 📊 리뷰 평점 평균 요약 카드 */}
                {(() => {
                  const totalRating = reviews.reduce(
                    (sum, r) => sum + (r.rating || 5),
                    0,
                  );
                  const avg = (totalRating / reviews.length).toFixed(1);
                  return (
                    <View className="flex-row items-center bg-amber-500/10 dark:bg-amber-500/20 p-3.5 rounded-2xl border border-amber-500/30 mb-4 justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={24} color="#f59e0b" />
                        <Text className="text-lg font-extrabold text-amber-500 ml-2">
                          {avg} / 5.0
                        </Text>
                      </View>
                      <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        총 {reviews.length}개 실사용 리뷰
                      </Text>
                    </View>
                  );
                })()}

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  className="flex-1"
                >
                  {reviews.map((rev) => {
                    const userObj =
                      typeof rev.userId === 'object' && rev.userId !== null
                        ? rev.userId
                        : null;
                    const userName =
                      (userObj &&
                        (userObj.name || userObj.email?.split('@')[0])) ||
                      '실제 구매자';
                    const userImage = userObj?.imageUrl;

                    const revDate = new Date(
                      rev.createdAt || Date.now(),
                    ).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    });

                    return (
                      <View
                        key={rev._id}
                        className="dark:bg-slate-900/90 bg-slate-100 p-4 rounded-2xl mb-3 border dark:border-slate-700/80 border-slate-200 shadow-sm"
                      >
                        <View className="flex-row justify-between items-center mb-2">
                          <View className="flex-row items-center">
                            {userImage ? (
                              <Image
                                source={{ uri: userImage }}
                                className="w-7 h-7 rounded-full mr-2 border border-sky-500"
                              />
                            ) : (
                              <View className="w-7 h-7 rounded-full bg-sky-600 justify-center items-center mr-2">
                                <Text className="text-xs font-bold text-white">
                                  {userName[0]?.toUpperCase() || 'U'}
                                </Text>
                              </View>
                            )}
                            <Text className="text-xs font-bold dark:text-slate-200 text-slate-800">
                              {userName}
                            </Text>
                          </View>

                          <Text className="text-[10px] dark:text-slate-400 text-slate-500 font-medium">
                            {revDate}
                          </Text>
                        </View>

                        {/* 별점 표시 */}
                        <View className="flex-row items-center mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons
                              key={s}
                              name={s <= rev.rating ? 'star' : 'star-outline'}
                              size={14}
                              color="#f59e0b"
                            />
                          ))}
                          <Text className="text-xs font-extrabold text-amber-500 ml-1.5">
                            {rev.rating}점
                          </Text>
                        </View>

                        {/* 리뷰 소감 메시지 */}
                        <Text className="text-xs dark:text-slate-300 text-slate-700 leading-5 font-medium">
                          {rev.comment || '작성된 상세 리뷰 내용이 없습니다.'}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
