// Routerul aplicatiei - defineste ce pagina se incarca pentru fiecare URL
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
        {/* AppShell contine header-ul si wrapeaza toate paginile */}
        <Route element={<AppShell />}>
          {/* Rute publice */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Dashboard organizator - doar admin */}
          <Route
            path="/organizer"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          {/* Dashboard reviewer */}
          <Route
            path="/reviewer"
            element={
              <ProtectedRoute allowedRoles={["reviewer"]}>
                <ReviewerDashboard />
              </ProtectedRoute>
            }
          />
          {/* Dashboard autor */}
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
