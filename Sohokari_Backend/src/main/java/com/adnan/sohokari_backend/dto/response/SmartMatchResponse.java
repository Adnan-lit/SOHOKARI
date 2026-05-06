package com.adnan.sohokari_backend.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class SmartMatchResponse {
    private List<String> extractedKeywords;
    private String detectedCategory;
    private List<RecommendationResponse> matchedProviders;
    private int totalFound;
}