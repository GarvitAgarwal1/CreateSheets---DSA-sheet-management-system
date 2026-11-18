import { useEffect, useMemo, useState } from "react";
import { DEFAULT_APP_ICON_URL } from "../config/branding";

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const FALLBACK_LOGO_URL = DEFAULT_APP_ICON_URL;

const normalizeImageUrl = (value) => {
  const raw = `${value || ""}`.trim();
  if (!raw) return FALLBACK_LOGO_URL;

  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : FALLBACK_LOGO_URL;
  } catch {
    return FALLBACK_LOGO_URL;
  }
};

const formatRelativeUpdatedAt = (value) => {
  if (!value) return "Not updated yet";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Not updated yet";

  const elapsedMs = Date.now() - timestamp;
  if (elapsedMs < 0) return "Just now";

  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 30) return `${elapsedDays}d ago`;

  return new Date(timestamp).toLocaleDateString();
};

function SheetHeader({
  title,
  description,
  logoUrl,
  onEditMetadata,
  completedCount,
  totalCount,
  updatedAt,
  metadata = [],
  downloadsCount,
  copiesCount,
  onDownloadsClick,
  onCopiesClick,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [resolvedLogoUrl, setResolvedLogoUrl] = useState(normalizeImageUrl(logoUrl));

  const safeCompleted = Number.isFinite(completedCount) ? Math.max(0, completedCount) : 0;
  const safeTotal = Number.isFinite(totalCount) ? Math.max(0, totalCount) : 0;
  const percent = safeTotal > 0 ? Math.round((safeCompleted / safeTotal) * 100) : 0;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnimatedPercent(percent));
    return () => window.cancelAnimationFrame(frame);
  }, [percent]);

  useEffect(() => {
    setResolvedLogoUrl(normalizeImageUrl(logoUrl));
  }, [logoUrl]);

  const ringOffset = RING_CIRCUMFERENCE - (Math.min(100, Math.max(0, animatedPercent)) / 100) * RING_CIRCUMFERENCE;
  const safeDescription = description?.trim() || "No description added yet.";
  const hasLongDescription = safeDescription.length > 180;
  const displayMetadata = useMemo(
    () => [
      { label: "Updated", value: formatRelativeUpdatedAt(updatedAt) },
      { label: "Questions", value: safeTotal },
      { label: "Done", value: safeCompleted },
      ...metadata,
    ],
    [metadata, safeCompleted, safeTotal, updatedAt]
  );

  const progressTone = percent >= 80 ? "var(--color-solved)" : percent >= 30 ? "var(--color-attempted)" : "var(--accent-primary)";

  return (
    <header className="sheet-header-card">
      <img
        src={resolvedLogoUrl}
        alt=""
        className="h-14 w-14 shrink-0 rounded-full border-2 border-[var(--border-subtle)] object-cover shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
        onError={() => {
          if (resolvedLogoUrl !== FALLBACK_LOGO_URL) setResolvedLogoUrl(FALLBACK_LOGO_URL);
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl leading-tight">{title || "Question Sheet"}</h1>
          {onEditMetadata ? (
            <button type="button" className="btn-base btn-ghost btn-sm flex-shrink-0" onClick={onEditMetadata} aria-label="Edit sheet name and description">
              ✏️ Edit
            </button>
          ) : null}
        </div>
        <div>
          <p
            className={`text-sm leading-relaxed text-[var(--text-secondary)] ${!isExpanded ? "overflow-hidden" : ""}`}
            style={!isExpanded ? { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } : undefined}
          >
            {safeDescription}
          </p>
          {hasLongDescription ? (
            <button type="button" className="link-base text-xs mt-1" onClick={() => setIsExpanded((value) => !value)}>
              {isExpanded ? "Show less" : "Read more"}
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {displayMetadata.map((item) => (
            <span key={`${item.label}-${item.value}`} className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] bg-[var(--surface-subtle)] rounded-full px-2 py-0.5">
              <span>{item.label}:</span>
              <span className="font-semibold text-[var(--text-secondary)]">{item.value}</span>
            </span>
          ))}
          {Number.isFinite(downloadsCount) ? (
            <button type="button" className="btn-base btn-ghost btn-sm rounded-full text-xs" onClick={onDownloadsClick}>
              Downloads: <span className="font-semibold">{downloadsCount}</span>
            </button>
          ) : null}
          {Number.isFinite(copiesCount) ? (
            <button type="button" className="btn-base btn-ghost btn-sm rounded-full text-xs" onClick={onCopiesClick}>
              Copies: <span className="font-semibold">{copiesCount}</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="hidden sm:flex flex-col items-center flex-shrink-0">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96" aria-label="Sheet completion progress">
            <circle cx="48" cy="48" r={RING_RADIUS} fill="none" stroke="var(--surface-muted)" strokeWidth="6" />
            <circle
              cx="48"
              cy="48"
              r={RING_RADIUS}
              fill="none"
              stroke={progressTone}
              strokeLinecap="round"
              strokeWidth="6"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              style={{ transition: "stroke-dashoffset 700ms ease" }}
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-mono)" }}>{percent}%</p>
          </div>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">{safeCompleted}/{safeTotal}</p>
      </div>
    </header>
  );
}

export default SheetHeader;
