package com.adnan.sohokari_backend.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ConversationResponse {
    private String bookingId;
    private String otherUserId;
    private String otherUserName;
    private String otherUserPhoto;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
}