package com.adnan.sohokari_backend.dto.request;


import com.adnan.sohokari_backend.model.ChatMessage;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotBlank(message = "Booking ID is required")
    private String bookingId;

    @NotBlank(message = "Receiver ID is required")
    private String receiverId;       // User.id of recipient

    @NotBlank(message = "Message content is required")
    private String content;

    private ChatMessage.MessageType messageType = ChatMessage.MessageType.TEXT;
}