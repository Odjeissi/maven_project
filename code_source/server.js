import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory mock storage matching Spring Boot schema
const users = new Map();
const products = new Map();
const orders = new Map();

// Helper for RFC 7807 Problem Detail
function problemDetail(res, status, title, detail) {
  return res.status(status).json({
    type: 'about:blank',
    title,
    status,
    detail
  });
}

// Seed admin & customer users
const adminId = 'd3b07384-d113-40e1-bbd4-9d5f77873634';
const customerId = '7e2b10df-01aa-4621-996b-4e64f7808722';

users.set('admin@nexora.io', {
  id: adminId,
  email: 'admin@nexora.io',
  password: 'AdminSecret12345!',
  role: 'ADMIN',
  createdAt: new Date().toISOString()
});

users.set('customer@nexora.io', {
  id: customerId,
  email: 'customer@nexora.io',
  password: 'Password12345!',
  role: 'CUSTOMER',
  createdAt: new Date().toISOString()
});

// Seed sample products matching Spring Boot Product schema (30 products across 5 categories)
const initialProducts = [
  // ================= AUDIO (6 products) =================
  {
    id: 'a1000000-0000-4000-a000-000000000001',
    sku: 'NEX-AUD-001',
    name: 'AeroPulse Pro Active Noise-Cancelling Headphones',
    description: 'Flagship wireless headphones featuring custom 40mm beryllium drivers, active hybrid noise cancellation, 45-hour battery life, and ultra-plush protein leather earcups for pristine studio sound.',
    unitPrice: 349.00,
    availableStock: 24,
    active: true,
    category: 'Audio',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'a1000000-0000-4000-a000-000000000002',
    sku: 'NEX-AUD-002',
    name: 'SonicPulse True Wireless ANC Earbuds',
    description: 'Compact high-fidelity wireless earbuds with dual armature sound drivers, adaptive transparency mode, wireless Qi charging case, and IPX7 sweat resistance.',
    unitPrice: 179.99,
    availableStock: 35,
    active: true,
    category: 'Audio',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'a1000000-0000-4000-a000-000000000003',
    sku: 'NEX-AUD-003',
    name: 'EchoSound Reference Studio Bookshelf Speakers',
    description: 'Bi-amplified desktop audio studio monitors with 5-inch Kevlar woofers, 1-inch silk dome tweeters, Bluetooth 5.3 aptX HD, and balanced XLR inputs.',
    unitPrice: 289.00,
    availableStock: 15,
    active: true,
    category: 'Audio',
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'a1000000-0000-4000-a000-000000000004',
    sku: 'NEX-AUD-004',
    name: 'VocalWave Pro Broadcast Condenser Microphone',
    description: 'Cardioid USB and XLR condenser microphone tailored for streaming, podcasts, and studio vocal audio capture with internal shockmount and zero-latency monitoring.',
    unitPrice: 199.50,
    availableStock: 20,
    active: true,
    category: 'Audio',
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'a1000000-0000-4000-a000-000000000005',
    sku: 'NEX-AUD-005',
    name: 'PulseBeam Portable Waterproof Bluetooth Speaker',
    description: 'Rugged 360-degree outdoor sound speaker with dual passive radiators, 24-hour battery life, PartySync daisy chaining, and IP67 dust and waterproof rating.',
    unitPrice: 129.00,
    availableStock: 42,
    active: true,
    category: 'Audio',
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'a1000000-0000-4000-a000-000000000006',
    sku: 'NEX-AUD-006',
    name: 'SoundCraft Desktop USB Audio DAC & Headphone Amp',
    description: 'High-resolution desktop headphone amplifier with 32-bit/384kHz ESS Sabre DAC, balanced 4.4mm output, and precision gain switch for audiophile sound.',
    unitPrice: 159.00,
    availableStock: 18,
    active: true,
    category: 'Audio',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80'
  },

  // ================= DISPLAYS (6 products) =================
  {
    id: 'd1000000-0000-4000-a000-000000000001',
    sku: 'NEX-DSP-001',
    name: 'Lumina 32-Inch 4K UHD Studio Monitor',
    description: 'Calibrated 3840x2160 IPS Black display with 99% DCI-P3 wide color gamut, 90W USB-C Power Delivery hub, HDR600, and integrated ambient light sensor.',
    unitPrice: 799.00,
    availableStock: 8,
    active: true,
    category: 'Displays',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'd1000000-0000-4000-a000-000000000002',
    sku: 'NEX-DSP-002',
    name: 'HorizonView 34-Inch Curved Ultrawide Monitor',
    description: 'Immersive 3440x1440 WQHD 1000R curved screen with 165Hz refresh rate, 1ms response time, KVM switch, and anti-glare matte coating.',
    unitPrice: 649.50,
    availableStock: 12,
    active: true,
    category: 'Displays',
    imageUrl: 'https://images.unsplash.com/photo-1547119957-637f8679db1e?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'd1000000-0000-4000-a000-000000000003',
    sku: 'NEX-DSP-003',
    name: 'ApexMotion 27-Inch 240Hz Gaming Monitor',
    description: 'Tournament-grade 2560x1440 Fast-IPS gaming monitor featuring 240Hz refresh rate, 0.5ms GtG response, AMD FreeSync Premium Pro, and G-Sync compatibility.',
    unitPrice: 479.00,
    availableStock: 16,
    active: true,
    category: 'Displays',
    imageUrl: 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'd1000000-0000-4000-a000-000000000004',
    sku: 'NEX-DSP-004',
    name: 'Lumina Travel 15.6-Inch OLED Portable Monitor',
    description: 'Ultra-slim 4K portable OLED screen with 100% DCI-P3 color precision, dual USB-C video/power inputs, magnetic origami kickstand case, and 10-point touch.',
    unitPrice: 389.00,
    availableStock: 22,
    active: true,
    category: 'Displays',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'd1000000-0000-4000-a000-000000000005',
    sku: 'NEX-DSP-005',
    name: 'ColorMaster 27-Inch 4K Hardware-Calibrated Monitor',
    description: 'Color-critical graphic design display with built-in motorized calibration sensor, Delta E < 1 accuracy, shading hood, and dual HDMI 2.1 ports.',
    unitPrice: 899.00,
    availableStock: 6,
    active: true,
    category: 'Displays',
    imageUrl: 'https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'd1000000-0000-4000-a000-000000000006',
    sku: 'NEX-DSP-006',
    name: 'VisionCurve 49-Inch Dual-QHD Super Ultrawide Monitor',
    description: 'Massive 5120x1440 32:9 curved panoramic display replacing multi-monitor setups, featuring Picture-by-Picture, 120Hz refresh rate, and height-adjustable stand.',
    unitPrice: 1199.00,
    availableStock: 5,
    active: true,
    category: 'Displays',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80'
  },

  // ================= PERIPHERALS (6 products) =================
  {
    id: 'p1000000-0000-4000-a000-000000000001',
    sku: 'NEX-PER-001',
    name: 'Vortex-65 Wireless Mechanical Keyboard',
    description: 'Precision CNC-machined aluminum chassis, custom pre-lubed tactile switches, PBT double-shot keycaps, and tri-mode 2.4GHz Bluetooth 5.3 connectivity.',
    unitPrice: 189.50,
    availableStock: 28,
    active: true,
    category: 'Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'p1000000-0000-4000-a000-000000000002',
    sku: 'NEX-PER-002',
    name: 'OmniGlide Precision Ergonomic Wireless Mouse',
    description: 'Ergonomic sculpt with whisper-quiet microswitches, high-precision 26,000 DPI sensor, PTFE glide feet, and dual infinite-scroll thumb wheels.',
    unitPrice: 119.00,
    availableStock: 40,
    active: true,
    category: 'Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'p1000000-0000-4000-a000-000000000003',
    sku: 'NEX-PER-003',
    name: 'ClawPro Ultra-Lightweight Wireless Gaming Mouse',
    description: '49-gram symmetrical honeycomb-free shell, optical switches rated for 90M clicks, 4K wireless polling rate dongle, and virgin PTFE glide skates.',
    unitPrice: 99.00,
    availableStock: 30,
    active: true,
    category: 'Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'p1000000-0000-4000-a000-000000000004',
    sku: 'NEX-PER-004',
    name: 'KeyForge Tenkeyless Custom Hot-Swap Keyboard',
    description: 'Gasket-mounted mechanical keyboard with polycarbonate plate, south-facing per-key RGB, sound-dampening poron foam, and hot-swappable switch sockets.',
    unitPrice: 169.00,
    availableStock: 25,
    active: true,
    category: 'Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'p1000000-0000-4000-a000-000000000005',
    sku: 'NEX-PER-005',
    name: 'StreamClear 4K Ultra-HD Webcam with Smooth Glide Mount',
    description: 'Large Sony STARVIS sensor with AI auto-framing, smooth glide mount, dual noise-reducing microphones, HDR, and physical privacy shutter.',
    unitPrice: 149.00,
    availableStock: 32,
    active: true,
    category: 'Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'p1000000-0000-4000-a000-000000000006',
    sku: 'NEX-PER-006',
    name: 'ChromaCraft Custom PBT Dye-Sub Keycap Set',
    description: 'Cherry profile 142-key keycap set made with 1.5mm thick PBT plastic, Japanese root sublegends, and compatibility with ANSI and ISO mechanical layouts.',
    unitPrice: 49.99,
    availableStock: 50,
    active: true,
    category: 'Peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80'
  },

  // ================= ACCESSORIES (6 products) =================
  {
    id: 'c1000000-0000-4000-a000-000000000001',
    sku: 'NEX-ACC-001',
    name: 'Thunderbolt 4 Pro Dock Station 14-in-1',
    description: 'Enterprise 40Gbps connectivity hub powering dual video outputs, 2.5Gbps Ethernet, 96W upstream charging, SD 4.0 UHS-II, and peripheral connectivity.',
    unitPrice: 249.00,
    availableStock: 18,
    active: true,
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'c1000000-0000-4000-a000-000000000002',
    sku: 'NEX-ACC-002',
    name: 'Strata 2TB Rugged External NVMe SSD',
    description: 'Blazing 2,050 MB/s read and write transfers over USB 3.2 Gen 2x2. IP67 water and dust resistance with 3-meter drop-tested aluminum silicon enclosure.',
    unitPrice: 179.99,
    availableStock: 26,
    active: true,
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'c1000000-0000-4000-a000-000000000003',
    sku: 'NEX-ACC-003',
    name: 'OmniPower 140W GaN Fast Wall Charger with Braided Cable',
    description: 'Next-gen Gallium Nitride 3-port fast charger with foldable prongs and braided USB-C cable included, intelligent power distribution, and 140W PD 3.1 support.',
    unitPrice: 79.99,
    availableStock: 45,
    active: true,
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'c1000000-0000-4000-a000-000000000004',
    sku: 'NEX-ACC-004',
    name: 'HyperDrive 7-in-1 Travel USB-C Mini Dock',
    description: 'Pocket-sized aluminum expansion dock with 4K 60Hz HDMI, 100W Power Delivery pass-through, dual USB-A 3.2 ports, and micro-SD card reader.',
    unitPrice: 59.00,
    availableStock: 38,
    active: true,
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'c1000000-0000-4000-a000-000000000005',
    sku: 'NEX-ACC-005',
    name: 'VoltBraided 240W Thunderbolt 4 Cable 2m',
    description: 'Certified 40Gbps data sync cable supporting 240W Extended Power Range, 8K video transmission, and reinforced aramid fiber braided jacket.',
    unitPrice: 34.50,
    availableStock: 60,
    active: true,
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'c1000000-0000-4000-a000-000000000006',
    sku: 'NEX-ACC-006',
    name: 'NovaCore 1TB Ultra-Slim Magnetic SSD',
    description: 'MagSafe compatible external solid-state drive that snaps to phones or laptops for direct ProRes video recording and rapid 1,050 MB/s file transfers.',
    unitPrice: 129.00,
    availableStock: 22,
    active: true,
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800&auto=format&fit=crop&q=80'
  },

  // ================= LIFESTYLE (6 products) =================
  {
    id: 'l1000000-0000-4000-a000-000000000001',
    sku: 'NEX-LIF-001',
    name: 'ErgoFlow Executive Breathable Mesh Office Chair',
    description: 'Full synchro-tilt mechanism, 4D adjustable armrests, adaptive dynamic lumbar support, and breathable Korean mesh for all-day posture health.',
    unitPrice: 499.00,
    availableStock: 10,
    active: true,
    category: 'Lifestyle',
    imageUrl: 'https://images.unsplash.com/photo-1580481077197-76b6630f9a2e?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'l1000000-0000-4000-a000-000000000002',
    sku: 'NEX-LIF-002',
    name: 'Solara Smart Desk Lamp with Wireless Charging',
    description: 'Zero-flicker architectural illumination with auto-dimming ambient sensor, stepless color temperature control, and 15W Qi fast charging base.',
    unitPrice: 89.00,
    availableStock: 34,
    active: true,
    category: 'Lifestyle',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'l1000000-0000-4000-a000-000000000003',
    sku: 'NEX-LIF-003',
    name: 'AuraGlow Smart Modular RGB Workspace Light Panels',
    description: 'Nine modular geometric LED wall tiles with music synchronization, 16 million colors, and smart home automation integration via Matter and HomeKit.',
    unitPrice: 169.99,
    availableStock: 20,
    active: true,
    category: 'Lifestyle',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'l1000000-0000-4000-a000-000000000004',
    sku: 'NEX-LIF-004',
    name: 'Vanguard Commuter Weatherproof Tech Backpack',
    description: 'Cordura ballistic nylon backpack featuring dedicated padded compartments for 16-inch laptops and tablets, hidden passport pocket, and luggage pass-through.',
    unitPrice: 139.00,
    availableStock: 28,
    active: true,
    category: 'Lifestyle',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'l1000000-0000-4000-a000-000000000005',
    sku: 'NEX-LIF-005',
    name: 'Elevate Anodized Aluminum Laptop Riser',
    description: 'Precision folded aerospace-grade aluminum stand with silicone non-slip padding, ventilation cooling channels, and ergonomic eye-level posture alignment.',
    unitPrice: 59.90,
    availableStock: 40,
    active: true,
    category: 'Lifestyle',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'l1000000-0000-4000-a000-000000000006',
    sku: 'NEX-LIF-006',
    name: 'TerraDesk Genuine Top-Grain Leather Desk Mat',
    description: 'Crafted from vegetable-tanned full-grain leather with suede backing, water-resistant protective finish, and integrated pen rest for minimalist desks.',
    unitPrice: 68.00,
    availableStock: 35,
    active: true,
    category: 'Lifestyle',
    imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80'
  }
];

