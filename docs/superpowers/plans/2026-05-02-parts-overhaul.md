# Parts & Accessories Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Parts & Accessories into an image-first, Amazon-style browsing experience with per-SKU product images, brand/price filters, and clickable part detail pages with AI-enriched descriptions.

**Architecture:** Worker gains a `manufacturer` field on all parts responses plus a new `/api/part/:sku` endpoint that checks KV `part:{sku}` before running Workers AI. Frontend gains `parts-data.js` for image resolution, filter state in `PartsPage`, and a new `PartPage` component mirroring the `BikePage` pattern.

**Tech Stack:** Cloudflare Worker (no npm), Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`), KV (`BIKE_DATA` namespace), React + Babel standalone, plain JS scripts

**Current script versions (index.html):**
- `bike-data.js?v=12`, `lightspeed.js?v=6`
- `components.jsx?v=39`, `pages.jsx?v=47`, `app.jsx?v=30`

---

## Task 1: Worker — add `manufacturer` field to parts responses

**Files:**
- Modify: `/Users/taocaruso/chainline-worker/worker.js` (lines ~1109–1169, the `/api/parts` handler)

The `formatItem` function at line 149 returns `{ id, name, sku, price, category, department, archived, qty, inStock, image }`. It doesn't include the manufacturer name. We need to add it so the frontend can build brand filters.

- [ ] **Step 1: Add `manufacturer` to `formatItem`**

Find the `formatItem` function at line ~149 and add `manufacturer` to its return:

```js
function formatItem(item, catMap, deptMap) {
  const prices = toArr(item.Prices?.ItemPrice);
  const price  = parseFloat(prices.find(p => p.useType === 'Default')?.amount || prices[0]?.amount || '0');
  const shops  = toArr(item.ItemShops?.ItemShop).filter(s => s.shopID !== '0');
  const qty    = shops.reduce((sum, s) => sum + parseInt(s.qoh || '0', 10), 0);
  const imgs   = toArr(item.Images?.Image);
  const image  = imgs[0]?.baseImageURL || imgs[0]?.thumbURL || null;
  // Manufacturer name from the Lightspeed relation (added to load_relations below)
  const manufacturer = item.Manufacturer?.name || '';
  return {
    id:           item.itemID,
    name:         item.description || '',
    sku:          item.systemSku || item.customSku || '',
    price,
    category:     catMap?.[item.categoryID]  || '',
    department:   deptMap?.[item.departmentID] || '',
    archived:     item.archived === 'true',
    qty,
    inStock:      qty > 0,
    image,
    manufacturer,
  };
}
```

- [ ] **Step 2: Add `Manufacturer` to the load_relations in `/api/parts` handler**

Find the `itemUrl` construction around line 1158:

```js
// BEFORE:
const itemUrl = `${API(env.LS_ACCOUNT_ID)}/Item.json?load_relations=%5B%22ItemShops%22%2C%22Images%22%5D&limit=200&departmentID=${deptId}&archived=false`;

// AFTER:
const itemUrl = `${API(env.LS_ACCOUNT_ID)}/Item.json?load_relations=%5B%22ItemShops%22%2C%22Images%22%2C%22Manufacturer%22%5D&limit=200&departmentID=${deptId}&archived=false`;
```

- [ ] **Step 3: Deploy the worker**

```bash
cd ~/chainline-worker
WRANGLER=/Users/taocaruso/imessage-ai/venv/lib/python3.12/site-packages/playwright/driver/node
$WRANGLER /usr/local/bin/wrangler deploy 2>/dev/null || bash deploy.sh
```

If wrangler isn't on PATH, use the curl deploy. First get a fresh CF token at `dash.cloudflare.com/profile/api-tokens`:

```bash
CF_TOKEN="YOUR_FRESH_TOKEN"
curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/8c3d9e51212aa8c7a1ad6ea8edd23d8b/workers/scripts/still-term-f1ec" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -F 'metadata={"main_module":"worker.js","bindings":[{"name":"BIKE_DATA","type":"kv_namespace","namespace_id":"7aa6d57f045b472c960dbaa9f069cb9f"},{"name":"AI","type":"ai"},{"name":"ASSETS","type":"r2_bucket","bucket_name":"chainline-assets"}]};type=application/json' \
  -F "worker.js=@/Users/taocaruso/chainline-worker/worker.js;type=application/javascript+module" \
  | jq '.success'
