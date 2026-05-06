package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.dto.request.SmartMatchRequest;
import com.adnan.sohokari_backend.dto.response.RecommendationResponse;
import com.adnan.sohokari_backend.dto.response.SmartMatchResponse;
import com.adnan.sohokari_backend.model.*;
import com.adnan.sohokari_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmartMatchService {

    private final ProviderRepository    providerRepository;
    private final UserRepository        userRepository;
    private final RecommendationService recommendationService;

    // ── Keyword → Category map ────────────────────────────────────────────

    private static final Map<List<String>, ServiceCategory> KEYWORD_MAP =
            new LinkedHashMap<>() {{
                put(List.of("electric","electrician","wiring","fan","switch",
                                "socket","light","mcb","circuit","voltage","power"),
                        ServiceCategory.ELECTRICIAN);
                put(List.of("plumb","plumber","pipe","leak","drain","tap",
                                "faucet","water","toilet","basin","sewage","clog"),
                        ServiceCategory.PLUMBER);
                put(List.of("clean","cleaner","cleaning","wash","mop",
                                "dust","sweep","vacuum","scrub","sanitize"),
                        ServiceCategory.CLEANER);
                put(List.of("bua","maid","cook","household","house help",
                                "domestic","cooking","servant","helper"),
                        ServiceCategory.BUA);
                put(List.of("ac","air condition","aircon","cooling","hvac",
                                "split","window ac","air cooler","refrigerant"),
                        ServiceCategory.AC_CLEANER);
                put(List.of("repair","fix","broken","technician","appliance",
                                "fridge","tv","washing machine","microwave","oven"),
                        ServiceCategory.REPAIRMAN);
            }};

    // Stop words to ignore during keyword extraction
    private static final Set<String> STOP_WORDS = Set.of(
            "i","me","my","a","an","the","is","in","at","on","to","for",
            "need","want","please","help","get","find","looking","can","you",
            "today","tomorrow","now","urgent","asap","near","nearby","good","best"
    );

    // ── Main match method ─────────────────────────────────────────────────

    public SmartMatchResponse match(String userEmail, SmartMatchRequest req) {

        String text = req.getRequirementText().toLowerCase();

        // 1. Extract meaningful keywords
        List<String> keywords = extractKeywords(text);

        // 2. Detect service category
        ServiceCategory category = detectCategory(text);

        log.info("SmartMatch — keywords: {}, category: {}", keywords, category);

        // 3. Fetch candidates from MongoDB
        List<Provider> candidates = fetchCandidates(
                category, req.getLatitude(), req.getLongitude());

        // 4. Score each candidate
        Map<String, User> userMap = buildUserMap(candidates);

        List<RecommendationResponse> matched = candidates.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsAvailable()))
                .map(p -> buildScoredResponse(p, keywords, userMap))
                .filter(r -> r.getRecommendationScore() > 0)
                .sorted(Comparator.comparingDouble(
                        RecommendationResponse::getRecommendationScore).reversed())
                .limit(10)
                .collect(Collectors.toList());

        // 5. Record search preference async
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user != null) {
            recommendationService.recordSearch(
                    user.getId(),
                    req.getRequirementText(),
                    category,
                    req.getLatitude(),
                    req.getLongitude()
            );
        }

        SmartMatchResponse res = new SmartMatchResponse();
        res.setExtractedKeywords(keywords);
        res.setDetectedCategory(category != null ? category.name() : "UNKNOWN");
        res.setMatchedProviders(matched);
        res.setTotalFound(matched.size());
        return res;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private List<String> extractKeywords(String text) {
        return Arrays.stream(text.split("[\\s,!?.]+"))
                .map(String::toLowerCase)
                .filter(w -> w.length() > 2)
                .filter(w -> !STOP_WORDS.contains(w))
                .distinct()
                .collect(Collectors.toList());
    }

    private ServiceCategory detectCategory(String text) {
        for (Map.Entry<List<String>, ServiceCategory> entry
                : KEYWORD_MAP.entrySet()) {
            for (String kw : entry.getKey()) {
                if (text.contains(kw)) return entry.getValue();
            }
        }
        return null;
    }

    private List<Provider> fetchCandidates(ServiceCategory category,
                                           Double lat, Double lng) {
        if (lat != null && lng != null) {
            GeoJsonPoint point = new GeoJsonPoint(lng, lat);
            Distance dist  = new Distance(15, Metrics.KILOMETERS);
            return category != null
                    ? providerRepository.findByLocationNearAndServiceCategory(
                    point, dist, category)
                    : providerRepository.findByLocationNear(point, dist);
        }
        return category != null
                ? providerRepository.findByServiceCategory(
                category, PageRequest.of(0, 20)).getContent()
                : providerRepository.findAll(PageRequest.of(0, 20)).getContent();
    }

    private Map<String, User> buildUserMap(List<Provider> providers) {
        List<String> ids = providers.stream()
                .map(Provider::getUserId).collect(Collectors.toList());
        return userRepository.findAllById(ids)
                .stream().collect(Collectors.toMap(User::getId, u -> u));
    }

    private RecommendationResponse buildScoredResponse(Provider p,
                                                       List<String> keywords,
                                                       Map<String, User> userMap) {
        RecommendationResponse res = new RecommendationResponse();
        res.setProviderId(p.getId());
        res.setServiceCategory(p.getServiceCategory());
        res.setSkills(p.getSkills());
        res.setHourlyRate(p.getHourlyRate());
        res.setAverageRating(p.getAverageRating());
        res.setReputationScore(p.getReputationScore());
        res.setIsAvailable(p.getIsAvailable());
        res.setBadges(p.getBadges());

        User u = userMap.get(p.getUserId());
        if (u != null) {
            res.setName(u.getName());
            res.setProfilePhoto(u.getProfilePhoto());
        }

        res.setRecommendationScore(computeScore(p, keywords));
        return res;
    }

    private double computeScore(Provider p, List<String> keywords) {
        // Skill keyword overlap (60%)
        double skillScore = 0;
        if (p.getSkills() != null && !p.getSkills().isEmpty()
                && !keywords.isEmpty()) {
            String skillText = String.join(" ", p.getSkills()).toLowerCase();
            long matches = keywords.stream()
                    .filter(skillText::contains).count();
            skillScore = (matches / (double) keywords.size()) * 60.0;
        } else if (p.getServiceCategory() != null) {
            // Category matched but no skill overlap — give base score
            skillScore = 20.0;
        }

        // Rating bonus (25%)
        double ratingBonus = (p.getAverageRating() != null
                ? p.getAverageRating() / 5.0 : 0) * 25.0;

        // Reputation bonus (15%)
        double repBonus = (p.getReputationScore() != null
                ? p.getReputationScore() / 100.0 : 0) * 15.0;

        return Math.round((skillScore + ratingBonus + repBonus) * 100.0) / 100.0;
    }
}