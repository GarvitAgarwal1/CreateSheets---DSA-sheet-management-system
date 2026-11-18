import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import {
  InsightsHeader,
  KPIStatsRow,
  AttemptsTrendChart,
  ResultDistributionChart,
  MistakeFrequencyChart,
  TopicMasteryChart,
  RevisionTimelineCard,
  WeakAreasCard,
  RecentMistakesCard,
  SuggestionsCard,
  AnalyticsBreakdownCard,
  RevisionQueueCard,
} from "../components/insights/InsightsDashboardComponents";
import {
  DEFAULT_ANALYTICS_FILTERS,
  buildAnalyticsExportPayload,
  buildLearningAnalyticsData,
  dayKey,
} from "../services/learningAnalytics";

const HEATMAP_BACKGROUNDS = [
  "var(--surface-soft)",
  "color-mix(in srgb, var(--accent-success) 25%, var(--surface-soft))",
  "color-mix(in srgb, var(--accent-success) 45%, var(--surface-soft))",
  "color-mix(in srgb, var(--accent-success) 65%, var(--surface-soft))",
  "color-mix(in srgb, var(--accent-success) 85%, var(--surface-soft))",
];

const getHeatmapIntensity = (count) => {
  if (count === 0) return 0;
  if (count >= 4) return 4;
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  return 1;
};