```

Expected: `true`

- [ ] **Step 4: Verify `manufacturer` field appears**

```bash
curl -s "https://still-term-f1ec.taocaruso77.workers.dev/api/parts?tab=drivetrain" | python3 -c "import sys,json; items=json.load(sys.stdin)['items']; print([i.get('manufacturer','MISSING') for i in items[:5]])"
```

Expected: list of brand names like `['SRAM', 'Shimano', '', 'SRAM', 'Maxxis']` — some may be empty if Lightspeed has no manufacturer set on that SKU.

- [ ] **Step 5: Commit**

```bash
cd ~/chainline-worker
git add worker.js 2>/dev/null || true
git commit -m "feat: add manufacturer field to parts API response" 2>/dev/null || echo "worker has no git, skipping"
```

---

## Task 2: Worker — `GET /api/part/:sku` endpoint with AI enrichment

**Files:**
- Modify: `/Users/taocaruso/chainline-worker/worker.js` — add handler after the `/api/parts` block (~line 1169)

This endpoint serves the `PartPage`. It: (1) checks KV `part:{sku}`, (2) fetches item from Lightspeed by systemSku, (3) runs Workers AI for description+specs, (4) caches result in KV for 90 days.

- [ ] **Step 1: Add the handler**

Insert this block after the closing `}` of the `/api/parts` handler (~line 1170):

```js
      // ── GET /api/part/:sku ── single part detail with AI enrichment
      if (url.pathname.startsWith('/api/part/') && request.method === 'GET') {
        const sku = decodeURIComponent(url.pathname.replace('/api/part/', '').trim());
        if (!sku) return new Response(JSON.stringify({ error: 'Missing SKU' }), { status: 400, headers: h });

        // Serve from KV if cached
        const kvKey = `part:${sku}`;
        if (env.BIKE_DATA) {
          const cached = await env.BIKE_DATA.get(kvKey, 'json');
          if (cached) return new Response(JSON.stringify(cached), { headers: { ...h, 'X-Cache': 'HIT' } });
        }

        // Fetch item from Lightspeed by systemSku
        const token = await getToken(env);
        const [deptData, catData] = await Promise.all([
          lsGet('Department.json?limit=200', env),
          lsGet('Category.json?limit=200', env),
        ]);
        const deptMap = Object.fromEntries(toArr(deptData.Department).map(d => [d.departmentID, d.name]));
        const catMap  = Object.fromEntries(toArr(catData.Category).map(c => [c.categoryID, c.name]));

        const itemRes = await fetch(
          `${API(env.LS_ACCOUNT_ID)}/Item.json?systemSku=${encodeURIComponent(sku)}&load_relations=%5B%22ItemShops%22%2C%22Images%22%2C%22Manufacturer%22%5D&limit=5`,
          { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
        );
        if (!itemRes.ok) return new Response(JSON.stringify({ error: 'Lightspeed error' }), { status: 502, headers: h });
        const itemData = await itemRes.json();
        const raw = toArr(itemData.Item)[0];
        if (!raw) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers: h });

        const item = formatItem(raw, catMap, deptMap);
        const manufacturer = raw.Manufacturer?.name || '';

        // AI enrichment
        let enrichment = { summary: '', specs: {}, compatibility: '' };
        if (env.AI && item.name) {
          const prompt = `You are a bike shop parts expert. Product: "${item.name}" by ${manufacturer || 'unknown brand'}. Department: ${item.department}.

Reply with ONLY valid JSON — no markdown, no backticks:
{
  "summary": "1-2 sentences: what this part does, who it suits, what makes it notable",
  "specs": { "key": "value" },
  "compatibility": "brief compatibility note (drivetrain gen, brake standard, etc)"
}

Extract specs from the product name — e.g. speed count, gear range, weight, interface standard, material, size. Only include specs clearly implied by the name. Max 60 words for summary.`;

          try {
            const aiRes = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 400,
            });
            const raw = typeof aiRes === 'string' ? aiRes
              : typeof aiRes?.response === 'string' ? aiRes.response
              : typeof aiRes?.response === 'object' ? JSON.stringify(aiRes.response)
              : (aiRes?.choices?.[0]?.message?.content || '');
            const m = (raw || '').match(/\{[\s\S]*\}/);
            if (m) {
              const cleaned = m[0].replace(/\\'/g, "'").replace(/,(\s*[}\]])/g, '$1');
              try {
                const parsed = JSON.parse(cleaned);
                enrichment.summary       = parsed.summary       || '';
                enrichment.specs         = parsed.specs         || {};
                enrichment.compatibility = parsed.compatibility || '';
              } catch {}
            }
          } catch(e) { enrichment.aiError = e.message; }
        }

        const result = { item: { ...item, manufacturer }, enrichment, sku, cached: false, timestamp: new Date().toISOString().slice(0,10) };

        // Cache for 90 days
        if (env.BIKE_DATA) {
          await env.BIKE_DATA.put(kvKey, JSON.stringify(result), { expirationTtl: 60 * 60 * 24 * 90 });
        }

        return new Response(JSON.stringify(result), { headers: h });
      }
```

- [ ] **Step 2: Deploy worker** (same command as Task 1 Step 3)

- [ ] **Step 3: Test the endpoint**

```bash
# Use a real SKU from your inventory — get one first:
curl -s "https://still-term-f1ec.taocaruso77.workers.dev/api/parts?tab=drivetrain" | python3 -c "import sys,json; items=json.load(sys.stdin)['items']; print(items[0]['sku'], items[0]['name'])"
# Then test the endpoint with that SKU:
curl -s "https://still-term-f1ec.taocaruso77.workers.dev/api/part/SKU_FROM_ABOVE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['item']['name']); print(d['enrichment']['summary'][:100])"
```

Expected: item name prints, followed by 1-2 sentence AI description of the part.

---

## Task 3: Worker — `POST /api/prewarm-parts` endpoint

**Files:**
- Modify: `/Users/taocaruso/chainline-worker/worker.js` — add handler after Task 2's block

- [ ] **Step 1: Add the prewarm-parts handler**

Insert after the `GET /api/part/:sku` block:

```js
      // ── POST /api/prewarm-parts ── batch KV warm for all parts
      if (url.pathname === '/api/prewarm-parts' && request.method === 'POST') {
        const secret = request.headers.get('x-prewarm-secret') || url.searchParams.get('secret');
        if (secret !== env.R2_UPLOAD_SECRET) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: h });

        const ALL_TABS = ['drivetrain','brakes','wheels','cockpit','suspension','helmets','protection','shoes','clothing','tools','bags','lights','locks','racks'];
        const workerUrl = `https://still-term-f1ec.taocaruso77.workers.dev`;

        ctx.waitUntil((async () => {
          let total = 0, warmed = 0, skipped = 0;
          for (const tab of ALL_TABS) {
            try {
              const res  = await fetch(`${workerUrl}/api/parts?tab=${tab}`);
              const data = await res.json();
              const items = data.items || [];
              for (const item of items) {
                if (!item.sku) continue;
                total++;
                const existing = await env.BIKE_DATA.get(`part:${item.sku}`, 'json');
                if (existing) { skipped++; continue; }
                await fetch(`${workerUrl}/api/part/${encodeURIComponent(item.sku)}`);
                warmed++;
                await new Promise(r => setTimeout(r, 150)); // rate limit AI calls
              }
            } catch(e) { console.error(`prewarm-parts tab ${tab}:`, e.message); }
          }
          console.log(`[prewarm-parts] ${total} SKUs — ${warmed} warmed, ${skipped} already cached`);
        })());

        return new Response(JSON.stringify({ status: 'started', message: 'Prewarming all part SKUs in background' }), { headers: h });
      }