initialProducts.forEach(p => products.set(p.id, { ...p }));

// Helper: authenticate bearer token
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return problemDetail(res, 401, 'Unauthorized', 'Full authentication is required to access this resource');
  }

  const token = authHeader.split(' ')[1];
  try {
    // Tokens are formatted as user-encoded base64 json: userId:email:role
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    req.user = decoded;
    next();
  } catch {
    return problemDetail(res, 401, 'Unauthorized', 'Invalid or expired authentication token');
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return problemDetail(res, 403, 'Forbidden', 'You do not have access to this resource');
  }
  next();
}

// ================= AUTH CONTROLLER =================
app.post('/api/v1/auth/register', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !email.includes('@') || email.length > 254) {
    return problemDetail(res, 400, 'Validation failed', 'email: must be a well-formed email address');
  }
  if (!password || password.length < 12 || password.length > 72) {
    return problemDetail(res, 400, 'Validation failed', 'password: size must be between 12 and 72');
  }

  const normalized = email.trim().toLowerCase();
  if (users.has(normalized)) {
    return problemDetail(res, 409, 'Conflict', 'User with email already exists');
  }

  const user = {
    id: crypto.randomUUID(),
    email: normalized,
    password,
    role: 'CUSTOMER',
    createdAt: new Date().toISOString()
  };

  users.set(normalized, user);
  res.status(201).json({
    id: user.id,
    email: user.email,
    role: user.role
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return problemDetail(res, 400, 'Validation failed', 'email and password are required');
  }

  const normalized = email.trim().toLowerCase();
  const user = users.get(normalized);
  if (!user || user.password !== password) {
    return problemDetail(res, 401, 'Unauthorized', 'Invalid email or password');
  }

  // Create JWT-equivalent token payload
  const tokenPayload = {
    sub: user.id,
    email: user.email,
    roles: [user.role],
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  const accessToken = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
  res.json({
    accessToken,
    tokenType: 'Bearer',
    expiresInSeconds: 3600
  });
});

