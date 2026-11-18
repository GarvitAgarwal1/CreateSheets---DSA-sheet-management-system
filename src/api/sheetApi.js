import { authRequest } from "./authApi";

export const listSheets = (token) => authRequest("/api/sheets", "GET", null, token);
export const createSheet = (token, title, metadata = {}) =>
  authRequest("/api/sheets", "POST", { title, logoUrl: metadata.logoUrl || "", sheetUrl: metadata.sheetUrl || "" }, token);
export const getSheet = (token, sheetId) => authRequest(`/api/sheets/${sheetId}`, "GET", null, token);
export const saveSheet = (token, sheetId, payload) =>
  authRequest(`/api/sheets/${sheetId}`, "PUT", payload, token);
export const removeSheet = (token, sheetId) => authRequest(`/api/sheets/${sheetId}`, "DELETE", null, token);
export const getSharedSheet = (shareId) => authRequest(`/api/sheets/shared/${shareId}`);
export const trackSheetEngagement = (token, sheetId, action) =>
  authRequest(`/api/sheets/${sheetId}/engagement`, "POST", { action }, token);
export const copyPublicSheet = (token, sheetId, title) =>
  authRequest(`/api/sheets/${sheetId}/copy`, "POST", title ? { title } : {}, token);
export const fetchFeaturedSheets = async () => {
  try {
    const sheets = await authRequest("/api/sheets/featured");
    return Array.isArray(sheets) ? sheets : [];
  } catch {
    return [];
  }
};
export const fetchAdminCatalog = async () => {
  try {
    const sheets = await authRequest("/api/sheets/admin-catalog");
    return Array.isArray(sheets) ? sheets : [];
  } catch {
    return [];
  }
};
export const fetchPublicCatalog = async () => {
  try {
    const sheets = await authRequest("/api/sheets/public-catalog");
    return Array.isArray(sheets) ? sheets : [];
  } catch {
    return [];
  }
};
