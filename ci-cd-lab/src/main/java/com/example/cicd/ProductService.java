package com.example.cicd;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ProductService {
    private final ProductRepository repo;
    public ProductService(ProductRepository repo) { this.repo = repo; }

    public List<Product> findAll() { return repo.findAll(); }
    public Optional<Product> findById(Long id) { return repo.findById(id); }
    public Product create(Product p) { return repo.save(p); }
    public boolean delete(Long id) {
        if (!repo.existsById(id)) return false;
        repo.deleteById(id);
        return true;
    }
    /** Business rule under unit test: discount between 0 and 90 percent. */
    public BigDecimal discountedPrice(BigDecimal price, int percent) {
        if (percent < 0 || percent > 90) throw new IllegalArgumentException("percent must be 0-90");
        return price.multiply(BigDecimal.valueOf(100 - percent)).divide(BigDecimal.valueOf(100));
    }
}
