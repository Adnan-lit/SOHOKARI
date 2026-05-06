package com.adnan.sohokari_backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "ai_chat_sessions")
public class AiChatSession {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String sessionId;

    // "user" | "assistant" turns — sent to Claude each call
    private List<Turn> turns = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Data
    @NoArgsConstructor
    public static class Turn {
        private String role;
        private String content;
        private LocalDateTime timestamp = LocalDateTime.now();
    }
}