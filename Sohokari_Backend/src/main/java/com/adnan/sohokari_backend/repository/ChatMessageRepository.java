package com.adnan.sohokari_backend.repository;


import com.adnan.sohokari_backend.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    Page<ChatMessage> findByBookingIdOrderBySentAtAsc(String bookingId, Pageable pageable);

    List<ChatMessage> findByReceiverIdAndIsReadFalse(String receiverId);

    long countByReceiverIdAndIsReadFalse(String receiverId);

    // All conversations for a user (as sender or receiver)
    List<ChatMessage> findByBookingIdInOrderBySentAtDesc(List<String> bookingIds);
}