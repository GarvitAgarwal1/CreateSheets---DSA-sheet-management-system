import { useEffect, useMemo, useState } from "react";
import DonutChart from "./DonutChart";

const TOPIC_DISTRIBUTION_HELPER_PREF_KEY = "iqms:topic-distribution:show-mode-helper";

const readTopicDistributionHelperPreference = () => {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(TOPIC_DISTRIBUTION_HELPER_PREF_KEY);
    if (stored === null) return true;
    return stored === "1";
  } catch {
    return true;
  }
};

function TopicDistributionChart({ topics = [], topicTags = [] }) {
  const [showModeHelper, setShowModeHelper] = useState(() => readTopicDistributionHelperPreference());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TOPIC_DISTRIBUTION_HELPER_PREF_KEY, showModeHelper ? "1" : "0");
    } catch {
      // Ignore storage write issues (private mode/quota).
    }
  }, [showModeHelper]);

  const distribution = useMemo(() => {
    const palette = ["#6366f1", "#14b8a6", "#f97316", "#8b5cf6", "#22c55e", "#eab308", "#ef4444", "#06b6d4", "#f43f5e", "#a3e635"];

    const tagCounts = new Map(topicTags.map((tag) => [tag.id, 0]));
    topics.forEach((topic) => {
      (topic.subTopics || []).forEach((sub) => {
        (sub.questions || []).forEach((question) => {
          [...new Set(question.topicTagIds || [])].forEach((id) => tagCounts.set(id, (tagCounts.get(id) || 0) + 1));
        });
      });
    });
    const tagLinkTotal = [...tagCounts.values()].reduce((sum, value) => sum + value, 0);
    const tagItems = topicTags
      .map((tag) => ({ key: tag.id, label: tag.name, color: tag.color, count: tagCounts.get(tag.id) || 0 }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .map((item) => ({ ...item, percent: tagLinkTotal ? Math.round((item.count / tagLinkTotal) * 100) : 0 }));

    if (tagItems.length > 0 && tagLinkTotal > 0) {
      return { total: tagLinkTotal, items: tagItems, mode: "tags" };
    }

    const topicItems = topics
      .map((topic, index) => {
        const count = (topic.subTopics || []).reduce((sum, sub) => sum + ((sub.questions || []).length), 0);
        return {
          key: topic.id || `topic-${index + 1}`,
          label: topic.title || `Topic ${index + 1}`,
          color: palette[index % palette.length],
          count,
        };
      })
      .filter((item) => item.count > 0);
    const topicTotal = topicItems.reduce((sum, item) => sum + item.count, 0);
    const topicItemsWithPercent = topicItems
      .sort((a, b) => b.count - a.count)
      .map((item) => ({ ...item, percent: topicTotal ? Math.round((item.count / topicTotal) * 100) : 0 }));

    return { total: topicTotal, items: topicItemsWithPercent, mode: "topics" };
  }, [topicTags, topics]);

  return (
    <section className="panel-elevated mb-4 rounded-xl p-3 sm:p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Topic Distribution</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">
            {distribution.mode === "tags" ? `Question-tag links: ${distribution.total}` : `Questions: ${distribution.total}`}
          </span>
          <button
            type="button"
            className="btn-base btn-ghost btn-sm rounded-full px-2 py-1 text-[11px]"
            onClick={() => setShowModeHelper((current) => !current)}
            aria-pressed={showModeHelper}
            title={showModeHelper ? "Hide distribution mode helper" : "Show distribution mode helper"}
          >
            {showModeHelper ? "Helper on" : "Helper off"}
          </button>
        </div>
      </div>

      {showModeHelper && distribution.total > 0 ? (
        <p className="mb-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
          {distribution.mode === "tags"
            ? "Distribution source: grouped by explicit question tags."
            : "Distribution source: auto-grouped by topic title because this sheet has no question-tag links yet."}
        </p>
      ) : null}

      <div className="flex justify-center">
        <DonutChart items={distribution.items} total={distribution.total} />
      </div>
    </section>
  );
}

export default TopicDistributionChart;
