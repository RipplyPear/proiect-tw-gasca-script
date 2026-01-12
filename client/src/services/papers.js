// API pentru articole
import { api } from "./api";

export const PapersAPI = {
  // Lista toate articolele
  list: () => api.get("/papers").then((r) => r.data),

  // Detalii articol dupa ID
  get: (id) => api.get(`/papers/${id}`).then((r) => r.data),

  // Trimite articol nou la conferinta
  submit: (payload) => api.post("/papers", payload).then((r) => r.data),

  // Incarca versiune noua (dupa ce primesti NEEDS_REVISIONS)
  newVersion: (id, versionLink) =>
    api.put(`/papers/${id}/version`, { versionLink }).then((r) => r.data),

  // Trimite recenzie pentru un articol
  review: (id, payload) =>
    api.post(`/papers/${id}/reviews`, payload).then((r) => r.data),
};
