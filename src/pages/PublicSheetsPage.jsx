import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AppShell from "../components/AppShell";
import SeoMeta from "../components/SeoMeta";
import SheetCatalogCard from "../components/SheetCatalogCard";
import EmptyState from "../components/ui/EmptyState";
import SurfaceCard from "../components/ui/SurfaceCard";
import { fetchPublicCatalog } from "../api/sheetApi";
import { ADMIN_USERNAME } from "../config/envConfig";
import { navigateTo } from "../services/routes";
import { useAuthStore } from "../store/authStore";

const PAGE_SIZE = 6;

const normalizeTag = (tag, index) => ({
  id: tag?.id || tag?.name || tag?.title || `tag-${index}`,
  name: tag?.name || tag?.title || tag?.label || "",
  color: tag?.color || "var(--accent-primary)",
});

function CatalogSkeleton({ count = PAGE_SIZE }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading sheets">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`catalog-skeleton-${index}`} className="min-h-[210px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 animate-pulse">
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

function PublicSheetsPage({ theme, onThemeChange }) {
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [sheets, setSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let isMounted = true;
    fetchPublicCatalog()
      .then((catalog) => {
        if (isMounted) setSheets(Array.isArray(catalog) ? catalog : []);
      })
      .catch(() => {
        if (isMounted) setSheets([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const topicFilters = useMemo(() => {
    const tagMap = new Map();
    sheets.forEach((sheet) => {
      (Array.isArray(sheet.topicTags) ? sheet.topicTags : [])
        .map(normalizeTag)
        .filter((tag) => tag.name)
        .forEach((tag) => {
          const key = tag.name.toLowerCase();
          if (!tagMap.has(key)) tagMap.set(key, tag);
        });
    });
    return ["All", ...Array.from(tagMap.values()).map((tag) => tag.name).sort((a, b) => a.localeCompare(b))];
  }, [sheets]);

  const filteredSheets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sheets.filter((sheet) => {
      const matchesSearch = !query
        || `${sheet.title || ""}`.toLowerCase().includes(query)
        || `${sheet.description || ""}`.toLowerCase().includes(query);
      const tags = (Array.isArray(sheet.topicTags) ? sheet.topicTags : []).map((tag, index) => normalizeTag(tag, index).name.toLowerCase());
      const matchesFilter = selectedFilter === "All" || tags.includes(selectedFilter.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, selectedFilter, sheets]);

  const visibleSheets = filteredSheets.slice(0, visibleCount);
  const canShowMore = visibleCount < filteredSheets.length;
  const canonicalPath = "/explore";
  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Explore Public DSA Sheets",
    url: `https://www.createsheets.com${canonicalPath}`,
    itemListElement: visibleSheets.map((sheet, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: sheet.title || "Untitled Sheet",
      url: sheet.publicUrl || `https://www.createsheets.com${sheet.publicPath || location.pathname}`,
    })),
  }), [location.pathname, visibleSheets]);

  return (
    <AppShell
      title="Explore Public DSA Sheets"
      subtitle="Discover public DSA, programming, and coding interview preparation trackers shared on CreateSheets."
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Account"}
    >
      <SeoMeta
        title="Explore Public DSA Sheets | CreateSheets"
        description="Discover public DSA sheets, programming sheets, and coding interview preparation trackers shared on CreateSheets."
        path={canonicalPath}
        keywords={["coding sheets", "dsa sheets", "public sheets", "interview preparation"]}
        structuredData={structuredData}
      />

      <SurfaceCard title="Browse CreateSheets Sheets" description={`Search curated public sheets published under ${ADMIN_USERNAME}.`}>
        {isLoading ? (
          <CatalogSkeleton />
        ) : sheets.length === 0 ? (
          <EmptyState title="No sheets have been published yet." description="" icon="" />
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Search sheets</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="field-base w-full text-sm"
                  placeholder="Search by title or description"
                />
              </label>
              <button
                type="button"
                className="btn-base btn-neutral"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedFilter("All");
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                Reset
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {topicFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`btn-base ${selectedFilter === filter ? "btn-primary" : "btn-neutral"} px-3 py-1.5 text-sm`}
                  onClick={() => {
                    setSelectedFilter(filter);
                    setVisibleCount(PAGE_SIZE);
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            {filteredSheets.length === 0 ? (
              <EmptyState title="No matching sheets found" description="Try another search or topic filter." icon="" />
            ) : (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleSheets.map((sheet) => (
                    <SheetCatalogCard
                      key={sheet.id}
                      {...sheet}
                      onOpen={({ shareId }) => {
                        if (sheet.publicPath) {
                          navigateTo(sheet.publicPath);
                          return;
                        }
                        if (shareId) navigateTo(`/shared/sheet/${shareId}`);
                      }}
                    />
                  ))}
                </div>

                {canShowMore ? (
                  <div className="mt-5">
                    <button type="button" className="btn-base btn-neutral" onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}>
                      Show More
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </SurfaceCard>
    </AppShell>
  );
}

export default PublicSheetsPage;
