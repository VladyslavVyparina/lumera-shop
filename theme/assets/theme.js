/* ==========================================================================
   SculptFit Theme JavaScript
   ========================================================================== */

'use strict';

// --------------------------------------------------------------------------
// Utility Functions
// --------------------------------------------------------------------------

function formatMoney(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + '\u00a0€';
}

function showNotification(message, type = 'success') {
  let note = document.getElementById('notification-toast');
  if (!note) {
    note = document.createElement('div');
    note.id = 'notification-toast';
    note.className = 'notification';
    document.body.appendChild(note);
  }
  note.className = `notification notification--${type}`;
  note.innerHTML = `
    ${type === 'success' ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
    <span>${message}</span>
  `;
  note.classList.add('is-visible');
  setTimeout(() => note.classList.remove('is-visible'), 3500);
}

// --------------------------------------------------------------------------
// Cookie Consent (DSGVO / GDPR Compliant)
// --------------------------------------------------------------------------

const CookieConsent = {
  banner: null,
  STORAGE_KEY: 'cookie_consent',

  init() {
    this.banner = document.getElementById('cookie-banner');
    if (!this.banner) return;

    const consent = localStorage.getItem(this.STORAGE_KEY);
    if (!consent) {
      // Show after small delay
      setTimeout(() => {
        this.banner.style.display = 'block';
      }, 800);
    } else if (consent === 'accepted') {
      this.loadAnalytics();
    }

    document.getElementById('cookie-accept')?.addEventListener('click', () => this.accept());
    document.getElementById('cookie-decline')?.addEventListener('click', () => this.decline());
  },

  accept() {
    localStorage.setItem(this.STORAGE_KEY, 'accepted');
    this.hideBanner();
    this.loadAnalytics();
  },

  decline() {
    localStorage.setItem(this.STORAGE_KEY, 'declined');
    this.hideBanner();
  },

  hideBanner() {
    if (this.banner) {
      this.banner.style.opacity = '0';
      this.banner.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        this.banner.style.display = 'none';
      }, 300);
    }
  },

  loadAnalytics() {
    // Meta Pixel - nur nach Zustimmung laden
    // const metaPixelId = document.documentElement.dataset.metaPixelId;
    // if (metaPixelId) { ... }

    // Google Analytics - nur nach Zustimmung laden
    // const gaId = document.documentElement.dataset.gaId;
    // if (gaId) { ... }
    
    // Dispatch event so other scripts can hook into consent
    document.dispatchEvent(new CustomEvent('cookieConsentAccepted'));
  }
};

// --------------------------------------------------------------------------
// Header: Mobile Menu, Search, Scroll behavior
// --------------------------------------------------------------------------

const Header = {
  init() {
    // Mobile Menu
    const menuToggle = document.getElementById('menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileClose = document.getElementById('mobile-nav-close');

    menuToggle?.addEventListener('click', () => {
      mobileNav?.classList.add('is-open');
      mobileNav?.setAttribute('aria-hidden', 'false');
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    });

    const closeMenu = () => {
      mobileNav?.classList.remove('is-open');
      mobileNav?.setAttribute('aria-hidden', 'true');
      menuToggle?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    mobileClose?.addEventListener('click', closeMenu);

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (mobileNav?.classList.contains('is-open') && 
          !mobileNav.contains(e.target) && 
          !menuToggle?.contains(e.target)) {
        closeMenu();
      }
    });

    // Search Toggle
    const searchToggle = document.getElementById('search-toggle');
    const searchBar = document.getElementById('search-bar');
    const searchClose = document.getElementById('search-close');

    searchToggle?.addEventListener('click', () => {
      const isOpen = searchBar?.style.display !== 'none' && searchBar?.style.display !== '';
      if (searchBar) {
        searchBar.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) {
          searchBar.querySelector('input')?.focus();
        }
      }
    });

    searchClose?.addEventListener('click', () => {
      if (searchBar) searchBar.style.display = 'none';
    });

    // Active nav link
    const currentPath = window.location.pathname;
    document.querySelectorAll('.header__nav-link, .mobile-nav__link').forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });
  }
};

