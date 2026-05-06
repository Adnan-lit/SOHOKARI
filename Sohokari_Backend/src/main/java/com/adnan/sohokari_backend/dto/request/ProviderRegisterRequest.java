package com.adnan.sohokari_backend.dto.request;

import com.adnan.sohokari_backend.model.ServiceCategory;
import jakarta.validation.constraints.*;
import lombok.Data;


@Data
public class ProviderRegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Valid email is required")
    @NotBlank
    private String email;

    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @Pattern(regexp = "^01[3-9]\\d{8}$", message = "Valid BD phone number required")
    private String phone;

    @NotBlank(message = "NID is required for all providers")
    private String nid;

    // Required for: ELECTRICIAN, PLUMBER, AC_CLEANER, REPAIRMAN
    private String tradeLicense;

    @NotNull(message = "Service category is required")
    private ServiceCategory serviceCategory;

    // Location: [longitude, latitude]
    @NotNull
    private Double longitude;

    @NotNull
    private Double latitude;
}