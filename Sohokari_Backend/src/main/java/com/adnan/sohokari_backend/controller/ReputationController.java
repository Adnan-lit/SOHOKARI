package com.adnan.sohokari_backend.controller;


import com.adnan.sohokari_backend.dto.response.ApiResponse;
import com.adnan.sohokari_backend.dto.response.ReputationResponse;
import com.adnan.sohokari_backend.service.ReputationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
public class ReputationController {

    private final ReputationService reputationService;

    @GetMapping("/{providerId}/reputation")
    public ResponseEntity<ApiResponse<ReputationResponse>> getReputation(
            @PathVariable String providerId) {
        ReputationResponse res = reputationService.getReputation(providerId);
        return ResponseEntity.ok(ApiResponse.ok("Reputation details", res));
    }

    // Manual trigger for admin/testing
    @PostMapping("/{providerId}/reputation/recalculate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> recalculate(
            @PathVariable String providerId) {
        reputationService.recalculate(providerId);
        return ResponseEntity.ok(ApiResponse.ok("Recalculation triggered", null));
    }
}