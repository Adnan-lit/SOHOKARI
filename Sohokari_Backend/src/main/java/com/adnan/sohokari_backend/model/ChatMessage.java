package com.adnan.sohokari_backend.model;


import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "messages")
public class ChatMessage {

    @Id
    private String id;

    @Indexed
    private String bookingId;      // links message to a booking

    private String senderId;       // User.id of sender
    private String receiverId;     // User.id of receiver

    private String content;

    private MessageType messageType = MessageType.TEXT;

    private boolean isRead = false;

    private LocalDateTime sentAt = LocalDateTime.now();

    public enum MessageType {
        TEXT, IMAGE, LOCATION
    }
}