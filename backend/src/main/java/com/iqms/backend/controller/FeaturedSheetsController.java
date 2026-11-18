package com.iqms.backend.controller;

import com.iqms.backend.dto.sheet.FeaturedSheetResponse;
import com.iqms.backend.dto.sheet.PublicSheetCatalogResponse;
import com.iqms.backend.service.FeaturedSheetsService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sheets")
public class FeaturedSheetsController {
  private final FeaturedSheetsService featuredSheetsService;

  public FeaturedSheetsController(FeaturedSheetsService featuredSheetsService) {
    this.featuredSheetsService = featuredSheetsService;
  }

  @GetMapping("/featured")
  public ResponseEntity<List<FeaturedSheetResponse>> featuredSheets() {
    return ResponseEntity.ok(featuredSheetsService.featuredSheets());
  }

  @GetMapping("/admin-catalog")
  public ResponseEntity<List<FeaturedSheetResponse>> adminCatalog() {
    return ResponseEntity.ok(featuredSheetsService.adminCatalog());
  }

  @GetMapping("/public-catalog")
  public ResponseEntity<List<PublicSheetCatalogResponse>> publicCatalog() {
    return ResponseEntity.ok(featuredSheetsService.publicCatalog());
  }
}
