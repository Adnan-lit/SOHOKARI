package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.dto.response.ProviderSummaryResponse;
import com.adnan.sohokari_backend.model.Provider;
import com.adnan.sohokari_backend.model.ServiceCategory;
import com.adnan.sohokari_backend.model.User;
import com.adnan.sohokari_backend.repository.ProviderRepository;
import com.adnan.sohokari_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;
    private final ProviderService providerService;

    public List<ProviderSummaryResponse> findNearby(Double lat, Double lng,
                                                    Double radiusKm,
                                                    ServiceCategory category) {
        GeoJsonPoint userLocation = new GeoJsonPoint(lng, lat); // MongoDB: longitude first
        Distance distance  = new Distance(radiusKm, Metrics.KILOMETERS);

        List<Provider> providers;

        if (category != null) {
            providers = providerRepository
                    .findByLocationNearAndServiceCategory(userLocation, distance, category);
        } else {
            providers = providerRepository
                    .findByLocationNear(userLocation, distance);
        }

        // Filter only available providers
        providers = providers.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsAvailable()))
                .collect(Collectors.toList());

        // Enrich with user info and calculate distance
        List<String> userIds = providers.stream()
                .map(Provider::getUserId).collect(Collectors.toList());

        Map<String, User> userMap = userRepository.findAllById(userIds)
                .stream().collect(Collectors.toMap(User::getId, u -> u));

        return providers.stream().map(p -> {
            User u = userMap.get(p.getUserId());
            String name  = u != null ? u.getName()        : "Unknown";
            String photo = u != null ? u.getProfilePhoto(): null;

            // Calculate distance in km
            Double distKm = p.getLocation() != null
                    ? calculateDistanceKm(lat, lng,
                    p.getLocation().getY(),  // latitude
                    p.getLocation().getX())  // longitude
                    : null;

            return providerService.mapToSummary(p, name, photo, distKm);
        }).collect(Collectors.toList());
    }

    // Haversine formula
    private double calculateDistanceKm(double lat1, double lng1,
                                       double lat2, double lng2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10.0) / 10.0; // round to 1 decimal
    }
}