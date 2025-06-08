import React, { useState, useContext } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
import { FaBars } from "react-icons/fa";
import ThemeToggle from "../ui/ThemeToggle";

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation links based on user role
  const navigation = [];

  if (user.role === "agent") {
    navigation.push(
      { name: "Dashboard", href: "/agent/dashboard" },
      { name: "Customers", href: "/agent/customers" },
      { name: "Policies", href: "/agent/policies" },
      { name: "History", href: "/agent/policies/history" },
      { name: "Messages", href: "/agent/messages" },
      { name: "Profile", href: "/agent/profile" }
    );
  } else {
    navigation.push(
      { name: "Dashboard", href: "/customer/dashboard" },
      { name: "My Policies", href: "/customer/policies" },
      { name: "My Profile", href: "/customer/profile" },
      { name: "Contact Agent", href: "/customer/contact-agent" }
    );
  }

  // Profile dropdown options
  const profileDropdownItems = [
    {
      name: "My Profile",
      onClick: () =>
        navigate(
          user.role === "agent" ? "/agent/profile" : "/customer/profile"
        ),
    },
    { name: "Change Password", onClick: () => navigate("/change-password") },
    { name: "Sign out", onClick: logout },
  ];

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Navigation */}
      <nav className="bg-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Desktop Navigation */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/" className="text-white font-bold text-xl">
                  InsuraTrack
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        location.pathname === item.href
                          ? "bg-primary-800 text-white"
                          : "text-white hover:bg-primary-600"
                      } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* User Profile */}
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <ThemeToggle className="mr-4" />
                <div className="relative ml-3">
                  <div className="flex items-center">
                    <span className="text-white mr-2">{user.name}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-800 capitalize">
                      {user.role}
                    </span>
                    <div className="ml-3 relative">
                      <div className="flex">
                        {profileDropdownItems.map((item) => (
                          <button
                            key={item.name}
                            onClick={item.onClick}
                            className="ml-2 text-sm text-white hover:text-primary-200 focus:outline-none"
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden">
              <ThemeToggle className="mr-2" />
              <button
                onClick={toggleMobileMenu}
                className="bg-primary-800 inline-flex items-center justify-center p-2 rounded-md text-primary-200 hover:text-white hover:bg-primary-600 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                <FaBars className="block h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? "bg-primary-800 text-white"
                      : "text-white hover:bg-primary-600"
                  } block px-3 py-2 rounded-md text-base font-medium`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-primary-600">
              <div className="flex items-center px-5">
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-white">
                    {user.name}
                  </div>
                  <div className="text-sm font-medium leading-none text-primary-200 mt-1 capitalize">
                    {user.role}
                  </div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                {profileDropdownItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      item.onClick();
                    }}
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-600 w-full text-left"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page header */}
      <header className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow`}>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {navigation.find((item) => item.href === location.pathname)?.name ||
              "Dashboard"}
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
