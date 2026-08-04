import { useState, useEffect } from "react";
import { Bell, Search, Menu, Palette } from "lucide-react";

const tabNames = {
  dashboard: "Dashboard Overview",
  products: "Product Management",
  orders: "Order Operations",
  customers: "Customer Relationships",
};

const themes = [
  "forest",
  "dark",
  "emerald",
  "synthwave",
  "corporate",
  "coffee",
  "night",
  "dracula",
];

const Header = ({ activeTab, setIsSidebarOpen }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("daisyui-theme") || "forest";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setCurrentTheme(newTheme);
    localStorage.setItem("daisyui-theme", newTheme);
  };

  return (
    <header className="h-16 border-b border-base-300 bg-base-100/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 text-base-content shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="btn btn-ghost btn-square btn-sm lg:hidden border border-base-300 text-base-content"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-base sm:text-xl font-extrabold text-base-content tracking-tight truncate">
          {tabNames[activeTab] || "Admin Portal"}
        </h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Bar */}
        <div className="relative hidden md:block w-40 lg:w-56">
          <Search className="w-4 h-4 text-base-content/50 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
          <input
            type="text"
            placeholder="Search anything..."
            className="input input-sm input-bordered w-full bg-base-200 text-base-content text-xs rounded-xl pl-9 pr-4 focus:input-primary placeholder:text-base-content/40 transition-all"
          />
        </div>

        {/* Theme Selector */}
        <div className="flex items-center gap-1.5 bg-base-200 border border-base-300 px-2.5 py-1 rounded-xl shadow-inner">
          <Palette className="w-4 h-4 text-primary" />
          <select
            value={currentTheme}
            onChange={handleThemeChange}
            className="select select-ghost select-xs text-xs font-bold text-base-content focus:outline-none cursor-pointer capitalize"
          >
            {themes.map((th) => (
              <option key={th} value={th} className="bg-base-100 text-base-content capitalize font-medium">
                Theme: {th}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content border border-base-300 relative">
          <Bell className="w-4 h-4" />
          <span className="badge badge-xs badge-error absolute -top-1 -right-1"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
