package com.iqms.backend.controller;

import com.iqms.backend.cache.swr.SwrCacheService;
import com.iqms.backend.cache.swr.SwrResponse;
import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.service.ExternalResourceService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/swr")
public class SwrCacheDemoController {

  private final CurrentUser currentUser;
  private final SwrCacheService swrCacheService;
  private final ExternalResourceService externalResourceService;

  public SwrCacheDemoController(
      CurrentUser currentUser,
      SwrCacheService swrCacheService,
      ExternalResourceService externalResourceService
  ) {
    this.currentUser = currentUser;
    this.swrCacheService = swrCacheService;
    this.externalResourceService = externalResourceService;
  }

  @GetMapping("/resource")
  public SwrResponse<String> getResource(
      HttpServletRequest request,
      @RequestParam("resource") String resource
  ) {
    String userId = currentUser.getUserId(request);

    // Resource name can come from request, but Redis keys never come from clients directly.
    // They are always composed from authenticated user identity + resource identifier.
    return swrCacheService.getOrLoad(
        userId,
        resource,
        String.class,
        () -> externalResourceService.fetchResource(userId, resource)
    );
  }
}
