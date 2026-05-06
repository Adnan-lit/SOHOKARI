package com.adnan.sohokari_backend.repository;


import com.adnan.sohokari_backend.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends MongoRepository<Review, String> {

    Optional<Review> findByBookingId(String bookingId);

    boolean existsByBookingId(String bookingId);

    Page<Review> findByProviderIdOrderByCreatedAtDesc(
            String providerId, Pageable pageable);

    List<Review> findByProviderId(String providerId);

    // For reputation calculation
    @Query("{ 'providerId': ?0 }")
    List<Review> findAllByProviderId(String providerId);

    // Check if customer already reviewed this provider via any booking
    boolean existsByCustomerIdAndProviderId(String customerId, String providerId);

    long countByProviderId(String providerId);
}