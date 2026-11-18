import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

const readPublicFile = (name) => readFileSync(join(process.cwd(), "public", name), "utf8");

describe("SEO public assets", () => {
  it("uses the no-training robots policy with expected bot rules", () => {
    const robots = readPublicFile("robots.txt");

    expect(robots).toContain("User-agent: OAI-SearchBot\nAllow: /");
    expect(robots).toContain("User-agent: ChatGPT-User\nAllow: /");
    expect(robots).toContain("User-agent: Claude-SearchBot\nAllow: /");
    expect(robots).toContain("User-agent: Claude-User\nAllow: /");
    expect(robots).toContain("User-agent: GPTBot\nDisallow: /");
    expect(robots).toContain("User-agent: ClaudeBot\nDisallow: /");
    expect(robots).toContain("Sitemap: https://www.createsheets.com/sitemap.xml");
    expect(robots).toContain("Sitemap: https://www.createsheets.com/sitemap-public-sheets.xml");
    expect(robots).toContain("Sitemap: https://www.createsheets.com/sitemap-static.xml");
  });

  it("publishes sitemap and LLM root files", () => {
    expect(readPublicFile("sitemap.xml")).toContain("https://www.createsheets.com/sitemap-public-sheets.xml");
    expect(readPublicFile("sitemap-static.xml")).toContain("https://www.createsheets.com/explore");
    expect(readPublicFile("llms.txt")).toContain("CreateSheets is a web platform");
    expect(readPublicFile("llms-full.txt")).toContain("CreateSheets full LLM context");
  });
});
