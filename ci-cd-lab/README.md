# CI/CD Lab (Experiments 3.2.1 and 3.2.2)

A Spring Boot 3 / Java 17 "Product" service with a full CI and CD pipeline.

| Requirement | Where |
|---|---|
| Unit tests (JUnit 5, Mockito) | `ProductServiceTest` |
| API tests (MockMvc) | `ProductControllerTest` |
| Contract tests (Pact) | `ProductContractConsumerTest`, `ProductContractProviderTest`, `src/test/resources/pacts/` |
| Testcontainers (PostgreSQL) | `ProductRepositoryIT` |
| CI pipeline | `.github/workflows/ci.yml` |
| Dockerfile (multi-stage) | `Dockerfile` |
| CD pipeline (build, push, canary, promote) | `.github/workflows/cd.yml` |
| Canary strategy (nginx 90/10) | `canary/docker-compose.yml`, `canary/nginx.conf`, `scripts/canary-check.sh` |
| Interactive dashboard | `src/main/resources/static/index.html` |

## Run locally
```bash
mvn test            # unit + MockMvc + Pact (no Docker needed)
mvn verify          # also runs Testcontainers integration test (Docker required)
mvn spring-boot:run # dashboard at http://localhost:8080/
```

## Docker and canary demo
```bash
docker build -t cicd-lab:local .
cd canary && docker compose up -d && cd ..
./scripts/canary-check.sh 100     # about 90 requests hit v1.0.0, about 10 hit v2.0.0
```
To widen the canary, change the weights in `canary/nginx.conf` (90/10 -> 50/50 -> 0/100) and run `docker compose restart gateway`.

## GitHub setup
1. Push this folder to a GitHub repo (branch `main`).
2. Add repo secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.
3. Optional: create an Environment named `production` with required reviewers for a manual approval gate.
4. Every push runs CI. When CI passes on `main`, CD builds and pushes the image, runs the canary, and promotes it.

Kafka: add `org.testcontainers:kafka` and a `KafkaContainer` the same way as `PostgreSQLContainer` in `ProductRepositoryIT`.
