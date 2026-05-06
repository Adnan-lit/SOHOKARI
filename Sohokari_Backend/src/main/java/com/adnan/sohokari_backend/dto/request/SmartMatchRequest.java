package com.adnan.sohokari_backend.dto.request;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SmartMatchRequest {

    @NotBlank(message = "Requirement text is required")
    private String requirementText;

    private Double latitude;
    private Double longitude;
}