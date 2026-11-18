package com.iqms.backend.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iqms.backend.model.Sheet;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.ValueOperations;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PrivateSheetCacheServiceTest {
  @Mock private RedisOperations<String, String> redisTemplate;
  @Mock private ValueOperations<String, String> valueOperations;

  private PrivateSheetCacheService service;

  @BeforeEach
  void setUp() {
    when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    service = new PrivateSheetCacheService(redisTemplate, new ObjectMapper().findAndRegisterModules(), 120);
    PublicReadCacheService.clearDiagnostics();
  }

  @AfterEach
  void tearDown() {
    PublicReadCacheService.clearDiagnostics();
  }

  @Test
  void getAccessibleSheetReturnsRedisValueAndRecordsHit() throws Exception {
    Sheet cached = sheet("sheet-1", "owner-1", "Cached Sheet");
    when(valueOperations.get("createsheets:private:v1:user:owner-1:sheet:sheet-1"))
        .thenReturn(new ObjectMapper().writeValueAsString(cached));

    Sheet result = service.getAccessibleSheet(
        "owner-1",
        "sheet-1",
        sheet -> "owner-1".equals(sheet.getOwnerId()),
        () -> sheet("sheet-1", "owner-1", "Fresh Sheet"));

    assertThat(result.getTitle()).isEqualTo("Cached Sheet");
    assertThat(PublicReadCacheService.currentDiagnostics())
        .singleElement()
        .satisfies(diagnostic -> assertThat(diagnostic.status()).isEqualTo("HIT"));
  }

  @Test
  void getAccessibleSheetLoadsAndStoresOnMiss() {
    when(valueOperations.get("createsheets:private:v1:user:owner-1:sheet:sheet-1")).thenReturn(null);

    Sheet result = service.getAccessibleSheet(
        "owner-1",
        "sheet-1",
        sheet -> true,
        () -> sheet("sheet-1", "owner-1", "Fresh Sheet"));

    assertThat(result.getTitle()).isEqualTo("Fresh Sheet");
    assertThat(PublicReadCacheService.currentDiagnostics())
        .singleElement()
        .satisfies(diagnostic -> assertThat(diagnostic.status()).isEqualTo("MISS"));
    verify(valueOperations).set(
        eq("createsheets:private:v1:user:owner-1:sheet:sheet-1"),
        anyString(),
        any(Duration.class));
  }

  @Test
  void getAccessibleSheetFallsOpenWhenRedisReadFails() {
    when(valueOperations.get("createsheets:private:v1:user:owner-1:sheet:sheet-1"))
        .thenThrow(new RuntimeException("redis down"));

    Sheet result = service.getAccessibleSheet(
        "owner-1",
        "sheet-1",
        sheet -> true,
        () -> sheet("sheet-1", "owner-1", "Fresh Sheet"));

    assertThat(result.getTitle()).isEqualTo("Fresh Sheet");
    assertThat(PublicReadCacheService.currentDiagnostics())
        .singleElement()
        .satisfies(diagnostic -> assertThat(diagnostic.status()).isEqualTo("BYPASS"));
  }

  @Test
  void getAccessibleSheetEvictsCachedValueWhenAccessValidatorRejects() throws Exception {
    Sheet cached = sheet("sheet-1", "other-owner", "Stale Sheet");
    when(valueOperations.get("createsheets:private:v1:user:owner-1:sheet:sheet-1"))
        .thenReturn(new ObjectMapper().writeValueAsString(cached));

    Sheet result = service.getAccessibleSheet(
        "owner-1",
        "sheet-1",
        sheet -> "owner-1".equals(sheet.getOwnerId()),
        () -> sheet("sheet-1", "owner-1", "Fresh Sheet"));

    assertThat(result.getTitle()).isEqualTo("Fresh Sheet");
    verify(redisTemplate).delete(List.of("createsheets:private:v1:user:owner-1:sheet:sheet-1"));
  }

  @Test
  void getAccessibleSheetListFallsOpenWhenRedisWriteFails() {
    when(valueOperations.get("createsheets:private:v1:user:owner-1:sheets:list")).thenReturn(null);
    doThrow(new RuntimeException("redis write failed"))
        .when(valueOperations)
        .set(eq("createsheets:private:v1:user:owner-1:sheets:list"), anyString(), any(Duration.class));

    List<Sheet> result = service.getAccessibleSheetList(
        "owner-1",
        () -> List.of(sheet("sheet-1", "owner-1", "Fresh Sheet")));

    assertThat(result).hasSize(1);
    assertThat(PublicReadCacheService.currentDiagnostics())
        .singleElement()
        .satisfies(diagnostic -> assertThat(diagnostic.status()).isEqualTo("BYPASS"));
  }

  private Sheet sheet(String id, String ownerId, String title) {
    Sheet sheet = new Sheet();
    sheet.setId(id);
    sheet.setOwnerId(ownerId);
    sheet.setTitle(title);
    return sheet;
  }
}
