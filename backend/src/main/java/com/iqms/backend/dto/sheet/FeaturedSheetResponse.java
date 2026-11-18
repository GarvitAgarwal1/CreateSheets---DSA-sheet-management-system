package com.iqms.backend.dto.sheet;

import com.iqms.backend.model.Sheet;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public record FeaturedSheetResponse(
    String id,
    String shareId,
    String title,
    String description,
    String logoUrl,
    String sheetUrl,
    List<Map<String, Object>> topicTags,
    String visibility,
    Instant updatedAt) {

  public static FeaturedSheetResponse from(Sheet sheet) {
    return new FeaturedSheetResponse(
        sheet.getId(),
        sheet.getShareId(),
        sheet.getTitle(),
        sheet.getDescription(),
        sheet.getLogoUrl(),
        sheet.getSheetUrl(),
        sheet.getTopicTags(),
        sheet.getVisibility(),
        sheet.getUpdatedAt());
  }
}
