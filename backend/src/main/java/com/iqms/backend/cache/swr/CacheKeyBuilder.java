package com.iqms.backend.cache.swr;

import org.springframework.stereotype.Component;

@Component
public class CacheKeyBuilder {

  /**
   * Security note: keys are always derived from authenticated user context.
   * Never accept a raw Redis key from clients, otherwise one user could read/write another user's cache.
   */
  public String userScopedKey(String userId, String resource) {
    return "user:" + userId + ":" + sanitize(resource);
  }

  private String sanitize(String input) {
    return input.replaceAll("[^a-zA-Z0-9:_-]", "_");
  }
}
