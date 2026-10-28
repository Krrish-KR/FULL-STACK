package com.lab.reliability;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class EventConsumer {
    public static final ObjectMapper MAPPER = new ObjectMapper();
    private final IdempotencyStore store;
    private final Map<String, Integer> attempts = new ConcurrentHashMap<>();

    public EventConsumer(IdempotencyStore store) { this.store = store; }

    @KafkaListener(topics = "${lab.topic.main}", groupId = "post-processor")
    public void onMessage(ConsumerRecord<String, String> record) throws Exception {
        PostEvent e = MAPPER.readValue(record.value(), PostEvent.class);

        // Idempotency: Kafka is at-least-once, so the same event may arrive twice.
        if (store.alreadyProcessed(e.eventId())) {
            EventLog.INSTANCE.add("DUPLICATE", e.eventId(), "Skipped, already processed (offset " + record.offset() + ")");
            return;
        }

        int attempt = attempts.merge(e.eventId(), 1, Integer::sum);
        String mode = e.failMode() == null ? "NONE" : e.failMode();
        if ("ALWAYS".equals(mode)) throw new IllegalStateException("Poison message: simulated permanent failure");
        if ("TRANSIENT".equals(mode) && attempt <= 2)
            throw new IllegalStateException("Simulated transient failure (downstream unavailable)");

        if (store.markProcessed(e.eventId())) {
            attempts.remove(e.eventId());
            EventLog.INSTANCE.add("SUCCESS", e.eventId(), "Published post '" + e.postId() + "' after " + attempt + " attempt(s)");
        }
    }

    /** Observes the dead-letter topic so the dashboard can list parked messages. */
    @KafkaListener(topics = "${lab.topic.dlq}", groupId = "dlq-monitor")
    public void onDlq(ConsumerRecord<String, String> record) throws Exception {
        PostEvent e = MAPPER.readValue(record.value(), PostEvent.class);
        attempts.remove(e.eventId());
        DlqRegistry.INSTANCE.put(e);
        EventLog.INSTANCE.add("DLQ", e.eventId(), "Moved to " + record.topic() + " after retries exhausted");
    }
}
