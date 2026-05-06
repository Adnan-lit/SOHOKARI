package com.adnan.sohokari_backend.controller;


import com.adnan.sohokari_backend.dto.request.CreateReviewRequest;
import com.adnan.sohokari_backend.dto.response.*;
import com.adnan.sohokari_backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ReviewResponse>> submitReview(
            Principal principal,
            @Valid @RequestBody CreateReviewRequest req) {
        ReviewResponse res = reviewService.submitReview(principal.getName(), req);
        return ResponseEntity.ok(ApiResponse.ok("Review submitted", res));
    }

    @GetMapping("/provider/{providerId}")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getProviderReviews(
            @PathVariable String providerId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ReviewResponse> res =
                reviewService.getProviderReviews(providerId, page, size);
        return ResponseEntity.ok(ApiResponse.ok("Provider reviews", res));
    }

    @GetMapping("/booking/{bookingId}/exists")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> reviewExists(
            @PathVariable String bookingId) {
        boolean exists = reviewService.reviewExists(bookingId);
        return ResponseEntity.ok(
                ApiResponse.ok("Review check", Map.of("exists", exists)));
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            Principal principal,
            @PathVariable String reviewId) {
        reviewService.deleteReview(principal.getName(), reviewId);
        return ResponseEntity.ok(ApiResponse.ok("Review deleted", null));
    }
}