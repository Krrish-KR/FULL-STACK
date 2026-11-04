package com.example.cicd;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** UNIT TEST: pure JUnit 5 + Mockito, no Spring context. */
class ProductServiceTest {
    private final ProductRepository repo = mock(ProductRepository.class);
    private final ProductService service = new ProductService(repo);

    @Test void appliesDiscount() {
        assertEquals(0, new BigDecimal("80.00").compareTo(service.discountedPrice(new BigDecimal("100"), 20)));
    }

    @ParameterizedTest @ValueSource(ints = {-1, 91, 500})
    void rejectsInvalidDiscount(int pct) {
        assertThrows(IllegalArgumentException.class, () -> service.discountedPrice(BigDecimal.TEN, pct));
    }

    @Test void findByIdDelegatesToRepository() {
        Product p = new Product(1L, "Laptop", BigDecimal.TEN);
        when(repo.findById(1L)).thenReturn(Optional.of(p));
        assertSame(p, service.findById(1L).orElseThrow());
    }

    @Test void deleteReturnsFalseWhenMissing() {
        when(repo.existsById(9L)).thenReturn(false);
        assertFalse(service.delete(9L));
        verify(repo, never()).deleteById(any());
    }
}
