package com.iqms.backend.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import com.iqms.backend.model.User;
import com.iqms.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EntitlementServiceTest {

  @Mock private UserRepository userRepository;
  private PremiumAccessService premiumAccessService;
  private EntitlementService entitlementService;

  @BeforeEach
  void setup() {
    premiumAccessService = new PremiumAccessService(userRepository);
    entitlementService = new EntitlementService(premiumAccessService);
  }

  @Test
  void formerlyPremiumFeatureIsAllowedForFreeUsers() {
    User user = new User();
    assertDoesNotThrow(() -> entitlementService.requireFeature(user, "advanced_ai"));
  }

  @Test
  void freeFeatureAllowed() {
    User user = new User();
    assertDoesNotThrow(() -> entitlementService.requireFeature(user, "basic_feature"));
  }
}
