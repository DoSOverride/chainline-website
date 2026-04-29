// ChainLine — Sub-pages

// ── Image resolution: static catalog → Shopify SKU → Shopify title ──
const _norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function resolveImage(bike) {
  // Curated bike-data.js images take priority over stale static img fields
  if (bike.handle && window.BIKE_DATA?.[bike.handle]?.images?.[0]) {
    return window.BIKE_DATA[bike.handle].images[0];
  }
  if (bike.img || bike.image) return bike.img || bike.image;

  const skuMap   = window.CL_SHOP?.skuImageMap   || {};
  const titleMap = window.CL_SHOP?.titleImageMap  || {};

  if (bike.sku && skuMap[bike.sku]) return skuMap[bike.sku];

  const normalized = _norm(bike.name);
  if (titleMap[normalized]) return titleMap[normalized];

  // Strip brand prefix for title map lookup (Lightspeed names include brand)
  const brand = _norm(bike.brand || '');
  const nameNoBrand = brand && normalized.startsWith(brand)
    ? normalized.slice(brand.length).trim()
    : normalized;
  if (nameNoBrand !== normalized && titleMap[nameNoBrand]) return titleMap[nameNoBrand];

  // Static SHOP_BIKES catalog fallback — Lightspeed names include size/color
  // so use startsWith: "bobcat trail 4 27 5 tan small".startsWith("bobcat trail 4 27 5")
  const staticMatch = SHOP_BIKES.find(s => {
    const sn = _norm(s.name);
    return sn === normalized || sn === nameNoBrand ||
      nameNoBrand.startsWith(sn) || normalized.startsWith(sn);
  });
  if (!staticMatch) return null;
  // Prefer the curated bike-data.js image over the potentially stale SHOP_BIKES img
  return window.BIKE_DATA?.[staticMatch.handle]?.images?.[0] || staticMatch.img || null;
}

// ── Real data helpers (from bike-data.js) ─────────────────────
const getBikeData = (b) => {
  if (!window.BIKE_DATA) return {};
  if (window.BIKE_DATA[b.handle]) return window.BIKE_DATA[b.handle];
  // Lightspeed bikes have SKU as handle — match by normalized name instead
  if (b.fromLightspeed && b.name) {
    const brand   = _norm(b.brand || (b.name || '').split(' ')[0] || '');
    const fullN   = _norm(b.name);
    const namePart = brand && fullN.startsWith(brand) ? fullN.slice(brand.length).trim() : fullN;
    for (const [hdl, data] of Object.entries(window.BIKE_DATA)) {
      const hdlN = hdl.replace(/-/g, ' ');
      const hdlPart = brand && hdlN.startsWith(brand) ? hdlN.slice(brand.length).trim() : hdlN;
      if (namePart.startsWith(hdlPart) || hdlPart.length >= 6 && namePart.startsWith(hdlPart.slice(0, 6))) {
        return data;
      }
    }
  }
  return {};
};

const getBikeSpecs = (b) => {
  const data = getBikeData(b);
  const tags = (b.tags || '').toLowerCase();
  const ws   = tags.includes('27.5') ? '27.5"' : tags.includes('29') ? '29"' : '700c';
  if (data.specs && Object.keys(data.specs).length >= 2) {
    const rows = Object.entries(data.specs)
      .filter(([k, v]) => k && v && k.length < 28 && v.length > 1)
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }));
    return [
      ...rows,
      { label: 'Bike Type', value: b.type || '' },
      
      { label: 'Warranty',  value: '2-year frame & fork, 1-year components' },
    ];
  }
  return [
    { label: 'Brand',     value: b.brand || b.vendor || '' },
    { label: 'Type',      value: b.type || '' },
    { label: 'Wheel Size',value: ws },
    
    { label: 'Warranty',  value: '2-year frame & fork, 1-year components' },
  ];
};

const getBikeDescription = (b) => {
  const data = getBikeData(b);
  if (data.description && data.description.length > 40) return data.description;
  const vendor = b.brand || b.vendor || '';
  const name   = b.name || b.title || '';
  const type   = b.type || '';
  if (type === 'Mountain')  return `The ${vendor} ${name} is built for the trails around Kelowna and the Okanagan. Whether you're lapping Knox Mountain, exploring Bear Creek, or heading into the backcountry — this bike is ready.`;
  if (type === 'Gravel')    return `The ${vendor} ${name} is your ticket to everything the Okanagan has to offer. Gravel roads, forest service tracks, loaded touring — it handles it all with confidence.`;
  if (type === 'E-Bike')    return `The ${vendor} ${name} brings intelligent e-assist to your daily rides. Commuting, exploring, or just going further with less effort — this bike opens up more of Kelowna without breaking a sweat.`;
  if (type === 'Commuter')  return `The ${vendor} ${name} is built for getting around Kelowna efficiently and comfortably. Reliable, low-maintenance, and ready every day.`;
  if (type === 'Comfort')   return `The ${vendor} ${name} is designed for riders who want a comfortable, relaxed ride — perfect for the Okanagan Rail Trail and easy weekend rides.`;
  if (type === 'Kids')      return `The ${vendor} ${name} is built to grow young riders' confidence and love of cycling. Lightweight, properly sized, and genuinely fun.`;
  return `The ${vendor} ${name} — quality components, solid performance, backed by ChainLine's expert service team since 2009.`;
};

// ── Bike Detail Page ──────────────────────────────────────────
const BikePage = ({ bike, onBack, onCart }) => {
  const [adding, setAdding] = React.useState(false);
  const [added, setAdded]   = React.useState(false);

  const b = bike || {};
  const specs = getBikeSpecs(b);
  const desc  = getBikeDescription(b);
  const data  = getBikeData(b);
  // Collect all images: resolved image + any extras from CSV
  const allImgs = (() => {
    const resolved = resolveImage(b);
    const imgs = [];
    if (resolved) imgs.push(resolved);
    (data.images || []).forEach(u => { if (u && !imgs.includes(u)) imgs.push(u); });
    return imgs;
  })();
  const [activeImg, setActiveImg] = React.useState(0);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await window.clAddToCart(b.handle, b.name || b.title, b.price, resolveImage(b), b.sku);
      setAdded(true);
      setTimeout(() => { setAdded(false); if (onCart) onCart(); }, 600);
    } catch(e) { console.warn(e); }
    setAdding(false);
  };

  if (!bike) return (
    <div className="page-fade" style={{ paddingTop: 160, textAlign: 'center' }}>
      <p style={{ color: 'var(--gray-500)' }}>No bike selected.</p>
      <button className="btn btn-outline" style={{ marginTop: 24 }} onClick={onBack}>← Back to Shop</button>
    </div>
  );

  return (
    <div className="page-fade bike-page">
      {/* Back */}
      <div style={{ position: 'sticky', top: 78, zIndex: 50, background: 'rgba(250,250,250,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--hairline)', padding: '14px 0' }}>
        <div className="container-wide" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} data-cursor="link" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
            ← Back to Shop
          </button>
          <span style={{ color: 'var(--hairline)', fontSize: 20 }}>|</span>
          <span className="eyebrow">{b.brand || b.vendor}  ·  {b.type}</span>
        </div>
      </div>

      {/* Main layout */}
      <div className="container-wide bike-page-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, paddingTop: 64, paddingBottom: 100 }}>

        {/* Image gallery */}
        <div style={{ position: 'sticky', top: 140, height: 'fit-content' }}>
          <div style={{ background: 'var(--paper)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12 }}>
            {allImgs.length > 0
              ? <img src={allImgs[activeImg]} alt={(b.name || b.title) + ' ' + (activeImg+1)}
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8%' }}
                  onError={e => { e.target.style.display='none'; }} />
              : <div className="ph ph-corners" style={{ width: '100%', height: '100%' }}>
                  <span className="ph-label">{(b.brand||b.vendor||'').toUpperCase()}  ·  BIKE PHOTO</span>
                </div>
            }
          </div>
          {allImgs.length > 1 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {allImgs.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} data-cursor="link"
                  style={{ flex: 1, aspectRatio: '1', background: 'var(--paper)', border: '2px solid ' + (i === activeImg ? 'var(--black)' : 'transparent'), overflow: 'hidden', padding: 4 }}>
                  <img src={img} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="eyebrow reveal" style={{ marginBottom: 12 }}>{b.brand || b.vendor}</div>
          <h1 className="display-l reveal" style={{ marginBottom: 8 }}>{b.name || b.title}</h1>
          <div className="reveal" style={{ fontFamily: 'var(--display)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 500, marginBottom: 16 }}>
            ${(b.price || 0).toLocaleString()} CAD
          </div>

          {/* Live stock status */}
          <div className="reveal" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28, padding:'10px 16px', background: b.inStock !== false ? 'rgba(22,163,74,0.06)' : 'var(--gray-100)', border:'1px solid ' + (b.inStock !== false ? 'rgba(22,163,74,0.25)' : 'var(--hairline)'), borderRadius:2 }}>
            {b.inStock !== false ? (
              <>
                <span className="stock-dot stock-dot-lg" />
                <span style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:'.14em', textTransform:'uppercase', color:'#16a34a', fontWeight:500 }}>In Stock — Ready to ride</span>
              </>
            ) : (
              <>
                <span style={{ width:10, height:10, borderRadius:'50%', background:'var(--gray-400)', display:'inline-block', flexShrink:0 }} />
                <span style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--gray-500)' }}>Available by Special Order — contact us</span>
              </>
            )}
          </div>

          <p className="reveal" style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--gray-600)', marginBottom: 40, maxWidth: 480 }}>{desc}</p>

          <div className="reveal" style={{ display: 'flex', gap: 12, marginBottom: 48, flexWrap: 'wrap' }}>
            <button className="btn" data-cursor="link" onClick={handleAdd} disabled={adding} style={{ flex: '1 1 200px', justifyContent: 'center' }}>
              {added ? 'Added to Cart ✓' : adding ? 'Adding…' : 'Add to Cart'}
              {!adding && !added && <ArrowRight />}
            </button>
            <button className="btn btn-outline" data-cursor="link" onClick={() => window.cl.go('book')} style={{ flex: '1 1 160px', justifyContent: 'center' }}>
              Book a Test Ride
            </button>
          </div>

          {/* Specs */}
          <div className="reveal">
            <div className="section-label" style={{ marginBottom: 24 }}>Specs  /  {b.name || b.title}</div>
            <div style={{ borderTop: '1px solid var(--hairline)' }}>
              {specs.map((s, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--hairline)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--gray-500)', paddingTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {b.tags && (
            <div className="reveal" style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {b.tags.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
                <span key={i} className="pill" style={{ color: 'var(--gray-500)', borderColor: 'var(--hairline)' }}>{t}</span>
              ))}
            </div>
          )}

          {/* Store info */}
          <div className="reveal" style={{ marginTop: 48, padding: 28, background: 'var(--paper)', borderTop: '2px solid var(--black)' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>In-Store Expert Advice</div>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 16, lineHeight: 1.6 }}>
              Not sure on sizing or spec? Our team rides what we sell. Drop in or call and we'll help you find the right bike.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button className="link-underline" data-cursor="link" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }} onClick={() => window.cl.go('contact')}>
                Contact Us →
              </button>
              <a href="tel:2508601968" className="link-underline" data-cursor="link" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }}>
                250-860-1968 →
              </a>
            </div>
          </div>
        </div>
      </div>
      <Newsletter />
    </div>
  );
};

