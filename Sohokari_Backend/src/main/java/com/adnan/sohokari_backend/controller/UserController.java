package com.adnan.sohokari_backend.controller;

import com.adnan.sohokari_backend.dto.request.UpdateLocationRequest;
import com.adnan.sohokari_backend.dto.request.UpdateProfileRequest;
import com.adnan.sohokari_backend.dto.response.ApiResponse;
import com.adnan.sohokari_backend.model.User;
import com.adnan.sohokari_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/me/location")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Double>>> updateLocation(
            Principal principal,
            @Valid @RequestBody UpdateLocationRequest req) {
        return ResponseEntity.ok(
                ApiResponse.ok("Location updated",
                        userService.updateLocation(principal.getName(), req))
        );
    }

    @GetMapping("/me/location")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Double>>> getLocation(
            Principal principal) {
        return ResponseEntity.ok(
                ApiResponse.ok("Current location",
                        userService.getLocation(principal.getName()))
        );
    }

    @PutMapping("/me/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<User>> updateProfile(
            Principal principal,
            @Valid @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(
                ApiResponse.ok("Profile updated",
                        userService.updateProfile(principal.getName(), req))
        );
    }
}
