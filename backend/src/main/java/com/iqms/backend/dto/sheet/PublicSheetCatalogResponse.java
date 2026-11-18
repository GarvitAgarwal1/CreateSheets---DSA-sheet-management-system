package com.iqms.backend.dto.sheet;

import com.iqms.backend.model.Sheet;
import com.iqms.backend.seo.SeoUrlUtils;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public record PublicSheetCatalogResponse(
    String id,
    String shareId,
    String ownerUsername,
    String sheetSlug,
    String publicPath,
    String publicUrl,
    String title,
    String description,
    String logoUrl,
    String sheetUrl,
    List<Map<String, Object>> topicTags,
    Instant updatedAt) {

  public static PublicSheetCatalogResponse from(Sheet sheet, String ownerUsername) {
    String safeUsername = ownerUsername == null ? "" : ownerUsername.trim();
    String safeTitle = sheet.getTitle() == null || sheet.getTitle().isBlank() ? "Untitled Sheet" : sheet.getTitle();
    String publicPath = SeoUrlUtils.publicSheetPath(safeUsername, safeTitle);

    return new PublicSheetCatalogResponse(
        sheet.getId(),
        sheet.getShareId(),
        safeUsername,
        SeoUrlUtils.slugifySegment(safeTitle),
        publicPath,
        SeoUrlUtils.SITE_URL + publicPath,
        sheet.getTitle(),
        sheet.getDescription(),
        sheet.getLogoUrl(),
        sheet.getSheetUrl(),
        sheet.getTopicTags(),
        sheet.getUpdatedAt());
  }
}
