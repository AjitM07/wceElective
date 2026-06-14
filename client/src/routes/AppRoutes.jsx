import { Routes, Route } from "react-router-dom";

import Login from "../components/LoginPage";
import SelectProgram from "../pages/SelectProgram";
import ConfirmDetails from "../pages/student/ConfirmDetails";
import StudentStatus from "../pages/student/StudentStatus";
import StudentHome from "../pages/student/Home";
import ElectivePreferences from "../pages/student/ElectivePreferences";
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
        path="/student/confirm-details"
        element={
          <ProtectedRoute allowedRole="student">
            <ConfirmDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/home"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/status"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentStatus />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/preferences"
        element={
          <ProtectedRoute allowedRole="student">
            <ElectivePreferences />
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