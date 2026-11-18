package com.iqms.backend.service;

import com.iqms.backend.config.properties.MailProperties;
import com.iqms.backend.exception.ApiRequestException;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FeedbackMailService {
  private static final int MAX_TOPIC_LENGTH = 100;
  private static final int MAX_MESSAGE_LENGTH = 1200;
  private static final int MAX_IMAGE_COUNT = 5;
  private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024L * 1024L;
  private static final long MAX_TOTAL_IMAGE_SIZE_BYTES = 20L * 1024L * 1024L;

  private final JavaMailSender mailSender;
  private final MailProperties mailProperties;
  private final UserRepository userRepository;

  public FeedbackMailService(
      JavaMailSender mailSender,
      MailProperties mailProperties,
      UserRepository userRepository) {
    this.mailSender = mailSender;
    this.mailProperties = mailProperties;
    this.userRepository = userRepository;
  }

  public Map<String, Object> sendFeedback(
      String userId,
      String topic,
      String message,
      List<MultipartFile> images) {
    if (!mailProperties.isEnabled() || !hasText(resolveFeedbackInbox())) {
      throw new ApiRequestException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Feedback email is not configured on this server.",
          "FEEDBACK_MAIL_DISABLED",
          null,
          null);
    }

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    String normalizedTopic = normalizeRequired(topic, "Topic is required.", MAX_TOPIC_LENGTH);
    String normalizedMessage = normalizeOptional(message, MAX_MESSAGE_LENGTH);
    List<MultipartFile> attachments = normalizeImages(images);

    if (!hasText(normalizedMessage) && attachments.isEmpty()) {
      throw new IllegalArgumentException("Add a message or at least one image.");
    }

    MimeMessage mimeMessage = mailSender.createMimeMessage();
    try {
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
      String senderAddress = resolveOtpSenderAddress();
      if (hasText(senderAddress)) {
        helper.setFrom(senderAddress);
      }
      if (hasText(user.getEmail())) {
        helper.setReplyTo(user.getEmail());
      }
      helper.setTo(resolveFeedbackInbox());
      helper.setSubject("[Feedback] " + toSubjectTopic(normalizedTopic));
      helper.setText(buildFeedbackBody(user, normalizedTopic, normalizedMessage, attachments.size()), false);

      for (int i = 0; i < attachments.size(); i += 1) {
        MultipartFile image = attachments.get(i);
        helper.addAttachment(
            sanitizeFilename(image.getOriginalFilename(), i + 1),
            image,
            image.getContentType());
      }

      mailSender.send(mimeMessage);
    } catch (MessagingException | MailException ex) {
      throw new ApiRequestException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Unable to send feedback right now. Please try again.",
          "FEEDBACK_EMAIL_SEND_FAILED",
          null,
          null);
    }

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("message", "Feedback sent successfully.");
    response.put("tag", "Feedback");
    response.put("imageCount", attachments.size());
    return response;
  }

  private List<MultipartFile> normalizeImages(List<MultipartFile> images) {
    List<MultipartFile> attachments = images == null
        ? List.of()
        : images.stream()
            .filter(image -> image != null && !image.isEmpty())
            .toList();

    if (attachments.size() > MAX_IMAGE_COUNT) {
      throw new IllegalArgumentException("You can attach up to " + MAX_IMAGE_COUNT + " images.");
    }

    long totalSize = 0L;
    for (MultipartFile image : attachments) {
      String contentType = image.getContentType() == null
          ? ""
          : image.getContentType().toLowerCase(Locale.ROOT);
      if (!contentType.startsWith("image/")) {
        throw new IllegalArgumentException("Only image files can be attached.");
      }
      if (image.getSize() > MAX_IMAGE_SIZE_BYTES) {
        throw new IllegalArgumentException("Each image must be 5 MB or smaller.");
      }
      totalSize += image.getSize();
    }

    if (totalSize > MAX_TOTAL_IMAGE_SIZE_BYTES) {
      throw new IllegalArgumentException("Attached images must be 20 MB or smaller in total.");
    }

    return attachments;
  }

  private String buildFeedbackBody(User user, String topic, String message, int imageCount) {
    StringBuilder builder = new StringBuilder();
    builder.append("Tag: Feedback\n");
    builder.append("Topic: ").append(topic).append("\n");
    builder.append("Submitted at: ").append(Instant.now()).append("\n\n");
    builder.append("User\n");
    builder.append("ID: ").append(blankFallback(user.getId())).append("\n");
    builder.append("Name: ").append(blankFallback(user.getName())).append("\n");
    builder.append("Username: ").append(blankFallback(user.getUsername())).append("\n");
    builder.append("Email: ").append(blankFallback(user.getEmail())).append("\n\n");
    builder.append("Content\n");
    builder.append(hasText(message) ? message : "(No text content provided.)").append("\n\n");
    builder.append("Images attached: ").append(imageCount).append("\n");
    return builder.toString();
  }

  private String normalizeRequired(String value, String errorMessage, int maxLength) {
    String normalized = normalizeOptional(value, maxLength);
    if (!hasText(normalized)) {
      throw new IllegalArgumentException(errorMessage);
    }
    return normalized;
  }

  private String normalizeOptional(String value, int maxLength) {
    String normalized = value == null ? "" : value.trim();
    if (normalized.length() > maxLength) {
      throw new IllegalArgumentException("Text must be " + maxLength + " characters or fewer.");
    }
    return normalized;
  }

  private String toSubjectTopic(String topic) {
    String compactTopic = topic.replaceAll("[\\r\\n]+", " ").trim();
    return compactTopic.length() <= 80 ? compactTopic : compactTopic.substring(0, 80).trim();
  }

  private String sanitizeFilename(String filename, int index) {
    String fallback = "feedback-image-" + index;
    if (!hasText(filename)) {
      return fallback;
    }

    String cleaned = filename.replace('\\', '/');
    int slashIndex = cleaned.lastIndexOf('/');
    if (slashIndex >= 0) {
      cleaned = cleaned.substring(slashIndex + 1);
    }

    cleaned = cleaned.replaceAll("[\\r\\n]+", " ").trim();
    cleaned = cleaned.replaceAll("[^a-zA-Z0-9._-]", "_");
    if (!hasText(cleaned)) {
      return fallback;
    }
    return cleaned.length() <= 100 ? cleaned : cleaned.substring(cleaned.length() - 100);
  }

  private String resolveFeedbackInbox() {
    if (hasText(mailProperties.getFeedbackTo())) {
      return mailProperties.getFeedbackTo();
    }
    if (hasText(mailProperties.getUsername())) {
      return mailProperties.getUsername();
    }
    return mailProperties.getFromAddress();
  }

  private String resolveOtpSenderAddress() {
    if (hasText(mailProperties.getFromAddress())) {
      return mailProperties.getFromAddress();
    }
    return mailProperties.getUsername();
  }

  private String blankFallback(String value) {
    return hasText(value) ? value : "(not available)";
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }
}
