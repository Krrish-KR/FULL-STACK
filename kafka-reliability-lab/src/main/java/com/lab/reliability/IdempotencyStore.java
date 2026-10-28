package com.lab.reliability;

import org.springframework.stereotype.Component;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** Tracks eventIds that were fully processed. Swap for a DB table with a unique key in production. */
@Component
public class IdempotencyStore {
    private final Set<String> processed = ConcurrentHashMap.newKeySet();

    public boolean alreadyProcessed(String eventId) { return processed.contains(eventId); }
    /** Atomic: returns true only for the first caller. */
    public boolean markProcessed(String eventId) { return processed.add(eventId); }
    public int size() { return processed.size(); }
    public void clear() { processed.clear(); }
}
