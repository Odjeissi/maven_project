package dev.portfolio.store.shared;

public class ConflictException extends RuntimeException {
    public ConflictException(String message) { super(message); }
}
