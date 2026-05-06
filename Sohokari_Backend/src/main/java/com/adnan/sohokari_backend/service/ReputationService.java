package com.adnan.sohokari_backend.service;


import com.adnan.sohokari_backend.dto.response.ReputationResponse;
import com.adnan.sohokari_backend.model.*;
import com.adnan.sohokari_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReputationService {

    private final ProviderRepository  providerRepository;
    private final ReviewRepository    reviewRepository;
    private final BookingRepository   bookingRepository;
    private final UserRepository      userRepository;

    // ── Triggered after each completed booking / new review ───────────────

    @Async
    public void recalculate(String providerId) {
        providerRepository.findById(providerId).ifPresent(provider -> {
            // ── 1. Average rating from all reviews ────────────────────────
            List<Review> reviews = reviewRepository.findAllByProviderId(providerId);
            double avgRating = reviews.stream()
                    .mapToDouble(Review::getAverageRating)
                    .average()
                    .orElse(0.0);

            // ── 2. Completion rate ─────────────────────────────────────────
            long totalBookings  = bookingRepository.countByProviderIdAndStatus(
                    providerId, null);   // we'll count all non-cancelled
            long completed      = bookingRepository.countByProviderIdAndStatus(
                    providerId, BookingStatus.COMPLETED);
            long cancelled      = bookingRepository.countByProviderIdAndStatus(
                    providerId, BookingStatus.CANCELLED);
            long totalAttempted = completed + cancelled;
            double completionRate = totalAttempted > 0
                    ? (double) completed / totalAttempted : 0.0;

            // ── 3. Response rate ───────────────────────────────────────────
            long totalRequested = bookingRepository.countByProviderIdAndStatus(
                    providerId, BookingStatus.REQUESTED)
                    + bookingRepository.countByProviderIdAndStatus(
                    providerId, BookingStatus.ACCEPTED)
                    + bookingRepository.countByProviderIdAndStatus(
                    providerId, BookingStatus.REJECTED)
                    + completed;
            long responded = bookingRepository.countByProviderIdAndStatus(
                    providerId, BookingStatus.ACCEPTED)
                    + bookingRepository.countByProviderIdAndStatus(
                    providerId, BookingStatus.REJECTED)
                    + completed;
            double responseRate = totalRequested > 0
                    ? (double) responded / totalRequested : 0.0;

            // ── 4. Review count score (0–10, capped at 100 reviews) ────────
            double reviewScore = Math.min(reviews.size(), 100) / 100.0;

            // ── 5. Badge bonus (each badge = 2 pts, max 10) ───────────────
            List<String> badges = assignBadges(provider, avgRating, completed,
                    reviews.size(), userRepository);
            double badgeBonus = Math.min(badges.size() * 2.0, 10.0) / 10.0;

            // ── Reputation Score formula ───────────────────────────────────
            double score = (avgRating / 5.0)  * 40.0
                    + completionRate      * 25.0
                    + responseRate        * 15.0
                    + reviewScore         * 10.0
                    + badgeBonus          * 10.0;

            // Round to 2 decimal places
            score = Math.round(score * 100.0) / 100.0;

            // ── Persist ────────────────────────────────────────────────────
            provider.setAverageRating(
                    Math.round(avgRating * 10.0) / 10.0);
            provider.setReputationScore(score);
            provider.setTotalReviews(reviews.size());
            provider.setBadges(badges);
            provider.setUpdatedAt(LocalDateTime.now());
            providerRepository.save(provider);

            log.info("Reputation updated for provider {}: score={}, rating={}",
                    providerId, score, avgRating);
        });
    }

    // ── Badge assignment logic ─────────────────────────────────────────────

    private List<String> assignBadges(Provider provider, double avgRating,
                                      long completed, int reviewCount,
                                      UserRepository userRepository) {
        List<String> badges = new ArrayList<>();

        // TOP_RATED: rating >= 4.7 AND completed >= 20
        if (avgRating >= 4.7 && completed >= 20) {
            badges.add(BadgeType.TOP_RATED.name());
        }

        // TRUSTED_PROVIDER: nid verified + rating >= 4.5 + completed >= 50
        if (Boolean.TRUE.equals(provider.getNidVerified())
                && avgRating >= 4.5 && completed >= 50) {
            badges.add(BadgeType.TRUSTED_PROVIDER.name());
        }

        // NEW_RISING: account < 90 days + completed >= 5 + rating >= 4.3
        long daysSinceJoined = ChronoUnit.DAYS.between(
                provider.getCreatedAt(), LocalDateTime.now());
        if (daysSinceJoined < 90 && completed >= 5 && avgRating >= 4.3) {
            badges.add(BadgeType.NEW_RISING.name());
        }

        // FAST_RESPONDER: check average response time < 10 minutes
        // (Response time = respondedAt - requestedAt on accepted/rejected bookings)
        double avgResponseMinutes = calculateAvgResponseMinutes(provider.getId());
        if (avgResponseMinutes > 0 && avgResponseMinutes < 10) {
            badges.add(BadgeType.FAST_RESPONDER.name());
        }

        return badges;
    }

    private double calculateAvgResponseMinutes(String providerId) {
        // Fetch accepted + rejected bookings that have respondedAt set
        List<Booking> responded = bookingRepository
                .findRespondedBookings(providerId);

        if (responded.isEmpty()) return -1;

        double avgMinutes = responded.stream()
                .filter(b -> b.getRespondedAt() != null && b.getRequestedAt() != null)
                .mapToLong(b -> ChronoUnit.MINUTES.between(
                        b.getRequestedAt(), b.getRespondedAt()))
                .filter(mins -> mins >= 0)
                .average()
                .orElse(-1);

        return avgMinutes;
    }

    // ── Scheduled: runs every 6 hours for MOST_BOOKED badge ──────────────

    @Scheduled(cron = "0 0 */6 * * *")
    public void recalculateMostBooked() {
        log.info("Running scheduled MOST_BOOKED badge calculation");

        List<Provider> allProviders = providerRepository.findAll();

        // Sort by completed bookings descending
        allProviders.sort((a, b) ->
                Integer.compare(b.getTotalCompletedBookings(),
                        a.getTotalCompletedBookings()));

        // Top 10% get MOST_BOOKED badge
        int topCount = Math.max(1, (int)(allProviders.size() * 0.10));
        List<Provider> topProviders = allProviders.subList(0, topCount);

        Set<String> topIds = topProviders.stream()
                .map(Provider::getId)
                .collect(Collectors.toSet());

        allProviders.forEach(p -> {
            List<String> badges = p.getBadges() != null
                    ? new ArrayList<>(p.getBadges()) : new ArrayList<>();

            if (topIds.contains(p.getId())) {
                if (!badges.contains(BadgeType.MOST_BOOKED.name())) {
                    badges.add(BadgeType.MOST_BOOKED.name());
                }
            } else {
                badges.remove(BadgeType.MOST_BOOKED.name());
            }

            p.setBadges(badges);
            providerRepository.save(p);
        });
    }

    // ── Public: get reputation breakdown ──────────────────────────────────

    public ReputationResponse getReputation(String providerId) {
        Provider provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        long completed = bookingRepository.countByProviderIdAndStatus(
                providerId, BookingStatus.COMPLETED);
        long cancelled = bookingRepository.countByProviderIdAndStatus(
                providerId, BookingStatus.CANCELLED);
        long totalAttempted = completed + cancelled;
        double completionRate = totalAttempted > 0
                ? (double) completed / totalAttempted : 0.0;

        long totalRequested = completed
                + bookingRepository.countByProviderIdAndStatus(
                providerId, BookingStatus.REQUESTED)
                + bookingRepository.countByProviderIdAndStatus(
                providerId, BookingStatus.ACCEPTED)
                + bookingRepository.countByProviderIdAndStatus(
                providerId, BookingStatus.REJECTED);
        long responded = completed
                + bookingRepository.countByProviderIdAndStatus(
                providerId, BookingStatus.ACCEPTED)
                + bookingRepository.countByProviderIdAndStatus(
                providerId, BookingStatus.REJECTED);
        double responseRate = totalRequested > 0
                ? (double) responded / totalRequested : 0.0;

        long reviewCount = reviewRepository.countByProviderId(providerId);
        double reviewScore = Math.min(reviewCount, 100) / 100.0;
        double badgeBonus  = Math.min(
                (provider.getBadges() != null ? provider.getBadges().size() : 0) * 2.0,
                10.0) / 10.0;

        ReputationResponse res = new ReputationResponse();
        res.setProviderId(providerId);
        res.setReputationScore(provider.getReputationScore());
        res.setAverageRating(provider.getAverageRating());
        res.setCompletionRate(
                Math.round(completionRate * 1000.0) / 10.0);  // as percentage
        res.setResponseRate(
                Math.round(responseRate * 1000.0) / 10.0);
        res.setTotalReviews(reviewCount);
        res.setTotalCompleted(completed);
        res.setTotalBookings(totalRequested);
        res.setBadges(provider.getBadges());

        // Score breakdown
        res.setRatingComponent(
                Math.round((provider.getAverageRating() / 5.0) * 40 * 100) / 100.0);
        res.setCompletionComponent(
                Math.round(completionRate * 25 * 100) / 100.0);
        res.setResponseComponent(
                Math.round(responseRate * 15 * 100) / 100.0);
        res.setReviewComponent(
                Math.round(reviewScore * 10 * 100) / 100.0);
        res.setBadgeComponent(
                Math.round(badgeBonus * 10 * 100) / 100.0);

        return res;
    }
}