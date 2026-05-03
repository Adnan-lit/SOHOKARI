package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.dto.request.*;
import com.adnan.sohokari_backend.dto.response.AuthResponse;
import com.adnan.sohokari_backend.model.*;
import com.adnan.sohokari_backend.repository.*;
import com.adnan.sohokari_backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ProviderRepository providerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // Categories that require a trade license
    private static final List<ServiceCategory> TRADE_LICENSE_REQUIRED = Arrays.asList(
            ServiceCategory.ELECTRICIAN,
            ServiceCategory.PLUMBER,
            ServiceCategory.AC_CLEANER,
            ServiceCategory.REPAIRMAN
    );

    public AuthResponse registerCustomer(CustomerRegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setPhone(req.getPhone());
        user.setRole(Role.CUSTOMER);
        userRepository.save(user);

        String access  = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        String refresh = jwtUtil.generateRefreshToken(user.getEmail());

        return new AuthResponse(access, refresh, user.getId(), user.getName(),
                user.getRole().name(), user.getEmail());
    }

    public AuthResponse registerProvider(ProviderRegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Validate trade license for specific categories
        if (TRADE_LICENSE_REQUIRED.contains(req.getServiceCategory())
                && (req.getTradeLicense() == null || req.getTradeLicense().isBlank())) {
            throw new RuntimeException("Trade license is required for " + req.getServiceCategory());
        }

        // Create User
        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setPhone(req.getPhone());
        user.setRole(Role.PROVIDER);
        userRepository.save(user);

        // Create Provider profile
        Provider provider = new Provider();
        provider.setUserId(user.getId());
        provider.setServiceCategory(req.getServiceCategory());
        provider.setNid(req.getNid());
        provider.setTradeLicense(req.getTradeLicense());
        provider.setLocation(new GeoJsonPoint(req.getLongitude(), req.getLatitude()));
        providerRepository.save(provider);

        String access  = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        String refresh = jwtUtil.generateRefreshToken(user.getEmail());

        return new AuthResponse(access, refresh, user.getId(), user.getName(),
                user.getRole().name(), user.getEmail());
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        String access  = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        String refresh = jwtUtil.generateRefreshToken(user.getEmail());

        return new AuthResponse(access, refresh, user.getId(), user.getName(),
                user.getRole().name(), user.getEmail());
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid or expired refresh token");
        }
        String email = jwtUtil.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newAccess  = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        String newRefresh = jwtUtil.generateRefreshToken(user.getEmail());

        return new AuthResponse(newAccess, newRefresh, user.getId(), user.getName(),
                user.getRole().name(), user.getEmail());
    }
}