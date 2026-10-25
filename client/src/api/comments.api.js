import { apiRequest } from "./client.js";

export const commentsApi = {
  getComments: (resourceId, page = 1, limit = 20) =>
    apiRequest(`/api/comments/${resourceId}?page=${page}&limit=${limit}`),

  createComment: (data) =>
    apiRequest("/api/comments/create", {
      method: "POST",
      body: data, // { postId, text } or { reelId, text }
    }),

  updateComment: (id, text) =>
    apiRequest(`/api/comments/${id}`, {
      method: "PATCH",
      body: { text },
    }),

  deleteComment: (id) =>
    apiRequest(`/api/comments/${id}`, {
      method: "DELETE",
    }),

  toggleLike: (id) =>
    apiRequest(`/api/comments/${id}/like`, {
      method: "PATCH",
    }),
};
