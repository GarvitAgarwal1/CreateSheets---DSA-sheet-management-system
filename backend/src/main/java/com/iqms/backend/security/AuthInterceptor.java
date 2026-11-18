package com.iqms.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.iqms.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

  public static final String REQUEST_USER_ID = "authenticatedUserId";
  private final TokenService tokenService;
  private final UserRepository userRepository;

  public AuthInterceptor(TokenService tokenService, UserRepository userRepository) {
    this.tokenService = tokenService;
    this.userRepository = userRepository;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
      throws Exception {
    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
      return true;
    }

    String authHeader = request.getHeader("Authorization");
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      response.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing authorization token.");
      return false;
    }

    String token = authHeader.substring("Bearer ".length());
    return tokenService
        .validateAndGetUserId(token)
        .map(userId -> {
          if (!userRepository.existsById(userId)) {
            try {
              response.sendError(HttpStatus.UNAUTHORIZED.value(), "Session no longer valid. Please sign in again.");
            } catch (Exception ignored) {
              // no-op
            }
            return false;
          }
          request.setAttribute(REQUEST_USER_ID, userId);
          return true;
        })
        .orElseGet(() -> {
          try {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid or expired authorization token.");
          } catch (Exception ignored) {
            // no-op
          }
          return false;
        });
  }
}
