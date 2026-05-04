package com.adnan.sohokari_backend.dto.response;

import com.adnan.sohokari_backend.model.ServiceCategory;
import lombok.Data;

import java.util.List;

@Data
public class ProviderSummaryResponse {
    private String providerId;
    private String userId;
    private String name;
    private String profilePhoto;
    private ServiceCategory serviceCategory;
    private List<String> skills;
    private Double hourlyRate;
    private Double averageRating;
    private Double reputationScore;
    private Integer totalCompletedBookings;
    private Boolean isAvailable;
    private List<String> badges;
    private String serviceArea;
    private Double distanceKm;   // populated in nearby search
}