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
    <div>
      {/* Header cu navigare */}
      <header className="app-header">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <span className="logo-icon">C</span>
            <span>ConferenceHub</span>
          </Link>

          {/* Right side - user info sau login links */}
          <div className="user-info">
            {user ? (
              <>
                <div className="user-badge">
                  <span>{user.name}</span>
                  <span className="user-role">{user.role}</span>
                </div>
                <button onClick={handleLogout} className="btn-ghost btn-sm">
                  Logout
                </button>
              </>
            ) : (
              <div className="nav-links">
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register">
                  <button className="btn-sm">Register</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="container page-wrapper">
        <Outlet />
      </main>
    </div>
  );
}
