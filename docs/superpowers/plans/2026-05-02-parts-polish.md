# Parts & Accessories Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Five polish improvements: slide-out filter panel, cart buttons restored, per-SKU Shopify images, label fixes, and background tab preloading.

**Architecture:** All frontend changes in pages.jsx/parts-data.js/styles.css/app.jsx. Worker gains one new endpoint for R2 image sync. No new files except possibly inline CSS additions.

**Tech Stack:** React + Babel standalone, Cloudflare Worker (no npm), R2, shopify.js cart integration

**Current versions:** pages.jsx?v=59, app.jsx?v=32, components.jsx?v=43, parts-data.js?v=1

**Multi-agent note:** Other agents may commit concurrently. Always `git pull origin main --no-rebase` before pushing. Check current versions in index.html before bumping.

---

## Task 1: Filter Slide-Out Panel

**Files:**
- Modify: `/Users/taocaruso/chainline-website/pages.jsx`
- Modify: `/Users/taocaruso/chainline-website/styles.css`
- Modify: `/Users/taocaruso/chainline-website/index.html` (version bump)

The filter UI currently lives in the sidebar (lines ~3420–3463 in pages.jsx). Move it to a slide-out panel triggered by a "Filters" button. The sidebar keeps only the category tree.

- [ ] **Step 1: Add `filterPanelOpen` state to `PartsPage`**

In pages.jsx, find `const [filterBrands, setFilterBrands]` (~line 3159) and add immediately after the `hasFilters` line:

```jsx
const [filterPanelOpen, setFilterPanelOpen] = React.useState(false);
```

- [ ] **Step 2: Remove the filter section from the sidebar**

Find and delete lines ~3420–3463 (the `{availableBrands.length > 0 && (<div style={{ padding:'12px 16px 0'...` block through its closing `)}}`). The sidebar should end with just the category tree and the "Live · Lightspeed inventory" footer div.

The section to delete starts with:
```jsx
            {availableBrands.length > 0 && (
              <div style={{ padding:'12px 16px 0', borderTop:'1px solid var(--hairline)', marginTop:8 }}>
```
and ends before:
```jsx
            <div style={{ margin:"16px 16px 0", paddingTop:14, borderTop:"1px solid var(--hairline)" }}>
```

- [ ] **Step 3: Add "Filters" button to the search bar**

Find the search bar div (~line 3304, the `<div className="parts-search-bar"` block). Inside it, after the `{loading && ...}` and `{search && ...}` spans, add:

```jsx
          <button onClick={() => setFilterPanelOpen(true)} className="parts-filter-toggle" data-cursor="link"
            style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, padding:'6px 12px', border:'1px solid var(--hairline)', background:'var(--white)', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.08em', textTransform:'uppercase', cursor:'pointer', color:'var(--black)', position:'relative' }}>
            Filters
            {hasFilters && <span style={{ position:'absolute', top:-4, right:-4, width:14, height:14, borderRadius:'50%', background:'var(--black)', color:'#fff', fontFamily:'var(--mono)', fontSize:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{filterBrands.size + (priceRange ? 1 : 0) + (sortBy !== 'price-asc' ? 1 : 0)}</span>}
          </button>
```

- [ ] **Step 4: Add the filter panel + backdrop JSX**

Find `<div className="parts-layout">` (~line 3373) and insert BEFORE it:

