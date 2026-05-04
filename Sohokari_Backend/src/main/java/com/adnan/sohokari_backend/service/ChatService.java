package com.adnan.sohokari_backend.service;


import com.adnan.sohokari_backend.dto.request.SendMessageRequest;
import com.adnan.sohokari_backend.dto.response.ChatMessageResponse;
import com.adnan.sohokari_backend.dto.response.ConversationResponse;
import com.adnan.sohokari_backend.model.*;
import com.adnan.sohokari_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final FcmService fcmService;
    private final SimpMessagingTemplate messagingTemplate;

    // ── Send message ──────────────────────────────────────────────────────

    public ChatMessageResponse sendMessage(String senderEmail,
                                           SendMessageRequest req) {

        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        // Validate booking exists and sender is part of it
        Booking booking = bookingRepository.findById(req.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        boolean isCustomer = booking.getCustomerId().equals(sender.getId());
        boolean isProvider = booking.getProviderUserId().equals(sender.getId());

        if (!isCustomer && !isProvider) {
            throw new RuntimeException("Not authorized to chat in this booking");
        }

        // Save message
        ChatMessage msg = new ChatMessage();
        msg.setBookingId(req.getBookingId());
        msg.setSenderId(sender.getId());
        msg.setReceiverId(req.getReceiverId());
        msg.setContent(req.getContent());
        msg.setMessageType(req.getMessageType());
        chatMessageRepository.save(msg);

        ChatMessageResponse response = mapToResponse(msg, sender.getName());

        // ── Deliver via WebSocket (if receiver is online) ─────────────────
        messagingTemplate.convertAndSendToUser(
                req.getReceiverId(),          // destination user
                "/queue/messages",            // channel
                response
        );

        // ── Push notification (for offline users) ─────────────────────────
        fcmService.sendNotification(
                req.getReceiverId(),
                "New message from " + sender.getName(),
                req.getContent().length() > 50
                        ? req.getContent().substring(0, 50) + "..." : req.getContent(),
                Notification.NotificationType.NEW_MESSAGE,
                req.getBookingId()
        );

        return response;
    }

    // ── Get chat history ──────────────────────────────────────────────────

    public Page<ChatMessageResponse> getChatHistory(String userEmail,
                                                    String bookingId,
                                                    int page, int size) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Authorization check
        boolean isCustomer = booking.getCustomerId().equals(user.getId());
        boolean isProvider = booking.getProviderUserId().equals(user.getId());
        if (!isCustomer && !isProvider) {
            throw new RuntimeException("Not authorized");
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<ChatMessage> messages = chatMessageRepository
                .findByBookingIdOrderBySentAtAsc(bookingId, pageable);

        // Collect unique sender IDs for name enrichment
        Set<String> senderIds = messages.stream()
                .map(ChatMessage::getSenderId).collect(Collectors.toSet());
        Map<String, String> nameMap = userRepository.findAllById(senderIds)
                .stream().collect(Collectors.toMap(User::getId, User::getName));

        // Mark messages as read
        messages.stream()
                .filter(m -> m.getReceiverId().equals(user.getId()) && !m.isRead())
                .forEach(m -> {
                    m.setRead(true);
                    chatMessageRepository.save(m);
                });

        return messages.map(m ->
                mapToResponse(m, nameMap.getOrDefault(m.getSenderId(), "Unknown"))
        );
    }

    // ── Get conversations list ────────────────────────────────────────────

    public List<ConversationResponse> getConversations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Find all bookings this user is part of
        List<Booking> bookings;
        if (user.getRole() == Role.CUSTOMER) {
            bookings = bookingRepository
                    .findByCustomerIdOrderByCreatedAtDesc(user.getId(),
                            PageRequest.of(0, 50)).getContent();
        } else {
            // Provider — find by providerUserId
            bookings = bookingRepository
                    .findByProviderUserIdOrderByCreatedAtDesc(user.getId(),
                            PageRequest.of(0, 50)).getContent();
        }

        List<ConversationResponse> conversations = new ArrayList<>();

        for (Booking booking : bookings) {
            // Get last message in this booking's chat
            Page<ChatMessage> lastMsg = chatMessageRepository
                    .findByBookingIdOrderBySentAtAsc(
                            booking.getId(), PageRequest.of(0, 1));

            if (lastMsg.isEmpty()) continue;

            ChatMessage last = lastMsg.getContent().get(0);

            // Other user in this conversation
            String otherUserId = user.getRole() == Role.CUSTOMER
                    ? booking.getProviderUserId()
                    : booking.getCustomerId();

            User otherUser = userRepository.findById(otherUserId).orElse(null);

            long unread = chatMessageRepository
                    .countByReceiverIdAndIsReadFalse(user.getId());

            ConversationResponse conv = new ConversationResponse();
            conv.setBookingId(booking.getId());
            conv.setOtherUserId(otherUserId);
            conv.setOtherUserName(otherUser != null ? otherUser.getName() : "Unknown");
            conv.setOtherUserPhoto(otherUser != null ? otherUser.getProfilePhoto() : null);
            conv.setLastMessage(last.getContent());
            conv.setLastMessageAt(last.getSentAt());
            conv.setUnreadCount(unread);

            conversations.add(conv);
        }

        return conversations;
    }

    // ── Delete message ────────────────────────────────────────────────────

    public void deleteMessage(String userEmail, String messageId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!msg.getSenderId().equals(user.getId())) {
            throw new RuntimeException("Can only delete your own messages");
        }

        chatMessageRepository.delete(msg);
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private ChatMessageResponse mapToResponse(ChatMessage msg, String senderName) {
        ChatMessageResponse res = new ChatMessageResponse();
        res.setMessageId(msg.getId());
        res.setBookingId(msg.getBookingId());
        res.setSenderId(msg.getSenderId());
        res.setSenderName(senderName);
        res.setReceiverId(msg.getReceiverId());
        res.setContent(msg.getContent());
        res.setMessageType(msg.getMessageType());
        res.setRead(msg.isRead());
        res.setSentAt(msg.getSentAt());
        return res;
    }
}