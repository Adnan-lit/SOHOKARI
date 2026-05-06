package com.adnan.sohokari_backend.controller;

import com.adnan.sohokari_backend.dto.response.ActivitySummaryResponse;
import com.adnan.sohokari_backend.dto.response.ApiResponse;
import com.adnan.sohokari_backend.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ActivitySummaryResponse>> summary(
            Principal principal) {
        return ResponseEntity.ok(
                ApiResponse.ok("Activity summary",
                        activityService.getSummary(principal.getName())));
    }
}