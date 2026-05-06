package com.adnan.sohokari_backend.controller;


import com.adnan.sohokari_backend.dto.request.SmartMatchRequest;
import com.adnan.sohokari_backend.dto.response.ApiResponse;
import com.adnan.sohokari_backend.dto.response.SmartMatchResponse;
import com.adnan.sohokari_backend.service.SmartMatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/matching")
@RequiredArgsConstructor
public class SmartMatchController {

    private final SmartMatchService smartMatchService;

    @PostMapping("/find")
    public ResponseEntity<ApiResponse<SmartMatchResponse>> match(
            Principal principal,
            @Valid @RequestBody SmartMatchRequest req) {
        SmartMatchResponse res =
                smartMatchService.match(principal.getName(), req);
        return ResponseEntity.ok(ApiResponse.ok("Match results", res));
    }
}