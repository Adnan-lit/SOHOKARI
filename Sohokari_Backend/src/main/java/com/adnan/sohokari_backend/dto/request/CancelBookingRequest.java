package com.adnan.sohokari_backend.dto.request;


import lombok.Data;

@Data
public class CancelBookingRequest {
    private String reason;
}