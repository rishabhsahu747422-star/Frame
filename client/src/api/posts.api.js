import { apiRequest } from "./client.js";

export const postsApi = {
  getFeed: (page = 1, limit = 10) =>
    apiRequest(`/api/posts?page=${page}&limit=${limit}`),

  getFollowingFeed: (page = 1, limit = 10) =>
    apiRequest(`/api/posts/feed/following?page=${page}&limit=${limit}`),

  getPostById: (id) =>
    apiRequest(`/api/posts/${id}`),

  getUserPosts: (userId, page = 1, limit = 12) =>
    apiRequest(`/api/posts/user/${userId}?page=${page}&limit=${limit}`),

  createPost: (formData) =>
    apiRequest("/api/posts/create", {
      method: "POST",
      body: formData,
    }),

  updatePost: (id, data) =>
    apiRequest(`/api/posts/${id}`, {
      method: "PATCH",
      body: data,
    }),

  deletePost: (id) =>
    apiRequest(`/api/posts/${id}`, {
      method: "DELETE",
    }),

  toggleLike: (id) =>
    apiRequest(`/api/posts/${id}/like`, {
      method: "PATCH",
    }),

  toggleSave: (id) =>
    apiRequest(`/api/posts/${id}/save`, {
      method: "PATCH",
    }),

  getSavedPosts: (page = 1, limit = 12) =>
    apiRequest(`/api/posts/saved/me?page=${page}&limit=${limit}`),
};
