import { getQuestionAttemptLogs } from "./questionProgress";

export const DEFAULT_ANALYTICS_FILTERS = {
  dateRange: "all",
  sheetId: "all",
  topic: "all",
  platform: "all",
  difficulty: "all",
};

const RESULT_KEYS = ["solved", "partially_solved", "failed"];
const CONFIDENCE_KEYS = ["Low", "Medium", "High"];

export const dayKey = (date) => {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

export const parseMinutes = (timeLabel) => {
  if (typeof timeLabel === "number") return Number.isFinite(timeLabel) ? timeLabel : 0;
  if (!timeLabel || typeof timeLabel !== "string") return 0;
  const match = timeLabel.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

export const normalizePlatform = (platform, link) => {
  if (platform) return `${platform}`;
  const normalizedLink = `${link || ""}`.toLowerCase();
  if (normalizedLink.includes("leetcode")) return "LeetCode";
  if (normalizedLink.includes("codeforces")) return "Codeforces";
  if (normalizedLink.includes("codechef")) return "CodeChef";
  if (normalizedLink.includes("hackerrank")) return "HackerRank";
  if (normalizedLink.includes("geeksforgeeks") || normalizedLink.includes("gfg")) return "GeeksforGeeks";
  if (normalizedLink.includes("github")) return "GitHub";
  return "Other";
};

const normalizeDifficulty = (question = {}, attempt = {}) => {
  const label = attempt.difficulty || question.difficultyLabel || question.difficultyKey || question.difficulty || "Unspecified";
  return `${label}`.trim() || "Unspecified";
};

const toRevisionDate = (attempt) => {
  if (attempt?.revisionDate) {
    const parsed = new Date(attempt.revisionDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const base = attempt?.loggedAt ? new Date(attempt.loggedAt) : new Date();
  const timing = attempt?.revisionTiming || attempt?.revision;
  const mappedDays = {
    Today: 0,
    Tomorrow: 1,
    "In 2 Days": 2,
    "In 1 Week": 7,
    "In 2 Weeks": 14,
  };
  if (mappedDays[timing] === undefined || Number.isNaN(base.getTime())) return null;
  const date = new Date(base);
  date.setDate(base.getDate() + mappedDays[timing]);
  return date;
};

const startOfDay = (date) => new Date(`${dayKey(date)}T00:00:00.000Z`);

const sortText = (a, b) => `${a}`.localeCompare(`${b}`);

const buildTrend = (rows, now, length = 14) => {
  const byDay = new Map();
  rows.forEach((item) => {
    const key = dayKey(item.loggedAt);
    byDay.set(key, (byDay.get(key) || 0) + 1);
  });

  return Array.from({ length }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (length - index - 1));
    const key = dayKey(date);
    return { label: key.slice(5), value: byDay.get(key) || 0 };
  });
};

const buildBreakdown = (rows, key, labelFallback = "Unknown") => {
  const grouped = new Map();
  rows.forEach((row) => {
    const name = row[key] || labelFallback;
    const current = grouped.get(name) || { name, attempts: 0, solved: 0, failed: 0, minutes: 0 };
    current.attempts += 1;
    if (row.result === "solved") current.solved += 1;
    if (row.result === "failed") current.failed += 1;
    current.minutes += parseMinutes(row.timeSpent);
    grouped.set(name, current);
  });

  return [...grouped.values()]
    .map((entry) => ({
      ...entry,
      solvedRate: entry.attempts ? Math.round((entry.solved / entry.attempts) * 100) : 0,
      avgMinutes: entry.attempts ? Math.round(entry.minutes / entry.attempts) : 0,
    }))
    .sort((a, b) => b.attempts - a.attempts || sortText(a.name, b.name));
};

export const extractAttemptRows = (sheets = [], now = new Date()) => {
  const rows = [];

  sheets.forEach((sheet) => {
    const sheetId = sheet.id || sheet._id || sheet.slug || sheet.title || "unknown-sheet";
    const sheetTitle = sheet.title || sheet.name || "Untitled Sheet";
    (sheet.topics || []).forEach((topic) => {
      (topic.subTopics || []).forEach((subTopic) => {
        (subTopic.questions || []).forEach((question) => {
          const attemptLogs = getQuestionAttemptLogs(question);
          attemptLogs.forEach((attempt, attemptIndex) => {
            if (!attempt || attempt.fromSharedProgress) return;
            const loggedAt = attempt.loggedAt || now.toISOString();
            rows.push({
              ...attempt,
              id: `${sheetId}:${topic.id || topic.title}:${subTopic.id || subTopic.title}:${question.id || question.text}:${attemptIndex}`,
              sheetId: `${sheetId}`,
              sheetTitle,
              topic: attempt.topic || topic.title || "General",
              subTopic: attempt.subTopic || attempt.subTopicName || subTopic.title || "",
              questionId: `${question.id || question.text || attemptIndex}`,
              questionKey: `${sheetId}:${topic.id || topic.title}:${subTopic.id || subTopic.title}:${question.id || question.text}`,
              problemName: attempt.problemName || question.text || "Untitled question",
              platform: normalizePlatform(attempt.platform, question.link),
              difficulty: normalizeDifficulty(question, attempt),
              result: RESULT_KEYS.includes(attempt.result) ? attempt.result : "failed",
              timeSpent: attempt.timeSpent,
              confidence: CONFIDENCE_KEYS.includes(attempt.confidence) ? attempt.confidence : "Medium",
              mistakes: Array.isArray(attempt.mistakes) ? attempt.mistakes : [],
              loggedAt,
              revisionDate: attempt.revisionDate,
              revisionTiming: attempt.revisionTiming || attempt.revision,
            });
          });
        });
      });
    });
  });

  return rows;
};

export const buildLearningAnalyticsData = ({ sheets = [], filters = DEFAULT_ANALYTICS_FILTERS, now = new Date() }) => {
  const mergedFilters = { ...DEFAULT_ANALYTICS_FILTERS, ...filters };
  const allAttempts = extractAttemptRows(sheets, now);

  const sheetOptions = sheets.map((sheet) => ({
    id: `${sheet.id || sheet._id || sheet.slug || sheet.title}`,
    title: sheet.title || sheet.name || "Untitled Sheet",
  })).sort((a, b) => sortText(a.title, b.title));

  const topics = [...new Set(allAttempts.map((item) => item.topic).filter(Boolean))].sort(sortText);
  const platforms = [...new Set(allAttempts.map((item) => item.platform).filter(Boolean))].sort(sortText);
  const difficulties = [...new Set(allAttempts.map((item) => item.difficulty).filter(Boolean))].sort(sortText);

  let filteredAttempts = [...allAttempts];
  if (mergedFilters.sheetId !== "all") filteredAttempts = filteredAttempts.filter((item) => item.sheetId === mergedFilters.sheetId);
  if (mergedFilters.topic !== "all") filteredAttempts = filteredAttempts.filter((item) => item.topic === mergedFilters.topic);
  if (mergedFilters.platform !== "all") filteredAttempts = filteredAttempts.filter((item) => item.platform === mergedFilters.platform);
  if (mergedFilters.difficulty !== "all") filteredAttempts = filteredAttempts.filter((item) => item.difficulty === mergedFilters.difficulty);
  if (mergedFilters.dateRange !== "all") {
    const days = Number(`${mergedFilters.dateRange}`.replace("d", ""));
    if (Number.isFinite(days) && days > 0) {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days);
      filteredAttempts = filteredAttempts.filter((item) => new Date(item.loggedAt) >= cutoff);
    }
  }

  const totalAttempts = filteredAttempts.length;
  const solvedCount = filteredAttempts.filter((item) => item.result === "solved").length;
  const totalMinutes = filteredAttempts.reduce((sum, item) => sum + parseMinutes(item.timeSpent), 0);
  const attemptedQuestionCount = new Set(filteredAttempts.map((item) => item.questionKey)).size;

  const dailyAttemptsMap = new Map();
  filteredAttempts.forEach((item) => {
    const key = dayKey(item.loggedAt);
    dailyAttemptsMap.set(key, (dailyAttemptsMap.get(key) || 0) + 1);
  });

  const topMistakes = buildBreakdown(
    filteredAttempts.flatMap((item) => item.mistakes.map((mistake) => ({ ...item, mistake }))),
    "mistake",
    "No mistake tagged"
  ).slice(0, 6).map((entry) => ({ name: entry.name, count: entry.attempts }));

  const topicMastery = buildBreakdown(filteredAttempts, "topic").map((entry) => {
    const revisionsDue = filteredAttempts.filter((item) => {
      if (item.topic !== entry.name) return false;
      const revisionDate = toRevisionDate(item);
      return revisionDate && revisionDate <= now;
    }).length;
    return {
      ...entry,
      mastery: entry.solvedRate,
      revisionDue: revisionsDue,
    };
  });

  const weakAreas = [...topicMastery]
    .filter((entry) => entry.attempts > 0)
    .sort((a, b) => a.mastery - b.mastery || b.attempts - a.attempts)
    .slice(0, 5);
  const strongestTopics = [...topicMastery].sort((a, b) => b.mastery - a.mastery || b.attempts - a.attempts).slice(0, 3);

  const revisions = { overdue: 0, today: 0, tomorrow: 0, thisWeek: 0 };
  const revisionQueue = [];
  filteredAttempts.forEach((item) => {
    const revisionDate = toRevisionDate(item);
    if (!revisionDate) return;
    const diffDays = Math.floor((startOfDay(revisionDate) - startOfDay(now)) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) revisions.overdue += 1;
    else if (diffDays === 0) revisions.today += 1;
    else if (diffDays === 1) revisions.tomorrow += 1;
    else if (diffDays <= 7) revisions.thisWeek += 1;
    if (diffDays <= 7) revisionQueue.push({ ...item, revisionDate: revisionDate.toISOString(), dueInDays: diffDays });
  });
  revisionQueue.sort((a, b) => new Date(a.revisionDate) - new Date(b.revisionDate));

  const recentMistakes = filteredAttempts
    .filter((item) => item.mistakes.length > 0)
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      name: item.mistakes[0],
      topic: item.topic,
      count: item.mistakes.length,
      when: new Date(item.loggedAt).toLocaleDateString(),
      summary: `${item.mistakes[0]} in ${item.topic} - ${item.problemName}`,
    }));

  const practiceDays = [...new Set(filteredAttempts.map((item) => dayKey(item.loggedAt)))].sort();
  let streak = 0;
  const cursor = startOfDay(now);
  while (practiceDays.includes(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const timeByResult = RESULT_KEYS.map((result) => {
    const selected = filteredAttempts.filter((item) => item.result === result);
    const minutes = selected.reduce((sum, item) => sum + parseMinutes(item.timeSpent), 0);
    return { result, minutes, attempts: selected.length };
  });

  const confidenceVsResult = CONFIDENCE_KEYS.map((confidence) => {
    const band = filteredAttempts.filter((item) => item.confidence === confidence);
    return {
      confidence,
      solved: band.filter((item) => item.result === "solved").length,
      partially_solved: band.filter((item) => item.result === "partially_solved").length,
      failed: band.filter((item) => item.result === "failed").length,
    };
  });

  const avgFailedMinutes = Math.round((timeByResult.find((item) => item.result === "failed")?.minutes || 0) / (filteredAttempts.filter((item) => item.result === "failed").length || 1));
  const avgSolvedMinutes = Math.round((timeByResult.find((item) => item.result === "solved")?.minutes || 0) / (filteredAttempts.filter((item) => item.result === "solved").length || 1));

  const insights = totalAttempts
    ? [
        `${topMistakes[0]?.name || "No repeated mistake yet"} is currently your most visible mistake pattern.`,
        `${strongestTopics[0]?.name || "No strong topic yet"} is your strongest area, while ${weakAreas[0]?.name || "your weakest topic"} needs focused revision.`,
        `Failed attempts average ${avgFailedMinutes || 0} min vs ${avgSolvedMinutes || 0} min for solved attempts.`,
        `${revisions.overdue + revisions.today} revision ${revisions.overdue + revisions.today === 1 ? "item is" : "items are"} due now.`,
      ]
    : ["Log attempts from your sheets to unlock trend, revision, and weak-area insights."];

  const actions = totalAttempts
    ? [
        `Start with ${revisions.overdue + revisions.today} due revision ${revisions.overdue + revisions.today === 1 ? "item" : "items"}.`,
        `Run a focused session on ${weakAreas[0]?.name || "your weakest topic"} with 3 timed questions.`,
        "After each failed attempt, capture one concrete mistake tag.",
        "Compare confidence against solved rate every week.",
      ]
    : ["Open a sheet, log one attempt, and come back here for your first analytics snapshot."];

  return {
    filtersMeta: { sheets: sheetOptions, topics, platforms, difficulties },
    hasAttempts: allAttempts.length > 0,
    hasFilteredAttempts: filteredAttempts.length > 0,
    stats: {
      totalAttempts,
      totalQuestions: attemptedQuestionCount,
      solvedRate: totalAttempts ? (solvedCount / totalAttempts) * 100 : 0,
      solvedCount,
      avgMinutes: totalAttempts ? Math.round(totalMinutes / totalAttempts) : 0,
      totalMinutes,
      streak,
      lastPracticeLabel: practiceDays.length ? `Last practice ${practiceDays[practiceDays.length - 1]}` : "No recent practice",
      revisionsDue: revisions.overdue + revisions.today,
      revisionOverdue: revisions.overdue,
      weakestTopic: weakAreas[0]?.name,
      weakestTopicRate: weakAreas[0]?.mastery,
      topMistake: topMistakes[0]?.name,
      topMistakeCount: topMistakes[0]?.count,
    },
    attemptsTrend: buildTrend(filteredAttempts, now),
    resultDistribution: Object.fromEntries(RESULT_KEYS.map((result) => [result, filteredAttempts.filter((item) => item.result === result).length])),
    topMistakes,
    topicMastery,
    weakAreas,
    recentMistakes,
    insights,
    actions,
    revisionTimeline: [
      { label: "Overdue", count: revisions.overdue },
      { label: "Today", count: revisions.today },
      { label: "Tomorrow", count: revisions.tomorrow },
      { label: "This week", count: revisions.thisWeek },
    ],
    revisionQueue: revisionQueue.slice(0, 8),
    confidenceVsResult,
    dailyAttemptsMap,
    timeByResult,
    platformBreakdown: buildBreakdown(filteredAttempts, "platform").slice(0, 8),
    difficultyBreakdown: buildBreakdown(filteredAttempts, "difficulty").slice(0, 8),
    sheetBreakdown: buildBreakdown(filteredAttempts, "sheetTitle").slice(0, 8),
  };
};

export const buildAnalyticsExportPayload = (analyticsData, filters) => ({
  generatedAt: new Date().toISOString(),
  filters,
  stats: analyticsData.stats,
  resultDistribution: analyticsData.resultDistribution,
  topMistakes: analyticsData.topMistakes,
  topicMastery: analyticsData.topicMastery,
  platformBreakdown: analyticsData.platformBreakdown,
  difficultyBreakdown: analyticsData.difficultyBreakdown,
  sheetBreakdown: analyticsData.sheetBreakdown,
  revisionTimeline: analyticsData.revisionTimeline,
  revisionQueue: analyticsData.revisionQueue,
  attemptsTrend: analyticsData.attemptsTrend,
  dailyAttempts: Object.fromEntries(analyticsData.dailyAttemptsMap.entries()),
});
