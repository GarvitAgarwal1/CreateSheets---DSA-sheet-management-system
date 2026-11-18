import { useEffect, useId, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import AlertBar from "./AlertBar";
import NotificationBell from "./NotificationBell";
import { ROUTES } from "../services/routes";

const footerLinks = [
  { label: "Home", href: ROUTES.HOME },
  { label: "About & Support", href: ROUTES.ABOUT },
  { label: "Careers", href: ROUTES.CAREERS },
];

function AppShell({
  title,
  subtitle,
  titleActions,
  userLabel,
  headerActions,
  rightPanel,
  alert,
  onDismissAlert,
  children,
  contentClassName = "",
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const mobileSidebarId = useId();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!isMobileNavOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileNavOpen]);

  return (
    <div className="app-shell">
      <div
        className="app-shell-grid"
        style={{
          "--sidebar-collapsed-width": "84px",
          "--sidebar-expanded-width": "clamp(264px, 21vw, 292px)",
          "--sidebar-width": isSidebarOpen ? "var(--sidebar-expanded-width)" : "var(--sidebar-collapsed-width)",
        }}
      >
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          isMobileOpen={isMobileNavOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          mobileSidebarId={mobileSidebarId}
        />

        <div className="app-content">
          <button
            type="button"
            aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileNavOpen}
            aria-controls={mobileSidebarId}
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            className={`mobile-sidebar-toggle${isMobileNavOpen ? " mobile-sidebar-toggle--hidden" : ""}`}
          >
            <Menu size={22} strokeWidth={1.9} aria-hidden="true" />
          </button>

          <TopBar
            userLabel={userLabel}
            actions={(
              <>
                <div className="flex-none">
                  <NotificationBell compact />
                </div>
                {headerActions}
              </>
            )}
          />

          <div className="mx-auto w-full max-w-[var(--content-max-width)] px-1 lg:px-3 pt-4">
            <AlertBar message={alert} onDismiss={onDismissAlert} />

            {title ? (
              <header className="mb-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="page-title">{title}</h1>
                    {subtitle ? <p className="meta-text mt-1">{subtitle}</p> : null}
                  </div>
                  {titleActions ? <div className="flex flex-wrap gap-2">{titleActions}</div> : null}
                </div>
              </header>
            ) : null}

            <div className={`section-fade-in grid gap-5 ${rightPanel ? "xl:grid-cols-[minmax(0,1fr)_280px]" : ""}`}>
              <main className={`min-w-0 ${contentClassName || ""}`.trim()}>{children}</main>
              {rightPanel ? <aside className="min-w-0 xl:sticky xl:top-6 xl:h-fit">{rightPanel}</aside> : null}
            </div>

            <footer className="app-footer">
              <div className="app-footer-inner">
                <p className="text-xs tracking-wide text-[var(--text-tertiary)]">
                  © {currentYear} Create Sheets
                </p>
                <nav aria-label="Footer links" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  {footerLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
