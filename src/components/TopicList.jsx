import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Check, GripVertical } from "lucide-react";
import AttemptLogModal from "./AttemptLogModal";
import DifficultyBadge from "./DifficultyBadge";
import TopicChipsPreview from "./TopicChipsPreview";
import QuestionDetailsDrawer from "./QuestionDetailsDrawer";
import {
  createQuestionDraggableId,
  createQuestionDroppableId,
  createSubtopicDraggableId,
  createSubtopicDroppableId,
  createTopicDraggableId,
  resolveQuestionDropLocation,
  resolveSubtopicDropLocation,
} from "../services/dragDropIds";
import {
  ATTEMPT_RESULT_KEYS,
  getQuestionAttemptResultCounts,
  getQuestionFinalResult,
  normalizeAttemptResult,
  getQuestionAttemptLogs,
  getSubtopicProgress,
  getTopicProgress,
  isQuestionCompleted,
} from "../services/questionProgress";

const normalizeText = (value) =>
  `${value || ""}`.trim().toLowerCase().replace(/\s+/g, " ");

const isNestedInteractiveTarget = (event) => {
  if (event.target === event.currentTarget) return false;
  return Boolean(event.target?.closest?.("button,a,input,select,textarea,[data-no-accordion-toggle='true']"));
};

const handleAccordionKeyDown = (event, onToggle) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  if (isNestedInteractiveTarget(event)) return;
  event.preventDefault();
  onToggle();
};

const ATTEMPT_RESULT_META = {
  failed: {
    tickClasses: "border-[var(--color-failed)] bg-[var(--color-failed-bg)] text-[var(--color-failed)]",
    label: "Failed",
    color: "var(--color-failed)",
  },
  partially_solved: {
    tickClasses: "border-[var(--color-attempted)] bg-[var(--color-attempted-bg)] text-[var(--color-attempted)]",
    label: "Partially Solved",
    color: "var(--color-attempted)",
  },
  solved: {
    tickClasses: "border-[var(--color-solved)] bg-[var(--color-solved)] text-white",
    label: "Solved",
    color: "var(--color-solved)",
  },
  unresolved: {
    tickClasses: "border-[var(--border-strong)] bg-transparent text-transparent",
    label: "Unsolved",
    color: "var(--color-unsolved)",
  },
};

const QUICK_ATTEMPT_ACTIONS = [
  { key: "solved", label: "Solved", className: "border-[var(--color-solved)] text-[var(--color-solved)]" },
  { key: "partially_solved", label: "Partial", className: "border-[var(--color-attempted)] text-[var(--color-attempted)]" },
  { key: "failed", label: "Failed", className: "border-[var(--color-failed)] text-[var(--color-failed)]" },
];

const MAX_VISIBLE_QUESTION_RESOURCES = 3;

const RESOURCE_TYPE_META = {
  Problem: { label: "Solve", icon: "↗" },
  Solution: { label: "Solve", icon: "↗" },
  Video: { label: "Video", icon: "▶" },
  Article: { label: "Article", icon: "▤" },
  Notes: { label: "Notes", icon: "▦" },
  GitHub: { label: "GitHub", icon: "GH" },
  Discussion: { label: "Discuss", icon: "…" },
  Other: { label: "Link", icon: "＋" },
};

const detectPlatformFromLink = (link = "") => {
  const normalized = `${link}`.toLowerCase();
  if (normalized.includes("leetcode")) return "LeetCode";
  if (normalized.includes("codeforces")) return "Codeforces";
  if (normalized.includes("hackerrank")) return "HackerRank";
  if (normalized.includes("geeksforgeeks")) return "GeeksforGeeks";
  return "Other";
};

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(`${value || ""}`.trim());
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