// --------------------------------------------------------------------------
// Cart
// --------------------------------------------------------------------------

const Cart = {
  drawer: null,
  overlay: null,
  countEl: null,

  init() {
    this.drawer = document.getElementById('cart-drawer');
    this.overlay = document.getElementById('cart-overlay');
    this.countEl = document.getElementById('cart-count');

    // Toggle cart
    document.getElementById('cart-toggle')?.addEventListener('click', () => this.open());
    document.getElementById('cart-close')?.addEventListener('click', () => this.close());
    document.getElementById('cart-drawer-continue')?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    // Initialize cart count
    this.updateCount();

    // Add to cart buttons (product cards)
    document.querySelectorAll('.product-card__atc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = btn.dataset.variantId;
        if (variantId) this.addItem(variantId, 1, btn);
      });
    });

    // Product form
    const productForm = document.getElementById('product-form');
    if (productForm) {
      productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const variantId = document.getElementById('variant-id')?.value;
        const quantity = parseInt(document.getElementById('quantity-input')?.value || '1');
        if (variantId) this.addItem(variantId, quantity);
      });
    }

    // Cart page quantity changes
    document.querySelectorAll('.cart-qty-minus, .cart-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.itemKey;
        const qty = parseInt(btn.dataset.qty);
        if (key) this.updateCartPage(key, qty);
      });
    });

    document.querySelectorAll('.cart-item__remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.itemKey;
        if (key) this.updateCartPage(key, 0);
      });
    });
  },

  open() {
    this.drawer?.classList.add('is-open');
    this.overlay?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    this.renderDrawer();
  },

  close() {
    this.drawer?.classList.remove('is-open');
    this.overlay?.classList.remove('is-open');
    document.body.style.overflow = '';
  },

  async getCart() {
    const res = await fetch('/cart.js');
    return res.json();
  },

  async addItem(variantId, quantity = 1, btn = null) {
    const addToCartBtn = btn || document.getElementById('add-to-cart-btn');
    const originalText = addToCartBtn?.textContent;

    if (addToCartBtn) {
      addToCartBtn.disabled = true;
      addToCartBtn.textContent = 'Wird hinzugefügt...';
    }

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity })
      });

      if (!res.ok) {
        const data = await res.json();
        showNotification(data.description || 'Fehler beim Hinzufügen', 'error');
        return;
      }

      const data = await res.json();
      await this.updateCount();
      this.open();
      showNotification('Produkt wurde zum Warenkorb hinzugefügt!', 'success');

    } catch (err) {
      showNotification('Fehler beim Hinzufügen zum Warenkorb', 'error');
    } finally {
      if (addToCartBtn) {
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = originalText;
      }
    }
  },

  async updateCount() {
    try {
      const cart = await this.getCart();
      const count = cart.item_count;
      if (this.countEl) {
        this.countEl.textContent = count > 0 ? count : '';
        this.countEl.style.display = count > 0 ? 'flex' : 'none';
      }
      return cart;
    } catch (e) {
      return null;
    }
  },

  async renderDrawer() {
    const bodyEl = document.getElementById('cart-drawer-body');
    const footerEl = document.getElementById('cart-drawer-footer');
    const subtotalEl = document.getElementById('cart-subtotal');

    if (bodyEl) {
      bodyEl.innerHTML = `<div class="cart-drawer__loading"><div class="loading-spinner"></div>Laden...</div>`;
    }

    try {
      const cart = await this.getCart();

      if (cart.item_count === 0) {
        if (bodyEl) {
          bodyEl.innerHTML = `
            <div class="cart-drawer__empty">
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              <p style="margin-top:16px;font-weight:600;">Dein Warenkorb ist leer</p>
              <p style="font-size:0.85rem;color:#888;margin-top:8px;">Entdecke unsere Produkte und füge sie hinzu!</p>
            </div>
          `;
        }
        if (footerEl) footerEl.style.display = 'none';
        return;
      }

      const itemsHtml = cart.items.map(item => `
        <div class="cart-drawer__item" data-item-key="${item.key}">
          <div class="cart-drawer__item-image">
            ${item.image ? `<img src="${item.image.replace('.jpg', '_80x80.jpg')}" alt="${item.product_title}" width="80" height="80" loading="lazy">` : ''}
          </div>
          <div>
            <div class="cart-drawer__item-title">${item.product_title}</div>
            ${item.variant_title && item.variant_title !== 'Default Title' ? `<div class="cart-drawer__item-variant">${item.variant_title}</div>` : ''}
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
              <button class="quantity-btn drawer-qty-btn" data-key="${item.key}" data-action="minus" style="padding:4px 10px;font-size:0.9rem;">−</button>
              <span style="font-size:0.875rem;font-weight:600;min-width:24px;text-align:center;">${item.quantity}</span>
              <button class="quantity-btn drawer-qty-btn" data-key="${item.key}" data-action="plus" style="padding:4px 10px;font-size:0.9rem;">+</button>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
            <div class="cart-drawer__item-price">${formatMoney(item.final_line_price)}</div>
            <button class="cart-drawer__item-remove" data-key="${item.key}" aria-label="Entfernen">×</button>
          </div>
        </div>
      `).join('');

      if (bodyEl) bodyEl.innerHTML = itemsHtml;
      if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);
      if (footerEl) footerEl.style.display = 'block';

      // Bind events in drawer
      bodyEl?.querySelectorAll('.cart-drawer__item-remove').forEach(btn => {
        btn.addEventListener('click', async () => {
          await this.changeItem(btn.dataset.key, 0);
          this.renderDrawer();
        });
      });

      bodyEl?.querySelectorAll('.drawer-qty-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const item = cart.items.find(i => i.key === btn.dataset.key);
          if (!item) return;
          const newQty = btn.dataset.action === 'plus' ? item.quantity + 1 : Math.max(0, item.quantity - 1);
          await this.changeItem(btn.dataset.key, newQty);
          await this.updateCount();
          this.renderDrawer();
        });
      });

    } catch (e) {
      if (bodyEl) bodyEl.innerHTML = '<p style="text-align:center;padding:20px;color:#888;">Fehler beim Laden des Warenkorbs.</p>';
    }
  },

  async changeItem(key, quantity) {
    await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity })
    });
    await this.updateCount();
  },

  async updateCartPage(key, quantity) {
    await this.changeItem(key, quantity);
    window.location.reload();
  }
};

