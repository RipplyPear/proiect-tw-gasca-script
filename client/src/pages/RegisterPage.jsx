import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/auth";

export default function RegisterPage() {
  const [name, setName] = useState("New User");
  const [email, setEmail] = useState("newuser@conf.com");
  const [role, setRole] = useState("author");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const user = await registerUser({ name, email, role });
      const dest =
        user.role === "admin" ? "/organizer" : user.role === "reviewer" ? "/reviewer" : "/author";
      navigate(dest);
    } catch (err) {
      setError(err?.message || "Eroare la register");
    }
  }

  return (
    <div>
      <h2>Register</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
        <label>
          Nume
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="author">author</option>
            <option value="reviewer">reviewer</option>
            <option value="admin">admin</option>
          </select>
        </label>

        <button type="submit">Create account</button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>
    </div>
  );
}
