package com.adnan.sohokari_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiChatRequest {

    @NotBlank(message = "Message is required")
    private String message;

    private String sessionId;
    private Double latitude;
    private Double longitude;
}