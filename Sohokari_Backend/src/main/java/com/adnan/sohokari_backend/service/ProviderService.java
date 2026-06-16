package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.exception.BadRequestException;

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
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import com.adnan.sohokari_backend.dto.request.ProviderSearchRequest;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.geo.Point;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;

@Service
@RequiredArgsConstructor
public class ProviderService {

    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    // Get full profile by providerId (public)
    public ProviderProfileResponse getProfile(String providerId) {
        Provider provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new BadRequestException("Provider not found"));

        User user = userRepository.findById(provider.getUserId())
                .orElseThrow(() -> new BadRequestException("User not found"));

        return mapToFullProfile(user, provider);
    }

    // Get full profile by userId (for logged-in provider)
    public ProviderProfileResponse getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        Provider provider = providerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Provider profile not found"));

        return mapToFullProfile(user, provider);
    }

    // Update provider profile
    public ProviderProfileResponse updateProfile(String email,
                                                 UpdateProviderProfileRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        Provider provider = providerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Provider profile not found"));

        if (req.getBio()        != null) provider.setBio(req.getBio());
        if (req.getSkills()     != null) provider.setSkills(req.getSkills());
        if (req.getHourlyRate() != null) provider.setHourlyRate(req.getHourlyRate());
        if (req.getServiceArea()!= null) provider.setServiceArea(req.getServiceArea());
        if (req.getPortfolio()  != null) provider.setPortfolio(req.getPortfolio());
        if (req.getAcceptedPaymentMethods() != null) provider.setAcceptedPaymentMethods(req.getAcceptedPaymentMethods());
        if (req.getPaymentMobileNumber() != null) provider.setPaymentMobileNumber(req.getPaymentMobileNumber());

        if (req.getLongitude() != null && req.getLatitude() != null) {
            provider.setLocation(
                    new GeoJsonPoint(req.getLongitude(), req.getLatitude())
            );
        }

        if (req.getProfilePhoto() != null) {
            user.setProfilePhoto(req.getProfilePhoto());
            userRepository.save(user);
        }

        provider.setUpdatedAt(java.time.LocalDateTime.now());
        providerRepository.save(provider);

        return mapToFullProfile(user, provider);
    }

    // Toggle availability
    public boolean toggleAvailability(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        Provider provider = providerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Provider profile not found"));

        provider.setIsAvailable(!provider.getIsAvailable());
        providerRepository.save(provider);
        return provider.getIsAvailable();
    }

    // Submit Verification
    public ProviderProfileResponse submitVerification(String email, com.adnan.sohokari_backend.dto.request.SubmitVerificationRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        Provider provider = providerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Provider profile not found"));

        provider.setNidImage(req.getNidImage());
        provider.setTradeLicenseImage(req.getTradeLicenseImage());
        provider.setVerificationStatus(com.adnan.sohokari_backend.model.VerificationStatus.PENDING_REVIEW);
        provider.setUpdatedAt(java.time.LocalDateTime.now());
        
        providerRepository.save(provider);
        return mapToFullProfile(user, provider);
    }

    // Dynamic Search
    public List<ProviderSummaryResponse> searchProviders(ProviderSearchRequest req) {
        Query query = new Query();

        // 1. Availability
        query.addCriteria(Criteria.where("isAvailable").is(true));

        // 2. Category
        if (req.getCategory() != null) {
            query.addCriteria(Criteria.where("serviceCategory").is(req.getCategory()));
        }

        // 3. Keyword Search (using regex on bio or skills to avoid special index conflict with geo)
        if (req.getKeyword() != null && !req.getKeyword().trim().isEmpty()) {
            String regex = ".*" + req.getKeyword().trim() + ".*";
            Criteria keywordCriteria = new Criteria().orOperator(
                Criteria.where("bio").regex(regex, "i"),
                Criteria.where("skills").regex(regex, "i")
            );
            query.addCriteria(keywordCriteria);
        }

        // 4. Max Hourly Rate
        if (req.getMaxHourlyRate() != null) {
            query.addCriteria(Criteria.where("hourlyRate").lte(req.getMaxHourlyRate()));
        }

        // 5. Min Rating
        if (req.getMinRating() != null) {
            query.addCriteria(Criteria.where("averageRating").gte(req.getMinRating()));
        }

        // 6. Distance (GeoSpatial)
        if (req.getLatitude() != null && req.getLongitude() != null && req.getMaxDistanceKm() != null) {
            Point point = new Point(req.getLongitude(), req.getLatitude());
            Distance distance = new Distance(req.getMaxDistanceKm(), Metrics.KILOMETERS);
            query.addCriteria(Criteria.where("location").nearSphere(point).maxDistance(distance.getNormalizedValue()));
        }

        List<Provider> providers = mongoTemplate.find(query, Provider.class);

        return providers.stream().map(provider -> {
            User u = userRepository.findById(provider.getUserId()).orElse(new User());
            
            Double dist = null;
            if (req.getLatitude() != null && req.getLongitude() != null && provider.getLocation() != null) {
                 // Simple haversine could be calculated here, but for now we leave it null or use a util.
                 // Mongo's nearSphere sorts by distance automatically.
            }
            return mapToSummary(provider, u.getName(), u.getProfilePhoto(), dist);
        }).collect(Collectors.toList());
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
        
        if (provider.getLocation() != null) {
            res.setLongitude(provider.getLocation().getX());
            res.setLatitude(provider.getLocation().getY());
        }

        res.setAverageRating(provider.getAverageRating());
        res.setReputationScore(provider.getReputationScore());
        res.setTotalCompletedBookings(provider.getTotalCompletedBookings());
        res.setTotalReviews(provider.getTotalReviews());
        res.setIsAvailable(provider.getIsAvailable());
        res.setNidVerified(provider.getNidVerified());
        res.setNidImage(provider.getNidImage());
        res.setTradeLicenseVerified(provider.getTradeLicenseVerified());
        res.setTradeLicenseImage(provider.getTradeLicenseImage());
        res.setVerificationStatus(provider.getVerificationStatus());
        res.setBadges(provider.getBadges());
        res.setPortfolio(provider.getPortfolio());
        res.setAcceptedPaymentMethods(provider.getAcceptedPaymentMethods());
        res.setPaymentMobileNumber(provider.getPaymentMobileNumber());

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
        
        if (provider.getLocation() != null) {
            res.setLongitude(provider.getLocation().getX());
            res.setLatitude(provider.getLocation().getY());
        }
        
        return res;
    }
}