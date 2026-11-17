package dev.portfolio.store.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import dev.portfolio.store.product.Product;
import dev.portfolio.store.product.ProductRepository;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductDataSeederTest {

    @Mock
    private ProductRepository productRepository;

    private ProductDataSeeder seeder;

    @BeforeEach
    void setUp() {
        seeder = new ProductDataSeeder(productRepository);
    }

    @Test
    void whenDatabaseIsEmpty_seedsAllThirtyProducts() {
        when(productRepository.count()).thenReturn(0L);

        boolean seeded = seeder.seedIfEmpty();

        assertThat(seeded).isTrue();
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Product>> captor = ArgumentCaptor.forClass(List.class);
        verify(productRepository).saveAll(captor.capture());

        List<Product> savedProducts = captor.getValue();
        assertThat(savedProducts).hasSize(30);
    }

    @Test
    void whenDatabaseAlreadyContainsProducts_skipsSeeding() {
        when(productRepository.count()).thenReturn(12L);

        boolean seeded = seeder.seedIfEmpty();

        assertThat(seeded).isFalse();
        verify(productRepository, never()).saveAll(any());
    }

    @Test
    void runExecutesSeedIfEmpty() {
        when(productRepository.count()).thenReturn(0L);

        seeder.run();

        verify(productRepository).saveAll(any());
    }

    @Test
    void createCatalogProducesThirtyValidProductsWithUniqueSkus() {
        List<Product> catalog = ProductDataSeeder.createCatalog();

        assertThat(catalog).hasSize(30);

        Pattern skuPattern = Pattern.compile("^[A-Z0-9-]{2,64}$");
        Set<String> uniqueSkus = new HashSet<>();

        for (Product product : catalog) {
            assertThat(product.getSku()).isNotBlank().matches(skuPattern);
            assertThat(uniqueSkus.add(product.getSku()))
                .as("SKU %s should be unique", product.getSku())
                .isTrue();

            assertThat(product.getName()).isNotBlank().hasSizeLessThanOrEqualTo(120);
            assertThat(product.getDescription()).isNotBlank().hasSizeLessThanOrEqualTo(2000);
            assertThat(product.getUnitPrice()).isNotNull().isGreaterThan(BigDecimal.ZERO);
            assertThat(product.getAvailableStock()).isGreaterThanOrEqualTo(0);
            assertThat(product.isActive()).isTrue();
        }
    }

    @Test
    void catalogHasSixProductsPerCategoryPrefix() {
        List<Product> catalog = ProductDataSeeder.createCatalog();

        long audioCount = catalog.stream().filter(p -> p.getSku().startsWith("NEX-AUD-")).count();
        long dspCount = catalog.stream().filter(p -> p.getSku().startsWith("NEX-DSP-")).count();
        long perCount = catalog.stream().filter(p -> p.getSku().startsWith("NEX-PER-")).count();
        long accCount = catalog.stream().filter(p -> p.getSku().startsWith("NEX-ACC-")).count();
        long lifCount = catalog.stream().filter(p -> p.getSku().startsWith("NEX-LIF-")).count();

        assertThat(audioCount).isEqualTo(6);
        assertThat(dspCount).isEqualTo(6);
        assertThat(perCount).isEqualTo(6);
        assertThat(accCount).isEqualTo(6);
        assertThat(lifCount).isEqualTo(6);
    }
}
