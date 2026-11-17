package dev.portfolio.store.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;

import dev.portfolio.store.config.JwtConfig;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

class JwtConfigTest {
    private final JwtConfig config = new JwtConfig();

    @Test void signedTokensRoundTripWithIssuerAndRoles() {
        SecretKey key = config.jwtSecretKey(Base64.getEncoder().encodeToString(new byte[32]));
        JwtEncoder encoder = config.jwtEncoder(key);
        JwtDecoder decoder = config.jwtDecoder(key, "store-test");
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer("store-test").subject("abc")
                .issuedAt(now).expiresAt(now.plusSeconds(120))
                .claim("roles", List.of("CUSTOMER")).build();
        String token = encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        Jwt decoded = decoder.decode(token);
        assertThat(decoded.getSubject()).isEqualTo("abc");
        assertThat(decoded.getClaimAsStringList("roles")).containsExactly("CUSTOMER");
    }

    @Test void weakOrInvalidSecretsAreRejected() {
        assertThatThrownBy(() -> config.jwtSecretKey("not_base64!"))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> config.jwtSecretKey(Base64.getEncoder().encodeToString(new byte[15])))
                .isInstanceOf(IllegalStateException.class);
    }
}
