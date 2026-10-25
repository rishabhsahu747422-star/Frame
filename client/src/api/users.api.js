import { apiRequest } from "./client.js";

export const usersApi = {
  getMe: () =>
    apiRequest("/api/users/me"),

  updateProfile: (data) =>
    apiRequest("/api/users/update-profile", {
      method: "PATCH",
      body: data,
    }),

  updateProfilePicture: (file) => {
    const formData = new FormData();
    formData.append("profile_pic", file);
    return apiRequest("/api/users/update-profile-pic", {
      method: "PATCH",
      body: formData,
    });
  },

  getUserProfile: (username) =>
    apiRequest(`/api/users/${username}`),

  searchUsers: (query, page = 1, limit = 15) =>
    apiRequest(`/api/users/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),

  followUser: (id) =>
    apiRequest(`/api/users/follow/${id}`, {
      method: "PATCH",
    }),

  unfollowUser: (id) =>
    apiRequest(`/api/users/unfollow/${id}`, {
      method: "PATCH",
    }),

  getFollowers: (id) =>
    apiRequest(`/api/users/${id}/followers`),

  getFollowing: (id) =>
    apiRequest(`/api/users/${id}/following`),

  changePassword: (password, newPassword) =>
    apiRequest("/api/users/change-password", {
      method: "PATCH",
      body: { password, newPassword },
    }),
};
