package com.example.cicd;

import static org.junit.jupiter.api.Assertions.assertEquals;

import au.com.dius.pact.consumer.MockServer;
import au.com.dius.pact.consumer.dsl.PactDslJsonBody;
import au.com.dius.pact.consumer.dsl.PactDslWithProvider;
import au.com.dius.pact.consumer.junit5.PactConsumerTestExt;
import au.com.dius.pact.consumer.junit5.PactTestFor;
import au.com.dius.pact.core.model.PactSpecVersion;
import au.com.dius.pact.core.model.RequestResponsePact;
import au.com.dius.pact.core.model.annotations.Pact;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

/** CONTRACT TEST (consumer side): records what the frontend expects; writes src/test/resources/pacts. */
@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "product-service", pactVersion = PactSpecVersion.V3)
class ProductContractConsumerTest {

    @Pact(consumer = "frontend-client")
    RequestResponsePact productExists(PactDslWithProvider b) {
        return b.given("product 1 exists")
            .uponReceiving("a request for product 1")
            .path("/api/products/1").method("GET")
            .willRespondWith().status(200)
            .headers(Map.of("Content-Type", "application/json"))
            .body(new PactDslJsonBody().integerType("id", 1).stringType("name", "Laptop").decimalType("price", 999.99))
            .toPact();
    }

    @Test @PactTestFor(pactMethod = "productExists")
    void clientParsesProduct(MockServer server) {
        Product p = new ProductClient(server.getUrl()).get(1L);
        assertEquals("Laptop", p.getName());
    }
}
