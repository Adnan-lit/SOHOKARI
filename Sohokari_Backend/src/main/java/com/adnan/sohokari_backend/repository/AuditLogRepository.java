package com.adnan.sohokari_backend.repository;

import com.adnan.sohokari_backend.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findByPerformedByOrderByCreatedAtDesc(String userId);
    List<AuditLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, String targetId);
    List<AuditLog> findTop100ByOrderByCreatedAtDesc();
}
