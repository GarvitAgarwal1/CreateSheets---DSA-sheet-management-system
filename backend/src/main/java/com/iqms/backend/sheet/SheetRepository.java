package com.iqms.backend.repository;

import com.iqms.backend.model.Sheet;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.domain.Sort;

public interface SheetRepository extends MongoRepository<Sheet, String> {
  List<Sheet> findAllByOwnerIdOrderByUpdatedAtDesc(String ownerId);
  Optional<Sheet> findByIdAndOwnerId(String id, String ownerId);
  Optional<Sheet> findByShareId(String shareId);
  long countByOwnerId(String ownerId);

  @Query("{ '$or': [ "
      + "{ 'ownerId': ?0 }, "
      + "{ 'collaborators.userId': ?0 } "
      + "] }")
  List<Sheet> findCandidateAccessibleSheets(String userId);

  @Query("{ '$or': [ "
      + "{ 'visibility': { '$in': ['public', 'unlisted'] } }, "
      + "{ 'isPublic': true } "
      + "] }")
  List<Sheet> findAllDiscoverableSheets();

  @Query("{ 'ownerId': ?0, 'isPublic': true, 'isArchived': false }")
  List<Sheet> findPublicCatalogByOwnerId(String ownerId, Sort sort);

  @Query(
      value = "{ 'isPublic': true, 'isArchived': false, '$or': [ "
          + "{ 'visibility': 'public' }, "
          + "{ 'visibility': null }, "
          + "{ 'visibility': '' } "
          + "] }",
      fields = "{ 'ownerId': 1, 'title': 1, 'updatedAt': 1, 'isPublic': 1, 'isArchived': 1, 'visibility': 1 }")
  List<Sheet> findPublicSheetsForSitemap(Sort sort);

  @Query(
      value = "{ 'isPublic': true, 'isArchived': false, '$or': [ "
          + "{ 'visibility': 'public' }, "
          + "{ 'visibility': null }, "
          + "{ 'visibility': '' } "
          + "] }",
      fields = "{ 'ownerId': 1, 'shareId': 1, 'title': 1, 'description': 1, 'logoUrl': 1, 'sheetUrl': 1, "
          + "'topicTags': 1, 'updatedAt': 1, 'isPublic': 1, 'isArchived': 1, 'visibility': 1 }")
  List<Sheet> findPublicCatalogSheets(Sort sort);
}
