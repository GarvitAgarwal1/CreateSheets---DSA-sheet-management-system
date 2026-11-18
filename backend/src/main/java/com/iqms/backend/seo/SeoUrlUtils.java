package com.iqms.backend.seo;

import java.util.Locale;

public final class SeoUrlUtils {
  public static final String SITE_URL = "https://www.createsheets.com";

  private SeoUrlUtils() {}

  public static String slugifySegment(String value) {
    String cleaned = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    String slug = cleaned.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    return slug.isBlank() ? "untitled-sheet" : slug;
  }

  public static String publicSheetPath(String username, String sheetTitle) {
    return "/sheets/" + slugifySegment(username) + "/" + slugifySegment(sheetTitle);
  }

  public static String publicSheetUrl(String username, String sheetTitle) {
    return SITE_URL + publicSheetPath(username, sheetTitle);
  }
}
