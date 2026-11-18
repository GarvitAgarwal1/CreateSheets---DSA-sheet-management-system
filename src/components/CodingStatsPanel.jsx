import { useMemo, useState } from "react";
import DonutChart from "./DonutChart";

const PLATFORM_COLORS = {
  leetcode: "#ffa116",
  codeforces: "#1f8dd6",
  codechef: "#d4a843",
  atcoder: "#00a86b",
  hackerrank: "#00ea64",
  hackerearth: "#22d3ee",
  topcoder: "#ef4444",
  spoj: "#e84142",
  kattis: "#14b8a6",
  cses: "#64748b",
  codewars: "#b91c1c",
  exercism: "#2563eb",
  codesignal: "#8b5cf6",
  codingame: "#f97316",
  dmoj: "#94a3b8",
  github: "#57606a",
};

const TOPIC_COLORS = ["#22d3ee", "#8b5cf6", "#f59e0b", "#10b981", "#f43f5e", "#64748b", "#60a5fa", "#a78bfa"];
const DIFFICULTY_COLORS = {
  easy: "#10b981",
  medium: "#f59e0b",
  hard: "#ef4444",
  unknown: "#64748b",
};
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const compactNumber = (value) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(asNumber(value));

const formatDateTime = (value) => {
  if (!value) return "Not synced yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not synced yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const monthLabel = (date) => new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);

function toMap(points = []) {
  return new Map(points.map((point) => [point.label, asNumber(point.count)]));
}

function buildHeatmap(activity = []) {
  const activityMap = toMap(activity);
  const today = new Date();
  return Array.from({ length: 52 }, (_, weekIndex) => (
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(today);
      date.setDate(today.getDate() - ((51 - weekIndex) * 7 + (6 - dayIndex)));
      const label = date.toISOString().slice(0, 10);
      return { label, count: activityMap.get(label) || 0 };
    })
  ));
}

function heatColor(count) {
  if (count <= 0) return "var(--surface-muted)";
  if (count < 3) return "color-mix(in srgb, var(--color-solved) 32%, var(--surface-muted))";
  if (count < 6) return "color-mix(in srgb, var(--color-solved) 55%, var(--surface-muted))";
  if (count < 9) return "color-mix(in srgb, var(--color-solved) 78%, var(--surface-muted))";
  return "var(--color-solved)";
}

function buildActivitySeries(activity = [], duration) {
  const months = duration === "1m" ? 4 : duration === "6m" ? 6 : 12;
  const activityMap = toMap(activity);
  const buckets = [];
  const now = new Date();

  if (duration === "1m") {
    for (let bucketIndex = 3; bucketIndex >= 0; bucketIndex -= 1) {
      let count = 0;
      for (let dayOffset = bucketIndex * 7; dayOffset < bucketIndex * 7 + 7; dayOffset += 1) {
        const date = new Date(now);
        date.setDate(now.getDate() - dayOffset);
        count += activityMap.get(date.toISOString().slice(0, 10)) || 0;
      }
      buckets.push({ label: `W${4 - bucketIndex}`, value: count });
    }
    return buckets;
  }

  for (let monthOffset = months - 1; monthOffset >= 0; monthOffset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const prefix = date.toISOString().slice(0, 7);
    const count = [...activityMap.entries()]
      .filter(([label]) => label.startsWith(prefix))
      .reduce((sum, [, itemCount]) => sum + itemCount, 0);
    buckets.push({ label: monthLabel(date), value: count });
  }
  return buckets;
}

function buildRatingSeries(profiles = [], duration) {
  const limit = duration === "6m" ? 6 : 12;
  return profiles
    .flatMap((profile) => (profile.stats?.ratingHistory || []).map((point) => ({
      label: point.label || profile.platformLabel || profile.platform,
      value: asNumber(point.rating),
      color: PLATFORM_COLORS[profile.platform] || "var(--accent-primary)",
    })))
    .filter((point) => point.value > 0)
    .slice(-limit);
}

