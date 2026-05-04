package com.adnan.sohokari_backend.repository;

import com.adnan.sohokari_backend.model.Provider;
import com.adnan.sohokari_backend.model.ServiceCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.geo.Distance;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProviderRepository extends MongoRepository<Provider, String> {

    Optional<Provider> findByUserId(String userId);
    boolean existsByUserId(String userId);

    // Nearby search using MongoDB 2dsphere index
    List<Provider> findByLocationNear(GeoJsonPoint point, Distance distance);

    // Nearby with category filter
    List<Provider> findByLocationNearAndServiceCategory(
            GeoJsonPoint point, Distance distance, ServiceCategory category
    );

    // Nearby with availability filter
    List<Provider> findByLocationNearAndIsAvailable(
            GeoJsonPoint point, Distance distance, Boolean isAvailable
    );

    // Filter by category
    Page<Provider> findByServiceCategory(ServiceCategory category, Pageable pageable);

    // Filter by availability
    Page<Provider> findByIsAvailable(Boolean isAvailable, Pageable pageable);

    // Filter by rating range
    @Query("{ 'averageRating': { $gte: ?0 } }")
    Page<Provider> findByAverageRatingGreaterThanEqual(Double minRating, Pageable pageable);

    // Filter by price range
    @Query("{ 'hourlyRate': { $gte: ?0, $lte: ?1 } }")
    Page<Provider> findByHourlyRateBetween(Double min, Double max, Pageable pageable);

    // Text search (uses MongoDB text index)
    @Query("{ '$text': { '$search': ?0 } }")
    Page<Provider> findByTextSearch(String keyword, Pageable pageable);
}