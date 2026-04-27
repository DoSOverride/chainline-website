// ChainLine — Sub-pages

// ── Bike specs generator ──────────────────────────────────────
const getBikeSpecs = (b) => {
  const price = b.price || 0;
  const type  = (b.type || b.rawType || '').toLowerCase();
  const isMTB    = type.includes('mountain');
  const isGravel = type.includes('gravel') || type.includes('touring');
  const isEBike  = type.includes('electric') || type.includes('e-bike');
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
  const type = (b.type || b.rawType || '').toLowerCase();
  const name = b.name || b.title;
  if (type.includes('mountain'))
    return `The ${b.vendor} ${name} is built for the trails around Kelowna and the Okanagan. Whether you're lapping Knox Mountain, exploring Bear Creek, or heading into the backcountry — this bike is ready. Spec'd for performance at every price point, backed by ChainLine's expert service team.`;
  if (type.includes('gravel') || type.includes('touring'))
    return `The ${b.vendor} ${name} is your ticket to everything the Okanagan has to offer. Gravel roads, forest service tracks, loaded touring — it handles it all with confidence. Built for riders who want to explore beyond the pavement.`;
  if (type.includes('road'))
    return `The ${b.vendor} ${name} is built for speed and efficiency on the roads in and around Kelowna. Lightweight, responsive, and built to keep up with your ambitions — whether you're chasing KOMs or just enjoying the ride.`;
  if (type.includes('electric') || type.includes('e-bike'))
    return `The ${b.vendor} ${name} brings intelligent e-assist to your daily rides. Commuting, exploring, or just going further with less effort — this bike opens up more of Kelowna without breaking a sweat.`;
  return `The ${b.vendor} ${name} is a versatile, reliable bike built for everyday riding in Kelowna. Quality components, solid performance, and backed by ChainLine's expert service team since 2009.`;
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

// SHOP
const ShopPage = () => {
  const intent = (typeof window !== "undefined" && window.cl && window.cl.intent) || null;
  const [brand, setBrand] = React.useState((intent && intent.brand) || "All");
  const [type, setType] = React.useState((intent && intent.type) || "All");
  // Clear intent so it doesn't stick
  React.useEffect(() => { if (window.cl) window.cl.intent = null; }, []);
  const brands = ["All", "Marin", "Transition", "Surly", "Pivot"];
  const types = ["All", "Mountain", "Road", "Gravel", "E-Bike", "Kids", "Commuter"];
  const all = (typeof BIKE_CATALOG !== "undefined" ? BIKE_CATALOG : FEATURED_BIKES);
  const matchesType = (b) => {
    if (type === "All") return true;
    const t = (b.type || "").toLowerCase();
    if (type === "Mountain") return t.includes("mountain");
    if (type === "Road") return t.includes("road");
    if (type === "Gravel") return t.includes("gravel") || t.includes("touring");
    if (type === "E-Bike") return t.includes("electric") || t.includes("e-bike");
    if (type === "Kids") return t.includes("kid");
    if (type === "Commuter") return t.includes("dual-sport") || t.includes("comfort") || t.includes("cruiser") || t.includes("commuter");
    return true;
  };
  const filtered = all.filter(b => (brand === "All" || b.brand === brand) && matchesType(b));
  return (
    <div className="page-fade" data-screen-label="P02 Shop">
      <SubHero eyebrow="Shop  /  N°01" title="The Bikes." italic="Performance for every terrain." />
      <section className="bg-white" style={{ position: "sticky", top: 78, zIndex: 50, borderBottom: "1px solid var(--hairline)", padding: "20px 0", backdropFilter: "blur(10px)", background: "rgba(250,250,250,0.95)" }}>
        <div className="container-wide" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span className="eyebrow" style={{ marginRight: 8 }}>Brand</span>
              {brands.map(b => (
                <button key={b} onClick={() => setBrand(b)} data-cursor="link" style={{ padding: "6px 12px", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", border: "1px solid " + (brand === b ? "var(--black)" : "transparent"), background: brand === b ? "var(--black)" : "transparent", color: brand === b ? "var(--white)" : "var(--black)" }}>{b}</button>
              ))}
            </div>
          </div>
          <div className="eyebrow">{filtered.length} bikes</div>
        </div>
        <div className="container-wide" style={{ marginTop: 12, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <span className="eyebrow" style={{ marginRight: 8 }}>Type</span>
          {types.map(t => (
            <button key={t} onClick={() => setType(t)} data-cursor="link" style={{ padding: "4px 10px", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: type === t ? "var(--black)" : "var(--gray-500)", borderBottom: "1px solid " + (type === t ? "var(--black)" : "transparent") }}>{t}</button>
          ))}
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
            <span className="eyebrow">Sort</span>
            <select style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", border: "1px solid var(--hairline)", padding: "6px 10px", background: "var(--white)" }}>
              <option>Featured</option><option>Price low → high</option><option>Price high → low</option><option>Newest</option>
            </select>
          </span>
        </div>
      </section>
      <section className="section section-pad bg-white">
        <div className="container-wide">
          <div className="shop-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
            {filtered.map((b, i) => <BikeCardLarge key={i} b={b} idx={i} />)}
          </div>
          <div style={{ marginTop: 80, textAlign: "center" }}>
            <button className="btn btn-outline" data-cursor="link">Load More</button>
          </div>
        </div>
      </section>
      <Newsletter />
    </div>
  );
};

const BikeCardLarge = ({ b, idx }) => {
  const [adding, setAdding] = React.useState(false);
  const [added, setAdded] = React.useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      await window.clAddToCart(b.handle, b.name, b.price, b.img);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch(err) {
      console.warn('Add to cart error:', err);
    }
    setAdding(false);
  };

  return (
    <div className={"reveal reveal-d-" + (idx % 3 + 1)} style={{ display: "block" }}>
      <div className="ph ph-corners" style={{ aspectRatio: "4/5", marginBottom: 20, position: "relative", background: "var(--paper)", overflow: "hidden" }}>
        {b.img ? (
          <img src={b.img} alt={b.brand + " " + b.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: "8%", mixBlendMode: "multiply" }} />
        ) : (
          <span className="ph-label">{b.brand.toUpperCase()}  ·  {(b.type || "").toUpperCase()}</span>
        )}
        {b.badge && (
          <div style={{ position: "absolute", top: 16, right: 16, padding: "4px 10px", border: "1px solid var(--black)", color: "var(--black)", background: "rgba(255,255,255,0.85)", fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", zIndex: 2 }}>{b.badge}</div>
        )}
      </div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{b.brand}  ·  {b.type}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div className="display-s">{b.name}</div>
        <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 500 }}>${b.price.toLocaleString()}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-outline"
          data-cursor="link"
          onClick={(e) => { e.stopPropagation(); window.cl.go('bike', { bike: b }); }}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          View Bike
        </button>
        <button
          className="btn"
          data-cursor="link"
          onClick={handleAdd}
          disabled={adding}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          {added ? '✓' : adding ? '…' : 'Add to Cart'}
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
            <div><div className="eyebrow eyebrow-light" style={{ marginBottom: 6 }}>Address</div>2540 Highway 97 N<br/>Kelowna, BC V1X 4J2</div>
            <div><div className="eyebrow eyebrow-light" style={{ marginBottom: 6 }}>Hours</div>Mon–Fri  10–6<br/>Sat  9–5  ·  Sun closed</div>
            <div><div className="eyebrow eyebrow-light" style={{ marginBottom: 6 }}>Phone</div>(250) 555-0148</div>
            <div><div className="eyebrow eyebrow-light" style={{ marginBottom: 6 }}>Email</div>ride@chainline.ca</div>
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
            { t: "Call Us", v: "(250) 555-0148" },
            { t: "Book a Service", v: "Online booking" },
            { t: "Get Directions", v: "Open in Maps" },
          ].map((a, i) => (
            <button key={i} className="btn btn-outline" data-cursor="link" style={{ padding: "32px", justifyContent: "space-between", flexDirection: "column", alignItems: "flex-start", gap: 16, height: "auto" }}>
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

Object.assign(window, { ShopPage, ServicesPage, BookPage, AboutPage, RidesPage, TrailsPage, ContactPage, BikeCardLarge, SubHero });
