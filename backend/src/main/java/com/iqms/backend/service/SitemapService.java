package com.iqms.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.iqms.backend.cache.PublicReadCacheService;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.seo.SeoUrlUtils;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class SitemapService {
  private final SheetRepository sheetRepository;
  private final UserRepository userRepository;
  private final PublicReadCacheService publicReadCacheService;

  public SitemapService(
      SheetRepository sheetRepository,
      UserRepository userRepository,
      PublicReadCacheService publicReadCacheService) {
    this.sheetRepository = sheetRepository;
    this.userRepository = userRepository;
    this.publicReadCacheService = publicReadCacheService;
  }

  public String publicSheetsSitemap() {
    return publicReadCacheService.getOrLoad(
        PublicReadCacheService.PUBLIC_SHEETS_SITEMAP_KEY,
        new TypeReference<String>() {},
        this::buildPublicSheetsSitemap);
  }

  private String buildPublicSheetsSitemap() {
    var sheets = sheetRepository.findPublicSheetsForSitemap(Sort.by(Sort.Direction.DESC, "updatedAt"))
        .stream()
        .filter(this::isPublicSitemapSheet)
        .toList();
    var ownerIds = sheets.stream()
        .map(Sheet::getOwnerId)
        .filter(Objects::nonNull)
        .collect(Collectors.toSet());
    Map<String, String> usernameById = userRepository.findAllById(ownerIds)
        .stream()
        .filter(user -> user.getUsername() != null && !user.getUsername().isBlank())
        .collect(Collectors.toMap(
            user -> user.getId(),
            user -> user.getUsername(),
            (first, ignored) -> first));

    StringBuilder xml = new StringBuilder(1024 + sheets.size() * 240);
    xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

    for (Sheet sheet : sheets) {
      String username = usernameById.get(sheet.getOwnerId());
      if (username == null || username.isBlank()) {
        continue;
      }

      xml.append("  <url>\n");
      xml.append("    <loc>")
          .append(escapeXml(SeoUrlUtils.publicSheetUrl(username, sheet.getTitle())))
          .append("</loc>\n");
      if (sheet.getUpdatedAt() != null) {
        xml.append("    <lastmod>")
            .append(DateTimeFormatter.ISO_INSTANT.format(sheet.getUpdatedAt()))
            .append("</lastmod>\n");
      }
      xml.append("    <changefreq>weekly</changefreq>\n");
      xml.append("    <priority>0.7</priority>\n");
      xml.append("  </url>\n");
    }

    xml.append("</urlset>\n");
    return xml.toString();
  }

  static String escapeXml(String value) {
    if (value == null || value.isEmpty()) return "";
    return value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&apos;");
  }

  private boolean isPublicSitemapSheet(Sheet sheet) {
    if (sheet == null || !sheet.isPublic() || sheet.isArchived()) return false;
    String visibility = sheet.getVisibility() == null ? "" : sheet.getVisibility().trim().toLowerCase();
    return visibility.isBlank() || "public".equals(visibility);
  }
}