// ── Master bike catalog (all 34 bikes from CSV) ───────────────
const SHOP_BIKES = [
  { brand:"Marin", name:"Bobcat Trail 4 27.5", handle:"marin-bobcat-trail-4-27-5", type:"Mountain", tags:"Mountain Bike, 27.5\" wheels", price:1000, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOBCAT_TRAIL_4_275_BLUE_SIDE_grande.png?v=1753779684" },
  { brand:"Marin", name:"Bobcat Trail 3 29",   handle:"marin-bobcat-trail-3-29",   type:"Mountain", tags:"Mountain Bike, 29\" wheels",  price:960,  img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOBCAT_TRAIL_3_29_RED_GRAY_SIDE_grande.png?v=1753779938" },
  { brand:"Marin", name:"Bobcat Trail 4 29",   handle:"marin-bobcat-trail-4-29",   type:"Mountain", tags:"Mountain Bike, 29\" wheels",  price:1060, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOBCAT_TRAIL_4_275_BLUE_SIDE_grande.png?v=1753779684" },
  { brand:"Marin", name:"Bobcat Trail 5 29",   handle:"marin-bobcat-trail-5-29",   type:"Mountain", tags:"Mountain Bike, 29\" wheels",  price:1360, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOBCAT_TRAIL_5_275_BLUE_BLACK_FRONT_grande.png?v=1753779495" },
  { brand:"Marin", name:"Bolinas Ridge 1 27.5",handle:"marin-bolinas-ridge-1-27-5",type:"Mountain", tags:"Mountain Bike, 27.5\" wheels", price:760,  img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOLINAS_RIDGE_1_27_CHARCOAL_SIDE_grande.png?v=1755782077" },
  { brand:"Marin", name:"Bolinas Ridge 1 29",  handle:"marin-bolinas-ridge-1-29",  type:"Mountain", tags:"Mountain Bike, 29\" wheels",  price:760,  img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOLINAS_RIDGE_1_27_CHARCOAL_SIDE_grande.png?v=1755782077" },
  { brand:"Marin", name:"Bolinas Ridge 2 29",  handle:"marin-bolinas-ridge-2-29",  type:"Mountain", tags:"Mountain Bike, 29\" wheels",  price:800,  img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOLINAS_RIDGE_2_27_BLACK_grande.png?v=1755781803" },
  { brand:"Marin", name:"Wildcat Trail 1 27.5",handle:"marin-wildcat-trail-1-27-5",type:"Mountain", tags:"Mountain Bike, 27.5\" wheels, Women's", price:860, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_WILDCAT_TRAIL_1_275_PURPLE_SIDE_grande.png?v=1753783522" },
  { brand:"Marin", name:"Pine Mountain 1 29",  handle:"marin-pine-mountain-1-29",  type:"Mountain", tags:"Mountain Bike, 29\" wheels",  price:1960, img:"https://marinbikes.com/cdn/shop/files/2024_MARIN_BIKES_PINE_MOUNTAIN_1_BLUE_SIDE_1_grande.png?v=1753864935" },
  { brand:"Transition", name:"Sentinel",             handle:"transition-sentinel",             type:"Mountain", tags:"Mountain Bike, Full Suspension", price:8900, badge:"PRO", img:"https://www.transitionbikes.com/images/Sentinel_MainPage_HannahBlur.jpg" },
  { brand:"Transition", name:"Spire Carbon Eagle 90",handle:"transition-spire-carbon-eagle-90",type:"Mountain", tags:"Mountain Bike, Carbon, Full Suspension", price:9700, badge:"PRO", img:"https://www.transitionbikes.com/images/MainLandingImage_Spire2020_V2.jpg" },
  { brand:"Pivot", name:"Switchblade Ride Eagle 70/90", handle:"pivot-switchblade-ride-eagle-70-90", type:"Mountain", tags:"Mountain Bike, Full Suspension", price:8000, badge:"PRO", img:"https://cms.pivotcycles.com/wp-content/uploads/2025/11/switchbladev3-highlight-right-aurhm3my.jpg" },
  { brand:"Surly", name:"Sorceress",    handle:"surly-sorceress",    type:"Mountain", tags:"Mountain Bike, Fat Bike",  price:3400, img:"https://surlybikes.com/cdn/shop/files/surly-sorceress-eagle-90-bike-purple-BK01561.jpg?v=1774378038&width=1946" },
  { brand:"Marin", name:"Gestalt 2",   handle:"marin-gestalt-2",    type:"Gravel",   tags:"Gravel Bike, 700c",        price:2000, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_GESTALT_2_BLACK_SIDE_grande.png?v=1753870775" },
  { brand:"Marin", name:"Gestalt X10", handle:"marin-gestalt-x10",  type:"Gravel",   tags:"Gravel Bike, 700c",        price:1400, img:"https://marinbikes.com/cdn/shop/files/2023_Gestalt_X10_GalleryE_side.jpg?v=1744825311&width=1000" },
  { brand:"Marin", name:"Nicasio 2",   handle:"marin-nicasio-2",    type:"Gravel",   tags:"Gravel Bike, 700c",        price:2300, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_NICASIO_2_RED_SIDE_grande.png?v=1753866430" },
  { brand:"Marin", name:"Presidio 3",  handle:"marin-presidio-3",   type:"Gravel",   tags:"Gravel Bike, 700c",        price:1470, img:"https://marinbikes.com/cdn/shop/files/2024_MARIN_PRESIDIO_3_BLUE_SIDE_grande.png?v=1753868606" },
  { brand:"Marin", name:"Four Corners 1",handle:"marin-four-corners-1",type:"Gravel",tags:"Touring Bike, Gravel",     price:1600, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_FOUR_CORNERS_1_BLACK_SIDE_grande.png?v=1753786228" },
  { brand:"Surly", name:"Bridge Club", handle:"surly-bridge-club",  type:"Gravel",   tags:"Gravel Bike, Adventure",   price:1850, img:"https://surlybikes.com/cdn/shop/files/surly-bridge-club-bike-lingering-cranberry-BK01508.jpg?v=1773411087&width=1946" },
  { brand:"Marin", name:"Stinson E",    handle:"marin-stinson-e",    type:"E-Bike",  tags:"Electric Bike, City",      price:2100, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_STINSON_E_BLACK_SIDE_1_grande.png?v=1753862906" },
  { brand:"Marin", name:"Stinson E ST", handle:"marin-stinson-e-st", type:"E-Bike",  tags:"Electric Bike, Step-Through", price:2100, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_STINSON_E_SILVER_SIDE_52da63a1-edc3-401a-a329-2405e10cfb54_grande.png?v=1755715647" },
  { brand:"Pivot",      name:"Shuttle AM Ride Eagle 70/90",handle:"pivot-shuttle-am-ride-eagle-70-90",  type:"E-Bike", tags:"Electric Bike, Full Suspension", price:11500, badge:"PRO", img:"https://cms.pivotcycles.com/wp-content/uploads/2025/10/shuttleam-photo-gallery-beauty-4-msswiet3.jpg" },
  { brand:"Transition", name:"Regulator CX Eagle 90",      handle:"transition-regulator-cx-eagle-90",  type:"E-Bike", tags:"Electric Bike, Full Suspension", price:13000, badge:"PRO", img:"https://www.transitionbikes.com/images/Sentinel_MainPage_HannahBlur.jpg" },
  { brand:"Marin", name:"Fairfax 1",       handle:"marin-fairfax-1",      type:"Commuter", tags:"Dual-Sport, Commuter",    price:700,  img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_FAIRFAX_1_RED_SIDE_4f661e02-11de-454f-bb55-5ef9d8d805fc_grande.png?v=1755769099" },
  { brand:"Marin", name:"Fairfax 2",       handle:"marin-fairfax-2",      type:"Commuter", tags:"Dual-Sport, Commuter",    price:960,  img:"https://marinbikes.com/cdn/shop/files/2022_MARIN_FAIRFAX_2_MAROON_SIDE_391346d2-76af-4fa7-8e8a-4f0a68e0cf32_grande.png?v=1753872171" },
  { brand:"Marin", name:"San Anselmo DS2", handle:"marin-san-anselmo-ds2",type:"Commuter", tags:"Dual-Sport, Women's",     price:960,  img:"https://marinbikes.com/cdn/shop/files/2021_San_Anselmo_DS1_Color.jpg?v=1744825386&width=1000" },
  { brand:"Marin", name:"Kentfield ST 1",  handle:"marin-kentfield-st-1", type:"Commuter", tags:"City, Comfort",           price:670,  img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_KENTFIELD_1_ST_CHARCOAL_SIDE_grande.png?v=1753788056" },
  { brand:"Marin", name:"Kentfield ST 2",  handle:"marin-kentfield-st-2", type:"Commuter", tags:"City, Comfort",           price:900,  img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_KENTFIELD_2_ST_SILVER_SIDE_grande.png?v=1753788076" },
  { brand:"Marin", name:"Stinson 1 27.5",    handle:"marin-stinson-1-27-5",    type:"Comfort", tags:"Comfort, Cruiser, 27.5\"", price:860, img:"https://marinbikes.com/cdn/shop/files/2024_MARIN_STINSON_1_BLACK_SIDE_grande.png?v=1755792681" },
  { brand:"Marin", name:"Stinson 1 LS 27.5", handle:"marin-stinson-1-ls-27-5", type:"Comfort", tags:"Comfort, Step-Through",   price:800, img:"https://marinbikes.com/cdn/shop/files/2024_MARIN_STINSON_1_ST_BROWN_SIDE_grande.png?v=1755792592" },
  { brand:"Marin", name:"Stinson 2 LS 27.5", handle:"marin-stinson-2-ls-27-5", type:"Comfort", tags:"Comfort, Step-Through",   price:900, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_STINSON_LS_2_SILVER_SIDE_grande.png?v=1753799688" },
  { brand:"Marin", name:"Bayview Trail",  handle:"marin-bayview-trail",  type:"Kids", tags:"Kids Bike, 24\"", price:600, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BAYVIEW_TRAIL_24_RED_SIDE_b00a2921-5476-4067-9ed7-c48ee7cd06c1.png?v=1755780477&width=500" },
  { brand:"Marin", name:"Donky Jr",       handle:"marin-donky-jr",       type:"Kids", tags:"Kids Bike, 24\"", price:430, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_DONKEY_JR_24_AQUA_BLUE_SIDE_2005a345-ce2b-4b9f-9baf-52f1bb79129a_grande.png?v=1755784888" },
  { brand:"Marin", name:"Rift Zone Jr",   handle:"marin-rift-zone-jr",   type:"Kids", tags:"Kids Bike, Mountain, 24\"", price:2200, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_RIFT_ZONE_JR_24_GREEN_SIDE_grande.png?v=1753783522" },
  // ── Marin full-suspension & trail hardtails ────────────────────
  { brand:"Marin", name:"Rift Zone 2",    handle:"marin-rift-zone-2",    type:"Mountain", tags:"Mountain Bike, Full Suspension, 29\"", price:1975, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_RIFT_ZONE_2_GRAY_BLUE_SIDE.png?v=1755774007&width=1000" },
  { brand:"Marin", name:"San Quentin 1",  handle:"marin-san-quentin-1",  type:"Mountain", tags:"Mountain Bike, 27.5\"",               price:1350, img:"https://marinbikes.com/cdn/shop/files/MARIN_SAN_QUENTIN_1_STUDIO_SIDE_2000PX.png?v=1761745617&width=1000" },
  { brand:"Marin", name:"San Quentin 2",  handle:"marin-san-quentin-2",  type:"Mountain", tags:"Mountain Bike, 27.5\"",               price:1800, img:"https://marinbikes.com/cdn/shop/files/MARINSANQUENTIN2STUDIOSIDE2000PX.png?v=1761745839&width=1000" },
  // ── Transition full lineup ─────────────────────────────────────
  { brand:"Transition", name:"Spur",         handle:"transition-spur",         type:"Mountain", tags:"Mountain Bike, Cross-Country, 29\"", price:6000, img:"https://www.transitionbikes.com/images/FC_Spur.jpg" },
  { brand:"Transition", name:"Smuggler",     handle:"transition-smuggler",     type:"Mountain", tags:"Mountain Bike, Trail/Enduro, 29\"",  price:6500, img:"https://www.transitionbikes.com/images/FC_Smug.jpg" },
  { brand:"Transition", name:"Bottlerocket", handle:"transition-bottlerocket", type:"Mountain", tags:"Mountain Bike, Freeride",             price:6500, img:"https://www.transitionbikes.com/images/M2-BR.jpg" },
  { brand:"Transition", name:"PBJ",          handle:"transition-pbj",          type:"Mountain", tags:"Dirt Jump, Park, Slopestyle",         price:1900, img:"https://www.transitionbikes.com/images/FC-PBJ.jpg" },
  // ── Surly full lineup ──────────────────────────────────────────
  { brand:"Surly", name:"Karate Monkey",    handle:"surly-karate-monkey",    type:"Mountain", tags:"Mountain Bike, Hardtail, 29\"",     price:2800, img:"https://surlybikes.com/cdn/shop/files/surly-karate-monkey-front-suspension-bike-blue-BK00263-2000px-sq.jpg?v=1742063134&width=1946" },
  { brand:"Surly", name:"Ice Cream Truck",  handle:"surly-ice-cream-truck",  type:"Mountain", tags:"Fat Bike, Snow, Sand",              price:3500, img:"https://surlybikes.com/cdn/shop/files/surly-ice-cream-truck-bike-yellow-BK00596-2000px-sq.jpg?v=1741976875&width=1946" },
  // ── Knolly ────────────────────────────────────────────────────
  { brand:"Knolly", name:"Fugitive",  handle:"knolly-fugitive",  type:"Mountain", tags:"Mountain Bike, Enduro, Full Suspension", price:4550, badge:"PRO", img:"https://knollybikes.com/cdn/shop/files/Shopify_Social_Sharing_Image.jpg?v=1657576224" },
];

// SHOP
const ShopPage = () => {
  const intent = window.cl?.intent || null;
  const [brand, setBrand]       = React.useState(intent?.brand || "All");
  const [type,  setType]        = React.useState("All");
  const [sort, setSort]         = React.useState("featured");
  const [liveProducts, setLiveProducts] = React.useState(null);
  const [liveLoading, setLiveLoading]   = React.useState(true);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  // Apply intent from nav links (brand / type filter)
  React.useEffect(() => {
    if (window.cl?.intent?.brand) { setBrand(window.cl.intent.brand); setType("All"); }
    if (window.cl?.intent?.type)  { setType(window.cl.intent.type);   setBrand("All"); }
    if (window.cl?.intent) window.cl.intent = null;
  });

  // Re-render when Shopify images arrive so resolveImage() picks them up
  React.useEffect(() => {
    const onShopify = () => forceUpdate();
    window.addEventListener('shopify:ready', onShopify);
    return () => window.removeEventListener('shopify:ready', onShopify);
  }, []);

  // Load live Lightspeed inventory
  React.useEffect(() => {
    // Use cached data immediately if already loaded (handles rapid navigation)
    if (window.CL_LS?.loaded) {
      const bikes = window.lightspeedGetBikes();
      if (bikes?.length > 0) { setLiveProducts(bikes); setLiveLoading(false); return; }
    }

    const load = async () => {
      try {
        await window.lightspeedReady;
        if (window.CL_LS && window.CL_LS.loaded) {
          const bikes = window.lightspeedGetBikes();
          if (bikes && bikes.length > 0) setLiveProducts(bikes);
        }
      } catch(e) {}
      setLiveLoading(false);
    };
    load();

    const onReady = () => {
      const bikes = window.lightspeedGetBikes();
      if (bikes && bikes.length > 0) { setLiveProducts(bikes); setLiveLoading(false); }
    };
    window.addEventListener('lightspeed:ready', onReady);
    return () => window.removeEventListener('lightspeed:ready', onReady);
  }, []);

  // Catalog: SHOP_BIKES merged with live Lightspeed stock data
  const allProducts = React.useMemo(() => {
    if (!liveProducts) return SHOP_BIKES;
    return SHOP_BIKES.map(s => {
      const sb  = _norm(s.brand || '');
      const sKw = _norm(s.name).split(' ').filter(w => w.length >= 4);
      const live = liveProducts.find(l => {
        const lb = _norm((l.name || '').split(' ')[0]);
        if (lb !== sb) return false;
        const ln = _norm(l.name);
        return sKw.length === 0 || sKw.every(w => ln.includes(w));
      });
      return live ? { ...s, price: live.price, inStock: true, qty: live.qty } : { ...s, inStock: false };
    });
  }, [liveProducts]);

  const ALL_BRANDS = ["Marin","Transition","Surly","Pivot","Salsa","Bianchi","Moots","Knolly","Revel"];
  const SPECIAL_ORDER_ONLY = ["Knolly","Revel"]; // no bikes currently in stock for these brands
  const TYPE_TABS = ["All","Mountain","Gravel","E-Bike","Commuter","Comfort","Kids"];

  // Brand filter: show full catalog for selected brand (instock + orderable).
  // No brand filter: show only in-stock bikes.
  let filtered = brand !== "All"
    ? allProducts.filter(b => (b.brand || b.vendor || '') === brand && b.type !== undefined)
    : allProducts.filter(b => b.inStock !== false);

  // Type filter
  if (type !== "All") filtered = filtered.filter(b => b.type === type);

  if (sort === "price-asc")  filtered = [...filtered].sort((a,b) => a.price - b.price);
  if (sort === "price-desc") filtered = [...filtered].sort((a,b) => b.price - a.price);

  const tabStyle = (active) => ({
    padding:"5px 14px", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em",
    textTransform:"uppercase", background:"transparent", border:"none", cursor:"pointer",
    whiteSpace:"nowrap", flexShrink:0, color: active ? "var(--black)" : "var(--gray-400)",
    borderBottom:"2px solid " + (active ? "var(--black)" : "transparent"), transition:"all .2s"
  });

  const isSpecialOrderBrand = SPECIAL_ORDER_ONLY.includes(brand);

  return (
    <div className="page-fade">
      <SubHero eyebrow="Shop  /  All Bikes" title="The Bikes." italic="Performance for every terrain." />

      {/* ── Loading bar ── */}
      {liveLoading && (
        <div style={{ position:"sticky", top:78, zIndex:51, height:3, background:"var(--paper)", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:"-60%", width:"60%", height:"100%", background:"var(--black)", animation:"shopLoadBar 1.4s ease-in-out infinite" }} />
        </div>
      )}

      {/* ── Filter + sort bar ── */}
      <div className="shop-filter-sticky" style={{ position:"sticky", top: liveLoading ? 81 : 78, zIndex:50, background:"rgba(250,250,250,0.97)", backdropFilter:"blur(12px)", borderBottom:"1px solid var(--hairline)" }}>

        {/* Row 1: count + active brand pill + sort */}
        <div className="container-wide" style={{ paddingTop:"12px", paddingBottom:0, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-500)" }}>
            {liveLoading ? "Loading…" : `${filtered.length} bikes${liveProducts ? " · Live" : ""}`}
          </div>
          {brand !== "All" && (
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 10px", background:"var(--black)", color:"var(--white)", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase" }}>
              {brand}
              <button onClick={() => { setBrand("All"); setType("All"); }} data-cursor="link"
                style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", fontSize:12, lineHeight:1, padding:0, opacity:.7 }}>×</button>
            </div>
          )}
          <div style={{ marginLeft:"auto" }}>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".08em", textTransform:"uppercase", border:"1px solid var(--hairline)", padding:"5px 10px", background:"var(--white)", outline:"none" }}>
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        {/* Row 2: type tabs + brand chips */}
        <div className="container-wide" style={{ display:"flex", alignItems:"center", paddingTop:"6px", paddingBottom:"10px", overflowX:"auto", scrollbarWidth:"none" }}>
          {TYPE_TABS.map(t => (
            <button key={t} data-cursor="link" onClick={() => setType(t)} style={tabStyle(type === t)}>{t}</button>
          ))}
          <div style={{ width:1, height:16, background:"var(--hairline)", margin:"0 10px", flexShrink:0 }} />
          {ALL_BRANDS.map(br => {
            const cnt = allProducts.filter(b => (b.brand || b.vendor || '') === br).length;
            if (cnt === 0) return null;
            const active = brand === br;
            return (
              <button key={br} data-cursor="link"
                onClick={() => { setBrand(active ? "All" : br); setType("All"); }}
                style={{ ...tabStyle(active), color: active ? "var(--black)" : "var(--gray-500)", display:"flex", alignItems:"center", gap:5 }}>
                {br}
                <span style={{ fontFamily:"var(--mono)", fontSize:9, opacity:.5 }}>{cnt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grid ── */}
      <section style={{ padding:"60px 0 100px", background:"var(--white)" }}>
        <div className="container-wide">
          {isSpecialOrderBrand ? (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div className="display-m" style={{ marginBottom:16 }}>{brand} · Special Order</div>
              <p style={{ color:"var(--gray-500)", maxWidth:480, margin:"0 auto 32px", lineHeight:1.65 }}>
                We carry {brand} bikes by special order. Contact us to discuss models, pricing, and lead times — we'll find the right build for you.
              </p>
              <button className="btn" data-cursor="link" onClick={() => window.cl.go("contact")}>Contact Us <ArrowRight /></button>
            </div>
          ) : filtered.length === 0 && !liveLoading ? (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div className="display-m" style={{ marginBottom:16 }}>No bikes found.</div>
              <p style={{ color:"var(--gray-500)", marginBottom:32 }}>Try a different filter or check back when we get new stock in.</p>
              <button className="btn btn-outline" data-cursor="link" onClick={() => { setBrand("All"); setType("All"); }}>Show All Bikes <ArrowRight /></button>
            </div>
          ) : (
            <>
              {liveLoading && filtered.length === 0 && (
                <div className="shop-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:40 }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i}>
                      <div className="skeleton" style={{ aspectRatio:"4/5", marginBottom:12 }} />
                      <div className="skeleton" style={{ height:12, width:"60%", marginBottom:8, borderRadius:4 }} />
                      <div className="skeleton" style={{ height:16, width:"80%", marginBottom:12, borderRadius:4 }} />
                      <div className="skeleton" style={{ height:40, borderRadius:2 }} />
                    </div>
                  ))}
                </div>
              )}
              {filtered.length > 0 && (
                <div className="shop-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:40 }}>
                  {filtered.map((b, i) => <BikeCardLarge key={b.handle} b={b} idx={i} />)}
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <Newsletter />
    </div>
  );
};

const BikeCardLarge = ({ b, idx }) => {
  const [adding, setAdding] = React.useState(false);
  const [added,  setAdded]  = React.useState(false);

  const name    = b.name  || b.title  || "";
  const brand   = b.brand || b.vendor || "";
  const img     = resolveImage(b);
  const price   = b.price || 0;
  // Stock — null means unknown (static data), use true as default
  const inStock = b.inStock !== false;
  const qty     = typeof b.qty === 'number' ? b.qty : null;
  const lowStock = qty !== null && qty > 0 && qty <= 3;

  const handleAdd = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!inStock) return;
    setAdding(true);
    try {
      await window.clAddToCart(b.handle, name, price, img, b.sku);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch(err) { console.warn(err); }
    setAdding(false);
  };

  const goToBike = () => window.cl.go("bike", { bike: b });

  return (
    <div style={{ cursor:"pointer" }} onClick={goToBike}>
      {/* Image */}
      <div style={{ aspectRatio:"4/5", marginBottom:14, position:"relative", background:"var(--paper)", overflow:"hidden" }}>
        {img ? (
          <img src={img} alt={brand + " " + name}
            loading="lazy" decoding="async"
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain", padding:"8%", mixBlendMode:"multiply", transition:"transform .4s ease" }}
            onError={e => { e.target.style.display='none'; }} />
        ) : (
          <div className="ph ph-corners" style={{ position:"absolute", inset:0 }}>
            <span className="ph-label">{brand.toUpperCase()}  ·  {b.type}</span>
          </div>
        )}
        {/* Stock / availability badges */}
        {inStock ? (
          <div style={{ position:"absolute", top:10, left:10, display:"flex", alignItems:"center", gap:6, padding:"4px 9px", background:"rgba(255,255,255,0.92)", border:"1px solid rgba(22,163,74,0.3)", borderRadius:2 }}>
            <span className="stock-dot" />
            <span style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".14em", textTransform:"uppercase", color:"#16a34a" }}>In Stock</span>
          </div>
        ) : (
          <div style={{ position:"absolute", top:10, left:10, padding:"4px 9px", background:"rgba(255,255,255,0.92)", color:"var(--gray-500)", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".14em", textTransform:"uppercase", border:"1px solid var(--hairline)" }}>
            Special Order
          </div>
        )}
        {lowStock && (
          <div style={{ position:"absolute", bottom:10, left:10, padding:"4px 9px", background:"rgba(255,255,255,0.92)", color:"#b45309", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".14em", textTransform:"uppercase", border:"1px solid rgba(180,83,9,0.3)" }}>
            Only {qty} left
          </div>
        )}
        {b.badge && (
          <div style={{ position:"absolute", top:10, right:10, padding:"4px 10px", background:"var(--black)", color:"var(--white)", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase" }}>{b.badge}</div>
        )}
        <div style={{ position:"absolute", inset:0, transition:"background .3s" }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'} />
      </div>
      {/* Info */}
      <div className="eyebrow" style={{ marginBottom:4 }}>{brand}  ·  {b.type}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:12 }}>
        <div style={{ fontFamily:"var(--display)", fontSize:"clamp(15px,1.4vw,19px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", lineHeight:1.2 }}>{name}</div>
        <div style={{ fontFamily:"var(--display)", fontSize:16, fontWeight:500, flexShrink:0 }}>${price.toLocaleString()}</div>
      </div>
      {/* Actions */}
      <div style={{ display:"flex", gap:8 }} onClick={e => e.stopPropagation()}>
        <button className="btn btn-outline" data-cursor="link" onClick={goToBike}
          style={{ flex:1, justifyContent:"center", padding:"11px 8px", fontSize:11 }}>
          View Bike
        </button>
        <button className="btn" data-cursor="link" onClick={handleAdd} disabled={adding || !inStock}
          style={{ flex:1, justifyContent:"center", padding:"11px 8px", fontSize:11 }}>
          {!inStock ? "Special Order" : added ? "Added ✓" : adding ? "…" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

// SubHero
const SubHero = ({ eyebrow, title, italic }) => (
  <section className="bg-black" style={{ paddingTop: 220, paddingBottom: 100, position: "relative", overflow: "hidden", color: "var(--white)" }}>
    <div className="ph" style={{ position: "absolute", inset: 0, opacity: 0.5 }}><span className="ph-label">B&W  /  HERO</span></div>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,10,10,0.6), rgba(10,10,10,0.95))" }} />
    <div className="container-wide" style={{ position: "relative" }}>
      <div className="eyebrow eyebrow-light" style={{ marginBottom: 32 }}>{eyebrow}</div>
      <h1 className="display-xxl"><SplitText delay={0.1}>{title}</SplitText></h1>
      {italic && <div className="serif-italic" style={{ fontSize: "clamp(28px, 4.5vw, 56px)", marginTop: 12, color: "var(--gray-300)" }}>{italic}</div>}
    </div>
  </section>
);

// SERVICES PAGE
const ServicesPage = () => {
  const [activeTab, setActiveTab] = React.useState("all");
  const tabs = ["all", "mountain", "road", "suspension"];

  const ALL_SERVICES = [
    // ── All Bikes ──
    { cat:"all", n:"01", name:"Tune-Up",                price:120,  desc:"Full adjustment, lube, safety check on all systems.",                time:"SAME DAY" },
    { cat:"all", n:"02", name:"Complete Overhaul",       price:250,  desc:"Full teardown, degrease, regrease, rebuild. Includes adjustment.", time:"3–5 DAYS" },
    { cat:"all", n:"03", name:"Bike Assessment",         price:30,   desc:"Thorough inspection with written report. Cost applied to repair.", time:"30 MIN"   },
    { cat:"all", n:"04", name:"Safety Check",            price:40,   desc:"Pre-ride safety inspection. Brakes, gears, headset, wheels.",      time:"30 MIN"   },
    { cat:"all", n:"05", name:"Flat Fix",                price:25,   desc:"Tube replacement including labour. Parts extra.",                  time:"SAME DAY" },
    { cat:"all", n:"06", name:"Flat Fix — E-Bike Rear",  price:80,   desc:"Rear hub motor wheel removal and tube/tire replacement.",         time:"SAME DAY" },
    { cat:"all", n:"07", name:"Wheel True",              price:25,   desc:"Hand-trued and tensioned per wheel.",                             time:"SAME DAY" },
    { cat:"all", n:"08", name:"Tubeless Set Up",         price:35,   desc:"Per wheel. Includes tape, valve, and sealant setup.",             time:"SAME DAY" },
    { cat:"all", n:"09", name:"Dropper Post Install",    price:50,   desc:"Full internal or external dropper post installation.",            time:"SAME DAY" },
    { cat:"all", n:"10", name:"Bar Wrap",                price:30,   desc:"Professional bar tape wrap. Tape not included.",                  time:"SAME DAY" },
    { cat:"all", n:"11", name:"CushCore Install",        price:50,   desc:"Per wheel. CushCore insert installation.",                        time:"1 DAY"    },
    { cat:"all", n:"12", name:"Accessory Install",       price:30,   desc:"Racks, fenders, lights, mirrors, computers, etc.",               time:"SAME DAY" },
    { cat:"all", n:"13", name:"Cable & Housing Full",    price:60,   desc:"Complete cable and housing replacement, all cables.",             time:"1–2 DAYS" },
    { cat:"all", n:"14", name:"Cable & Housing Half",    price:35,   desc:"Partial cable and housing refresh.",                              time:"1 DAY"    },
    // ── Mountain Bike ──
    { cat:"mountain", n:"01", name:"Tune-Up",                       price:120, desc:"Full mountain tune: drivetrain, brakes, suspension check.", time:"SAME DAY" },
    { cat:"mountain", n:"02", name:"Full Suspension Tune-Up",        price:220, desc:"Tune + suspension inspection and basic setup adjustment.",  time:"1–2 DAYS" },
    { cat:"mountain", n:"03", name:"E-Bike Tune-Up",                 price:120, desc:"Mountain e-bike tune including motor and battery check.",   time:"1–2 DAYS" },
    { cat:"mountain", n:"04", name:"Fork Seal Service",              price:65,  desc:"Lower leg removal, clean, new seals and foam rings.",       time:"1–2 DAYS" },
    { cat:"mountain", n:"05", name:"Shock Air Can Service",          price:45,  desc:"Air can removal, clean, new seals and oil.",                time:"1 DAY"    },
    { cat:"mountain", n:"06", name:"Dropper Post Service",           price:140, desc:"Full dropper post rebuild (Fox Transfer).",                 time:"1–2 DAYS" },
    { cat:"mountain", n:"07", name:"Shimano Clutch Service",         price:25,  desc:"Clean and re-grease Shimano clutch mechanism.",            time:"SAME DAY" },
    { cat:"mountain", n:"08", name:"E-Bike System Check & Firmware", price:25,  desc:"Bosch / Shimano Steps / Bafang firmware update + scan.",    time:"SAME DAY" },
    { cat:"mountain", n:"09", name:"50-Hour Suspension Service",     price:220, desc:"Recommended every 50hrs: full lower leg + shock service.", time:"2–3 DAYS" },
    { cat:"mountain", n:"10", name:"Cable Package — Internal Full",   price:60,  desc:"Full internal cable and housing replacement.",              time:"1–2 DAYS" },
    { cat:"mountain", n:"11", name:"Cable Package — Half",           price:35,  desc:"Partial cable refresh, internal routing.",                  time:"1 DAY"    },
    // ── Road Bike ──
    { cat:"road", n:"01", name:"Road Tune-Up",                      price:120, desc:"Road-specific adjustment: brakes, gears, headset, wheels.", time:"SAME DAY" },
    { cat:"road", n:"02", name:"Brake Bleed",                       price:60,  desc:"Hydraulic brake bleed per caliper. Parts extra.",           time:"SAME DAY" },
    { cat:"road", n:"03", name:"Wheel True",                        price:25,  desc:"Hand-trued and tensioned per wheel.",                       time:"SAME DAY" },
    { cat:"road", n:"04", name:"Full Cable Package",                price:60,  desc:"Complete shifter and brake cable + housing replacement.",   time:"1–2 DAYS" },
    { cat:"road", n:"05", name:"Half Cable Package",                price:35,  desc:"Partial cable and housing replacement.",                    time:"1 DAY"    },
    { cat:"road", n:"06", name:"Internal Full Cable Package",       price:60,  desc:"Full internal cable replacement including housing.",        time:"1–2 DAYS" },
    { cat:"road", n:"07", name:"Internal Half Cable Package",       price:35,  desc:"Partial internal cable replacement.",                       time:"1 DAY"    },
    { cat:"road", n:"08", name:"Bar Wrap",                          price:30,  desc:"Professional bar tape wrap. Tape not included.",            time:"SAME DAY" },
    // ── Suspension Factory Service ──
    { cat:"suspension", n:"01", name:"Fox Fork 125hr Factory",      price:230, desc:"Full Fox factory fork service at 125-hour interval.",       time:"1 WEEK"   },
    { cat:"suspension", n:"02", name:"Fox Shock Factory Full",      price:210, desc:"Full Fox shock factory rebuild and service.",               time:"1 WEEK"   },
    { cat:"suspension", n:"03", name:"Fox Transfer Dropper",        price:140, desc:"Full Fox Transfer dropper post factory service.",           time:"1 WEEK"   },
    { cat:"suspension", n:"04", name:"RockShox Fork FS Level 1",    price:140, desc:"Lower leg and open bath fork service.",                     time:"1 WEEK"   },
    { cat:"suspension", n:"05", name:"RockShox Fork FS Level 2",    price:170, desc:"Full charger damper + lower leg service.",                  time:"1 WEEK"   },
    { cat:"suspension", n:"06", name:"RockShox Shock RS Level 1",   price:150, desc:"Inline shock full service.",                               time:"1 WEEK"   },
    { cat:"suspension", n:"07", name:"RockShox Shock RS Level 2",   price:160, desc:"Full shock factory service.",                              time:"1 WEEK"   },
    { cat:"suspension", n:"08", name:"RockShox Vivid / Reaktiv",    price:180, desc:"High-end shock full factory service.",                     time:"1 WEEK"   },
    { cat:"suspension", n:"09", name:"RockShox Reverb Dropper",     price:160, desc:"Reverb dropper post factory service.",                     time:"1 WEEK"   },
    { cat:"suspension", n:"10", name:"Rockshox Fork 200hr",         price:230, desc:"Major 200-hour fork factory service interval.",            time:"1 WEEK"   },
  ];

  const services = activeTab === "all" ? ALL_SERVICES.filter(s => s.cat === "all") : ALL_SERVICES.filter(s => s.cat === activeTab);
  return (
    <div className="page-fade" data-screen-label="P03 Services">
      <SubHero eyebrow="Services  /  N°01" title="Your bike deserves" italic="the best." />
      <section className="section section-pad bg-white">
        <div className="container-wide">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:32 }}>
            <div className="reveal section-label">Service Menu  /  Pricing</div>
            <div style={{ display:"flex", gap:0, border:"1px solid var(--hairline)", borderRadius:2 }}>
              {[["all","All Bikes"],["mountain","Mountain"],["road","Road"],["suspension","Suspension"]].map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  style={{ padding:"8px 18px", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase", border:"none", borderRight: id !== "suspension" ? "1px solid var(--hairline)" : "none", background: activeTab === id ? "var(--black)" : "transparent", color: activeTab === id ? "var(--white)" : "var(--gray-500)", cursor:"pointer", transition:"all .2s" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--hairline)" }}>
            {services.map((s, i) => (
              <div key={i} className="page-svc-row" style={{ display: "grid", gridTemplateColumns: "60px 1.6fr 2fr 100px 120px 140px", gap: 24, padding: "28px 0", borderBottom: "1px solid var(--hairline)", alignItems: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".18em", color: "var(--gray-500)" }}>{s.n}</div>
                <div className="display-s" style={{ fontSize:"clamp(15px,1.4vw,20px)" }}>{s.name}</div>
                <div style={{ color: "var(--gray-500)", fontSize: 14, lineHeight:1.5 }}>{s.desc}</div>
                <div className="eyebrow">{s.time}</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 500 }}>${s.price}</div>
                <button className="btn btn-outline" data-cursor="link" onClick={() => window.cl.go("book")}>Book <ArrowRight /></button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-pad bg-black" data-screen-label="P03 Fitting">
        <div className="container-wide">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <div className="reveal ph ph-corners" style={{ aspectRatio: "4/5" }}><span className="ph-label">FITTING STUDIO  /  4:5</span></div>
            <div className="reveal reveal-d-2">
              <div className="section-label" style={{ color: "var(--gray-300)" }}>Bike Fitting  /  N°02</div>
              <h2 className="display-xl" style={{ marginBottom: 32 }}>Ride better.<br/><span className="serif-italic">Feel better.</span></h2>
              <p style={{ color: "var(--gray-300)", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                Four levels, all done in our dedicated studio with motion-capture analysis and a master fitter who's spent fifteen years on bikes.
              </p>
              {[
                { name: "Position Check", dur: "45 min", price: 80 },
                { name: "Road / Gravel Fit", dur: "2 hours", price: 220 },
                { name: "Mountain Bike Fit", dur: "2 hours", price: 220 },
                { name: "Full Body + Video", dur: "3 hours", price: 380 },
              ].map((f, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 100px", gap: 16, padding: "20px 0", borderTop: "1px solid var(--hairline-light)", alignItems: "center" }}>
                  <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 500, textTransform: "uppercase" }}>{f.name}</div>
                  <div className="eyebrow eyebrow-light">{f.dur}</div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 18 }}>${f.price}</div>
                  <button className="link-underline" data-cursor="link" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", textAlign: "right" }} onClick={() => window.cl.go("book")}>Book →</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="section section-pad bg-paper">
        <div className="container-wide">
          <div className="reveal section-label">Storage  /  N°03</div>
          <h2 className="display-xl reveal" style={{ marginBottom: 64 }}>Winter storage.<br/><span className="serif-italic">Spring ready.</span></h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {[
              { n: "01", t: "Drop off", d: "Anytime in October. We log the condition, take photos, tag it." },
              { n: "02", t: "Stored safe", d: "Climate-controlled, locked, monthly battery checks for e-bikes." },
              { n: "03", t: "Spring service", d: "Tuned, inspected, ready to roll the day you call to pick up." },
            ].map((s, i) => (
              <div key={i} className={"reveal reveal-d-" + (i + 1)} style={{ borderTop: "1px solid var(--hairline)", paddingTop: 28 }}>
                <div className="eyebrow" style={{ marginBottom: 16 }}>{s.n}</div>
                <div className="display-m" style={{ marginBottom: 16 }}>{s.t}</div>
                <p style={{ color: "var(--gray-500)", fontSize: 15, lineHeight: 1.6 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-pad-sm bg-black" style={{ borderTop: "1px solid var(--hairline-light)", padding: "60px 0" }}>
        <div className="container-wide">
          <div className="reveal" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gray-300)", alignItems: "center" }}>
            <span>Turnaround</span>
            <span>Basic Tune  ·  Same Day</span>
            <span>Full Overhaul  ·  3–5 Days</span>
            <span>Custom Build  ·  1–2 Weeks</span>
            <span>Suspension  ·  1 Week</span>
          </div>
        </div>
      </section>
    </div>
  );
};

// BOOK PAGE
const BookPage = () => {
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({});
  const update = (k, v) => setData(d => ({ ...d, [k]: v }));
  const next = () => setStep(s => Math.min(s + 1, 4));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const SERVICES = [
    "Tune-Up","Full Suspension Tune-Up","E-Bike Tune-Up","Complete Overhaul",
    "Fork Seal Service","Shock Air Can Service","Dropper Service","Brake Bleed",
    "Cable Package","Wheel Build","Tubeless Set Up","Flat Fix","Other / Not Sure",
  ];

  const inpStyle = { width:"100%", padding:"12px 0", border:"none", borderBottom:"1px solid var(--hairline)", fontSize:16, fontFamily:"var(--body)", background:"transparent", outline:"none", color:"var(--black)" };

  const submit = () => {
    const subject = encodeURIComponent(`Bike Assessment / Service Request`);
    const body = encodeURIComponent(
      `ChainLine — Service Booking Request\n\n` +
      `Customer:\nName: ${data.name||''}\nPhone: ${data.phone||''}\nEmail: ${data.email||''}\n\n` +
      `Bike:\nBrand: ${data.bikeBrand||''}\nModel: ${data.bikeModel||''}\nYear: ${data.bikeYear||''}\n\n` +
      `Service requested: ${data.service||'Assessment / Not specified'}\n` +
      `Preferred drop-off date: ${data.date||'Flexible'}\n\n` +
      `Issue / notes:\n${data.issue||'(none provided)'}\n\n` +
      `[Photo upload is not available by email — please bring photos on your phone or drop-in for the assessment]`
    );
    window.location.href = `mailto:bikes@chainline.ca?subject=${subject}&body=${body}`;
    next();
  };

  return (
    <div className="page-fade" data-screen-label="P04 Book">
      <SubHero eyebrow="Booking  /  N°01" title="Book an assessment." italic="Drop it off, we'll take care of the rest." />
      <section className="section section-pad bg-white">
        <div className="container-narrow">

          {/* Progress bar */}
          <div style={{ display:"flex", gap:6, marginBottom:40 }}>
            {[1,2,3,4].map(s => (
              <div key={s} style={{ flex:1, height:2, background: s <= step ? "var(--black)" : "var(--hairline)", transition:"background .3s" }} />
            ))}
          </div>
          <div className="eyebrow" style={{ marginBottom:24 }}>Step {step} of 4</div>

          {step === 1 && (
            <div>
              <h2 className="display-l" style={{ marginBottom:12 }}>Your details.</h2>
              <p style={{ color:"var(--gray-500)", fontSize:15, marginBottom:36 }}>We'll call or text to confirm your appointment.</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px 32px", marginBottom:24 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <div className="eyebrow" style={{ marginBottom:8 }}>Full Name *</div>
                  <input type="text" placeholder="Jane Smith" value={data.name||""} onChange={e=>update("name",e.target.value)} style={inpStyle} />
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom:8 }}>Phone Number *</div>
                  <input type="tel" placeholder="(250) 555-0100" value={data.phone||""} onChange={e=>update("phone",e.target.value)} style={inpStyle} />
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom:8 }}>Email (optional)</div>
                  <input type="email" placeholder="jane@example.com" value={data.email||""} onChange={e=>update("email",e.target.value)} style={inpStyle} />
                </div>
              </div>
              <button className="btn" data-cursor="link" disabled={!data.name || !data.phone} onClick={next} style={{ marginTop:8 }}>Continue <ArrowRight /></button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="display-l" style={{ marginBottom:12 }}>Your bike.</h2>
              <p style={{ color:"var(--gray-500)", fontSize:15, marginBottom:36 }}>Tell us what you're bringing in. Photos welcome — take one on your phone and show us when you drop off.</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px 32px", marginBottom:24 }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom:8 }}>Brand</div>
                  <input type="text" placeholder="e.g. Transition" value={data.bikeBrand||""} onChange={e=>update("bikeBrand",e.target.value)} style={inpStyle} />
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom:8 }}>Model</div>
                  <input type="text" placeholder="e.g. Sentinel" value={data.bikeModel||""} onChange={e=>update("bikeModel",e.target.value)} style={inpStyle} />
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom:8 }}>Year</div>
                  <input type="text" placeholder="2023" value={data.bikeYear||""} onChange={e=>update("bikeYear",e.target.value)} style={inpStyle} />
                </div>
              </div>
              {/* Photo upload */}
              <div style={{ marginBottom:24 }}>
                <div className="eyebrow" style={{ marginBottom:8 }}>Photo of your bike (optional)</div>
                <label style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 20px", border:"1.5px dashed var(--hairline)", cursor:"pointer", color:"var(--gray-500)", fontFamily:"var(--mono)", fontSize:11, letterSpacing:".12em", textTransform:"uppercase" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  {data.photoName || "Upload a photo or take one now"}
                  <input type="file" accept="image/*" capture="environment" style={{ display:"none" }}
                    onChange={e => { const f = e.target.files[0]; if(f) update("photoName", f.name); }} />
                </label>
                {data.photoName && <p style={{ marginTop:8, fontSize:13, color:"var(--gray-500)" }}>✓ {data.photoName} — bring this photo with you or email it separately.</p>}
              </div>
              <div style={{ display:"flex", gap:12 }}>
                <button className="btn btn-outline" data-cursor="link" onClick={back}>← Back</button>
                <button className="btn" data-cursor="link" onClick={next}>Continue <ArrowRight /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="display-l" style={{ marginBottom:12 }}>What's needed?</h2>
              <p style={{ color:"var(--gray-500)", fontSize:15, marginBottom:28 }}>Select the service you're after, or choose "Assessment" if you're not sure — we'll diagnose and quote before touching anything.</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
                {SERVICES.map(s => (
                  <button key={s} onClick={() => update("service", s)} data-cursor="link"
                    style={{ padding:"16px 20px", border:"1.5px solid " + (data.service === s ? "var(--black)" : "var(--hairline)"), background: data.service === s ? "var(--black)" : "transparent", color: data.service === s ? "var(--white)" : "var(--black)", textAlign:"left", fontFamily:"var(--display)", fontSize:15, fontWeight:500, textTransform:"uppercase", transition:"all .2s", cursor:"pointer" }}>
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ marginBottom:24 }}>
                <div className="eyebrow" style={{ marginBottom:8 }}>Any other details?</div>
                <textarea rows={4} placeholder="Brakes feel spongy, rear derailleur skipping, pedal creak, etc..." value={data.issue||""}
                  onChange={e=>update("issue",e.target.value)}
                  style={{ ...inpStyle, borderBottom:"none", border:"1px solid var(--hairline)", padding:16, resize:"vertical", fontSize:14 }} />
              </div>
              <div style={{ display:"flex", gap:12 }}>
                <button className="btn btn-outline" data-cursor="link" onClick={back}>← Back</button>
                <button className="btn" data-cursor="link" onClick={next}>Continue <ArrowRight /></button>
              </div>
            </div>
          )}

          {step === 4 && data.name && (
            <div>
              <h2 className="display-l" style={{ marginBottom:12 }}>Preferred drop-off date.</h2>
              <p style={{ color:"var(--gray-500)", fontSize:15, marginBottom:28 }}>Pick a day to bring your bike in. We'll confirm by phone or email within 24 hours.</p>
              <Calendar onPick={(d) => update("date", d)} />
              {data.date && <p style={{ marginTop:12, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-500)" }}>Selected: {data.date}</p>}
              <div style={{ marginTop:32, display:"flex", gap:12, flexWrap:"wrap" }}>
                <button className="btn btn-outline" data-cursor="link" onClick={back}>← Back</button>
                <button className="btn" data-cursor="link" onClick={submit}>
                  Send Booking Request <ArrowRight />
                </button>
              </div>
              <p style={{ marginTop:16, fontSize:13, color:"var(--gray-400)", fontFamily:"var(--mono)", letterSpacing:".1em" }}>
                This sends a booking request to bikes@chainline.ca. We'll call to confirm.
              </p>
            </div>
          )}

          {step === 4 && !data.name && (
            <div style={{ textAlign:"center", padding:"40px 0" }}>
              <p style={{ color:"var(--gray-500)", marginBottom:24 }}>Please go back and fill in your name and phone number.</p>
              <button className="btn btn-outline" onClick={() => setStep(1)}>Start Over</button>
            </div>
          )}

          {/* Confirmation after submit */}
          {false && (
            <div>
              <h2 className="display-l" style={{ marginBottom: 16 }}>Request Sent ✓</h2>
              <p className="serif-italic" style={{ fontSize: 22, color: "var(--gray-500)", marginBottom: 32 }}>We'll be in touch within 24 hours to confirm your slot.</p>
              <div style={{ padding:"24px 28px", background:"var(--paper)", borderLeft:"3px solid var(--black)", marginBottom:32 }}>
                <p style={{ fontSize:14, color:"var(--gray-600)", lineHeight:1.7 }}>
                  Your booking request has been sent to <strong>bikes@chainline.ca</strong>. You'll receive a confirmation call or email to lock in your appointment time.<br/><br/>
                  Questions? Call us at <a href="tel:2508601968" style={{ fontWeight:600 }}>(250) 860-1968</a> — Mon–Sat 10am–6pm.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-outline" data-cursor="link" onClick={() => { setStep(1); setData({}); }}>Book another</button>
                <button className="btn" data-cursor="link" onClick={() => window.cl.go("home")}>Back home <ArrowRight /></button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section section-pad-sm bg-paper" style={{ padding: "80px 0" }}>
        <div className="container-wide">
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderTop: "1px solid var(--hairline)" }}>
            {[
              { n: "01", t: "Book Online", d: "Pick a service, time, and tell us about your bike." },
              { n: "02", t: "Drop Off", d: "Stop by the shop. We tag the bike, log the work order." },
              { n: "03", t: "We Call", d: "When it's ready. Pickup any time the shop is open." },
            ].map((s, i) => (
              <div key={i} style={{ padding: "32px 32px 32px 0", borderRight: i < 2 ? "1px solid var(--hairline)" : "none", paddingLeft: i > 0 ? 32 : 0 }}>
                <div className="eyebrow" style={{ marginBottom: 16 }}>{s.n}</div>
                <div className="display-m" style={{ marginBottom: 12 }}>{s.t}</div>
                <p style={{ color: "var(--gray-500)", fontSize: 15, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQs />
    </div>
  );
};

const Field = ({ label, placeholder, textarea, value, onChange }) => (
  <label style={{ display: "block" }}>
    <div className="eyebrow" style={{ marginBottom: 10 }}>{label}</div>
    {textarea ? (
      <textarea placeholder={placeholder} rows={4} value={value||""} onChange={e => onChange && onChange(e.target.value)}
        style={{ width: "100%", padding: "12px 0", border: "none", borderBottom: "1px solid var(--hairline)", outline: "none", fontFamily: "var(--body)", fontSize: 16, resize: "vertical", background: "transparent" }} />
    ) : (
      <input placeholder={placeholder} value={value||""} onChange={e => onChange && onChange(e.target.value)}
        style={{ width: "100%", padding: "12px 0", border: "none", borderBottom: "1px solid var(--hairline)", outline: "none", fontFamily: "var(--body)", fontSize: 16, background: "transparent" }} />
    )}
  </label>
);

const Calendar = ({ onPick }) => {
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS = ["S","M","T","W","T","F","S"];
  const now = new Date();
  const [view, setView] = React.useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const prevMonth = () => setView(new Date(year, month - 1, 1));
  const nextMonth = () => setView(new Date(year, month + 1, 1));
  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button className="link-underline" data-cursor="link" onClick={prevMonth} style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>← {MONTHS[(month - 1 + 12) % 12].slice(0,3)}</button>
        <span style={{ fontFamily: "var(--display)", fontSize: 22, textTransform: "uppercase", letterSpacing: "-.01em" }}>{MONTHS[month]} {year}</span>
        <button className="link-underline" data-cursor="link" onClick={nextMonth} style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>{MONTHS[(month + 1) % 12].slice(0,3)} →</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 12 }}>
        {DAYS.map((d, i) => <div key={i} className="eyebrow" style={{ textAlign: "center" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={"e"+i} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const date = new Date(year, month, d);
          const past = date < today;
          const sun = date.getDay() === 0;
          const isToday = date.getTime() === today.getTime();
          const label = `${MONTHS[month].slice(0,3)} ${d}, ${year}`;
          return (
            <button key={d} disabled={past || sun} onClick={() => onPick(label)} data-cursor="link"
              style={{ aspectRatio: "1", border: "1px solid " + (isToday ? "var(--black)" : "var(--hairline)"), background: isToday ? "var(--black)" : "var(--white)", color: past || sun ? "var(--gray-300)" : isToday ? "var(--white)" : "var(--black)", fontFamily: "var(--display)", fontSize: 14, fontWeight: 500, cursor: past || sun ? "not-allowed" : "pointer" }}>
              {d}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 16, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-300)" }}>Sundays · Closed</div>
    </div>
  );
};

const FAQs = () => {
  const [open, setOpen] = React.useState(0);
  const items = [
    { q: "How long does a basic tune-up take?", a: "Most basic tune-ups are same-day if dropped off before 11am. We'll call you when it's ready." },
    { q: "Do you service e-bikes?", a: "Yes. Our techs are certified on Bosch, Shimano STEPS, and Brose systems. We also service most e-MTB suspension." },
    { q: "Can I drop off after hours?", a: "We have a secure overnight drop slot. Fill out a tag online before you come and we'll process it first thing." },
    { q: "Do you take walk-ins?", a: "We'll always look at your bike. For full services, booking online guarantees a slot." },
  ];
  return (
    <section className="section section-pad bg-white">
      <div className="container-narrow">
        <div className="reveal section-label">FAQ</div>
        <div style={{ borderTop: "1px solid var(--hairline)" }}>
          {items.map((it, i) => (
            <div key={i} className="reveal" style={{ borderBottom: "1px solid var(--hairline)" }}>
              <button data-cursor="link" onClick={() => setOpen(open === i ? -1 : i)} style={{ width: "100%", padding: "28px 0", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", fontFamily: "var(--display)", fontSize: 22, fontWeight: 500, textTransform: "uppercase", letterSpacing: "-.01em" }}>
                {it.q} <span style={{ fontSize: 24, transition: "transform .3s", transform: open === i ? "rotate(45deg)" : "none" }}>+</span>
              </button>
              <div style={{ maxHeight: open === i ? 200 : 0, overflow: "hidden", transition: "max-height .5s ease" }}>
                <p style={{ paddingBottom: 28, color: "var(--gray-500)", fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 600 }}>{it.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ABOUT
const AboutPage = () => (
  <div className="page-fade" data-screen-label="P05 About">
    <SubHero eyebrow="About  /  N°01" title="We're ChainLine." italic="Kelowna's bike shop. Since 2009." />
    <section className="section section-pad bg-paper">
      <div className="container-narrow">
        <blockquote className="reveal serif-italic" style={{ fontSize: "clamp(36px, 5vw, 72px)", lineHeight: 1.15, margin: 0, textAlign: "center", padding: "40px 0", borderTop: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)" }}>
          "We sell bikes we believe in,<br/>to riders we respect."
        </blockquote>
        <div style={{ marginTop: 80, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
          <div className="reveal">
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--gray-600)" }}>
              <span className="serif-italic" style={{ fontSize: 64, float: "left", lineHeight: 0.8, paddingRight: 12, paddingTop: 8 }}>I</span>n the autumn of 2009, two friends with an unreasonable number of bikes between them rented a 900-square-foot space on Highway 97 and called it ChainLine. The idea was simple: build the kind of shop they'd want to walk into. Honest advice. Brands they ride. Mechanics who care.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--gray-600)", marginTop: 20 }}>
              Fifteen years on, we've moved twice, doubled the floor, tripled the staff, and held the line on the part that mattered. We still ride every brand we sell. We still answer our own phone. We still believe Kelowna deserves a better bike shop.
            </p>
          </div>
          <div className="reveal reveal-d-2 ph ph-light ph-corners" style={{ aspectRatio: "4/5" }}><span className="ph-label">FOUNDERS  /  SHOP DAY ONE  /  4:5</span></div>
        </div>
      </div>
    </section>

    <section className="section section-pad bg-white">
      <div className="container-wide">
        <div className="reveal section-label">Timeline</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", borderTop: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)" }}>
          {[
            ["2009", "Founded in Kelowna"],
            ["2011", "First Transition dealer in BC interior"],
            ["2014", "Expanded service department"],
            ["2017", "Moved to current location"],
            ["2020", "Launched online store"],
            ["2024", "15 years of local riding"],
          ].map(([y, t], i) => (
            <div key={y} style={{ padding: "40px 24px 40px 0", borderRight: i < 5 ? "1px solid var(--hairline)" : "none" }}>
              <div style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 500, marginBottom: 12, letterSpacing: "-.02em" }}>{y}</div>
              <div className="eyebrow" style={{ lineHeight: 1.5 }}>{t}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="section section-pad bg-paper" data-screen-label="P05 Team">
      <div className="container-wide">
        <div className="reveal section-label">Meet the Team</div>
        <h2 className="display-xl reveal" style={{ marginBottom: 64 }}>The people<br/><span className="serif-italic">behind the bench.</span></h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          {[
            { name: "Mara K.", role: "Co-founder / Buyer", trail: "Knox Antenna", bike: "Moots Routt YBB" },
            { name: "Devon J.", role: "Co-founder / Master Tech", trail: "Black Mountain", bike: "Transition Patrol" },
            { name: "Priya S.", role: "Lead Fitter", trail: "Crawford", bike: "Bianchi Specialissima" },
            { name: "Tomás R.", role: "Wheelbuilder", trail: "Smith Creek", bike: "Surly Midnight Special" },
            { name: "Hannah L.", role: "Service Manager", trail: "Bear Creek", bike: "Marin Rift Zone" },
            { name: "Ben O.", role: "Sales Lead", trail: "Myra", bike: "Salsa Cutthroat" },
            { name: "Jen W.", role: "Apparel Buyer", trail: "Mission Creek", bike: "Pivot Switchblade" },
            { name: "Cole P.", role: "Apprentice Tech", trail: "Rose Valley", bike: "Marin Headlands" },
          ].map((p, i) => (
            <div key={i} className={"reveal reveal-d-" + (i % 4 + 1)}>
              <div className="ph ph-light ph-corners" style={{ aspectRatio: "4/5", marginBottom: 16 }}><span className="ph-label">PORTRAIT  /  B&W</span></div>
              <div className="display-s" style={{ marginBottom: 4 }}>{p.name}</div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>{p.role}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gray-500)", lineHeight: 1.7 }}>
                Trail · {p.trail}<br/>Ride · {p.bike}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="section section-pad bg-black" data-screen-label="P05 Values">
      <div className="container-wide">
        <div className="reveal section-label" style={{ color: "var(--gray-300)" }}>Values</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderTop: "1px solid var(--hairline-light)" }}>
          {[
            ["01", "Local First", "We hire local. We sponsor local. We ride what's out the back door."],
            ["02", "Honest Advice", "We'll tell you the bike you want isn't the bike you need. Or vice versa."],
            ["03", "Ride What We Sell", "Every brand on the floor is one of us is racing, commuting, or both."],
          ].map(([n, t, d], i) => (
            <div key={n} className={"reveal reveal-d-" + (i + 1)} style={{ padding: "48px 32px 48px 0", borderRight: i < 2 ? "1px solid var(--hairline-light)" : "none", paddingLeft: i > 0 ? 32 : 0 }}>
              <div className="eyebrow eyebrow-light" style={{ marginBottom: 24 }}>{n}</div>
              <div className="display-m" style={{ marginBottom: 16 }}>{t}</div>
              <p style={{ color: "var(--gray-300)", fontSize: 15, lineHeight: 1.6 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

// GROUP RIDES PAGE
const RidesPage = () => {
  const [tab, setTab] = React.useState("All");
  const tabs = ["All", "Road", "Gravel", "Mountain", "Social", "E-Bike"];
  const rides = [
    { date: "MON 28 APR 6:00PM", cal: "20260428T180000/20260428T200000", name: "Knox Mountain Monday", type: "Mountain", meta: "22km · 650m gain", level: "Intermediate", spots: "8 of 12 spots", loc: "Knox Mountain Park, Kelowna, BC" },
    { date: "WED 30 APR 12:15PM", cal: "20260430T121500/20260430T141500", name: "Lunch Loop", type: "Road", meta: "35km · Flat", level: "All abilities", spots: "Open", loc: "Mission Creek Regional Park, Kelowna, BC" },
    { date: "THU 01 MAY 6:00PM", cal: "20260501T180000/20260501T200000", name: "Women's Ride", type: "Social", meta: "20km · Easy", level: "Easy", spots: "Open", loc: "ChainLine Cycle, 1139 Ellis St, Kelowna" },
    { date: "SAT 03 MAY 8:00AM", cal: "20260503T080000/20260503T140000", name: "Gravel Sundays", type: "Gravel", meta: "75km · Backcountry", level: "Advanced", spots: "4 of 10 spots", loc: "ChainLine Cycle, 1139 Ellis St, Kelowna" },
    { date: "SUN 04 MAY 9:00AM", cal: "20260504T090000/20260504T120000", name: "Social Saturday", type: "Social", meta: "30km · Cafe stop", level: "Easy", spots: "Open", loc: "ChainLine Cycle, 1139 Ellis St, Kelowna" },
    { date: "MON 05 MAY 6:00PM", cal: "20260505T180000/20260505T200000", name: "Knox Mountain Monday", type: "Mountain", meta: "22km · 650m gain", level: "Intermediate", spots: "Open", loc: "Knox Mountain Park, Kelowna, BC" },
  ];
  const filtered = tab === "All" ? rides : rides.filter(r => r.type === tab);
  return (
    <div className="page-fade" data-screen-label="P06 Rides">
      <SubHero eyebrow="Community  /  N°01" title="Ride together." italic="All levels, all disciplines." />
      <section className="section section-pad bg-white">
        <div className="container-wide">
          <div className="reveal" style={{ display: "flex", gap: 4, marginBottom: 48, flexWrap: "wrap" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} data-cursor="link" style={{ padding: "10px 18px", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", border: "1px solid " + (tab === t ? "var(--black)" : "var(--hairline)"), background: tab === t ? "var(--black)" : "transparent", color: tab === t ? "var(--white)" : "var(--black)" }}>{t}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {filtered.map((r, i) => (
              <div key={i} className={"reveal reveal-d-" + (i % 3 + 1)} style={{ padding: 32, border: "1px solid var(--hairline)", display: "flex", flexDirection: "column", gap: 16, minHeight: 280 }}>
                <div className="eyebrow">{r.date}</div>
                <div className="display-m">{r.name}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-500)" }}>
                  {r.type} · {r.meta}
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="pill">{r.level}</span>
                  <span className="eyebrow">{r.spots}</span>
                </div>
                <button className="btn btn-outline" data-cursor="link" style={{ marginTop: 8 }} onClick={() => {
                  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("ChainLine Cycle · "+r.name)}&dates=${r.cal}&details=${encodeURIComponent("ChainLine Cycle group ride. "+r.meta+"\n\nQuestions? bikes@chainline.ca · (250) 860-1968")}&location=${encodeURIComponent(r.loc)}`;
                  window.open(url, "_blank");
                }}>Add to Calendar <ArrowRight /></button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-pad bg-black">
        <div className="container-wide">
          <div className="reveal section-label" style={{ color: "var(--gray-300)" }}>Ride Series</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0, borderTop: "1px solid var(--hairline-light)" }}>
            {[
              ["Monday Night Shred", "Knox Mountain  ·  Weekly", "MTB"],
              ["Gravel Sundays", "Okanagan backcountry  ·  Bi-weekly", "Gravel"],
              ["Lunch Loop", "Mission Creek loop  ·  Fridays 12:15", "Road"],
              ["Social Saturday", "Easy pace, cafe stop  ·  Monthly", "Social"],
              ["Women's Ride", "All abilities  ·  Monthly", "Social"],
            ].map(([n, m, t], i) => (
              <a key={i} href="#" data-cursor="link" className="reveal page-wide-row" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 200px 80px", gap: 32, padding: "40px 0", borderBottom: "1px solid var(--hairline-light)", alignItems: "center" }}>
                <div className="display-m">{n}</div>
                <div style={{ color: "var(--gray-300)", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>{m}</div>
                <span className="pill">{t}</span>
                <ArrowRight />
              </a>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-pad bg-paper">
        <div className="container-wide">
          <div className="reveal section-label">Ride Photos</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gridTemplateRows: "200px 200px", gap: 16 }}>
            <div className="reveal ph ph-corners" style={{ gridRow: "span 2" }}><span className="ph-label">PHOTO 01  /  HERO</span></div>
            <div className="reveal reveal-d-2 ph ph-corners"><span className="ph-label">PHOTO 02</span></div>
            <div className="reveal reveal-d-3 ph ph-corners"><span className="ph-label">PHOTO 03</span></div>
            <div className="reveal reveal-d-2 ph ph-corners"><span className="ph-label">PHOTO 04</span></div>
            <div className="reveal reveal-d-3 ph ph-corners"><span className="ph-label">PHOTO 05</span></div>
          </div>
        </div>
      </section>
    </div>
  );
};

// TRAILS PAGE
const TrailsPage = () => {
  const trails = [
    { name: "Knox Mountain Park", dots: 3, km: "18", gain: "520", type: "MTB · Singletrack", season: "Spring–Fall", note: "The best urban trail system in the Okanagan. Don't miss Antenna.", tf: "https://www.trailforks.com/region/knox-mountain-park/", komoot: "https://www.komoot.com/guide/3437" },
    { name: "Bear Creek Provincial Park", dots: 2, km: "14", gain: "380", type: "MTB · Mixed", season: "Year-round", note: "Family-friendly with options to push deeper if you want.", tf: "https://www.trailforks.com/region/bear-creek-provincial-park/", komoot: "https://www.komoot.com/guide/3437" },
    { name: "Okanagan Mountain Park", dots: 5, km: "42", gain: "1,200", type: "MTB · Hike", season: "Summer", note: "Big day. Bring food, bring tools, bring a friend.", tf: "https://www.trailforks.com/region/okanagan-mountain-park/", komoot: "https://www.komoot.com/guide/3437" },
    { name: "Myra Canyon Trestles", dots: 1, km: "24", gain: "180", type: "Rail Trail", season: "Spring–Fall", note: "Wooden trestles, lake views, easy day.", tf: "https://www.trailforks.com/region/kelowna/", komoot: "https://www.komoot.com/guide/3437" },
    { name: "McDougall Rim", dots: 3, km: "22", gain: "640", type: "Hike · Gravel", season: "Spring–Fall", note: "Best sunrise loop in the valley.", tf: "https://www.trailforks.com/region/kelowna/", komoot: "https://www.komoot.com/guide/3437" },
    { name: "Rose Valley", dots: 2, km: "16", gain: "320", type: "MTB", season: "Year-round", note: "A bit of everything. Good for shaking down a new bike.", tf: "https://www.trailforks.com/region/rose-valley-regional-park/", komoot: "https://www.komoot.com/guide/3437" },
    { name: "Black Mountain", dots: 5, km: "32", gain: "920", type: "MTB · Advanced", season: "Summer–Fall", note: "If you have to ask, it isn't for you.", tf: "https://www.trailforks.com/region/black-mountain/", komoot: "https://www.komoot.com/guide/3437" },
    { name: "Kelowna Bike Park", dots: 4, km: "—", gain: "—", type: "Skills Park", season: "May–Oct", note: "All levels, all features. Free, every day.", tf: "https://www.trailforks.com/region/kelowna-bike-park/", komoot: "https://www.komoot.com/guide/3437" },
  ];
  const Dots = ({ n }) => <span className="pill-dots">{[1,2,3,4,5].map(i => <i key={i} className={i <= n ? "on" : ""} />)}</span>;
  return (
    <div className="page-fade" data-screen-label="P07 Trails">
      <SubHero eyebrow="Field Notes  /  N°01" title="Know your backyard." italic="Curated by riders." />
      <section className="section section-pad bg-white">
        <div className="container-wide">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {trails.map((t, i) => (
              <div key={i} className={"reveal reveal-d-" + (i % 3 + 1)}>
                <div className="ph ph-corners" style={{ aspectRatio: "4/3", marginBottom: 20 }}>
                  <span className="ph-label">TRAIL  /  {t.name.toUpperCase()}</span>
                </div>
                <div className="display-s" style={{ marginBottom: 12 }}>{t.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <Dots n={t.dots} />
                  <span className="eyebrow">{t.dots <= 2 ? "Beginner" : t.dots <= 3 ? "Intermediate" : "Advanced"}</span>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-500)", marginBottom: 12 }}>
                  {t.km} km · {t.gain} m · {t.type} · {t.season}
                </div>
                <p className="serif-italic" style={{ fontSize: 16, lineHeight: 1.5, color: "var(--gray-600)", marginBottom: 16 }}>"{t.note}"</p>
                <a href={t.tf} target="_blank" rel="noopener" data-cursor="link"
                  style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gray-500)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  View on Trailforks →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-pad bg-black">
        <div className="container-wide">
          <div className="reveal" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div className="section-label" style={{ color: "var(--gray-300)" }}>Current Conditions</div>
              <h3 className="display-l">Updated by<br/><span className="serif-italic">our trail crew.</span></h3>
            </div>
            <div className="eyebrow eyebrow-light">Last sync · 2 hrs ago</div>
          </div>
          <div style={{ borderTop: "1px solid var(--hairline-light)" }}>
            {[
              ["Knox Mountain", "Open", "Apr 26"],
              ["Bear Creek", "Open · Tacky", "Apr 26"],
              ["Black Mountain", "Open · Dry", "Apr 25"],
              ["Smith Creek", "Muddy", "Apr 24"],
              ["Crawford", "Closed · Bear activity", "Apr 22"],
            ].map(([n, s, d], i) => (
              <div key={n} className="reveal" style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", padding: "20px 0", borderBottom: "1px solid var(--hairline-light)", alignItems: "center" }}>
                <div className="display-s">{n}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.startsWith("Closed") ? "var(--gray-300)" : s.includes("Muddy") ? "var(--gray-400)" : "var(--white)" }} />
                  <span className="eyebrow eyebrow-light">{s}</span>
                </div>
                <div className="eyebrow eyebrow-light" style={{ textAlign: "right" }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-pad-sm bg-paper" style={{ padding: "60px 0" }}>
        <div className="container-wide">
          <div className="reveal" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://www.trailforks.com/region/kelowna/" target="_blank" rel="noopener" className="btn btn-outline" data-cursor="link">View on Trailforks <ArrowRight /></a>
            <a href="https://www.komoot.com/guide/3437" target="_blank" rel="noopener" className="btn btn-outline" data-cursor="link">View on Komoot <ArrowRight /></a>
            <a href="https://www.strava.com/segments/explore#4.32/49.888/-119.496" target="_blank" rel="noopener" className="btn btn-outline" data-cursor="link">View on Strava <ArrowRight /></a>
          </div>
        </div>
      </section>
    </div>
  );
};

// CONTACT
const ContactPage = () => (
  <div className="page-fade" data-screen-label="P08 Contact">
    <section className="page-contact-grid" style={{ paddingTop: 120, minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <div className="ph ph-corners" style={{ minHeight: 600, position: "relative" }}>
        <span className="ph-label">STOREFRONT  /  B&W</span>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, rgba(10,10,10,0.6))" }} />
        <div style={{ position: "absolute", left: 48, right: 48, bottom: 48, color: "var(--white)" }}>
          <h1 className="display-xl" style={{ marginBottom: 32 }}>Come<br/><span className="serif-italic">find us.</span></h1>
          <div style={{ borderTop: "1px solid var(--hairline-light)", paddingTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-300)" }}>
            <div><div className="eyebrow eyebrow-light" style={{ marginBottom: 6 }}>Address</div><a href="https://maps.google.com/?q=1139+Ellis+St+Kelowna+BC+V1Y+1Z5" target="_blank" rel="noopener" style={{ color: "inherit" }}>1139 Ellis St<br/>Kelowna, BC V1Y 1Z5</a></div>
            <div><div className="eyebrow eyebrow-light" style={{ marginBottom: 6 }}>Hours</div>Mon–Sat  10–6<br/>Sun  11–5</div>
            <div><div className="eyebrow eyebrow-light" style={{ marginBottom: 6 }}>Phone</div>(250) 860-1968</div>
            <div><div className="eyebrow eyebrow-light" style={{ marginBottom: 6 }}>Email</div>bikes@chainline.ca</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "80px 64px", display: "flex", flexDirection: "column", justifyContent: "center", background: "var(--white)" }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>Get in touch</div>
        <h2 className="display-l" style={{ marginBottom: 40 }}>Send us<br/><span className="serif-italic">a message.</span></h2>
        <div style={{ display: "grid", gap: 24 }}>
          <Field label="Name" />
          <Field label="Email" />
          <label>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Subject</div>
            <select style={{ width: "100%", padding: "12px 0", border: "none", borderBottom: "1px solid var(--hairline)", outline: "none", fontFamily: "var(--body)", fontSize: 16, background: "transparent" }}>
              <option>General Inquiry</option><option>Service Question</option><option>Product Question</option><option>Group Rides</option><option>Press</option><option>Other</option>
            </select>
          </label>
          <Field label="Message" textarea />
          <button className="btn" data-cursor="link" style={{ alignSelf: "flex-start", marginTop: 16 }}>Send Message <ArrowRight /></button>
        </div>
      </div>
    </section>
    <section className="bg-black" style={{ height: 400, position: "relative" }}>
      <div className="ph" style={{ position: "absolute", inset: 0 }}>
        <span className="ph-label">MAP  /  DARK SATELLITE STYLE  /  STORE PIN</span>
      </div>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--white)", display: "grid", placeItems: "center", boxShadow: "0 0 0 8px rgba(255,255,255,0.15)" }}>
          <ChainLogo size={24} color="#0a0a0a" />
        </div>
      </div>
    </section>
    <section className="section section-pad-sm bg-paper" style={{ padding: "60px 0" }}>
      <div className="container-wide">
        <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { t: "Call Us", v: "(250) 860-1968", href: "tel:2508601968" },
            { t: "Book a Service", v: "Online booking", route: "book" },
            { t: "Get Directions", v: "Open in Maps", href: "https://maps.google.com/?q=1139+Ellis+St+Kelowna+BC" },
          ].map((a, i) => (
            <button key={i} className="btn btn-outline" data-cursor="link" style={{ padding: "32px", justifyContent: "space-between", flexDirection: "column", alignItems: "flex-start", gap: 16, height: "auto" }}
              onClick={() => a.route ? window.cl.go(a.route) : window.open(a.href)}>
              <span className="eyebrow">{a.t}</span>
              <span style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", fontSize: 18, fontFamily: "var(--display)", textTransform: "uppercase", letterSpacing: "-.005em" }}>
                {a.v} <ArrowRight />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  </div>
);

// GIFT CARDS
const GiftCardsPage = () => (
  <div className="page-fade">
    <SubHero eyebrow="Gift Cards  /  N°01" title="The perfect gift." italic="For every rider." />
    <section className="section section-pad bg-white">
      <div className="container-narrow" style={{ textAlign:"center" }}>
        <p style={{ fontSize:16, color:"var(--gray-500)", lineHeight:1.75, marginBottom:56, maxWidth:560, margin:"0 auto 56px" }}>
          Not sure what to get the rider in your life? A ChainLine gift card works on bikes, parts, accessories, and services. Good for anything in the store.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:56 }}>
          {[50,100,150,200,300,500].map(v => (
            <button key={v} className="btn btn-outline" data-cursor="link"
              style={{ flexDirection:"column", alignItems:"flex-start", padding:32, gap:8, height:"auto" }}
              onClick={() => window.open("https://4nie4h-ek.myshopify.com/products/gift-card")}>
              <span style={{ fontFamily:"var(--display)", fontSize:32, fontWeight:500 }}>${v}</span>
              <span className="eyebrow">Gift Card</span>
            </button>
          ))}
        </div>
        <button className="btn" data-cursor="link"
          onClick={() => window.open("https://4nie4h-ek.myshopify.com/products/gift-card")}>
          Buy a Gift Card <ArrowRight />
        </button>
        <p style={{ marginTop:24, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-400)" }}>
          Custom amounts available in-store  ·  No expiry  ·  bikes@chainline.ca
        </p>
      </div>
    </section>
    <Newsletter />
  </div>
);


// PARTS & ACCESSORIES PAGE — Live Lightspeed inventory
const PartsPage = () => {
  const [activeDept, setActiveDept] = React.useState(null);
  const [deptItems,  setDeptItems]  = React.useState([]);
  const [loading,    setLoading]    = React.useState(false);
  const [search,     setSearch]     = React.useState('');
  const [searchRes,  setSearchRes]  = React.useState(null);
  const [depts,      setDepts]      = React.useState([]);

  React.useEffect(() => {
    const load = () => {
      if (window.CL_LS && window.CL_LS.departments && window.CL_LS.departments.length > 0) {
        const exclude = ['labour','food','shop use','consignments','bikes comfort','bikes road','bikes mountain','bike bmx','bike cruiser','bike cross','bikes fat','bikes junior','bike frame','frames','build kit','group'];
        const filtered = window.CL_LS.departments
          .filter(d => !exclude.some(ex => d.name.toLowerCase().includes(ex)))
          .sort((a, b) => a.name.localeCompare(b.name));
        setDepts(filtered);
      }
    };
    load();
    window.addEventListener('lightspeed:ready', load);
    return () => window.removeEventListener('lightspeed:ready', load);
  }, []);

  const openDept = async (deptName) => {
    if (activeDept === deptName) { setActiveDept(null); setDeptItems([]); return; }
    setActiveDept(deptName);
    setLoading(true);
    const cached = (window.CL_LS.products || []).filter(p =>
      (p.department || '').toLowerCase() === deptName.toLowerCase()
    );
    if (cached.length > 0) {
      setDeptItems(cached); setLoading(false);
    } else {
      const items = await window.lightspeedGetDept(deptName);
      setDeptItems(items); setLoading(false);
    }
  };

  const doSearch = (q) => {
    setSearch(q);
    if (q.length < 2) { setSearchRes(null); return; }
    const results = (window.lightspeedSearch && window.lightspeedSearch(q)) || [];
    setSearchRes(results.slice(0, 48));
  };

  const fallback = ['Brake pads','Cassette','Chains','Tubes','Tires 700C','Tires 29"','Tires 26"','Wheels','Shifters MTB','Derailleur Rear','Derailleur Front','Cranks','Bottom Brackets','Headsets','Handlebar','Stem','Saddles','Seat post','Grips','Bar tape','Forks','Rear Shock','Brake Lever U','Brake parts','Pumps','Lube','Tools','Locks','Lights','Computers','Bags','Packs','Helmet','Gloves','Clothing','Socks','Shoes Mountain','Shoes Road','Spokes','Rims','Hubs','Cables','Fenders','Tire Sealant'].map(n => ({ name: n, count: null }));
  const displayDepts = depts.length > 0 ? depts : fallback;

  return (
    <div className="page-fade">
      <SubHero eyebrow="Parts & Accessories  /  N°02" title="Gear up." italic="Everything you need." />
      <section style={{ padding:"60px 0 100px", background:"var(--white)" }}>
        <div className="container-wide">

          {/* Search */}
          <div className="reveal" style={{ marginBottom:48 }}>
            <div style={{ display:"flex", borderBottom:"2px solid var(--black)", maxWidth:560 }}>
              <input type="text" placeholder="Search parts — cassettes, brake pads, chains..."
                value={search} onChange={e => doSearch(e.target.value)}
                style={{ flex:1, padding:"14px 0", border:"none", outline:"none", fontFamily:"var(--body)", fontSize:16, background:"transparent" }} />
              {search && <button onClick={() => { setSearch(''); setSearchRes(null); }}
                style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--gray-400)", letterSpacing:".1em" }}>CLEAR</button>}
            </div>
            {searchRes && (
              <div style={{ marginTop:16 }}>
                <p className="eyebrow" style={{ marginBottom:16 }}>{searchRes.length} results for &ldquo;{search}&rdquo;</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {searchRes.map((item, i) => (
                    <div key={i} style={{ padding:"14px 16px", border:"1px solid var(--hairline)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"var(--display)", fontSize:12, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.005em", lineHeight:1.3 }}>{item.name}</div>
                        <div className="eyebrow" style={{ marginTop:3 }}>{item.department}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                        <div style={{ fontFamily:"var(--display)", fontSize:14, fontWeight:600 }}>{item.price > 0 ? `$${item.price.toFixed(2)}` : 'POA'}</div>
                        <button data-cursor="link"
                          onClick={() => window.location.href = `mailto:bikes@chainline.ca?subject=Part Enquiry: ${encodeURIComponent(item.name)}&body=Hi, I'd like to purchase:%0A%0AItem: ${encodeURIComponent(item.name)}%0ASKU: ${encodeURIComponent(item.sku||'N/A')}%0APrice: $${item.price.toFixed(2)}%0A%0APlease confirm availability and payment.%0A%0AThanks`}
                          style={{ padding:"6px 12px", background:"var(--black)", color:"var(--white)", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".1em", textTransform:"uppercase", border:"none", cursor:"pointer" }}>
                          Buy →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dept accordion */}
          {!searchRes && (
            <>
              <div className="reveal section-label" style={{ marginBottom:24 }}>
                Browse by Department {depts.length > 0 && <span style={{ opacity:.45 }}>· Live from Lightspeed</span>}
              </div>
              <div style={{ borderTop:"1px solid var(--hairline)" }}>
                {displayDepts.map((dept, i) => (
                  <div key={i} className="reveal" style={{ borderBottom:"1px solid var(--hairline)" }}>
                    <button data-cursor="link" onClick={() => openDept(dept.name)}
                      style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 0", cursor:"pointer" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                        <span style={{ fontFamily:"var(--display)", fontSize:"clamp(15px,1.8vw,20px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em" }}>{dept.name}</span>
                        {dept.count && <span className="eyebrow">{dept.count} items</span>}
                      </div>
                      <span style={{ fontFamily:"var(--mono)", fontSize:18, color:"var(--gray-400)", transform: activeDept===dept.name ? "rotate(45deg)" : "none", transition:"transform .2s", display:"inline-block" }}>+</span>
                    </button>
                    {activeDept === dept.name && (
                      <div style={{ paddingBottom:20 }}>
                        {loading ? (
                          <p className="eyebrow" style={{ padding:"12px 0" }}>Loading {dept.name}…</p>
                        ) : deptItems.length === 0 ? (
                          <p style={{ fontSize:14, color:"var(--gray-500)" }}>No items currently listed — contact us for stock.</p>
                        ) : (
                          <>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                              {deptItems.slice(0,60).map((item, j) => (
                                <div key={j} style={{ padding:"12px 14px", background:"var(--paper)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, flexWrap:"wrap" }}>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontFamily:"var(--display)", fontSize:11, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.005em", lineHeight:1.3 }}>{item.name}</div>
                                    {item.sku && <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--gray-400)", marginTop:2 }}>SKU {item.sku}</div>}
                                  </div>
                                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                                    <div style={{ fontFamily:"var(--display)", fontSize:13, fontWeight:600 }}>{item.price > 0 ? `$${item.price.toFixed(2)}` : ''}</div>
                                    <button data-cursor="link"
                                      onClick={() => window.location.href = `mailto:bikes@chainline.ca?subject=Part Enquiry: ${encodeURIComponent(item.name)}&body=Hi, I'd like to purchase the following:%0A%0AItem: ${encodeURIComponent(item.name)}%0ASKU: ${encodeURIComponent(item.sku||'N/A')}%0APrice: $${item.price.toFixed(2)}%0A%0APlease let me know availability and how to pay.%0A%0AThanks`}
                                      style={{ padding:"4px 10px", background:"var(--black)", color:"var(--white)", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".1em", textTransform:"uppercase", border:"none", cursor:"pointer", whiteSpace:"nowrap" }}>
                                      Buy →
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {deptItems.length > 60 && <p style={{ marginTop:10, fontSize:11, color:"var(--gray-400)", fontFamily:"var(--mono)", letterSpacing:".1em", textTransform:"uppercase" }}>Showing 60 of {deptItems.length} — visit or call for full list</p>}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop:48, padding:28, background:"var(--paper)", borderTop:"2px solid var(--black)" }}>
            <div className="eyebrow" style={{ marginBottom:10 }}>Can't find what you need?</div>
            <p style={{ fontSize:14, color:"var(--gray-600)", marginBottom:14 }}>We stock 7,000+ products. If it's not listed, we can order it.</p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <a href="tel:2508601968" className="btn btn-outline-dark" data-cursor="link" style={{ fontSize:11 }}>Call (250) 860-1968</a>
              <button className="btn" data-cursor="link" onClick={() => window.cl.go("contact")} style={{ fontSize:11 }}>Contact Us <ArrowRight /></button>
            </div>
          </div>
        </div>
      </section>
      <Newsletter />
    </div>
  );
};

// CLASSIFIEDS PAGE
const ClassifiedsPage = () => {
  const DEMO_LISTINGS = [
    { title:"2022 Transition Sentinel – Large", price:4200, cond:"Excellent", cat:"Full Suspension MTB", posted:"2 days ago", desc:"One season of riding, immaculate condition. Fox suspension freshly serviced. Comes with extra rotor." },
    { title:"Shimano XT Groupset 12-Speed", price:550, cond:"Good", cat:"Drivetrain", posted:"5 days ago", desc:"Complete XT group, used one season. Minor cable wear, everything shifts perfectly." },
    { title:"Fox 36 Factory 160mm Fork", price:750, cond:"Good", cat:"Suspension", posted:"1 week ago", desc:"Fox Factory 36, 160mm travel, 15x110mm. Freshly serviced. Fits 2020–2023 standards." },
    { title:"Marin San Quentin 3 – Medium", price:1800, cond:"Like New", cat:"Hardtail MTB", posted:"1 week ago", desc:"Barely ridden, upgraded to full-sus. All original components, no damage." },
    { title:"Maxxis Assegai / DHR2 Set", price:120, cond:"Good", cat:"Tyres", posted:"2 weeks ago", desc:"One season, still 60% tread. Tubeless ready. 29x2.5 WT." },
    { title:"100% Forecast Helmet – Large", price:85, cond:"Excellent", cat:"Helmets", posted:"2 weeks ago", desc:"Worn 3 times, no damage. MIPS certified, 2023 model." },
  ];
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ title:'', price:'', cat:'', cond:'', desc:'', name:'', email:'', phone:'' });
  const [submitted, setSubmitted] = React.useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    window.location.href = `mailto:bikes@chainline.ca?subject=Classifieds Listing: ${encodeURIComponent(form.title)}&body=${encodeURIComponent(
      `New classified listing submission:\n\nTitle: ${form.title}\nPrice: $${form.price}\nCategory: ${form.cat}\nCondition: ${form.cond}\n\nDescription:\n${form.desc}\n\nContact:\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}`
    )}`;
    setSubmitted(true);
    setShowForm(false);
  };
  const cats = ["Full Suspension MTB","Hardtail MTB","Gravel Bike","Road Bike","E-Bike","Kids Bike","Drivetrain","Brakes","Suspension","Wheels","Tyres","Helmets","Apparel","Tools","Other"];
  return (
    <div className="page-fade">
      <SubHero eyebrow="Community  /  N°02" title="Buy. Sell. Ride." italic="Kelowna's cycling classifieds." />
      <section style={{ padding:"60px 0 100px", background:"var(--white)" }}>
        <div className="container-wide">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:48 }}>
            <div className="reveal section-label" style={{ marginBottom:0 }}>Current Listings  /  {DEMO_LISTINGS.length}</div>
            <button className="btn" data-cursor="link" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Post a Listing"} {showForm ? "" : <ArrowRight />}
            </button>
          </div>

          {submitted && (
            <div style={{ padding:24, background:"var(--paper)", borderLeft:"3px solid var(--black)", marginBottom:40 }}>
              <p style={{ fontFamily:"var(--display)", fontWeight:600, textTransform:"uppercase" }}>Listing submitted!</p>
              <p style={{ fontSize:14, color:"var(--gray-500)", marginTop:8 }}>We'll review it and get it posted within 24 hours. Email bikes@chainline.ca with any questions.</p>
            </div>
          )}

          {showForm && (
            <div className="reveal" style={{ padding:40, background:"var(--paper)", marginBottom:48, borderTop:"2px solid var(--black)" }}>
              <h3 className="display-m" style={{ marginBottom:32 }}>Post a Listing</h3>
              <form onSubmit={submit} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
                {[["title","Listing Title (e.g. '2022 Trek Fuel EX 8')","col-span-2"],["price","Price (CAD)",""],["cat","Category","select"],["cond","Condition","select-cond"],["desc","Description — include size, year, condition, what's included","col-span-2 textarea"],["name","Your Name",""],["email","Email",""],["phone","Phone (optional)",""],].map(([k, label, cls]) => (
                  <div key={k} style={{ gridColumn: cls && cls.includes("col-span-2") ? "1/-1" : "auto" }}>
                    <div className="eyebrow" style={{ marginBottom:8 }}>{label}</div>
                    {cls === "select" ? (
                      <select value={form[k]} onChange={e => upd(k, e.target.value)} required
                        style={{ width:"100%", padding:"12px 0", border:"none", borderBottom:"1px solid var(--hairline)", fontFamily:"var(--body)", fontSize:16, background:"transparent", outline:"none" }}>
                        <option value="">Select category</option>
                        {cats.map(c => <option key={c}>{c}</option>)}
                      </select>
                    ) : cls === "select-cond" ? (
                      <select value={form[k]} onChange={e => upd(k, e.target.value)} required
                        style={{ width:"100%", padding:"12px 0", border:"none", borderBottom:"1px solid var(--hairline)", fontFamily:"var(--body)", fontSize:16, background:"transparent", outline:"none" }}>
                        <option value="">Select condition</option>
                        {["Like New","Excellent","Good","Fair"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    ) : cls === "col-span-2 textarea" ? (
                      <textarea value={form[k]} onChange={e => upd(k, e.target.value)} required rows={4}
                        style={{ width:"100%", padding:"12px 0", border:"none", borderBottom:"1px solid var(--hairline)", fontFamily:"var(--body)", fontSize:16, background:"transparent", outline:"none", resize:"vertical" }} />
                    ) : (
                      <input type={k === "email" ? "email" : k === "price" ? "number" : "text"}
                        value={form[k]} onChange={e => upd(k, e.target.value)}
                        required={k !== "phone"}
                        style={{ width:"100%", padding:"12px 0", border:"none", borderBottom:"1px solid var(--hairline)", fontFamily:"var(--body)", fontSize:16, background:"transparent", outline:"none" }} />
                    )}
                  </div>
                ))}
                <div style={{ gridColumn:"1/-1", display:"flex", gap:16, alignItems:"center", marginTop:8 }}>
                  <button type="submit" className="btn" data-cursor="link">Submit Listing <ArrowRight /></button>
                  <p style={{ fontSize:12, color:"var(--gray-400)", lineHeight:1.5 }}>
                    ChainLine Cycle hosts this board as a community service. All sales are between private parties.
                  </p>
                </div>
              </form>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
            {DEMO_LISTINGS.map((l, i) => (
              <div key={i} className={"reveal reveal-d-" + (i%3+1)} style={{ padding:28, border:"1px solid var(--hairline)", display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                  <span className="pill" style={{ color:"var(--gray-500)" }}>{l.cat}</span>
                  <span className="eyebrow">{l.posted}</span>
                </div>
                <div className="display-s" style={{ lineHeight:1.2 }}>{l.title}</div>
                <p style={{ fontSize:13, color:"var(--gray-500)", lineHeight:1.55, flex:1 }}>{l.desc}</p>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontFamily:"var(--display)", fontSize:22, fontWeight:500 }}>${l.price.toLocaleString()}</span>
                  <span className="pill" style={{ color:"var(--gray-400)" }}>{l.cond}</span>
                </div>
                <button className="btn btn-outline" data-cursor="link"
                  onClick={() => window.location.href = `mailto:bikes@chainline.ca?subject=Classifieds Enquiry: ${encodeURIComponent(l.title)}&body=Hi, I'm interested in the listing: ${encodeURIComponent(l.title)} ($${l.price}). Please put me in touch with the seller.`}
                  style={{ width:"100%", justifyContent:"center" }}>
                  Enquire <ArrowRight />
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop:48, textAlign:"center" }}>
            <p style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-400)" }}>
              ChainLine Cycle facilitates this board as a community service. All transactions are between private parties.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

// BIKES BY BRAND PAGE
const BrandPage = () => {
  const brands = [
    { name:"Marin", desc:"San Rafael, CA — Trail, Road, Gravel, City, Kids. California ride culture since 1986.", count: SHOP_BIKES.filter(b=>b.brand==="Marin").length },
    { name:"Transition", desc:"Bellingham, WA — High-performance trail and enduro bikes built by riders, for riders.", count: SHOP_BIKES.filter(b=>b.brand==="Transition").length },
    { name:"Surly", desc:"Minneapolis, MN — Steel bikes built to go anywhere. Gravel, touring, fatbike, adventure.", count: SHOP_BIKES.filter(b=>b.brand==="Surly").length },
    { name:"Salsa", desc:"Minneapolis, MN — Adventure bikes for the long haul. Gravel, touring, fatbike.", count: 0 },
    { name:"Pivot", desc:"Scottsdale, AZ — Carbon trail and enduro bikes with dw-link suspension.", count: SHOP_BIKES.filter(b=>b.brand==="Pivot").length },
    { name:"Bianchi", desc:"Milan, Italy — The oldest bicycle brand in the world. Road, gravel, and MTB.", count: 0 },
    { name:"Moots", desc:"Steamboat Springs, CO — Hand-welded titanium bikes. Made in America.", count: 0 },
    { name:"Knolly", desc:"North Vancouver, BC — No-compromise full-suspension mountain bikes engineered for Pacific Northwest trails.", count: 0 },
    { name:"Revel", desc:"Carbondale, CO — Obsessively engineered mountain bikes with CBF suspension for unmatched small-bump compliance.", count: 0 },
  ];
  return (
    <div className="page-fade">
      <SubHero eyebrow="Shop  /  Brands" title="Our brands." italic="Curated with care." />
      <section style={{ padding:"60px 0 100px", background:"var(--white)" }}>
        <div className="container-wide">
          <div style={{ borderTop:"1px solid var(--hairline)" }}>
            {brands.map((br, i) => (
              <div key={i} className="reveal page-wide-row" style={{ display:"grid", gridTemplateColumns:"240px 1fr 160px 120px", gap:32, padding:"40px 0", borderBottom:"1px solid var(--hairline)", alignItems:"center" }}>
                <div className="display-m">{br.name}</div>
                <p style={{ fontSize:14, color:"var(--gray-500)", lineHeight:1.6 }}>{br.desc}</p>
                <div className="eyebrow">{br.count > 0 ? `${br.count} bikes in stock` : "Coming soon"}</div>
                {br.count > 0
                  ? <button className="btn btn-outline" data-cursor="link" onClick={() => window.cl.go("shop", { brand: br.name })} style={{ justifyContent:"center", fontSize:11 }}>Shop {br.name} <ArrowRight /></button>
                  : <button className="btn btn-outline" data-cursor="link" onClick={() => window.cl.go("contact")} style={{ justifyContent:"center", fontSize:11 }}>Enquire <ArrowRight /></button>
                }
              </div>
            ))}
          </div>
        </div>
      </section>
      <Newsletter />
    </div>
  );
};

// TERMS OF SERVICE
const TermsPage = () => (
  <div className="page-fade">
    <SubHero eyebrow="Legal  /  Terms" title="Terms of Service." italic="Honest and straightforward." />
    <section className="section section-pad bg-white">
      <div className="container-narrow">
        {[
          ["1. Overview", "These Terms of Service govern your use of the ChainLine Cycle website and your purchase of products and services from ChainLine Cycle Inc. ('ChainLine', 'we', 'us', 'our'), located at 1139 Ellis St, Kelowna, BC V1Y 1Z5. By using our website or making a purchase, you agree to these terms."],
          ["2. Products & Pricing", "All prices are in Canadian dollars and include applicable taxes unless otherwise stated. We reserve the right to correct pricing errors and to discontinue products at any time. Product availability is subject to change without notice. We make every effort to display products accurately but cannot guarantee that your screen accurately reflects product colours."],
          ["3. Orders & Payment", "By placing an order, you warrant that you are legally capable of entering into binding contracts. We accept Visa, Mastercard, American Express, Apple Pay, and Shop Pay. Payment is processed at the time of order. We reserve the right to refuse or cancel any order for any reason, including suspected fraud."],
          ["4. Shipping & Pickup", "In-store pickup is available at 1139 Ellis St, Kelowna, BC. Shipping rates and timelines are displayed at checkout. Risk of loss and title for items purchased pass to you upon delivery to the carrier. ChainLine is not responsible for delays caused by the carrier."],
          ["5. Returns & Exchanges", "Unused items in original packaging may be returned within 30 days of purchase with a receipt for a full refund or exchange. Bikes must be returned in as-new condition and may be subject to a restocking fee. Sale items, special orders, and installed parts are final sale. Contact us at bikes@chainline.ca to initiate a return."],
          ["6. Warranty", "All bikes and components are covered by the respective manufacturer's warranty. ChainLine Cycle acts as an authorized warranty service centre for all brands we carry. Typical coverage: frame/fork 2–5 years (varies by brand), components 1 year. Warranty covers manufacturing defects and does not cover normal wear, crash damage, or modifications. Bring your bike in with proof of purchase and we'll handle the warranty claim on your behalf — no charge for warranty service."],
          ["7. Service Work", "Service bookings are confirmed via phone or email. We will contact you if the scope or cost of work changes from your original booking. Bikes left uncollected after 30 days of completion may incur storage fees. ChainLine is not responsible for pre-existing damage discovered during service."],
          ["8. Limitation of Liability", "ChainLine Cycle's liability is limited to the value of the products or services purchased. We are not liable for indirect, incidental, or consequential damages. Some jurisdictions do not allow limitations on implied warranties, so these limitations may not apply to you."],
          ["9. Governing Law", "These terms are governed by the laws of British Columbia, Canada. Any disputes shall be resolved in the courts of Kelowna, BC."],
          ["10. Contact", "Questions? Email bikes@chainline.ca or call (250) 860-1968. Mon–Fri 9:30–5:30, Sat 10–4."],
        ].map(([h, t]) => (
          <div key={h} style={{ marginBottom: 40 }}>
            <div className="display-s" style={{ marginBottom: 16 }}>{h}</div>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--gray-600)" }}>{t}</p>
          </div>
        ))}
        <div style={{ marginTop: 48, padding: "20px 24px", background: "var(--paper)", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-500)" }}>
          Last updated: April 2026  ·  ChainLine Cycle Inc.  ·  1139 Ellis St, Kelowna, BC V1Y 1Z5
        </div>
      </div>
    </section>
  </div>
);

// PRIVACY POLICY
const PrivacyPage = () => (
  <div className="page-fade">
    <SubHero eyebrow="Legal  /  Privacy" title="Privacy Policy." italic="We respect your data." />
    <section className="section section-pad bg-white">
      <div className="container-narrow">
        {[
          ["1. Information We Collect", "When you make a purchase or create an account, we collect your name, email address, phone number, mailing address, and payment information (processed securely by our payment provider — we do not store full card numbers). When you browse our website, we collect standard server logs including IP address, browser type, and pages visited. We may also collect information you provide when booking services or contacting us."],
          ["2. How We Use Your Information", "We use your information to process and fulfil orders, send order confirmations and shipping updates, respond to your inquiries, send our newsletter (only if you opt in), improve our website and services, and comply with legal obligations. We do not sell, rent, or trade your personal information to third parties."],
          ["3. Sharing Your Information", "We share your information only with trusted service providers who help us operate our business (payment processors, shipping carriers, email service providers). These parties are contractually obligated to keep your information confidential and use it only for the services they provide to us. We may disclose your information when required by law."],
          ["4. Cookies", "Our website uses cookies to remember your preferences, keep you signed in, and understand how visitors use our site. You can disable cookies in your browser settings, though some site features may not function properly. We do not use cookies to track you across third-party websites."],
          ["5. Email Communications", "If you subscribe to our newsletter, you can unsubscribe at any time via the link in any email we send. We do not spam. One email per fortnight, maximum."],
          ["6. Data Retention", "We retain your personal information for as long as necessary to fulfil the purposes outlined in this policy, or as required by law. You may request deletion of your account and personal data by contacting us at bikes@chainline.ca."],
          ["7. Security", "We take reasonable precautions to protect your information. All payment data is processed over encrypted SSL connections. No method of internet transmission is 100% secure — we cannot guarantee absolute security."],
          ["8. Your Rights", "Under PIPEDA (Personal Information Protection and Electronic Documents Act) and BC PIPA, you have the right to access the personal information we hold about you, request corrections, and withdraw consent for certain uses. Contact bikes@chainline.ca to exercise these rights."],
          ["9. Third-Party Links", "Our website may contain links to third-party websites. We are not responsible for the privacy practices of those sites."],
          ["10. Contact", "Privacy questions or requests: bikes@chainline.ca · (250) 860-1968 · 1139 Ellis St, Kelowna, BC V1Y 1Z5."],
        ].map(([h, t]) => (
          <div key={h} style={{ marginBottom: 40 }}>
            <div className="display-s" style={{ marginBottom: 16 }}>{h}</div>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--gray-600)" }}>{t}</p>
          </div>
        ))}
        <div style={{ marginTop: 48, padding: "20px 24px", background: "var(--paper)", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-500)" }}>
          Last updated: April 2026  ·  ChainLine Cycle Inc.  ·  1139 Ellis St, Kelowna, BC V1Y 1Z5
        </div>
      </div>
    </section>
  </div>
);

Object.assign(window, { ShopPage, ServicesPage, BookPage, AboutPage, RidesPage, TrailsPage, ContactPage, GiftCardsPage, PartsPage, ClassifiedsPage, BrandPage, BikeCardLarge, SubHero, SHOP_BIKES, TermsPage, PrivacyPage });
