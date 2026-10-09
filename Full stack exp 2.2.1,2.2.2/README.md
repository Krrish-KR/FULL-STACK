# Experiment 2.2.1 & 2.2.2 — Full Working Project

This project implements **both** experiments end-to-end, backend + frontend:

- **Experiment 2.2.1** — Scalable, paginated & sortable read APIs (Spring Data `Pageable`)
- **Experiment 2.2.2** — Backend performance: identifying/fixing the N+1 query problem
  (`JOIN FETCH`), a native SQL query, and caching with **Ehcache**

## Project layout

```
experiments-2.2/
├── backend/                     Spring Boot 3 (Java 17) app
│   ├── pom.xml
│   └── src/main/java/com/example/experiments/
│       ├── ExperimentsApplication.java
│       ├── entity/              Author, Book (JPA entities)
│       ├── repository/          BookRepository (pagination, JOIN FETCH, native query)
│       ├── service/             BookService (business logic + caching + benchmarking)
│       ├── controller/          BookController (REST endpoints)
│       ├── dto/                 Response DTOs
│       └── loader/              DataLoader (seeds sample data on startup)
│   └── src/main/resources/
│       ├── application.properties
│       └── ehcache.xml          Ehcache (JSR-107) cache config
└── frontend/                    Plain HTML/CSS/JS UI (no build step needed)
    ├── index.html
    ├── style.css
    └── script.js
```

## Running the backend

Requires **JDK 17+** and **Maven** (no external database needed — it uses an
in-memory H2 database seeded automatically on startup with 50 authors and 1,200 books).

```bash
cd backend
mvn spring-boot:run
```

The API starts on `http://localhost:8080`. The H2 console (if you want to inspect
the data) is at `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:expdb`,
user `sa`, empty password).

### Endpoints

| Endpoint | Experiment | Description |
|---|---|---|
| `GET /api/books?page=0&size=10&sortBy=title&direction=asc&search=Frank%20Herbert` | 2.2.1 | Paginated, sorted catalog; search matches book title, author, country, or genre |
| `GET /api/books/naive` | 2.2.2 | Fetches all books, touches `author.name` lazily → **N+1 queries** |
| `GET /api/books/optimized` | 2.2.2 | Same result, single query via `JOIN FETCH` |
| `GET /api/books/popular?limit=5` | 2.2.2 | Native SQL query for top-N popular books, result is **cached** (Ehcache, 60s TTL) |
| `DELETE /api/books/popular/cache` | 2.2.2 | Evicts the popular-books cache, for re-testing |

The `naive`/`optimized`/`popular` endpoints all return timing info (`elapsedMillis`)
and the number of SQL statements executed (`queryCount`) via Hibernate statistics, so
you can directly see the performance difference in the response — and in the UI.

## Running the frontend

The frontend is static — no build tooling required. Simplest options:

```bash
cd frontend
python3 -m http.server 5500
# then open http://localhost:5500
```

or just open `frontend/index.html` directly in a browser. Once loaded, set the
"Backend URL" field (defaults to `http://localhost:8080`) and use the panels to:

1. Search across all 1,200 books by title, author, country, or genre; page and sort results by price and publication year (Experiment 2.2.1).
2. Browse illustrated author avatars and filter the book catalog by author.
3. Toggle between **Standard (N+1)** and **Fast (JOIN FETCH)** modes, run either
   individually, or compare both modes side-by-side using elapsed time and SQL
   statement counts (Experiment 2.2.2). The comparison also shows browser-observed
   request latency for both modes on the same page, separately from backend execution time.
4. Fetch the "top popular books" native query, then fetch it again to see the
   cache-hit speedup; use "Evict Cache" to reset. The caching panel explains the
   expected complexity of hits and misses alongside the measured response time
   (Experiment 2.2.2).

CORS is left open (`@CrossOrigin(origins = "*")`) on the controller so the static
frontend can call the API directly from any origin — this is fine for a lab/demo
project but should be locked down for production use.

## Notes / how each concept maps to the code

- **Pagination & sorting** — `BookRepository.findAll(Pageable)` (inherited from
  `JpaRepository`), driven by `PageRequest.of(page, size, Sort.by(direction, sortBy))`
  in `BookService.getPaginatedBooks`.
- **N+1 problem** — `BookService.getBooksNaive()` calls `findAll()` then accesses
  the lazy `book.getAuthor().getName()` per row.
- **JOIN FETCH fix** — `BookRepository.findAllWithAuthorJoinFetch()` uses
  `SELECT b FROM Book b JOIN FETCH b.author a`.
- **Native SQL query** — `BookRepository.findTopPopularNative(limit)`.
- **Caching (Ehcache)** — `@Cacheable("popularBooks")` on
  `BookService.getPopularBooksNativeCached`, backed by `ehcache.xml` (JSR-107 /
  `spring.cache.type=jcache`), with `@CacheEvict` to clear it.
- **Cache complexity** — a hit uses an average O(1) cache lookup plus O(k) work
  to return k books. A miss uses an O(N log N) worst-case scan-and-sort for the
  popularity query because no popularity index is defined, then O(k) to cache
  the returned books. Actual response times are measured separately in the UI.
- **Benchmarking** — Hibernate `Statistics` (enabled via
  `hibernate.generate_statistics=true`) is used to count actual SQL statements
  executed per call, so the N+1 vs JOIN FETCH difference is measurable, not just
  asserted.
