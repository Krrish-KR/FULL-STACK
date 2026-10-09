package com.example.experiments.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "books")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String genre;

    private LocalDate publishedDate;

    /** Year of publication */
    private Integer publishYear;

    /** Price of the book in USD */
    private Double price;

    /** Used to demonstrate sorting + the native "top popular books" query. */
    private Integer popularity;

    /**
     * LAZY on purpose: iterating a list of books and touching author.getName()
     * without a JOIN FETCH triggers one extra SELECT per book -> the N+1 problem
     * that Experiment 2.2.2 asks you to identify and resolve.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    @JsonIgnoreProperties({"books", "hibernateLazyInitializer", "handler"})
    private Author author;
}
