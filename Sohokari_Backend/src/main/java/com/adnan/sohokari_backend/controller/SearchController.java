package com.adnan.sohokari_backend.controller;


import com.adnan.sohokari_backend.dto.request.SearchRequest;
import com.adnan.sohokari_backend.dto.response.ApiResponse;
import com.adnan.sohokari_backend.dto.response.ProviderSummaryResponse;
import com.adnan.sohokari_backend.model.ServiceCategory;
import com.adnan.sohokari_backend.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ProviderSummaryResponse>>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ServiceCategory category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(defaultValue = "10")  Integer radius,
            @RequestParam(defaultValue = "0")   Integer page,
            @RequestParam(defaultValue = "10")  Integer size,
            @RequestParam(defaultValue = "REPUTATION") String sortBy) {

        SearchRequest req = new SearchRequest();
        req.setQ(q);
        req.setCategory(category);
        req.setMinPrice(minPrice);
        req.setMaxPrice(maxPrice);
        req.setMinRating(minRating);
        req.setAvailable(available);
        req.setLat(lat);
        req.setLng(lng);
        req.setRadius(radius);
        req.setPage(page);
        req.setSize(size);
        req.setSortBy(sortBy);

        return ResponseEntity.ok(
                ApiResponse.ok("Search results", searchService.search(req))
        );
    }
}