// ================= PRODUCT CONTROLLER =================
app.get('/api/v1/products', (req, res) => {
  const page = parseInt(req.query.page || '0', 10);
  const size = parseInt(req.query.size || '20', 10);

  if (page < 0 || size < 1 || size > 100) {
    return problemDetail(res, 400, 'Invalid request', 'page must be >= 0 and size must be 1-100');
  }

  const activeProducts = Array.from(products.values())
    .filter(p => p.active)
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalElements = activeProducts.length;
  const totalPages = Math.ceil(totalElements / size) || 1;
  const start = page * size;
  const content = activeProducts.slice(start, start + size).map(p => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    unitPrice: p.unitPrice,
    availableStock: p.availableStock,
    active: p.active,
    imageUrl: p.imageUrl,
    category: p.category
  }));

  res.json({
    content,
    pageable: {
      pageNumber: page,
      pageSize: size,
      sort: { sorted: true, empty: false, unsorted: false },
      offset: start,
      paged: true,
      unpaged: false
    },
    totalElements,
    totalPages,
    last: page >= totalPages - 1,
    first: page === 0,
    size,
    number: page,
    numberOfElements: content.length,
    empty: content.length === 0
  });
});

app.get('/api/v1/products/:id', (req, res) => {
  const product = products.get(req.params.id);
  if (!product || !product.active) {
    return problemDetail(res, 404, 'Not found', 'Product not found');
  }
  res.json({
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    unitPrice: product.unitPrice,
    availableStock: product.availableStock,
    active: product.active,
    imageUrl: product.imageUrl,
    category: product.category
  });
});

