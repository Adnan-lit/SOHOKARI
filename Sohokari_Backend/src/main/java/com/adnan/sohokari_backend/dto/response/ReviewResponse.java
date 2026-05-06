package com.adnan.sohokari_backend.dto.response;


import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private String reviewId;
    private String bookingId;
    private String customerId;
    private String customerName;
    private String customerPhoto;
    private String providerId;

    private Integer serviceQuality;
    private Integer communication;
    private Integer timeliness;
    private Integer professionalBehavior;
    private Integer overallSatisfaction;
    private Double  averageRating;

    private String reviewText;
    private LocalDateTime createdAt;
}