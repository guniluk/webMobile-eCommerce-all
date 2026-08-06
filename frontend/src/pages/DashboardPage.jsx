import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { fetchDashboardStats, fetchOrders } from "../services";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import {
  formatCurrency,
  formatDate,
  truncateId,
  getOrderStatusInfo,
} from "../lib/util";
import {
  DollarSign,
  ShoppingBag,
  PackageCheck,
  Users,
  AlertCircle,
  PackageX,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const DashboardPage = ({ setActiveTab }) => {
  const { getToken } = useAuth();

  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
  } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => fetchDashboardStats(getToken),
  });

  const { data: recentOrders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["adminOrders"],
    queryFn: () => fetchOrders(getToken),
  });

  if (isStatsLoading || isOrdersLoading) {
    return (
      <LoadingSpinner message="대시보드 통계 및 주문 데이터를 로딩하고 있습니다..." />
    );
  }

  if (isStatsError) {
    return (
      <div className="alert alert-error border border-rose-500/30 text-rose-200 text-sm rounded-2xl shadow-lg">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>백엔드 연동 에러: {statsError?.message}</span>
      </div>
    );
  }

  const statCards = [
    {
      titleKo: "총 매출액",
      titleEn: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      badgeColor: "badge-success",
    },
    {
      titleKo: "총 주문 건수",
      titleEn: "Total Orders",
      value: `${(stats?.totalOrders || 0).toLocaleString()}건`,
      icon: ShoppingBag,
      badgeColor: "badge-primary",
    },
    {
      titleKo: "등록 상품 수",
      titleEn: "Total Products",
      value: `${(stats?.totalProducts || 0).toLocaleString()}개`,
      icon: PackageCheck,
      badgeColor: "badge-secondary",
    },
    {
      titleKo: "총 고객수",
      titleEn: "Total Customers",
      value: `${(stats?.totalCustomers || 0).toLocaleString()}명`,
      icon: Users,
      badgeColor: "badge-warning",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="card bg-base-100 border border-base-300 p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-primary/60 hover:shadow-2xl rounded-3xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-base-content/80 leading-snug">
                    <div>{card.titleKo}</div>
                    <div className="text-xs font-medium text-base-content/60 mt-0.5">
                      ({card.titleEn})
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-base-content mt-3 tracking-tight">
                    {card.value}
                  </h3>
                </div>
                <div className="p-3.5 rounded-2xl shadow-lg shrink-0 bg-primary text-primary-content">
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Preview & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-base-100 border border-base-300 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-base-content flex items-center gap-2">
                  <span>최근 주문 내역</span>
                  <span className="text-sm font-normal text-base-content/60">
                    (Recent Orders)
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-base-content/70 mt-1">
                  실시간으로 들어온 최신 고객 주문 정보입니다.
                </p>
              </div>
              {recentOrders && recentOrders.length > 0 && (
                <button
                  onClick={() => setActiveTab("orders")}
                  className="btn btn-primary btn-outline btn-sm font-bold gap-1 rounded-xl"
                >
                  <span>전체 보기</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {recentOrders && recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table w-full text-sm text-base-content">
                  <thead className="text-xs uppercase bg-base-200 text-base-content/80 border-b border-base-300">
                    <tr>
                      <th className="py-3.5 px-4 rounded-l-xl">주문 번호</th>
                      <th className="py-3.5 px-4">고객 정보</th>
                      <th className="py-3.5 px-4">주문 상품 (Items)</th>
                      <th className="py-3.5 px-4">주문 일시 (Date)</th>
                      <th className="py-3.5 px-4">결제 금액</th>
                      <th className="py-3.5 px-4 rounded-r-xl">주문 상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-300">
                    {recentOrders.slice(0, 5).map((order) => {
                      const { badgeClass, label } = getOrderStatusInfo(
                        order.status
                      );
                      return (
                        <tr
                          key={order._id}
                          className="hover:bg-base-200/60 transition-colors"
                        >
                          <td className="font-mono text-base-content/70 font-semibold">
                            {truncateId(order._id)}
                          </td>
                          <td className="font-semibold text-base-content">
                            <div>{order.userId?.name || "고객 회원"}</div>
                            {order.userId?.email && (
                              <div className="text-[11px] text-base-content/50 font-normal truncate max-w-30">
                                {order.userId.email}
                              </div>
                            )}
                          </td>
                          <td className="text-xs text-base-content/80 max-w-50">
                            {order.orderItems && order.orderItems.length > 0 ? (
                              <div className="space-y-0.5">
                                {order.orderItems.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="truncate font-medium"
                                  >
                                    • {item.productId?.name || "상품"}{" "}
                                    <span className="text-primary font-bold">
                                      x{item.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-base-content/40">-</span>
                            )}
                          </td>
                          <td className="text-xs text-base-content/70 font-medium whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="font-bold text-base-content text-base">
                            {formatCurrency(order.totalPrice)}
                          </td>
                          <td>
                            <span
                              className={`badge badge-md font-bold uppercase ${badgeClass}`}
                            >
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={PackageX}
                title="최근 주문 내역이 없습니다"
                description="아직 들어온 최신 주문 정보가 없습니다."
                actionLabel="주문 관리 페이지로 이동"
                onAction={() => setActiveTab("orders")}
              />
            )}
          </div>
        </div>

        {/* Quick Management Panel */}
        <div className="bg-base-100 border border-base-300 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-extrabold text-base-content">
                빠른 작업 (Quick Actions)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-base-content/70 mb-6">
              자주 사용하는 어드민 핵심 바로가기 메뉴
            </p>

            <div className="space-y-3.5">
              <button
                onClick={() => setActiveTab("products")}
                className="w-full p-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-2xl text-left flex items-center justify-between group transition-all cursor-pointer shadow-sm"
              >
                <div>
                  <h4 className="text-base font-bold text-primary">
                    신규 상품 등록하기
                  </h4>
                  <p className="text-xs text-base-content/70 mt-1">
                    새로운 카탈로그 상품 추가 및 관리
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className="w-full p-4 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 rounded-2xl text-left flex items-center justify-between group transition-all cursor-pointer shadow-sm"
              >
                <div>
                  <h4 className="text-base font-bold text-secondary">
                    주문/배송 상태 관리
                  </h4>
                  <p className="text-xs text-base-content/70 mt-1">
                    배송 대기 중인 고객 주문 처리
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-secondary group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setActiveTab("customers")}
                className="w-full p-4 bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-2xl text-left flex items-center justify-between group transition-all cursor-pointer shadow-sm"
              >
                <div>
                  <h4 className="text-base font-bold text-accent">
                    고객 회원 조회
                  </h4>
                  <p className="text-xs text-base-content/70 mt-1">
                    가입된 회원 목록 및 상세 확인
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
