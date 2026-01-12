// Componenta pentru rute protejate
// Verifica daca userul e logat si daca are rolul necesar
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth";

export default function ProtectedRoute({ allowedRoles, children }) {
  const user = getCurrentUser();

  // Nu e logat -> redirect la login
  if (!user) return <Navigate to="/login" replace />;

  // E logat dar nu are rol permis -> redirect la home
  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Totul e ok, afisam pagina
  return children;
}
