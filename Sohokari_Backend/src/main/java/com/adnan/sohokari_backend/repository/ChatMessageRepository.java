package com.adnan.sohokari_backend.repository;
import com.adnan.sohokari_backend.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    Page<ChatMessage> findByBookingIdOrderBySentAtAsc(String bookingId, Pageable pageable);

    Page<ChatMessage> findByBookingIdOrderBySentAtDesc(String bookingId, Pageable pageable);

    List<ChatMessage> findByReceiverIdAndIsReadFalse(String receiverId);

    List<ChatMessage> findByBookingIdAndReceiverIdAndIsReadFalse(String bookingId, String receiverId);

    long countByReceiverIdAndIsReadFalse(String receiverId);

    long countByBookingIdAndReceiverIdAndIsReadFalse(String bookingId, String receiverId);

    // All conversations for a user (as sender or receiver)
    List<ChatMessage> findByBookingIdInOrderBySentAtDesc(List<String> bookingIds);

    @org.springframework.data.mongodb.repository.Query("{ '$or': [ { 'senderId': ?0 }, { 'receiverId': ?0 } ], 'bookingId': { $regex: '^inq_' } }")
    List<ChatMessage> findInquiriesByUser(String userId);
}