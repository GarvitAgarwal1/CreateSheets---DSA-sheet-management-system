package com.iqms.backend.cache.swr;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisCacheService {
  private static final Logger log = LoggerFactory.getLogger(RedisCacheService.class);

  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;

  public RedisCacheService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
    this.redisTemplate = redisTemplate;
    this.objectMapper = objectMapper;
  }

  public <T> Optional<CachedPayload<T>> get(String key, Class<T> dataClass) {
    try {
      String value = redisTemplate.opsForValue().get(key);
      if (value == null) {
        return Optional.empty();
      }
      JavaType type = objectMapper.getTypeFactory().constructParametricType(CachedPayload.class, dataClass);
      return Optional.of(objectMapper.readValue(value, type));
    } catch (Exception ex) {
      log.error("Failed to deserialize cache for key={}", key, ex);
      return Optional.empty();
    }
  }

  public <T> void set(String key, CachedPayload<T> payload, Duration ttl) {
    try {
      redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(payload), ttl);
    } catch (JsonProcessingException ex) {
      log.error("Failed to serialize cache for key={}", key, ex);
    }
  }

  public boolean tryAcquireLock(String lockKey, String lockValue, Duration ttl) {
    Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, lockValue, ttl);
    return Boolean.TRUE.equals(acquired);
  }

  public void releaseLock(String lockKey) {
    redisTemplate.delete(lockKey);
  }
}
