package dev.portfolio.store.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import dev.portfolio.store.auth.AuthDtos;
import dev.portfolio.store.auth.AuthService;
import dev.portfolio.store.shared.ConflictException;
import dev.portfolio.store.user.Role;
import dev.portfolio.store.user.UserAccount;
import dev.portfolio.store.user.UserAccountRepository;

import org.mockito.ArgumentCaptor;
import java.time.Instant;

import java.util.Optional;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserAccountRepository users;
    @Mock PasswordEncoder encoder;
    @Mock JwtEncoder jwtEncoder;
    AuthService service;

    @BeforeEach void setUp() { service = new AuthService(users, encoder, jwtEncoder, "test-issuer", 30); }

    @Test void registrationNormalizesEmailAndOnlyGrantsCustomerRole() {
        when(encoder.encode("secure-password-123")).thenReturn("bcrypt-hash");
        when(users.save(any(UserAccount.class))).thenAnswer(inv -> {
            UserAccount account = inv.getArgument(0);
            return new UserAccount(UUID.randomUUID(), account.getEmail(), account.getPasswordHash(), account.getRole());
        });
        var result = service.register(new AuthDtos.RegisterRequest("  USER@Example.COM ", "secure-password-123"));
        assertThat(result.email()).isEqualTo("user@example.com");
        assertThat(result.role()).isEqualTo(Role.CUSTOMER);
    }

    @Test void registrationRejectsExistingEmail() {
        when(users.existsByEmail("user@example.com")).thenReturn(true);
        assertThatThrownBy(() -> service.register(new AuthDtos.RegisterRequest("USER@example.com", "secure-password-123")))
                .isInstanceOf(ConflictException.class);
    }

    @Test void loginReturnsSignedBearerTokenWithCorrectExpiry() {
        UUID id = UUID.randomUUID();
        when(users.findByEmail("user@example.com")).thenReturn(Optional.of(
                new UserAccount(id, "user@example.com", "stored-hash", Role.CUSTOMER)));
        when(encoder.matches("secure-password-123", "stored-hash")).thenReturn(true);
        Jwt token = Jwt.withTokenValue("signed-token").header("alg", "HS256")
                .subject(id.toString()).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(1800)).build();
        when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(token);
        var result = service.login(new AuthDtos.LoginRequest(" USER@Example.com ", "secure-password-123"));
        assertThat(result.accessToken()).isEqualTo("signed-token");
        assertThat(result.tokenType()).isEqualTo("Bearer");
        assertThat(result.expiresInSeconds()).isEqualTo(1800);
        ArgumentCaptor<JwtEncoderParameters> captor = ArgumentCaptor.forClass(JwtEncoderParameters.class);
        verify(jwtEncoder).encode(captor.capture());
        assertThat(captor.getValue().getClaims().getSubject()).isEqualTo(id.toString());
        assertThat(captor.getValue().getClaims().getClaimAsStringList("roles")).containsExactly("CUSTOMER");
    }

    @Test void wrongPasswordGetsGenericError() {
        when(users.findByEmail("user@example.com")).thenReturn(Optional.of(
                new UserAccount(UUID.randomUUID(), "user@example.com", "stored-hash", Role.CUSTOMER)));
        when(encoder.matches("bad-password", "stored-hash")).thenReturn(false);
        assertThatThrownBy(() -> service.login(new AuthDtos.LoginRequest("user@example.com", "bad-password")))
                .isInstanceOf(BadCredentialsException.class).hasMessage("Invalid email or password");
    }
}
