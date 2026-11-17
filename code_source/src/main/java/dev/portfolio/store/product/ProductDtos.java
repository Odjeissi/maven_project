package dev.portfolio.store.product;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public final class ProductDtos {
    private ProductDtos() {}
    public record Create(@NotBlank @Pattern(regexp = "[A-Z0-9-]{2,64}") String sku,
                         @NotBlank @Size(max = 120) String name,
                         @NotNull @Size(max = 2000) String description,
                         @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal unitPrice,
                         @NotNull @Min(0) Integer initialStock) {}
    public record Update(@NotBlank @Size(max = 120) String name,
                         @NotNull @Size(max = 2000) String description,
                         @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal unitPrice,
                         @NotNull Boolean active) {}
    public record StockAdjustment(@NotNull Integer delta) {}
    public record Response(UUID id, String sku, String name, String description,
                           BigDecimal unitPrice, int availableStock, boolean active) {
        public static Response from(Product product) {
            return new Response(product.getId(), product.getSku(), product.getName(),
                    product.getDescription(), product.getUnitPrice(),
                    product.getAvailableStock(), product.isActive());
        }
    }
}