function LearningInsightsPage({ theme, onThemeChange }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);
  const [filters, setFilters] = useState(DEFAULT_ANALYTICS_FILTERS);
  const [exportStatus, setExportStatus] = useState("");
  const analyticsNow = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!currentUser?.token) return;
    loadSheets(currentUser.token);
  }, [currentUser?.token, loadSheets]);

  useEffect(() => {
    if (!exportStatus) return undefined;
    const timer = window.setTimeout(() => setExportStatus(""), 1800);
    return () => window.clearTimeout(timer);
  }, [exportStatus]);

  const dashboardData = useMemo(
    () => buildLearningAnalyticsData({ sheets, filters, now: analyticsNow }),
    [analyticsNow, filters, sheets]
  );

  const heatmapWeeks = useMemo(() => (
    Array.from({ length: 20 }).map((_, weekIndex) => ({
      label: (() => {
        const date = new Date(analyticsNow);
        date.setDate(date.getDate() - (140 - weekIndex * 7));
        return date.getDate() <= 7 ? date.toLocaleString(undefined, { month: "short" }) : "";
      })(),
      days: Array.from({ length: 7 }).map((__, dayIndex) => {
        const date = new Date(analyticsNow);
        const offset = 139 - (weekIndex * 7 + dayIndex);
        date.setDate(date.getDate() - offset);
        const key = dayKey(date);
        const count = dashboardData.dailyAttemptsMap.get(key) || 0;
        return { key, date, count, intensity: getHeatmapIntensity(count) };
      }),
    }))
  ), [analyticsNow, dashboardData.dailyAttemptsMap]);

  const updateFilters = useCallback((partial) => {
    setFilters((current) => ({ ...current, ...partial }));
  }, []);

  const handleExportSnapshot = useCallback(() => {
    const payload = buildAnalyticsExportPayload(dashboardData, filters);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `learning-insights-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setExportStatus("Exported");
  }, [dashboardData, filters]);

  return (
    <AppShell title="Learning Insights" subtitle="Private analytics from your sheets" theme={theme} onThemeChange={onThemeChange}>
      <div className="space-y-4">
        <InsightsHeader
          filters={filters}
          onFiltersChange={updateFilters}
          sheets={dashboardData.filtersMeta.sheets}
          topics={dashboardData.filtersMeta.topics}
          platforms={dashboardData.filtersMeta.platforms}
          difficulties={dashboardData.filtersMeta.difficulties}
          stats={dashboardData.stats}
          onExportSnapshot={handleExportSnapshot}
          exportStatus={exportStatus}
        />

        {!dashboardData.hasAttempts ? (
          <section className="panel rounded-2xl p-5">
            <h2 className="text-lg font-semibold">No attempt data yet</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Log attempts from a sheet to unlock trend charts, weak areas, revision queues, and exportable snapshots.
            </p>
          </section>
        ) : !dashboardData.hasFilteredAttempts ? (
          <section className="panel rounded-2xl p-5">
            <h2 className="text-lg font-semibold">No attempts match these filters</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Try widening the date range or selecting all topics, platforms, and difficulties.
            </p>
          </section>
        ) : null}

        <KPIStatsRow stats={dashboardData.stats} />

        <div className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <AttemptsTrendChart points={dashboardData.attemptsTrend} />
          </div>
          <div className="xl:col-span-4">
            <ResultDistributionChart distribution={dashboardData.resultDistribution} />
          </div>
          <div className="xl:col-span-4">
            <MistakeFrequencyChart mistakes={dashboardData.topMistakes} />
          </div>
          <div className="xl:col-span-4">
            <TopicMasteryChart topics={dashboardData.topicMastery} />
          </div>
          <div className="xl:col-span-4">
            <RevisionTimelineCard items={dashboardData.revisionTimeline} />
          </div>
          <div className="xl:col-span-8">
            <SuggestionsCard insights={dashboardData.insights} actions={dashboardData.actions} />
          </div>
          <div className="xl:col-span-4">
            <RevisionQueueCard items={dashboardData.revisionQueue} />
          </div>
          <div className="xl:col-span-6">
            <WeakAreasCard weakAreas={dashboardData.weakAreas} />
          </div>
          <div className="xl:col-span-6">
            <RecentMistakesCard mistakes={dashboardData.recentMistakes} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="panel rounded-2xl p-4 lg:col-span-2">
            <h3 className="text-base font-semibold">Confidence vs result</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {dashboardData.confidenceVsResult.map((row) => (
                <article key={row.confidence} className="rounded-lg border border-[var(--border-subtle)] p-3">
                  <p className="text-sm font-medium">{row.confidence} confidence</p>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">Solved: {row.solved}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Tried: {row.partially_solved}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Failed: {row.failed}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel rounded-2xl p-4">
            <h3 className="text-base font-semibold">Time spent by result</h3>
            <div className="mt-4 space-y-3">
              {dashboardData.timeByResult.map((item) => (
                <div key={item.result} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm">
                  <span className="capitalize">{item.result.replace("_", " ")}</span>
                  <span className="text-[var(--text-tertiary)]">{item.minutes} min</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <AnalyticsBreakdownCard title="Platform contribution" items={dashboardData.platformBreakdown} />
          <AnalyticsBreakdownCard title="Difficulty quality" items={dashboardData.difficultyBreakdown} />
          <AnalyticsBreakdownCard title="Sheet performance" items={dashboardData.sheetBreakdown} />
        </div>

        <section className="panel rounded-2xl p-4">
          <h3 className="text-base font-semibold">Practice consistency heatmap</h3>
          <div className="mt-4 overflow-x-auto">
            <div className="inline-flex gap-2">
              <div className="mt-6 grid grid-rows-7 gap-1 text-[10px] text-[var(--text-tertiary)]">
                {["Mon", "", "Wed", "", "Fri", "", ""].map((label, index) => (
                  <span key={`${label}-${index}`} className="h-3 leading-3">{label}</span>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex gap-1 text-[10px] text-[var(--text-tertiary)]">
                  {heatmapWeeks.map((week, weekIndex) => <span key={weekIndex} className="w-3">{week.label}</span>)}
                </div>
                <div className="flex gap-1">
                  {heatmapWeeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-rows-7 gap-1">
                      {week.days.map((day) => (
                        <div
                          key={day.key}
                          className="h-3 w-3 rounded-[3px] border border-[var(--border-subtle)]"
                          style={{ background: HEATMAP_BACKGROUNDS[day.intensity] }}
                          title={`${day.date.toDateString()} - ${day.count} ${day.count === 1 ? "attempt" : "attempts"}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default LearningInsightsPage;
