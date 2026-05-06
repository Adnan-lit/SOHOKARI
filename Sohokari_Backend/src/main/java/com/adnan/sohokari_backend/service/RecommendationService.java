package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.dto.response.RecommendationResponse;
import com.adnan.sohokari_backend.model.*;
import com.adnan.sohokari_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final ProviderRepository       providerRepository;
    private final UserRepository           userRepository;
    private final UserPreferenceRepository preferenceRepository;

    // ── Main recommendation engine ────────────────────────────────────────

    public List<RecommendationResponse> recommend(String userEmail,
                                                  Double lat, Double lng,
                                                  ServiceCategory category,
                                                  int limit) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserPreference prefs = preferenceRepository
                .findByUserId(user.getId())
                .orElse(new UserPreference());

        // Fall back to last known location if not provided
        double userLat = lat != null ? lat
                : (prefs.getLastLatitude()  != null ? prefs.getLastLatitude()  : 23.8103);
        double userLng = lng != null ? lng
                : (prefs.getLastLongitude() != null ? prefs.getLastLongitude() : 90.4125);

        // Async: update last known location
        updateLocationAsync(user.getId(), userLat, userLng);

        // Fetch providers within 15km
        GeoJsonPoint point = new GeoJsonPoint(userLng, userLat);
        Distance distance = new Distance(15, Metrics.KILOMETERS);

        List<Provider> candidates = category != null
                ? providerRepository.findByLocationNearAndServiceCategory(
                point, distance, category)
                : providerRepository.findByLocationNear(point, distance);

        int safeLimit = Math.max(limit, 0);

        // Filter available only, score, sort, limit
        List<RecommendationResponse> scored = candidates.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsAvailable()))
                .map(p -> scoreProvider(p, userLat, userLng, prefs))
                .sorted(Comparator.comparingDouble(
                        RecommendationResponse::getRecommendationScore).reversed())
                .limit(safeLimit)
                .collect(Collectors.toList());

        // Enrich with user names and photos
        Map<String, Provider> providerById = candidates.stream()
                .collect(Collectors.toMap(Provider::getId, p -> p, (a, b) -> a));
        Set<String> userIds = candidates.stream()
                .map(Provider::getUserId).collect(Collectors.toSet());
        Map<String, User> userMap = userRepository.findAllById(userIds)
                .stream().collect(Collectors.toMap(User::getId, u -> u));

        scored.forEach(r -> {
            Provider p = providerById.get(r.getProviderId());
            if (p != null) {
                User u = userMap.get(p.getUserId());
                if (u != null) {
                    r.setName(u.getName());
                    r.setProfilePhoto(u.getProfilePhoto());
                }
            }
        });

        return scored;
    }

    // ── Scoring formula ───────────────────────────────────────────────────
    // dist(30%) + rating(25%) + availability(20%) + popularity(15%) + pref(10%)

    private RecommendationResponse scoreProvider(Provider p,
                                                 double userLat, double userLng,
                                                 UserPreference prefs) {
        RecommendationResponse res = new RecommendationResponse();
        res.setProviderId(p.getId());
        res.setServiceCategory(p.getServiceCategory());
        res.setSkills(p.getSkills());
        res.setHourlyRate(p.getHourlyRate());
        res.setAverageRating(p.getAverageRating());
        res.setReputationScore(p.getReputationScore());
        res.setIsAvailable(p.getIsAvailable());
        res.setBadges(p.getBadges());

        // 1. Distance score (30%) — 0km=30pts, 15km=0pts
        double distKm = p.getLocation() != null
                ? haversine(userLat, userLng,
                p.getLocation().getY(), p.getLocation().getX()) : 15.0;
        res.setDistanceKm(Math.round(distKm * 10.0) / 10.0);
        double distScore = Math.max(0, 30.0 - (distKm * 2.0));

        // 2. Rating score (25%)
        double rating     = p.getAverageRating() != null ? p.getAverageRating() : 0.0;
        double ratingScore = (rating / 5.0) * 25.0;

        // 3. Availability score (20%)
        double availScore = Boolean.TRUE.equals(p.getIsAvailable()) ? 20.0 : 0.0;

        // 4. Popularity score (15%) — capped at 100 bookings
        int completed = p.getTotalCompletedBookings() != null
                ? p.getTotalCompletedBookings() : 0;
        double popScore = Math.min(completed / 100.0, 1.0) * 15.0;

        // 5. User preference score (10%)
        Map<String, Integer> freqMap = prefs.getCategoryFrequency() != null
                ? prefs.getCategoryFrequency() : Collections.emptyMap();
        String cat = p.getServiceCategory() != null
                ? p.getServiceCategory().name() : "";
        double prefScore = 0;
        if (!freqMap.isEmpty()) {
            int freq = freqMap.getOrDefault(cat, 0);
            int maxFreq = freqMap.values().stream()
                    .mapToInt(i -> i).max().orElse(1);
            prefScore = maxFreq > 0 ? (freq / (double) maxFreq) * 8.0 : 0;
        }
        // Previously booked provider bonus
        List<String> bookedProviderIds = prefs.getBookedProviderIds() != null
                ? prefs.getBookedProviderIds() : Collections.emptyList();
        if (bookedProviderIds.contains(p.getId())) {
            prefScore = Math.min(prefScore + 2.0, 10.0);
        }

        double total = Math.round(
                (distScore + ratingScore + availScore + popScore + prefScore) * 100.0
        ) / 100.0;

        res.setRecommendationScore(total);
        res.setDistanceScore(Math.round(distScore     * 100.0) / 100.0);
        res.setRatingScore  (Math.round(ratingScore   * 100.0) / 100.0);
        res.setAvailabilityScore(availScore);
        res.setPopularityScore  (Math.round(popScore  * 100.0) / 100.0);
        res.setPreferenceScore  (Math.round(prefScore * 100.0) / 100.0);

        return res;
    }

    // ── Preference tracking ───────────────────────────────────────────────

    @Async
    public void recordSearch(String userId, String keyword,
                             ServiceCategory category,
                             Double lat, Double lng) {
        UserPreference pref = getOrCreate(userId);

        if (pref.getRecentSearchKeywords() == null) {
            pref.setRecentSearchKeywords(new ArrayList<>());
        }
        if (pref.getCategoryFrequency() == null) {
            pref.setCategoryFrequency(new HashMap<>());
        }

        if (keyword != null && !keyword.isBlank()) {
            pref.getRecentSearchKeywords().add(0, keyword.toLowerCase());
            if (pref.getRecentSearchKeywords().size() > 20) {
                pref.setRecentSearchKeywords(
                        pref.getRecentSearchKeywords().subList(0, 20));
            }
        }
        if (category != null) {
            pref.getCategoryFrequency().merge(category.name(), 1, Integer::sum);
        }
        if (lat != null) pref.setLastLatitude(lat);
        if (lng != null) pref.setLastLongitude(lng);

        pref.setUpdatedAt(LocalDateTime.now());
        preferenceRepository.save(pref);
    }

    @Async
    public void recordBooking(String userId, String providerId,
                              ServiceCategory category) {
        UserPreference pref = getOrCreate(userId);

        if (pref.getBookedProviderIds() == null) {
            pref.setBookedProviderIds(new ArrayList<>());
        }
        if (pref.getCategoryFrequency() == null) {
            pref.setCategoryFrequency(new HashMap<>());
        }

        if (!pref.getBookedProviderIds().contains(providerId)) {
            pref.getBookedProviderIds().add(providerId);
        }
        if (category != null) {
            // Booking counts more than search (weight = 3)
            pref.getCategoryFrequency().merge(category.name(), 3, Integer::sum);
        }
        pref.setUpdatedAt(LocalDateTime.now());
        preferenceRepository.save(pref);
    }

    @Async
    public void updateLocationAsync(String userId, double lat, double lng) {
        UserPreference pref = getOrCreate(userId);
        pref.setLastLatitude(lat);
        pref.setLastLongitude(lng);
        pref.setUpdatedAt(LocalDateTime.now());
        preferenceRepository.save(pref);
    }

    private UserPreference getOrCreate(String userId) {
        return preferenceRepository.findByUserId(userId).orElseGet(() -> {
            UserPreference p = new UserPreference();
            p.setUserId(userId);
            p.setRecentSearchKeywords(new ArrayList<>());
            p.setBookedProviderIds(new ArrayList<>());
            p.setCategoryFrequency(new HashMap<>());
            return p;
        });
    }

    // Haversine formula
    private double haversine(double lat1, double lng1,
                             double lat2, double lng2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}