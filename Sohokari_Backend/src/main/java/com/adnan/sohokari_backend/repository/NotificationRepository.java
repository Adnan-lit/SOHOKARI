package com.adnan.sohokari_backend.repository;

import com.adnan.sohokari_backend.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<Notification> findByUserIdAndIsReadFalse(String userId);

    long countByUserIdAndIsReadFalse(String userId);
}