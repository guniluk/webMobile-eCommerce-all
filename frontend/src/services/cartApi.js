import axiosInstance from "../lib/axios";
import { getHeaders } from "./apiHelper";

const handleApiError = (error, defaultMessage) => {
  const errorMessage = error.response?.data?.message || defaultMessage;
  throw new Error(errorMessage, { cause: error });
};

/**
 * 장바구니 조회
 */
export const fetchCart = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get("/api/carts", { headers });
    return response.data;
  } catch (error) {
    handleApiError(error, "장바구니 정보를 불러오는데 실패했습니다.");
  }
};

/**
 * 장바구니 상품 추가
 */
export const addToCart = async ({ productId, quantity = 1, size, color }, getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.post(
      "/api/carts",
      { productId, quantity, size, color },
      { headers }
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "장바구니 추가에 실패했습니다.");
  }
};

/**
 * 장바구니 수량 수정
 */
export const updateCartItem = async ({ productId, quantity }, getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.put(
      `/api/carts/${productId}`,
      { quantity },
      { headers }
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "수량 수정에 실패했습니다.");
  }
};

/**
 * 장바구니 개별 상품 삭제
 */
export const deleteCartItem = async (productId, getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.delete(`/api/carts/${productId}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "장바구니 상품 삭제에 실패했습니다.");
  }
};

/**
 * 장바구니 전체 삭제
 */
export const clearCart = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.delete("/api/carts", { headers });
    return response.data;
  } catch (error) {
    handleApiError(error, "장바구니 비우기에 실패했습니다.");
  }
};
