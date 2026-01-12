// API pentru conferinte
import { api } from "./api";

export const ConferencesAPI = {
  // Lista toate conferintele
  list: () => api.get("/conferences").then(r => r.data),

  // Detalii conferinta dupa ID
  get: (id) => api.get(`/conferences/${id}`).then(r => r.data),

  // Creeaza conferinta noua (doar admin)
  create: (payload) => api.post("/conferences", payload).then(r => r.data),

  // Aloca revieweri la conferinta
  assignReviewers: (id, reviewerIds) =>
    api.post(`/conferences/${id}/reviewers`, { reviewerIds }).then(r => r.data),

  // Lista articolele din conferinta
  papers: (id) => api.get(`/conferences/${id}/papers`).then(r => r.data),

  // Inregistreaza un autor la conferinta
  registerAuthor: (id, userId) =>
    api.post(`/conferences/${id}/register`, { userId }).then(r => r.data),
};
