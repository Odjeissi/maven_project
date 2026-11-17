package dev.portfolio.store.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class OrderDtos {
    private OrderDtos() {}
    public record LineRequest(@NotNull UUID productId, @Min(1) @Max(10000) int quantity) {}
    public record Create(@NotEmpty @Size(max = 30) List<@NotNull @Valid LineRequest> items) {}
    public record Payment(@NotNull Boolean successful) {}
    public record LineResponse(UUID productId, String sku, String productName, int quantity,
                               BigDecimal unitPrice, BigDecimal lineTotal) {
        static LineResponse from(OrderLine line) {
            return new LineResponse(line.getProduct().getId(), line.getSkuSnapshot(), line.getNameSnapshot(),
                    line.getQuantity(), line.getUnitPrice(), line.getLineTotal());
        }
    }
    public record Response(UUID id, UUID customerId, OrderStatus status,
                           BigDecimal totalAmount, Instant createdAt, List<LineResponse> items) {
        static Response from(PurchaseOrder order) {
            return new Response(order.getId(), order.getCustomer().getId(), order.getStatus(),
                    order.getTotalAmount(), order.getCreatedAt(),
                    order.getLines().stream().map(LineResponse::from).toList());
        }
    }
}
