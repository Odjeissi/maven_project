package dev.portfolio.store.order;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.portfolio.store.product.Product;
import dev.portfolio.store.product.ProductRepository;
import dev.portfolio.store.shared.ConflictException;
import dev.portfolio.store.shared.MetricEvents;
import dev.portfolio.store.shared.NotFoundException;
import dev.portfolio.store.user.UserAccount;
import dev.portfolio.store.user.UserAccountRepository;

import java.util.*;

@Service
public class OrderService {
    private final OrderRepository orders;
    private final ProductRepository products;
    private final UserAccountRepository users;
    private final MeterRegistry metrics;
    public OrderService(OrderRepository orders, ProductRepository products,
                        UserAccountRepository users, MeterRegistry metrics) {
        this.orders = orders; this.products = products; this.users = users; this.metrics = metrics;
    }

    @Transactional
    public OrderDtos.Response place(UUID customerId, OrderDtos.Create request) {
        UserAccount user = users.findById(customerId).orElseThrow(() -> new NotFoundException("User not found"));
        Set<UUID> unique = new HashSet<>();
        for (OrderDtos.LineRequest line : request.items()) {
            if (!unique.add(line.productId())) throw new IllegalArgumentException("Duplicate product in order");
        }
        // Lock products in stable UUID order to avoid overselling and reduce deadlock risk.
        List<OrderDtos.LineRequest> sorted = request.items().stream()
                .sorted(Comparator.comparing(OrderDtos.LineRequest::productId)).toList();
        PurchaseOrder order = new PurchaseOrder(user);
        for (OrderDtos.LineRequest line : sorted) {
            Product product = products.findByIdForUpdate(line.productId())
                    .orElseThrow(() -> new NotFoundException("Product not found: " + line.productId()));
            if (!product.isActive()) throw new ConflictException("Product is not available: " + product.getSku());
            product.adjustStock(-line.quantity());
            order.addLine(new OrderLine(product, line.quantity()));
        }
        PurchaseOrder saved = orders.saveAndFlush(order);
        MetricEvents.increment(metrics, "store.orders.created");
        return OrderDtos.Response.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<OrderDtos.Response> myOrders(UUID customerId, Pageable pageable) {
        return orders.findByCustomer_Id(customerId, pageable).map(OrderDtos.Response::from);
    }

    @Transactional(readOnly = true)
    public OrderDtos.Response myOrder(UUID customerId, UUID orderId) {
        PurchaseOrder order = orders.findById(orderId).orElseThrow(() -> new NotFoundException("Order not found"));
        checkOwner(order, customerId);
        return OrderDtos.Response.from(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderDtos.Response> allOrders(Pageable pageable) {
        return orders.findAll(pageable).map(OrderDtos.Response::from);
    }

    @Transactional
    public OrderDtos.Response cancel(UUID customerId, UUID orderId) {
        PurchaseOrder order = lockedOwnedOrder(customerId, orderId);
        ensurePending(order);
        restoreStock(order);
        order.setStatus(OrderStatus.CANCELLED);
        MetricEvents.increment(metrics, "store.orders.cancelled");
        return OrderDtos.Response.from(order);
    }

    @Transactional
    public OrderDtos.Response simulatePayment(UUID customerId, UUID orderId, OrderDtos.Payment payment) {
        PurchaseOrder order = lockedOwnedOrder(customerId, orderId);
        ensurePending(order);
        if (payment.successful()) {
            order.setStatus(OrderStatus.PAID);
            MetricEvents.increment(metrics, "store.payments.processed", "outcome", "success");
        } else {
            restoreStock(order);
            order.setStatus(OrderStatus.PAYMENT_FAILED);
            MetricEvents.increment(metrics, "store.payments.processed", "outcome", "failure");
        }
        return OrderDtos.Response.from(order);
    }

    private PurchaseOrder lockedOwnedOrder(UUID customerId, UUID orderId) {
        PurchaseOrder order = orders.findByIdForUpdate(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        checkOwner(order, customerId);
        return order;
    }

    private void checkOwner(PurchaseOrder order, UUID userId) {
        // Use 404 to avoid revealing another customer's order existence.
        if (!order.getCustomer().getId().equals(userId)) throw new NotFoundException("Order not found");
    }

    private void ensurePending(PurchaseOrder order) {
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT)
            throw new ConflictException("Only PENDING_PAYMENT orders can change status");
    }

    private void restoreStock(PurchaseOrder order) {
        List<OrderLine> sorted = order.getLines().stream()
                .sorted(Comparator.comparing(item -> item.getProduct().getId())).toList();
        for (OrderLine line : sorted) {
            Product product = products.findByIdForUpdate(line.getProduct().getId())
                    .orElseThrow(() -> new IllegalStateException("Referenced product is missing"));
            product.adjustStock(line.getQuantity());
        }
    }
}
