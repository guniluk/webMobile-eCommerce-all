import { UserButton, SignOutButton, useUser } from "@clerk/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Store,
  ChevronRight,
  X,
  LogOut,
} from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "customers", label: "Customers", icon: Users },
];

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { user } = useUser();

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (setIsOpen) setIsOpen(false);
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
        className={`fixed lg:static top-0 left-0 z-50 h-screen w-72 lg:w-1/5 min-w-60 max-w-xs bg-base-100 border-r border-base-300 flex flex-col p-4 select-none transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-3 py-4 mb-6 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary text-primary-content rounded-2xl shadow-lg">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-base-content tracking-tight">
                Admin Portal
              </h1>
              <p className="text-xs text-primary font-bold">E-Commerce Suite</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-2 text-xs font-bold text-base-content/60 uppercase tracking-wider">
            Main Menu
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-content shadow-lg shadow-primary/20"
                    : "text-base-content/80 hover:bg-base-200 hover:text-primary"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-primary-content" : "text-base-content/60"
                    }`}
                  />
                  <span
                    className={
                      isActive ? "text-primary-content font-extrabold" : ""
                    }
                  >
                    {item.label}
                  </span>
                </div>

                {isActive && (
                  <ChevronRight className="w-4 h-4 text-primary-content opacity-90" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="mt-auto border-t border-base-300 pt-4 px-1 space-y-3">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-base-200 border border-base-300">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-0.5 bg-base-100 rounded-full border border-base-300 shrink-0">
                <UserButton />
              </div>
              <div className="truncate">
                <p className="text-xs font-extrabold text-base-content truncate">
                  {user?.fullName || user?.firstName || "Admin User"}
                </p>
                <p className="text-[10px] text-primary font-bold truncate">
                  {user?.primaryEmailAddress?.emailAddress || "System Admin"}
                </p>
              </div>
            </div>
          </div>

          <SignOutButton>
            <button className="btn btn-error btn-outline btn-sm w-full rounded-2xl font-bold gap-2 cursor-pointer shadow-sm">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
