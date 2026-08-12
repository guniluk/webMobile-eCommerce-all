import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface EditProfileModalProps {
  visible: boolean;
  isDark: boolean;
  name: string;
  email: string;
  imageUrl: string;
  isSubmitting: boolean;
  onChangeName: (text: string) => void;
  onChangeImageUrl: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = React.memo(
  function EditProfileModal({
    visible,
    isDark,
    name,
    email,
    imageUrl,
    isSubmitting,
    onChangeName,
    onChangeImageUrl,
    onClose,
    onSubmit,
  }) {
    // 📸 스마트폰 갤러리/사진첩에서 사진 선택 기능
    const handlePickImage = async () => {
      try {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert(
            '권한 필요 📸',
            '프로필 사진을 선택하려면 사진 앨범 접근 권한을 허용해 주세요.',
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const selectedUri = result.assets[0].uri;
          onChangeImageUrl(selectedUri);
        }
      } catch (err: any) {
        console.error('이미지 선택 에러:', err);
        Alert.alert('오류', '이미지를 불러오는 중 문제가 발생했습니다.');
      }
    };

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-end bg-black/60">
              <View
                className={`w-full rounded-t-3xl p-6 border-t ${
                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                }`}
                style={{ maxHeight: '88%' }}
              >
                {/* 모달 상단 헤더 */}
                <View className="flex-row justify-between items-center pb-4 mb-4 border-b dark:border-slate-800 border-slate-100">
                  <View className="flex-row items-center">
                    <View className="p-2 rounded-xl bg-sky-500/10 dark:bg-cyan-500/20 mr-2.5">
                      <Ionicons name="create-outline" size={20} color={isDark ? '#38bdf8' : '#0284c7'} />
                    </View>
                    <View>
                      <Text className="text-lg font-extrabold dark:text-white text-slate-900">
                        프로필 수정 ✏️
                      </Text>
                      <Text className="text-xs dark:text-slate-400 text-slate-500">
                        이름 및 프로필 사진을 변경할 수 있습니다.
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onClose}
                    style={{
                      padding: 8,
                      borderRadius: 9999,
                      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                    }}
                  >
                    <Ionicons name="close" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  className="mb-2"
                >
                  {/* 🖼️ 프로필 이미지 프리뷰 및 카메라 버튼 */}
                  <View className="items-center my-2">
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handlePickImage}
                      style={{ position: 'relative' }}
                    >
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          className="w-24 h-24 rounded-full border-4 border-sky-500/40 bg-slate-100 dark:bg-slate-800"
                        />
                      ) : (
                        <View className="w-24 h-24 rounded-full bg-sky-500/10 dark:bg-cyan-500/20 border-4 border-sky-500/40 justify-center items-center">
                          <Ionicons name="person" size={48} color="#0284c7" />
                        </View>
                      )}
                      <View className="absolute bottom-0 right-0 p-2.5 rounded-full bg-sky-600 dark:bg-cyan-500 border-2 border-white dark:border-slate-900 shadow-md">
                        <Ionicons name="camera" size={15} color="white" />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handlePickImage}
                      style={{
                        marginTop: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 9999,
                        backgroundColor: isDark ? 'rgba(34, 211, 238, 0.15)' : 'rgba(2, 132, 199, 0.1)',
                      }}
                    >
                      <Text className="text-xs font-bold text-sky-600 dark:text-cyan-400">
                        📸 앨범에서 사진 선택하기
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 🌟 추천 아바타 프리셋 바 */}
                  <View className="my-3">
                    <Text className="text-xs font-bold dark:text-slate-400 text-slate-600 mb-2 ml-1">
                      추천 프로필 사진 선택
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {AVATAR_PRESETS.map((presetUrl, idx) => {
                        const isSelected = imageUrl === presetUrl;
                        return (
                          <TouchableOpacity
                            key={idx}
                            activeOpacity={0.8}
                            onPress={() => onChangeImageUrl(presetUrl)}
                            style={{
                              marginRight: 10,
                              padding: 2,
                              borderRadius: 9999,
                              borderWidth: 2,
                              borderColor: isSelected
                                ? (isDark ? '#22d3ee' : '#0284c7')
                                : 'transparent',
                              opacity: isSelected ? 1 : 0.8,
                            }}
                          >
                            <Image
                              source={{ uri: presetUrl }}
                              className="w-12 h-12 rounded-full"
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* 📧 이메일 (읽기 전용) */}
                  <View className="mb-4">
                    <Text className="text-xs font-bold dark:text-slate-300 text-slate-700 mb-1.5 ml-1">
                      이메일 계정 (변경 불가)
                    </Text>
                    <View className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex-row items-center">
                      <Ionicons name="mail-outline" size={18} color="#94a3b8" />
                      <Text className="ml-2.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                        {email || '등록된 이메일 없음'}
                      </Text>
                    </View>
                  </View>

                  {/* 👤 이름 / 닉네임 입력 */}
                  <View className="mb-4">
                    <Text className="text-xs font-bold dark:text-slate-300 text-slate-700 mb-1.5 ml-1">
                      이름 / 닉네임 ✏️
                    </Text>
                    <View className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-row items-center">
                      <Ionicons name="person-outline" size={18} color="#0284c7" />
                      <TextInput
                        value={name}
                        onChangeText={onChangeName}
                        placeholder="이름 또는 닉네임을 입력하세요"
                        placeholderTextColor="#94a3b8"
                        className="flex-1 ml-2.5 text-sm dark:text-white text-slate-900 font-medium"
                      />
                      {name.length > 0 && (
                        <TouchableOpacity
                          onPress={() => onChangeName('')}
                          style={{ padding: 2 }}
                        >
                          <Ionicons name="close-circle" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* 🖼️ 프로필 이미지 URL 직접 입력 */}
                  <View className="mb-6">
                    <Text className="text-xs font-bold dark:text-slate-300 text-slate-700 mb-1.5 ml-1">
                      프로필 이미지 URL 🔗
                    </Text>
                    <View className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-row items-center">
                      <Ionicons name="image-outline" size={18} color="#0284c7" />
                      <TextInput
                        value={imageUrl}
                        onChangeText={onChangeImageUrl}
                        placeholder="https://example.com/profile.jpg"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="none"
                        className="flex-1 ml-2.5 text-sm dark:text-white text-slate-900 font-medium"
                      />
                      {imageUrl.length > 0 && (
                        <TouchableOpacity
                          onPress={() => onChangeImageUrl('')}
                          style={{ padding: 2 }}
                        >
                          <Ionicons name="close-circle" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </ScrollView>

                {/* 하단 버튼 영역 */}
                <View className="flex-row items-center gap-3 pt-2">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onClose}
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
                      borderWidth: 1,
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                    }}
                  >
                    <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      취소
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onSubmit}
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDark ? '#06b6d4' : '#0284c7',
                    }}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="white" />
                        <Text className="text-sm font-extrabold text-white ml-1.5">
                          저장하기
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    );
  },
);
