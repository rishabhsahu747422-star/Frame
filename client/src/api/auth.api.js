import { apiRequest } from "./client.js";

export const authApi = {
  register: (formData) =>
    apiRequest("/api/auth/register", {
      method: "POST",
      body: formData, // FormData instance
    }),

  login: (credentials) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: credentials,
    }),

  logout: () =>
    apiRequest("/api/auth/logout", {
      method: "POST",
    }),

  refreshToken: () =>
    apiRequest("/api/auth/refresh-token", {
      method: "POST",
    }),

  forgotPassword: (email) =>
    apiRequest("/api/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (token, newPassword) =>
    apiRequest("/api/auth/reset-password", {
      method: "POST",
      body: { token, newPassword },
    }),

  getGoogleAuthUrl: () => "/api/auth/google",
};
