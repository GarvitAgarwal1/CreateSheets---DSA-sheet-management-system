package com.iqms.backend.controller;

import com.iqms.backend.auth.GoogleTokenVerifierService;
import com.iqms.backend.dto.AuthResponse;
import com.iqms.backend.dto.ForgotPasswordRequest;
import com.iqms.backend.dto.ResetPasswordRequest;
import com.iqms.backend.dto.GoogleAuthRequest;
import com.iqms.backend.dto.GoogleClientConfigResponse;
import com.iqms.backend.dto.LoginRequest;
import com.iqms.backend.dto.SignUpInitiateResponse;
import com.iqms.backend.dto.SignUpOtpRequest;
import com.iqms.backend.dto.SignUpRequest;
import com.iqms.backend.dto.SignUpResendOtpRequest;
import com.iqms.backend.security.RequestFingerprintService;
import com.iqms.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private static final Logger log = LoggerFactory.getLogger(AuthController.class);

  private final AuthService authService;
  private final RequestFingerprintService requestFingerprintService;
  private final GoogleTokenVerifierService googleTokenVerifierService;

  public AuthController(
      AuthService authService,
      RequestFingerprintService requestFingerprintService,
      GoogleTokenVerifierService googleTokenVerifierService) {
    this.authService = authService;
    this.requestFingerprintService = requestFingerprintService;
    this.googleTokenVerifierService = googleTokenVerifierService;
  }

  @PostMapping("/signup")
  public ResponseEntity<SignUpInitiateResponse> signUp(@Valid @RequestBody SignUpRequest request) {
    return ResponseEntity.ok(authService.signUp(request));
  }

  @PostMapping("/signup/resend-otp")
  public ResponseEntity<SignUpInitiateResponse> resendOtp(@Valid @RequestBody SignUpResendOtpRequest request) {
    return ResponseEntity.ok(authService.resendSignupOtp(request.getEmail()));
  }

  @PostMapping("/signup/verify-otp")
  public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody SignUpOtpRequest request) {
    return ResponseEntity.ok(authService.verifySignupOtp(request.getEmail(), request.getOtp()));
  }

    @RequestMapping(value = "/google", method = {RequestMethod.GET, RequestMethod.POST})
  public ResponseEntity<?> googleAuth(
      @RequestBody(required = false) GoogleAuthRequest request,
      HttpServletRequest servletRequest) {
    if ("GET".equalsIgnoreCase(servletRequest.getMethod())) {
      log.info("[GoogleAuth] GET /api/auth/google called for diagnostic access.");
      return ResponseEntity.ok("Use POST for Google authentication");
    }

    log.info("[GoogleAuth] POST /api/auth/google request received.");
    if (request == null || request.getIdToken() == null || request.getIdToken().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google id token is required");
    }

    try {
      return ResponseEntity.ok(authService.authenticateWithGoogle(request.getIdToken()));
    } catch (ResponseStatusException ex) {
      throw ex;
    } catch (Exception ex) {
      log.error("[GoogleAuth] Unexpected failure in /api/auth/google.", ex);
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Google authentication is temporarily unavailable. Please verify backend configuration and try again.");
    }
  }


  @PostMapping("/forgot-password/send-otp")
  public ResponseEntity<SignUpInitiateResponse> forgotPasswordSendOtp(@Valid @RequestBody ForgotPasswordRequest request) {
    return ResponseEntity.ok(authService.sendForgotPasswordOtp(request.getEmail()));
  }

  @PostMapping("/forgot-password/verify-otp")
  public ResponseEntity<SignUpInitiateResponse> forgotPasswordVerifyOtp(@Valid @RequestBody SignUpOtpRequest request) {
    return ResponseEntity.ok(authService.verifyForgotPasswordOtp(request.getEmail(), request.getOtp()));
  }

  @PostMapping("/forgot-password/reset")
  public ResponseEntity<AuthResponse> forgotPasswordReset(@Valid @RequestBody ResetPasswordRequest request) {
    return ResponseEntity.ok(authService.resetPasswordWithOtp(request.getEmail(), request.getOtp(), request.getNewPassword()));
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(
      @Valid @RequestBody LoginRequest request,
      HttpServletRequest servletRequest) {
    String deviceKey = requestFingerprintService.fingerprint(servletRequest);
    return ResponseEntity.ok(authService.login(request, deviceKey));
  }

  @GetMapping("/google/client-config")
  public ResponseEntity<GoogleClientConfigResponse> googleClientConfig() {
    String clientId = googleTokenVerifierService.getPrimaryGoogleAuthClientId();
    boolean googleAuthEnabled = googleTokenVerifierService.isGoogleAuthEnabled();
    log.info("[GoogleAuth] /api/auth/google/client-config served. enabled={} clientIdConfigured={}",
        googleAuthEnabled, !clientId.isBlank());
    return ResponseEntity.ok(
        new GoogleClientConfigResponse(clientId, googleAuthEnabled, !clientId.isBlank()));
  }
}
