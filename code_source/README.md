# NEXORA — E-Commerce Monolith & Storefront

Production-oriented **monolithic e-commerce application** combining a high-performance **Java 21 + Spring Boot 3 REST API** with a modern, responsive **NEXORA Storefront** (HTML5, CSS3, Vanilla ES6+), created for a DevOps/DevSecOps portfolio project (Docker, AWS EKS, PostgreSQL/RDS, GitLab CI/CD, Helm, Argo CD, Prometheus, Grafana).

---

## Architecture

- **Java 21 · Spring Boot 3.5.16 · Maven**
- **Modern Monolithic Frontend:** Served directly by Spring Boot from `src/main/resources/static/` (Vanilla HTML5, CSS3, ES6+ JavaScript, SVG icons — zero external runtime or node build dependencies in production).
- **PostgreSQL** (Amazon RDS / local), Spring Data JPA, and Flyway database migrations.
- **JWT HS256 Bearer Authentication**, BCrypt password hashing, and `CUSTOMER`/`ADMIN` role-based access control (RBAC).
- **REST API:** OpenAPI 3 at `/v3/api-docs`, interactive documentation at `/swagger-ui.html`.
- **Micrometer + Prometheus:** Observability at `/actuator/prometheus`, Kubernetes liveness/readiness probes at `/actuator/health`.
- **JUnit 5 + Mockito + Testcontainers:** Automated integration tests against PostgreSQL with JaCoCo test coverage reporting.
- Structured JSON logs; no cloud SDKs or provider-specific infrastructure dependencies.

### Directory Structure

```text
src/main/java/dev/portfolio/store/
├── auth/                 # User registration, login, and JWT token issuance
├── config/               # Stateless security filter chain, JWT converters, and admin bootstrap
├── user/                 # User entities, roles (CUSTOMER, ADMIN), and repositories
├── product/              # Catalog management, product DTOs, and inventory logic
├── order/                # Checkout, pessimistic stock locking, mock payments, and cancellation
└── shared/               # RFC 7807 ProblemDetail exception handlers and metrics helpers
src/main/resources/
├── application.yml       # Application and database configuration
├── db/migration/         # Flyway SQL migrations (V1__initial_schema.sql)
└── static/               # NEXORA Storefront UI (Served directly by Spring Boot at /)
    ├── index.html        # Semantic HTML5 storefront, modals, and responsive layouts
    ├── styles.css        # Clean CSS3 design system (Apple/Shopify aesthetic, Grid, Flexbox)
    ├── store.js          # Client-side store controller, REST API client, and state management
    └── assets/           # Brand vector assets (logo.svg)
src/test/java/            # Unit tests and PostgreSQL Testcontainers integration tests
```

---

## NEXORA Storefront Features

The frontend is served directly by Spring Boot at `http://localhost:8080/`.

1. **Brand Identity & Homepage:**
   - Premium lifestyle and electronics design inspired by Apple and Shopify storefronts.
   - Hero banner with product highlight, category navigation pills, promotional banners, and trust badges (2-year warranty, carbon-neutral shipping, stock protection).
2. **Product Catalog & Filters:**
   - Responsive product card grid with high-resolution imagery, pricing, and live stock tags.
   - Category filtering (Audio, Displays, Peripherals, Accessories, Lifestyle).
   - Real-time client search with debounce and multi-criteria sorting (Price, Name, Stock).
   - Low-stock warning indicators for items with &le; 5 units remaining.
3. **Product Details:**
   - Full technical specifications, live available inventory count, and bounded quantity adjuster (1 to `availableStock`).
4. **Shopping Cart Drawer:**
   - Slide-over flyout cart drawer with real-time subtotal calculation.
   - Enforces inventory constraints (prevents adding or incrementing beyond available stock).
5. **Customer & Admin Authentication:**
   - Tabbed login and registration modals with Spring Boot password validation (`12–72` characters).
   - JWT bearer token stored safely in memory / session storage.
   - Quick one-click demo credentials for easy portfolio review.
6. **Checkout & Mock Payment:**
   - Order review and delivery information.
   - Places order via `POST /api/v1/orders` (pessimistic lock reserves inventory in `PENDING_PAYMENT` status).
   - Integrated Mock Payment simulation:
     - **Success:** Triggers `POST /api/v1/orders/{id}/payments` with `{ successful: true }` &rarr; status updates to `PAID`.
     - **Failure:** Triggers `{ successful: false }` &rarr; status updates to `PAYMENT_FAILED` and reserved stock is automatically restored.
7. **Customer Order Management ("My Orders"):**
   - Order history tracking with status filters (`PENDING_PAYMENT`, `PAID`, `CANCELLED`, `PAYMENT_FAILED`).
   - Line items breakdown with snapshot prices.
   - Order cancellation (`POST /api/v1/orders/{id}/cancel`) and payment simulation for pending orders.
8. **Admin Management Portal (Role: `ADMIN`):**
   - Live telemetry cards: Total Products, Units in Stock, Low Stock Alerts, Global Orders.
   - Product Management: Add new products (`POST /api/v1/products`), edit product details (`PUT /api/v1/products/{id}`), and adjust stock (`POST /api/v1/products/{id}/stock-adjustments`).
   - System-wide orders inspection (`GET /api/v1/admin/orders`).
9. **DevOps Architecture Hub:**
   - Built-in modal documenting deployment instructions, Maven build commands, and Actuator links.

---

## Demo Accounts

