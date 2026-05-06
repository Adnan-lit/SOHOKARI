package com.adnan.sohokari_backend.repository;


import com.adnan.sohokari_backend.model.AiChatSession;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface AiChatSessionRepository
        extends MongoRepository<AiChatSession, String> {

    Optional<AiChatSession> findByUserIdAndSessionId(
            String userId, String sessionId);

    void deleteByUserId(String userId);
}