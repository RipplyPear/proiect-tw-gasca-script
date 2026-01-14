// Pagina de login - autentificare prin email
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginByEmail } from "../services/auth";

export default function LoginPage() {
  // Valoare default pentru testare rapida
  const [email, setEmail] = useState("author@conf.com");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginByEmail(email);

      // Redirectionam catre dashboard-ul potrivit rolului
      const dest =
        user.role === "admin" ? "/organizer" : user.role === "reviewer" ? "/reviewer" : "/author";
      navigate(dest);
    } catch (err) {
      setError(err?.message || "Eroare la login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        {/* Header */}
        <div className="auth-header">

          <h1 className="auth-title">Bine ai revenit!</h1>
          <p className="auth-subtitle">
            Introdu email-ul pentru a te autentifica
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="form-grid">
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

          <button type="submit" className="btn-lg" disabled={loading} style={{ width: "100%" }}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Se autentifică...
              </>
            ) : (
              "Autentificare"
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
          Nu ai cont? <Link to="/register">Creează unul acum</Link>
        </div>
      </div>
    </div>
  );
}
