package com.adnan.sohokari_backend.dto.request;


import com.adnan.sohokari_backend.model.ServiceCategory;
import lombok.Data;

@Data
public class SearchRequest {
    private String q;                    // keyword
    private ServiceCategory category;
    private Double minPrice;
    private Double maxPrice;
    private Double minRating;
    private Boolean available;
    private Double lat;
    private Double lng;
    private Integer radius = 10;         // km, default 10
    private int page = 0;
    private int size = 10;
    private String sortBy = "REPUTATION"; // RATING | PRICE | DISTANCE | REPUTATION
}