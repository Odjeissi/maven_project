package dev.portfolio.store.product;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import dev.portfolio.store.shared.ConflictException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "products")
public class Product {
    @Id @UuidGenerator private UUID id;
    @Column(nullable = false, unique = true, length = 64) private String sku;
    @Column(nullable = false, length = 120) private String name;
    @Column(nullable = false, length = 2000) private String description;
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2) private BigDecimal unitPrice;
    @Column(name = "available_stock", nullable = false) private int availableStock;
    @Column(nullable = false) private boolean active;
    @Version private long version;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

    protected Product() {}
    public Product(String sku, String name, String description, BigDecimal unitPrice, int availableStock, boolean active) {
        this.sku = sku; this.name = name; this.description = description;
        this.unitPrice = unitPrice; this.availableStock = availableStock; this.active = active;
    }
    public Product(UUID id, String sku, String name, String description, BigDecimal price, int stock, boolean active) {
        this(sku,name,description,price,stock,active); this.id=id;
    }
    public void update(String name, String description, BigDecimal price, boolean active) {
        this.name = name; this.description = description; this.unitPrice = price; this.active = active;
    }
    public void adjustStock(int delta) {
        long updated = (long) availableStock + delta;
        if (updated < 0) throw new ConflictException("Insufficient stock for SKU " + sku);
        if (updated > Integer.MAX_VALUE) throw new ConflictException("Stock capacity exceeded");
        availableStock = (int) updated;
    }
    public UUID getId() { return id; }
    public String getSku() { return sku; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public int getAvailableStock() { return availableStock; }
    public boolean isActive() { return active; }
    public long getVersion() { return version; }
}
