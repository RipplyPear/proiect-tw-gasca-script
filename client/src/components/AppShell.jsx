// Layout-ul principal - header + zona de continut
import { Link, Outlet, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth";

export default function AppShell() {
  const user = getCurrentUser();
  const navigate = useNavigate();

  // La logout stergem sesiunea si mergem la login
  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header cu navigare */}
      <header style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <Link to="/">Home</Link>

        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
          {user ? (
            // Daca e logat, aratam numele si buton de logout
            <>
              <span>
                {user.name} ({user.role})
              </span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            // Daca nu e logat, link-uri catre login si register
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </header>

      {/* Outlet randeaza pagina curenta (copilul rutei) */}
      <Outlet />
    </div>
  );
}
