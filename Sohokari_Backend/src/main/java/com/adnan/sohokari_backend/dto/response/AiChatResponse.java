package com.adnan.sohokari_backend.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class AiChatResponse {
    private String sessionId;
    private String reply;
    private String detectedIntent;
    private List<RecommendationResponse> suggestedProviders;
    private int totalProviderFound;
}