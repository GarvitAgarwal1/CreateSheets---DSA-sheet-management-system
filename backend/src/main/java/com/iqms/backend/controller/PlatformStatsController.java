package com.iqms.backend.controller;

import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.service.PlatformProfileService;
import com.iqms.backend.service.PlatformStatsService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/platform-stats")
public class PlatformStatsController {
  private final PlatformStatsService platformStatsService;
  private final PlatformProfileService platformProfileService;
  private final CurrentUser currentUser;

  public PlatformStatsController(
      PlatformStatsService platformStatsService,
      PlatformProfileService platformProfileService,
      CurrentUser currentUser) {
    this.platformStatsService = platformStatsService;
    this.platformProfileService = platformProfileService;
    this.currentUser = currentUser;
  }

  @GetMapping("/profiles")
  public Map<String, Object> profiles(HttpServletRequest request) {
    return platformProfileService.dashboard(currentUser.getUserId(request));
  }

  @PostMapping("/verification")
  public Map<String, Object> requestVerification(HttpServletRequest request, @RequestBody(required = false) Map<String, String> body) {
    return platformProfileService.requestVerification(currentUser.getUserId(request), body);
  }

  @PostMapping("/profiles/{profileId}/verify")
  public Map<String, Object> verify(HttpServletRequest request, @PathVariable String profileId) {
    return platformProfileService.verify(currentUser.getUserId(request), profileId);
  }

  @PostMapping("/sync")
  public Map<String, Object> sync(HttpServletRequest request) {
    return platformProfileService.syncVerified(currentUser.getUserId(request));
  }

  @DeleteMapping("/profiles/{profileId}")
  public Map<String, Object> delete(HttpServletRequest request, @PathVariable String profileId) {
    return platformProfileService.deleteProfile(currentUser.getUserId(request), profileId);
  }

  @GetMapping("/{platform}")
  public Map<String, Object> fetch(@PathVariable String platform, @RequestParam String username) {
    return platformStatsService.fetchStats(platform.toLowerCase(), username);
  }
}
