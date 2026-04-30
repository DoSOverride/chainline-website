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

// ── Fetch in-stock items for one parts tab (cached) ───────────
window.lightspeedGetTab = async function(tabId) {
  if (!window.CL_LS.tabCache) window.CL_LS.tabCache = {};
  if (window.CL_LS.tabCache[tabId]) return window.CL_LS.tabCache[tabId];
  try {
    const res  = await fetch(`${window.CL_LS.workerUrl}/api/parts?tab=${tabId}`);
    const data = await res.json();
    const items = data.items || [];
    window.CL_LS.tabCache[tabId] = items;
    return items;
  } catch { return []; }
};

// ── Warm cache: silently preload tabs with small delays ───────
window.lightspeedWarmCache = async function(tabs) {
  if (!tabs) tabs = ['drivetrain','brakes','wheels','cockpit','suspension','fit','tools','accessories'];
  for (const tab of tabs) {
    if (!window.CL_LS.tabCache?.[tab]) {
      await window.lightspeedGetTab(tab);
      await new Promise(r => setTimeout(r, 250)); // space out requests
    }
  }
};

// ── Filter bikes from inventory ───────────────────────────────
window.lightspeedGetBikes = function() {
  // Use dedicated bikes endpoint data if available (has real stock)
  if (window.CL_LS.bikes && window.CL_LS.bikes.length > 0) {
    return window.CL_LS.bikes
      .filter(p => {
        // Bikes already come from categoryID=49 (Bikes), so include all in-stock ones.
        // Only exclude if department explicitly says "frame" or similar.
        if (!p.department) return true; // blank dept = still a bike, include it
        const type = deptToType(p.department);
        return type !== null; // null only returned for frame departments
      })
      .filter(p => p.inStock)
      .map(p => {
        const type = deptToType(p.department) || nameToType(p.name);
        const { size, color } = parseNameParts(p.name);
        const wheelSize = guessWheelSize(p.name, type);
        return {
          id:     p.id,
          name:   p.name,
          brand:  (p.name || '').split(' ')[0] || '',
          vendor: (p.name || '').split(' ')[0] || '',
          sku:    p.sku,
          type,
          price:  p.price,
          img:    (window.CL_LS.skuImageMap || {})[p.sku] || null,
          tags:   p.department,
          handle: p.sku || String(p.id),
          fromLightspeed: true,
          qty:     typeof p.qty === 'number' ? p.qty : null,
          inStock: true,
          parsedSize:  size,
          parsedColor: color,
          wheelSize,
        };
      });
  }
  // Fallback: filter from general products list
  const bikeKeywords = ['mountain', 'road', 'gravel', 'electric', 'e-bike', 'commut', 'kid', 'junior', 'cruiser', 'comfort', 'hybrid', 'touring', 'fat', 'cross', 'bmx'];
  return window.CL_LS.products.filter(p => {
    const cat  = (p.category  || '').toLowerCase();
    const dept = (p.department || '').toLowerCase();
    return cat === 'bikes' || bikeKeywords.some(k => dept.includes(k));
  }).map(p => ({
    id:    p.id,
    name:  p.name,
    brand: (p.name || '').split(' ')[0] || '',
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
  if (!dept) return null;
  const d = dept.toLowerCase();
  if (d.includes('frame'))   return null;
  if (d.includes('mountain') || d.includes('mtb') || d.includes('fat')) return 'Mountain';
  if (d.includes('gravel'))  return 'Gravel';
  if (d.includes('electric') || d.includes('e-bike')) return 'E-Bike';
  if (d.includes('comfort') || d.includes('cruiser')) return 'Comfort';
  if (d.includes('kid') || d.includes('junior'))      return 'Kids';
  if (d.includes('commut') || d.includes('hybrid') || d.includes('road') || d.includes('cross')) return 'Commuter';
  if (d.includes('bmx'))     return 'Kids';
  return 'Other';
}

function nameToType(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('regulator') || n.includes('shuttle') || n.includes('e-bike') || n.includes('ebike') || n.includes('stinson e')) return 'E-Bike';
  if (n.includes('bridge club') || n.includes('warbird') || n.includes('cutthroat') || n.includes('journeyman') || n.includes('gestalt') || n.includes('nicasio') || n.includes('grappler')) return 'Gravel';
  if (n.includes('fairfax') || n.includes('kentfield') || n.includes('san anselmo')) return 'Commuter';
  return 'Mountain';
}

// ── Parse size + color from a Lightspeed product name ─────────
// e.g. "Surly Bridge Club XS Juniper Green" → { size:"XS", color:"Juniper Green" }
// e.g. "Marin Bobcat Trail 4 LG Gloss Blue" → { size:"L", color:"Gloss Blue" }
function parseNameParts(fullName) {
  if (!fullName) return { size: null, color: null };

  // Words that are specs/material, not colours
  const NOT_COLOR = new Set(['carbon','alloy','aluminum','steel','titanium','custom',
    'frame','frameset','sport','elite','comp','pro','trail','enduro','am','eagle',
    'deore','shimano','sram','gx','sx','nx','xt','xo','di2','axs','grx','ride',
    'coil','air','v2','v3','gen','single','crown','boost','plus']);

  // Full-word sizes — Lightspeed uses these at the end of names
  const FULL_WORDS = [
    ['xx-large','XXL'],['xxlarge','XXL'],
    ['x-large','XL'],['xlarge','XL'],['extra-large','XL'],['extra large','XL'],
    ['x-small','XS'],['xsmall','XS'],['extra-small','XS'],
    ['small','S'],['medium','M'],['large','L'],
  ];
  const lower = fullName.toLowerCase();
  for (const [word, abbr] of FULL_WORDS) {
    if (lower.endsWith(' ' + word) || lower === word) {
      const before = fullName.slice(0, -(word.length + 1)).trim();
      // Extract colour: walk backwards from the end, collecting capitalized words
      // that aren't known spec words, up to 3 words
      const words = before.split(/\s+/);
      const colourWords = [];
      for (let i = words.length - 1; i >= 0 && colourWords.length < 3; i--) {
        const w = words[i];
        if (!w || w.length < 2) break;
        if (NOT_COLOR.has(w.toLowerCase())) break;
        if (/^[A-Z]/.test(w)) colourWords.unshift(w); else break;
      }
      return { size: abbr, color: colourWords.length ? colourWords.join(' ') : null };
    }
  }

  // Abbreviation matching (Marin-style: "LG Gloss Blue", "XL Black")
  const MULTI  = /\b(XXL|XS\/S|S\/M|M\/L|L\/XL|XL|XS|SM|MD|LG)\b/;
  const SINGLE = /\b(S|M|L)\b(?=\s+[A-Z]|\s*$)/;
  const ROAD   = /\b([4-6][0-9])\s*cm\b/i;
  const m = fullName.match(MULTI) || fullName.match(ROAD) || fullName.match(SINGLE);
  if (!m) return { size: null, color: null };
  const token = (m[1] || m[0]).trim();
  const idx   = fullName.indexOf(token);
  const after = fullName.slice(idx + token.length).trim();
  const NORM  = { SM:'S', MD:'M', LG:'L' };
  return { size: NORM[token] || token.toUpperCase(), color: after || null };
}

// ── Guess wheel size from name + type ─────────────────────────
function guessWheelSize(name, type) {
  const n = (name || '').toLowerCase();
  if (n.includes('700c') || n.includes('700 c'))          return '700C';
  if (n.includes('650b') || n.includes('650 b'))          return '650B';
  if (n.includes('27.5'))                                  return '27.5"';
  if (n.includes('29er') || /\b29\b/.test(n))             return '29"';
  if (/\b26\b/.test(n))                                    return '26"';
  if (/\b24\b/.test(n))                                    return '24"';
  if (/\b20\b/.test(n))                                    return '20"';
  if (type === 'Road' || type === 'Gravel' || type === 'Commuter') return '700C';
  if (type === 'Mountain' || type === 'E-Bike')            return '29"';
  if (type === 'Kids')                                     return '24"';
  return null;
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

// ── Fuzzy match — tolerates typos up to ~20% of word length ──
window.fuzzyMatch = function(needle, haystack) {
  if (!needle || !haystack) return false;
  needle  = needle.toLowerCase().trim();
  haystack = haystack.toLowerCase();
  if (haystack.includes(needle)) return true;

  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 4) return 99;
    const d = [];
    for (let i = 0; i <= a.length; i++) d[i] = [i];
    for (let j = 0; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = a[i-1] === b[j-1] ? d[i-1][j-1] : 1 + Math.min(d[i-1][j], d[i][j-1], d[i-1][j-1]);
    return d[a.length][b.length];
  }

  const tokens   = needle.split(/\s+/).filter(t => t.length >= 3);
  if (!tokens.length) return false;
  const hWords   = haystack.split(/[\s\-\/,.()+]+/);
  return tokens.every(t =>
    haystack.includes(t) ||
    hWords.some(w => lev(t, w) <= (t.length <= 4 ? 1 : t.length <= 7 ? 2 : 3))
  );
};

// ── Search products (fuzzy) ───────────────────────────────────
window.lightspeedSearch = function(query) {
  if (!query || query.length < 2) return [];
  return (window.CL_LS.products || []).filter(p =>
    window.fuzzyMatch(query, (p.name || '') + ' ' + (p.department || '') + ' ' + (p.sku || ''))
  );
};

// ── Enrich a bike that has no static BIKE_DATA entry ─────────
// Calls /api/enrich/:handle — first call hits AI (~1s), subsequent calls are KV-cached (instant).
window.enrichBike = async function(bike) {
  if (!bike?.handle) return null;
  // Already enriched or has static data
  if (window.BIKE_DATA?.[bike.handle]?.description) return window.BIKE_DATA[bike.handle];
  if (window.CL_LS.enrichCache?.[bike.handle]) return window.CL_LS.enrichCache[bike.handle];

  try {
    const qs = new URLSearchParams({
      name:  bike.name  || bike.handle,
      brand: (bike.brand || bike.vendor || bike.name?.split(' ')[0] || ''),
      type:  bike.type  || bike.department || '',
      price: Math.round(bike.price || 0),
      dept:  bike.department || '',
    });
    const res  = await fetch(`${window.CL_LS.workerUrl}/api/enrich/${encodeURIComponent(bike.handle)}?${qs}`);
    const data = await res.json();
    if (data.description) {
      window.CL_LS.enrichCache = window.CL_LS.enrichCache || {};
      window.CL_LS.enrichCache[bike.handle] = data;
      console.log(`[ChainLine] Enriched: ${bike.handle} (${res.headers.get('X-Cache') || 'generated'})`);
    }
    return data;
  } catch(e) {
    console.warn('[ChainLine] Enrich failed:', e.message);
    return null;
  }
};

// ── Init: load bikes directly from /api/bikes ────────────────
window.lightspeedReady = (async () => {
  try {
    const [bikeRes, imgRes] = await Promise.all([
      fetch(`${window.CL_LS.workerUrl}/api/bikes`),
      fetch(`${window.CL_LS.workerUrl}/api/shopify-images`),
    ]);
    const [bikeData, imgData] = await Promise.all([bikeRes.json(), imgRes.json()]);

    if (imgData && !imgData.error) {
      window.CL_LS.skuImageMap = imgData;
      console.log(`[ChainLine] Shopify images loaded: ${Object.keys(imgData).length} SKUs`);
    }

    if (bikeData.bikes && bikeData.bikes.length > 0) {
      window.CL_LS.bikes  = bikeData.bikes;
      window.CL_LS.loaded = true;
      console.log(`[ChainLine] Lightspeed bikes loaded: ${bikeData.count} bikes with stock data`);
      window.dispatchEvent(new CustomEvent('lightspeed:ready', { detail: { count: bikeData.count } }));

      // Auto-enrich any bikes not in the static BIKE_DATA catalogue (fire-and-forget)
      const unknown = bikeData.bikes.filter(b => b.handle && !window.BIKE_DATA?.[b.handle]);
      if (unknown.length > 0) {
        console.log(`[ChainLine] Auto-enriching ${unknown.length} new bikes…`);
        // Stagger requests so we don't hammer the AI endpoint
        for (let i = 0; i < unknown.length; i++) {
          setTimeout(() => window.enrichBike(unknown[i]), i * 800);
        }
      }
    }
    // Also load first page of all products for parts/search in background
    const first = await window.lightspeedFetch({ limit: 100 });
    if (first && first.items) {
      window.CL_LS.products    = first.items;
      window.CL_LS.departments = first.departments || [];
      window.CL_LS.total       = first.total;
    }
  } catch(err) {
    console.warn('[ChainLine] Lightspeed unavailable:', err.message);
  }
})();
