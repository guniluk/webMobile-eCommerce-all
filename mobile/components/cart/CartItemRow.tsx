import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem, Product } from '../../types';
import { getProductImageSource } from '../../lib/productUtils';

interface CartItemRowProps {
  item: CartItem;
  failedImages: Record<string, boolean>;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onDeleteItem: (productId: string) => void;
  onImageError: (productId: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = React.memo(function CartItemRow({
  item,
  failedImages,
  onUpdateQuantity,
  onDeleteItem,
  onImageError,
}) {
  if (!item) return null;

  const product = (
    typeof item.product === 'object' && item.product !== null
      ? item.product
      : typeof item.productId === 'object' && item.productId !== null
      ? item.productId
      : {}
  ) as Product;

  const productId =
    product._id ||
    (item.productId as unknown as string) ||
    (item.product as unknown as string);
  const price = product.price || 0;

  return (
    <View className="dark:bg-slate-800 bg-white rounded-2xl p-4 mb-3 border dark:border-slate-700 border-slate-200 shadow-sm flex-row items-center">
      <View className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 justify-center items-center mr-3">
        <Image
          source={getProductImageSource(product, failedImages)}
          onError={() => onImageError(productId)}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      <View className="flex-1 justify-between h-20">
        <View className="flex-row justify-between items-start">
          <Text
            numberOfLines={1}
            className="text-sm font-bold dark:text-white text-slate-900 flex-1 mr-2"
          >
            {product.name || '상품 정보 없음'}
          </Text>
          <TouchableOpacity onPress={() => onDeleteItem(productId)}>
            <Ionicons name="close" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Text className="text-xs dark:text-slate-400 text-slate-500">
          ₩{price.toLocaleString()}
        </Text>

        <View className="flex-row justify-between items-center mt-1">
          <View className="flex-row items-center dark:bg-slate-700 bg-slate-100 rounded-lg px-1.5 py-1">
            <TouchableOpacity
              onPress={() => onUpdateQuantity(productId, item.quantity - 1)}
              activeOpacity={0.6}
              className="p-1"
            >
              <Ionicons name="remove" size={16} color="#64748b" />
            </TouchableOpacity>

            <View className="min-w-[28px] items-center justify-center">
              <Text className="text-xs font-bold dark:text-white text-slate-800 text-center">
                {item.quantity}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => onUpdateQuantity(productId, item.quantity + 1)}
              activeOpacity={0.6}
              className="p-1"
            >
              <Ionicons name="add" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text className="text-sm font-bold dark:text-cyan-400 text-sky-700">
            ₩{(price * item.quantity).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
});
