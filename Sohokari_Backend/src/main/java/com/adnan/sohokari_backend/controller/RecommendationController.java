package com.adnan.sohokari_backend.controller;

import com.adnan.sohokari_backend.dto.response.ApiResponse;
import com.adnan.sohokari_backend.dto.response.RecommendationResponse;
import com.adnan.sohokari_backend.model.ServiceCategory;
import com.adnan.sohokari_backend.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RecommendationResponse>>> recommend(
            Principal principal,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) ServiceCategory category,
            @RequestParam(defaultValue = "10") int limit) {

        List<RecommendationResponse> res = recommendationService
                .recommend(principal.getName(), lat, lng, category, limit);
        return ResponseEntity.ok(ApiResponse.ok("Recommendations", res));
    }
}