import { describe, expect, it } from "vitest";
import {
  createQuestionDroppableId,
  createSubtopicDroppableId,
  parseSheetDroppableId,
  resolveQuestionDropLocation,
  resolveSubtopicDropLocation,
} from "../dragDropIds";

describe("dragDropIds", () => {
  it("round-trips string ids with hyphens for question droppables", () => {
    const droppableId = createQuestionDroppableId("topic-alpha-1", "sub-beta-2");

    expect(parseSheetDroppableId(droppableId)).toEqual({
      type: "question",
      topicKey: "topic-alpha-1",
      subtopicKey: "sub-beta-2",
    });
  });

  it("resolves drop locations back to original id values", () => {
    const topics = [
      {
        id: "topic-alpha-1",
        subTopics: [{ id: "sub-beta-2", questions: [] }],
      },
      {
        id: 42,
        subTopics: [{ id: 99, questions: [] }],
      },
    ];

    expect(resolveQuestionDropLocation(topics, createQuestionDroppableId("topic-alpha-1", "sub-beta-2"))).toEqual({
      topic: topics[0],
      subtopic: topics[0].subTopics[0],
    });
    expect(resolveSubtopicDropLocation(topics, createSubtopicDroppableId(42))).toEqual({
      topic: topics[1],
    });
  });
});
