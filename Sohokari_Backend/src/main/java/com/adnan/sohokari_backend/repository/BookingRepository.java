package com.adnan.sohokari_backend.repository;

import com.adnan.sohokari_backend.model.Booking;
import com.adnan.sohokari_backend.model.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends MongoRepository<Booking, String> {

    // Customer's bookings
    Page<Booking> findByCustomerIdOrderByCreatedAtDesc(String customerId, Pageable pageable);
    Page<Booking> findByCustomerIdAndStatusOrderByCreatedAtDesc(
            String customerId, BookingStatus status, Pageable pageable);

    // Provider's bookings
    Page<Booking> findByProviderIdOrderByCreatedAtDesc(String providerId, Pageable pageable);
    Page<Booking> findByProviderIdAndStatusOrderByCreatedAtDesc(
            String providerId, BookingStatus status, Pageable pageable);
    Page<Booking> findByProviderUserIdOrderByCreatedAtDesc(
            String providerUserId, Pageable pageable);

    // Double booking check — same provider, same date+time, not cancelled/rejected
    @Query("{ 'providerId': ?0, 'scheduledDate': ?1, 'scheduledTime': ?2, " +
            "'status': { $nin: ['CANCELLED', 'REJECTED'] } }")
    Optional<Booking> findConflictingBooking(
            String providerId, LocalDate date, LocalTime time);

    // For badge/reputation calculations
    long countByProviderIdAndStatus(String providerId, BookingStatus status);

    // Check if customer booked this provider (for verified review)
    @Query("{ 'customerId': ?0, 'providerId': ?1, 'status': 'COMPLETED' }")
    List<Booking> findCompletedBookingsByCustomerAndProvider(
            String customerId, String providerId);

    // Check if booking is already reviewed
    Optional<Booking> findByIdAndStatus(String id, BookingStatus status);

    // For FAST_RESPONDER badge calculation
    @Query("{ 'providerId': ?0, 'status': { $in: ['ACCEPTED', 'REJECTED', 'COMPLETED'] }, " +
            "'respondedAt': { $exists: true } }")
    List<Booking> findRespondedBookings(String providerId);

    // Count by providerId (all statuses)
    long countByProviderId(String providerId);

    long countByCustomerId(String customerId);
    long countByCustomerIdAndStatus(String customerId, BookingStatus status);
}