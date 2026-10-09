package com.example.experiments.service;

import com.example.experiments.dto.AuthorDTO;
import com.example.experiments.entity.Author;
import com.example.experiments.repository.AuthorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional(readOnly = true)
public class AuthorService {

    private final AuthorRepository authorRepository;

    @Autowired
    public AuthorService(AuthorRepository authorRepository) {
        this.authorRepository = authorRepository;
    }

    public List<AuthorDTO> getAllAuthors(String country, String search, String sortBy) {
        List<Author> authors = authorRepository.findAllWithBooks();
        Stream<AuthorDTO> stream = authors.stream().map(AuthorDTO::from);

        // Filter by country
        if (country != null && !country.trim().isEmpty() && !"all".equalsIgnoreCase(country.trim())) {
            String cFilter = country.trim().toLowerCase();
            stream = stream.filter(a -> a.getCountry() != null && a.getCountry().toLowerCase().equals(cFilter));
        }

        // Filter by search query (author name or country)
        if (search != null && !search.trim().isEmpty()) {
            String sQuery = search.trim().toLowerCase();
            stream = stream.filter(a ->
                    (a.getName() != null && a.getName().toLowerCase().contains(sQuery)) ||
                    (a.getCountry() != null && a.getCountry().toLowerCase().contains(sQuery))
            );
        }

        // Dynamic sorting
        Comparator<AuthorDTO> comparator;
        String sort = sortBy != null ? sortBy.trim().toLowerCase() : "name";
        switch (sort) {
            case "books":
                comparator = Comparator.comparingInt(AuthorDTO::getBookCount).reversed()
                        .thenComparing(AuthorDTO::getName, String.CASE_INSENSITIVE_ORDER);
                break;
            case "popularity":
                comparator = Comparator.comparingDouble(AuthorDTO::getAvgPopularity).reversed()
                        .thenComparing(AuthorDTO::getName, String.CASE_INSENSITIVE_ORDER);
                break;
            case "country":
                comparator = Comparator.comparing(AuthorDTO::getCountry, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(AuthorDTO::getName, String.CASE_INSENSITIVE_ORDER);
                break;
            case "name":
            default:
                comparator = Comparator.comparing(AuthorDTO::getName, String.CASE_INSENSITIVE_ORDER);
                break;
        }

        return stream.sorted(comparator).collect(Collectors.toList());
    }

    public List<String> getAllCountries() {
        return authorRepository.findDistinctCountries();
    }

    public AuthorDTO getAuthorById(Long id) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Author not found with ID: " + id));
        return AuthorDTO.from(author);
    }
}
