export const getQuestionAttemptLogs = (question) => {
  if (Array.isArray(question?.attemptLogs) && question.attemptLogs.length > 0) return question.attemptLogs;
  if (question?.attemptLog) return [question.attemptLog];
  return [];
};

export const ATTEMPT_RESULT_KEYS = ["solved", "partially_solved", "failed", "unresolved"];

export const createAttemptResultCounts = () => ({
  solved: 0,
  partially_solved: 0,
  failed: 0,
  unresolved: 0,
});

export const normalizeAttemptResult = (result) => {
  const normalized = `${result || ""}`.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized) return "unresolved";

  if (["solved", "complete", "completed", "correct"].includes(normalized)) {
    return "solved";
  }

  if ([
    "partially_solved",
    "partial",
    "partially",
    "tried",
    "attempted",
    "in_progress",
    "inprogress",
  ].includes(normalized)) {
    return "partially_solved";
  }

  if (["failed", "wrong", "incorrect", "error"].includes(normalized)) {
    return "failed";
  }

  return "unresolved";
};

export const getLatestAttempt = (question) => {
  const logs = getQuestionAttemptLogs(question);
  return logs.length > 0 ? logs[logs.length - 1] : null;
};

export const getLatestAttemptResult = (question) => {
  const latestAttempt = getLatestAttempt(question);
  return normalizeAttemptResult(latestAttempt?.result);
};

export const getQuestionFinalResult = (question) => {
  const logs = getQuestionAttemptLogs(question);
  if (!logs.length) return "unresolved";

  let hasFailed = false;
  let hasPartiallySolved = false;
  for (const attempt of logs) {
    const result = normalizeAttemptResult(attempt?.result);
    if (result === "solved") return "solved";
    if (result === "partially_solved") hasPartiallySolved = true;
    if (result === "failed") hasFailed = true;
  }

  if (hasPartiallySolved) return "partially_solved";
  if (hasFailed) return "failed";
  return "unresolved";
};

export const isQuestionCompleted = (question) => getQuestionFinalResult(question) === "solved";

export const getQuestionAttemptResultCounts = (question) =>
  getQuestionAttemptLogs(question).reduce((accumulator, attempt) => {
    const result = normalizeAttemptResult(attempt?.result);
    accumulator[result] += 1;
    return accumulator;
  }, createAttemptResultCounts());

export const getSubtopicProgress = (subtopic) => {
  const questions = Array.isArray(subtopic?.questions) ? subtopic.questions : [];

  const resultCounts = questions.reduce((accumulator, question) => {
    const result = getQuestionFinalResult(question);
    if (result in accumulator) {
      accumulator[result] += 1;
    } else {
      accumulator.unresolved += 1;
    }
    return accumulator;
  }, createAttemptResultCounts());

  const totalQuestions = questions.length;
  const completedQuestions = resultCounts.solved;

  return {
    totalQuestions,
    completedQuestions,
    percent: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0,
    resultCounts,
    isCompleted: totalQuestions > 0 && completedQuestions === totalQuestions,
  };
};

export const getTopicProgress = (topic) => {
  const subtopics = Array.isArray(topic?.subTopics) ? topic.subTopics : [];
  const subtopicProgress = subtopics.map(getSubtopicProgress);
  const totalSubtopics = subtopicProgress.length;
  const completedSubtopics = subtopicProgress.filter((entry) => entry.isCompleted).length;
  const inProgressSubtopics = subtopicProgress.filter((entry) => {
    if (entry.isCompleted || entry.totalQuestions === 0) return false;
    const startedQuestions = entry.resultCounts.solved + entry.resultCounts.partially_solved + entry.resultCounts.failed;
    return startedQuestions > 0;
  }).length;
  const resultCounts = subtopicProgress.reduce(
    (accumulator, entry) => ({
      solved: accumulator.solved + entry.resultCounts.solved,
      partially_solved: accumulator.partially_solved + entry.resultCounts.partially_solved,
      failed: accumulator.failed + entry.resultCounts.failed,
      unresolved: accumulator.unresolved + entry.resultCounts.unresolved,
    }),
    createAttemptResultCounts()
  );
  const totalQuestions = resultCounts.solved + resultCounts.partially_solved + resultCounts.failed + resultCounts.unresolved;
  const completedQuestions = resultCounts.solved;

  return {
    totalQuestions,
    completedQuestions,
    resultCounts,
    percent: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0,
    totalSubtopics,
    completedSubtopics,
    inProgressSubtopics,
    notStartedSubtopics: Math.max(totalSubtopics - completedSubtopics - inProgressSubtopics, 0),
  };
};
