package com.iqms.backend.cache.swr;

public record SwrResponse<T>(T data, boolean stale, CacheMetadata metadata) {}
