package com.lab.reliability;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final KafkaTemplate<String, String> kafka;
    private final IdempotencyStore store;
    private final String topic;

    public ApiController(KafkaTemplate<String, String> kafka, IdempotencyStore store,
                         @Value("${lab.topic.main}") String topic) {
        this.kafka = kafka; this.store = store; this.topic = topic;
    }

    private void send(PostEvent e) throws Exception {
        kafka.send(topic, e.eventId(), EventConsumer.MAPPER.writeValueAsString(e));
    }

    /** Schedule a post. failMode: NONE | TRANSIENT | ALWAYS */
    @PostMapping("/posts")
    public Map<String, String> schedule(@RequestParam(defaultValue = "NONE") String failMode,
                                        @RequestParam(required = false) String content) throws Exception {
        String id = UUID.randomUUID().toString().substring(0, 8);
        send(new PostEvent(id, "post-" + id, content == null ? "Scheduled post " + id : content, failMode));
        EventLog.INSTANCE.add("SENT", id, "Produced event (failMode=" + failMode + ")");
        return Map.of("eventId", id);
    }

    @PostMapping("/posts/manual")
    public Map<String, String> scheduleManual(@RequestParam(required = false) String content,
                                             @RequestParam(required = false, defaultValue = "SUCCESS") String scenario,
                                             @RequestParam(required = false) String eventId) throws Exception {
        String normalizedScenario = Optional.ofNullable(scenario).map(String::trim).map(s -> s.toUpperCase(Locale.ROOT)).orElse("SUCCESS");
        String safeContent = Optional.ofNullable(content).map(String::trim).filter(s -> !s.isEmpty()).orElse("Manual scheduled post");
        String safeEventId = Optional.ofNullable(eventId).map(String::trim).filter(s -> !s.isEmpty()).orElseGet(() -> UUID.randomUUID().toString().substring(0, 8));

        switch (normalizedScenario) {
            case "DUPLICATE" -> {
                send(new PostEvent(safeEventId, "post-" + safeEventId, "duplicate delivery: " + safeContent, "NONE"));
                EventLog.INSTANCE.add("SENT", safeEventId, "Manual duplicate scenario for eventId=" + safeEventId);
                return Map.of("eventId", safeEventId, "scenario", normalizedScenario);
            }
            case "DLQ" -> {
                send(new PostEvent(safeEventId, "post-" + safeEventId, safeContent, "ALWAYS"));
                EventLog.INSTANCE.add("SENT", safeEventId, "Manual DLQ scenario for eventId=" + safeEventId);
                return Map.of("eventId", safeEventId, "scenario", normalizedScenario);
            }
            case "SUCCESS" -> {
                send(new PostEvent(safeEventId, "post-" + safeEventId, safeContent, "NONE"));
                EventLog.INSTANCE.add("SENT", safeEventId, "Manual successful publish for eventId=" + safeEventId);
                return Map.of("eventId", safeEventId, "scenario", normalizedScenario);
            }
            default -> {
                send(new PostEvent(safeEventId, "post-" + safeEventId, safeContent, "NONE"));
                EventLog.INSTANCE.add("SENT", safeEventId, "Manual publish fallback for eventId=" + safeEventId);
                return Map.of("eventId", safeEventId, "scenario", "SUCCESS");
            }
        }
    }

    /** Re-publish an existing eventId to simulate at-least-once duplicate delivery. */
    @PostMapping("/posts/{eventId}/duplicate")
    public Map<String, String> duplicate(@PathVariable String eventId) throws Exception {
        send(new PostEvent(eventId, "post-" + eventId, "duplicate delivery", "NONE"));
        EventLog.INSTANCE.add("SENT", eventId, "Re-sent same eventId (simulated duplicate)");
        return Map.of("eventId", eventId);
    }

    /** Replay a parked DLQ message with the fault fixed (failMode=NONE). */
    @PostMapping("/dlq/{eventId}/replay")
    public ResponseEntity<?> replay(@PathVariable String eventId) throws Exception {
        PostEvent e = DlqRegistry.INSTANCE.remove(eventId);
        if (e == null) return ResponseEntity.notFound().build();
        send(new PostEvent(e.eventId(), e.postId(), e.content(), "NONE"));
        EventLog.INSTANCE.add("REPLAY", eventId, "Replayed from DLQ to main topic");
        return ResponseEntity.ok(Map.of("eventId", eventId));
    }

    @GetMapping("/state")
    public Map<String, Object> state() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("stats", EventLog.INSTANCE.stats());
        m.put("processedCount", store.size());
        m.put("events", EventLog.INSTANCE.entries());
        m.put("dlq", DlqRegistry.INSTANCE.all());
        return m;
    }

    @PostMapping("/reset")
    public Map<String, String> reset() {
        EventLog.INSTANCE.reset(); DlqRegistry.INSTANCE.clear(); store.clear();
        return Map.of("status", "cleared");
    }
}
