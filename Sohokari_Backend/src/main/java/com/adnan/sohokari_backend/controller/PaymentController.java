package com.adnan.sohokari_backend.controller;

import com.adnan.sohokari_backend.dto.request.CreatePaymentRequest;
import com.adnan.sohokari_backend.dto.response.ApiResponse;
import com.adnan.sohokari_backend.dto.response.PaymentResponse;
import com.adnan.sohokari_backend.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            Principal principal, @Valid @RequestBody CreatePaymentRequest req) {
        PaymentResponse data = paymentService.createPayment(principal.getName(), req);
        return ResponseEntity.ok(ApiResponse.ok("Payment created", data));
    }

    @PutMapping("/{paymentId}/confirm")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmPayment(
            Principal principal, @PathVariable String paymentId) {
        PaymentResponse data = paymentService.confirmPayment(principal.getName(), paymentId);
        return ResponseEntity.ok(ApiResponse.ok("Payment confirmed", data));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getByBooking(
            Principal principal, @PathVariable String bookingId) {
        PaymentResponse data = paymentService.getPaymentByBooking(principal.getName(), bookingId);
        return ResponseEntity.ok(ApiResponse.ok("Payment retrieved", data));
    }

    @GetMapping("/{paymentId}/invoice")
    public ResponseEntity<ApiResponse<PaymentResponse>> getInvoice(
            Principal principal, @PathVariable String paymentId) {
        PaymentResponse data = paymentService.getInvoice(principal.getName(), paymentId);
        return ResponseEntity.ok(ApiResponse.ok("Invoice retrieved", data));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPayments(
            Principal principal) {
        List<PaymentResponse> data = paymentService.getMyPayments(principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Payments retrieved", data));
    }
}
