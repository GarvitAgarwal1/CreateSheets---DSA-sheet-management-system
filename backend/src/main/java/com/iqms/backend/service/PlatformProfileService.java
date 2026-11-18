package com.iqms.backend.service;

import com.iqms.backend.model.ConnectedPlatformProfile;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PlatformProfileService {
  private static final long PUBLIC_LOADING_BUFFER_MS = 4_000L;

  private final UserRepository userRepository;
  private final PlatformStatsService platformStatsService;

  public PlatformProfileService(UserRepository userRepository, PlatformStatsService platformStatsService) {
    this.userRepository = userRepository;
    this.platformStatsService = platformStatsService;
  }

  public Map<String, Object> dashboard(String userId) {
    return dashboardPayload(findUser(userId));
  }

  public Map<String, Object> requestVerification(String userId, Map<String, String> body) {
    User user = findUser(userId);
    String platform = normalize(body == null ? null : body.get("platform"));
    String username = normalizeUsername(body == null ? null : body.get("username"));
    PlatformStatsService.PlatformDefinition definition = platformStatsService.definitionFor(platform);
    Instant now = Instant.now();

    ConnectedPlatformProfile profile = findExistingProfile(user, definition.key(), username);
    if (profile == null) {
      profile = new ConnectedPlatformProfile();
      profile.setId(UUID.randomUUID().toString());
      profile.setPlatform(definition.key());
      profile.setUsername(username);
      profile.setCreatedAt(now);
      user.getPlatformProfiles().add(profile);
    }

    profile.setPlatformLabel(definition.label());
    profile.setProfileUrl(definition.profileUrl(username));
    profile.setVerificationCode(generateCode());
    profile.setVerificationTarget(definition.verificationTarget());
    profile.setVerificationInstructions(definition.verificationInstructions());
    profile.setVerificationStatus("pending");
    if (!definition.strictVerificationPossible()) {
      profile.setVerificationMessage(definition.verificationInstructions());
    } else if ("best_effort".equals(definition.reliabilityTier())) {
      profile.setVerificationMessage("Verification uses best-effort public profile reads for this platform.");
    } else {
      profile.setVerificationMessage("Add this code to your public profile, then click Verify.");
    }
    profile.setVerificationRequestedAt(now);
    profile.setVerificationCheckedAt(null);
    profile.setVerifiedAt(null);
    profile.setUpdatedAt(now);
    userRepository.save(user);
    return dashboardPayload(user);
  }

  public Map<String, Object> verify(String userId, String profileId) {
    User user = findUser(userId);
    ConnectedPlatformProfile profile = findProfile(user, profileId);
    if (profile.getVerificationCode() == null || profile.getVerificationCode().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request a verification code first.");
    }

    Instant now = Instant.now();
    PlatformStatsService.VerificationProbe probe = platformStatsService.fetchVerificationProbe(profile.getPlatform(), profile.getUsername());
    profile.setVerificationCheckedAt(now);
    profile.setUpdatedAt(now);

    if (!probe.supported()) {
      profile.setVerificationStatus("failed");
      profile.setVerificationMessage(probe.message());
      userRepository.save(user);
      return dashboardPayload(user);
    }

    String text = probe.text() == null ? "" : probe.text().toLowerCase(Locale.ROOT);
    String code = profile.getVerificationCode().toLowerCase(Locale.ROOT);
    if (!text.contains(code)) {
      profile.setVerificationStatus("failed");
      profile.setVerificationMessage("Verification code was not found in the public profile yet.");
      userRepository.save(user);
      return dashboardPayload(user);
    }

    profile.setVerificationStatus("verified");
    profile.setVerificationMessage("Profile ownership verified.");
    profile.setVerifiedAt(now);
    syncOne(profile);
    userRepository.save(user);
    return dashboardPayload(user);
  }

  public Map<String, Object> syncVerified(String userId) {
    User user = findUser(userId);
    long startedAt = System.currentTimeMillis();
    for (ConnectedPlatformProfile profile : user.getPlatformProfiles()) {
      if (!isVerified(profile)) continue;
      syncOne(profile);
    }
    long durationMs = System.currentTimeMillis() - startedAt;
    userRepository.save(user);
    Map<String, Object> payload = dashboardPayload(user);
    payload.put("syncDurationMs", durationMs);
    payload.put("loadingDurationMs", durationMs + PUBLIC_LOADING_BUFFER_MS);
    return payload;
  }

  public Map<String, Object> deleteProfile(String userId, String profileId) {
    User user = findUser(userId);
    boolean removed = user.getPlatformProfiles().removeIf(profile -> profileId.equals(profile.getId()));
    if (!removed) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform profile not found.");
    }
    userRepository.save(user);
    return dashboardPayload(user);
  }

  public Map<String, Object> publicStatsPayload(User user) {
    List<Map<String, Object>> verified = user.getPlatformProfiles().stream()
        .filter(this::isVerified)
        .map(profile -> profilePayload(profile, false))
        .toList();
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("profiles", verified);
    payload.put("aggregate", aggregate(verified, user.getPlatformProfiles().size()));
    payload.put("public", true);
    return payload;
  }

  private void syncOne(ConnectedPlatformProfile profile) {
    long startedAt = System.currentTimeMillis();
    try {
      Map<String, Object> stats = platformStatsService.fetchStats(profile.getPlatform(), profile.getUsername());
      long durationMs = System.currentTimeMillis() - startedAt;
      profile.setStats(stats);
      profile.setLastSyncedAt(Instant.now());
      profile.setLastSyncDurationMs(durationMs);
      profile.setPublicLoadingDurationMs(durationMs + PUBLIC_LOADING_BUFFER_MS);
      profile.setLastSyncStatus("success");
      profile.setLastSyncError(null);
      profile.setUpdatedAt(Instant.now());
    } catch (Exception ex) {
      long durationMs = System.currentTimeMillis() - startedAt;
      profile.setLastSyncDurationMs(durationMs);
      profile.setPublicLoadingDurationMs(durationMs + PUBLIC_LOADING_BUFFER_MS);
      profile.setLastSyncStatus("failed");
      profile.setLastSyncError(ex.getMessage());
      profile.setUpdatedAt(Instant.now());
    }
  }

  private Map<String, Object> dashboardPayload(User user) {
    List<Map<String, Object>> profiles = user.getPlatformProfiles().stream()
        .sorted(Comparator.comparing(ConnectedPlatformProfile::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
        .map(profile -> profilePayload(profile, true))
        .toList();
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("platforms", platformStatsService.platformCatalog());
    payload.put("profiles", profiles);
    payload.put("aggregate", aggregate(profiles, profiles.size()));
    payload.put("generatedAt", Instant.now().toString());
    return payload;
  }

  private Map<String, Object> profilePayload(ConnectedPlatformProfile profile, boolean includePrivate) {
    PlatformStatsService.PlatformDefinition definition = platformStatsService.definitionFor(profile.getPlatform());
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("id", profile.getId());
    payload.put("platform", profile.getPlatform());
    payload.put("platformLabel", profile.getPlatformLabel());
    payload.put("username", profile.getUsername());
    payload.put("profileUrl", profile.getProfileUrl());
    payload.put("verificationTarget", profile.getVerificationTarget());
    payload.put("verificationInstructions", profile.getVerificationInstructions());
    payload.put("verificationStatus", profile.getVerificationStatus());
    payload.put("verificationMessage", profile.getVerificationMessage());
    payload.put("verificationRequestedAt", toString(profile.getVerificationRequestedAt()));
    payload.put("verificationCheckedAt", toString(profile.getVerificationCheckedAt()));
    payload.put("verifiedAt", toString(profile.getVerifiedAt()));
    payload.put("strictVerificationPossible", definition.strictVerificationPossible());
    payload.put("reliabilityTier", definition.reliabilityTier());
    payload.put("statsSource", definition.statsSource());
    payload.put("lastSyncedAt", toString(profile.getLastSyncedAt()));
    payload.put("lastSyncDurationMs", profile.getLastSyncDurationMs());
    payload.put("publicLoadingDurationMs", profile.getPublicLoadingDurationMs());
    payload.put("lastSyncStatus", profile.getLastSyncStatus());
    payload.put("lastSyncError", profile.getLastSyncError());
    payload.put("stats", profile.getStats());
    if (includePrivate) payload.put("verificationCode", profile.getVerificationCode());
    return payload;
  }

  private Map<String, Object> aggregate(List<Map<String, Object>> profiles, int totalProfiles) {
    int verifiedProfiles = 0;
    int pendingProfiles = 0;
    long totalSolved = 0;
    long contests = 0;
    Map<String, Long> difficulty = new LinkedHashMap<>();
    difficulty.put("easy", 0L);
    difficulty.put("medium", 0L);
    difficulty.put("hard", 0L);
    difficulty.put("unknown", 0L);
    Map<String, Long> activity = new LinkedHashMap<>();
    Map<String, Long> topics = new LinkedHashMap<>();
    Map<String, Long> platformBreakdown = new LinkedHashMap<>();
    String lastSyncedAt = null;

    for (Map<String, Object> profile : profiles) {
      if ("verified".equals(profile.get("verificationStatus"))) verifiedProfiles++;
      else pendingProfiles++;
      Map<String, Object> stats = asMap(profile.get("stats"));
      long profileTotal = asLong(stats.get("totalSolved"));
      totalSolved += profileTotal;
      contests += asLong(stats.get("contests"));
      String platformLabel = String.valueOf(profile.getOrDefault("platformLabel", profile.getOrDefault("platform", "Platform")));
      platformBreakdown.put(platformLabel, platformBreakdown.getOrDefault(platformLabel, 0L) + profileTotal);
      Map<String, Object> statDifficulty = asMap(stats.get("difficulty"));
      for (String key : difficulty.keySet()) {
        difficulty.put(key, difficulty.get(key) + asLong(statDifficulty.get(key)));
      }
      for (Object item : asList(stats.get("topics"))) {
        Map<String, Object> point = asMap(item);
        String label = String.valueOf(point.getOrDefault("label", ""));
        if (label.isBlank()) continue;
        topics.put(label, topics.getOrDefault(label, 0L) + asLong(point.get("count")));
      }
      for (Object item : asList(stats.get("activity"))) {
        Map<String, Object> point = asMap(item);
        String label = String.valueOf(point.getOrDefault("label", ""));
        if (label.isBlank()) continue;
        activity.put(label, activity.getOrDefault(label, 0L) + asLong(point.get("count")));
      }
      String profileSyncedAt = (String) profile.get("lastSyncedAt");
      if (profileSyncedAt != null && (lastSyncedAt == null || profileSyncedAt.compareTo(lastSyncedAt) > 0)) {
        lastSyncedAt = profileSyncedAt;
      }
    }

    Map<String, Object> aggregate = new LinkedHashMap<>();
    aggregate.put("totalProfiles", totalProfiles);
    aggregate.put("verifiedProfiles", verifiedProfiles);
    aggregate.put("pendingProfiles", pendingProfiles);
    aggregate.put("totalSolved", totalSolved);
    aggregate.put("contests", contests);
    aggregate.put("difficulty", difficulty);
    aggregate.put("activity", activity.entrySet().stream().map(entry -> {
      Map<String, Object> point = new LinkedHashMap<>();
      point.put("label", entry.getKey());
      point.put("count", entry.getValue());
      return point;
    }).toList());
    aggregate.put("topics", rankedPoints(topics));
    aggregate.put("platformBreakdown", rankedPoints(platformBreakdown));
    aggregate.put("lastSyncedAt", lastSyncedAt);
    return aggregate;
  }

  private List<Map<String, Object>> rankedPoints(Map<String, Long> values) {
    return values.entrySet().stream()
        .filter(entry -> entry.getValue() != null && entry.getValue() > 0)
        .sorted((left, right) -> Long.compare(right.getValue(), left.getValue()))
        .limit(8)
        .map(entry -> {
          Map<String, Object> point = new LinkedHashMap<>();
          point.put("label", entry.getKey());
          point.put("count", entry.getValue());
          return point;
        })
        .toList();
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> asMap(Object value) {
    return value instanceof Map<?, ?> map ? new LinkedHashMap<>((Map<String, Object>) map) : new LinkedHashMap<>();
  }

  private List<?> asList(Object value) {
    return value instanceof List<?> list ? list : new ArrayList<>();
  }

  private long asLong(Object value) {
    if (value instanceof Number number) return number.longValue();
    if (value instanceof String text && !text.isBlank()) {
      try {
        return Long.parseLong(text);
      } catch (NumberFormatException ignored) {
        return 0L;
      }
    }
    return 0L;
  }

  private ConnectedPlatformProfile findExistingProfile(User user, String platform, String username) {
    return user.getPlatformProfiles().stream()
        .filter(profile -> platform.equals(profile.getPlatform()))
        .filter(profile -> username.equalsIgnoreCase(profile.getUsername()))
        .findFirst()
        .orElse(null);
  }

  private ConnectedPlatformProfile findProfile(User user, String profileId) {
    return user.getPlatformProfiles().stream()
        .filter(profile -> profileId.equals(profile.getId()))
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform profile not found."));
  }

  private User findUser(String userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
  }

  private boolean isVerified(ConnectedPlatformProfile profile) {
    return "verified".equals(profile.getVerificationStatus());
  }

  private String normalize(String value) {
    String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    if (normalized.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Platform is required.");
    return normalized;
  }

  private String normalizeUsername(String value) {
    String username = value == null ? "" : value.trim();
    if (username.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required.");
    if (username.length() > 80) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is too long.");
    return username;
  }

  private String generateCode() {
    return "IQMS-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
  }

  private String toString(Instant instant) {
    return instant == null ? null : instant.toString();
  }
}
