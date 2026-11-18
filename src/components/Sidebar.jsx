import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlarmClock,
  BriefcaseBusiness,
  ChartColumnBig,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  House,
  Inbox,
  LifeBuoy,
  Lock,
  LogIn,
  LogOut,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { getCurrentRoute, getUserProfileRoute, navigateTo, ROUTES } from "../services/routes";
import { useAuthStore } from "../store/authStore";

const sections = [
  {
    title: "Workspace",
    items: [
      { label: "Home", route: ROUTES.HOME, icon: House },
      { label: "Sheets", route: ROUTES.APP, icon: FileSpreadsheet },
      { label: "Profile", route: ROUTES.PROFILE, icon: UserRound },
      { label: "Inbox", route: ROUTES.NOTIFICATIONS, icon: Inbox, matchRoutes: [ROUTES.NOTIFICATIONS, ROUTES.ALERTS] },
      { label: "Reminders", route: ROUTES.ALARMS, icon: AlarmClock, secondary: true },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "Insights", route: ROUTES.LEARNING_INSIGHTS, icon: ChartColumnBig, secondary: true },
    ],
  },
  {
    title: "Website",
    items: [
      { label: "About & Support", route: ROUTES.ABOUT, icon: LifeBuoy, secondary: true },
      { label: "Careers", route: ROUTES.CAREERS, icon: BriefcaseBusiness, secondary: true },
    ],
  },
];

function SidebarIcon({ icon, isOpen }) {
  const IconComponent = icon;

  return (
    <span className="sidebar-nav-icon" aria-hidden="true">
      <IconComponent size={isOpen ? 22 : 23} strokeWidth={1.9} />
    </span>
  );
}

function SidebarItem({
  item,
  isOpen,
  active,
  onClick,
  showTooltip = true,
  compact = false,
  locked = false,
}) {
  const Icon = item.icon;
  const tooltipId = useId();
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState(null);
  const shouldShowFloatingLabel = !isOpen && showTooltip;

  useEffect(() => {
    if (!shouldShowFloatingLabel || !isTooltipVisible) return;
    const buttonNode = buttonRef.current;
    const tooltipNode = tooltipRef.current;
    if (!buttonNode || !tooltipNode) return;

    const buttonRect = buttonNode.getBoundingClientRect();
    const tooltipRect = tooltipNode.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const edgePadding = 8;
    const preferredOffset = 10;

    const fitsRight = buttonRect.right + preferredOffset + tooltipRect.width + edgePadding <= viewportWidth;
    const left = fitsRight
      ? buttonRect.right + preferredOffset
      : Math.max(edgePadding, buttonRect.left - tooltipRect.width - preferredOffset);
    const centeredTop = buttonRect.top + (buttonRect.height / 2) - (tooltipRect.height / 2);
    const top = Math.min(
      Math.max(edgePadding, centeredTop),
      viewportHeight - tooltipRect.height - edgePadding,
    );

    setTooltipStyle({
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
    });
  }, [isTooltipVisible, shouldShowFloatingLabel]);

  const showFloatingLabel = shouldShowFloatingLabel && isTooltipVisible;

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={locked ? `${item.label} (Locked)` : item.label}
      aria-current={active ? "page" : undefined}
      aria-describedby={showFloatingLabel ? tooltipId : undefined}
      title={!isOpen ? item.label : undefined}
      onClick={onClick}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
      className={`sidebar-nav-item group ${isOpen ? "is-open" : "is-collapsed"} ${active ? "is-active" : ""} ${compact ? "is-compact" : ""} ${locked ? "is-locked" : ""} ${item.secondary ? "is-secondary" : ""}`.trim()}
    >
      <SidebarIcon icon={Icon} isOpen={isOpen} />
      <span className={`sidebar-nav-label ${isOpen ? "is-visible" : ""}`}>{item.label}</span>
      {locked ? (
        <span className="sidebar-lock-indicator" aria-hidden="true">
          <Lock size={13} strokeWidth={2} />
        </span>
      ) : null}
      {locked ? <span className="sidebar-lock-mask" aria-hidden /> : null}

      {shouldShowFloatingLabel ? (
        <span
          id={tooltipId}
          ref={tooltipRef}
          role="tooltip"
          aria-hidden={!showFloatingLabel}
          className={`sidebar-tooltip ${showFloatingLabel ? "is-visible" : ""}`}
          style={tooltipStyle || undefined}
        >
          {item.label}
        </span>
      ) : null}
    </button>
  );
}

function SidebarSection({ title, items, isOpen, currentRoute, onItemClick, lockedRoutes = [], onLockedItemClick }) {
  const isSecondarySection = items.every((item) => item.secondary);

  return (
    <section className={`sidebar-section ${isSecondarySection ? "is-secondary-section" : ""}`}>
      <p className={`sidebar-section-title ${isOpen ? "is-visible" : ""}`}>{title}</p>
      <div className="sidebar-section-items">
        {items.map((item) => (
          <SidebarItem
            key={`${title}-${item.label}`}
            item={item}
            isOpen={isOpen}
            active={item.matchRoutes ? item.matchRoutes.includes(currentRoute) : currentRoute === item.route}
            onClick={() => {
              if (lockedRoutes.includes(item.route)) {
                onLockedItemClick?.(item);
                onItemClick?.();
                return;
              }
              navigateTo(item.route);
              onItemClick?.();
            }}
            locked={lockedRoutes.includes(item.route)}
          />
        ))}
      </div>
    </section>
  );
}

function getInitials(name = "", username = "") {
  const displayName = name || username || "U";
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return displayName.slice(0, 2).toUpperCase();
}

