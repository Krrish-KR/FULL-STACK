package com.example.experiments;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Entry point.
 *
 * Combines:
 *  - Experiment 2.2.1: Pagination + Sorting REST APIs (Spring Data Pageable)
 *  - Experiment 2.2.2: Caching (Ehcache via JSR-107) + N+1 fix (JOIN FETCH) + native query
 */
@SpringBootApplication
@EnableCaching
public class ExperimentsApplication {
    public static void main(String[] args) {
        SpringApplication.run(ExperimentsApplication.class, args);
    }
}
