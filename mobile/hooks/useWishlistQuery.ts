import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '../lib/api';
import { Product } from '../types';

export const useWishlistQuery = () => {
  const { getToken, isLoaded } = useAuth();

  return useQuery<Product[]>({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const token = await getToken();
      return api.getWishlist(token);
    },
    enabled: isLoaded,
  });
};

export const useToggleWishlistMutation = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      isWished,
    }: {
      productId: string;
      isWished: boolean;
    }) => {
      const token = await getToken();
      if (isWished) {
        return api.deleteWishlist(productId, token);
      } else {
        return api.addToWishlist(productId, token);
      }
    },
    onSuccess: (updatedWishlist) => {
      queryClient.setQueryData(['wishlist'], updatedWishlist);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};

export const useDeleteWishlistMutation = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const token = await getToken();
      return api.deleteWishlist(productId, token);
    },
    onSuccess: (updatedWishlist) => {
      queryClient.setQueryData(['wishlist'], updatedWishlist);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};
