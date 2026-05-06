package com.adnan.sohokari_backend.controller;


import com.adnan.sohokari_backend.dto.response.ApiResponse;
import com.adnan.sohokari_backend.dto.response.SchedulingSuggestionResponse;
import com.adnan.sohokari_backend.service.SchedulingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/scheduling")
@RequiredArgsConstructor
public class SchedulingController {

    private final SchedulingService schedulingService;

    @GetMapping("/suggest/{providerId}")
    public ResponseEntity<ApiResponse<SchedulingSuggestionResponse>> suggest(
            @PathVariable String providerId) {
        return ResponseEntity.ok(
                ApiResponse.ok("Suggested slots",
                        schedulingService.suggest(providerId)));
    }
}