// Pagina de inregistrare - creare cont nou
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/auth";

export default function RegisterPage() {
  // Valori default pentru testare rapida
  const [name, setName] = useState("New User");
  const [email, setEmail] = useState("newuser@conf.com");
  const [role, setRole] = useState("author");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Cream userul si facem login automat
      const user = await registerUser({ name, email, role });

      // Redirectionam catre dashboard-ul potrivit
      const dest =
        user.role === "admin" ? "/organizer" : user.role === "reviewer" ? "/reviewer" : "/author";
      navigate(dest);
    } catch (err) {
      setError(err?.message || "Eroare la register");
    } finally {
      setLoading(false);
    }
  }

  // Descrieri pentru roluri
  const roleDescriptions = {
    author: "Trimite articole la conferințe",
    reviewer: "Recenzează articole trimise",
    admin: "Organizează și gestionează conferințe"
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        {/* Header */}
        <div className="auth-header">

          <h1 className="auth-title">Creează cont</h1>
          <p className="auth-subtitle">
            Alătură-te platformei de conferințe
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="form-grid">
          <div className="form-group">
            <label htmlFor="name">Nume complet</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ion Popescu"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Rol</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="author">Author</option>
              <option value="reviewer">Reviewer</option>
              <option value="admin">Admin (Organizator)</option>
            </select>
            <small style={{ color: "var(--text-muted)", marginTop: "0.5rem", display: "block" }}>
              {roleDescriptions[role]}
            </small>
          </div>

          <button type="submit" className="btn-lg" disabled={loading} style={{ width: "100%" }}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Se creează contul...
              </>
            ) : (
              "Creează cont"
            )}
          </button>

          {error && (
            <div className="alert alert-error" style={{ marginTop: "1rem" }}>
              <div className="alert-content">{error}</div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="auth-footer">
          Ai deja cont? <Link to="/login">Autentifică-te</Link>
        </div>
      </div>
    </div>
  );
}
