package com.iqms.backend.cache;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.stereotype.Service;

@Service
public class PublicReadCacheService {
  private static final Logger log = LoggerFactory.getLogger(PublicReadCacheService.class);
  private static final ThreadLocal<List<PublicCacheDiagnostic>> REQUEST_DIAGNOSTICS =
      ThreadLocal.withInitial(ArrayList::new);

  public static final String FEATURED_SHEETS_KEY = "createsheets:public:v1:sheets:featured";
  public static final String ADMIN_CATALOG_KEY = "createsheets:public:v1:sheets:admin-catalog";
  public static final String PUBLIC_CATALOG_KEY = "createsheets:public:v2:sheets:catalog";
  public static final String PUBLIC_SHEETS_SITEMAP_KEY = "createsheets:public:v1:sitemap:public-sheets";
  private static final String PROFILE_PREFIX = "createsheets:public:v1:profile:";

  private final RedisOperations<String, String> redisTemplate;
  private final ObjectMapper objectMapper;
  private final Duration defaultTtl;

  public PublicReadCacheService(
      RedisOperations<String, String> redisTemplate,
      ObjectMapper objectMapper,
      @Value("${app.cache.public-ttl-seconds:300}") long publicTtlSeconds) {
    this.redisTemplate = redisTemplate;
    this.objectMapper = objectMapper;
    this.defaultTtl = Duration.ofSeconds(Math.max(1, publicTtlSeconds));
  }

  public <T> T getOrLoad(String key, TypeReference<T> typeReference, Supplier<T> loader) {
    return getOrLoad(key, typeReference, loader, defaultTtl);
  }

  public <T> T getOrLoad(
      String key,
      TypeReference<T> typeReference,
      Supplier<T> loader,
      Duration ttl) {
    long startedNanos = System.nanoTime();
    CacheLookup<T> cached = lookup(key, typeReference);
    if (cached.value().isPresent()) {
      recordDiagnostic(key, "HIT", startedNanos);
      return cached.value().get();
    }

    try {
      T value = loader.get();
      boolean stored = set(key, value, ttl == null ? defaultTtl : ttl);
      recordDiagnostic(key, cached.errored() || !stored ? "BYPASS" : "MISS", startedNanos);
      return value;
    } catch (RuntimeException ex) {
      recordDiagnostic(key, "ERROR", startedNanos);
      throw ex;
    }
  }

  public <T> Optional<T> get(String key, TypeReference<T> typeReference) {
    return lookup(key, typeReference).value();
  }

  private <T> CacheLookup<T> lookup(String key, TypeReference<T> typeReference) {
    try {
      String value = redisTemplate.opsForValue().get(key);
      if (value == null) {
        return new CacheLookup<>(Optional.empty(), false);
      }
      return new CacheLookup<>(Optional.of(objectMapper.readValue(value, typeReference)), false);
    } catch (Exception ex) {
      log.warn("Public cache read failed for key={}", key, ex);
      return new CacheLookup<>(Optional.empty(), true);
    }
  }

  public boolean set(String key, Object value, Duration ttl) {
    if (value == null) {
      return false;
    }
    try {
      redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(value), ttl);
      return true;
    } catch (JsonProcessingException ex) {
      log.warn("Public cache serialization failed for key={}", key, ex);
    } catch (Exception ex) {
      log.warn("Public cache write failed for key={}", key, ex);
    }
    return false;
  }

  public void evictCatalogCaches() {
    evict(FEATURED_SHEETS_KEY, ADMIN_CATALOG_KEY, PUBLIC_CATALOG_KEY, PUBLIC_SHEETS_SITEMAP_KEY);
  }

  public void evictOwnerPublicCaches(String username) {
    String ownerSegment = normalizeKeySegment(username);
    if (ownerSegment.isBlank()) {
      return;
    }
    evictByPrefix(profileKeyPrefix(ownerSegment));
  }

  public void evict(String... keys) {
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
      log.warn("Public cache eviction failed", ex);
    }
  }

  public void evictByPrefix(String prefix) {
    if (prefix == null || prefix.isBlank()) {
      return;
    }

    try (Cursor<String> cursor = redisTemplate.scan(
        ScanOptions.scanOptions().match(prefix + "*").count(100).build())) {
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
      log.warn("Public cache prefix eviction failed for prefix={}", prefix, ex);
    }
  }

  public String publicProfileKey(String username) {
    return profileKeyPrefix(username) + "summary";
  }

  public String publicSheetKey(String username, String sheetSlug) {
    return profileKeyPrefix(username) + "sheet:" + normalizeKeySegment(sheetSlug);
  }

  private String profileKeyPrefix(String username) {
    return PROFILE_PREFIX + normalizeKeySegment(username) + ":";
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

  public static List<PublicCacheDiagnostic> currentDiagnostics() {
    return List.copyOf(REQUEST_DIAGNOSTICS.get());
  }

  public static void clearDiagnostics() {
    REQUEST_DIAGNOSTICS.remove();
  }

  static void recordDiagnostic(String key, String status, long startedNanos) {
    long durationMicros = Math.max(0L, (System.nanoTime() - startedNanos) / 1_000L);
    REQUEST_DIAGNOSTICS.get().add(new PublicCacheDiagnostic(key, status, durationMicros));
  }

  private record CacheLookup<T>(Optional<T> value, boolean errored) {}

  public record PublicCacheDiagnostic(String key, String status, long durationMicros) {}
}
