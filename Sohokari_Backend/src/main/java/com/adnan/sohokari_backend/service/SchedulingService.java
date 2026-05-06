package com.adnan.sohokari_backend.service;

import com.adnan.sohokari_backend.dto.response.SchedulingSuggestionResponse;
import com.adnan.sohokari_backend.dto.response.SchedulingSuggestionResponse.TimeSlot;
import com.adnan.sohokari_backend.model.Booking;
import com.adnan.sohokari_backend.model.BookingStatus;
import com.adnan.sohokari_backend.repository.BookingRepository;
import com.adnan.sohokari_backend.repository.ProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SchedulingService {

    private final BookingRepository  bookingRepository;
    private final ProviderRepository providerRepository;

    private static final List<LocalTime> WORK_SLOTS = List.of(
            LocalTime.of(8,  0),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            LocalTime.of(14, 0),
            LocalTime.of(16, 0),
            LocalTime.of(18, 0),
            LocalTime.of(20, 0)
    );

    public SchedulingSuggestionResponse suggest(String providerId) {

        providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        // Get upcoming bookings for this provider (next 7 days)
        List<Booking> upcoming = bookingRepository
                .findByProviderIdOrderByCreatedAtDesc(
                        providerId, PageRequest.of(0, 100))
                .getContent()
                .stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED
                        && b.getStatus() != BookingStatus.REJECTED)
                .filter(b -> b.getScheduledDate() != null
                        && !b.getScheduledDate().isBefore(LocalDate.now()))
                .collect(Collectors.toList());

        // Build busy map: date → busy times
        Map<LocalDate, Set<LocalTime>> busyMap = new HashMap<>();
        upcoming.forEach(b ->
                busyMap.computeIfAbsent(b.getScheduledDate(), k -> new HashSet<>())
                        .add(b.getScheduledTime())
        );

        List<TimeSlot> suggested = new ArrayList<>();
        List<TimeSlot> busy      = new ArrayList<>();

        LocalDate today = LocalDate.now();

        for (int day = 0; day < 7; day++) {
            LocalDate date      = today.plusDays(day);
            Set<LocalTime> taken = busyMap.getOrDefault(date, new HashSet<>());

            for (LocalTime time : WORK_SLOTS) {
                // Skip past times for today
                if (day == 0 && !time.isAfter(LocalTime.now())) continue;

                if (taken.contains(time)) {
                    TimeSlot slot = new TimeSlot();
                    slot.setDate(date);
                    slot.setTime(time);
                    slot.setReason("Already booked");
                    busy.add(slot);
                } else if (suggested.size() < 3) {
                    TimeSlot slot = new TimeSlot();
                    slot.setDate(date);
                    slot.setTime(time);
                    slot.setReason(suggested.isEmpty()
                            ? "Earliest available"
                            : taken.isEmpty()
                              ? "Provider's free day"
                              : "Less busy time");
                    suggested.add(slot);
                }
            }
            if (suggested.size() >= 3) break;
        }

        SchedulingSuggestionResponse res = new SchedulingSuggestionResponse();
        res.setSuggestedSlots(suggested);
        res.setBusySlots(busy);
        res.setNote("Based on provider's next 7 days schedule.");
        return res;
    }
}