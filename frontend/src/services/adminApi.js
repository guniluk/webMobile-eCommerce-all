import axiosInstance from "../lib/axios";
import { getHeaders } from "./apiHelper";

/**
 * API 호출 에러 메시지 통합 처리 헬퍼
 */
const handleApiError = (error, defaultMessage) => {
  const errorMessage =
    error.response?.data?.message ||
    error.response?.data?.error ||
    defaultMessage;
  throw new Error(errorMessage, { cause: error });
};

/**
 * 관리자 대시보드 통계 조회
 */
export const fetchDashboardStats = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get("/api/admin/stats", { headers });
    return response.data;
  } catch (error) {
    handleApiError(error, "대시보드 통계를 불러오는데 실패했습니다.");
  }
};

/**
 * 관리자 상품 목록 조회
 */
export const fetchProducts = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get("/api/admin/products", {
      headers,
    });
    return Array.isArray(response.data)
      ? response.data
      : response.data?.products || [];
  } catch (error) {
    handleApiError(error, "상품 목록을 불러오는데 실패했습니다.");
  }
};

/**
 * 신규 상품 생성
 */
export const createProduct = async ({ productData, getToken }) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.post(
      "/api/admin/products",
      productData,
      { headers },
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "상품 등록에 실패했습니다.");
  }
};

/**
 * 기존 상품 정보 수정
 */
export const updateProduct = async ({ productId, productData, getToken }) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.put(
      `/api/admin/products/${productId}`,
      productData,
      { headers },
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "상품 수정에 실패했습니다.");
  }
};

/**
 * 기존 상품 삭제
 */
export const deleteProduct = async ({ productId, getToken }) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.delete(
      `/api/admin/products/${productId}`,
      { headers },
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "상품 삭제에 실패했습니다.");
  }
};

/**
 * 관리자 전체 주문 목록 조회
 */
export const fetchOrders = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get("/api/admin/orders", { headers });
    return (
      response.data?.orders ||
      (Array.isArray(response.data) ? response.data : [])
    );
  } catch (error) {
    handleApiError(error, "주문 목록을 불러오는데 실패했습니다.");
  }
};

/**
 * 주문 배송/진행 상태 업데이트
 */
export const updateOrderStatus = async ({ orderId, status, getToken }) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.patch(
      `/api/admin/orders/${orderId}/status`,
      { status },
      { headers },
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "주문 상태 업데이트에 실패했습니다.");
  }
};

/**
 * 관리자 고객 회원 목록 조회
 */
export const fetchCustomers = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get("/api/admin/customers", {
      headers,
    });
    return (
      response.data?.customers ||
      (Array.isArray(response.data) ? response.data : [])
    );
  } catch (error) {
    handleApiError(error, "고객 목록을 불러오는데 실패했습니다.");
  }
};
