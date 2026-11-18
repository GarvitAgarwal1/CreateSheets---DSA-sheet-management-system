package com.iqms.backend.cache;

import com.iqms.backend.cache.PublicReadCacheService.PublicCacheDiagnostic;
import java.util.List;
import java.util.Locale;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@ControllerAdvice
public class PublicReadCacheDiagnosticsAdvice implements ResponseBodyAdvice<Object> {
  private static final String X_CACHE = "X-Cache";
  private static final String X_CACHE_STORE = "X-Cache-Store";
  private static final String SERVER_TIMING = "Server-Timing";

  @Override
  public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
    return true;
  }

  @Override
  public Object beforeBodyWrite(
      Object body,
      MethodParameter returnType,
      MediaType selectedContentType,
      Class<? extends HttpMessageConverter<?>> selectedConverterType,
      ServerHttpRequest request,
      ServerHttpResponse response) {
    List<PublicCacheDiagnostic> diagnostics = PublicReadCacheService.currentDiagnostics();
    if (diagnostics.isEmpty()) {
      return body;
    }

    String status = summarizeStatus(diagnostics);
    long durationMicros = diagnostics.stream()
        .mapToLong(PublicCacheDiagnostic::durationMicros)
        .sum();
    double durationMillis = durationMicros / 1_000.0;

    response.getHeaders().set(X_CACHE, status);
    response.getHeaders().set(X_CACHE_STORE, "redis");
    response.getHeaders().add(SERVER_TIMING, "redis;desc=\"" + status + "\";dur=" + formatMillis(durationMillis));
    return body;
  }

  private String summarizeStatus(List<PublicCacheDiagnostic> diagnostics) {
    boolean hasError = diagnostics.stream().anyMatch(diagnostic -> "ERROR".equalsIgnoreCase(diagnostic.status()));
    if (hasError) {
      return "ERROR";
    }

    boolean hasBypass = diagnostics.stream().anyMatch(diagnostic -> "BYPASS".equalsIgnoreCase(diagnostic.status()));
    if (hasBypass) {
      return "BYPASS";
    }

    boolean hasMiss = diagnostics.stream().anyMatch(diagnostic -> "MISS".equalsIgnoreCase(diagnostic.status()));
    return hasMiss ? "MISS" : "HIT";
  }

  private String formatMillis(double durationMillis) {
    return String.format(Locale.ROOT, "%.3f", durationMillis);
  }
}
