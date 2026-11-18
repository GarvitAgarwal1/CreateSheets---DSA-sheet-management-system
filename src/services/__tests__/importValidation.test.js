import { describe, expect, it } from "vitest";
import { parseSheetJsonText } from "../importValidation";
import { buildSheetExportPayload } from "../sheetTransfer";

describe("import validation parser", () => {
  it("accepts exported JSON text from this app", () => {
    const payload = buildSheetExportPayload({
      sheetTitle: "Exported Sheet",
      logoUrl: "https://example.com/logo.png",
      sheetUrl: "https://example.com/ref",
      topics: [{ title: "Topic", subTopics: [{ title: "Sub", questions: [{ text: "Q1" }] }] }],
    });

    const result = parseSheetJsonText(JSON.stringify(payload, null, 2));

    expect(result.valid).toBe(true);
    expect(result.recoveredSyntax).toBe(false);
    expect(result.normalized.name).toBe("Exported Sheet");
    expect(result.normalized.logoUrl).toBe("https://example.com/logo.png");
    expect(result.normalized.sheetUrl).toBe("https://example.com/ref");
  });

  it("recovers from trailing commas in otherwise valid JSON", () => {
    const content = `{
      "name": "Comma Sheet",
      "topics": [
        {
          "title": "Topic",
          "subTopics": [
            {
              "title": "Subtopic",
              "questions": [
                { "text": "Question", }
              ],
            },
          ],
        },
      ],
    }`;

    const result = parseSheetJsonText(content);

    expect(result.valid).toBe(true);
    expect(result.recoveredSyntax).toBe(true);
    expect(result.normalized.name).toBe("Comma Sheet");
  });

  it("keeps importing when sheet metadata URLs are invalid", () => {
    const result = parseSheetJsonText(JSON.stringify({
      name: "Bad URL Sheet",
      logoUrl: "javascript:alert(1)",
      sheetUrl: "not-valid",
      topics: [],
    }));

    expect(result.valid).toBe(true);
    expect(result.normalized.logoUrl).toBe("");
    expect(result.normalized.sheetUrl).toBe("");
    expect(result.warnings).toHaveLength(2);
  });
});
