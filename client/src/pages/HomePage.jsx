// Pagina principala - afiseaza lista conferintelor
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { getCurrentUser } from "../services/auth";

export default function HomePage() {
  const user = getCurrentUser();

  // Incarcam conferintele din API
  const { data, isLoading, error } = useQuery({
    queryKey: ["conferences"],
    queryFn: async () => {
      const res = await api.get("/conferences");
      // Daca serverul returneaza 204, data e gol
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  // Determinam link-ul catre dashboard in functie de rol
  const dashboardConfig = {
    admin: { path: "/organizer", label: "Organizator Dashboard" },
    reviewer: { path: "/reviewer", label: "Reviewer Dashboard" },
    author: { path: "/author", label: "Author Dashboard" },
  };

  const dashboard = user?.role ? dashboardConfig[user.role] : null;

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Conferințe</h1>
        <p className="page-subtitle">
          Explorează conferințele disponibile și participă cu articolele tale
        </p>
      </div>

      {/* Dashboard Link Card */}
      {dashboard && (
        <Link to={dashboard.path} style={{ textDecoration: "none" }}>
          <div className="glass-card" style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                Mergi la {dashboard.label}
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                Gestionează-ți activitatea ca {user.role}
              </div>
            </div>
            <span style={{ marginLeft: "auto", fontSize: "1.5rem", opacity: 0.5 }}>→</span>
          </div>
        </Link>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading" style={{ justifyContent: "center", padding: "3rem" }}>
          <span className="spinner"></span>
          <span>Se încarcă conferințele...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-error">
          <span>❌</span>
          <div className="alert-content">Eroare la încărcarea conferințelor: {String(error)}</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.length === 0 && (
        <div className="empty-state glass-card-static">
          <h3>Nu există conferințe încă</h3>
          <p style={{ color: "var(--text-muted)" }}>
            Conferințele vor apărea aici după ce vor fi create de organizatori.
          </p>
        </div>
      )}

      {/* Conference Grid */}
      {data && data.length > 0 && (
        <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {data.map((conference) => (
            <div key={conference.id} className="conference-card">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span className="badge badge-info">#{conference.id}</span>
              </div>
              <h3 className="conference-title">{conference.title}</h3>
              <div className="conference-info">
                <span>{conference.location}</span>
                <span>{conference.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
