import { authRequest } from "./authApi";

export const fetchPlatformStats = (token, platform, username) =>
  authRequest(`/api/platform-stats/${encodeURIComponent(platform)}?username=${encodeURIComponent(username)}`, "GET", null, token);

export const fetchPlatformProfiles = (token) =>
  authRequest("/api/platform-stats/profiles", "GET", null, token);

export const requestPlatformVerification = (token, payload) =>
  authRequest("/api/platform-stats/verification", "POST", payload, token);

export const verifyPlatformProfile = (token, profileId) =>
  authRequest(`/api/platform-stats/profiles/${encodeURIComponent(profileId)}/verify`, "POST", null, token);

export const syncPlatformProfiles = (token) =>
  authRequest("/api/platform-stats/sync", "POST", null, token);

export const deletePlatformProfile = (token, profileId) =>
  authRequest(`/api/platform-stats/profiles/${encodeURIComponent(profileId)}`, "DELETE", null, token);
