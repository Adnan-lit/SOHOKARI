package com.adnan.sohokari_backend.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class SchedulingSuggestionResponse {

    @Data
    public static class TimeSlot {
        private LocalDate date;
        private LocalTime time;
        private String reason;
    }

    private List<TimeSlot> suggestedSlots;
    private List<TimeSlot> busySlots;
    private String note;
}