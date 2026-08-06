import axiosInstance from "../lib/axios";
import { getHeaders } from "./apiHelper";

/**
 * 공개 상품 목록 조회
 * @param {Function} getToken - Clerk Token 함수
 * @param {Object} params - 카테고리/검색 쿼리 파라미터 (선택)
 */
export const fetchPublicProducts = async (getToken, params = {}) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get("/api/products", {
      headers,
      params,
    });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.products)) return data.products;
    return data || [];
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "상품 목록을 불러오는데 실패했습니다.",
      { cause: error },
    );
  }
};

/**
 * 단일 상품 상세정보 조회
 */
export const fetchProductById = async (productId, getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get(`/api/products/${productId}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "상품 상세정보를 불러오는데 실패했습니다.",
      { cause: error },
    );
  }
};
