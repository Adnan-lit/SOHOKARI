package com.adnan.sohokari_backend.controller;

import com.adnan.sohokari_backend.dto.response.ApiResponse;
import com.adnan.sohokari_backend.dto.response.EarningsResponse;
import com.adnan.sohokari_backend.model.BookingStatus;
import com.adnan.sohokari_backend.model.Provider;
import com.adnan.sohokari_backend.model.User;
import com.adnan.sohokari_backend.repository.BookingRepository;
import com.adnan.sohokari_backend.repository.ProviderRepository;
import com.adnan.sohokari_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
public class EarningsController {

    private final UserRepository userRepository;
    private final ProviderRepository providerRepository;
    private final BookingRepository bookingRepository;

    @GetMapping("/me/earnings")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ApiResponse<EarningsResponse>> getEarnings(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Provider provider = providerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        long totalCompleted = bookingRepository.countByProviderIdAndStatus(provider.getId(), BookingStatus.COMPLETED);
        
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        long recentCompleted = bookingRepository.countByProviderIdAndStatusAndUpdatedAtAfter(
                provider.getId(), BookingStatus.COMPLETED, startOfMonth);

        double rate = provider.getHourlyRate() != null ? provider.getHourlyRate() : 0.0;
        
        EarningsResponse res = new EarningsResponse();
        res.setTotalEarnings(totalCompleted * rate);
        res.setRecentEarnings(recentCompleted * rate);
        res.setTotalCompleted((int) totalCompleted);
        res.setHourlyRate(rate);

        return ResponseEntity.ok(ApiResponse.ok("Earnings summary", res));
    }
}
