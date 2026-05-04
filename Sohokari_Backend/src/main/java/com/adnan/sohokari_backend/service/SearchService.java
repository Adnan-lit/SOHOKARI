package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.dto.request.SearchRequest;
import com.adnan.sohokari_backend.dto.response.ProviderSummaryResponse;
import com.adnan.sohokari_backend.model.Provider;
import com.adnan.sohokari_backend.model.ServiceCategory;
import com.adnan.sohokari_backend.model.User;
import com.adnan.sohokari_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final MongoTemplate mongoTemplate;
    private final UserRepository userRepository;
    private final ProviderService providerService;

    public Page<ProviderSummaryResponse> search(SearchRequest req) {
        Criteria criteria = new Criteria();
        List<Criteria> filters = new ArrayList<>();

        // 1. Keyword search (text index)
        if (req.getQ() != null && !req.getQ().isBlank()) {
            filters.add(Criteria.where("$text")
                    .is(new org.bson.Document("$search", req.getQ())));
        }

        // 2. Category filter
        if (req.getCategory() != null) {
            filters.add(Criteria.where("serviceCategory").is(req.getCategory().name()));
        }

        // 3. Price range
        if (req.getMinPrice() != null || req.getMaxPrice() != null) {
            Criteria priceCriteria = Criteria.where("hourlyRate");
            if (req.getMinPrice() != null) priceCriteria.gte(req.getMinPrice());
            if (req.getMaxPrice() != null) priceCriteria.lte(req.getMaxPrice());
            filters.add(priceCriteria);
        }

        // 4. Minimum rating
        if (req.getMinRating() != null) {
            filters.add(Criteria.where("averageRating").gte(req.getMinRating()));
        }

        // 5. Availability
        if (req.getAvailable() != null) {
            filters.add(Criteria.where("isAvailable").is(req.getAvailable()));
        }

        // 6. Location filter (within radius)
        if (req.getLat() != null && req.getLng() != null) {
            filters.add(Criteria.where("location").nearSphere(
                            new Point(req.getLng(), req.getLat()))
                    .maxDistance(req.getRadius() / 6371.0) // convert km to radians
            );
        }

        if (!filters.isEmpty()) {
            criteria.andOperator(filters.toArray(new Criteria[0]));
        }

        // Sort
        Sort sort = switch (req.getSortBy()) {
            case "RATING"     -> Sort.by(Sort.Direction.DESC, "averageRating");
            case "PRICE"      -> Sort.by(Sort.Direction.ASC,  "hourlyRate");
            case "REPUTATION" -> Sort.by(Sort.Direction.DESC, "reputationScore");
            default           -> Sort.by(Sort.Direction.DESC, "reputationScore");
        };

        Pageable pageable = PageRequest.of(req.getPage(), req.getSize(), sort);
        Query query = new Query(criteria).with(pageable);

        List<Provider> providers = mongoTemplate.find(query, Provider.class);
        long total = mongoTemplate.count(new Query(criteria), Provider.class);

        // Enrich with user names
        List<String> userIds = providers.stream()
                .map(Provider::getUserId).collect(Collectors.toList());

        Map<String, User> userMap = userRepository.findAllById(userIds)
                .stream().collect(Collectors.toMap(User::getId, u -> u));

        List<ProviderSummaryResponse> result = providers.stream().map(p -> {
            User u = userMap.get(p.getUserId());
            String name  = u != null ? u.getName()        : "Unknown";
            String photo = u != null ? u.getProfilePhoto(): null;
            return providerService.mapToSummary(p, name, photo, null);
        }).collect(Collectors.toList());

        return new PageImpl<>(result, pageable, total);
    }
}