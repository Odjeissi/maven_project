package dev.portfolio.store.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.portfolio.store.shared.ConflictException;
import dev.portfolio.store.user.Role;
import dev.portfolio.store.user.UserAccount;
import dev.portfolio.store.user.UserAccountRepository;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

@Service
public class AuthService {
    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final String issuer;
    private final long expirationMinutes;

    public AuthService(UserAccountRepository users, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder,
            @Value("${app.jwt.issuer}") String issuer,
            @Value("${app.jwt.expiration-minutes:60}") long expirationMinutes) {
        this.users = users; this.passwordEncoder = passwordEncoder; this.jwtEncoder = jwtEncoder;
        this.issuer = issuer; this.expirationMinutes = expirationMinutes;
        if (expirationMinutes < 1 || expirationMinutes > 1440) throw new IllegalArgumentException("JWT expiration must be 1-1440 minutes");
    }

    @Transactional
    public AuthDtos.UserResponse register(AuthDtos.RegisterRequest request) {
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72)
            throw new IllegalArgumentException("Password cannot exceed 72 UTF-8 bytes");
        String email = normalizeEmail(request.email());
        if (users.existsByEmail(email)) throw new ConflictException("Email is already registered");
        UserAccount saved = users.save(new UserAccount(email, passwordEncoder.encode(request.password()), Role.CUSTOMER));
        return new AuthDtos.UserResponse(saved.getId(), saved.getEmail(), saved.getRole());
    }

    @Transactional(readOnly = true)
    public AuthDtos.TokenResponse login(AuthDtos.LoginRequest request) {
        UserAccount account = users.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), account.getPasswordHash()))
            throw new BadCredentialsException("Invalid email or password");
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer(issuer).subject(account.getId().toString())
                .issuedAt(now).expiresAt(now.plus(expirationMinutes, ChronoUnit.MINUTES))
                .claim("roles", List.of(account.getRole().name())).build();
        String value = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new AuthDtos.TokenResponse(value, "Bearer", expirationMinutes * 60);
    }

    private static String normalizeEmail(String email) { return email.trim().toLowerCase(Locale.ROOT); }
}
