const formatPercent = (value) => `${Math.round(value)}%`;
const cardClass = "panel h-full rounded-2xl p-4";
const sectionTitleClass = "text-base font-semibold tracking-tight text-[var(--text-primary)]";

const EmptyPanel = ({ message = "No data yet." }) => (
  <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--text-secondary)]">
    {message}
  </div>
);

export function InsightsHeader({ filters, onFiltersChange, sheets, topics, platforms, difficulties, stats, onExportSnapshot, exportStatus }) {
  const summary = [
    { label: "Solved", value: formatPercent(stats.solvedRate || 0) },
    { label: "Due", value: stats.revisionsDue || 0 },
    { label: "Avg", value: `${stats.avgMinutes || 0}m` },
  ];

  return (
    <header className="panel-elevated rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Learning Insights</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Product-grade analytics from your attempt logs, confidence, mistakes, and revision plan.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {summary.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">{item.value}</span>
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:max-w-3xl">
          <select aria-label="Date range" className="field-base" value={filters.dateRange} onChange={(event) => onFiltersChange({ dateRange: event.target.value })}>
            <option value="all">All time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <select aria-label="Sheet" className="field-base" value={filters.sheetId} onChange={(event) => onFiltersChange({ sheetId: event.target.value })}>
            <option value="all">All sheets</option>
            {sheets.map((sheet) => <option key={sheet.id} value={sheet.id}>{sheet.title}</option>)}
          </select>
          <select aria-label="Topic" className="field-base" value={filters.topic} onChange={(event) => onFiltersChange({ topic: event.target.value })}>
            <option value="all">All topics</option>
            {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
          </select>
          <select aria-label="Platform" className="field-base" value={filters.platform} onChange={(event) => onFiltersChange({ platform: event.target.value })}>
            <option value="all">All platforms</option>
            {platforms.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
          </select>
          <select aria-label="Difficulty" className="field-base" value={filters.difficulty} onChange={(event) => onFiltersChange({ difficulty: event.target.value })}>
            <option value="all">All difficulty</option>
            {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
          </select>
          <button type="button" className="btn-base btn-primary" onClick={onExportSnapshot}>{exportStatus || "Export"}</button>
        </div>
      </div>
    </header>
  );
}

export function KPIStatsRow({ stats }) {
  const cards = [
    { label: "Total attempts", value: stats.totalAttempts, sub: `${stats.totalQuestions} questions attempted`, tone: "var(--border-subtle)" },
    { label: "Solved rate", value: formatPercent(stats.solvedRate), sub: `${stats.solvedCount} solved`, tone: "color-mix(in srgb, var(--accent-success) 45%, transparent)" },
    { label: "Avg time / attempt", value: `${stats.avgMinutes} min`, sub: `${stats.totalMinutes} total minutes`, tone: "color-mix(in srgb, var(--accent-info) 45%, transparent)" },
    { label: "Practice streak", value: `${stats.streak} days`, sub: stats.lastPracticeLabel, tone: "color-mix(in srgb, var(--accent-primary) 45%, transparent)" },
    { label: "Revisions due", value: stats.revisionsDue, sub: `${stats.revisionOverdue} overdue`, tone: "color-mix(in srgb, var(--accent-danger) 45%, transparent)" },
    { label: "Weakest topic", value: stats.weakestTopic || "—", sub: `${formatPercent(stats.weakestTopicRate || 0)} mastery`, tone: "color-mix(in srgb, var(--accent-danger) 45%, transparent)" },
    { label: "Top mistake", value: stats.topMistake || "—", sub: `${stats.topMistakeCount || 0} occurrences`, tone: "color-mix(in srgb, var(--accent-primary) 45%, transparent)" },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {cards.map((card) => (
        <article key={card.label} className="panel-elevated relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] p-4">
          <span className="absolute inset-x-0 top-0 h-1" style={{ background: card.tone }} />
          <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">{card.label}</p>
          <p className="mt-2 text-xl font-semibold">{card.value}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{card.sub}</p>
        </article>
      ))}
    </section>
  );
}

export function AttemptsTrendChart({ points }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  const visibleLabels = new Set(points.map((point, index) => (index % 2 === 0 || index === points.length - 1 ? point.label : null)).filter(Boolean));
  return (
    <section className={cardClass}>
      <h3 className={sectionTitleClass}>Attempts over time</h3>
      <div className="mt-4 h-48">
        <svg viewBox="0 0 600 180" className="h-full w-full" role="img" aria-label="Attempts over time line chart">
          {[0.25, 0.5, 0.75, 1].map((step) => (
            <line key={step} x1="20" y1={160 - step * 130} x2="580" y2={160 - step * 130} stroke="var(--border-subtle)" strokeDasharray="4 6" />
          ))}
          <line x1="20" y1="160" x2="580" y2="160" stroke="var(--border-subtle)" />
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="var(--accent-info)"
              strokeWidth="3"
              points={points.map((point, index) => `${20 + (index * 560) / (points.length - 1)} ${160 - (point.value / max) * 130}`).join(" ")}
            />
          )}
          {points.map((point, index) => {
            const x = points.length === 1 ? 300 : 20 + (index * 560) / (points.length - 1);
            const y = 160 - (point.value / max) * 130;
            return <circle key={point.label} cx={x} cy={y} r="4" fill="var(--accent-primary)" />;
          })}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-tertiary)]">
        {points.filter((point) => visibleLabels.has(point.label)).map((point) => <span key={point.label} className="rounded-md border border-[var(--border-subtle)] px-2 py-1">{point.label}: {point.value}</span>)}
      </div>
    </section>
  );
}

