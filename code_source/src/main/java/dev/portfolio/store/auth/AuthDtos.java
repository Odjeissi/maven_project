package dev.portfolio.store.auth;

import jakarta.validation.constraints.*;
import java.util.UUID;

import dev.portfolio.store.user.Role;

public final class AuthDtos {
    private AuthDtos() {}
    public record RegisterRequest(@NotBlank @Email @Size(max = 254) String email,
                                  @NotBlank @Size(min = 12, max = 72) String password) {}
    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}
    public record UserResponse(UUID id, String email, Role role) {}
    public record TokenResponse(String accessToken, String tokenType, long expiresInSeconds) {}
}
