import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { fetchOrders, updateOrderStatus } from "../services";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import {
  formatCurrency,
  truncateId,
  getOrderStatusInfo,
} from "../lib/util";
import { Truck, CheckCircle2, Clock, Filter, AlertCircle, ShoppingCart } from "lucide-react";

const OrdersPage = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: orders, isLoading, isError, error } = useQuery({
    queryKey: ["adminOrders"],
    queryFn: () => fetchOrders(getToken),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatus({ orderId, status, getToken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      alert("주문 상태가 변경되었습니다.");
    },
    onError: (err) => {
      alert(`주문 상태 변경 실패: ${err.message}`);
    },
  });

  const handleStatusChange = useCallback(
    (orderId, newStatus) => {
      if (window.confirm(`주문 상태를 '${newStatus}'(으)로 변경하시겠습니까?`)) {
        updateStatusMutation.mutate({ orderId, status: newStatus });
      }
    },
    [updateStatusMutation]
  );

  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order) => {
      if (statusFilter === "ALL") return true;
      return order.status === statusFilter;
    });
  }, [orders, statusFilter]);

  if (isLoading) return <LoadingSpinner message="주문 내역 목록을 조회하는 중입니다..." />;

  if (isError) {
    return (
      <div className="alert alert-error border border-error/30 text-error-content shadow-lg rounded-2xl">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>에러가 발생했습니다: {error?.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between bg-base-100 border border-base-300 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-base-content/80 uppercase tracking-wider">
            Filter Status:
          </span>
          <div className="join ml-2">
            {["ALL", "pending", "shipped", "delivered"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`btn btn-xs join-item uppercase font-bold ${
                  statusFilter === st ? "btn-primary" : "btn-ghost text-base-content/60"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-base-content/70 font-medium flex items-center gap-1.5">
          <span>총</span>
          <span className="badge badge-primary badge-sm font-bold px-2.5 py-0.5 mx-1">
            {filteredOrders.length}
          </span>
          <span>건의 주문</span>
        </div>
      </div>

      {/* Orders Table or Empty State */}
      {filteredOrders.length > 0 ? (
        <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="table table-sm text-xs text-base-content">
              <thead className="text-[11px] uppercase bg-base-200 text-base-content/80 border-b border-base-300">
                <tr>
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Items</th>
                  <th className="py-4 px-6">Total Price</th>
                  <th className="py-4 px-6">Current Status</th>
                  <th className="py-4 px-6 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {filteredOrders.map((order) => {
                  const { badgeClass } = getOrderStatusInfo(order.status);
                  return (
                    <tr key={order._id} className="hover:bg-base-200/60 transition-colors">
                      <td className="py-4 px-6 font-mono text-base-content/70 font-semibold">
                        {truncateId(order._id)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-base-content text-sm">{order.userId?.name || "고객"}</div>
                        <div className="text-base-content/60 text-[11px]">{order.userId?.email || "-"}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-base-content/80 font-medium max-w-xs">
                          {order.orderItems?.length > 0 ? (
                            order.orderItems.map((item, idx) => (
                              <div key={idx} className="truncate">
                                • {item.productId?.name || "상품"} x {item.quantity}
                              </div>
                            ))
                          ) : (
                            <span className="text-base-content/40">상품 정보 없음</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-base-content text-sm">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`badge badge-sm font-semibold uppercase gap-1 ${badgeClass}`}
                        >
                          {order.status === "delivered" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : order.status === "shipped" ? (
                            <Truck className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {order.status || "pending"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <select
                          value={order.status || "pending"}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          disabled={updateStatusMutation.isPending}
                          className="select select-bordered select-xs bg-base-200 text-base-content font-bold"
                        >
                          <option value="pending">pending (대기)</option>
                          <option value="shipped">shipped (배송중)</option>
                          <option value="delivered">delivered (배송완료)</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ShoppingCart}
          title="주문 정보가 존재하지 않습니다"
          description="현재 접수되거나 선택한 필터 상태에 해당하는 주문 내역이 없습니다."
        />
      )}
    </div>
  );
};

export default OrdersPage;
