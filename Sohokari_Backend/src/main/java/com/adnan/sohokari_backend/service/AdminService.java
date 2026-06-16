package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.dto.response.ProviderProfileResponse;
import com.adnan.sohokari_backend.model.Provider;
import com.adnan.sohokari_backend.model.User;
import com.adnan.sohokari_backend.model.VerificationStatus;
import com.adnan.sohokari_backend.repository.ProviderRepository;
import com.adnan.sohokari_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;
    private final ProviderService providerService;

    public List<ProviderProfileResponse> getPendingVerifications() {
        List<Provider> pendingProviders = providerRepository.findByVerificationStatus(VerificationStatus.PENDING_REVIEW);
        return pendingProviders.stream().map(provider -> {
            User user = userRepository.findById(provider.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return providerService.mapToFullProfile(user, provider);
        }).collect(Collectors.toList());
    }

    public ProviderProfileResponse verifyProvider(String providerId, boolean approve) {
        Provider provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        if (approve) {
            provider.setVerificationStatus(VerificationStatus.APPROVED);
            provider.setNidVerified(true);
            if (provider.getTradeLicenseImage() != null) {
                provider.setTradeLicenseVerified(true);
            }
        } else {
            provider.setVerificationStatus(VerificationStatus.REJECTED);
            provider.setNidVerified(false);
            provider.setTradeLicenseVerified(false);
        }

        providerRepository.save(provider);

        User user = userRepository.findById(provider.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return providerService.mapToFullProfile(user, provider);
    }
}
