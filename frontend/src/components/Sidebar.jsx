import { useState } from 'react';
import { UserButton, useUser, useClerk } from '@clerk/react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Store,
  ChevronRight,
  X,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', icon: Users },
];

const Sidebar = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  isCollapsed = false,
}) => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (setIsOpen) setIsOpen(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    signOut();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Responsive Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-screen bg-base-100 border-r border-base-300 flex flex-col justify-between p-3 select-none transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed
            ? 'w-72 lg:w-20 min-w-0'
            : 'w-72 lg:w-1/5 min-w-60 max-w-xs'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } px-2 py-3 mb-4 border-b border-base-300 transition-all`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary text-primary-content rounded-2xl shadow-lg shrink-0">
              <Store className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <div className="transition-all duration-200">
                <h1 className="text-lg font-bold text-base-content tracking-tight">
                  Admin Portal
                </h1>
                <p className="text-xs text-primary font-bold">
                  E-Commerce Suite
                </p>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          {!isCollapsed && (
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 mb-2 text-xs font-bold text-base-content/60 uppercase tracking-wider">
              Main Menu
            </div>
          )}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                title={isCollapsed ? item.label : ''}
                className={`w-full flex items-center ${
                  isCollapsed
                    ? 'justify-center px-0 py-3'
                    : 'justify-between px-4 py-3.5'
                } rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-content shadow-lg shadow-primary/20'
                    : 'text-base-content/80 hover:bg-base-200 hover:text-primary'
                }`}
              >
                <div
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-primary-content' : 'text-base-content/60'
                    }`}
                  />
                  {!isCollapsed && (
                    <span
                      className={
                        isActive ? 'text-primary-content font-extrabold' : ''
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </div>

                {!isCollapsed && isActive && (
                  <ChevronRight className="w-4 h-4 text-primary-content opacity-90" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="mt-auto border-t border-base-300 pt-3 px-1 space-y-2">
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center p-1.5' : 'justify-between p-2'
            } rounded-2xl bg-base-200 border border-base-300`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-0.5 bg-base-100 rounded-full border border-base-300 shrink-0">
                <UserButton />
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <p className="text-xs font-extrabold text-base-content truncate">
                    {user?.fullName || user?.firstName || 'Admin User'}
                  </p>
                  <p className="text-[10px] text-primary font-bold truncate">
                    {user?.primaryEmailAddress?.emailAddress || 'System Admin'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Logout Button triggering confirmation modal */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`btn btn-error btn-outline btn-sm w-full rounded-2xl font-bold ${
              isCollapsed ? 'px-0 justify-center' : 'gap-2'
            } cursor-pointer shadow-sm`}
            title={isCollapsed ? 'Sign Out' : ''}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn">
          <div className="bg-base-100 border border-base-300 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 transform transition-all scale-100">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-error/15 text-error rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-base-content tracking-tight">
                  로그아웃 확인
                </h3>
                <p className="text-xs text-base-content/70 font-medium mt-0.5">
                  정말 로그아웃 하시겠습니까?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-base-200">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="btn btn-ghost btn-sm rounded-xl font-bold px-4"
              >
                취소
              </button>
              <button
                onClick={handleConfirmLogout}
                className="btn btn-error btn-sm rounded-xl font-bold px-5 text-white shadow-md shadow-error/20 cursor-pointer"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
