# Kafka Reliability Lab (Experiments 3.1.1 and 3.1.2)

Retries with exponential backoff, a dead-letter topic, and idempotent consumption on Spring Boot + Apache Kafka, with a live dashboard.

## Run
1. `docker compose up -d`   (Kafka on localhost:9092, KRaft mode)
2. `mvn spring-boot:run`    (JDK 17+, Maven 3.9+)
3. Open http://localhost:8080

## How each requirement is implemented
| Requirement | Where |
|---|---|
| Retry with exponential backoff | `KafkaConfig.errorHandler`: `ExponentialBackOffWithMaxRetries` (1s x2, 4 retries) |
| DLQ topic | `scheduled-posts-dlq`, created in `KafkaConfig`; `DeadLetterPublishingRecoverer` routes exhausted records |
| Idempotency | `IdempotencyStore` + check in `EventConsumer.onMessage` (keyed by `eventId`) |
| Failure testing | Dashboard scenarios, or REST calls below |

## Test scenarios (dashboard buttons or curl)
- Healthy: `curl -X POST "localhost:8080/api/posts?failMode=NONE"` -> SENT, SUCCESS
- Transient: `failMode=TRANSIENT` -> RETRY, RETRY, SUCCESS (attempt 3)
- Poison: `failMode=ALWAYS` -> 4 RETRY entries then DLQ (about 15s)
- Duplicate: `curl -X POST localhost:8080/api/posts/<eventId>/duplicate` -> DUPLICATE (skipped)
- Replay: `curl -X POST localhost:8080/api/dlq/<eventId>/replay` -> SUCCESS

Inspect the DLQ directly:
`docker exec kafka-lab /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic scheduled-posts-dlq --from-beginning`

Config lives in `application.properties` (`lab.retry.*`). The idempotency store is in-memory for the lab; use a DB table with a unique key on `eventId` in production.
