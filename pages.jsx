// ChainLine — Sub-pages

// ── Bike specs generator ──────────────────────────────────────
const getBikeSpecs = (b) => {
  const price = b.price || 0;
  const type  = (b.type || b.rawType || '').toLowerCase();
  const isMTB    = type === 'Mountain';
  const isGravel = type === 'Gravel';
  const isEBike  = type === 'E-Bike';
  const tags = (b.tags || '').toLowerCase();
  const wheelSize = tags.includes('27.5') ? '27.5"' : tags.includes('29') ? '29"' : isMTB ? '29"' : '700c';

  let fork, drivetrain, brakes, frame;
  if (price >= 7000) {
    frame = b.vendor + ' Carbon, full-suspension';
    fork = 'Fox Factory 36, 150mm travel, GRIP2 damper';
    drivetrain = 'SRAM XX1 Eagle AXS, 12-speed wireless';
    brakes = 'SRAM Code RSC hydraulic disc, 200/180mm';
  } else if (price >= 4000) {
    frame = b.vendor + ' Alloy / Carbon, full-suspension';
    fork = 'RockShox Pike Select+, 140mm travel';
    drivetrain = 'SRAM GX Eagle, 12-speed';
    brakes = 'SRAM G2 R hydraulic disc, 200/180mm';
  } else if (price >= 2000) {
    frame = b.vendor + ' Series 3 Aluminum';
    fork = isMTB ? 'RockShox Recon Silver, 120mm travel' : 'Carbon rigid, tapered steerer';
    drivetrain = 'Shimano Deore XT, 12-speed';
    brakes = 'Shimano MT420 hydraulic disc, 180/160mm';
  } else if (price >= 1000) {
    frame = b.vendor + ' Series 2 Aluminum';
    fork = isMTB ? 'SR Suntour XCR, 100mm travel' : 'Alloy rigid fork';
    drivetrain = 'Shimano Deore, 10-speed';
    brakes = 'Shimano MT200 hydraulic disc, 180/160mm';
  } else {
    frame = b.vendor + ' Series 1 Aluminum';
    fork = isMTB ? 'SR Suntour XCT, 80mm travel' : 'Alloy rigid fork';
    drivetrain = 'Shimano Altus / Acera, 8-speed';
    brakes = 'Tektro Auriga hydraulic disc, 160mm';
  }

  return [
    { label: 'Frame',      value: frame },
    { label: 'Fork',       value: fork },
    { label: 'Drivetrain', value: drivetrain },
    { label: 'Brakes',     value: brakes },
    { label: 'Wheel Size', value: wheelSize },
    { label: 'Bike Type',  value: b.type || b.rawType || 'Bicycle' },
    { label: 'Weight',     value: price >= 5000 ? '~10.5 kg' : price >= 2000 ? '~12.8 kg' : '~14.5 kg' },
    { label: 'Colours',    value: 'See in store for colour options' },
    { label: 'Warranty',   value: '2-year frame & fork, 1-year components' },
  ];
};

const getBikeDescription = (b) => {
  const vendor = b.vendor || b.brand || '';
  const name   = b.name || b.title || '';
  const type   = b.type || '';
  if (type === 'Mountain')
    return `The ${vendor} ${name} is built for the trails around Kelowna and the Okanagan. Whether you're lapping Knox Mountain, exploring Bear Creek, or heading into the backcountry — this bike is ready. Spec'd for performance at every price point, backed by ChainLine's expert service team.`;
  if (type === 'Gravel')
    return `The ${vendor} ${name} is your ticket to everything the Okanagan has to offer. Gravel roads, forest service tracks, loaded touring — it handles it all with confidence. Built for riders who want to explore beyond the pavement.`;
  if (type === 'E-Bike')
    return `The ${vendor} ${name} brings intelligent e-assist to your daily rides. Commuting, exploring, or just going further with less effort — this bike opens up more of Kelowna without breaking a sweat. Full-power assist with a natural ride feel.`;
  if (type === 'Commuter')
    return `The ${vendor} ${name} is built for getting around Kelowna efficiently and comfortably. Whether you're commuting to work, running errands, or exploring the Mission Creek Greenway — it's reliable, low-maintenance, and ready every day.`;
  if (type === 'Comfort')
    return `The ${vendor} ${name} is designed for riders who want a comfortable, relaxed ride. Upright geometry, cushioned saddle, and smooth-rolling tyres — perfect for the Okanagan Rail Trail, beach cruises, and easy weekend rides.`;
  if (type === 'Kids')
    return `The ${vendor} ${name} is built to grow young riders' confidence and love of cycling. Lightweight, properly sized, with quality components that make learning to ride easier and more fun. Because good bikes matter at every age.`;
  return `The ${vendor} ${name} is a versatile, capable bike for riding in and around Kelowna. Quality components, solid performance, and backed by ChainLine's expert service team since 2009.`;
};

