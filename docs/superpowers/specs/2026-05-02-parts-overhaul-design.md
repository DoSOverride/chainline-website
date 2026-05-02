# Parts & Accessories Overhaul — Design Spec
Date: 2026-05-02

## Goal

Transform the Parts & Accessories section into a dense, image-first, Amazon-style browsing experience. Every SKU shows a real product image. Clicking a part opens a dedicated detail page with AI-enriched description and specs. Filters work on desktop and mobile.

Benchmarks: smithcreekcycle.ca, tbsbikeparts.com, bici.cc, McMaster-Carr.

---

## 1. Card Layout

**Dense 4-column grid** — same breakpoints as bike shop:
- ≥1024px: 4 columns
- 768–1023px: 3 columns
- ≤767px: 2 columns

**PartCard structure (replaces PartRow):**
```
[ product image — square, mix-blend-mode:multiply on #d4d0cb background ]
[ BRAND · tab label                                                       ]
[ Product name — max 2 lines, ellipsis overflow                          ]
[ $price              ● In Stock  /  ● N left                            ]
```

- Image: `object-fit: contain`, `loading="lazy" decoding="async"`
- On img error: walks resolution chain (see Section 3)
- Hover: subtle border highlight only — no swap, no animation
- `font-size: 16px` minimum on all interactive elements (iOS zoom prevention)
- Click: navigates to `/part/:sku`

---

## 2. Image Resolution System

**New file: `parts-data.js`** (loaded in index.html after bike-data.js)

Contains:
- `BRAND_CDN_MAP` — maps brand slug → CDN base URL + URL construction function
- `PART_R2_OVERRIDES` — explicit R2 paths keyed by product name slug (manual uploads for top 20-30 items)
- `resolvePartImg(item, tab)` — exported function

**Resolution chain (in order):**
1. `PART_R2_OVERRIDES[slugify(item.description)]` → direct R2 URL
2. `BRAND_CDN_MAP[brand]?.construct(item)` → brand CDN URL (direct if no hotlink block)
3. Same URL wrapped in `/api/img?url=` proxy (for Shimano and other hotlink-blocking brands)
4. `DEPT_IMG[tab]` → existing category hero from R2 (always works)

**Known brand CDN status:**
- Giro: test required — likely direct
- SRAM: partial, patchy — try direct, fall back to proxy
- Shimano: blocks hotlinks → always use `/api/img` proxy
- Maxxis: Shopify CDN — direct works
- Fox / RaceFace: test required

**R2 priority uploads** (manual, before launch):
- Helmets: 2-3 Giro / Smith / Fox hero shots
- Drivetrain: SRAM Eagle cassette, Shimano Deore chain, SRAM chain
- Brakes: SRAM/Shimano brake pad set
- Tires: Maxxis Minion DHF, Maxxis Aggressor
- Tubes: generic valve shot
- Brake levers/calipers: 1-2 shots

---

## 3. Filter System

### Desktop (≥769px) — Left Sidebar

Redesign within existing `.parts-sidebar`. Contains:

```
[ Clear all filters ]           ← only shown when any filter active

BRAND                           ← auto-built from brands in loaded tab data
☐ SRAM
☐ Shimano
☐ Maxxis
☐ Giro
...

PRICE
☐ Under $50
☐ $50 – $150
☐ $150 – $300
☐ $300+

SORT
○ Relevance (default)
○ Price: Low → High
○ Price: High → Low
○ Name A–Z
```

- Brand list auto-generated from `[...new Set(items.map(i => i.manufacturer).filter(Boolean))].sort()`
- If tab returns 0 brands (all null manufacturer), Brand section is hidden entirely
- All filtering is client-side on already-fetched tab data — no extra API calls
- Filter state: `{ brands: Set, priceRange: string|null, sort: string }`

### Mobile (≤768px) — Chip Strip

Sidebar hidden. Search bar + chip rows form a **single sticky block** (`position:sticky; top:64px` below the main nav). Not two separate sticky elements — that would double-stack and push content too far down.

- **Row 1:** `All` chip + one chip per brand in loaded data — scrolls horizontally
- **Row 2:** Price chips (`<$50` · `$50-$150` · `$150-$300` · `$300+`) + `Sort ▾` dropdown

