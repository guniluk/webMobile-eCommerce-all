import axiosInstance from '../lib/axios';
import { getHeaders } from './apiHelper';

const handleApiError = (error, defaultMessage) => {
  const errorMessage = error.response?.data?.message || defaultMessage;
  throw new Error(errorMessage, { cause: error });
};

/**
 * 유저 정보 동기화 (MongoDB Upsert)
 */
export const syncUser = async (userData) => {
  try {
    const response = await axiosInstance.post('/api/users/sync', userData);
    return response.data;
  } catch (error) {
    handleApiError(error, '유저 동기화에 실패했습니다.');
  }
};

/**
 * 내 프로필 정보 조회
 */
export const fetchUserProfile = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get('/api/users/me', { headers });
    return response.data;
  } catch (error) {
    handleApiError(error, '프로필 정보를 불러오는데 실패했습니다.');
  }
};

/**
 * 배송지 목록 조회
 */
export const fetchAddresses = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get('/api/users/addresses', {
      headers,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, '배송지 목록을 불러오는데 실패했습니다.');
  }
};

/**
 * 배송지 추가
 */
export const addAddress = async (addressData, getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.post(
      '/api/users/addresses',
      addressData,
      {
        headers,
      },
    );
    return response.data;
  } catch (error) {
    handleApiError(error, '배송지 추가에 실패했습니다.');
  }
};

/**
 * 배송지 수정
 */
export const updateAddress = async ({ addressId, addressData }, getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.put(
      `/api/users/addresses/${addressId}`,
      addressData,
      { headers },
    );
    return response.data;
  } catch (error) {
    handleApiError(error, '배송지 수정에 실패했습니다.');
  }
};

/**
 * 배송지 삭제
 */
export const deleteAddress = async (addressId, getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.delete(
      `/api/users/addresses/${addressId}`,
      {
        headers,
      },
    );
    return response.data;
  } catch (error) {
    handleApiError(error, '배송지 삭제에 실패했습니다.');
  }
};

/**
 * 위시리스트 목록 조회
 */
export const fetchWishlists = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get('/api/users/wishlists', {
      headers,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, '위시리스트 목록을 불러오는데 실패했습니다.');
  }
};

/**
 * 위시리스트 상품 추가
 */
export const addWishlist = async (productId, getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.post(
      '/api/users/wishlists',
      { productId },
      { headers },
    );
    return response.data;
  } catch (error) {
    handleApiError(error, '위시리스트 추가에 실패했습니다.');
  }
};

/**
 * 위시리스트 상품 삭제
 */
export const deleteWishlist = async (productId, getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.delete(
      `/api/users/wishlists/${productId}`,
      {
        headers,
      },
    );
    return response.data;
  } catch (error) {
    handleApiError(error, '위시리스트 삭제에 실패했습니다.');
  }
};