app.post('/api/v1/products', authenticate, requireAdmin, (req, res) => {
  const { sku, name, description, unitPrice, initialStock, category, imageUrl } = req.body || {};

  if (!sku || !/^[A-Z0-9-]{2,64}$/.test(sku)) {
    return problemDetail(res, 400, 'Validation failed', 'sku: must match [A-Z0-9-]{2,64}');
  }
  if (!name || name.length > 120) {
    return problemDetail(res, 400, 'Validation failed', 'name: must not be blank and max 120 chars');
  }
  if (description == null || description.length > 2000) {
    return problemDetail(res, 400, 'Validation failed', 'description: must not be null and max 2000 chars');
  }
  if (unitPrice == null || Number(unitPrice) <= 0) {
    return problemDetail(res, 400, 'Validation failed', 'unitPrice: must be greater than 0');
  }
  if (initialStock == null || initialStock < 0) {
    return problemDetail(res, 400, 'Validation failed', 'initialStock: must be >= 0');
  }

  // Check unique SKU
  const existing = Array.from(products.values()).find(p => p.sku === sku);
  if (existing) {
    return problemDetail(res, 409, 'Conflict', 'SKU already exists');
  }

  const newProduct = {
    id: crypto.randomUUID(),
    sku,
    name,
    description,
    unitPrice: Number(unitPrice),
    availableStock: Number(initialStock),
    active: true,
    category: category || 'General',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80'
  };

  products.set(newProduct.id, newProduct);
  res.status(201).location(`/api/v1/products/${newProduct.id}`).json({
    id: newProduct.id,
    sku: newProduct.sku,
    name: newProduct.name,
    description: newProduct.description,
    unitPrice: newProduct.unitPrice,
    availableStock: newProduct.availableStock,
    active: newProduct.active
  });
});

