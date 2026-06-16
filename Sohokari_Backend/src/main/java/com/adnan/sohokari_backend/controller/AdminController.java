package com.adnan.sohokari_backend.controller;

import com.adnan.sohokari_backend.dto.response.ApiResponse;
import com.adnan.sohokari_backend.dto.response.ProviderProfileResponse;
import com.adnan.sohokari_backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/verifications/pending")
    public ResponseEntity<ApiResponse<List<ProviderProfileResponse>>> getPendingVerifications() {
        return ResponseEntity.ok(
                ApiResponse.ok("Pending verifications", adminService.getPendingVerifications())
        );
    }

    @PostMapping("/verifications/{providerId}/approve")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> approveVerification(@PathVariable String providerId) {
        return ResponseEntity.ok(
                ApiResponse.ok("Verification approved", adminService.verifyProvider(providerId, true))
        );
    }

    @PostMapping("/verifications/{providerId}/reject")
    public ResponseEntity<ApiResponse<ProviderProfileResponse>> rejectVerification(@PathVariable String providerId) {
        return ResponseEntity.ok(
                ApiResponse.ok("Verification rejected", adminService.verifyProvider(providerId, false))
        );
    }
}
