package com.iqms.backend.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

  private static final List<String> ALLOWED_METHODS =
      List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");

  @Value("${app.cors.allowed-origins:https://www.createsheets.com,https://createsheets.com}")
  private String allowedOrigins;

  @Value("${app.cors.allowed-origin-patterns:}")
  private String allowedOriginPatterns;

  @Bean
  public org.springframework.web.filter.CorsFilter corsFilter() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowCredentials(true);
    config.setAllowedOrigins(splitCsv(allowedOrigins));

    List<String> originPatterns = splitCsv(allowedOriginPatterns);
    if (!originPatterns.isEmpty()) {
      config.setAllowedOriginPatterns(originPatterns);
    }

    config.setAllowedMethods(ALLOWED_METHODS);
    config.setAllowedHeaders(List.of("*"));
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return new org.springframework.web.filter.CorsFilter(source);
  }

  private static List<String> splitCsv(String csv) {
    if (csv == null || csv.isBlank()) {
      return List.of();
    }

    return Arrays.stream(csv.split(","))
        .map(String::trim)
        .filter(value -> !value.isEmpty())
        .distinct()
        .toList();
  }
}
