package com.example.experiments;

import com.example.experiments.dto.BenchmarkResponse;
import com.example.experiments.dto.BookDTO;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class BookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // =========================================================================
    // Specification 2.2.1: Scalable, Paginated, Filterable & Sortable Read APIs (1200 Books)
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("Spec 2.2.1: Verify pagination with 1,200 books, price, year, and author country")
    void testGetBooksPaginationDefaults() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/books")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "id")
                        .param("direction", "asc")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalElements").value(1200))
                .andExpect(jsonPath("$.totalPages").value(120))
                .andExpect(jsonPath("$.last").value(false))
                .andReturn();

        PagedBooksResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PagedBooksResponse.class);

        assertThat(response.getContent()).hasSize(10);
        BookDTO firstBook = response.getContent().get(0);
        assertThat(firstBook.getTitle()).isNotBlank();
        assertThat(firstBook.getAuthorName()).isNotBlank();
        assertThat(firstBook.getAuthorCountry()).isNotBlank();
        assertThat(firstBook.getPrice()).isNotNull().isGreaterThan(0.0);
        assertThat(firstBook.getPublishYear()).isNotNull().isGreaterThan(1800);
    }

    @Test
    @Order(2)
    @DisplayName("Spec 2.2.1: Verify sorting by price descending")
    void testGetBooksSortByPriceDesc() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/books")
                        .param("page", "0")
                        .param("size", "20")
                        .param("sortBy", "price")
                        .param("direction", "desc")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        PagedBooksResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PagedBooksResponse.class);

        assertThat(response.getContent()).hasSize(20);
        for (int i = 0; i < response.getContent().size() - 1; i++) {
            assertThat(response.getContent().get(i).getPrice())
                    .isGreaterThanOrEqualTo(response.getContent().get(i + 1).getPrice());
        }
    }

    @Test
    @Order(3)
    @DisplayName("Spec 2.2.1: Verify genre-filtered pagination")
    void testGetBooksFilterByGenre() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/books")
                        .param("page", "0")
                        .param("size", "15")
                        .param("genre", "Sci-Fi")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        PagedBooksResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PagedBooksResponse.class);

        assertThat(response.getContent()).isNotEmpty();
        for (BookDTO book : response.getContent()) {
            assertThat(book.getGenre()).isEqualToIgnoringCase("Sci-Fi");
        }
    }

    @Test
    @Order(4)
    @DisplayName("Spec 2.2.1: Verify distinct genres endpoint")
    void testGetDistinctGenres() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/books/genres")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        List<String> genres = objectMapper.readValue(
                result.getResponse().getContentAsString(), new TypeReference<List<String>>() {});

        assertThat(genres).isNotEmpty();
        assertThat(genres).contains("Sci-Fi", "Mystery", "Fiction", "Fantasy", "Classic");
    }

    @Test
    @Order(5)
    @DisplayName("Spec 2.2.1: Verify updating book genre via PATCH")
    void testUpdateBookGenre() throws Exception {
        // Change book 1 genre to Cyberpunk
        MvcResult patchResult = mockMvc.perform(patch("/api/books/1/genre")
                        .param("genre", "Cyberpunk")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.genre").value("Cyberpunk"))
                .andReturn();

        BookDTO updated = objectMapper.readValue(
                patchResult.getResponse().getContentAsString(), BookDTO.class);
        assertThat(updated.getGenre()).isEqualTo("Cyberpunk");
    }

    // =========================================================================
    // Specification 2.2.2: N+1 Problem Identification & JOIN FETCH Resolution (1200 Books)
    // =========================================================================

    @Test
    @Order(6)
    @DisplayName("Spec 2.2.2: Naive endpoint triggers N+1 queries across 1,200 books")
    void testNaiveEndpointTriggersMultipleQueries() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/books/naive")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.strategy").value("naive (N+1)"))
                .andReturn();

        BenchmarkResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), BenchmarkResponse.class);

        assertThat(response.getBooks()).hasSize(1200);
        // N+1 problem: 1 query for books + N queries for authors -> query count > 1
        assertThat(response.getQueryCount())
                .as("Naive approach must trigger multiple queries (N+1)")
                .isGreaterThan(1);
    }

    @Test
    @Order(7)
    @DisplayName("Spec 2.2.2: Optimized endpoint uses JOIN FETCH (exactly 1 query) across 1,200 books")
    void testOptimizedEndpointUsesSingleQuery() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/books/optimized")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.strategy").value("join-fetch (optimized)"))
                .andReturn();

        BenchmarkResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), BenchmarkResponse.class);

        assertThat(response.getBooks()).hasSize(1200);
        // Single query with JOIN FETCH
        assertThat(response.getQueryCount())
                .as("Optimized approach must execute in exactly 1 query via JOIN FETCH")
                .isEqualTo(1);
    }

    // =========================================================================
    // Specification 2.2.2: Native Query & Ehcache Caching
    // =========================================================================

    @Test
    @Order(8)
    @DisplayName("Spec 2.2.2: Native Query + Ehcache hit, miss, and cache eviction")
    void testNativeQueryAndEhcacheLifecycle() throws Exception {
        // Step A: Evict cache to ensure clean baseline
        mockMvc.perform(delete("/api/books/popular/cache"))
                .andExpect(status().isOk());

        // Step B: First call should be a cache miss (reads DB)
        MvcResult firstCall = mockMvc.perform(get("/api/books/popular")
                        .param("limit", "5")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cacheHit").value(false))
                .andReturn();

        BenchmarkResponse firstResponse = objectMapper.readValue(
                firstCall.getResponse().getContentAsString(), BenchmarkResponse.class);
        assertThat(firstResponse.getBooks()).hasSize(5);
        assertThat(firstResponse.isCacheHit()).isFalse();

        // Step C: Second call for the same limit should hit the Ehcache cache
        MvcResult secondCall = mockMvc.perform(get("/api/books/popular")
                        .param("limit", "5")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cacheHit").value(true))
                .andReturn();

        BenchmarkResponse secondResponse = objectMapper.readValue(
                secondCall.getResponse().getContentAsString(), BenchmarkResponse.class);
        assertThat(secondResponse.getBooks()).hasSize(5);
        assertThat(secondResponse.isCacheHit()).isTrue();
        assertThat(secondResponse.getElapsedMillis()).isLessThan(firstResponse.getElapsedMillis());

        // Step D: Evict cache again
        mockMvc.perform(delete("/api/books/popular/cache"))
                .andExpect(status().isOk());

        // Step E: Third call after eviction should be a cache miss again
        MvcResult thirdCall = mockMvc.perform(get("/api/books/popular")
                        .param("limit", "5")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cacheHit").value(false))
                .andReturn();

        BenchmarkResponse thirdResponse = objectMapper.readValue(
                thirdCall.getResponse().getContentAsString(), BenchmarkResponse.class);
        assertThat(thirdResponse.isCacheHit()).isFalse();
    }

    @Test
    @Order(9)
    @DisplayName("Spec 2.2.1: Search all books by title or author")
    void testSearchBooksByTitleAndAuthor() throws Exception {
        MvcResult titleResult = mockMvc.perform(get("/api/books")
                        .param("page", "0")
                        .param("size", "50")
                        .param("search", "Foundation")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        PagedBooksResponse titleResponse = objectMapper.readValue(
                titleResult.getResponse().getContentAsString(), PagedBooksResponse.class);
        assertThat(titleResponse.getTotalElements()).isGreaterThanOrEqualTo(3);
        assertThat(titleResponse.getContent())
                .allSatisfy(book -> assertThat(book.getTitle()).containsIgnoringCase("Foundation"));

        MvcResult authorResult = mockMvc.perform(get("/api/books")
                        .param("page", "0")
                        .param("size", "50")
                        .param("search", "Frank Herbert")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(24))
                .andReturn();

        PagedBooksResponse authorResponse = objectMapper.readValue(
                authorResult.getResponse().getContentAsString(), PagedBooksResponse.class);
        assertThat(authorResponse.getContent())
                .allSatisfy(book -> assertThat(book.getAuthorName()).isEqualTo("Frank Herbert"));
    }
}