Active chip shows `✕` to deactivate. Same filter state object shared with desktop sidebar.

---

## 4. Search

Client-side, within current tab. Searches across:
- `item.description` (product name)
- `item.manufacturer` (brand)
- `item.note` (if present)

Case-insensitive substring match. Existing search bar wired to this — no structural change needed, just expand the fields searched.

Search + filters compose: results are `allItems.filter(matchesSearch).filter(matchesFilters)`.

---

## 5. Stock Filter (Worker)

**Current:** `item.qoh > 0`

**New:** `item.qoh > 0 && item.StockStatus === 'StockAvailable'`

This excludes special-order items, discontinued stock, and items flagged as unavailable in Lightspeed even if QOH shows a number. Only genuinely in-stock items appear.

Worker change: update the filter in `GET /api/parts?tab=X` handler.

**Note:** Verify actual Lightspeed R-Series field name for stock status before implementing — it may be `StockStatus`, `stockStatus`, or a custom field. Check a live `/Item.json` response to confirm.

---

## 6. Part Detail Page

Route: `/part/:sku` — uses `item.systemSku` as identifier.

**URL shape:** `/part/ABC-12345`

**Page layout:**
```
[ Back ← Drivetrain ]           ← returns to originating tab

[ Large product image ]         [ Brand · Category         ]
[ (same warm gray bg,           [ Full product name        ]
   multiply blend)              [ $price   ● Stock status  ]
                                [                          ]
                                [ Description paragraph    ]
                                [ (1-2 sentences, AI)      ]
                                [                          ]
                                [ SPECS                    ]
                                [ Speed:        12         ]
                                [ Cassette range: 10-52T   ]
                                [ Interface:    XD Driver  ]
                                [ Weight:       440g       ]
                                [ Compatibility: Eagle     ]
                                [                          ]
                                [ Ask Us About This  →     ]
                                [ Book a Service    →      ]

[ Related items — horizontal scroller, same tab ]
```

Mobile: stacked single column. Image full width. Specs in 2-col grid.

### AI Enrichment

**New worker endpoint:** `GET /api/part/:sku`

Flow:
1. Check KV `part:{sku}` — return cached if present
2. Fetch item from Lightspeed by systemSku
3. Call Workers AI with prompt:

```
You are a bike shop assistant. Given this product: "{description}" by {manufacturer}.
Return JSON:
{
  "summary": "1-2 sentence description of what this part does and who it's for",
  "specs": { "key": "value", ... },  // extract from name: speed, range, weight, interface, standard, material etc
  "compatibility": "brief compatibility note"
}
Keep it accurate — only state specs visible in the product name. Max 80 words for summary.
```

4. Store result in KV `part:{sku}`, TTL 90 days
5. Return `{ item, enrichment }`

**Prewarm endpoint:** `POST /api/prewarm-parts?secret=R2_UPLOAD_SECRET`
- Iterates all parts across all tabs
- Warms KV for any `part:{sku}` not yet cached
- Same pattern as `/api/prewarm` for bikes

### Navigation

- `PartCard onClick`: `cl.go('part', { sku: item.systemSku, tab: currentTab })`
- `app.jsx` routing: `page === 'part'` → `<PartPage sku={pageParam} returnTab={intent?.tab} />`
- PartPage fetches from `/api/part/:sku`
- Back button: `cl.go(returnTab || 'components')`

---

## 7. Files Changed

| File | Changes |
|------|---------|
| `parts-data.js` | NEW — BRAND_CDN_MAP, PART_R2_OVERRIDES, resolvePartImg |
| `pages.jsx` | PartCard (replaces PartRow), PartPage (new), filter state, brand chips mobile |
| `app.jsx` | `/part/:sku` route, pass returnTab in intent |
| `styles.css` | PartCard grid, sidebar filter styles, mobile chip strip, PartPage layout |
| `worker.js` | StockStatus filter, GET /api/part/:sku, POST /api/prewarm-parts |
| `index.html` | Add parts-data.js script tag, bump all version strings |

---

## 8. Out of Scope

- Cart / add-to-cart (no ecommerce backend)
- Customer reviews per part
- Part compatibility checker
- Inventory sync webhook (still poll-based)
