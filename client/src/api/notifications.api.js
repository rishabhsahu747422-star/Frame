import { apiRequest } from "./client.js";

export const notificationsApi = {
  getNotifications: (page = 1, limit = 20) =>
    apiRequest(`/api/notifications?page=${page}&limit=${limit}`),

  getUnreadCount: () =>
    apiRequest("/api/notifications/unread-count"),

  markAsRead: (id) =>
    apiRequest(`/api/notifications/${id}/read`, {
      method: "PATCH",
    }),

  markAllAsRead: () =>
    apiRequest("/api/notifications/read-all", {
      method: "PATCH",
    }),
};
