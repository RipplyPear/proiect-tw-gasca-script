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
  const dashLink =
    user?.role === "admin"
      ? "/organizer"
      : user?.role === "reviewer"
        ? "/reviewer"
        : user?.role === "author"
          ? "/author"
          : null;

  return (
    <div>
      <h2>Conferințe</h2>

      {/* Link rapid catre dashboard-ul utilizatorului */}
      {dashLink && (
        <p>
          Dashboard: <Link to={dashLink}>{dashLink}</Link>
        </p>
      )}

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: "crimson" }}>{String(error)}</p>}

      {/* Lista conferintelor */}
      <ul>
        {data?.map((c) => (
          <li key={c.id}>
            <strong>{c.title}</strong> — {c.location} — {c.date}
          </li>
        ))}
      </ul>
    </div>
  );
}
