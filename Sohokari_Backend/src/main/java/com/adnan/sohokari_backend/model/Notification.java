package com.adnan.sohokari_backend.model;


import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userId;          // recipient

    private String title;
    private String body;

    private NotificationType type;

    private String referenceId;     // bookingId or messageId

    private boolean isRead = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum NotificationType {
        BOOKING_REQUESTED,
        BOOKING_ACCEPTED,
        BOOKING_REJECTED,
        BOOKING_STARTED,
        BOOKING_COMPLETED,
        NEW_MESSAGE,
        REVIEW_RECEIVED
    }
}