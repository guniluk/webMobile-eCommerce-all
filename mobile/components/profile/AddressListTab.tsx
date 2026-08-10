import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Address } from '../../types';

interface AddressListTabProps {
  addresses: Address[];
  onOpenAddModal: () => void;
  onEditAddress: (address: Address) => void;
  onDeleteAddress: (addressId: string) => void;
}

export const AddressListTab: React.FC<AddressListTabProps> = React.memo(function AddressListTab({
  addresses,
  onOpenAddModal,
  onEditAddress,
  onDeleteAddress,
}) {
  return (
    <View className="mb-4">
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onOpenAddModal}
        className="w-full py-3.5 px-4 rounded-2xl bg-sky-600 dark:bg-cyan-500 flex-row items-center justify-center shadow-sm mb-3.5"
      >
        <Ionicons name="add-circle-outline" size={20} color="white" />
        <Text className="text-sm font-bold text-white ml-2">새 배송지 추가하기</Text>
      </TouchableOpacity>

      {addresses.length === 0 ? (
        <View className="py-12 items-center dark:bg-slate-800/50 bg-white/60 rounded-2xl p-6 border dark:border-slate-700 border-slate-200">
          <Ionicons name="location-outline" size={44} color="#94a3b8" />
          <Text className="text-sm font-bold dark:text-slate-300 text-slate-700 mt-2">
            등록된 배송지가 없습니다.
          </Text>
        </View>
      ) : (
        addresses.map((addr) => (
          <View
            key={addr._id || addr.streetAddress}
            className="dark:bg-slate-800 bg-white rounded-2xl p-4 mb-3 border dark:border-slate-700 border-slate-200 shadow-sm flex-row items-center justify-between"
          >
            <View className="flex-1 mr-2">
              <View className="flex-row items-center mb-1">
                <Text className="text-sm font-bold dark:text-white text-slate-900 mr-2">
                  [{addr.label}] {addr.fullName}
                </Text>
                {addr.isDefault && (
                  <View className="bg-sky-500/10 dark:bg-cyan-500/20 px-2 py-0.5 rounded-md border border-sky-500/30">
                    <Text className="text-[10px] font-bold text-sky-600 dark:text-cyan-400">
                      기본배송지
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-xs dark:text-slate-400 text-slate-600 leading-4">
                {addr.streetAddress}, {addr.city} ({addr.zipCode})
              </Text>
              <Text className="text-[11px] dark:text-slate-500 text-slate-400 mt-1">
                📞 {addr.phoneNumber}
              </Text>
            </View>

            <View className="flex-row items-center" style={{ gap: 6 }}>
              {/* 배송지 수정 버튼 */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onEditAddress(addr)}
                className="p-2 rounded-xl bg-sky-500/10 dark:bg-cyan-500/20 border border-sky-500/20 dark:border-cyan-500/30"
              >
                <Ionicons name="pencil-outline" size={17} color="#0284c7" />
              </TouchableOpacity>

              {/* 배송지 삭제 버튼 */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (addr._id) {
                    onDeleteAddress(addr._id);
                  }
                }}
                className="p-2 rounded-xl bg-rose-500/10 dark:bg-rose-500/20"
              >
                <Ionicons name="trash-outline" size={17} color="#f43f5e" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
});
