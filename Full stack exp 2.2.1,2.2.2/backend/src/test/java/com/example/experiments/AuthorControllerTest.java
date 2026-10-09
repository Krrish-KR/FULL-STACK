package com.example.experiments;

import com.example.experiments.dto.AuthorDTO;
import com.example.experiments.dto.PagedBooksResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AuthorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Order(1)
    @DisplayName("Author Spec: Verify directory returns all 50 authors with book statistics")
    void testGetAllAuthors() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/authors")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        List<AuthorDTO> authors = objectMapper.readValue(
                result.getResponse().getContentAsString(), new TypeReference<List<AuthorDTO>>() {});

        assertThat(authors).hasSize(50);
        AuthorDTO first = authors.get(0);
        assertThat(first.getName()).isNotBlank();
        assertThat(first.getCountry()).isNotBlank();
        assertThat(first.getBookCount()).isEqualTo(24);
        assertThat(first.getAvgPopularity()).isGreaterThan(0.0);
        assertThat(first.getTopBooks()).isNotEmpty();
        assertThat(first.getGenres()).isNotEmpty();
    }

    @Test
    @Order(2)
    @DisplayName("Author Spec: Verify country filtering on author directory")
    void testGetAuthorsFilterByCountry() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/authors")
                        .param("country", "Japan")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        List<AuthorDTO> authors = objectMapper.readValue(
                result.getResponse().getContentAsString(), new TypeReference<List<AuthorDTO>>() {});

        assertThat(authors).isNotEmpty();
        for (AuthorDTO a : authors) {
            assertThat(a.getCountry()).isEqualToIgnoringCase("Japan");
        }
    }

    @Test
    @Order(3)
    @DisplayName("Author Spec: Verify search by author name")
    void testGetAuthorsSearch() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/authors")
                        .param("search", "Tolkien")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        List<AuthorDTO> authors = objectMapper.readValue(
                result.getResponse().getContentAsString(), new TypeReference<List<AuthorDTO>>() {});

        assertThat(authors).hasSize(1);
        assertThat(authors.get(0).getName()).contains("Tolkien");
    }

    @Test
    @Order(4)
    @DisplayName("Author Spec: Verify distinct countries endpoint")
    void testGetAuthorCountries() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/authors/countries")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        List<String> countries = objectMapper.readValue(
                result.getResponse().getContentAsString(), new TypeReference<List<String>>() {});

        assertThat(countries).isNotEmpty();
        assertThat(countries).contains("Japan", "UK", "USA", "Colombia", "Nigeria", "France");
    }

    @Test
    @Order(5)
    @DisplayName("Author Spec: Verify filtering books table by author ID")
    void testGetBooksFilterByAuthorId() throws Exception {
        // Fetch first author ID
        MvcResult authorResult = mockMvc.perform(get("/api/authors").accept(MediaType.APPLICATION_JSON)).andReturn();
        List<AuthorDTO> authors = objectMapper.readValue(
                authorResult.getResponse().getContentAsString(), new TypeReference<List<AuthorDTO>>() {});
        Long authorId = authors.get(0).getId();

        MvcResult booksResult = mockMvc.perform(get("/api/books")
                        .param("authorId", authorId.toString())
                        .param("size", "30")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(24))
                .andReturn();

        PagedBooksResponse pagedBooks = objectMapper.readValue(
                booksResult.getResponse().getContentAsString(), PagedBooksResponse.class);

        assertThat(pagedBooks.getContent()).hasSize(24);
        for (var b : pagedBooks.getContent()) {
            assertThat(b.getAuthorName()).isEqualTo(authors.get(0).getName());
        }
    }
}
