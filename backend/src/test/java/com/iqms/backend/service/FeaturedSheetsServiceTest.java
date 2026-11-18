package com.iqms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.iqms.backend.cache.PublicReadCacheService;
import com.iqms.backend.dto.sheet.FeaturedSheetResponse;
import com.iqms.backend.dto.sheet.PublicSheetCatalogResponse;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

@ExtendWith(MockitoExtension.class)
class FeaturedSheetsServiceTest {
  @Mock private UserRepository userRepository;
  @Mock private SheetRepository sheetRepository;
  @Mock private PublicReadCacheService publicReadCacheService;

  @BeforeEach
  void setUp() {
    lenient().when(publicReadCacheService.getOrLoad(anyString(), any(), any())).thenAnswer(invocation -> {
      Supplier<?> loader = invocation.getArgument(2);
      return loader.get();
    });
  }

  @Test
  void featuredSheetsReturnsAtMostSixAdminPublicSheets() {
    String adminUsername = "AdminUser";
    User admin = new User();
    admin.setId("admin-1");
    admin.setUsername(adminUsername);
    when(userRepository.findByUsernameIgnoreCase(adminUsername)).thenReturn(Optional.of(admin));
    when(sheetRepository.findPublicCatalogByOwnerId(eq("admin-1"), any(Sort.class))).thenReturn(List.of(
        sheet("s1", "Sheet 1"),
        sheet("s2", "Sheet 2"),
        sheet("s3", "Sheet 3"),
        sheet("s4", "Sheet 4"),
        sheet("s5", "Sheet 5"),
        sheet("s6", "Sheet 6"),
        sheet("s7", "Sheet 7")));

    FeaturedSheetsService service = new FeaturedSheetsService(
        userRepository,
        sheetRepository,
        publicReadCacheService,
        adminUsername);

    List<FeaturedSheetResponse> rows = service.featuredSheets();

    assertThat(rows).hasSize(6);
    assertThat(rows.get(0).id()).isEqualTo("s1");
    assertThat(rows.get(0).logoUrl()).isEqualTo("https://example.com/logo.png");
    assertThat(rows.get(0).sheetUrl()).isEqualTo("https://example.com/ref");
  }

  @Test
  void adminCatalogReturnsEmptyWhenAdminUserIsMissing() {
    String adminUsername = "AdminUser";
    when(userRepository.findByUsernameIgnoreCase(adminUsername)).thenReturn(Optional.empty());

    FeaturedSheetsService service = new FeaturedSheetsService(
        userRepository,
        sheetRepository,
        publicReadCacheService,
        adminUsername);

    assertThat(service.adminCatalog()).isEmpty();
  }

  @Test
  void publicCatalogPrefersAdminOwnedPublicSheets() {
    String adminUsername = "CreateSheets";
    User admin = new User();
    admin.setId("admin-1");
    admin.setUsername("createsheets");
    Sheet adminSheet = sheet("s1", "Arrays & Strings");
    adminSheet.setOwnerId("admin-1");

    when(userRepository.findByUsernameIgnoreCase(adminUsername)).thenReturn(Optional.of(admin));
    when(sheetRepository.findPublicCatalogByOwnerId(eq("admin-1"), any(Sort.class))).thenReturn(List.of(adminSheet));

    FeaturedSheetsService service = new FeaturedSheetsService(
        userRepository,
        sheetRepository,
        publicReadCacheService,
        adminUsername);

    List<PublicSheetCatalogResponse> rows = service.publicCatalog();

    assertThat(rows).hasSize(1);
    assertThat(rows.get(0).ownerUsername()).isEqualTo("createsheets");
    assertThat(rows.get(0).publicPath()).isEqualTo("/sheets/createsheets/arrays-strings");
    assertThat(rows.get(0).publicUrl()).isEqualTo("https://www.createsheets.com/sheets/createsheets/arrays-strings");
  }

  @Test
  void publicCatalogFallsBackToCreateSheetsAliasWhenAdminHasNoSheets() {
    Sheet sheet = sheet("s1", "Arrays & Strings");
    sheet.setOwnerId("owner-1");
    User admin = new User();
    admin.setId("admin-1");
    admin.setUsername("createsheets");

    when(userRepository.findByUsernameIgnoreCase("CreateSheets")).thenReturn(Optional.of(admin));
    when(sheetRepository.findPublicCatalogByOwnerId(eq("admin-1"), any(Sort.class))).thenReturn(List.of());
    when(sheetRepository.findPublicCatalogSheets(any(Sort.class))).thenReturn(List.of(sheet));

    FeaturedSheetsService service = new FeaturedSheetsService(
        userRepository,
        sheetRepository,
        publicReadCacheService,
        "CreateSheets");

    List<PublicSheetCatalogResponse> rows = service.publicCatalog();

    assertThat(rows).hasSize(1);
    assertThat(rows.get(0).ownerUsername()).isEqualTo("createsheets");
    assertThat(rows.get(0).publicPath()).isEqualTo("/sheets/createsheets/arrays-strings");
    assertThat(rows.get(0).publicUrl()).isEqualTo("https://www.createsheets.com/sheets/createsheets/arrays-strings");
  }

  private Sheet sheet(String id, String title) {
    Sheet sheet = new Sheet();
    sheet.setId(id);
    sheet.setShareId("share-" + id);
    sheet.setTitle(title);
    sheet.setDescription("Description");
    sheet.setLogoUrl("https://example.com/logo.png");
    sheet.setSheetUrl("https://example.com/ref");
    sheet.setPublic(true);
    sheet.setArchived(false);
    sheet.setVisibility("public");
    sheet.setUpdatedAt(Instant.parse("2026-05-25T00:00:00Z"));
    return sheet;
  }
}
