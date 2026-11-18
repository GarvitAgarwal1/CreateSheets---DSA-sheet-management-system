// Generic helpers reused across slices to keep behavior consistent.
export const cloneDeep = (value) => JSON.parse(JSON.stringify(value));

export const buildSheetSignature = (title, topics, topicTags = [], userCustomTopics = [], logoUrl = "", sheetUrl = "") =>
  JSON.stringify({ title, topics, topicTags, userCustomTopics, logoUrl, sheetUrl });

export const reorderArray = (items, startIndex, endIndex) => {
  const nextItems = Array.from(items);
  const [removed] = nextItems.splice(startIndex, 1);
  nextItems.splice(endIndex, 0, removed);
  return nextItems;
};

export const countSubTopics = (topics) =>
  topics.reduce((count, topic) => count + (topic.subTopics?.length || 0), 0);

export const countQuestions = (topics) =>
  topics.reduce(
    (count, topic) =>
      count +
      (topic.subTopics || []).reduce(
        (subCount, subTopic) => subCount + (subTopic.questions?.length || 0),
        0
      ),
    0
  );

export const updateSheetInCollection = (sheets, sheetId, updates) => {
  const safeSheets = Array.isArray(sheets) ? sheets : [];
  let matched = false;
  const nextSheets = safeSheets.map((sheet) => {
    if (sheet.id !== sheetId) return sheet;
    matched = true;
    return { ...sheet, ...updates };
  });

  if (matched) return nextSheets;
  return [...nextSheets, { id: sheetId, ...updates }];
};

export const normalizeSheetVisibility = (sheet) => {
  if (!sheet || typeof sheet !== "object") return sheet;

  const normalized = { ...sheet };
  if ((!normalized.title || `${normalized.title}`.trim() === "") && typeof normalized.name === "string") {
    normalized.title = normalized.name;
  }
  const visibility = typeof normalized.visibility === "string" ? normalized.visibility.trim().toLowerCase() : "";
  const visibilityIsShareable = visibility === "public" || visibility === "unlisted";

  if (typeof normalized.isPublic !== "boolean") {
    if (typeof normalized.public === "boolean") {
      normalized.isPublic = normalized.public;
    } else if (visibility) {
      normalized.isPublic = visibilityIsShareable;
    }
  }
  if (typeof normalized.isArchived !== "boolean" && typeof normalized.archived === "boolean") {
    normalized.isArchived = normalized.archived;
  }
  if (typeof normalized.shareProgress !== "boolean") {
    normalized.shareProgress = false;
  }
  if (typeof normalized.logoUrl !== "string") {
    normalized.logoUrl = "";
  }
  if (typeof normalized.sheetUrl !== "string") {
    normalized.sheetUrl = "";
  }

  return normalized;
};

export const computeDirtyState = (state, signatureBySheet) =>
  buildSheetSignature(state.sheetTitle, state.topics, state.topicTags, state.userCustomTopics, state.logoUrl || "", state.sheetUrl || "") !== signatureBySheet.get(state.activeSheetId);

export const applyTopicsWithHistoryAndDirty = (state, nextTopics, withHistory, signatureBySheet) => {
  const nextState = withHistory(state, nextTopics);
  return { ...nextState, hasPendingChanges: computeDirtyState({ ...state, topics: nextState.topics }, signatureBySheet) };
};