app.put('/api/v1/products/:id', authenticate, requireAdmin, (req, res) => {
  const product = products.get(req.params.id);
  if (!product) {
    return problemDetail(res, 404, 'Not found', 'Product not found');
  }

  const { name, description, unitPrice, active } = req.body || {};
  if (!name || name.length > 120) {
    return problemDetail(res, 400, 'Validation failed', 'name: must not be blank and max 120 chars');
  }
  if (description == null || description.length > 2000) {
    return problemDetail(res, 400, 'Validation failed', 'description: must not be null and max 2000 chars');
  }
  if (unitPrice == null || Number(unitPrice) <= 0) {
    return problemDetail(res, 400, 'Validation failed', 'unitPrice: must be greater than 0');
  }
  if (typeof active !== 'boolean') {
    return problemDetail(res, 400, 'Validation failed', 'active: must be a boolean');
  }

  product.name = name;
  product.description = description;
  product.unitPrice = Number(unitPrice);
  product.active = active;

  res.json({
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    unitPrice: product.unitPrice,
    availableStock: product.availableStock,
    active: product.active
  });
});

app.post('/api/v1/products/:id/stock-adjustments', authenticate, requireAdmin, (req, res) => {
  const product = products.get(req.params.id);
  if (!product) {
    return problemDetail(res, 404, 'Not found', 'Product not found');
  }

  const { delta } = req.body || {};
  if (delta == null || delta === 0) {
    return problemDetail(res, 400, 'Invalid request', 'Stock adjustment cannot be zero');
  }

  const newStock = product.availableStock + delta;
  if (newStock < 0) {
    return problemDetail(res, 409, 'Conflict', 'Insufficient stock for deduction');
  }

  product.availableStock = newStock;
  res.json({
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    unitPrice: product.unitPrice,
    availableStock: product.availableStock,
    active: product.active
  });
});

