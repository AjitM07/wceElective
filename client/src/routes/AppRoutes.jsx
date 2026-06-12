import { Routes, Route } from "react-router-dom";

import Login from "../components/LoginPage";
import SelectProgram from "../pages/SelectProgram";
import Dashboard from "../pages/student/Dashboard";
import AdminDashboard from "../pages/admin/Dashboard";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/select-program"
        element={
          <ProtectedRoute>
            <SelectProgram />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRole="student">
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRole="coordinator">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;