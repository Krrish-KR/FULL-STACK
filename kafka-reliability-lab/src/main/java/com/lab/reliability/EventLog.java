package com.lab.reliability;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/** In-memory event log + counters that feed the dashboard. */
public class EventLog {
    public static final EventLog INSTANCE = new EventLog();
    public record Entry(long seq, String time, String type, String eventId, String detail) {}

    private final Deque<Entry> entries = new ArrayDeque<>();
    private final AtomicLong seq = new AtomicLong();
    private final Map<String, AtomicLong> counters = new ConcurrentHashMap<>();
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("HH:mm:ss.SSS");

    public synchronized void add(String type, String eventId, String detail) {
        counters.computeIfAbsent(type, k -> new AtomicLong()).incrementAndGet();
        entries.addFirst(new Entry(seq.incrementAndGet(), LocalTime.now().format(FMT), type, eventId, detail));
        while (entries.size() > 200) entries.removeLast();
    }
    public synchronized List<Entry> entries() { return new ArrayList<>(entries); }
    public Map<String, Long> stats() {
        Map<String, Long> m = new TreeMap<>();
        counters.forEach((k, v) -> m.put(k, v.get()));
        return m;
    }
    public synchronized void reset() { entries.clear(); counters.clear(); }
}
