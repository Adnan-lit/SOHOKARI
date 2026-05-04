package com.adnan.sohokari_backend.controller;


import com.adnan.sohokari_backend.dto.response.ApiResponse;
import com.adnan.sohokari_backend.model.Notification;
import com.adnan.sohokari_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/fcm-token")
    public ResponseEntity<ApiResponse<Void>> registerToken(
            Principal principal,
            @RequestBody Map<String, String> body) {
        notificationService.registerFcmToken(principal.getName(), body.get("token"));
        return ResponseEntity.ok(ApiResponse.ok("FCM token registered", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Notification>>> getNotifications(
            Principal principal,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Notification> res =
                notificationService.getNotifications(principal.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.ok("Notifications", res));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount(
            Principal principal) {
        long count = notificationService.getUnreadCount(principal.getName());
        return ResponseEntity.ok(
                ApiResponse.ok("Unread count", Map.of("count", count)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            Principal principal,
            @PathVariable String id) {
        notificationService.markAsRead(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok("Marked as read", null));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(Principal principal) {
        notificationService.markAllAsRead(principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("All marked as read", null));
    }
}