package com.adnan.sohokari_backend.service;


import com.adnan.sohokari_backend.dto.response.ActivitySummaryResponse;
import com.adnan.sohokari_backend.model.*;
import com.adnan.sohokari_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final BookingRepository  bookingRepository;
    private final ProviderRepository providerRepository;
    private final UserRepository     userRepository;
    private final ReviewRepository   reviewRepository;

    public ActivitySummaryResponse getSummary(String userEmail) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ActivitySummaryResponse res = new ActivitySummaryResponse();

        if (user.getRole() == Role.CUSTOMER) {
            String cId = user.getId();
            res.setTotalBookings(bookingRepository.countByCustomerId(cId));
            res.setCompletedBookings(bookingRepository
                    .countByCustomerIdAndStatus(cId, BookingStatus.COMPLETED));
            res.setCancelledBookings(bookingRepository
                    .countByCustomerIdAndStatus(cId, BookingStatus.CANCELLED));
            res.setPendingBookings(
                    bookingRepository.countByCustomerIdAndStatus(
                            cId, BookingStatus.REQUESTED)
                            + bookingRepository.countByCustomerIdAndStatus(
                            cId, BookingStatus.ACCEPTED));
            res.setReviewsGiven(reviewRepository.countByCustomerId(cId));

        } else if (user.getRole() == Role.PROVIDER) {
            Provider provider = providerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Provider not found"));
            String pId = provider.getId();

            res.setTotalBookings(bookingRepository.countByProviderId(pId));
            res.setCompletedBookings(bookingRepository
                    .countByProviderIdAndStatus(pId, BookingStatus.COMPLETED));
            res.setCancelledBookings(bookingRepository
                    .countByProviderIdAndStatus(pId, BookingStatus.CANCELLED));
            res.setPendingBookings(bookingRepository
                    .countByProviderIdAndStatus(pId, BookingStatus.REQUESTED));
            res.setReviewsReceived(reviewRepository.countByProviderId(pId));
            res.setAverageRating(provider.getAverageRating());
        }

        return res;
    }
}