package com.iqms.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.iqms.backend.cache.PublicReadCacheService;
import com.iqms.backend.dto.sheet.FeaturedSheetResponse;
import com.iqms.backend.dto.sheet.PublicSheetCatalogResponse;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class FeaturedSheetsService {
  private final UserRepository userRepository;
  private final SheetRepository sheetRepository;
  private final PublicReadCacheService publicReadCacheService;
  private final String adminUsername;

  public FeaturedSheetsService(
      UserRepository userRepository,
      SheetRepository sheetRepository,
      PublicReadCacheService publicReadCacheService,
      @Value("${app.admin.username}") String adminUsername) {
    this.userRepository = userRepository;
    this.sheetRepository = sheetRepository;
    this.publicReadCacheService = publicReadCacheService;
    this.adminUsername = adminUsername;
  }

  public List<FeaturedSheetResponse> featuredSheets() {
    return publicReadCacheService.getOrLoad(
        PublicReadCacheService.FEATURED_SHEETS_KEY,
        new TypeReference<List<FeaturedSheetResponse>>() {},
        () -> catalogSheets(6));
  }

  public List<FeaturedSheetResponse> adminCatalog() {
    return publicReadCacheService.getOrLoad(
        PublicReadCacheService.ADMIN_CATALOG_KEY,
        new TypeReference<List<FeaturedSheetResponse>>() {},
        () -> catalogSheets(0));
  }

  public List<PublicSheetCatalogResponse> publicCatalog() {
    return publicReadCacheService.getOrLoad(
        PublicReadCacheService.PUBLIC_CATALOG_KEY,
        new TypeReference<List<PublicSheetCatalogResponse>>() {},
        this::loadCreateSheetsCatalog);
  }

  private List<PublicSheetCatalogResponse> loadCreateSheetsCatalog() {
    try {
      String catalogUsername = normalizedAdminUsername();
      Optional<User> adminUser = findAdminUser();
      if (adminUser.isPresent()) {
        User user = adminUser.get();
        catalogUsername = displayUsername(user.getUsername(), catalogUsername);
        String adminCatalogUsername = catalogUsername;
        List<PublicSheetCatalogResponse> adminSheets = sheetRepository
            .findPublicCatalogByOwnerId(user.getId(), Sort.by(Sort.Direction.DESC, "updatedAt"))
            .stream()
            .filter(this::isPublicCatalogSheet)
            .map(sheet -> PublicSheetCatalogResponse.from(sheet, adminCatalogUsername))
            .toList();
        if (!adminSheets.isEmpty()) {
          return adminSheets;
        }
      }

      String aliasUsername = catalogUsername;
      return sheetRepository.findPublicCatalogSheets(Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
          .filter(this::isPublicCatalogSheet)
          .map(sheet -> PublicSheetCatalogResponse.from(sheet, aliasUsername))
          .filter(Objects::nonNull)
          .toList();
    } catch (Exception ignored) {
      return List.of();
    }
  }

  private List<FeaturedSheetResponse> catalogSheets(int limit) {
    try {
      Optional<User> adminUser = findAdminUser();
      if (adminUser.isEmpty()) {
        return List.of();
      }

      List<FeaturedSheetResponse> rows = sheetRepository
          .findPublicCatalogByOwnerId(adminUser.get().getId(), Sort.by(Sort.Direction.DESC, "updatedAt"))
          .stream()
          .filter(this::isPublicCatalogSheet)
          .map(FeaturedSheetResponse::from)
          .toList();
      return limit > 0 ? rows.stream().limit(limit).toList() : rows;
    } catch (Exception ignored) {
      return List.of();
    }
  }

  private Optional<User> findAdminUser() {
    String username = normalizedAdminUsername();
    if (username.isBlank()) {
      return Optional.empty();
    }

    Optional<User> found = userRepository.findByUsernameIgnoreCase(username);
    return found == null ? Optional.empty() : found;
  }

  private String normalizedAdminUsername() {
    return adminUsername == null ? "" : adminUsername.trim();
  }

  private String displayUsername(String username, String fallback) {
    return username == null || username.isBlank() ? fallback : username.trim();
  }

  private boolean isPublicCatalogSheet(Sheet sheet) {
    if (sheet == null || !sheet.isPublic() || sheet.isArchived()) return false;
    String visibility = sheet.getVisibility() == null ? "" : sheet.getVisibility().trim().toLowerCase();
    return visibility.isBlank() || "public".equals(visibility);
  }
}
