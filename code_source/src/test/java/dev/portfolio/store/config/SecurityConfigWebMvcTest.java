
package dev.portfolio.store.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = SecurityConfigWebMvcTest.ProbeController.class
)
@Import({
    SecurityConfig.class,
    SecurityConfigWebMvcTest.ProbeController.class
})
class SecurityConfigWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    // TEST 1 - Homepage is public
    @Test
    void homepageShouldBePublic() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.TEXT_HTML));
    }

    // TEST 2 - Storefront HTML is public
    @Test
    void indexHtmlShouldBePublic() throws Exception {
        mockMvc.perform(get("/index.html"))
                .andExpect(status().isOk());
    }

    // TEST 3 - CSS is public
    @Test
    void stylesheetShouldBePublic() throws Exception {
        mockMvc.perform(get("/styles.css"))
                .andExpect(status().isOk());
    }

    // TEST 4 - JavaScript is public
    @Test
    void javascriptShouldBePublic() throws Exception {
        mockMvc.perform(get("/store.js"))
                .andExpect(status().isOk());
    }

    // TEST 5 - Product catalog is public
    @Test
    void productsShouldBePublic() throws Exception {
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk());
    }

    // TEST 6 - Orders require authentication
    @Test
    void ordersShouldRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/orders"))
                .andExpect(status().isUnauthorized());
    }

    // TEST 7 - CUSTOMER cannot access ADMIN endpoint
    @Test
    @WithMockUser(roles = "CUSTOMER")
    void customerShouldNotAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/admin/orders"))
                .andExpect(status().isForbidden());
    }

    // TEST 8 - Verify actual storefront files exist
    @Test
    void storefrontResourcesShouldExist() {
        assertTrue(
            new ClassPathResource("static/index.html").exists(),
            "index.html is missing"
        );

        assertTrue(
            new ClassPathResource("static/styles.css").exists(),
            "styles.css is missing"
        );

        assertTrue(
            new ClassPathResource("static/store.js").exists(),
            "store.js is missing"
        );
    }

    // Test-only routes for verifying security rules.
    @RestController
    public static class ProbeController {

        @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
        public String home() {
            return "<html><body>NEXORA</body></html>";
        }

        @GetMapping(value = "/index.html",
                    produces = MediaType.TEXT_HTML_VALUE)
        public String index() {
            return "<html><body>NEXORA</body></html>";
        }

        @GetMapping(value = "/styles.css",
                    produces = "text/css")
        public String css() {
            return "body { margin: 0; }";
        }

        @GetMapping(value = "/store.js",
                    produces = "text/javascript")
        public String js() {
            return "console.log('NEXORA');";
        }

        @GetMapping("/api/v1/products")
        public List<String> products() {
            return List.of();
        }

        @GetMapping("/api/v1/orders")
        public List<String> orders() {
            return List.of();
        }

        @PreAuthorize("hasRole('ADMIN')")
        @GetMapping("/api/v1/admin/orders")
        public List<String> adminOrders() {
            return List.of();
        }
    }
}
