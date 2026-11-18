package com.iqms.backend.cache;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iqms.backend.model.Sheet;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.function.Predicate;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.stereotype.Service;

@Service
public class PrivateSheetCacheService {
  private static final Logger log = LoggerFactory.getLogger(PrivateSheetCacheService.class);
  private static final String PRIVATE_PREFIX = "createsheets:private:v1:";
  private static final TypeReference<List<Sheet>> SHEET_LIST_TYPE = new TypeReference<>() {};
  private static final TypeReference<Sheet> SHEET_TYPE = new TypeReference<>() {};

  private final RedisOperations<String, String> redisTemplate;
  private final ObjectMapper objectMapper;
  private final Duration defaultTtl;

  public PrivateSheetCacheService(
      RedisOperations<String, String> redisTemplate,
      ObjectMapper objectMapper,
      @Value("${app.cache.private-ttl-seconds:120}") long privateTtlSeconds) {
    this.redisTemplate = redisTemplate;
    this.objectMapper = objectMapper;
    this.defaultTtl = Duration.ofSeconds(Math.max(1, privateTtlSeconds));
  }

  public List<Sheet> getAccessibleSheetList(String userId, Supplier<List<Sheet>> loader) {
    String key = accessibleSheetListKey(userId);
    long startedNanos = System.nanoTime();
    CacheLookup<List<Sheet>> cached = lookup(key, SHEET_LIST_TYPE);
    if (cached.value().isPresent()) {
      PublicReadCacheService.recordDiagnostic(key, "HIT", startedNanos);
      return cached.value().get();
    }

    try {
      List<Sheet> value = loader.get();
      boolean stored = set(key, value);
      PublicReadCacheService.recordDiagnostic(key, cached.errored() || !stored ? "BYPASS" : "MISS", startedNanos);
      return value;
    } catch (RuntimeException ex) {
      PublicReadCacheService.recordDiagnostic(key, "ERROR", startedNanos);
      throw ex;
    }
  }

  public Sheet getAccessibleSheet(
      String userId,
      String sheetId,
      Predicate<Sheet> accessValidator,
      Supplier<Sheet> loader) {
    String key = accessibleSheetKey(userId, sheetId);
    long startedNanos = System.nanoTime();
    CacheLookup<Sheet> cached = lookup(key, SHEET_TYPE);
    if (cached.value().isPresent()) {
      Sheet sheet = cached.value().get();
      if (accessValidator.test(sheet)) {
        PublicReadCacheService.recordDiagnostic(key, "HIT", startedNanos);
        return sheet;
      }
      evict(key);
    }

    try {
      Sheet value = loader.get();
      boolean stored = set(key, value);
      PublicReadCacheService.recordDiagnostic(key, cached.errored() || !stored ? "BYPASS" : "MISS", startedNanos);
      return value;
    } catch (RuntimeException ex) {
      PublicReadCacheService.recordDiagnostic(key, "ERROR", startedNanos);
      throw ex;
    }
  }

  public void cacheAccessibleSheetForUser(String userId, Sheet sheet) {
    if (sheet == null || sheet.getId() == null || userId == null || userId.isBlank()) {
      return;
    }
    set(accessibleSheetKey(userId, sheet.getId()), sheet);
  }

  public void evictSheetAccessCaches(Sheet sheet) {
    if (sheet == null) {
      return;
    }
    evictSheetAccessCaches(sheet.getId(), accessUserIds(sheet));
  }

  public void evictSheetAccessCaches(String sheetId, Collection<String> userIds) {
    if (sheetId == null || sheetId.isBlank()) {
      return;
    }
    evictSheetDetailForAllUsers(sheetId);
    evictUserSheetLists(userIds);
  }

  public void evictUserSheetLists(Collection<String> userIds) {
    if (userIds == null || userIds.isEmpty()) {
      return;
    }
    List<String> keys = userIds.stream()
        .filter(userId -> userId != null && !userId.isBlank())
        .map(this::accessibleSheetListKey)
        .distinct()
        .toList();
    evict(keys.toArray(String[]::new));
  }

  private Set<String> accessUserIds(Sheet sheet) {
    Set<String> userIds = new HashSet<>();
    if (sheet.getOwnerId() != null && !sheet.getOwnerId().isBlank()) {
      userIds.add(sheet.getOwnerId());
    }
    if (sheet.getCollaborators() != null) {
      for (Sheet.Collaborator collaborator : sheet.getCollaborators()) {
        if (collaborator != null && collaborator.getUserId() != null && !collaborator.getUserId().isBlank()) {
          userIds.add(collaborator.getUserId());
        }
      }
    }
    return userIds;
  }

  private void evictSheetDetailForAllUsers(String sheetId) {
    evictByPattern(PRIVATE_PREFIX + "user:*:sheet:" + normalizeKeySegment(sheetId));
  }

  private <T> CacheLookup<T> lookup(String key, TypeReference<T> typeReference) {
    try {
      String value = redisTemplate.opsForValue().get(key);
      if (value == null) {
        return new CacheLookup<>(Optional.empty(), false);
      }
      return new CacheLookup<>(Optional.of(objectMapper.readValue(value, typeReference)), false);
    } catch (Exception ex) {
      log.warn("Private sheet cache read failed for key={}", key, ex);
      return new CacheLookup<>(Optional.empty(), true);
    }
  }

  private boolean set(String key, Object value) {
    if (value == null) {
      return false;
    }
    try {
      redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(value), defaultTtl);
      return true;
    } catch (JsonProcessingException ex) {
      log.warn("Private sheet cache serialization failed for key={}", key, ex);
    } catch (Exception ex) {
      log.warn("Private sheet cache write failed for key={}", key, ex);
    }
    return false;
  }

  private void evict(String... keys) {
    try {
      List<String> nonBlankKeys = new ArrayList<>();
      for (String key : keys) {
        if (key != null && !key.isBlank()) {
          nonBlankKeys.add(key);
        }
      }
      if (!nonBlankKeys.isEmpty()) {
        redisTemplate.delete(nonBlankKeys);
      }
    } catch (Exception ex) {
      log.warn("Private sheet cache eviction failed", ex);
    }
  }

  private void evictByPattern(String pattern) {
    try (Cursor<String> cursor = redisTemplate.scan(
        ScanOptions.scanOptions().match(pattern).count(100).build())) {
      List<String> batch = new ArrayList<>();
      while (cursor.hasNext()) {
        batch.add(cursor.next());
        if (batch.size() >= 100) {
          redisTemplate.delete(batch);
          batch.clear();
        }
      }
      if (!batch.isEmpty()) {
        redisTemplate.delete(batch);
      }
    } catch (Exception ex) {
      log.warn("Private sheet cache pattern eviction failed for pattern={}", pattern, ex);
    }
  }

  private String accessibleSheetListKey(String userId) {
    return PRIVATE_PREFIX + "user:" + normalizeKeySegment(userId) + ":sheets:list";
  }

  private String accessibleSheetKey(String userId, String sheetId) {
    return PRIVATE_PREFIX + "user:" + normalizeKeySegment(userId) + ":sheet:" + normalizeKeySegment(sheetId);
  }

  private String normalizeKeySegment(String value) {
    if (value == null) {
      return "";
    }
    return value
        .trim()
        .toLowerCase(Locale.ROOT)
        .replaceAll("[^a-z0-9._-]+", "-")
        .replaceAll("(^-|-$)", "");
  }

  private record CacheLookup<T>(Optional<T> value, boolean errored) {}
}
