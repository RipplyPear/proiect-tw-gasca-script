import { api } from "./api";

export const PapersAPI = {
  list: () => api.get("/papers").then((r) => r.data),
  get: (id) => api.get(`/papers/${id}`).then((r) => r.data),
  submit: (payload) => api.post("/papers", payload).then((r) => r.data),
  newVersion: (id, versionLink) =>
    api.put(`/papers/${id}/version`, { versionLink }).then((r) => r.data),
  review: (id, payload) =>
    api.post(`/papers/${id}/reviews`, payload).then((r) => r.data),
};
