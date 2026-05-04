package com.adnan.sohokari_backend.controller;


import com.adnan.sohokari_backend.dto.request.UpdateProviderProfileRequest;
import com.adnan.sohokari_backend.dto.response.*;
import com.adnan.sohokari_backend.model.ServiceCategory;
import com.adnan.sohokari_backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
public class ProviderController {

    private final ProviderService providerService;
    private final LocationService locationService;

    // ── Public endpoints ─────────────────────────────────────────────────

    @GetMapping("/{providerId}")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> getProfile(
            @PathVariable String providerId) {
        return ResponseEntity.ok(
                ApiResponse.ok("Provider profile", providerService.getProfile(providerId))
        );
    }

    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<ProviderSummaryResponse>>> nearby(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(defaultValue = "10") Double radius,
            @RequestParam(required = false) ServiceCategory category) {

        List<ProviderSummaryResponse> result =
                locationService.findNearby(lat, lng, radius, category);

        return ResponseEntity.ok(ApiResponse.ok("Nearby providers", result));
    }

    // ── Protected endpoints (PROVIDER only) ──────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> getMyProfile(
            Principal principal) {
        return ResponseEntity.ok(
                ApiResponse.ok("My profile", providerService.getMyProfile(principal.getName()))
        );
    }

    @PutMapping("/me/profile")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> updateProfile(
            Principal principal,
            @Valid @RequestBody UpdateProviderProfileRequest req) {
        return ResponseEntity.ok(
                ApiResponse.ok("Profile updated",
                        providerService.updateProfile(principal.getName(), req))
        );
    }

    @PutMapping("/me/availability")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleAvailability(
            Principal principal) {
        boolean isAvailable = providerService.toggleAvailability(principal.getName());
        return ResponseEntity.ok(
                ApiResponse.ok("Availability updated",
                        Map.of("isAvailable", isAvailable))
        );
    }
}