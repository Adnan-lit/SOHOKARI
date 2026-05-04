package com.adnan.sohokari_backend.service;


import com.google.firebase.messaging.*;
import com.adnan.sohokari_backend.model.Notification;
import com.adnan.sohokari_backend.repository.NotificationRepository;
import com.adnan.sohokari_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class FcmService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Async
    public void sendNotification(String userId, String title, String body,
                                 Notification.NotificationType type,
                                 String referenceId) {

        // Save notification to DB
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setType(type);
        notification.setReferenceId(referenceId);
        notificationRepository.save(notification);

        // Get user's FCM token
        userRepository.findById(userId).ifPresent(user -> {
            if (user.getFcmToken() == null || user.getFcmToken().isBlank()) {
                log.debug("No FCM token for user {}", userId);
                return;
            }

            try {
                Message message = Message.builder()
                        .setToken(user.getFcmToken())
                        .setNotification(
                                com.google.firebase.messaging.Notification.builder()
                                        .setTitle(title)
                                        .setBody(body)
                                        .build()
                        )
                        .putData("type", type.name())
                        .putData("referenceId", referenceId != null ? referenceId : "")
                        .build();

                String response = FirebaseMessaging.getInstance().send(message);
                log.info("FCM sent to user {}: {}", userId, response);

            } catch (FirebaseMessagingException e) {
                log.error("FCM failed for user {}: {}", userId, e.getMessage());
            }
        });
    }
}