export const ROUTES = {
  HOME: "/home",
  LOGIN: "/login",
  SIGNUP: "/signup",
  ABOUT: "/about",
  CONTACT: "/contact",
  CAREERS: "/careers",
  HOW_TO_USE: "/how-to-use",
  EXPLORE: "/explore",
  LEARNING_INSIGHTS: "/learning-insights",
  PROFILE: "/profile",
  EDIT_PROFILE: "/edit-profile",
  ADD_ACCOUNTS: "/add_accounts",
  SHARED_PREFIX: "/shared",
  PUBLIC_SHEETS: "/explore",
  APP: "/mysheets",
  IMPORT: "/import",
  EXPORT: "/export",
  PREMIUM: "/premium",
  NOTIFICATIONS: "/notifications",
  ALERTS: "/alerts",
  ALARMS: "/alarms",
  FEEDBACK: "/feedback",
};

export const slugifySegment = (value) => {
  const cleaned = `${value || ""}`.trim().toLowerCase();
  const slug = cleaned.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "untitled-sheet";
};

export const getUserProfileRoute = (username) => {
  const normalized = `${username || ""}`.trim().toLowerCase();
  if (!normalized) return ROUTES.PROFILE;
  return `${ROUTES.PROFILE}/${normalized}`;
};


export const getPublicSheetPath = (username, sheetName) => {
  const normalizedUsername = `${username || ""}`.trim().toLowerCase();
  const slug = slugifySegment(sheetName || "Untitled Sheet");
  if (!normalizedUsername) return `/sheets/${slug}`;
  return `/sheets/${normalizedUsername}/${slug}`;
};



export const getSheetEditorRoute = (sheet, username) => {
  if (sheet?.id) return `${ROUTES.APP}/${sheet.id}`;

  const owner = `${username || ""}`.trim().toLowerCase();
  const sheetTitle = sheet?.title || "Untitled Sheet";
  const slug = slugifySegment(sheetTitle);

  if (!owner) return `${ROUTES.APP}/${slug}`;
  return `${ROUTES.APP}/${owner}/${slug}`;
};


export const getCurrentRoute = () => {
  if (typeof window === "undefined") return { route: ROUTES.LOGIN };

  const path = window.location.pathname || ROUTES.LOGIN;

  const exactRouteMap = new Map([
    [ROUTES.LOGIN, ROUTES.LOGIN],
    [ROUTES.HOME, ROUTES.HOME],
    [ROUTES.SIGNUP, ROUTES.SIGNUP],
    [ROUTES.ABOUT, ROUTES.ABOUT],
    [ROUTES.CONTACT, ROUTES.ABOUT],
    [ROUTES.CAREERS, ROUTES.CAREERS],
    [ROUTES.HOW_TO_USE, ROUTES.HOW_TO_USE],
    [ROUTES.EXPLORE, ROUTES.EXPLORE],
    [ROUTES.LEARNING_INSIGHTS, ROUTES.LEARNING_INSIGHTS],
    [ROUTES.PUBLIC_SHEETS, ROUTES.PUBLIC_SHEETS],
    ["/public-sheets", ROUTES.PUBLIC_SHEETS],
    ["/sheets", ROUTES.PUBLIC_SHEETS],
    [ROUTES.EDIT_PROFILE, ROUTES.EDIT_PROFILE],
    [ROUTES.ADD_ACCOUNTS, ROUTES.ADD_ACCOUNTS],
    [ROUTES.PREMIUM, ROUTES.PREMIUM],
    [ROUTES.NOTIFICATIONS, ROUTES.NOTIFICATIONS],
    [ROUTES.ALERTS, ROUTES.ALERTS],
    [ROUTES.ALARMS, ROUTES.ALARMS],
    [ROUTES.FEEDBACK, ROUTES.ABOUT],
  ]);
  const exactRoute = exactRouteMap.get(path);
  if (exactRoute) return { route: exactRoute };

  // Prefix checks are ordered from specific sections to generic shared prefixes.
  const prefixRoutes = [
    ROUTES.PROFILE,
    ROUTES.APP,
    ROUTES.IMPORT,
    ROUTES.EXPORT,
    ROUTES.SHARED_PREFIX,
  ];
  const matchedPrefix = prefixRoutes.find((prefix) => path.startsWith(`${prefix}/`));
  if (matchedPrefix) return { route: matchedPrefix };

  return { route: ROUTES.LOGIN };
};

export const navigateTo = (route) => {
  if (typeof window === "undefined") return;
  window.history.pushState({}, "", route);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