export function ResultDistributionChart({ distribution }) {
  const total = Object.values(distribution).reduce((sum, value) => sum + value, 0) || 1;
  const segments = [
    { key: "solved", value: distribution.solved || 0, color: "var(--accent-success)", label: "Solved" },
    { key: "partially_solved", value: distribution.partially_solved || 0, color: "var(--accent-primary)", label: "Partially" },
    { key: "failed", value: distribution.failed || 0, color: "var(--accent-danger)", label: "Failed" },
  ];
  let cumulative = 0;
  return (
    <section className={cardClass}>
      <h3 className={sectionTitleClass}>Result distribution</h3>
      <div className="mt-4 flex items-center justify-center gap-5">
        <div className="relative">
        <svg viewBox="0 0 42 42" className="h-32 w-32 -rotate-90">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--surface-soft)" strokeWidth="5" />
          {segments.map((segment) => {
            const stroke = (segment.value / total) * 100;
            const dashArray = `${stroke} ${100 - stroke}`;
            const el = <circle key={segment.key} cx="21" cy="21" r="15.915" fill="transparent" stroke={segment.color} strokeWidth="5" strokeLinecap="round" strokeDasharray={dashArray} strokeDashoffset={-cumulative} />;
            cumulative += stroke;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold">{total}</div>
        </div>
        <div className="space-y-2 text-sm">
          {segments.map((segment) => (
            <div key={segment.key} className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
              <span>{segment.label}</span>
              <span className="text-[var(--text-tertiary)]">{segment.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MistakeFrequencyChart({ mistakes }) {
  const max = Math.max(...mistakes.map((mistake) => mistake.count), 1);
  return (
    <section className={cardClass}>
      <h3 className={sectionTitleClass}>Mistake frequency</h3>
      {mistakes.length === 0 ? <div className="mt-4"><EmptyPanel message="No mistake tags have been logged yet." /></div> : (
        <div className="mt-4 space-y-3">
          {mistakes.map((mistake) => (
            <div key={mistake.name}>
              <div className="mb-1 flex justify-between text-xs text-[var(--text-secondary)]"><span>{mistake.name}</span><span>{mistake.count}</span></div>
              <div className="h-2 rounded-full bg-[var(--surface-soft)]">
                <div className="h-2 rounded-full" style={{ width: `${(mistake.count / max) * 100}%`, background: "var(--accent-danger)" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function TopicMasteryChart({ topics }) {
  return (
    <section className={cardClass}>
      <h3 className={sectionTitleClass}>Topic-wise mastery</h3>
      {topics.length === 0 ? <div className="mt-4"><EmptyPanel message="Topic mastery appears after you log attempts." /></div> : (
        <div className="mt-4 grid gap-2">
          {topics.map((topic) => (
            <div key={topic.name} className="rounded-lg border border-[var(--border-subtle)] px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-secondary)]"><span>{topic.name}</span><span>{topic.mastery}%</span></div>
              <div className="h-2 rounded-full bg-[var(--surface-soft)]"><div className="h-2 rounded-full bg-[var(--accent-success)]" style={{ width: `${topic.mastery}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function RevisionTimelineCard({ items }) {
  return (
    <section className={cardClass}>
      <h3 className={sectionTitleClass}>Revision timeline</h3>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <button key={item.label} type="button" className="flex w-full items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-left hover:border-[var(--border-strong)]">
            <span className="text-sm">{item.label}</span>
            <span className="text-xs text-[var(--text-tertiary)]">{item.count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function WeakAreasCard({ weakAreas }) {
  return (
    <section className={cardClass}>
      <h3 className={sectionTitleClass}>Weak areas (ranked)</h3>
      {weakAreas.length === 0 ? <div className="mt-4"><EmptyPanel message="No weak area has enough data yet." /></div> : (
        <div className="mt-4 space-y-3">
          {weakAreas.map((area, index) => (
            <article key={area.name} className="rounded-xl border border-[var(--border-subtle)] p-3">
              <div className="flex items-center justify-between"><p className="font-medium">#{index + 1} {area.name}</p><span className="text-xs text-[var(--text-tertiary)]">{area.revisionDue} revisions due</span></div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
                <span>Mastery: {area.mastery}%</span><span>Attempts: {area.attempts}</span>
                <span>Solved: {area.solvedRate}%</span><span>Avg time: {area.avgMinutes} min</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function RecentMistakesCard({ mistakes }) {
  return (
    <section className={cardClass}>
      <h3 className={sectionTitleClass}>Recent mistakes</h3>
      {mistakes.length === 0 ? <div className="mt-4"><EmptyPanel message="Mistake history appears after you tag attempt mistakes." /></div> : (
        <ul className="mt-4 list-none space-y-2 pl-0">
          {mistakes.map((mistake) => (
            <li key={mistake.id} className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm">
              <p className="font-medium">{mistake.summary || mistake.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Last seen: {mistake.when}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SuggestionsCard({ insights, actions }) {
  return (
    <section className={cardClass}>
      <h3 className={sectionTitleClass}>Insights & next actions</h3>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-subtle)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Auto-generated insights</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[var(--text-secondary)]">
            {insights.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Suggested next actions</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[var(--text-secondary)]">
            {actions.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function AnalyticsBreakdownCard({ title, items, valueLabel = "attempts" }) {
  const max = Math.max(...items.map((item) => item.attempts), 1);
  return (
    <section className={cardClass}>
      <h3 className={sectionTitleClass}>{title}</h3>
      {items.length === 0 ? <div className="mt-4"><EmptyPanel message="No breakdown data for the selected filters." /></div> : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article key={item.name} className="rounded-lg border border-[var(--border-subtle)] px-3 py-2">
              <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
                <span className="truncate font-medium text-[var(--text-primary)]">{item.name}</span>
                <span>{item.attempts} {valueLabel}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[var(--surface-soft)]">
                <div className="h-2 rounded-full bg-[var(--accent-primary)]" style={{ width: `${(item.attempts / max) * 100}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-[var(--text-tertiary)]">
                <span>{item.solvedRate}% solved</span>
                <span>{item.avgMinutes} min avg</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function RevisionQueueCard({ items }) {
  return (
    <section className={cardClass}>
      <h3 className={sectionTitleClass}>Revision queue</h3>
      {items.length === 0 ? <div className="mt-4"><EmptyPanel message="No revisions are due in the selected window." /></div> : (
        <ul className="mt-4 list-none space-y-2 pl-0">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.problemName}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{item.topic} - {item.platform}</p>
                </div>
                <span className="shrink-0 rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[11px] text-[var(--text-tertiary)]">
                  {item.dueInDays < 0 ? "Overdue" : item.dueInDays === 0 ? "Today" : `${item.dueInDays}d`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
