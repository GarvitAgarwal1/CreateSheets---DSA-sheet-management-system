import { describe, expect, it } from "vitest";
import {
  getQuestionAttemptResultCounts,
  getQuestionFinalResult,
  getSubtopicProgress,
  getTopicProgress,
} from "../questionProgress";

describe("questionProgress", () => {
  it("counts partially solved and failed subtopics as in-progress", () => {
    const topic = {
      subTopics: [
        {
          questions: [
            { attemptLogs: [{ result: "failed" }] },
            { attemptLogs: [{ result: "partially_solved" }] },
          ],
        },
        {
          questions: [
            { attemptLogs: [{ result: "solved" }] },
          ],
        },
        {
          questions: [
            { attemptLogs: [] },
          ],
        },
      ],
    };

    const summary = getTopicProgress(topic);
    expect(summary.completedSubtopics).toBe(1);
    expect(summary.inProgressSubtopics).toBe(1);
    expect(summary.notStartedSubtopics).toBe(1);
  });

  it("reports unresolved when a question has no attempts", () => {
    const subtopic = {
      questions: [{ text: "Q1" }, { attemptLogs: [{ result: "solved" }] }],
    };

    const summary = getSubtopicProgress(subtopic);
    expect(summary.resultCounts.unresolved).toBe(1);
    expect(summary.resultCounts.solved).toBe(1);
  });

  it("calculates a question final result from all attempts by status precedence", () => {
    expect(getQuestionFinalResult({
      attemptLogs: [
        { result: "failed" },
        { result: "partially_solved" },
        { result: "solved" },
      ],
    })).toBe("solved");

    expect(getQuestionFinalResult({
      attemptLogs: [
        { result: "failed" },
        { result: "partial" },
      ],
    })).toBe("partially_solved");

    expect(getQuestionFinalResult({
      attemptLogs: [{ result: "wrong" }],
    })).toBe("failed");
  });

  it("counts every attempt result for the question stacked progress bar", () => {
    const counts = getQuestionAttemptResultCounts({
      attemptLogs: [
        { result: "solved" },
        { result: "partial" },
        { result: "failed" },
      ],
    });

    expect(counts).toMatchObject({
      solved: 1,
      partially_solved: 1,
      failed: 1,
      unresolved: 0,
    });
  });

  it("aggregates subtopic and topic progress from final question statuses", () => {
    const topic = {
      subTopics: [
        {
          questions: [
            {
              attemptLogs: [
                { result: "failed" },
                { result: "solved" },
              ],
            },
            {
              attemptLogs: [
                { result: "failed" },
                { result: "partially_solved" },
              ],
            },
            { attemptLogs: [{ result: "failed" }] },
            { attemptLogs: [] },
          ],
        },
      ],
    };

    const subtopicSummary = getSubtopicProgress(topic.subTopics[0]);
    const topicSummary = getTopicProgress(topic);

    expect(subtopicSummary.resultCounts).toEqual({
      solved: 1,
      partially_solved: 1,
      failed: 1,
      unresolved: 1,
    });
    expect(subtopicSummary.isCompleted).toBe(false);
    expect(topicSummary.resultCounts).toEqual(subtopicSummary.resultCounts);
    expect(topicSummary.completedQuestions).toBe(1);
  });
});