function toDonutItems(rows = [], colors = TOPIC_COLORS) {
  const preparedRows = rows
    .map((row, rowIndex) => ({
      key: row.key || row.label || `row-${rowIndex}`,
      label: row.label || row.key || "Unknown",
      color: row.color || colors[rowIndex % colors.length],
      count: asNumber(row.count ?? row.value),
    }))
    .filter((row) => row.count > 0);
  const total = preparedRows.reduce((sum, row) => sum + row.count, 0);
  return {
    total,
    items: preparedRows.map((row) => ({
      ...row,
      percent: total ? Math.max(1, Math.round((row.count / total) * 100)) : 0,
    })),
  };
}

function buildTopicItems(aggregate = {}) {
  const topicRows = aggregate.topics?.length ? aggregate.topics : aggregate.platformBreakdown;
  if (topicRows?.length) {
    return toDonutItems(topicRows.slice(0, 6));
  }
  return toDonutItems([]);
}

function buildDifficultyItems(difficulty = {}) {
  return toDonutItems([
    { key: "easy", label: "Easy", count: difficulty.easy, color: DIFFICULTY_COLORS.easy },
    { key: "medium", label: "Medium", count: difficulty.medium, color: DIFFICULTY_COLORS.medium },
    { key: "hard", label: "Hard", count: difficulty.hard, color: DIFFICULTY_COLORS.hard },
    { key: "unknown", label: "Other", count: difficulty.unknown, color: DIFFICULTY_COLORS.unknown },
  ]);
}

function DashboardCard({ children, className = "" }) {
  return (
    <section className={`min-w-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)] ${className}`}>
      {children}
    </section>
  );
}

function SectionLabel({ children }) {
  return <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{children}</p>;
}

function StatTile({ label, value, sub, color = "var(--accent-primary)", children }) {
  return (
    <DashboardCard>
      <SectionLabel>{label}</SectionLabel>
      <p className="text-4xl font-bold leading-none" style={{ color }}>{value}</p>
      {sub ? <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">{sub}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </DashboardCard>
  );
}

function MetricPills({ rows }) {
  return (
    <div className="grid min-w-0 grid-cols-3 gap-2">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-1.5 py-3 text-center">
          <p className="text-sm font-bold" style={{ color: row.color }}>{row.value}</p>
          <p className="mt-1 text-[9px] text-[var(--text-tertiary)]">{row.label}</p>
        </div>
      ))}
    </div>
  );
}

