package com.adnan.sohokari_backend.controller;

import com.adnan.sohokari_backend.dto.request.*;
import com.adnan.sohokari_backend.dto.response.*;
import com.adnan.sohokari_backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/customer")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCustomer(
            @Valid @RequestBody CustomerRegisterRequest req) {
        AuthResponse data = authService.registerCustomer(req);
        return ResponseEntity.ok(ApiResponse.ok("Customer registered successfully", data));
    }

    @PostMapping("/register/provider")
    public ResponseEntity<ApiResponse<AuthResponse>> registerProvider(
            @Valid @RequestBody ProviderRegisterRequest req) {
        AuthResponse data = authService.registerProvider(req);
        return ResponseEntity.ok(ApiResponse.ok("Provider registered successfully", data));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest req) {
        AuthResponse data = authService.login(req);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", data));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestHeader("Refresh-Token") String refreshToken) {
        AuthResponse data = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed", data));
    }
}