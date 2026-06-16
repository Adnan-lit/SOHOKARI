package com.adnan.sohokari_backend.repository;

import com.adnan.sohokari_backend.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends MongoRepository<Payment, String> {
    Optional<Payment> findByBookingId(String bookingId);
    List<Payment> findByProviderIdOrderByCreatedAtDesc(String providerId);
    List<Payment> findByCustomerIdOrderByCreatedAtDesc(String customerId);
}
