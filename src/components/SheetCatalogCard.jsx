import { useMemo, useState } from "react";
import TopicChipsPreview from "./TopicChipsPreview";
import { DEFAULT_APP_ICON_URL } from "../config/branding";

const FALLBACK_LOGO_URL = DEFAULT_APP_ICON_URL;

const normalizeUrl = (value) => {
  const raw = `${value || ""}`.trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
};

const normalizeTopicTags = (topicTags = []) =>
  (Array.isArray(topicTags) ? topicTags : [])
    .map((tag, index) => ({
      id: tag?.id || tag?.name || tag?.title || `tag-${index}`,
      name: tag?.name || tag?.title || tag?.label || "Topic",
      color: tag?.color || "var(--accent-primary)",
    }))
    .filter((tag) => tag.name);

function SheetCatalogCard({ id, title, description, logoUrl, sheetUrl, topicTags, shareId, publicPath, onOpen }) {
  const safeTitle = title?.trim() || "Untitled Sheet";
  const safeDescription = description?.trim() || "No description added yet.";
  const safeSheetUrl = normalizeUrl(sheetUrl);
  const normalizedLogoUrl = normalizeUrl(logoUrl) || FALLBACK_LOGO_URL;
  const [failedLogoUrl, setFailedLogoUrl] = useState("");
  const resolvedLogoUrl = failedLogoUrl === normalizedLogoUrl ? FALLBACK_LOGO_URL : normalizedLogoUrl;
  const visibleTags = useMemo(() => normalizeTopicTags(topicTags), [topicTags]);

  const handleImageError = () => {
    if (normalizedLogoUrl !== FALLBACK_LOGO_URL) {
      setFailedLogoUrl(normalizedLogoUrl);
    }
  };

  return (
    <article
      className="flex h-full min-h-[210px] flex-col rounded-2xl border border-[var(--border-subtle)] p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)]"
      data-sheet-id={id}
      style={{ background: "var(--surface-primary, var(--surface-elevated))" }}
    >
      <div className="flex items-start gap-3 border-b border-[var(--border-subtle)] pb-3">
        <img
          src={resolvedLogoUrl}
          alt=""
          loading="lazy"
          onError={handleImageError}
          className="h-[52px] w-[52px] shrink-0 rounded-full border-2 border-[var(--border-subtle)] object-cover shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
        />
        <div className="min-w-0 flex-1">
          <h3
            className="text-[15px] font-semibold leading-snug text-[var(--text-primary)]"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {safeTitle}
          </h3>
          <div className="mt-2">
            <TopicChipsPreview tags={visibleTags} maxVisible={3} placeholder="No topics" />
          </div>
        </div>
      </div>

      <p
        className="my-3 min-h-[60px] flex-1 text-[13px] leading-5 text-[var(--text-secondary)]"
        style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {safeDescription}
      </p>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3">
        <a
          href={publicPath || (shareId ? `/shared/sheet/${shareId}` : "#")}
          className="btn-base btn-neutral px-3 py-1.5 text-sm"
          onClick={(event) => {
            if (!publicPath && !shareId) {
              event.preventDefault();
              return;
            }
            if (onOpen) {
              event.preventDefault();
              onOpen({ id, shareId, publicPath });
            }
          }}
        >
          Open Sheet <span aria-hidden="true">→</span>
        </a>
        {safeSheetUrl ? (
          <a
            href={safeSheetUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-base btn-ghost btn-sm h-9 w-9 rounded-full px-0"
            aria-label="Open sheet reference URL"
            title="Open sheet reference URL"
          >
            ↗
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default SheetCatalogCard;
