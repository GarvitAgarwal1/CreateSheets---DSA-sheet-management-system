import { useEffect, useMemo, useRef, useState } from "react";
import {
  deletePlatformProfile,
  fetchPlatformProfiles,
  requestPlatformVerification,
  syncPlatformProfiles,
  verifyPlatformProfile,
} from "../api/platformApi";
import AppShell from "../components/AppShell";
import CodingStatsPanel from "../components/CodingStatsPanel";
import SeoMeta from "../components/SeoMeta";
import SurfaceCard from "../components/ui/SurfaceCard";
import { useAuthStore } from "../store/authStore";

const FALLBACK_PLATFORMS = [
  { key: "leetcode", label: "LeetCode", shortLabel: "LC", profilePrefix: "https://leetcode.com/u/", reliabilityTier: "core", statsSource: "graphql_public", strictVerificationPossible: true },
  { key: "codeforces", label: "Codeforces", shortLabel: "CF", profilePrefix: "https://codeforces.com/profile/", reliabilityTier: "core", statsSource: "official_api", strictVerificationPossible: true },
  { key: "codechef", label: "CodeChef", shortLabel: "CC", profilePrefix: "https://www.codechef.com/users/", reliabilityTier: "best_effort", statsSource: "community_api", strictVerificationPossible: true },
  { key: "atcoder", label: "AtCoder", shortLabel: "AC", profilePrefix: "https://atcoder.jp/users/", reliabilityTier: "best_effort", statsSource: "unofficial_api", strictVerificationPossible: true },
  { key: "hackerrank", label: "HackerRank", shortLabel: "HR", profilePrefix: "https://www.hackerrank.com/profile/", reliabilityTier: "best_effort", statsSource: "undocumented_public_api", strictVerificationPossible: true },
  { key: "hackerearth", label: "HackerEarth", shortLabel: "HE", profilePrefix: "https://www.hackerearth.com/@", reliabilityTier: "best_effort", statsSource: "html_scrape", strictVerificationPossible: true },
  { key: "topcoder", label: "Topcoder", shortLabel: "TC", profilePrefix: "https://www.topcoder.com/members/", reliabilityTier: "best_effort", statsSource: "html_scrape", strictVerificationPossible: true },
  { key: "spoj", label: "SPOJ", shortLabel: "SP", profilePrefix: "https://www.spoj.com/users/", reliabilityTier: "best_effort", statsSource: "html_scrape", strictVerificationPossible: true },
  { key: "kattis", label: "Kattis", shortLabel: "KT", profilePrefix: "https://open.kattis.com/users/", reliabilityTier: "best_effort", statsSource: "html_scrape", strictVerificationPossible: true },
  { key: "cses", label: "CSES", shortLabel: "CS", profilePrefix: "https://cses.fi/user/", reliabilityTier: "unavailable", statsSource: "none", strictVerificationPossible: false },
  { key: "codewars", label: "Codewars", shortLabel: "CW", profilePrefix: "https://www.codewars.com/users/", reliabilityTier: "core", statsSource: "official_api", strictVerificationPossible: true },
  { key: "exercism", label: "Exercism", shortLabel: "EX", profilePrefix: "https://exercism.org/profiles/", reliabilityTier: "core", statsSource: "official_api", strictVerificationPossible: true },
  { key: "codesignal", label: "CodeSignal", shortLabel: "CSG", profilePrefix: "https://app.codesignal.com/profile/", reliabilityTier: "best_effort", statsSource: "html_scrape", strictVerificationPossible: true },
  { key: "codingame", label: "CodinGame", shortLabel: "CG", profilePrefix: "https://www.codingame.com/profile/", reliabilityTier: "best_effort", statsSource: "html_scrape", strictVerificationPossible: true },
  { key: "dmoj", label: "DMOJ", shortLabel: "DM", profilePrefix: "https://dmoj.ca/user/", reliabilityTier: "best_effort", statsSource: "html_scrape", strictVerificationPossible: true },
  { key: "github", label: "GitHub", shortLabel: "GH", profilePrefix: "https://github.com/", reliabilityTier: "core", statsSource: "official_api", strictVerificationPossible: true },
];

const STATUS_LABELS = {
  verified: "Verified",
  pending: "Pending",
  failed: "Needs check",
};

const RELIABILITY_ORDER = {
  core: 0,
  best_effort: 1,
  unavailable: 2,
};

