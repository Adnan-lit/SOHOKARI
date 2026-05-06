package com.adnan.sohokari_backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateReviewRequest {

    @NotBlank(message = "Booking ID is required")
    private String bookingId;

    @NotNull @Min(1) @Max(5)
    private Integer serviceQuality;

    @NotNull @Min(1) @Max(5)
    private Integer communication;

    @NotNull @Min(1) @Max(5)
    private Integer timeliness;

    @NotNull @Min(1) @Max(5)
    private Integer professionalBehavior;

    @NotNull @Min(1) @Max(5)
    private Integer overallSatisfaction;

    @Size(max = 500, message = "Review text cannot exceed 500 characters")
    private String reviewText;
}