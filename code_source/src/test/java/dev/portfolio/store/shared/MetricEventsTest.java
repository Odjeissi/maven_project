package dev.portfolio.store.shared;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import dev.portfolio.store.shared.MetricEvents;

import static org.assertj.core.api.Assertions.assertThat;

class MetricEventsTest {
    @Test void counterOnlyIncrementsAfterCommit() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        TransactionSynchronizationManager.initSynchronization();
        try {
            MetricEvents.increment(registry, "store.orders.created");
            assertThat(registry.counter("store.orders.created").count()).isZero();
            TransactionSynchronizationManager.getSynchronizations().forEach(sync -> sync.afterCommit());
            assertThat(registry.counter("store.orders.created").count()).isEqualTo(1);
        } finally { TransactionSynchronizationManager.clearSynchronization(); }
    }

    @Test void rolledBackTransactionDoesNotRecordSuccess() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        TransactionSynchronizationManager.initSynchronization();
        try { MetricEvents.increment(registry, "store.orders.created"); }
        finally { TransactionSynchronizationManager.clearSynchronization(); }
        assertThat(registry.counter("store.orders.created").count()).isZero();
    }
}
