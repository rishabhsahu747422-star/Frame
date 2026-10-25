import { apiRequest } from "./client.js";

export const collectionsApi = {
  getMyCollections: () =>
    apiRequest("/api/collections/me"),

  getCollectionById: (id) =>
    apiRequest(`/api/collections/${id}`),

  createCollection: (data) =>
    apiRequest("/api/collections", {
      method: "POST",
      body: data,
    }),

  updateCollection: (id, data) =>
    apiRequest(`/api/collections/${id}`, {
      method: "PATCH",
      body: data,
    }),

  deleteCollection: (id) =>
    apiRequest(`/api/collections/${id}`, {
      method: "DELETE",
    }),

  addPost: (id, postId) =>
    apiRequest(`/api/collections/${id}/posts`, {
      method: "POST",
      body: { postId },
    }),

  removePost: (id, postId) =>
    apiRequest(`/api/collections/${id}/posts/${postId}`, {
      method: "DELETE",
    }),
};
