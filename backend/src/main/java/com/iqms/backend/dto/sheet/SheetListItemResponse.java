package com.iqms.backend.dto.sheet;

import com.iqms.backend.model.Sheet;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public record SheetListItemResponse(
    String id,
    String name,
    String logoUrl,
    String sheetUrl,
    Instant updatedAt,
    Instant createdAt,
    boolean isPublic,
    boolean isArchived,
    boolean shareProgress,
    String visibility,
    int solved,
    int totalQuestions,
    int progressPercent) {

  public static SheetListItemResponse from(Sheet sheet) {
    ProgressSnapshot progress = ProgressSnapshot.fromTopics(sheet.getTopics());
    return new SheetListItemResponse(
        sheet.getId(),
        sheet.getTitle(),
        sheet.getLogoUrl(),
        sheet.getSheetUrl(),
        sheet.getUpdatedAt(),
        sheet.getCreatedAt(),
        sheet.isPublic(),
        sheet.isArchived(),
        sheet.isShareProgress(),
        sheet.getVisibility(),
        progress.solved(),
        progress.totalQuestions(),
        progress.progressPercent());
  }

  private record ProgressSnapshot(int solved, int totalQuestions, int progressPercent) {
    static ProgressSnapshot fromTopics(List<Map<String, Object>> topics) {
      int solved = 0;
      int totalQuestions = 0;

      if (topics != null) {
        for (Map<String, Object> topic : topics) {
          Object subTopicsValue = topic == null ? null : topic.get("subTopics");
          if (!(subTopicsValue instanceof List<?> subTopics)) {
            continue;
          }

          for (Object subTopicObj : subTopics) {
            if (!(subTopicObj instanceof Map<?, ?> subTopic)) {
              continue;
            }
            Object questionsValue = subTopic.get("questions");
            if (!(questionsValue instanceof List<?> questions)) {
              continue;
            }

            totalQuestions += questions.size();
            for (Object questionObj : questions) {
              if (!(questionObj instanceof Map<?, ?> question)) {
                continue;
              }
              Object doneValue = question.get("done");
              if (doneValue instanceof Boolean done && done) {
                solved++;
              }
            }
          }
        }
      }

      int progressPercent = totalQuestions == 0 ? 0 : (int) Math.round((solved * 100.0) / totalQuestions);
      return new ProgressSnapshot(solved, totalQuestions, progressPercent);
    }
  }
}
