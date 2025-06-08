import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Create context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }

    setLoading(false);
  }, []);

  // Login user
  const login = async (username, password) => {
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/login", { username, password });

      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.token);

        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("token", res.data.token);

        // Redirect based on role
        if (res.data.user.role === "agent") {
          navigate("/agent/dashboard");
        } else {
          navigate("/customer/dashboard");
        }

        toast.success("Login successful");
      }
    } catch (error) {
      console.log("Login error:", error.response?.data);
      if (error.response?.status === 401) {
        toast.error("Invalid credentials");
      } else if (
        error.response?.data?.message.includes("Password must be at least")
      ) {
        toast.error("Password must be at least 6 characters");
      } else if (
        error.response?.data?.message.includes("Username is required")
      ) {
        toast.error("Username is required");
      } else {
        toast.error(error.response?.data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/register", userData);

      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.token);

        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("token", res.data.token);

        // Redirect based on role
        if (res.data.user.role === "agent") {
          navigate("/agent/dashboard");
        } else {
          navigate("/customer/dashboard");
        }

        toast.success("Registration successful");
      }
    } catch (error) {
      console.log("Registration error:", error.response?.data);
      if (error.response?.data?.message.includes("Username already exists")) {
        toast.error("Username already exists");
      } else if (
        error.response?.data?.message.includes("Email already in use")
      ) {
        toast.error("Email already in use by another account");
      } else if (
        error.response?.data?.message.includes("Password must be at least")
      ) {
        toast.error("Password must be at least 6 characters");
      } else {
        toast.error(error.response?.data?.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    navigate("/login");
    toast.info("Logged out successfully");
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.put(`/api/auth/update-profile`, userData);

      if (res.data.success) {
        const updatedUser = { ...user, ...res.data.data };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        toast.success("Profile updated successfully");
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      const res = await axios.put("/api/auth/update-password", {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        toast.success("Password changed successfully");
        return true;
      }
      return false;
    } catch (error) {
      console.log("Change password error:", error.response?.data);
      if (
        error.response?.data?.message.includes("Current password is incorrect")
      ) {
        toast.error("Current password is incorrect");
      } else if (
        error.response?.data?.message.includes("New password must be at least")
      ) {
        toast.error("New password must be at least 6 characters");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to change password"
        );
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/forgot-password", { email });

      if (res.data.success) {
        toast.success("Password reset email sent");
        return true;
      }
      return false;
    } catch (error) {
      console.log("Forgot password error:", error.response?.data);
      if (error.response?.status === 404) {
        toast.error("No user found with that email");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to send reset email"
        );
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      setLoading(true);
      // console.log("Resetting password with token:", token);
      // console.log("Password length:", password?.length || 0);

      const res = await axios.put(`/api/auth/reset-password/${token}`, {
        password,
      });

      console.log(
        "Reset password response:",
        res.data.success ? "Success" : "Failed"
      );

      if (res.data.success) {
        toast.success("Password reset successful. Please login.");
        navigate("/login");
        return true;
      }
      toast.error("Failed to reset password. Please try again.");
      return false;
    } catch (error) {
      console.error("Reset password error:", error);
      if (error.response?.data?.message.includes("Password must be at least")) {
        toast.error("Password must be at least 6 characters");
      } else if (
        error.response?.data?.message.includes("Invalid or expired token")
      ) {
        toast.error("Invalid or expired reset link. Please request a new one.");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to reset password"
        );
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
