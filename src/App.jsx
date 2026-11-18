import { useEffect, useMemo, useRef } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import AboutPage from "./pages/AboutPage";
import CareersPage from "./pages/CareersPage";
import ContactPage from "./pages/ContactPage";
import EditProfilePage from "./pages/EditProfilePage";
import ExportPage from "./pages/ExportPage";
import FeedbackPage from "./pages/FeedbackPage";
import HowToUsePage from "./pages/HowToUsePage";
import ImportPage from "./pages/ImportPage";
import LearningInsightsPage from "./pages/LearningInsightsPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import PremiumPage from "./pages/PremiumPage";
import PublicSheetsPage from "./pages/PublicSheetsPage";
import NotificationsPage from "./pages/NotificationsPage";
import AlertsPage from "./pages/AlertsPage";
import AlarmsPage from "./pages/AlarmsPage";
import AddAccountsPage from "./pages/AddAccountsPage";
import SharedPage from "./pages/SharedPage";
import SheetPage from "./pages/SheetPage";
import SignUpPage from "./pages/SignUpPage";
import ApplyPage from "./pages/ApplyPage";
import { ProtectedRoute, PublicOnlyRoute } from "./components/routing/ProtectedRoute";
import ReminderNotificationCenter from "./components/ReminderNotificationCenter";
import SeoMeta from "./components/SeoMeta";
import { getUserProfileRoute, ROUTES, slugifySegment } from "./services/routes";
import { useAuthStore } from "./store/authStore";
import { useSheetStore } from "./store/sheetStore";

const TEXT_FIELD_MAX_LENGTH = 100;
const LIMITED_INPUT_TYPES = new Set([
  "email",
  "password",
  "search",
  "tel",
  "text",
  "url",
]);

const isLimitedTextField = (element) => {
  if (element?.dataset?.textLengthGuard === "off") {
    return false;
  }
  if (typeof HTMLTextAreaElement !== "undefined" && element instanceof HTMLTextAreaElement) {
    return true;
  }
  if (typeof HTMLInputElement === "undefined" || !(element instanceof HTMLInputElement)) {
    return false;
  }
  const type = (element.getAttribute("type") || "text").toLowerCase();
  return LIMITED_INPUT_TYPES.has(type);
};

const BUTTON_TOOLTIP_SYMBOL_MAP = {
  "+": "Add",
  "✕": "Close",
  "x": "Close",
  "⋯": "More actions",
  "...": "More actions",
};

const normalizeTooltipText = (value) => `${value || ""}`.replace(/\s+/g, " ").trim();

const getButtonTooltipText = (element) => {
  if (!(element instanceof Element)) return "";
  const explicitTooltip = normalizeTooltipText(element.getAttribute("data-tooltip"));
  if (explicitTooltip) return explicitTooltip;

  const ariaLabel = normalizeTooltipText(element.getAttribute("aria-label"));
  if (ariaLabel) return ariaLabel;

  const textLabel = normalizeTooltipText(element.textContent);
  if (!textLabel) return "";
  return BUTTON_TOOLTIP_SYMBOL_MAP[textLabel] || textLabel;
};

const applyButtonTooltip = (element) => {
  if (!(element instanceof Element)) return;
  if (element.dataset?.tooltipGuard === "off") return;
  if (element.hasAttribute("title")) return;

  const nextTooltip = getButtonTooltipText(element);
  if (nextTooltip) {
    element.setAttribute("title", nextTooltip);
  }
};

function enforceTextFieldLimit(element) {
  if (!isLimitedTextField(element)) return;
  const currentLimitAttribute = element.getAttribute("maxlength");
  const currentLimit = currentLimitAttribute == null ? null : Number(currentLimitAttribute);
  if (currentLimit == null || !Number.isFinite(currentLimit) || currentLimit < 0 || currentLimit > TEXT_FIELD_MAX_LENGTH) {
    element.setAttribute("maxlength", String(TEXT_FIELD_MAX_LENGTH));
  }
  if (element.value.length > TEXT_FIELD_MAX_LENGTH) {
    element.value = element.value.slice(0, TEXT_FIELD_MAX_LENGTH);
  }
}

