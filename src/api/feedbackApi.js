import { authRequest } from "./authApi";

export const submitFeedback = (token, formData) =>
  authRequest("/api/feedback", "POST", formData, token);
