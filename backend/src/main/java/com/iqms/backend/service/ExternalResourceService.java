package com.iqms.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ExternalResourceService {

  private final RestTemplate restTemplate;
  private final String apiUrlTemplate;
  private final String apiToken;

  public ExternalResourceService(
      RestTemplate restTemplate,
      @Value("${app.external.resource-url-template}") String apiUrlTemplate,
      @Value("${app.external.auth-token:}") String apiToken
  ) {
    this.restTemplate = restTemplate;
    this.apiUrlTemplate = apiUrlTemplate;
    this.apiToken = apiToken;
  }

  public String fetchResource(String userId, String resource) {
    String url = apiUrlTemplate
        .replace("{userId}", userId)
        .replace("{resource}", resource);

    HttpHeaders headers = new HttpHeaders();
    if (apiToken != null && !apiToken.isBlank()) {
      headers.setBearerAuth(apiToken);
    }

    ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
    return response.getBody();
  }
}
