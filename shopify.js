// ChainLine Cycle — Shopify Integration (no token required)
window.CL_SHOP = {
  domain: '4nie4h-ek.myshopify.com',
  cart: [], // clears on every page reload by design
};

// ── Fetch products from public JSON endpoint ──────────────────
window.shopifyGetProducts = async function() {
  try {
    const results = [];
    let page = 1;
    while (true) {
      const res = await fetch(`https://${window.CL_SHOP.domain}/products.json?limit=250&page=${page}`);
      const { products } = await res.json();
      if (!products || products.length === 0) break;
      results.push(...products);
      if (products.length < 250) break;
      page++;
    }
    return results.map(p => ({
      id:        p.id,
      title:     p.title,
      handle:    p.handle,
      vendor:    p.vendor,
      tags:      p.tags,
      image:     p.images[0]?.src || null,
      price:     parseFloat(p.variants[0]?.price || 0),
      compareAt: p.variants[0]?.compare_at_price ? parseFloat(p.variants[0].compare_at_price) : null,
      variantId: p.variants[0]?.id || null,
      sku:       p.variants[0]?.sku || '',
      available: p.variants[0]?.available || false,
      variants:  p.variants.map(v => ({
        id:        v.id,
        sku:       v.sku,
        title:     v.title,
        price:     parseFloat(v.price || 0),
        available: v.available,
      })),
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

  add(variantId, name, price, image, qty = 1, variant = null) {
    const existing = this.items.find(i => i.variantId === variantId);
    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push({ variantId, name, price, image, qty, variant });
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
window.clAddToCart = async function(handle, name, price, image, sku, variant) {
  // Wait for Shopify data if not loaded yet (skuVariantMap populated by shopifyReady)
  if (!window.CL_SHOP.skuVariantMap || Object.keys(window.CL_SHOP.skuVariantMap).length === 0) {
    await window.shopifyReady;
  }
  const products    = window.CL_SHOP.products    || [];
  const variantMap  = window.CL_SHOP.skuVariantMap || {};

  // 1. SKU direct lookup (most reliable for Lightspeed bikes)
  if (sku && variantMap[sku]) {
    const variantId = variantMap[sku];
    window.shopifyCart.add(variantId, name, price, image, 1, variant || null);
    return { variantId, name, price, image };
  }

  // 2. Handle or title match
  const match = products.find(p =>
    p.handle === handle ||
    p.title.toLowerCase() === (name || '').toLowerCase()
  );
  if (match?.variantId) {
    window.shopifyCart.add(match.variantId, match.title, match.price, match.image, 1, variant || null);
    return match;
  }

  // 3. Not in Shopify — can't checkout, warn clearly
  console.warn('[ChainLine] Product not in Shopify, cannot checkout:', sku || handle || name);
  return null;
};

// ── Init ──────────────────────────────────────────────────────
window.shopifyReady = (async () => {
  try {
    const workerUrl = 'https://still-term-f1ec.taocaruso77.workers.dev';

    // Fetch public products (images/titles) + full variant map from worker in parallel
    const [products, variantMap] = await Promise.all([
      window.shopifyGetProducts(),
      fetch(`${workerUrl}/api/shopify-variants`).then(r => r.json()).catch(() => ({})),
    ]);
    window.CL_SHOP.products = products;

    // Build image lookup maps from public products
    const skuMap   = {};
    const titleMap = {};
    const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    products.forEach(p => {
      if (p.title) titleMap[norm(p.title)] = p.image;
      (p.variants || []).forEach(v => {
        if (v.sku && p.image && !skuMap[v.sku]) skuMap[v.sku] = p.image;
      });
    });
    window.CL_SHOP.skuImageMap   = skuMap;
    window.CL_SHOP.titleImageMap = titleMap;
    window.CL_SHOP.skuVariantMap = variantMap;
    console.log(`[ChainLine] Variant map loaded: ${Object.keys(variantMap).length} SKUs`);

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
