package com.adnan.sohokari_backend.controller;

import com.adnan.sohokari_backend.dto.request.LocationUpdateMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class LiveLocationController {

    /**
     * Provider sends location to /app/location.update
     * All subscribers to /topic/provider-locations receive the broadcast.
     */
    @MessageMapping("/location.update")
    @SendTo("/topic/provider-locations")
    public LocationUpdateMessage broadcastLocation(LocationUpdateMessage message, Principal principal) {
        // Attach identity from JWT-authenticated principal
        if (principal != null) {
            // providerId should already be set by the client, but we can validate here
        }
        return message;
    }
}
