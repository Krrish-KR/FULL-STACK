package com.example.experiments.dto;

import com.example.experiments.entity.Book;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookDTO {
    private Long id;
    private String title;
    private String genre;
    private LocalDate publishedDate;
    private Integer publishYear;
    private Double price;
    private Integer popularity;
    private String authorName;
    private String authorCountry;

    public static BookDTO from(Book b) {
        String authorName = b.getAuthor() != null ? b.getAuthor().getName() : null;
        String authorCountry = b.getAuthor() != null ? b.getAuthor().getCountry() : null;
        Integer year = b.getPublishYear() != null ? b.getPublishYear()
                : (b.getPublishedDate() != null ? b.getPublishedDate().getYear() : null);

        return new BookDTO(
                b.getId(),
                b.getTitle(),
                b.getGenre(),
                b.getPublishedDate(),
                year,
                b.getPrice(),
                b.getPopularity(),
                authorName,
                authorCountry
        );
    }
}
