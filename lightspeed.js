// ChainLine Cycle — Live Lightspeed R-Series Inventory
window.CL_LS = {
  workerUrl: 'https://still-term-f1ec.taocaruso77.workers.dev',
  products:    [],
  departments: [],
  loaded:      false,
};

// ── Fetch a page of inventory ─────────────────────────────────
window.lightspeedFetch = async function({ limit = 100, offset = 0, dept = '' } = {}) {
  const qs  = new URLSearchParams({ limit, offset });
  if (dept) qs.set('dept', dept);
  const res  = await fetch(`${window.CL_LS.workerUrl}/api/inventory?${qs}`);
  return res.json();
};

// ── Load all products (paginated) ────────────────────────────
window.lightspeedLoadAll = async function() {
  try {
    const first = await window.lightspeedFetch({ limit: 100, offset: 0 });
    if (!first.items || first.total === 0) return null;

    window.CL_LS.departments = first.departments || [];
    let all = [...first.items];
    const total = first.total;

    // Fetch remaining pages in batches of 100
    const pages = Math.ceil(total / 100);
    for (let p = 1; p < Math.min(pages, 80); p++) { // max 8000 items
      const page = await window.lightspeedFetch({ limit: 100, offset: p * 100 });
      if (page.items) all = all.concat(page.items);
    }

    window.CL_LS.products = all;
    window.CL_LS.loaded   = true;
    console.log(`[ChainLine] Lightspeed loaded: ${all.length} products`);
    window.dispatchEvent(new CustomEvent('lightspeed:ready', { detail: { count: all.length } }));
    return all;
  } catch(err) {
    console.warn('[ChainLine] Lightspeed error:', err.message);
    return null;
  }
};

// ── Fetch one dept on demand (for Parts page) ─────────────────
window.lightspeedGetDept = async function(deptName) {
  try {
    const res = await window.lightspeedFetch({ limit: 200, dept: deptName });
    return res.items || [];
  } catch { return []; }
};

// ── Filter bikes from inventory ───────────────────────────────
window.lightspeedGetBikes = function() {
  const bikeKeywords = ['mountain', 'road', 'gravel', 'electric', 'e-bike', 'commut', 'kid', 'junior', 'cruiser', 'comfort', 'hybrid', 'touring', 'fat', 'cross', 'bmx'];
  return window.CL_LS.products.filter(p => {
    const cat  = (p.category  || '').toLowerCase();
    const dept = (p.department || '').toLowerCase();
    return cat === 'bikes' || bikeKeywords.some(k => dept.includes(k));
  }).map(p => ({
    id:    p.id,
    name:  p.name,
    brand: '',
    sku:   p.sku,
    type:  deptToType(p.department),
    price: p.price,
    img:   null,
    tags:  p.department,
    handle: p.sku || String(p.id),
    fromLightspeed: true,
    qty:     typeof p.qty === 'number' ? p.qty : null,
    inStock: typeof p.inStock === 'boolean' ? p.inStock : true,
  }));
};

function deptToType(dept) {
  if (!dept) return 'Other';
  const d = dept.toLowerCase();
  if (d.includes('mountain') || d.includes('mtb')) return 'Mountain';
  if (d.includes('road'))    return 'Road';
  if (d.includes('gravel'))  return 'Gravel';
  if (d.includes('electric') || d.includes('e-bike')) return 'E-Bike';
  if (d.includes('comfort') || d.includes('cruiser')) return 'Comfort';
  if (d.includes('kid') || d.includes('junior'))      return 'Kids';
  if (d.includes('commut') || d.includes('hybrid'))   return 'Commuter';
  if (d.includes('fat'))   return 'Mountain';
  return 'Other';
}

// ── Get all departments with item counts ──────────────────────
window.lightspeedGetDepartments = function() {
  const counts = {};
  window.CL_LS.products.forEach(p => {
    const k = p.department || 'General';
    counts[k] = (counts[k] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

// ── Search products ───────────────────────────────────────────
window.lightspeedSearch = function(query) {
  const q = query.toLowerCase();
  return window.CL_LS.products.filter(p =>
    (p.name || '').toLowerCase().includes(q) ||
    (p.sku  || '').toLowerCase().includes(q) ||
    (p.department || '').toLowerCase().includes(q)
  );
};

// ── Init: load first page immediately, rest lazily ────────────
window.lightspeedReady = (async () => {
  // Just load first page for initial shop display
  try {
    const first = await window.lightspeedFetch({ limit: 100 });
    if (first && first.items && first.items.length > 0) {
      window.CL_LS.products    = first.items;
      window.CL_LS.departments = first.departments || [];
      window.CL_LS.loaded      = true;
      window.CL_LS.total       = first.total;
      console.log(`[ChainLine] Lightspeed connected — ${first.total} products available`);
      window.dispatchEvent(new CustomEvent('lightspeed:ready', { detail: { count: first.total } }));
    }
  } catch(err) {
    console.warn('[ChainLine] Lightspeed unavailable:', err.message);
  }
})();
