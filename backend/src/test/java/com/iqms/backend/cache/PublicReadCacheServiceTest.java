package com.iqms.backend.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.mock.web.MockHttpServletResponse;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PublicReadCacheServiceTest {
  @Mock private RedisOperations<String, String> redisTemplate;
  @Mock private ValueOperations<String, String> valueOperations;

  private PublicReadCacheService service;

  @BeforeEach
  void setUp() {
    when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    service = new PublicReadCacheService(redisTemplate, new ObjectMapper(), 300);
    PublicReadCacheService.clearDiagnostics();
  }

  @AfterEach
  void tearDown() {
    PublicReadCacheService.clearDiagnostics();
  }

  @Test
  void getOrLoadReturnsRedisValueAndRecordsHit() {
    when(valueOperations.get("cache:key")).thenReturn("[\"cached\"]");

    List<String> result = service.getOrLoad(
        "cache:key",
        new TypeReference<List<String>>() {},
        () -> List.of("fresh"));

    assertThat(result).containsExactly("cached");
    assertThat(PublicReadCacheService.currentDiagnostics())
        .singleElement()
        .satisfies(diagnostic -> {
          assertThat(diagnostic.key()).isEqualTo("cache:key");
          assertThat(diagnostic.status()).isEqualTo("HIT");
        });
    verify(valueOperations, never()).set(anyString(), anyString(), any(Duration.class));
  }

  @Test
  void getOrLoadStoresFreshValueAndRecordsMiss() {
    when(valueOperations.get("cache:key")).thenReturn(null);

    List<String> result = service.getOrLoad(
        "cache:key",
        new TypeReference<List<String>>() {},
        () -> List.of("fresh"));

    assertThat(result).containsExactly("fresh");
    assertThat(PublicReadCacheService.currentDiagnostics())
        .singleElement()
        .satisfies(diagnostic -> assertThat(diagnostic.status()).isEqualTo("MISS"));
    verify(valueOperations).set(eq("cache:key"), eq("[\"fresh\"]"), any(Duration.class));
  }

  @Test
  void getOrLoadFallsBackToLoaderAndRecordsBypassWhenRedisReadFails() {
    when(valueOperations.get("cache:key")).thenThrow(new RuntimeException("redis down"));

    List<String> result = service.getOrLoad(
        "cache:key",
        new TypeReference<List<String>>() {},
        () -> List.of("fresh"));

    assertThat(result).containsExactly("fresh");
    assertThat(PublicReadCacheService.currentDiagnostics())
        .singleElement()
        .satisfies(diagnostic -> assertThat(diagnostic.status()).isEqualTo("BYPASS"));
  }

  @Test
  void getOrLoadRecordsBypassWhenRedisWriteFails() {
    when(valueOperations.get("cache:key")).thenReturn(null);
    doThrow(new RuntimeException("redis write failed"))
        .when(valueOperations)
        .set(eq("cache:key"), anyString(), any(Duration.class));

    List<String> result = service.getOrLoad(
        "cache:key",
        new TypeReference<List<String>>() {},
        () -> List.of("fresh"));

    assertThat(result).containsExactly("fresh");
    assertThat(PublicReadCacheService.currentDiagnostics())
        .singleElement()
        .satisfies(diagnostic -> assertThat(diagnostic.status()).isEqualTo("BYPASS"));
  }

  @Test
  void responseAdviceAddsRedisCacheDiagnosticHeaders() {
    when(valueOperations.get("cache:key")).thenReturn("[\"cached\"]");
    service.getOrLoad(
        "cache:key",
        new TypeReference<List<String>>() {},
        () -> List.of("fresh"));

    MockHttpServletResponse servletResponse = new MockHttpServletResponse();
    ServletServerHttpResponse response = new ServletServerHttpResponse(servletResponse);
    PublicReadCacheDiagnosticsAdvice advice = new PublicReadCacheDiagnosticsAdvice();

    advice.beforeBodyWrite(
        List.of("cached"),
        null,
        MediaType.APPLICATION_JSON,
        null,
        null,
        response);

    assertThat(response.getHeaders().getFirst("X-Cache")).isEqualTo("HIT");
    assertThat(response.getHeaders().getFirst("X-Cache-Store")).isEqualTo("redis");
    assertThat(response.getHeaders().getFirst("Server-Timing")).contains("redis;desc=\"HIT\";dur=");
  }
}
