package com.adnan.sohokari_backend.dto.response;


import lombok.Data;
import java.util.List;

@Data
public class ReputationResponse {
    private String providerId;
    private Double reputationScore;
    private Double averageRating;
    private Double completionRate;
    private Double responseRate;
    private Long   totalReviews;
    private Long   totalCompleted;
    private Long   totalBookings;
    private List<String> badges;

    // Score breakdown
    private Double ratingComponent;       // × 40%
    private Double completionComponent;   // × 25%
    private Double responseComponent;     // × 15%
    private Double reviewComponent;       // × 10%
    private Double badgeComponent;        // × 10%
}