function useTextFieldLengthGuard() {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const enforceAllTextFields = () => {
      document.querySelectorAll("input, textarea").forEach(enforceTextFieldLimit);
    };

    const handleFieldEvent = (event) => {
      enforceTextFieldLimit(event.target);
      window.requestAnimationFrame?.(() => enforceTextFieldLimit(event.target));
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") {
          enforceTextFieldLimit(mutation.target);
          return;
        }
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          enforceTextFieldLimit(node);
          node.querySelectorAll?.("input, textarea").forEach(enforceTextFieldLimit);
        });
      });
    });

    document.addEventListener("focusin", handleFieldEvent);
    document.addEventListener("input", handleFieldEvent, true);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["maxlength", "type"],
      childList: true,
      subtree: true,
    });

    enforceAllTextFields();

    return () => {
      document.removeEventListener("focusin", handleFieldEvent);
      document.removeEventListener("input", handleFieldEvent, true);
      observer.disconnect();
    };
  }, []);
}

function useButtonTooltipGuard() {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const selector = "button,[role='button'],input[type='button'],input[type='submit']";
    const applyToTree = (root) => {
      if (!(root instanceof Element)) return;
      if (root.matches(selector)) applyButtonTooltip(root);
      root.querySelectorAll?.(selector).forEach(applyButtonTooltip);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") {
          applyButtonTooltip(mutation.target);
          return;
        }
        mutation.addedNodes.forEach(applyToTree);
      });
    });

    document.querySelectorAll(selector).forEach(applyButtonTooltip);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-label", "data-tooltip", "title"],
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);
}

function LoginRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = new URLSearchParams(location.search).get("next");
  const safeNextPath = nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;
  return (
    <LoginPage
      onLoginSuccess={() => navigate(safeNextPath || getUserProfileRoute(useAuthStore.getState().currentUser?.username))}
      onGoToSignUp={() => navigate(ROUTES.SIGNUP)}
    />
  );
}

function SignupRoute() {
  const navigate = useNavigate();
  return (
    <SignUpPage
      onSignUpSuccess={() => navigate(getUserProfileRoute(useAuthStore.getState().currentUser?.username))}
      onGoToLogin={() => navigate(ROUTES.LOGIN)}
    />
  );
}

function SheetRoute() {
  const navigate = useNavigate();
  const { sheetId: sheetRouteParam, username, sheetSlug } = useParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);

  const resolvedSheetId = useMemo(() => {
    if (sheetRouteParam) return sheetRouteParam;
    if (!username || !sheetSlug || !currentUser?.token) return "";

    const normalizedUser = `${username}`.trim().toLowerCase();
    const ownUser = `${currentUser?.username || ""}`.trim().toLowerCase();
    if (normalizedUser !== ownUser) return "";

    const found = (sheets || []).find(
      (entry) => slugifySegment(entry?.title || entry?.name || "Untitled Sheet") === sheetSlug
    );
    return found?.id || "";
  }, [currentUser?.token, currentUser?.username, sheetRouteParam, sheetSlug, sheets, username]);

  useEffect(() => {
    if (sheetRouteParam || !username || !sheetSlug || !currentUser?.token) return;

    const normalizedUser = `${username}`.trim().toLowerCase();
    const ownUser = `${currentUser?.username || ""}`.trim().toLowerCase();
    if (normalizedUser !== ownUser) return;

    if (!sheets.length) {
      loadSheets(currentUser.token).catch(() => {});
    }
  }, [currentUser?.token, currentUser?.username, loadSheets, sheetRouteParam, sheetSlug, sheets, username]);

  return (
    <SheetPage
      sheetId={resolvedSheetId}
      onOpenImport={() => navigate(`${ROUTES.IMPORT}/${resolvedSheetId || ""}`)}
      onOpenExport={() => navigate(`${ROUTES.EXPORT}/${resolvedSheetId || ""}`)}
    />
  );
}

function ImportRoute() {
  const navigate = useNavigate();
  const { sheetId } = useParams();

  return <ImportPage onBack={() => navigate(`${ROUTES.APP}/${sheetId || ""}`)} />;
}

function ExportRoute() {
  const navigate = useNavigate();
  const { sheetId } = useParams();

  return <ExportPage onBack={() => navigate(`${ROUTES.APP}/${sheetId || ""}`)} />;
}

function SharedRoute() {
  const { shareType, shareId } = useParams();
  return <SharedPage shareType={shareType} shareId={shareId} />;
}