```

- [ ] **Step 2: Deploy worker** (same curl command as Task 1 Step 3)

- [ ] **Step 3: Commit worker changes**

```bash
cd ~/chainline-worker
git add worker.js 2>/dev/null || true
git commit -m "feat: add /api/part/:sku enrichment and /api/prewarm-parts endpoints" 2>/dev/null || echo "no git in worker dir, fine"
```

---

## Task 4: Create `parts-data.js` — image resolution with brand CDN + R2 overrides

**Files:**
- Create: `/Users/taocaruso/chainline-website/parts-data.js`

This file extends the existing `resolvePartImg` in pages.jsx. It runs first via the `window.resolvePartImg` override. Resolution order: R2 override → brand CDN → proxy → (falls through to pages.jsx pattern matching).

- [ ] **Step 1: Create the file**

```js
// parts-data.js — per-SKU image resolution
// Extends resolvePartImg in pages.jsx. Resolution chain:
// 1. PART_R2_OVERRIDES — explicit R2 URLs for manually-uploaded images
// 2. BRAND_CDN_MAP — auto-construct URL from brand + product name
// 3. Falls through to pages.jsx ITEM_IMG_PATTERNS + DEPT_IMG

const _R2 = 'https://still-term-f1ec.taocaruso77.workers.dev/r2';
const _PROXY = 'https://still-term-f1ec.taocaruso77.workers.dev/api/img?url=';

// Explicit R2 overrides — keyed by slugified product name prefix
// Pattern: slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
// Add entries here as images are uploaded to R2 under parts/
const PART_R2_OVERRIDES = {
  // Drivetrain
  // 'sram-xx-sl-eagle-transmission-cassette': `${_R2}/parts/sram-eagle-cassette.jpg`,
  // 'shimano-deore-xt-cassette':              `${_R2}/parts/shimano-xt-cassette.jpg`,

  // Helmets
  // 'giro-montaro-mips':   `${_R2}/parts/giro-montaro.jpg`,
  // 'smith-forefront-2':   `${_R2}/parts/smith-forefront.jpg`,
  // 'fox-speedframe-mips': `${_R2}/parts/fox-speedframe.jpg`,

  // Tires
  // 'maxxis-minion-dhf': `${_R2}/parts/maxxis-minion-dhf.jpg`,
  // 'maxxis-aggressor':  `${_R2}/parts/maxxis-aggressor.jpg`,
};

// Brand CDN URL builders — return null if URL can't be constructed
// Add brands here as CDN patterns are verified with curl -I
const BRAND_CDN_MAP = {
  // Maxxis uses Shopify CDN — works direct (no hotlink block confirmed)
  // Can't auto-construct URLs from product name alone — paths are UUID-based
  // Leave as null; ITEM_IMG_PATTERNS handles Maxxis by name regex

  // Future: add brands with predictable CDN URL patterns here
  // e.g. brand: (item) => `https://cdn.brand.com/products/${slugify(item.name)}.jpg`
};

function _slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Override window.resolvePartImg — called by PartCard before pages.jsx fallback
window.resolvePartImg = function(item, tab) {
  const slug = _slugify(item.name || '');
  const brand = (item.manufacturer || '').toLowerCase();

  // 1. Exact R2 override
  for (const key of Object.keys(PART_R2_OVERRIDES)) {
    if (slug.startsWith(key) || slug === key) return PART_R2_OVERRIDES[key];
  }

  // 2. Brand CDN
  if (brand && BRAND_CDN_MAP[brand]) {
    const url = BRAND_CDN_MAP[brand](item);
    if (url) return url;
  }

  // 3. Fall through — pages.jsx resolvePartImg handles ITEM_IMG_PATTERNS + DEPT_IMG
  return null;
};

window.PART_R2_OVERRIDES = PART_R2_OVERRIDES;
window.BRAND_CDN_MAP = BRAND_CDN_MAP;
```

- [ ] **Step 2: Add script tag to index.html after `bike-data.js`**

In `/Users/taocaruso/chainline-website/index.html`, after the line:
```html
<script src="/bike-data.js?v=12"></script>
```
Add:
```html
<script src="/parts-data.js?v=1"></script>
```

- [ ] **Step 3: Commit**

```bash
cd ~/chainline-website
git pull --rebase origin main
git add parts-data.js index.html
git commit -m "feat: add parts-data.js image resolution foundation"
git push origin main
```

---

## Task 5: Update `PartRow` → `PartCard` — image-first dense card, clickable

**Files:**
- Modify: `/Users/taocaruso/chainline-website/pages.jsx` (lines ~2648–2687, the `PartRow` component)

The card gets a click handler to navigate to PartPage, and uses `window.resolvePartImg` before falling back to the existing local `resolvePartImg`.

- [ ] **Step 1: Replace the `PartRow` component**

Find the comment `// ── PartRow` at line ~2648 and replace the entire component (through the closing `});` at ~2687):

