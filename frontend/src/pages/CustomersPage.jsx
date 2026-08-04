import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { fetchCustomers } from "../services/adminApi";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { Users, Search, Mail, Calendar, UserCheck, AlertCircle, UserX } from "lucide-react";

const CustomersPage = () => {
  const { getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers, isLoading, isError, error } = useQuery({
    queryKey: ["adminCustomers"],
    queryFn: () => fetchCustomers(getToken),
  });

  const filteredCustomers = (customers || []).filter((cust) => {
    const nameMatch = cust.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = cust.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || emailMatch;
  });

  if (isLoading) return <LoadingSpinner message="고객 회원 데이터를 불러오는 중입니다..." />;

  if (isError) {
    return (
      <div className="alert alert-error border border-rose-500/30 text-rose-200">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>에러가 발생했습니다: {error?.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
          <input
            type="text"
            placeholder="이름 또는 이메일 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-sm input-bordered w-full bg-slate-800 text-slate-200 text-xs pl-9 pr-4"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium hidden sm:block">
          전체 회원 수: <span className="badge badge-warning badge-sm font-bold">{filteredCustomers.length}</span>명
        </div>
      </div>

      {/* Customer Grid Cards or Empty State */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer._id || customer.email}
              className="card bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl hover:border-slate-700 transition-all duration-300 group"
            >
              <div className="card-body p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="avatar">
                      {customer.imageUrl ? (
                        <div className="w-14 h-14 rounded-2xl border border-slate-700 shadow-md group-hover:scale-105 transition-transform">
                          <img src={customer.imageUrl} alt={customer.name} />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                          {customer.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                        {customer.name || "익명 회원"}
                      </h4>
                      <span className="badge badge-success badge-sm gap-1 mt-1 font-semibold">
                        <UserCheck className="w-3 h-3" /> Active Member
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate text-slate-300 font-medium">
                        {customer.email || "이메일 정보 없음"}
                      </span>
                    </div>
                    {customer.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="text-slate-400">
                          가입일: {new Date(customer.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-actions justify-end mt-6 pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => alert(`고객 [${customer.name}] 상세 정보 페이지 준비 중`)}
                    className="btn btn-ghost btn-xs border border-slate-700 text-slate-300 font-semibold"
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
