package com.iqms.backend.cache.swr;

public record CachedPayload<T>(T data, CacheMetadata metadata) {}
