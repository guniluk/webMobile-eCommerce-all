import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Address } from '../../types';

interface SelectAddressModalProps {
  visible: boolean;
  addresses: Address[];
  selectedAddress: Address | null;
  onClose: () => void;
  onSelectAddress: (address: Address) => void;
}

export const SelectAddressModal: React.FC<SelectAddressModalProps> = ({
  visible,
  addresses,
  selectedAddress,
  onClose,
  onSelectAddress,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="dark:bg-slate-800 bg-white rounded-t-3xl p-6 border-t dark:border-slate-700 border-slate-200">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base font-bold dark:text-white text-slate-900">
              배송지 선택
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {addresses.map((addr) => (
            <TouchableOpacity
              key={addr._id}
              onPress={() => onSelectAddress(addr)}
              className={`p-4 rounded-2xl border mb-3 ${
                selectedAddress?._id === addr._id
                  ? 'border-sky-500 bg-sky-500/10 dark:border-cyan-400'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <Text className="text-sm font-bold dark:text-white text-slate-900">
                [{addr.label}] {addr.fullName}
              </Text>
              <Text className="text-xs dark:text-slate-400 text-slate-600 mt-1">
                {addr.streetAddress}, {addr.city} ({addr.zipCode})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};