```jsx
        {/* ── Filter slide-out panel ── */}
        {filterPanelOpen && (
          <div className="parts-filter-backdrop" onClick={() => setFilterPanelOpen(false)} />
        )}
        <div className={'parts-filter-panel' + (filterPanelOpen ? ' open' : '')}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px', borderBottom:'1px solid var(--hairline)' }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', fontWeight:700, color:'var(--black)' }}>Filters</span>
            <button onClick={() => setFilterPanelOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'var(--mono)', fontSize:14, color:'var(--gray-400)', lineHeight:1 }}>✕</button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
            {hasFilters && (
              <button onClick={() => { clearFilters(); }} data-cursor="link"
                style={{ fontFamily:'var(--mono)', fontSize:8, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--black)', background:'none', border:'1px solid var(--hairline)', padding:'5px 10px', cursor:'pointer', marginBottom:16, width:'100%' }}>
                Clear all filters ✕
              </button>
            )}
            {availableBrands.length > 0 && (
              <>
                <div style={{ fontFamily:'var(--mono)', fontSize:8, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:8 }}>Brand</div>
                {availableBrands.map(brand => (
                  <label key={brand} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', cursor:'pointer' }}>
                    <input type="checkbox" checked={filterBrands.has(brand)}
                      onChange={e => {
                        setFilterBrands(prev => {
                          const next = new Set(prev);
                          e.target.checked ? next.add(brand) : next.delete(brand);
                          return next;
                        });
                        setPg(0);
                      }}
                      style={{ accentColor:'var(--black)', width:14, height:14, cursor:'pointer', flexShrink:0 }} />
                    <span style={{ fontFamily:'var(--mono)', fontSize:10, color: filterBrands.has(brand) ? 'var(--black)' : 'var(--gray-500)', letterSpacing:'.04em' }}>{brand}</span>
                  </label>
                ))}
                <div style={{ height:16 }} />
              </>
            )}
            <div style={{ fontFamily:'var(--mono)', fontSize:8, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:8 }}>Price</div>
            {[['<50','Under $50'],['50-150','$50 – $150'],['150-300','$150 – $300'],['300+','$300+']].map(([val, label]) => (
              <label key={val} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', cursor:'pointer' }}>
                <input type="checkbox" checked={priceRange === val}
                  onChange={e => { setPriceRange(e.target.checked ? val : null); setPg(0); }}
                  style={{ accentColor:'var(--black)', width:14, height:14, cursor:'pointer', flexShrink:0 }} />
                <span style={{ fontFamily:'var(--mono)', fontSize:10, color: priceRange === val ? 'var(--black)' : 'var(--gray-500)', letterSpacing:'.04em' }}>{label}</span>
              </label>
            ))}
            <div style={{ height:16 }} />
            <div style={{ fontFamily:'var(--mono)', fontSize:8, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:8 }}>Sort</div>
            {[['price-asc','Price: Low → High'],['price-desc','Price: High → Low'],['name-az','Name A–Z']].map(([val, label]) => (
              <label key={val} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', cursor:'pointer' }}>
                <input type="radio" name="parts-sort-panel" checked={sortBy === val}
                  onChange={() => { setSortBy(val); setPg(0); }}
                  style={{ accentColor:'var(--black)', width:14, height:14, cursor:'pointer', flexShrink:0 }} />
                <span style={{ fontFamily:'var(--mono)', fontSize:10, color: sortBy === val ? 'var(--black)' : 'var(--gray-500)', letterSpacing:'.04em' }}>{label}</span>
              </label>
            ))}
          </div>
          <div style={{ padding:'16px 20px', borderTop:'1px solid var(--hairline)' }}>
            <button onClick={() => setFilterPanelOpen(false)} className="btn" style={{ width:'100%', fontSize:11 }}>
              Apply Filters
            </button>
          </div>
        </div>
```

- [ ] **Step 5: Add CSS for filter panel to `styles.css`**

Append to `/Users/taocaruso/chainline-website/styles.css`:

```css
/* ── Parts filter slide-out panel ── */
.parts-filter-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 300px;
  height: 100vh;
  background: var(--white);
  z-index: 250;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 32px rgba(0,0,0,0.12);
  transform: translateX(-100%);
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.parts-filter-panel.open {
  transform: translateX(0);
}
.parts-filter-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 249;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@media (max-width: 768px) {
  .parts-filter-panel { width: 85vw; max-width: 320px; }
}
[data-theme="dark"] .parts-filter-panel {
  background: var(--paper);
  box-shadow: 4px 0 32px rgba(0,0,0,0.4);
}
[data-theme="dark"] .parts-filter-backdrop { background: rgba(0,0,0,0.6); }
```

- [ ] **Step 6: Bump pages.jsx version and commit**

Check current version with `grep "pages.jsx" ~/chainline-website/index.html`, increment by 1.

```bash
cd ~/chainline-website
git pull origin main --no-rebase
# Check and update version in index.html (sed is OK on html files, not jsx)
CURR=$(grep -o 'pages\.jsx?v=[0-9]*' index.html | grep -o '[0-9]*$')
NEXT=$((CURR + 1))
sed -i '' "s/pages\.jsx?v=${CURR}/pages.jsx?v=${NEXT}/" index.html
git add pages.jsx styles.css index.html
git commit -m "feat: filter slide-out panel for parts/accessories"
git push origin main
```

