import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_APP_ICON_URL } from "../../config/branding";
import SheetCatalogCard from "../SheetCatalogCard";

describe("SheetCatalogCard", () => {
  it("renders fallback logo, topic overflow, external link, and open action", () => {
    const onOpen = vi.fn();
    render(
      <SheetCatalogCard
        id="sheet-1"
        shareId="share-1"
        publicPath="/sheets/creator/catalog-sheet"
        title="Catalog Sheet"
        description="A compact catalog card."
        logoUrl=""
        sheetUrl="https://example.com/ref"
        topicTags={[
          { id: "arrays", name: "Arrays", color: "#2563eb" },
          { id: "graphs", name: "Graphs", color: "#16a34a" },
          { id: "dp", name: "DP", color: "#d97706" },
          { id: "trees", name: "Trees", color: "#dc2626" },
        ]}
        onOpen={onOpen}
      />
    );

    expect(screen.getByText("Catalog Sheet")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByLabelText("Open sheet reference URL")).toHaveAttribute("href", "https://example.com/ref");

    const image = document.querySelector("img");
    expect(image).toHaveAttribute("src", DEFAULT_APP_ICON_URL);

    const openLink = screen.getByRole("link", { name: "Open Sheet" });
    expect(openLink).toHaveAttribute("href", "/sheets/creator/catalog-sheet");

    fireEvent.click(openLink);
    expect(onOpen).toHaveBeenCalledWith({ id: "sheet-1", shareId: "share-1", publicPath: "/sheets/creator/catalog-sheet" });
  });
});
