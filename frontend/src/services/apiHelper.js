import axiosInstance from '../lib/axios';

/**
 * Clerk Auth Token을 가져와 HTTP 요청 헤더 객체를 생성하는 헬퍼 함수
 * @param {Function} getToken - Clerk useAuth().getToken 함수
 * @returns {Promise<Object>} axios request config headers
 */
export const getHeaders = async (getToken) => {
  const headers = {};
  if (getToken) {
    try {
      const token = await getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('[API Helper] Failed to acquire Auth token:', e);
    }
  }
  return headers;
};

export default axiosInstance;
