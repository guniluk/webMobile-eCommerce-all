import axiosInstance from "../lib/axios";
import { getHeaders } from "./apiHelper";

const handleApiError = (error, defaultMessage) => {
  const errorMessage = error.response?.data?.message || defaultMessage;
  throw new Error(errorMessage, { cause: error });
};

/**
 * 리뷰 작성
 */
export const createReview = async ({ productId, rating, comment }, getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.post(
      "/api/reviews",
      { productId, rating, comment },
      { headers }
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "리뷰 작성에 실패했습니다.");
  }
};

/**
 * 리뷰 삭제
 */
export const deleteReview = async (reviewId, getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.delete(`/api/reviews/${reviewId}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "리뷰 삭제에 실패했습니다.");
  }
};