const RELIABILITY_LABELS = {
  core: "Core",
  best_effort: "Best effort",
  unavailable: "Unavailable",
};

function sourceLabel(value) {
  if (!value) return "Unknown source";
  return String(value).replaceAll("_", " ");
}

function statusClass(status) {
  if (status === "verified") return "profile-sheet-badge--success";
  if (status === "failed") return "profile-sheet-badge--warning";
  return "profile-sheet-badge--muted";
}

function AddAccountsPage({ theme, onThemeChange }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [dashboard, setDashboard] = useState(null);
  const [activeProfileId, setActiveProfileId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [platform, setPlatform] = useState("leetcode");
  const [username, setUsername] = useState("");
  const [platformDrafts, setPlatformDrafts] = useState({});
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [syncState, setSyncState] = useState({ active: false, progress: 0, message: "" });
  const progressTimerRef = useRef(null);

  const platforms = useMemo(() => {
    const catalog = dashboard?.platforms?.length ? dashboard.platforms : FALLBACK_PLATFORMS;
    return [...catalog].sort((left, right) => {
      const leftOrder = RELIABILITY_ORDER[left.reliabilityTier] ?? 3;
      const rightOrder = RELIABILITY_ORDER[right.reliabilityTier] ?? 3;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return String(left.label || left.key).localeCompare(String(right.label || right.key));
    });
  }, [dashboard?.platforms]);
  const profiles = dashboard?.profiles || [];
  const verifiedProfiles = profiles.filter((profile) => profile.verificationStatus === "verified");
  const selectedProfile = profiles.find((profile) => profile.id === activeProfileId) || profiles[0] || null;
  const platformGroups = useMemo(() => ({
    core: platforms.filter((item) => item.reliabilityTier === "core"),
    best_effort: platforms.filter((item) => item.reliabilityTier === "best_effort"),
    unavailable: platforms.filter((item) => item.reliabilityTier === "unavailable"),
  }), [platforms]);

  const codingStats = useMemo(() => ({
    profiles: verifiedProfiles,
    aggregate: dashboard?.aggregate || {},
  }), [dashboard?.aggregate, verifiedProfiles]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.token) return;
      setError("");
      try {
        const payload = await fetchPlatformProfiles(currentUser.token);
        setDashboard(payload);
        setActiveProfileId((previous) => previous || payload?.profiles?.[0]?.id || "");
      } catch (loadError) {
        setError(loadError?.message || "Unable to load coding profiles.");
      }
    };
    load();
  }, [currentUser?.token]);

  const updateDashboard = (payload) => {
    setDashboard(payload);
    const nextProfiles = payload?.profiles || [];
    if (!nextProfiles.some((profile) => profile.id === activeProfileId)) {
      setActiveProfileId(nextProfiles[0]?.id || "");
    }
  };

  const runTimedProgress = (durationMs, message) => {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    const startedAt = Date.now();
    setSyncState({ active: true, progress: 4, message });
    progressTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(94, Math.round((elapsed / Math.max(durationMs, 1)) * 100));
      setSyncState({ active: true, progress, message });
      if (progress >= 94) window.clearInterval(progressTimerRef.current);
    }, 180);
  };

  const stopTimedProgress = (message = "Cached stats updated.") => {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    setSyncState({ active: true, progress: 100, message });
    window.setTimeout(() => setSyncState({ active: false, progress: 0, message: "" }), 650);
  };

  const profileForPlatform = (platformKey) => profiles.find((profile) => profile.platform === platformKey);

  const draftForPlatform = (platformKey) => platformDrafts[platformKey] ?? profileForPlatform(platformKey)?.username ?? "";

  const updatePlatformDraft = (platformKey, value) => {
    setPlatformDrafts((previous) => ({ ...previous, [platformKey]: value }));
  };

  const handleRequestVerification = async (platformKey = platform, rawUsername = username) => {
    const trimmedUsername = rawUsername.trim();
    if (!trimmedUsername) {
      setError("Please enter a username.");
      return;
    }
    setBusyAction("request");
    setError("");
    setPlatform(platformKey);
    try {
      const payload = await requestPlatformVerification(currentUser.token, { platform: platformKey, username: trimmedUsername });
      updateDashboard(payload);
      const created = payload?.profiles?.find((profile) => profile.platform === platformKey && profile.username.toLowerCase() === trimmedUsername.toLowerCase());
      setActiveProfileId(created?.id || payload?.profiles?.[0]?.id || "");
      setIsAdding(false);
      setUsername("");
      setPlatformDrafts((previous) => ({ ...previous, [platformKey]: trimmedUsername }));
    } catch (requestError) {
      setError(requestError?.message || "Unable to create verification code.");
    } finally {
      setBusyAction("");
    }
  };

  const handleVerify = async (profileId) => {
    setBusyAction(`verify:${profileId}`);
    setError("");
    try {
      const payload = await verifyPlatformProfile(currentUser.token, profileId);
      updateDashboard(payload);
    } catch (verifyError) {
      setError(verifyError?.message || "Verification failed.");
    } finally {
      setBusyAction("");
    }
  };

  const handleDelete = async (profileId) => {
    setBusyAction(`delete:${profileId}`);
    setError("");
    try {
      const payload = await deletePlatformProfile(currentUser.token, profileId);
      updateDashboard(payload);
    } catch (deleteError) {
      setError(deleteError?.message || "Unable to remove profile.");
    } finally {
      setBusyAction("");
    }
  };

  const handleSync = async () => {
    if (!verifiedProfiles.length) {
      setError("Verify at least one profile before syncing stats.");
      return;
    }
    setBusyAction("sync");
    setError("");
    const startedAt = Date.now();
    runTimedProgress(6_000, "Syncing public platform APIs...");
    try {
      const payload = await syncPlatformProfiles(currentUser.token);
      updateDashboard(payload);
      const targetDuration = Number(payload?.loadingDurationMs || 4_000);
      const remaining = Math.max(700, targetDuration - (Date.now() - startedAt));
      runTimedProgress(remaining, "Preparing cached dashboard...");
      window.setTimeout(() => stopTimedProgress(), remaining);
    } catch (syncError) {
      setError(syncError?.message || "Unable to sync platform stats.");
      stopTimedProgress("Sync stopped.");
    } finally {
      setBusyAction("");
    }
  };

  const copyCode = async (code, profileId) => {
    if (!code) return;
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedCode(profileId);
      window.setTimeout(() => setCopiedCode(""), 1200);
    } catch {
      setCopiedCode("");
      setError("Could not copy the code. Select it manually and copy.");
    }
  };

  const renderPlatformRow = (item) => {
    const connectedProfile = profileForPlatform(item.key);
    const draftValue = draftForPlatform(item.key);
    const isUnavailable = item.strictVerificationPossible === false || item.reliabilityTier === "unavailable";
    const isRowBusy = busyAction === `request:${item.key}` || busyAction === "request" || busyAction === `verify:${connectedProfile?.id}` || busyAction === `delete:${connectedProfile?.id}`;
    const prefix = item.profilePrefix || "";

    return (
      <div key={item.key} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 transition hover:border-[var(--accent-primary)]/60">
        <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-center">
          <button
            type="button"
            className="flex min-w-0 items-center gap-3 text-left"
            onClick={() => {
              setPlatform(item.key);
              if (connectedProfile) {
                setActiveProfileId(connectedProfile.id);
                setIsAdding(false);
              }
            }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-extrabold text-[var(--accent-primary)]">
              {item.shortLabel || item.label?.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="card-title block truncate">{item.label}</span>
              <span className="meta-text mt-0.5 block truncate text-xs">{RELIABILITY_LABELS[item.reliabilityTier] || "Best effort"} • {sourceLabel(item.statsSource)}</span>
            </span>
          </button>

          <label className="flex min-w-0 overflow-hidden rounded-lg border border-[var(--border-strong)] bg-[var(--surface-elevated)] focus-within:border-[var(--accent-primary)]">
            <span className="flex max-w-[58%] shrink-0 items-center overflow-hidden border-r border-[var(--border-subtle)] px-3 text-sm text-[var(--text-muted)] sm:max-w-[54%]">
              <span className="truncate">{prefix}</span>
            </span>
            <input
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-[var(--text-primary)] outline-none"
              value={draftValue}
              onChange={(event) => updatePlatformDraft(item.key, event.target.value)}
              placeholder="username"
              disabled={Boolean(connectedProfile?.verificationStatus === "verified")}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {connectedProfile ? (
              <>
                <span className={`profile-sheet-badge ${statusClass(connectedProfile.verificationStatus)}`}>
                  {STATUS_LABELS[connectedProfile.verificationStatus] || connectedProfile.verificationStatus}
                </span>
                {connectedProfile.verificationStatus !== "verified" ? (
                  <button
                    type="button"
                    className="btn-base btn-primary btn-sm"
                    onClick={() => {
                      setActiveProfileId(connectedProfile.id);
                      setIsAdding(false);
                    }}
                    disabled={isRowBusy}
                  >
                    Verify
                  </button>
                ) : (
                  <a className="btn-base btn-neutral btn-sm" href={connectedProfile.profileUrl} target="_blank" rel="noreferrer">Open</a>
                )}
                <button
                  type="button"
                  className="btn-base btn-danger btn-sm"
                  onClick={() => handleDelete(connectedProfile.id)}
                  disabled={isRowBusy}
                  aria-label={`Remove ${item.label}`}
                >
                  Remove
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-base btn-primary btn-sm"
                onClick={() => handleRequestVerification(item.key, draftValue)}
                disabled={isUnavailable || isRowBusy}
              >
                {isUnavailable ? "Unavailable" : "Connect"}
              </button>
            )}
          </div>
        </div>
        <p className="meta-text mt-2 text-xs">
          {connectedProfile?.verificationMessage || item.verificationInstructions || "Enter the username part only. The profile URL prefix stays fixed."}
        </p>
      </div>
    );
  };

  const renderAddPanel = () => (
    <SurfaceCard
      title="Connect Coding Platforms"
      description="Enter only the username part. Each row keeps the platform URL fixed and then creates the strict public verification code."
      actions={<button type="button" className="btn-base btn-neutral text-sm" onClick={() => setIsAdding(false)}>Back</button>}
    >
      <div className="space-y-5">
        {(["core", "best_effort", "unavailable"]).map((groupKey) => (
          <section key={groupKey}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="caption-text text-xs">{RELIABILITY_LABELS[groupKey]}</p>
                <p className="meta-text text-xs">
                  {groupKey === "core"
                    ? "Fast public APIs and the most reliable stats."
                    : groupKey === "best_effort"
                      ? "Public APIs or scraping connectors that may be slower."
                      : "Shown for completeness, but strict verification is unavailable."}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {(platformGroups[groupKey] || []).map(renderPlatformRow)}
            </div>
          </section>
        ))}
      </div>
    </SurfaceCard>
  );

  const renderVerificationPanel = (profile) => (
    <SurfaceCard
      title={`${profile.platformLabel || profile.platform} Verification`}
      description="Strict proof is required before this profile can appear publicly."
      actions={(
        <div className="flex flex-wrap gap-2">
          <a className="btn-base btn-neutral text-sm" href={profile.profileUrl} target="_blank" rel="noreferrer">Open profile</a>
          <button type="button" className="btn-base btn-danger text-sm" onClick={() => handleDelete(profile.id)} disabled={busyAction === `delete:${profile.id}`}>Remove</button>
        </div>
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="surface-card surface-card-elevated p-4">
          <p className="caption-text text-xs">Place this code in {profile.verificationTarget || "your public profile"}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-md bg-[var(--surface-muted)] px-3 py-2 text-lg font-semibold text-[var(--text-primary)]">{profile.verificationCode || "Request a code"}</code>
            <button type="button" className="btn-base btn-neutral text-sm" onClick={() => copyCode(profile.verificationCode, profile.id)} disabled={!profile.verificationCode}>
              {copiedCode === profile.id ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="meta-text mt-3">{profile.verificationInstructions}</p>
        </div>
        <div className="surface-card surface-card-elevated p-4">
          <p className="caption-text text-xs">Status</p>
          <p className="card-title mt-2">{STATUS_LABELS[profile.verificationStatus] || profile.verificationStatus}</p>
          <p className="meta-text mt-2">{profile.verificationMessage || "Add the code publicly, then run verification."}</p>
          <button
            type="button"
            className="btn-base btn-primary mt-4"
            onClick={() => handleVerify(profile.id)}
            disabled={busyAction === `verify:${profile.id}`}
          >
            {busyAction === `verify:${profile.id}` ? "Checking..." : "Verify profile"}
          </button>
        </div>
      </div>
    </SurfaceCard>
  );

  return (
    <AppShell
      title="Coding Profiles"
      subtitle="Verify platform accounts, sync public stats, and publish your coding portfolio"
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Account"}
      headerActions={<button type="button" className="btn-base btn-primary text-sm" onClick={handleSync} disabled={busyAction === "sync"}>{busyAction === "sync" ? "Syncing..." : "Sync Stats"}</button>}
    >
      <SeoMeta
        title="Coding Profiles | Create Sheets"
        description="Connect, verify, sync, and publish coding platform profiles."
        path="/add_accounts"
        noIndex
      />

      <div className="space-y-5">
        {error ? <div className="alert-banner alert-banner--danger">{error}</div> : null}
        {syncState.active ? (
          <div className="surface-card p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>{syncState.message}</span>
              <span>{syncState.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
              <div className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-200" style={{ width: `${syncState.progress}%` }} />
            </div>
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[88px_1fr]">
          <aside className="surface-card flex gap-2 overflow-x-auto p-3 xl:flex-col xl:overflow-visible">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className={`relative flex h-14 min-w-14 items-center justify-center rounded-md border text-xs font-semibold transition ${
                  selectedProfile?.id === profile.id ? "border-[var(--accent-primary)] bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)]" : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
                }`}
                title={`${profile.platformLabel} @${profile.username}`}
                onClick={() => {
                  setActiveProfileId(profile.id);
                  setIsAdding(false);
                }}
              >
                {(profile.platformLabel || profile.platform || "?").slice(0, 2).toUpperCase()}
                <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[var(--surface)] ${profile.verificationStatus === "verified" ? "bg-[var(--accent-success)]" : "bg-[var(--accent-warning)]"}`} />
              </button>
            ))}
            <button
              type="button"
              className="flex h-14 min-w-14 items-center justify-center rounded-md border border-dashed border-[var(--border-strong)] text-xl text-[var(--text-secondary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              title="Add platform"
              onClick={() => setIsAdding(true)}
            >
              +
            </button>
          </aside>

          <div className="min-w-0 space-y-4">
            <SurfaceCard elevated>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="caption-text text-xs">Public coding portfolio</p>
                  <h1 className="section-title mt-1 text-2xl">{dashboard?.aggregate?.totalSolved || 0} synced solved/activity points</h1>
                  <p className="meta-text mt-1">{verifiedProfiles.length} verified of {profiles.length} connected profiles.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-base btn-neutral" onClick={() => setIsAdding(true)}>Add Profile</button>
                  <button type="button" className="btn-base btn-primary" onClick={handleSync} disabled={busyAction === "sync"}>{busyAction === "sync" ? "Syncing..." : "Refresh Cache"}</button>
                </div>
              </div>
            </SurfaceCard>

            {isAdding || !profiles.length ? renderAddPanel() : null}
            {!isAdding && selectedProfile && selectedProfile.verificationStatus !== "verified" ? renderVerificationPanel(selectedProfile) : null}
            {!isAdding && verifiedProfiles.length ? (
              <CodingStatsPanel
                codingStats={codingStats}
                title="Verified Coding Stats"
                profile={currentUser}
                showRail={false}
              />
            ) : null}

            {!isAdding && profiles.length ? (
              <SurfaceCard title="Connected Profiles" description="Only verified profiles are shown publicly. Pending profiles stay private until the code is found.">
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      className="surface-card surface-card-elevated flex w-full flex-wrap items-center justify-between gap-3 p-3 text-left"
                      onClick={() => {
                        setActiveProfileId(profile.id);
                        setIsAdding(false);
                      }}
                    >
                      <span>
                        <span className="card-title block">{profile.platformLabel} @ {profile.username}</span>
                        <span className="meta-text text-xs">{profile.lastSyncError || profile.verificationMessage || profile.profileUrl}</span>
                        <span className="meta-text mt-1 block text-[11px]">
                          {(RELIABILITY_LABELS[profile.reliabilityTier] || "Best effort")} • {sourceLabel(profile.statsSource)}
                          {profile.lastSyncStatus ? ` • last sync ${profile.lastSyncStatus}` : ""}
                        </span>
                      </span>
                      <span className={`profile-sheet-badge ${statusClass(profile.verificationStatus)}`}>
                        {STATUS_LABELS[profile.verificationStatus] || profile.verificationStatus}
                      </span>
                    </button>
                  ))}
                </div>
              </SurfaceCard>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default AddAccountsPage;
