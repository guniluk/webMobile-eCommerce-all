import { useState, useEffect } from "react";
import { Show, useUser } from "@clerk/react";
import { useMutation } from "@tanstack/react-query";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import LoginView from "./components/LoginView";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import CustomersPage from "./pages/CustomersPage";
import LoadingSpinner from "./components/LoadingSpinner";

import { syncUser as syncUserApiService } from "./services";

// services/userApi 기반 유저 동기화 연동
const syncUserApi = async (user) => {
  const email = user.primaryEmailAddress?.emailAddress || "";
  const name =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "User";
  const imageUrl = user.imageUrl || "";

  try {
    return await syncUserApiService({
      clerkId: user.id,
      email,
      name,
      imageUrl,
    });
  } catch (error) {
    console.error("[User Sync Error]", error);
    return null;
  }
};

const App = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const { mutate: syncUser } = useMutation({
    mutationFn: syncUserApi,
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      syncUser(user);
    }
  }, [isLoaded, isSignedIn, user?.id]);

  const renderActivePage = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage setActiveTab={setActiveTab} />;
      case "products":
        return <ProductsPage />;
      case "orders":
        return <OrdersPage />;
      case "customers":
        return <CustomersPage />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-base-300 flex items-center justify-center">
        <LoadingSpinner message="인증 및 시스템 정보를 로딩하는 중입니다..." />
      </div>
    );
  }

  return (
    <>
      {/* 1. Signed-out: 컴포넌트로 분리된 로그인 화면 연동 */}
      <Show when="signed-out">
        <LoginView />
      </Show>

      {/* 2. Signed-in: 로그인 상태일 때 반응형 어드민 웹 포털 화면 */}
      <Show when="signed-in">
        <div className="flex h-screen overflow-hidden bg-base-300 text-base-content font-sans antialiased">
          {/* Left Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            isCollapsed={isSidebarCollapsed}
          />

          {/* Right Main Content Area */}
          <div className="flex-1 flex flex-col h-screen min-w-0 w-full transition-all duration-300 overflow-hidden">
            <Header
              activeTab={activeTab}
              setIsSidebarOpen={setIsSidebarOpen}
              isSidebarCollapsed={isSidebarCollapsed}
              toggleSidebarCollapse={toggleSidebarCollapse}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-base-200/40">
              {renderActivePage()}
            </main>
          </div>
        </div>
      </Show>
    </>
  );
};

export default App;
