import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { routes } from "./Common";
export default function ProtectedRoute({ role }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role !== role)
    return <Navigate to={routes[user.role] || "/login"} replace />;
  return <Outlet />;
}
