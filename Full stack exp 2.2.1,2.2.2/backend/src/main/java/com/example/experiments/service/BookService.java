package com.example.experiments.service;

import com.example.experiments.dto.BenchmarkResponse;
import com.example.experiments.dto.BookDTO;
import com.example.experiments.dto.PagedBooksResponse;
import com.example.experiments.entity.Book;
import com.example.experiments.repository.BookRepository;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final EntityManagerFactory entityManagerFactory;
    private final CacheManager cacheManager;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private BookService self;

    @Autowired
    public BookService(BookRepository bookRepository,
                        EntityManagerFactory entityManagerFactory,
                        CacheManager cacheManager) {
        this.bookRepository = bookRepository;
        this.entityManagerFactory = entityManagerFactory;
        this.cacheManager = cacheManager;

        // Turn on Hibernate statistics so we can show real query counts
        // (this is what proves the N+1 fix actually works, not just "trust me").
        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);
    }

    private Statistics stats() {
        return entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
    }

    // =========================================================
    // Experiment 2.2.1 — Pagination + Sorting + Genre & Author Filtering
    // =========================================================
    public PagedBooksResponse getPaginatedBooks(
            int page, int size, String sortBy, String direction, String genre, Long authorId, String search) {
        Sort.Direction dir = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(dir, sortBy);
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        String cleanGenre = (genre != null && !genre.trim().isEmpty() && !"all".equalsIgnoreCase(genre.trim()))
                ? genre.trim() : null;
        String cleanSearch = search != null && !search.trim().isEmpty() ? search.trim() : null;

        Page<Book> result;
        if (cleanGenre != null || authorId != null || cleanSearch != null) {
            result = bookRepository.findFiltered(cleanGenre, authorId, cleanSearch, pageRequest);
        } else {
            result = bookRepository.findAll(pageRequest);
        }

        List<BookDTO> content = result.getContent().stream()
                .map(BookDTO::from)
                .collect(Collectors.toList());

        return new PagedBooksResponse(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast(),
                sortBy,
                direction
        );
    }

    public List<String> getAllGenres() {
        return bookRepository.findDistinctGenres();
    }

    @Transactional
    public BookDTO updateBookGenre(Long bookId, String newGenre) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found with id: " + bookId));
        book.setGenre(newGenre);
        Book saved = bookRepository.save(book);
        return BookDTO.from(saved);
    }

    // =========================================================
    // Experiment 2.2.2 — N+1 problem (naive, unoptimized)
    // =========================================================
    public BenchmarkResponse getBooksNaive() {
        stats().clear();
        long start = System.nanoTime();

        List<Book> books = bookRepository.findAll(); // 1 query
        // Touching the lazy association per-book triggers 1 extra query EACH
        // -> classic N+1 (1 + N queries total).
        List<BookDTO> dtos = books.stream().map(b -> {
            if (b.getAuthor() != null) {
                b.getAuthor().getName();
            }
            return BookDTO.from(b);
        }).collect(Collectors.toList());

        long elapsedMs = (System.nanoTime() - start) / 1_000_000;
        // Prepared-statement count reflects actual SQL round trips (1 for the book
        // list + 1 per distinct author lazily loaded) -> shows the N+1 pattern clearly.
        long queryCount = stats().getPrepareStatementCount();

        return new BenchmarkResponse("naive (N+1)", elapsedMs, queryCount, false, dtos);
    }

    // =========================================================
    // Experiment 2.2.2 — N+1 FIX via JOIN FETCH
    // =========================================================
    public BenchmarkResponse getBooksOptimized() {
        stats().clear();
        long start = System.nanoTime();

        List<Book> books = bookRepository.findAllWithAuthorJoinFetch(); // single query, JOIN FETCH
        List<BookDTO> dtos = books.stream().map(BookDTO::from).collect(Collectors.toList());

        long elapsedMs = (System.nanoTime() - start) / 1_000_000;
        long queryCount = stats().getPrepareStatementCount();

        return new BenchmarkResponse("join-fetch (optimized)", elapsedMs, queryCount, false, dtos);
    }

    // =========================================================
    // Experiment 2.2.2 — Native query + Ehcache caching
    // =========================================================
    // @Cacheable stores the result under "popularBooks" (backed by Ehcache,
    // configured in ehcache.xml). First call hits the DB via native SQL;
    // subsequent calls with the same `limit` are served from cache.
    @Cacheable(value = "popularBooks", key = "#limit")
    public List<BookDTO> getPopularBooksNativeCached(int limit) {
        // Deliberate small delay to make the cache-hit speedup obvious in the demo.
        try {
            Thread.sleep(150);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
        List<Book> books = bookRepository.findTopPopularNative(limit);
        return books.stream().map(BookDTO::from).collect(Collectors.toList());
    }

    public BenchmarkResponse getPopularBooksBenchmarked(int limit) {
        org.springframework.cache.Cache cache = cacheManager.getCache("popularBooks");
        boolean cacheHitBefore = (cache != null && cache.get(limit) != null);

        long start = System.nanoTime();
        List<BookDTO> dtos = (self != null ? self : this).getPopularBooksNativeCached(limit);
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;

        return new BenchmarkResponse(
                cacheHitBefore ? "native query (cache hit)" : "native query (cache miss -> DB)",
                elapsedMs,
                cacheHitBefore ? 0 : 1,
                cacheHitBefore,
                dtos
        );
    }

    @CacheEvict(value = "popularBooks", allEntries = true)
    public void evictPopularBooksCache() {
        org.springframework.cache.Cache cache = cacheManager.getCache("popularBooks");
        if (cache != null) {
            cache.clear();
        }
    }
}
