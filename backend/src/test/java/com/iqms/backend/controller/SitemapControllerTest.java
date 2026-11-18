package com.iqms.backend.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.iqms.backend.exception.GlobalExceptionHandler;
import com.iqms.backend.repository.UserRepository;
import com.iqms.backend.security.RequestFingerprintService;
import com.iqms.backend.security.TokenService;
import com.iqms.backend.service.SitemapService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SitemapController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class SitemapControllerTest {
  @Autowired private MockMvc mockMvc;
  @MockitoBean private SitemapService sitemapService;
  @MockitoBean private TokenService tokenService;
  @MockitoBean private UserRepository userRepository;
  @MockitoBean private RequestFingerprintService requestFingerprintService;

  @Test
  void publicSheetsSitemapReturnsXml() throws Exception {
    when(sitemapService.publicSheetsSitemap()).thenReturn("""
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://www.createsheets.com/sheets/creator/arrays</loc>
          </url>
        </urlset>
        """);

    mockMvc.perform(get("/sitemap-public-sheets.xml"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_XML))
        .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "max-age=900, public"))
        .andExpect(content().string(org.hamcrest.Matchers.containsString("https://www.createsheets.com/sheets/creator/arrays")));
  }
}