const normalizeQuestionResourceLinks = (question = {}) => {
  const resourceLinks = Array.isArray(question.resourceLinks) ? question.resourceLinks : [];
  const legacyLinks = [
    question.link ? { id: "legacy-problem", title: "Problem Link", url: question.link, type: "Problem" } : null,
    question.videoLink ? { id: "legacy-video", title: "Video", url: question.videoLink, type: "Video" } : null,
    question.articleLink ? { id: "legacy-article", title: "Article", url: question.articleLink, type: "Article" } : null,
  ].filter(Boolean);

  const seen = new Set();
  return [...legacyLinks, ...resourceLinks]
    .filter((item) => item?.url && isValidHttpUrl(item.url))
    .filter((item) => {
      const key = item.url.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const buildQuestionResourceActions = (question = {}) => {
  const resources = normalizeQuestionResourceLinks(question);
  const problemResource = resources.find((item) => ["Problem", "Solution"].includes(item.type));
  const actions = [];

  actions.push({
    key: "solve",
    label: "Solve",
    icon: RESOURCE_TYPE_META.Problem.icon,
    url: problemResource?.url || "",
    primary: true,
    disabled: !problemResource?.url,
  });

  resources
    .filter((item) => item.url !== problemResource?.url)
    .slice(0, MAX_VISIBLE_QUESTION_RESOURCES - 1)
    .forEach((item, index) => {
      const meta = RESOURCE_TYPE_META[item.type] || RESOURCE_TYPE_META.Other;
      actions.push({
        key: `${item.type || "resource"}-${item.id || index}`,
        label: item.title?.trim() || meta.label,
        icon: meta.icon,
        url: item.url,
        primary: false,
        disabled: false,
      });
    });

  return actions.slice(0, MAX_VISIBLE_QUESTION_RESOURCES);
};

const openResourceUrl = (url) => {
  if (!isValidHttpUrl(url)) return;
  window.open(url, "_blank", "noopener,noreferrer");
};

const buildQuickAttemptLog = ({ question, topicName, subTopicName, result }) => ({
  problemName: question.text,
  platform: detectPlatformFromLink(question.link),
  result,
  timeSpent: "10 minutes",
  mistakes: [],
  notes: "",
  confidence: result === "solved" ? "High" : result === "partially_solved" ? "Medium" : "Low",
  revision: result === "solved" ? "In 1 Week" : "Tomorrow",
  revisionTiming: result === "solved" ? "In 1 Week" : "Tomorrow",
  revisionDate: (() => {
    const date = new Date();
    date.setDate(date.getDate() + (result === "solved" ? 7 : 1));
    return date.toISOString();
  })(),
  topic: topicName || "General",
  subTopicName: subTopicName || "",
  difficulty: question.difficultyLabel || question.difficultyKey || "Unspecified",
  hintUsed: false,
  editorialUsed: false,
  attemptNumber: (getQuestionAttemptLogs(question).length || 0) + 1,
  solvedWithHelp: result === "solved" ? "independent" : "with_help",
  submissions: 1,
  loggedAt: new Date().toISOString(),
});

function TopicList({
  isEditing = true,
  searchQuery = "",
  filters = {},
  sortBy = "topic_order",
  onlyExactMatch = false,
  allowProgressToggle = true,
  allowReorder = true,
  focusProblemId = null,
  showAttemptInsights = true,
  onRequireCopy,
  difficultyCategories = [],
  topicTags = [],
  onCreateCustomDifficulty,
}) {
  const topics = useSheetStore((state) => state.topics);
  const addSubTopic = useSheetStore((state) => state.addSubTopic);
  const addQuestion = useSheetStore((state) => state.addQuestion);
  const editTopic = useSheetStore((state) => state.editTopic);
  const deleteTopic = useSheetStore((state) => state.deleteTopic);
  const editSubTopic = useSheetStore((state) => state.editSubTopic);
  const deleteSubTopic = useSheetStore((state) => state.deleteSubTopic);
  const editQuestion = useSheetStore((state) => state.editQuestion);
  const deleteQuestion = useSheetStore((state) => state.deleteQuestion);
  const updateQuestionResources = useSheetStore((state) => state.updateQuestionResources);
  const createCustomTopicTag = useSheetStore((state) => state.createCustomTopicTag);
  const moveSubTopic = useSheetStore((state) => state.moveSubTopic);
  const reorderTopics = useSheetStore((state) => state.reorderTopics);
  const moveQuestion = useSheetStore((state) => state.moveQuestion);
  const updateQuestionAttempt = useSheetStore((state) => state.updateQuestionAttempt);
  const toggleQuestionRevised = useSheetStore((state) => state.toggleQuestionRevised);
  const saveCurrentSheetDraft = useSheetStore((state) => state.saveCurrentSheetDraft);
  const authToken = useAuthStore((state) => state.currentUser?.token);

  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editingSubId, setEditingSubId] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [subInput, setSubInput] = useState({});
  const [questionInput, setQuestionInput] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const [expandedSubtopics, setExpandedSubtopics] = useState({});
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [attemptHistoryQuestionId, setAttemptHistoryQuestionId] = useState(null);
  const [activeQuestionDrawer, setActiveQuestionDrawer] = useState(null);
  const attemptSaveQueueRef = useRef(Promise.resolve());
  const normalizedQuery = normalizeText(searchQuery);
  const normalizedDifficultyFilter = normalizeText(filters?.difficulty || "all");
  const normalizedStatusFilter = normalizeText(filters?.status || "all");
  const normalizedRevisionFilter = normalizeText(filters?.revision || "all");
  const normalizedTagFilter = `${filters?.tagId || "all"}`;
  const shouldExpandAll = Boolean(normalizedQuery);
  const canReorderItems = Boolean(isEditing && allowReorder);
  const visibleTopics = useMemo(() => (
    normalizedQuery
      ? topics
          .map((topic) => {
            const filteredSubTopics = topic.subTopics
              .map((sub) => {
                const filteredQuestions = sub.questions.filter((question) => {
                  const normalizedQuestion = normalizeText(question.text);
                  return onlyExactMatch
                    ? normalizedQuestion === normalizedQuery
                    : normalizedQuestion.includes(normalizedQuery);
                });

                return {
                  ...sub,
                  questions: filteredQuestions,
                };
              })
              .filter((sub) => sub.questions.length > 0);

            return {
              ...topic,
              subTopics: filteredSubTopics,
            };
          })
          .filter((topic) => topic.subTopics.length > 0)
      : topics
  ), [normalizedQuery, onlyExactMatch, topics]);

  const filterAndSortQuestions = useCallback((questions = []) => {
    const filtered = questions.filter((question) => {
      if (normalizedStatusFilter !== "all") {
        const finalResult = getQuestionFinalResult(question);
        if (finalResult !== normalizedStatusFilter) return false;
      }

      if (normalizedRevisionFilter === "revised" && !question.revised) return false;
      if (normalizedRevisionFilter === "not_revised" && question.revised) return false;

      if (normalizedDifficultyFilter !== "all") {
        const questionDifficulty = normalizeText(question.difficultyKey || question.difficultyLabel || "");
        if (questionDifficulty !== normalizedDifficultyFilter) return false;
      }

      if (normalizedTagFilter !== "all") {
        const tagIds = Array.isArray(question.topicTagIds) ? question.topicTagIds.map(String) : [];
        if (!tagIds.includes(normalizedTagFilter)) return false;
      }

      return true;
    });

    if (sortBy === "name_asc") {
      return [...filtered].sort((a, b) => `${a.text || ""}`.localeCompare(`${b.text || ""}`));
    }
    if (sortBy === "name_desc") {
      return [...filtered].sort((a, b) => `${b.text || ""}`.localeCompare(`${a.text || ""}`));
    }
    if (sortBy === "attempts_desc") {
      return [...filtered].sort((a, b) => getQuestionAttemptLogs(b).length - getQuestionAttemptLogs(a).length);
    }
    if (sortBy === "attempts_asc") {
      return [...filtered].sort((a, b) => getQuestionAttemptLogs(a).length - getQuestionAttemptLogs(b).length);
    }

    return filtered;
  }, [normalizedDifficultyFilter, normalizedRevisionFilter, normalizedStatusFilter, normalizedTagFilter, sortBy]);

  const filteredTopicTree = useMemo(() => (
    visibleTopics
      .map((topic) => {
        const subTopics = (topic.subTopics || [])
          .map((subTopic) => ({
            ...subTopic,
            questions: filterAndSortQuestions(subTopic.questions || []),
          }))
          .filter((subTopic) => subTopic.questions.length > 0 || isEditing);
        return { ...topic, subTopics };
      })
      .filter((topic) => topic.subTopics.length > 0 || isEditing)
  ), [filterAndSortQuestions, isEditing, visibleTopics]);

  const toggleTopic = (id) =>
    setExpandedTopics((current) => ({ ...current, [id]: !current[id] }));
  const toggleSubtopic = (id) =>
    setExpandedSubtopics((current) => ({ ...current, [id]: !current[id] }));

  const handleDragEnd = (result) => {
    if (!canReorderItems) return;
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "topic") {
      if (source.index === destination.index) return;
      reorderTopics(source.index, destination.index);
      return;
    }

    if (type === "subtopic") {
      const fromLocation = resolveSubtopicDropLocation(topics, source.droppableId);
      const toLocation = resolveSubtopicDropLocation(topics, destination.droppableId);
      if (!fromLocation || !toLocation) return;
      if (fromLocation.topic.id === toLocation.topic.id && source.index === destination.index) return;
      moveSubTopic(fromLocation.topic.id, toLocation.topic.id, source.index, destination.index);
      return;
    }

    if (type === "question") {
      const fromLocation = resolveQuestionDropLocation(topics, source.droppableId);
      const toLocation = resolveQuestionDropLocation(topics, destination.droppableId);
      if (!fromLocation || !toLocation) return;
      if (
        fromLocation.topic.id === toLocation.topic.id &&
        fromLocation.subtopic.id === toLocation.subtopic.id &&
        source.index === destination.index
      ) return;
      moveQuestion(
        fromLocation.topic.id,
        fromLocation.subtopic.id,
        toLocation.topic.id,
        toLocation.subtopic.id,
        source.index,
        destination.index
      );
    }
  };

  const saveTopic = (topicId) => {
    editTopic(topicId, editValue);
    setEditingTopicId(null);
    setEditValue("");
  };

  const saveSubtopic = (topicId, subId) => {
    editSubTopic(topicId, subId, editValue);
    setEditingSubId(null);
    setEditValue("");
  };

  const saveQuestion = (topicId, subId, qId) => {
    editQuestion(topicId, subId, qId, editValue);
    setEditingQuestionId(null);
    setEditValue("");
  };

  const handleToggleProgress = (topicId, subId, question, topicTitle, subTopicTitle) => {
    if (!allowProgressToggle) {
      onRequireCopy?.();
      return;
    }
    setActiveAttempt({ topicId, subId, questionId: question.id, questionText: question.text, questionLink: question.link, topicName: topicTitle, subTopicName: subTopicTitle });
  };

  const queueAttemptAutosave = useCallback(() => {
    if (!authToken) return;
    attemptSaveQueueRef.current = attemptSaveQueueRef.current
      .catch(() => {})
      .then(() => saveCurrentSheetDraft(authToken));
  }, [authToken, saveCurrentSheetDraft]);

  const handleQuickAttempt = ({ topicId, subId, question, topicTitle, subTopicTitle, result }) => {
    if (!allowProgressToggle) {
      onRequireCopy?.();
      return;
    }
    const quickLog = buildQuickAttemptLog({ question, topicName: topicTitle, subTopicName: subTopicTitle, result });
    updateQuestionAttempt(topicId, subId, question.id, quickLog);
    queueAttemptAutosave();
  };

  const startResourceEdit = (question, topicId, subId) => {
    openQuestionDrawer(question, topicId, subId);
  };




  const openQuestionDrawer = (question, topicId, subId) => {
    setActiveQuestionDrawer({ question, topicId, subId });
  };

  const handleAddQuestion = (topicId, subId, questionText) => {
    if (!questionText) return;
    addQuestion(topicId, subId, questionText).then((updatedSheet) => {
      if (!updatedSheet) return;
      setQuestionInput((current) => ({ ...current, [subId]: "" }));
      const createdQuestion = updatedSheet.topics
        .find((topic) => topic.id === topicId)?.subTopics
        .find((subTopic) => subTopic.id === subId)?.questions?.at(-1);
      if (createdQuestion) {
        openQuestionDrawer(createdQuestion, topicId, subId);
      }
    });
  };

  useEffect(() => {
    if (!focusProblemId) return;
    const target = document.querySelector(`[data-problem-id="${focusProblemId}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("ring-2", "ring-[var(--accent-primary)]");
    const timer = window.setTimeout(() => target.classList.remove("ring-2", "ring-[var(--accent-primary)]"), 1800);
    return () => window.clearTimeout(timer);
  }, [focusProblemId, topics]);

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="topics" type="topic">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-3"
            >
            {filteredTopicTree.map((topic, tIndex) => (
              (() => {
                const topicProgress = getTopicProgress(topic);
                const topicIsExpanded = Boolean(expandedTopics[topic.id] || shouldExpandAll);
                const topicSegments = [
                  { key: "solved", count: topicProgress.resultCounts.solved, color: ATTEMPT_RESULT_META.solved.color, label: ATTEMPT_RESULT_META.solved.label },
                  { key: "partially_solved", count: topicProgress.resultCounts.partially_solved, color: ATTEMPT_RESULT_META.partially_solved.color, label: ATTEMPT_RESULT_META.partially_solved.label },
                  { key: "failed", count: topicProgress.resultCounts.failed, color: ATTEMPT_RESULT_META.failed.color, label: ATTEMPT_RESULT_META.failed.label },
                  { key: "unresolved", count: topicProgress.resultCounts.unresolved, color: ATTEMPT_RESULT_META.unresolved.color, label: ATTEMPT_RESULT_META.unresolved.label },
                ].filter((segment) => segment.count > 0);
                return (
              <Draggable
                key={topic.id}
                draggableId={createTopicDraggableId(topic.id)}
                index={tIndex}
                isDragDisabled={!canReorderItems}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`topic-card ${topicIsExpanded ? "is-expanded" : ""} ${canReorderItems ? "is-draggable" : ""}`}
                  >
                    {/* Topic */}
                    <div
                      className={`topic-header ${topicIsExpanded ? "is-expanded" : ""}`}
                      role="button"
                      tabIndex={0}
                      aria-expanded={topicIsExpanded}
                      onClick={(event) => {
                        if (isNestedInteractiveTarget(event)) return;
                        toggleTopic(topic.id);
                      }}
                      onKeyDown={(event) => handleAccordionKeyDown(event, () => toggleTopic(topic.id))}
                    >
                      <div className="topic-title-group">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleTopic(topic.id);
                          }}
                          className="expand-toggle"
                          aria-label={topicIsExpanded ? "Collapse topic" : "Expand topic"}
                        >
                          <span className={`expand-icon ${topicIsExpanded ? "is-expanded" : ""}`}>›</span>
                        </button>

                        {editingTopicId === topic.id && isEditing ? (
                          <div className="flex gap-2 flex-1">
                            <input
                              className="field-base flex-1 rounded-md px-2 py-1 text-sm"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveTopic(topic.id);
                              }}
                            />
                            <button
                              className="btn-base btn-success px-2 py-1 text-xs"
                              onClick={() => saveTopic(topic.id)}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="min-w-0">
                            <h2 className="topic-title">{topic.title}</h2>
                            <p className="topic-meta">
                              {topicProgress.completedQuestions} / {topicProgress.totalQuestions} questions solved
                            </p>
                          </div>
                        )}
                      </div>

                      {isEditing && (
                        <div className="action-bar">
                          <button
                            type="button"
                            className="btn-base btn-ghost btn-sm"
                            onClick={() => {
                              setEditingTopicId(topic.id);
                              setEditValue(topic.title);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-base btn-ghost btn-sm text-[var(--accent-danger)]"
                            onClick={() => deleteTopic(topic.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mb-2">
                      <div className="progress-bar-wrapper">
                        {topicProgress.totalQuestions === 0 ? (
                          <span className="progress-bar-segment w-full bg-[var(--surface-subtle)]" />
                        ) : (
                          topicSegments.map((segment) => (
                            <span
                              key={segment.key}
                              className="progress-bar-segment"
                              style={{ width: `${(segment.count / topicProgress.totalQuestions) * 100}%`, background: segment.color }}
                              title={`${segment.label}: ${segment.count}/${topicProgress.totalQuestions}`}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    {topicIsExpanded && (
                      <>
                        {isEditing && (
                          <div className="mb-2 mt-2 flex flex-wrap gap-2">
                            <input
                              placeholder="Add Subtopic"
                              className="field-base flex-1 rounded-md px-2 py-1 text-sm"
                              value={subInput[topic.id] || ""}
                              onChange={(e) =>
                                setSubInput({ ...subInput, [topic.id]: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && subInput[topic.id]) {
                                  addSubTopic(topic.id, subInput[topic.id]).then((created) => {
                                    if (!created) return;
                                    setSubInput((current) => ({ ...current, [topic.id]: "" }));
                                  });
                                }
                              }}
                            />

                            <button
                              className="btn-base btn-primary rounded-md px-2.5 py-2 text-xs font-medium"
                              onClick={() => {
                                if (!subInput[topic.id]) return;
                                addSubTopic(topic.id, subInput[topic.id]).then((created) => {
                                  if (!created) return;
                                  setSubInput((current) => ({ ...current, [topic.id]: "" }));
                                });
                              }}
                            >
                              Add Subtopic
                            </button>
                          </div>
                        )}

                        <Droppable droppableId={createSubtopicDroppableId(topic.id)} type="subtopic">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="space-y-2 pl-2 sm:pl-4"
                            >
                              {topic.subTopics.map((sub, sIndex) => (
                                (() => {
                                  const subtopicProgress = getSubtopicProgress(sub);
                                  const subtopicIsExpanded = Boolean(expandedSubtopics[sub.id] || shouldExpandAll);
                                  const subtopicSegments = [
                                    { key: "solved", count: subtopicProgress.resultCounts.solved, color: ATTEMPT_RESULT_META.solved.color, label: ATTEMPT_RESULT_META.solved.label },
                                    { key: "partially_solved", count: subtopicProgress.resultCounts.partially_solved, color: ATTEMPT_RESULT_META.partially_solved.color, label: ATTEMPT_RESULT_META.partially_solved.label },
                                    { key: "failed", count: subtopicProgress.resultCounts.failed, color: ATTEMPT_RESULT_META.failed.color, label: ATTEMPT_RESULT_META.failed.label },
                                    { key: "unresolved", count: subtopicProgress.resultCounts.unresolved, color: ATTEMPT_RESULT_META.unresolved.color, label: ATTEMPT_RESULT_META.unresolved.label },
                                  ].filter((segment) => segment.count > 0);
                                  return (
                                <Draggable
                                  key={sub.id}
                                  draggableId={createSubtopicDraggableId(topic.id, sub.id)}
                                  index={sIndex}
                                  isDragDisabled={!canReorderItems}
                                >
                                  {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`subtopic-card ${subtopicIsExpanded ? "is-expanded" : ""} ${canReorderItems ? "is-draggable" : ""}`}
                                      >
                                        <div
                                          className={`subtopic-header ${subtopicIsExpanded ? "is-expanded" : ""}`}
                                          role="button"
                                          tabIndex={0}
                                          aria-expanded={subtopicIsExpanded}
                                          onClick={(event) => {
                                            if (isNestedInteractiveTarget(event)) return;
                                            toggleSubtopic(sub.id);
                                          }}
                                          onKeyDown={(event) => handleAccordionKeyDown(event, () => toggleSubtopic(sub.id))}
                                        >
                                          <div className="topic-title-group">
                                            <button
                                              type="button"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                toggleSubtopic(sub.id);
                                              }}
                                              className="expand-toggle"
                                              aria-label={subtopicIsExpanded ? "Collapse subtopic" : "Expand subtopic"}
                                            >
                                              <span className={`expand-icon ${subtopicIsExpanded ? "is-expanded" : ""}`}>›</span>
                                            </button>

                                          {editingSubId === sub.id && isEditing ? (
                                            <div className="flex gap-2 flex-1">
                                              <input
                                                className="field-base flex-1 rounded-md px-2 py-1 text-sm"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") saveSubtopic(topic.id, sub.id);
                                                }}
                                              />
                                              <button
                                                className="btn-base btn-success px-2 py-1 text-xs"
                                                onClick={() => saveSubtopic(topic.id, sub.id)}
                                              >
                                                Save
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="min-w-0">
                                              <h3 className="subtopic-title">{sub.title}</h3>
                                              <p className="topic-meta">
                                                {subtopicProgress.completedQuestions} / {subtopicProgress.totalQuestions} questions completed
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        {isEditing && (
                                          <div className="action-bar">
                                            <button
                                              type="button"
                                              className="btn-base btn-ghost btn-sm"
                                              onClick={() => {
                                                setEditingSubId(sub.id);
                                                setEditValue(sub.title);
                                              }}
                                            >
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              className="btn-base btn-ghost btn-sm text-[var(--accent-danger)]"
                                              onClick={() => deleteSubTopic(topic.id, sub.id)}
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      <div className="px-2 pb-2">
                                        <div className="progress-bar-wrapper">
                                          {subtopicProgress.totalQuestions === 0 ? (
                                            <span className="progress-bar-segment w-full bg-[var(--surface-subtle)]" />
                                          ) : (
                                            subtopicSegments.map((segment) => (
                                              <span
                                                key={segment.key}
                                                className="progress-bar-segment"
                                                style={{ width: `${(segment.count / subtopicProgress.totalQuestions) * 100}%`, background: segment.color }}
                                                title={`${segment.label}: ${segment.count}/${subtopicProgress.totalQuestions}`}
                                              />
                                            ))
                                          )}
                                        </div>
                                      </div>

                                      {subtopicIsExpanded && (
                                        <>
                                          {isEditing && (
                                            <div className="mb-1 mt-1 flex flex-wrap gap-2">
                                              <input
                                                placeholder="Add Question"
                                                className="field-base flex-1 rounded-md px-2 py-1 text-sm"
                                                value={questionInput[sub.id] || ""}
                                                onChange={(e) =>
                                                  setQuestionInput({
                                                    ...questionInput,
                                                    [sub.id]: e.target.value,
                                                  })
                                                }
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter" && questionInput[sub.id]) {
                                                    handleAddQuestion(topic.id, sub.id, questionInput[sub.id]);
                                                  }
                                                }}
                                              />
                                              <button
                                                className="btn-base btn-success rounded-md px-2 py-2 text-xs"
                                                onClick={() => {
                                                  if (!questionInput[sub.id]) return;
                                                  handleAddQuestion(topic.id, sub.id, questionInput[sub.id]);
                                                }}
                                              >
                                                Add Question
                                              </button>
                                            </div>
                                          )}

                                          <Droppable droppableId={createQuestionDroppableId(topic.id, sub.id)} type="question">
                                            {(provided) => (
                                              <ul
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="question-list"
                                              >
                                                {sub.questions.map((q, qIndex) => (
                                                  
                                                  <Draggable
                                                    key={q.id}
                                                    draggableId={createQuestionDraggableId(topic.id, sub.id, q.id)}
                                                    index={qIndex}
                                                    isDragDisabled={!canReorderItems}
                                                  >
                                                    {(provided) => (
                                                      (() => {
                                                        const attemptLogs = getQuestionAttemptLogs(q);
                                                        const totalAttempts = attemptLogs.length;
                                                        const finalResult = getQuestionFinalResult(q);
                                                        const tickMeta = ATTEMPT_RESULT_META[finalResult] || ATTEMPT_RESULT_META.unresolved;
                                                        const shouldShowProgressTick = showAttemptInsights ? finalResult !== "unresolved" : finalResult === "solved";
                                                        const questionCompleted = isQuestionCompleted(q);
                                                        const isQuestionRevised = Boolean(q.revised);
                                                        const resultCounts = getQuestionAttemptResultCounts(q);
                                                        const barSegments = ATTEMPT_RESULT_KEYS.map((key) => ({
                                                          key,
                                                          count: resultCounts[key],
                                                          color: ATTEMPT_RESULT_META[key].color,
                                                          label: ATTEMPT_RESULT_META[key].label,
                                                        })).filter((segment) => segment.count > 0);
                                                        const attachedTopicTags = topicTags.filter((tag) => (q.topicTagIds || []).includes(tag.id));
                                                        const resourceActions = buildQuestionResourceActions(q);
                                                        return (
                                                          <li
                                                            data-problem-id={String(q.id)}
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className={`question-card ${canReorderItems ? "is-draggable" : ""}`}
                                                          >
                                                        {editingQuestionId === q.id && isEditing ? (
                                                          <div className="flex gap-2 flex-1">
                                                            <input
                                                              className="field-base flex-1 rounded-md px-2 py-1 text-sm"
                                                              value={editValue}
                                                              onChange={(e) => setEditValue(e.target.value)}
                                                              onKeyDown={(e) => {
                                                                if (e.key === "Enter") saveQuestion(topic.id, sub.id, q.id);
                                                              }}
                                                            />
                                                            <button
                                                              className="btn-base btn-success px-2 py-1 text-xs"
                                                              onClick={() => saveQuestion(topic.id, sub.id, q.id)}
                                                            >
                                                              Save
                                                            </button>
                                                          </div>
                                                        ) : (
                                                          <div className="w-full">
                                                            <div className="question-main">
                                                              <div className="question-content">
                                                                {canReorderItems ? (
                                                                  <button
                                                                    type="button"
                                                                    className="question-drag-handle"
                                                                    aria-label={`Drag ${q.text || "question"}`}
                                                                    title="Drag to reorder"
                                                                    {...provided.dragHandleProps}
                                                                    onClick={(event) => event.stopPropagation()}
                                                                  >
                                                                    <GripVertical aria-hidden="true" className="h-4 w-4" />
                                                                  </button>
                                                                ) : null}
                                                                <button
                                                                  type="button"
                                                                  onClick={() => handleToggleProgress(topic.id, sub.id, q, topic.title, sub.title)}
                                                                  className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border text-xs font-bold transition ${showAttemptInsights
                                                                      ? tickMeta.tickClasses
                                                                      : (
                                                                        questionCompleted
                                                                          ? "border-[var(--color-solved)] bg-[var(--color-solved)] text-white"
                                                                          : "border-[var(--border-strong)] bg-transparent text-transparent"
                                                                      )
                                                                  } ${allowProgressToggle ? "question-done-toggle--open" : "cursor-not-allowed opacity-60"}`}
                                                                  aria-label={questionCompleted ? "Log another attempt" : "Log attempt"}
                                                                  title={showAttemptInsights ? tickMeta.label : (questionCompleted ? "Solved" : "Unsolved")}
                                                                >
                                                                  {shouldShowProgressTick ? <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                                                                </button>
                                                                <div className="question-copy">
                                                                  <div className="question-title-line">
                                                                    <span className="question-text">{q.text}</span>
                                                                    {attachedTopicTags.length > 0 ? (
                                                                      <TopicChipsPreview tags={attachedTopicTags} />
                                                                    ) : null}
                                                                  </div>
                                                                  <div className="question-meta-line">
                                                                    <DifficultyBadge question={q} difficultyCategories={difficultyCategories} />
                                                                    {totalAttempts > 0 ? <span>{totalAttempts} attempt{totalAttempts === 1 ? "" : "s"}</span> : null}
                                                                    {isQuestionRevised ? <span>Revised</span> : null}
                                                                  </div>
                                                                </div>
                                                              </div>
                                                              <div className="question-row-actions" data-no-accordion-toggle="true">
                                                                {resourceActions.map((action) => (
                                                                  <button
                                                                    key={action.key}
                                                                    type="button"
                                                                    className={`question-resource-action ${action.primary ? "is-primary" : ""}`}
                                                                    disabled={action.disabled}
                                                                    title={action.disabled ? "Add a Problem Link from Tags & resources" : action.label}
                                                                    onClick={() => openResourceUrl(action.url)}
                                                                  >
                                                                    <span className="question-resource-icon">{action.icon}</span>
                                                                    <span className="question-resource-label">{action.label}</span>
                                                                  </button>
                                                                ))}
                                                                <button
                                                                  type="button"
                                                                  className="question-resource-action question-resource-edit"
                                                                  onClick={() => startResourceEdit(q, topic.id, sub.id)}
                                                                  title="Edit tags and resources"
                                                                  aria-label="Edit tags and resources"
                                                                >
                                                                  <span className="question-resource-icon">✎</span>
                                                                  <span className="question-resource-label">Tags & resources</span>
                                                                </button>
                                                                {showAttemptInsights && isEditing ? (
                                                                  <button
                                                                    type="button"
                                                                    className={`question-resource-action question-star-action ${isQuestionRevised ? "is-active" : ""}`}
                                                                    title={isQuestionRevised ? "Marked as revised" : "Mark as revised"}
                                                                    aria-label={isQuestionRevised ? "Marked as revised" : "Mark as revised"}
                                                                    onClick={() => toggleQuestionRevised(topic.id, sub.id, q.id)}
                                                                  >
                                                                    <span className="question-resource-icon">{isQuestionRevised ? "★" : "☆"}</span>
                                                                    <span className="question-resource-label">Revision</span>
                                                                  </button>
                                                                ) : null}
                                                                {isEditing ? (
                                                                  <button
                                                                    type="button"
                                                                    className="question-resource-action is-danger"
                                                                    onClick={() => deleteQuestion(topic.id, sub.id, q.id)}
                                                                    title="Delete question"
                                                                    aria-label="Delete question"
                                                                  >
                                                                    <span className="question-resource-icon">×</span>
                                                                    <span className="question-resource-label">Delete</span>
                                                                  </button>
                                                                ) : null}
                                                              </div>
                                                            </div>

                                                            {showAttemptInsights && totalAttempts > 0 ? (
                                                              <div className="mt-2 pl-3 sm:pl-7">
                                                                <p className="text-[11px] text-[var(--text-tertiary)]">
                                                                  Attempts: {totalAttempts}
                                                                </p>
                                                                <div className="mt-1 progress-bar-wrapper question-attempt-progress">
                                                                  {barSegments.map((segment) => (
                                                                    <span
                                                                      key={segment.key}
                                                                      className="progress-bar-segment"
                                                                      style={{ width: `${(segment.count / totalAttempts) * 100}%`, background: segment.color }}
                                                                      title={`${segment.label}: ${segment.count}/${totalAttempts}`}
                                                                    />
                                                                  ))}
                                                                </div>
                                                                <div className="mt-2 flex flex-wrap gap-1">
                                                                  {QUICK_ATTEMPT_ACTIONS.map((action) => (
                                                                    <button
                                                                      key={action.key}
                                                                      type="button"
                                                                      onClick={() =>
                                                                        handleQuickAttempt({
                                                                          topicId: topic.id,
                                                                          subId: sub.id,
                                                                          question: q,
                                                                          topicTitle: topic.title,
                                                                          subTopicTitle: sub.title,
                                                                          result: action.key,
                                                                        })
                                                                      }
                                                                      className={`rounded-md border px-2 py-1 text-[10px] font-medium transition hover:bg-[var(--surface-elevated)] ${action.className}`}
                                                                      title={`Quick log as ${action.label}`}
                                                                    >
                                                                      + {action.label}
                                                                    </button>
                                                                  ))}
                                                                  <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                      setAttemptHistoryQuestionId((current) => (current === q.id ? null : q.id))
                                                                    }
                                                                    className="rounded-md border border-[var(--border-subtle)] px-2 py-1 text-[10px] text-[var(--text-secondary)] transition hover:bg-[var(--surface-elevated)]"
                                                                  >
                                                                    {attemptHistoryQuestionId === q.id ? "Hide history" : "View history"}
                                                                  </button>
                                                                </div>
                                                                {attemptHistoryQuestionId === q.id ? (
                                                                  <ul className="mt-2 space-y-1 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-2 text-[11px]">
                                                                    {[...attemptLogs].slice(-5).reverse().map((attempt, index) => {
                                                                      const normalizedResult = normalizeAttemptResult(attempt?.result);
                                                                      return (
                                                                        <li key={`${q.id}-attempt-${index}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-1 last:border-b-0 last:pb-0">
                                                                          <span className="text-[var(--text-primary)]">
                                                                            {ATTEMPT_RESULT_META[normalizedResult]?.label || "Attempt"}
                                                                          </span>
                                                                          <span className="text-[var(--text-tertiary)]">
                                                                            {attempt?.loggedAt ? new Date(attempt.loggedAt).toLocaleString() : "Unknown time"}
                                                                          </span>
                                                                        </li>
                                                                      );
                                                                    })}
                                                                  </ul>
                                                                ) : null}
                                                              </div>
                                                            ) : null}

                                                          </div>
                                                        )}
                                                      </li>
                                                        );
                                                      })()
                                                    )}
                                                  </Draggable>
                                                ))}
                                                {provided.placeholder}
                                              </ul>
                                            )}
                                          </Droppable>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                                  );
                                })()
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </>
                    )}
                  </div>
                )}
              </Draggable>
                );
              })()
            ))}
            {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {activeAttempt && (
        <AttemptLogModal
          questionText={activeAttempt.questionText}
          questionLink={activeAttempt.questionLink}
          topicName={activeAttempt.topicName}
          onClose={() => setActiveAttempt(null)}
          onSave={(attemptLog) => {
            updateQuestionAttempt(activeAttempt.topicId, activeAttempt.subId, activeAttempt.questionId, attemptLog);
            queueAttemptAutosave();
            setActiveAttempt(null);
          }}
        />
      )}
      <QuestionDetailsDrawer
        open={Boolean(activeQuestionDrawer)}
        question={activeQuestionDrawer?.question || null}
        questionContext={activeQuestionDrawer || null}
        onClose={() => setActiveQuestionDrawer(null)}
        readOnly={!isEditing}
        difficultyCategories={difficultyCategories}
        topicTags={topicTags}
        onCreateCustomDifficulty={onCreateCustomDifficulty}
        onCreateCustomTopicTag={createCustomTopicTag}
        onSave={async ({ topicId, subId, questionId, payload }) => {
          updateQuestionResources(topicId, subId, questionId, payload);
        }}
      />
    </>
  );
}

export default TopicList;
