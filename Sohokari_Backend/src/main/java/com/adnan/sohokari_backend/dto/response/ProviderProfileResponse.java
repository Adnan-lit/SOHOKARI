package com.adnan.sohokari_backend.dto.response;

import com.adnan.sohokari_backend.model.ServiceCategory;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProviderProfileResponse {
    // User info
    private String userId;
    private String name;
    private String email;
    private String phone;
    private String profilePhoto;

    // Provider info
    private String providerId;
    private ServiceCategory serviceCategory;
    private List<String> skills;
    private String bio;
    private Double hourlyRate;
    private String serviceArea;

    // Stats
    private Double averageRating;
    private Double reputationScore;
    private Integer totalCompletedBookings;
    private Integer totalReviews;
    private Boolean isAvailable;

    // Verification
    private Boolean nidVerified;
    private Boolean tradeLicenseVerified;

    // Badges
    private List<String> badges;

    private LocalDateTime memberSince;
}