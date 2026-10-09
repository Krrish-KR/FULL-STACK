package com.example.experiments.dto;

import com.example.experiments.entity.Author;
import com.example.experiments.entity.Book;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthorDTO {
    private Long id;
    private String name;
    private String country;
    private int bookCount;
    private double avgPopularity;
    private List<String> genres;
    private List<String> topBooks;

    public static AuthorDTO from(Author author) {
        if (author == null) return null;

        List<Book> books = author.getBooks() != null ? author.getBooks() : Collections.emptyList();
        int count = books.size();

        double avgPop = books.stream()
                .filter(b -> b.getPopularity() != null)
                .mapToInt(Book::getPopularity)
                .average()
                .orElse(0.0);

        List<String> distinctGenres = books.stream()
                .map(Book::getGenre)
                .filter(Objects::nonNull)
                .filter(s -> !s.trim().isEmpty())
                .distinct()
                .limit(4)
                .collect(Collectors.toList());

        List<String> notableWorks = books.stream()
                .sorted(Comparator.comparing(Book::getPopularity, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(Book::getTitle)
                .filter(Objects::nonNull)
                .limit(3)
                .collect(Collectors.toList());

        return new AuthorDTO(
                author.getId(),
                author.getName(),
                author.getCountry(),
                count,
                Math.round(avgPop * 10.0) / 10.0,
                distinctGenres,
                notableWorks
        );
    }
}
