package com.example.cicd;

import static org.mockito.Mockito.when;

import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junit5.PactVerificationInvocationContextProvider;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.server.LocalServerPort;

/** CONTRACT TEST (provider side): replays the recorded pact against the real Spring Boot app. */
@Provider("product-service")
@PactFolder("src/test/resources/pacts")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProductContractProviderTest {
    @LocalServerPort int port;
    @MockBean ProductService service;

    @BeforeEach void setTarget(PactVerificationContext ctx) { ctx.setTarget(new HttpTestTarget("localhost", port)); }

    @TestTemplate @ExtendWith(PactVerificationInvocationContextProvider.class)
    void verifyPact(PactVerificationContext ctx) { ctx.verifyInteraction(); }

    @State("product 1 exists")
    void product1Exists() {
        when(service.findById(1L)).thenReturn(Optional.of(new Product(1L, "Laptop", new BigDecimal("999.99"))));
    }
}
