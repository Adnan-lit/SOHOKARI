package com.adnan.sohokari_backend.dto.request;

import com.adnan.sohokari_backend.model.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CreatePaymentRequest {
    @NotBlank
    private String bookingId;
    @NotNull
    @Positive
    private Double amount;
    @NotNull
    private PaymentMethod paymentMethod;
}
