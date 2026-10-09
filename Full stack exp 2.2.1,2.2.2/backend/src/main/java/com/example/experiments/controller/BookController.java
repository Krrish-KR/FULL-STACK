package com.example.experiments.controller;

import com.example.experiments.dto.BenchmarkResponse;
import com.example.experiments.dto.BookDTO;
import com.example.experiments.dto.PagedBooksResponse;
import com.example.experiments.service.BookService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*") // demo project: relax CORS so the static frontend can call this API directly
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    // ---------------------------------------------------------------
    // Experiment 2.2.1 — Pagination + Sorting + Genre Filtering
    // GET /api/books?page=0&size=10&sortBy=title&direction=asc&genre=Sci-Fi
    // ---------------------------------------------------------------
    @GetMapping
    public PagedBooksResponse getBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Long authorId,
            @RequestParam(required = false) String search) {
        return bookService.getPaginatedBooks(page, size, sortBy, direction, genre, authorId, search);
    }

    // Distinct genres for filter dropdown
    @GetMapping("/genres")
    public List<String> getGenres() {
        return bookService.getAllGenres();
    }

    // Modify a book's genre
    @PatchMapping("/{id}/genre")
    public BookDTO updateGenre(
            @PathVariable Long id,
            @RequestParam(required = false) String genre,
            @RequestBody(required = false) Map<String, String> body) {
        String newGenre = genre;
        if ((newGenre == null || newGenre.trim().isEmpty()) && body != null && body.containsKey("genre")) {
            newGenre = body.get("genre");
        }
        if (newGenre == null || newGenre.trim().isEmpty()) {
            throw new IllegalArgumentException("New genre must not be empty");
        }
        return bookService.updateBookGenre(id, newGenre.trim());
    }

    // ---------------------------------------------------------------
    // Experiment 2.2.2 — N+1 problem, unoptimized
    // GET /api/books/naive
    // ---------------------------------------------------------------
    @GetMapping("/naive")
    public BenchmarkResponse getBooksNaive() {
        return bookService.getBooksNaive();
    }

    // ---------------------------------------------------------------
    // Experiment 2.2.2 — N+1 fix via JOIN FETCH
    // GET /api/books/optimized
    // ---------------------------------------------------------------
    @GetMapping("/optimized")
    public BenchmarkResponse getBooksOptimized() {
        return bookService.getBooksOptimized();
    }

    // ---------------------------------------------------------------
    // Experiment 2.2.2 — native query + Ehcache caching
    // GET /api/books/popular?limit=5
    // ---------------------------------------------------------------
    @GetMapping("/popular")
    public BenchmarkResponse getPopularBooks(@RequestParam(defaultValue = "5") int limit) {
        return bookService.getPopularBooksBenchmarked(limit);
    }

    // Utility endpoint so the demo can be re-run from a clean cache state.
    @DeleteMapping("/popular/cache")
    public String evictCache() {
        bookService.evictPopularBooksCache();
        return "Cache evicted";
    }
}
