package dev.portfolio.store.order;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import dev.portfolio.store.product.Product;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "order_lines")
public class OrderLine {
    @Id @UuidGenerator private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false) private PurchaseOrder order;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false) private Product product;
    @Column(name = "sku_snapshot", nullable = false, length = 64) private String skuSnapshot;
    @Column(name = "name_snapshot", nullable = false, length = 120) private String nameSnapshot;
    @Column(nullable = false) private int quantity;
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2) private BigDecimal unitPrice;
    @Column(name = "line_total", nullable = false, precision = 18, scale = 2) private BigDecimal lineTotal;

    protected OrderLine() {}
    public OrderLine(Product product, int quantity) {
        this.product = product; this.skuSnapshot = product.getSku(); this.nameSnapshot = product.getName();
        this.quantity = quantity; this.unitPrice = product.getUnitPrice();
        this.lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
    void setOrder(PurchaseOrder order) { this.order = order; }
    public UUID getId() { return id; }
    public Product getProduct() { return product; }
    public String getSkuSnapshot() { return skuSnapshot; }
    public String getNameSnapshot() { return nameSnapshot; }
    public int getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public BigDecimal getLineTotal() { return lineTotal; }
}
