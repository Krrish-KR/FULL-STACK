package com.example.cicd;

import org.springframework.web.client.RestTemplate;

/** The "frontend" side of the contract: a tiny client that consumes the Product API. */
public class ProductClient {
    private final String baseUrl;
    private final RestTemplate rest = new RestTemplate();
    public ProductClient(String baseUrl) { this.baseUrl = baseUrl; }
    public Product get(Long id) { return rest.getForObject(baseUrl + "/api/products/" + id, Product.class); }
}
