import { apiRequest } from "./client.js";

export const reelsApi = {
  getReels: (page = 1, limit = 10) =>
    apiRequest(`/api/reels?page=${page}&limit=${limit}`),

  getReelById: (id) =>
    apiRequest(`/api/reels/${id}`),

  getReelsByUser: (userId, page = 1, limit = 12) =>
    apiRequest(`/api/reels/user/${userId}?page=${page}&limit=${limit}`),

  createReel: (formData) =>
    apiRequest("/api/reels", {
      method: "POST",
      body: formData,
    }),

  updateReel: (id, caption) =>
    apiRequest(`/api/reels/${id}`, {
      method: "PATCH",
      body: { caption },
    }),

  deleteReel: (id) =>
    apiRequest(`/api/reels/${id}`, {
      method: "DELETE",
    }),

  toggleLike: (id) =>
    apiRequest(`/api/reels/${id}/like`, {
      method: "PATCH",
    }),

  recordView: (id) =>
    apiRequest(`/api/reels/${id}/view`, {
      method: "POST",
    }),
};
