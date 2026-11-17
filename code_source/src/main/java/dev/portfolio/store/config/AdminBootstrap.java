package dev.portfolio.store.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import dev.portfolio.store.user.Role;
import dev.portfolio.store.user.UserAccount;
import dev.portfolio.store.user.UserAccountRepository;

import java.util.Locale;

@Configuration
public class AdminBootstrap {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    @Bean CommandLineRunner bootstrapAdministrator(UserAccountRepository users, PasswordEncoder encoder,
            @Value("${app.bootstrap.admin-email:}") String email,
            @Value("${app.bootstrap.admin-password:}") String password) {
        return args -> {
            if (email.isBlank() && password.isBlank()) return;
            if (email.isBlank() || password.isBlank()) throw new IllegalStateException("Both APP_ADMIN_EMAIL and APP_ADMIN_PASSWORD must be set");
            if (password.length() < 12 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
                throw new IllegalStateException("Admin password must be 12-72 UTF-8 bytes");
            String normalized = email.trim().toLowerCase(Locale.ROOT);
            if (users.existsByEmail(normalized)) return;
            users.save(new UserAccount(normalized, encoder.encode(password), Role.ADMIN));
            log.info("Initial administrator account created");
        };
    }
}
