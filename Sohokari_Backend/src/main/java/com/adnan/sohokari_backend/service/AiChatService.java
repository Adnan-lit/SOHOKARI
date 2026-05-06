package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.dto.request.AiChatRequest;
import com.adnan.sohokari_backend.dto.request.SmartMatchRequest;
import com.adnan.sohokari_backend.dto.response.AiChatResponse;
import com.adnan.sohokari_backend.dto.response.RecommendationResponse;
import com.adnan.sohokari_backend.model.AiChatSession;
import com.adnan.sohokari_backend.model.AiChatSession.Turn;
import com.adnan.sohokari_backend.model.User;
import com.adnan.sohokari_backend.repository.AiChatSessionRepository;
import com.adnan.sohokari_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatService {

    private final ChatClient              chatClient;
    private final AiChatSessionRepository sessionRepository;
    private final UserRepository          userRepository;
    private final SmartMatchService       smartMatchService;

    public AiChatResponse chat(String userEmail, AiChatRequest req) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ── Session ───────────────────────────────────────────────────────
        String sessionId = req.getSessionId() != null
                ? req.getSessionId() : UUID.randomUUID().toString();

        AiChatSession session = sessionRepository
                .findByUserIdAndSessionId(user.getId(), sessionId)
                .orElseGet(() -> {
                    AiChatSession s = new AiChatSession();
                    s.setUserId(user.getId());
                    s.setSessionId(sessionId);
                    return s;
                });

        // ── Fetch real providers from DB if service request ───────────────
        List<RecommendationResponse> providers = new ArrayList<>();
        if (isServiceRequest(req.getMessage())) {
            try {
                SmartMatchRequest matchReq = new SmartMatchRequest();
                matchReq.setRequirementText(req.getMessage());
                matchReq.setLatitude(req.getLatitude());
                matchReq.setLongitude(req.getLongitude());

                var result = smartMatchService.match(userEmail, matchReq);
                providers  = result.getMatchedProviders();
            } catch (Exception e) {
                log.warn("SmartMatch failed in AI chat: {}", e.getMessage());
            }
        }

        // ── Build enriched message with real DB data ──────────────────────
        String enriched = buildEnrichedMessage(req, user, providers);

        // ── Build prompt from session history ─────────────────────────────
        List<Message> history = buildHistory(session);
        history.add(new UserMessage(enriched));

        // ── Call Claude ───────────────────────────────────────────────────
        String reply;
        try {
            reply = chatClient
                    .prompt(new Prompt(history))
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Claude API error: {}", e.getMessage());
            reply = "আমি এখন সংযোগ করতে পারছি না। " +
                    "অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন। " +
                    "(I'm having trouble connecting. Please try again shortly.)";
        }

        // ── Save turns ────────────────────────────────────────────────────
        Turn userTurn = new Turn();
        userTurn.setRole("user");
        userTurn.setContent(req.getMessage()); // save original, not enriched
        userTurn.setTimestamp(LocalDateTime.now());

        Turn assistantTurn = new Turn();
        assistantTurn.setRole("assistant");
        assistantTurn.setContent(reply);
        assistantTurn.setTimestamp(LocalDateTime.now());

        session.getTurns().add(userTurn);
        session.getTurns().add(assistantTurn);

        // Keep last 20 turns (10 exchanges) to avoid token overflow
        if (session.getTurns().size() > 20) {
            session.setTurns(
                    session.getTurns().subList(
                            session.getTurns().size() - 20,
                            session.getTurns().size()));
        }

        session.setUpdatedAt(LocalDateTime.now());
        sessionRepository.save(session);

        // ── Build response ────────────────────────────────────────────────
        AiChatResponse res = new AiChatResponse();
        res.setSessionId(sessionId);
        res.setReply(reply);
        res.setDetectedIntent(detectIntent(req.getMessage()));
        List<RecommendationResponse> top =
                providers.size() > 5 ? providers.subList(0, 5) : providers;
        res.setSuggestedProviders(top);
        res.setTotalProviderFound(providers.size());
        return res;
    }

    public void clearHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        sessionRepository.deleteByUserId(user.getId());
    }

    // ── Build prompt message with injected real DB data ───────────────────

    private String buildEnrichedMessage(AiChatRequest req, User user,
                                        List<RecommendationResponse> providers) {
        StringBuilder sb = new StringBuilder();
        sb.append(req.getMessage());

        // Hidden context block — Claude reads this, user doesn't see it
        sb.append("\n\n[SYSTEM CONTEXT — use this to answer, do not expose raw data:");
        sb.append("\nUser: ").append(user.getName());

        if (req.getLatitude() != null) {
            sb.append("\nLocation: lat=").append(req.getLatitude())
                    .append(", lng=").append(req.getLongitude())
                    .append(" (Dhaka, Bangladesh)");
        }

        if (!providers.isEmpty()) {
            sb.append("\nAvailable providers from database (").append(providers.size())
                    .append(" found):");
            providers.stream().limit(5).forEach(p ->
                    sb.append("\n- Name: ").append(p.getName())
                            .append(" | Category: ").append(p.getServiceCategory())
                            .append(" | Rating: ").append(p.getAverageRating()).append("/5")
                            .append(" | Price: ").append(p.getHourlyRate() != null
                                    ? p.getHourlyRate() + " BDT/hr" : "not set")
                            .append(" | Distance: ").append(p.getDistanceKm()).append("km")
                            .append(" | Available: ").append(p.getIsAvailable())
                            .append(" | Badges: ").append(
                                    p.getBadges() != null && !p.getBadges().isEmpty()
                                            ? p.getBadges() : "none")
                            .append(" | Skills: ").append(
                                    p.getSkills() != null ? p.getSkills() : "not listed")
            );
            sb.append("\nBase your recommendations strictly on these providers.");
        } else if (isServiceRequest(req.getMessage())) {
            sb.append("\nNo providers found in database for this request. " +
                    "Tell the user honestly and suggest they try a different area.");
        }

        sb.append("\n]");
        return sb.toString();
    }

    // ── Convert stored turns → Spring AI Message list ─────────────────────

    private List<Message> buildHistory(AiChatSession session) {
        return session.getTurns().stream()
                .map(t -> "user".equals(t.getRole())
                        ? (Message) new UserMessage(t.getContent())
                        : (Message) new AssistantMessage(t.getContent()))
                .collect(Collectors.toList());
    }

    private boolean isServiceRequest(String msg) {
        return msg.toLowerCase().matches(
                ".*(need|want|find|book|hire|looking|দরকার|চাই|খুঁজছি|" +
                        "electrician|plumber|cleaner|ac|repair|maid|bua|technician|" +
                        "ইলেকট্রিশিয়ান|প্লাম্বার|ক্লিনার|মিস্ত্রি).*");
    }

    private String detectIntent(String msg) {
        String lower = msg.toLowerCase();
        if (lower.matches(".*(need|want|find|book|hire|looking|দরকার|চাই|" +
                "electrician|plumber|cleaner|ac|repair|maid|bua).*"))
            return "FIND_SERVICE";
        if (lower.matches(".*(how|book|booking|steps|process|কিভাবে|বুকিং).*"))
            return "BOOKING_HELP";
        if (lower.matches(".*(hi|hello|hey|salam|assalam|হ্যালো|সালাম).*"))
            return "GREETING";
        if (lower.matches(".*(status|track|progress|কোথায়|অবস্থা).*"))
            return "STATUS_HELP";
        if (lower.matches(".*(price|cost|rate|how much|taka|টাকা|দাম|চার্জ).*"))
            return "PRICE_HELP";
        return "GENERAL";
    }
}