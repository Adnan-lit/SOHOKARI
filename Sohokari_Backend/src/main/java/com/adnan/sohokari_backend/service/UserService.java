package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.dto.request.UpdateLocationRequest;
import com.adnan.sohokari_backend.dto.request.UpdateProfileRequest;
import com.adnan.sohokari_backend.model.User;
import com.adnan.sohokari_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public Map<String, Double> updateLocation(String email, UpdateLocationRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setLatitude(req.getLatitude());
        user.setLongitude(req.getLongitude());
        user.setLocationUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);

        Map<String, Double> location = new HashMap<>();
        location.put("latitude", user.getLatitude());
        location.put("longitude", user.getLongitude());
        return location;
    }

    public Map<String, Double> getLocation(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Double> location = new HashMap<>();
        location.put("latitude", user.getLatitude());
        location.put("longitude", user.getLongitude());
        return location;
    }

    public User updateProfile(String email, UpdateProfileRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getName() != null) user.setName(req.getName());
        if (req.getPhone() != null) user.setPhone(req.getPhone());
        if (req.getProfilePhoto() != null) user.setProfilePhoto(req.getProfilePhoto());
        
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }
}
