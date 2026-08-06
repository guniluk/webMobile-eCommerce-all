import axiosInstance from "../lib/axios";
import { getHeaders } from "./apiHelper";

const handleApiError = (error, defaultMessage) => {
  const errorMessage = error.response?.data?.message || defaultMessage;
  throw new Error(errorMessage, { cause: error });
};

/**
 * 주문 생성
 */
export const createOrder = async (orderData, getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.post("/api/orders", orderData, {
      headers,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "주문 요청 처리에 실패했습니다.");
  }
};

/**
 * 내 주문 목록 조회
 */
export const fetchUserOrders = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get("/api/orders", { headers });
    return response.data.orders || response.data || [];
  } catch (error) {
    handleApiError(error, "주문 내역을 불러오는데 실패했습니다.");
  }
};