- [ ] **Step 7: Verify**

Open `/components` in browser. The sidebar should show only the category tree. A "Filters" button should appear in the search bar. Clicking "Filters" should slide in a panel from the left with brand/price/sort controls. Clicking backdrop or "Apply" should close it.

---

## Task 2: PartCartBtn in PartCard + PartPage + Label Fix

**Files:**
- Modify: `/Users/taocaruso/chainline-website/pages.jsx`
- Modify: `/Users/taocaruso/chainline-website/index.html` (version bump)

Two things in one commit: cart button restored and label fix.

- [ ] **Step 1: Add PartCartBtn to PartCard**

Find the `PartCard` component in pages.jsx. Inside the card's info div, find the price/stock row. After the stock indicator `<div style={{ display:'flex', alignItems:'center', gap:4 }}>` block (which shows the green/orange dot + "In Stock"), add:

```jsx
        {item.sku && (
          <div onClick={e => e.stopPropagation()} style={{ marginTop:6 }}>
            <PartCartBtn item={item} compact />
          </div>
        )}
```

The `onClick={e => e.stopPropagation()}` wrapper prevents the card's navigation click from firing when the user taps the cart button.

- [ ] **Step 2: Add PartCartBtn to PartPage**

In the `PartPage` component, find the CTAs section:
```jsx
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:8 }}>
                <button className="btn" data-cursor="link" onClick={() => window.cl.go('book')}
```

Add a cart button BEFORE the "Book a Service" button:

```jsx
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:8, alignItems:'center' }}>
                {item.sku && <PartCartBtn item={item} />}
                <button className="btn" data-cursor="link" onClick={() => window.cl.go('book')} style={{ fontSize:12 }}>
                  Book a Service <ArrowRight />
                </button>
                <button className="btn btn-outline" data-cursor="link" onClick={() => window.cl.go('contact')} style={{ fontSize:12 }}>
                  Ask Us About This
                </button>
              </div>
```

- [ ] **Step 3: Fix the "Components & Parts" label**

Find line ~3378:
```jsx
              {pageType === 'accessories' ? 'Accessories & Gear' : 'Components & Parts'}
```
Change to:
```jsx
              {pageType === 'accessories' ? 'Accessories & Gear' : 'Parts'}
```

- [ ] **Step 4: Bump version and commit**

```bash
cd ~/chainline-website
git pull origin main --no-rebase
CURR=$(grep -o 'pages\.jsx?v=[0-9]*' index.html | grep -o '[0-9]*$')
NEXT=$((CURR + 1))
sed -i '' "s/pages\.jsx?v=${CURR}/pages.jsx?v=${NEXT}/" index.html
git add pages.jsx index.html
git commit -m "feat: restore PartCartBtn, fix Parts label"
git push origin main
```

---

## Task 3: Per-SKU Images via Shopify skuImageMap

**Files:**
- Modify: `/Users/taocaruso/chainline-website/parts-data.js`
- Modify: `/Users/taocaruso/chainline-website/index.html` (version bump)

`window.CL_SHOP.skuImageMap` is populated by shopify.js after Shopify loads. It maps `sku → imageUrl`. Use it as step 2 in `window.resolvePartImg`.

- [ ] **Step 1: Update `window.resolvePartImg` in parts-data.js**

Read the current file first. Replace the `window.resolvePartImg` function with:

```js
window.resolvePartImg = function(item, tab) {
  const slug = _slugify(item.name || '');
  const sku  = item.sku  || '';
  const brand = (item.manufacturer || '').toLowerCase();

  // 1. Explicit R2 override (manual uploads or synced via /api/sync-part-images)
  for (const key of Object.keys(PART_R2_OVERRIDES)) {
    if (slug.startsWith(key) || slug === key) return PART_R2_OVERRIDES[key];
  }

  // 2. Shopify product image — already loaded by shopify.js on page init
  if (sku && window.CL_SHOP?.skuImageMap?.[sku]) {
    return window.CL_SHOP.skuImageMap[sku];
  }

  // 3. Brand CDN
  if (brand && BRAND_CDN_MAP[brand]) {
    const url = BRAND_CDN_MAP[brand](item);
    if (url) return url;
  }

  // 4. Fall through — pages.jsx resolvePartImg handles ITEM_IMG_PATTERNS + DEPT_IMG
  return null;
};
```

