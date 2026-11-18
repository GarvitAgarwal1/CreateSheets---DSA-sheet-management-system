package com.iqms.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iqms.backend.exception.GlobalExceptionHandler;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.security.RequestFingerprintService;
import com.iqms.backend.security.TokenService;
import com.iqms.backend.service.AiSuggestionService;
import com.iqms.backend.service.SheetCollaborationService;
import com.iqms.backend.service.SheetService;
import com.iqms.backend.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(SheetController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class SheetControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  @MockitoBean private SheetService sheetService;
  @MockitoBean private CurrentUser currentUser;
  @MockitoBean private SheetCollaborationService collaborationService;
  @MockitoBean private AiSuggestionService aiSuggestionService;
  @MockitoBean private TokenService tokenService;
  @MockitoBean private RequestFingerprintService requestFingerprintService;
  @MockitoBean private UserRepository userRepository;

  @BeforeEach
  void setUp() {
    when(tokenService.validateAndGetUserId("valid-token")).thenReturn(Optional.of("owner-1"));
    when(userRepository.existsById("owner-1")).thenReturn(true);
  }

  @Test
  void createSheetReturnsCreatedSheet() throws Exception {
    Sheet sheet = new Sheet();
    sheet.setId("s1");
    sheet.setTitle("My Sheet");
    sheet.setLogoUrl("https://example.com/logo.png");
    sheet.setSheetUrl("https://example.com/ref");
    sheet.setPublic(true);
    sheet.setArchived(false);

    when(currentUser.getUserId(any())).thenReturn("owner-1");
    when(sheetService.createSheet(eq("owner-1"), eq("My Sheet"), eq("https://example.com/logo.png"), eq("https://example.com/ref"))).thenReturn(sheet);

    mockMvc.perform(post("/api/sheets")
            .header("Authorization", "Bearer valid-token")
            .contentType("application/json")
            .content(objectMapper.writeValueAsString(Map.of(
                "title", "My Sheet",
                "logoUrl", "https://example.com/logo.png",
                "sheetUrl", "https://example.com/ref"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("s1"))
        .andExpect(jsonPath("$.logoUrl").value("https://example.com/logo.png"))
        .andExpect(jsonPath("$.sheetUrl").value("https://example.com/ref"))
        .andExpect(jsonPath("$.isPublic").value(true))
        .andExpect(jsonPath("$.isArchived").value(false));
  }

  @Test
  void createSheetValidationFailureReturnsBadRequest() throws Exception {
    String longTitle = "x".repeat(121);

    mockMvc.perform(post("/api/sheets")
            .header("Authorization", "Bearer valid-token")
            .contentType("application/json")
            .content(objectMapper.writeValueAsString(Map.of("title", longTitle))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.validationErrors.title").exists());
  }


  @Test
  void listSheetsReturnsProjectedLightweightPayload() throws Exception {
    Sheet sheet = new Sheet();
    sheet.setId("s1");
    sheet.setTitle("My Sheet");
    sheet.setLogoUrl("https://example.com/logo.png");
    sheet.setSheetUrl("https://example.com/ref");
    sheet.setTopics(List.of(
        Map.of("subTopics", List.of(
            Map.of("questions", List.of(
                Map.of("done", true),
                Map.of("done", false)))))));

    when(currentUser.getUserId(any())).thenReturn("owner-1");
    when(sheetService.listSheetsAccessibleBy("owner-1")).thenReturn(List.of(sheet));

    mockMvc.perform(get("/api/sheets")
            .header("Authorization", "Bearer valid-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value("s1"))
        .andExpect(jsonPath("$[0].name").value("My Sheet"))
        .andExpect(jsonPath("$[0].logoUrl").value("https://example.com/logo.png"))
        .andExpect(jsonPath("$[0].sheetUrl").value("https://example.com/ref"))
        .andExpect(jsonPath("$[0].solved").value(1))
        .andExpect(jsonPath("$[0].totalQuestions").value(2))
        .andExpect(jsonPath("$[0].topics").doesNotExist());
  }
  @Test
  void updateSheetPropagatesNotFoundAsStructuredError() throws Exception {
    when(currentUser.getUserId(any())).thenReturn("owner-1");
    when(sheetService.updateOwnedSheet(eq("owner-1"), eq("missing"), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
        .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Sheet not found."));

    mockMvc.perform(put("/api/sheets/missing")
            .header("Authorization", "Bearer valid-token")
            .contentType("application/json")
            .content(objectMapper.writeValueAsString(Map.of(
                "title", "Updated",
                "topics", List.of()))))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.message").value("Sheet not found."));
  }
}
