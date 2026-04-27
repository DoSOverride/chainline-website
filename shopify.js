// ChainLine Cycle — Shopify Integration (no token required)
window.CL_SHOP = {
  domain: '4nie4h-ek.myshopify.com',
  cart: [], // clears on every page reload by design
};

// ── Fetch products from public JSON endpoint ──────────────────
window.shopifyGetProducts = async function() {
  try {
    const res = await fetch(`https://${window.CL_SHOP.domain}/products.json?limit=250`);
    const json = await res.json();
    return json.products.map(p => ({
      id:        p.id,
      title:     p.title,
      handle:    p.handle,
      vendor:    p.vendor,
      tags:      p.tags,
      image:     p.images[0]?.src || null,
      price:     parseFloat(p.variants[0]?.price || 0),
      compareAt: p.variants[0]?.compare_at_price ? parseFloat(p.variants[0].compare_at_price) : null,
      variantId: p.variants[0]?.id || null,
      available: p.variants[0]?.available || false,
    }));
  } catch(e) {
    console.warn('[ChainLine] Could not fetch products:', e.message);
    return [];
  }
};

// ── Cart (localStorage) ───────────────────────────────────────
window.shopifyCart = {
  items: window.CL_SHOP.cart,

  _save() {
    window.CL_SHOP.cart = this.items;
  },

  add(variantId, name, price, image, qty = 1) {
    const existing = this.items.find(i => i.variantId === variantId);
    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push({ variantId, name, price, image, qty });
    }
    this._save();
    const count = this.items.reduce((s, i) => s + i.qty, 0);
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: this.items, count } }));
    return this.items;
  },

  remove(variantId) {
    this.items = this.items.filter(i => i.variantId !== variantId);
    this._save();
    const count = this.items.reduce((s, i) => s + i.qty, 0);
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: this.items, count } }));
  },

  count() {
    return this.items.reduce((s, i) => s + i.qty, 0);
  },

  // Redirect to Shopify checkout with all cart items
  checkout() {
    if (this.items.length === 0) return;
    const itemStr = this.items.map(i => `${i.variantId}:${i.qty}`).join(',');
    window.location.href = `https://${window.CL_SHOP.domain}/cart/${itemStr}`;
  },
};

// ── Add to cart by handle ─────────────────────────────────────
window.clAddToCart = async function(handle, name, price, image) {
  // Look up variantId from fetched products
  const products = window.CL_SHOP.products || [];
  const match = products.find(p =>
    p.handle === handle ||
    p.title.toLowerCase() === (name || '').toLowerCase()
  );

  if (!match || !match.variantId) {
    console.warn('[ChainLine] Product not found in Shopify:', handle || name);
    // Still add to cart with a placeholder so UX works
    window.shopifyCart.add('unknown-' + Date.now(), name || handle, price || 0, image);
    return;
  }

  window.shopifyCart.add(match.variantId, match.title, match.price, match.image);
  return match;
};

// ── Init ──────────────────────────────────────────────────────
window.shopifyReady = (async () => {
  try {
    const products = await window.shopifyGetProducts();
    window.CL_SHOP.products = products;

    const count = window.shopifyCart.count();
    if (count > 0) {
      document.querySelectorAll('.cart-count span').forEach(el => { el.textContent = count; });
    }

    if (products.length > 0) {
      console.log(`[ChainLine] Shopify connected — ${products.length} products loaded.`);
    } else {
      console.warn('[ChainLine] No products found — store may be password protected.');
    }

    window.dispatchEvent(new CustomEvent('shopify:ready', { detail: { products } }));
  } catch(err) {
    console.warn('[ChainLine] Shopify init error:', err.message);
  }
})();
