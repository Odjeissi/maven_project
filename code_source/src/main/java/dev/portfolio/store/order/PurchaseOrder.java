package dev.portfolio.store.order;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import dev.portfolio.store.user.UserAccount;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder {
    @Id @UuidGenerator private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false) private UserAccount customer;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) private OrderStatus status;
    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2) private BigDecimal totalAmount;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderLine> lines = new ArrayList<>();

    protected PurchaseOrder() {}
    public PurchaseOrder(UserAccount customer) {
        this.customer = customer; this.status = OrderStatus.PENDING_PAYMENT; this.totalAmount = BigDecimal.ZERO.setScale(2);
    }
    public void addLine(OrderLine line) {
        line.setOrder(this); lines.add(line);
        totalAmount = totalAmount.add(line.getLineTotal());
    }
    public void setStatus(OrderStatus status) { this.status = status; }
    public UUID getId() { return id; }
    public UserAccount getCustomer() { return customer; }
    public OrderStatus getStatus() { return status; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public Instant getCreatedAt() { return createdAt; }
    public List<OrderLine> getLines() { return lines; }
}
