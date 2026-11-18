package com.iqms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.iqms.backend.cache.PublicReadCacheService;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.function.Supplier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

@ExtendWith(MockitoExtension.class)
class SitemapServiceTest {
  @Mock private SheetRepository sheetRepository;
  @Mock private UserRepository userRepository;
  @Mock private PublicReadCacheService publicReadCacheService;

  @BeforeEach
  void setUp() {
    lenient().when(publicReadCacheService.getOrLoad(anyString(), any(), any())).thenAnswer(invocation -> {
      Supplier<?> loader = invocation.getArgument(2);
      return loader.get();
    });
  }

  @Test
  void publicSheetsSitemapIncludesOnlyRowsWithPublicOwners() {
    Sheet publicSheet = sheet("public-1", "owner-1", "Arrays & Strings", "public");
    Sheet privateSheet = sheet("private-1", "owner-1", "Private Sheet", "private");
    Sheet unlistedSheet = sheet("unlisted-1", "owner-1", "Unlisted Sheet", "unlisted");
    Sheet archivedSheet = sheet("archived-1", "owner-1", "Archived Sheet", "public");
    archivedSheet.setArchived(true);
    Sheet missingOwnerSheet = sheet("public-2", "missing-owner", "Hidden", "public");
    User owner = new User();
    owner.setId("owner-1");
    owner.setUsername("Creator User");

    when(sheetRepository.findPublicSheetsForSitemap(any(Sort.class))).thenReturn(List.of(
        publicSheet,
        privateSheet,
        unlistedSheet,
        archivedSheet,
        missingOwnerSheet));
    when(userRepository.findAllById(any())).thenReturn(List.of(owner));

    String xml = new SitemapService(
        sheetRepository,
        userRepository,
        publicReadCacheService).publicSheetsSitemap();

    assertThat(xml).contains("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
    assertThat(xml).contains("https://www.createsheets.com/sheets/creator-user/arrays-strings");
    assertThat(xml).contains("<lastmod>2026-05-25T00:00:00Z</lastmod>");
    assertThat(xml).doesNotContain("Hidden");
    assertThat(xml).doesNotContain("private-sheet");
    assertThat(xml).doesNotContain("unlisted-sheet");
    assertThat(xml).doesNotContain("archived-sheet");
  }

  @Test
  void escapeXmlEscapesUrlSpecialCharacters() {
    assertThat(SitemapService.escapeXml("https://example.com/a?x=1&name=\"A'B\""))
        .isEqualTo("https://example.com/a?x=1&amp;name=&quot;A&apos;B&quot;");
  }

  private Sheet sheet(String id, String ownerId, String title, String visibility) {
    Sheet sheet = new Sheet();
    sheet.setId(id);
    sheet.setOwnerId(ownerId);
    sheet.setTitle(title);
    sheet.setPublic(true);
    sheet.setArchived(false);
    sheet.setVisibility(visibility);
    sheet.setUpdatedAt(Instant.parse("2026-05-25T00:00:00Z"));
    return sheet;
  }
}
