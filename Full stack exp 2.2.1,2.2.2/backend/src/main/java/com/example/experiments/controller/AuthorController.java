package com.example.experiments.controller;

import com.example.experiments.dto.AuthorDTO;
import com.example.experiments.service.AuthorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/authors")
@CrossOrigin(origins = "*") // relax CORS for frontend
public class AuthorController {

    private final AuthorService authorService;

    public AuthorController(AuthorService authorService) {
        this.authorService = authorService;
    }

    // ---------------------------------------------------------------
    // Author Directory Endpoint
    // GET /api/authors?country=Japan&search=Mishima&sortBy=popularity
    // ---------------------------------------------------------------
    @GetMapping
    public List<AuthorDTO> getAuthors(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "name") String sortBy) {
        return authorService.getAllAuthors(country, search, sortBy);
    }

    // ---------------------------------------------------------------
    // Distinct Countries for Directory Filter
    // GET /api/authors/countries
    // ---------------------------------------------------------------
    @GetMapping("/countries")
    public List<String> getCountries() {
        return authorService.getAllCountries();
    }

    // ---------------------------------------------------------------
    // Single Author Details
    // GET /api/authors/{id}
    // ---------------------------------------------------------------
    @GetMapping("/{id}")
    public AuthorDTO getAuthorById(@PathVariable Long id) {
        return authorService.getAuthorById(id);
    }
}
