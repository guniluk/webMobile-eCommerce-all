import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { AxiosRequestConfig, create } from 'axios';
import type {
  Product,
  CartItem,
  CartResponse,
  OrderItem,
  ShippingAddress,
  Address,
  Order,
  UserProfile,
  Review,
} from '../types';

export type {
  Product,
  CartItem,
  CartResponse,
  OrderItem,
  ShippingAddress,
  Address,
  Order,
  UserProfile,
  Review,
};

// ----------------- Base URL Resolver -----------------
export const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }

  return Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000';
};

export const API_BASE_URL = getBaseUrl();

// ----------------- Axios Instance & Core Request Helper -----------------
const axiosInstance = create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
  timeout: 15000,
});

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  token?: string | null,
  config: AxiosRequestConfig = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(config.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await axiosInstance({
      method,
      url: endpoint,
      data,
      ...config,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    return response.data;
  } catch (err: any) {
    const errorMessage =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'API Request Error';
    console.warn(`[Axios API ${method}] ${endpoint}:`, errorMessage);
    throw new Error(errorMessage);
  }
}

// HTTP Short-hand Helpers
const http = {
  get: <T>(
    endpoint: string,
    token?: string | null,
    config?: AxiosRequestConfig,
  ) => request<T>('GET', endpoint, undefined, token, config),
  post: <T>(
    endpoint: string,
    data?: any,
    token?: string | null,
    config?: AxiosRequestConfig,
  ) => request<T>('POST', endpoint, data, token, config),
  put: <T>(
    endpoint: string,
    data?: any,
    token?: string | null,
    config?: AxiosRequestConfig,
  ) => request<T>('PUT', endpoint, data, token, config),
  delete: <T>(
    endpoint: string,
    token?: string | null,
    config?: AxiosRequestConfig,
  ) => request<T>('DELETE', endpoint, undefined, token, config),
};

const normalizeCartResponse = (res: any): CartResponse => {
  const cartObj = res?.cart || res || { items: [] };
  const items = (cartObj?.items || []).map((item: any) => ({
    ...item,
    product: (typeof item.productId === 'object'
      ? item.productId
      : item.product || item.productId) as Product,
  }));
  return { ...cartObj, items };
};

// ----------------- API Service Methods -----------------
let lastSyncedKey = '';

export const api = {
  // 1. 상품 (Products) API
  getProducts: async (
    category?: string,
    search?: string,
    token?: string | null,
  ): Promise<Product[]> => {
    const params: Record<string, string> = {};
    if (category && category !== 'All') params.category = category;
    if (search && search.trim().length >= 2) params.search = search.trim();
    return http.get<Product[]>('/products', token, { params });
  },

  getProductById: (
    productId: string,
    token?: string | null,
  ): Promise<Product> => http.get<Product>(`/products/${productId}`, token),

  // 2. 장바구니 (Cart) API
  getCart: async (token: string | null): Promise<CartResponse> => {
    if (!token) return { items: [] };
    const res = await http.get<any>('/carts', token);
    return normalizeCartResponse(res);
  },

  addToCart: async (
    productId: string,
    quantity: number = 1,
    token: string | null,
  ): Promise<CartResponse> => {
    const res = await http.post<any>('/carts', { productId, quantity }, token);
    return normalizeCartResponse(res);
  },

  updateCartItem: async (
    productId: string,
    quantity: number,
    token: string | null,
  ): Promise<CartResponse> => {
    const res = await http.put<any>(`/carts/${productId}`, { quantity }, token);
    return normalizeCartResponse(res);
  },

  deleteCartItem: async (
    productId: string,
    token: string | null,
  ): Promise<CartResponse> => {
    const res = await http.delete<any>(`/carts/${productId}`, token);
    return normalizeCartResponse(res);
  },

  clearCart: (token: string | null): Promise<void> =>
    http.delete<void>('/carts/clear', token),

  // 3. 주문 (Orders) API
  createOrder: (
    orderData: {
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
    },
    token: string | null,
  ): Promise<Order> => http.post<Order>('/orders', orderData, token),

  getUserOrders: async (token: string | null): Promise<Order[]> => {
    if (!token) return [];
    const res = await http.get<{ orders?: Order[] }>('/orders', token);
    return res?.orders || (Array.isArray(res) ? res : []);
  },

  // 4. 유저 및 프로필 (User & Profile) API
  syncUser: async (
    userData?: { email?: string; name?: string; imageUrl?: string },
    token?: string | null,
  ): Promise<UserProfile> => {
    if (!token) return {} as UserProfile;
    const syncKey = `${userData?.email || ''}_${userData?.name || ''}_${userData?.imageUrl || ''}`;
    if (lastSyncedKey === syncKey) {
      return {} as UserProfile;
    }
    const res = await http.post<UserProfile>(
      '/users/sync',
      userData || {},
      token,
    );
    lastSyncedKey = syncKey;
    return res;
  },

  getProfile: (token: string | null): Promise<UserProfile> => {
    if (!token) return Promise.resolve({} as UserProfile);
    return http.get<UserProfile>('/users/me', token);
  },

  // 5. 위시리스트 (Wishlist) API
  getWishlist: async (token: string | null): Promise<Product[]> => {
    if (!token) return [];
    const res = await http.get<any>('/users/wishlists', token);
    const rawList = res?.wishList || res?.wishlist || (Array.isArray(res) ? res : []);
    return (Array.isArray(rawList) ? rawList : []).filter(Boolean);
  },

  addToWishlist: async (
    productId: string,
    token: string | null,
  ): Promise<Product[]> => {
    const res = await http.post<any>('/users/wishlists', { productId }, token);
    const rawList = res?.wishList || res?.wishlist || (Array.isArray(res) ? res : []);
    return (Array.isArray(rawList) ? rawList : []).filter(Boolean);
  },

  deleteWishlist: async (
    productId: string,
    token: string | null,
  ): Promise<Product[]> => {
    const res = await http.delete<any>(`/users/wishlists/${productId}`, token);
    const rawList = res?.wishList || res?.wishlist || (Array.isArray(res) ? res : []);
    return (Array.isArray(rawList) ? rawList : []).filter(Boolean);
  },

  // 6. 배송지 (Addresses) API
  getAddresses: async (token: string | null): Promise<Address[]> => {
    if (!token) return [];
    const res = await http.get<{ addresses?: Address[] }>(
      '/users/addresses',
      token,
    );
    return res?.addresses || [];
  },

  addAddress: async (
    addressData: Omit<Address, '_id'>,
    token: string | null,
  ): Promise<Address[]> => {
    const res = await http.post<{ addresses?: Address[] }>(
      '/users/addresses',
      addressData,
      token,
    );
    return res?.addresses || [];
  },

  updateAddress: async (
    addressId: string,
    addressData: Partial<Address>,
    token: string | null,
  ): Promise<Address[]> => {
    const res = await http.put<{ addresses?: Address[] }>(
      `/users/addresses/${addressId}`,
      addressData,
      token,
    );
    return res?.addresses || [];
  },

  deleteAddress: async (
    addressId: string,
    token: string | null,
  ): Promise<Address[]> => {
    const res = await http.delete<{ addresses?: Address[] }>(
      `/users/addresses/${addressId}`,
      token,
    );
    return res?.addresses || [];
  },

  // 7. 리뷰 (Reviews) API
  getProductReviews: async (productId: string): Promise<Review[]> => {
    const res = await http.get<{ reviews?: Review[] }>(
      `/reviews/product/${productId}`,
    );
    return res?.reviews || [];
  },

  createReview: (
    reviewData: {
      productId: string;
      orderId: string;
      rating: number;
      comment?: string;
    },
    token: string | null,
  ): Promise<Review> => http.post<Review>('/reviews', reviewData, token),
};
