import { apiRequest } from "./client.js";

export const storiesApi = {
  getStories: () =>
    apiRequest("/api/stories/get-stories"),

  createStory: (formData) =>
    apiRequest("/api/stories/create", {
      method: "POST",
      body: formData,
    }),

  recordView: (id) =>
    apiRequest(`/api/stories/${id}/view`, {
      method: "POST",
    }),

  deleteStory: (id) =>
    apiRequest(`/api/stories/${id}`, {
      method: "DELETE",
    }),
};
