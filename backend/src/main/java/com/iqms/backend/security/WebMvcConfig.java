package com.iqms.backend.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

  private final AuthInterceptor authInterceptor;
  private final NoIndexHeaderInterceptor noIndexHeaderInterceptor;
  private final RequestRateLimitInterceptor requestRateLimitInterceptor;

  public WebMvcConfig(
      AuthInterceptor authInterceptor,
      NoIndexHeaderInterceptor noIndexHeaderInterceptor,
      RequestRateLimitInterceptor requestRateLimitInterceptor) {
    this.authInterceptor = authInterceptor;
    this.noIndexHeaderInterceptor = noIndexHeaderInterceptor;
    this.requestRateLimitInterceptor = requestRateLimitInterceptor;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry
        .addInterceptor(noIndexHeaderInterceptor)
        .addPathPatterns("/api/**");

    registry
        .addInterceptor(authInterceptor)
        .addPathPatterns(
            "/api/profile/**",
            "/api/difficulty-categories/**",
            "/api/sheets/**",
            "/api/notifications/**",
            "/api/notification-preferences/**",
            "/api/premium/status",
            "/api/payments/razorpay/order",
            "/api/payments/razorpay/verify",
            "/api/teams/**",
            "/api/platform-stats/**",
            "/api/feedback/**")
        .excludePathPatterns(
            "/api/profile/shared/**",
            "/api/profile/public/**",
            "/api/sheets/featured",
            "/api/sheets/admin-catalog",
            "/api/sheets/public-catalog",
            "/api/sheets/shared/**",
            "/api/sheets/profile/shared/**");

    registry
        .addInterceptor(requestRateLimitInterceptor)
        .addPathPatterns(
            "/api/applications/**",
            "/api/feedback/**");
  }
}
