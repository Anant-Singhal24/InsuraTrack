import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
import ThemeToggle from "../ui/ThemeToggle";

const AuthLayout = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const location = useLocation();

  // If the user is already authenticated, redirect to dashboard
  if (isAuthenticated) {
    const redirectPath =
      user.role === "agent" ? "/agent/dashboard" : "/customer/dashboard";
    return <Navigate to={redirectPath} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-primary-600">
            InsuraTrack
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Insurance Management System
          </p>
        </div>

        {/* Customer Account Notice */}
        {location.pathname === "/login" && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-800 mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Customer Accounts
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If you're a customer, you need an agent to create an account for
              you. Contact your insurance agent to get your account details.
            </p>
          </div>
        )}

        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
