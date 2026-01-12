// API pentru utilizatori
import { api } from "./api";

export const UsersAPI = {
  // Lista toti userii
  list: () => api.get("/users").then((r) => r.data),

  // Detalii user dupa ID
  get: (id) => api.get(`/users/${id}`).then((r) => r.data),

  // Lista articolele alocate unui reviewer
  papersForReviewer: (id) => api.get(`/users/${id}/papers`).then((r) => r.data),
};
