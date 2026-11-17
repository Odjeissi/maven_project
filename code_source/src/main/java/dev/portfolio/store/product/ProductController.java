package dev.portfolio.store.product;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    private final ProductService service;
    public ProductController(ProductService service) { this.service = service; }

    @GetMapping
    public Page<ProductDtos.Response> catalog(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "20") int size) {
        if (page < 0 || size < 1 || size > 100) throw new IllegalArgumentException("page must be >= 0 and size must be 1-100");
        return service.catalog(PageRequest.of(page, size, Sort.by("name").ascending()));
    }

    @GetMapping("/{id}")
    public ProductDtos.Response get(@PathVariable UUID id) { return service.byId(id); }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDtos.Response> create(@Valid @RequestBody ProductDtos.Create request) {
        var result = service.create(request);
        return ResponseEntity.created(URI.create("/api/v1/products/" + result.id())).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductDtos.Response update(@PathVariable UUID id, @Valid @RequestBody ProductDtos.Update request) {
        return service.update(id, request);
    }

    @PostMapping("/{id}/stock-adjustments")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductDtos.Response stock(@PathVariable UUID id, @Valid @RequestBody ProductDtos.StockAdjustment request) {
        return service.adjustStock(id, request);
    }
}
