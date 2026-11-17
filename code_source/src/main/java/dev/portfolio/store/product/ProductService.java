package dev.portfolio.store.product;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.portfolio.store.shared.ConflictException;
import dev.portfolio.store.shared.MetricEvents;
import dev.portfolio.store.shared.NotFoundException;

import java.util.UUID;

@Service
public class ProductService {
    private final ProductRepository products;
    private final MeterRegistry metrics;
    public ProductService(ProductRepository products, MeterRegistry metrics) {
        this.products = products; this.metrics = metrics;
    }

    @Transactional(readOnly = true)
    public Page<ProductDtos.Response> catalog(Pageable pageable) {
        return products.findByActiveTrue(pageable).map(ProductDtos.Response::from);
    }

    @Transactional(readOnly = true)
    public ProductDtos.Response byId(UUID id) {
        return ProductDtos.Response.from(products.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new NotFoundException("Product not found")));
    }

    @Transactional
    public ProductDtos.Response create(ProductDtos.Create request) {
        if (products.existsBySku(request.sku())) throw new ConflictException("SKU already exists");
        Product created = products.save(new Product(request.sku(), request.name(),
                request.description(), request.unitPrice(), request.initialStock(), true));
        return ProductDtos.Response.from(created);
    }

    @Transactional
    public ProductDtos.Response update(UUID id, ProductDtos.Update request) {
        Product product = products.findById(id).orElseThrow(() -> new NotFoundException("Product not found"));
        product.update(request.name(), request.description(), request.unitPrice(), request.active());
        return ProductDtos.Response.from(product);
    }

    @Transactional
    public ProductDtos.Response adjustStock(UUID id, ProductDtos.StockAdjustment request) {
        if (request.delta() == 0) throw new IllegalArgumentException("Stock adjustment cannot be zero");
        Product product = products.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        product.adjustStock(request.delta());
        MetricEvents.increment(metrics, "store.inventory.adjustments", "direction", request.delta() > 0 ? "add" : "remove");
        return ProductDtos.Response.from(product);
    }
}
