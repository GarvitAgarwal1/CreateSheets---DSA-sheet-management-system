package com.iqms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

import com.iqms.backend.cache.PrivateSheetCacheService;
import com.iqms.backend.cache.PublicReadCacheService;
import com.iqms.backend.model.User;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.model.SheetCopyEvent;
import com.iqms.backend.queue.ActionQueueService;
import com.iqms.backend.repository.SheetCopyEventRepository;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class SheetServiceTest {

  @Mock private SheetRepository sheetRepository;
  @Mock private SheetCopyEventRepository sheetCopyEventRepository;
  @Mock private UserRepository userRepository;
  @Mock private ActionQueueService actionQueueService;
  @Mock private PremiumAccessService premiumAccessService;
  @Mock private SheetCollaborationService collaborationService;
  @Mock private PublicReadCacheService publicReadCacheService;
  @Mock private PrivateSheetCacheService privateSheetCacheService;

  @InjectMocks private SheetService sheetService;

  @BeforeEach
  void setUp() {
    lenient().when(actionQueueService.execute(any())).thenAnswer(invocation -> {
      @SuppressWarnings("unchecked")
      java.util.concurrent.Callable<Object> callable = invocation.getArgument(0);
      return callable.call();
    });
    lenient().when(userRepository.findById(any())).thenReturn(Optional.empty());
    lenient().when(privateSheetCacheService.getAccessibleSheetList(any(), any())).thenAnswer(invocation -> {
      @SuppressWarnings("unchecked")
      java.util.function.Supplier<List<Sheet>> loader = invocation.getArgument(1);
      return loader.get();
    });
    lenient().when(privateSheetCacheService.getAccessibleSheet(any(), any(), any(), any())).thenAnswer(invocation -> {
      @SuppressWarnings("unchecked")
      java.util.function.Supplier<Sheet> loader = invocation.getArgument(3);
      return loader.get();
    });
  }

  @Test
  void createSheetUsesDefaultTitleWhenBlank() {
    when(sheetRepository.save(any(Sheet.class))).thenAnswer(invocation -> invocation.getArgument(0));

    Sheet created = sheetService.createSheet("owner-1", "   ");

    assertThat(created.getTitle()).isEqualTo("Untitled Sheet");
    assertThat(created.getOwnerId()).isEqualTo("owner-1");
    assertThat(created.getCreatedAt()).isBeforeOrEqualTo(Instant.now());
  }

  @Test
  void updateOwnedSheetUpdatesMutableFields() {
    Sheet sheet = new Sheet();
    sheet.setId("sheet-1");
    sheet.setOwnerId("owner-1");
    sheet.setTitle("Old");

    when(sheetRepository.findById("sheet-1")).thenReturn(Optional.of(sheet));
    com.iqms.backend.model.User owner = new com.iqms.backend.model.User();
    owner.setId("owner-1");
    owner.setUsername("owner-name");
    when(premiumAccessService.findUser("owner-1")).thenReturn(owner);
    when(userRepository.findById("owner-1")).thenReturn(Optional.of(owner));
    when(sheetRepository.save(any(Sheet.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(collaborationService.canView(any(), any())).thenReturn(true);
    when(collaborationService.canEdit(any(), any())).thenReturn(true);

    Sheet updated = sheetService.updateOwnedSheet(
        "owner-1",
        "sheet-1",
        "New Title",
        "New description",
        "https://example.com/logo.png",
        "https://example.com/ref",
        List.of(Map.of("id", "t1")),
        List.of(Map.of("id", "tag-1")),
        List.of(Map.of("id", "custom-1")),
        true,
        false,
        true);

    assertThat(updated.getTitle()).isEqualTo("New Title");
    assertThat(updated.getDescription()).isEqualTo("New description");
    assertThat(updated.getLogoUrl()).isEqualTo("https://example.com/logo.png");
    assertThat(updated.getSheetUrl()).isEqualTo("https://example.com/ref");
    assertThat(updated.isPublic()).isTrue();
    assertThat(updated.isArchived()).isFalse();
    assertThat(updated.isShareProgress()).isTrue();
    assertThat(updated.getTopics()).hasSize(1);
    assertThat(updated.getTopicTags()).hasSize(1);
    assertThat(updated.getUserCustomTopics()).hasSize(1);
    verify(publicReadCacheService).evictCatalogCaches();
    verify(publicReadCacheService).evictOwnerPublicCaches("owner-name");
    verify(privateSheetCacheService).evictSheetAccessCaches(updated);
    verify(privateSheetCacheService).cacheAccessibleSheetForUser("owner-1", updated);
  }

  @Test
  void listSheetsAccessibleByUsesPrivateCacheLoader() {
    Sheet sheet = new Sheet();
    sheet.setId("sheet-1");
    sheet.setOwnerId("owner-1");
    when(sheetRepository.findCandidateAccessibleSheets("owner-1")).thenReturn(List.of(sheet));
    when(collaborationService.canView(sheet, "owner-1")).thenReturn(true);

    List<Sheet> result = sheetService.listSheetsAccessibleBy("owner-1");

    assertThat(result).containsExactly(sheet);
    verify(privateSheetCacheService).getAccessibleSheetList(any(), any());
  }

  @Test
  void getAccessibleSheetUsesPrivateCacheAndDoesNotHitRepositoryOnCacheHit() {
    Sheet cached = new Sheet();
    cached.setId("sheet-1");
    cached.setOwnerId("owner-1");
    doReturn(cached).when(privateSheetCacheService).getAccessibleSheet(any(), any(), any(), any());

    Sheet result = sheetService.getAccessibleSheet("owner-1", "sheet-1");

    assertThat(result).isSameAs(cached);
    verify(sheetRepository, never()).findById("sheet-1");
  }

  @Test
  void getOwnedSheetThrowsNotFoundWhenMissing() {
    when(sheetRepository.findByIdAndOwnerId("sheet-404", "owner-1")).thenReturn(Optional.empty());

    ResponseStatusException ex = assertThrows(
        ResponseStatusException.class,
        () -> sheetService.getOwnedSheet("owner-1", "sheet-404"));

    assertThat(ex.getStatusCode().value()).isEqualTo(HttpStatus.NOT_FOUND.value());
  }

  @Test
  void deleteOwnedSheetDeletesFoundSheet() {
    Sheet sheet = new Sheet();
    sheet.setId("sheet-1");
    sheet.setOwnerId("owner-1");
    when(sheetRepository.findByIdAndOwnerId("sheet-1", "owner-1")).thenReturn(Optional.of(sheet));

    sheetService.deleteOwnedSheet("owner-1", "sheet-1");

    verify(sheetRepository).delete(sheet);
  }

  @Test
  void copyPublicSheetPreservesSourceDescriptionAndAddsOwnerScopedSuffix() {
    Sheet source = new Sheet();
    source.setId("source-1");
    source.setOwnerId("owner-source");
    source.setTitle("One Day Placement Revision");
    source.setDescription("Original shared description");
    source.setLogoUrl("https://example.com/logo.png");
    source.setSheetUrl("https://example.com/ref");
    source.setPublic(true);
    source.setVisibility("public");
    source.setTopics(List.of(Map.of("id", "topic-1")));

    User actor = new User();
    actor.setId("actor-1");
    actor.setUsername("test123");

    when(sheetRepository.findById("source-1")).thenReturn(Optional.of(source));
    when(premiumAccessService.findUser("actor-1")).thenReturn(actor);
    when(sheetRepository.countByOwnerId("actor-1")).thenReturn(0L);
    when(sheetRepository.findAllByOwnerIdOrderByUpdatedAtDesc("actor-1")).thenReturn(
        List.of(existingOwnedSheet("existing-1", "One Day Placement Revision (Copy)")));
    when(userRepository.findById("actor-1")).thenReturn(Optional.of(actor));
    when(sheetRepository.save(any(Sheet.class))).thenAnswer(invocation -> {
      Sheet toSave = invocation.getArgument(0);
      if (toSave.getId() == null || toSave.getId().isBlank()) {
        toSave.setId("copied-1");
      }
      return toSave;
    });
    when(sheetCopyEventRepository.save(any(SheetCopyEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

    Sheet copied = sheetService.copyPublicSheet("actor-1", "source-1", null);

    assertThat(copied.getTitle()).isEqualTo("One Day Placement Revision (Copy) (1)");
    assertThat(copied.getDescription()).isEqualTo("Original shared description");
    assertThat(copied.getLogoUrl()).isEqualTo("https://example.com/logo.png");
    assertThat(copied.getSheetUrl()).isEqualTo("https://example.com/ref");
    assertThat(copied.getParentSheetId()).isEqualTo("source-1");
  }

  @Test
  void copyPublicSheetCreatesFreshCopyWhenSameUserCopiesAgain() {
    Sheet source = new Sheet();
    source.setId("source-1");
    source.setOwnerId("owner-source");
    source.setTitle("Repeatable Public Sheet");
    source.setDescription("Copy me twice");
    source.setPublic(true);
    source.setVisibility("public");
    source.setTopics(List.of(Map.of("id", "topic-1")));

    User actor = new User();
    actor.setId("actor-1");
    actor.setUsername("test123");

    Sheet priorCopy = existingOwnedSheet("copy-old", "Repeatable Public Sheet (Copy)");
    priorCopy.setOwnerId("actor-1");
    Sheet priorCopyWithSuffix = existingOwnedSheet("copy-old-2", "Repeatable Public Sheet (Copy) (1)");
    priorCopyWithSuffix.setOwnerId("actor-1");

    when(sheetRepository.findById("source-1")).thenReturn(Optional.of(source));
    when(premiumAccessService.findUser("actor-1")).thenReturn(actor);
    when(sheetRepository.countByOwnerId("actor-1")).thenReturn(2L);
    when(sheetRepository.findAllByOwnerIdOrderByUpdatedAtDesc("actor-1")).thenReturn(
        List.of(priorCopy, priorCopyWithSuffix));
    when(userRepository.findById("actor-1")).thenReturn(Optional.of(actor));
    when(sheetRepository.save(any(Sheet.class))).thenAnswer(invocation -> {
      Sheet toSave = invocation.getArgument(0);
      if (toSave.getId() == null || toSave.getId().isBlank()) {
        toSave.setId("copy-new");
      }
      return toSave;
    });
    when(sheetCopyEventRepository.save(any(SheetCopyEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

    Sheet copied = sheetService.copyPublicSheet("actor-1", "source-1", null);

    assertThat(copied.getId()).isEqualTo("copy-new");
    assertThat(copied.getTitle()).isEqualTo("Repeatable Public Sheet (Copy) (2)");
    assertThat(copied.getDescription()).isEqualTo("Copy me twice");
  }

  @Test
  void remixSheetPreservesSourceDescriptionLogoAndReferenceUrl() {
    Sheet source = new Sheet();
    source.setId("source-1");
    source.setOwnerId("owner-source");
    source.setTitle("Source Sheet");
    source.setDescription("Original description");
    source.setLogoUrl("https://example.com/logo.png");
    source.setSheetUrl("https://example.com/ref");
    source.setPublic(true);
    source.setVisibility("public");
    source.setTopics(List.of(Map.of("id", "topic-1")));

    User actor = new User();
    actor.setId("actor-1");

    when(sheetRepository.findById("source-1")).thenReturn(Optional.of(source));
    when(premiumAccessService.findUser("actor-1")).thenReturn(actor);
    when(sheetRepository.countByOwnerId("actor-1")).thenReturn(0L);
    when(sheetRepository.findAllByOwnerIdOrderByUpdatedAtDesc("actor-1")).thenReturn(List.of());
    when(sheetRepository.save(any(Sheet.class))).thenAnswer(invocation -> {
      Sheet toSave = invocation.getArgument(0);
      if (toSave.getId() == null || toSave.getId().isBlank()) {
        toSave.setId("remix-1");
      }
      return toSave;
    });

    Sheet remixed = sheetService.remixSheet("actor-1", "source-1", null);

    assertThat(remixed.getDescription()).isEqualTo("Original description");
    assertThat(remixed.getLogoUrl()).isEqualTo("https://example.com/logo.png");
    assertThat(remixed.getSheetUrl()).isEqualTo("https://example.com/ref");
    assertThat(remixed.getParentSheetId()).isEqualTo("source-1");
  }

  private Sheet existingOwnedSheet(String id, String title) {
    Sheet sheet = new Sheet();
    sheet.setId(id);
    sheet.setTitle(title);
    return sheet;
  }
}
