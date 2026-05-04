package com.adnan.sohokari_backend.dto.request;

import com.adnan.sohokari_backend.model.ServiceCategory;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CreateBookingRequest {

    @NotBlank(message = "Provider ID is required")
    private String providerId;

    @NotNull(message = "Service category is required")
    private ServiceCategory serviceCategory;

    @NotNull(message = "Scheduled date is required")
    @FutureOrPresent(message = "Scheduled date must be today or in the future")
    private LocalDate scheduledDate;

    @NotNull(message = "Scheduled time is required")
    private LocalTime scheduledTime;

    private String notes;

    @NotBlank(message = "Service address is required")
    private String address;
}