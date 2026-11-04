package com.example.cicd;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** API TEST: MockMvc exercises routing, validation and JSON without starting a server. */
@WebMvcTest({ProductController.class, InfoController.class})
class ProductControllerTest {
    @Autowired MockMvc mvc;
    @MockBean ProductService service;

    @Test void listsProducts() throws Exception {
        when(service.findAll()).thenReturn(List.of(new Product(1L, "Laptop", new BigDecimal("999.99"))));
        mvc.perform(get("/api/products"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$[0].name").value("Laptop"));
    }

    @Test void returns404ForUnknownProduct() throws Exception {
        when(service.findById(42L)).thenReturn(Optional.empty());
        mvc.perform(get("/api/products/42")).andExpect(status().isNotFound());
    }

    @Test void createsProduct() throws Exception {
        when(service.create(org.mockito.ArgumentMatchers.any())).thenReturn(new Product(5L, "Mouse", new BigDecimal("19.99")));
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
              .content("{\"name\":\"Mouse\",\"price\":19.99}"))
           .andExpect(status().isCreated())
           .andExpect(header().string("Location", "/api/products/5"));
    }

    @Test void rejectsInvalidBody() throws Exception {
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
              .content("{\"name\":\"\",\"price\":-5}"))
           .andExpect(status().isBadRequest());
    }

    @Test void exposesVersion() throws Exception {
        mvc.perform(get("/api/info")).andExpect(jsonPath("$.version").exists());
    }
}
