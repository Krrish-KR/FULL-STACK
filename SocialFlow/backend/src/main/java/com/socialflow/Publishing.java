package com.socialflow;

import java.time.OffsetDateTime;
import java.util.concurrent.TimeUnit;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class Publishing {
  final JdbcTemplate db;
  final KafkaTemplate<String, String> kafka;
  final Api api;

  public Publishing(JdbcTemplate db, KafkaTemplate<String, String> kafka, Api api) {
    this.db = db;
    this.kafka = kafka;
    this.api = api;
  }

  // The database queue is a durable outbox. Re-delivery is safe: consumer locks and checks status.
  @Scheduled(fixedDelay = 15000)
  public void dispatch() {
    db.update(
        "UPDATE posts SET status='QUEUED' WHERE status='SCHEDULED' AND scheduled_at<=?",
        OffsetDateTime.now());
    for (var p : db.queryForList("SELECT id FROM posts WHERE status='QUEUED' LIMIT 100")) {
      String id = p.get("id").toString();
      try {
        kafka.send("socialflow.publish", id, id).get(10, TimeUnit.SECONDS);
      } catch (Exception e) {
        org.slf4j.LoggerFactory.getLogger(getClass())
            .warn("Queue delivery failed; retained for retry: {}", id);
      }
    }
  }

  @KafkaListener(topics = "socialflow.publish", autoStartup = "${app.scheduling:true}")
  @Transactional
  public void publish(String id) {
    var rows = db.queryForList("SELECT * FROM posts WHERE id=? FOR UPDATE", id);
    if (rows.isEmpty() || !rows.get(0).get("status").equals("QUEUED")) return;
    db.update(
        "UPDATE posts SET status='PUBLISHED',published_at=? WHERE id=?", OffsetDateTime.now(), id);
    api.notice("Published in sandbox: " + rows.get(0).get("title"));
  }

  @Configuration
  @EnableScheduling
  @ConditionalOnProperty(name = "app.scheduling", havingValue = "true", matchIfMissing = true)
  static class Scheduling {
    @Bean
    NewTopic topic() {
      return TopicBuilder.name("socialflow.publish").partitions(3).replicas(1).build();
    }
  }
}
