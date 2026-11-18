package com.iqms.backend.profile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.iqms.backend.cache.PublicReadCacheService;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.service.PlatformProfileService;
import com.iqms.backend.service.PremiumAccessService;
import com.iqms.backend.service.SheetService;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ProfileShareServiceTest {
  @Mock private UserRepository userRepository;
  @Mock private SheetService sheetService;
  @Mock private PremiumAccessService premiumAccessService;
  @Mock private PlatformProfileService platformProfileService;
  @Mock private PublicReadCacheService publicReadCacheService;
  @Mock private SheetRepository sheetRepository;

  @BeforeEach
  void setUp() {
    lenient().when(publicReadCacheService.publicSheetKey(anyString(), anyString())).thenReturn("cache-key");
    lenient().when(publicReadCacheService.getOrLoad(anyString(), any(), any())).thenAnswer(invocation -> {
      Supplier<?> loader = invocation.getArgument(2);
      return loader.get();
    });
  }

  @Test
  void createSheetsPublicSheetRouteCanResolveCuratedAliasWithoutLogin() {
    User createSheets = new User();
    createSheets.setId("admin-1");
    createSheets.setUsername("createsheets");
    Sheet publicSheet = sheet("s1", "Arrays & Strings", true, false, "public");
    Sheet privateSheet = sheet("s2", "Secret Sheet", false, false, "private");

    when(userRepository.findByUsername("createsheets")).thenReturn(Optional.of(createSheets));
    when(sheetService.listSheetsForOwner("admin-1")).thenReturn(List.of());
    when(sheetRepository.findPublicCatalogSheets(any(Sort.class))).thenReturn(List.of(privateSheet, publicSheet));

    ProfileShareService service = service();

    Sheet result = service.getPublicSheet("createsheets", "arrays-strings");

    assertThat(result.getId()).isEqualTo("s1");
  }

  @Test
  void nonAdminPublicSheetRouteDoesNotFallbackToOtherOwners() {
    User user = new User();
    user.setId("user-1");
    user.setUsername("someone");

    when(userRepository.findByUsername("someone")).thenReturn(Optional.of(user));
    when(sheetService.listSheetsForOwner("user-1")).thenReturn(List.of());

    ProfileShareService service = service();

    assertThatThrownBy(() -> service.getPublicSheet("someone", "arrays-strings"))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("Shared sheet not found");
  }

  private ProfileShareService service() {
    return new ProfileShareService(
        userRepository,
        sheetService,
        premiumAccessService,
        platformProfileService,
        publicReadCacheService,
        sheetRepository,
        "CreateSheets");
  }

  private Sheet sheet(String id, String title, boolean isPublic, boolean archived, String visibility) {
    Sheet sheet = new Sheet();
    sheet.setId(id);
    sheet.setTitle(title);
    sheet.setPublic(isPublic);
    sheet.setArchived(archived);
    sheet.setVisibility(visibility);
    return sheet;
  }
}
