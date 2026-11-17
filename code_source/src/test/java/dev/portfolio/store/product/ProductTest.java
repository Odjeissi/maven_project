package dev.portfolio.store.product;

import org.junit.jupiter.api.Test;

import dev.portfolio.store.product.Product;
import dev.portfolio.store.shared.ConflictException;

import java.math.BigDecimal;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

class ProductTest {
    @Test void stockRejectsIntegerOverflow() {
        Product product = new Product(UUID.randomUUID(), "SKU", "Name", "Desc", new BigDecimal("1.00"), Integer.MAX_VALUE, true);
        assertThatThrownBy(() -> product.adjustStock(1)).isInstanceOf(ConflictException.class);
    }

    @Test void inventoryCanBeDecreasedToZero() {
        Product product = new Product(UUID.randomUUID(), "SKU", "Name", "Desc", new BigDecimal("1.00"), 5, true);
        product.adjustStock(-5);
        assertThat(product.getAvailableStock()).isZero();
    }
}