```jsx
// ── PartCard (replaces PartRow) ───────────────────────────────────────────
const PartCard = React.memo(({ item, tabId, tabEmoji }) => {
  const [imgSrc, setImgSrc] = React.useState(() => {
    // Resolution chain: parts-data.js override → local ITEM_IMG_PATTERNS → DEPT_IMG
    if (item.image) return item.image;
    if (window.resolvePartImg) {
      const fromParts = window.resolvePartImg(item, tabId);
      if (fromParts) return fromParts;
    }
    return resolvePartImg(item.name, item.department) || null;
  });
  const [imgFailed, setImgFailed] = React.useState(false);
  const [proxyTried, setProxyTried] = React.useState(false);

  const price    = item.price > 0 ? `$${item.price % 1 === 0 ? item.price : item.price.toFixed(2)}` : null;
  const lowStock = item.qty > 0 && item.qty <= 5;
  const deptKey  = (item.department || '').toLowerCase();
  const emoji    = DEPT_EMOJI[deptKey] || tabEmoji || '⚙️';
  const brand    = item.manufacturer || '';

  const handleImgError = () => {
    // Try proxying the URL once before giving up
    if (!proxyTried && imgSrc && !imgSrc.includes('/api/img')) {
      setProxyTried(true);
      setImgSrc(`https://still-term-f1ec.taocaruso77.workers.dev/api/img?url=${encodeURIComponent(imgSrc)}`);
    } else {
      setImgFailed(true);
    }
  };

  const handleClick = () => {
    if (item.sku) window.cl.go('part', { sku: item.sku, tab: tabId });
  };

  return (
    <div className="part-card" onClick={handleClick}
      style={{ display:'flex', flexDirection:'column', background:'var(--white)', border:'1px solid var(--hairline)', cursor:'pointer', transition:'box-shadow .15s, border-color .15s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor='var(--gray-300)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='var(--hairline)'; }}>
      {/* Image */}
      <div className="part-card-img" style={{ aspectRatio:'1', background:'#d4d0cb', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
        {imgSrc && !imgFailed
          ? <img src={imgSrc} alt={item.name} loading="lazy" decoding="async"
              style={{ width:'100%', height:'100%', objectFit:'contain', padding:'12%', mixBlendMode:'multiply' }}
              onError={handleImgError} />
          : <span style={{ fontSize:36, opacity:0.2 }}>{emoji}</span>}
        {lowStock && <span style={{ position:'absolute', top:6, right:6, background:'#c2410c', color:'#fff', fontFamily:'var(--mono)', fontSize:8, letterSpacing:'.1em', textTransform:'uppercase', padding:'2px 6px', fontWeight:600 }}>Only {item.qty} left</span>}
      </div>
      {/* Info */}
      <div style={{ padding:'10px 12px 10px', flex:1, display:'flex', flexDirection:'column', gap:4 }}>
        {brand && <div style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--gray-400)' }}>{brand}</div>}
        <div style={{ fontFamily:'var(--display)', fontSize:12, fontWeight:500, textTransform:'uppercase', letterSpacing:'-.01em', lineHeight:1.25, color:'var(--black)', flex:1,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.name}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
          {price && <span style={{ fontFamily:'var(--display)', fontSize:14, fontWeight:700, color:'var(--black)' }}>{price}</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background: lowStock ? '#c2410c' : 'var(--stock-green)', flexShrink:0 }} />
          <span style={{ fontFamily:'var(--mono)', fontSize:8, letterSpacing:'.1em', textTransform:'uppercase', color: lowStock ? '#c2410c' : 'var(--stock-green)' }}>
            {lowStock ? `${item.qty} left` : 'In Stock'}
          </span>
        </div>
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Replace all `PartRow` usages with `PartCard` in `PartsPage`**

In `PartsPage` (lines ~3000–3025), find every `<PartRow` and replace with `<PartCard`:

```jsx
// BEFORE (3 occurrences):
<PartRow key={item.id || item.sku || item.name} item={item} tabEmoji={activeTab.emoji} />

// AFTER — add tabId prop:
<PartCard key={item.id || item.sku || item.name} item={item} tabId={safeCat} tabEmoji={activeTab.emoji} />
```

Also find the `AllShopPage` and `GearHScroll` usages around line ~3922:
```jsx
// BEFORE:
<PartRow key={i} item={item} />
// AFTER:
<PartCard key={i} item={item} tabId={tab} tabEmoji={tabEmoji(tab)} />
```

- [ ] **Step 3: Update the grid column definition for denser layout**

Find both occurrences of `gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))"` in `PartsPage` and change to `minmax(140px,1fr)`:

```jsx
// BEFORE:
gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))"
// AFTER:
gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))"
```

- [ ] **Step 4: Bump pages.jsx version in index.html**

Change `pages.jsx?v=47` to `pages.jsx?v=48` in `/Users/taocaruso/chainline-website/index.html`.

- [ ] **Step 5: Commit and push**

```bash
cd ~/chainline-website
git pull --rebase origin main
git add pages.jsx index.html
git commit -m "feat: PartCard — image-first dense card with click navigation"
git push origin main
```

- [ ] **Step 6: Verify in browser**

Open `https://chainline-website.pages.dev/components` (after deploy ~1min). Parts should show as clickable image-first cards. Clicking a card should navigate to `/part/SKU` (404 for now — PartPage added in Task 8).

---

## Task 6: Add filter state and filter logic to `PartsPage`

**Files:**
- Modify: `/Users/taocaruso/chainline-website/pages.jsx` — `PartsPage` component (~line 2717)

Add `filterBrands`, `priceRange`, `sortBy` state. Extend `filtered` useMemo to apply them. Extend search to include `manufacturer` field.

- [ ] **Step 1: Add filter state to `PartsPage`**

After the `const [pg, setPg] = React.useState(0);` line (~2738), add:

```jsx
const [filterBrands, setFilterBrands] = React.useState(new Set());
const [priceRange,   setPriceRange]   = React.useState(null); // null|'<50'|'50-150'|'150-300'|'300+'
const [sortBy,       setSortBy]       = React.useState('price-asc');
```

- [ ] **Step 2: Add a filter-reset helper**

After the state declarations, add:

```jsx
const clearFilters = () => { setFilterBrands(new Set()); setPriceRange(null); setSortBy('price-asc'); };
const hasFilters = filterBrands.size > 0 || priceRange !== null || sortBy !== 'price-asc';
```

- [ ] **Step 3: Reset filters when tab changes**

Update `switchCat` to also clear filters:

```jsx
// BEFORE:
const switchCat = (id) => { setCat(remapTab(id)); setSearch(''); setPg(0); window.scrollTo({ top:0, behavior:'smooth' }); };
// AFTER:
const switchCat = (id) => { setCat(remapTab(id)); setSearch(''); setPg(0); clearFilters(); window.scrollTo({ top:0, behavior:'smooth' }); };
```

- [ ] **Step 4: Build available brands from loaded items**

After `const activeTab = ...` line (~2757), add:

```jsx
const availableBrands = React.useMemo(() => {
  const brands = [...new Set(items.map(i => i.manufacturer).filter(Boolean))].sort();
  return brands;
}, [items]);
```

- [ ] **Step 5: Update `filtered` useMemo to apply filters**

Replace the existing `filtered` useMemo (~lines 2759–2770) with:

```jsx
const filtered = React.useMemo(() => {
  // 1. Search filter (also searches manufacturer now)
  let pool = items;
  const q = search.trim();
  if (q.length >= 2) {
    const tabPool = items.filter(p => {
      const hay = [p.name, p.department, p.sku, p.manufacturer].filter(Boolean).join(' ');
      return window.fuzzyMatch ? window.fuzzyMatch(q, hay) : hay.toLowerCase().includes(q.toLowerCase());
    });
    if (tabPool.length > 0) {
      pool = tabPool;
    } else {
      const globalPool = (window.lightspeedSearch?.(q) || [])
        .filter(p => !['labour','food','shop use','consignments','bikes'].some(x => (p.department||'').toLowerCase().includes(x)));
      pool = globalPool;
    }
  }

  // 2. Brand filter
  if (filterBrands.size > 0) {
    pool = pool.filter(p => p.manufacturer && filterBrands.has(p.manufacturer));
  }

  // 3. Price range filter
  if (priceRange) {
    pool = pool.filter(p => {
      const pr = p.price || 0;
      if (priceRange === '<50')    return pr < 50;
      if (priceRange === '50-150') return pr >= 50 && pr <= 150;
      if (priceRange === '150-300') return pr > 150 && pr <= 300;
      if (priceRange === '300+')   return pr > 300;
      return true;
    });
  }

  // 4. Sort
  return [...pool].sort((a, b) => {
    if (sortBy === 'price-asc')  return (a.price||0) - (b.price||0);
    if (sortBy === 'price-desc') return (b.price||0) - (a.price||0);
    if (sortBy === 'name-az')    return (a.name||'').localeCompare(b.name||'');
    return (a.price||0) - (b.price||0);
  });
}, [items, search, filterBrands, priceRange, sortBy]);
```

- [ ] **Step 6: Update `searchIsGlobal` check** (it depends on filtered/items relationship)

The existing check at ~line 2772 uses `!items.some(p => filtered.includes(p))` which still works since global search replaces `pool` before filters. No change needed.

- [ ] **Step 7: Bump pages.jsx version**

Change `pages.jsx?v=48` to `pages.jsx?v=49` in index.html.

- [ ] **Step 8: Commit and push**

```bash
cd ~/chainline-website
git pull --rebase origin main
git add pages.jsx index.html
git commit -m "feat: add brand/price/sort filter state to PartsPage"
git push origin main
```

---

## Task 7: Add filter UI to the desktop sidebar

**Files:**
- Modify: `/Users/taocaruso/chainline-website/pages.jsx` — `PartsPage` sidebar render (~lines 2888–2935)

Add brand checkboxes, price buckets, and sort options below the existing category tree in the sidebar.

- [ ] **Step 1: Add filter UI at the bottom of the sidebar `<div className="parts-sidebar">`**

Find the closing `<div style={{ margin:"16px 16px 0" ...` block near line 2932 and insert the filter section BEFORE it:

```jsx
{/* ── Filter section ── */}
{availableBrands.length > 0 && (
  <div style={{ padding:'12px 16px 0', borderTop:'1px solid var(--hairline)', marginTop:8 }}>
    {hasFilters && (
      <button onClick={clearFilters} data-cursor="link"
        style={{ fontFamily:'var(--mono)', fontSize:8, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--black)', background:'none', border:'1px solid var(--hairline)', padding:'4px 8px', cursor:'pointer', marginBottom:10, width:'100%' }}>
        Clear all filters ✕
      </button>
    )}
    {/* Brand filter */}
    <div style={{ fontFamily:'var(--mono)', fontSize:8, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:6 }}>Brand</div>
    {availableBrands.map(brand => (
      <label key={brand} style={{ display:'flex', alignItems:'center', gap:7, padding:'3px 0', cursor:'pointer' }}>
        <input type="checkbox" checked={filterBrands.has(brand)}
          onChange={e => {
            setFilterBrands(prev => {
              const next = new Set(prev);
              e.target.checked ? next.add(brand) : next.delete(brand);
              return next;
            });
            setPg(0);
          }}
          style={{ accentColor:'var(--black)', width:11, height:11, cursor:'pointer' }} />
        <span style={{ fontFamily:'var(--mono)', fontSize:9, color: filterBrands.has(brand) ? 'var(--black)' : 'var(--gray-500)', letterSpacing:'.04em' }}>{brand}</span>
      </label>
    ))}
    {/* Price filter */}
    <div style={{ fontFamily:'var(--mono)', fontSize:8, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--gray-400)', marginTop:12, marginBottom:6 }}>Price</div>
    {[['<50','Under $50'],['50-150','$50 – $150'],['150-300','$150 – $300'],['300+','$300+']].map(([val, label]) => (
      <label key={val} style={{ display:'flex', alignItems:'center', gap:7, padding:'3px 0', cursor:'pointer' }}>
        <input type="checkbox" checked={priceRange === val}
          onChange={e => { setPriceRange(e.target.checked ? val : null); setPg(0); }}
          style={{ accentColor:'var(--black)', width:11, height:11, cursor:'pointer' }} />
        <span style={{ fontFamily:'var(--mono)', fontSize:9, color: priceRange === val ? 'var(--black)' : 'var(--gray-500)', letterSpacing:'.04em' }}>{label}</span>
      </label>
    ))}
    {/* Sort */}
    <div style={{ fontFamily:'var(--mono)', fontSize:8, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--gray-400)', marginTop:12, marginBottom:6 }}>Sort</div>
    {[['price-asc','Price: Low → High'],['price-desc','Price: High → Low'],['name-az','Name A–Z']].map(([val, label]) => (
      <label key={val} style={{ display:'flex', alignItems:'center', gap:7, padding:'3px 0', cursor:'pointer' }}>
        <input type="radio" name="parts-sort" checked={sortBy === val}
          onChange={() => { setSortBy(val); setPg(0); }}
          style={{ accentColor:'var(--black)', width:11, height:11, cursor:'pointer' }} />
        <span style={{ fontFamily:'var(--mono)', fontSize:9, color: sortBy === val ? 'var(--black)' : 'var(--gray-500)', letterSpacing:'.04em' }}>{label}</span>
      </label>
    ))}
  </div>
)}
```

- [ ] **Step 2: Bump pages.jsx version**

Change `pages.jsx?v=49` to `pages.jsx?v=50` in index.html.

- [ ] **Step 3: Commit and push**

```bash
cd ~/chainline-website
git pull --rebase origin main
git add pages.jsx index.html
git commit -m "feat: add brand/price/sort filter UI to parts sidebar"
git push origin main
```

- [ ] **Step 4: Verify**

Open `/components` in the browser. Load the Drivetrain tab. The sidebar should now show a "Brand" section with checkboxes (SRAM, Shimano, etc.) auto-populated from the loaded data. Checking SRAM should filter the grid. The "Clear all filters" button appears when any filter is active.

---

## Task 8: Add mobile filter chip strip

**Files:**
- Modify: `/Users/taocaruso/chainline-website/pages.jsx` — `PartsPage` render, the search bar section (~line 2870)

The mobile chip strip sits between the search bar and the parts-layout grid. On mobile (≤768px), it replaces the sidebar filters. It shares the same filter state from Task 6.

- [ ] **Step 1: Add the chip strip after the search bar div, before `<div className="parts-layout">`**

Find `<div className="parts-layout">` (~line 2885) and insert this block immediately before it:

```jsx
{/* Mobile filter chips — hidden on desktop via CSS (.parts-filter-chips) */}
{availableBrands.length > 0 && (
  <div className="parts-filter-chips">
    {/* Row 1: Brand chips */}
    <div className="parts-filter-row">
      <button onClick={() => { setFilterBrands(new Set()); setPg(0); }}
        className={'parts-filter-chip' + (filterBrands.size === 0 ? ' active' : '')}>All</button>
      {availableBrands.map(brand => (
        <button key={brand} onClick={() => {
          setFilterBrands(prev => {
            const next = new Set(prev);
            next.has(brand) ? next.delete(brand) : next.add(brand);
            return next;
          });
          setPg(0);
        }} className={'parts-filter-chip' + (filterBrands.has(brand) ? ' active' : '')}>
          {brand}{filterBrands.has(brand) ? ' ✕' : ''}
        </button>
      ))}
    </div>
    {/* Row 2: Price + Sort */}
    <div className="parts-filter-row">
      {[['<50','<$50'],['50-150','$50–$150'],['150-300','$150–$300'],['300+','$300+']].map(([val, label]) => (
        <button key={val} onClick={() => { setPriceRange(prev => prev === val ? null : val); setPg(0); }}
          className={'parts-filter-chip' + (priceRange === val ? ' active' : '')}>
          {label}{priceRange === val ? ' ✕' : ''}
        </button>
      ))}
      <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPg(0); }}
        className="parts-sort-select">
        <option value="price-asc">Price ↑</option>
        <option value="price-desc">Price ↓</option>
        <option value="name-az">A–Z</option>
      </select>
    </div>
  </div>
)}
```

- [ ] **Step 2: Add CSS for the chip strip in `styles.css`**

Find the `.parts-mobile-tabs` block in `/Users/taocaruso/chainline-website/styles.css` and add after it:

```css
/* ── Parts filter chips (mobile only) ── */
.parts-filter-chips {
  display: none;
  flex-direction: column;
  gap: 0;
  background: var(--white);
  border-bottom: 1px solid var(--hairline);
}
.parts-filter-row {
  display: flex;
  gap: 6px;
  padding: 6px 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.parts-filter-row::-webkit-scrollbar { display: none; }
.parts-filter-chip {
  flex-shrink: 0;
  padding: 5px 10px;
  border: 1px solid var(--hairline);
  border-radius: 20px;
  background: var(--white);
  color: var(--gray-500);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .06em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  transition: all .1s;
}
.parts-filter-chip.active {
  background: var(--black);
  color: var(--white);
  border-color: var(--black);
}
.parts-sort-select {
  flex-shrink: 0;
  padding: 5px 8px;
  border: 1px solid var(--hairline);
  border-radius: 4px;
  background: var(--white);
  font-family: var(--mono);
  font-size: 10px;
  color: var(--gray-500);
  cursor: pointer;
}
@media (max-width: 768px) {
  .parts-filter-chips { display: flex; }
}
[data-theme="dark"] .parts-filter-chip { background: var(--paper); color: var(--gray-300); border-color: var(--hairline); }
[data-theme="dark"] .parts-filter-chip.active { background: var(--white); color: var(--black); }
[data-theme="dark"] .parts-sort-select { background: var(--paper); color: var(--gray-300); }
```

- [ ] **Step 3: Bump pages.jsx version**

Change `pages.jsx?v=50` to `pages.jsx?v=51` in index.html.

- [ ] **Step 4: Commit and push**

```bash
cd ~/chainline-website
git pull --rebase origin main
git add pages.jsx styles.css index.html
git commit -m "feat: add mobile filter chip strip for brand/price/sort"
git push origin main
```

---

## Task 9: Add `PartPage` component

**Files:**
- Modify: `/Users/taocaruso/chainline-website/pages.jsx` — add `PartPage` after `PartCard` component

`PartPage` mirrors `BikePage`. It fetches `/api/part/:sku`, shows product image with warm gray + multiply blend, AI description, specs grid, related items scroller, and CTAs.

- [ ] **Step 1: Add `PartPage` component**

Find the `// ── PartsPage` comment (~line 2713) and insert `PartPage` BEFORE it.

**Critical:** ALL React hooks must be called BEFORE any conditional early returns (Rules of Hooks). `imgSrc` resets via `useEffect` when `data` loads.

```jsx
// ── PartPage ──────────────────────────────────────────────────────────────
const PartPage = ({ sku, returnTab }) => {
  // ALL hooks first — no exceptions (Rules of Hooks)
  const [data,       setData]       = React.useState(null);
  const [loading,    setLoading]    = React.useState(true);
  const [imgSrc,     setImgSrc]     = React.useState(null);
  const [imgErr,     setImgErr]     = React.useState(false);
  const [proxyTried, setProxyTried] = React.useState(false);
  const tabId = returnTab || 'components';
  const { items: relatedItems } = useTabInventory(tabId);

  React.useEffect(() => {
    if (!sku) return;
    setLoading(true);
    setData(null);
    fetch(`https://still-term-f1ec.taocaruso77.workers.dev/api/part/${encodeURIComponent(sku)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sku]);

  // Reset image state when data loads (also handles sku changes)
  React.useEffect(() => {
    if (!data?.item) return;
    const it = data.item;
    setImgErr(false);
    setProxyTried(false);
    if (it.image) { setImgSrc(it.image); return; }
    if (window.resolvePartImg) {
      const p = window.resolvePartImg(it, tabId);
      if (p) { setImgSrc(p); return; }
    }
    setImgSrc(resolvePartImg(it.name, it.department) || null);
  }, [data]);

  const handleBack = () => window.cl.go(returnTab || 'components', returnTab ? { tab: returnTab } : null);
  const handleImgError = () => {
    if (!proxyTried && imgSrc && !imgSrc.includes('/api/img')) {
      setProxyTried(true);
      setImgSrc(`https://still-term-f1ec.taocaruso77.workers.dev/api/img?url=${encodeURIComponent(imgSrc)}`);
    } else { setImgErr(true); }
  };

  // Early returns after all hooks
  if (loading) return (
    <div className="page-fade" style={{ paddingTop:136, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--gray-400)' }}>Loading…</span>
    </div>
  );

  if (!data?.item) return (
    <div className="page-fade" style={{ paddingTop:136, minHeight:'100vh', padding:'136px 28px 60px' }}>
      <button onClick={handleBack} data-cursor="link" style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--gray-400)', background:'none', border:'none', cursor:'pointer', marginBottom:32 }}>← Back</button>
      <p style={{ color:'var(--gray-500)' }}>Part not found.</p>
    </div>
  );

  const { item, enrichment } = data;
  const price = item.price > 0 ? `$${item.price % 1 === 0 ? item.price : item.price.toFixed(2)}` : null;
  const lowStock = item.qty > 0 && item.qty <= 5;
  const tabLabel = (PART_TABS.find(t => t.id === tabId) || {}).label || 'Parts';
  const specs = enrichment?.specs || {};
  const specEntries = Object.entries(specs).filter(([k, v]) => v && String(v).trim());
  const related = relatedItems.filter(r => r.sku !== sku && r.department === item.department).slice(0, 12);

  return (
    <div className="page-fade">
      <section style={{ paddingTop:100, minHeight:'100vh', background:'var(--white)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px' }}>

          {/* Back link */}
          <button onClick={handleBack} data-cursor="link"
            style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--gray-400)', background:'none', border:'none', cursor:'pointer', marginBottom:28, display:'flex', alignItems:'center', gap:6 }}>
            ← {tabLabel}
          </button>

          {/* Main content — 2-col desktop */}
          <div className="part-page-grid">
            {/* Left: image */}
            <div className="part-page-img-wrap">
              {imgSrc && !imgErr
                ? <img src={imgSrc} alt={item.name} loading="eager"
                    style={{ width:'100%', height:'100%', objectFit:'contain', padding:'10%', mixBlendMode:'multiply' }}
                    onError={handleImgError} />
                : <span style={{ fontSize:72, opacity:0.15 }}>{DEPT_EMOJI[(item.department||'').toLowerCase()] || '⚙️'}</span>}
            </div>

            {/* Right: info */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {item.manufacturer && (
                <div style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.14em', color:'var(--gray-400)' }}>
                  {item.manufacturer} · {cleanDept(item.department || '')}
                </div>
              )}
              <h1 style={{ fontFamily:'var(--display)', fontSize:'clamp(20px,3vw,28px)', fontWeight:700, textTransform:'uppercase', letterSpacing:'-.02em', color:'var(--black)', lineHeight:1.1, margin:0 }}>{item.name}</h1>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                {price && <span style={{ fontFamily:'var(--display)', fontSize:26, fontWeight:800, color:'var(--black)' }}>{price}</span>}
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background: lowStock ? '#c2410c' : 'var(--stock-green)' }} />
                  <span style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color: lowStock ? '#c2410c' : 'var(--stock-green)' }}>
                    {lowStock ? `Only ${item.qty} left` : `In Stock${item.qty > 1 ? ` (${item.qty})` : ''}`}
                  </span>
                </div>
              </div>

              {/* AI description */}
              {enrichment?.summary && (
                <p style={{ fontSize:15, color:'var(--gray-600)', lineHeight:1.65, margin:0, maxWidth:480 }}>{enrichment.summary}</p>
              )}

              {/* Compatibility */}
              {enrichment?.compatibility && (
                <div style={{ background:'var(--paper)', border:'1px solid var(--hairline)', padding:'10px 14px', fontFamily:'var(--mono)', fontSize:10, color:'var(--gray-500)', letterSpacing:'.06em' }}>
                  {enrichment.compatibility}
                </div>
              )}

              {/* Specs grid */}
              {specEntries.length > 0 && (
                <div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:8, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:10 }}>Specs</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px' }}>
                    {specEntries.map(([k, v]) => (
                      <div key={k} style={{ display:'flex', flexDirection:'column', gap:1, borderBottom:'1px solid var(--hairline)', paddingBottom:5 }}>
                        <span style={{ fontFamily:'var(--mono)', fontSize:8, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--gray-400)' }}>{k}</span>
                        <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--black)', fontWeight:500 }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:8 }}>
                <button className="btn" data-cursor="link" onClick={() => window.cl.go('book')} style={{ fontSize:12 }}>
                  Book a Service <ArrowRight />
                </button>
                <button className="btn btn-outline" data-cursor="link" onClick={() => window.cl.go('contact')} style={{ fontSize:12 }}>
                  Ask Us About This
                </button>
              </div>
            </div>
          </div>

          {/* Related items */}
          {related.length > 0 && (
            <div style={{ marginTop:56, borderTop:'1px solid var(--hairline)', paddingTop:32 }}>
              <div className="eyebrow" style={{ marginBottom:16 }}>More {cleanDept(item.department || '')}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:1, background:'var(--hairline)' }}>
                {related.map(r => (
                  <PartCard key={r.id || r.sku} item={r} tabId={tabId} tabEmoji={PART_TABS.find(t=>t.id===tabId)?.emoji||'⚙️'} />
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
};
```

- [ ] **Step 2: Add CSS for PartPage layout in `styles.css`**

Append to `/Users/taocaruso/chainline-website/styles.css`:

```css
/* ── PartPage ── */
.part-page-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: start;
  margin-bottom: 48px;
}
.part-page-img-wrap {
  aspect-ratio: 1;
  background: #d4d0cb;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  overflow: hidden;
}
@media (max-width: 768px) {
  .part-page-grid { grid-template-columns: 1fr; gap: 24px; }
  .part-page-img-wrap { max-width: 100%; }
}
[data-theme="dark"] .part-page-img-wrap { background: #d4d0cb; }
```

- [ ] **Step 3: Bump pages.jsx version**

Change `pages.jsx?v=51` to `pages.jsx?v=52` in index.html.

- [ ] **Step 4: Commit and push**

```bash
cd ~/chainline-website
git pull --rebase origin main
git add pages.jsx styles.css index.html
git commit -m "feat: add PartPage with AI enrichment and related items"
git push origin main
```

---

## Task 10: Wire `PartPage` into app.jsx routing

**Files:**
- Modify: `/Users/taocaruso/chainline-website/app.jsx`

Add the `/part/:sku` route to `pathToRoute`, `routeToPath`, and the render tree.

- [ ] **Step 1: Add `part` to `pathToRoute` in `app.jsx`**

Find the `if (s1 === 'quote' && s2)` line (~line 34) and add after it:

```js
if (s1 === 'part' && s2) return { page: 'part', intent: { sku: s2, tab: null } };
```

- [ ] **Step 2: Add `part` to `routeToPath`**

Find the `if (page === 'quote')` line (~line 72) and add after it:

```js
if (page === 'part') return `/part/${intent?.sku || ''}`;
```

- [ ] **Step 3: Add `PartPage` to the render tree**

Find the `{page === "quote" && <QuotePage />}` line (~line 383) and add after it:

```jsx
{page === "part" && <PartPage key={intentState?.sku || intent?.sku} sku={intentState?.sku || intent?.sku} returnTab={intentState?.tab || intent?.tab} />}
```

The `key` prop forces a full remount when the sku changes (e.g. clicking a related item), guaranteeing clean state.

- [ ] **Step 4: Update `cl.go` to handle `part` intent**

The `cl.go` function in app.jsx sets `page` and `intent`. The `PartCard` calls `window.cl.go('part', { sku, tab })`. Verify that `cl.go` in app.jsx passes intent through — search for `window.cl.go` definition and confirm it sets both page and intent. If `intentState` is used, ensure it gets updated.

Find the `cl.go` definition in app.jsx (look for `window.cl = {` or `cl.go =`). It should already handle arbitrary intent objects. If it only handles known keys, add `sku` and `tab` pass-through:

```js
// Inside cl.go — ensure these props flow through:
// setIntentState({ sku: intent?.sku, tab: intent?.tab, ...other });
```

If `cl.go` already passes the full intent object to `setIntentState`, no change is needed.

- [ ] **Step 5: Bump app.jsx version**

Change `app.jsx?v=30` to `app.jsx?v=31` in index.html.

- [ ] **Step 6: Commit and push**

```bash
cd ~/chainline-website
git pull --rebase origin main
git add app.jsx index.html
git commit -m "feat: add /part/:sku route to app routing"
git push origin main
```

- [ ] **Step 7: End-to-end test**

1. Open `/components` → click a part card → URL changes to `/part/SKU`
2. PartPage loads, shows product name and price
3. After ~2s (AI call), description and specs appear
4. Second load of same SKU is instant (KV cache hit: `X-Cache: HIT` in Network tab)
5. Back button returns to the correct tab

---

## Task 11: Final polish — dark mode + version cleanup

**Files:**
- Modify: `/Users/taocaruso/chainline-website/styles.css` — dark mode overrides for PartCard
- Modify: `/Users/taocaruso/chainline-website/index.html` — final version numbers

- [ ] **Step 1: Add dark mode overrides for PartCard**

In `styles.css`, find the existing dark mode section and add:

```css
/* PartCard dark mode */
[data-theme="dark"] .part-card { background: var(--paper); border-color: var(--hairline); }
[data-theme="dark"] .part-card-img { background: #d4d0cb !important; }
```

- [ ] **Step 2: Confirm all version bumps are correct**

In `index.html`, verify these are the final versions after all tasks:
- `parts-data.js?v=1` (new)
- `pages.jsx?v=52`
- `app.jsx?v=31`

If any previous task was merged by another agent with a different version, check with:

```bash
cd ~/chainline-website && grep "v=[0-9]" index.html | grep -E "pages|app|parts-data"
```

- [ ] **Step 3: Trigger parts prewarm** (optional, after deploy settles)

```bash
# Get R2_UPLOAD_SECRET value from the worker secrets, then:
curl -s -X POST "https://still-term-f1ec.taocaruso77.workers.dev/api/prewarm-parts?secret=YOUR_SECRET" | python3 -c "import sys,json; print(json.load(sys.stdin))"
```

Expected: `{"status": "started", "message": "Prewarming all part SKUs in background"}`

The worker begins warming KV in the background. Subsequent PartPage loads will be instant.

- [ ] **Step 4: Final commit and push**

```bash
cd ~/chainline-website
git pull --rebase origin main
git add styles.css index.html
git commit -m "feat: parts overhaul complete — dark mode polish, version cleanup"
git push origin main
```

---

## Dependency Order

```
Task 1 (worker manufacturer) → Task 4 (parts-data.js)
Task 2 (worker /api/part) → Task 9 (PartPage)
Task 3 (prewarm) → runs after everything else
Task 5 (PartCard) → requires Task 4 deployed
Task 6 (filter state) → requires Task 5
Task 7 (sidebar filter UI) → requires Task 6
Task 8 (mobile chips) → requires Task 6
Task 9 (PartPage) → requires Task 5
Task 10 (routing) → requires Task 9
Task 11 (polish) → requires all above
```

Tasks 2, 3 can run in parallel with Tasks 4–5. Tasks 6–8 can run in parallel once Task 6 state is in place.

## Multi-Agent Notes

Other agents may be working on this repo concurrently. Before each commit:
1. `git pull --rebase origin main` — always rebase before push
2. If rebase conflict in `pages.jsx` — resolve carefully, never use `git checkout -- pages.jsx` (loses your work)
3. Version numbers in index.html are the most likely conflict point — check after rebase
