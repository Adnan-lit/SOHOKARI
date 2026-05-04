package com.adnan.sohokari_backend.controller;

import com.adnan.sohokari_backend.dto.request.CancelBookingRequest;
import com.adnan.sohokari_backend.dto.request.CreateBookingRequest;
import com.adnan.sohokari_backend.dto.response.ApiResponse;
import com.adnan.sohokari_backend.dto.response.BookingResponse;
import com.adnan.sohokari_backend.model.BookingStatus;
import com.adnan.sohokari_backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // ── Customer endpoints ────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            Principal principal,
            @Valid @RequestBody CreateBookingRequest req) {
        BookingResponse res = bookingService.createBooking(principal.getName(), req);
        return ResponseEntity.ok(ApiResponse.ok("Booking created", res));
    }

    @PutMapping("/{bookingId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            Principal principal,
            @PathVariable String bookingId,
            @RequestBody(required = false) CancelBookingRequest req) {
        BookingResponse res = bookingService.cancelBooking(
                principal.getName(), bookingId, req);
        return ResponseEntity.ok(ApiResponse.ok("Booking cancelled", res));
    }

    // ── Provider endpoints ────────────────────────────────────────────────

    @PutMapping("/{bookingId}/accept")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ApiResponse<BookingResponse>> accept(
            Principal principal,
            @PathVariable String bookingId) {
        BookingResponse res = bookingService.acceptBooking(
                principal.getName(), bookingId);
        return ResponseEntity.ok(ApiResponse.ok("Booking accepted", res));
    }

    @PutMapping("/{bookingId}/reject")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ApiResponse<BookingResponse>> reject(
            Principal principal,
            @PathVariable String bookingId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        BookingResponse res = bookingService.rejectBooking(
                principal.getName(), bookingId, reason);
        return ResponseEntity.ok(ApiResponse.ok("Booking rejected", res));
    }

    @PutMapping("/{bookingId}/start")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ApiResponse<BookingResponse>> start(
            Principal principal,
            @PathVariable String bookingId) {
        BookingResponse res = bookingService.startService(
                principal.getName(), bookingId);
        return ResponseEntity.ok(ApiResponse.ok("Service started", res));
    }

    @PutMapping("/{bookingId}/complete")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ApiResponse<BookingResponse>> complete(
            Principal principal,
            @PathVariable String bookingId) {
        BookingResponse res = bookingService.completeService(
                principal.getName(), bookingId);
        return ResponseEntity.ok(ApiResponse.ok("Service completed", res));
    }

    // ── Shared endpoints ──────────────────────────────────────────────────

    @GetMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBooking(
            Principal principal,
            @PathVariable String bookingId) {
        BookingResponse res = bookingService.getBooking(
                principal.getName(), bookingId);
        return ResponseEntity.ok(ApiResponse.ok("Booking details", res));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> myBookings(
            Principal principal,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<BookingResponse> res = bookingService.getMyBookings(
                principal.getName(), status, page, size);
        return ResponseEntity.ok(ApiResponse.ok("My bookings", res));
    }
}