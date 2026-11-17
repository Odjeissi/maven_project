/**
 * NEXORA Storefront Application Logic
 * Pure Vanilla JavaScript (ES6+) for Java 21 Spring Boot Monolith
 */

(function () {
  'use strict';

  // ================= STATE =================
  const state = {
    currentUser: null, // { id, email, role, token }
    products: [],
    categories: ['ALL', 'Audio', 'Displays', 'Peripherals', 'Accessories', 'Lifestyle'],
    activeCategory: 'ALL',
    searchQuery: '',
    sortOption: 'name-asc',
    inStockOnly: false,
    cart: [], // [{ product, quantity }]
    orders: [],
    activeOrdersFilter: 'ALL',
    adminOrders: [],
    currentOrderInPayment: null,
    selectedProductForDetail: null
  };

  // Curated fallback image map by SKU prefix / name
  const categoryImageMap = {
    'Audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    'Displays': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    'Peripherals': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    'Accessories': 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    'Lifestyle': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
    'General': 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80'
  };

  // ================= DOM ELEMENTS =================
  const el = {
    // Nav & Header
    mainHeader: document.getElementById('mainHeader'),
    brandLogoHome: document.getElementById('brandLogoHome'),
    navLinks: document.querySelectorAll('.nav-link'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    navOrdersBtn: document.getElementById('navOrdersBtn'),
    userMenuBtn: document.getElementById('userMenuBtn'),
    userBtnLabel: document.getElementById('userBtnLabel'),
    userDropdown: document.getElementById('userDropdown'),
    dropdownUserEmail: document.getElementById('dropdownUserEmail'),
    dropdownUserRole: document.getElementById('dropdownUserRole'),
    dropdownOrdersBtn: document.getElementById('dropdownOrdersBtn'),
    dropdownAdminBtn: document.getElementById('dropdownAdminBtn'),
    dropdownLogoutBtn: document.getElementById('dropdownLogoutBtn'),
    openCartBtn: document.getElementById('openCartBtn'),
    cartBadgeCount: document.getElementById('cartBadgeCount'),
    cartHeaderTotal: document.getElementById('cartHeaderTotal'),
    openDevOpsModalBtn: document.getElementById('openDevOpsModalBtn'),
    footerDevOpsLink: document.getElementById('footerDevOpsLink'),

    // Views
    storefrontView: document.getElementById('storefrontView'),
    ordersView: document.getElementById('ordersView'),
    adminView: document.getElementById('adminView'),

    // Catalog
    categoryPillsContainer: document.getElementById('categoryPillsContainer'),
    sortSelect: document.getElementById('sortSelect'),
    inStockOnlyCheckbox: document.getElementById('inStockOnlyCheckbox'),
    resultsCountLabel: document.getElementById('resultsCountLabel'),
    productGrid: document.getElementById('productGrid'),
    emptyCatalogState: document.getElementById('emptyCatalogState'),
    resetCatalogFiltersBtn: document.getElementById('resetCatalogFiltersBtn'),
    emptyDbNotice: document.getElementById('emptyDbNotice'),
    seedDemoDataBtn: document.getElementById('seedDemoDataBtn'),
    heroAdminBtn: document.getElementById('heroAdminBtn'),
    heroQuickBuyBtn: document.getElementById('heroQuickBuyBtn'),

    // Cart Drawer
    cartDrawerBackdrop: document.getElementById('cartDrawerBackdrop'),
    closeCartDrawerBtn: document.getElementById('closeCartDrawerBtn'),
    cartDrawerItemCount: document.getElementById('cartDrawerItemCount'),
    cartItemsContainer: document.getElementById('cartItemsContainer'),
    cartDrawerSubtotal: document.getElementById('cartDrawerSubtotal'),
    cartDrawerTotal: document.getElementById('cartDrawerTotal'),
    proceedToCheckoutBtn: document.getElementById('proceedToCheckoutBtn'),
    continueShoppingBtn: document.getElementById('continueShoppingBtn'),

    // Product Detail Modal
    productDetailModal: document.getElementById('productDetailModal'),
    closeProductDetailModalBtn: document.getElementById('closeProductDetailModalBtn'),
    productDetailContent: document.getElementById('productDetailContent'),

    // Checkout Modal
    checkoutModal: document.getElementById('checkoutModal'),
    closeCheckoutModalBtn: document.getElementById('closeCheckoutModalBtn'),
    cancelCheckoutBtn: document.getElementById('cancelCheckoutBtn'),
    checkoutFormStep: document.getElementById('checkoutFormStep'),
    checkoutPaymentStep: document.getElementById('checkoutPaymentStep'),
    checkoutSuccessStep: document.getElementById('checkoutSuccessStep'),
    checkoutReviewItems: document.getElementById('checkoutReviewItems'),
    checkoutShippingForm: document.getElementById('checkoutShippingForm'),
    shipEmail: document.getElementById('shipEmail'),
    checkoutModalTotal: document.getElementById('checkoutModalTotal'),
    placeOrderSubmitBtn: document.getElementById('placeOrderSubmitBtn'),
    createdOrderId: document.getElementById('createdOrderId'),
    createdOrderAmount: document.getElementById('createdOrderAmount'),
    simPaymentSuccessBtn: document.getElementById('simPaymentSuccessBtn'),
    simPaymentFailBtn: document.getElementById('simPaymentFailBtn'),
    confirmedOrderId: document.getElementById('confirmedOrderId'),
    confirmedOrderStatus: document.getElementById('confirmedOrderStatus'),
    confirmContinueShoppingBtn: document.getElementById('confirmContinueShoppingBtn'),
    confirmViewOrdersBtn: document.getElementById('confirmViewOrdersBtn'),

    // Auth Modal
    authModal: document.getElementById('authModal'),
    closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
    tabSignIn: document.getElementById('tabSignIn'),
    tabRegister: document.getElementById('tabRegister'),
    authErrorAlert: document.getElementById('authErrorAlert'),
    demoCustomerBtn: document.getElementById('demoCustomerBtn'),
    demoAdminBtn: document.getElementById('demoAdminBtn'),
    signInForm: document.getElementById('signInForm'),
    registerForm: document.getElementById('registerForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    regEmail: document.getElementById('regEmail'),
    regPassword: document.getElementById('regPassword'),

    // Orders View Elements
    ordersBackBtn: document.getElementById('ordersBackBtn'),
    refreshOrdersBtn: document.getElementById('refreshOrdersBtn'),
    ordersListContainer: document.getElementById('ordersListContainer'),
    emptyOrdersState: document.getElementById('emptyOrdersState'),
    ordersShopNowBtn: document.getElementById('ordersShopNowBtn'),
    ordersFilterPills: document.querySelectorAll('.orders-filter-pill'),

    // Admin View Elements
    adminBackBtn: document.getElementById('adminBackBtn'),
    openCreateProductModalBtn: document.getElementById('openCreateProductModalBtn'),
    metricTotalProducts: document.getElementById('metricTotalProducts'),
    metricTotalUnits: document.getElementById('metricTotalUnits'),
    metricLowStockCount: document.getElementById('metricLowStockCount'),
    metricTotalOrders: document.getElementById('metricTotalOrders'),
    adminTabs: document.querySelectorAll('.admin-tab'),
    adminProductsTab: document.getElementById('adminProductsTab'),
    adminOrdersTab: document.getElementById('adminOrdersTab'),
    adminProductsTableBody: document.getElementById('adminProductsTableBody'),
    adminOrdersTableBody: document.getElementById('adminOrdersTableBody'),

    // Admin Modals
    createProductModal: document.getElementById('createProductModal'),
    closeCreateProductModalBtn: document.getElementById('closeCreateProductModalBtn'),
    cancelCreateProductBtn: document.getElementById('cancelCreateProductBtn'),
    createProductForm: document.getElementById('createProductForm'),
    createProductErrorAlert: document.getElementById('createProductErrorAlert'),

    stockAdjustModal: document.getElementById('stockAdjustModal'),
    closeStockAdjustModalBtn: document.getElementById('closeStockAdjustModalBtn'),
    cancelStockAdjustBtn: document.getElementById('cancelStockAdjustBtn'),
    stockAdjustForm: document.getElementById('stockAdjustForm'),
    stockAdjustSubtitle: document.getElementById('stockAdjustSubtitle'),
    stockAdjustCurrentVal: document.getElementById('stockAdjustCurrentVal'),
    stockAdjustProductId: document.getElementById('stockAdjustProductId'),
    stockDeltaInput: document.getElementById('stockDeltaInput'),
    stockAdjustErrorAlert: document.getElementById('stockAdjustErrorAlert'),

    editProductModal: document.getElementById('editProductModal'),
    closeEditProductModalBtn: document.getElementById('closeEditProductModalBtn'),
    cancelEditProductBtn: document.getElementById('cancelEditProductBtn'),
    editProductForm: document.getElementById('editProductForm'),
    editProductId: document.getElementById('editProductId'),
    editProdName: document.getElementById('editProdName'),
    editProdDesc: document.getElementById('editProdDesc'),
    editProdPrice: document.getElementById('editProdPrice'),
    editProdActive: document.getElementById('editProdActive'),
    editProductErrorAlert: document.getElementById('editProductErrorAlert'),

    // DevOps Modal
    devOpsModal: document.getElementById('devOpsModal'),
    closeDevOpsModalBtn: document.getElementById('closeDevOpsModalBtn'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer'),
    newsletterForm: document.getElementById('newsletterForm'),
    newsletterSuccess: document.getElementById('newsletterSuccess')
  };

  // ================= API UTILITIES =================
  async function apiRequest(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (state.currentUser && state.currentUser.token) {
      headers['Authorization'] = `Bearer ${state.currentUser.token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      // Check content-type
      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json') || contentType.includes('application/problem+json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Parse RFC 7807 ProblemDetail or generic error
        const message = (data && (data.detail || data.title || data.message || data.error)) ||
                        `Request failed with status ${response.status}`;
        const err = new Error(message);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  }

  // ================= TOAST SYSTEM =================
  function showToast(message, type = 'info', duration = 3500) {
    if (!el.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '';
    if (type === 'success') {
      icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else if (type === 'warning') {
      icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    } else {
      icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.6rem;">
        ${icon}
        <span>${escapeHtml(message)}</span>
      </div>
    `;

    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatPrice(num) {
    const val = Number(num) || 0;
    return `$${val.toFixed(2)}`;
  }

  function formatDate(isoString) {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  function guessCategory(product) {
    if (product.category) return product.category;
    const text = `${product.name} ${product.description}`.toLowerCase();
    if (text.includes('headphone') || text.includes('audio') || text.includes('sound') || text.includes('pulse')) return 'Audio';
    if (text.includes('display') || text.includes('monitor') || text.includes('screen') || text.includes('lumina')) return 'Displays';
    if (text.includes('keyboard') || text.includes('mouse') || text.includes('keycap') || text.includes('glide')) return 'Peripherals';
    if (text.includes('dock') || text.includes('ssd') || text.includes('thunderbolt') || text.includes('cable')) return 'Accessories';
    return 'Lifestyle';
  }

  function getProductImage(product) {
    if (product.imageUrl) return product.imageUrl;
    const cat = guessCategory(product);
    return categoryImageMap[cat] || categoryImageMap['General'];
  }

  // ================= VIEW SWITCHER =================
  function switchView(viewName) {
    // Hide all views
    el.storefrontView.classList.add('hidden');
    el.ordersView.classList.add('hidden');
    el.adminView.classList.add('hidden');

    // Deselect nav links
    el.navLinks.forEach(l => l.classList.remove('active'));

    if (viewName === 'storefront') {
      el.storefrontView.classList.remove('hidden');
      const allLink = document.querySelector('.nav-link[data-category="ALL"]');
      if (allLink) allLink.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'orders') {
      if (!state.currentUser) {
        openAuthModal('signIn');
        showToast('Please sign in to view your orders', 'info');
        return;
      }
      el.ordersView.classList.remove('hidden');
      loadOrders();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'admin') {
      if (!state.currentUser || state.currentUser.role !== 'ADMIN') {
        showToast('Access restricted to administrators', 'error');
        openAuthModal('signIn');
        return;
      }
      el.adminView.classList.remove('hidden');
      loadAdminDashboard();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ================= AUTHENTICATION =================
  function initAuth() {
    const saved = sessionStorage.getItem('nexora_user');
    if (saved) {
      try {
        state.currentUser = JSON.parse(saved);
        updateUserUI();
      } catch {
        sessionStorage.removeItem('nexora_user');
      }
    }
  }

  function saveAuth(user) {
    state.currentUser = user;
    sessionStorage.setItem('nexora_user', JSON.stringify(user));
    updateUserUI();
  }

  function logout() {
    state.currentUser = null;
    sessionStorage.removeItem('nexora_user');
    updateUserUI();
    showToast('Signed out successfully', 'info');
    el.userDropdown.classList.add('hidden');
    switchView('storefront');
  }

  function updateUserUI() {
    if (state.currentUser) {
      const email = state.currentUser.email;
      const shortEmail = email.length > 14 ? email.split('@')[0] : email;
      el.userBtnLabel.textContent = shortEmail;
      el.dropdownUserEmail.textContent = email;
      el.dropdownUserRole.textContent = state.currentUser.role;
      el.dropdownUserRole.className = state.currentUser.role === 'ADMIN' ? 'role-badge-admin' : 'badge';

      if (state.currentUser.role === 'ADMIN') {
        el.dropdownAdminBtn.classList.remove('hidden');
      } else {
        el.dropdownAdminBtn.classList.add('hidden');
      }
    } else {
      el.userBtnLabel.textContent = 'Sign In';
      el.dropdownUserEmail.textContent = 'Not signed in';
      el.dropdownUserRole.textContent = 'GUEST';
      el.dropdownUserRole.className = 'badge';
      el.dropdownAdminBtn.classList.add('hidden');
    }
  }

  function openAuthModal(tab = 'signIn') {
    el.authErrorAlert.classList.add('hidden');
    el.authModal.classList.remove('hidden');
    if (tab === 'signIn') {
      el.tabSignIn.classList.add('active');
      el.tabRegister.classList.remove('active');
      el.signInForm.classList.remove('hidden');
      el.registerForm.classList.add('hidden');
      el.loginEmail.focus();
    } else {
      el.tabRegister.classList.add('active');
      el.tabSignIn.classList.remove('active');
      el.registerForm.classList.remove('hidden');
      el.signInForm.classList.add('hidden');
      el.regEmail.focus();
    }
  }

  function closeAuthModal() {
    el.authModal.classList.add('hidden');
    el.authErrorAlert.classList.add('hidden');
  }

  async function handleLogin(e) {
    e.preventDefault();
    el.authErrorAlert.classList.add('hidden');
    const email = el.loginEmail.value.trim();
    const password = el.loginPassword.value;

    try {
      const response = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      // Decode JWT token payload
      let role = 'CUSTOMER';
      let id = null;
      try {
        const payloadJson = atob(response.accessToken);
        const payload = JSON.parse(payloadJson);
        id = payload.sub;
        role = payload.role || (payload.roles && payload.roles[0]) || 'CUSTOMER';
      } catch {
        // If not base64 json, check role from known email or payload
        if (email.toLowerCase().includes('admin')) role = 'ADMIN';
      }

      saveAuth({
        id,
        email,
        role,
        token: response.accessToken
      });

      closeAuthModal();
      showToast(`Welcome back, ${email}`, 'success');

      // Refresh catalog or redirect
      if (role === 'ADMIN' && el.storefrontView.classList.contains('hidden') === false) {
        // User is admin, let them know they can access portal
      }
    } catch (err) {
      el.authErrorAlert.textContent = err.message || 'Invalid email or password';
      el.authErrorAlert.classList.remove('hidden');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    el.authErrorAlert.classList.add('hidden');
    const email = el.regEmail.value.trim();
    const password = el.regPassword.value;

    if (password.length < 12 || password.length > 72) {
      el.authErrorAlert.textContent = 'Password must be between 12 and 72 characters.';
      el.authErrorAlert.classList.remove('hidden');
      return;
    }

    try {
      await apiRequest('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      showToast('Account created successfully! Logging you in...', 'success');

      // Auto login
      const loginResp = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      let id = null;
      try {
        const payload = JSON.parse(atob(loginResp.accessToken));
        id = payload.sub;
      } catch { /* ignore */ }

      saveAuth({
        id,
        email,
        role: 'CUSTOMER',
        token: loginResp.accessToken
      });

      closeAuthModal();
    } catch (err) {
      el.authErrorAlert.textContent = err.message || 'Registration failed';
      el.authErrorAlert.classList.remove('hidden');
    }
  }

  // ================= CATALOG & PRODUCTS =================
  async function loadProducts() {
    renderCatalogSkeletons();

    try {
      const data = await apiRequest('/api/v1/products?page=0&size=50');
      state.products = (data && data.content) || (Array.isArray(data) ? data : []);

      if (state.products.length === 0) {
        el.emptyDbNotice.style.display = 'flex';
      } else {
        el.emptyDbNotice.style.display = 'none';
      }

      renderCatalog();
    } catch (err) {
      console.warn('Failed to load products from API:', err);
      el.resultsCountLabel.textContent = 'Error connecting to Spring Boot API';
      el.productGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2rem; background: #fff; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); text-align: center;">
          <h4 style="color: var(--color-rose); margin-bottom: 0.5rem;">Could not load products from API</h4>
          <p style="font-size: 0.88rem; color: var(--color-muted);">${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }

  function renderCatalogSkeletons() {
    el.productGrid.innerHTML = Array(6).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton-box" style="height: 190px;"></div>
        <div style="padding: 1.25rem;">
          <div class="skeleton-box" style="height: 14px; width: 35%; margin-bottom: 0.5rem; border-radius: 4px;"></div>
          <div class="skeleton-box" style="height: 20px; width: 85%; margin-bottom: 0.75rem; border-radius: 4px;"></div>
          <div class="skeleton-box" style="height: 14px; width: 95%; margin-bottom: 0.35rem; border-radius: 4px;"></div>
          <div class="skeleton-box" style="height: 14px; width: 70%; margin-bottom: 1.25rem; border-radius: 4px;"></div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 0.75rem;">
            <div class="skeleton-box" style="height: 22px; width: 30%; border-radius: 4px;"></div>
            <div class="skeleton-box" style="height: 36px; width: 36px; border-radius: 8px;"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function getFilteredProducts() {
    let list = [...state.products];

    // Category filter
    if (state.activeCategory && state.activeCategory !== 'ALL') {
      list = list.filter(p => guessCategory(p) === state.activeCategory);
    }

    // In stock filter
    if (state.inStockOnly) {
      list = list.filter(p => p.availableStock > 0);
    }

    // Search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    switch (state.sortOption) {
      case 'name-asc':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        list.sort((a, b) => a.unitPrice - b.unitPrice);
        break;
      case 'price-desc':
        list.sort((a, b) => b.unitPrice - a.unitPrice);
        break;
      case 'stock-desc':
        list.sort((a, b) => b.availableStock - a.availableStock);
        break;
      default:
        break;
    }

    return list;
  }

  function renderCatalog() {
    const items = getFilteredProducts();

    if (items.length === 0) {
      el.productGrid.innerHTML = '';
      el.emptyCatalogState.classList.remove('hidden');
      el.resultsCountLabel.textContent = `0 products found`;
      return;
    }

    el.emptyCatalogState.classList.add('hidden');
    el.resultsCountLabel.textContent = `Showing ${items.length} ${items.length === 1 ? 'product' : 'products'}`;

    el.productGrid.innerHTML = items.map(product => {
      const imgUrl = getProductImage(product);
      const category = guessCategory(product);
      const isOutOfStock = product.availableStock <= 0;
      const isLowStock = product.availableStock > 0 && product.availableStock <= 5;

      let stockTag = '';
      let stockStatusText = '';

      if (isOutOfStock) {
        stockTag = `<span class="product-stock-tag tag-out-of-stock">Sold Out</span>`;
        stockStatusText = `<span class="product-stock-status text-danger">Out of stock</span>`;
      } else if (isLowStock) {
        stockTag = `<span class="product-stock-tag tag-low-stock">Only ${product.availableStock} left!</span>`;
        stockStatusText = `<span class="product-stock-status text-amber">${product.availableStock} remaining</span>`;
      } else {
        stockStatusText = `<span class="product-stock-status text-emerald">${product.availableStock} in stock</span>`;
      }

      return `
        <article class="product-card" data-id="${product.id}">
          <div class="product-image-box" onclick="window.nexoraApp.openProductDetail('${product.id}')">
            <img src="${imgUrl}" alt="${escapeHtml(product.name)}" class="product-thumb" loading="lazy">
            <div class="product-badge-overlay">
              <span class="product-category-tag">${escapeHtml(category)}</span>
              ${stockTag}
            </div>
          </div>
          <div class="product-card-body" onclick="window.nexoraApp.openProductDetail('${product.id}')">
            <span class="product-sku">SKU: ${escapeHtml(product.sku)}</span>
            <h3 class="product-title">${escapeHtml(product.name)}</h3>
            <p class="product-desc">${escapeHtml(product.description)}</p>
            <div class="product-card-footer" onclick="event.stopPropagation()">
              <div class="product-price-box">
                <span class="product-price">${formatPrice(product.unitPrice)}</span>
                ${stockStatusText}
              </div>
              <button type="button" class="quick-add-btn" 
                      data-id="${product.id}" 
                      ${isOutOfStock ? 'disabled title="Out of stock"' : 'title="Add to cart"'}
                      onclick="window.nexoraApp.addToCart('${product.id}', 1)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // ================= PRODUCT DETAIL MODAL =================
  function openProductDetail(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    state.selectedProductForDetail = product;
    const imgUrl = getProductImage(product);
    const category = guessCategory(product);
    const isOutOfStock = product.availableStock <= 0;
    const isLowStock = product.availableStock > 0 && product.availableStock <= 5;

    let stockBadge = '';
    if (isOutOfStock) {
      stockBadge = `<span class="badge badge-failed">OUT OF STOCK</span>`;
    } else if (isLowStock) {
      stockBadge = `<span class="badge badge-pending">LOW STOCK: ONLY ${product.availableStock} LEFT</span>`;
    } else {
      stockBadge = `<span class="badge badge-paid">${product.availableStock} IN STOCK</span>`;
    }

    el.productDetailContent.innerHTML = `
      <div class="product-detail-media">
        <img src="${imgUrl}" alt="${escapeHtml(product.name)}" class="product-detail-img">
      </div>
      <div class="product-detail-info">
        <div class="flex items-center gap-2 mb-2">
          <span class="product-category-tag">${escapeHtml(category)}</span>
          ${stockBadge}
        </div>
        <h2 class="modal-title" style="font-size: 1.75rem; margin-bottom: 0.35rem;">${escapeHtml(product.name)}</h2>
        <span class="product-sku mb-3">SKU: ${escapeHtml(product.sku)}</span>

        <div style="font-size: 1.75rem; font-weight: 800; color: var(--color-charcoal-900); margin: 0.5rem 0 1rem;">
          ${formatPrice(product.unitPrice)}
        </div>

        <p style="font-size: 0.95rem; color: var(--color-charcoal-700); line-height: 1.6; margin-bottom: 1.25rem;">
          ${escapeHtml(product.description)}
        </p>

        <ul class="detail-specs-list">
          <li><strong>Architecture:</strong> Monolithic Spring Boot 3 + JPA / Flyway Schema</li>
          <li><strong>Inventory Lock:</strong> PostgreSQL SELECT ... FOR UPDATE ACID protection</li>
          <li><strong>Delivery:</strong> Express carbon-neutral air freight included</li>
          <li><strong>Warranty:</strong> 24-Month manufacturer warranty and 30-day trial</li>
        </ul>

        <div style="margin-top: auto; padding-top: 1.5rem; border-top: 1px solid var(--color-border);">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div class="qty-control" style="height: 44px; padding: 0 0.5rem;">
              <button type="button" class="qty-btn" style="width: 32px; height: 32px;" onclick="window.nexoraApp.adjustDetailModalQty(-1)">-</button>
              <span id="detailModalQty" class="qty-val" style="min-width: 36px; font-size: 1rem;">1</span>
              <button type="button" class="qty-btn" style="width: 32px; height: 32px;" onclick="window.nexoraApp.adjustDetailModalQty(1)">+</button>
            </div>
            <button type="button" class="btn btn-primary btn-lg flex-1" 
                    ${isOutOfStock ? 'disabled' : ''}
                    onclick="window.nexoraApp.addDetailModalToCart()">
              ${isOutOfStock ? 'Currently Unavailable' : 'Add to Shopping Cart'}
            </button>
          </div>
        </div>
      </div>
    `;

    el.productDetailModal.classList.remove('hidden');
  }

  function adjustDetailModalQty(delta) {
    const qtyElem = document.getElementById('detailModalQty');
    if (!qtyElem || !state.selectedProductForDetail) return;

    let current = parseInt(qtyElem.textContent, 10) || 1;
    let next = current + delta;
    const max = state.selectedProductForDetail.availableStock;

    if (next < 1) next = 1;
    if (next > max) {
      next = max;
      showToast(`Only ${max} units available in stock`, 'warning');
    }

    qtyElem.textContent = next;
  }

  function addDetailModalToCart() {
    if (!state.selectedProductForDetail) return;
    const qtyElem = document.getElementById('detailModalQty');
    const qty = parseInt(qtyElem?.textContent || '1', 10);
    addToCart(state.selectedProductForDetail.id, qty);
    el.productDetailModal.classList.add('hidden');
  }

  // ================= SHOPPING CART =================
  function initCart() {
    const saved = localStorage.getItem('nexora_cart');
    if (saved) {
      try {
        state.cart = JSON.parse(saved);
      } catch {
        state.cart = [];
      }
    }
    updateCartUI();
  }

  function saveCart() {
    localStorage.setItem('nexora_cart', JSON.stringify(state.cart));
    updateCartUI();
  }

  function addToCart(productId, quantity = 1) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    if (product.availableStock <= 0) {
      showToast('This product is currently out of stock', 'warning');
      return;
    }

    const existingIndex = state.cart.findIndex(i => i.product.id === productId);
    let newQuantity = quantity;

    if (existingIndex > -1) {
      newQuantity = state.cart[existingIndex].quantity + quantity;
      if (newQuantity > product.availableStock) {
        newQuantity = product.availableStock;
        showToast(`Cart adjusted to maximum available stock (${product.availableStock})`, 'warning');
      } else {
        showToast(`Updated "${product.name}" in cart`, 'success');
      }
      state.cart[existingIndex].quantity = newQuantity;
    } else {
      if (newQuantity > product.availableStock) {
        newQuantity = product.availableStock;
      }
      state.cart.push({
        product: { ...product },
        quantity: newQuantity
      });
      showToast(`Added "${product.name}" to cart`, 'success');
    }

    saveCart();
    openCartDrawer();
  }

  function updateCartItemQuantity(productId, delta) {
    const item = state.cart.find(i => i.product.id === productId);
    if (!item) return;

    // Check with live product in catalog for available stock
    const catalogProduct = state.products.find(p => p.id === productId) || item.product;
    const maxStock = catalogProduct.availableStock;

    const nextQty = item.quantity + delta;
    if (nextQty <= 0) {
      state.cart = state.cart.filter(i => i.product.id !== productId);
      showToast(`Removed "${item.product.name}" from cart`, 'info');
    } else if (nextQty > maxStock) {
      showToast(`Cannot exceed available inventory (${maxStock} units)`, 'warning');
      return;
    } else {
      item.quantity = nextQty;
    }

    saveCart();
  }

  function removeFromCart(productId) {
    const item = state.cart.find(i => i.product.id === productId);
    state.cart = state.cart.filter(i => i.product.id !== productId);
    if (item) showToast(`Removed "${item.product.name}"`, 'info');
    saveCart();
  }

  function getCartTotals() {
    let subtotal = 0;
    let count = 0;

    for (const item of state.cart) {
      subtotal += item.product.unitPrice * item.quantity;
      count += item.quantity;
    }

    return {
      subtotal: Number(subtotal.toFixed(2)),
      total: Number(subtotal.toFixed(2)),
      count
    };
  }

  function updateCartUI() {
    const { subtotal, total, count } = getCartTotals();

    // Badges & Labels
    el.cartBadgeCount.textContent = count;
    el.cartHeaderTotal.textContent = formatPrice(total);
    el.cartDrawerItemCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
    el.cartDrawerSubtotal.textContent = formatPrice(subtotal);
    el.cartDrawerTotal.textContent = formatPrice(total);

    // Render Items inside Drawer
    if (state.cart.length === 0) {
      el.cartItemsContainer.innerHTML = `
        <div style="text-align: center; padding: 4rem 1rem;">
          <div style="color: var(--color-subtle); margin-bottom: 1rem;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </div>
          <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--color-charcoal-900); margin-bottom: 0.35rem;">Your cart is empty</h4>
          <p style="font-size: 0.85rem; color: var(--color-muted); margin-bottom: 1.5rem;">Explore our curated selection of high-performance workspace hardware.</p>
          <button type="button" class="btn btn-secondary" onclick="window.nexoraApp.closeCartDrawer()">Start Shopping</button>
        </div>
      `;
      el.proceedToCheckoutBtn.disabled = true;
    } else {
      el.proceedToCheckoutBtn.disabled = false;
      el.cartItemsContainer.innerHTML = state.cart.map(item => {
        const imgUrl = getProductImage(item.product);
        const lineTotal = item.product.unitPrice * item.quantity;

        return `
          <div class="cart-item">
            <img src="${imgUrl}" alt="${escapeHtml(item.product.name)}" class="cart-item-img">
            <div class="cart-item-details">
              <span class="cart-item-sku">SKU: ${escapeHtml(item.product.sku)}</span>
              <h4 class="cart-item-title">${escapeHtml(item.product.name)}</h4>
              <span class="cart-item-price">${formatPrice(item.product.unitPrice)} each</span>
              <div class="cart-item-controls">
                <div class="qty-control">
                  <button type="button" class="qty-btn" onclick="window.nexoraApp.updateCartItemQuantity('${item.product.id}', -1)">-</button>
                  <span class="qty-val">${item.quantity}</span>
                  <button type="button" class="qty-btn" onclick="window.nexoraApp.updateCartItemQuantity('${item.product.id}', 1)">+</button>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="font-size: 0.95rem; font-weight: 700; color: var(--color-charcoal-900);">${formatPrice(lineTotal)}</span>
                  <button type="button" style="color: var(--color-subtle); hover:color-rose;" title="Remove item" onclick="window.nexoraApp.removeFromCart('${item.product.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function openCartDrawer() {
    updateCartUI();
    el.cartDrawerBackdrop.classList.remove('hidden');
  }

  function closeCartDrawer() {
    el.cartDrawerBackdrop.classList.add('hidden');
  }

  // ================= CHECKOUT FLOW =================
  function startCheckout() {
    closeCartDrawer();

    if (!state.currentUser) {
      showToast('Please sign in or create an account to proceed with checkout', 'info');
      openAuthModal('signIn');
      return;
    }

    if (state.cart.length === 0) {
      showToast('Your cart is empty', 'warning');
      return;
    }

    // Prepare Checkout modal
    const { total } = getCartTotals();
    el.shipEmail.value = state.currentUser.email;
    el.checkoutModalTotal.textContent = formatPrice(total);

    // Render review items
    el.checkoutReviewItems.innerHTML = state.cart.map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; padding: 0.4rem 0; border-bottom: 1px solid var(--color-border);">
        <div>
          <strong>${escapeHtml(item.product.name)}</strong>
          <span style="color: var(--color-muted); font-size: 0.75rem;">(Qty: ${item.quantity} × ${formatPrice(item.product.unitPrice)})</span>
        </div>
        <span style="font-weight: 700;">${formatPrice(item.product.unitPrice * item.quantity)}</span>
      </div>
    `).join('');

    // Show Step 1
    el.checkoutFormStep.classList.remove('hidden');
    el.checkoutPaymentStep.classList.add('hidden');
    el.checkoutSuccessStep.classList.add('hidden');
    el.checkoutModal.classList.remove('hidden');
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    const submitBtn = el.placeOrderSubmitBtn;
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.btn-spinner');

    btnText.textContent = 'Allocating stock...';
    submitBtn.disabled = true;

    // Build payload matching Spring Boot OrderDtos.Create:
    // { items: [{ productId: UUID, quantity: int }] }
    const payload = {
      items: state.cart.map(i => ({
        productId: i.product.id,
        quantity: i.quantity
      }))
    };

    try {
      const order = await apiRequest('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      state.currentOrderInPayment = order;

      // Clear local cart now that stock is locked and order created
      state.cart = [];
      saveCart();

      // Refresh product stock in memory
      loadProducts();

      // Show Payment Step
      el.createdOrderId.textContent = order.id;
      el.createdOrderAmount.textContent = formatPrice(order.totalAmount);
      el.checkoutFormStep.classList.add('hidden');
      el.checkoutPaymentStep.classList.remove('hidden');

      showToast('Order created with status PENDING_PAYMENT', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to place order', 'error');
    } finally {
      btnText.textContent = 'Confirm & Place Order';
      submitBtn.disabled = false;
    }
  }

  async function handleSimulatePayment(successful) {
    if (!state.currentOrderInPayment) return;
    const orderId = state.currentOrderInPayment.id;

    try {
      const updatedOrder = await apiRequest(`/api/v1/orders/${orderId}/payments`, {
        method: 'POST',
        body: JSON.stringify({ successful: !!successful })
      });

      if (successful) {
        el.confirmedOrderId.textContent = updatedOrder.id;
        el.confirmedOrderStatus.textContent = 'PAID';
        el.confirmedOrderStatus.className = 'badge badge-paid';

        el.checkoutPaymentStep.classList.add('hidden');
        el.checkoutSuccessStep.classList.remove('hidden');
        showToast('Payment successful! Order confirmed.', 'success');
      } else {
        showToast('Payment simulated as FAILED. Stock restored to inventory.', 'warning');
        el.checkoutModal.classList.add('hidden');
        loadProducts();
        switchView('orders');
      }
    } catch (err) {
      showToast(err.message || 'Payment simulation failed', 'error');
    }
  }

  // ================= MY ORDERS VIEW =================
  async function loadOrders() {
    if (!state.currentUser) return;

    el.ordersListContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--color-muted);">Loading your order history...</div>';

    try {
      const data = await apiRequest('/api/v1/orders?page=0&size=50');
      state.orders = (data && data.content) || (Array.isArray(data) ? data : []);
      renderOrdersList();
    } catch (err) {
      showToast('Could not load orders: ' + err.message, 'error');
      el.ordersListContainer.innerHTML = '';
      el.emptyOrdersState.classList.remove('hidden');
    }
  }

  function renderOrdersList() {
    let list = [...state.orders];
    if (state.activeOrdersFilter !== 'ALL') {
      list = list.filter(o => o.status === state.activeOrdersFilter);
    }

    if (list.length === 0) {
      el.ordersListContainer.innerHTML = '';
      el.emptyOrdersState.classList.remove('hidden');
      return;
    }

    el.emptyOrdersState.classList.add('hidden');
    el.ordersListContainer.innerHTML = list.map(order => {
      let statusBadge = '';
      let actionButtons = '';

      if (order.status === 'PAID') {
        statusBadge = `<span class="badge badge-paid">PAID</span>`;
      } else if (order.status === 'PENDING_PAYMENT') {
        statusBadge = `<span class="badge badge-pending">PENDING PAYMENT</span>`;
        actionButtons = `
          <button type="button" class="btn btn-emerald btn-sm" onclick="window.nexoraApp.openOrderPaymentPrompt('${order.id}', ${order.totalAmount})">
            Pay Now (Simulate)
          </button>
          <button type="button" class="btn btn-danger-soft btn-sm" onclick="window.nexoraApp.cancelOrder('${order.id}')">
            Cancel Order
          </button>
        `;
      } else if (order.status === 'CANCELLED') {
        statusBadge = `<span class="badge badge-cancelled">CANCELLED</span>`;
      } else if (order.status === 'PAYMENT_FAILED') {
        statusBadge = `<span class="badge badge-failed">PAYMENT FAILED</span>`;
      }

      const itemsHtml = (order.items || []).map(line => `
        <tr>
          <td>
            <strong>${escapeHtml(line.productName)}</strong>
            <span style="display: block; font-family: var(--font-mono); font-size: 0.72rem; color: var(--color-muted);">SKU: ${escapeHtml(line.sku)}</span>
          </td>
          <td>${formatPrice(line.unitPrice)}</td>
          <td>${line.quantity}</td>
          <td class="text-right"><strong>${formatPrice(line.lineTotal)}</strong></td>
        </tr>
      `).join('');

      return `
        <div class="order-card">
          <div class="order-card-header">
            <div class="order-meta-group">
              <div class="order-meta-item">
                <span class="order-meta-label">Order Number</span>
                <span class="order-meta-val font-mono">${escapeHtml(order.id.slice(0, 18))}...</span>
              </div>
              <div class="order-meta-item">
                <span class="order-meta-label">Date Placed</span>
                <span class="order-meta-val">${formatDate(order.createdAt)}</span>
              </div>
              <div class="order-meta-item">
                <span class="order-meta-label">Order Total</span>
                <span class="order-meta-val text-brand">${formatPrice(order.totalAmount)}</span>
              </div>
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>
          <div class="order-card-body">
            <table class="order-items-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th class="text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
          ${actionButtons ? `<div class="order-card-actions">${actionButtons}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this pending order? Reserved stock will be returned to inventory.')) return;

    try {
      await apiRequest(`/api/v1/orders/${orderId}/cancel`, { method: 'POST' });
      showToast('Order successfully cancelled. Stock restored.', 'info');
      loadOrders();
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'error');
    }
  }

  function openOrderPaymentPrompt(orderId, totalAmount) {
    state.currentOrderInPayment = { id: orderId, totalAmount };
    el.createdOrderId.textContent = orderId;
    el.createdOrderAmount.textContent = formatPrice(totalAmount);

    el.checkoutFormStep.classList.add('hidden');
    el.checkoutSuccessStep.classList.add('hidden');
    el.checkoutPaymentStep.classList.remove('hidden');
    el.checkoutModal.classList.remove('hidden');
  }

  // ================= ADMIN DASHBOARD =================
  async function loadAdminDashboard() {
    if (!state.currentUser || state.currentUser.role !== 'ADMIN') return;

    try {
      // 1. Load fresh products
      const prodData = await apiRequest('/api/v1/products?page=0&size=100');
      const prodList = (prodData && prodData.content) || (Array.isArray(prodData) ? prodData : []);

      // 2. Load all system orders
      const orderData = await apiRequest('/api/v1/admin/orders?page=0&size=100');
      state.adminOrders = (orderData && orderData.content) || (Array.isArray(orderData) ? orderData : []);

      // Calculate metrics
      const totalUnits = prodList.reduce((acc, p) => acc + (p.availableStock || 0), 0);
      const lowStockCount = prodList.filter(p => p.availableStock <= 5).length;

      el.metricTotalProducts.textContent = prodList.length;
      el.metricTotalUnits.textContent = totalUnits;
      el.metricLowStockCount.textContent = lowStockCount;
      el.metricTotalOrders.textContent = state.adminOrders.length;

      // Render Products Table
      renderAdminProductsTable(prodList);
      renderAdminOrdersTable(state.adminOrders);
    } catch (err) {
      showToast('Failed to load admin telemetry: ' + err.message, 'error');
    }
  }

  function renderAdminProductsTable(prodList) {
    el.adminProductsTableBody.innerHTML = prodList.map(p => {
      const isLow = p.availableStock <= 5;
      const stockBadge = isLow 
        ? `<span class="badge badge-pending">${p.availableStock} (Low Stock)</span>` 
        : `<span class="badge badge-paid">${p.availableStock} in stock</span>`;

      return `
        <tr>
          <td>
            <strong>${escapeHtml(p.name)}</strong>
            <span style="display: block; font-size: 0.75rem; color: var(--color-muted);">${escapeHtml(guessCategory(p))}</span>
          </td>
          <td><code class="font-mono text-xs">${escapeHtml(p.sku)}</code></td>
          <td>${formatPrice(p.unitPrice)}</td>
          <td>${stockBadge}</td>
          <td>
            <span class="badge ${p.active ? 'badge-paid' : 'badge-failed'}">
              ${p.active ? 'Active' : 'Disabled'}
            </span>
          </td>
          <td class="text-right">
            <div style="display: inline-flex; gap: 0.4rem;">
              <button type="button" class="btn btn-secondary btn-xs" onclick="window.nexoraApp.openStockAdjustModal('${p.id}', '${p.sku}', ${p.availableStock})">
                Adjust Stock
              </button>
              <button type="button" class="btn btn-secondary btn-xs" onclick="window.nexoraApp.openEditProductModal('${p.id}')">
                Edit
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderAdminOrdersTable(orderList) {
    el.adminOrdersTableBody.innerHTML = orderList.map(o => `
      <tr>
        <td><code class="font-mono text-xs">${escapeHtml(o.id.slice(0, 16))}...</code></td>
        <td><code class="font-mono text-xs">${escapeHtml((o.customerId || '').slice(0, 8))}...</code></td>
        <td style="font-size: 0.8rem;">${formatDate(o.createdAt)}</td>
        <td><span class="badge ${o.status === 'PAID' ? 'badge-paid' : (o.status === 'PENDING_PAYMENT' ? 'badge-pending' : 'badge-failed')}">${o.status}</span></td>
        <td><strong>${formatPrice(o.totalAmount)}</strong></td>
        <td>${(o.items || []).length} lines</td>
      </tr>
    `).join('');
  }

  // Stock Adjustment
  function openStockAdjustModal(productId, sku, currentStock) {
    el.stockAdjustProductId.value = productId;
    el.stockAdjustSubtitle.textContent = `SKU: ${sku}`;
    el.stockAdjustCurrentVal.textContent = currentStock;
    el.stockDeltaInput.value = '';
    el.stockAdjustErrorAlert.classList.add('hidden');
    el.stockAdjustModal.classList.remove('hidden');
    el.stockDeltaInput.focus();
  }

  async function handleStockAdjust(e) {
    e.preventDefault();
    const productId = el.stockAdjustProductId.value;
    const delta = parseInt(el.stockDeltaInput.value, 10);

    if (isNaN(delta) || delta === 0) {
      el.stockAdjustErrorAlert.textContent = 'Adjustment delta cannot be 0';
      el.stockAdjustErrorAlert.classList.remove('hidden');
      return;
    }

    try {
      await apiRequest(`/api/v1/products/${productId}/stock-adjustments`, {
        method: 'POST',
        body: JSON.stringify({ delta })
      });

      showToast('Inventory stock adjusted successfully', 'success');
      el.stockAdjustModal.classList.add('hidden');
      loadAdminDashboard();
      loadProducts();
    } catch (err) {
      el.stockAdjustErrorAlert.textContent = err.message || 'Failed to adjust stock';
      el.stockAdjustErrorAlert.classList.remove('hidden');
    }
  }

  // Create Product
  function openCreateProductModal() {
    el.createProductForm.reset();
    el.createProductErrorAlert.classList.add('hidden');
    el.createProductModal.classList.remove('hidden');
  }

  async function handleCreateProduct(e) {
    e.preventDefault();
    const sku = document.getElementById('newProdSku').value.trim();
    const name = document.getElementById('newProdName').value.trim();
    const description = document.getElementById('newProdDesc').value.trim();
    const unitPrice = parseFloat(document.getElementById('newProdPrice').value);
    const initialStock = parseInt(document.getElementById('newProdStock').value, 10);
    const category = document.getElementById('newProdCategory').value;
    const imageUrl = document.getElementById('newProdImage').value.trim() || undefined;

    // Validate SKU regex matching Spring Boot @Pattern(regexp = "[A-Z0-9-]{2,64}")
    if (!/^[A-Z0-9-]{2,64}$/.test(sku)) {
      el.createProductErrorAlert.textContent = 'SKU must consist of 2-64 uppercase letters, numbers, or hyphens (e.g. NEX-CAM-01)';
      el.createProductErrorAlert.classList.remove('hidden');
      return;
    }

    try {
      await apiRequest('/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          sku,
          name,
          description,
          unitPrice,
          initialStock,
          category,
          imageUrl
        })
      });

      showToast(`Product "${name}" saved to database`, 'success');
      el.createProductModal.classList.add('hidden');
      loadAdminDashboard();
      loadProducts();
    } catch (err) {
      el.createProductErrorAlert.textContent = err.message || 'Failed to create product';
      el.createProductErrorAlert.classList.remove('hidden');
    }
  }

  // Edit Product
  function openEditProductModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    el.editProductId.value = product.id;
    el.editProdName.value = product.name;
    el.editProdDesc.value = product.description;
    el.editProdPrice.value = product.unitPrice;
    el.editProdActive.checked = !!product.active;
    el.editProductErrorAlert.classList.add('hidden');
    el.editProductModal.classList.remove('hidden');
  }

  async function handleEditProduct(e) {
    e.preventDefault();
    const productId = el.editProductId.value;
    const name = el.editProdName.value.trim();
    const description = el.editProdDesc.value.trim();
    const unitPrice = parseFloat(el.editProdPrice.value);
    const active = el.editProdActive.checked;

    try {
      await apiRequest(`/api/v1/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description, unitPrice, active })
      });

      showToast('Product updated successfully', 'success');
      el.editProductModal.classList.add('hidden');
      loadAdminDashboard();
      loadProducts();
    } catch (err) {
      el.editProductErrorAlert.textContent = err.message || 'Failed to update product';
      el.editProductErrorAlert.classList.remove('hidden');
    }
  }

  // ================= SEED DEMO DATA HELPER =================
  async function seedCuratedData() {
    showToast('Loading curated catalog...', 'info');
    await loadProducts();
  }

  // ================= EVENT LISTENERS =================
  function initEventListeners() {
    // Brand Logo -> Home
    el.brandLogoHome.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('storefront');
    });

    // Nav Category Links
    el.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        el.navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        state.activeCategory = link.dataset.category || 'ALL';

        // Sync category pills
        document.querySelectorAll('.category-pill').forEach(pill => {
          pill.classList.toggle('active', pill.dataset.category === state.activeCategory);
        });

        switchView('storefront');
        renderCatalog();
      });
    });

    // Category Pills in Toolbar
    el.categoryPillsContainer.addEventListener('click', (e) => {
      const pill = e.target.closest('.category-pill');
      if (!pill) return;

      document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      state.activeCategory = pill.dataset.category || 'ALL';

      // Sync nav links
      el.navLinks.forEach(l => {
        l.classList.toggle('active', l.dataset.category === state.activeCategory);
      });

      renderCatalog();
    });

    // Search Input
    let searchDebounce;
    el.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      const val = e.target.value.trim();
      el.clearSearchBtn.classList.toggle('hidden', !val);

      searchDebounce = setTimeout(() => {
        state.searchQuery = val;
        renderCatalog();
      }, 200);
    });

    el.clearSearchBtn.addEventListener('click', () => {
      el.searchInput.value = '';
      state.searchQuery = '';
      el.clearSearchBtn.classList.add('hidden');
      renderCatalog();
    });

    // Sort & Stock Filter
    el.sortSelect.addEventListener('change', (e) => {
      state.sortOption = e.target.value;
      renderCatalog();
    });

    el.inStockOnlyCheckbox.addEventListener('change', (e) => {
      state.inStockOnly = e.target.checked;
      renderCatalog();
    });

    el.resetCatalogFiltersBtn.addEventListener('click', () => {
      state.activeCategory = 'ALL';
      state.searchQuery = '';
      state.sortOption = 'name-asc';
      state.inStockOnly = false;
      el.searchInput.value = '';
      el.sortSelect.value = 'name-asc';
      el.inStockOnlyCheckbox.checked = false;
      document.querySelectorAll('.category-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.category === 'ALL');
      });
      el.navLinks.forEach(l => {
        l.classList.toggle('active', l.dataset.category === 'ALL');
      });
      renderCatalog();
    });

    // User Menu Dropdown
    el.userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!state.currentUser) {
        openAuthModal('signIn');
      } else {
        el.userDropdown.classList.toggle('hidden');
      }
    });

    document.addEventListener('click', (e) => {
      if (!el.userMenuWrapper.contains(e.target)) {
        el.userDropdown.classList.add('hidden');
      }
    });

    el.dropdownOrdersBtn.addEventListener('click', () => {
      el.userDropdown.classList.add('hidden');
      switchView('orders');
    });

    el.dropdownAdminBtn.addEventListener('click', () => {
      el.userDropdown.classList.add('hidden');
      switchView('admin');
    });

    el.dropdownLogoutBtn.addEventListener('click', logout);

    // Nav Orders button
    el.navOrdersBtn.addEventListener('click', () => {
      switchView('orders');
    });

    // Cart Drawer triggers
    el.openCartBtn.addEventListener('click', openCartDrawer);
    el.closeCartDrawerBtn.addEventListener('click', closeCartDrawer);
    el.continueShoppingBtn.addEventListener('click', closeCartDrawer);
    el.cartDrawerBackdrop.addEventListener('click', (e) => {
      if (e.target === el.cartDrawerBackdrop) closeCartDrawer();
    });

    // Product Detail Modal
    el.closeProductDetailModalBtn.addEventListener('click', () => {
      el.productDetailModal.classList.add('hidden');
    });
    el.productDetailModal.addEventListener('click', (e) => {
      if (e.target === el.productDetailModal) el.productDetailModal.classList.add('hidden');
    });

    // Checkout Flow
    el.proceedToCheckoutBtn.addEventListener('click', startCheckout);
    el.closeCheckoutModalBtn.addEventListener('click', () => el.checkoutModal.classList.add('hidden'));
    el.cancelCheckoutBtn.addEventListener('click', () => el.checkoutModal.classList.add('hidden'));
    el.checkoutModal.addEventListener('click', (e) => {
      if (e.target === el.checkoutModal) el.checkoutModal.classList.add('hidden');
    });
    el.checkoutShippingForm.addEventListener('submit', handlePlaceOrder);

    // Simulated Payments
    el.simPaymentSuccessBtn.addEventListener('click', () => handleSimulatePayment(true));
    el.simPaymentFailBtn.addEventListener('click', () => handleSimulatePayment(false));
    el.confirmContinueShoppingBtn.addEventListener('click', () => {
      el.checkoutModal.classList.add('hidden');
      switchView('storefront');
    });
    el.confirmViewOrdersBtn.addEventListener('click', () => {
      el.checkoutModal.classList.add('hidden');
      switchView('orders');
    });

    // Auth Modal
    el.closeAuthModalBtn.addEventListener('click', closeAuthModal);
    el.authModal.addEventListener('click', (e) => {
      if (e.target === el.authModal) closeAuthModal();
    });
    el.tabSignIn.addEventListener('click', () => openAuthModal('signIn'));
    el.tabRegister.addEventListener('click', () => openAuthModal('register'));
    el.signInForm.addEventListener('submit', handleLogin);
    el.registerForm.addEventListener('submit', handleRegister);

    // Quick Demo Switchers
    el.demoCustomerBtn.addEventListener('click', () => {
      el.loginEmail.value = 'customer@nexora.io';
      el.loginPassword.value = 'Password12345!';
    });
    el.demoAdminBtn.addEventListener('click', () => {
      el.loginEmail.value = 'admin@nexora.io';
      el.loginPassword.value = 'AdminSecret12345!';
    });

    // Orders View
    el.ordersBackBtn.addEventListener('click', () => switchView('storefront'));
    el.ordersShopNowBtn.addEventListener('click', () => switchView('storefront'));
    el.refreshOrdersBtn.addEventListener('click', loadOrders);
    el.ordersFilterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        el.ordersFilterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.activeOrdersFilter = pill.dataset.status || 'ALL';
        renderOrdersList();
      });
    });

    // Admin View
    el.adminBackBtn.addEventListener('click', () => switchView('storefront'));
    el.openCreateProductModalBtn.addEventListener('click', openCreateProductModal);
    el.closeCreateProductModalBtn.addEventListener('click', () => el.createProductModal.classList.add('hidden'));
    el.cancelCreateProductBtn.addEventListener('click', () => el.createProductModal.classList.add('hidden'));
    el.createProductForm.addEventListener('submit', handleCreateProduct);

    el.closeStockAdjustModalBtn.addEventListener('click', () => el.stockAdjustModal.classList.add('hidden'));
    el.cancelStockAdjustBtn.addEventListener('click', () => el.stockAdjustModal.classList.add('hidden'));
    el.stockAdjustForm.addEventListener('submit', handleStockAdjust);

    el.closeEditProductModalBtn.addEventListener('click', () => el.editProductModal.classList.add('hidden'));
    el.cancelEditProductBtn.addEventListener('click', () => el.editProductModal.classList.add('hidden'));
    el.editProductForm.addEventListener('submit', handleEditProduct);

    // Admin Tabs
    el.adminTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        el.adminTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        if (target === 'products') {
          el.adminProductsTab.classList.remove('hidden');
          el.adminOrdersTab.classList.add('hidden');
        } else {
          el.adminProductsTab.classList.add('hidden');
          el.adminOrdersTab.classList.remove('hidden');
        }
      });
    });

    // Hero quick actions
    el.heroAdminBtn.addEventListener('click', () => {
      if (!state.currentUser || state.currentUser.role !== 'ADMIN') {
        openAuthModal('signIn');
        el.loginEmail.value = 'admin@nexora.io';
        el.loginPassword.value = 'AdminSecret12345!';
        showToast('Click "Sign In" to access Admin Portal as Demo Admin', 'info');
      } else {
        switchView('admin');
      }
    });

    el.heroQuickBuyBtn.addEventListener('click', () => {
      // Find headphone product
      const headphone = state.products.find(p => p.sku === 'NEX-HP-700') || state.products[0];
      if (headphone) openProductDetail(headphone.id);
    });

    // DevOps Modal
    el.openDevOpsModalBtn.addEventListener('click', () => el.devOpsModal.classList.remove('hidden'));
    el.footerDevOpsLink.addEventListener('click', (e) => {
      e.preventDefault();
      el.devOpsModal.classList.remove('hidden');
    });
    el.closeDevOpsModalBtn.addEventListener('click', () => el.devOpsModal.classList.add('hidden'));
    el.devOpsModal.addEventListener('click', (e) => {
      if (e.target === el.devOpsModal) el.devOpsModal.classList.add('hidden');
    });

    // Seed Demo
    el.seedDemoDataBtn.addEventListener('click', seedCuratedData);

    // Newsletter
    el.newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      el.newsletterSuccess.classList.remove('hidden');
      el.newsletterForm.reset();
    });

    // Footer category links
    document.querySelectorAll('.footer-link[data-cat]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = link.dataset.cat;
        state.activeCategory = cat;
        document.querySelectorAll('.category-pill').forEach(pill => {
          pill.classList.toggle('active', pill.dataset.category === cat);
        });
        el.navLinks.forEach(l => {
          l.classList.toggle('active', l.dataset.category === cat);
        });
        switchView('storefront');
        renderCatalog();
        window.scrollTo({ top: el.categoryPillsContainer.offsetTop - 80, behavior: 'smooth' });
      });
    });
  }

  // ================= GLOBAL EXPORTS FOR INLINE HANDLERS =================
  window.nexoraApp = {
    addToCart,
    openProductDetail,
    adjustDetailModalQty,
    addDetailModalToCart,
    updateCartItemQuantity,
    removeFromCart,
    closeCartDrawer,
    openOrderPaymentPrompt,
    cancelOrder,
    openStockAdjustModal,
    openEditProductModal
  };

  // ================= INIT =================
  function init() {
    initAuth();
    initCart();
    initEventListeners();
    loadProducts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
