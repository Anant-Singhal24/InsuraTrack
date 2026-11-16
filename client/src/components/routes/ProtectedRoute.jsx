import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoadingSpinner from "../ui/LoadingSpinner";

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required, verify user has that role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const redirectPath =
      user.role === "agent" ? "/agent/dashboard" : "/customer/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
