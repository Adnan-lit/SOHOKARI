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
    private String profilePhoto;
    private List<String> portfolio;
    private java.util.List<com.adnan.sohokari_backend.model.PaymentMethod> acceptedPaymentMethods;
    private String paymentMobileNumber;
}