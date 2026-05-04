package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.dto.request.CancelBookingRequest;
import com.adnan.sohokari_backend.dto.request.CreateBookingRequest;
import com.adnan.sohokari_backend.dto.response.BookingResponse;
import com.adnan.sohokari_backend.model.*;
import com.adnan.sohokari_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;

    // ── Create booking ────────────────────────────────────────────────────

    public BookingResponse createBooking(String customerEmail,
                                         CreateBookingRequest req) {

        // Get customer
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Get provider
        Provider provider = providerRepository.findById(req.getProviderId())
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        // Check provider availability flag
        if (!Boolean.TRUE.equals(provider.getIsAvailable())) {
            throw new RuntimeException("Provider is currently not available");
        }

        // Ensure scheduled date+time is not in the past
        LocalDateTime scheduledAt = LocalDateTime.of(
                req.getScheduledDate(), req.getScheduledTime());
        if (scheduledAt.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Scheduled date/time must be in the future");
        }

        // ── Double booking check ──────────────────────────────────────────
        bookingRepository.findConflictingBooking(
                req.getProviderId(),
                req.getScheduledDate(),
                req.getScheduledTime()
        ).ifPresent(b -> {
            throw new RuntimeException(
                    "Provider already has a booking at this date and time");
        });

        // Build booking
        Booking booking = new Booking();
        booking.setCustomerId(customer.getId());
        booking.setProviderId(provider.getId());
        booking.setProviderUserId(provider.getUserId());
        booking.setServiceCategory(req.getServiceCategory());
        booking.setScheduledDate(req.getScheduledDate());
        booking.setScheduledTime(req.getScheduledTime());
        booking.setNotes(req.getNotes());
        booking.setAddress(req.getAddress());
        booking.setStatus(BookingStatus.REQUESTED);

        bookingRepository.save(booking);

        // TODO Phase 4: send FCM push to provider here

        return mapToResponse(booking, customer, provider);
    }

    // ── Provider actions ──────────────────────────────────────────────────

    public BookingResponse acceptBooking(String providerEmail, String bookingId) {
        Booking booking = getBookingForProvider(providerEmail, bookingId);

        if (booking.getStatus() != BookingStatus.REQUESTED) {
            throw new RuntimeException("Only REQUESTED bookings can be accepted");
        }

        booking.setStatus(BookingStatus.ACCEPTED);
        booking.setRespondedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        // TODO Phase 4: notify customer

        return buildResponse(booking);
    }

    public BookingResponse rejectBooking(String providerEmail, String bookingId,
                                         String reason) {
        Booking booking = getBookingForProvider(providerEmail, bookingId);

        if (booking.getStatus() != BookingStatus.REQUESTED) {
            throw new RuntimeException("Only REQUESTED bookings can be rejected");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        booking.setRespondedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        // TODO Phase 4: notify customer

        return buildResponse(booking);
    }

    public BookingResponse startService(String providerEmail, String bookingId) {
        Booking booking = getBookingForProvider(providerEmail, bookingId);

        if (booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new RuntimeException("Only ACCEPTED bookings can be started");
        }

        booking.setStatus(BookingStatus.IN_PROGRESS);
        booking.setStartedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        return buildResponse(booking);
    }

    public BookingResponse completeService(String providerEmail, String bookingId) {
        Booking booking = getBookingForProvider(providerEmail, bookingId);

        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new RuntimeException("Only IN_PROGRESS bookings can be completed");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCompletedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        // Update provider stats
        Provider provider = providerRepository.findById(booking.getProviderId())
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        provider.setTotalCompletedBookings(
                provider.getTotalCompletedBookings() + 1);
        providerRepository.save(provider);

        // TODO Phase 4: notify customer
        // TODO Phase 5: trigger reputation recalculation

        return buildResponse(booking);
    }

    // ── Customer cancel ───────────────────────────────────────────────────

    public BookingResponse cancelBooking(String customerEmail, String bookingId,
                                         CancelBookingRequest req) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getCustomerId().equals(customer.getId())) {
            throw new RuntimeException("Not authorized to cancel this booking");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED
                || booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.REJECTED) {
            throw new RuntimeException("Cannot cancel a " + booking.getStatus() + " booking");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(req != null ? req.getReason() : null);
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        return buildResponse(booking);
    }

    // ── Get booking ───────────────────────────────────────────────────────

    public BookingResponse getBooking(String userEmail, String bookingId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Only customer or provider of this booking can view it
        boolean isCustomer = booking.getCustomerId().equals(user.getId());
        boolean isProvider = booking.getProviderUserId().equals(user.getId());

        if (!isCustomer && !isProvider) {
            throw new RuntimeException("Not authorized to view this booking");
        }

        return buildResponse(booking);
    }

    // ── History ───────────────────────────────────────────────────────────

    public Page<BookingResponse> getMyBookings(String userEmail,
                                               BookingStatus status,
                                               int page, int size) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Pageable pageable = PageRequest.of(page, size);

        Page<Booking> bookings;

        if (user.getRole() == Role.CUSTOMER) {
            bookings = status != null
                    ? bookingRepository.findByCustomerIdAndStatusOrderByCreatedAtDesc(
                    user.getId(), status, pageable)
                    : bookingRepository.findByCustomerIdOrderByCreatedAtDesc(
                    user.getId(), pageable);
        } else {
            // PROVIDER — find by provider profile id
            Provider provider = providerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Provider profile not found"));

            bookings = status != null
                    ? bookingRepository.findByProviderIdAndStatusOrderByCreatedAtDesc(
                    provider.getId(), status, pageable)
                    : bookingRepository.findByProviderIdOrderByCreatedAtDesc(
                    provider.getId(), pageable);
        }

        return bookings.map(this::buildResponse);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Booking getBookingForProvider(String providerEmail, String bookingId) {
        User user = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getProviderUserId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to manage this booking");
        }
        return booking;
    }

    private BookingResponse buildResponse(Booking booking) {
        User customer = userRepository.findById(booking.getCustomerId()).orElse(null);
        Provider provider = providerRepository.findById(booking.getProviderId())
                .orElse(null);
        User providerUser = provider != null
                ? userRepository.findById(provider.getUserId()).orElse(null) : null;
        return mapToResponse(booking, customer, provider, providerUser);
    }

    private BookingResponse mapToResponse(Booking booking, User customer,
                                          Provider provider) {
        User providerUser = provider != null
                ? userRepository.findById(provider.getUserId()).orElse(null) : null;
        return mapToResponse(booking, customer, provider, providerUser);
    }

    private BookingResponse mapToResponse(Booking booking, User customer,
                                          Provider provider, User providerUser) {
        BookingResponse res = new BookingResponse();
        res.setBookingId(booking.getId());
        res.setCustomerId(booking.getCustomerId());
        res.setCustomerName(customer != null ? customer.getName() : "Unknown");
        res.setProviderId(booking.getProviderId());
        res.setProviderName(providerUser != null ? providerUser.getName() : "Unknown");
        res.setProviderPhoto(providerUser != null ? providerUser.getProfilePhoto() : null);
        res.setServiceCategory(booking.getServiceCategory());
        res.setScheduledDate(booking.getScheduledDate());
        res.setScheduledTime(booking.getScheduledTime());
        res.setNotes(booking.getNotes());
        res.setAddress(booking.getAddress());
        res.setStatus(booking.getStatus());
        res.setCancellationReason(booking.getCancellationReason());
        res.setRejectionReason(booking.getRejectionReason());
        res.setRequestedAt(booking.getRequestedAt());
        res.setRespondedAt(booking.getRespondedAt());
        res.setCompletedAt(booking.getCompletedAt());
        res.setCreatedAt(booking.getCreatedAt());
        return res;
    }
}