function DurationTabs({ value, options, onChange }) {
  return (
    <div className="flex rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`rounded-md px-3 py-1 text-[10px] font-semibold ${value === option ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function Heatmap({ activity = [] }) {
  const weeks = useMemo(() => buildHeatmap(activity), [activity]);
  return (
    <div>
      <div className="overflow-x-auto">
        <div className="flex min-w-[690px] gap-0.5">
          {weeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className="flex flex-col gap-0.5">
              {week.map((day) => (
                <span
                  key={day.label}
                  className="h-2.5 w-2.5 rounded-[2px]"
                  title={`${day.label}: ${day.count}`}
                  style={{ background: heatColor(day.count) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
        <span>Less</span>
        {[0, 2, 5, 8, 10].map((count) => <span key={count} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: heatColor(count) }} />)}
        <span>More</span>
      </div>
    </div>
  );
}

function SvgTrend({ data = [], color = "var(--accent-primary)", fill = false, emptyText = "No synced history yet." }) {
  if (data.length < 2 || data.every((point) => asNumber(point.value) === 0)) {
    return <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--surface)] px-4 text-center text-xs text-[var(--text-tertiary)]">{emptyText}</div>;
  }
  const values = data.map((point) => asNumber(point.value));
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, maxValue);
  const spread = Math.max(maxValue - minValue, 1);
  const chartWidth = 640;
  const chartHeight = 150;
  const paddingX = 34;
  const paddingY = 18;
  const points = data.map((point, pointIndex) => {
    const xPosition = paddingX + (pointIndex * (chartWidth - paddingX * 2)) / (data.length - 1);
    const yPosition = chartHeight - paddingY - ((asNumber(point.value) - minValue) / spread) * (chartHeight - paddingY * 2);
    return { ...point, xPosition, yPosition };
  });
  const path = points.map((point) => `${point.xPosition},${point.yPosition}`).join(" ");
  const areaPath = `${paddingX},${chartHeight - paddingY} ${path} ${chartWidth - paddingX},${chartHeight - paddingY}`;

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[150px] w-full" role="img" aria-label="Trend chart">
      {[0, 1, 2, 3].map((gridIndex) => {
        const yPosition = paddingY + (gridIndex * (chartHeight - paddingY * 2)) / 3;
        return <line key={gridIndex} x1={paddingX} y1={yPosition} x2={chartWidth - paddingX} y2={yPosition} stroke="var(--border-subtle)" strokeDasharray="3 3" />;
      })}
      {fill ? <polygon points={areaPath} fill={color} opacity="0.18" /> : null}
      <polyline points={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, pointIndex) => (
        <circle key={`${point.label}-${pointIndex}`} cx={point.xPosition} cy={point.yPosition} r="3.5" fill={point.color || color} />
      ))}
      {points.map((point, pointIndex) => (
        <text key={`${point.label}-label-${pointIndex}`} x={point.xPosition} y={chartHeight - 3} textAnchor="middle" fill="var(--text-tertiary)" fontSize="10">
          {point.label}
        </text>
      ))}
    </svg>
  );
}

function SkillRadar({ aggregate = {}, profiles = [] }) {
  const difficulty = aggregate.difficulty || {};
  const totalSolved = asNumber(aggregate.totalSolved);
  const activityDays = new Set((aggregate.activity || []).filter((item) => asNumber(item.count) > 0).map((item) => item.label)).size;
  const githubProfile = profiles.find((profile) => profile.platform === "github");
  const bestRating = Math.max(...profiles.map((profile) => asNumber(profile.stats?.rating)), 0);
  const hardSolved = asNumber(difficulty.hard);
  const axes = [
    { label: "DSA", value: Math.min(100, totalSolved / 6) },
    { label: "CP", value: Math.min(100, bestRating / 22) },
    { label: "Dev", value: Math.min(100, asNumber(githubProfile?.stats?.commits) * 4) },
    { label: "Consistency", value: Math.min(100, activityDays * 3) },
    { label: "Difficulty", value: Math.min(100, hardSolved * 4) },
    { label: "Contest", value: Math.min(100, asNumber(aggregate.contests) * 5) },
  ];
  const center = 96;
  const radius = 66;
  const points = axes.map((axis, axisIndex) => {
    const angle = -Math.PI / 2 + (axisIndex * Math.PI * 2) / axes.length;
    const axisRadius = (axis.value / 100) * radius;
    return {
      ...axis,
      xPosition: center + Math.cos(angle) * axisRadius,
      yPosition: center + Math.sin(angle) * axisRadius,
      labelX: center + Math.cos(angle) * (radius + 22),
      labelY: center + Math.sin(angle) * (radius + 22),
      endX: center + Math.cos(angle) * radius,
      endY: center + Math.sin(angle) * radius,
    };
  });

  return (
    <svg viewBox="0 0 192 192" className="mx-auto h-[210px] w-full max-w-[320px]" role="img" aria-label="Skill radar">
      {[0.33, 0.66, 1].map((scale) => (
        <polygon
          key={scale}
          points={axes.map((axis, axisIndex) => {
            const angle = -Math.PI / 2 + (axisIndex * Math.PI * 2) / axes.length;
            return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
          }).join(" ")}
          fill="none"
          stroke="var(--border-subtle)"
        />
      ))}
      {points.map((point) => <line key={point.label} x1={center} y1={center} x2={point.endX} y2={point.endY} stroke="var(--border-subtle)" />)}
      <polygon points={points.map((point) => `${point.xPosition},${point.yPosition}`).join(" ")} fill="var(--accent-primary)" opacity="0.24" stroke="var(--accent-primary)" strokeWidth="3" />
      {points.map((point) => (
        <text key={`${point.label}-text`} x={point.labelX} y={point.labelY} textAnchor="middle" fill="var(--text-tertiary)" fontSize="10">
          {point.label}
        </text>
      ))}
    </svg>
  );
}

