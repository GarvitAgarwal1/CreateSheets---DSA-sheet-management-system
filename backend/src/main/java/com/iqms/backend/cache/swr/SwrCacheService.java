package com.iqms.backend.cache.swr;

import com.iqms.backend.config.properties.SwrCacheProperties;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SwrCacheService {
  private static final Logger log = LoggerFactory.getLogger(SwrCacheService.class);

  private final RedisCacheService redisCacheService;
  private final CacheKeyBuilder cacheKeyBuilder;
  private final SwrCacheProperties properties;
  private final Executor swrExecutor;

  public SwrCacheService(
      RedisCacheService redisCacheService,
      CacheKeyBuilder cacheKeyBuilder,
      SwrCacheProperties properties,
      Executor swrExecutor
  ) {
    this.redisCacheService = redisCacheService;
    this.cacheKeyBuilder = cacheKeyBuilder;
    this.properties = properties;
    this.swrExecutor = swrExecutor;
  }

  public <T> SwrResponse<T> getOrLoad(String userId, String resource, Class<T> dataClass, Callable<T> fetcher) {
    String key = cacheKeyBuilder.userScopedKey(userId, resource);
    Optional<CachedPayload<T>> cached = redisCacheService.get(key, dataClass);

    if (cached.isPresent()) {
      log.info("cache hit key={}", key);
      CachedPayload<T> value = cached.get();
      boolean stale = Instant.now().toEpochMilli() >= value.metadata().staleAt();
      if (stale) {
        log.info("stale response served key={}", key);
      }
      triggerRevalidation(userId, resource, key, fetcher, 0);
      return new SwrResponse<>(value.data(), stale, value.metadata());
    }

    log.info("cache miss key={}", key);
    T fresh = loadWithLock(userId, resource, key, dataClass, fetcher);
    CacheMetadata metadata = buildMetadata();
    return new SwrResponse<>(fresh, false, metadata);
  }

  private <T> T loadWithLock(String userId, String resource, String key, Class<T> dataClass, Callable<T> fetcher) {
    String lockKey = properties.lockPrefix() + ":" + key;
    String lockValue = UUID.randomUUID().toString();
    boolean lockAcquired = redisCacheService.tryAcquireLock(lockKey, lockValue, Duration.ofSeconds(properties.lockTtlSeconds()));

    if (!lockAcquired) {
      Optional<CachedPayload<T>> cachedRetry = redisCacheService.get(key, dataClass);
      if (cachedRetry.isPresent()) {
        return cachedRetry.get().data();
      }
    }

    try {
      T fresh = fetcher.call();
      saveCache(key, fresh);
      return fresh;
    } catch (Exception ex) {
      log.error("API failure on cache miss key={}", key, ex);
      throw new RuntimeException("Unable to fetch resource", ex);
    } finally {
      if (lockAcquired) {
        redisCacheService.releaseLock(lockKey);
      }
    }
  }

  private <T> void triggerRevalidation(String userId, String resource, String key, Callable<T> fetcher, int attempt) {
    CompletableFuture.runAsync(() -> {
      String lockKey = properties.lockPrefix() + ":" + key;
      String lockValue = UUID.randomUUID().toString();
      boolean lockAcquired = redisCacheService.tryAcquireLock(lockKey, lockValue, Duration.ofSeconds(properties.lockTtlSeconds()));
      if (!lockAcquired) {
        return;
      }
      try {
        T fresh = fetcher.call();
        saveCache(key, fresh);
        log.info("cache refreshed key={}", key);
      } catch (Exception ex) {
        log.error("API failure during background refresh key={} attempt={}", key, attempt, ex);
        if (attempt < properties.refreshRetryCount()) {
          try {
            Thread.sleep(properties.refreshRetryDelayMillis());
          } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
          }
          triggerRevalidation(userId, resource, key, fetcher, attempt + 1);
        }
      } finally {
        redisCacheService.releaseLock(lockKey);
      }
    }, swrExecutor);
  }

  private <T> void saveCache(String key, T data) {
    CacheMetadata metadata = buildMetadata();
    CachedPayload<T> payload = new CachedPayload<>(data, metadata);
    redisCacheService.set(key, payload, Duration.ofSeconds(properties.hardTtlSeconds()));
  }

  private CacheMetadata buildMetadata() {
    long now = Instant.now().toEpochMilli();
    return new CacheMetadata(
        now,
        now + Duration.ofSeconds(properties.staleTtlSeconds()).toMillis(),
        now + Duration.ofSeconds(properties.hardTtlSeconds()).toMillis()
    );
  }
}
