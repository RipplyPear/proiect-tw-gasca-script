import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginByEmail } from "../services/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("author@conf.com");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const user = await loginByEmail(email);

      const dest =
        user.role === "admin" ? "/organizer" : user.role === "reviewer" ? "/reviewer" : "/author";
      navigate(dest);
    } catch (err) {
      setError(err?.message || "Eroare la login");
    }
  }

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button type="submit">Login</button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>

      <p>
        Nu ai cont? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
