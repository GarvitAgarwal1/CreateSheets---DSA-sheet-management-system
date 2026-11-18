package com.iqms.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.iqms.backend.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

@ExtendWith(MockitoExtension.class)
class AuthInterceptorTest {

  @Mock private TokenService tokenService;
  @Mock private UserRepository userRepository;

  @Test
  void preHandleAllowsValidTokenForExistingUser() throws Exception {
    AuthInterceptor interceptor = new AuthInterceptor(tokenService, userRepository);
    MockHttpServletRequest request = new MockHttpServletRequest();
    MockHttpServletResponse response = new MockHttpServletResponse();
    request.addHeader("Authorization", "Bearer valid-token");

    when(tokenService.validateAndGetUserId("valid-token")).thenReturn(Optional.of("user-1"));
    when(userRepository.existsById("user-1")).thenReturn(true);

    boolean allowed = interceptor.preHandle(request, response, new Object());

    assertThat(allowed).isTrue();
    assertThat(request.getAttribute(AuthInterceptor.REQUEST_USER_ID)).isEqualTo("user-1");
  }

  @Test
  void preHandleRejectsTokenForDeletedUser() throws Exception {
    AuthInterceptor interceptor = new AuthInterceptor(tokenService, userRepository);
    MockHttpServletRequest request = new MockHttpServletRequest();
    MockHttpServletResponse response = new MockHttpServletResponse();
    request.addHeader("Authorization", "Bearer valid-token");

    when(tokenService.validateAndGetUserId("valid-token")).thenReturn(Optional.of("user-404"));
    when(userRepository.existsById("user-404")).thenReturn(false);

    boolean allowed = interceptor.preHandle(request, response, new Object());

    assertThat(allowed).isFalse();
    assertThat(response.getStatus()).isEqualTo(401);
    assertThat(response.getErrorMessage()).isEqualTo("Session no longer valid. Please sign in again.");
    assertThat(request.getAttribute(AuthInterceptor.REQUEST_USER_ID)).isNull();
  }

  @Test
  void preHandleRejectsInvalidTokenWithoutUserLookup() throws Exception {
    AuthInterceptor interceptor = new AuthInterceptor(tokenService, userRepository);
    MockHttpServletRequest request = new MockHttpServletRequest();
    MockHttpServletResponse response = new MockHttpServletResponse();
    request.addHeader("Authorization", "Bearer invalid-token");

    when(tokenService.validateAndGetUserId("invalid-token")).thenReturn(Optional.empty());

    boolean allowed = interceptor.preHandle(request, response, new Object());

    assertThat(allowed).isFalse();
    assertThat(response.getStatus()).isEqualTo(401);
    assertThat(response.getErrorMessage()).isEqualTo("Invalid or expired authorization token.");
    verifyNoInteractions(userRepository);
  }
}
