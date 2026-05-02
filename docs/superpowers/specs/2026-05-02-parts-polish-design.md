# Parts & Accessories Polish — Design Spec
Date: 2026-05-02

## Goal

Five targeted improvements to the parts section: slide-out filter panel, cart buttons on all items, per-SKU images from Shopify cached to R2, label fixes, and background preloading for faster page entry.

---

## 1. Filter Slide-Out Panel

**Replaces** the always-visible sidebar filter section (brand/price/sort checkboxes). The category tree stays in the sidebar as-is.

**Trigger:** "Filters" button in the search bar row (right side). Shows a badge count of active filters when any are set.

**Panel behaviour:**
- Slides in from the left, overlays the content (not the sidebar)
- Semi-transparent backdrop behind panel — click to close
- Panel width: 280px on desktop, 85vw on mobile
- Close button (✕) top-right of panel
- Same brand checkboxes, price buckets, sort radio as before
- "Clear all" button at top when filters active
- "Apply" / close button at bottom

**State:** same `filterBrands`, `priceRange`, `sortBy` React state as current. Panel open/close is local `filterPanelOpen` boolean state.

**Desktop sidebar:** remove the filter section that was inserted there. Keep only the category tree + "Live · Lightspeed inventory" footer.

**CSS:** `.parts-filter-panel` (fixed position, left slide, z-index above content), `.parts-filter-backdrop` (semi-transparent overlay), `.parts-filter-toggle` (the button in the search bar).

---

## 2. PartCartBtn Restored

Add `<PartCartBtn item={item} compact />` back to `PartCard` below the price/stock row. It was removed during the PartCard rebuild — restore it.

Also add `<PartCartBtn item={item} />` to `PartPage` below the CTA buttons row.

`PartCartBtn` already exists at pages.jsx ~line 2432 — no changes to the component itself.

---

## 3. Per-SKU Images via Shopify → R2 Pipeline

**Resolution chain update in `parts-data.js`:**

```
1. PART_R2_OVERRIDES[slug]     ← explicit R2 entries (populated by sync endpoint + manual)
2. window.CL_SHOP.skuImageMap[sku]  ← Shopify product image URL (served direct — Shopify CDN)
3. Existing ITEM_IMG_PATTERNS  ← name-regex fallback (pages.jsx)
4. DEPT_IMG                    ← category hero fallback
```

**Do NOT blindly probe R2 for every SKU** — that causes N failed fetches per page load. Instead:
- Shopify images are served direct from Shopify CDN (no hotlink issue — they're our products)
- `sync-part-images` endpoint downloads Shopify images to R2 in the background
- Once synced, `PART_R2_OVERRIDES` gains entries (or the override list is rebuilt from R2 inventory)
- Over time R2 becomes the primary source; Shopify CDN is the live fallback

`window.resolvePartImg` in `parts-data.js` updated to check overrides then Shopify map before falling through.

**R2 URL pattern:** `https://still-term-f1ec.taocaruso77.workers.dev/r2/parts/{sku}.jpg`

**Worker: `POST /api/sync-part-images?secret=R2_UPLOAD_SECRET`**

Sweeps all 14 tabs, for each SKU:
1. Check if `parts/{sku}.jpg` exists in `env.ASSETS` (R2) — skip if so
2. Look up Shopify image: fetch `GET /api/shopify-images` result (already has sku→url map)
3. If Shopify image found: download it, upload to R2 as `parts/{sku}.jpg`
4. If no Shopify image: try manufacturer CDN (same BRAND_CDNS pattern as bike image sync)
5. 300ms delay between downloads to avoid rate limiting
6. Run in `ctx.waitUntil` — returns `{ started: true }` immediately

**R2 storage estimate:**
- ~500 SKUs × 200KB average = ~100MB
- Bikes already ~30MB
- Total: ~130MB out of 10GB free tier = **1.3%** — well within limits
- No risk of hitting free tier

**Manufacturer CDN map** (same pattern as existing `BRAND_CDNS` for bikes):
```js
const PART_BRAND_CDNS = {
  'shimano': (name) => `https://productinfo.shimano.com/...`, // proxy needed
  'sram':    (name) => null, // patchy, skip
  'maxxis':  (name) => null, // Shopify CDN, UUID-based, skip
  // expand as CDNs are verified
};
```
Most parts will get images from Shopify. CDN map is initially sparse — expand over time.

---

## 4. Label Fixes

**In `PartsPage` sidebar header (~line 3196):**
```
'Components & Parts'  →  'Parts'
'Accessories & Gear'  stays
```

**Page/section title when `pageType === 'components'`:**
Check for any other "Components" text shown to the user in PartsPage headers or banners and change to "Parts".

**`ComponentsLandingPage`** (pages.jsx ~line 4610): title says "Components." — leave this page as-is (it's the landing tile page, correctly named).

---

## 5. Background Preloading

**On page load** (in `app.jsx` App component `useEffect([], [])`), after a 2-second delay to avoid competing with above-fold render:

```js
React.useEffect(() => {
  const t = setTimeout(() => {
    window.lightspeedWarmCache?.(['drivetrain', 'helmets', 'wheels']);
  }, 2000);
  return () => clearTimeout(t);
}, []);
```

This warms the 3 most-visited tabs silently in the background. When the user navigates to Parts, data is already in `tabCache` — no loading spinner.

**On nav hover** (already exists in components.jsx lines 196-197) — keep as-is.

---

## Implementation Notes

- **PartCartBtn in PartCard**: Wrap in `<div onClick={e => e.stopPropagation()}>` — PartCard has a card-level `onClick` navigating to PartPage; without this, tapping "Add to Cart" also triggers page navigation. Verify PartCartBtn doesn't already call stopPropagation internally before adding wrapper.
- **R2 key sanitation**: `r2/parts/{sku}.jpg` — slugify SKU before use: `sku.replace(/[^a-z0-9-]/gi, '-')`. Lightspeed systemSkus appear numeric but may vary.
- **Filter panel z-index**: Use `z-index: 250` for panel, `z-index: 249` for backdrop — slots between compare-bar (201) and cart drawer (300).
- **Background preload**: Add 2s partial warm ALONGSIDE the existing 4s full warm in app.jsx — do NOT remove the existing timer.
- **Current script versions**: pages.jsx v59, app.jsx v32, components.jsx v43, parts-data.js v1. Verify with `grep v= index.html` before starting.

## 6. Files Changed

| File | Changes |
|------|---------|
| `pages.jsx` | FilterPanel component, PartCard +cart btn, PartPage +cart btn, label fixes, filterPanelOpen state, remove filter from sidebar |
| `parts-data.js` | resolvePartImg: add R2 + Shopify skuImageMap checks |
| `styles.css` | Filter panel slide-out, backdrop, toggle button, filter badge |
| `worker.js` | POST /api/sync-part-images |
| `app.jsx` | useEffect background preload |
| `index.html` | Version bumps |

---

## 7. Out of Scope

- Automatic Lightspeed→Shopify product sync (no push API; SKU matching is the sync mechanism)
- Images for parts with no Shopify product and no accessible manufacturer CDN (fall through to category image)
- Pagination of parts (load-more already exists)