function PublicSheetCards({ publicSheets = [] }) {
  const visibleSheets = publicSheets.slice(0, 4);
  const cards = visibleSheets.map((sheet) => ({
    title: sheet.title || "Untitled Sheet",
    meta: `${(sheet.topics || []).length || sheet.totalQuestions || 0} problems`,
    color: "var(--accent-primary)",
  }));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card) => (
        <div key={`${card.title}-${card.meta}`} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent-primary)]">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{card.title}</p>
          <p className="mt-2 text-xs" style={{ color: card.color }}>{card.meta}</p>
        </div>
      ))}
      {!cards.length ? <p className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--surface)] p-4 text-xs text-[var(--text-tertiary)] sm:col-span-2">Public sheets appear here after you mark a sheet public.</p> : null}
    </div>
  );
}

function CodingDonutChart({ items, total, emptyText }) {
  return (
    <div
      className="flex min-h-[320px] justify-center"
      style={{
        "--surface": "var(--surface)",
        "--text-primary": "var(--text-primary)",
        "--text-secondary": "var(--text-secondary)",
      }}
    >
      <DonutChart
        items={items}
        total={total}
        emptyText={emptyText}
        labelColor="var(--text-primary)"
        className="max-w-[420px]"
        hoverClassName="border border-[var(--border-subtle)] !bg-[var(--surface)] !text-[var(--text-secondary)]"
      />
    </div>
  );
}

