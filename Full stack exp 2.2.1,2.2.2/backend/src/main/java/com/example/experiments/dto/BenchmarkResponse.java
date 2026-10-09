package com.example.experiments.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Wraps a list of books together with simple performance metrics so the
 * frontend can visibly compare the naive vs. optimized vs. cached endpoints.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BenchmarkResponse {
    private String strategy;      // "naive" | "join-fetch" | "native-cached"
    private long elapsedMillis;
    private long queryCount;      // Hibernate statement count during the call, when available
    private boolean cacheHit;
    private List<BookDTO> books;
}
