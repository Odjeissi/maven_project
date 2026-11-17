package dev.portfolio.store.product;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import dev.portfolio.store.product.Product;
import dev.portfolio.store.product.ProductDtos;
import dev.portfolio.store.product.ProductRepository;
import dev.portfolio.store.product.ProductService;
import dev.portfolio.store.shared.ConflictException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {
    @Mock ProductRepository repository;
    SimpleMeterRegistry metrics;
    ProductService service;
    UUID id;
    Product product;

    @BeforeEach void setup() {
        metrics = new SimpleMeterRegistry();
        service = new ProductService(repository, metrics);
        id = UUID.randomUUID();
        product = new Product(id, "KB-100", "Keyboard", "Mechanical", new BigDecimal("39.99"), 5, true);
    }

    @Test void restockingIncreasesAvailableUnitsAndEmitsMetric() {
        when(repository.findByIdForUpdate(id)).thenReturn(Optional.of(product));
        var response = service.adjustStock(id, new ProductDtos.StockAdjustment(7));
        assertThat(response.availableStock()).isEqualTo(12);
        assertThat(metrics.counter("store.inventory.adjustments", "direction", "add").count()).isEqualTo(1);
    }

    @Test void stockCannotBecomeNegative() {
        when(repository.findByIdForUpdate(id)).thenReturn(Optional.of(product));
        assertThatThrownBy(() -> service.adjustStock(id, new ProductDtos.StockAdjustment(-6)))
                .isInstanceOf(ConflictException.class);
        assertThat(product.getAvailableStock()).isEqualTo(5);
    }

    @Test void rejectZeroStockAdjustment() {
        assertThatThrownBy(() -> service.adjustStock(id, new ProductDtos.StockAdjustment(0)))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(repository);
    }

    @Test void duplicateSkuRejectedBeforeCreation() {
        when(repository.existsBySku("KB-100")).thenReturn(true);
        var request = new ProductDtos.Create("KB-100", "Keyboard", "Mechanical", new BigDecimal("39.99"), 3);
        assertThatThrownBy(() -> service.create(request)).isInstanceOf(ConflictException.class);
        verify(repository, never()).save(any());
    }

    @Test void updateLeavesInventoryUntouched() {
        when(repository.findById(id)).thenReturn(Optional.of(product));
        var response = service.update(id, new ProductDtos.Update("New keyboard", "Updated", new BigDecimal("49.99"), false));
        assertThat(response.availableStock()).isEqualTo(5);
        assertThat(response.active()).isFalse();
        assertThat(response.unitPrice()).isEqualByComparingTo("49.99");
    }
}
