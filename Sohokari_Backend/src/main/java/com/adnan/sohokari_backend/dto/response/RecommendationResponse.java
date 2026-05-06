package com.adnan.sohokari_backend.dto.response;


import com.adnan.sohokari_backend.model.ServiceCategory;
import lombok.Data;
import java.util.List;

@Data
public class RecommendationResponse {
    private String providerId;
    private String name;
    private String profilePhoto;
    private ServiceCategory serviceCategory;
    private List<String> skills;
    private Double hourlyRate;
    private Double averageRating;
    private Double reputationScore;
    private Boolean isAvailable;
    private List<String> badges;
    private Double distanceKm;

    // Score breakdown
    private Double recommendationScore;
    private Double distanceScore;
    private Double ratingScore;
    private Double availabilityScore;
    private Double popularityScore;
    private Double preferenceScore;
}