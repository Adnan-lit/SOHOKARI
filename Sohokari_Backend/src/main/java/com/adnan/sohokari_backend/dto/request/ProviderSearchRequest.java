package com.adnan.sohokari_backend.dto.request;

import com.adnan.sohokari_backend.model.ServiceCategory;
import lombok.Data;

@Data
public class ProviderSearchRequest {
    private String keyword;
    private ServiceCategory category;
    private Double maxHourlyRate;
    private Double minRating;
    
    // For distance filtering
    private Double latitude;
    private Double longitude;
    private Double maxDistanceKm;
}
