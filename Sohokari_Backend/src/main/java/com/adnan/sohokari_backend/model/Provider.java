package com.adnan.sohokari_backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.index.TextIndexed;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "providers")
public class Provider {

    @Id
    private String id;

    // Links to User document
    private String userId;

    private ServiceCategory serviceCategory;

    @TextIndexed
    private List<String> skills;  // e.g. ["AC repair", "wiring", "fan installation"]

    @TextIndexed
    private String bio;

    private Double hourlyRate;

    @TextIndexed
    private String serviceArea;  // Area description e.g. "Dhanmondi, Mohammadpur"

    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint location;  // { type: "Point", coordinates: [lng, lat] }

    private Double averageRating = 0.0;

    private Double reputationScore = 0.0;

    private Integer totalCompletedBookings = 0;

    private Integer totalReviews = 0;

    private Boolean isAvailable = true;

    // Verification
    private String nid;
    private Boolean nidVerified = false;
    private String tradeLicense;          // required for ELECTRICIAN, PLUMBER, etc.
    private Boolean tradeLicenseVerified = false;

    // Badges assigned to this provider
    private List<String> badges;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}