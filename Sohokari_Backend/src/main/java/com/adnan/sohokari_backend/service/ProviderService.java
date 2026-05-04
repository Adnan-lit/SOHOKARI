package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.dto.request.UpdateProviderProfileRequest;
import com.adnan.sohokari_backend.dto.response.ProviderProfileResponse;
import com.adnan.sohokari_backend.dto.response.ProviderSummaryResponse;
import com.adnan.sohokari_backend.model.Provider;
import com.adnan.sohokari_backend.model.User;
import com.adnan.sohokari_backend.repository.ProviderRepository;
import com.adnan.sohokari_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProviderService {

    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;

    // Get full profile by providerId (public)
    public ProviderProfileResponse getProfile(String providerId) {
        Provider provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        User user = userRepository.findById(provider.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return mapToFullProfile(user, provider);
    }

    // Get full profile by userId (for logged-in provider)
    public ProviderProfileResponse getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Provider provider = providerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Provider profile not found"));

        return mapToFullProfile(user, provider);
    }

    // Update provider profile
    public ProviderProfileResponse updateProfile(String email,
                                                 UpdateProviderProfileRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Provider provider = providerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Provider profile not found"));

        if (req.getBio()        != null) provider.setBio(req.getBio());
        if (req.getSkills()     != null) provider.setSkills(req.getSkills());
        if (req.getHourlyRate() != null) provider.setHourlyRate(req.getHourlyRate());
        if (req.getServiceArea()!= null) provider.setServiceArea(req.getServiceArea());

        if (req.getLongitude() != null && req.getLatitude() != null) {
            provider.setLocation(
                    new GeoJsonPoint(req.getLongitude(), req.getLatitude())
            );
        }

        provider.setUpdatedAt(java.time.LocalDateTime.now());
        providerRepository.save(provider);

        return mapToFullProfile(user, provider);
    }

    // Toggle availability
    public boolean toggleAvailability(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Provider provider = providerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Provider profile not found"));

        provider.setIsAvailable(!provider.getIsAvailable());
        providerRepository.save(provider);
        return provider.getIsAvailable();
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    public ProviderProfileResponse mapToFullProfile(User user, Provider provider) {
        ProviderProfileResponse res = new ProviderProfileResponse();

        // User fields
        res.setUserId(user.getId());
        res.setName(user.getName());
        res.setEmail(user.getEmail());
        res.setPhone(user.getPhone());
        res.setProfilePhoto(user.getProfilePhoto());
        res.setMemberSince(user.getCreatedAt());

        // Provider fields
        res.setProviderId(provider.getId());
        res.setServiceCategory(provider.getServiceCategory());
        res.setSkills(provider.getSkills());
        res.setBio(provider.getBio());
        res.setHourlyRate(provider.getHourlyRate());
        res.setServiceArea(provider.getServiceArea());
        res.setAverageRating(provider.getAverageRating());
        res.setReputationScore(provider.getReputationScore());
        res.setTotalCompletedBookings(provider.getTotalCompletedBookings());
        res.setTotalReviews(provider.getTotalReviews());
        res.setIsAvailable(provider.getIsAvailable());
        res.setNidVerified(provider.getNidVerified());
        res.setTradeLicenseVerified(provider.getTradeLicenseVerified());
        res.setBadges(provider.getBadges());

        return res;
    }

    public ProviderSummaryResponse mapToSummary(Provider provider, String name,
                                                String photo, Double distanceKm) {
        ProviderSummaryResponse res = new ProviderSummaryResponse();
        res.setProviderId(provider.getId());
        res.setUserId(provider.getUserId());
        res.setName(name);
        res.setProfilePhoto(photo);
        res.setServiceCategory(provider.getServiceCategory());
        res.setSkills(provider.getSkills());
        res.setHourlyRate(provider.getHourlyRate());
        res.setAverageRating(provider.getAverageRating());
        res.setReputationScore(provider.getReputationScore());
        res.setTotalCompletedBookings(provider.getTotalCompletedBookings());
        res.setIsAvailable(provider.getIsAvailable());
        res.setBadges(provider.getBadges());
        res.setServiceArea(provider.getServiceArea());
        res.setDistanceKm(distanceKm);
        return res;
    }
}