package dev.portfolio.store.shared;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Business metrics count committed operations only, not rolled-back transactions. */
public final class MetricEvents {
    private MetricEvents() {}

    public static void increment(MeterRegistry registry, String name, String... tags) {
        Counter counter = registry.counter(name, tags);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { counter.increment(); }
            });
        } else {
            counter.increment();
        }
    }
}
