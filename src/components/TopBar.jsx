import { Link } from "react-router-dom";
import { getUserProfileRoute, ROUTES } from "../services/routes";
import { useAuthStore } from "../store/authStore";
import ThemeCinematicToggle from "./theme/ThemeCinematicToggle";

function getInitials(name = "", username = "") {
  const displayName = name || username || "U";
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return displayName.slice(0, 2).toUpperCase();
}

function TopBar({ userLabel = "Account", actions }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const currentUsername = currentUser?.username;
  const displayName = currentUser?.name || currentUser?.username || userLabel || "Account";
  const initials = getInitials(currentUser?.name || userLabel, currentUsername);

  return (
    <header className="theme-topbar">
      <div className="flex items-center justify-between gap-3">
        {/* Left: spacer for mobile hamburger area */}
        <div className="hidden md:block" />

        {/* Right: actions cluster */}
        <div className="ml-auto flex items-center gap-2">
          <Link
            to={ROUTES.APP}
            className="btn-base btn-primary btn-sm"
            aria-label="Create new sheet"
          >
            <span aria-hidden="true">+</span>
            <span className="hidden sm:inline">Create</span>
          </Link>

          {actions}

          <span className="topbar-theme-action">
            <ThemeCinematicToggle />
          </span>

          <Link
            to={getUserProfileRoute(currentUsername)}
            className="topbar-user-btn"
            aria-label={`Profile: ${displayName}`}
          >
            <span className="topbar-avatar" aria-hidden="true">{initials}</span>
            <span className="topbar-username hidden sm:block">{displayName}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
