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
  const variants   = bike?.variants || [];
  const inStockV   = variants.filter(v => v.inStock);
  const hasWheels  = [...new Set(variants.map(v=>v.wheel).filter(Boolean))].length > 1;
  const hasColors  = [...new Set(variants.map(v=>v.color).filter(Boolean))].length > 1;
  const hasSizes   = [...new Set(variants.map(v=>v.size).filter(Boolean))].length > 1;
  const defV = inStockV[0] || variants[0];

  const [selWheel, setWheel] = React.useState(defV?.wheel || null);
  const [selColor, setColor] = React.useState(defV?.color || null);
  const [selSize,  setSize]  = React.useState(defV?.size  || null);
  const [adding, setAdding]  = React.useState(false);
  const [added,  setAdded]   = React.useState(false);

  React.useEffect(() => {
    const d = (bike?.variants||[]).filter(v=>v.inStock)[0] || (bike?.variants||[])[0];
    setWheel(d?.wheel||null); setColor(d?.color||null); setSize(d?.size||null);
  }, [bike?.handle]);

  const b = bike || {};
  const specs = getBikeSpecs(b);
  const desc  = getBikeDescription(b);
  const data  = getBikeData(b);

  const selected = variants.find(v =>
    (!hasWheels || v.wheel === selWheel) &&
    (!hasColors || v.color === selColor) &&
    (!hasSizes  || v.size  === selSize)
  ) || defV;

  const availColors = (w) => [...new Set(variants.filter(v => !hasWheels||v.wheel===w).map(v=>v.color).filter(Boolean))];
  const availSizes  = (w,c) => [...new Set(variants.filter(v=>(!hasWheels||v.wheel===w)&&(!hasColors||v.color===c)).map(v=>v.size).filter(Boolean))];
  const wheels = [...new Set(variants.map(v=>v.wheel).filter(Boolean))];
  const allImgs = (() => {
    const resolved = resolveImage(selected ? {...b, sku: selected.sku} : b) || resolveImage(b);
    const imgs = resolved ? [resolved] : [];
    (data.images || []).forEach(u => { if (u && !imgs.includes(u)) imgs.push(u); });
    return imgs;
  })();
  const [activeImg, setActiveImg] = React.useState(0);
  React.useEffect(() => setActiveImg(0), [selected?.sku]);

  const selInStock = selected ? selected.inStock : b.inStock !== false;
  const selPrice   = selected?.price || b.price || 0;
  const selSku     = selected?.sku || b.sku;

  const handleAdd = async () => {
    setAdding(true);
    try {
      // If no SKU (e.g. featured bikes without Lightspeed data), find from live bikes by name
      let sku = selSku;
      if (!sku) {
        const liveBike = (window.CL_LS?.bikes || []).find(l => {
          const ln = (l.name || '').toLowerCase();
          const bn = (b.name || b.title || '').toLowerCase();
          return bn.split(' ').filter(w => w.length >= 4).every(w => ln.includes(w));
        });
        sku = liveBike?.sku || null;
      }
      const variantDesc = [selected?.wheel, selected?.color, selected?.size].filter(Boolean).join(' · ');
      const result = await window.clAddToCart(sku, b.name || b.title, selPrice, allImgs[0], sku, variantDesc || null);
      if (result) {
        setAdded(true);
        setTimeout(() => { setAdded(false); if (onCart) onCart(); }, 600);
      }
    } catch(e) { console.warn(e); }
    setAdding(false);
  };

  const goBack = () => { if (window.cl?.back) window.cl.back(); else if (onBack) onBack(); };

  if (!bike) return (
    <div className="page-fade" style={{ paddingTop: 160, textAlign: 'center' }}>
      <p style={{ color: 'var(--gray-500)' }}>No bike selected.</p>
      <button className="btn btn-outline" style={{ marginTop: 24 }} onClick={onBack}>← Back to Shop</button>
    </div>
  );

  return (
    <div className="page-fade bike-page" style={{ paddingTop: 114 }}>
      {/* Back */}
      <div className="bike-back-bar" style={{ position: 'sticky', top: 132, zIndex: 50, background: 'rgba(250,250,250,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--hairline)', padding: '12px 0' }}>
        <div className="container-wide" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={goBack} data-cursor="link" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, background:'none', border:'none', cursor:'pointer' }}>
            ← Back
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
                  className="bike-img" decoding="async"
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
                  <img src={img} alt="" className="bike-img" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
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
            ${selPrice.toLocaleString()} CAD
          </div>

          {/* Live stock status */}
          <div className="reveal" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'10px 16px', background: selInStock ? 'rgba(22,163,74,0.06)' : 'var(--gray-100)', border:'1px solid ' + (selInStock ? 'rgba(22,163,74,0.25)' : 'var(--hairline)'), borderRadius:2 }}>
            {selInStock ? (
              <><span className="stock-dot stock-dot-lg" /><span style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:'.14em', textTransform:'uppercase', color:'#16a34a', fontWeight:500 }}>In Stock — Ready to ride</span></>
            ) : (
              <><span style={{ width:10, height:10, borderRadius:'50%', background:'var(--gray-400)', display:'inline-block', flexShrink:0 }} /><span style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--gray-500)' }}>Special Order — contact us</span></>
            )}
          </div>

          {/* Variant selectors */}
          {variants.length > 1 && (
            <div className="reveal" style={{ marginBottom:24 }}>
              {hasWheels && (
                <div style={{ marginBottom:14 }}>
                  <div className="eyebrow" style={{ marginBottom:8 }}>Wheel Size</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {wheels.map(w => {
                      const active = selWheel===w;
                      const avail = variants.some(v=>v.wheel===w&&v.inStock);
                      return <button key={w} onClick={() => { setWheel(w); const nc=availColors(w)[0]||null; setColor(nc); setSize(availSizes(w,nc)[0]||null); }} data-cursor="link"
                        style={{ padding:'9px 18px', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'.12em', textTransform:'uppercase', cursor:'pointer', transition:'all .2s',
                          border:'1.5px solid '+(active?'var(--black)':avail?'rgba(22,163,74,0.4)':'var(--hairline)'),
                          background:active?'var(--black)':'transparent',
                          color:active?'var(--white)':avail?'#16a34a':'var(--gray-400)', opacity:avail?1:0.5 }}>{w}</button>;
                    })}
                  </div>
                </div>
              )}
              {hasColors && (
                <div style={{ marginBottom:14 }}>
                  <div className="eyebrow" style={{ marginBottom:8 }}>Colour</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {availColors(selWheel).map(c => {
                      const active = selColor===c;
                      const avail = variants.some(v=>(!hasWheels||v.wheel===selWheel)&&v.color===c&&v.inStock);
                      return <button key={c} onClick={() => { setColor(c); setSize(availSizes(selWheel,c)[0]||null); }} data-cursor="link"
                        style={{ padding:'9px 18px', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'.12em', textTransform:'uppercase', cursor:'pointer', transition:'all .2s',
                          border:'1.5px solid '+(active?'var(--black)':avail?'rgba(22,163,74,0.4)':'var(--hairline)'),
                          background:active?'var(--black)':'transparent',
                          color:active?'var(--white)':avail?'#16a34a':'var(--gray-400)', opacity:avail?1:0.5 }}>{c}</button>;
                    })}
                  </div>
                </div>
              )}
              {hasSizes && (
                <div style={{ marginBottom:14 }}>
                  <div className="eyebrow" style={{ marginBottom:8 }}>Frame Size</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {availSizes(selWheel,selColor).map(sz => {
                      const active = selSize===sz;
                      const avail = variants.some(v=>(!hasWheels||v.wheel===selWheel)&&(!hasColors||v.color===selColor)&&v.size===sz&&v.inStock);
                      return <button key={sz} onClick={() => setSize(sz)} data-cursor="link"
                        style={{ padding:'9px 18px', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'.12em', textTransform:'uppercase', cursor:'pointer', transition:'all .2s',
                          border:'1.5px solid '+(active?'var(--black)':avail?'rgba(22,163,74,0.4)':'var(--hairline)'),
                          background:active?'var(--black)':'transparent',
                          color:active?'var(--white)':avail?'#16a34a':'var(--gray-400)', opacity:avail?1:0.5 }}>{sz}</button>;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

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
  { brand:"Transition", name:"Spire Carbon Eagle 90",handle:"transition-spire-carbon-eagle-90",type:"Mountain", tags:"Mountain Bike, Carbon, Full Suspension", price:9700, badge:"PRO", img:"https://www.transitionbikes.com/WebStoreImages/SB-Spire-AlloyE70-UltraViolet.avif" },
  { brand:"Pivot", name:"Switchblade Ride Eagle 70/90", handle:"pivot-switchblade-ride-eagle-70-90", type:"Mountain", tags:"Mountain Bike, Full Suspension", price:8000, badge:"PRO", img:"https://cms.pivotcycles.com/wp-content/uploads/2025/11/switchbladev3-highlight-right-aurhm3my.jpg" },
  { brand:"Surly", name:"Sorceress",    handle:"surly-sorceress",    type:"Mountain", tags:"Mountain Bike, Fat Bike",  price:3400, img:"https://surlybikes.com/cdn/shop/files/surly-sorceress-eagle-90-bike-purple-BK01561.jpg?v=1774378038&width=1946" },
  { brand:"Marin", name:"Gestalt 2",   handle:"marin-gestalt-2",    type:"Gravel",   tags:"Gravel Bike, 700c",        price:2000, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_GESTALT_2_BLACK_SIDE_grande.png?v=1753870775" },
  { brand:"Marin", name:"Gestalt X10", handle:"marin-gestalt-x10",  type:"Gravel",   tags:"Gravel Bike, 700c",        price:1400, img:"https://marinbikes.com/cdn/shop/files/2023_Gestalt_X10_GalleryE_side.jpg?v=1744825311&width=1000" },
  { brand:"Marin", name:"Nicasio 2",   handle:"marin-nicasio-2",    type:"Gravel",   tags:"Gravel Bike, 700c",        price:2300, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_NICASIO_2_RED_SIDE_grande.png?v=1753866430" },
  { brand:"Marin", name:"Presidio 3",  handle:"marin-presidio-3",   type:"Gravel",   tags:"Gravel Bike, 700c",        price:1470, img:"https://marinbikes.com/cdn/shop/files/2024_MARIN_PRESIDIO_3_BLUE_SIDE_grande.png?v=1753868606" },
  { brand:"Marin", name:"Four Corners 1",handle:"marin-four-corners-1",type:"Gravel",tags:"Touring Bike, Gravel",     price:1600, img:"https://cdn.shopify.com/s/files/1/0931/9455/1645/files/MRN_27_FC_1_GREEN_PROFILE_2000PX.png?v=1773143826" },
  { brand:"Surly", name:"Bridge Club", handle:"surly-bridge-club",  type:"Gravel",   tags:"Gravel Bike, Adventure",   price:1850, img:"https://surlybikes.com/cdn/shop/files/surly-bridge-club-bike-lingering-cranberry-BK01508.jpg?v=1773411087&width=1946" },
  { brand:"Marin", name:"Stinson E",    handle:"marin-stinson-e",    type:"E-Bike",  tags:"Electric Bike, City",      price:2100, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_STINSON_E_BLACK_SIDE_1_grande.png?v=1753862906" },
  { brand:"Marin", name:"Stinson E ST", handle:"marin-stinson-e-st", type:"E-Bike",  tags:"Electric Bike, Step-Through", price:2100, img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_STINSON_E_SILVER_SIDE_52da63a1-edc3-401a-a329-2405e10cfb54_grande.png?v=1755715647" },
  { brand:"Pivot",      name:"Shuttle AM Ride Eagle 70/90",handle:"pivot-shuttle-am-ride-eagle-70-90",  type:"E-Bike", tags:"Electric Bike, Full Suspension", price:11500, badge:"PRO", img:"https://cms.pivotcycles.com/wp-content/uploads/2025/10/shuttleam-photo-gallery-beauty-4-msswiet3.jpg" },
  { brand:"Transition", name:"Regulator CX Eagle 90",      handle:"transition-regulator-cx-eagle-90",  type:"E-Bike", tags:"Electric Bike, Full Suspension", price:13000, badge:"PRO", img:"https://www.transitionbikes.com/images/C1-2026-Regulator-CX.avif" },
  { brand:"Marin", name:"Fairfax 1",       handle:"marin-fairfax-1",      type:"Commuter", tags:"Dual-Sport, Commuter",    price:700,  img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_FAIRFAX_1_RED_SIDE_4f661e02-11de-454f-bb55-5ef9d8d805fc_grande.png?v=1755769099" },
  { brand:"Marin", name:"Fairfax 2",       handle:"marin-fairfax-2",      type:"Commuter", tags:"Dual-Sport, Commuter",    price:960,  img:"https://marinbikes.com/cdn/shop/files/2022_MARIN_FAIRFAX_2_MAROON_SIDE_391346d2-76af-4fa7-8e8a-4f0a68e0cf32_grande.png?v=1753872171" },
  { brand:"Marin", name:"San Anselmo DS2", handle:"marin-san-anselmo-ds2",type:"Commuter", tags:"Dual-Sport, Women's",     price:960,  img:"https://marinbikes.com/cdn/shop/files/2021_San_Anselmo_DS1_Color.jpg?v=1744825386&width=1000" },
  { brand:"Marin", name:"Kentfield ST 1",  handle:"marin-kentfield-st-1", type:"Commuter", tags:"City, Comfort",           price:670,  img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_KENTFIELD_1_ST_CHARCOAL_SIDE_grande.png?v=1753788056" },
  { brand:"Marin", name:"Kentfield ST 2",  handle:"marin-kentfield-st-2", type:"Commuter", tags:"City, Comfort",           price:900,  img:"https://marinbikes.com/cdn/shop/files/2025_MARIN_KENTFIELD_2_ST_SILVER_SIDE_grande.png?v=1753788076" },
  { brand:"Marin", name:"Stinson 1 27.5",    handle:"marin-stinson-1-27-5",    type:"Comfort", tags:"Comfort, Cruiser, 27.5\"", price:860, img:"https://marinbikes.com/cdn/shop/files/2024_MARIN_STINSON_1_BLACK_SIDE_grande.png?v=1755792681" },
  { brand:"Marin", name:"Stinson 1 LS 27.5", handle:"marin-stinson-1-ls-27-5", type:"Comfort", tags:"Comfort, Step-Through",   price:800, img:"https://cdn.shopify.com/s/files/1/0931/9455/1645/files/2025_MARIN_STINSON_LS_1_TEAL_SIDE.png?v=1753799841" },
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
  { brand:"Knolly", name:"Fugitive",  handle:"knolly-fugitive",  type:"Mountain", tags:"Mountain Bike, Enduro, Full Suspension", price:4550, badge:"PRO", img:"https://cdn.shopify.com/s/files/1/0714/3611/files/FUGITIVE_EAGLE_90_FOX_-_RAW_LOUVRED.png?v=1759774351" },
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

  // Catalog: SHOP_BIKES merged with live Lightspeed stock data + size variants
  const allProducts = React.useMemo(() => {
    if (!liveProducts) return SHOP_BIKES;

    const FRAME_RE = /\b(Extra\s+Small|Extra\s+Large|Small|Medium|Large|X-Small|X-Large|XS|XL|XXL|\d+cm)\s*$/i;
    // Only match real bicycle wheel sizes — prevents model-level numbers (1,2,3,4,5) being shown as wheel sizes
    const VALID_WHEELS = /^(700[cC]?|650[bB]?|27\.5|29|26|24|20|16)\s*"?\s*/;

    function parseVariantLabel(label) {
      let s = label.trim();
      // Frame size at end
      const fmatch = s.match(FRAME_RE);
      const size = fmatch ? fmatch[1] : null;
      if (size) s = s.slice(0, s.lastIndexOf(fmatch[1])).trim();
      // Strip leading model artifacts BEFORE wheel check:
      // - digits e.g. "4 ", "3 ", "90 " (model numbers/years)
      // - short uppercase codes e.g. "E ", "ST ", "CX " (sub-model codes)
      s = s.replace(/^(\d+\s+|[A-Z]{1,3}\s+)+/, '').trim();
      // Wheel size — whitelist only valid bicycle sizes
      const wmatch = s.match(VALID_WHEELS);
      const wheel = wmatch ? wmatch[1].replace(/c$/i,'C').replace(/b$/i,'B') + '"' : null;
      if (wheel) s = s.slice(wmatch[0].length).trim();
      // Color is what remains
      const color = s.replace(/^[-–\s]+/, '').trim() || null;
      return { wheel, color, size };
    }

    function extractLabel(liveName, shopBrand, shopName) {
      let rest = liveName.replace(new RegExp('^' + shopBrand.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\s*','i'), '');
      _norm(shopName).split(' ').filter(w=>w.length>=3).forEach(kw => {
        rest = rest.replace(new RegExp('\\b' + kw + '\\b','gi'), '');
      });
      return rest.trim().replace(/\s+/g,' ');
    }

    // Strip trailing wheel size from model name to get base model for grouping
    // e.g. "Bobcat Trail 4 27.5" → "Bobcat Trail 4", "Gestalt 2" → "Gestalt 2" (unchanged)
    const WHEEL_SUFFIXES = ['27.5','29','26','24','20','16','700','650'];
    function baseModel(name) {
      for (const w of WHEEL_SUFFIXES) {
        if (name.endsWith(' ' + w)) return name.slice(0, -(w.length + 1)).trim();
      }
      return name;
    }

    // Group SHOP_BIKES entries by (brand, baseModel) so e.g. Bobcat Trail 4 27.5 + 29 → one card
    const groups = {};
    SHOP_BIKES.forEach(s => {
      const base = baseModel(s.name);
      const key = `${s.brand}||${base}`;
      if (!groups[key]) groups[key] = { ...s, name: base, _entries: [] };
      groups[key]._entries.push(s);
    });

    return Object.values(groups).map(group => {
      const sb = _norm(group.brand || '');
      // Collect Lightspeed matches for ALL sub-entries (deduped by sku)
      const seen = new Set();
      const allMatches = [];
      group._entries.forEach(s => {
        const sKw = _norm(s.name).split(' ').filter(w => w.length >= 4);
        const sNorm = _norm(s.name);
        liveProducts.filter(l => {
          const lb = _norm((l.name || '').split(' ')[0]);
          if (lb !== sb) return false;
          const ln = _norm(l.name);
          return sKw.length > 0 ? sKw.every(w => ln.includes(w)) : ln.includes(sNorm);
        }).forEach(m => { if (!seen.has(m.sku)) { seen.add(m.sku); allMatches.push(m); } });
      });

      if (allMatches.length === 0) return { ...group, inStock: false };
      const inStockMatches = allMatches.filter(m => m.inStock);
      const best = inStockMatches[0] || allMatches[0];
      if (allMatches.length === 1) return { ...group, price: best.price || group.price, inStock: best.inStock, qty: best.qty, sku: best.sku };

      // Use the base model name for label extraction so wheel sizes stay in the variant
      const baseName = baseModel(group._entries[0].name);
      const variants = allMatches.map(m => {
        const label = extractLabel(m.name, group.brand || '', baseName);
        const parsed = parseVariantLabel(label);
        return { ...parsed, label, inStock: m.inStock, qty: m.qty, price: m.price, sku: m.sku };
      }).filter(v => v.sku);

      return { ...group, price: best.price || group.price, inStock: inStockMatches.length > 0, qty: best.qty, sku: best.sku, variants };
    });
  }, [liveProducts]);

  const ALL_BRANDS = ["Marin","Transition","Surly","Pivot","Salsa","Bianchi","Moots","Knolly","Revel"];
  const TYPE_TABS = ["All","Mountain","Gravel","E-Bike","Commuter","Comfort","Kids"];

  // Always show only in-stock bikes
  let filtered = brand !== "All"
    ? allProducts.filter(b => (b.brand || b.vendor || '') === brand && b.inStock !== false)
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

  return (
    <div className="page-fade">
      <SubHero eyebrow="Shop  /  All Bikes" title="The Bikes." italic="Performance for every terrain." />

      {/* ── Filter + sort bar ── */}
      <div className="shop-filter-sticky" style={{ position:"sticky", top:132, zIndex:50, background:"rgba(250,250,250,0.97)", backdropFilter:"blur(12px)", borderBottom:"1px solid var(--hairline)" }}>

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

        {/* Row 2: type tabs */}
        <div className="container-wide" style={{ display:"flex", alignItems:"center", paddingTop:"6px", paddingBottom:"2px", overflowX:"auto", scrollbarWidth:"none" }}>
          {TYPE_TABS.map(t => (
            <button key={t} data-cursor="link" onClick={() => setType(t)} style={tabStyle(type === t)}>{t}</button>
          ))}
        </div>
        {/* Row 3: brand chips */}
        <div className="container-wide" style={{ display:"flex", alignItems:"center", paddingTop:"2px", paddingBottom:"10px", overflowX:"auto", scrollbarWidth:"none" }}>
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
          {filtered.length === 0 && !liveLoading ? (
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
  const variants = b.variants || [];
  const inStockV = variants.filter(v => v.inStock);

  // Derive available dimension values
  const wheels  = [...new Set(variants.map(v => v.wheel).filter(Boolean))];
  const colors  = [...new Set(variants.map(v => v.color).filter(Boolean))];
  const sizes   = [...new Set(variants.map(v => v.size).filter(Boolean))];
  const hasWheels = wheels.length > 1;
  const hasColors = colors.length > 1;
  const hasSizes  = sizes.length > 1;

  // Smart default: prefer 29" + Medium, fall back gracefully
  const pickDefault = (vs) => {
    const ins = vs.filter(v => v.inStock);
    return ins.find(v => v.wheel === '29"' && v.size === 'Medium')
      || ins.find(v => v.wheel === '29"')
      || ins.find(v => v.size === 'Medium')
      || ins[0] || vs[0];
  };
  const defV = pickDefault(variants);
  const [selWheel, setWheel] = React.useState(defV?.wheel || null);
  const [selColor, setColor] = React.useState(defV?.color || null);
  const [selSize,  setSize]  = React.useState(defV?.size  || null);
  const [adding,   setAdding] = React.useState(false);
  const [added,    setAdded]  = React.useState(false);

  // Re-apply defaults when variants load asynchronously after mount
  React.useEffect(() => {
    const d = pickDefault(b.variants || []);
    if (d) { setWheel(d.wheel || null); setColor(d.color || null); setSize(d.size || null); }
  }, [b.handle, (b.variants || []).length]);

  // Find the selected variant
  const selected = variants.find(v =>
    (!hasWheels || v.wheel === selWheel) &&
    (!hasColors || v.color === selColor) &&
    (!hasSizes  || v.size  === selSize)
  ) || defV;

  const name    = b.name  || b.title  || "";
  const brand   = b.brand || b.vendor || "";
  const img     = resolveImage(selected ? { ...b, sku: selected.sku } : b) || resolveImage(b);
  const price   = selected?.price || b.price || 0;
  const inStock = selected ? selected.inStock : b.inStock !== false;
  const qty     = selected?.qty ?? b.qty ?? null;
  const lowStock = qty !== null && qty > 0 && qty <= 3;

  // Which options are available given current selections
  const availColors = (wheel) => [...new Set(variants.filter(v => !hasWheels || v.wheel === wheel).map(v => v.color).filter(Boolean))];
  const availSizes  = (wheel, color) => [...new Set(variants.filter(v => (!hasWheels || v.wheel === wheel) && (!hasColors || v.color === color)).map(v => v.size).filter(Boolean))];
  const isInStock   = (v) => variants.some(vv => (!hasWheels || vv.wheel === v.wheel) && (!hasColors || vv.color === v.color) && (!hasSizes || vv.size === v.size) && vv.inStock);

  const chipStyle = (active, avail) => ({
    padding:"3px 9px", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".1em", textTransform:"uppercase",
    border:"1px solid", cursor:"pointer", borderRadius:2, background:"none",
    borderColor: active ? "var(--black)" : avail ? "var(--hairline)" : "var(--hairline)",
    color: active ? "var(--black)" : avail ? "var(--gray-600)" : "var(--gray-300)",
    opacity: avail ? 1 : 0.4,
  });

  const handleAdd = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!inStock || !selected) return;
    setAdding(true);
    try {
      const variantDesc = [selected.wheel, selected.color, selected.size].filter(Boolean).join(' · ');
      const result = await window.clAddToCart(selected.sku, name, price, img, selected.sku, variantDesc || null);
      if (result) { setAdded(true); setTimeout(() => setAdded(false), 2000); }
    } catch(err) { console.warn(err); }
    setAdding(false);
  };

  const goToBike = () => window.cl.go("bike", { bike: b });
  const labelStyle = { fontFamily:"var(--mono)", fontSize:9, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)", marginBottom:5 };

  return (
    <div style={{ cursor:"pointer" }} onClick={goToBike}>
      {/* Image */}
      <div style={{ aspectRatio:"4/5", marginBottom:14, position:"relative", background:"var(--paper)", overflow:"hidden" }}>
        {img ? (
          <img src={img} alt={brand + " " + name} className="bike-img" loading="lazy" decoding="async"
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain", padding:"8%", mixBlendMode:"multiply", transition:"transform .4s ease" }}
            onError={e => { e.target.style.display='none'; }} />
        ) : (
          <div className="ph ph-corners" style={{ position:"absolute", inset:0 }}>
            <span className="ph-label">{brand.toUpperCase()}  ·  {b.type}</span>
          </div>
        )}
        <div style={{ position:"absolute", top:10, left:10, display:"flex", alignItems:"center", gap:6, padding:"4px 9px", background:"rgba(0,0,0,0.72)", borderRadius:2, backdropFilter:"blur(4px)" }}>
          <span className="stock-dot" />
          <span style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".14em", textTransform:"uppercase", color:"#ffffff" }}>In Stock</span>
        </div>
        {lowStock && (
          <div style={{ position:"absolute", bottom:10, left:10, padding:"4px 9px", background:"rgba(0,0,0,0.72)", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".14em", textTransform:"uppercase", color:"#ffffff", backdropFilter:"blur(4px)", borderRadius:2 }}>
            Only {qty} left
          </div>
        )}
        {b.badge && <div style={{ position:"absolute", top:10, right:10, padding:"4px 10px", background:"var(--black)", color:"var(--white)", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase" }}>{b.badge}</div>}
        <div style={{ position:"absolute", inset:0, transition:"background .3s" }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'} />
      </div>

      {/* Info */}
      <div className="eyebrow" style={{ marginBottom:4 }}>{brand}  ·  {b.type}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:10 }}>
        <div style={{ fontFamily:"var(--display)", fontSize:"clamp(15px,1.4vw,19px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", lineHeight:1.2 }}>{name}</div>
        <div style={{ fontFamily:"var(--display)", fontSize:16, fontWeight:500, flexShrink:0 }}>${price.toLocaleString()}</div>
      </div>

      {/* Variant selectors */}
      {variants.length > 1 && (
        <div style={{ marginBottom:12 }} onClick={e => e.stopPropagation()}>
          {/* Wheel size */}
          {hasWheels && (
            <div style={{ marginBottom:8 }}>
              <div style={labelStyle}>Wheel</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {wheels.map(w => {
                  const avail = variants.some(v => v.wheel === w && v.inStock);
                  return (
                    <button key={w} style={chipStyle(selWheel===w, avail)} onClick={() => {
                      setWheel(w);
                      const avColors = availColors(w);
                      const nc = avColors.includes(selColor) ? selColor : avColors[0] || null;
                      setColor(nc);
                      const avSizes = availSizes(w, nc);
                      setSize(avSizes.includes(selSize) ? selSize : avSizes[0] || null);
                    }}>{w}</button>
                  );
                })}
              </div>
            </div>
          )}
          {/* Color */}
          {hasColors && (
            <div style={{ marginBottom:8 }}>
              <div style={labelStyle}>Color</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {availColors(selWheel).map(c => {
                  const avail = variants.some(v => (!hasWheels||v.wheel===selWheel) && v.color===c && v.inStock);
                  return (
                    <button key={c} style={chipStyle(selColor===c, avail)} onClick={() => {
                      setColor(c);
                      const avSizes = availSizes(selWheel, c);
                      setSize(avSizes.includes(selSize) ? selSize : avSizes[0] || null);
                    }}>{c}</button>
                  );
                })}
              </div>
            </div>
          )}
          {/* Frame size */}
          {hasSizes && (
            <div style={{ marginBottom:8 }}>
              <div style={labelStyle}>Size</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {availSizes(selWheel, selColor).map(sz => {
                  const avail = variants.some(v => (!hasWheels||v.wheel===selWheel) && (!hasColors||v.color===selColor) && v.size===sz && v.inStock);
                  return (
                    <button key={sz} style={chipStyle(selSize===sz, avail)} onClick={() => setSize(sz)}>{sz}</button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display:"flex", gap:8 }} onClick={e => e.stopPropagation()}>
        <button className="btn btn-outline" data-cursor="link" onClick={goToBike}
          style={{ flex:1, justifyContent:"center", padding:"11px 8px", fontSize:11 }}>
          Details
        </button>
        <button className="btn" data-cursor="link" onClick={handleAdd} disabled={adding || !inStock}
          style={{ flex:1, justifyContent:"center", padding:"11px 8px", fontSize:11 }}>
          {added ? "Added ✓" : adding ? "…" : !inStock ? "Out of Stock" : "Add to Cart"}
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
      <h1 className="display-xxl sub-hero-title"><SplitText delay={0.1}>{title}</SplitText></h1>
      {italic && <div className="serif-italic" style={{ fontSize: "clamp(28px, 4.5vw, 56px)", marginTop: 12, color: "var(--gray-300)" }}>{italic}</div>}
    </div>
  </section>
);

// SERVICES PAGE
const ServicesPage = () => {
  const [activeTab, setActiveTab] = React.useState("all");
  const tabs = ["all", "mountain", "road", "suspension"];
  const [lsPrices, setLsPrices] = React.useState({});

  // Fetch Labour dept from Lightspeed for live prices
  React.useEffect(() => {
    const load = async () => {
      try {
        const items = await window.lightspeedGetDept('Labour');
        const map = {};
        (items || []).forEach(it => {
          if (it.name && it.price > 0) map[it.name.toLowerCase().trim()] = it.price;
        });
        setLsPrices(map);
      } catch(e) {}
    };
    load();
  }, []);

  const lsPrice = (name) => {
    const key = name.toLowerCase().trim();
    if (lsPrices[key]) return lsPrices[key];
    // fuzzy: find closest key
    const fuzzy = window.fuzzyMatch;
    if (fuzzy) {
      const match = Object.keys(lsPrices).find(k => fuzzy(name, k) || fuzzy(k, name));
      if (match) return lsPrices[match];
    }
    return null;
  };

  const T = ["Washed and re-lubed","Adjusted gears and brakes","Trued and tensioned wheels","Checked BB, hubs and headset","Checked stem and bar bolts"];
  const ALL_SERVICES = [
    // ── All Bikes: tune-ups, flat fix, overhaul, then misc ──
    { cat:"all", n:"01", name:"Basic Tune Up",            price:60,  time:"SAME DAY",
      includes:["Adjusted gears and brakes","Checked stem and bar bolts","Safety inspection"] },
    { cat:"all", n:"02", name:"Tune Up",                  price:120, time:"SAME DAY",
      includes:[...T] },
    { cat:"all", n:"03", name:"Flat Fix",                 price:25,  time:"SAME DAY",
      desc:"Tube replacement including labour. Parts extra." },
    { cat:"all", n:"04", name:"Complete Overhaul",        price:250, time:"3–5 DAYS",
      includes:["Full teardown and degrease","Regreased all bearings","Rebuilt and adjusted all systems","New cables and housing","Safety inspection and road test"] },
    { cat:"all", n:"05", name:"Flat Fix — E-Bike Rear",   price:80,  time:"SAME DAY",
      desc:"Rear hub motor wheel removal and tube or tire replacement. Labour only — parts extra." },
    { cat:"all", n:"06", name:"Brake Bleed",              price:60,  time:"SAME DAY",
      desc:"Hydraulic brake bleed per caliper. Parts extra." },
    { cat:"all", n:"07", name:"Wheel True",               price:25,  time:"SAME DAY",
      desc:"Hand-trued and tensioned. Per wheel." },
    { cat:"all", n:"08", name:"Tubeless Set Up",          price:35,  time:"SAME DAY",
      desc:"Per wheel — tape, valve stem, sealant installed." },
    { cat:"all", n:"09", name:"Cable & Housing Full",     price:60,  time:"1–2 DAYS",
      desc:"Complete cable and housing replacement on all cables." },
    { cat:"all", n:"10", name:"Cable & Housing Half",     price:35,  time:"1 DAY",
      desc:"Partial cable and housing refresh." },
    { cat:"all", n:"11", name:"Bar Wrap",                 price:30,  time:"SAME DAY",
      desc:"Professional bar tape wrap. Tape not included." },
    { cat:"all", n:"12", name:"Dropper Post Install",     price:50,  time:"SAME DAY",
      desc:"Internal or external dropper post installation — full routing included." },
    { cat:"all", n:"13", name:"CushCore Install",         price:50,  time:"1 DAY",
      desc:"CushCore insert installation. Per wheel." },
    { cat:"all", n:"14", name:"Accessory Install",        price:30,  time:"SAME DAY",
      desc:"Racks, fenders, lights, mirrors, computers and more." },
    { cat:"all", n:"15", name:"Bike Assessment",          price:30,  time:"30 MIN",
      desc:"Thorough inspection with written report. Cost applied toward any repair." },
    // ── Mountain ──
    { cat:"mountain", n:"01", name:"Tune Up",             price:120, time:"SAME DAY",
      includes:[...T] },
    { cat:"mountain", n:"02", name:"FS Tune Up",          price:155, time:"1–2 DAYS",
      includes:[...T,"Removed shock, checked pivot and bushing condition","Torqued all pivot bolts to spec"] },
    { cat:"mountain", n:"03", name:"E-Bike Tune Up",      price:120, time:"1–2 DAYS",
      includes:[...T,"Motor and battery system check","Firmware update if available"] },
    { cat:"mountain", n:"04", name:"Fork Seal Service",   price:65,  time:"1–2 DAYS",
      includes:["Lower legs removed","Cleaned and inspected internals","New seals and foam rings","Fresh bath oil"] },
    { cat:"mountain", n:"05", name:"Shock Air Can Service", price:45, time:"1 DAY",
      includes:["Air can removed","Cleaned and inspected","New air seals installed","Fresh oil"] },
    { cat:"mountain", n:"06", name:"Dropper Post Service", price:140, time:"1–2 DAYS",
      desc:"Full dropper rebuild — seals, oil, bleed. Fox Transfer, Reverb, PNW, OneUp and more." },
    { cat:"mountain", n:"07", name:"Shimano Clutch Service", price:25, time:"SAME DAY",
      desc:"Cleaned and regreased Shimano clutch. Restores crisp, quiet shifting." },
    { cat:"mountain", n:"08", name:"E-Bike Firmware & Scan", price:25, time:"SAME DAY",
      desc:"Bosch, Shimano Steps and Bafang firmware update plus system scan." },
    { cat:"mountain", n:"09", name:"Cable Package — Full",      price:60,  time:"1–2 DAYS",
      desc:"Complete cable and housing replacement on all cables." },
    { cat:"mountain", n:"10", name:"Cable Package — Internal",  price:60,  time:"1–2 DAYS",
      desc:"Full internal cable and housing replacement, all cables routed." },
    { cat:"mountain", n:"11", name:"Cable Package — Half",      price:35,  time:"1 DAY",
      desc:"Partial cable and housing refresh." },
    // ── Road ──
    { cat:"road", n:"01", name:"Road Tune Up",            price:120, time:"SAME DAY",
      includes:[...T] },
    { cat:"road", n:"02", name:"Brake Bleed",             price:60,  time:"SAME DAY",
      desc:"Hydraulic brake bleed per caliper. Parts extra." },
    { cat:"road", n:"03", name:"Full Cable Package",      price:60,  time:"1–2 DAYS",
      desc:"Complete shifter and brake cable and housing replacement." },
    { cat:"road", n:"04", name:"Half Cable Package",      price:35,  time:"1 DAY",
      desc:"Partial cable and housing replacement." },
    { cat:"road", n:"05", name:"Internal Full Cable",     price:60,  time:"1–2 DAYS",
      desc:"Full internal cable routing replacement including housing." },
    { cat:"road", n:"06", name:"Bar Wrap",                price:30,  time:"SAME DAY",
      desc:"Professional bar tape wrap. Tape not included." },
    { cat:"road", n:"07", name:"Wheel True",              price:25,  time:"SAME DAY",
      desc:"Hand-trued and tensioned. Per wheel." },
    // ── Suspension 50hr maintenance ──
    { cat:"suspension", n:"01", name:"Fork Air Can Service",   price:65,  time:"1 DAY",
      includes:["Air can removed","New air seals installed","Fresh oil bath","Air spring serviced"] },
    { cat:"suspension", n:"02", name:"Fork Lower Leg Service", price:65,  time:"1 DAY",
      includes:["Lower legs removed","Cleaned and inspected","New foam rings and seals","Fresh bath oil"] },
    { cat:"suspension", n:"03", name:"Fork 50hr Full Service", price:120, time:"1–2 DAYS",
      includes:["Air can service (seals + oil)","Lower leg service (seals + foam rings + oil)","Recommended every 50 riding hours"] },
    { cat:"suspension", n:"04", name:"Shock Air Can Service",  price:45,  time:"1 DAY",
      includes:["Air can removed","New seals installed","Fresh oil","Consistent feel restored"] },
    { cat:"suspension", n:"05", name:"50hr Fork + Shock",      price:155, time:"2 DAYS",
      includes:["Fork lower leg service","Shock air can service","Best value — done together"] },
    { cat:"suspension", n:"06", name:"Dropper Post Service",   price:140, time:"1–2 DAYS",
      desc:"Full dropper rebuild — seals, oil, bleed. Fox Transfer, Reverb, PNW, OneUp and more." },
    { cat:"suspension", n:"07", name:"Suspension Setup",        price:50,  time:"30 MIN",
      includes:["Sag set for your weight","Rebound dialled in","Compression tuned to your riding style"] },
    { cat:"suspension", n:"08", name:"Cable Package — Full",    price:60,  time:"1–2 DAYS",
      desc:"Complete cable and housing replacement on all cables." },
    { cat:"suspension", n:"09", name:"Cable Package — Internal", price:60, time:"1–2 DAYS",
      desc:"Full internal cable and housing replacement, all cables routed." },
    { cat:"suspension", n:"10", name:"Cable Package — Half",    price:35,  time:"1 DAY",
      desc:"Partial cable and housing refresh." },
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
              <div key={i} className="page-svc-row reveal" style={{ padding:"24px 0", borderBottom:"1px solid var(--hairline)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:24, flexWrap:"wrap" }}>
                  {/* Left: number + name + price on mobile + what's included */}
                  <div style={{ flex:1, minWidth:220 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                      <span style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", color:"var(--gray-500)" }}>{s.n}</span>
                      <span style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-400)" }}>{s.time}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"baseline", gap:16, flexWrap:"wrap", marginBottom: s.includes||s.desc ? 10 : 0 }}>
                      <div style={{ fontFamily:"var(--display)", fontSize:"clamp(16px,1.8vw,22px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em" }}>{s.name}</div>
                      <div style={{ fontFamily:"var(--display)", fontSize:20, fontWeight:500, color:"var(--black)" }}>
                        ${lsPrice(s.name) || s.price}
                      </div>
                    </div>
                    {s.includes && (
                      <ul style={{ listStyle:"none", padding:0, margin:0, display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"3px 24px" }}>
                        {s.includes.map((item, j) => (
                          <li key={j} style={{ display:"flex", alignItems:"flex-start", gap:7, fontSize:13, color:"var(--gray-600)", lineHeight:1.5 }}>
                            <span style={{ marginTop:6, width:3, height:3, borderRadius:"50%", background:"var(--gray-400)", flexShrink:0, display:"inline-block" }}/>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    {s.desc && <div style={{ color:"var(--gray-500)", fontSize:13, lineHeight:1.6 }}>{s.desc}</div>}
                  </div>
                  {/* Right: book button */}
                  <div style={{ display:"flex", alignItems:"flex-start", flexShrink:0, paddingTop:2 }}>
                    <button className="btn btn-outline" data-cursor="link" style={{ fontSize:11, whiteSpace:"nowrap" }} onClick={() => window.cl.go("book")}>Book <ArrowRight /></button>
                  </div>
                </div>
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
  const [submitted, setSubmitted] = React.useState(false);
  const update = (k, v) => setData(d => ({ ...d, [k]: v }));
  const next = () => setStep(s => Math.min(s + 1, 4));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const SERVICES = [
    "Tune-Up","Full Suspension Tune-Up","E-Bike Tune-Up","Complete Overhaul",
    "Fork Seal Service","Shock Air Can Service","Dropper Service","Brake Bleed",
    "Cable Package","Wheel Build","Tubeless Set Up","Flat Fix","Other / Not Sure",
  ];

  const WORKER = "https://still-term-f1ec.taocaruso77.workers.dev";
  const inpStyle = { width:"100%", padding:"12px 0", border:"none", borderBottom:"1px solid var(--hairline)", fontSize:16, fontFamily:"var(--body)", background:"transparent", outline:"none", color:"var(--black)" };
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const bikeStr = `${data.bikeBrand||''} ${data.bikeModel||''} ${data.bikeYear||''}`.trim();
      const fd = new FormData();
      fd.append("name",    data.name    || '');
      fd.append("phone",   data.phone   || '');
      fd.append("email",   data.email   || '');
      fd.append("bike",    bikeStr);
      fd.append("service", data.service || 'Assessment / Not sure');
      fd.append("date",    data.date    || 'Flexible');
      fd.append("issue",   data.issue   || '');
      if (data.photoFile) fd.append("photo", data.photoFile);

      // Build a separate FormData for work-order (no photo needed)
      const woFd = new FormData();
      woFd.append("name",    data.name    || '');
      woFd.append("phone",   data.phone   || '');
      woFd.append("email",   data.email   || '');
      woFd.append("bike",    bikeStr);
      woFd.append("service", data.service || 'Assessment / Not sure');
      woFd.append("date",    data.date    || 'Flexible');
      woFd.append("issue",   data.issue   || '');

      // Fire both in parallel — email is primary, work-order is best-effort
      const [res] = await Promise.all([
        fetch(`${WORKER}/api/book`, { method: "POST", body: fd }),
        fetch(`${WORKER}/api/work-order`, { method: "POST", body: woFd }).catch(() => {}),
      ]);
      const json = await res.json();
      if (json.ok) { setSubmitted(true); return; }
      throw new Error("Worker error");
    } catch {
      // Fallback: open mailto so no booking is ever lost
      const body = encodeURIComponent(
        `ChainLine — Service Booking\n\nName: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email||'-'}\nBike: ${data.bikeBrand||''} ${data.bikeModel||''} ${data.bikeYear||''}\nService: ${data.service||'Assessment'}\nDate: ${data.date||'Flexible'}\nNotes: ${data.issue||'-'}`
      );
      window.location.href = `mailto:bikes@chainline.ca?subject=${encodeURIComponent('Service Booking — '+(data.name||'Customer'))}&body=${body}`;
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-fade" data-screen-label="P04 Book">
      <SubHero eyebrow="Booking  /  N°01" title="Book an assessment." italic="Drop it off, we'll take care of the rest." />
      <section className="section section-pad bg-white">
        <div className="container-narrow">

          {/* Progress bar — hidden after submit */}
          {!submitted && (
            <>
              <div style={{ display:"flex", gap:6, marginBottom:40 }}>
                {[1,2,3,4].map(s => (
                  <div key={s} style={{ flex:1, height:2, background: s <= step ? "var(--black)" : "var(--hairline)", transition:"background .3s" }} />
                ))}
              </div>
              <div className="eyebrow" style={{ marginBottom:24 }}>Step {step} of 4</div>
            </>
          )}

          {!submitted && step === 1 && (
            <div>
              <h2 className="display-l book-step-h" style={{ marginBottom:12 }}>Your details.</h2>
              <p style={{ color:"var(--gray-500)", fontSize:15, marginBottom:36 }}>We'll call or text to confirm your appointment.</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px 32px", marginBottom:24 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <div className="eyebrow" style={{ marginBottom:8 }}>Name *</div>
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

          {!submitted && step === 2 && (
            <div>
              <h2 className="display-l book-step-h" style={{ marginBottom:12 }}>Your bike.</h2>
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
                    onChange={e => { const f = e.target.files[0]; if(f) { update("photoName", f.name); update("photoFile", f); } }} />
                </label>
                {data.photoName && <p style={{ marginTop:8, fontSize:13, color:"var(--gray-500)" }}>✓ {data.photoName} — bring this photo with you or email it separately.</p>}
              </div>
              <div style={{ display:"flex", gap:12 }}>
                <button className="btn btn-outline" data-cursor="link" onClick={back}>← Back</button>
                <button className="btn" data-cursor="link" onClick={next}>Continue <ArrowRight /></button>
              </div>
            </div>
          )}

          {!submitted && step === 3 && (
            <div>
              <h2 className="display-l book-step-h" style={{ marginBottom:12 }}>What's needed?</h2>
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

          {!submitted && step === 4 && data.name && (
            <div>
              <h2 className="display-l book-step-h" style={{ marginBottom:12 }}>Preferred drop-off date.</h2>
              <p style={{ color:"var(--gray-500)", fontSize:15, marginBottom:28 }}>Pick a day to bring your bike in. We'll confirm by phone or email within 24 hours.</p>
              <Calendar onPick={(d) => update("date", d)} />
              {data.date && <p style={{ marginTop:12, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-500)" }}>Selected: {data.date}</p>}
              <div style={{ marginTop:32, display:"flex", gap:12, flexWrap:"wrap" }}>
                <button className="btn btn-outline" data-cursor="link" onClick={back}>← Back</button>
                <button className="btn" data-cursor="link" onClick={submit} disabled={submitting}>
                  {submitting ? "Sending…" : "Send Booking Request"} {!submitting && <ArrowRight />}
                </button>
              </div>
              <p style={{ marginTop:16, fontSize:13, color:"var(--gray-400)", fontFamily:"var(--mono)", letterSpacing:".1em" }}>
                This sends a booking request to bikes@chainline.ca. We'll call to confirm.
              </p>
            </div>
          )}

          {!submitted && step === 4 && !data.name && (
            <div style={{ textAlign:"center", padding:"40px 0" }}>
              <p style={{ color:"var(--gray-500)", marginBottom:24 }}>Please go back and fill in your name and phone number.</p>
              <button className="btn btn-outline" onClick={() => setStep(1)}>Start Over</button>
            </div>
          )}

          {/* Confirmation after submit */}
          {submitted && (
            <div>
              <h2 className="display-l" style={{ marginBottom: 16 }}>Request Sent ✓</h2>
              <p className="serif-italic" style={{ fontSize: 22, color: "var(--gray-500)", marginBottom: 32 }}>We'll be in touch within 24 hours to confirm your slot.</p>
              <div style={{ padding:"24px 28px", background:"var(--paper)", borderLeft:"3px solid var(--black)", marginBottom:32 }}>
                <p style={{ fontSize:14, color:"var(--gray-600)", lineHeight:1.7 }}>
                  Your booking request has been sent to <strong>bikes@chainline.ca</strong>. You'll receive a confirmation call or email to lock in your appointment time.<br/><br/>
                  Questions? Call us at <a href="tel:2508601968" style={{ fontWeight:600 }}>(250) 860-1968</a> — Mon 10–5, Tue–Fri 9:30–5:30, Sat 10–4.
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

    {/* Story */}
    <section className="section section-pad bg-paper">
      <div className="container-narrow">
        <blockquote className="reveal serif-italic" style={{ fontSize: "clamp(28px, 4.5vw, 64px)", lineHeight: 1.15, margin: 0, textAlign: "center", padding: "40px 0", borderTop: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)" }}>
          "Built for Kelowna.<br/>Backed by Canada."
        </blockquote>
        <div className="reveal" style={{ marginTop: 72 }}>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "var(--gray-600)" }}>
            <span className="serif-italic" style={{ fontSize: 64, float: "left", lineHeight: 0.8, paddingRight: 12, paddingTop: 8 }}>C</span>hainLine Cycle is Kelowna's finest bicycle service shop, with more than 100 years' combined experience serving riders across the Okanagan. We do super-fast flat repairs, custom bike and wheel builds, full hydraulic brake and suspension service, and repairs on any brand of bike.
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "var(--gray-600)", marginTop: 24 }}>
            We stock or can special order parts for all brands of drivetrain — Shimano, SRAM, Campagnolo, Hayes, Avid, TRP, Tektro, and more. We're an authorized dealer for Marin, Transition, Surly, Pivot, Salsa, Bianchi, Moots, Knolly, and Revel. Bring your bike in and we'll have you riding high in no time.
          </p>
        </div>
      </div>
    </section>

    {/* Timeline */}
    <section className="section section-pad bg-white">
      <div className="container-wide">
        <div className="reveal section-label">Our Story</div>
        <div style={{ borderTop: "1px solid var(--hairline)" }}>
          {[
            ["2009", "Founded on Ellis St., Kelowna", "Two riders, one small shop, one goal — a bike shop worth walking into."],
            ["2011", "First Transition dealer in the BC Interior", "We brought trail geometry to Kelowna before it was mainstream."],
            ["2014", "Full-service department launched", "Expanded to a dedicated service floor with certified technicians."],
            ["2017", "Moved to 1139 Ellis St.", "Bigger floor, same team, same ethos."],
            ["2020", "Rode through the pandemic", "Bikes became essential. We stayed open, kept wrenching, kept riding."],
            ["2024", "15 years and counting", "Still local. Still answering our own phone. Still Kelowna's bike shop."],
          ].map(([year, title, desc], i) => (
            <div key={year} className={"reveal"} style={{ display:"grid", gridTemplateColumns:"120px 1fr", gap:32, padding:"32px 0", borderBottom:"1px solid var(--hairline)", alignItems:"start" }}>
              <div style={{ fontFamily:"var(--display)", fontSize:28, fontWeight:500, letterSpacing:"-.02em", color:"var(--gray-400)", paddingTop:3 }}>{year}</div>
              <div>
                <div style={{ fontFamily:"var(--display)", fontSize:"clamp(16px,1.8vw,20px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", marginBottom:6 }}>{title}</div>
                <p style={{ fontSize:14, color:"var(--gray-500)", lineHeight:1.6, margin:0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Team */}
    <section className="section section-pad bg-paper">
      <div className="container-wide">
        <div className="reveal section-label">The Team</div>
        <h2 className="display-xl reveal" style={{ marginBottom: 64 }}>The people<br/><span className="serif-italic">behind the bench.</span></h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:2 }}>
          {[
            { name:"Darrin Caruso",   role:"Owner · Manager · Mechanic · Sales" },
            { name:"Matt Bisaro",     role:"Assistant Manager · Mechanic" },
            { name:"Jason Tomm",      role:"Sales · Warranty" },
            { name:"Phil Glerum",     role:"Mechanic · Sales" },
            { name:"Tao Caruso",      role:"Sales · Assistant Manager" },
            { name:"Steve Lauridsen", role:"Mechanic" },
            { name:"Joanne King",     role:"Inventory · Shipping & Receiving" },
            { name:"Steve Gaucher",   role:"IT · Event Organizer" },
          ].map((p, i) => (
            <div key={i} className={"reveal reveal-d-" + (i % 4 + 1)}
              style={{ padding:"32px 28px", background:"var(--white)", borderTop:"2px solid var(--black)" }}>
              <div style={{ fontFamily:"var(--display)", fontSize:"clamp(18px,1.8vw,22px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", marginBottom:8 }}>{p.name}</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-500)", lineHeight:1.7 }}>{p.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="section section-pad bg-black" data-screen-label="P05 Values">
      <div className="container-wide">
        <div className="reveal section-label" style={{ color:"var(--gray-400)" }}>What We Stand For</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:0, borderTop:"1px solid var(--hairline-light)" }}>
          {[
            ["01", "Ride What We Sell", "Every brand on the floor has been tested by someone on our team. We won't sell a bike we wouldn't ride ourselves."],
            ["02", "Honest Advice", "We'll tell you if the bike you want isn't the right fit. Our goal is your best ride, not our best margin."],
            ["03", "Local Through and Through", "We hire local, sponsor local, and ride the same trails as our customers. Kelowna isn't a market — it's home."],
          ].map(([n, t, d], i) => (
            <div key={n} className={"reveal reveal-d-" + (i + 1)} style={{ padding:"48px 32px 48px 0", borderRight: i < 2 ? "1px solid var(--hairline-light)" : "none", paddingLeft: i > 0 ? 32 : 0 }}>
              <div className="eyebrow eyebrow-light" style={{ marginBottom:24 }}>{n}</div>
              <div className="display-m" style={{ marginBottom:16 }}>{t}</div>
              <p style={{ color:"var(--gray-400)", fontSize:15, lineHeight:1.65 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Visit us */}
    <section className="section section-pad bg-paper">
      <div className="container-narrow" style={{ textAlign:"center" }}>
        <div className="reveal section-label" style={{ justifyContent:"center" }}>Come See Us</div>
        <h2 className="display-l reveal" style={{ marginBottom:32 }}>1139 Ellis St.<br/><span className="serif-italic">Kelowna, BC</span></h2>
        <div className="reveal" style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", lineHeight:2.2, marginBottom:40 }}>
          Mon 10–5 &nbsp;·&nbsp; Tue–Fri 9:30–5:30 &nbsp;·&nbsp; Sat 10–4 &nbsp;·&nbsp; Sun Closed
        </div>
        <div className="reveal" style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
          <a href="https://maps.google.com/?q=1139+Ellis+St+Kelowna+BC+V1Y+1Z5" target="_blank" rel="noopener" className="btn btn-outline" data-cursor="link">Get Directions <ArrowRight /></a>
          <a href="tel:2508601968" className="btn" data-cursor="link">(250) 860-1968 <ArrowRight /></a>
        </div>
      </div>
    </section>
  </div>
);

// GROUP RIDES PAGE
const RidesPage = () => {
  const rides = [
    {
      day: "Thursday",
      name: "Thursday Night Shuttle / Pedal",
      time: "6:00 PM Sharp",
      meet: "ChainLine Cycle — 1139 Ellis St",
      desc: "Meet at the shop and we'll pick where to go. Shuttle or pedal, decided on the night. All levels welcome.",
      type: "MTB",
      calDay: "THU",
      loc: "ChainLine Cycle, 1139 Ellis St, Kelowna, BC",
    },
    {
      day: "Friday",
      name: "Friday Night Pedal Ride",
      time: "6:00 PM Sharp",
      meet: "Crawford Power Lines",
      desc: "Weekly pedal night at Crawford. Meet at the power lines and we roll from there. Good vibes, all paces.",
      type: "MTB",
      calDay: "FRI",
      loc: "Crawford Power Lines, Kelowna, BC",
    },
  ];

  return (
    <div className="page-fade" data-screen-label="P06 Rides">
      <SubHero eyebrow="Community  /  N°01" title="Ride with us." italic="Every week, all year." />
      <section className="section section-pad bg-white">
        <div className="container-wide">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 }}>
            {rides.map((r, i) => (
              <div key={i} className={"reveal reveal-d-" + (i + 1)} style={{ padding:48, border:"1px solid var(--hairline)", display:"flex", flexDirection:"column", gap:20 }}>
                <div className="eyebrow">{r.day}  ·  Weekly  ·  {r.type}</div>
                <div style={{ fontFamily:"var(--display)", fontSize:"clamp(24px,3vw,36px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", lineHeight:1.1 }}>{r.name}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2.5 2.5"/></svg>
                    {r.time}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-500)" }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1a5 5 0 00-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 00-5-5z"/><circle cx="8" cy="6" r="1.5"/></svg>
                    {r.meet}
                  </div>
                </div>
                <p style={{ fontSize:15, lineHeight:1.7, color:"var(--gray-600)", margin:0 }}>{r.desc}</p>
                <div style={{ flex:1 }} />
                <button className="btn btn-outline" data-cursor="link" onClick={() => {
                  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("ChainLine · "+r.name)}&recur=RRULE:FREQ%3DWEEKLY&details=${encodeURIComponent(r.desc+"\n\nQuestions? bikes@chainline.ca · (250) 860-1968")}&location=${encodeURIComponent(r.loc)}`;
                  window.open(url, "_blank");
                }}>Add to Calendar <ArrowRight /></button>
              </div>
            ))}
          </div>
          <div className="reveal" style={{ marginTop:64, padding:32, background:"var(--paper)", borderTop:"2px solid var(--black)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:24 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom:8 }}>Questions about the rides?</div>
              <p style={{ fontSize:14, color:"var(--gray-600)", margin:0 }}>Just come out — no signup needed. Or call us if you want to know more.</p>
            </div>
            <a href="tel:2508601968" className="btn" data-cursor="link">(250) 860-1968 <ArrowRight /></a>
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
const GiftCardsPage = () => {
  const WORKER = 'https://still-term-f1ec.taocaruso77.workers.dev';
  const FALLBACK = [
    { price:50, variantId:null }, { price:75, variantId:null },
    { price:100, variantId:null }, { price:150, variantId:null },
  ];
  const [variants,  setVariants]  = React.useState(FALLBACK);
  const [selected,  setSelected]  = React.useState(null);
  const [customAmt, setCustomAmt] = React.useState('');
  const [form, setForm]           = React.useState({ recipientEmail:'', recipientName:'', message:'', senderName:'' });
  const [qty,       setQty]       = React.useState(1);
  const [adding,    setAdding]    = React.useState(false);
  const [added,     setAdded]     = React.useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  React.useEffect(() => {
    fetch(`${WORKER}/api/gift-card-product`)
      .then(r => r.json())
      .then(d => {
        const prod = d.products?.[0];
        if (prod?.variants?.length) setVariants(prod.variants.map(v => ({ price: v.price, variantId: v.id })));
      })
      .catch(() => {});
  }, []);

  const inp = { width:'100%', padding:'12px 0', border:'none', borderBottom:'1px solid var(--hairline)', fontSize:15, fontFamily:'var(--body)', background:'transparent', outline:'none', color:'var(--black)', marginBottom:20 };

  const addToCart = async () => {
    const isCustom = selected === 'custom';
    const amount   = isCustom ? parseFloat(customAmt) : selected?.price;
    const varId    = isCustom ? null : selected?.variantId;
    if (!amount || amount < 10 || !form.recipientEmail) return;
    setAdding(true);
    try {
      if (varId && window.shopifyCart) {
        const props = {
          'Recipient Email': form.recipientEmail,
          'Recipient Name':  form.recipientName  || '',
          'Message':         form.message        || '',
          'Sender Name':     form.senderName     || '',
          '__shopify_send_gift_card_to_recipient': '1',
        };
        window.shopifyCart.add(varId, `Gift Card $${amount}`, amount * 100, null, qty, props);
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: window.shopifyCart.items || [] } }));
        setAdded(true); setTimeout(() => setAdded(false), 3000);
      } else {
        window.open('https://4nie4h-ek.myshopify.com/products/gift-card', '_blank');
      }
    } catch(e) { window.open('https://4nie4h-ek.myshopify.com/products/gift-card', '_blank'); }
    setAdding(false);
  };

  const canAdd = selected && form.recipientEmail && (selected !== 'custom' || parseFloat(customAmt) >= 10);
  const s = { padding:"20px 12px", cursor:"pointer", transition:"all .15s", fontFamily:"var(--display)", fontSize:26, fontWeight:500 };

  return (
    <div className="page-fade">
      <SubHero eyebrow="Gift Cards  /  N°01" title="The perfect gift." italic="For every rider." />
      <section className="section section-pad bg-white">
        <div className="container-narrow">
          <p style={{ fontSize:16, color:"var(--gray-500)", lineHeight:1.75, marginBottom:48, maxWidth:520 }}>
            Good for bikes, parts, accessories, and services. Redeemable in-store and online. No expiry.
          </p>

          <div className="eyebrow" style={{ marginBottom:14 }}>Choose the gift card amount</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
            {variants.map((v, i) => (
              <button key={i} data-cursor="link" onClick={() => { setSelected(v); setCustomAmt(''); }}
                style={{ ...s, border:"2px solid " + (selected === v ? "var(--black)" : "var(--hairline)"), background: selected===v?"var(--black)":"transparent", color: selected===v?"var(--white)":"var(--black)", minWidth:100 }}>
                ${v.price}
              </button>
            ))}
            <button data-cursor="link" onClick={() => setSelected('custom')}
              style={{ ...s, border:"2px solid " + (selected==='custom'?"var(--black)":"var(--hairline)"), background:selected==='custom'?"var(--black)":"transparent", color:selected==='custom'?"var(--white)":"var(--black)", fontFamily:"var(--mono)", fontSize:11, letterSpacing:".1em", textTransform:"uppercase", minWidth:100 }}>
              Your Amount
            </button>
          </div>

          {selected === 'custom' && (
            <div style={{ marginBottom:24, maxWidth:200 }}>
              <div className="eyebrow" style={{ marginBottom:8 }}>Amount (CAD)</div>
              <div style={{ display:"flex", alignItems:"center", borderBottom:"2px solid var(--black)" }}>
                <span style={{ fontFamily:"var(--display)", fontSize:24, fontWeight:500, paddingBottom:8 }}>$</span>
                <input type="number" min="10" step="5" placeholder="0" value={customAmt} onChange={e=>setCustomAmt(e.target.value)}
                  style={{ flex:1, border:"none", outline:"none", fontFamily:"var(--display)", fontSize:24, fontWeight:500, background:"transparent", paddingBottom:8, color:"var(--black)" }} />
              </div>
            </div>
          )}

          <div style={{ marginTop:40, paddingTop:32, borderTop:"1px solid var(--hairline)" }}>
            <div className="eyebrow" style={{ marginBottom:24 }}>Send to someone special</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px" }}>
              <div>
                <div className="eyebrow" style={{ marginBottom:6, fontSize:9 }}>Recipient email address *</div>
                <input type="email" placeholder="john@email.com" value={form.recipientEmail} onChange={e=>upd('recipientEmail',e.target.value)} style={inp} />
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom:6, fontSize:9 }}>Recipient name</div>
                <input type="text" placeholder="John" value={form.recipientName} onChange={e=>upd('recipientName',e.target.value)} style={inp} />
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom:6, fontSize:9 }}>Sender name</div>
                <input type="text" placeholder="Jane" value={form.senderName} onChange={e=>upd('senderName',e.target.value)} style={inp} />
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom:6, fontSize:9 }}>Personal message</div>
                <input type="text" placeholder={'"Enjoy the gift!"'} value={form.message} onChange={e=>upd('message',e.target.value)} style={inp} />
              </div>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:20, marginTop:28, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", border:"1px solid var(--hairline)" }}>
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:40,height:44,border:"none",background:"none",cursor:"pointer",fontSize:18,fontFamily:"var(--display)" }}>−</button>
              <span style={{ width:36,textAlign:"center",fontFamily:"var(--display)",fontSize:16,fontWeight:500 }}>{qty}</span>
              <button onClick={()=>setQty(q=>q+1)} style={{ width:40,height:44,border:"none",background:"none",cursor:"pointer",fontSize:18,fontFamily:"var(--display)" }}>+</button>
            </div>
            <button className="btn" data-cursor="link" disabled={!canAdd||adding} onClick={addToCart}
              style={{ flex:1, justifyContent:"center", minWidth:180, opacity: canAdd?1:0.4 }}>
              {added?"Added to Cart ✓":adding?"Adding…":"Add to Cart"} {!adding&&!added&&<ArrowRight/>}
            </button>
          </div>
          {selected && !form.recipientEmail && (
            <p style={{ marginTop:10, fontFamily:"var(--mono)", fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"var(--gray-400)" }}>
              Recipient email required
            </p>
          )}

          <div style={{ marginTop:32, padding:"18px 24px", background:"var(--paper)", borderLeft:"3px solid var(--hairline)" }}>
            <p style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:"var(--gray-500)", margin:0 }}>
              No expiry · Valid in-store and online · Custom amounts — call (250) 860-1968
            </p>
          </div>
        </div>
      </section>
      <Newsletter />
    </div>
  );
};


// PARTS & ACCESSORIES PAGE — Live Lightspeed inventory
const PartCartBtn = ({ item }) => {
  const [state, setState] = React.useState('idle'); // idle | adding | added | unavailable
  const add = async () => {
    if (state !== 'idle') return;
    setState('adding');
    const result = await window.clAddToCart(item.sku, item.name, item.price, null, item.sku);
    if (result) {
      setState('added');
      setTimeout(() => setState('idle'), 2000);
    } else {
      setState('unavailable');
      setTimeout(() => setState('idle'), 3000);
    }
  };
  if (!item.inStock && item.qty === 0) {
    return <span style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".1em", textTransform:"uppercase", color:"var(--gray-400)" }}>Out of Stock</span>;
  }
  const label = { idle: 'Add to Cart', adding: '…', added: 'Added ✓', unavailable: 'Contact Us' }[state];
  const bg    = { idle: 'var(--black)', adding: 'var(--gray-600)', added: '#1a6e3c', unavailable: 'var(--gray-500)' }[state];
  return (
    <button data-cursor="link" onClick={add}
      style={{ padding:"5px 11px", background:bg, color:"var(--white)", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".1em", textTransform:"uppercase", border:"none", cursor:"pointer", whiteSpace:"nowrap", transition:"background .2s" }}>
      {label}
    </button>
  );
};

const PART_TABS = [
  { id:'drivetrain', label:'Drivetrain', popular:['Cassette','Chain','Chainrings','Cranks','Derailleur Rear','Bottom Brackets','Shifters MTB','Cables'], depts:[
    'Cassette','Chains','Chainrings','Chain Retention','Cranks','Bottom Brackets',
    'Derailleur Front','Derailleur Rear','Deraileur Hangers',
    'Free Hub Body','Freewheel','Shifters MTB','Shifters - Road','Cables',
  ]},
  { id:'brakes', label:'Brakes', popular:['Brake pads','Brake Lever U','Brake parts','Brake adapter disc'], depts:[
    'Brake','Brake pads','Brake parts','Brake Lever U','Brake Lever V','Brake adapter disc',
  ]},
  { id:'wheels', label:'Wheels & Tires', popular:['Tires 29"','Tires 700C','Tires 26"','Tubes','Rims','Tire Sealant','Hubs','Spokes'], depts:[
    'Wheels','Wheelset (FR+RR)','Rims','Hubs','Hub Parts','Spokes','Skewers QR','Axle',
    'Tires 29"','Tires 700C','Tires 26"','Tires 27" & 26x1&1/4 etc...','Tires 24"','Tires 12, 16, 20','Tires Fatbike','Tires Tubular',
    'Tubes','Tire Sealant','Tire Protection',
  ]},
  { id:'cockpit', label:'Cockpit', popular:['Handlebar','Stem','Grips','Saddles','Seat post','Bar tape','Headsets'], depts:[
    'Handlebar','Stem','Grips','Bar tape','Aerobar','Saddles','Seat post','Headsets','Spacers','Bearings',
  ]},
  { id:'suspension', label:'Suspension', popular:['Forks','Rear Shock','Fork Oil','Fork Parts','Seals'], depts:[
    'Forks','Fork Parts','Fork Oil','Rear Shock','Seals',
  ]},
  { id:'fit', label:'Clothing & Helmets', popular:['Helmet','Gloves','Shoes Mountain','Shoes Road','Socks','Sunglasses','Clothing'], depts:[
    'Helmet','Gloves','Shoes Mountain','Shoes Road','Cleats','Clothing','Arm Warmers','Leg Warmers','Socks','Pant Clips','Sunglasses','Armour',
  ]},
  { id:'tools', label:'Tools & Bags', popular:['Pumps','Lights','Locks','Bags','Tools','Lube','Computers','Fenders'], depts:[
    'Tools','Pumps','Lube','Lights','Locks','Computers','Bags','Packs','Car Racks','Bike Racks',
    'Fenders','Kickstands','Water Bottle','Water Bottle cage','Hydration ','Bells','Mirrors','Misc. Accessories','Trainers','Basket',
  ]},
];

const DeptAccordion = ({ depts, autoOpen }) => {
  const [activeDept, setActiveDept] = React.useState(null);
  const [deptItems,  setDeptItems]  = React.useState([]);
  const [loading,    setLoading]    = React.useState(false);

  const openDept = React.useCallback(async (deptName) => {
    if (activeDept === deptName) { setActiveDept(null); setDeptItems([]); return; }
    setActiveDept(deptName);
    setLoading(true);
    const cached = (window.CL_LS?.products || []).filter(p =>
      (p.department || '').toLowerCase() === deptName.toLowerCase() && p.qty > 0
    );
    if (cached.length > 0) { setDeptItems(cached); setLoading(false); }
    else { const items = await window.lightspeedGetDept(deptName); setDeptItems(items.filter(i => i.qty > 0)); setLoading(false); }
  }, [activeDept]);

  // Auto-open when routed from nav/search
  React.useEffect(() => {
    if (!autoOpen) return;
    const match = depts.find(d => d.name.toLowerCase() === autoOpen.toLowerCase());
    if (match) openDept(match.name);
  }, [autoOpen, depts.length]);

  // Scroll active dept into view
  const activeRef = React.useRef(null);
  React.useEffect(() => {
    if (activeDept && activeRef.current) {
      setTimeout(() => activeRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 80);
    }
  }, [activeDept]);

  return (
    <div>
      {depts.map((dept, i) => (
        <div key={i} ref={activeDept === dept.name ? activeRef : null} className="reveal" style={{ borderBottom:"1px solid var(--hairline)" }}>
          <button data-cursor="link" onClick={() => openDept(dept.name)}
            style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 0", cursor:"pointer", background:"none", border:"none", textAlign:"left" }}>
            <span style={{ fontFamily:"var(--display)", fontSize:"clamp(14px,1.7vw,19px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em" }}>{dept.name}</span>
            <span style={{ fontFamily:"var(--mono)", fontSize:20, color:"var(--gray-400)", transform:activeDept===dept.name?"rotate(45deg)":"none", transition:"transform .25s", display:"inline-block", lineHeight:1 }}>+</span>
          </button>
          {activeDept === dept.name && (
            <div style={{ paddingBottom:24 }}>
              {loading ? (
                <p className="eyebrow" style={{ padding:"16px 0", color:"var(--gray-500)" }}>Loading…</p>
              ) : deptItems.length === 0 ? (
                <p style={{ fontSize:14, color:"var(--gray-500)", padding:"8px 0" }}>No items currently in stock — contact us to order.</p>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:6 }}>
                  {deptItems.map((item, j) => (
                    <div key={j} style={{ padding:"13px 15px", background:"var(--paper)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"var(--display)", fontSize:11, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.005em", lineHeight:1.35 }}>{item.name}</div>
                        {item.sku && <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--gray-400)", marginTop:2 }}>SKU {item.sku}</div>}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                        {item.price > 0 && <div style={{ fontFamily:"var(--display)", fontSize:13, fontWeight:600 }}>${item.price.toFixed(2)}</div>}
                        <PartCartBtn item={item} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const PartsPage = () => {
  const [tabId,        setTabId]        = React.useState('drivetrain');
  const [autoOpenDept, setAutoOpenDept] = React.useState(null);
  const [search,       setSearch]       = React.useState('');
  const [searchRes,    setSearchRes]    = React.useState(null);
  const [allDepts,     setAllDepts]     = React.useState([]);

  const BIKE_DEPTS = ['labour','food','shop use','consignments','bikes','bike bmx','bike cruiser','bike cross','frames','build kit','group'];

  // Read routing intent (from nav mega-menu, mobile nav, or search modal)
  React.useEffect(() => {
    const intent = window.cl?.intent;
    if (!intent) return;
    if (intent.tab) setTabId(intent.tab);
    if (intent.dept) {
      // Fuzzy-match against all known depts in case label doesn't exactly match Lightspeed name
      const allKnown = PART_TABS.flatMap(t => t.depts);
      const exact    = allKnown.find(d => d.toLowerCase() === intent.dept.toLowerCase());
      const fuzzy    = !exact && window.fuzzyMatch && allKnown.find(d => window.fuzzyMatch(intent.dept, d));
      setAutoOpenDept(exact || fuzzy || intent.dept);
    }
    window.cl.intent = null;
  }, []);

  React.useEffect(() => {
    const load = () => { if (window.CL_LS?.departments?.length > 0) setAllDepts(window.CL_LS.departments); };
    load();
    window.addEventListener('lightspeed:ready', load);
    return () => window.removeEventListener('lightspeed:ready', load);
  }, []);

  const activeTab = PART_TABS.find(t => t.id === tabId) || PART_TABS[0];

  const tabDepts = React.useMemo(() => {
    if (allDepts.length === 0) return activeTab.depts.map(n => ({ name: n }));
    return activeTab.depts
      .map(name => allDepts.find(d => d.name.trim() === name.trim()) || { name })
      .filter(Boolean);
  }, [allDepts, tabId]);

  const doSearch = (q) => {
    setSearch(q);
    if (q.length < 2) { setSearchRes(null); return; }
    const fuzzy = window.fuzzyMatch || ((n, h) => h.toLowerCase().includes(n.toLowerCase()));
    const pool  = window.CL_LS?.products || [];
    const res   = pool.filter(p =>
      !BIKE_DEPTS.some(x => (p.department||'').toLowerCase().includes(x)) &&
      fuzzy(q, (p.name||'') + ' ' + (p.department||''))
    );
    setSearchRes(res.slice(0, 80));
  };

  const tabBtnStyle = (active) => ({
    padding:"12px 20px", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase",
    border:"none", cursor:"pointer", background:"none", whiteSpace:"nowrap",
    borderBottom: active ? "2px solid var(--black)" : "2px solid transparent",
    marginBottom: -2,
    color: active ? "var(--black)" : "var(--gray-500)",
    fontWeight: active ? 600 : 400,
  });

  return (
    <div className="page-fade">
      <SubHero eyebrow="Parts & Accessories  /  N°02" title="Gear up." italic="Everything you need." />
      <section style={{ padding:"60px 0 100px", background:"var(--white)" }}>
        <div className="container-wide">

          {/* Search */}
          <div className="reveal" style={{ marginBottom:40 }}>
            <div style={{ display:"flex", borderBottom:"2px solid var(--black)", maxWidth:600 }}>
              <input type="text" placeholder="Search — cassette, brake pads, Maxxis tires…"
                value={search} onChange={e => doSearch(e.target.value)}
                style={{ flex:1, padding:"16px 0", border:"none", outline:"none", fontFamily:"var(--body)", fontSize:17, background:"transparent", color:"var(--black)" }} />
              {search
                ? <button onClick={() => { setSearch(''); setSearchRes(null); }} style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--gray-400)", letterSpacing:".12em", background:"none", border:"none", cursor:"pointer" }}>CLEAR</button>
                : <span style={{ fontFamily:"var(--mono)", fontSize:14, color:"var(--gray-400)", alignSelf:"center" }}>⌕</span>
              }
            </div>

            {searchRes && (
              <div style={{ marginTop:24 }}>
                {searchRes.length === 0 ? (
                  <p className="eyebrow" style={{ color:"var(--gray-400)", padding:"8px 0" }}>No results — try a different spelling or browse by category below</p>
                ) : (
                  <>
                    <p className="eyebrow" style={{ marginBottom:16 }}>{searchRes.length} result{searchRes.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;</p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:8 }}>
                      {searchRes.map((item, i) => (
                        <div key={i} style={{ padding:"14px 16px", border:"1px solid var(--hairline)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"var(--display)", fontSize:12, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.005em", lineHeight:1.3 }}>{item.name}</div>
                            <div className="eyebrow" style={{ marginTop:3, color:"var(--gray-500)" }}>{item.department}</div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                            {item.price > 0 && <div style={{ fontFamily:"var(--display)", fontSize:14, fontWeight:600 }}>${item.price.toFixed(2)}</div>}
                            <PartCartBtn item={item} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Category tabs */}
          <div className="reveal" style={{ overflowX:"auto", borderBottom:"2px solid var(--black)", marginBottom:32, display:"flex" }}>
            {PART_TABS.map(t => (
              <button key={t.id} data-cursor="link" onClick={() => { setTabId(t.id); setSearch(''); setSearchRes(null); }} style={tabBtnStyle(tabId === t.id)}>
                {t.label}
              </button>
            ))}
            <span className="eyebrow" style={{ marginLeft:"auto", alignSelf:"center", opacity:.4, whiteSpace:"nowrap", paddingLeft:16 }}>Live · Lightspeed</span>
          </div>

          {/* Popular quick-links for active tab */}
          {!searchRes && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:32 }}>
              {activeTab.popular.map(p => (
                <button key={p} data-cursor="link" onClick={() => {
                  // Open the exact dept accordion directly — no search needed
                  const deptName = tabDepts.find(d => d.name.toLowerCase() === p.toLowerCase())?.name || p;
                  setAutoOpenDept(deptName);
                  setSearch(''); setSearchRes(null);
                }}
                  style={{ padding:"5px 12px", border:"1px solid var(--hairline)", background:"none", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".1em", textTransform:"uppercase", cursor:"pointer", color:"var(--gray-600)" }}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Department accordion — autoOpen scrolls to and opens the target dept */}
          {!searchRes && <DeptAccordion depts={tabDepts} autoOpen={autoOpenDept} />}

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
  const PB_SHOP = "https://www.pinkbike.com/u/ChainLineCycle/buysell/";
  const PB_POST = "https://www.pinkbike.com/buysell/post/";
  const [pbListings, setPbListings] = React.useState(null);
  const [pbLoading,  setPbLoading]  = React.useState(true);

  React.useEffect(() => {
    fetch('/pinkbike.json')
      .then(r => r.json())
      .then(d => { setPbListings(Array.isArray(d) ? d : []); setPbLoading(false); })
      .catch(() => { setPbListings([]); setPbLoading(false); });
  }, []);
  return (
    <div className="page-fade">
      <SubHero eyebrow="Pinkbike  /  N°01" title="Buy. Sell. Ride." italic="Find your next bike." />
      <section style={{ padding:"60px 0 100px", background:"var(--white)" }}>
        <div className="container-wide">

          {/* Live Pinkbike listings */}
          <div className="reveal" style={{ marginBottom:64 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32 }}>
              <div className="section-label" style={{ marginBottom:0 }}>
                Live Listings{!pbLoading && pbListings?.length > 0 ? `  ·  ${pbListings.length}` : ''}
                <span style={{ marginLeft:12, opacity:.5 }}>via Pinkbike</span>
              </div>
              <a href={PB_SHOP} target="_blank" rel="noopener" data-cursor="link"
                style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-500)", display:"flex", alignItems:"center", gap:6 }}>
                View all on Pinkbike <ArrowRight size={10} />
              </a>
            </div>

            {pbLoading && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:260, borderRadius:2 }} />)}
              </div>
            )}

            {!pbLoading && pbListings?.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
                {pbListings.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener" data-cursor="link"
                    style={{ display:"flex", flexDirection:"column", border:"1px solid var(--hairline)", textDecoration:"none", color:"inherit", transition:"border-color .2s" }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='var(--black)'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--hairline)'}>
                    {l.image
                      ? <img src={l.image} alt={l.title} className="bike-img" style={{ width:"100%", aspectRatio:"4/3", objectFit:"cover" }} />
                      : <div className="ph" style={{ aspectRatio:"4/3" }} />}
                    <div style={{ padding:"16px 20px 20px", flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                      {l.condition && <span className="pill" style={{ color:"var(--gray-500)", alignSelf:"flex-start", fontSize:9 }}>{l.condition}</span>}
                      <div style={{ fontFamily:"var(--display)", fontSize:"clamp(13px,1.2vw,16px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", lineHeight:1.3, flex:1 }}>{l.title}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontFamily:"var(--display)", fontSize:20, fontWeight:500 }}>${l.price.toLocaleString()}</span>
                        <span style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-400)" }}>Pinkbike →</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {!pbLoading && (!pbListings || pbListings.length === 0) && (
              <div>
                <div style={{ padding:"48px 40px", background:"var(--paper)", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:20 }}>
                  <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)" }}>ChainLine on Pinkbike</div>
                  <div style={{ fontFamily:"var(--display)", fontSize:"clamp(22px,3vw,36px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.02em", lineHeight:1.1 }}>
                    Check our current listings
                  </div>
                  <p style={{ color:"var(--gray-500)", fontSize:15, maxWidth:480, margin:0, lineHeight:1.6 }}>
                    We list demo fleet bikes, consignment gear, and used parts on Pinkbike — Canada's largest cycling buy/sell community.
                  </p>
                  <a href={PB_SHOP} target="_blank" rel="noopener" className="btn" data-cursor="link" style={{ marginTop:8 }}>
                    View All Listings on Pinkbike <ArrowRight />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="reveal" style={{ textAlign:"center" }}>
            <p style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:24 }}>
              Looking to consign your bike through the shop? Email us.
            </p>
            <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
              <a href={PB_POST} target="_blank" rel="noopener" className="btn" data-cursor="link">
                Post on Pinkbike <ArrowRight />
              </a>
              <a href="mailto:bikes@chainline.ca?subject=Consignment Enquiry" className="btn btn-outline" data-cursor="link">
                Consign with Us <ArrowRight />
              </a>
            </div>
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

Object.assign(window, { ShopPage, ServicesPage, BookPage, AboutPage, RidesPage, TrailsPage, ContactPage, GiftCardsPage, PartsPage, ClassifiedsPage, BrandPage, BikeCardLarge, SubHero, SHOP_BIKES, TermsPage, PrivacyPage, PART_TABS });