- [ ] **Step 2: Bump parts-data.js version**

```bash
cd ~/chainline-website
git pull origin main --no-rebase
CURR=$(grep -o 'parts-data\.js?v=[0-9]*' index.html | grep -o '[0-9]*$')
NEXT=$((CURR + 1))
sed -i '' "s/parts-data\.js?v=${CURR}/parts-data.js?v=${NEXT}/" index.html
git add parts-data.js index.html
git commit -m "feat: use Shopify skuImageMap for per-SKU part images"
git push origin main
```

- [ ] **Step 3: Verify in browser console**

Open `/components`, open DevTools console, type:
```js
Object.keys(window.CL_SHOP.skuImageMap).length
```
Expected: a number > 0 (means Shopify images are loaded). Then navigate to any parts tab — cards with matching Shopify SKUs should show real product images.

---

## Task 4: Worker — POST /api/sync-part-images

**Files:**
- Modify: `/Users/taocaruso/chainline-worker/worker.js`

Adds a background endpoint that sweeps all 14 tabs and copies Shopify images to R2. Once synced, images are served from R2 (Cloudflare edge) rather than Shopify CDN.

- [ ] **Step 1: Add the endpoint**

In worker.js, find `// ── POST /api/prewarm-parts` (~line 1253) and insert BEFORE it:

```js
      // ── POST /api/sync-part-images ── download Shopify product images → R2 parts/{sku}.jpg
      if (url.pathname === '/api/sync-part-images' && request.method === 'POST') {
        const secret = request.headers.get('x-prewarm-secret') || url.searchParams.get('secret');
        if (secret !== env.R2_UPLOAD_SECRET) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: h });

        const workerUrl = 'https://still-term-f1ec.taocaruso77.workers.dev';

        ctx.waitUntil((async () => {
          // Build SKU→imageUrl map from Shopify (reuse existing /api/shopify-images endpoint)
          let skuImgMap = {};
          try {
            const res = await fetch(`${workerUrl}/api/shopify-images`);
            if (res.ok) skuImgMap = await res.json();
          } catch(e) { console.error('[sync-part-images] shopify-images fetch failed:', e.message); }

          const ALL_TABS = ['drivetrain','brakes','wheels','cockpit','suspension','helmets','protection','shoes','clothing','tools','bags','lights','locks','racks'];
          let total = 0, synced = 0, skipped = 0;

          for (const tab of ALL_TABS) {
            try {
              const res  = await fetch(`${workerUrl}/api/parts?tab=${tab}`);
              const data = await res.json();
              for (const item of (data.items || [])) {
                if (!item.sku) continue;
                total++;
                // Sanitize SKU for R2 key
                const safeKey = `parts/${item.sku.replace(/[^a-zA-Z0-9-_]/g, '-')}.jpg`;
                // Skip if already in R2
                const existing = await env.ASSETS.head(safeKey);
                if (existing) { skipped++; continue; }
                // Find image URL
                const imgUrl = skuImgMap[item.sku];
                if (!imgUrl) continue;
                // Download and upload to R2
                try {
                  const imgRes = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                  if (imgRes.ok && (imgRes.headers.get('content-type') || '').startsWith('image/')) {
                    const buf = await imgRes.arrayBuffer();
                    const ct  = imgRes.headers.get('content-type') || 'image/jpeg';
                    await env.ASSETS.put(safeKey, buf, { httpMetadata: { contentType: ct } });
                    synced++;
                    console.log(`[sync-part-images] Cached ${safeKey}`);
                  }
                } catch(e) { console.warn(`[sync-part-images] ${item.sku}:`, e.message); }
                await new Promise(r => setTimeout(r, 300));
              }
            } catch(e) { console.error(`[sync-part-images] tab ${tab}:`, e.message); }
          }
          console.log(`[sync-part-images] ${total} SKUs — ${synced} synced to R2, ${skipped} already cached`);
        })());

        return new Response(JSON.stringify({ status: 'started', message: 'Syncing part images to R2 in background' }), { headers: h });
      }
```

- [ ] **Step 2: Deploy worker**

