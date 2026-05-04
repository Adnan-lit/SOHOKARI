package com.adnan.sohokari_backend.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class UpdateProviderProfileRequest {
    private String bio;
    private List<String> skills;
    private Double hourlyRate;
    private String serviceArea;
    private Double longitude;
    private Double latitude;
}