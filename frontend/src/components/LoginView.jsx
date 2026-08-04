import { SignInButton } from "@clerk/react";
import {
  LogIn,
  Lock,
  Store,
  ShieldCheck,
  Zap,
  BarChart3,
  Users,
  Sparkles,
} from "lucide-react";

const LoginView = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-emerald-950 text-slate-100 flex items-center justify-center p-4 sm:p-8 select-none relative overflow-hidden">
      {/* Vivid Colorful Gradient Glow Orbs */}
      <div className="absolute top-1/6 left-1/4 w-125 h-125 bg-indigo-600/30 rounded-full blur-[130px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/6 right-1/4 w-125 h-125 bg-emerald-500/25 rounded-full blur-[130px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 bg-purple-600/20 rounded-full blur-[110px] pointer-events-none"></div>

      {/* Main Glassmorphic Colorful Login Card */}
      <div className="card w-full max-w-lg bg-slate-900/85 backdrop-blur-2xl border border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.25)] p-8 sm:p-10 relative z-10 rounded-[2.5rem] space-y-8">
        {/* Top Brand Logo with Vibrant Gradient */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-4.5 bg-linear-to-tr from-indigo-500 via-purple-500 to-emerald-400 text-white rounded-3xl shadow-xl shadow-indigo-500/40 ring-4 ring-indigo-500/20">
            <Store className="w-12 h-12" />
          </div>
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-linear-to-r from-indigo-500/20 to-emerald-500/20 border border-indigo-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider mb-3 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Secure Admin Access</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black bg-linear-to-r from-indigo-300 via-purple-200 to-emerald-300 bg-clip-text text-transparent tracking-tight">
              Admin Suite Portal
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-300 mt-2">
              이커머스 통합 관리자 시스템에 오신 것을 환영합니다
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid with Rich Colors */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-center shadow-inner">
          <div className="flex flex-col items-center gap-1.5 p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span className="text-[11px] font-bold text-indigo-200">
              실시간 대시보드
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="text-[11px] font-bold text-purple-200">
              상품/주문 관리
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-200">
              고객 데이터 분석
            </span>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-slate-800/90 border border-indigo-500/30 rounded-2xl text-xs text-slate-200 flex items-center gap-3 text-left shadow-md">
          <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <span className="leading-relaxed font-medium">
            인가된 보안 관리자 계정으로 로그인 시 대시보드의 모든 제어 권한이
            활성화됩니다.
          </span>
        </div>

        {/* Login Action Button with Vibrant Gradient */}
        <SignInButton mode="modal">
          <button className="w-full py-4 px-6 bg-linear-to-r from-indigo-600 via-purple-600 to-emerald-500 hover:from-indigo-500 hover:via-purple-500 hover:to-emerald-400 active:scale-95 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-600/40 gap-3 cursor-pointer transition-all duration-300 flex items-center justify-center hover:shadow-emerald-500/30">
            <LogIn className="w-5 h-5" />
            <span>관리자 인증 로그인 / 회원가입</span>
            <Sparkles className="w-4 h-4 text-emerald-200" />
          </button>
        </SignInButton>

        {/* Footer Tag */}
        <div className="text-center pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-400 font-semibold">
            Protected by E-Commerce Admin Auth Gateway v1.0
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
