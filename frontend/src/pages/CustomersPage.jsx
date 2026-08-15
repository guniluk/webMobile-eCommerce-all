import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { fetchCustomers } from "../services";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import WishlistModal from "../components/WishlistModal";
import { formatDate } from "../lib/util";
import {
  Search,
  Mail,
  Calendar,
  MapPin,
  Heart,
  UserX,
  AlertCircle,
  Users,
} from "lucide-react";

const CustomersPage = () => {
  const { getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // 💖 위시리스트 상세보기 모달 상태
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

  const {
    data: customers,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["adminCustomers"],
    queryFn: () => fetchCustomers(getToken),
  });

  const filteredCustomers = useMemo(() => {
    return (customers || []).filter((customerItem) => {
      const nameMatch = customerItem.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const emailMatch = customerItem.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      return nameMatch || emailMatch;
    });
  }, [customers, searchTerm]);

  const handleOpenWishlistModal = useCallback((customer) => {
    setSelectedCustomer(customer);
    setIsWishlistModalOpen(true);
  }, []);

  const handleCloseWishlistModal = useCallback(() => {
    setIsWishlistModalOpen(false);
    setSelectedCustomer(null);
  }, []);

  // 주소 포맷팅 헬퍼 함수
  const formatAddress = (addresses) => {
    if (!addresses || addresses.length === 0) return null;
    const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
    if (!defaultAddr) return null;
    const parts = [
      defaultAddr.streetAddress,
      defaultAddr.city,
      defaultAddr.state,
    ].filter(Boolean);
    return parts.join(", ");
  };

  if (isLoading)
    return <LoadingSpinner message="고객 회원 데이터를 불러오는 중입니다..." />;

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
      {/* Top Bar with Search & Customer Counter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-base-100 border border-base-300 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="relative flex-1 min-w-0 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-base-content/50 absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
          <input
            type="text"
            placeholder="이름 또는 이메일 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-sm input-bordered w-full min-w-0 bg-base-200 text-base-content text-sm sm:text-xs pl-9 pr-4 focus:outline-primary placeholder:text-base-content/40 transition-all"
          />
        </div>

        <div className="text-xs text-base-content/70 font-medium flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <Users className="w-4 h-4 text-primary" />
          <span>전체 회원 수:</span>
          <span className="badge badge-primary badge-sm font-bold px-2.5 py-0.5 mx-1 shadow-sm">
            {filteredCustomers.length}
          </span>
          <span>명</span>
        </div>
      </div>

      {/* Customers Table or Empty State */}
      {filteredCustomers.length > 0 ? (
        <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto w-full">
            <table className="table table-sm text-xs text-base-content min-w-162.5 w-full">
              <thead className="text-[11px] uppercase bg-base-200 text-base-content/80 border-b border-base-300">
                <tr>
                  <th className="py-4 px-6 w-1/4">Customer</th>
                  <th className="py-4 px-6 w-1/4">Email</th>
                  <th className="py-4 px-6 w-1/3">Address</th>
                  <th className="py-4 px-6 whitespace-nowrap">Wish List</th>
                  <th className="py-4 px-6 text-right whitespace-nowrap">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {filteredCustomers.map((customer) => {
                  const addressStr = formatAddress(customer.addresses);
                  const wishListCount = customer.wishList?.length || 0;

                  return (
                    <tr
                      key={customer._id || customer.email}
                      className="hover:bg-base-200/60 transition-colors"
                    >
                      {/* Customer Column */}
                      <td className="py-4 px-6 max-w-50">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="avatar shrink-0">
                            {customer.imageUrl ? (
                              <div className="w-10 h-10 rounded-full border border-base-300 shadow-sm overflow-hidden">
                                <img
                                  src={customer.imageUrl}
                                  alt={customer.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = "none";
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shadow-sm border border-primary/20">
                                {customer.name?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className="font-bold text-base-content text-sm truncate"
                              title={customer.name || "익명 회원"}
                            >
                              {customer.name || "익명 회원"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email Column */}
                      <td className="py-4 px-6 max-w-55">
                        <div
                          className="flex items-center gap-2 text-base-content/80 font-medium min-w-0"
                          title={customer.email || "-"}
                        >
                          <Mail className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                          <span className="truncate">{customer.email || "-"}</span>
                        </div>
                      </td>

                      {/* Address Column */}
                      <td className="py-4 px-6 max-w-65">
                        {addressStr ? (
                          <div
                            className="flex items-start gap-1.5 text-base-content/80 min-w-0"
                            title={addressStr}
                          >
                            <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0 mt-0.5" />
                            <span className="truncate">{addressStr}</span>
                          </div>
                        ) : (
                          <span className="text-base-content/40 italic whitespace-nowrap">주소 미등록</span>
                        )}
                      </td>

                      {/* Wish List Column (클릭 시 모달 오픈) */}
                      <td className="py-4 px-6 whitespace-nowrap shrink-0">
                        <button
                          onClick={() => handleOpenWishlistModal(customer)}
                          className="flex items-center gap-1 group cursor-pointer border-none bg-transparent p-0"
                          title={`${customer.name || "고객"} 님의 위시리스트 상세보기`}
                        >
                          <span className="badge badge-primary/15 text-primary border border-primary/30 group-hover:bg-primary/25 group-hover:border-primary/50 badge-sm font-semibold gap-1 px-2.5 py-3 transition-all active:scale-95 shadow-sm">
                            <Heart className="w-3 h-3 text-primary fill-primary/30 group-hover:fill-primary/60 transition-all" />
                            {wishListCount} 개 항목
                          </span>
                        </button>
                      </td>

                      {/* Joined Date Column */}
                      <td className="py-4 px-6 text-right font-medium text-base-content/70 whitespace-nowrap shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                          <span>{formatDate(customer.createdAt)}</span>
                        </div>
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
          icon={UserX}
          title="등록된 고객 회원이 없습니다"
          description="현재 데이터베이스에 등록된 고객 회원이 없거나 검색 조건에 맞는 결과가 없습니다."
        />
      )}

      {/* 💖 위시리스트 모달 */}
      <WishlistModal
        isOpen={isWishlistModalOpen}
        onClose={handleCloseWishlistModal}
        customer={selectedCustomer}
      />
    </div>
  );
};

export default CustomersPage;
