import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreateReviewModalProps {
  visible: boolean;
  isDark: boolean;
  rating: number;
  comment: string;
  onChangeRating: (val: number) => void;
  onChangeComment: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const CreateReviewModal: React.FC<CreateReviewModalProps> = ({
  visible,
  isDark,
  rating,
  comment,
  onChangeRating,
  onChangeComment,
  onClose,
  onSubmit,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/60 justify-end">
            <View className="dark:bg-slate-800 bg-white rounded-t-3xl p-6 border-t dark:border-slate-700 border-slate-200">
              <View className="flex-row justify-between items-center mb-4 pb-3 border-b dark:border-slate-700 border-slate-100">
                <View className="flex-row items-center">
                  <Ionicons name="star" size={22} color="#f59e0b" />
                  <Text className="text-base font-bold dark:text-white text-slate-900 ml-2">
                    구매 상품 리뷰 작성 ⭐
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close-circle" size={26} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text className="text-xs font-bold dark:text-slate-300 text-slate-700 mb-2 text-center">
                상품 만족도 별점을 선택해주세요 (1 ~ 5점)
              </Text>

              {/* 별점 선택 픽커 */}
              <View className="flex-row justify-center items-center mb-5 bg-amber-500/10 dark:bg-amber-500/20 py-3 rounded-2xl border border-amber-500/30">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => onChangeRating(star)}
                    className="px-2"
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={32}
                      color="#f59e0b"
                    />
                  </TouchableOpacity>
                ))}
                <Text className="text-sm font-extrabold text-amber-500 ml-2">
                  {rating}점
                </Text>
              </View>

              <Text className="text-xs font-bold dark:text-slate-300 text-slate-700 mb-1.5 ml-1">
                리뷰 메시지 입력 *
              </Text>
              <TextInput
                placeholder="상품에 대한 솔직한 사용 후기를 남겨주세요."
                placeholderTextColor="#94a3b8"
                value={comment}
                onChangeText={onChangeComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="dark:bg-slate-900 bg-slate-100 dark:text-white text-slate-800 p-3.5 rounded-xl mb-5 text-xs font-medium border dark:border-slate-700 border-slate-200 h-28"
              />

              <TouchableOpacity
                onPress={onSubmit}
                className="w-full bg-sky-600 dark:bg-cyan-500 py-3.5 rounded-2xl flex-row justify-center items-center shadow-md active:bg-sky-700 mb-2"
              >
                <Ionicons name="send" size={18} color="white" />
                <Text className="text-sm font-bold text-white ml-2">리뷰 등록하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};
