// ChainLine Cycle — Live Lightspeed R-Series Inventory
// Fetches real-time product data from your Lightspeed store via Cloudflare Worker

window.CL_LS = {
  workerUrl: 'https://still-term-f1ec.taocaruso77.workers.dev',
  products: [],
  loaded: false,
};

// ── Fetch live inventory from Lightspeed ─────────────────────
window.lightspeedGetProducts = async function() {
  try {
    const res  = await fetch(`${window.CL_LS.workerUrl}/api/products?limit=200`);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      console.warn('[ChainLine] Lightspeed returned 0 products — falling back to static catalog');
      return null;
    }

    window.CL_LS.products = data.items;
    window.CL_LS.loaded   = true;
    console.log(`[ChainLine] Lightspeed live: ${data.count} products loaded`);
    return data.items;
  } catch (err) {
    console.warn('[ChainLine] Lightspeed unavailable, using static catalog:', err.message);
    return null;
  }
};

// ── Map Lightspeed category to our site type ──────────────────
function lsTypeToSiteType(category) {
  if (!category) return 'Other';
  const c = category.toLowerCase();
  if (c.includes('mountain') || c.includes('mtb'))     return 'Mountain';
  if (c.includes('gravel') || c.includes('touring'))   return 'Gravel';
  if (c.includes('electric') || c.includes('e-bike') || c.includes('ebike')) return 'E-Bike';
  if (c.includes('road'))                              return 'Road';
  if (c.includes('commut') || c.includes('hybrid') || c.includes('city')) return 'Commuter';
  if (c.includes('comfort') || c.includes('cruiser')) return 'Comfort';
  if (c.includes('kid') || c.includes('junior') || c.includes('youth')) return 'Kids';
  if (c.includes('bike') || c.includes('cycle'))      return 'Mountain'; // default for uncategorized bikes
  return 'Other';
}

// ── Convert Lightspeed item to SHOP_BIKES format ──────────────
function lsItemToShopBike(item) {
  return {
    id:      item.id,
    handle:  item.handle || item.sku || String(item.id),
    name:    item.name,
    brand:   item.brand || 'ChainLine',
    sku:     item.sku,
    type:    lsTypeToSiteType(item.category),
    price:   item.price,
    img:     item.image,
    inStock: item.inStock,
    qty:     item.qty,
    tags:    item.category || '',
    description: item.description || '',
    fromLightspeed: true,
  };
}

// ── Get bikes only (filter out parts/accessories) ─────────────
window.lightspeedGetBikes = function() {
  const bikeTypes = ['Mountain', 'Gravel', 'E-Bike', 'Road', 'Commuter', 'Comfort', 'Kids'];
  return window.CL_LS.products
    .map(lsItemToShopBike)
    .filter(b => bikeTypes.includes(b.type) && b.inStock !== false);
};

// ── Get all products (parts, accessories, etc.) ───────────────
window.lightspeedGetAll = function() {
  return window.CL_LS.products.map(lsItemToShopBike);
};

// ── Price lookup by SKU or name (for Shopify cart matching) ───
window.lightspeedGetPrice = function(nameOrSku) {
  const q = (nameOrSku || '').toLowerCase();
  const match = window.CL_LS.products.find(p =>
    (p.sku && p.sku.toLowerCase() === q) ||
    (p.name && p.name.toLowerCase().includes(q))
  );
  return match ? match.price : null;
};

// ── Init: load on page start ──────────────────────────────────
window.lightspeedReady = (async () => {
  const products = await window.lightspeedGetProducts();
  if (products) {
    window.dispatchEvent(new CustomEvent('lightspeed:ready', {
      detail: { count: products.length }
    }));
  }
})();
