package dev.portfolio.store.order;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import dev.portfolio.store.order.OrderDtos;
import dev.portfolio.store.order.OrderLine;
import dev.portfolio.store.order.OrderRepository;
import dev.portfolio.store.order.OrderService;
import dev.portfolio.store.order.OrderStatus;
import dev.portfolio.store.order.PurchaseOrder;
import dev.portfolio.store.product.Product;
import dev.portfolio.store.product.ProductRepository;
import dev.portfolio.store.shared.ConflictException;
import dev.portfolio.store.shared.NotFoundException;
import dev.portfolio.store.user.Role;
import dev.portfolio.store.user.UserAccount;
import dev.portfolio.store.user.UserAccountRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock OrderRepository orders;
    @Mock ProductRepository products;
    @Mock UserAccountRepository users;
    SimpleMeterRegistry metrics;
    OrderService service;
    UUID customerId, productId, orderId;
    UserAccount customer;
    Product product;
    PurchaseOrder order;

    @BeforeEach void setUp() {
        metrics = new SimpleMeterRegistry();
        service = new OrderService(orders, products, users, metrics);
        customerId = UUID.randomUUID(); productId = UUID.randomUUID(); orderId = UUID.randomUUID();
        customer = new UserAccount(customerId, "customer@example.com", "hashed", Role.CUSTOMER);
        product = new Product(productId, "MOUSE-1", "Mouse", "Wireless", new BigDecimal("25.00"), 10, true);
        order = new PurchaseOrder(customer);
        order.addLine(new OrderLine(product, 3));
    }

    @Test void placingAnOrderReservesStockAndSnapshotsPrice() {
        when(users.findById(customerId)).thenReturn(Optional.of(customer));
        when(products.findByIdForUpdate(productId)).thenReturn(Optional.of(product));
        when(orders.saveAndFlush(any(PurchaseOrder.class))).thenAnswer(inv -> inv.getArgument(0));
        var request = new OrderDtos.Create(List.of(new OrderDtos.LineRequest(productId, 3)));
        var response = service.place(customerId, request);
        assertThat(product.getAvailableStock()).isEqualTo(7);
        assertThat(response.totalAmount()).isEqualByComparingTo("75.00");
        assertThat(response.status()).isEqualTo(OrderStatus.PENDING_PAYMENT);
        assertThat(metrics.counter("store.orders.created").count()).isEqualTo(1);
    }

    @Test void checkoutRejectsInsufficientInventory() {
        when(users.findById(customerId)).thenReturn(Optional.of(customer));
        when(products.findByIdForUpdate(productId)).thenReturn(Optional.of(product));
        var request = new OrderDtos.Create(List.of(new OrderDtos.LineRequest(productId, 11)));
        assertThatThrownBy(() -> service.place(customerId, request)).isInstanceOf(ConflictException.class);
        assertThat(product.getAvailableStock()).isEqualTo(10);
        verify(orders, never()).saveAndFlush(any());
    }

    @Test void duplicateProductsCannotBeOrderedTwice() {
        when(users.findById(customerId)).thenReturn(Optional.of(customer));
        var request = new OrderDtos.Create(List.of(new OrderDtos.LineRequest(productId, 1), new OrderDtos.LineRequest(productId, 2)));
        assertThatThrownBy(() -> service.place(customerId, request)).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(products);
    }

    @Test void cancellationRestoresInventoryExactlyOnce() {
        product.adjustStock(-3);
        when(orders.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));
        when(products.findByIdForUpdate(productId)).thenReturn(Optional.of(product));
        var result = service.cancel(customerId, orderId);
        assertThat(result.status()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(product.getAvailableStock()).isEqualTo(10);
        assertThat(metrics.counter("store.orders.cancelled").count()).isEqualTo(1);
        assertThatThrownBy(() -> service.cancel(customerId, orderId)).isInstanceOf(ConflictException.class);
        assertThat(product.getAvailableStock()).isEqualTo(10);
    }

    @Test void successfulPaymentMarksPaidWithoutReturningInventory() {
        when(orders.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));
        var result = service.simulatePayment(customerId, orderId, new OrderDtos.Payment(true));
        assertThat(result.status()).isEqualTo(OrderStatus.PAID);
        assertThat(product.getAvailableStock()).isEqualTo(10);
        assertThat(metrics.counter("store.payments.processed", "outcome", "success").count()).isEqualTo(1);
        assertThatThrownBy(() -> service.cancel(customerId, orderId)).isInstanceOf(ConflictException.class);
    }

    @Test void rejectedPaymentRestocksInventory() {
        product.adjustStock(-3);
        when(orders.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));
        when(products.findByIdForUpdate(productId)).thenReturn(Optional.of(product));
        var response = service.simulatePayment(customerId, orderId, new OrderDtos.Payment(false));
        assertThat(response.status()).isEqualTo(OrderStatus.PAYMENT_FAILED);
        assertThat(product.getAvailableStock()).isEqualTo(10);
        assertThat(metrics.counter("store.payments.processed", "outcome", "failure").count()).isEqualTo(1);
    }

    @Test void customerCannotReadAnotherUsersOrder() {
        when(orders.findById(orderId)).thenReturn(Optional.of(order));
        assertThatThrownBy(() -> service.myOrder(UUID.randomUUID(), orderId)).isInstanceOf(NotFoundException.class);
    }

    @Test void cannotPurchaseInactiveProduct() {
        Product inactive = new Product(productId, "MOUSE-1", "Mouse", "Wireless", new BigDecimal("25.00"), 10, false);
        when(users.findById(customerId)).thenReturn(Optional.of(customer));
        when(products.findByIdForUpdate(productId)).thenReturn(Optional.of(inactive));
        assertThatThrownBy(() -> service.place(customerId, new OrderDtos.Create(List.of(new OrderDtos.LineRequest(productId, 1)))))
                .isInstanceOf(ConflictException.class);
    }
}