function Sidebar({ isSidebarOpen, isMobileOpen = false, onToggle, onCloseMobile, mobileSidebarId }) {
  const currentRoute = getCurrentRoute().route;
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const sidebarWidth = useMemo(
    () => (isSidebarOpen ? "sidebar-desktop-expanded" : "sidebar-desktop-collapsed"),
    [isSidebarOpen],
  );

  const resolvedSections = useMemo(
    () => sections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.route !== ROUTES.PROFILE) return item;
        return { ...item, route: getUserProfileRoute(currentUser?.username) };
      }),
    })),
    [currentUser?.username],
  );
  const lockedRoutes = [];

  const userInitials = getInitials(currentUser?.name, currentUser?.username);

  return (
    <>
      {isMobileOpen ? (
        <div className="mobile-sidebar-overlay md:hidden" onClick={onCloseMobile} aria-hidden="true" />
      ) : null}

      {/* Desktop Sidebar */}
      <aside className={`sidebar-desktop ${sidebarWidth}`}>
        <div className="sidebar-desktop-header">
          <div className="sidebar-logo-mark" aria-hidden="true">CS</div>
          {isSidebarOpen && (
            <span className="sidebar-logo-text">Create Sheets</span>
          )}
        </div>

        <nav className="sidebar-scroll" aria-label="Primary">
          {resolvedSections.map((section) => (
            <SidebarSection
              key={section.title}
              title={section.title}
              items={section.items}
              isOpen={isSidebarOpen}
              currentRoute={currentRoute}
              lockedRoutes={lockedRoutes}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          {currentUser ? (
            <>
              <button
                type="button"
                className="sidebar-nav-item sidebar-footer-primary"
                aria-label={currentUser.name || currentUser.username || "Account"}
                title={isSidebarOpen ? undefined : (currentUser.name || currentUser.username || "Account")}
                onClick={() => navigateTo(getUserProfileRoute(currentUser?.username))}
              >
                <span className="sidebar-user-avatar" aria-hidden="true">{userInitials}</span>
                <span className={`sidebar-nav-label ${isSidebarOpen ? "is-visible" : ""}`}>
                  {currentUser.name || currentUser.username || "Account"}
                </span>
              </button>
              <SidebarItem item={{ label: "Settings", icon: Settings }} isOpen={isSidebarOpen} active={currentRoute === ROUTES.EDIT_PROFILE} onClick={() => navigateTo(ROUTES.EDIT_PROFILE)} />
              <SidebarItem
                item={{ label: "Log Out", icon: LogOut }}
                isOpen={isSidebarOpen}
                active={false}
                onClick={() => {
                  const confirmed = window.confirm("Are you sure you want to log out?");
                  if (!confirmed) return;
                  logout();
                  navigateTo(ROUTES.LOGIN);
                }}
              />
            </>
          ) : (
            <SidebarItem item={{ label: "Login", icon: LogIn }} isOpen={isSidebarOpen} active={currentRoute === ROUTES.LOGIN} onClick={() => navigateTo(ROUTES.LOGIN)} />
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="sidebar-toggle-btn"
          >
            {isSidebarOpen ? <ChevronsLeft size={22} strokeWidth={1.9} /> : <ChevronsRight size={23} strokeWidth={1.9} />}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        id={mobileSidebarId}
        aria-hidden={!isMobileOpen}
        className={`sidebar-mobile md:hidden ${isMobileOpen ? "translate-x-0" : ""}`}
      >
        <div className="sidebar-desktop-header">
          <div className="sidebar-logo-mark" aria-hidden="true">CS</div>
          <span className="sidebar-logo-text" style={{ opacity: 1 }}>Create Sheets</span>
          <button type="button" onClick={onCloseMobile} aria-label="Close navigation" title="Close navigation" className="sidebar-mobile-close">
            <X size={22} strokeWidth={1.9} />
          </button>
        </div>

        <nav className="sidebar-scroll" aria-label="Mobile primary">
          {resolvedSections.map((section) => (
            <SidebarSection
              key={`mobile-${section.title}`}
              title={section.title}
              items={section.items}
              isOpen
              currentRoute={currentRoute}
              onItemClick={onCloseMobile}
              lockedRoutes={lockedRoutes}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          {currentUser ? (
            <>
              <button
                type="button"
                className="sidebar-nav-item"
                aria-label={currentUser.name || currentUser.username || "Account"}
                onClick={() => { navigateTo(getUserProfileRoute(currentUser?.username)); onCloseMobile?.(); }}
              >
                <span className="sidebar-user-avatar" aria-hidden="true">{userInitials}</span>
                <span className="sidebar-nav-label is-visible">
                  {currentUser.name || currentUser.username || "Account"}
                </span>
              </button>
              <SidebarItem item={{ label: "Settings", icon: Settings }} isOpen showTooltip={false} active={currentRoute === ROUTES.EDIT_PROFILE} onClick={() => { navigateTo(ROUTES.EDIT_PROFILE); onCloseMobile?.(); }} />
              <SidebarItem
                item={{ label: "Log Out", icon: LogOut }}
                isOpen
                showTooltip={false}
                active={false}
                onClick={() => {
                  const confirmed = window.confirm("Are you sure you want to log out?");
                  if (!confirmed) return;
                  logout();
                  navigateTo(ROUTES.LOGIN);
                  onCloseMobile?.();
                }}
              />
            </>
          ) : (
            <SidebarItem item={{ label: "Login", icon: LogIn }} isOpen showTooltip={false} active={currentRoute === ROUTES.LOGIN} onClick={() => { navigateTo(ROUTES.LOGIN); onCloseMobile?.(); }} />
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
