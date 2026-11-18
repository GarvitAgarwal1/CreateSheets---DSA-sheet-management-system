import { useEffect, useMemo, useRef, useState } from "react";
import { fetchPlatformProfiles, syncPlatformProfiles } from "../api/platformApi";
import { fetchProfile } from "../api/profileApi";
import AppShell from "../components/AppShell";
import CodingStatsPanel from "../components/CodingStatsPanel";
import PortfolioShowcase from "../components/PortfolioShowcase";
import SeoMeta from "../components/SeoMeta";
import EmptyState from "../components/ui/EmptyState";
import ProgressBar from "../components/ui/ProgressBar";
import SurfaceCard from "../components/ui/SurfaceCard";
import PremiumLotusBadge from "../components/PremiumLotusBadge";
import { calculateSheetProgress } from "../services/progress";
import { getPublicSheetPath, getUserProfileRoute, navigateTo, ROUTES } from "../services/routes";
import { useAuthStore } from "../store/authStore";
import { useSheetStore } from "../store/sheetStore";
import { buildDistribution, DEFAULT_DIFFICULTY_CATEGORIES } from "../services/difficultyCategories";
import { buildTopicDistribution } from "../services/topicTags";

const EMPTY_CODING_STATS = {
  profiles: [],
  aggregate: {
    totalSolved: 0,
    difficulty: {
      easy: 0,
      medium: 0,
      hard: 0,
      unknown: 0,
    },
    topics: [],
    activity: [],
    contests: 0,
    lastSyncedAt: null,
  },
};

const hasCodingProfiles = (codingStats) => Array.isArray(codingStats?.profiles) && codingStats.profiles.length > 0;