```bash
CF_TOKEN="YOUR_FRESH_TOKEN"  # get from dash.cloudflare.com/profile/api-tokens
curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/8c3d9e51212aa8c7a1ad6ea8edd23d8b/workers/scripts/still-term-f1ec" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -F 'metadata={"main_module":"worker.js","bindings":[{"name":"BIKE_DATA","type":"kv_namespace","namespace_id":"7aa6d57f045b472c960dbaa9f069cb9f"},{"name":"AI","type":"ai"},{"name":"ASSETS","type":"r2_bucket","bucket_name":"chainline-assets"}]};type=application/json' \
  -F "worker.js=@/Users/taocaruso/chainline-worker/worker.js;type=application/javascript+module" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print('OK' if r.get('success') else r)"
```

Expected: `OK`

- [ ] **Step 3: Test endpoint exists**

```bash
curl -s -X POST "https://still-term-f1ec.taocaruso77.workers.dev/api/sync-part-images?secret=WRONG" | python3 -c "import sys,json; print(json.load(sys.stdin))"
```

Expected: `{'error': 'Unauthorized'}` — confirms route is live.

---

## Task 5: Background Preloading on Page Load

**Files:**
- Modify: `/Users/taocaruso/chainline-website/app.jsx`
- Modify: `/Users/taocaruso/chainline-website/index.html` (version bump)

Warm the 3 most-visited parts tabs 2 seconds after page load. When the user navigates to Parts, data is already cached — no loading spinner.

- [ ] **Step 1: Find the existing warmCache call in app.jsx**

Search for `lightspeedWarmCache` or `setTimeout` in app.jsx to see what's already there. The spec says "add 2s partial warm ALONGSIDE the existing 4s full warm — do NOT remove existing timer."

```bash
grep -n "lightspeedWarmCache\|setTimeout\|warmCache" ~/chainline-website/app.jsx | head -10
```

- [ ] **Step 2: Add the 2-second preload useEffect**

In the `App` component in app.jsx, find the first `React.useEffect` that runs on mount (`[], []` deps). Add a NEW `useEffect` after it (do not modify existing ones):

```jsx
  React.useEffect(() => {
    const t = setTimeout(() => {
      window.lightspeedWarmCache?.(['drivetrain', 'helmets', 'wheels']);
    }, 2000);
    return () => clearTimeout(t);
  }, []);
```

If you can't find a clean insertion point, add it just before the `return (` of the App component, alongside the other useEffects.

- [ ] **Step 3: Bump app.jsx version and commit**

```bash
cd ~/chainline-website
git pull origin main --no-rebase
CURR=$(grep -o 'app\.jsx?v=[0-9]*' index.html | grep -o '[0-9]*$')
NEXT=$((CURR + 1))
sed -i '' "s/app\.jsx?v=${CURR}/app.jsx?v=${NEXT}/" index.html
git add app.jsx index.html
git commit -m "feat: preload top 3 parts tabs 2s after page load"
git push origin main
```

- [ ] **Step 4: Verify**

Open DevTools Network tab. Load the homepage. After ~2 seconds, three requests to `/api/parts?tab=drivetrain`, `/api/parts?tab=helmets`, `/api/parts?tab=wheels` should appear. Navigate to `/components` — the drivetrain tab should load instantly with no spinner.

---

## Self-Review

1. **Spec coverage:**
   - ✅ Filter slide-out panel → Task 1
   - ✅ PartCartBtn restored to PartCard → Task 2 Step 1
   - ✅ PartCartBtn on PartPage → Task 2 Step 2
   - ✅ "Components & Parts" → "Parts" → Task 2 Step 3
   - ✅ Shopify skuImageMap in resolvePartImg → Task 3
   - ✅ Worker sync-part-images endpoint → Task 4
   - ✅ Background preload → Task 5

2. **Placeholders:** None — all code blocks are complete.

3. **Type consistency:**
   - `filterPanelOpen` set in Task 1 Step 1, used in Steps 3 and 4 ✅
   - `PartCartBtn` referenced in Task 2 — component at pages.jsx ~line 2555 ✅
   - `window.CL_SHOP.skuImageMap` populated by shopify.js — used in Task 3 ✅
   - `env.ASSETS` R2 binding confirmed present in worker ✅
