import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

// Auth Components
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ChangePassword from "./pages/auth/ChangePassword";

// Layout Components
import MainLayout from "./components/layouts/MainLayout";
import AuthLayout from "./components/layouts/AuthLayout";
import ProtectedRoute from "./components/routes/ProtectedRoute";


// Agent Pages
import AgentDashboard from "./pages/agent/Dashboard";
import AgentCustomers from "./pages/agent/Customers";
import AgentPolicies from "./pages/agent/Policies";
import AgentMessages from "./pages/agent/Messages";
import HistoricalPolicies from "./pages/agent/HistoricalPolicies";
import AgentProfile from "./pages/agent/Profile";

// Customer Pages
import CustomerDashboard from "./pages/customer/Dashboard";
import CustomerPolicies from "./pages/customer/Policies";
import ContactAgent from "./pages/customer/ContactAgent";
import CustomerProfile from "./pages/customer/Profile";

// Context
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Set default axios base URL and headers
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle global axios errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    if (response && response.status === 401) {
      // localStorage.removeItem("token");
      // localStorage.removeItem("user"); // it is doing wrong refresh
      // toast.error("Session expired. Please login again.");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>


              {/* Agent Routes */}
              <Route path="/agent/dashboard" element={<AgentDashboard />} />
              <Route path="/agent/customers" element={<AgentCustomers />} />
              <Route path="/agent/policies" element={<AgentPolicies />} />
              <Route
                path="/agent/policies/history"
                element={<HistoricalPolicies />}
              />
              <Route path="/agent/messages" element={<AgentMessages />} />
              <Route path="/agent/profile" element={<AgentProfile />} />

              {/* Customer Routes */}
              <Route
                path="/customer/dashboard"
                element={<CustomerDashboard />}
              />
              <Route path="/customer/policies" element={<CustomerPolicies />} />
              <Route
                path="/customer/contact-agent"
                element={<ContactAgent />}
              />
              <Route path="/customer/profile" element={<CustomerProfile />} />

              {/* Common Routes */}
              <Route path="/change-password" element={<ChangePassword />} />
            </Route>
          </Route>

          {/* Redirect to login if no route matches */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
