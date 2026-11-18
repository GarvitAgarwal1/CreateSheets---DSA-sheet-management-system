package com.iqms.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class NoIndexHeaderInterceptorTest {
  @Test
  void addsXRobotsNoindexHeader() {
    MockHttpServletResponse response = new MockHttpServletResponse();

    boolean allowed = new NoIndexHeaderInterceptor()
        .preHandle(new MockHttpServletRequest("GET", "/api/health"), response, new Object());

    assertThat(allowed).isTrue();
    assertThat(response.getHeader("X-Robots-Tag")).isEqualTo("noindex, nofollow, nosnippet");
  }
}