// ================= ORDER CONTROLLER =================
app.post('/api/v1/orders', authenticate, (req, res) => {
  const customerId = req.user.sub;
  const { items } = req.body || {};

  if (!items || !Array.isArray(items) || items.length === 0 || items.length > 30) {
    return problemDetail(res, 400, 'Validation failed', 'items: must not be empty and at most 30 items');
  }

  const seenIds = new Set();
  for (const item of items) {
    if (!item.productId || item.quantity < 1 || item.quantity > 10000) {
      return problemDetail(res, 400, 'Validation failed', 'Invalid item productId or quantity (1-10000)');
    }
    if (seenIds.has(item.productId)) {
      return problemDetail(res, 400, 'Invalid request', 'Duplicate product in order');
    }
    seenIds.add(item.productId);
  }

  // Validate stock and deduct
  const orderLines = [];
  let totalAmount = 0;

  for (const item of items) {
    const product = products.get(item.productId);
    if (!product) {
      return problemDetail(res, 404, 'Not found', `Product not found: ${item.productId}`);
    }
    if (!product.active) {
      return problemDetail(res, 409, 'Conflict', `Product is not available: ${product.sku}`);
    }
    if (product.availableStock < item.quantity) {
      return problemDetail(res, 409, 'Conflict', `Insufficient stock for product: ${product.name} (Available: ${product.availableStock})`);
    }

    product.availableStock -= item.quantity;
    const lineTotal = Number((product.unitPrice * item.quantity).toFixed(2));
    totalAmount += lineTotal;

    orderLines.push({
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.unitPrice,
      lineTotal
    });
  }

  const orderId = crypto.randomUUID();
  const order = {
    id: orderId,
    customerId,
    status: 'PENDING_PAYMENT',
    totalAmount: Number(totalAmount.toFixed(2)),
    createdAt: new Date().toISOString(),
    items: orderLines
  };

  orders.set(orderId, order);
  res.status(201).location(`/api/v1/orders/${orderId}`).json(order);
});

