package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.dto.request.CreateReviewRequest;
import com.adnan.sohokari_backend.dto.response.ReviewResponse;
import com.adnan.sohokari_backend.model.*;
import com.adnan.sohokari_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository    reviewRepository;
    private final BookingRepository   bookingRepository;
    private final UserRepository      userRepository;
    private final ReputationService   reputationService;
    private final FcmService          fcmService;

    // ── Submit verified review ────────────────────────────────────────────

    public ReviewResponse submitReview(String customerEmail,
                                       CreateReviewRequest req) {

        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // ── Verification gate ─────────────────────────────────────────────

// 1. Booking must exist
        Booking booking = bookingRepository.findById(req.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

// 2. Must be THIS customer's booking — not someone else's
        if (!booking.getCustomerId().equals(customer.getId())) {
            throw new RuntimeException(
                    "You did not make this booking");
        }

// 3. Booking must be COMPLETED — not just any status
        if (booking.getStatus() != BookingStatus.COMPLETED
                && booking.getStatus() != BookingStatus.REVIEWED) {
            throw new RuntimeException(
                    "You can only review after the service is completed. " +
                            "Current status: " + booking.getStatus());
        }

// 4. One review per booking — cannot review the same service twice
        if (reviewRepository.existsByBookingId(req.getBookingId())) {
            throw new RuntimeException(
                    "You have already submitted a review for this booking");
        }

// 5. Extra guard — verify customer actually has a completed booking
//    with this provider (covers edge cases like manual DB changes)
        List<Booking> completedWithProvider = bookingRepository
                .findCompletedBookingsByCustomerAndProvider(
                        customer.getId(), booking.getProviderId());

        if (completedWithProvider.isEmpty()) {
            throw new RuntimeException(
                    "You can only review a provider after completing a service with them");
        }

        // ── Calculate average ──────────────────────────────────────────────
        double average = (req.getServiceQuality()
                + req.getCommunication()
                + req.getTimeliness()
                + req.getProfessionalBehavior()
                + req.getOverallSatisfaction()) / 5.0;

        average = Math.round(average * 10.0) / 10.0;

        // ── Save review ───────────────────────────────────────────────────
        Review review = new Review();
        review.setBookingId(req.getBookingId());
        review.setCustomerId(customer.getId());
        review.setProviderId(booking.getProviderId());
        review.setServiceQuality(req.getServiceQuality());
        review.setCommunication(req.getCommunication());
        review.setTimeliness(req.getTimeliness());
        review.setProfessionalBehavior(req.getProfessionalBehavior());
        review.setOverallSatisfaction(req.getOverallSatisfaction());
        review.setAverageRating(average);
        review.setReviewText(req.getReviewText());
        reviewRepository.save(review);

        // Update booking status to REVIEWED
        booking.setStatus(BookingStatus.REVIEWED);
        bookingRepository.save(booking);

        // ── Async: recalculate reputation + badges ─────────────────────────
        reputationService.recalculate(booking.getProviderId());

        // ── Notify provider ───────────────────────────────────────────────
        fcmService.sendNotification(
                booking.getProviderUserId(),
                "New review received ⭐",
                customer.getName() + " rated you " + average + "/5",
                Notification.NotificationType.REVIEW_RECEIVED,
                review.getId()
        );

        return mapToResponse(review, customer);
    }

    // ── Get provider reviews (paginated, public) ──────────────────────────

    public Page<ReviewResponse> getProviderReviews(String providerId,
                                                   int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Review> reviews = reviewRepository
                .findByProviderIdOrderByCreatedAtDesc(providerId, pageable);

        // Enrich with customer names
        var customerIds = reviews.stream()
                .map(Review::getCustomerId).collect(Collectors.toSet());
        Map<String, User> customerMap = userRepository.findAllById(customerIds)
                .stream().collect(Collectors.toMap(User::getId, u -> u));

        return reviews.map(r -> {
            User c = customerMap.get(r.getCustomerId());
            return mapToResponse(r, c);
        });
    }

    // ── Check if review exists for a booking ─────────────────────────────

    public boolean reviewExists(String bookingId) {
        return reviewRepository.existsByBookingId(bookingId);
    }

    // ── Delete review (customer only) ─────────────────────────────────────

    public void deleteReview(String customerEmail, String reviewId) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getCustomerId().equals(customer.getId())) {
            throw new RuntimeException("Not authorized to delete this review");
        }

        String providerId = review.getProviderId();
        reviewRepository.delete(review);

        // Recalculate after deletion
        reputationService.recalculate(providerId);
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private ReviewResponse mapToResponse(Review review, User customer) {
        ReviewResponse res = new ReviewResponse();
        res.setReviewId(review.getId());
        res.setBookingId(review.getBookingId());
        res.setCustomerId(review.getCustomerId());
        res.setCustomerName(customer != null ? customer.getName() : "Anonymous");
        res.setCustomerPhoto(customer != null ? customer.getProfilePhoto() : null);
        res.setProviderId(review.getProviderId());
        res.setServiceQuality(review.getServiceQuality());
        res.setCommunication(review.getCommunication());
        res.setTimeliness(review.getTimeliness());
        res.setProfessionalBehavior(review.getProfessionalBehavior());
        res.setOverallSatisfaction(review.getOverallSatisfaction());
        res.setAverageRating(review.getAverageRating());
        res.setReviewText(review.getReviewText());
        res.setCreatedAt(review.getCreatedAt());
        return res;
    }
}