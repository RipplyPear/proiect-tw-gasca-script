import { api } from "./api";

export const ConferencesAPI = {
  list: () => api.get("/conferences").then(r => r.data),
  get: (id) => api.get(`/conferences/${id}`).then(r => r.data),
  create: (payload) => api.post("/conferences", payload).then(r => r.data),
  assignReviewers: (id, reviewerIds) =>
    api.post(`/conferences/${id}/reviewers`, { reviewerIds }).then(r => r.data),
  papers: (id) => api.get(`/conferences/${id}/papers`).then(r => r.data),
  registerAuthor: (id, userId) =>
    api.post(`/conferences/${id}/register`, { userId }).then(r => r.data),
};