function ProfilePage({ theme, onThemeChange, onLogout }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);
  const createNewSheet = useSheetStore((state) => state.createNewSheet);
  const deleteSheet = useSheetStore((state) => state.deleteSheet);
  const duplicateSheetById = useSheetStore((state) => state.duplicateSheetById);
  const setSheetVisibility = useSheetStore((state) => state.setSheetVisibility);
  const setSheetArchived = useSheetStore((state) => state.setSheetArchived);
  const limitWarning = useSheetStore((state) => state.limitWarning);
  const clearLimitWarning = useSheetStore((state) => state.clearLimitWarning);

  const [engagementViewer, setEngagementViewer] = useState(null);
  const [profileDetails, setProfileDetails] = useState(currentUser || null);
  const [mySheetsFilter, setMySheetsFilter] = useState("all");
  const [mySheetsSortOrder, setMySheetsSortOrder] = useState("updated-desc");
  const [openSheetMenuId, setOpenSheetMenuId] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [platformDashboard, setPlatformDashboard] = useState(null);
  const [platformStatus, setPlatformStatus] = useState("");
  const [isSyncingPlatforms, setIsSyncingPlatforms] = useState(false);
  const totalSheetsSectionRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.token) return;
    loadSheets(currentUser.token);
  }, [currentUser?.token, loadSheets]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.token) return;
      const profile = await fetchProfile(currentUser.token);
      setProfileDetails(profile);
    };
    loadProfile();
  }, [currentUser?.token]);

  useEffect(() => {
    const loadPlatformDashboard = async () => {
      if (!currentUser?.token) return;
      try {
        const payload = await fetchPlatformProfiles(currentUser.token);
        setPlatformDashboard(payload);
      } catch {
        setPlatformStatus("Coding profiles could not be loaded. Add or refresh profiles to try again.");
      }
    };
    loadPlatformDashboard();
  }, [currentUser?.token]);

  useEffect(() => {
    if (!openSheetMenuId) return undefined;

    const closeMenu = () => setOpenSheetMenuId(null);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [openSheetMenuId]);

  const persistedUsername = (profileDetails?.username || currentUser?.username || "username").trim().toLowerCase();
  const profileShareUrl = `${window.location.origin}/profile/${persistedUsername}`;
  const archivedSheets = sheets.filter((sheet) => sheet.isArchived);
  const publicSheets = sheets.filter((sheet) => sheet.isPublic);
  const progressSheets = sheets.filter((sheet) => !sheet.isPublic && !sheet.isArchived);

  const mySheetsFilterOptions = [
    { key: "all", label: "All", count: sheets.length },
    { key: "public", label: "Public Sheets", count: publicSheets.length },
    { key: "archived", label: "Archived Sheets", count: archivedSheets.length },
    { key: "progress", label: "In Progress", count: progressSheets.length },
  ];

  const filteredMySheets = useMemo(() => {
    let selectedSheets = sheets;

    if (mySheetsFilter === "public") selectedSheets = publicSheets;
    else if (mySheetsFilter === "archived") selectedSheets = archivedSheets;
    else if (mySheetsFilter === "progress") selectedSheets = progressSheets;

    const sortedSheets = [...selectedSheets].sort((a, b) => {
      if (mySheetsSortOrder === "title-asc") return (a.title || "").localeCompare(b.title || "");
      if (mySheetsSortOrder === "title-desc") return (b.title || "").localeCompare(a.title || "");
      if (mySheetsSortOrder === "created-asc") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (mySheetsSortOrder === "created-desc") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (mySheetsSortOrder === "updated-asc") return new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

    return sortedSheets;
  }, [archivedSheets, mySheetsFilter, mySheetsSortOrder, progressSheets, publicSheets, sheets]);

  const totalDownloadCount = sheets.reduce((sum, sheet) => sum + (sheet.downloadedByUsernames?.length || 0), 0);
  const totalCopyCount = sheets.reduce((sum, sheet) => sum + (sheet.copiedByUsernames?.length || 0), 0);
  const allDownloadedUsers = sheets.flatMap((sheet) => (sheet.downloadedByUsernames || []).map((username) => ({ username, sheetTitle: sheet.title })));
  const allCopiedUsers = sheets.flatMap((sheet) => (sheet.copiedByUsernames || []).map((username) => ({ username, sheetTitle: sheet.title })));
  const followers = profileDetails?.followers || [];
  const following = profileDetails?.following || [];

  const verifiedPlatformProfiles = useMemo(
    () => (platformDashboard?.profiles || []).filter((profile) => profile.verificationStatus === "verified"),
    [platformDashboard?.profiles],
  );

  const realCodingStats = useMemo(() => {
    if (verifiedPlatformProfiles.length) {
      return {
        profiles: verifiedPlatformProfiles,
        aggregate: platformDashboard?.aggregate || {},
      };
    }
    if (hasCodingProfiles(profileDetails?.codingStats)) return profileDetails.codingStats;
    return null;
  }, [platformDashboard?.aggregate, profileDetails?.codingStats, verifiedPlatformProfiles]);

  const codingStatsForDashboard = realCodingStats || EMPTY_CODING_STATS;

  const syncCodingProfiles = async () => {
    if (!currentUser?.token) {
      navigateTo(ROUTES.LOGIN);
      return;
    }
    if (!verifiedPlatformProfiles.length && !hasCodingProfiles(profileDetails?.codingStats)) {
      setPlatformStatus("Add and verify at least one coding profile before refreshing stats.");
      navigateTo(ROUTES.ADD_ACCOUNTS);
      return;
    }
    setIsSyncingPlatforms(true);
    setPlatformStatus("Syncing verified platform APIs...");
    try {
      const payload = await syncPlatformProfiles(currentUser.token);
      setPlatformDashboard(payload);
      const freshProfile = await fetchProfile(currentUser.token);
      setProfileDetails(freshProfile);
      setPlatformStatus("Coding stats cache refreshed.");
      window.setTimeout(() => setPlatformStatus(""), 1800);
    } catch (syncError) {
      setPlatformStatus(syncError?.message || "Unable to sync coding profiles right now.");
    } finally {
      setIsSyncingPlatforms(false);
    }
  };

  const copyProfileUrl = async () => {
    setCopyStatus("");
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileShareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = profileShareUrl;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("Copy failed");
    }
  };

  const scrollToSection = (sectionRef) => {
    sectionRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };


  const formatSheetDate = (value, options = {}) => {
    const date = new Date(value || 0);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return new Intl.DateTimeFormat("en-US", options).format(date);
  };

  const renderStatusBadge = (label, tone = "default") => (
    <span className={`profile-sheet-badge profile-sheet-badge--${tone}`}>{label}</span>
  );

  const renderSheetRow = (sheet, options = { showManageActions: false }) => {
    const progress = calculateSheetProgress(sheet);
    const categorySummary = buildDistribution(sheet.topics || [], DEFAULT_DIFFICULTY_CATEGORIES).categories.slice(0, 3);
    const topicSummary = buildTopicDistribution(sheet.topics || [], sheet.topicTags || []).items.slice(0, 3);
    const isMenuOpen = openSheetMenuId === sheet.id;
    const closeSheetMenu = () => setOpenSheetMenuId(null);

    return (
      <article
        key={sheet.id}
        className={`surface-card surface-card-elevated profile-sheet-row profile-sheet-row--clickable ${isMenuOpen ? "profile-sheet-row--menu-open" : ""}`}
        role="link"
        tabIndex={0}
        aria-label={`Open ${sheet.title || "Untitled Sheet"}`}
        onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigateTo(`${ROUTES.APP}/${sheet.id}`);
          }
        }}
      >
        <div className="profile-sheet-row__layout">
          <div className="profile-sheet-row__main">
            <div className="profile-sheet-row__header">
              <div className="profile-sheet-row__avatar" aria-hidden="true"></div>
              <div className="profile-sheet-row__heading">
                <p className="profile-sheet-row__title">{sheet.title || "Untitled Sheet"}</p>
                <div className="profile-sheet-row__badges">
                  {renderStatusBadge(sheet.isPublic ? " Public" : " Private")}
                  {renderStatusBadge(sheet.shareProgress ? " Shared On" : " Shared Off")}
                  {renderStatusBadge(` ${progress.percent}% Complete`, progress.percent > 70 ? "success" : "warning")}
                  {sheet.isArchived ? renderStatusBadge(" Archived", "muted") : null}
                </div>
              </div>
            </div>

            <div className="profile-sheet-row__progress-wrap">
              <ProgressBar percent={progress.percent} tone={progress.percent > 70 ? "success" : "warning"} />
              <span className="profile-sheet-row__progress-label">{progress.percent}%</span>
            </div>

            {categorySummary.length > 0 || topicSummary.length > 0 ? (
              <p className="profile-sheet-row__description">
                {categorySummary.slice(0, 2).map((entry) => `${entry.label} ${entry.completed}/${entry.count}`).join(" · ")}
                {topicSummary.length > 0 ? ` • ${topicSummary.slice(0, 1).map((entry) => `${entry.label} ${entry.count}`).join("")}` : ""}
              </p>
            ) : null}

            <div className="profile-sheet-row__meta">
              <span> Created {formatSheetDate(sheet.createdAt, { month: "short", day: "numeric", year: "numeric" })}</span>
              <span> Updated {formatSheetDate(sheet.updatedAt, { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
            </div>

            {sheet.isPublic ? <p className="meta-text profile-sheet-row__url">{getPublicSheetPath(persistedUsername, sheet.title || "Untitled Sheet")}</p> : null}
          </div>

          <div className="profile-sheet-row__actions">
            <button className="btn-base btn-neutral profile-sheet-row__action-btn" type="button" onClick={(event) => { event.stopPropagation(); navigateTo(`${ROUTES.APP}/${sheet.id}`); }}>↗ Open</button>
            {options.showManageActions ? (
              <div className={`profile-sheet-row__more ${isMenuOpen ? "profile-sheet-row__more--open" : ""}`} onClick={(event) => event.stopPropagation()}>
                <button
                  className="btn-base btn-neutral profile-sheet-row__action-btn"
                  type="button"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setOpenSheetMenuId(isMenuOpen ? null : sheet.id)}
                >
                  Manage
                </button>
                {isMenuOpen ? (
                  <div className="profile-sheet-row__menu" role="menu">
                    <button className="profile-sheet-row__menu-action" type="button" role="menuitem" onClick={() => { closeSheetMenu(); navigateTo(`${ROUTES.APP}/${sheet.id}`); }}>Share</button>
                    <button className="profile-sheet-row__menu-action" type="button" role="menuitem" onClick={async () => { closeSheetMenu(); await setSheetVisibility(currentUser.token, sheet.id, !sheet.isPublic); }}>{sheet.isPublic ? "Make private" : "Make public"}</button>
                    <button className="profile-sheet-row__menu-action" type="button" role="menuitem" onClick={async () => { closeSheetMenu(); await setSheetArchived(currentUser.token, sheet.id, !sheet.isArchived); }}>{sheet.isArchived ? "Restore" : "Archive"}</button>
                    <button
                      className="profile-sheet-row__menu-action"
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        closeSheetMenu();
                        const copied = await duplicateSheetById(currentUser.token, sheet.id);
                        if (copied?.id) navigateTo(`${ROUTES.APP}/${copied.id}`);
                      }}
                    >
                      Copy
                    </button>
                    <button
                      className="profile-sheet-row__menu-action profile-sheet-row__menu-action--danger"
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        closeSheetMenu();
                        if (!window.confirm("Are you sure to delete this sheet?")) return;
                        await deleteSheet(currentUser.token, sheet.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  };

  return (
    <AppShell
      title="Coding Profile Dashboard"
      subtitle="Verified coding platforms, public stats, sheets, and developer portfolio in one place"
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Account"}
      headerActions={(
        <>
          <button type="button" onClick={() => navigateTo(ROUTES.ADD_ACCOUNTS)} className="btn-base btn-neutral btn-sm profile-header-action--sm-up">Add Profile</button>
          <button type="button" onClick={syncCodingProfiles} className="btn-base btn-primary btn-sm" disabled={isSyncingPlatforms}>
            <span className="sm:hidden">{isSyncingPlatforms ? "..." : "Sync"}</span>
            <span className="hidden sm:inline">{isSyncingPlatforms ? "Syncing..." : "Sync Stats"}</span>
          </button>
          <button onClick={onLogout} className="btn-base btn-danger btn-sm profile-header-action--md-up">Logout</button>
        </>
      )}
    >
      <SeoMeta
        title="Dashboard | Create Sheets Sheet Tracker"
        description="Manage your custom sheets, coding practice tracker progress, and public sharing settings from your Create Sheets dashboard."
        path="/profile"
        noIndex
        keywords={["dashboard", "sheet tracker", "coding practice tracker"]}
      />
      <div className="space-y-5">
        <CodingStatsPanel
          codingStats={codingStatsForDashboard}
          title="Coding Dashboard"
          publicSheets={publicSheets}
          profile={profileDetails || currentUser}
          profileShareUrl={profileShareUrl}
          copyStatus={copyStatus}
          onCopyProfileUrl={copyProfileUrl}
          onPreviewProfile={() => navigateTo(getUserProfileRoute(persistedUsername))}
          onEditProfile={() => navigateTo(ROUTES.EDIT_PROFILE)}
          onAddProfile={() => navigateTo(ROUTES.ADD_ACCOUNTS)}
          profileStats={{
            followers: profileDetails?.followersCount ?? followers.length,
            following: profileDetails?.followingCount ?? following.length,
            sheets: sheets.length,
            downloaded: totalDownloadCount,
            copied: totalCopyCount,
          }}
          onShowFollowers={() => setEngagementViewer({ title: "Followers", users: followers.map((entry) => ({ ...entry, sheetTitle: "" })) })}
          onShowFollowing={() => setEngagementViewer({ title: "Following", users: following.map((entry) => ({ ...entry, sheetTitle: "" })) })}
          onShowSheets={() => { setMySheetsFilter("all"); scrollToSection(totalSheetsSectionRef); }}
          onShowDownloads={() => setEngagementViewer({ title: "Downloaded by", users: allDownloadedUsers })}
          onShowCopies={() => setEngagementViewer({ title: "Copied by", users: allCopiedUsers })}
        />

        {platformStatus ? <div className="alert-banner alert-banner--info">{platformStatus}</div> : null}

        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="caption-text text-xs">Portfolio Preview</p>
              <h2 className="section-title mt-1">Public developer profile</h2>
            </div>
            <button className="btn-base btn-neutral text-sm" type="button" onClick={() => navigateTo(ROUTES.EDIT_PROFILE)}>
              Edit Portfolio
            </button>
          </div>
          <PortfolioShowcase profile={profileDetails} isOwner />
        </section>

        <div ref={totalSheetsSectionRef}>
          <SurfaceCard title="My Sheets" description="View all, public, archived, and active progress sheets from one place.">
            <div className="profile-sheet-toolbar">
              {limitWarning ? <div className="alert-banner alert-banner--warning w-full flex items-center justify-between gap-2"><span>{limitWarning}</span><button type="button" className="btn-base btn-neutral px-2 py-1 text-xs" onClick={clearLimitWarning}>Dismiss</button></div> : null}
              <button
                type="button"
                className="btn-base btn-primary"
                onClick={async () => {
                  if (!currentUser?.token) {
                    navigateTo(ROUTES.LOGIN);
                    return;
                  }

                  const created = await createNewSheet(currentUser.token, "Untitled Sheet");
                  if (created?.id) navigateTo(`${ROUTES.APP}/${created.id}`);
                }}
              >
                + New Sheet
              </button>
              <label className="profile-sheet-toolbar__label">
                Show
                <select
                  className="field-base profile-sheet-toolbar__select"
                  value={mySheetsFilter}
                  onChange={(event) => setMySheetsFilter(event.target.value)}
                >
                  {mySheetsFilterOptions.map((option) => (
                    <option key={option.key} value={option.key}>{option.label} ({option.count})</option>
                  ))}
                </select>
              </label>
              <label className="profile-sheet-toolbar__label profile-sheet-toolbar__label--sort">
                Sort
                <select
                  className="field-base profile-sheet-toolbar__select"
                  value={mySheetsSortOrder}
                  onChange={(event) => setMySheetsSortOrder(event.target.value)}
                >
                  <option value="updated-desc">Last updated (newest first)</option>
                  <option value="updated-asc">Last updated (oldest first)</option>
                  <option value="created-desc">Created (newest first)</option>
                  <option value="created-asc">Created (oldest first)</option>
                  <option value="title-asc">Title (A–Z)</option>
                  <option value="title-desc">Title (Z–A)</option>
                </select>
              </label>
            </div>
            {filteredMySheets.length === 0 ? (
              <EmptyState title="No sheets found" description="Try another filter or create a new sheet." icon="" />
            ) : (
              <div className="space-y-3">{filteredMySheets.map((sheet) => renderSheetRow(sheet, { showManageActions: true }))}</div>
            )}
          </SurfaceCard>
        </div>

        {engagementViewer ? (
          <div className="overlay-shell">
            <div className="overlay-panel max-h-[86dvh] max-w-lg overflow-y-auto p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="section-title">{engagementViewer.title}</h3>
                <button type="button" className="btn-base btn-neutral px-2 py-1 text-xs" onClick={() => setEngagementViewer(null)}>Close</button>
              </div>
              {engagementViewer.users.length === 0 ? (
                <p className="meta-text">No users yet.</p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-auto">
                  {engagementViewer.users.map((entry, index) => (
                    <div key={`${entry.username}-${entry.sheetTitle}-${index}`} className="surface-card surface-card-elevated p-3 text-sm">
                      <p className="card-title inline-flex items-center gap-2">
                        <button
                          type="button"
                          className="hover:underline"
                          onClick={() => navigateTo(`/profile/${entry.username}`)}
                        >
                          @{entry.username}
                        </button>
                        <PremiumLotusBadge active={Boolean(entry?.premiumActive)} size="sm" />
                      </p>
                      <p className="meta-text">{entry.sheetTitle ? `Sheet: ${entry.sheetTitle || "Untitled Sheet"}` : (entry.name || "Create Sheets user")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

export default ProfilePage;
