package com.adnan.sohokari_backend.dto.response;

import com.adnan.sohokari_backend.model.PaymentMethod;
import com.adnan.sohokari_backend.model.PaymentStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentResponse {
    private String paymentId;
    private String bookingId;
    private String customerId;
    private String customerName;
    private String providerId;
    private String providerName;
    private Double amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String providerPaymentNumber;
    private String serviceCategory;
    private String address;
    private LocalDateTime scheduledDate;
    private LocalDateTime confirmedAt;
    private LocalDateTime createdAt;
}
