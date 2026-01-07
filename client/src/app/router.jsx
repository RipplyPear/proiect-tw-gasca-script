import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

import OrganizerDashboard from "../pages/OrganizerDashboard";
import ReviewerDashboard from "../pages/ReviewerDashboard";
import AuthorDashboard from "../pages/AuthorDashboard";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/organizer"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviewer"
            element={
              <ProtectedRoute allowedRoles={["reviewer"]}>
                <ReviewerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/author"
            element={
              <ProtectedRoute allowedRoles={["author"]}>
                <AuthorDashboard />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
