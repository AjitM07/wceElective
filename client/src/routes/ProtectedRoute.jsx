import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

function ProtectedRoute({ children, allowedRole }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const selectedProgram = useAuthStore((state) => state.selectedProgram);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user && user.role !== allowedRole) {
    return <Navigate to="/select-program" replace />;
  }

  if (allowedRole && !selectedProgram) {
    return <Navigate to="/select-program" replace />;
  }

  return children;
}

export default ProtectedRoute;