package com.adnan.sohokari_backend.model;


import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.*;

@Data
@NoArgsConstructor
@Document(collection = "user_preferences")
public class UserPreference {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    // Category → how many times searched/booked
    private Map<String, Integer> categoryFrequency = new HashMap<>();

    // Last 20 search keywords
    private List<String> recentSearchKeywords = new ArrayList<>();

    // Provider IDs this user has booked before
    private List<String> bookedProviderIds = new ArrayList<>();

    private Double lastLatitude;
    private Double lastLongitude;

    private LocalDateTime updatedAt = LocalDateTime.now();
}