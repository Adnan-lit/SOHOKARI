package com.adnan.sohokari_backend.controller;


import com.adnan.sohokari_backend.dto.request.AiChatRequest;
import com.adnan.sohokari_backend.dto.response.AiChatResponse;
import com.adnan.sohokari_backend.dto.response.ApiResponse;
import com.adnan.sohokari_backend.service.AiChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(
            Principal principal,
            @Valid @RequestBody AiChatRequest req) {
        AiChatResponse res = aiChatService.chat(principal.getName(), req);
        return ResponseEntity.ok(ApiResponse.ok("AI response", res));
    }

    @DeleteMapping("/chat/history")
    public ResponseEntity<ApiResponse<Void>> clearHistory(
            Principal principal) {
        aiChatService.clearHistory(principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("History cleared", null));
    }
}