function PublicProfileRoute() {
  const { username } = useParams();
  return <SharedPage shareType="public-profile" username={username} />;
}

function ProtectedAppLayout() {
  const location = useLocation();
  return (
    <>
      <SeoMeta
        title="CreateSheets Private Workspace"
        description="Private CreateSheets workspace."
        path={location.pathname}
        noIndex
      />
      <ReminderNotificationCenter />
      <ProtectedRoute />
    </>
  );
}

function OwnProfileRedirectRoute() {
  const currentUser = useAuthStore((state) => state.currentUser);
  return <Navigate to={getUserProfileRoute(currentUser?.username)} replace />;
}

function UserProfileRoute() {
  const { username } = useParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const isOwnProfile = currentUser?.username?.toLowerCase() === `${username || ""}`.trim().toLowerCase();

  if (isOwnProfile) {
    return <ProfilePage onLogout={() => useAuthStore.getState().logout()} />;
  }

  return <PublicProfileRoute />;
}

function PublicSheetRoute() {
  const { username, sheetSlug } = useParams();
  return <SharedPage shareType="public-sheet" username={username} sheetSlug={sheetSlug} />;
}

function App() {
  useTextFieldLengthGuard();
  useButtonTooltipGuard();
  const currentUser = useAuthStore((state) => state.currentUser);
  const resetSheetState = useSheetStore((state) => state.resetSheetState);
  const previousUserIdRef = useRef(currentUser?.id || null);

  useEffect(() => {
    const currentUserId = currentUser?.id || null;
    if (previousUserIdRef.current !== currentUserId) {
      resetSheetState();
      previousUserIdRef.current = currentUserId;
    }
  }, [currentUser?.id, resetSheetState]);

  return (
    <>
      <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path={ROUTES.LOGIN} element={<LoginRoute />} />
        <Route path={ROUTES.SIGNUP} element={<SignupRoute />} />
      </Route>

      <Route path="/" element={<HomePage />} />
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.EXPLORE} element={<PublicSheetsPage />} />
      <Route path="/public-sheets" element={<PublicSheetsPage />} />
      <Route path="/sheets" element={<PublicSheetsPage />} />
      <Route path="/sheets/:username/:sheetSlug" element={<PublicSheetRoute />} />
      <Route path={ROUTES.ABOUT} element={<AboutPage />} />
      <Route path={ROUTES.CAREERS} element={<CareersPage />} />
      <Route path={ROUTES.CONTACT} element={<ContactPage />} />
      <Route path={ROUTES.FEEDBACK} element={<FeedbackPage />} />
      <Route path={ROUTES.HOW_TO_USE} element={<HowToUsePage />} />
      <Route path="/apply" element={<ApplyPage />} />

      <Route path={`${ROUTES.SHARED_PREFIX}/:shareType/:shareId`} element={<SharedRoute />} />
      <Route path={`${ROUTES.PROFILE}/:username/mysheets`} element={<UserProfileRoute />} />
      <Route path={`${ROUTES.PROFILE}/:username/:sheetSlug`} element={<PublicSheetRoute />} />
      <Route path={`${ROUTES.PROFILE}/:username`} element={<UserProfileRoute />} />

      <Route element={<ProtectedAppLayout />}>
        <Route path={ROUTES.LEARNING_INSIGHTS} element={<LearningInsightsPage />} />
        <Route path={ROUTES.PREMIUM} element={<PremiumPage />} />
        <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
        <Route path={ROUTES.ALERTS} element={<AlertsPage />} />
        <Route path={ROUTES.ALARMS} element={<AlarmsPage />} />
        <Route path={ROUTES.PROFILE} element={<OwnProfileRedirectRoute />} />
        <Route path={ROUTES.EDIT_PROFILE} element={<EditProfilePage />} />
        <Route path={ROUTES.ADD_ACCOUNTS} element={<AddAccountsPage />} />
        <Route path={`${ROUTES.APP}/:username/:sheetSlug`} element={<SheetRoute />} />
        <Route path={`${ROUTES.APP}/:sheetId?`} element={<SheetRoute />} />
        <Route path={`${ROUTES.IMPORT}/:sheetId?`} element={<ImportRoute />} />
        <Route path={`${ROUTES.EXPORT}/:sheetId?`} element={<ExportRoute />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </>
  );
}

export default App;
