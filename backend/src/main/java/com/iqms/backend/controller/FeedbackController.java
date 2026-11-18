package com.iqms.backend.controller;

import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.service.FeedbackMailService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

  private final FeedbackMailService feedbackMailService;
  private final CurrentUser currentUser;

  public FeedbackController(FeedbackMailService feedbackMailService, CurrentUser currentUser) {
    this.feedbackMailService = feedbackMailService;
    this.currentUser = currentUser;
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Map<String, Object>> submitFeedback(
      @RequestParam("topic") String topic,
      @RequestParam(value = "message", required = false) String message,
      @RequestPart(value = "images", required = false) List<MultipartFile> images,
      HttpServletRequest request) {
    String userId = currentUser.getUserId(request);
    return ResponseEntity.ok(feedbackMailService.sendFeedback(userId, topic, message, images));
  }
}
