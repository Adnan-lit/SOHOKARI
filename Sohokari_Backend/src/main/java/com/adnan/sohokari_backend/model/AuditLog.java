package com.adnan.sohokari_backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Audit log entry for tracking important system events.
 */
@Data
@NoArgsConstructor
@Document(collection = "audit_logs")
public class AuditLog {

    @Id
    private String id;

    private String action;           // e.g. "BOOKING_CREATED", "PAYMENT_CONFIRMED", "USER_REGISTERED"
    private String performedBy;      // userId
    private String performedByEmail;
    private String targetType;       // e.g. "Booking", "Payment", "Provider"
    private String targetId;         // e.g. bookingId, paymentId
    private String details;          // Human-readable description
    private String ipAddress;

    private LocalDateTime createdAt = LocalDateTime.now();

    public AuditLog(String action, String performedBy, String performedByEmail,
                    String targetType, String targetId, String details) {
        this.action = action;
        this.performedBy = performedBy;
        this.performedByEmail = performedByEmail;
        this.targetType = targetType;
        this.targetId = targetId;
        this.details = details;
    }
}
