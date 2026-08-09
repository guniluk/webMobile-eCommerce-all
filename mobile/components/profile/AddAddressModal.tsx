import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddAddressModalProps {
  visible: boolean;
  isDark: boolean;
  newLabel: string;
  newFullName: string;
  newStreetAddress: string;
  newCity: string;
  newState: string;
  newZipCode: string;
  newPhone: string;
  newIsDefault: boolean;
  onChangeLabel: (val: string) => void;
  onChangeFullName: (val: string) => void;
  onChangeStreetAddress: (val: string) => void;
  onChangeCity: (val: string) => void;
  onChangeState: (val: string) => void;
  onChangeZipCode: (val: string) => void;
  onChangePhone: (val: string) => void;
  onChangeIsDefault: (val: boolean) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const AddAddressModal: React.FC<AddAddressModalProps> = ({
  visible,
  isDark,
  newLabel,
  newFullName,
  newStreetAddress,
  newCity,
  newState,
  newZipCode,
  newPhone,
  newIsDefault,
  onChangeLabel,
  onChangeFullName,
  onChangeStreetAddress,
  onChangeCity,
  onChangeState,
  onChangeZipCode,
  onChangePhone,
  onChangeIsDefault,
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
      <View className="flex-1 bg-black/60 justify-end">
        <View className="dark:bg-slate-800 bg-white rounded-t-3xl p-6 max-h-[90%] border-t dark:border-slate-700 border-slate-200">
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-center mb-5 pb-3 border-b dark:border-slate-700 border-slate-100">
              <View className="flex-row items-center">
                <Ionicons name="location" size={22} color={isDark ? '#38bdf8' : '#0284c7'} />
                <Text className="text-base font-bold dark:text-white text-slate-900 ml-2">
                  새 배송지 등록 📍
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-bold dark:text-slate-300 text-slate-700 mb-1.5 ml-1">
              배송지 별칭 (예: 집, 회사, 본가) *
            </Text>
            <TextInput
              placeholder="배송지 별칭 입력"
              placeholderTextColor="#94a3b8"
              value={newLabel}
              onChangeText={onChangeLabel}
              className="dark:bg-slate-900 bg-slate-100 dark:text-white text-slate-800 p-3.5 rounded-xl mb-3.5 text-xs font-medium border dark:border-slate-700 border-slate-200"
            />

            <Text className="text-xs font-bold dark:text-slate-300 text-slate-700 mb-1.5 ml-1">
              수령인 성명 *
            </Text>
            <TextInput
              placeholder="받으실 분 성명"
              placeholderTextColor="#94a3b8"
              value={newFullName}
              onChangeText={onChangeFullName}
              className="dark:bg-slate-900 bg-slate-100 dark:text-white text-slate-800 p-3.5 rounded-xl mb-3.5 text-xs font-medium border dark:border-slate-700 border-slate-200"
            />

            <Text className="text-xs font-bold dark:text-slate-300 text-slate-700 mb-1.5 ml-1">
              도로명 주소 *
            </Text>
            <TextInput
              placeholder="도로명 주소 (예: 테헤란로 123 건물 401호)"
              placeholderTextColor="#94a3b8"
              value={newStreetAddress}
              onChangeText={onChangeStreetAddress}
              className="dark:bg-slate-900 bg-slate-100 dark:text-white text-slate-800 p-3.5 rounded-xl mb-3.5 text-xs font-medium border dark:border-slate-700 border-slate-200"
            />

            <View className="flex-row gap-3 mb-3.5">
              <View className="flex-1">
                <Text className="text-xs font-bold dark:text-slate-300 text-slate-700 mb-1.5 ml-1">
                  도시 (City) *
                </Text>
                <TextInput
                  placeholder="서울"
                  placeholderTextColor="#94a3b8"
                  value={newCity}
                  onChangeText={onChangeCity}
                  className="dark:bg-slate-900 bg-slate-100 dark:text-white text-slate-800 p-3.5 rounded-xl text-xs font-medium border dark:border-slate-700 border-slate-200"
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-bold dark:text-slate-300 text-slate-700 mb-1.5 ml-1">
                  시/도 (State)
                </Text>
                <TextInput
                  placeholder="서울특별시"
                  placeholderTextColor="#94a3b8"
                  value={newState}
                  onChangeText={onChangeState}
                  className="dark:bg-slate-900 bg-slate-100 dark:text-white text-slate-800 p-3.5 rounded-xl text-xs font-medium border dark:border-slate-700 border-slate-200"
                />
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-bold dark:text-slate-300 text-slate-700 mb-1.5 ml-1">
                  우편번호 *
                </Text>
                <TextInput
                  placeholder="06234"
                  placeholderTextColor="#94a3b8"
                  value={newZipCode}
                  onChangeText={onChangeZipCode}
                  keyboardType="numeric"
                  className="dark:bg-slate-900 bg-slate-100 dark:text-white text-slate-800 p-3.5 rounded-xl text-xs font-medium border dark:border-slate-700 border-slate-200"
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-bold dark:text-slate-300 text-slate-700 mb-1.5 ml-1">
                  연락처 *
                </Text>
                <TextInput
                  placeholder="010-1234-5678"
                  placeholderTextColor="#94a3b8"
                  value={newPhone}
                  onChangeText={onChangePhone}
                  keyboardType="phone-pad"
                  className="dark:bg-slate-900 bg-slate-100 dark:text-white text-slate-800 p-3.5 rounded-xl text-xs font-medium border dark:border-slate-700 border-slate-200"
                />
              </View>
            </View>

            <View className="flex-row justify-between items-center bg-slate-100 dark:bg-slate-900 p-3.5 rounded-xl mb-6 border dark:border-slate-700 border-slate-200">
              <Text className="text-xs font-bold dark:text-slate-200 text-slate-800">
                기본 배송지로 설정
              </Text>
              <Switch
                value={newIsDefault}
                onValueChange={onChangeIsDefault}
                trackColor={{ false: '#64748b', true: '#0284c7' }}
                thumbColor="white"
              />
            </View>

            <TouchableOpacity
              onPress={onSubmit}
              className="w-full bg-sky-600 dark:bg-cyan-500 py-4 rounded-2xl flex-row justify-center items-center shadow-md active:bg-sky-700"
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text className="text-sm font-bold text-white ml-2">배송지 저장하기</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
