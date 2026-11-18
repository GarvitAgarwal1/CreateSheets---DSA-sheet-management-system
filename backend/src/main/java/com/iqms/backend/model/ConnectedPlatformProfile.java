package com.iqms.backend.model;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

public class ConnectedPlatformProfile {
  private String id;
  private String platform;
  private String platformLabel;
  private String username;
  private String profileUrl;
  private String verificationCode;
  private String verificationTarget;
  private String verificationInstructions;
  private String verificationStatus = "pending";
  private String verificationMessage;
  private Instant verificationRequestedAt;
  private Instant verificationCheckedAt;
  private Instant verifiedAt;
  private Instant createdAt;
  private Instant updatedAt;
  private Instant lastSyncedAt;
  private Long lastSyncDurationMs;
  private Long publicLoadingDurationMs;
  private String lastSyncStatus;
  private String lastSyncError;
  private Map<String, Object> stats = new LinkedHashMap<>();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getPlatform() { return platform; }
  public void setPlatform(String platform) { this.platform = platform; }
  public String getPlatformLabel() { return platformLabel; }
  public void setPlatformLabel(String platformLabel) { this.platformLabel = platformLabel; }
  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }
  public String getProfileUrl() { return profileUrl; }
  public void setProfileUrl(String profileUrl) { this.profileUrl = profileUrl; }
  public String getVerificationCode() { return verificationCode; }
  public void setVerificationCode(String verificationCode) { this.verificationCode = verificationCode; }
  public String getVerificationTarget() { return verificationTarget; }
  public void setVerificationTarget(String verificationTarget) { this.verificationTarget = verificationTarget; }
  public String getVerificationInstructions() { return verificationInstructions; }
  public void setVerificationInstructions(String verificationInstructions) { this.verificationInstructions = verificationInstructions; }
  public String getVerificationStatus() { return verificationStatus; }
  public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
  public String getVerificationMessage() { return verificationMessage; }
  public void setVerificationMessage(String verificationMessage) { this.verificationMessage = verificationMessage; }
  public Instant getVerificationRequestedAt() { return verificationRequestedAt; }
  public void setVerificationRequestedAt(Instant verificationRequestedAt) { this.verificationRequestedAt = verificationRequestedAt; }
  public Instant getVerificationCheckedAt() { return verificationCheckedAt; }
  public void setVerificationCheckedAt(Instant verificationCheckedAt) { this.verificationCheckedAt = verificationCheckedAt; }
  public Instant getVerifiedAt() { return verifiedAt; }
  public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
  public Instant getLastSyncedAt() { return lastSyncedAt; }
  public void setLastSyncedAt(Instant lastSyncedAt) { this.lastSyncedAt = lastSyncedAt; }
  public Long getLastSyncDurationMs() { return lastSyncDurationMs; }
  public void setLastSyncDurationMs(Long lastSyncDurationMs) { this.lastSyncDurationMs = lastSyncDurationMs; }
  public Long getPublicLoadingDurationMs() { return publicLoadingDurationMs; }
  public void setPublicLoadingDurationMs(Long publicLoadingDurationMs) { this.publicLoadingDurationMs = publicLoadingDurationMs; }
  public String getLastSyncStatus() { return lastSyncStatus; }
  public void setLastSyncStatus(String lastSyncStatus) { this.lastSyncStatus = lastSyncStatus; }
  public String getLastSyncError() { return lastSyncError; }
  public void setLastSyncError(String lastSyncError) { this.lastSyncError = lastSyncError; }
  public Map<String, Object> getStats() { return stats; }
  public void setStats(Map<String, Object> stats) {
    this.stats = stats == null ? new LinkedHashMap<>() : new LinkedHashMap<>(stats);
  }
}
