// Shared limits/config for the sheet store modules.
const UNBOUNDED_LIMIT = 2_147_483_647;
export const GENEROUS_FREE_LIMIT = 10_000;

export const FREE_LIMITS = {
  topics: GENEROUS_FREE_LIMIT,
  subTopics: GENEROUS_FREE_LIMIT,
  questions: GENEROUS_FREE_LIMIT,
  sheets: GENEROUS_FREE_LIMIT,
};

export const PREMIUM_LIMITS = {
  topics: UNBOUNDED_LIMIT,
  subTopics: UNBOUNDED_LIMIT,
  questions: UNBOUNDED_LIMIT,
  sheets: UNBOUNDED_LIMIT,
};

export const MAX_WORDS_PER_ENTRY = 50;

export const HISTORY_LIMIT = UNBOUNDED_LIMIT;
export const MAX_SHEETS = FREE_LIMITS.sheets;

// These curated sources are intentionally exempt from workspace content copy limits.
// IMPORTANT: We only trust source IDs, not titles, to avoid name-based loopholes.
export const FREE_COPY_EXEMPT_SOURCE_SHEET_IDS = new Set([
  "famous-striver-a2z-sheet",
  "famous-neetcode-150",
  "famous-blind-75",
]);
