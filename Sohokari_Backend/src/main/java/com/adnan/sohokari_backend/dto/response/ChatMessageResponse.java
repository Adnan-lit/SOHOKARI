package com.adnan.sohokari_backend.dto.response;


import com.adnan.sohokari_backend.model.ChatMessage;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChatMessageResponse {
    private String messageId;
    private String bookingId;
    private String senderId;
    private String senderName;
    private String receiverId;
    private String content;
    private ChatMessage.MessageType messageType;
    private boolean isRead;
    private LocalDateTime sentAt;
}