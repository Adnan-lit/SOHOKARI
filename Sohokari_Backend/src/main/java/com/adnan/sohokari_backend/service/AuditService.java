package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.model.AuditLog;
import com.adnan.sohokari_backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service for recording audit logs asynchronously.
 * Fire-and-forget — does not block the calling thread.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(String action, String userId, String userEmail,
                    String targetType, String targetId, String details) {
        try {
            AuditLog entry = new AuditLog(action, userId, userEmail,
                    targetType, targetId, details);
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.warn("Failed to write audit log: {}", e.getMessage());
        }
    }

    @Async
    public void log(String action, String userId, String userEmail,
                    String targetType, String targetId) {
        log(action, userId, userEmail, targetType, targetId, null);
    }
}
