import React from "react";

const LoadingSpinner = ({ message = "데이터를 불러오는 중..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <span className="text-sm font-medium text-slate-300">{message}</span>
    </div>
  );
};

export default LoadingSpinner;
