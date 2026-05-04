package com.adnan.sohokari_backend.dto.response;


import com.adnan.sohokari_backend.model.BookingStatus;
import com.adnan.sohokari_backend.model.ServiceCategory;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class BookingResponse {
    private String bookingId;
    private String customerId;
    private String customerName;

    private String providerId;
    private String providerName;
    private String providerPhoto;

    private ServiceCategory serviceCategory;
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private String notes;
    private String address;

    private BookingStatus status;
    private String cancellationReason;
    private String rejectionReason;

    private LocalDateTime requestedAt;
    private LocalDateTime respondedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
}