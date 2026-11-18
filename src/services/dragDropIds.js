const DND_SEPARATOR = "::";

const encodeDndPart = (value) => encodeURIComponent(String(value ?? ""));
const decodeDndPart = (value) => decodeURIComponent(value);

export const createTopicDraggableId = (topicId) => `topic${DND_SEPARATOR}${encodeDndPart(topicId)}`;

export const createSubtopicDraggableId = (topicId, subtopicId) =>
  `subtopic${DND_SEPARATOR}${encodeDndPart(topicId)}${DND_SEPARATOR}${encodeDndPart(subtopicId)}`;

export const createQuestionDraggableId = (topicId, subtopicId, questionId) =>
  `question${DND_SEPARATOR}${encodeDndPart(topicId)}${DND_SEPARATOR}${encodeDndPart(subtopicId)}${DND_SEPARATOR}${encodeDndPart(questionId)}`;

export const createSubtopicDroppableId = (topicId) =>
  `subtopic${DND_SEPARATOR}${encodeDndPart(topicId)}`;

export const createQuestionDroppableId = (topicId, subtopicId) =>
  `question${DND_SEPARATOR}${encodeDndPart(topicId)}${DND_SEPARATOR}${encodeDndPart(subtopicId)}`;

export const parseSheetDroppableId = (droppableId) => {
  const parts = `${droppableId || ""}`.split(DND_SEPARATOR);
  const [type, topicKey, subtopicKey] = parts;

  try {
    if (type === "subtopic" && parts.length === 2) {
      return { type, topicKey: decodeDndPart(topicKey) };
    }

    if (type === "question" && parts.length === 3) {
      return {
        type,
        topicKey: decodeDndPart(topicKey),
        subtopicKey: decodeDndPart(subtopicKey),
      };
    }
  } catch {
    return null;
  }

  return null;
};

export const resolveTopicByDndKey = (topics = [], topicKey) =>
  topics.find((topic) => String(topic?.id) === String(topicKey)) || null;

export const resolveSubtopicByDndKey = (topic, subtopicKey) =>
  (topic?.subTopics || []).find((subtopic) => String(subtopic?.id) === String(subtopicKey)) || null;

export const resolveSubtopicDropLocation = (topics, droppableId) => {
  const parsed = parseSheetDroppableId(droppableId);
  if (parsed?.type !== "subtopic") return null;

  const topic = resolveTopicByDndKey(topics, parsed.topicKey);
  return topic ? { topic } : null;
};

export const resolveQuestionDropLocation = (topics, droppableId) => {
  const parsed = parseSheetDroppableId(droppableId);
  if (parsed?.type !== "question") return null;

  const topic = resolveTopicByDndKey(topics, parsed.topicKey);
  const subtopic = resolveSubtopicByDndKey(topic, parsed.subtopicKey);
  return topic && subtopic ? { topic, subtopic } : null;
};
