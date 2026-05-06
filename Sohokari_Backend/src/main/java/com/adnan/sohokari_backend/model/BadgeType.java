package com.adnan.sohokari_backend.model;

public enum BadgeType {
    TOP_RATED,          // rating >= 4.7 AND completed >= 20
    FAST_RESPONDER,     // avg response time < 10 min
    MOST_BOOKED,        // top 10% weekly bookings
    TRUSTED_PROVIDER,   // nid verified + rating >= 4.5 + completed >= 50
    NEW_RISING          // account < 90 days + completed >= 5 + rating >= 4.3
}