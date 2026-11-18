package com.iqms.backend.profile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.iqms.backend.cache.PublicReadCacheService;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.service.SheetService;
import com.iqms.backend.service.PremiumAccessService;
import com.iqms.backend.service.PlatformProfileService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProfileShareService {

  private final UserRepository userRepository;
  private final SheetService sheetService;
  private final PremiumAccessService premiumAccessService;
  private final PlatformProfileService platformProfileService;
  private final PublicReadCacheService publicReadCacheService;
  private final SheetRepository sheetRepository;
  private final String adminUsername;

  public ProfileShareService(
      UserRepository userRepository,
      SheetService sheetService,
      PremiumAccessService premiumAccessService,
      PlatformProfileService platformProfileService,
      PublicReadCacheService publicReadCacheService,
      SheetRepository sheetRepository,
      @Value("${app.admin.username:CreateSheets}") String adminUsername) {
    this.userRepository = userRepository;
    this.sheetService = sheetService;
    this.premiumAccessService = premiumAccessService;
    this.platformProfileService = platformProfileService;
    this.publicReadCacheService = publicReadCacheService;
    this.sheetRepository = sheetRepository;
    this.adminUsername = adminUsername;
  }

  public Map<String, Object> getSharedProfile(String profileShareId) {
    User user = userRepository
        .findByProfileShareId(profileShareId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared profile not found."));

    List<Sheet> ownerSheets = sheetService.listSheetsForOwner(user.getId());
    List<Sheet> publicSheets = ownerSheets.stream().filter(Sheet::isPublic).toList();

    List<Map<String, Object>> sheets = publicSheets.stream()
        .map(sheet -> {
          Map<String, Object> sharedSheet = new LinkedHashMap<>();
          sharedSheet.put("id", sheet.getId());
          sharedSheet.put("title", sheet.getTitle());
          sharedSheet.put("shareId", sheet.getShareId());
          sharedSheet.put("updatedAt", sheet.getUpdatedAt() == null ? null : sheet.getUpdatedAt().toString());
          sharedSheet.put("downloadedByUsernames", sheet.getDownloadedByUsernames());
          sharedSheet.put("copiedByUsernames", sheet.getCopiedByUsernames());
          sharedSheet.put("parentSheetId", sheet.getParentSheetId());
          sharedSheet.put("remixSourceOwnerId", sheet.getRemixSourceOwnerId());
          return sharedSheet;
        })
        .toList();

    Map<String, Object> profile = buildPublicProfile(user, publicSheets.size());
    profile.put("profileShareId", user.getProfileShareId());
    profile.put("sheets", sheets);
    return profile;
  }

  public Map<String, Object> getPublicProfile(String username) {
    return publicReadCacheService.getOrLoad(
        publicReadCacheService.publicProfileKey(username),
        new TypeReference<Map<String, Object>>() {},
        () -> buildPublicProfilePayload(username, null));
  }

  public Map<String, Object> getPublicProfileForViewer(String username, String viewerUserId) {
    if (viewerUserId == null) {
      return getPublicProfile(username);
    }

    return buildPublicProfilePayload(username, viewerUserId);
  }

  private Map<String, Object> buildPublicProfilePayload(String username, String viewerUserId) {
    User user = userRepository
        .findByUsername(username.toLowerCase())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared profile not found."));

    List<Sheet> ownerSheets = sheetService.listSheetsForOwner(user.getId());
    List<Sheet> publicSheets = ownerSheets.stream().filter(Sheet::isPublic).toList();

    List<Map<String, Object>> sheets = publicSheets.stream()
        .map(sheet -> {
          Map<String, Object> sharedSheet = new LinkedHashMap<>();
          sharedSheet.put("id", sheet.getId());
          sharedSheet.put("title", sheet.getTitle());
          sharedSheet.put("sheetSlug", toSlug(sheet.getTitle()));
          sharedSheet.put("shareId", sheet.getShareId());
          sharedSheet.put("updatedAt", sheet.getUpdatedAt() == null ? null : sheet.getUpdatedAt().toString());
          sharedSheet.put("downloadedByUsernames", sheet.getDownloadedByUsernames());
          sharedSheet.put("copiedByUsernames", sheet.getCopiedByUsernames());
          sharedSheet.put("parentSheetId", sheet.getParentSheetId());
          sharedSheet.put("remixSourceOwnerId", sheet.getRemixSourceOwnerId());
          return sharedSheet;
        })
        .toList();

    Map<String, Object> profile = buildPublicProfile(user, publicSheets.size());
    if (viewerUserId != null) {
      boolean viewerIsOwner = viewerUserId.equals(user.getId());
      boolean viewerFollowsProfile = user.getFollowerUserIds() != null && user.getFollowerUserIds().contains(viewerUserId);
      boolean profileFollowsViewer = userRepository
          .findById(viewerUserId)
          .map(viewer -> viewer.getFollowerUserIds() != null && viewer.getFollowerUserIds().contains(user.getId()))
          .orElse(false);

      profile.put("viewerIsOwner", viewerIsOwner);
      profile.put("viewerFollowsProfile", viewerFollowsProfile);
      profile.put("profileFollowsViewer", profileFollowsViewer);
    }
    profile.put("sheets", sheets);
    return profile;
  }

  public Sheet getPublicSheet(String username, String sheetSlug) {
    return publicReadCacheService.getOrLoad(
        publicReadCacheService.publicSheetKey(username, sheetSlug),
        new TypeReference<Sheet>() {},
        () -> loadPublicSheet(username, sheetSlug));
  }

  private Sheet loadPublicSheet(String username, String sheetSlug) {
    String requestedUsername = username == null ? "" : username.trim();
    String requestedSlug = sheetSlug == null ? "" : sheetSlug.trim().toLowerCase(Locale.ROOT);
    User user = userRepository
        .findByUsername(requestedUsername.toLowerCase(Locale.ROOT))
        .orElse(null);

    if (user != null) {
      Sheet ownerSheet = sheetService.listSheetsForOwner(user.getId()).stream()
          .filter(Sheet::isPublic)
          .filter(found -> toSlug(found.getTitle()).equals(requestedSlug))
          .findFirst()
          .orElse(null);
      if (ownerSheet != null) {
        return ownerSheet;
      }
    }

    if (isAdminUsername(requestedUsername)) {
      return sheetRepository.findPublicCatalogSheets(Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
          .filter(this::isPublicCatalogSheet)
          .filter(found -> toSlug(found.getTitle()).equals(requestedSlug))
          .findFirst()
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared sheet not found."));
    }

    if (user == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared profile not found.");
    }
    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared sheet not found.");
  }

  private String toSlug(String input) {
    if (input == null || input.isBlank()) return "untitled-sheet";
    String normalized = input.trim().toLowerCase(Locale.ROOT);
    String slug = normalized.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    return slug.isBlank() ? "untitled-sheet" : slug;
  }

  private boolean isAdminUsername(String username) {
    String configured = adminUsername == null ? "" : adminUsername.trim();
    if (configured.isBlank() || username == null) {
      return false;
    }
    return configured.equalsIgnoreCase(username.trim());
  }

  private boolean isPublicCatalogSheet(Sheet sheet) {
    if (sheet == null || !sheet.isPublic() || sheet.isArchived()) {
      return false;
    }
    String visibility = sheet.getVisibility() == null ? "" : sheet.getVisibility().trim().toLowerCase(Locale.ROOT);
    return visibility.isBlank() || "public".equals(visibility);
  }

  private Map<String, Object> buildPublicProfile(User user, int totalSheets) {
    Map<String, Object> profile = new LinkedHashMap<>();
    int totalViews = sheetService.listSheetsForOwner(user.getId()).stream().mapToInt(sheet -> sheet.getDownloadedByUsernames() == null ? 0 : sheet.getDownloadedByUsernames().size()).sum();
    int totalCopies = sheetService.listSheetsForOwner(user.getId()).stream().mapToInt(sheet -> sheet.getCopiedByUsernames() == null ? 0 : sheet.getCopiedByUsernames().size()).sum();
    profile.put("name", user.getName());
    profile.put("username", user.getUsername());
    profile.put("bio", user.getBio());
    profile.put("headline", user.getHeadline());
    profile.put("location", user.getLocation());
    profile.put("institution", user.getInstitution());
    profile.put("company", user.getCompany());
    profile.put("websiteUrl", user.getWebsiteUrl());
    profile.put("githubUrl", user.getGithubUrl());
    profile.put("linkedinUrl", user.getLinkedinUrl());
    profile.put("resumeUrl", user.getResumeUrl());
    profile.put("skills", user.getSkills());
    profile.put("achievements", user.getAchievements());
    profile.put("projects", user.getProjects());
    profile.put("experience", user.getExperience());
    profile.put("education", user.getEducation());
    profile.put("totalSheets", totalSheets);
    profile.put("followers", mapUsersById(user.getFollowerUserIds()));
    profile.put("following", mapUsersById(user.getFollowingUserIds()));
    profile.put("followersCount", user.getFollowerUserIds() == null ? 0 : user.getFollowerUserIds().size());
    profile.put("followingCount", user.getFollowingUserIds() == null ? 0 : user.getFollowingUserIds().size());
    profile.put("copiedSheetsCount", user.getCopiedSheetIds() == null ? 0 : user.getCopiedSheetIds().size());
    profile.put("creatorTotalViews", totalViews);
    profile.put("creatorTotalCopies", totalCopies);
    profile.put("codingStats", platformProfileService.publicStatsPayload(user));
    PremiumAccessService.PremiumAccessState accessState = premiumAccessService.resolveAccessState(user);
    profile.put("premiumActive", accessState.premiumActive());
    profile.put("premiumUntil", accessState.premiumUntil() == null ? null : accessState.premiumUntil().toString());
    profile.put("premiumPlan", user.getPlanTier());
    return profile;
  }

  private List<Map<String, Object>> mapUsersById(Set<String> ids) {
    if (ids == null || ids.isEmpty()) return List.of();

    List<User> users = userRepository.findAllById(ids);
    Map<String, User> usersById = new HashMap<>();
    for (User user : users) {
      usersById.put(user.getId(), user);
    }

    List<Map<String, Object>> mapped = new ArrayList<>();
    for (String id : ids) {
      User user = usersById.get(id);
      if (user == null) continue;
      Map<String, Object> entry = new LinkedHashMap<>();
      entry.put("id", user.getId());
      entry.put("name", user.getName());
      entry.put("username", user.getUsername());
      PremiumAccessService.PremiumAccessState accessState = premiumAccessService.resolveAccessState(user);
      entry.put("premiumActive", accessState.premiumActive());
      entry.put("premiumUntil", accessState.premiumUntil() == null ? null : accessState.premiumUntil().toString());
      entry.put("premiumPlan", user.getPlanTier());
      mapped.add(entry);
    }
    return mapped;
  }
}
