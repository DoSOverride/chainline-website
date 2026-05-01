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
    { label: 'Brand',      value: b.brand || b.vendor || '' },
    { label: 'Type',       value: b.type || '' },
    { label: 'Wheel Size', value: b.wheelSize || ws },
    b.parsedSize  ? { label: 'Frame Size', value: b.parsedSize  } : null,
    b.parsedColor ? { label: 'Colour',     value: b.parsedColor } : null,
    { label: 'Warranty',   value: '2-year frame & fork, 1-year components' },
  ].filter(Boolean);
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

// ── useBikeVariants: find all Lightspeed sizes/colours for any bike ──────────
// Works for SHOP_BIKES (static) and live Lightspeed bikes alike.
// Matches using significant tokens from the model name, respecting brand prefix.
const useBikeVariants = (bike) => {
  const [variants, setVariants] = React.useState(bike?.variants || []);
  const [varLoading, setVarLoading] = React.useState(true);

  React.useEffect(() => {
    if (!bike) { setVarLoading(false); return; }
    if ((bike.variants || []).length > 1) {
      setVariants(bike.variants); setVarLoading(false); return; // already hydrated
    }

    const IMPORTANT_SHORT = new Set(['jr','sx','gx','cx','rs','sl','29','27','26','20','16']);
    const STOP = new Set(['the','and','for','with','ride','comp','elite','race','pro','base','alloy','carbon','plus','size']);

    const buildVariants = () => {
      const lsBikes = window.CL_LS?.bikes || [];
      if (!lsBikes.length) return false;

      const rawName = (bike.name || bike.title || '').toLowerCase();
      const brand   = (bike.brand || '').toLowerCase();

      // Tokens from model name — short important ones included, stop words excluded
      const tokens = rawName.split(/\s+/).filter(w => {
        const wl = w.toLowerCase().replace(/[^a-z0-9]/g,'');
        return (wl.length >= 3 || IMPORTANT_SHORT.has(wl)) && !STOP.has(wl);
      });

      const matches = lsBikes.filter(ls => {
        const n = (ls.name || '').toLowerCase();
        // Brand must appear at start of Lightspeed name
        if (brand && !n.startsWith(brand + ' ') && !n.startsWith(brand + '-')) return false;
        // All model tokens must appear in the Lightspeed name
        return tokens.every(t => n.includes(t));
      });

      if (!matches.length) { setVarLoading(false); return true; }

      const SPEC = new Set(['carbon','alloy','aluminum','steel','custom','frame','frameset',
        'sport','elite','comp','pro','trail','enduro','eagle','deore','shimano','sram',
        'gx','sx','nx','xt','xo','di2','axs','grx','ride','coil','v2','v3','gen',
        'single','crown','boost']);

      const extractColor = (lsName, size) => {
        let s = lsName;
        if (brand) s = s.replace(new RegExp('^' + brand + '\\s*', 'i'), '').trim();
        tokens.forEach(t => { s = s.replace(new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\b','gi'),' '); });
        s = s.replace(/\b[\d]+\/[\d]+\b/g,' ').replace(/\bv\d+\b/gi,' ').replace(/\b\d{4}\b/g,' ');
        s = s.replace(new RegExp('\\b(' + [...SPEC].join('|') + ')\\b','gi'),' ');
        if (size) {
          const sizeAlts = { S:'small',M:'medium',L:'large',XL:'x-large|xlarge|xl',XS:'x-small|xsmall|xs',XXL:'xx-large|xxlarge|xxl' };
          const pat = (sizeAlts[size] || size) + '|' + size.toLowerCase();
          try { s = s.replace(new RegExp('\\b(' + pat + ')\\b','gi'),' '); } catch(e) {}
        }
        const words = s.split(/\s+/).filter(w => w.length >= 2 && /^[A-Za-z]/.test(w));
        return words.length ? words.join(' ').trim() : null;
      };

      setVariants(matches.map(ls => {
        const parsed = window.parseNameParts ? window.parseNameParts(ls.name) : { size: null, color: null };
        const size  = parsed.size  || null;
        const color = extractColor(ls.name, size) || parsed.color || null;
        const wheel = ls.wheelSize || window.guessWheelSize?.(ls.name) || null;
        return { sku: ls.sku, name: ls.name, price: ls.price, size, color,
          wheel, inStock: ls.inStock, qty: ls.qty || 0, img: ls.img || null };
      }));
      setVarLoading(false);
      return true;
    };

    setVariants(bike?.variants || []);
    if (!buildVariants()) {
      // Bikes not loaded yet — wait for the ready signal
      const onReady = () => buildVariants();
      window.addEventListener('lightspeed:ready', onReady);
      window.lightspeedReady?.then(onReady).catch(() => setVarLoading(false));
      return () => window.removeEventListener('lightspeed:ready', onReady);
    }
  }, [bike?.handle, bike?.name, bike?.brand]);

  return { variants, varLoading };
};

// ── Bike Detail Page ──────────────────────────────────────────
const BikePage = ({ bike, onBack, onCart }) => {
  const { variants, varLoading } = useBikeVariants(bike);

  const inStockV  = variants.filter(v => v.inStock);
  const hasWheels = [...new Set(variants.map(v=>v.wheel).filter(Boolean))].length > 1;
  const hasColors = [...new Set(variants.map(v=>v.color).filter(Boolean))].length > 1;
  const hasSizes  = [...new Set(variants.map(v=>v.size).filter(Boolean))].length > 1;

  const [selWheel, setWheel] = React.useState(null);
  const [selColor, setColor] = React.useState(null);
  const [selSize,  setSize]  = React.useState(null);
  const [defaultSet, setDefaultSet] = React.useState(false);
  const [adding, setAdding]  = React.useState(false);
  const [added,  setAdded]   = React.useState(false);
  const [enriched, setEnriched] = React.useState(null);
  const [cartQty, setCartQty] = React.useState(0);

  // Reset everything when the bike changes
  React.useEffect(() => {
    setDefaultSet(false);
    setWheel(bike?.wheelSize || bike?.parsedSize && null || null);
    setColor(bike?.parsedColor || null);
    setSize(bike?.parsedSize  || null);
    setEnriched(null);
  }, [bike?.handle]);

  // Set default selections once variants arrive
  React.useEffect(() => {
    if (defaultSet || variants.length === 0) return;
    const d = inStockV[0] || variants[0];
    setWheel(d?.wheel || null);
    setColor(d?.color || null);
    setSize(d?.size   || null);
    setDefaultSet(true);
  }, [variants, defaultSet]);

  // Enrich only if bike-data.js doesn't already have a description
  React.useEffect(() => {
    const b = bike || {};
    if (!b.handle) return;
    const existing = getBikeData(b);
    if (existing.description && existing.description.length > 40) return; // already have it
    const cached = window.CL_LS?.enrichCache?.[b.handle];
    if (cached?.description) { setEnriched(cached); return; }
    window.enrichBike?.(b).then(d => { if (d?.description) setEnriched(d); });
  }, [bike?.handle]);

  const b = bike || {};
  const staticData = getBikeData(b);
  const data  = enriched?.description
    ? { ...staticData, description: enriched.description, specs: { ...(enriched.specs || {}), ...(staticData.specs || {}) } }
    : staticData;
  // specs must always be an array of {label, value}
  const specsRaw = data.specs && Object.keys(data.specs).length > 1 ? data.specs : null;
  const specs = specsRaw
    ? [...Object.entries(specsRaw).filter(([k,v])=>k&&v).slice(0,8).map(([label,value])=>({label,value})),
       { label:'Bike Type', value: b.type||'' },
       { label:'Warranty', value:'2-year frame & fork, 1-year components' }]
    : getBikeSpecs(b);
  const desc  = data.description || getBikeDescription(b);

  const defV = inStockV[0] || variants[0];
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

  const selInStock  = selected ? selected.inStock : b.inStock !== false;
  const selPrice    = selected?.price || b.price || 0;
  const selSku      = selected?.sku || b.sku;
  const availableQty = selected?.qty ?? b?.qty ?? 1;

  // Track how many of this bike are in the cart
  React.useEffect(() => {
    const update = () => setCartQty(window.shopifyCart?.qtyBySku(selSku) || 0);
    update();
    window.addEventListener('cart:updated', update);
    return () => window.removeEventListener('cart:updated', update);
  }, [selSku]);

  const atMaxQty = availableQty > 0 && cartQty >= availableQty;

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
        window.dispatchEvent(new CustomEvent('cart:open'));
        setTimeout(() => setAdded(false), 2000);
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
              ? <img src={allImgs[activeImg]} alt={[(b.brand || b.vendor || ''), (b.name || b.title)].filter(Boolean).join(' ')}
                  className="bike-img" loading="lazy" decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8%', mixBlendMode: 'multiply' }}
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
                  <img src={img} alt="" className="bike-img" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} onError={e => e.target.style.display='none'} />
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
          <div className="reveal" style={{ marginBottom:24 }}>
            {/* Loading state */}
            {varLoading && (
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                {[76,92,68].map((w,i) => <div key={i} className="ph" style={{ height:36, width:w, borderRadius:2 }} />)}
              </div>
            )}
            {/* Single variant — show as info tags */}
            {!varLoading && variants.length === 1 && (variants[0].wheel || variants[0].size || variants[0].color) && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
                {variants[0].wheel && <span style={{ padding:'7px 14px', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', border:'1.5px solid var(--hairline)', color:'var(--gray-500)' }}>{variants[0].wheel}</span>}
                {variants[0].size  && <span style={{ padding:'7px 14px', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', border:'1.5px solid var(--black)', background:'var(--black)', color:'var(--white)' }}>{variants[0].size}</span>}
                {variants[0].color && <span style={{ padding:'7px 14px', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', border:'1.5px solid var(--hairline)', color:'var(--gray-600)' }}>{variants[0].color}</span>}
              </div>
            )}
            {!varLoading && <>
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
            </>}
          </div>

          {desc ? (
            <p className="reveal" style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--gray-600)', marginBottom: 40, maxWidth: 480 }}>{desc}</p>
          ) : (
            <div className="reveal" style={{ marginBottom:40, maxWidth:480 }}>
              {[1,0.8,0.6].map((w,i) => <div key={i} className="ph" style={{ height:14, width:`${w*100}%`, marginBottom:10, borderRadius:2 }} />)}
            </div>
          )}

          <div className="reveal" style={{ display: 'flex', gap: 12, marginBottom: 48, flexWrap: 'wrap' }}>
            <button className="btn" data-cursor="link" onClick={handleAdd}
              disabled={adding || atMaxQty}
              style={{ flex: '1 1 200px', justifyContent: 'center', opacity: atMaxQty ? 0.5 : 1 }}>
              {atMaxQty ? `In Cart${availableQty > 1 ? ` (${cartQty}/${availableQty})` : ''}` : added ? 'Added ✓' : adding ? 'Adding…' : 'Add to Cart'}
              {!adding && !added && !atMaxQty && <ArrowRight />}
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
  { brand:"Marin", name:"Bobcat Trail 4 27.5", handle:"marin-bobcat-trail-4-27-5", type:"Mountain", tags:"Mountain Bike, 27.5\" wheels", price:1000, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-bobcat-trail-4-275.jpg" },
  { brand:"Marin", name:"Bobcat Trail 3 29",   handle:"marin-bobcat-trail-3-29",   type:"Mountain", tags:"Mountain Bike, 29\" wheels",  price:960,  img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-bobcat-trail-3-29.jpg" },
  { brand:"Marin", name:"Bobcat Trail 4 29",   handle:"marin-bobcat-trail-4-29",   type:"Mountain", tags:"Mountain Bike, 29\" wheels",  price:1060, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-bobcat-trail-4-275.jpg" },
  { brand:"Marin", name:"Bobcat Trail 5 29",   handle:"marin-bobcat-trail-5-29",   type:"Mountain", tags:"Mountain Bike, 29\" wheels",  price:1360, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-bobcat-trail-5-29.jpg" },
  { brand:"Marin", name:"Bolinas Ridge 1 27.5",handle:"marin-bolinas-ridge-1-27-5",type:"Mountain", tags:"Mountain Bike, 27.5\" wheels", price:760,  img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-bolinas-ridge-1-275.jpg" },
  { brand:"Marin", name:"Bolinas Ridge 1 29",  handle:"marin-bolinas-ridge-1-29",  type:"Mountain", tags:"Mountain Bike, 29\" wheels",  price:760,  img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-bolinas-ridge-1-275.jpg" },
  { brand:"Marin", name:"Bolinas Ridge 2 29",  handle:"marin-bolinas-ridge-2-29",  type:"Mountain", tags:"Mountain Bike, 29\" wheels",  price:800,  img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-bolinas-ridge-2-29.jpg" },
  { brand:"Marin", name:"Wildcat Trail 1 27.5",handle:"marin-wildcat-trail-1-27-5",type:"Mountain", tags:"Mountain Bike, 27.5\" wheels, Women's", price:860, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-wildcat-trail-1-275.png" },
  { brand:"Marin", name:"Pine Mountain 1 29",  handle:"marin-pine-mountain-1-29",  type:"Mountain", tags:"Mountain Bike, 29\" wheels",  price:1960, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-pine-mountain-1-29.jpg" },
  { brand:"Transition", name:"Sentinel",             handle:"transition-sentinel",             type:"Mountain", tags:"Mountain Bike, Full Suspension", price:8900, img:"https://www.transitionbikes.com/images/Sentinel_MainPage_HannahBlur.jpg" },
  { brand:"Transition", name:"Spire Carbon Eagle 90",handle:"transition-spire-carbon-eagle-90",type:"Mountain", tags:"Mountain Bike, Carbon, Full Suspension", price:9700, img:"https://www.transitionbikes.com/WebStoreImages/SB-Spire-AlloyE70-UltraViolet.avif" },
  { brand:"Pivot", name:"Switchblade Ride Eagle 70/90", handle:"pivot-switchblade-ride-eagle-70-90", type:"Mountain", tags:"Mountain Bike, Full Suspension", price:8000, img:"https://cms.pivotcycles.com/wp-content/uploads/2025/11/switchbladev3-highlight-right-aurhm3my.jpg" },
  { brand:"Surly", name:"Sorceress",    handle:"surly-sorceress",    type:"Mountain", tags:"Mountain Bike, Fat Bike",  price:3400, img:"https://surlybikes.com/cdn/shop/files/surly-sorceress-eagle-90-bike-purple-BK01561.jpg?v=1774378038&width=1946" },
  { brand:"Marin", name:"Gestalt 2",   handle:"marin-gestalt-2",    type:"Gravel",   tags:"Gravel Bike, 700c",        price:2000, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-gestalt-2.jpg" },
  { brand:"Marin", name:"Gestalt X10", handle:"marin-gestalt-x10",  type:"Gravel",   tags:"Gravel Bike, 700c",        price:1400, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-gestalt-x10.jpg" },
  { brand:"Marin", name:"Nicasio 2",   handle:"marin-nicasio-2",    type:"Gravel",   tags:"Gravel Bike, 700c",        price:2300, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-nicasio-2.jpg" },
  { brand:"Marin", name:"Presidio 3",  handle:"marin-presidio-3",   type:"Gravel",   tags:"Gravel Bike, 700c",        price:1470, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-presidio-3.jpg" },
  { brand:"Marin", name:"Four Corners 1",handle:"marin-four-corners-1",type:"Gravel",tags:"Touring Bike, Gravel",     price:1600, img:"https://cdn.shopify.com/s/files/1/0931/9455/1645/files/MRN_27_FC_1_GREEN_PROFILE_2000PX.png?v=1773143826" },
  { brand:"Surly", name:"Bridge Club", handle:"surly-bridge-club",  type:"Gravel",   tags:"Gravel Bike, Adventure",   price:1850, img:"https://surlybikes.com/cdn/shop/files/surly-bridge-club-bike-lingering-cranberry-BK01508.jpg?v=1773411087&width=1946" },
  { brand:"Marin", name:"Stinson E",    handle:"marin-stinson-e",    type:"E-Bike",  tags:"Electric Bike, City",      price:2100, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-stinson-e.jpg" },
  { brand:"Marin", name:"Stinson E ST", handle:"marin-stinson-e-st", type:"E-Bike",  tags:"Electric Bike, Step-Through", price:2100, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-stinson-e-st.jpg" },
  { brand:"Pivot",      name:"Shuttle AM Ride Eagle 70/90",handle:"pivot-shuttle-am-ride-eagle-70-90",  type:"E-Bike", tags:"Electric Bike, Full Suspension", price:11500, img:"https://cms.pivotcycles.com/wp-content/uploads/2025/10/shuttleam-photo-gallery-beauty-4-msswiet3.jpg" },
  { brand:"Transition", name:"Regulator CX Eagle 90",      handle:"transition-regulator-cx-eagle-90",  type:"E-Bike", tags:"Electric Bike, Full Suspension", price:13000, img:"https://www.transitionbikes.com/images/C1-2026-Regulator-CX.avif" },
  { brand:"Marin", name:"Fairfax 1",       handle:"marin-fairfax-1",      type:"Commuter", tags:"Dual-Sport, Commuter",    price:700,  img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-fairfax-1.jpg" },
  { brand:"Marin", name:"Fairfax 2",       handle:"marin-fairfax-2",      type:"Commuter", tags:"Dual-Sport, Commuter",    price:960,  img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-fairfax-2.jpg" },
  { brand:"Marin", name:"San Anselmo DS2", handle:"marin-san-anselmo-ds2",type:"Commuter", tags:"Dual-Sport, Women's",     price:960,  img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-san-anselmo-ds2.jpg" },
  { brand:"Marin", name:"Kentfield ST 1",  handle:"marin-kentfield-st-1", type:"Commuter", tags:"City, Comfort",           price:670,  img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-kentfield-st-1.png" },
  { brand:"Marin", name:"Kentfield ST 2",  handle:"marin-kentfield-st-2", type:"Commuter", tags:"City, Comfort",           price:900,  img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-kentfield-st-2.png" },
  { brand:"Marin", name:"Stinson 1 27.5",    handle:"marin-stinson-1-27-5",    type:"Comfort", tags:"Comfort, Cruiser, 27.5\"", price:860, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-stinson-1-27-5.png" },
  { brand:"Marin", name:"Stinson 1 LS 27.5", handle:"marin-stinson-1-ls-27-5", type:"Comfort", tags:"Comfort, Step-Through",   price:800, img:"https://cdn.shopify.com/s/files/1/0931/9455/1645/files/2025_MARIN_STINSON_LS_1_TEAL_SIDE.png?v=1753799841" },
  { brand:"Marin", name:"Stinson 2 LS 27.5", handle:"marin-stinson-2-ls-27-5", type:"Comfort", tags:"Comfort, Step-Through",   price:900, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-stinson-2-ls-27-5.png" },
  { brand:"Marin", name:"Bayview Trail",  handle:"marin-bayview-trail",  type:"Kids", tags:"Kids Bike, 24\"", price:600, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-bayview-trail.jpg" },
  { brand:"Marin", name:"Donky Jr",       handle:"marin-donky-jr",       type:"Kids", tags:"Kids Bike, 24\"", price:430, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-donky-jr.png" },
  { brand:"Marin", name:"Rift Zone Jr",   handle:"marin-rift-zone-jr",   type:"Kids", tags:"Kids Bike, Mountain, 24\"", price:2200, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-rift-zone-jr.png" },
  // ── Marin full-suspension & trail hardtails ────────────────────
  { brand:"Marin", name:"Rift Zone 2",    handle:"marin-rift-zone-2",    type:"Mountain", tags:"Mountain Bike, Full Suspension, 29\"", price:1975, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-rift-zone-2.png" },
  { brand:"Marin", name:"San Quentin 1",  handle:"marin-san-quentin-1",  type:"Mountain", tags:"Mountain Bike, 27.5\"",               price:1350, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-san-quentin-1.png" },
  { brand:"Marin", name:"San Quentin 2",  handle:"marin-san-quentin-2",  type:"Mountain", tags:"Mountain Bike, 27.5\"",               price:1800, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-san-quentin-2.png" },
  // ── Transition full lineup ─────────────────────────────────────
  { brand:"Transition", name:"Spur",         handle:"transition-spur",         type:"Mountain", tags:"Mountain Bike, Cross-Country, 29\"", price:6000, img:"https://www.transitionbikes.com/images/FC_Spur.jpg" },
  { brand:"Transition", name:"Smuggler",     handle:"transition-smuggler",     type:"Mountain", tags:"Mountain Bike, Trail/Enduro, 29\"",  price:6500, img:"https://www.transitionbikes.com/images/FC_Smug.jpg" },
  { brand:"Transition", name:"Bottlerocket", handle:"transition-bottlerocket", type:"Mountain", tags:"Mountain Bike, Freeride",             price:6500, img:"https://www.transitionbikes.com/images/M2-BR.jpg" },
  { brand:"Transition", name:"PBJ",          handle:"transition-pbj",          type:"Mountain", tags:"Dirt Jump, Park, Slopestyle",         price:1900, img:"https://www.transitionbikes.com/images/FC-PBJ.jpg" },
  // ── Surly full lineup ──────────────────────────────────────────
  { brand:"Surly", name:"Karate Monkey",    handle:"surly-karate-monkey",    type:"Mountain", tags:"Mountain Bike, Hardtail, 29\"",     price:2800, img:"https://surlybikes.com/cdn/shop/files/surly-karate-monkey-front-suspension-bike-blue-BK00263-2000px-sq.jpg?v=1742063134&width=1946" },
  { brand:"Surly", name:"Ice Cream Truck",  handle:"surly-ice-cream-truck",  type:"Mountain", tags:"Fat Bike, Snow, Sand",              price:3500, img:"https://surlybikes.com/cdn/shop/files/surly-ice-cream-truck-bike-yellow-BK00596-2000px-sq.jpg?v=1741976875&width=1946" },
  // ── Knolly ────────────────────────────────────────────────────
  { brand:"Knolly", name:"Fugitive",  handle:"knolly-fugitive",  type:"Mountain", tags:"Mountain Bike, Enduro, Full Suspension", price:4550, img:"https://cdn.shopify.com/s/files/1/0714/3611/files/FUGITIVE_EAGLE_90_FOX_-_RAW_LOUVRED.png?v=1759774351" },
  // ── Salsa ─────────────────────────────────────────────────────
  { brand:"Salsa", name:"Timberjack GX Eagle",  handle:"salsa-timberjack-gx-eagle",  type:"Mountain", tags:"Mountain Bike, Hardtail, 29\"",          price:3500, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/salsa-timberjack-gx-eagle.png" },
  { brand:"Salsa", name:"Spearfish C GX Eagle", handle:"salsa-spearfish-c-gx-eagle", type:"Mountain", tags:"Mountain Bike, Full Suspension, 29\"",    price:5800, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/salsa-spearfish-c-gx-eagle.png" },
  { brand:"Salsa", name:"Timberjack SX Eagle",  handle:"salsa-timberjack-sx-eagle",  type:"Mountain", tags:"Mountain Bike, Hardtail, 29\"",          price:2800, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/salsa-timberjack-sx-eagle.png" },
  { brand:"Salsa", name:"Journeyman Sora 700c", handle:"salsa-journeyman-sora",      type:"Gravel",   tags:"Adventure Bike, Gravel, 700c",           price:1350, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/salsa-journeyman-sora.png" },
  { brand:"Salsa", name:"Cutthroat GRX",        handle:"salsa-cutthroat-grx",        type:"Gravel",   tags:"Gravel Bike, Adventure, Drop Bar",       price:4500, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/salsa-cutthroat-grx.png" },
  { brand:"Salsa", name:"Warbird GRX 600",      handle:"salsa-warbird-grx-600",      type:"Gravel",   tags:"Gravel Bike, Race, 700c",                price:3200, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/salsa-warbird-grx-600.png" },
  // ── Bianchi ───────────────────────────────────────────────────
  { brand:"Bianchi", name:"Oltre RC",        handle:"bianchi-oltre-rc",        type:"Road",   tags:"Road Bike, Race, Carbon",                    price:10500, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/bianchi-oltre-rc.jpg" },
  { brand:"Bianchi", name:"Aria",            handle:"bianchi-aria",            type:"Road",   tags:"Road Bike, Endurance, Carbon",               price:3800, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/bianchi-aria.jpg" },
  { brand:"Bianchi", name:"Impulso Pro",     handle:"bianchi-impulso-pro",     type:"Road",   tags:"Road Bike, Endurance, Aluminum",             price:2500, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/bianchi-impulso-pro.jpg" },
  { brand:"Bianchi", name:"Grok S GRX",      handle:"bianchi-grok-s-grx",      type:"Gravel", tags:"Gravel Bike, Celeste, 700c",                 price:2800, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/bianchi-grok-s-grx.jpg" },
  { brand:"Bianchi", name:"E-SUV Comp",      handle:"bianchi-e-suv-comp",      type:"E-Bike", tags:"Electric Bike, Mountain, Full Suspension",   price:5200, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/bianchi-e-suv-comp.jpg" },
  // ── Moots ─────────────────────────────────────────────────────
  { brand:"Moots", name:"Routt RSL GRX",     handle:"moots-routt-rsl-grx",     type:"Gravel",   tags:"Gravel Bike, Titanium, 700c",              price:9500, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/moots-routt-rsl-grx.jpg" },
  { brand:"Moots", name:"Baxter GRX",        handle:"moots-baxter-grx",        type:"Gravel",   tags:"Gravel Bike, Titanium, Adventure",         price:7500, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/moots-baxter-grx.png" },
  { brand:"Moots", name:"Highline GX Eagle", handle:"moots-highline-gx-eagle", type:"Mountain", tags:"Mountain Bike, Hardtail, Titanium, 29\"", price:6500, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/moots-highline-gx-eagle.jpg" },
  { brand:"Moots", name:"Ybb SL GX Eagle",   handle:"moots-ybb-sl-gx-eagle",   type:"Mountain", tags:"Mountain Bike, Full Suspension, Titanium", price:8500, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/moots-ybb-sl-gx-eagle.jpg" },
  // ── Revel ─────────────────────────────────────────────────────
  { brand:"Revel", name:"Ranger GX Eagle",   handle:"revel-ranger-gx-eagle",   type:"Mountain", tags:"Mountain Bike, Trail, Full Suspension, 29\"", price:5800, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/revel-ranger-gx-eagle.jpg" },
  { brand:"Revel", name:"Rascal GX Eagle",   handle:"revel-rascal-gx-eagle",   type:"Mountain", tags:"Mountain Bike, Trail, Full Suspension",        price:5200, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/revel-rascal-gx-eagle.png" },
  { brand:"Revel", name:"Rail GX Eagle",     handle:"revel-rail-gx-eagle",     type:"Mountain", tags:"Mountain Bike, Enduro, Full Suspension, 29\"", price:6200, img:"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/revel-rail-gx-eagle.jpg" },
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

    // Pre-assign each live item to its BEST matching group (most specific / highest word count match)
    // This prevents "Stinson 1" from stealing "Stinson 1 LS" variants due to short model words
    const wordIn = (w, str) => new RegExp('(?:^|\\s)' + w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(?:\\s|$)').test(str);
    const bestGroup = new Map(); // sku → { key, score }
    Object.entries(groups).forEach(([key, group]) => {
      const sb = _norm(group.brand || '');
      group._entries.forEach(s => {
        const sWords = _norm(s.name).split(' ').filter(Boolean);
        liveProducts.forEach(l => {
          if (_norm((l.name||'').split(' ')[0]) !== sb) return;
          const ln = _norm(l.name);
          if (!sWords.every(w => wordIn(w, ln))) return;
          const score = sWords.length;
          const prev = bestGroup.get(l.sku);
          if (!prev || score > prev.score) bestGroup.set(l.sku, { key, score });
        });
      });
    });

    return Object.values(groups).map(group => {
      const sb = _norm(group.brand || '');
      const key = `${group.brand}||${group.name}`;
      // Only collect live items whose best match is this group
      const seen = new Set();
      const allMatches = [];
      liveProducts.forEach(l => {
        if (_norm((l.name||'').split(' ')[0]) !== sb) return;
        const claim = bestGroup.get(l.sku);
        if (claim?.key !== key) return;
        if (!seen.has(l.sku)) { seen.add(l.sku); allMatches.push(l); }
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
  const TYPE_TABS = ["All","Mountain","Gravel","Road","E-Bike","Commuter","Comfort","Kids"];

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
            <button key={t} className={"shop-filter-tab" + (type === t ? " active" : "")} data-cursor="link" onClick={() => setType(t)} style={tabStyle(type === t)}>{t}</button>
          ))}
        </div>
        {/* Row 3: brand chips */}
        <div className="container-wide" style={{ display:"flex", alignItems:"center", paddingTop:"2px", paddingBottom:"10px", overflowX:"auto", scrollbarWidth:"none" }}>
          {ALL_BRANDS.map(br => {
            const cnt = allProducts.filter(b => (b.brand || b.vendor || '') === br && b.inStock !== false).length;
            if (cnt === 0) return null;
            const active = brand === br;
            const inactiveColor = "var(--gray-600)";
            return (
              <button key={br} className={"shop-filter-tab" + (active ? " active" : "")} data-cursor="link"
                onClick={() => { setBrand(active ? "All" : br); setType("All"); }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--black)"; e.currentTarget.style.borderBottomColor = "var(--gray-400)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = active ? "var(--black)" : inactiveColor; e.currentTarget.style.borderBottomColor = active ? "var(--black)" : "transparent"; }}
                style={{ ...tabStyle(active), color: active ? "var(--black)" : inactiveColor, display:"flex", alignItems:"center", gap:5 }}>
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

const BikeCardLarge = React.memo(({ b, idx }) => {
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
    padding:"6px 12px", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".1em", textTransform:"uppercase",
    border:"1px solid", cursor:"pointer", borderRadius:2, background:"none",
    borderColor: active ? "var(--black)" : "var(--hairline)",
    color: active ? "var(--black)" : avail ? "var(--gray-600)" : "var(--gray-400)",
    opacity: avail ? 1 : 0.45,
  });
  const chipClass = (active, avail) => "shop-chip" + (active ? " active" : avail ? "" : " unavail");

  const handleAdd = async (e) => {
    e.preventDefault(); e.stopPropagation();
    const sku = selected?.sku || b.sku;
    if (!inStock || !sku) return;
    setAdding(true);
    try {
      const variantDesc = selected ? [selected.wheel, selected.color, selected.size].filter(Boolean).join(' · ') : null;
      const result = await window.clAddToCart(sku, name, price, img, sku, variantDesc || null);
      if (result) { setAdded(true); setTimeout(() => setAdded(false), 2000); window.dispatchEvent(new CustomEvent('cart:open')); }
    } catch(err) { console.warn(err); }
    setAdding(false);
  };

  const goToBike = () => window.cl.go("bike", { bike: b });
  const labelStyle = { fontFamily:"var(--mono)", fontSize:9, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)", marginBottom:5 };

  return (
    <div style={{ cursor:"pointer" }} onClick={goToBike}>
      {/* Image */}
      <div className="shop-bike-card-img" style={{ aspectRatio:"4/5", marginBottom:14, position:"relative", background:"var(--paper)", overflow:"hidden" }}>
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
                    <button key={w} className={chipClass(selWheel===w, avail)} style={chipStyle(selWheel===w, avail)} onClick={() => {
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
                    <button key={c} className={chipClass(selColor===c, avail)} style={chipStyle(selColor===c, avail)} onClick={() => {
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
                    <button key={sz} className={chipClass(selSize===sz, avail)} style={chipStyle(selSize===sz, avail)} onClick={() => setSize(sz)}>{sz}</button>
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
});

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
            <span>Flat Fix  ·  Same Day</span>
            <span>E-Bike Flat Fix  ·  1–2 Days</span>
            <span>Tune Up  ·  1–2 Weeks</span>
            <span>Overhaul  ·  Sometimes Sooner</span>
          </div>
        </div>
      </section>
    </div>
  );
};

// BOOK PAGE
const BookPage = () => {
  const [data,      setData]      = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting,setSubmitting]= React.useState(false);
  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));

  const SERVICES = [
    "Tune-Up", "Full Suspension Tune-Up", "E-Bike Tune-Up", "Complete Overhaul",
    "Fork Seal Service", "Shock Air Can Service", "Dropper Service", "Brake Bleed",
    "Cable Package", "Wheel Build", "Tubeless Set Up", "Flat Fix", "Not Sure / Assessment",
  ];

  const WORKER = "https://still-term-f1ec.taocaruso77.workers.dev";
  const inp = { width:"100%", padding:"12px 0", border:"none", borderBottom:"1px solid var(--hairline)", fontSize:16, fontFamily:"var(--body)", background:"transparent", outline:"none", color:"var(--black)" };

  const canSubmit = data.name && data.phone && data.email && data.service && data.issue;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name",    data.name);
      fd.append("phone",   data.phone);
      fd.append("email",   data.email);
      fd.append("bike",    `${data.bikeBrand||''} ${data.bikeModel||''} ${data.bikeYear||''}`.trim());
      fd.append("service", data.service);
      fd.append("date",    data.date || 'Flexible');
      fd.append("issue",   data.issue);
      if (data.photoFile) fd.append("photo", data.photoFile);
      const res  = await fetch(`${WORKER}/api/book`, { method:"POST", body: fd });
      const json = await res.json();
      if (json.ok) { setSubmitted(true); return; }
      throw new Error("error");
    } catch {
      const body = encodeURIComponent(`ChainLine — Service Booking\n\nName: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email}\nBike: ${data.bikeBrand||''} ${data.bikeModel||''}\nService: ${data.service}\nDate: ${data.date||'Flexible'}\nNotes: ${data.issue}`);
      window.location.href = `mailto:bikes@chainline.ca?subject=${encodeURIComponent('Service Booking — '+(data.name||'Customer'))}&body=${body}`;
      setSubmitted(true);
    } finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div className="page-fade">
      <SubHero eyebrow="Booking  /  N°01" title="Request sent." italic="We'll be in touch." />
      <section className="section section-pad bg-white">
        <div className="container-narrow">
          <div style={{ padding:"32px", background:"var(--paper)", borderLeft:"3px solid var(--black)", marginBottom:32 }}>
            <p style={{ fontSize:15, lineHeight:1.8, color:"var(--gray-600)", margin:0 }}>
              Your booking request has been sent to <strong>bikes@chainline.ca</strong>. We'll call or email within 24 hours to confirm your appointment.<br/><br/>
              Questions? <a href="tel:2508601968" style={{ fontWeight:600 }}>(250) 860-1968</a> — Mon 10–5, Tue–Fri 9:30–5:30, Sat 10–4.
            </p>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button className="btn btn-outline" onClick={() => { setData({}); setSubmitted(false); }}>Book another</button>
            <button className="btn" onClick={() => window.cl.go("home")}>Back home <ArrowRight /></button>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="page-fade" data-screen-label="P04 Book">
      <SubHero eyebrow="Booking  /  N°01" title="Book a service." italic="Drop it off, we'll handle the rest." />
      <section className="section section-pad bg-white">
        <div className="container-narrow">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px" }}>

            {/* Left col — contact + bike */}
            <div>
              <div className="eyebrow" style={{ marginBottom:24 }}>Your details</div>
              <div style={{ marginBottom:20 }}>
                <div className="eyebrow" style={{ marginBottom:8, fontSize:9 }}>Name *</div>
                <input type="text" placeholder="Jane Smith" value={data.name||""} onChange={e=>upd("name",e.target.value)} style={inp} />
              </div>
              <div style={{ marginBottom:20 }}>
                <div className="eyebrow" style={{ marginBottom:8, fontSize:9 }}>Phone *</div>
                <input type="tel" placeholder="(250) 555-0100" value={data.phone||""} onChange={e=>upd("phone",e.target.value)} style={inp} />
              </div>
              <div style={{ marginBottom:40 }}>
                <div className="eyebrow" style={{ marginBottom:8, fontSize:9 }}>Email *</div>
                <input type="email" placeholder="jane@example.com" value={data.email||""} onChange={e=>upd("email",e.target.value)} style={inp} />
              </div>

              <div className="eyebrow" style={{ marginBottom:24 }}>Your bike</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                <div style={{ marginBottom:20 }}>
                  <div className="eyebrow" style={{ marginBottom:8, fontSize:9 }}>Brand</div>
                  <input type="text" placeholder="Transition" value={data.bikeBrand||""} onChange={e=>upd("bikeBrand",e.target.value)} style={inp} />
                </div>
                <div style={{ marginBottom:20 }}>
                  <div className="eyebrow" style={{ marginBottom:8, fontSize:9 }}>Model</div>
                  <input type="text" placeholder="Sentinel" value={data.bikeModel||""} onChange={e=>upd("bikeModel",e.target.value)} style={inp} />
                </div>
              </div>
              <div style={{ marginBottom:20 }}>
                <div className="eyebrow" style={{ marginBottom:8, fontSize:9 }}>Year</div>
                <input type="text" placeholder="2024" value={data.bikeYear||""} onChange={e=>upd("bikeYear",e.target.value)} style={inp} />
              </div>
              <div style={{ marginBottom:40 }}>
                <div className="eyebrow" style={{ marginBottom:8, fontSize:9 }}>Preferred drop-off date</div>
                <input type="text" placeholder="e.g. May 10, or Flexible" value={data.date||""} onChange={e=>upd("date",e.target.value)} style={inp} />
              </div>
            </div>

            {/* Right col — service + notes */}
            <div>
              <div className="eyebrow" style={{ marginBottom:24 }}>Service needed *</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:32 }}>
                {SERVICES.map(s => (
                  <button key={s} data-cursor="link" onClick={() => upd("service", s)}
                    style={{ padding:"13px 18px", border:"1.5px solid "+(data.service===s?"var(--black)":"var(--hairline)"), background:data.service===s?"var(--black)":"transparent", color:data.service===s?"var(--white)":"var(--black)", textAlign:"left", fontFamily:"var(--display)", fontSize:14, fontWeight:500, textTransform:"uppercase", cursor:"pointer", transition:"all .15s" }}>
                    {s}
                  </button>
                ))}
              </div>

              <div style={{ marginBottom:24 }}>
                <div className="eyebrow" style={{ marginBottom:8, fontSize:9 }}>Describe the issue *</div>
                <textarea rows={5} placeholder="What's going on? e.g. front brake spongy, rear derailleur skipping, full tune-up needed…" value={data.issue||""} onChange={e=>upd("issue",e.target.value)}
                  style={{ ...inp, borderBottom:"none", border:"1px solid var(--hairline)", padding:14, resize:"vertical", fontSize:14 }} />
              </div>

              <div style={{ marginBottom:24 }}>
                <div className="eyebrow" style={{ marginBottom:8, fontSize:9 }}>Photo of your bike (optional)</div>
                <label style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 18px", border:"1.5px dashed var(--hairline)", cursor:"pointer", color:"var(--gray-500)", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  {data.photoName || "Upload or take a photo"}
                  <input type="file" accept="image/*" capture="environment" style={{ display:"none" }}
                    onChange={e => { const f=e.target.files[0]; if(f){upd("photoName",f.name);upd("photoFile",f);} }} />
                </label>
              </div>

              <button className="btn" data-cursor="link" disabled={!canSubmit || submitting} onClick={submit}
                style={{ width:"100%", justifyContent:"center" }}>
                {submitting ? "Sending…" : "Send Booking Request"} {!submitting && <ArrowRight />}
              </button>
              <p style={{ marginTop:12, fontSize:12, color:"var(--gray-400)", fontFamily:"var(--mono)", letterSpacing:".08em", textTransform:"uppercase" }}>
                Sends to bikes@chainline.ca · We confirm within 24 hrs
              </p>
            </div>
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
    { q: "How long does a tune-up take?", a: "Most tune-ups take 1–2 weeks depending on the season. Flat fixes, wheel trues and brake bleeds are usually same-day. We'll call or text you when it's ready." },
    { q: "Do you service e-bikes?", a: "Yes. Our techs are certified on Bosch, Shimano STEPS, and Brose systems. We also service most e-MTB suspension." },
    { q: "Do you do warranty work?", a: "Yes — we handle warranty claims for all brands we carry. There may be a service charge of around $45 plus any shipping costs depending on the manufacturer. Contact us and we'll sort it out." },
    { q: "Do you take walk-ins?", a: "We'll always look at your bike. For full services, booking online guarantees a slot and helps us get you on the schedule faster." },
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

    {/* Shop interior */}
    <section className="section bg-white" style={{ padding:0 }}>
      <img src="shop-interior.jpg" alt="ChainLine Cycle — 1139 Ellis St, Kelowna"
        loading="lazy" decoding="async" style={{ width:"100%", height:"clamp(280px,45vw,600px)", objectFit:"cover", objectPosition:"center 40%", display:"block" }} />
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
      day: "Thursday", dow: 4,
      name: "Thursday Night Shuttle / Pedal",
      time: "6:00 PM Sharp",
      meet: "ChainLine Cycle — 1139 Ellis St",
      desc: "Meet at the shop and we'll pick where to go. Shuttle or pedal, decided on the night. All levels welcome.",
      type: "MTB", meta: "Varies", level: "All levels",
      loc: "ChainLine Cycle, 1139 Ellis St, Kelowna, BC",
    },
    {
      day: "Friday", dow: 5,
      name: "Friday Night Pedal Ride",
      time: "6:00 PM Sharp",
      meet: "Crawford Power Lines",
      desc: "Weekly pedal night at Crawford. Meet at the power lines and we roll from there. Good vibes, all paces.",
      type: "MTB", meta: "~20km · Trail", level: "All paces",
      loc: "Crawford Power Lines, Kelowna, BC",
    },
  ];

  return (
    <div className="page-fade" data-screen-label="P06 Rides">
      <SubHero eyebrow="Community  /  N°01" title="Ride with us." italic="Every week, all year." />
      <section className="section bg-white" style={{ padding:0 }}>
        <img src="https://still-term-f1ec.taocaruso77.workers.dev/r2/lifestyle/rides-group.jpg" alt="ChainLine group ride — Kelowna"
          loading="lazy" decoding="async" style={{ width:"100%", height:"clamp(220px,35vw,480px)", objectFit:"cover", objectPosition:"center 30%", display:"block" }} />
      </section>
      <section className="section section-pad bg-white">
        <div className="container-wide">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:28 }}>
            {rides.map((r, i) => (
              <div key={i} className={"reveal reveal-d-" + (i + 1)} style={{ padding:40, border:"1px solid var(--hairline)", display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div className="eyebrow">{r.day}  ·  {r.type}</div>
                  <span className="pill">{r.level}</span>
                </div>
                <div style={{ fontFamily:"var(--display)", fontSize:"clamp(20px,2.5vw,28px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", lineHeight:1.1 }}>{r.name}</div>
                <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)" }}>{r.meta}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".12em", textTransform:"uppercase" }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2.5 2.5"/></svg>
                    {r.time}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-500)" }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1a5 5 0 00-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 00-5-5z"/><circle cx="8" cy="6" r="1.5"/></svg>
                    {r.meet}
                  </div>
                </div>
                <p style={{ fontSize:14, lineHeight:1.7, color:"var(--gray-600)", margin:0, flex:1 }}>{r.desc}</p>
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
  const R2 = "https://still-term-f1ec.taocaruso77.workers.dev/r2";
  const featured = [
    { name:"Knox Mountain Park", dots:3, km:"20+",  gain:"550",   type:"MTB · Singletrack",   season:"Spring–Fall",  tf:"https://www.trailforks.com/region/knox-mountain-park/",        img:`${R2}/lifestyle/trail-knox.jpg`,   note:"Kelowna's backyard. Antenna, Doc Willoughby, Dirty Bastard — classics all. Best urban trail system in the Interior." },
    { name:"Smith Creek",         dots:4, km:"30+",  gain:"700",   type:"MTB · All-Mountain",  season:"Year-round",   tf:"https://www.trailforks.com/region/smith-creek/",               img:`${R2}/lifestyle/trail-action.jpg`, note:"28 trails in West Kelowna with more being added every season. Feel The Love is worth the drive alone." },
    { name:"Crawford",            dots:3, km:"100+", gain:"600",   type:"MTB · XC to Tech",    season:"Spring–Fall",  tf:"https://www.trailforks.com/region/crawford-trails/",           img:`${R2}/lifestyle/trail-forest.jpg`, note:"Where we run our Friday night rides. Over 100 trails from green to double black. Never gets old." },
    { name:"Rose Valley",         dots:2, km:"15",   gain:"320",   type:"MTB · Family",        season:"Year-round",   tf:"https://www.trailforks.com/region/rose-valley/",               img:`${R2}/lifestyle/trail-pines.jpg`,  note:"West Kelowna's most accessible network. Excellent for newer riders, and a perfect shake-down loop." },
    { name:"Angel Springs",       dots:4, km:"8",    gain:"400",   type:"MTB · Singletrack",   season:"Spring–Fall",  tf:"https://www.trailforks.com/trails/angel-springs-trail/",       img:`${R2}/lifestyle/trail-forest.jpg`, note:"Built by high school students, restored by the MTB community. Cedar forest, a natural spring, and proper trail." },
    { name:"Gillard",             dots:4, km:"40+",  gain:"800",   type:"MTB · Enduro",        season:"Spring–Fall",  tf:"https://www.trailforks.com/region/gillard/",                   img:`${R2}/lifestyle/trail-pines.jpg`,  note:"Kelowna's grassroots enduro home. 63 trails, Dr. No rated 4.7/5. Less crowded, more raw." },
  ];

  const more = [
    { name:"Okanagan Mountain Park",    type:"MTB · Epic",       dots:5, tf:"https://www.trailforks.com/region/okanagan-mountain-park/" },
    { name:"Black Mountain",             type:"MTB · Advanced",   dots:5, tf:"https://www.trailforks.com/region/black-mountain-regional-park-45252/" },
    { name:"Kelowna Bike Park",          type:"Skills Park",      dots:4, tf:"https://www.trailforks.com/skillpark/kelowna-mountain-bike-skills-park/" },
    { name:"Bear Creek Provincial Park", type:"MTB · Mixed",      dots:2, tf:"https://www.trailforks.com/region/bear-creek-provincial-park-63783/" },
    { name:"KVR / Myra Canyon",          type:"Rail Trail",       dots:1, tf:"https://www.trailforks.com/trails/kvr-tct-myra-canyon/" },
    { name:"McDougall Rim",              type:"Hike · Gravel",    dots:3, tf:"https://www.trailforks.com/region/kelowna/" },
    { name:"Silver Star (Vernon)",       type:"Resort · XC/DH",  dots:4, tf:"https://www.trailforks.com/region/silver-star-bike-park-1081/" },
    { name:"Penticton / Skaha Bluffs",   type:"MTB · Enduro",    dots:4, tf:"https://www.trailforks.com/region/penticton/" },
  ];

  const Dots = ({ n }) => <span className="pill-dots">{[1,2,3,4,5].map(i => <i key={i} className={i <= n ? "on" : ""} />)}</span>;

  return (
    <div className="page-fade" data-screen-label="P07 Trails">
      <SubHero eyebrow="Field Notes  /  N°01" title="Know your backyard." italic="Curated by riders." />

      {/* ── 6 featured trail areas ── */}
      <section className="section section-pad bg-white">
        <div className="container-wide">
          <div className="section-label" style={{ marginBottom:48 }}>Kelowna &amp; Area Trails</div>
          <div className="trails-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:40 }}>
            {featured.map((t, i) => (
              <a key={i} href={t.tf} target="_blank" rel="noopener" data-cursor="link"
                className={"reveal reveal-d-" + (i % 3 + 1)}
                style={{ display:"block", textDecoration:"none", color:"inherit" }}>
                <div style={{ aspectRatio:"4/3", marginBottom:18, overflow:"hidden", position:"relative" }}>
                  <img src={t.img} alt={t.name}
                    loading="lazy" decoding="async"
                    style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", display:"block", transition:"transform .5s ease" }}
                    onMouseEnter={e => e.currentTarget.style.transform="scale(1.04)"}
                    onMouseLeave={e => e.currentTarget.style.transform="scale(1)"} />
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 55%)" }} />
                </div>
                <div className="display-s" style={{ marginBottom:10 }}>{t.name}</div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <Dots n={t.dots} />
                  <span className="eyebrow">{t.dots <= 2 ? "Beginner" : t.dots <= 3 ? "Intermediate" : t.dots <= 4 ? "Advanced" : "Expert"}</span>
                </div>
                <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:10 }}>
                  {t.km} km · {t.gain} m · {t.type} · {t.season}
                </div>
                <p className="serif-italic" style={{ fontSize:15, lineHeight:1.6, color:"var(--gray-600)", marginBottom:14 }}>"{t.note}"</p>
                <span style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)", display:"inline-flex", alignItems:"center", gap:6 }}>
                  View on Trailforks <ArrowRight size={9} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── More in the Okanagan ── */}
      <section className="section section-pad bg-paper">
        <div className="container-wide">
          <div className="reveal" style={{ marginBottom:48 }}>
            <div className="section-label">More in the Okanagan</div>
            <h3 className="display-l">Bigger<br/><span className="serif-italic">backyard.</span></h3>
          </div>
          <div style={{ borderTop:"1px solid var(--hairline)" }}>
            {more.map((t, i) => (
              <a key={i} href={t.tf} target="_blank" rel="noopener" data-cursor="link"
                className="reveal"
                style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", alignItems:"center", gap:24, padding:"18px 0", borderBottom:"1px solid var(--hairline)", textDecoration:"none", color:"inherit" }}>
                <div style={{ fontFamily:"var(--display)", fontSize:"clamp(16px,1.8vw,22px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em" }}>{t.name}</div>
                <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-500)", whiteSpace:"nowrap" }}>{t.type}</div>
                <Dots n={t.dots} />
                <span style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-400)", display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>Trailforks <ArrowRight size={9} /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Conditions (link to live Trailforks) ── */}
      <section className="section section-pad bg-black">
        <div className="container-wide">
          <div className="reveal" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:40, flexWrap:"wrap", gap:16 }}>
            <div>
              <div className="section-label" style={{ color:"var(--gray-300)" }}>Trail Conditions</div>
              <h3 className="display-l">Check before<br/><span className="serif-italic">you ride.</span></h3>
            </div>
            <a href="https://www.trailforks.com/region/kelowna/status/" target="_blank" rel="noopener"
              className="btn btn-outline-light" data-cursor="link">Live Status on Trailforks <ArrowRight /></a>
          </div>
          <div style={{ borderTop:"1px solid var(--hairline-light)" }}>
            {[
              ["Knox Mountain",  "https://www.trailforks.com/region/knox-mountain-park/status/"],
              ["Smith Creek",    "https://www.trailforks.com/region/smith-creek/status/"],
              ["Crawford",       "https://www.trailforks.com/region/crawford-trails/status/"],
              ["Rose Valley",    "https://www.trailforks.com/region/rose-valley/status/"],
              ["Angel Springs",  "https://www.trailforks.com/trails/angel-springs-trail/"],
              ["Gillard",        "https://www.trailforks.com/region/gillard/status/"],
            ].map(([n, url]) => (
              <a key={n} href={url} target="_blank" rel="noopener" data-cursor="link" className="reveal"
                style={{ display:"grid", gridTemplateColumns:"1fr auto", padding:"18px 0", borderBottom:"1px solid var(--hairline-light)", alignItems:"center", textDecoration:"none", color:"inherit" }}>
                <div className="display-s">{n}</div>
                <span className="eyebrow eyebrow-light" style={{ display:"flex", alignItems:"center", gap:6 }}>Check Trailforks <ArrowRight size={9} /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-pad-sm bg-paper" style={{ padding:"60px 0" }}>
        <div className="container-wide">
          <div className="reveal" style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
            <a href="https://www.trailforks.com/region/central-okanagan/" target="_blank" rel="noopener" className="btn btn-outline" data-cursor="link">Central Okanagan on Trailforks <ArrowRight /></a>
            <a href="https://www.trailforks.com/region/kelowna/status/" target="_blank" rel="noopener" className="btn btn-outline" data-cursor="link">Live Trail Status <ArrowRight /></a>
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
      <div style={{ minHeight: 600, position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
        <img src="https://still-term-f1ec.taocaruso77.workers.dev/r2/shop/shop-interior.jpg" alt="ChainLine Cycle — Kelowna"
          loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", opacity: 0.65 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.7) 100%)" }} />
        <div style={{ position: "absolute", left: 48, right: 48, bottom: 48, color: "#fafafa" }}>
          <h1 className="display-xl" style={{ marginBottom: 32, color: "#fafafa" }}>Come<br/><span className="serif-italic">find us.</span></h1>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>
            <div><div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".18em", color:"rgba(255,255,255,0.4)", marginBottom:6, textTransform:"uppercase" }}>Address</div><a href="https://maps.google.com/?q=1139+Ellis+St+Kelowna+BC+V1Y+1Z5" target="_blank" rel="noopener" style={{ color: "inherit" }}>1139 Ellis St<br/>Kelowna, BC V1Y 1Z5</a></div>
            <div><div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".18em", color:"rgba(255,255,255,0.4)", marginBottom:6, textTransform:"uppercase" }}>Hours</div>Mon 10–5<br/>Tue–Fri 9:30–5:30<br/>Sat 10–4 · Sun closed</div>
            <div><div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".18em", color:"rgba(255,255,255,0.4)", marginBottom:6, textTransform:"uppercase" }}>Phone</div><a href="tel:2508601968" style={{ color:"inherit" }}>(250) 860-1968</a></div>
            <div><div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".18em", color:"rgba(255,255,255,0.4)", marginBottom:6, textTransform:"uppercase" }}>Email</div><a href="mailto:bikes@chainline.ca" style={{ color:"inherit" }}>bikes@chainline.ca</a></div>
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
  const WORKER   = 'https://still-term-f1ec.taocaruso77.workers.dev';
  const PRESETS  = [50, 75, 100, 150];
  // variantMap: price → Shopify variantId, populated from API
  const [variantMap, setVariantMap] = React.useState({});
  const [selectedAmt, setSelectedAmt] = React.useState(null);
  const [customAmt,   setCustomAmt]   = React.useState('');
  const [recipientEmail, setRecipientEmail] = React.useState('');
  const [added, setAdded] = React.useState(false);

  React.useEffect(() => {
    fetch(`${WORKER}/api/gift-card-product`)
      .then(r => r.json())
      .then(d => {
        const variants = d.products?.[0]?.variants || [];
        const map = {};
        variants.forEach(v => { map[Number(v.price)] = v.id; });
        setVariantMap(map);
      })
      .catch(() => {});
  }, []);

  const amount     = selectedAmt === 'custom' ? parseFloat(customAmt) || 0 : (selectedAmt || 0);
  const varId      = variantMap[amount] || null;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);
  const canAdd     = amount >= 10 && !!varId && validEmail;

  const addToCart = () => {
    if (!canAdd) return;
    window.shopifyCart.add(varId, `ChainLine Gift Card — $${amount}`, amount, null, 1, `For: ${recipientEmail}`);
    window._gcRecipientEmail = recipientEmail;
    window.dispatchEvent(new CustomEvent('cart:open'));
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  const btnStyle = { padding:"20px 20px", cursor:"pointer", transition:"all .15s", fontFamily:"var(--display)", fontSize:26, fontWeight:500, minWidth:100 };

  return (
    <div className="page-fade">
      <SubHero eyebrow="Gift Cards  /  N°01" title="The perfect gift." italic="For every rider." />
      <section className="section section-pad bg-white">
        <div className="container-narrow">
          <p style={{ fontSize:16, color:"var(--gray-500)", lineHeight:1.75, marginBottom:48, maxWidth:520 }}>
            Good for bikes, parts, accessories, and services. Valid in-store and online. No expiry.
          </p>

          <div className="eyebrow" style={{ marginBottom:14 }}>Choose amount</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:24 }}>
            {PRESETS.map(p => {
              const active = selectedAmt === p;
              return (
                <button key={p} data-cursor="link" onClick={() => { setSelectedAmt(p); setCustomAmt(''); }}
                  style={{ ...btnStyle, border:"2px solid "+(active?"var(--black)":"var(--hairline)"), background:active?"var(--black)":"transparent", color:active?"var(--white)":"var(--black)" }}>
                  ${p}
                </button>
              );
            })}
            <button data-cursor="link" onClick={() => setSelectedAmt('custom')}
              style={{ ...btnStyle, border:"2px solid "+(selectedAmt==='custom'?"var(--black)":"var(--hairline)"), background:selectedAmt==='custom'?"var(--black)":"transparent", color:selectedAmt==='custom'?"var(--white)":"var(--black)", fontFamily:"var(--mono)", fontSize:11, letterSpacing:".1em", textTransform:"uppercase" }}>
              Custom
            </button>
          </div>

          {selectedAmt === 'custom' && (
            <div style={{ marginBottom:32, maxWidth:200 }}>
              <div style={{ display:"flex", alignItems:"center", borderBottom:"2px solid var(--black)" }}>
                <span style={{ fontFamily:"var(--display)", fontSize:28, fontWeight:500, paddingBottom:8 }}>$</span>
                <input type="number" min="10" step="5" placeholder="0" value={customAmt}
                  onChange={e => setCustomAmt(e.target.value)} autoFocus
                  style={{ flex:1, border:"none", outline:"none", fontFamily:"var(--display)", fontSize:28, fontWeight:500, background:"transparent", paddingBottom:8, color:"var(--black)" }} />
              </div>
              {amount > 0 && !varId && (
                <p style={{ marginTop:8, fontFamily:"var(--mono)", fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"var(--gray-400)" }}>
                  Custom amounts — call (250) 860-1968
                </p>
              )}
            </div>
          )}

          <div style={{ marginTop:32, marginBottom:8, maxWidth:420 }}>
            <div className="eyebrow" style={{ marginBottom:10 }}>Recipient email <span style={{ color:"var(--gray-400)" }}>*</span></div>
            <input
              type="email"
              placeholder="Send gift card code to..."
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              style={{ width:"100%", padding:"14px 0", border:"none", borderBottom:"2px solid "+(validEmail?"var(--black)":recipientEmail.length>3?"#e05c3a":"var(--hairline)"), fontSize:16, fontFamily:"var(--body)", background:"transparent", outline:"none", color:"var(--black)", transition:"border-color .2s" }}
            />
            {recipientEmail.length > 3 && !validEmail && (
              <div style={{ marginTop:8, fontFamily:"var(--mono)", fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"#e05c3a" }}>
                Double-check the email — the gift card code gets sent here
              </div>
            )}
            {validEmail && (
              <div style={{ marginTop:8, fontFamily:"var(--mono)", fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"var(--stock-green)" }}>
                ✓ Code will be sent to {recipientEmail}
              </div>
            )}
          </div>

          <button className="btn" data-cursor="link"
            disabled={!canAdd} onClick={addToCart}
            style={{ marginTop:16, minWidth:220, justifyContent:"center", opacity: canAdd ? 1 : 0.4 }}>
            {added ? "Added to Cart ✓" : <>Add to Cart <ArrowRight /></>}
          </button>

          <div style={{ marginTop:40, padding:"18px 24px", background:"var(--paper)", borderLeft:"3px solid var(--hairline)" }}>
            <p style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:"var(--gray-500)", margin:0, lineHeight:1.9 }}>
              No expiry · Valid in-store + online · Gift card code emailed after checkout · Enter recipient details at checkout
            </p>
          </div>
        </div>
      </section>
      <Newsletter />
    </div>
  );
};


// PARTS & ACCESSORIES PAGE — Live Lightspeed inventory
const PartCartBtn = ({ item, compact }) => {
  const [loading, setLoading] = React.useState(false);
  const [cartQty, setCartQty] = React.useState(() => window.shopifyCart?.qtyBySku(item.sku) || 0);

  React.useEffect(() => {
    const update = () => setCartQty(window.shopifyCart?.qtyBySku(item.sku) || 0);
    window.addEventListener('cart:updated', update);
    return () => window.removeEventListener('cart:updated', update);
  }, [item.sku]);

  if (!item.inStock && item.qty === 0) {
    return <span style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".08em", textTransform:"uppercase", color:"var(--gray-400)" }}>Out of stock</span>;
  }

  const maxQty = item.qty > 0 ? item.qty : 99;
  const atMax  = cartQty >= maxQty;

  const addOne = async () => {
    if (loading || atMax) return;
    setLoading(true);
    await window.clAddToCart(item.sku, item.name, item.price, null, item.sku);
    setLoading(false);
  };

  const removeOne = () => window.shopifyCart?.decrementBySku(item.sku);

  if (cartQty > 0) {
    const btnBase = { height:26, fontFamily:"var(--mono)", fontSize:12, border:"1px solid var(--hairline)", cursor:"pointer", flexShrink:0, transition:"background .15s" };
    return (
      <div style={{ display:"flex", alignItems:"center" }}>
        <button onClick={removeOne} className="part-cart-stepper-remove" style={{ ...btnBase, width:26, background:"var(--paper)", color:"var(--black)", borderRight:"none" }}>−</button>
        <span style={{ width:28, height:26, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".06em", border:"1px solid var(--hairline)", borderLeft:"none", borderRight:"none", color:"var(--black)" }}>{cartQty}</span>
        <button onClick={addOne} disabled={atMax || loading} className="part-cart-stepper-add" style={{ ...btnBase, width:26, background: atMax ? "var(--paper)" : "var(--black)", color: atMax ? "var(--gray-400)" : "var(--white)", borderLeft:"none", cursor: atMax ? "default" : "pointer" }}>{loading ? "…" : "+"}</button>
      </div>
    );
  }

  return (
    <button className="part-cart-btn" data-cursor="link" onClick={addOne}
      style={{ padding: compact ? "6px 10px" : "7px 14px", background:"var(--black)", color:"#fff", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".08em", textTransform:"uppercase", border:"none", cursor:"pointer", whiteSpace:"nowrap", transition:"background .2s", flexShrink:0 }}>
      {loading ? "…" : compact ? "+" : "Add to Cart"}
    </button>
  );
};

// ── Parts & Accessories — full rebuild ──────────────────────────────────────
// Architecture: load all inventory once → filter client-side → instant nav

const R2 = "https://still-term-f1ec.taocaruso77.workers.dev/r2";
const PART_TABS = [
  { id:'drivetrain',  label:'Drivetrain',         emoji:'⚙️',  img: `${R2}/parts/drivetrain-hero.jpg`,
    sub: "Cassettes, chains, derailleurs, cranks, shifters",
    depts:['Cassette','Chains','Chainrings','Chain Retention','Cranks','Bottom Brackets','Derailleur Front','Derailleur Rear','Deraileur Hangers','Free Hub Body','Freewheel','Shifters MTB','Shifters - Road','Cables'] },
  { id:'brakes',      label:'Brakes',             emoji:'🔴',  img: `${R2}/parts/brakes-hero.jpg`,
    sub: "Disc brakes, brake pads, levers, cables",
    depts:['Brake','Brake pads','Brake parts','Brake Lever U','Brake Lever V','Brake adapter disc'] },
  { id:'wheels',      label:'Wheels & Tires',     emoji:'⭕',  img: `${R2}/shop/interior-tires.jpg`,
    sub: "Tires, tubes, wheels, rims, hubs, sealant",
    depts:['Wheels','Wheelset (FR+RR)','Rims','Hubs','Hub Parts','Spokes','Skewers QR','Axle','Tires 29"','Tires 700C','Tires 26"','Tires 27" & 26x1&1/4 etc...','Tires 24"','Tires 12, 16, 20','Tires Fatbike','Tires Tubular','Tubes','Tire Sealant','Tire Protection'] },
  { id:'cockpit',     label:'Cockpit',            emoji:'🎛️',  img: `${R2}/shop/interior-parts.jpg`,
    sub: "Handlebars, stems, grips, saddles, seatposts, headsets",
    depts:['Handlebar','Stem','Grips','Bar tape','Aerobar','Saddles','Seat post','Headsets','Spacers','Bearings'] },
  { id:'suspension',  label:'Suspension',         emoji:'🔩',  img: `${R2}/lifestyle/trail-knox.jpg`,
    sub: "Forks, rear shocks, oil, seals",
    depts:['Forks','Fork Parts','Fork Oil','Rear Shock','Seals'] },
  { id:'fit',        label:'Clothing & Gear',    emoji:'🪖', img:`${R2}/shop/interior-surly.jpg`,
    sub:"Helmets, gloves, shoes, clothing, armour, sunglasses",
    depts:['Helmet','Gloves','Armour','Sunglasses','Shoes Mountain','Shoes Road','Cleats','Clothing','Arm Warmers','Leg Warmers','Socks','Pant Clips'] },
  { id:'tools',      label:'Tools & Maintenance',emoji:'🔧', img:`${R2}/parts/tools-hero.jpg`,
    sub:"Pumps, lube, degreasers, workshop tools",
    depts:['Tools','Pumps','Lube','Degreasers','Trainers'] },
  { id:'bags',       label:'Bags & Hydration',   emoji:'🎒', img:`${R2}/lifestyle/rides-social.jpg`,
    sub:"Packs, bags, hydration, water bottles",
    depts:['Bags','Packs','Hydration','Water Bottle','Water Bottle cage','Basket'] },
  { id:'lights',     label:'Lights & Computers', emoji:'💡', img:`${R2}/lifestyle/trail-forest.jpg`,
    sub:"Bike lights, cycling computers, GPS",
    depts:['Lights','Computers'] },
  { id:'locks',      label:'Locks',              emoji:'🔒', img:`${R2}/shop/shop-interior.jpg`,
    sub:"Cable locks, U-locks, chain locks",
    depts:['Locks'] },
  { id:'racks',      label:'Racks & Fenders',    emoji:'🚲', img:`${R2}/shop/shop-interior.jpg`,
    sub:"Bike racks, fenders, kickstands, bells, mirrors",
    depts:['Bike Racks','Car Racks','Fenders','Kickstands','Mirrors','Bells','Misc. Accessories'] },
];

const BIKE_EXCLUDE = ['labour','food','shop use','consignments','bikes','bike bmx','bike cruiser','bike cross','frames','build kit','group'];
const isBikeDept = (dept) => BIKE_EXCLUDE.some(x => (dept||'').toLowerCase().includes(x));

// Dept-level emoji — more specific than tab emoji
const DEPT_EMOJI = {
  // Drivetrain
  'cassette':'🎡','chains':'🔗','chain retention':'🔗','chainrings':'⚙️',
  'cranks':'🔧','bottom brackets':'⚙️','derailleur front':'⚙️','derailleur rear':'⚙️',
  'deraileur hangers':'🔩','free hub body':'⚙️','freewheel':'🎡',
  'shifters mtb':'🎛️','shifters - road':'🎛️','cables':'〰️',
  // Brakes
  'brake':'🛑','brake pads':'🛑','brake parts':'🛑',
  'brake lever u':'🛑','brake lever v':'🛑','brake adapter disc':'🔩',
  // Wheels & Tires
  'wheels':'⭕','wheelset (fr+rr)':'⭕','rims':'⭕','hubs':'⭕','hub parts':'🔩',
  'spokes':'📐','skewers qr':'🔩','axle':'🔩',
  'tires 29"':'🔘','tires 700c':'🔘','tires 26"':'🔘',
  'tires 27" & 26x1&1/4 etc...':'🔘','tires 24"':'🔘',
  'tires 12, 16, 20':'🔘','tires fatbike':'🔘','tires tubular':'🔘',
  'tubes':'🫧','tire sealant':'🫙','tire protection':'🛡️',
  // Cockpit
  'handlebar':'🎯','stem':'🔩','grips':'✊','bar tape':'🌀',
  'aerobar':'✈️','saddles':'💺','seat post':'💺',
  'headsets':'🔵','spacers':'🔩','bearings':'⚪',
  // Suspension
  'forks':'🔩','fork parts':'🔩','fork oil':'🛢️','rear shock':'🌀','seals':'🫙',
  // Clothing & Helmets
  'helmet':'⛑️','gloves':'🧤','shoes mountain':'👟','shoes road':'👟',
  'cleats':'🔩','clothing':'👕','arm warmers':'🧣','leg warmers':'🧣',
  'socks':'🧦','pant clips':'📎','sunglasses':'🕶️','armour':'🛡️',
  // Tools & Maintenance
  'tools':'🔧','pumps':'💨','lube':'🫙','trainers':'🚲',
  // Accessories
  'lights':'💡','locks':'🔒','computers':'📡','bags':'🎒','packs':'🎒',
  'car racks':'🚗','bike racks':'🚗','fenders':'🛡️','kickstands':'📍',
  'water bottle':'🍶','water bottle cage':'🫙','hydration ':'💧',
  'bells':'🔔','mirrors':'🪞','misc. accessories':'📦','basket':'🧺',
};
const deptEmoji = (dept, fallback) => DEPT_EMOJI[(dept||'').toLowerCase().trim()] || fallback;

// Dept name → tab ID for categorising items
const deptToTabId = (() => {
  const map = {};
  PART_TABS.forEach(t => t.depts.forEach(d => { map[d.toLowerCase().trim()] = t.id; }));
  return (dept) => map[(dept||'').toLowerCase().trim()] || null;
})();

// Smart item categoriser: tries exact match first, then fuzzy
const categoriseItem = (item) => {
  const dept = (item.department || '').toLowerCase().trim();
  const exact = deptToTabId(dept);
  if (exact) return exact;
  // Try partial match
  for (const t of PART_TABS) {
    if (t.depts.some(d => dept.includes(d.toLowerCase()) || d.toLowerCase().includes(dept))) return t.id;
  }
  return null;
};

// ── useTabInventory hook ──────────────────────────────────────────────────
// Per-tab loading: fetches only in-stock items for the active tab, caches per tab
const useTabInventory = (tabId) => {
  const cached = window.CL_LS?.tabCache;
  const [items,   setItems]   = React.useState(() => cached && tabId in cached ? cached[tabId] : []);
  const [loading, setLoading] = React.useState(!(cached && tabId in cached));

  React.useEffect(() => {
    const c = window.CL_LS?.tabCache;
    if (c && tabId in c) { setItems(c[tabId]); setLoading(false); return; }
    setLoading(true);
    setItems([]);
    window.lightspeedGetTab(tabId).then(result => {
      setItems(result);
      setLoading(false);
    });
  }, [tabId]);

  return { items, loading };
};

// ── PartRow ───────────────────────────────────────────────────────────────
const PartRow = React.memo(({ item }) => {
  const price = item.price > 0 ? `$${item.price % 1 === 0 ? item.price : item.price.toFixed(2)}` : null;
  const lowStock = item.qty > 0 && item.qty <= 5;
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:"0 16px", alignItems:"center",
      padding:"13px 20px", borderBottom:"1px solid var(--hairline)",
      background:"var(--white)", transition:"background .12s" }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--paper)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--white)'}>
      {/* Name + meta */}
      <div style={{ minWidth:0 }}>
        <div style={{ fontFamily:"var(--display)", fontSize:14, fontWeight:500, textTransform:"uppercase",
          letterSpacing:"-.01em", lineHeight:1.25, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          color:"var(--black)" }}>{item.name}</div>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:3 }}>
          {item.sku && <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--gray-400)", letterSpacing:".08em", textTransform:"uppercase" }}>{item.sku}</span>}
          {lowStock && <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"#c2410c", letterSpacing:".08em", textTransform:"uppercase", fontWeight:600 }}>Only {item.qty} left</span>}
        </div>
      </div>
      {/* Price + cart */}
      <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        {price && <span style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:600, color:"var(--black)", whiteSpace:"nowrap" }}>{price}</span>}
        <PartCartBtn item={item} compact />
      </div>
    </div>
  );
});

// ── PartsPage ─────────────────────────────────────────────────────────────
const COMP_TAB_IDS = ['drivetrain','brakes','wheels','cockpit','suspension'];
const ACC_TAB_IDS  = ['fit','tools','bags','lights','locks','racks'];

const PartsPage = ({ pageType = 'components' }) => {
  const defaultTab = pageType === 'accessories' ? 'fit' : 'drivetrain';

  // Map tab IDs (including legacy names) to current tab IDs
  const remapTab = (id) => {
    const REMAP = { helmets:'fit', protection:'fit', shoes:'fit', clothing:'fit',
                    accessories:'bags', fit:'fit', tools:'tools', bags:'bags',
                    lights:'lights', locks:'locks', racks:'racks' };
    return REMAP[id] || (COMP_TAB_IDS.includes(id) ? id : defaultTab);
  };

  const [cat,    setCat]    = React.useState(() => {
    const t = window.cl?.intent?.tab;
    return t ? remapTab(t) : defaultTab;
  });
  const [search, setSearch] = React.useState('');
  const [pg,     setPg]     = React.useState(0);
  const PAGE = 60;
  const searchRef = React.useRef(null);

  // Handle routing intent from nav (dept/search filters only — tab handled in useState)
  React.useEffect(() => {
    const intent = window.cl?.intent;
    if (!intent) return;
    if (intent.dept)   setSearch(intent.dept);
    if (intent.search) setSearch(intent.search);
    window.cl.intent = null;
  }, []);

  const validTabIds = pageType === 'accessories' ? ACC_TAB_IDS : COMP_TAB_IDS;
  const safeCat = validTabIds.includes(cat) ? cat : defaultTab;
  const { items, loading } = useTabInventory(safeCat);
  const visibleTabs = PART_TABS.filter(t => validTabIds.includes(t.id));
  const activeTab = PART_TABS.find(t => t.id === safeCat) || visibleTabs[0];

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const pool = q.length >= 2
      ? items.filter(p => {
          const name = (p.name || '').toLowerCase();
          const dept = (p.department || '').toLowerCase();
          const sku  = (p.sku  || '').toLowerCase();
          return name.includes(q) || dept.includes(q) || sku.includes(q);
        })
      : items;
    return [...pool].sort((a, b) => (a.price||0) - (b.price||0));
  }, [items, search]);

  const grouped = React.useMemo(() => {
    if (search.trim().length >= 2) return null;
    const g = {};
    filtered.forEach(item => {
      const d = item.department || 'Other';
      if (!g[d]) g[d] = [];
      g[d].push(item);
    });
    return Object.entries(g).sort(([a],[b]) => a.localeCompare(b));
  }, [filtered, search]);

  const visible = filtered.slice(0, (pg + 1) * PAGE);
  const hasMore = visible.length < filtered.length;
  const switchCat = (id) => { setCat(remapTab(id)); setSearch(''); setPg(0); window.scrollTo({ top:0, behavior:'smooth' }); };

  return (
    <div className="page-fade">
      <section className="parts-page-section" style={{ background:"var(--white)", paddingTop:136, minHeight:"100vh" }}>

        {/* Mobile tabs */}
        <div className="parts-mobile-tabs">
          {visibleTabs.map(t => (
            <button key={t.id} className={"parts-mobile-tab " + (safeCat === t.id ? "active" : "")} onClick={() => switchCat(t.id)}>
              <span style={{ fontSize:14 }}>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="parts-layout">

          {/* Sidebar */}
          <div className="parts-sidebar">
            <div style={{ padding:"20px 20px 10px", fontFamily:"var(--mono)", fontSize:8, letterSpacing:".2em", textTransform:"uppercase", color:"var(--gray-400)" }}>
              {pageType === 'accessories' ? 'Accessories & Gear' : 'Components & Parts'}
            </div>
            {visibleTabs.map(t => {
              const cached = window.CL_LS?.tabCache?.[t.id];
              const active = safeCat === t.id && !search;
              return (
                <button key={t.id} data-cursor="link" onClick={() => switchCat(t.id)}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"12px 20px",
                    border:"none", borderLeft: active ? "2px solid var(--black)" : "2px solid transparent",
                    cursor:"pointer", textAlign:"left",
                    background: active ? "var(--paper)" : "transparent",
                    color: active ? "var(--black)" : "var(--gray-500)",
                    transition:"all .15s", fontFamily:"var(--mono)", fontSize:10,
                    letterSpacing:".1em", textTransform:"uppercase" }}>
                  <span style={{ fontSize:16, lineHeight:1, flexShrink:0 }}>{t.emoji}</span>
                  <span style={{ flex:1, lineHeight:1.3, fontWeight: active ? 600 : 400 }}>{t.label}</span>
                  {cached && <span style={{ fontFamily:"var(--mono)", fontSize:9, opacity:.35, flexShrink:0 }}>{cached.length}</span>}
                </button>
              );
            })}
            <div style={{ margin:"20px 20px 0", paddingTop:16, borderTop:"1px solid var(--hairline)" }}>
              <p style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".1em", textTransform:"uppercase", color:"var(--gray-400)", lineHeight:1.8, margin:0 }}>Live · Lightspeed</p>
            </div>
          </div>

          {/* Main */}
          <div className="parts-main" style={{ minWidth:0, overflow:"hidden" }}>

            {/* Hero banner */}
            {!search && (
              <div style={{ position:"relative", height:140, background:"#0a0a0a", overflow:"hidden" }}>
                {activeTab.img && <img src={activeTab.img} alt={activeTab.label}
                  loading="lazy" decoding="async" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 40%", opacity:.4 }} />}
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 100%)" }} />
                <div style={{ position:"relative", height:"100%", display:"flex", alignItems:"center", padding:"0 28px", gap:16 }}>
                  <span style={{ fontSize:36, lineHeight:1 }}>{activeTab.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"var(--display)", fontSize:"clamp(20px,2.5vw,28px)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-.02em", color:"#fafafa", lineHeight:1 }}>{activeTab.label}</div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"rgba(255,255,255,0.5)", marginTop:5 }}>{activeTab.sub}</div>
                  </div>
                  {!loading && filtered.length > 0 && (
                    <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"rgba(255,255,255,0.45)", letterSpacing:".08em", textTransform:"uppercase" }}>{filtered.length} in stock</span>
                  )}
                </div>
              </div>
            )}

            {/* Sticky search bar */}
            <div style={{ padding:"12px 20px", borderBottom:"1px solid var(--hairline)", display:"flex", alignItems:"center", gap:10, background:"var(--white)", position:"sticky", top:136, zIndex:10 }}>
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:"var(--paper)", border:"1px solid var(--hairline)", padding:"0 12px", transition:"border-color .15s" }}
                onFocusCapture={e => e.currentTarget.style.borderColor='var(--black)'}
                onBlurCapture={e => e.currentTarget.style.borderColor='var(--hairline)'}>
                <span style={{ fontSize:13, color:"var(--gray-400)" }}>⌕</span>
                <input ref={searchRef} type="text" placeholder={`Search ${activeTab.label.toLowerCase()}…`}
                  value={search} onChange={e => { setSearch(e.target.value); setPg(0); }}
                  style={{ flex:1, padding:"9px 0", border:"none", outline:"none", fontFamily:"var(--body)", fontSize:14, background:"transparent", color:"var(--black)" }} />
                {search && <button onClick={() => { setSearch(''); setPg(0); searchRef.current?.focus(); }}
                  style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--gray-400)", background:"none", border:"none", cursor:"pointer" }}>✕</button>}
              </div>
              {loading && <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"#b45309", letterSpacing:".08em", textTransform:"uppercase", flexShrink:0 }}>Loading…</span>}
            </div>

            {/* Content */}
            {loading ? (
              <div>
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"24px 1fr auto", gap:"0 12px", padding:"14px 20px", borderBottom:"1px solid var(--hairline)", opacity: 1 - i*0.1 }}>
                    <div style={{ height:11, background:"var(--paper)", borderRadius:2 }} />
                    <div style={{ height:11, background:"var(--paper)", borderRadius:2, width:"55%" }} />
                    <div style={{ height:11, width:44, background:"var(--paper)", borderRadius:2 }} />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:"72px 28px", textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:16, opacity:.25 }}>{activeTab.emoji}</div>
                <p style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", marginBottom:8 }}>
                  {search ? `No results for "${search}"` : `No ${activeTab.label} in stock right now`}
                </p>
                <p style={{ fontSize:14, color:"var(--gray-500)", maxWidth:340, margin:"0 auto 28px" }}>
                  {search ? "Try a different search or pick another category." : "Stock changes daily. We can order almost anything — give us a call."}
                </p>
                <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
                  <a href="tel:2508601968" className="btn btn-outline" data-cursor="link">Call (250) 860-1968</a>
                  <button className="btn" data-cursor="link" onClick={() => window.cl.go("contact")}>Contact Us <ArrowRight /></button>
                </div>
              </div>
            ) : grouped ? (
              <div>
                {grouped.map(([dept, deptItems]) => (
                  <div key={dept}>
                    <div style={{ padding:"10px 20px 8px", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".16em", textTransform:"uppercase", color:"var(--gray-400)", background:"var(--paper)", borderBottom:"1px solid var(--hairline)", borderTop:"1px solid var(--hairline)", display:"flex", alignItems:"center", gap:8 }}>
                      <span>{deptEmoji(dept, activeTab.emoji)}</span>
                      <span style={{ flex:1 }}>{dept}</span>
                      <span style={{ opacity:.45 }}>{deptItems.length}</span>
                    </div>
                    {deptItems.map(item => (
                      <PartRow key={item.id || item.sku || item.name} item={item} tabEmoji={activeTab.emoji} />
                    ))}
                  </div>
                ))}
                <div style={{ padding:"36px 20px 60px", borderTop:"1px solid var(--hairline)", marginTop:8 }}>
                  <div className="eyebrow" style={{ marginBottom:6 }}>Need something not listed?</div>
                  <p style={{ fontSize:13, color:"var(--gray-500)", marginBottom:14 }}>We stock 7,000+ products and can order most things within a few days.</p>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    <a href="tel:2508601968" className="btn btn-outline" data-cursor="link" style={{ fontSize:11 }}>Call Us</a>
                    <button className="btn" data-cursor="link" onClick={() => window.cl.go("contact")} style={{ fontSize:11 }}>Contact <ArrowRight /></button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ padding:"10px 20px 8px", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)", background:"var(--paper)", borderBottom:"1px solid var(--hairline)" }}>
                  {filtered.length} results for "{search}"
                </div>
                {visible.map(item => (
                  <PartRow key={item.id || item.sku || item.name} item={item} tabEmoji={activeTab.emoji} />
                ))}
                {hasMore && (
                  <div style={{ padding:"24px", textAlign:"center" }}>
                    <button data-cursor="link" onClick={() => setPg(p => p + 1)}
                      style={{ padding:"11px 28px", border:"1px solid var(--hairline)", background:"none", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase", cursor:"pointer", color:"var(--gray-600)" }}>
                      Load more ({filtered.length - visible.length} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
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

          {/* Consign / Post CTA — top */}
          <div className="reveal" style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap", marginBottom:48, padding:"24px 32px", background:"var(--paper)", borderLeft:"3px solid var(--black)" }}>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontFamily:"var(--display)", fontSize:20, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", marginBottom:6 }}>Sell or consign with ChainLine</div>
              <p style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:"var(--gray-500)", margin:0 }}>List on Pinkbike · Consign through the shop · Email us to get started</p>
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <a href="mailto:bikes@chainline.ca?subject=Consignment Enquiry" className="btn" data-cursor="link">Consign with Us <ArrowRight /></a>
              <a href={PB_POST} target="_blank" rel="noopener" className="btn btn-outline" data-cursor="link">Post on Pinkbike <ArrowRight /></a>
            </div>
          </div>

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
                      ? <img src={l.image} alt={l.title} className="bike-img" loading="lazy" decoding="async" style={{ width:"100%", aspectRatio:"4/3", objectFit:"cover" }} />
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

// WARRANTY PAGE
const WarrantyPage = () => (
  <div className="page-fade" data-screen-label="Warranty">
    <SubHero eyebrow="Services  /  Warranty" title="Warranty work." italic="Done right." />
    <section className="section section-pad bg-white">
      <div className="container-narrow">
        <p style={{ fontSize:17, lineHeight:1.75, color:"var(--gray-600)", marginBottom:40, maxWidth:600 }}>
          We handle warranty claims for all brands we carry — Marin, Transition, Pivot, Surly, Salsa, Bianchi, Moots, Knolly, and Revel. If something fails under normal use, bring it in and we'll assess it and work with the manufacturer on your behalf.
        </p>
        {[
          ["What's covered", "Frame and component defects under normal riding conditions. Manufacturer timelines and decisions apply. We'll advocate for you throughout the process."],
          ["Service charge", "Most warranty assessments and submissions carry a $45 service charge. This covers our time inspecting, documenting, and liaising with the manufacturer. The charge is waived if the claim is approved and the work is done in-store."],
          ["Shipping costs", "If the manufacturer requires the part or frame to be shipped, shipping costs are passed through at cost. We'll get you a quote before anything ships."],
          ["Timelines", "Warranty timelines are set by the manufacturer — typically 2–6 weeks. We'll keep you updated throughout and push for the fastest resolution possible."],
          ["How to start", "Bring your bike or the affected component in-store. We'll inspect it, take photos, and start the claim. You can also call us at (250) 860-1968 or email bikes@chainline.ca to get the process started."],
        ].map(([title, body], i) => (
          <div key={i} style={{ borderTop:"1px solid var(--hairline)", padding:"28px 0" }}>
            <div style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", marginBottom:12 }}>{title}</div>
            <p style={{ fontSize:15, lineHeight:1.7, color:"var(--gray-500)", margin:0, maxWidth:560 }}>{body}</p>
          </div>
        ))}
        <div style={{ borderTop:"1px solid var(--hairline)", paddingTop:40, display:"flex", gap:16, flexWrap:"wrap" }}>
          <button className="btn" data-cursor="link" onClick={() => window.cl.go('book')}>Book a Service <ArrowRight /></button>
          <a href="tel:2508601968" className="btn" style={{ background:"transparent", border:"1px solid var(--black)", color:"var(--black)" }}>Call (250) 860-1968 <ArrowRight /></a>
        </div>
      </div>
    </section>
  </div>
);

// BOOK A DEMO PAGE
const DemoPage = () => {
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const update = (k, v) => setData(d => ({ ...d, [k]: v }));
  const next = () => setStep(s => Math.min(s + 1, 3));
  const back = () => setStep(s => Math.max(s - 1, 1));
  const WORKER = "https://still-term-f1ec.taocaruso77.workers.dev";
  const inpStyle = { width:"100%", padding:"12px 0", border:"none", borderBottom:"1px solid var(--hairline)", fontSize:16, fontFamily:"var(--body)", background:"transparent", outline:"none", color:"var(--black)" };

  const BIKES = [
    "Transition Sentinel","Transition Spire","Transition Regulator",
    "Pivot Switchblade","Pivot Shuttle AM",
    "Marin Hawk Hill","Marin Pine Mountain",
    "Not sure — help me choose",
  ];

  const submit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name",    data.name    || '');
      fd.append("phone",   data.phone   || '');
      fd.append("email",   data.email   || '');
      fd.append("service", `DEMO REQUEST: ${data.bike || 'Not specified'}`);
      fd.append("bike",    data.bike    || '');
      fd.append("date",    data.date    || 'Flexible');
      fd.append("issue",   data.notes   || '');
      const res = await fetch(`${WORKER}/api/book`, { method:"POST", body: fd });
      const json = await res.json();
      if (json.ok) { setSubmitted(true); return; }
      throw new Error();
    } catch {
      const body = encodeURIComponent(`Demo Request\n\nName: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email||'-'}\nBike: ${data.bike||'-'}\nDate: ${data.date||'Flexible'}\nNotes: ${data.notes||'-'}`);
      window.location.href = `mailto:bikes@chainline.ca?subject=${encodeURIComponent('Demo Request — '+(data.name||'Customer'))}&body=${body}`;
      setSubmitted(true);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="page-fade" data-screen-label="Book a Demo">
      <SubHero eyebrow="Demos  /  N°01" title="Try before you buy." italic="Take your next bike for a spin." />
      <section className="section section-pad bg-white">
        <div className="container-narrow">
          {submitted ? (
            <div style={{ textAlign:"center", padding:"60px 0" }}>
              <div style={{ fontFamily:"var(--display)", fontSize:32, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.02em", marginBottom:16 }}>Request received.</div>
              <p style={{ color:"var(--gray-500)", fontSize:16, marginBottom:32 }}>We'll call to confirm your demo and get the bike dialled for you.</p>
              <button className="btn" data-cursor="link" onClick={() => window.cl.go('shop')}>Browse Bikes <ArrowRight /></button>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", gap:6, marginBottom:40 }}>
                {[1,2,3].map(s => (
                  <div key={s} style={{ flex:1, height:2, background: s <= step ? "var(--black)" : "var(--hairline)", transition:"background .3s" }} />
                ))}
              </div>
              <div className="eyebrow" style={{ marginBottom:24 }}>Step {step} of 3</div>

              {step === 1 && (
                <div>
                  <h2 className="display-l" style={{ marginBottom:12 }}>Your details.</h2>
                  <p style={{ color:"var(--gray-500)", fontSize:15, marginBottom:36 }}>We'll call to confirm and set up the demo.</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px 32px", marginBottom:32 }}>
                    <div style={{ gridColumn:"1/-1" }}>
                      <div className="eyebrow" style={{ marginBottom:8 }}>Name *</div>
                      <input type="text" placeholder="Jane Smith" value={data.name||""} onChange={e=>update("name",e.target.value)} style={inpStyle} />
                    </div>
                    <div>
                      <div className="eyebrow" style={{ marginBottom:8 }}>Phone *</div>
                      <input type="tel" placeholder="(250) 555-0100" value={data.phone||""} onChange={e=>update("phone",e.target.value)} style={inpStyle} />
                    </div>
                    <div>
                      <div className="eyebrow" style={{ marginBottom:8 }}>Email</div>
                      <input type="email" placeholder="jane@example.com" value={data.email||""} onChange={e=>update("email",e.target.value)} style={inpStyle} />
                    </div>
                  </div>
                  <button className="btn" data-cursor="link" disabled={!data.name||!data.phone} onClick={next}>Continue <ArrowRight /></button>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="display-l" style={{ marginBottom:12 }}>Which bike?</h2>
                  <p style={{ color:"var(--gray-500)", fontSize:15, marginBottom:36 }}>We'll have it set up and ready for you.</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:32 }}>
                    {BIKES.map(b => (
                      <button key={b} data-cursor="link" onClick={() => update("bike", b)}
                        style={{ padding:"14px 16px", border:"2px solid "+(data.bike===b?"var(--black)":"var(--hairline)"), background:data.bike===b?"var(--black)":"transparent", color:data.bike===b?"var(--white)":"var(--black)", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".1em", textTransform:"uppercase", textAlign:"left", cursor:"pointer", transition:"all .15s" }}>
                        {b}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:12 }}>
                    <button className="btn" style={{ background:"transparent", border:"1px solid var(--black)", color:"var(--black)" }} onClick={back}>Back</button>
                    <button className="btn" data-cursor="link" disabled={!data.bike} onClick={next}>Continue <ArrowRight /></button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="display-l" style={{ marginBottom:12 }}>When works?</h2>
                  <p style={{ color:"var(--gray-500)", fontSize:15, marginBottom:36 }}>Demos are available during shop hours. We'll confirm by phone.</p>
                  <div style={{ marginBottom:24 }}>
                    <div className="eyebrow" style={{ marginBottom:8 }}>Preferred date / time</div>
                    <input type="text" placeholder="e.g. Saturday afternoon, any weekday" value={data.date||""} onChange={e=>update("date",e.target.value)} style={inpStyle} />
                  </div>
                  <div style={{ marginBottom:32 }}>
                    <div className="eyebrow" style={{ marginBottom:8 }}>Anything we should know?</div>
                    <input type="text" placeholder="Riding style, experience level, height…" value={data.notes||""} onChange={e=>update("notes",e.target.value)} style={inpStyle} />
                  </div>
                  <div style={{ display:"flex", gap:12 }}>
                    <button className="btn" style={{ background:"transparent", border:"1px solid var(--black)", color:"var(--black)" }} onClick={back}>Back</button>
                    <button className="btn" data-cursor="link" disabled={submitting} onClick={submit}>{submitting?"Sending…":"Request Demo"} {!submitting&&<ArrowRight/>}</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

// BIKE FITTING PAGE
const FittingPage = () => {
  const [data, setData] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));
  const WORKER = "https://still-term-f1ec.taocaruso77.workers.dev";
  const inp = { width:"100%", padding:"12px 0", border:"none", borderBottom:"1px solid var(--hairline)", fontSize:16, fontFamily:"var(--body)", background:"transparent", outline:"none", color:"var(--black)" };

  const FITS = [
    { name:"Position Check", price:"$80", dur:"45 min", desc:"Saddle height, reach, cleat position. Great starting point for new bikes." },
    { name:"Road / Gravel Fit", price:"$220", dur:"2 hours", desc:"Full motion capture, cleat analysis, saddle pressure mapping." },
    { name:"Mountain Bike Fit", price:"$220", dur:"2 hours", desc:"Body geometry and suspension position dialled for trail riding." },
    { name:"Full Body + Video", price:"$380", dur:"3 hours", desc:"Everything included — best for chronic pain or high performance goals." },
  ];

  const submit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name",    data.name    || '');
      fd.append("phone",   data.phone   || '');
      fd.append("email",   data.email   || '');
      fd.append("service", `BIKE FIT: ${data.fitType || 'Position Check'}`);
      fd.append("bike",    data.bike    || '');
      fd.append("date",    data.date    || 'Flexible');
      fd.append("issue",   data.notes   || '');
      const res = await fetch(`${WORKER}/api/book`, { method:"POST", body: fd });
      const json = await res.json();
      if (json.ok) { setSubmitted(true); return; }
      throw new Error();
    } catch {
      const body = encodeURIComponent(`Bike Fit Request\n\nName: ${data.name}\nPhone: ${data.phone}\nFit: ${data.fitType||'Position Check'}\nBike: ${data.bike||'-'}\nDate: ${data.date||'Flexible'}\nNotes: ${data.notes||'-'}`);
      window.location.href = `mailto:bikes@chainline.ca?subject=${encodeURIComponent('Bike Fit — '+(data.name||'Customer'))}&body=${body}`;
      setSubmitted(true);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="page-fade" data-screen-label="Bike Fitting">
      <SubHero eyebrow="Services  /  Fitting" title="Ride better." italic="Feel better." />
      <section className="section section-pad bg-white">
        <div className="container-wide">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"start" }}>
            <div>
              <div className="section-label" style={{ marginBottom:32 }}>Choose your fit level</div>
              {FITS.map((f, i) => (
                <div key={i} data-cursor="link" onClick={() => upd("fitType", f.name)}
                  style={{ padding:"20px 0", borderBottom:"1px solid var(--hairline)", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16,
                    background: data.fitType === f.name ? "transparent" : "transparent" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                      <div style={{ width:12, height:12, borderRadius:"50%", border:`2px solid ${data.fitType===f.name?"var(--black)":"var(--hairline)"}`, background: data.fitType===f.name?"var(--black)":"transparent", transition:"all .2s" }} />
                      <div style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em" }}>{f.name}</div>
                    </div>
                    <p style={{ fontSize:14, color:"var(--gray-500)", margin:"0 0 0 22px", lineHeight:1.5 }}>{f.desc} · <em>{f.dur}</em></p>
                  </div>
                  <div style={{ fontFamily:"var(--display)", fontSize:20, fontWeight:500, flexShrink:0 }}>{f.price}</div>
                </div>
              ))}
              <p style={{ marginTop:24, fontSize:13, color:"var(--gray-500)", lineHeight:1.6 }}>All fittings done in our dedicated fitting studio with a certified fitter. Report included. Book online or call (250) 860-1968.</p>
            </div>
            <div>
              {submitted ? (
                <div style={{ padding:"60px 0", textAlign:"center" }}>
                  <div style={{ fontFamily:"var(--display)", fontSize:28, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.02em", marginBottom:12 }}>Request sent.</div>
                  <p style={{ color:"var(--gray-500)", fontSize:15 }}>We'll call to confirm your fitting time. See you in the studio.</p>
                </div>
              ) : (
                <>
                  <div className="section-label" style={{ marginBottom:32 }}>Your details</div>
                  <div style={{ marginBottom:20 }}><div className="eyebrow" style={{ marginBottom:8 }}>Name *</div><input type="text" placeholder="Jane Smith" value={data.name||""} onChange={e=>upd("name",e.target.value)} style={inp} /></div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px", marginBottom:20 }}>
                    <div><div className="eyebrow" style={{ marginBottom:8 }}>Phone *</div><input type="tel" placeholder="(250) 555-0100" value={data.phone||""} onChange={e=>upd("phone",e.target.value)} style={inp} /></div>
                    <div><div className="eyebrow" style={{ marginBottom:8 }}>Email</div><input type="email" placeholder="jane@example.com" value={data.email||""} onChange={e=>upd("email",e.target.value)} style={inp} /></div>
                  </div>
                  <div style={{ marginBottom:20 }}><div className="eyebrow" style={{ marginBottom:8 }}>Bike (brand + model)</div><input type="text" placeholder="e.g. Transition Sentinel Large" value={data.bike||""} onChange={e=>upd("bike",e.target.value)} style={inp} /></div>
                  <div style={{ marginBottom:20 }}><div className="eyebrow" style={{ marginBottom:8 }}>Preferred date / time</div><input type="text" placeholder="e.g. Saturday morning" value={data.date||""} onChange={e=>upd("date",e.target.value)} style={inp} /></div>
                  <div style={{ marginBottom:32 }}><div className="eyebrow" style={{ marginBottom:8 }}>Goals or pain points</div><input type="text" placeholder="e.g. knee pain, new bike setup, power goals…" value={data.notes||""} onChange={e=>upd("notes",e.target.value)} style={inp} /></div>
                  <button className="btn" data-cursor="link" disabled={!data.name||!data.phone||submitting} onClick={submit}>{submitting?"Sending…":"Book a Fitting"} {!submitting&&<ArrowRight/>}</button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// BIKE STORAGE PAGE
const StoragePage = () => {
  const [data, setData] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));
  const WORKER = "https://still-term-f1ec.taocaruso77.workers.dev";
  const inp = { width:"100%", padding:"12px 0", border:"none", borderBottom:"1px solid var(--hairline)", fontSize:16, fontFamily:"var(--body)", background:"transparent", outline:"none", color:"var(--black)" };

  const submit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name",    data.name  || '');
      fd.append("phone",   data.phone || '');
      fd.append("email",   data.email || '');
      fd.append("service", `STORAGE: ${data.bikes||'1 bike'} · Drop-off ${data.dropoff||'TBD'}`);
      fd.append("bike",    data.bikes || '');
      fd.append("date",    data.dropoff || 'Flexible');
      fd.append("issue",   data.notes || '');
      const res = await fetch(`${WORKER}/api/book`, { method:"POST", body: fd });
      const json = await res.json();
      if (json.ok) { setSubmitted(true); return; }
      throw new Error();
    } catch {
      const body = encodeURIComponent(`Bike Storage Enquiry\n\nName: ${data.name}\nPhone: ${data.phone}\nBike(s): ${data.bikes||'-'}\nDrop-off: ${data.dropoff||'TBD'}\nNotes: ${data.notes||'-'}`);
      window.location.href = `mailto:bikes@chainline.ca?subject=${encodeURIComponent('Storage — '+(data.name||'Customer'))}&body=${body}`;
      setSubmitted(true);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="page-fade" data-screen-label="Bike Storage">
      <SubHero eyebrow="Services  /  Storage" title="Winter storage." italic="Spring ready." />
      <section className="section section-pad bg-white">
        <div className="container-wide">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"start" }}>
            <div>
              <div className="section-label" style={{ marginBottom:32 }}>How it works</div>
              {[
                ["01", "Drop off", "Anytime from October. We log the condition, take photos, tag it."],
                ["02", "Stored safe", "Climate-controlled, locked facility. Monthly battery checks for e-bikes."],
                ["03", "Spring service", "Tuned, inspected, and ready to roll the day you call to pick up."],
              ].map(([n, t, d], i) => (
                <div key={i} style={{ borderTop:"1px solid var(--hairline)", padding:"28px 0" }}>
                  <div className="eyebrow" style={{ marginBottom:8 }}>{n}</div>
                  <div style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", marginBottom:8 }}>{t}</div>
                  <p style={{ fontSize:14, color:"var(--gray-500)", margin:0, lineHeight:1.6 }}>{d}</p>
                </div>
              ))}
              <div style={{ borderTop:"1px solid var(--hairline)", paddingTop:28 }}>
                <div className="eyebrow" style={{ marginBottom:8 }}>Pricing</div>
                <div style={{ fontFamily:"var(--display)", fontSize:24, fontWeight:500 }}>From $180</div>
                <p style={{ fontSize:14, color:"var(--gray-500)", marginTop:8 }}>Per bike, per season. E-bikes and oversized bikes may vary. Ask us.</p>
              </div>
            </div>
            <div>
              {submitted ? (
                <div style={{ padding:"60px 0", textAlign:"center" }}>
                  <div style={{ fontFamily:"var(--display)", fontSize:28, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.02em", marginBottom:12 }}>Enquiry sent.</div>
                  <p style={{ color:"var(--gray-500)", fontSize:15 }}>We'll follow up to confirm drop-off and answer any questions.</p>
                </div>
              ) : (
                <>
                  <div className="section-label" style={{ marginBottom:32 }}>Book your spot</div>
                  <div style={{ marginBottom:20 }}><div className="eyebrow" style={{ marginBottom:8 }}>Name *</div><input type="text" placeholder="Jane Smith" value={data.name||""} onChange={e=>upd("name",e.target.value)} style={inp} /></div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px", marginBottom:20 }}>
                    <div><div className="eyebrow" style={{ marginBottom:8 }}>Phone *</div><input type="tel" placeholder="(250) 555-0100" value={data.phone||""} onChange={e=>upd("phone",e.target.value)} style={inp} /></div>
                    <div><div className="eyebrow" style={{ marginBottom:8 }}>Email</div><input type="email" placeholder="jane@example.com" value={data.email||""} onChange={e=>upd("email",e.target.value)} style={inp} /></div>
                  </div>
                  <div style={{ marginBottom:20 }}><div className="eyebrow" style={{ marginBottom:8 }}>Bike(s)</div><input type="text" placeholder="e.g. Transition Sentinel + Trek Marlin" value={data.bikes||""} onChange={e=>upd("bikes",e.target.value)} style={inp} /></div>
                  <div style={{ marginBottom:20 }}><div className="eyebrow" style={{ marginBottom:8 }}>Approx. drop-off date</div><input type="text" placeholder="e.g. Mid-October" value={data.dropoff||""} onChange={e=>upd("dropoff",e.target.value)} style={inp} /></div>
                  <div style={{ marginBottom:32 }}><div className="eyebrow" style={{ marginBottom:8 }}>Notes</div><input type="text" placeholder="Number of bikes, e-bike, any questions…" value={data.notes||""} onChange={e=>upd("notes",e.target.value)} style={inp} /></div>
                  <button className="btn" data-cursor="link" disabled={!data.name||!data.phone||submitting} onClick={submit}>{submitting?"Sending…":"Request Storage"} {!submitting&&<ArrowRight/>}</button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const WORKER = "https://still-term-f1ec.taocaruso77.workers.dev";

const SOCIAL_LINKS = [
  { name:"Instagram", handle:"@ChainLineCycle",           url:"https://instagram.com/ChainLineCycle",                      desc:"Bikes, builds & Kelowna trails" },
  { name:"TikTok",    handle:"@ChainLineCycle",           url:"https://tiktok.com/@ChainLineCycle",                        desc:"Short clips from the shop & trails" },
  { name:"Facebook",  handle:"ChainLine Cycle",           url:"https://facebook.com/ChainLineCycle",                       desc:"Events, news & community" },
  { name:"Threads",   handle:"@ChainLineCycle",           url:"https://threads.net/@ChainLineCycle",                       desc:"Quick updates & conversation" },
  { name:"X",         handle:"@ChainLineCycle",           url:"https://x.com/ChainLineCycle",                              desc:"Trail conditions & quick takes" },
  { name:"Bluesky",   handle:"@ChainLineCycle.bsky.social",url:"https://bsky.app/profile/ChainLineCycle.bsky.social",     desc:"The fediverse side of ChainLine" },
  { name:"Snapchat",  handle:"ChainLineCycle",            url:"https://snapchat.com/add/ChainLineCycle",                   desc:"Behind-the-scenes from the shop" },
  { name:"Pinkbike",  handle:"ChainLineCycle",            url:"https://www.pinkbike.com/u/ChainLineCycle/buysell/",        desc:"Buy, sell & classifieds" },
];

const SocialPage = () => {
  const [videos, setVideos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [active, setActive] = React.useState(null);

  React.useEffect(() => {
    fetch(`${WORKER}/api/youtube`)
      .then(r => r.json())
      .then(data => { setVideos(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setActive(null); };
    if (active) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-CA', { year:'numeric', month:'short', day:'numeric' });
  };

  return (
    <div style={{ minHeight:"80vh" }}>
      <SubHero title="Social" eyebrow="ChainLine" sub="Follow along — rides, builds, shop life, and Kelowna trails." />

      {/* ── Social links grid ── */}
      <section style={{ padding:"64px 0 0", background:"var(--white)" }}>
        <div className="container-wide">
          <div className="section-label" style={{ marginBottom:40 }}>Follow Us</div>
          <div className="social-links-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:2 }}>
            {SOCIAL_LINKS.map((s, i) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener" data-cursor="link"
                className="social-link-tile"
                style={{ display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"28px 24px", border:"1px solid var(--hairline)", textDecoration:"none", color:"var(--black)", background:"var(--white)", transition:"background .2s, color .2s", minHeight:140 }}
                onMouseEnter={e => { e.currentTarget.style.background="var(--black)"; e.currentTarget.style.color="var(--white)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="var(--white)"; e.currentTarget.style.color="var(--black)"; }}>
                <div>
                  <div style={{ fontFamily:"var(--display)", fontSize:"clamp(18px,1.8vw,26px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", lineHeight:1.1, marginBottom:8 }}>{s.name}</div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".12em", textTransform:"uppercase", color:"inherit", opacity:.55, lineHeight:1.5 }}>{s.desc}</div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:20 }}>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".1em", textTransform:"uppercase", opacity:.6 }}>{s.handle}</div>
                  <ArrowRight size={10} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── YouTube ── */}
      <section style={{ padding:"80px 0 96px", background:"var(--white)" }}>
        <div className="container-wide">
          <div className="section-label" style={{ marginBottom:40 }}>YouTube</div>

          {loading && (
            <div style={{ textAlign:"center", padding:"80px 0", color:"var(--gray-400)", fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}>
              Loading videos…
            </div>
          )}

          {error && (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div style={{ color:"var(--gray-500)", marginBottom:24 }}>Couldn't load videos right now.</div>
              <a href="https://youtube.com/@ChainLine_Cycle" target="_blank" rel="noopener" className="btn btn-outline" data-cursor="link">Watch on YouTube</a>
            </div>
          )}

          {!loading && !error && videos.length === 0 && (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div style={{ color:"var(--gray-500)", marginBottom:24 }}>No videos yet — check back soon.</div>
              <a href="https://youtube.com/@ChainLine_Cycle" target="_blank" rel="noopener" className="btn btn-outline" data-cursor="link">YouTube Channel</a>
            </div>
          )}

          {videos.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:28 }}>
              {videos.map(v => (
                <div key={v.id} onClick={() => setActive(v)} data-cursor="link"
                  style={{ cursor:"pointer", display:"flex", flexDirection:"column" }}>
                  <div style={{ position:"relative", aspectRatio:"16/9", overflow:"hidden", background:"var(--gray-100)", marginBottom:14 }}>
                    {v.thumbnail
                      ? <img src={v.thumbnail} alt={v.title} loading="lazy" decoding="async" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", transition:"transform .4s ease" }}
                          onMouseEnter={e => e.currentTarget.style.transform="scale(1.03)"}
                          onMouseLeave={e => e.currentTarget.style.transform="scale(1)"} />
                      : <div style={{ width:"100%", height:"100%", background:"var(--gray-100)" }} />
                    }
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", opacity:0, transition:"opacity .2s", background:"rgba(0,0,0,0.25)" }}
                      onMouseEnter={e => e.currentTarget.style.opacity=1}
                      onMouseLeave={e => e.currentTarget.style.opacity=0}>
                      <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(255,255,255,0.95)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--black)"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:500, letterSpacing:"-.01em", textTransform:"uppercase", lineHeight:1.3, marginBottom:6, color:"var(--black)" }}>{v.title}</div>
                  {v.published && <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-400)" }}>{formatDate(v.published)}</div>}
                </div>
              ))}
            </div>
          )}

          {videos.length > 0 && (
            <div style={{ textAlign:"center", marginTop:56 }}>
              <a href="https://youtube.com/@ChainLine_Cycle" target="_blank" rel="noopener" className="btn btn-outline" data-cursor="link">
                More on YouTube <ArrowRight />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Video modal */}
      {active && (
        <div onClick={() => setActive(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:900, position:"relative" }}>
            <button onClick={() => setActive(null)} data-cursor="link"
              style={{ position:"absolute", top:-40, right:0, background:"none", border:"none", color:"rgba(255,255,255,0.7)", fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase", cursor:"pointer" }}>
              Close ✕
            </button>
            <div style={{ aspectRatio:"16/9", background:"#000" }}>
              <iframe
                src={`https://www.youtube.com/embed/${active.id}?autoplay=1&rel=0`}
                style={{ width:"100%", height:"100%", border:"none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div style={{ padding:"16px 0 0", color:"var(--white)" }}>
              <div style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", marginBottom:4 }}>{active.title}</div>
              {active.description && <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:".08em" }}>{active.description}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Store Landing Page ────────────────────────────────────────────────────────
const StorePage = () => {
  const [q, setQ] = React.useState('');
  const [submitted, setSubmitted] = React.useState('');
  const [preview, setPreview] = React.useState([]);
  const [allResults, setAllResults] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadedTabs, setLoadedTabs] = React.useState([]);
  const [pendingSearch, setPendingSearch] = React.useState('');
  const inputRef = React.useRef(null);
  const resultsRef = React.useRef(null);

  const ALL_TABS = ['drivetrain','brakes','wheels','cockpit','suspension','fit','tools','accessories'];
  const TAB_PAGE = (id) => ['fit','tools','accessories'].includes(id) ? 'accessories' : id === 'wheels' ? 'parts' : 'components';
  const tabEmoji = (id) => PART_TABS.find(t => t.id === id)?.emoji || '📦';
  const tabLabel = (id) => PART_TABS.find(t => t.id === id)?.label || id;

  React.useEffect(() => {
    let cancelled = false;
    Promise.all(ALL_TABS.map(id => window.lightspeedGetTab(id))).then(() => {
      if (!cancelled) { setLoadedTabs(ALL_TABS); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  // Read search intent from nav clicks (e.g. clicking "Tubes" in Store mega menu)
  React.useEffect(() => {
    const intent = window.cl?.intent;
    if (intent?.search) {
      const term = String(intent.search);
      window.cl.intent = null;
      setQ(term);
      setPendingSearch(term); // will auto-run once tabs load
    }
  }, []);

  // Auto-run pending search once inventory has loaded
  React.useEffect(() => {
    if (!loading && pendingSearch) {
      const hits = searchAll(pendingSearch);
      setAllResults(hits);
      setSubmitted(pendingSearch);
      setPendingSearch('');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 80);
    }
  }, [loading, pendingSearch]);

  const searchAll = (term) => {
    const t = term.trim().toLowerCase();
    if (t.length < 2) return [];
    const cache = window.CL_LS?.tabCache || {};
    const hits = [];
    for (const tabId of ALL_TABS) {
      for (const item of (cache[tabId] || [])) {
        const n = (item.name || '').toLowerCase();
        const d = (item.department || '').toLowerCase();
        const s = (item.sku || '').toLowerCase();
        if (n.includes(t) || d.includes(t) || s.includes(t)) hits.push({ ...item, _tab: tabId });
      }
    }
    return hits.sort((a, b) => (a.price || 0) - (b.price || 0));
  };

  // Live preview (top 8)
  React.useEffect(() => {
    if (submitted) { setPreview([]); return; }
    setPreview(q.length >= 2 ? searchAll(q).slice(0, 8) : []);
  }, [q, loadedTabs, submitted]);

  const runSearch = () => {
    const term = q.trim();
    if (term.length < 2) return;
    setAllResults(searchAll(term));
    setSubmitted(term);
    setPreview([]);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 50);
  };

  const clearSearch = () => { setQ(''); setSubmitted(''); setAllResults([]); setPreview([]); inputRef.current?.focus(); };

  const grouped = React.useMemo(() => {
    const g = {};
    for (const item of allResults) {
      if (!g[item._tab]) g[item._tab] = [];
      g[item._tab].push(item);
    }
    return ALL_TABS.filter(id => g[id]?.length).map(id => ({ id, label: tabLabel(id), emoji: tabEmoji(id), items: g[id] }));
  }, [allResults]);

  const cats = [
    { route:'components',  label:'Components',  emoji:'⚙️', desc:'Drivetrain, brakes, suspension, cockpit' },
    { route:'parts',       label:'Parts',       emoji:'🔗', desc:'Tires, tubes, chains, cables, brake pads, lube' },
    { route:'accessories', label:'Accessories', emoji:'🎒', desc:'Helmets, clothing, lights, locks, bags, tools' },
  ];

  return (
    <div className="page-fade">
      {/* ── Search hero ── */}
      <section style={{ background:'var(--black)', padding: submitted ? '72px 0 28px' : '120px 0 80px', color:'var(--white)', transition:'padding .35s ease' }}>
        <div className="container-wide" style={{ maxWidth:760, margin:'0 auto' }}>
          {!submitted && (
            <>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.45)', marginBottom:16 }}>Store  /  Live Inventory</div>
              <h1 className="display-xl" style={{ marginBottom:40, color:'var(--white)' }}>
                Find what you need.<br/><span className="serif-italic">In stock, right now.</span>
              </h1>
            </>
          )}
          {submitted && (
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
              <button onClick={clearSearch} data-cursor="link" style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', padding:0 }}>← Back</button>
              <span style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)' }}>
                {allResults.length} result{allResults.length !== 1 ? 's' : ''} for "{submitted}"
              </span>
            </div>
          )}
          {/* Search bar */}
          <div style={{ display:'flex', background:'var(--white)' }}>
            <span style={{ display:'flex', alignItems:'center', padding:'0 4px 0 20px', fontSize:18, color:'var(--gray-400)', flexShrink:0, pointerEvents:'none' }}>⌕</span>
            <input ref={inputRef} value={q} autoFocus
              onChange={e => { setQ(e.target.value); if (submitted) setSubmitted(''); }}
              onKeyDown={e => e.key === 'Enter' && runSearch()}
              placeholder="Search chains, brake pads, helmets, tubes…"
              style={{ flex:1, padding:'20px 12px', border:'none', outline:'none', fontFamily:'var(--body)', fontSize:17, background:'transparent', color:'var(--black)' }} />
            {loading && !q && <span style={{ display:'flex', alignItems:'center', padding:'0 16px', fontFamily:'var(--mono)', fontSize:9, color:'var(--gray-400)', letterSpacing:'.1em', textTransform:'uppercase', flexShrink:0 }}>Loading…</span>}
            {q && <button onClick={clearSearch} style={{ padding:'0 14px', background:'none', border:'none', borderRight:'1px solid var(--hairline)', cursor:'pointer', fontFamily:'var(--mono)', fontSize:10, color:'var(--gray-400)', flexShrink:0 }}>✕</button>}
            <button onClick={runSearch} disabled={q.trim().length < 2} data-cursor="link"
              style={{ padding:'0 28px', background: q.trim().length >= 2 ? 'var(--black)' : 'var(--gray-200)', color: q.trim().length >= 2 ? 'var(--white)' : 'var(--gray-400)', border:'none', cursor: q.trim().length >= 2 ? 'pointer' : 'default', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', flexShrink:0, transition:'background .15s, color .15s' }}>
              Search
            </button>
          </div>
          {/* Live preview dropdown */}
          {!submitted && preview.length > 0 && (
            <div style={{ background:'var(--white)', marginTop:2 }}>
              {preview.map((item, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'22px 1fr auto', gap:'0 14px', alignItems:'center', padding:'11px 20px', borderBottom:'1px solid var(--hairline)', transition:'background .12s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--paper)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:12, textAlign:'center', opacity:.5 }}>{tabEmoji(item._tab)}</span>
                  <div style={{ minWidth:0, cursor:'pointer' }} onClick={() => { setQ(item.name); runSearch(); }}>
                    <div style={{ fontFamily:'var(--display)', fontSize:13, fontWeight:500, textTransform:'uppercase', letterSpacing:'-.01em', color:'var(--black)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--gray-400)', letterSpacing:'.08em', textTransform:'uppercase', marginTop:1 }}>
                      {item.department}{item.price > 0 ? ` · $${item.price % 1 === 0 ? item.price : item.price.toFixed(2)}` : ''}
                      {item.qty > 0 && item.qty <= 5 ? ` · ${item.qty} left` : ''}
                    </div>
                  </div>
                  <PartCartBtn item={item} compact />
                </div>
              ))}
              <button onClick={runSearch} data-cursor="link"
                style={{ width:'100%', padding:'13px 20px', background:'var(--paper)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--black)' }}>
                <span>See all results for "{q}"</span><ArrowRight size={10} />
              </button>
            </div>
          )}
          {!submitted && q.length >= 2 && preview.length === 0 && (
            <div style={{ background:'var(--white)', padding:'16px 20px', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--gray-400)' }}>
              {loading ? 'Loading inventory…' : `No results for "${q}"`}
            </div>
          )}
        </div>
      </section>

      {/* ── Full results list ── */}
      {submitted && (
        <section ref={resultsRef} style={{ background:'var(--white)', minHeight:'60vh', paddingBottom:100 }}>
          <div className="container-wide" style={{ maxWidth:900, margin:'0 auto', paddingTop:48 }}>
            {allResults.length === 0 ? (
              <div style={{ textAlign:'center', padding:'80px 0' }}>
                <div className="display-s" style={{ marginBottom:12 }}>No results for "{submitted}"</div>
                <p style={{ color:'var(--gray-500)', marginBottom:24 }}>Try a different search, or browse a category.</p>
                <button className="btn btn-outline" onClick={clearSearch}>← Browse Categories</button>
              </div>
            ) : grouped.map(group => (
              <div key={group.id} style={{ marginBottom:48 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:12, borderBottom:'2px solid var(--black)', marginBottom:0 }}>
                  <span style={{ fontSize:18 }}>{group.emoji}</span>
                  <span style={{ fontFamily:'var(--display)', fontSize:16, fontWeight:500, textTransform:'uppercase', letterSpacing:'-.01em' }}>{group.label}</span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--gray-400)', marginLeft:'auto' }}>{group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
                </div>
                {group.items.map((item, i) => (
                  <PartRow key={i} item={item} />
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Category tiles (when no search) ── */}
      {!submitted && (
        <section style={{ background:'var(--white)', padding:'0 0 100px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2 }}>
            {cats.map(c => (
              <button key={c.route} onClick={()=>window.cl.go(c.route)} data-cursor="link"
                style={{ position:'relative', aspectRatio:'3/4', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'40px 32px 36px', background:'var(--paper)', border:'none', cursor:'pointer', textAlign:'left', overflow:'hidden', transition:'background .2s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--black)'}
                onMouseLeave={e=>e.currentTarget.style.background='var(--paper)'}>
                <div style={{ position:'absolute', top:32, left:32, fontSize:48, lineHeight:1 }}>{c.emoji}</div>
                <div style={{ position:'relative', zIndex:1 }}>
                  <div className="display-m" style={{ marginBottom:8, textAlign:'left' }}>{c.label}</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--gray-500)', lineHeight:1.6, marginBottom:20 }}>{c.desc}</div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:8, fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase' }}>Browse <ArrowRight size={10} /></div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ── Shared: preload tabs and track per-tab item counts ───────────────────────
const useTabCounts = (tabIds) => {
  const [counts, setCounts] = React.useState(() => {
    const init = {};
    tabIds.forEach(id => { init[id] = window.CL_LS?.tabCache?.[id]?.length ?? null; });
    return init;
  });
  React.useEffect(() => {
    let cancelled = false;
    tabIds.forEach(id => {
      const cache = window.CL_LS?.tabCache;
      if (cache && id in cache) {
        setCounts(c => ({ ...c, [id]: cache[id].length }));
      } else {
        window.lightspeedGetTab?.(id).then(items => {
          if (!cancelled) setCounts(c => ({ ...c, [id]: items.length }));
        });
      }
    });
    return () => { cancelled = true; };
  }, []);
  return counts;
};

// ── Parts Landing Page ────────────────────────────────────────────────────────
const PartsLandingPage = () => {
  const [q, setQ] = React.useState('');
  // Sections: each has a heading + specific search tiles
  const sections = [
    {
      heading: 'Tires',
      tiles: [
        { search:'Tires 29"',  label:'29" MTB Tires',     emoji:'🔘', desc:'Trail, enduro, XC — all brands' },
        { search:'Tires 700C', label:'700C Road/Gravel',   emoji:'🔘', desc:'Road, gravel, commuter tires' },
        { search:'Tires 27',   label:'27.5" Tires',        emoji:'🔘', desc:'27.5" mountain & trail tires' },
        { search:'Tires 26',   label:'26" Tires',          emoji:'🔘', desc:'26 inch, fat bike, kids' },
        { search:'Fatbike',    label:'Fat Bike Tires',     emoji:'🔘', desc:'4"+ tires for snow & sand' },
      ]
    },
    {
      heading: 'Tubes & Sealing',
      tiles: [
        { search:'Tubes',        label:'Inner Tubes',       emoji:'🫧', desc:'All wheel sizes, all valve types' },
        { search:'Tire Sealant', label:'Tubeless Sealant',  emoji:'🫙', desc:'Stan\'s, Orange Seal, and more' },
        { search:'Tire Protect', label:'Tire Protection',   emoji:'🛡️', desc:'Inserts, liners, flat protection' },
      ]
    },
    {
      heading: 'Drivetrain Parts',
      tiles: [
        { search:'Chains',    label:'Drive Chains',    emoji:'🔗', desc:'8–12 speed, all brands' },
        { search:'Cables',    label:'Cables & Housing',emoji:'〰️', desc:'Shift & brake cables, housing' },
        { search:'Cassette',  label:'Cassettes',       emoji:'⚙️', desc:'Road, MTB, all speeds' },
      ]
    },
    {
      heading: 'Brake & Cockpit',
      tiles: [
        { search:'Brake pads', label:'Brake Pads',  emoji:'🛑', desc:'Hydraulic, mechanical, all brands' },
        { search:'Bar tape',   label:'Bar Tape',    emoji:'🌀', desc:'Cork, foam, synthetic wrap' },
        { search:'Grips',      label:'Grips',       emoji:'✊', desc:'Lock-on, ergonomic, foam grips' },
      ]
    },
    {
      heading: 'Maintenance',
      tiles: [
        { search:'Lube',    label:'Chain Lube',   emoji:'🫙', desc:'Wet, dry, wax-based lubes' },
        { search:'Degrease',label:'Degreasers',   emoji:'🧴', desc:'Chain clean, degreaser sprays' },
        { search:'Pumps',   label:'Pumps',        emoji:'💨', desc:'Floor pumps, mini pumps, CO₂' },
      ]
    },
  ];
  const go = (search) => window.cl.go('store', { search });
  const doSearch = () => { if (q.trim().length >= 2) window.cl.go('store', { search: q.trim() }); };
  return (
    <div className="page-fade">
      <SubHero eyebrow="Parts  /  In Stock" title="Parts." italic="Keep it rolling." />
      <section style={{ background:'var(--white)', padding:'60px 0 100px' }}>
        <div className="container-wide">
          {/* Search */}
          <div style={{ maxWidth:600, margin:'0 auto 56px', display:'flex', gap:0, border:'1px solid var(--hairline)', background:'var(--paper)' }}>
            <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()}
              placeholder="Search tires, tubes, chains, brake pads…"
              style={{ flex:1, padding:'16px 20px', border:'none', outline:'none', fontFamily:'var(--body)', fontSize:15, background:'transparent', color:'var(--black)' }} />
            <button onClick={doSearch} style={{ padding:'0 24px', background:'var(--black)', color:'var(--white)', border:'none', cursor:'pointer', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', flexShrink:0 }}>Search</button>
          </div>
          {/* Sectioned category grid */}
          {sections.map(sec => (
            <div key={sec.heading} style={{ marginBottom:56 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:12, paddingBottom:10, borderBottom:'1px solid var(--hairline)' }}>{sec.heading}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:2 }}>
                {sec.tiles.map(c => (
                  <button key={c.label} onClick={()=>go(c.search)} data-cursor="link"
                    style={{ display:'flex', alignItems:'center', gap:16, padding:'20px 20px', background:'var(--paper)', border:'none', cursor:'pointer', textAlign:'left', transition:'background .15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='var(--black)';e.currentTarget.querySelector('.cat-label').style.color='var(--white)';e.currentTarget.querySelector('.cat-desc').style.color='rgba(255,255,255,0.45)';e.currentTarget.querySelector('.cat-arr').style.color='var(--white)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='var(--paper)';e.currentTarget.querySelector('.cat-label').style.color='var(--black)';e.currentTarget.querySelector('.cat-desc').style.color='var(--gray-500)';e.currentTarget.querySelector('.cat-arr').style.color='var(--gray-400)';}}>
                    <span style={{ fontSize:24, lineHeight:1, flexShrink:0 }}>{c.emoji}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="cat-label" style={{ fontFamily:'var(--display)', fontSize:14, fontWeight:500, textTransform:'uppercase', letterSpacing:'-.01em', marginBottom:3, color:'var(--black)', transition:'color .15s' }}>{c.label}</div>
                      <div className="cat-desc" style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--gray-500)', lineHeight:1.5, transition:'color .15s' }}>{c.desc}</div>
                    </div>
                    <span className="cat-arr" style={{ color:'var(--gray-400)', transition:'color .15s', flexShrink:0 }}><ArrowRight size={10} /></span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ marginTop:32, textAlign:'center', padding:'40px 0', borderTop:'1px solid var(--hairline)' }}>
            <div className="eyebrow" style={{ marginBottom:12 }}>Need something specific?</div>
            <p style={{ fontSize:15, color:'var(--gray-500)', marginBottom:24, maxWidth:440, margin:'0 auto 24px' }}>We stock consumables for all major brands. If we don't have it, we can order it.</p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <a href="tel:2508601968" className="btn btn-outline" data-cursor="link">Call (250) 860-1968</a>
              <button className="btn" data-cursor="link" onClick={()=>window.cl.go('contact')}>Contact Us <ArrowRight /></button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ── Components Landing Page ──────────────────────────────────────────────────
const ComponentsLandingPage = () => {
  const [q, setQ] = React.useState('');
  const cats = [
    { id:'drivetrain', label:'Drivetrain',    emoji:'⚙️', desc:'Cassettes, chains, cranks, derailleurs, shifters, cables, bottom brackets' },
    { id:'brakes',     label:'Brakes',        emoji:'🔴', desc:'Hydraulic & mechanical disc brakes, pads, levers, rotors, adapters' },
    { id:'wheels',     label:'Wheels & Tires',emoji:'⭕', desc:'Wheelsets, rims, hubs, spokes, tires, tubes, sealant, axles' },
    { id:'cockpit',    label:'Cockpit',       emoji:'🎛️', desc:'Handlebars, stems, grips, saddles, seatposts, headsets, bar tape' },
    { id:'suspension', label:'Suspension',    emoji:'🔩', desc:'Forks, rear shocks, fork oil, seals, bushings, fork parts' },
  ];
  const counts = useTabCounts(cats.map(c => c.id));
  const go = (id) => window.cl.go('components', { tab: id });
  const search = () => { if (q.trim().length >= 2) window.cl.go('components', { tab: 'drivetrain', search: q.trim() }); };
  return (
    <div className="page-fade">
      <SubHero eyebrow="Components  /  In Stock" title="Components." italic="Everything your bike needs." />
      <section style={{ background:'var(--white)', padding:'60px 0 100px' }}>
        <div className="container-wide">
          {/* Search */}
          <div style={{ maxWidth:600, margin:'0 auto 64px', display:'flex', gap:0, border:'1px solid var(--hairline)', background:'var(--paper)' }}>
            <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}
              placeholder="Search cassettes, brakes, saddles…"
              style={{ flex:1, padding:'16px 20px', border:'none', outline:'none', fontFamily:'var(--body)', fontSize:15, background:'transparent', color:'var(--black)' }} />
            <button onClick={search} style={{ padding:'0 24px', background:'var(--black)', color:'var(--white)', border:'none', cursor:'pointer', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', flexShrink:0 }}>Search</button>
          </div>
          {/* Category grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:2 }}>
            {cats.map(c => (
              <button key={c.id} onClick={()=>go(c.id)} data-cursor="link"
                style={{ display:'flex', alignItems:'center', gap:24, padding:'32px 28px', background:'var(--paper)', border:'none', cursor:'pointer', textAlign:'left', transition:'background .15s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--black)';e.currentTarget.querySelector('.cat-label').style.color='var(--white)';e.currentTarget.querySelector('.cat-desc').style.color='rgba(255,255,255,0.5)';e.currentTarget.querySelector('.cat-count').style.color='rgba(255,255,255,0.4)';e.currentTarget.querySelector('.cat-arr').style.color='var(--white)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='var(--paper)';e.currentTarget.querySelector('.cat-label').style.color='var(--black)';e.currentTarget.querySelector('.cat-desc').style.color='var(--gray-500)';e.currentTarget.querySelector('.cat-count').style.color='var(--gray-400)';e.currentTarget.querySelector('.cat-arr').style.color='var(--gray-400)';}}>
                <span style={{ fontSize:36, lineHeight:1, flexShrink:0 }}>{c.emoji}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="cat-label" style={{ fontFamily:'var(--display)', fontSize:18, fontWeight:500, textTransform:'uppercase', letterSpacing:'-.01em', marginBottom:4, color:'var(--black)', transition:'color .15s' }}>{c.label}</div>
                  <div className="cat-count" style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:4, transition:'color .15s' }}>
                    {counts[c.id] === null ? <span style={{ opacity:.4 }}>Loading…</span> : `${counts[c.id]} in stock`}
                  </div>
                  <div className="cat-desc" style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--gray-500)', lineHeight:1.6, transition:'color .15s' }}>{c.desc}</div>
                </div>
                <span className="cat-arr" style={{ color:'var(--gray-400)', transition:'color .15s', flexShrink:0 }}><ArrowRight /></span>
              </button>
            ))}
          </div>
          <div style={{ marginTop:64, textAlign:'center', padding:'48px 0', borderTop:'1px solid var(--hairline)' }}>
            <div className="eyebrow" style={{ marginBottom:12 }}>Can't find what you need?</div>
            <p style={{ fontSize:15, color:'var(--gray-500)', marginBottom:24, maxWidth:440, margin:'0 auto 24px' }}>We stock 7,000+ products and can special order almost anything — usually here within a few days.</p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <a href="tel:2508601968" className="btn btn-outline" data-cursor="link">Call (250) 860-1968</a>
              <button className="btn" data-cursor="link" onClick={()=>window.cl.go('contact')}>Contact Us <ArrowRight /></button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ── Accessories Landing Page ──────────────────────────────────────────────────
const AccessoriesLandingPage = () => {
  const [q, setQ] = React.useState('');
  const cats = [
    { id:'fit',   label:'Clothing & Gear',    emoji:'🪖', desc:'Helmets, gloves, shoes, jerseys, arm warmers, sunglasses, armour' },
    { id:'tools', label:'Tools & Maintenance',emoji:'🔧', desc:'Pumps, workshop tools, lube, degreasers' },
    { id:'bags',  label:'Bags & Hydration',   emoji:'🎒', desc:'Bags, backpacks, hydration packs, water bottles' },
    { id:'lights',label:'Lights & Computers', emoji:'💡', desc:'Bike lights, cycling computers, GPS units' },
    { id:'locks', label:'Locks',              emoji:'🔒', desc:'Cable locks, U-locks, chain locks' },
    { id:'racks', label:'Racks & Fenders',    emoji:'🚲', desc:'Bike racks, fenders, kickstands, bells, mirrors' },
  ];
  const counts = useTabCounts(cats.map(c => c.id));
  const go = (id) => window.cl.go('accessories', { tab: id });
  const search = () => { if (q.trim().length >= 2) window.cl.go('accessories', { tab: 'fit', search: q.trim() }); };
  return (
    <div className="page-fade">
      <SubHero eyebrow="Accessories  /  In Stock" title="Accessories." italic="Gear up, ride ready." />
      <section style={{ background:'var(--white)', padding:'60px 0 100px' }}>
        <div className="container-wide">
          {/* Search */}
          <div style={{ maxWidth:600, margin:'0 auto 64px', display:'flex', gap:0, border:'1px solid var(--hairline)', background:'var(--paper)' }}>
            <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}
              placeholder="Search helmets, lights, locks, tools…"
              style={{ flex:1, padding:'16px 20px', border:'none', outline:'none', fontFamily:'var(--body)', fontSize:15, background:'transparent', color:'var(--black)' }} />
            <button onClick={search} style={{ padding:'0 24px', background:'var(--black)', color:'var(--white)', border:'none', cursor:'pointer', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', flexShrink:0 }}>Search</button>
          </div>
          {/* Category grid — 3 full-width cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:2 }}>
            {cats.map(c => (
              <button key={c.id} onClick={()=>go(c.id)} data-cursor="link"
                style={{ display:'flex', alignItems:'center', gap:24, padding:'40px 28px', background:'var(--paper)', border:'none', cursor:'pointer', textAlign:'left', transition:'background .15s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--black)';e.currentTarget.querySelector('.cat-label').style.color='var(--white)';e.currentTarget.querySelector('.cat-desc').style.color='rgba(255,255,255,0.5)';e.currentTarget.querySelector('.cat-count').style.color='rgba(255,255,255,0.4)';e.currentTarget.querySelector('.cat-arr').style.color='var(--white)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='var(--paper)';e.currentTarget.querySelector('.cat-label').style.color='var(--black)';e.currentTarget.querySelector('.cat-desc').style.color='var(--gray-500)';e.currentTarget.querySelector('.cat-count').style.color='var(--gray-400)';e.currentTarget.querySelector('.cat-arr').style.color='var(--gray-400)';}}>
                <span style={{ fontSize:40, lineHeight:1, flexShrink:0 }}>{c.emoji}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="cat-label" style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:500, textTransform:'uppercase', letterSpacing:'-.01em', marginBottom:4, color:'var(--black)', transition:'color .15s' }}>{c.label}</div>
                  <div className="cat-count" style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:4, transition:'color .15s' }}>
                    {counts[c.id] === null ? <span style={{ opacity:.4 }}>Loading…</span> : `${counts[c.id]} in stock`}
                  </div>
                  <div className="cat-desc" style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--gray-500)', lineHeight:1.6, transition:'color .15s' }}>{c.desc}</div>
                </div>
                <span className="cat-arr" style={{ color:'var(--gray-400)', transition:'color .15s', flexShrink:0 }}><ArrowRight /></span>
              </button>
            ))}
          </div>
          <div style={{ marginTop:64, textAlign:'center', padding:'48px 0', borderTop:'1px solid var(--hairline)' }}>
            <div className="eyebrow" style={{ marginBottom:12 }}>Don't see what you're after?</div>
            <p style={{ fontSize:15, color:'var(--gray-500)', marginBottom:24, maxWidth:440, margin:'0 auto 24px' }}>We stock 7,000+ products. If it's not on the shelf, we can order it — usually a few days out.</p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <a href="tel:2508601968" className="btn btn-outline" data-cursor="link">Call (250) 860-1968</a>
              <button className="btn" data-cursor="link" onClick={()=>window.cl.go('contact')}>Contact Us <ArrowRight /></button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

Object.assign(window, { ShopPage, ServicesPage, BookPage, AboutPage, RidesPage, TrailsPage, ContactPage, GiftCardsPage, PartsPage, PartsLandingPage, ComponentsLandingPage, AccessoriesLandingPage, StorePage, ClassifiedsPage, BrandPage, BikeCardLarge, SubHero, SHOP_BIKES, TermsPage, PrivacyPage, PART_TABS, WarrantyPage, DemoPage, FittingPage, StoragePage, SocialPage });

// EVENTS & CLINICS PAGE
const EventsPage = () => {
  const WORKER = "https://still-term-f1ec.taocaruso77.workers.dev";

  const MCGEE_CLINICS = [
    { tag:"Adult · All Levels", name:"Adult Skills Clinic",
      desc:"Six progressive sessions covering descending, jumping, climbing, cornering, and bike maintenance. Runs July and August across Knox, Crawford, Gillard, SilverStar, and more. All levels welcome — beginner to advanced.",
      details:"6 sessions · $600 · Drop-ins available", url:"https://mcgeecycle.com/adultskillclinic" },
    { tag:"Youth · Ages 7–14", name:"Skills Camp",
      desc:"Mon–Fri summer camp led by PMBIA-certified coaches including pro rider Will Curry. Skill sessions, trail exploration, games, and bike maintenance workshops. Small coach-to-rider ratios. Six weeks July and August.",
      details:"Mon–Fri · 10 AM–3:30 PM · Drop-ins available", url:"https://mcgeecycle.com/skills-camp" },
  ];

  const STATIC_EVENTS = [
    { title:"Smith Creek Enduro", dateLabel:"Summer 2026", tag:"Race", location:"Smith Creek, West Kelowna",
      desc:"ChainLine-supported enduro race at Smith Creek. Timed stages through some of the best trails in the area. Registration details coming — follow our Instagram for updates.", url:"https://instagram.com/ChainLineCycle" },
  ];
  const [calEvents, setCalEvents] = React.useState(null);
  React.useEffect(() => {
    fetch(`${WORKER}/api/calendar`)
      .then(r => r.json())
      .then(d => { if (d.events && d.events.length > 0) setCalEvents(d.events); })
      .catch(() => {});
  }, []);
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-CA", { month:"short", day:"numeric", year:"numeric" }) : "";
  const events = calEvents
    ? calEvents.map(e => ({ title:e.title, dateLabel:fmtDate(e.start), tag:"Event", location:e.location, desc:e.desc, url:e.url }))
    : STATIC_EVENTS;

  return (
    <div className="page-fade" data-screen-label="P Events">
      <SubHero eyebrow="Community  /  N°02" title="Events &" italic="Clinics." sub="Skill clinics with McGee Cycle and upcoming ChainLine events." />

      {/* ── McGee Cycle clinics ── */}
      <section className="section section-pad bg-white">
        <div className="container-wide">
          <div className="reveal" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:64, flexWrap:"wrap", gap:24 }}>
            <div>
              <div className="section-label">Skill Clinics  /  N°01</div>
              <h2 className="display-xl">Learn to<br/><span className="serif-italic">ride better.</span></h2>
            </div>
            <p style={{ maxWidth:400, fontSize:15, color:"var(--gray-500)", lineHeight:1.7 }}>
              We partner with <strong>McGee Cycle</strong> — Kelowna's dedicated MTB coaching program. PMBIA-certified coaches, small groups, real trails.
            </p>
          </div>
          <div className="mcgee-clinics-grid" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:24 }}>
            {MCGEE_CLINICS.map((c, i) => (
              <a key={i} href={c.url} target="_blank" rel="noopener" data-cursor="link"
                className={"reveal reveal-d-" + (i+1)}
                style={{ display:"flex", flexDirection:"column", gap:16, padding:40, border:"1px solid var(--hairline)", textDecoration:"none", color:"inherit", transition:"border-color .2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor="var(--black)"}
                onMouseLeave={e => e.currentTarget.style.borderColor="var(--hairline)"}>
                <div className="eyebrow">{c.tag}</div>
                <div style={{ fontFamily:"var(--display)", fontSize:"clamp(22px,2.5vw,32px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", lineHeight:1.1 }}>{c.name}</div>
                <p style={{ fontSize:15, lineHeight:1.75, color:"var(--gray-600)", flex:1, margin:0 }}>{c.desc}</p>
                <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-400)" }}>{c.details}</div>
                <div style={{ display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-500)" }}>
                  Book at mcgeecycle.com <ArrowRight size={9} />
                </div>
              </a>
            ))}
          </div>
          <div className="reveal" style={{ marginTop:32, padding:"24px 32px", background:"var(--paper)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:24, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontFamily:"var(--display)", fontSize:16, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", marginBottom:4 }}>McGee Cycle</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-500)" }}>mcgeecycle@gmail.com  ·  (289) 775-2233</div>
            </div>
            <a href="https://mcgeecycle.com" target="_blank" rel="noopener" className="btn btn-outline" data-cursor="link">Visit mcgeecycle.com <ArrowRight /></a>
          </div>
        </div>
      </section>

      {/* ── Upcoming events (synced from Google Calendar) ── */}
      <section className="section section-pad bg-black">
        <div className="container-wide">
          <div className="reveal" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:56, flexWrap:"wrap", gap:24 }}>
            <div>
              <div className="section-label" style={{ color:"var(--gray-300)" }}>Upcoming Events  /  N°02</div>
              <h2 className="display-xl">What's<br/><span className="serif-italic">coming up.</span></h2>
            </div>
            <a href="https://instagram.com/ChainLineCycle" target="_blank" rel="noopener"
              className="btn btn-outline-light" data-cursor="link">Follow for updates <ArrowRight /></a>
          </div>
          <div style={{ borderTop:"1px solid var(--hairline-light)" }}>
            {events.map((e, i) => (
              <a key={i} href={e.url || "#"} target={e.url ? "_blank" : undefined} rel="noopener" data-cursor="link"
                className="reveal"
                style={{ display:"grid", gridTemplateColumns:"160px 1fr", gap:32, padding:"32px 0", borderBottom:"1px solid var(--hairline-light)", alignItems:"start", textDecoration:"none", color:"inherit" }}>
                <div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-300)", marginBottom:8 }}>{e.dateLabel}</div>
                  <span className="pill" style={{ background:"rgba(255,255,255,0.08)", borderColor:"rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.65)", fontSize:9 }}>{e.tag}</span>
                </div>
                <div>
                  <div style={{ fontFamily:"var(--display)", fontSize:"clamp(20px,2.5vw,28px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", marginBottom:8 }}>{e.title}</div>
                  {e.location && <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-400)", marginBottom:10 }}>{e.location}</div>}
                  <p style={{ fontSize:14, color:"var(--gray-300)", lineHeight:1.75, margin:0 }}>{e.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
window.EventsPage = EventsPage;

// MTBCO PAGE
const MTBCOPage = () => {
  const R2 = "https://still-term-f1ec.taocaruso77.workers.dev/r2";
  const sponsored = [
    { name:"Lost Lake Loop",  tf:"https://www.trailforks.com/region/gillard/",    img:`${R2}/lifestyle/trail-forest.jpg`, note:"A flowing natural trail through the trees with lake views — one of the most scenic loops in the Gillard network." },
    { name:"Pink Highway",    tf:"https://www.trailforks.com/region/gillard/",    img:`${R2}/lifestyle/trail-pines.jpg`,  note:"Fast, fun, and approachable. Pink Highway is a crowd favourite that gives back more than it takes. Perfect intro to Gillard." },
  ];
  return (
    <div className="page-fade" data-screen-label="P MTBCO">
      <SubHero eyebrow="Community  /  N°03" title="MTBCO." italic="Building trails since the beginning." sub="Mountain Bike Club Okanagan — the crew that builds and maintains the trails we all ride." />

      {/* Who they are */}
      <section className="section section-pad bg-white">
        <div className="container-wide">
          <div className="home-2col reveal" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"start" }}>
            <div>
              <div className="section-label" style={{ marginBottom:32 }}>About MTBCO</div>
              <h2 className="display-l" style={{ marginBottom:28 }}>Volunteers who<br/><span className="serif-italic">build the trails.</span></h2>
              <p style={{ fontSize:16, lineHeight:1.75, color:"var(--gray-600)", marginBottom:20 }}>
                The Mountain Bike Club Okanagan is the grassroots organization behind many of Kelowna's best singletrack trails. From initial planning and permitting through to dig days, drainage fixes, and ongoing maintenance — MTBCO members put in the hours that make the trails possible.
              </p>
              <p style={{ fontSize:16, lineHeight:1.75, color:"var(--gray-600)", marginBottom:32 }}>
                ChainLine Cycle is proud to sponsor MTBCO and support their work in the Okanagan. We stock their merchandise in store and regularly send staff to dig days. If you ride local trails, MTBCO built them.
              </p>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <a href="https://mtbco.ca" target="_blank" rel="noopener" className="btn" data-cursor="link">Visit MTBCO <ArrowRight /></a>
                <a href="https://mtbco.ca/membership" target="_blank" rel="noopener" className="btn btn-outline" data-cursor="link">Join / Donate <ArrowRight /></a>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
              {[
                { n:"Trail Advocacy", d:"MTBCO works with the City of Kelowna, West Kelowna, and regional parks to plan, permit, and protect access to mountain bike trails." },
                { n:"Trail Building",  d:"Volunteer dig days throughout the season. Bring your tools and your lunch — MTBCO supplies the experience and the vision." },
                { n:"Trail Maintenance", d:"Drainage, pruning, erosion repair, and feature upkeep after every heavy rain and freeze-thaw cycle." },
                { n:"Youth Programs",   d:"Working with schools and youth groups to introduce the next generation to trail building and responsible riding." },
              ].map((s, i) => (
                <div key={i} className="reveal" style={{ paddingBottom:20, borderBottom:"1px solid var(--hairline)" }}>
                  <div style={{ fontFamily:"var(--display)", fontSize:16, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.005em", marginBottom:8 }}>{s.n}</div>
                  <p style={{ fontSize:14, color:"var(--gray-500)", lineHeight:1.7, margin:0 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sponsored trails */}
      <section className="section section-pad bg-paper">
        <div className="container-wide">
          <div className="reveal" style={{ marginBottom:56 }}>
            <div className="section-label">ChainLine Sponsored Trails</div>
            <h2 className="display-l">Our trails.<br/><span className="serif-italic">Built together.</span></h2>
          </div>
          <div className="home-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 }}>
            {sponsored.map((t, i) => (
              <a key={i} href={t.tf} target="_blank" rel="noopener" data-cursor="link"
                className={"reveal reveal-d-" + (i+1)}
                style={{ display:"block", textDecoration:"none", color:"inherit" }}>
                <div style={{ aspectRatio:"4/3", marginBottom:20, overflow:"hidden", position:"relative" }}>
                  <img src={t.img} alt={t.name}
                    loading="lazy" decoding="async" style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .5s ease" }}
                    onMouseEnter={e => e.currentTarget.style.transform="scale(1.04)"}
                    onMouseLeave={e => e.currentTarget.style.transform="scale(1)"} />
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 55%)" }} />
                </div>
                <div className="display-s" style={{ marginBottom:10 }}>{t.name}</div>
                <p className="serif-italic" style={{ fontSize:15, lineHeight:1.6, color:"var(--gray-600)", marginBottom:12 }}>"{t.note}"</p>
                <span style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)", display:"inline-flex", alignItems:"center", gap:6 }}>
                  View on Trailforks <ArrowRight size={9} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Get involved */}
      <section className="section section-pad bg-black">
        <div className="container-narrow" style={{ textAlign:"center" }}>
          <div className="reveal">
            <div className="section-label" style={{ justifyContent:"center", color:"var(--gray-300)", marginBottom:24 }}>Get Involved</div>
            <h3 className="display-l" style={{ marginBottom:20 }}>Show up to<br/><span className="serif-italic">a dig day.</span></h3>
            <p style={{ fontSize:15, color:"var(--gray-300)", maxWidth:480, margin:"0 auto 40px", lineHeight:1.7 }}>
              MTBCO posts dig days on their website and socials throughout the season. No experience required — just show up with gloves and a shovel. The trails you ride get better every time someone does.
            </p>
            <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
              <a href="https://mtbco.ca" target="_blank" rel="noopener" className="btn btn-light" data-cursor="link">MTBCO Website <ArrowRight /></a>
              <a href="https://mtbco.ca/membership" target="_blank" rel="noopener" className="btn btn-outline-light" data-cursor="link">Become a Member <ArrowRight /></a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
window.MTBCOPage = MTBCOPage;
