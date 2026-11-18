package com.iqms.backend.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.cache.swr")
public record SwrCacheProperties(
    long staleTtlSeconds,
    long hardTtlSeconds,
    long lockTtlSeconds,
    long refreshRetryDelayMillis,
    int refreshRetryCount,
    String lockPrefix
) {}