| Persona | Email | Password | Access Level |
|---|---|---|---|
| **Customer** | `customer@nexora.io` | `Password12345!` | Storefront, Cart, Checkout, My Orders |
| **Administrator** | `admin@nexora.io` | `AdminSecret12345!` | Full Storefront + Admin Management Portal |

---

## Business Rules & Transactional Guarantees

1. Everyone can browse active catalog products; customers register or log in to place orders.
2. Only users with the `ADMIN` role may create/update products or execute stock adjustments.
3. Placing an order locks product rows **in consistent UUID order** (`SELECT ... FOR UPDATE`), verifies stock availability, snapshots product names and unit prices, decrements inventory, and creates a `PENDING_PAYMENT` order in a single database transaction.
4. A **simulated** successful payment marks the order `PAID`. A failed payment marks it `PAYMENT_FAILED` and immediately restores reserved stock.
5. A customer can cancel a `PENDING_PAYMENT` order at any time, returning reserved stock to the catalog. Paid orders cannot be cancelled.
6. Customers only have access to their own orders. Administrators can view all global orders across all customers.

---

## Prerequisites

- Java **21** and Maven **3.9+**
- PostgreSQL **16+** (or AWS RDS PostgreSQL)
- Optional Docker-compatible container runtime for Testcontainers integration tests

---

## Running the Application with Maven

### 1. Configure Database & Environment
Create a PostgreSQL database named `ecommerce`. Flyway will run initial migrations automatically on boot:

```bash
export DB_HOST=localhost DB_PORT=5432 DB_NAME=ecommerce DB_USER=ecommerce
export DB_PASSWORD='your-database-password'
export APP_JWT_SECRET_BASE64="$(openssl rand -base64 32)"
export APP_ADMIN_EMAIL='admin@nexora.io'
export APP_ADMIN_PASSWORD='AdminSecret12345!'
```

### 2. Spring Security Static Resources Setup
Ensure your `SecurityConfig.java` permits unauthenticated access to the storefront static assets:

```java
.authorizeHttpRequests(auth -> auth
    // Static frontend resources
    .requestMatchers("/", "/index.html", "/*.css", "/*.js", "/assets/**", "/favicon.ico").permitAll()
    // Public REST endpoints
    .requestMatchers("/api/v1/auth/register", "/api/v1/auth/login").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/products", "/api/v1/products/*").permitAll()
    .requestMatchers("/actuator/health", "/actuator/info", "/actuator/prometheus").permitAll()
    .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
    .anyRequest().authenticated())
```

### 3. Build & Run
```bash
# Package the monolith into an executable JAR
mvn clean package -DskipTests

# Run the monolithic application
java -jar target/ecommerce-app-1.0.0-SNAPSHOT.jar
```

Alternatively, run directly with Maven:
```bash
mvn spring-boot:run
```

### 4. Access URLs
- **NEXORA Storefront:** `http://localhost:8080/`
- **Swagger / OpenAPI:** `http://localhost:8080/swagger-ui.html`
- **Health Probes:** `http://localhost:8080/actuator/health`
- **Prometheus Metrics:** `http://localhost:8080/actuator/prometheus`

---

## REST Endpoints Reference

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Register customer account (12–72 char password) |
| POST | `/api/v1/auth/login` | Public | Obtain JWT bearer access token |
| GET | `/api/v1/products?page=0&size=20` | Public | List active products (paginated) |
| GET | `/api/v1/products/{id}` | Public | Get single product details |
| POST | `/api/v1/products` | `ADMIN` | Create new product |
| PUT | `/api/v1/products/{id}` | `ADMIN` | Update product details & active status |
| POST | `/api/v1/products/{id}/stock-adjustments` | `ADMIN` | Adjust stock quantity (+/- delta) |
| POST | `/api/v1/orders` | Authenticated | Place order and reserve stock |
| GET | `/api/v1/orders` | Authenticated | List customer's own orders |
| GET | `/api/v1/orders/{id}` | Owner | View order details |
| POST | `/api/v1/orders/{id}/payments` | Owner | Simulate payment outcome (`successful: true/false`) |
| POST | `/api/v1/orders/{id}/cancel` | Owner | Cancel pending order and restore stock |
| GET | `/api/v1/admin/orders` | `ADMIN` | Browse all system orders |
| GET | `/actuator/health` | Public | Kubernetes liveness and readiness state |
| GET | `/actuator/prometheus` | Public/Internal | Prometheus metrics scraping |

---

## Observability & Metrics

Micrometer exposes custom counters reflecting committed database transactions:
- `store_orders_created_total`
- `store_orders_cancelled_total`
- `store_payments_processed_total{outcome="success|failure"}`
- `store_inventory_adjustments_total{direction="add|remove"}`

Global metric tag: `application="ecommerce-monolith"`. Logs format: structured ECS JSON for centralized log collection.

---

## Configuration Reference

| Variable | Description | Default |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL database connection settings | `localhost:5432/ecommerce` |
| `DB_POOL_SIZE` | HikariCP maximum connection pool size | `10` |
| `APP_JWT_SECRET_BASE64` | Base64-encoded HMAC-SHA256 signing secret (min 32 bytes) | *Required* |
| `APP_JWT_ISSUER` | JWT token issuer claim | `ecommerce-monolith` |
| `APP_JWT_EXPIRATION_MINUTES` | Lifetime of access tokens in minutes | `60` |
| `APP_ADMIN_EMAIL`, `APP_ADMIN_PASSWORD` | Automatic administrator bootstrap credentials | *Optional* |
| `API_DOCS_ENABLED` | Toggle Swagger UI and OpenAPI documentation | `true` |
| `PORT` | Web server listening port | `8080` |
