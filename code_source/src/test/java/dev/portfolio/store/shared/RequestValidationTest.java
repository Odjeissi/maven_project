package dev.portfolio.store.shared;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import dev.portfolio.store.auth.AuthDtos;
import dev.portfolio.store.order.OrderDtos;
import dev.portfolio.store.product.ProductDtos;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class RequestValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test void rejectsNegativeInventoryAndExcessivePricePrecision() {
        var request = new ProductDtos.Create("bad sku", "", "", new BigDecimal("9.999"), -1);
        assertThat(validator.validate(request)).hasSizeGreaterThanOrEqualTo(4);
    }

    @Test void validatesNestedOrderLines() {
        var request = new OrderDtos.Create(List.of(new OrderDtos.LineRequest(UUID.randomUUID(), 0)));
        assertThat(validator.validate(request)).hasSize(1);
    }

    @Test void weakRegistrationPasswordIsRejected() {
        var request = new AuthDtos.RegisterRequest("invalid-email", "short");
        assertThat(validator.validate(request)).hasSizeGreaterThanOrEqualTo(2);
    }
}
