import { api } from "./api";

export const UsersAPI = {
  list: () => api.get("/users").then((r) => r.data),
  get: (id) => api.get(`/users/${id}`).then((r) => r.data),
  papersForReviewer: (id) => api.get(`/users/${id}/papers`).then((r) => r.data),
};
