package com.adnan.sohokari_backend.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class EarningsResponse {
    private Double totalEarnings;
    private Double recentEarnings;
    private Integer totalCompleted;
    private Double hourlyRate;
}
