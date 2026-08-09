import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '../lib/api';
import { Order, ShippingAddress } from '../types';

export const useOrdersQuery = () => {
  const { getToken, isLoaded } = useAuth();

  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const token = await getToken();
      return api.getUserOrders(token);
    },
    enabled: isLoaded,
  });
};

export const useCreateOrderMutation = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: {
      orderItems: {
        productId?: string;
        product?: string;
        name?: string;
        quantity: number;
        price: number;
        image?: string;
      }[];
      shippingAddress?: ShippingAddress;
      paymentMethod?: string;
      paymentResult?: {
        id?: string;
        status?: string;
        update_time?: string;
        email_address?: string;
      };
      totalPrice: number;
    }) => {
      const token = await getToken();
      return api.createOrder(orderData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};