// --------------------------------------------------------------------------
// Product Page
// --------------------------------------------------------------------------

const ProductPage = {
  variants: [],
  selectedOptions: [],

  init() {
    const variantsJson = document.getElementById('product-variants-json');
    if (!variantsJson) return;

    try {
      this.variants = JSON.parse(variantsJson.textContent);
    } catch (e) { return; }

    // Initialize selected options from first available variant
    const firstAvailable = this.variants.find(v => v.available) || this.variants[0];
    if (firstAvailable) {
      this.selectedOptions = [...(firstAvailable.options || [])];
    }

    // Bind color swatch clicks
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const optionIndex = parseInt(swatch.dataset.optionIndex);
        const value = swatch.dataset.value;
        this.updateOption(optionIndex, value, swatch.closest('.product-option__swatches'), 'color-swatch');
      });
    });

    // Bind size button clicks
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const optionIndex = parseInt(btn.dataset.optionIndex);
        const value = btn.dataset.value;
        this.updateOption(optionIndex, value, btn.closest('.product-option__sizes'), 'size-btn');
      });
    });

    // Select changes
    document.querySelectorAll('.product-option__select').forEach(select => {
      select.addEventListener('change', () => {
        const optionIndex = parseInt(select.dataset.optionIndex);
        this.selectedOptions[optionIndex] = select.value;
        this.updateVariant();
      });
    });

    // Quantity buttons
    document.getElementById('qty-minus')?.addEventListener('click', () => {
      const input = document.getElementById('quantity-input');
      if (input && parseInt(input.value) > 1) input.value = parseInt(input.value) - 1;
    });

    document.getElementById('qty-plus')?.addEventListener('click', () => {
      const input = document.getElementById('quantity-input');
      if (input) input.value = parseInt(input.value) + 1;
    });

    // Gallery thumbnails
    document.querySelectorAll('.product-gallery__thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        document.querySelectorAll('.product-gallery__thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        const mainImg = document.getElementById('main-product-image');
        if (mainImg) mainImg.src = thumb.dataset.src;
      });
    });
  },

  updateOption(optionIndex, value, container, activeClass) {
    this.selectedOptions[optionIndex] = value;
    
    // Update active state
    container?.querySelectorAll(`.${activeClass}`).forEach(el => {
      el.classList.toggle('active', el.dataset.value === value);
    });

    // Update display label
    const displayLabel = document.getElementById(`option-${optionIndex}-display`);
    if (displayLabel) displayLabel.textContent = value;

    this.updateVariant();
  },

  updateVariant() {
    const variant = this.findVariant();
    if (!variant) return;

    // Update hidden input
    const variantInput = document.getElementById('variant-id');
    if (variantInput) variantInput.value = variant.id;

    // Update price
    const priceEl = document.getElementById('product-price');
    if (priceEl && variant.price !== undefined) {
      const comparePrice = variant.compare_at_price;
      const price = variant.price;
      if (comparePrice && comparePrice > price) {
        priceEl.innerHTML = `
          <span class="price--compare">${formatMoney(comparePrice)}</span>
          <span class="price--current price--sale">${formatMoney(price)}</span>
          <span class="price--savings">Du sparst ${formatMoney(comparePrice - price)}</span>
          <p class="price--tax-note">inkl. 19% MwSt. zzgl. <a href="/pages/versand">Versandkosten</a></p>
        `;
      } else {
        priceEl.innerHTML = `
          <span class="price--current">${formatMoney(price)}</span>
          <p class="price--tax-note">inkl. 19% MwSt. zzgl. <a href="/pages/versand">Versandkosten</a></p>
        `;
      }
    }

    // Update main image if variant has image
    if (variant.featured_image) {
      const mainImg = document.getElementById('main-product-image');
      if (mainImg) mainImg.src = variant.featured_image.src.replace(/\.jpg$/, '_1200x.jpg');
    }

    // Update Add to Cart button
    const addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) {
      addBtn.disabled = !variant.available;
      addBtn.textContent = variant.available ? 'In den Warenkorb' : 'Ausverkauft';
    }

    // Update size buttons availability
    this.updateSizeAvailability();
  },

  findVariant() {
    return this.variants.find(v => {
      return this.selectedOptions.every((option, index) => v.options[index] === option);
    });
  },

  updateSizeAvailability() {
    // Check which sizes are available for current color
    const colorIndex = this.getOptionIndex('Farbe') || this.getOptionIndex('Color');
    if (colorIndex === -1) return;

    document.querySelectorAll('.size-btn').forEach(btn => {
      const sizeIndex = parseInt(btn.dataset.optionIndex);
      const testOptions = [...this.selectedOptions];
      testOptions[sizeIndex] = btn.dataset.value;

      const available = this.variants.some(v => 
        testOptions.every((opt, i) => v.options[i] === opt) && v.available
      );

      btn.classList.toggle('unavailable', !available);
    });
  },

  getOptionIndex(name) {
    const options = document.querySelectorAll('.product-option');
    for (const opt of options) {
      const label = opt.querySelector('.product-option__label');
      if (label && (label.textContent.includes(name))) {
        return parseInt(opt.dataset.optionIndex);
      }
    }
    return -1;
  }
};

// --------------------------------------------------------------------------
// Initialize on DOM Ready
// --------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  CookieConsent.init();
  Header.init();
  Cart.init();
  ProductPage.init();
});
