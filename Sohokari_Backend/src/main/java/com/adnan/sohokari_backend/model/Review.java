package com.adnan.sohokari_backend.model;


import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "reviews")
public class Review {

    @Id
    private String id;

    @Indexed(unique = true)     // one review per booking
    private String bookingId;

    private String customerId;
    private String providerId;

    // Multi-criteria ratings (1–5 each)
    private Integer serviceQuality;
    private Integer communication;
    private Integer timeliness;
    private Integer professionalBehavior;
    private Integer overallSatisfaction;

    // Calculated average of all 5 criteria
    private Double averageRating;

    private String reviewText;

    private LocalDateTime createdAt = LocalDateTime.now();
}