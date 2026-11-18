import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import SeoMeta from "../SeoMeta";

describe("SeoMeta", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    window.history.replaceState({}, "", "/");
  });

  it("adds public canonical metadata and JSON-LD", async () => {
    render(
      <SeoMeta
        title="Explore Public DSA Sheets | CreateSheets"
        description="Discover public DSA sheets."
        path="/explore"
        structuredData={{ "@context": "https://schema.org", "@type": "ItemList", name: "Sheets" }}
      />
    );

    await waitFor(() => {
      expect(document.title).toBe("Explore Public DSA Sheets | CreateSheets");
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toMatch(/\/explore$/);
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
        "content",
        "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
      );
      expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute("content", "Explore Public DSA Sheets | CreateSheets");
      expect(document.querySelector('script[data-seo-schema="true"]')?.textContent).toContain("\"@type\":\"ItemList\"");
    });
  });

  it("forces noindex for private paths", async () => {
    render(<SeoMeta title="Dashboard" description="Private dashboard" path="/dashboard" />);

    await waitFor(() => {
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
    });
  });
});
