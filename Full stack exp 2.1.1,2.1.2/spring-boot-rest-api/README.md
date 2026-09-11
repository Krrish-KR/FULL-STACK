# Post API — Spring Boot REST Experiments

Covers both experiments:
1. RESTful CRUD API design (resource-based URIs, Bean Validation, standardized
   responses, CORS).
2. Global exception handling (`@ControllerAdvice`), structured logging, and
   request tracing via correlation IDs (MDC).

## Project layout

```
src/main/java/com/example/postapi/
  config/        CorsConfig, WebConfig, LoggingInterceptor
  controller/    PostController (CRUD endpoints)
  dto/           PostRequestDTO, PostResponseDTO, ApiResponse
  entity/        Post
  exception/     GlobalExceptionHandler, ErrorResponse, ResourceNotFoundException
  filter/        CorrelationIdFilter (assigns/propagates X-Correlation-Id, MDC)
  repository/    PostRepository
  service/       PostService, impl/PostServiceImpl
src/main/resources/
  application.properties   H2 datasource, JPA, server settings
  logback-spring.xml       Log pattern includes correlationId from MDC
```

## Requirements

- JDK 17+
- Maven 3.8+ (or use the included wrapper if you add one)
- Postman or curl for testing

## Run it

```bash
mvn spring-boot:run
```

The app starts on `http://localhost:3050`. An in-memory H2 database is used,
so no external DB setup is needed — data resets on restart. Inspect it at
`http://localhost:3050/h2-console` (JDBC URL: `jdbc:h2:mem:postdb`, user `sa`,
empty password).

## Endpoints

| Method | URL                     | Description        |
|--------|-------------------------|---------------------|
| POST   | /api/v1/posts           | Create a post       |
| GET    | /api/v1/posts           | List all posts      |
| GET    | /api/v1/posts/{id}      | Get a post by id    |
| PUT    | /api/v1/posts/{id}      | Update a post       |
| DELETE | /api/v1/posts/{id}      | Delete a post       |

### Create a post

```bash
curl -X POST http://localhost:3050/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{
        "title": "Launch announcement",
        "content": "We are live!",
        "scheduledAt": "2026-09-10T09:00:00",
        "status": "SCHEDULED"
      }'
```

Successful response (standardized shape):

```json
{
  "success": true,
  "message": "Post created successfully",
  "data": { "id": 1, "title": "Launch announcement", "...": "..." },
  "timestamp": "2026-09-08T12:00:00"
}
```

### Trigger validation error

```bash
curl -X POST http://localhost:3050/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "", "content": ""}'
```

Response (400, handled by `GlobalExceptionHandler`):

```json
{
  "success": false,
  "status": 400,
  "error": "Validation Failed",
  "message": "One or more fields are invalid",
  "path": "/api/v1/posts",
  "correlationId": "b3f1...-...",
  "details": [
    "title: Title must not be blank",
    "content: Content must not be blank",
    "scheduledAt: scheduledAt must not be null"
  ]
}
```

### Trigger not-found error

```bash
curl http://localhost:3050/api/v1/posts/999
```

Returns `404` with the same standardized error shape.

## Request tracing

Every response includes an `X-Correlation-Id` header. Send your own to
correlate client-side and server-side logs:

```bash
curl -H "X-Correlation-Id: my-trace-123" http://localhost:3050/api/v1/posts
```

Server logs (`logback-spring.xml`) print the correlation ID on every line,
and `LoggingInterceptor` logs method, path, response status, and execution
time for each request — e.g.:

```
2026-09-08 12:00:00.123 [http-nio-3050-exec-1] INFO  [correlationId=my-trace-123] c.e.postapi.config.LoggingInterceptor - Incoming request: GET /api/v1/posts
2026-09-08 12:00:00.130 [http-nio-3050-exec-1] INFO  [correlationId=my-trace-123] c.e.postapi.config.LoggingInterceptor - Completed request: GET /api/v1/posts -> status=200 (7 ms)
```

## CORS

`CorsConfig` allows all origins on `/api/**` for local testing — restrict
`allowedOrigins(...)` to your actual frontend origin before deploying.
