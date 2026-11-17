package dev.portfolio.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import dev.portfolio.store.order.OrderDtos;
import dev.portfolio.store.order.OrderService;
import dev.portfolio.store.product.ProductRepository;
import dev.portfolio.store.shared.ConflictException;
import dev.portfolio.store.user.Role;
import dev.portfolio.store.user.UserAccount;
import dev.portfolio.store.user.UserAccountRepository;

import java.util.List;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class StoreApiIT {
    @Container static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("ecommerce_test").withUsername("test").withPassword("test");

    private static final String TEST_JWT_KEY = createTestJwtKey();

    private static String createTestJwtKey() {
        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("app.jwt.secret-base64", () -> TEST_JWT_KEY);
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserAccountRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired OrderService orderService;
    @Autowired ProductRepository products;
    UUID customerId;

    String adminToken;
    String customerToken;

    @BeforeEach void setUp() throws Exception {
        String adminEmail = "admin-" + UUID.randomUUID() + "@example.com";
        users.save(new UserAccount(adminEmail, encoder.encode("admin-password-123"), Role.ADMIN));
        adminToken = login(adminEmail, "admin-password-123");
        String customerEmail = "customer-" + UUID.randomUUID() + "@example.com";
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(java.util.Map.of("email", customerEmail, "password", "customer-password-123"))))
                .andExpect(status().isCreated());
        customerToken = login(customerEmail, "customer-password-123");
        customerId = users.findByEmail(customerEmail).orElseThrow().getId();
    }

    String login(String email, String password) throws Exception {
        String response = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(java.util.Map.of("email", email, "password", password))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return mapper.readTree(response).get("accessToken").asText();
    }

    UUID createProduct(int stock) throws Exception {
        String sku = "P-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        String response = mvc.perform(post("/api/v1/products").header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(java.util.Map.of(
                    "sku", sku, "name", "Test product", "description", "Integration test",
                    "unitPrice", "12.50", "initialStock", stock))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return UUID.fromString(mapper.readTree(response).get("id").asText());
    }

    @Test void customerCannotCreateProductAndAnonymousCanReadCatalog() throws Exception {
        mvc.perform(post("/api/v1/products").header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(java.util.Map.of(
                        "sku", "UNAUTHORIZED-1", "name", "Denied product", "description", "Test",
                        "unitPrice", "1.00", "initialStock", 1))))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/products")).andExpect(status().isOk());
    }

    @Test void purchaseReservesStockAndCancellationRestoresIt() throws Exception {
        UUID productId = createProduct(5);
        String order = mvc.perform(post("/api/v1/orders").header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(java.util.Map.of("items", java.util.List.of(java.util.Map.of("productId", productId, "quantity", 2))))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        JsonNode created = mapper.readTree(order);
        assertThat(created.get("totalAmount").decimalValue()).isEqualByComparingTo("25.00");
        assertThat(created.get("status").asText()).isEqualTo("PENDING_PAYMENT");
        mvc.perform(get("/api/v1/products/" + productId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.availableStock").value(3));
        UUID orderId = UUID.fromString(created.get("id").asText());
        mvc.perform(post("/api/v1/orders/" + orderId + "/cancel").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));
        mvc.perform(get("/api/v1/products/" + productId)).andExpect(jsonPath("$.availableStock").value(5));
        mvc.perform(post("/api/v1/orders/" + orderId + "/cancel").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isConflict());
    }

    @Test void failedPaymentReturnsInventoryAndInsufficientStockIsRejected() throws Exception {
        UUID id = createProduct(2);
        String payload = mapper.writeValueAsString(java.util.Map.of("items", java.util.List.of(java.util.Map.of("productId", id, "quantity", 2))));
        String response = mvc.perform(post("/api/v1/orders").header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        UUID orderId = UUID.fromString(mapper.readTree(response).get("id").asText());
        mvc.perform(post("/api/v1/orders").header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON).content(payload)).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/orders/" + orderId + "/payments").header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(java.util.Map.of("successful", false))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PAYMENT_FAILED"));
        mvc.perform(get("/api/v1/products/" + id)).andExpect(jsonPath("$.availableStock").value(2));
    }

    @Test void secondCustomerCannotAccessAnotherCustomersOrder() throws Exception {
        UUID productId = createProduct(5);
        String requestJson = mapper.writeValueAsString(java.util.Map.of("items", List.of(java.util.Map.of("productId", productId, "quantity", 1))));
        String created = mvc.perform(post("/api/v1/orders").header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON).content(requestJson))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String orderId = mapper.readTree(created).get("id").asText();
        String otherEmail = "other-" + UUID.randomUUID() + "@example.com";
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(java.util.Map.of("email", otherEmail, "password", "secure-password-987"))))
                .andExpect(status().isCreated());
        String otherToken = login(otherEmail, "secure-password-987");
        mvc.perform(get("/api/v1/orders/" + orderId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/orders/" + orderId + "/cancel").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
    }

    @Test void simultaneousCheckoutsCannotOversell() throws Exception {
        UUID productId = createProduct(1);
        CountDownLatch start = new CountDownLatch(1);
        Callable<Boolean> purchase = () -> {
            start.await();
            try {
                orderService.place(customerId, new OrderDtos.Create(List.of(new OrderDtos.LineRequest(productId, 1))));
                return true;
            } catch (ConflictException expected) {
                return false;
            }
        };
        try (ExecutorService pool = Executors.newFixedThreadPool(2)) {
            Future<Boolean> first = pool.submit(purchase);
            Future<Boolean> second = pool.submit(purchase);
            start.countDown();
            int successes = (first.get(20, TimeUnit.SECONDS) ? 1 : 0)
                          + (second.get(20, TimeUnit.SECONDS) ? 1 : 0);
            assertThat(successes).isEqualTo(1);
        }
        assertThat(products.findById(productId).orElseThrow().getAvailableStock()).isEqualTo(0);
    }

    @Test void probesAndMetricsAreReachable() throws Exception {
        mvc.perform(get("/actuator/health/liveness")).andExpect(status().isOk());
        mvc.perform(get("/actuator/health/readiness")).andExpect(status().isOk());
        mvc.perform(get("/actuator/prometheus")).andExpect(status().isOk());
    }
}