// ── Bike Detail Page ──────────────────────────────────────────
const BikePage = ({ bike, onBack, onCart }) => {
  const [adding, setAdding] = React.useState(false);
  const [added, setAdded]   = React.useState(false);

  const b = bike || {};
  const specs = getBikeSpecs(b);
  const desc  = getBikeDescription(b);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await window.clAddToCart(b.handle, b.name || b.title, b.price, b.img);
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
          <span className="eyebrow">{b.vendor}  ·  {b.type}</span>
        </div>
      </div>

      {/* Main layout */}
      <div className="container-wide bike-page-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, paddingTop: 64, paddingBottom: 100 }}>

        {/* Image */}
        <div style={{ position: 'sticky', top: 140, height: 'fit-content' }}>
          <div style={{ background: 'var(--paper)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {b.img
              ? <img src={b.img} alt={b.name || b.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8%' }} />
              : <div className="ph ph-corners" style={{ width: '100%', height: '100%' }}><span className="ph-label">{(b.vendor||'').toUpperCase()}  ·  BIKE PHOTO</span></div>
            }
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="eyebrow reveal" style={{ marginBottom: 12 }}>{b.vendor}</div>
          <h1 className="display-l reveal" style={{ marginBottom: 8 }}>{b.name || b.title}</h1>
          <div className="reveal" style={{ fontFamily: 'var(--display)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 500, marginBottom: 32 }}>
            ${(b.price || 0).toLocaleString()} CAD
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
];

// SHOP
const ShopPage = () => {
  const intent = (window.cl && window.cl.intent) || null;
  const [brand, setBrand]   = React.useState((intent && intent.brand) || "All");
  const [type, setType]     = React.useState((intent && intent.type)  || "All");
  const [sort, setSort]     = React.useState("featured");
  const [saleOnly, setSale] = React.useState(false);

  React.useEffect(() => { if (window.cl) window.cl.intent = null; }, []);

  const ALL_BRANDS = ["Marin","Transition","Surly","Salsa","Pivot","Bianchi","Moots"];
  const TYPES = [
    { label:"All",      match: () => true },
    { label:"Mountain", match: b => b.type === "Mountain" },
    { label:"Gravel",   match: b => b.type === "Gravel" },
    { label:"E-Bike",   match: b => b.type === "E-Bike" },
    { label:"Commuter", match: b => b.type === "Commuter" },
    { label:"Comfort",  match: b => b.type === "Comfort" },
    { label:"Kids",     match: b => b.type === "Kids" },
  ];

  const matchType = TYPES.find(t => t.label === type) || TYPES[0];

  let filtered = SHOP_BIKES
    .filter(b => (brand === "All" || b.brand === brand) && matchType.match(b));

  if (sort === "price-asc")  filtered = [...filtered].sort((a,b) => a.price - b.price);
  if (sort === "price-desc") filtered = [...filtered].sort((a,b) => b.price - a.price);

  const btnBase = { fontFamily:"var(--display)", fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", border:"1.5px solid", transition:"all .25s", cursor:"pointer" };

  return (
    <div className="page-fade">
      <SubHero eyebrow="Shop  /  All Bikes" title="The Bikes." italic="Performance for every terrain." />

      {/* ── Sticky filter bar ── */}
      <div style={{ position:"sticky", top:78, zIndex:50, background:"rgba(250,250,250,0.97)", backdropFilter:"blur(12px)", borderBottom:"1px solid var(--hairline)" }}>

        {/* Row 1 — special + brands */}
        <div className="container-wide" style={{ padding:"18px 0 0", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {/* All Bikes */}
          <button onClick={() => { setBrand("All"); setType("All"); setSale(false); }} data-cursor="link"
            style={{ ...btnBase, padding:"10px 20px", fontSize:13, background: brand==="All"&&type==="All"&&!saleOnly ? "var(--black)" : "transparent", color: brand==="All"&&type==="All"&&!saleOnly ? "var(--white)" : "var(--black)", borderColor: brand==="All"&&type==="All"&&!saleOnly ? "var(--black)" : "var(--hairline)" }}>
            All Bikes
          </button>
          {/* Sale Bikes */}
          <button onClick={() => { setSale(true); setBrand("All"); setType("All"); }} data-cursor="link"
            style={{ ...btnBase, padding:"10px 20px", fontSize:13, background:saleOnly?"var(--black)":"transparent", color:saleOnly?"var(--white)":"var(--black)", borderColor:saleOnly?"var(--black)":"var(--hairline)" }}>
            Sale Bikes
          </button>

          <div style={{ width:1, height:28, background:"var(--hairline)", margin:"0 8px" }} />

          {/* Brand chips */}
          {ALL_BRANDS.map(br => {
            const active = brand === br && !saleOnly;
            const count  = SHOP_BIKES.filter(b => b.brand === br).length;
            return (
              <button key={br} onClick={() => { setBrand(br); setSale(false); }} data-cursor="link"
                style={{ ...btnBase, padding:"10px 18px", fontSize:13, background:active?"var(--black)":"transparent", color:active?"var(--white)":"var(--black)", borderColor:active?"var(--black)":"var(--hairline)", display:"flex", alignItems:"center", gap:8 }}>
                {br}
                {count > 0 && <span style={{ fontFamily:"var(--mono)", fontSize:9, opacity:.6 }}>{count}</span>}
              </button>
            );
          })}

          <div style={{ marginLeft:"auto", fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-500)", paddingRight:4 }}>
            {saleOnly ? "Coming soon" : filtered.length + " bikes"}
          </div>
        </div>

        {/* Row 2 — types + sort */}
        <div className="container-wide" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0 14px", flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", gap:0, flexWrap:"wrap" }}>
            {TYPES.map(t => (
              <button key={t.label} onClick={() => { setType(t.label); setSale(false); }} data-cursor="link"
                style={{ padding:"6px 16px", fontFamily:"var(--mono)", fontSize:11, letterSpacing:".12em", textTransform:"uppercase", background:"transparent", border:"none", color: type===t.label&&!saleOnly ? "var(--black)" : "var(--gray-400)", borderBottom:"2px solid " + (type===t.label&&!saleOnly ? "var(--black)" : "transparent"), transition:"all .2s" }}>
                {t.label}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:".1em", textTransform:"uppercase", border:"1px solid var(--hairline)", padding:"6px 12px", background:"var(--white)", outline:"none" }}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      {/* ── Grid ── */}
      <section style={{ padding:"60px 0 100px", background:"var(--white)" }}>
        <div className="container-wide">
          {saleOnly ? (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div className="display-m" style={{ marginBottom:16 }}>Sale bikes coming soon.</div>
              <p style={{ color:"var(--gray-500)", marginBottom:32 }}>Check back regularly or sign up for our newsletter to be notified of sales and clearance bikes.</p>
              <button className="btn btn-outline" onClick={() => { setSale(false); setBrand("All"); setType("All"); }} data-cursor="link">View All Bikes <ArrowRight /></button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div className="display-m" style={{ marginBottom:16 }}>No bikes found.</div>
              <p style={{ color:"var(--gray-500)", marginBottom:32 }}>We may be getting new {brand !== "All" ? brand : ""} stock in soon — check back or contact us.</p>
              <button className="btn btn-outline" onClick={() => { setBrand("All"); setType("All"); }} data-cursor="link">Show All Bikes <ArrowRight /></button>
            </div>
          ) : (
            <div className="shop-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:40 }}>
              {filtered.map((b, i) => <BikeCardLarge key={b.handle} b={b} idx={i} />)}
            </div>
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

  const name  = b.name  || b.title  || "";
  const brand = b.brand || b.vendor || "";
  const img   = b.img   || b.image  || null;
  const price = b.price || 0;

  const handleAdd = async (e) => {
    e.preventDefault(); e.stopPropagation();
    setAdding(true);
    try {
      await window.clAddToCart(b.handle, name, price, img);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch(err) { console.warn(err); }
    setAdding(false);
  };

  return (
    <div className={"reveal reveal-d-" + (idx % 3 + 1)}>
      {/* Image */}
      <div style={{ aspectRatio:"4/5", marginBottom:16, position:"relative", background:"var(--paper)", overflow:"hidden" }}>
        {img ? (
          <img src={img} alt={brand + " " + name}
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain", padding:"8%", mixBlendMode:"multiply" }}
            onError={e => { e.target.style.display='none'; }} />
        ) : (
          <div className="ph ph-corners" style={{ position:"absolute", inset:0 }}>
            <span className="ph-label">{brand.toUpperCase()}  ·  {b.type}</span>
          </div>
        )}
        {b.badge && (
          <div style={{ position:"absolute", top:12, right:12, padding:"4px 10px", background:"var(--black)", color:"var(--white)", fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase" }}>{b.badge}</div>
        )}
      </div>
      {/* Info */}
      <div className="eyebrow" style={{ marginBottom:4 }}>{brand}  ·  {b.type}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:12 }}>
        <div style={{ fontFamily:"var(--display)", fontSize:"clamp(16px,1.5vw,20px)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", lineHeight:1.2 }}>{name}</div>
        <div style={{ fontFamily:"var(--display)", fontSize:16, fontWeight:500, flexShrink:0 }}>${price.toLocaleString()}</div>
      </div>
      {/* Actions */}
      <div style={{ display:"flex", gap:8 }}>
        <button className="btn btn-outline" data-cursor="link"
          onClick={() => window.cl.go("bike", { bike: b })}
          style={{ flex:1, justifyContent:"center", padding:"12px 8px", fontSize:11 }}>
          View Bike
        </button>
        <button className="btn" data-cursor="link"
          onClick={handleAdd} disabled={adding}
          style={{ flex:1, justifyContent:"center", padding:"12px 8px", fontSize:11 }}>
          {added ? "Added ✓" : adding ? "…" : "Add to Cart"}
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
  const services = [
    { n: "01", name: "Basic Tune-Up", price: 89, desc: "Adjustments, lube, safety check. Same-day turnaround.", time: "SAME DAY" },
    { n: "02", name: "Drivetrain Service", price: 145, desc: "Cassette, chain, derailleurs cleaned, tuned, lubed.", time: "1–2 DAYS" },
    { n: "03", name: "Full Overhaul", price: 425, desc: "Complete teardown, clean, regrease, rebuild.", time: "3–5 DAYS" },
    { n: "04", name: "Brake Service (Hydraulic)", price: 95, desc: "Bleed, pad replacement, rotor true. Per wheel.", time: "SAME DAY" },
    { n: "05", name: "Suspension Service", price: 220, desc: "Lower-leg or full damper service. Fork or shock.", time: "1 WEEK" },
    { n: "06", name: "Wheel True & Tension", price: 65, desc: "Hand-trued, tensioned, dished. Per wheel.", time: "SAME DAY" },
    { n: "07", name: "Tubeless Setup", price: 55, desc: "Per wheel. Includes valves and sealant.", time: "SAME DAY" },
    { n: "08", name: "Custom Build", price: 450, desc: "From frame up. Quoted on consult.", time: "1–2 WEEKS" },
    { n: "09", name: "Pre-Season Inspection", price: 75, desc: "29-point check. Free if booked with tune-up.", time: "30 MIN" },
    { n: "10", name: "Post-Crash Inspection", price: 95, desc: "Frame, fork, wheels, components. Insurance docs.", time: "SAME DAY" },
    { n: "11", name: "Electronic Shifting Setup", price: 120, desc: "Di2 / AXS programming, calibration, firmware.", time: "1–2 DAYS" },
  ];
  return (
    <div className="page-fade" data-screen-label="P03 Services">
      <SubHero eyebrow="Services  /  N°01" title="Your bike deserves" italic="the best." />
      <section className="section section-pad bg-white">
        <div className="container-wide">
          <div className="reveal section-label">Service Menu  /  Pricing</div>
          <div style={{ borderTop: "1px solid var(--hairline)" }}>
            {services.map((s, i) => (
              <div key={i} className={"reveal reveal-d-" + (i % 3 + 1)} style={{ display: "grid", gridTemplateColumns: "60px 1.6fr 2fr 100px 140px 160px", gap: 32, padding: "32px 0", borderBottom: "1px solid var(--hairline)", alignItems: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".18em", color: "var(--gray-500)" }}>{s.n}</div>
                <div className="display-s">{s.name}</div>
                <div style={{ color: "var(--gray-500)", fontSize: 14 }}>{s.desc}</div>
                <div className="eyebrow">{s.time}</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 500 }}>${s.price}</div>
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
  const [type, setType] = React.useState("service");
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({});
  const types = [
    { id: "service", glyph: "⊞", title: "Service", desc: "Tune-ups, repairs, overhauls" },
    { id: "fitting", glyph: "⊟", title: "Fitting", desc: "Bike fit & position analysis" },
    { id: "demo", glyph: "⊕", title: "Demo", desc: "Test ride any bike in our fleet" },
    { id: "storage", glyph: "⊠", title: "Storage", desc: "Winter storage program" },
  ];
  const update = (k, v) => setData({ ...data, [k]: v });
  const next = () => setStep(s => Math.min(s + 1, 5));
  const back = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="page-fade" data-screen-label="P04 Book">
      <SubHero eyebrow="Booking  /  N°01" title="Book your visit." italic="We'll have it ready." />
      <section className="section section-pad bg-white">
        <div className="container-narrow">
          <div className="eyebrow reveal" style={{ marginBottom: 24 }}>Step 1  ·  Choose your visit</div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 80 }}>
            {types.map(t => (
              <button key={t.id} onClick={() => { setType(t.id); setStep(1); }} data-cursor="link" style={{ padding: 32, border: "1px solid " + (type === t.id ? "var(--black)" : "var(--hairline)"), background: type === t.id ? "var(--black)" : "var(--white)", color: type === t.id ? "var(--white)" : "var(--black)", textAlign: "left", aspectRatio: "1", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "all .3s" }}>
                <div style={{ fontSize: 32, fontFamily: "var(--display)" }}>{t.glyph}</div>
                <div>
                  <div className="display-s" style={{ marginBottom: 8 }}>{t.title}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.7 }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Progress */}
          <div className="reveal" style={{ display: "flex", gap: 8, marginBottom: 48 }}>
            {[1,2,3,4,5].map(s => (
              <div key={s} style={{ flex: 1, height: 2, background: s <= step ? "var(--black)" : "var(--hairline)" }} />
            ))}
          </div>
          <div className="eyebrow reveal" style={{ marginBottom: 16 }}>Step {step} of 5</div>

          {step === 1 && (
            <div className="reveal">
              <h2 className="display-l" style={{ marginBottom: 40 }}>What service?</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {["Basic Tune-Up", "Full Overhaul", "Drivetrain", "Brake Service", "Suspension", "Wheel True", "Tubeless Setup", "Custom Build"].map(s => (
                  <button key={s} onClick={() => { update("service", s); next(); }} data-cursor="link" style={{ padding: 24, border: "1px solid var(--hairline)", textAlign: "left", fontFamily: "var(--display)", fontSize: 18, fontWeight: 500, textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {s} <ArrowRight />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="reveal">
              <h2 className="display-l" style={{ marginBottom: 40 }}>Pick a date.</h2>
              <Calendar onPick={(d) => { update("date", d); next(); }} />
            </div>
          )}

          {step === 3 && (
            <div className="reveal">
              <h2 className="display-l" style={{ marginBottom: 40 }}>Your bike.</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
                <Field label="Brand" placeholder="e.g. Transition" />
                <Field label="Model" placeholder="e.g. Sentinel" />
                <Field label="Year" placeholder="2023" />
                <Field label="Frame size" placeholder="Medium" />
              </div>
              <Field label="What's the issue?" textarea placeholder="Brakes feel spongy, drivetrain skipping in 4th gear..." />
              <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
                <button className="btn btn-outline" data-cursor="link" onClick={back}>← Back</button>
                <button className="btn" data-cursor="link" onClick={next}>Continue <ArrowRight /></button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="reveal">
              <h2 className="display-l" style={{ marginBottom: 40 }}>Your details.</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                <Field label="First name" />
                <Field label="Last name" />
                <Field label="Email" />
                <Field label="Phone" />
              </div>
              <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
                <button className="btn btn-outline" data-cursor="link" onClick={back}>← Back</button>
                <button className="btn" data-cursor="link" onClick={next}>Review <ArrowRight /></button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="reveal">
              <h2 className="display-l" style={{ marginBottom: 16 }}>Confirmed ✓</h2>
              <p className="serif-italic" style={{ fontSize: 24, color: "var(--gray-500)", marginBottom: 40 }}>We'll see you soon.</p>
              <div style={{ borderTop: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)", padding: "24px 0" }}>
                {[["Type", types.find(t => t.id === type)?.title], ["Service", data.service || "Basic Tune-Up"], ["Date", data.date || "Tue, Apr 28"], ["Time", "2:00 PM"], ["Confirmation", "CL-2026-04-2890"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                    <span className="eyebrow">{k}</span>
                    <span style={{ fontFamily: "var(--display)", fontSize: 16 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
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

const Field = ({ label, placeholder, textarea }) => (
  <label style={{ display: "block" }}>
    <div className="eyebrow" style={{ marginBottom: 10 }}>{label}</div>
    {textarea ? (
      <textarea placeholder={placeholder} rows={4} style={{ width: "100%", padding: "12px 0", border: "none", borderBottom: "1px solid var(--hairline)", outline: "none", fontFamily: "var(--body)", fontSize: 16, resize: "vertical", background: "transparent" }} />
    ) : (
      <input placeholder={placeholder} style={{ width: "100%", padding: "12px 0", border: "none", borderBottom: "1px solid var(--hairline)", outline: "none", fontFamily: "var(--body)", fontSize: 16, background: "transparent" }} />
    )}
  </label>
);

const Calendar = ({ onPick }) => {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const start = 2;
  const total = 30;
  const today = 26;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button className="link-underline" data-cursor="link" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>← Mar</button>
        <span style={{ fontFamily: "var(--display)", fontSize: 22, textTransform: "uppercase", letterSpacing: "-.01em" }}>April 2026</span>
        <button className="link-underline" data-cursor="link" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>May →</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 12 }}>
        {days.map((d, i) => <div key={i} className="eyebrow" style={{ textAlign: "center" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {Array.from({ length: start }).map((_, i) => <div key={"e" + i} />)}
        {Array.from({ length: total }).map((_, i) => {
          const d = i + 1;
          const past = d < today;
          const sun = (start + i) % 7 === 0;
          const closed = sun;
          const limited = [27, 28, 29].includes(d);
          return (
            <button key={d} disabled={past || closed} onClick={() => onPick(`Tue, Apr ${d}`)} data-cursor="link" style={{ aspectRatio: "1", border: "1px solid " + (d === today ? "var(--black)" : "var(--hairline)"), background: d === today ? "var(--black)" : "var(--white)", color: past || closed ? "var(--gray-300)" : (d === today ? "var(--white)" : "var(--black)"), fontFamily: "var(--display)", fontSize: 14, fontWeight: 500, position: "relative", cursor: past || closed ? "not-allowed" : "pointer" }}>
              {d}
              {limited && <span style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "var(--gray-500)" }} />}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 24, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-500)" }}>
        <span><span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--gray-500)", marginRight: 6, verticalAlign: "middle" }} />Limited slots</span>
        <span style={{ color: "var(--gray-300)" }}>Sundays  ·  Closed</span>
      </div>
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
    { date: "MON 28 APR 6:00PM", name: "Knox Mountain Monday", type: "Mountain", meta: "22km · 650m gain", level: "Intermediate", spots: "8 of 12 spots" },
    { date: "WED 30 APR 12:15PM", name: "Lunch Loop", type: "Road", meta: "35km · Flat", level: "All abilities", spots: "Open" },
    { date: "THU 01 MAY 6:00PM", name: "Women's Ride", type: "Social", meta: "20km · Easy", level: "Easy", spots: "Open" },
    { date: "SAT 03 MAY 8:00AM", name: "Gravel Sundays", type: "Gravel", meta: "75km · Backcountry", level: "Advanced", spots: "4 of 10 spots" },
    { date: "SUN 04 MAY 9:00AM", name: "Social Saturday", type: "Social", meta: "30km · Cafe stop", level: "Easy", spots: "Open" },
    { date: "MON 05 MAY 6:00PM", name: "Knox Mountain Monday", type: "Mountain", meta: "22km · 650m gain", level: "Intermediate", spots: "Open" },
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
                <button className="btn btn-outline" data-cursor="link" style={{ marginTop: 8 }}>Join Ride <ArrowRight /></button>
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
              <a key={i} href="#" data-cursor="link" className="reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 200px 80px", gap: 32, padding: "40px 0", borderBottom: "1px solid var(--hairline-light)", alignItems: "center" }}>
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
    { name: "Knox Mountain Park", dots: 3, km: "18", gain: "520", type: "MTB · Singletrack", season: "Spring–Fall", note: "The best urban trail system in the Okanagan. Don't miss Antenna." },
    { name: "Bear Creek Provincial Park", dots: 2, km: "14", gain: "380", type: "MTB · Mixed", season: "Year-round", note: "Family-friendly with options to push deeper if you want." },
    { name: "Okanagan Mountain Park", dots: 5, km: "42", gain: "1,200", type: "MTB · Hike", season: "Summer", note: "Big day. Bring food, bring tools, bring a friend." },
    { name: "Myra Canyon Trestles", dots: 1, km: "24", gain: "180", type: "Rail Trail", season: "Spring–Fall", note: "Wooden trestles, lake views, easy day." },
    { name: "McDougall Rim", dots: 3, km: "22", gain: "640", type: "Hike · Gravel", season: "Spring–Fall", note: "Best sunrise loop in the valley." },
    { name: "Rose Valley", dots: 2, km: "16", gain: "320", type: "MTB", season: "Year-round", note: "A bit of everything. Good for shaking down a new bike." },
    { name: "Black Mountain", dots: 5, km: "32", gain: "920", type: "MTB · Advanced", season: "Summer–Fall", note: "If you have to ask, it isn't for you." },
    { name: "Kelowna Bike Park", dots: 4, km: "—", gain: "—", type: "Skills Park", season: "May–Oct", note: "All levels, all features. Free, every day." },
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
                <p className="serif-italic" style={{ fontSize: 16, lineHeight: 1.5, color: "var(--gray-600)", margin: 0 }}>"{t.note}"</p>
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
            <button className="btn btn-outline" data-cursor="link">View on Trailforks <ArrowRight /></button>
            <button className="btn btn-outline" data-cursor="link">View on Komoot <ArrowRight /></button>
            <button className="btn btn-outline" data-cursor="link">Download GPX <ArrowRight /></button>
          </div>
        </div>
      </section>
    </div>
  );
};

// CONTACT
const ContactPage = () => (
  <div className="page-fade" data-screen-label="P08 Contact">
    <section style={{ paddingTop: 120, minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <div className="ph ph-corners" style={{ minHeight: 600, position: "relative" }}>
        <span className="ph-label">STOREFRONT  /  B&W</span>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, rgba(10,10,10,0.6))" }} />
        <div style={{ position: "absolute", left: 48, right: 48, bottom: 48, color: "var(--white)" }}>
          <h1 className="display-xl" style={{ marginBottom: 32 }}>Come<br/><span className="serif-italic">find us.</span></h1>
          <div style={{ borderTop: "1px solid var(--hairline-light)", paddingTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-300)" }}>
            <div><div className="eyebrow eyebrow-light" style={{ marginBottom: 6 }}>Address</div>1139 Ellis St<br/>Kelowna, BC V1Y 1Z4</div>
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

Object.assign(window, { ShopPage, ServicesPage, BookPage, AboutPage, RidesPage, TrailsPage, ContactPage, GiftCardsPage, BikeCardLarge, SubHero, SHOP_BIKES });
