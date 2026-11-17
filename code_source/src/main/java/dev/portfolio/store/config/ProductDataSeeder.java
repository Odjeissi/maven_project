package dev.portfolio.store.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import dev.portfolio.store.product.Product;
import dev.portfolio.store.product.ProductRepository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Automatically seeds 30 realistic mock e-commerce products across 5 core categories
 * (Audio, Displays, Peripherals, Accessories, Lifestyle) if the PostgreSQL products table is empty.
 * <p>
 * Configurable via {@code app.seed.products.enabled} (enabled by default for local/dev,
 * disable in production with APP_SEED_PRODUCTS_ENABLED=false).
 */
@Component
@ConditionalOnProperty(name = "app.seed.products.enabled", havingValue = "true", matchIfMissing = true)
public class ProductDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductDataSeeder.class);

    private final ProductRepository productRepository;

    public ProductDataSeeder(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedIfEmpty();
    }

    @Transactional
    public boolean seedIfEmpty() {
        long currentCount = productRepository.count();
        if (currentCount > 0) {
            log.info("Products table already contains {} records; skipping database seed.", currentCount);
            return false;
        }

        List<Product> products = createCatalog();
        productRepository.saveAll(products);
        log.info("Products table is empty. Successfully seeded {} mock e-commerce products into the database.", products.size());
        return true;
    }

    /**
     * Builds the curated catalog of 30 mock products (6 products per category).
     */
    public static List<Product> createCatalog() {
        return List.of(
            // ================= AUDIO (6 products) =================
            new Product(
                "NEX-AUD-001",
                "AeroPulse Pro Active Noise-Cancelling Headphones",
                "Flagship wireless headphones featuring custom 40mm beryllium drivers, active hybrid noise cancellation, 45-hour battery life, and ultra-plush protein leather earcups for pristine studio sound.",
                new BigDecimal("349.00"),
                24,
                true
            ),
            new Product(
                "NEX-AUD-002",
                "SonicPulse True Wireless ANC Earbuds",
                "Compact high-fidelity wireless earbuds with dual armature sound drivers, adaptive transparency mode, wireless Qi charging case, and IPX7 sweat resistance.",
                new BigDecimal("179.99"),
                35,
                true
            ),
            new Product(
                "NEX-AUD-003",
                "EchoSound Reference Studio Bookshelf Speakers",
                "Bi-amplified desktop audio studio monitors with 5-inch Kevlar woofers, 1-inch silk dome tweeters, Bluetooth 5.3 aptX HD, and balanced XLR inputs.",
                new BigDecimal("289.00"),
                15,
                true
            ),
            new Product(
                "NEX-AUD-004",
                "VocalWave Pro Broadcast Condenser Microphone",
                "Cardioid USB and XLR condenser microphone tailored for streaming, podcasts, and studio vocal audio capture with internal shockmount and zero-latency monitoring.",
                new BigDecimal("199.50"),
                20,
                true
            ),
            new Product(
                "NEX-AUD-005",
                "PulseBeam Portable Waterproof Bluetooth Speaker",
                "Rugged 360-degree outdoor sound speaker with dual passive radiators, 24-hour battery life, PartySync daisy chaining, and IP67 dust and waterproof rating.",
                new BigDecimal("129.00"),
                42,
                true
            ),
            new Product(
                "NEX-AUD-006",
                "SoundCraft Desktop USB Audio DAC & Headphone Amp",
                "High-resolution desktop headphone amplifier with 32-bit/384kHz ESS Sabre DAC, balanced 4.4mm output, and precision gain switch for audiophile sound.",
                new BigDecimal("159.00"),
                18,
                true
            ),

            // ================= DISPLAYS (6 products) =================
            new Product(
                "NEX-DSP-001",
                "Lumina 32-Inch 4K UHD Studio Monitor",
                "Calibrated 3840x2160 IPS Black display with 99% DCI-P3 wide color gamut, 90W USB-C Power Delivery hub, HDR600, and integrated ambient light sensor.",
                new BigDecimal("799.00"),
                8,
                true
            ),
            new Product(
                "NEX-DSP-002",
                "HorizonView 34-Inch Curved Ultrawide Monitor",
                "Immersive 3440x1440 WQHD 1000R curved screen with 165Hz refresh rate, 1ms response time, KVM switch, and anti-glare matte coating.",
                new BigDecimal("649.50"),
                12,
                true
            ),
            new Product(
                "NEX-DSP-003",
                "ApexMotion 27-Inch 240Hz Gaming Monitor",
                "Tournament-grade 2560x1440 Fast-IPS gaming monitor featuring 240Hz refresh rate, 0.5ms GtG response, AMD FreeSync Premium Pro, and G-Sync compatibility.",
                new BigDecimal("479.00"),
                16,
                true
            ),
            new Product(
                "NEX-DSP-004",
                "Lumina Travel 15.6-Inch OLED Portable Monitor",
                "Ultra-slim 4K portable OLED screen with 100% DCI-P3 color precision, dual USB-C video/power inputs, magnetic origami kickstand case, and 10-point touch.",
                new BigDecimal("389.00"),
                22,
                true
            ),
            new Product(
                "NEX-DSP-005",
                "ColorMaster 27-Inch 4K Hardware-Calibrated Monitor",
                "Color-critical graphic design display with built-in motorized calibration sensor, Delta E < 1 accuracy, shading hood, and dual HDMI 2.1 ports.",
                new BigDecimal("899.00"),
                6,
                true
            ),
            new Product(
                "NEX-DSP-006",
                "VisionCurve 49-Inch Dual-QHD Super Ultrawide Monitor",
                "Massive 5120x1440 32:9 curved panoramic display replacing multi-monitor setups, featuring Picture-by-Picture, 120Hz refresh rate, and height-adjustable stand.",
                new BigDecimal("1199.00"),
                5,
                true
            ),

            // ================= PERIPHERALS (6 products) =================
            new Product(
                "NEX-PER-001",
                "Vortex-65 Wireless Mechanical Keyboard",
                "Precision CNC-machined aluminum chassis, custom pre-lubed tactile switches, PBT double-shot keycaps, and tri-mode 2.4GHz Bluetooth 5.3 connectivity.",
                new BigDecimal("189.50"),
                28,
                true
            ),
            new Product(
                "NEX-PER-002",
                "OmniGlide Precision Ergonomic Wireless Mouse",
                "Ergonomic sculpt with whisper-quiet microswitches, high-precision 26,000 DPI sensor, PTFE glide feet, and dual infinite-scroll thumb wheels.",
                new BigDecimal("119.00"),
                40,
                true
            ),
            new Product(
                "NEX-PER-003",
                "ClawPro Ultra-Lightweight Wireless Gaming Mouse",
                "49-gram symmetrical honeycomb-free shell, optical switches rated for 90M clicks, 4K wireless polling rate dongle, and virgin PTFE glide skates.",
                new BigDecimal("99.00"),
                30,
                true
            ),
            new Product(
                "NEX-PER-004",
                "KeyForge Tenkeyless Custom Hot-Swap Keyboard",
                "Gasket-mounted mechanical keyboard with polycarbonate plate, south-facing per-key RGB, sound-dampening poron foam, and hot-swappable switch sockets.",
                new BigDecimal("169.00"),
                25,
                true
            ),
            new Product(
                "NEX-PER-005",
                "StreamClear 4K Ultra-HD Webcam with Smooth Glide Mount",
                "Large Sony STARVIS sensor with AI auto-framing, smooth glide mount, dual noise-reducing microphones, HDR, and physical privacy shutter.",
                new BigDecimal("149.00"),
                32,
                true
            ),
            new Product(
                "NEX-PER-006",
                "ChromaCraft Custom PBT Dye-Sub Keycap Set",
                "Cherry profile 142-key keycap set made with 1.5mm thick PBT plastic, Japanese root sublegends, and compatibility with ANSI and ISO mechanical layouts.",
                new BigDecimal("49.99"),
                50,
                true
            ),

            // ================= ACCESSORIES (6 products) =================
            new Product(
                "NEX-ACC-001",
                "Thunderbolt 4 Pro Dock Station 14-in-1",
                "Enterprise 40Gbps connectivity hub powering dual video outputs, 2.5Gbps Ethernet, 96W upstream charging, SD 4.0 UHS-II, and peripheral connectivity.",
                new BigDecimal("249.00"),
                18,
                true
            ),
            new Product(
                "NEX-ACC-002",
                "Strata 2TB Rugged External NVMe SSD",
                "Blazing 2,050 MB/s read and write transfers over USB 3.2 Gen 2x2. IP67 water and dust resistance with 3-meter drop-tested aluminum silicon enclosure.",
                new BigDecimal("179.99"),
                26,
                true
            ),
            new Product(
                "NEX-ACC-003",
                "OmniPower 140W GaN Fast Wall Charger with Braided Cable",
                "Next-gen Gallium Nitride 3-port fast charger with foldable prongs and braided USB-C cable included, intelligent power distribution, and 140W PD 3.1 support.",
                new BigDecimal("79.99"),
                45,
                true
            ),
            new Product(
                "NEX-ACC-004",
                "HyperDrive 7-in-1 Travel USB-C Mini Dock",
                "Pocket-sized aluminum expansion dock with 4K 60Hz HDMI, 100W Power Delivery pass-through, dual USB-A 3.2 ports, and micro-SD card reader.",
                new BigDecimal("59.00"),
                38,
                true
            ),
            new Product(
                "NEX-ACC-005",
                "VoltBraided 240W Thunderbolt 4 Cable 2m",
                "Certified 40Gbps data sync cable supporting 240W Extended Power Range, 8K video transmission, and reinforced aramid fiber braided jacket.",
                new BigDecimal("34.50"),
                60,
                true
            ),
            new Product(
                "NEX-ACC-006",
                "NovaCore 1TB Ultra-Slim Magnetic SSD",
                "MagSafe compatible external solid-state drive that snaps to phones or laptops for direct ProRes video recording and rapid 1,050 MB/s file transfers.",
                new BigDecimal("129.00"),
                22,
                true
            ),

            // ================= LIFESTYLE (6 products) =================
            new Product(
                "NEX-LIF-001",
                "ErgoFlow Executive Breathable Mesh Office Chair",
                "Full synchro-tilt mechanism, 4D adjustable armrests, adaptive dynamic lumbar support, and breathable Korean mesh for all-day posture health.",
                new BigDecimal("499.00"),
                10,
                true
            ),
            new Product(
                "NEX-LIF-002",
                "Solara Smart Desk Lamp with Wireless Charging",
                "Zero-flicker architectural illumination with auto-dimming ambient sensor, stepless color temperature control, and 15W Qi fast charging base.",
                new BigDecimal("89.00"),
                34,
                true
            ),
            new Product(
                "NEX-LIF-003",
                "AuraGlow Smart Modular RGB Workspace Light Panels",
                "Nine modular geometric LED wall tiles with music synchronization, 16 million colors, and smart home automation integration via Matter and HomeKit.",
                new BigDecimal("169.99"),
                20,
                true
            ),
            new Product(
                "NEX-LIF-004",
                "Vanguard Commuter Weatherproof Tech Backpack",
                "Cordura ballistic nylon backpack featuring dedicated padded compartments for 16-inch laptops and tablets, hidden passport pocket, and luggage pass-through.",
                new BigDecimal("139.00"),
                28,
                true
            ),
            new Product(
                "NEX-LIF-005",
                "Elevate Anodized Aluminum Laptop Riser",
                "Precision folded aerospace-grade aluminum stand with silicone non-slip padding, ventilation cooling channels, and ergonomic eye-level posture alignment.",
                new BigDecimal("59.90"),
                40,
                true
            ),
            new Product(
                "NEX-LIF-006",
                "TerraDesk Genuine Top-Grain Leather Desk Mat",
                "Crafted from vegetable-tanned full-grain leather with suede backing, water-resistant protective finish, and integrated pen rest for minimalist desks.",
                new BigDecimal("68.00"),
                35,
                true
            )
        );
    }
}
