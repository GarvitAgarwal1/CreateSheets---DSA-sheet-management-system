const FALLBACK_SITE_URL = "https://www.createsheets.com";
const FALLBACK_IMAGE = "/vite.svg";

const normalizeSiteUrl = (value) => {
  const trimmed = `${value || ""}`.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

const resolveSiteUrl = () => {
  const configured = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
  if (configured) return configured;

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeSiteUrl(window.location.origin);
  }

  return FALLBACK_SITE_URL;
};

export const seoDefaults = {
  siteName: "CreateSheets",
  siteUrl: resolveSiteUrl(),
  defaultImage: FALLBACK_IMAGE,
  defaultTitle: "CreateSheets | Create, Share & Track DSA Sheets",
  defaultDescription:
    "CreateSheets helps you create, share, and track DSA sheets, programming sheets, interview preparation sheets, and topic-based learning trackers.",
  commonKeywords: [
    "Create Sheets",
    "create sheets",
    "DSA sheets",
    "coding sheets",
    "study sheets",
    "revision sheets",
    "custom sheets",
    "problem solving sheet",
    "programming sheet",
    "data structures and algorithms sheet",
    "sheet tracker",
    "question tracker",
    "coding practice tracker",
    "competitive programming sheet",
    "LeetCode sheet",
    "GFG sheet",
    "DSA practice sheet",
    "public sheets",
    "share sheets",
    "sheet management website",
  ],
};

const PRIVATE_EXACT_PATHS = new Set([
  "/account",
  "/add_accounts",
  "/admin",
  "/alarms",
  "/alerts",
  "/api",
  "/auth",
  "/dashboard",
  "/edit-profile",
  "/export",
  "/feedback",
  "/forgot-password",
  "/import",
  "/learning-insights",
  "/login",
  "/me",
  "/mysheets",
  "/notifications",
  "/oauth",
  "/premium",
  "/private",
  "/profile",
  "/register",
  "/reset-password",
  "/settings",
  "/signup",
  "/verify",
]);

const PRIVATE_PREFIXES = [
  "/account/",
  "/add_accounts/",
  "/admin/",
  "/alarms/",
  "/alerts/",
  "/api/",
  "/auth/",
  "/dashboard/",
  "/edit-profile/",
  "/export/",
  "/feedback/",
  "/forgot-password/",
  "/import/",
  "/learning-insights/",
  "/login/",
  "/me/",
  "/mysheets/",
  "/notifications/",
  "/oauth/",
  "/premium/",
  "/private/",
  "/profile/",
  "/register/",
  "/reset-password/",
  "/settings/",
  "/signup/",
  "/verify/",
];

const withLeadingSlash = (path) => {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
};

export const buildCanonicalUrl = (path = "/") => {
  const normalizedPath = withLeadingSlash(path);
  return `${seoDefaults.siteUrl}${normalizedPath}`;
};

export const buildImageUrl = (imagePath = seoDefaults.defaultImage) => {
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${seoDefaults.siteUrl}${withLeadingSlash(imagePath)}`;
};

export const shouldNoIndexPath = (path = "/") => {
  const normalizedPath = withLeadingSlash(path).split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return PRIVATE_EXACT_PATHS.has(normalizedPath) || PRIVATE_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix));
};
