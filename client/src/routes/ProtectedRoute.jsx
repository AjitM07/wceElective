import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

function ProtectedRoute({ children, allowedRole }) {
  const token = useAuthStore((state) => state.token) || localStorage.getItem("token");
  const user = useAuthStore((state) => state.user);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user && user.role !== allowedRole) {
    return <Navigate to={user.role === "coordinator" ? "/admin/dashboard" : "/student/dashboard"} replace />;
  }

  return children;
}

export default ProtectedRoute;