import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import SeoMeta from "../components/SeoMeta";
import EmptyState from "../components/ui/EmptyState";
import ProgressBar from "../components/ui/ProgressBar";
import SurfaceCard from "../components/ui/SurfaceCard";
import { fetchNotifications, NOTIFICATIONS_PAGE_SIZE } from "../api/notificationApi";
import { fetchFeaturedSheets } from "../api/sheetApi";
import SheetCatalogCard from "../components/SheetCatalogCard";
import { DEFAULT_APP_ICON_URL } from "../config/branding";
import { ADMIN_USERNAME } from "../config/envConfig";
import { navigateTo, ROUTES } from "../services/routes";
import { calculateSheetProgress } from "../services/progress";
import { useAuthStore } from "../store/authStore";
import { useSheetStore } from "../store/sheetStore";
import { buildCanonicalUrl, seoDefaults } from "../config/seo";

const HOME_PANEL_CLASS = "panel-elevated px-4 py-4 sm:px-5";
const MAX_FEATURED_SHEETS = 6;

const SHEET_PREVIEW_TOPICS = [
  { label: "Arrays", solved: 18, total: 26, tone: "success" },
  { label: "Graphs", solved: 9, total: 22, tone: "warning" },
  { label: "Dynamic Programming", solved: 7, total: 28, tone: "default" },
];

const SHEET_PREVIEW_QUESTIONS = [
  { title: "Two Sum", meta: "Easy · LeetCode", status: "Solved" },
  { title: "Merge Intervals", meta: "Medium · Pattern", status: "Review" },
  { title: "Course Schedule", meta: "Medium · Graphs", status: "Next" },
];

function HomeStatTile({ label, value, caption }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-secondary)] px-4 py-3">
      <p className="text-2xl font-semibold text-[color:var(--text-primary)]">{value}</p>
      <p className="meta-text mt-1">{label}</p>
      {caption ? <p className="mt-1 text-xs text-[color:var(--text-tertiary)]">{caption}</p> : null}
    </div>
  );
}

function HomeHeroStep({ number, title, description }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-primary)] p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-primary-muted)] text-sm font-semibold text-[color:var(--accent-primary)]">{number}</span>
      <span>
        <span className="block text-sm font-semibold text-[color:var(--text-primary)]">{title}</span>
        <span className="meta-text block text-xs">{description}</span>
      </span>
    </div>
  );
}

function HomeActionButton({ label, description, route, variant = "neutral" }) {
  return (
    <button
      type="button"
      className={`btn-base ${variant === "primary" ? "btn-primary" : "btn-neutral"} justify-between px-4 py-3 text-left`}
      onClick={() => navigateTo(route)}
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="meta-text block text-xs">{description}</span>
      </span>
      <span aria-hidden="true">›</span>
    </button>
  );
}

function FeaturedSheetsSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading featured sheets">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`featured-skeleton-${index}`} className="min-h-[210px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 animate-pulse">
          <div className="flex gap-3 border-b border-[var(--border-subtle)] pb-3">
            <div className="h-[52px] w-[52px] rounded-full bg-[var(--surface-muted)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-4/5 rounded bg-[var(--surface-muted)]" />
              <div className="h-3 w-2/3 rounded bg-[var(--surface-muted)]" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-[var(--surface-muted)]" />
            <div className="h-3 w-5/6 rounded bg-[var(--surface-muted)]" />
            <div className="h-3 w-2/3 rounded bg-[var(--surface-muted)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeaturedSheetsSection({ featuredSheets, isLoading }) {
  const sheetsToShow = featuredSheets.slice(0, MAX_FEATURED_SHEETS);

  return (
    <section className={`${HOME_PANEL_CLASS} surface-card space-y-4`}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--border-subtle)] pb-3">
        <div>
          <p className="meta-text uppercase tracking-[0.18em]">Templates</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="section-title">Featured Sheets</h2>
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              By {ADMIN_USERNAME}
            </span>
          </div>
          <p className="meta-text mt-1">Curated public roadmaps you can open, copy, and adapt.</p>
        </div>
        <button type="button" className="btn-base btn-primary" onClick={() => navigateTo(ROUTES.PUBLIC_SHEETS)}>
          Explore all sheets
        </button>
      </div>

      {isLoading ? (
        <FeaturedSheetsSkeleton count={3} />
      ) : sheetsToShow.length === 0 ? (
        <EmptyState
          title={`No ${ADMIN_USERNAME} templates yet`}
          description={`Featured templates show only public sheets created by ${ADMIN_USERNAME}.`}
          action={<button type="button" className="btn-base btn-neutral" onClick={() => navigateTo(ROUTES.PUBLIC_SHEETS)}>Explore Public Sheets</button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sheetsToShow.map((sheet) => (
            <SheetCatalogCard
              key={sheet.id || sheet.title}
              {...sheet}
              onOpen={({ shareId }) => {
                if (shareId) {
                  navigateTo(`/shared/sheet/${shareId}`);
                  return;
                }
                navigateTo(ROUTES.PUBLIC_SHEETS);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedSheetGallery({ featuredSheets, isLoading }) {
  const gallerySheets = featuredSheets.slice(0, MAX_FEATURED_SHEETS);
  const repeatedSheets = gallerySheets.length > 1 ? [...gallerySheets, ...gallerySheets] : gallerySheets;

  return (
    <section className={`${HOME_PANEL_CLASS} surface-card space-y-4`} aria-label={`${ADMIN_USERNAME} featured sheet gallery`}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--border-subtle)] pb-3">
        <div>
          <p className="meta-text uppercase tracking-[0.18em]">Gallery</p>
          <h2 className="section-title">A small visual tour</h2>
          <p className="meta-text mt-1">A quiet repeating slider showing public sheets created by {ADMIN_USERNAME}.</p>
        </div>
      </div>

      {isLoading ? (
        <FeaturedSheetsSkeleton count={3} />
      ) : gallerySheets.length === 0 ? (
        <EmptyState
          title="No gallery sheets yet"
          description={`The gallery shows only public featured sheets created by ${ADMIN_USERNAME}.`}
        />
      ) : (
        <div className="home-image-slider">
          <div className={`home-image-slider-track ${gallerySheets.length > 1 ? "" : "home-image-slider-track--static"}`}>
            {repeatedSheets.map((sheet, index) => {
              const logoUrl = sheet.logoUrl || DEFAULT_APP_ICON_URL;
              const description = sheet.description?.trim() || "Public CreateSheets roadmap.";
              return (
                <article key={`${sheet.id || sheet.title}-${index}`} className="home-image-slide" aria-hidden={index >= gallerySheets.length ? "true" : undefined}>
                  <img src={logoUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = DEFAULT_APP_ICON_URL; }} />
                  <div className="p-3">
                    <h3>{sheet.title || "Untitled Sheet"}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function SheetExperiencePreview() {
  return (
    <section className={`${HOME_PANEL_CLASS} surface-card grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)] lg:items-center`}>
      <div className="min-w-0 space-y-4">
        <p className="meta-text uppercase tracking-[0.18em]">Sheet Experience</p>
        <div>
          <h2 className="section-title">A sheet should look focused, not like a spreadsheet dump.</h2>
          <p className="meta-text mt-2">
            Every sheet opens as a practice workspace: topics, progress, question status, revision context, and sharing controls in one calm view.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <HomeStatTile label="Topics" value="12" caption="Grouped by pattern" />
          <HomeStatTile label="Questions" value="156" caption="Track by status" />
          <HomeStatTile label="Progress" value="42%" caption="Always visible" />
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border border-[color:var(--border-base)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--shadow-md)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--border-subtle)] pb-3">
          <div>
            <p className="meta-text text-xs uppercase tracking-[0.16em]">Preview</p>
            <h3 className="card-title mt-1">Interview Sheet</h3>
          </div>
          <span className="rounded-full bg-[color:var(--color-attempted-bg)] px-3 py-1 text-xs font-semibold text-[color:var(--color-attempted)]">42% Complete</span>
        </div>

        <div className="mt-4">
          <ProgressBar percent={42} tone="warning" />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {SHEET_PREVIEW_TOPICS.map((topic) => (
            <div key={topic.label} className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-secondary)] p-3">
              <p className="text-sm font-semibold text-[color:var(--text-primary)]">{topic.label}</p>
              <p className="meta-text mt-1 text-xs">{topic.solved}/{topic.total} solved</p>
              <div className="mt-2">
                <ProgressBar percent={Math.round((topic.solved / topic.total) * 100)} tone={topic.tone === "success" ? "success" : "warning"} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--border-subtle)]">
          {SHEET_PREVIEW_QUESTIONS.map((question) => (
            <div key={question.title} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-[color:var(--border-subtle)] bg-[color:var(--surface-primary)] px-3 py-3 last:border-b-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[color:var(--text-primary)]">{question.title}</p>
                <p className="meta-text text-xs">{question.meta}</p>
              </div>
              <span className="self-center rounded-full bg-[color:var(--surface-muted)] px-2.5 py-1 text-xs font-semibold text-[color:var(--text-secondary)]">{question.status}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function HomePage({ theme, onThemeChange }) {
  const [notificationPreview, setNotificationPreview] = useState({ dueRevisions: [], upcomingAlarms: [] });
  const [featuredSheets, setFeaturedSheets] = useState([]);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);


  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);
  const isSheetsLoading = useSheetStore((state) => state.isSheetsLoading);
  const homepageSchemas = useMemo(() => ([
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: seoDefaults.siteName,
      url: seoDefaults.siteUrl,
      description: seoDefaults.defaultDescription,
      potentialAction: {
        "@type": "SearchAction",
        target: `${seoDefaults.siteUrl}/explore`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "CreateSheets",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: seoDefaults.siteUrl,
      description:
        "CreateSheets is a full-stack web app to create DSA sheets, coding practice trackers, revision plans, and interview preparation workflows.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "CreateSheets",
      url: seoDefaults.siteUrl,
      logo: `${seoDefaults.siteUrl}/vite.svg`,
    },
  ]), []);

  useEffect(() => {
    if (!currentUser?.token) return;
    loadSheets(currentUser.token);
    Promise.all([
      fetchNotifications(currentUser.token, { type: "revision", status: "due", size: NOTIFICATIONS_PAGE_SIZE }),
      fetchNotifications(currentUser.token, { type: "alarm", status: "upcoming", size: NOTIFICATIONS_PAGE_SIZE }),
    ]).then(([dueRevisions, upcomingAlarms]) => {
      setNotificationPreview({
        dueRevisions: Array.isArray(dueRevisions) ? dueRevisions : [],
        upcomingAlarms: Array.isArray(upcomingAlarms) ? upcomingAlarms : [],
      });
    }).catch(() => undefined);
  }, [currentUser?.token, loadSheets]);

  useEffect(() => {
    let isMounted = true;
    fetchFeaturedSheets()
      .then((sheets) => {
        if (isMounted) setFeaturedSheets(Array.isArray(sheets) ? sheets : []);
      })
      .catch(() => {
        if (isMounted) setFeaturedSheets([]);
      })
      .finally(() => {
        if (isMounted) setIsFeaturedLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);


  const recentSheets = useMemo(() => [...sheets]
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 6), [sheets]);
  const hasFocusItems = notificationPreview.dueRevisions.length > 0 || notificationPreview.upcomingAlarms.length > 0;
  const workspaceTitle = currentUser?.token
    ? recentSheets.length > 0 ? "Continue your workspace" : "Start your first sheet"
    : "Start building your workspace";

  return (
    <AppShell
      title="Create and Track DSA Sheets Online"
      subtitle="Build custom sheets for coding practice, revision, interview preparation, and collaborative learning."
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Guest"}
    >
      <SeoMeta
        title="CreateSheets | Create, Share & Track DSA Sheets"
        description="CreateSheets helps you create, share, and track DSA sheets, programming sheets, interview preparation sheets, and topic-based learning trackers."
        path="/"
        keywords={["create DSA sheet", "coding practice tracker", "interview preparation sheets", "public sheets"]}
        structuredData={homepageSchemas}
      />
      <div className="home-page-layout space-y-5">
        <section className={`${HOME_PANEL_CLASS} surface-card min-w-0 overflow-hidden`}>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)] lg:items-center">
            <div className="min-w-0 space-y-5">
              <p className="meta-text uppercase tracking-[0.18em]">Create Sheets Workspace</p>
              <div>
                <h2 className="section-title break-words text-2xl sm:text-3xl">Turn any study plan into a clean practice sheet.</h2>
                <p className="meta-text mt-3 break-words">
                  Start with one sheet. Add topics and questions. Track progress without getting lost in too many options.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-base btn-primary" onClick={() => navigateTo(ROUTES.APP)}>
                  Create a sheet
                </button>
                <button type="button" className="btn-base btn-neutral" onClick={() => navigateTo(ROUTES.PUBLIC_SHEETS)}>
                  Browse templates
                </button>
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-secondary)] p-4">
              <p className="meta-text text-xs uppercase tracking-[0.16em]">Simple flow</p>
              <div className="mt-3 grid gap-2">
                <HomeHeroStep number="1" title="Create or copy" description="Choose a sheet to begin." />
                <HomeHeroStep number="2" title="Practice questions" description="Mark solved, review, or next." />
                <HomeHeroStep number="3" title="Share later" description="Keep private until ready." />
              </div>
            </div>
          </div>
        </section>

        <SheetExperiencePreview />

        <FeaturedSheetsSection featuredSheets={featuredSheets} isLoading={isFeaturedLoading} />

        {hasFocusItems ? (
          <SurfaceCard title="Needs attention" description="Only shown when revisions or reminders actually need action." className={HOME_PANEL_CLASS}>
            <div className="grid gap-3 lg:grid-cols-2">
              {notificationPreview.dueRevisions.map((item) => (
                <button key={item.id} type="button" className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] p-4 text-left" onClick={() => navigateTo(item.actionUrl || ROUTES.NOTIFICATIONS)}>
                  <p className="meta-text text-xs uppercase tracking-[0.14em]">Revision</p>
                  <p className="card-title mt-1 line-clamp-1">{item.title}</p>
                  <p className="meta-text mt-1">{item.message}</p>
                </button>
              ))}
              {notificationPreview.upcomingAlarms.map((item) => (
                <button key={item.id} type="button" className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] p-4 text-left" onClick={() => navigateTo(ROUTES.ALARMS)}>
                  <p className="meta-text text-xs uppercase tracking-[0.14em]">Reminder</p>
                  <p className="card-title mt-1 line-clamp-1">{item.title}</p>
                  <p className="meta-text mt-1">{new Date(item.scheduledFor).toLocaleString()}</p>
                </button>
              ))}
            </div>
          </SurfaceCard>
        ) : null}

        <SurfaceCard
          title={workspaceTitle}
          description={recentSheets.length > 0 ? "Your latest sheets stay easy to resume without taking over the home page." : "No empty recent list. Pick the best starting path instead."}
          className={HOME_PANEL_CLASS}
          actions={currentUser?.token ? <button type="button" className="btn-base btn-neutral" onClick={() => navigateTo(ROUTES.APP)}>View all sheets</button> : null}
        >
          {!currentUser?.token ? (
            <EmptyState
              title="Sign in to save your workspace"
              description="Browse templates now, then sign in when you are ready to create and track your own sheets."
              icon=""
              action={(
                <div className="flex flex-wrap justify-center gap-2">
                  <button className="btn-base btn-primary" type="button" onClick={() => navigateTo(ROUTES.LOGIN)}>Go to Login</button>
                  <button className="btn-base btn-neutral" type="button" onClick={() => navigateTo(ROUTES.PUBLIC_SHEETS)}>Browse Sheets</button>
                </div>
              )}
            />
          ) : isSheetsLoading && recentSheets.length === 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading recent sheets">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`sheet-skeleton-${index}`} className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] p-4 animate-pulse">
                  <div className="h-5 w-3/4 rounded bg-[color:var(--surface-muted)]" />
                  <div className="mt-3 h-4 w-1/2 rounded bg-[color:var(--surface-muted)]" />
                  <div className="mt-3 h-4 w-2/3 rounded bg-[color:var(--surface-muted)]" />
                  <div className="mt-3 h-2 w-full rounded bg-[color:var(--surface-muted)]" />
                </div>
              ))}
            </div>
          ) : recentSheets.length === 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              <HomeActionButton label="Create blank sheet" description="Build your own roadmap" route={ROUTES.APP} variant="primary" />
              <HomeActionButton label="Copy public sheet" description="Start from a trusted list" route={ROUTES.PUBLIC_SHEETS} />
              <HomeActionButton label="Import existing list" description="Bring work you already have" route={ROUTES.IMPORT} />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recentSheets.map((sheet) => {
                const progress = calculateSheetProgress(sheet);
                return (
                  <button
                    key={sheet.id}
                    type="button"
                    className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[color:var(--accent-primary)]"
                    onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}
                  >
                    <p className="card-title line-clamp-1">{sheet.title || "Untitled Sheet"}</p>
                    <p className="meta-text mt-1">Updated {sheet.updatedAt ? new Date(sheet.updatedAt).toLocaleString() : "Unknown"}</p>
                    <p className="meta-text mt-2">{progress.completedQuestions}/{progress.totalQuestions} solved · {progress.percent}%</p>
                    <div className="mt-2"><ProgressBar percent={progress.percent} /></div>
                  </button>
                );
              })}
            </div>
          )}
        </SurfaceCard>

        <section className={`${HOME_PANEL_CLASS} surface-card space-y-4`}>
          <h2 className="section-title">Why users should care</h2>
          <p className="meta-text">
            Create Sheets is a sheet management website where you can create DSA sheets, programming sheets, and topic-based trackers for interviews, classes, and daily problem solving.
            Use your own structure, mix platforms like LeetCode and GFG, and manage everything from one dashboard.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <article className={HOME_PANEL_CLASS}>
              <h3 className="card-title">Create DSA practice sheets</h3>
              <p className="meta-text">Group topics by arrays, graphs, dynamic programming, and company-focused interview sets.</p>
            </article>
            <article className={HOME_PANEL_CLASS}>
              <h3 className="card-title">Share and copy public sheets</h3>
              <p className="meta-text">Publish useful lists, discover curated public sheets, and copy them into your own workspace for personalized practice.</p>
            </article>
            <article className={HOME_PANEL_CLASS}>
              <h3 className="card-title">Track progress and revisions</h3>
              <p className="meta-text">Measure completion with progress bars, revision reminders, and quick resume actions that keep your prep consistent.</p>
            </article>
          </div>
          <p className="meta-text">
            Whether you are preparing for coding interviews, competitive programming contests, or semester exams, Create Sheets helps you stay organized and accountable.
            Explore more at <a className="link-base" href={buildCanonicalUrl("/explore")}>Public Sheets</a>.
          </p>
        </section>

        <FeaturedSheetGallery featuredSheets={featuredSheets} isLoading={isFeaturedLoading} />
      </div>
    </AppShell>
  );
}

export default HomePage;
