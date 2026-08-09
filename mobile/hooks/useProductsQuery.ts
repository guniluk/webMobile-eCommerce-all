import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '../lib/api';
import { Product, Review } from '../types';

export const useProductsQuery = (category?: string, search?: string) => {
  const { getToken, isLoaded } = useAuth();

  return useQuery<Product[]>({
    queryKey: ['products', category || 'All', search || ''],
    queryFn: async () => {
      const token = await getToken();
      return api.getProducts(category, search, token);
    },
    enabled: isLoaded,
  });
};

export const useProductReviewsQuery = (productId?: string | null) => {
  return useQuery<Review[]>({
    queryKey: ['productReviews', productId],
    queryFn: async () => {
      if (!productId) return [];
      return api.getProductReviews(productId);
    },
    enabled: !!productId,
  });
};
