import { useMemo } from "react";
import { buildDistribution } from "../services/difficultyCategories";
import DonutChart from "./DonutChart";

function DifficultyDistributionWidget({ topics = [], categories = [], showCompleted = false }) {
  const distribution = useMemo(() => buildDistribution(topics, categories), [topics, categories]);
  const title = showCompleted ? "Difficulty Distribution (Visible Progress)" : "Difficulty Distribution";

  return (
    <section className="panel-elevated mb-4 rounded-xl p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        <span className="text-xs text-[var(--text-secondary)]">Questions: {distribution.total}</span>
      </div>
      <div className="flex justify-center">
        <DonutChart items={distribution.categories} total={distribution.total} />
      </div>
    </section>
  );
}

export default DifficultyDistributionWidget;
