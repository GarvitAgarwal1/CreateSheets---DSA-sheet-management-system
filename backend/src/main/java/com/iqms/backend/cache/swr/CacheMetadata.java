package com.iqms.backend.cache.swr;

public record CacheMetadata(long cachedAt, long staleAt, long expiresAt) {}
