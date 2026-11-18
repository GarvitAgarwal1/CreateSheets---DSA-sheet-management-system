package com.iqms.backend.controller;

import com.iqms.backend.service.SitemapService;
import java.util.concurrent.TimeUnit;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SitemapController {
  private final SitemapService sitemapService;

  public SitemapController(SitemapService sitemapService) {
    this.sitemapService = sitemapService;
  }

  @GetMapping(value = "/sitemap-public-sheets.xml", produces = MediaType.APPLICATION_XML_VALUE)
  public ResponseEntity<String> publicSheetsSitemap() {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(15, TimeUnit.MINUTES).cachePublic())
        .contentType(MediaType.APPLICATION_XML)
        .body(sitemapService.publicSheetsSitemap());
  }
}