function RightProfileRail({
  profile,
  aggregate = {},
  publicSheets = [],
  profileShareUrl = "",
  copyStatus = "",
  onCopyProfileUrl,
  onPreviewProfile,
  onEditProfile,
  profileStats = {},
  onShowFollowers,
  onShowFollowing,
  onShowSheets,
  onShowDownloads,
  onShowCopies,
}) {
  const displayName = profile?.name || profile?.username || "Coding Profile";
  const username = profile?.username || "username";
  const initials = displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "CP";
  const difficulty = aggregate.difficulty || {};
  const rating = asNumber(aggregate.contests) ? Math.max(0, Math.min(2400, Math.round(asNumber(aggregate.totalSolved) * 2 + asNumber(aggregate.contests) * 25))) : 0;
  const profileLocation = [profile?.location, profile?.institution, profile?.company].filter(Boolean).join(" · ");

  return (
    <aside className="w-full shrink-0 border-t border-[var(--border-subtle)] bg-[var(--surface)] p-4 xl:w-[270px] xl:border-l xl:border-t-0">
      <div className="text-center">
        <SectionLabel>Profile and sharing</SectionLabel>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[color-mix(in_srgb,var(--accent-primary)_42%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_14%,var(--surface-elevated))] text-lg font-bold text-[var(--text-primary)]">{initials}</div>
        <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">{displayName}</p>
        {profile?.headline ? <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">{profile.headline}</p> : null}
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">@{username}</p>
      </div>
      {profileLocation ? <p className="mt-4 text-center text-xs text-[var(--text-tertiary)]">{profileLocation}</p> : null}
      <p className="mt-4 text-xs leading-6 text-[var(--text-secondary)]">{profile?.bio || "Add a short bio from Edit Profile to personalize your public portfolio."}</p>

      <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3">
        <p className="caption-text text-xs">Public Portfolio Link</p>
        <p className="mt-2 break-all text-xs text-[var(--text-secondary)]">{profileShareUrl}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="btn-base btn-neutral px-2 py-1.5 text-xs" onClick={onCopyProfileUrl}>
            {copyStatus || "Copy"}
          </button>
          <button type="button" className="btn-base btn-primary px-2 py-1.5 text-xs" onClick={onPreviewProfile}>
            Preview
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {[
          { label: "Followers", value: profileStats.followers ?? profile?.followersCount ?? 0, onClick: onShowFollowers },
          { label: "Following", value: profileStats.following ?? profile?.followingCount ?? 0, onClick: onShowFollowing },
          { label: "Sheets", value: profileStats.sheets ?? publicSheets.length, onClick: onShowSheets },
          { label: "Copied", value: profileStats.copied ?? 0, onClick: onShowCopies },
          { label: "Downloaded", value: profileStats.downloaded ?? 0, onClick: onShowDownloads },
          { label: "Hard", value: difficulty.hard || 0 },
        ].map((item) => (
          <button key={item.label} type="button" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-center transition hover:border-[var(--accent-primary)] disabled:cursor-default" onClick={item.onClick} disabled={!item.onClick}>
            <p className="text-lg font-bold text-[var(--text-primary)]">{compactNumber(item.value)}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">{item.label}</p>
          </button>
        ))}
      </div>
      <button type="button" className="btn-base btn-neutral mt-4 w-full text-xs" onClick={onEditProfile}>Edit Profile</button>
      <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
        <SectionLabel>Current Streak</SectionLabel>
        <p className="text-3xl font-bold text-[var(--difficulty-medium)]">{Math.min(99, new Set((aggregate.activity || []).map((item) => item.label)).size || 0)}</p>
        <p className="text-xs text-[var(--text-tertiary)]">active days synced</p>
      </div>
      <div className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
        <SectionLabel>Coding Rating</SectionLabel>
        <p className="text-3xl font-bold text-[var(--accent-primary)]">{rating || "-"}</p>
        <p className="text-xs text-[var(--text-tertiary)]">{asNumber(aggregate.contests)} contests tracked</p>
      </div>
    </aside>
  );
}

function PlatformMark({ platform, color }) {
  if (platform === "github") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8 15.5c1.1.7 2.4 1.1 4 1.1s2.9-.4 4-1.1M9 10.5h.01M15 10.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (platform === "codeforces") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <rect x="4" y="10" width="4" height="9" rx="1.2" fill={color} />
        <rect x="10" y="5" width="4" height="14" rx="1.2" fill={color} opacity="0.75" />
        <rect x="16" y="8" width="4" height="11" rx="1.2" fill={color} opacity="0.5" />
      </svg>
    );
  }

  if (platform === "leetcode") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M15.5 5 8 12l7.5 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 12h9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (platform === "codechef") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M7 11.5c-.7-4.7 3.5-6.8 5-3.1 1.5-3.7 5.7-1.6 5 3.1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 11h8l-1 7H9l-1-7Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  if (platform === "hackerrank") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M12 3 19 7v10l-7 4-7-4V7l7-4Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 8v8M15 8v8M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function PlatformRail({ profiles = [], activePlatform, onActivePlatformChange, onAddProfile }) {
  return (
    <aside className="flex gap-2 overflow-x-auto border-b border-[var(--border-subtle)] bg-[var(--surface)] p-3 lg:w-[64px] lg:shrink-0 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r">
      {profiles.map((profile) => {
        const color = PLATFORM_COLORS[profile.platform] || "var(--accent-primary)";
        const isActive = activePlatform === profile.platform;
        return (
          <button
            key={profile.id}
            type="button"
            title={profile.platformLabel || profile.platform}
            aria-label={profile.platformLabel || profile.platform}
            className="flex h-11 min-w-11 items-center justify-center rounded-lg border transition hover:scale-[1.03]"
            style={{
              borderColor: isActive ? color : "var(--border-subtle)",
              color: isActive ? color : "var(--text-tertiary)",
              background: isActive ? `${color}22` : "transparent",
            }}
            onClick={() => onActivePlatformChange(profile.platform)}
          >
            <PlatformMark platform={profile.platform} color={color} />
          </button>
        );
      })}
      {onAddProfile ? (
        <button
          type="button"
          title="Add platform"
          className="flex h-11 min-w-11 items-center justify-center rounded-lg border border-dashed border-[var(--border-base)] text-xl text-[var(--text-tertiary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] lg:mt-auto"
          onClick={onAddProfile}
        >
          +
        </button>
      ) : null}
    </aside>
  );
}

