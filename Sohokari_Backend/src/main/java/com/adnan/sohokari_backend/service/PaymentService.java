package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.dto.request.CreatePaymentRequest;
import com.adnan.sohokari_backend.dto.response.PaymentResponse;
import com.adnan.sohokari_backend.model.*;
import com.adnan.sohokari_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;
    private final FcmService fcmService;

    public PaymentResponse createPayment(String customerEmail, CreatePaymentRequest req) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Booking booking = bookingRepository.findById(req.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getCustomerId().equals(customer.getId())) {
            throw new RuntimeException("Not authorized to create payment for this booking");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("Payment can only be created for completed bookings");
        }

        // Check if payment already exists
        paymentRepository.findByBookingId(req.getBookingId()).ifPresent(p -> {
            throw new RuntimeException("Payment already exists for this booking");
        });

        Provider provider = providerRepository.findById(booking.getProviderId())
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        Payment payment = new Payment();
        payment.setBookingId(req.getBookingId());
        payment.setCustomerId(customer.getId());
        payment.setProviderId(provider.getId());
        payment.setProviderUserId(provider.getUserId());
        payment.setAmount(req.getAmount());
        payment.setPaymentMethod(req.getPaymentMethod());
        payment.setPaymentStatus(PaymentStatus.PENDING);

        // Set provider's payment number for digital methods
        if (req.getPaymentMethod() != PaymentMethod.CASH) {
            payment.setProviderPaymentNumber(provider.getPaymentMobileNumber());
        }

        paymentRepository.save(payment);

        // Notify provider
        fcmService.sendNotification(
                provider.getUserId(),
                "Payment Initiated \uD83D\uDCB0",
                customer.getName() + " initiated " + req.getPaymentMethod().name()
                        + " payment of ৳" + String.format("%.0f", req.getAmount()),
                Notification.NotificationType.BOOKING_COMPLETED,
                booking.getId()
        );

        return mapToResponse(payment);
    }

    public PaymentResponse confirmPayment(String providerEmail, String paymentId) {
        User providerUser = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (!payment.getProviderUserId().equals(providerUser.getId())) {
            throw new RuntimeException("Not authorized to confirm this payment");
        }

        if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new RuntimeException("Only PENDING payments can be confirmed");
        }

        payment.setPaymentStatus(PaymentStatus.CONFIRMED);
        payment.setConfirmedAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Notify customer
        fcmService.sendNotification(
                payment.getCustomerId(),
                "Payment Confirmed ✅",
                "Your payment of ৳" + String.format("%.0f", payment.getAmount())
                        + " has been confirmed",
                Notification.NotificationType.BOOKING_COMPLETED,
                payment.getBookingId()
        );

        return mapToResponse(payment);
    }

    public PaymentResponse getPaymentByBooking(String userEmail, String bookingId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElse(null);

        if (payment == null) return null;

        boolean isCustomer = payment.getCustomerId().equals(user.getId());
        boolean isProvider = payment.getProviderUserId().equals(user.getId());
        if (!isCustomer && !isProvider) {
            throw new RuntimeException("Not authorized to view this payment");
        }

        return mapToResponse(payment);
    }

    public PaymentResponse getInvoice(String userEmail, String paymentId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        boolean isCustomer = payment.getCustomerId().equals(user.getId());
        boolean isProvider = payment.getProviderUserId().equals(user.getId());
        if (!isCustomer && !isProvider) {
            throw new RuntimeException("Not authorized to view this invoice");
        }

        return mapToResponse(payment);
    }

    public List<PaymentResponse> getMyPayments(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Payment> payments;
        if (user.getRole() == Role.PROVIDER) {
            Provider provider = providerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Provider not found"));
            payments = paymentRepository.findByProviderIdOrderByCreatedAtDesc(provider.getId());
        } else {
            payments = paymentRepository.findByCustomerIdOrderByCreatedAtDesc(user.getId());
        }

        return payments.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private PaymentResponse mapToResponse(Payment payment) {
        PaymentResponse res = new PaymentResponse();
        res.setPaymentId(payment.getId());
        res.setBookingId(payment.getBookingId());
        res.setCustomerId(payment.getCustomerId());
        res.setProviderId(payment.getProviderId());
        res.setAmount(payment.getAmount());
        res.setPaymentMethod(payment.getPaymentMethod());
        res.setPaymentStatus(payment.getPaymentStatus());
        res.setProviderPaymentNumber(payment.getProviderPaymentNumber());
        res.setConfirmedAt(payment.getConfirmedAt());
        res.setCreatedAt(payment.getCreatedAt());

        // Enrich with names
        userRepository.findById(payment.getCustomerId())
                .ifPresent(u -> res.setCustomerName(u.getName()));
        userRepository.findById(payment.getProviderUserId())
                .ifPresent(u -> res.setProviderName(u.getName()));

        // Enrich with booking info
        bookingRepository.findById(payment.getBookingId()).ifPresent(b -> {
            res.setServiceCategory(
                    b.getServiceCategory() != null ? b.getServiceCategory().name() : null);
            res.setAddress(b.getAddress());
            res.setScheduledDate(
                    b.getScheduledDate() != null ? b.getScheduledDate().atStartOfDay() : null);
        });

        return res;
    }
}