app.get('/api/v1/orders', authenticate, (req, res) => {
  const customerId = req.user.sub;
  const page = parseInt(req.query.page || '0', 10);
  const size = parseInt(req.query.size || '20', 10);

  const customerOrders = Array.from(orders.values())
    .filter(o => o.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalElements = customerOrders.length;
  const totalPages = Math.ceil(totalElements / size) || 1;
  const start = page * size;
  const content = customerOrders.slice(start, start + size);

  res.json({
    content,
    pageable: { pageNumber: page, pageSize: size },
    totalElements,
    totalPages,
    last: page >= totalPages - 1,
    first: page === 0,
    size,
    number: page,
    empty: content.length === 0
  });
});

app.get('/api/v1/orders/:id', authenticate, (req, res) => {
  const order = orders.get(req.params.id);
  if (!order || order.customerId !== req.user.sub) {
    return problemDetail(res, 404, 'Not found', 'Order not found');
  }
  res.json(order);
});

app.post('/api/v1/orders/:id/cancel', authenticate, (req, res) => {
  const order = orders.get(req.params.id);
  if (!order || order.customerId !== req.user.sub) {
    return problemDetail(res, 404, 'Not found', 'Order not found');
  }

  if (order.status !== 'PENDING_PAYMENT') {
    return problemDetail(res, 409, 'Conflict', 'Only PENDING_PAYMENT orders can change status');
  }

  // Restore inventory
  for (const line of order.items) {
    const product = products.get(line.productId);
    if (product) {
      product.availableStock += line.quantity;
    }
  }

  order.status = 'CANCELLED';
  res.json(order);
});

app.post('/api/v1/orders/:id/payments', authenticate, (req, res) => {
  const order = orders.get(req.params.id);
  if (!order || order.customerId !== req.user.sub) {
    return problemDetail(res, 404, 'Not found', 'Order not found');
  }

  if (order.status !== 'PENDING_PAYMENT') {
    return problemDetail(res, 409, 'Conflict', 'Only PENDING_PAYMENT orders can change status');
  }

  const { successful } = req.body || {};
  if (successful == null) {
    return problemDetail(res, 400, 'Validation failed', 'successful: must not be null');
  }

  if (successful) {
    order.status = 'PAID';
  } else {
    // Restore inventory on payment failure
    for (const line of order.items) {
      const product = products.get(line.productId);
      if (product) {
        product.availableStock += line.quantity;
      }
    }
    order.status = 'PAYMENT_FAILED';
  }

  res.json(order);
});

app.get('/api/v1/admin/orders', authenticate, requireAdmin, (req, res) => {
  const page = parseInt(req.query.page || '0', 10);
  const size = parseInt(req.query.size || '20', 10);

  const allOrders = Array.from(orders.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalElements = allOrders.length;
  const totalPages = Math.ceil(totalElements / size) || 1;
  const start = page * size;
  const content = allOrders.slice(start, start + size);

  res.json({
    content,
    pageable: { pageNumber: page, pageSize: size },
    totalElements,
    totalPages,
    last: page >= totalPages - 1,
    first: page === 0,
    size,
    number: page,
    empty: content.length === 0
  });
});

// Actuator and monitoring stubs for portfolio parity
app.get('/actuator/health', (req, res) => {
  res.json({
    status: 'UP',
    components: {
      db: { status: 'UP', details: { database: 'PostgreSQL', validationQuery: 'isValid()' } },
      diskSpace: { status: 'UP', details: { total: 499963174912, free: 320145281024, threshold: 10485760 } },
      ping: { status: 'UP' }
    }
  });
});

app.get('/actuator/prometheus', (req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(`# HELP store_orders_created_total Orders placed
# TYPE store_orders_created_total counter
store_orders_created_total ${orders.size}
# HELP store_inventory_adjustments_total Stock adjustments count
# TYPE store_inventory_adjustments_total counter
store_inventory_adjustments_total 8
`);
});

// Serve frontend static files
const staticPath = path.join(__dirname, 'src/main/resources/static');
app.use(express.static(staticPath));

// Fallback to index.html for SPA client navigation
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return problemDetail(res, 404, 'Not found', 'API endpoint does not exist');
  }
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NEXORA E-Commerce server running on http://0.0.0.0:${PORT}`);
  console.log(`Serving static resources from: ${staticPath}`);
});
