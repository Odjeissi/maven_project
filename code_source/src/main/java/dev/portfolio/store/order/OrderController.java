package dev.portfolio.store.order;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class OrderController {
    private final OrderService service;
    public OrderController(OrderService service) { this.service = service; }

    @PostMapping("/orders")
    public ResponseEntity<OrderDtos.Response> place(@AuthenticationPrincipal Jwt jwt,
                                                     @Valid @RequestBody OrderDtos.Create request) {
        var result = service.place(UUID.fromString(jwt.getSubject()), request);
        return ResponseEntity.created(URI.create("/api/v1/orders/" + result.id())).body(result);
    }

    @GetMapping("/orders")
    public Page<OrderDtos.Response> mine(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.myOrders(UUID.fromString(jwt.getSubject()), pageRequest(page, size));
    }

    @GetMapping("/orders/{id}")
    public OrderDtos.Response byId(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.myOrder(UUID.fromString(jwt.getSubject()), id);
    }

    @PostMapping("/orders/{id}/cancel")
    public OrderDtos.Response cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.cancel(UUID.fromString(jwt.getSubject()), id);
    }

    @PostMapping("/orders/{id}/payments")
    public OrderDtos.Response payment(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                      @Valid @RequestBody OrderDtos.Payment request) {
        return service.simulatePayment(UUID.fromString(jwt.getSubject()), id, request);
    }

    @GetMapping("/admin/orders")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<OrderDtos.Response> all(@RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size) {
        return service.allOrders(pageRequest(page, size));
    }

    private PageRequest pageRequest(int page, int size) {
        if (page < 0 || size < 1 || size > 100) throw new IllegalArgumentException("page must be >= 0 and size must be 1-100");
        return PageRequest.of(page, size, Sort.by("createdAt").descending());
    }
}
