package com.adnan.sohokari_backend.model;


import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    @Indexed
    private String customerId;      // User.id of customer

    @Indexed
    private String providerId;      // Provider.id

    private String providerUserId;  // User.id of provider (for notifications)

    private ServiceCategory serviceCategory;

    private LocalDate scheduledDate;
    private LocalTime scheduledTime;

    private String notes;           // customer description of the problem
    private String address;         // service location

    private BookingStatus status = BookingStatus.REQUESTED;

    private String cancellationReason;
    private String rejectionReason;

    // Timing tracking (for Fast Responder badge)
    private LocalDateTime requestedAt  = LocalDateTime.now();
    private LocalDateTime respondedAt;   // when provider accepted/rejected
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}