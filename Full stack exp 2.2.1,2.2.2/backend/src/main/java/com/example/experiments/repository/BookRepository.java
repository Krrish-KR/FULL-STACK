package com.example.experiments.repository;

import com.example.experiments.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {

    // ---- Experiment 2.2.1: Pagination + Sorting ----
    // Spring Data builds the paged, sorted query for us; no @Query needed.
    // (findAll(Pageable) is inherited from JpaRepository / PagingAndSortingRepository)
    @Override
    Page<Book> findAll(Pageable pageable);

    // Genre & Author filtered pagination
    @Query("SELECT b FROM Book b LEFT JOIN b.author a WHERE " +
           "(:genre IS NULL OR LOWER(b.genre) = LOWER(:genre)) AND " +
           "(:authorId IS NULL OR a.id = :authorId) AND " +
           "(:search IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.genre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.country) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Book> findFiltered(
            @Param("genre") String genre,
            @Param("authorId") Long authorId,
            @Param("search") String search,
            Pageable pageable);

    // Distinct genres for frontend filter selector
    @Query("SELECT DISTINCT b.genre FROM Book b WHERE b.genre IS NOT NULL ORDER BY b.genre ASC")
    List<String> findDistinctGenres();

    // ---- Experiment 2.2.2: N+1 demonstration ----
    // Plain findAll(): fine on its own, but iterating the result and calling
    // book.getAuthor().getName() fires one extra SELECT per book (N+1).
    // (findAll() with no args is also inherited.)

    // ---- Experiment 2.2.2: N+1 FIX via JOIN FETCH ----
    // Pulls Book + Author in a single SQL query using a JOIN, eliminating N+1.
    @Query("SELECT b FROM Book b JOIN FETCH b.author a ORDER BY b.id ASC")
    List<Book> findAllWithAuthorJoinFetch();

    // ---- Experiment 2.2.2: native SQL query for a hand-tuned read path ----
    @Query(value = "SELECT * FROM books ORDER BY popularity DESC LIMIT :limit", nativeQuery = true)
    List<Book> findTopPopularNative(@Param("limit") int limit);
}
