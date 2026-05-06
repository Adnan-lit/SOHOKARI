package com.adnan.sohokari_backend.repository;


import com.adnan.sohokari_backend.model.UserPreference;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserPreferenceRepository
        extends MongoRepository<UserPreference, String> {

    Optional<UserPreference> findByUserId(String userId);
}