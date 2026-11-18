import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import EmptyState from "../components/ui/EmptyState";
import Skeleton, { SkeletonText } from "../components/ui/Skeleton";
import {
  archiveNotification,
  archiveReadNotifications,
  clearAllNotifications,
  deleteNotification,
  fetchNotificationPreferences,
  fetchNotifications,
  markAllNotificationsRead,
  unarchiveNotification,
  updateNotificationPreferences,
  NOTIFICATIONS_PAGE_SIZE,
} from "../api/notificationApi";
import { emitNotificationChanged, subscribeNotificationChanged } from "../services/notificationEvents";
import { sortNotificationsLatestFirst } from "../services/reminderNotifications";
import { useAuthStore } from "../store/authStore";

const primaryFilters = ["all", "unread", "mentions", "due today", "completed"];
const sidebarSections = [
  { key: "inbox", label: "Inbox", icon: "" },
  { key: "alerts", label: "Alerts", icon: "" },
  { key: "archived", label: "Archived", icon: "" },
  { key: "settings", label: "Settings", icon: "" },
];

const statusByFilter = {
  all: "all",
  unread: "unread",
  "due today": "due",
  completed: "completed",
};

function NotificationsPage({ theme, onThemeChange }) {
  const token = useAuthStore((s) => s.currentUser?.token);
  const userLabel = useAuthStore((s) => s.currentUser?.username || "Account");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("inbox");
  const [search, setSearch] = useState("");
  const [preferences, setPreferences] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = { size: NOTIFICATIONS_PAGE_SIZE, page };
      if (activeSection === "archived") params.status = "archived";
      const requestedStatus = statusByFilter[activeFilter];
      if (activeSection !== "archived" && requestedStatus && requestedStatus !== "all") params.status = requestedStatus;
      const [data, prefs] = await Promise.all([fetchNotifications(token, params), fetchNotificationPreferences(token)]);
      setItems(sortNotificationsLatestFirst(Array.isArray(data) ? data : []));
      setPreferences(prefs || null);
      setError("");
    } catch (loadErr) {
      setError(loadErr?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, activeSection, page, token]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => subscribeNotificationChanged(() => load()), [load]);

  const visibleItems = useMemo(() => {
    return items
      .filter((item) => {
        const archived = item.status === "archived";
        if (activeSection === "archived") return archived;
        if (archived) return false;
        if (activeSection === "alerts") return item.type === "revision";
        return true;
      })
      .filter((item) => {
        if (activeFilter === "mentions") return /mention|tag/i.test(`${item.title} ${item.message}`);
        if (activeFilter === "due today") return item.status === "due";
        return true;
      })
      .filter((item) => `${item.title} ${item.message}`.toLowerCase().includes(search.toLowerCase()));
  }, [activeFilter, activeSection, items, search]);

  const summary = useMemo(() => {
    const unread = items.filter((item) => ["unread", "due", "overdue"].includes(item.status)).length;
    const alerts = items.filter((item) => item.type === "revision").length;
    const archived = items.filter((item) => item.status === "archived").length;
    return { unread, alerts, archived };
  }, [items]);

  const savePreference = async (patch) => {
    if (!token) return;
    const next = await updateNotificationPreferences(token, patch);
    setPreferences(next);
  };

  const handleSectionChange = (sectionKey) => {
    setActiveSection(sectionKey);
    setActiveFilter("all");
    setPage(0);
  };

  const handleArchiveToggle = async (notification) => {
    if (!token) return;
    const shouldUnarchive = notification?.status === "archived";
    if (shouldUnarchive) {
      await unarchiveNotification(token, notification.id);
    } else {
      await archiveNotification(token, notification.id);
    }
    setItems((current) => current.map((item) => (
      item.id === notification.id
        ? { ...item, status: shouldUnarchive ? "read" : "archived", updatedAt: new Date().toISOString() }
        : item
    )));
    emitNotificationChanged({ type: shouldUnarchive ? "unarchive" : "archive", id: notification.id });
    load();
  };

  const handleDelete = async (notificationId) => {
    if (!token) return;
    await deleteNotification(token, notificationId);
    setItems((current) => current.filter((item) => item.id !== notificationId));
    emitNotificationChanged({ type: "delete", id: notificationId });
    load();
  };

  return (
    <AppShell title="Notifications" subtitle="Stay on top of updates, reminders, and learning alerts in one place." theme={theme} onThemeChange={onThemeChange} userLabel={userLabel}>
      <div className="grid gap-5 xl:grid-cols-[220px_1fr]">
        <aside className="rounded-3xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] p-4 backdrop-blur-xl">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Workspace</p>
          <div className="space-y-2">
            {sidebarSections.map((section) => (
              <button key={section.key} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${activeSection === section.key ? "bg-[color-mix(in_srgb,var(--accent-primary)_22%,transparent)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"}`} onClick={() => handleSectionChange(section.key)}>
                <span>{section.icon}</span><span>{section.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-5">
          <section className="rounded-3xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] p-5 shadow-[var(--shadow-sm)] backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold">Notifications</h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Track alerts, mentions, and reminder activity without the clutter.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries({ Unread: summary.unread, Alerts: summary.alerts, Archived: summary.archived }).map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-4 py-2 text-center">
                    <p className="text-xs text-[var(--text-secondary)]">{label}</p><p className="text-lg font-semibold">{value}</p>
                  </div>
                ))}
                <button className="btn-base btn-primary btn-sm rounded-xl" onClick={async () => { await markAllNotificationsRead(token); emitNotificationChanged({ type: "mark-all-read" }); load(); }}>Mark all as read</button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] p-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notifications" className="field-base min-w-[220px] flex-1 rounded-full" />
              {primaryFilters.map((filter) => (
                <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full px-4 py-2 text-sm capitalize transition ${activeFilter === filter ? "bg-[var(--accent-primary)] text-[var(--text-on-accent)]" : "bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>{filter}</button>
              ))}
            </div>
          </section>

          <div className="grid gap-5 2xl:grid-cols-[1fr_330px]">
            <section className="space-y-3">
              {loading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-3xl border border-[var(--border-subtle)] p-4"><SkeletonText lines={3} /></div>)}
              {error ? <div className="rounded-2xl border border-[color-mix(in_srgb,var(--accent-danger)_45%,transparent)] p-3 text-sm text-[var(--accent-danger)]">{error}</div> : null}
              {!loading && visibleItems.map((item) => (
                <article key={item.id} className="cursor-pointer rounded-3xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-elevated)_85%,transparent)] p-4 shadow-[var(--shadow-sm)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={`mt-2 h-2.5 w-2.5 rounded-full ${item.status === "unread" ? "bg-[var(--accent-info)]" : "bg-[var(--border-strong)]"}`} />
                      <div>
                        <h3 className="font-medium">{item.title || "Notification"}</h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.message || "No additional details provided."}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-xs capitalize text-[var(--text-secondary)]">{item.type}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <span>{new Date(item.createdAt || item.updatedAt || Date.now()).toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button className="btn-base btn-neutral btn-sm" onClick={() => handleArchiveToggle(item)}>
                        {item.status === "archived" ? "Unarchive" : "Archive"}
                      </button>
                      <button className="btn-base btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}
              {!loading && visibleItems.length === 0 && <EmptyState title="You’re all caught up" description="No new notifications right now. Try changing a filter or check back later." icon="" actionLabel="Reset filters" onAction={() => { setActiveFilter("all"); setSearch(""); }} />}
              {!loading && <div className="flex items-center justify-between pt-2"><button className="btn-base btn-neutral btn-sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Previous</button><span className="text-xs text-[var(--text-secondary)]">Page {page + 1}</span><button className="btn-base btn-neutral btn-sm" onClick={() => setPage((p) => p + 1)} disabled={items.length < NOTIFICATIONS_PAGE_SIZE}>Next</button></div>}
            </section>

            <section className="space-y-4">
              <div className="rounded-3xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] p-4 backdrop-blur-xl">
                <h2 className="text-lg font-semibold">Smart Preferences</h2>
                <p className="mb-3 text-sm text-[var(--text-secondary)]">Only receive the updates that help you keep momentum.</p>
                {preferences ? [
                  ["Important alerts", "platformEnabled"],
                  ["Revision reminders", "revisionEnabled"],
                  ["Weak-topic insights", "weakTopicAlertsEnabled"],
                  ["Weekly digest", "digestFrequency"],
                ].map(([label, key]) => (
                  <label key={key} className="mb-2 flex items-center justify-between rounded-2xl bg-[var(--surface-soft)] px-3 py-2 text-sm">
                    <span>{label}</span>
                    <input type="checkbox" className="h-5 w-5 accent-[var(--accent-primary)]" checked={key === "digestFrequency" ? preferences.digestFrequency === "weekly" : Boolean(preferences[key])} onChange={(e) => savePreference(key === "digestFrequency" ? { digestFrequency: e.target.checked ? "weekly" : "off" } : { [key]: e.target.checked })} />
                  </label>
                )) : <SkeletonText lines={4} />}
              </div>

              <div className="rounded-3xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] p-4 backdrop-blur-xl">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="btn-base btn-neutral btn-sm rounded-2xl" onClick={async () => { await clearAllNotifications(token); emitNotificationChanged({ type: "clear-all" }); load(); }}>Clear Inbox</button>
                  <button className="btn-base btn-neutral btn-sm rounded-2xl" onClick={() => setActiveSection("alerts")}>Mute Alerts</button>
                  <button className="btn-base btn-neutral btn-sm rounded-2xl" onClick={async () => { await archiveReadNotifications(token); emitNotificationChanged({ type: "archive-read" }); load(); }}>Archive Read</button>
                  <button className="btn-base btn-neutral btn-sm rounded-2xl" onClick={() => { setActiveFilter("all"); setSearch(""); }}>Reset Filters</button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </AppShell>
  );
}

export default NotificationsPage;
