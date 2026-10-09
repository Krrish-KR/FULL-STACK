package com.example.experiments.repository;

import com.example.experiments.entity.Author;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AuthorRepository extends JpaRepository<Author, Long> {

    // Eagerly load books with authors to prevent N+1 queries when computing directory statistics
    @Query("SELECT DISTINCT a FROM Author a LEFT JOIN FETCH a.books ORDER BY a.name ASC")
    List<Author> findAllWithBooks();

    // Distinct countries for author directory country filter
    @Query("SELECT DISTINCT a.country FROM Author a WHERE a.country IS NOT NULL ORDER BY a.country ASC")
    List<String> findDistinctCountries();
}
