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
    staleTime: 1000 * 60 * 5, // 5분 캐싱으로 네트워크 부하 절감
    gcTime: 1000 * 60 * 10,
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
    staleTime: 1000 * 60 * 2, // 2분 캐싱
  });
};
