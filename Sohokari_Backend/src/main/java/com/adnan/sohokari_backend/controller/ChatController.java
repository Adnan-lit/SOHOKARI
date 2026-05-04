package com.adnan.sohokari_backend.controller;


import com.adnan.sohokari_backend.dto.request.SendMessageRequest;
import com.adnan.sohokari_backend.dto.response.*;
import com.adnan.sohokari_backend.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // ── WebSocket endpoint (real-time send) ───────────────────────────────
    // React Native sends to: /app/chat.send
    @MessageMapping("/chat.send")
    public void sendMessageWs(@Payload SendMessageRequest req,
                              Principal principal) {
        chatService.sendMessage(principal.getName(), req);
    }

    // ── REST endpoints (fallback + history) ───────────────────────────────

    @PostMapping("/api/v1/chats/send")
    @ResponseBody
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessageRest(
            Principal principal,
            @Valid @RequestBody SendMessageRequest req) {
        ChatMessageResponse res = chatService.sendMessage(principal.getName(), req);
        return ResponseEntity.ok(ApiResponse.ok("Message sent", res));
    }

    @GetMapping("/api/v1/chats/{bookingId}/messages")
    @ResponseBody
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getHistory(
            Principal principal,
            @PathVariable String bookingId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<ChatMessageResponse> res =
                chatService.getChatHistory(principal.getName(), bookingId, page, size);
        return ResponseEntity.ok(ApiResponse.ok("Chat history", res));
    }

    @GetMapping("/api/v1/chats/conversations")
    @ResponseBody
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> conversations(
            Principal principal) {
        List<ConversationResponse> res =
                chatService.getConversations(principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Conversations", res));
    }

    @DeleteMapping("/api/v1/chats/{messageId}")
    @ResponseBody
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            Principal principal,
            @PathVariable String messageId) {
        chatService.deleteMessage(principal.getName(), messageId);
        return ResponseEntity.ok(ApiResponse.ok("Message deleted", null));
    }
}