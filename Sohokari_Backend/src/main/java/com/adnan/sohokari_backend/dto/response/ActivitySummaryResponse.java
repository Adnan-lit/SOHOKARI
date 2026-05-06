package com.adnan.sohokari_backend.dto.response;

import lombok.Data;

@Data
public class ActivitySummaryResponse {
    private long totalBookings;
    private long completedBookings;
    private long cancelledBookings;
    private long pendingBookings;
    private long reviewsGiven;      // customers only
    private long reviewsReceived;   // providers only
    private Double averageRating;   // providers only
}