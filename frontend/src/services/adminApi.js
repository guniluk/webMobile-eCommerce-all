import axiosInstance from "../lib/axios";

// Helper to construct headers with Clerk Auth Token
const getHeaders = async (getToken) => {
  const headers = {};
  if (getToken) {
    try {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("[Admin API] Failed to get Auth token:", e);
    }
  }
  return headers;
};

export const fetchDashboardStats = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get("/api/admin/stats", { headers });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "대시보드 통계를 불러오는데 실패했습니다.",
      { cause: error },
    );
  }
};

export const fetchProducts = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get("/api/admin/products", {
      headers,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "상품 목록을 불러오는데 실패했습니다.",
      { cause: error },
    );
  }
};

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
    throw new Error(
      error.response?.data?.message || "상품 등록에 실패했습니다.",
      { cause: error },
    );
  }
};

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
    throw new Error(
      error.response?.data?.message || "상품 수정에 실패했습니다.",
      { cause: error },
    );
  }
};

export const fetchOrders = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get("/api/admin/orders", { headers });
    return response.data.orders || [];
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "주문 목록을 불러오는데 실패했습니다.",
      { cause: error },
    );
  }
};

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
    throw new Error(
      error.response?.data?.message || "주문 상태 업데이트에 실패했습니다.",
      { cause: error },
    );
  }
};

export const fetchCustomers = async (getToken) => {
  try {
    const headers = await getHeaders(getToken);
    const response = await axiosInstance.get("/api/admin/customers", {
      headers,
    });
    return response.data.customers || [];
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "고객 목록을 불러오는데 실패했습니다.",
      { cause: error },
    );
  }
};
