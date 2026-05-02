// parts-data.js — per-SKU image resolution
// Resolution chain:
// 1. R2 index (from /api/sync-part-images run) — real product photos hosted on R2
// 2. Shopify skuImageMap — our Shopify product images
// 3. PART_R2_OVERRIDES — manual R2 uploads
// 4. Falls through to pages.jsx ITEM_IMG_PATTERNS + DEPT_IMG

const _WORKER = 'https://still-term-f1ec.taocaruso77.workers.dev';
const _R2 = `${_WORKER}/r2`;

// Loaded from /api/part-img-index — populated by /api/sync-part-images
// Maps sku → R2 image URL for all parts synced to R2
window.PART_IMG_INDEX = {};

// Fetch the R2 image index in the background on page load
(async () => {
  try {
    const res = await fetch(`${_WORKER}/api/part-img-index`);
    if (res.ok) {
      const data = await res.json();
      window.PART_IMG_INDEX = data;
      // Dispatch event so any mounted PartCards can refresh
      window.dispatchEvent(new CustomEvent('part-img-index:loaded', { detail: data }));
    }
  } catch {}
})();

// Manual R2 overrides — keyed by slugified product name prefix
// Uncomment and add as images are manually uploaded under parts/
const PART_R2_OVERRIDES = {};

function _slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Override window.resolvePartImg — called by PartCard before pages.jsx fallback
window.resolvePartImg = function(item, tab) {
  const sku   = item.sku  || '';
  const slug  = _slugify(item.name || '');

  // 1. R2 image index — synced product photos (Shimano, Giro, Bell, Maxxis, etc.)
  if (sku && window.PART_IMG_INDEX[sku]) {
    return window.PART_IMG_INDEX[sku];
  }

  // 2. Shopify product image — populated by shopify.js
  if (sku && window.CL_SHOP?.skuImageMap?.[sku]) {
    return window.CL_SHOP.skuImageMap[sku];
  }

  // 3. Manual R2 override
  for (const key of Object.keys(PART_R2_OVERRIDES)) {
    if (slug.startsWith(key) || slug === key) return PART_R2_OVERRIDES[key];
  }

  // 4. Fall through — pages.jsx resolvePartImg handles ITEM_IMG_PATTERNS + DEPT_IMG
  return null;
};

window.PART_R2_OVERRIDES = PART_R2_OVERRIDES;
