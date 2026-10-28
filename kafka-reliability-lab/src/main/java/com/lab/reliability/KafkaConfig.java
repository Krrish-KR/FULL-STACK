package com.lab.reliability;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.ExponentialBackOffWithMaxRetries;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;

@Configuration
public class KafkaConfig {

    @Value("${lab.topic.main}") String mainTopic;
    @Value("${lab.topic.dlq}") String dlqTopic;
    @Value("${lab.retry.initial-ms}") long initialMs;
    @Value("${lab.retry.multiplier}") double multiplier;
    @Value("${lab.retry.max-retries}") int maxRetries;

    @Bean NewTopic mainTopic() { return TopicBuilder.name(mainTopic).partitions(1).replicas(1).build(); }
    @Bean NewTopic dlqTopic()  { return TopicBuilder.name(dlqTopic).partitions(1).replicas(1).build(); }

    /** Retries with exponential backoff; when exhausted the record is published to the DLQ topic. */
    @Bean
    DefaultErrorHandler errorHandler(KafkaTemplate<String, String> template) {
        var recoverer = new DeadLetterPublishingRecoverer(template,
                (rec, ex) -> new TopicPartition(dlqTopic, 0));
        var backOff = new ExponentialBackOffWithMaxRetries(maxRetries);
        backOff.setInitialInterval(initialMs);
        backOff.setMultiplier(multiplier);
        var handler = new DefaultErrorHandler(recoverer, backOff);
        handler.setRetryListeners((rec, ex, attempt) -> {
            try {
                PostEvent e = EventConsumer.MAPPER.readValue((String) rec.value(), PostEvent.class);
                Throwable t = ex.getCause() != null ? ex.getCause() : ex;
                EventLog.INSTANCE.add("RETRY", e.eventId(), "Attempt " + attempt + " failed: " + t.getMessage());
            } catch (Exception ignored) { }
        });
        return handler;
    }
}