function CodingStatsPanel({
  codingStats,
  title = "Coding Stats",
  compact = false,
  publicSheets = [],
  profile = null,
  showRail = true,
  onAddProfile = null,
  profileShareUrl = "",
  copyStatus = "",
  onCopyProfileUrl,
  onPreviewProfile,
  onEditProfile,
  profileStats,
  onShowFollowers,
  onShowFollowing,
  onShowSheets,
  onShowDownloads,
  onShowCopies,
}) {
  const profiles = codingStats?.profiles || EMPTY_ARRAY;
  const aggregate = codingStats?.aggregate || EMPTY_OBJECT;
  const difficulty = aggregate.difficulty || EMPTY_OBJECT;
  const activity = aggregate.activity || EMPTY_ARRAY;
  const [dsaDuration, setDsaDuration] = useState("6m");
  const [contestDuration, setContestDuration] = useState("6m");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const activePlatform = profiles.some((profileItem) => profileItem.platform === selectedPlatform)
    ? selectedPlatform
    : profiles[0]?.platform || "";

  const activitySeries = useMemo(() => buildActivitySeries(activity, dsaDuration), [activity, dsaDuration]);
  const ratingSeries = useMemo(() => buildRatingSeries(profiles, contestDuration), [contestDuration, profiles]);
  const topicDonut = useMemo(() => buildTopicItems(aggregate), [aggregate]);
  const difficultyDonut = useMemo(() => buildDifficultyItems(difficulty), [difficulty]);

  const githubStats = profiles.find((item) => item.platform === "github")?.stats || {};
  const totalDevActivity = asNumber(githubStats.commits) + asNumber(githubStats.pullRequests) + asNumber(githubStats.issues);
  const currentPlatform = profiles.find((item) => item.platform === activePlatform) || profiles[0] || null;

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-md)]" style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" }}>
      <div className="flex min-h-[640px] flex-col lg:flex-row">
        {showRail ? (
          <PlatformRail
            profiles={profiles}
            activePlatform={currentPlatform?.platform}
            onActivePlatformChange={setSelectedPlatform}
            onAddProfile={onAddProfile}
          />
        ) : null}

        <div className="min-w-0 flex-1 overflow-x-hidden p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{title}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {profiles.length
                  ? `${profiles.length} verified profiles · synced ${formatDateTime(aggregate.lastSyncedAt)}`
                  : "No verified profiles yet - add one to start syncing real stats"}
              </p>
            </div>
            {currentPlatform ? (
              <a className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--accent-primary)] transition hover:border-[var(--accent-primary)]" href={currentPlatform.profileUrl} target="_blank" rel="noreferrer">
                Open @{currentPlatform.username}
              </a>
            ) : onAddProfile ? (
              <button type="button" className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--accent-primary)] transition hover:border-[var(--accent-primary)]" onClick={onAddProfile}>
                Add Profile
              </button>
            ) : null}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_2fr]">
            <StatTile label="Total Questions" value={compactNumber(aggregate.totalSolved)} sub={`${compactNumber(asNumber(aggregate.totalSolved) - asNumber(difficulty.unknown))} classified`}>
              <MetricPills rows={[
                { label: "Easy", value: compactNumber(difficulty.easy), color: DIFFICULTY_COLORS.easy },
                { label: "Med", value: compactNumber(difficulty.medium), color: DIFFICULTY_COLORS.medium },
                { label: "Hard", value: compactNumber(difficulty.hard), color: DIFFICULTY_COLORS.hard },
              ]} />
            </StatTile>
            <StatTile label="Commits & PRs" value={compactNumber(totalDevActivity)} color="var(--color-solved)" sub={`${compactNumber(asNumber(githubStats.commits))} commits synced`}>
              <MetricPills rows={[
                { label: "Commits", value: compactNumber(githubStats.commits), color: "var(--color-solved)" },
                { label: "PRs", value: compactNumber(githubStats.pullRequests), color: "var(--accent-primary)" },
                { label: "Issues", value: compactNumber(githubStats.issues), color: "var(--color-attempted)" },
              ]} />
            </StatTile>
            <DashboardCard>
              <SectionLabel>Submission Heatmap - Past Year</SectionLabel>
              <Heatmap activity={activity} />
            </DashboardCard>
          </div>

          {!compact ? (
            <>
              <div className="mt-3 grid gap-3 xl:grid-cols-2">
                <DashboardCard>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <SectionLabel>DSA Questions Over Time</SectionLabel>
                    <DurationTabs value={dsaDuration} options={["1m", "6m", "1y"]} onChange={setDsaDuration} />
                  </div>
                  <SvgTrend data={activitySeries} color="var(--accent-primary)" fill emptyText="Activity appears after syncing platforms with calendars." />
                </DashboardCard>
                <DashboardCard>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <SectionLabel>Contest Rating</SectionLabel>
                    <DurationTabs value={contestDuration} options={["6m", "1y"]} onChange={setContestDuration} />
                  </div>
                  <SvgTrend data={ratingSeries} color="var(--color-attempted)" emptyText="Rating history appears after syncing contest platforms." />
                </DashboardCard>
              </div>

              <div className="mt-3 grid gap-3 xl:grid-cols-2">
                <DashboardCard>
                  <SectionLabel>Skill Radar</SectionLabel>
                  <SkillRadar aggregate={aggregate} profiles={profiles} />
                </DashboardCard>
                <DashboardCard>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <SectionLabel>Public Sheets</SectionLabel>
                    <span className="text-xs text-[var(--accent-primary)]">{publicSheets.length ? `${publicSheets.length} total` : "No public sheets"}</span>
                  </div>
                  <PublicSheetCards publicSheets={publicSheets} />
                </DashboardCard>
              </div>

              <div className="mt-3 grid gap-3 xl:grid-cols-2">
                <DashboardCard>
                  <SectionLabel>Topics Breakdown</SectionLabel>
                  <CodingDonutChart
                    items={topicDonut.items}
                    total={topicDonut.total}
                    emptyText="Topic breakdown appears after syncing accepted submissions."
                  />
                </DashboardCard>
                <DashboardCard>
                  <SectionLabel>Difficulty Split</SectionLabel>
                  <CodingDonutChart
                    items={difficultyDonut.items}
                    total={difficultyDonut.total}
                    emptyText="Difficulty split appears after syncing platform stats."
                  />
                </DashboardCard>
              </div>
            </>
          ) : null}
        </div>

        {!compact ? (
          <RightProfileRail
            profile={profile}
            aggregate={aggregate}
            publicSheets={publicSheets}
            profileShareUrl={profileShareUrl}
            copyStatus={copyStatus}
            onCopyProfileUrl={onCopyProfileUrl}
            onPreviewProfile={onPreviewProfile}
            onEditProfile={onEditProfile}
            profileStats={profileStats}
            onShowFollowers={onShowFollowers}
            onShowFollowing={onShowFollowing}
            onShowSheets={onShowSheets}
            onShowDownloads={onShowDownloads}
            onShowCopies={onShowCopies}
          />
        ) : null}
      </div>
    </section>
  );
}

export default CodingStatsPanel;
