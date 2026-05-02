// parts-data.js — per-SKU image resolution
// Extends resolvePartImg in pages.jsx. Resolution chain:
// 1. PART_R2_OVERRIDES — explicit R2 URLs for manually-uploaded images
// 2. BRAND_CDN_MAP — auto-construct URL from brand + product name
// 3. Falls through to pages.jsx ITEM_IMG_PATTERNS + DEPT_IMG

const _R2 = 'https://still-term-f1ec.taocaruso77.workers.dev/r2';
const _PROXY = 'https://still-term-f1ec.taocaruso77.workers.dev/api/img?url=';

// Explicit R2 overrides — keyed by slugified product name prefix
// slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
// Uncomment and add entries as images are uploaded to R2 under parts/
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
// Add brands here as CDN patterns are verified with: curl -I <url>
const BRAND_CDN_MAP = {
  // Future: add brands with predictable CDN URL patterns here
  // e.g.: 'maxxis': (item) => `https://cdn.maxxis.com/products/${_slugify(item.name)}.jpg`
};

function _slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Override window.resolvePartImg — called by PartCard before pages.jsx fallback
window.resolvePartImg = function(item, tab) {
  const slug  = _slugify(item.name || '');
  const sku   = item.sku || '';
  const brand = (item.manufacturer || '').toLowerCase();

  // 1. Explicit R2 override (manual uploads or synced via /api/sync-part-images)
  for (const key of Object.keys(PART_R2_OVERRIDES)) {
    if (slug.startsWith(key) || slug === key) return PART_R2_OVERRIDES[key];
  }

  // 2. Shopify product image — populated by shopify.js on page init
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

window.PART_R2_OVERRIDES = PART_R2_OVERRIDES;
window.BRAND_CDN_MAP = BRAND_CDN_MAP;
