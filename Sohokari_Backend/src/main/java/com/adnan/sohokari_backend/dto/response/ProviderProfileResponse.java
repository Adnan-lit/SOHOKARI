package com.adnan.sohokari_backend.dto.response;

import com.adnan.sohokari_backend.model.ServiceCategory;
import com.adnan.sohokari_backend.model.VerificationStatus;
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
    private Double latitude;
    private Double longitude;

    // Stats
    private Double averageRating;
    private Double reputationScore;
    private Integer totalCompletedBookings;
    private Integer totalReviews;
    private Boolean isAvailable;

    // Verification
    private Boolean nidVerified;
    private String nidImage;
    private Boolean tradeLicenseVerified;
    private String tradeLicenseImage;
    private VerificationStatus verificationStatus;

    // Badges
    private List<String> badges;

    // Portfolio
    private List<String> portfolio;

    // Payment settings
    private List<com.adnan.sohokari_backend.model.PaymentMethod> acceptedPaymentMethods;
    private String paymentMobileNumber;

    private LocalDateTime memberSince;
}