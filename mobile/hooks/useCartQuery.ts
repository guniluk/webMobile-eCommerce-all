import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '../lib/api';
import { CartResponse } from '../types';

export const useCartQuery = () => {
  const { getToken, isLoaded } = useAuth();

  return useQuery<CartResponse>({
    queryKey: ['cart'],
    queryFn: async () => {
      const token = await getToken();
      return api.getCart(token);
    },
    enabled: isLoaded,
  });
};

export const useAddToCartMutation = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      quantity = 1,
    }: {
      productId: string;
      quantity?: number;
    }) => {
      const token = await getToken();
      return api.addToCart(productId, quantity, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useUpdateCartMutation = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => {
      const token = await getToken();
      return api.updateCartItem(productId, quantity, token);
    },
    onSuccess: (data) => {
      // 💡 서버에서 돌려받은 최신 CartResponse를 쿼리 캐시에 즉시 반영 (추가 refetch 네트워크 요청을 없애 화면 덜컥거림 차단)
      queryClient.setQueryData(['cart'], data);
    },
  });
};

export const useDeleteCartMutation = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const token = await getToken();
      return api.deleteCartItem(productId, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
  });
};

export const useClearCartMutation = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.clearCart(token);
    },
    onSuccess: () => {
      queryClient.setQueryData(['cart'], { items: [] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};
