import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { fetchCustomers } from "../services";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { formatDate } from "../lib/util";
import {
  Search,
  Mail,
  Calendar,
  UserCheck,
  AlertCircle,
  UserX,
} from "lucide-react";

const CustomersPage = () => {
  const { getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

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
    return (customers || []).filter((cust) => {
      const nameMatch = cust.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const emailMatch = cust.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      return nameMatch || emailMatch;
    });
  }, [customers, searchTerm]);

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
      {/* Search Header */}
      <div className="flex items-center justify-between bg-base-100 border border-base-300 p-5 rounded-2xl shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-base-content/50 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
          <input
            type="text"
            placeholder="이름 또는 이메일 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-sm input-bordered w-full bg-base-200 text-base-content text-xs pl-9 pr-4"
          />
        </div>

        <div className="text-xs text-base-content/70 font-medium hidden sm:flex items-center gap-1.5">
          <span>전체 회원 수:</span>
          <span className="badge badge-warning badge-sm font-bold px-2.5 py-0.5 mx-1">
            {filteredCustomers.length}
          </span>
          <span>명</span>
        </div>
      </div>

      {/* Customer Grid Cards or Empty State */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer._id || customer.email}
              className="card bg-base-100 border border-base-300 rounded-2xl shadow-xl hover:border-primary/50 transition-all duration-300 group"
            >
              <div className="card-body p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="avatar">
                      {customer.imageUrl ? (
                        <div className="w-14 h-14 rounded-2xl border border-base-300 shadow-md group-hover:scale-105 transition-transform overflow-hidden">
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
                        <div className="w-14 h-14 rounded-2xl bg-primary text-primary-content flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                          {customer.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-base-content group-hover:text-primary transition-colors">
                        {customer.name || "익명 회원"}
                      </h4>
                      <span className="badge badge-success badge-sm gap-1 mt-1 font-semibold">
                        <UserCheck className="w-3 h-3" /> Active Member
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-base-300 pt-4 text-xs text-base-content/70">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-base-content/50 shrink-0" />
                      <span className="truncate text-base-content font-medium">
                        {customer.email || "이메일 정보 없음"}
                      </span>
                    </div>
                    {customer.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-base-content/50 shrink-0" />
                        <span className="text-base-content/70">
                          가입일: {formatDate(customer.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-actions justify-end mt-6 pt-4 border-t border-base-300">
                  <button
                    onClick={() =>
                      alert(`고객 [${customer.name}] 상세 정보 페이지 준비 중`)
                    }
                    className="btn btn-ghost btn-xs border border-base-300 text-base-content font-semibold hover:border-primary"
                  >
                    상세 보기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UserX}
          title="등록된 고객 회원이 없습니다"
          description="현재 데이터베이스에 등록된 고객 회원이 없거나 검색 조건에 맞는 결과가 없습니다."
        />
      )}
    </div>
  );
};

export default CustomersPage;
