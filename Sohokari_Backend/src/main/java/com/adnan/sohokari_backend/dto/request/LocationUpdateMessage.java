package com.adnan.sohokari_backend.dto.request;

import lombok.Data;

@Data
public class LocationUpdateMessage {
    private String providerId;
    private Double latitude;
    private Double longitude;
}
