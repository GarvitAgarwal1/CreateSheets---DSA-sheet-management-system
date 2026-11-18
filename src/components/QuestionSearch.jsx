function QuestionSearch({
  value,
  onChange,
  filterState = {},
  onFilterChange = () => {},
  sortBy = "topic_order",
  onSortChange = () => {},
  availableTags = [],
}) {
  const statusValue = filterState.status || "all";
  const revisionValue = filterState.revision || "all";
  const difficultyValue = filterState.difficulty || "all";
  const tagValue = filterState.tagId || "all";

  const updateFilter = (key, nextValue) => {
    onFilterChange({ ...filterState, [key]: nextValue });
  };

  return (
    <div className="space-y-3">
      <div className="question-search-wrapper">
        <span className="question-search-icon" aria-hidden="true">🔍</span>
        <input
          id="question-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search questions, topics, subtopics, tags..."
          className="question-search-input"
          aria-label="Search questions"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs text-[var(--text-secondary)]">
          <span className="mb-1 block">Status</span>
          <select
            className="field-base w-full"
            value={statusValue}
            onChange={(event) => updateFilter("status", event.target.value)}
          >
            <option value="all">All</option>
            <option value="solved">Solved</option>
            <option value="partially_solved">Partially solved</option>
            <option value="failed">Failed</option>
            <option value="unresolved">Unresolved</option>
          </select>
        </label>

        <label className="text-xs text-[var(--text-secondary)]">
          <span className="mb-1 block">Revision</span>
          <select
            className="field-base w-full"
            value={revisionValue}
            onChange={(event) => updateFilter("revision", event.target.value)}
          >
            <option value="all">All</option>
            <option value="revised">Revised</option>
            <option value="not_revised">Not revised</option>
          </select>
        </label>

        <label className="text-xs text-[var(--text-secondary)]">
          <span className="mb-1 block">Difficulty</span>
          <select
            className="field-base w-full"
            value={difficultyValue}
            onChange={(event) => updateFilter("difficulty", event.target.value)}
          >
            <option value="all">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <label className="text-xs text-[var(--text-secondary)]">
          <span className="mb-1 block">Tag</span>
          <select
            className="field-base w-full"
            value={tagValue}
            onChange={(event) => updateFilter("tagId", event.target.value)}
          >
            <option value="all">All tags</option>
            {availableTags.map((tag) => (
              <option key={tag.id} value={String(tag.id)}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-[var(--text-secondary)]">
          <span className="mb-1 block">Sort</span>
          <select
            className="field-base w-full"
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
          >
            <option value="topic_order">Default order</option>
            <option value="name_asc">Question A-Z</option>
            <option value="name_desc">Question Z-A</option>
            <option value="attempts_desc">Most attempts</option>
            <option value="attempts_asc">Least attempts</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export default QuestionSearch;
