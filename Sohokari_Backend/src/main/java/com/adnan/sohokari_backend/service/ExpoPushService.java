package com.adnan.sohokari_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpoPushService {

    private static final String EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void sendPushNotification(String expoPushToken, String title, String body, Map<String, Object> data) {
        if (expoPushToken == null || !expoPushToken.startsWith("ExponentPushToken")) {
            log.warn("Invalid Expo push token: {}", expoPushToken);
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", MediaType.APPLICATION_JSON_VALUE);
            headers.set("Accept-Encoding", "gzip, deflate");

            Map<String, Object> payload = new HashMap<>();
            payload.put("to", expoPushToken);
            payload.put("title", title);
            payload.put("body", body);
            payload.put("sound", "default");
            
            if (data != null && !data.isEmpty()) {
                payload.put("data", data);
            }

            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);
            String response = restTemplate.postForObject(EXPO_PUSH_API_URL, request, String.class);
            log.info("Expo push notification sent. Response: {}", response);

        } catch (Exception e) {
            log.error("Failed to send Expo push notification: {}", e.getMessage(), e);
        }
    }
}
