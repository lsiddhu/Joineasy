import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";

import StudentLayout from "./layouts/StudentLayout";
import ProfessorLayout from "./layouts/ProfessorLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import StudentGroups from "./pages/StudentGroups";
import StudentAssignments from "./pages/StudentAssignments";

import ProfessorDashboard from "./pages/ProfessorDashboard";
import ProfessorAssignments from "./pages/ProfessorAssignments";
import AssignmentDetails from "./pages/AssignmentDetails";
import ProfessorAnalytics from "./pages/ProfessorAnalytics";
import ProfessorCourses from "./pages/ProfessorCourses";

import { routes } from "./components/Common";

export default function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Default route */}
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? routes[user?.role] || "/login" : "/login"}
            replace
          />
        }
      />

      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Professor login */}
      <Route path="/professor/login" element={<Login professor />} />

      {/* Student protected routes */}
      <Route element={<ProtectedRoute role="STUDENT" />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />

          <Route path="group" element={<StudentGroups />} />

          <Route path="assignments" element={<StudentAssignments />} />
        </Route>
      </Route>

      {/* Professor protected routes */}
      <Route element={<ProtectedRoute role="PROFESSOR" />}>
        <Route path="/professor" element={<ProfessorLayout />}>
          <Route path="dashboard" element={<ProfessorDashboard />} />

          <Route path="assignments" element={<ProfessorAssignments />} />

          <Route path="courses" element={<ProfessorCourses />} />

          <Route path="assignments/:id" element={<AssignmentDetails />} />

          <Route path="analytics" element={<ProfessorAnalytics />} />
        </Route>
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
