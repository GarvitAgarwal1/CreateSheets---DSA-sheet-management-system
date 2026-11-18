package com.iqms.backend.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.iqms.backend.dto.sheet.FeaturedSheetResponse;
import com.iqms.backend.dto.sheet.PublicSheetCatalogResponse;
import com.iqms.backend.exception.GlobalExceptionHandler;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.security.RequestFingerprintService;
import com.iqms.backend.security.TokenService;
import com.iqms.backend.service.FeaturedSheetsService;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(FeaturedSheetsController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class FeaturedSheetsControllerTest {
  @Autowired private MockMvc mockMvc;
  @MockitoBean private FeaturedSheetsService featuredSheetsService;
  @MockitoBean private TokenService tokenService;
  @MockitoBean private RequestFingerprintService requestFingerprintService;
  @MockitoBean private UserRepository userRepository;

  @Test
  void featuredSheetsReturnsLightweightPayloadWithoutAuth() throws Exception {
    when(featuredSheetsService.featuredSheets()).thenReturn(List.of(new FeaturedSheetResponse(
        "s1",
        "share-1",
        "Admin Sheet",
        "Description",
        "https://example.com/logo.png",
        "https://example.com/ref",
        List.of(Map.of("name", "Arrays")),
        "public",
        Instant.parse("2026-05-25T00:00:00Z"))));

    mockMvc.perform(get("/api/sheets/featured"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value("s1"))
        .andExpect(jsonPath("$[0].shareId").value("share-1"))
        .andExpect(jsonPath("$[0].logoUrl").value("https://example.com/logo.png"))
        .andExpect(jsonPath("$[0].sheetUrl").value("https://example.com/ref"));
  }

  @Test
  void adminCatalogReturnsEmptyArray() throws Exception {
    when(featuredSheetsService.adminCatalog()).thenReturn(List.of());

    mockMvc.perform(get("/api/sheets/admin-catalog"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());
  }

  @Test
  void publicCatalogReturnsCanonicalSheetLinksWithoutAuth() throws Exception {
    when(featuredSheetsService.publicCatalog()).thenReturn(List.of(new PublicSheetCatalogResponse(
        "s1",
        "share-1",
        "CreateSheets",
        "arrays",
        "/sheets/createsheets/arrays",
        "https://www.createsheets.com/sheets/createsheets/arrays",
        "Arrays",
        "Practice arrays",
        "",
        "",
        List.of(Map.of("name", "Arrays")),
        Instant.parse("2026-05-25T00:00:00Z"))));

    mockMvc.perform(get("/api/sheets/public-catalog"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].ownerUsername").value("CreateSheets"))
        .andExpect(jsonPath("$[0].publicPath").value("/sheets/createsheets/arrays"))
        .andExpect(jsonPath("$[0].publicUrl").value("https://www.createsheets.com/sheets/createsheets/arrays"));
  }
}
