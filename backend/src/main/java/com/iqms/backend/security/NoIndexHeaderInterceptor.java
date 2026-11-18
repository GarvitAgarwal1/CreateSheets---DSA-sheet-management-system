package com.iqms.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class NoIndexHeaderInterceptor implements HandlerInterceptor {
  static final String X_ROBOTS_TAG = "noindex, nofollow, nosnippet";

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    response.setHeader("X-Robots-Tag", X_ROBOTS_TAG);
    return true;
  }
}
