package com.iqms.backend.dto.sheet;

import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public class SheetUpdateRequest {

  @Size(max = 120, message = "Title must be 120 characters or fewer")
  private String title;
  @Size(max = 1000, message = "Description must be 1000 characters or fewer")
  private String description;
  @Size(max = 2048, message = "Logo URL must be 2048 characters or fewer")
  private String logoUrl;
  @Size(max = 2048, message = "Sheet URL must be 2048 characters or fewer")
  private String sheetUrl;

  private List<Map<String, Object>> topics;
  private List<Map<String, Object>> topicTags;
  private List<Map<String, Object>> userCustomTopics;
  private Boolean isPublic;
  private Boolean isArchived;
  private Boolean shareProgress;

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getLogoUrl() {
    return logoUrl;
  }

  public void setLogoUrl(String logoUrl) {
    this.logoUrl = logoUrl;
  }

  public String getSheetUrl() {
    return sheetUrl;
  }

  public void setSheetUrl(String sheetUrl) {
    this.sheetUrl = sheetUrl;
  }

  public List<Map<String, Object>> getTopics() {
    return topics;
  }

  public void setTopics(List<Map<String, Object>> topics) {
    this.topics = topics;
  }

  public Boolean getIsPublic() {
    return isPublic;
  }

  public void setIsPublic(Boolean isPublic) {
    this.isPublic = isPublic;
  }

  public Boolean getIsArchived() {
    return isArchived;
  }

  public void setIsArchived(Boolean isArchived) {
    this.isArchived = isArchived;
  }

  public Boolean getShareProgress() {
    return shareProgress;
  }

  public void setShareProgress(Boolean shareProgress) {
    this.shareProgress = shareProgress;
  }

  public List<Map<String, Object>> getTopicTags() {
    return topicTags;
  }

  public void setTopicTags(List<Map<String, Object>> topicTags) {
    this.topicTags = topicTags;
  }

  public List<Map<String, Object>> getUserCustomTopics() {
    return userCustomTopics;
  }

  public void setUserCustomTopics(List<Map<String, Object>> userCustomTopics) {
    this.userCustomTopics = userCustomTopics;
  }
}
