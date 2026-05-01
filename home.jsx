// ChainLine — Homepage sections

// ── Hero image carousel ───────────────────────────────────────────────────────
const HERO_SLIDES = [
  "/hero/okanagan-panorama.png",  // Rider on gravel road — Okanagan lake panorama
  "/hero/above-clouds.png",       // Silhouette above the clouds
  "/hero/trail-lake.png",         // Technical singletrack with lake below
  "/hero/misty-forest.png",       // Moody forest trail
  "/hero/rocky-viewpoint.png",    // Bike on rocky ridge overlooking lake
  "/hero/golden-hour.png",        // Golden hour jump in the pines
];

const HeroBg = () => {
  const [cur, setCur] = React.useState(0);
  const [prev, setPrev] = React.useState(null);

  React.useEffect(() => {
    const t = setInterval(() => {
      setCur(c => {
        setPrev(c);
        return (c + 1) % HERO_SLIDES.length;
      });
    }, 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {HERO_SLIDES.map((src, i) => (
        <div key={i} style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: i === cur ? 1 : 0,
          transition: i === cur ? "opacity 1.4s ease" : (i === prev ? "opacity 1.4s ease" : "none"),
          animation: i === cur ? "kenburns 8s ease-in-out forwards" : "none",
        }} />
      ))}
      <div className="hero-gradient-overlay" style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.05) 38%, rgba(10,10,10,0.75) 100%)" }} />
    </div>
  );
};

const Hero = ({ variant }) => {
  const variants = [
    { headline: "BUILT FOR KELOWNA.", italic: "Backed by Canada.", sub: "Kelowna's only full-service performance bike shop." },
    { headline: "RIDE THE OKANAGAN.", italic: "Every season, every line.", sub: "Hand-tuned bikes from people who ride every trail we sell." },
    { headline: "FIFTEEN YEARS DEEP.", italic: "Still local. Still listening.", sub: "A bike shop built by riders, for riders, in the heart of BC." },
  ];
  const v = variants[variant % variants.length];
  return (
    <section className="hero hero-section" data-screen-label="01 Hero" style={{ position: "relative", height: "100vh", minHeight: 720, color: "var(--white)", overflow: "hidden", background: "var(--black)" }}>
      <HeroBg />
      <div className="container-wide hero-content" style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "clamp(80px,14vh,180px)", paddingTop: 80 }}>
        <div className="eyebrow eyebrow-light hero-edge-label" style={{ marginBottom: 12, opacity: 0.5, fontSize: 10, letterSpacing: ".18em" }}>
          N°01  /  THE LINEUP  ·  2026
        </div>
        <div className="eyebrow eyebrow-light" style={{ marginBottom: 6, textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
          KELOWNA, BC  ·  EST. 2009  ·  49.88°N
        </div>
        <h1 className="display-xxl" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.6)" }} key={"h-" + variant}>
          <SplitText delay={0.1}>{v.headline}</SplitText>
        </h1>
        <div className="serif-italic hero-italic" style={{ fontSize: "clamp(20px, 5vw, 88px)", lineHeight: 1, marginTop: 12, opacity: 0, animation: "splitIn 1s 0.9s forwards cubic-bezier(.2,.8,.2,1)", transform: "translateY(20px)", textShadow: "0 2px 16px rgba(0,0,0,0.6)" }} key={"i-" + variant}>
          {v.italic}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 56, gap: 32, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 420, opacity: 0, animation: "splitIn 1s 1.4s forwards ease", transform: "translateY(20px)" }} key={"s-" + variant}>
            <div style={{ fontSize: 16, lineHeight: 1.5, color: "var(--gray-300)" }}>{v.sub}</div>
          </div>
          <div className="hero-ctas" style={{ display: "flex", gap: 16, opacity: 0, animation: "splitIn 1s 1.6s forwards ease", transform: "translateY(20px)" }}>
            <button className="btn btn-light" data-cursor="link" onClick={() => window.cl.go("shop")}>Shop Bikes <ArrowRight /></button>
            <button className="btn btn-outline-light" data-cursor="link" onClick={() => window.cl.go("book")}>Book a Service <ArrowRight /></button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll-indicator" style={{ position: "absolute", bottom: 0, right: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <span style={{ writingMode: "vertical-rl", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--gray-300)" }}>SCROLL</span>
        <div style={{ width: 1, height: 80, background: "var(--gray-300)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, left: 0, width: 1, height: 40, background: "var(--white)", animation: "scrollDrip 2.4s ease-in-out infinite" }} />
        </div>
      </div>

    </section>
  );
};

// Featured bikes — sourced from real ChainLine inventory
const FEATURED_BIKES = [
  {"brand":"Transition","name":"Sentinel","type":"Mountain","rawType":"Mountain Bike","price":8900,"img":"https://www.fanatikbike.com/cdn/shop/files/2025-transition-sentinel-v3_glacier-white.jpg","handle":"transition-sentinel"},
  {"brand":"Pivot",     "name":"Switchblade Ride Eagle 70/90","type":"Mountain","rawType":"Mountain Bike","price":8000,"img":"https://cms.pivotcycles.com/wp-content/uploads/2025/11/switchbladev3-highlight-right-aurhm3my.jpg","handle":"pivot-switchblade-ride-eagle-70-90"},
  {"brand":"Transition","name":"Regulator CX Eagle 90","type":"E-Bike","rawType":"Electric Bike","price":13000,"img":"https://www.transitionbikes.com/images/C1-2026-Regulator-CX.avif","handle":"transition-regulator-cx-eagle-90"},
  {"brand":"Marin",     "name":"Pine Mountain 1 29","type":"Mountain","rawType":"Mountain Bike","price":1960,"img":"https://still-term-f1ec.taocaruso77.workers.dev/r2/bikes/marin-pine-mountain-1-29.jpg","handle":"marin-pine-mountain-1-29"},
  {"brand":"Surly",     "name":"Bridge Club","type":"Gravel","rawType":"Gravel Bike","price":1850,"img":"https://surlybikes.com/cdn/shop/files/surly-bridge-club-bike-lingering-cranberry-BK01508.jpg?v=1773411087&width=1946","handle":"surly-bridge-club"},
  {"brand":"Pivot",     "name":"Shuttle AM Ride Eagle 70/90","type":"E-Bike","rawType":"Electric Bike","price":11500,"img":"https://cms.pivotcycles.com/wp-content/uploads/2025/10/shuttleam-photo-gallery-beauty-4-msswiet3.jpg","handle":"pivot-shuttle-am-ride-eagle-70-90"},
  {"brand":"Knolly",    "name":"Fugitive","type":"Mountain","rawType":"Mountain Bike","price":4550,"img":"https://cdn.shopify.com/s/files/1/0714/3611/files/FUGITIVE_EAGLE_90_FOX_-_RAW_LOUVRED.png?v=1759774351","handle":"knolly-fugitive"},
  {"brand":"Surly",     "name":"Sorceress","type":"Mountain","rawType":"Fat Bike","price":3400,"img":"https://surlybikes.com/cdn/shop/files/surly-sorceress-eagle-90-bike-purple-BK01561.jpg?v=1774378038&width=1946","handle":"surly-sorceress"},
];


const BikeCard = ({ b, idx }) => (
  <a href="#" className={"reveal reveal-d-" + (idx % 4 + 1)} data-cursor="link" style={{ display: "block" }}
     onClick={(e) => { e.preventDefault(); window.cl.go("bike", { bike: b }); }}>
    <div className="ph ph-corners" style={{ aspectRatio: "4/5", marginBottom: 20, position: "relative", background: "var(--paper)", overflow: "hidden" }}>
      {b.img ? (
        <img src={b.img} alt={b.brand + " " + b.name} className="bike-img" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: "8%", mixBlendMode: "multiply" }} />
      ) : (
        <span className="ph-label">{b.brand.toUpperCase()}  ·  {(b.type || "").toUpperCase()}</span>
      )}
      {b.badge && (
        <div style={{ position: "absolute", top: 16, right: 16, padding: "4px 10px", background: "var(--black)", color: "var(--white)", fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", zIndex: 2 }}>{b.badge}</div>
      )}
      <div className="bike-hover" style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 20, background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)", color: "var(--white)", transform: "translateY(100%)", transition: "transform .5s cubic-bezier(.2,.8,.2,1)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 3 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>View Bike</span>
        <ArrowRight />
      </div>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>{b.brand}  ·  {b.type}</div>
        <div style={{ fontFamily: "var(--display)", fontSize: "clamp(14px,1.5vw,18px)", fontWeight: 500, letterSpacing: "-.005em", textTransform: "uppercase", lineHeight: 1.2 }}>{b.name}</div>
      </div>
      <div style={{ fontFamily: "var(--display)", fontSize: "clamp(13px,1.3vw,16px)", fontWeight: 500, whiteSpace: "nowrap", paddingTop: 2 }}>${b.price.toLocaleString()}</div>
    </div>
  </a>
);

const FeaturedBikes = () => {
  const bikes = FEATURED_BIKES;
  const getVisible = () => window.innerWidth < 600 ? 1 : window.innerWidth < 1024 ? 2 : 4;
  const [visible, setVisible] = React.useState(getVisible());
  const [pos, setPos] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const max = Math.max(0, bikes.length - visible);

  React.useEffect(() => {
    const onResize = () => { setVisible(getVisible()); setPos(0); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  React.useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setPos(p => p >= max ? 0 : p + 1), 4200);
    return () => clearInterval(t);
  }, [paused, max]);

  const trackW = `${bikes.length / visible * 100}%`;
  const cardW  = `${100 / bikes.length}%`;
  const shift  = `${pos * (100 / bikes.length)}%`;

  const ChevL = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 3L5 8l5 5"/>
    </svg>
  );
  const ChevR = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 3l5 5-5 5"/>
    </svg>
  );

  return (
    <section className="section section-pad bg-white" data-screen-label="02 Featured" style={{ paddingBottom: 120 }}>
      <div className="container-wide">
        <div className="reveal" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, gap: 40, flexWrap: "wrap" }}>
          <div>
            <div className="section-label" style={{ marginBottom: 20 }}>The Lineup  /  N°01</div>
            <h2 className="display-xl">2026 Bikes,<br/><span className="serif-italic">hand-picked.</span></h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 320, color: "var(--gray-500)", fontSize: 15, lineHeight: 1.6 }}>
              Every bike on this list, we've ridden. Eight rigs we'd put our own riders on this season.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setPos(p => Math.max(0, p - 1)); setPaused(true); }} data-cursor="link"
                style={{ width: 40, height: 40, border: "1.5px solid var(--hairline)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <ChevL />
              </button>
              <button onClick={() => { setPos(p => p >= max ? 0 : p + 1); setPaused(true); }} data-cursor="link"
                style={{ width: 40, height: 40, border: "1.5px solid var(--hairline)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <ChevR />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel track */}
        <div style={{ overflow: "hidden" }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div style={{
            display: "flex",
            width: trackW,
            transform: `translateX(-${shift})`,
            transition: "transform 0.7s cubic-bezier(0.25,0.1,0.25,1)",
          }}>
            {bikes.map((b, i) => (
              <div key={b.handle} style={{ width: cardW, paddingRight: i < bikes.length - 1 ? "2.133%" : 0, boxSizing: "border-box" }}>
                <BikeCard b={b} idx={i} />
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
          {Array.from({ length: max + 1 }, (_, i) => (
            <button key={i} onClick={() => { setPos(i); setPaused(true); }} data-cursor="link"
              style={{ width: i === pos ? 24 : 8, height: 8, borderRadius: 4, border: "none", background: i === pos ? "var(--black)" : "var(--gray-200)", cursor: "pointer", transition: "all .3s", padding: 0 }} />
          ))}
        </div>

        <div className="reveal" style={{ marginTop: 56, display: "flex", justifyContent: "center" }}>
          <button className="btn btn-outline" data-cursor="link" onClick={() => window.cl.go("shop")}>View All Bikes <ArrowRight /></button>
        </div>
      </div>
    </section>
  );
};

// Stats Bar
const StatsBar = () => (
  <section className="section section-pad-sm bg-black" data-screen-label="03 Stats" style={{ padding: "120px 0", borderTop: "1px solid var(--hairline-light)", borderBottom: "1px solid var(--hairline-light)" }}>
    <div className="container-wide">
      <div className="reveal home-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 40 }}>
        {[
          { n: 15, suffix: "+", label: "Years in Kelowna" },
          { n: 9, suffix: "", label: "Premium Brands" },
          { n: 500, suffix: "+", label: "Bikes Serviced / Year" },
          { n: 5, suffix: "", label: "Star Rated Shop", isStars: true },
          { n: 1, suffix: "", label: "Kelowna's #1 Shop", isHash: true },
        ].map((s, i) => (
          <div key={i} style={{ borderLeft: i === 0 ? "none" : "1px solid var(--hairline-light)", paddingLeft: i === 0 ? 0 : 32 }}>
            <div style={{ fontFamily: "var(--display)", fontSize: "clamp(48px, 6vw, 88px)", fontWeight: 500, lineHeight: 0.9, letterSpacing: "-.03em", marginBottom: 16 }}>
              {s.isHash && "#"}<Counter to={s.n} suffix={s.suffix} />
            </div>
            <div className="eyebrow eyebrow-light">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Brand logos grid — tiles flip on hover to show each brand's actual logo
const BRAND_LOGOS = {
  // Marin: no static CDN URL found (JS-rendered) — text fallback used
  "MARIN":       null,
  "TRANSITION":  "https://www.transitionbikes.com/images/Nav_TransitionLogoTopLeftCornerShadow2.png",
  "SURLY":       "https://surlybikes.com/cdn/shop/files/Surly-Logo-White.svg?v=1741038664&width=600",
  "SALSA":       "https://www.salsacycles.com/cdn/shop/files/Salsa-Logo.svg?v=1740002630&width=600",
  "PIVOT":       "https://cdn.shopify.com/oxygen-v2/29487/77993/161582/3468523/assets/pvt-logo-C6F70W5d.svg",
  "BIANCHI":     "https://www.bianchi.com/wp-content/themes/bianchi/inc/assets/images/logo-bianchi-black.svg",
  "MOOTS":       "https://moots.com/cdn/shop/files/image_1.png?v=1758088868&width=600",
  "KNOLLY":      "https://knollybikes.com/cdn/shop/files/logo-knolly-white.svg?v=1687721502&width=180",
  "REVEL":       "https://revelbikes.com/cdn/shop/files/high-resolation-logo.png?v=1764233115&width=600",
};

// Which logos are dark (need white background) vs white (need dark background)
const LOGO_ON_DARK = { "SURLY": true, "KNOLLY": true };

const BrandTile = ({ b, i }) => {
  const [flipped, setFlipped] = React.useState(false);
  const [logoFailed, setLogoFailed] = React.useState(false);
  const logo = BRAND_LOGOS[b];
  const darkBg = LOGO_ON_DARK[b];
  const brandName = b.charAt(0) + b.slice(1).toLowerCase();

  return (
    <div
      data-cursor="link"
      className={"reveal reveal-d-" + (i % 3 + 1)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => window.cl.go("shop", { brand: brandName })}
      style={{ aspectRatio: "1.1/1", borderRight: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)", cursor: "pointer", perspective: 800, position: "relative" }}
    >
      <div style={{
        position: "absolute", inset: 0,
        transformStyle: "preserve-3d",
        transition: "transform 0.55s cubic-bezier(.2,.8,.2,1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        {/* Front: brand name text */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", display: "grid", placeItems: "center", background: "var(--white)", fontFamily: "var(--display)", fontSize: "clamp(9px,1vw,14px)", fontWeight: 600, letterSpacing: ".14em", color: "var(--black)" }}>
          {b}
        </div>
        {/* Back: brand logo on clean background */}
        <div className={darkBg ? "" : "brand-tile-back-light"} style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: darkBg ? "#0a0a0a" : "#fff", padding: "16%" }}>
          {logo && !logoFailed ? (
            <img
              src={logo}
              alt={b + " logo"}
              onError={() => setLogoFailed(true)}
              style={{ width: "100%", maxHeight: "100%", objectFit: "contain", display: "block",
                filter: darkBg ? "none" : "none" }}
            />
          ) : (
            <span style={{ fontFamily: "var(--display)", fontSize: "clamp(14px,2vw,22px)", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: darkBg ? "#fff" : "#0a0a0a", textAlign: "center" }}>{b}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const BrandsGrid = () => {
  const brands = ["MARIN", "TRANSITION", "SURLY", "SALSA", "PIVOT", "BIANCHI", "MOOTS", "KNOLLY", "REVEL"];
  return (
    <section className="section section-pad bg-paper" data-screen-label="04 Brands">
      <div className="container-wide">
        <div className="reveal" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 64, gap: 40, flexWrap: "wrap" }}>
          <div>
            <div className="section-label">Our Brands  /  N°02</div>
            <h2 className="display-l">Nine labels.<br/><span className="serif-italic">Carefully chosen.</span></h2>
          </div>
          <div className="eyebrow">Curated, not stocked.</div>
        </div>
        <div className="home-brands-grid" style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", border: "1px solid var(--hairline)", borderRight: 0, borderBottom: 0 }}>
          {brands.map((b, i) => <BrandTile key={b} b={b} i={i} />)}
        </div>
      </div>
    </section>
  );
};

// Services preview
const SERVICES = [
  { n: "01", name: "Tune-Up & Maintenance", desc: "Adjustments, lube, safety check. Same-day turnaround.", price: "FROM $89" },
  { n: "02", name: "Custom Bike Builds", desc: "From frame up. Hand-laced wheels, dialed cockpit.", price: "FROM $450" },
  { n: "03", name: "Professional Bike Fitting", desc: "Power-meter ready, video gait analysis included.", price: "FROM $200" },
  { n: "04", name: "Bike Storage Program", desc: "Dry, secure, climate-controlled. Spring-ready return.", price: "FROM $180" },
  { n: "05", name: "Wheel Building", desc: "Hand-laced, tensioned, trued. Lifetime true-up included.", price: "FROM $260" },
  { n: "06", name: "Warranty & Recall Service", desc: "We handle the paperwork. Authorized for all our brands.", price: "FROM $45" },
];

const ServiceCard = ({ s }) => (
  <div className="svc-card reveal" style={{ position: "relative", height: 280, perspective: 1200 }}>
    <div className="svc-inner" style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transition: "transform .7s cubic-bezier(.2,.8,.2,1)" }}>
      <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", border: "1px solid var(--hairline-light)", padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div className="eyebrow eyebrow-light">{s.n}</div>
        <div>
          <h3 className="display-s" style={{ marginBottom: 12 }}>{s.name}</h3>
          <p style={{ fontSize: 14, color: "var(--gray-300)", margin: 0 }}>{s.desc}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gray-300)" }}>
          <span>Hover for details</span><span>↻</span>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "#111", border: "1px solid var(--hairline-light)", color: "var(--white)", padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div className="eyebrow eyebrow-light">{s.n}  ·  STARTING AT</div>
        <div className="display-l" style={{ fontSize: 56 }}>{s.price}</div>
        <button className="btn btn-light" data-cursor="link" style={{ alignSelf: "flex-start" }} onClick={() => window.cl.go("book")}>Book Now <ArrowRight /></button>
      </div>
    </div>
  </div>
);

const ServicesPreview = () => (
  <section className="section section-pad bg-black" data-screen-label="05 Services">
    <div className="container-wide">
      <div className="reveal" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 80, gap: 40, flexWrap: "wrap" }}>
        <div>
          <div className="section-label" style={{ color: "var(--gray-300)" }}>Full-Service Shop  /  N°03</div>
          <h2 className="display-xl">We keep<br/>you <span className="serif-italic">rolling.</span></h2>
        </div>
        <div style={{ maxWidth: 360, color: "var(--gray-300)", fontSize: 15, lineHeight: 1.6 }}>
          Four dedicated mechanics. More torque wrenches than we can count. One unbreakable rule — no bike leaves the stand until it leaves perfect.
        </div>
      </div>
      <div className="home-services-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: "1px solid var(--hairline-light)", borderRight: 0, borderBottom: 0 }}>
        {SERVICES.map((s, i) => (
          <div key={i} style={{ borderRight: "1px solid var(--hairline-light)", borderBottom: "1px solid var(--hairline-light)" }}>
            <ServiceCard s={s} />
          </div>
        ))}
      </div>
      <div className="reveal" style={{ marginTop: 80, display: "flex", justifyContent: "center" }}>
        <button className="btn btn-outline-light" data-cursor="link" onClick={() => window.cl.go("book")}>Book a Service Online <ArrowRight /></button>
      </div>
    </div>
  </section>
);

// Book Online Banner
const BookBanner = () => (
  <section className="section section-pad bg-white" data-screen-label="06 Book Banner">
    <div className="container-narrow" style={{ textAlign: "center" }}>
      <div className="reveal section-label" style={{ justifyContent: "center", marginBottom: 32 }}>
        <span>Online Booking</span>
      </div>
      <h2 className="display-xl reveal" style={{ marginBottom: 24 }}>
        Skip the wait.<br/><span className="serif-italic">Book online.</span>
      </h2>
      <p className="reveal" style={{ fontSize: 18, color: "var(--gray-500)", maxWidth: 520, margin: "0 auto 48px" }}>
        Reserve your service slot, demo ride, or bike fitting in minutes. Real availability, no phone tag.
      </p>
      <div className="reveal" style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
        <button className="btn" data-cursor="link" onClick={() => window.cl.go("book")}>Book a Service <ArrowRight /></button>
        <button className="btn btn-outline" data-cursor="link" onClick={() => window.cl.go("fitting")}>Book a Fitting <ArrowRight /></button>
      </div>
    </div>
  </section>
);

// Bike image scroller — infinite marquee using all bikes with images
const BikeScroller = () => {
  // Pull from full SHOP_BIKES catalogue; deduplicate by handle
  const allBikes = (window.SHOP_BIKES || FEATURED_BIKES).filter(b => b.img);
  const seen = new Set();
  const bikes = allBikes.filter(b => { if (seen.has(b.handle)) return false; seen.add(b.handle); return true; });
  if (bikes.length === 0) return null;

  // Match BrandMarquee pixel speed (~60px/s at 38s over ~2300px track)
  const BRAND_PX_PER_S = 60;
  const itemWidth = 220; // 200px + 20px marginRight
  const trackPx = bikes.length * itemWidth;
  const duration = Math.round(trackPx / BRAND_PX_PER_S);

  const BikeItem = ({ b }) => (
    <div onClick={() => window.cl.go("bike", { bike: b })}
      className="bike-scroller-item"
      style={{ flexShrink:0, width:200, height:148, marginRight:20, position:"relative", background:"var(--white)", cursor:"pointer", overflow:"hidden" }}>
      <img src={b.img} alt={b.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain", padding:"8%", mixBlendMode:"multiply" }}
        onError={e => { e.target.parentElement.style.display = 'none'; }} />
    </div>
  );
  const Track = () => (
    <div className="marquee-track" style={{ display:"flex", animationDuration:`${duration}s` }}>
      {bikes.map((b, i) => <BikeItem key={i} b={b} />)}
    </div>
  );
  return (
    <div className="marquee" style={{ padding:"20px 0", background:"var(--paper)", borderTop:"1px solid var(--hairline)", borderBottom:"1px solid var(--hairline)" }}>
      <Track />
      <Track />
    </div>
  );
};

// Local Story
const LocalStory = () => (
  <section className="section section-pad bg-paper" data-screen-label="07 Story">
    <div className="container-wide">
      <div className="home-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div className="reveal" style={{ aspectRatio: "4/5", position: "relative", overflow: "hidden" }}>
          <img src="/shop-exterior.webp" alt="ChainLine Cycle — Kelowna's bike shop since 2009"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
          <div style={{ position: "absolute", top: 24, left: 24, padding: "8px 14px", background: "var(--black)", color: "var(--white)", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase" }}>EST. 2009</div>
        </div>
        <div className="reveal reveal-d-2">
          <div className="section-label">Our Story  /  N°04</div>
          <h2 className="display-xl" style={{ marginBottom: 32 }}>
            Kelowna's bike<br/>shop <span className="serif-italic">since 2009.</span>
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--gray-600)", marginBottom: 20 }}>
            We opened on a rainy October morning with twelve bikes, two wrenches, and an unreasonable amount of belief that Kelowna deserved a better bike shop. Fifteen years later, we're still wrenching, still riding, and still answering our own phone.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--gray-600)", marginBottom: 40 }}>
            Every brand we carry, we've ridden. Every mechanic on the floor races, commutes, or both. We're not a chain — we're a team, and we live where you ride.
          </p>
          <hr className="hr" style={{ marginBottom: 40 }} />
          <div className="serif-italic built-for-kelowna" style={{ fontSize: 18, lineHeight: 1.3, marginBottom: 32 }}>
            Built for Kelowna. Backed by Canada.
          </div>
          <button className="btn btn-outline" data-cursor="link" onClick={() => window.cl.go("about")}>Our Story <ArrowRight /></button>
        </div>
      </div>
    </div>
  </section>
);

// Parts horizontal scroll
const GearHScroll = () => {
  const R2 = `${WORKER_URL}/r2`;
  const cats = [
    { name: "Helmets & Protection", tab: "fit",          img: `${R2}/shop/interior-surly.jpg` },
    { name: "Apparel & Clothing",   tab: "fit",          img: `${R2}/lifestyle/rides-group.jpg` },
    { name: "Components",           tab: "drivetrain",   img: `${R2}/shop/interior-parts.jpg` },
    { name: "Tools & Maintenance",  tab: "tools",        img: `${R2}/parts/tools-hero.jpg` },
    { name: "Bags & Racks",         tab: "accessories",  img: `${R2}/lifestyle/rides-social.jpg` },
    { name: "Lights & Computers",   tab: "accessories",  img: `${R2}/lifestyle/trail-forest.jpg` },
    { name: "Wheels & Tires",       tab: "wheels",       img: `${R2}/shop/interior-tires.jpg` },
    { name: "Suspension",           tab: "suspension",   img: `${R2}/lifestyle/trail-pines.jpg` },
  ];
  return (
    <section className="section section-pad bg-white" data-screen-label="08 Gear" style={{ paddingBottom: 80 }}>
      <div className="container-wide">
        <div className="reveal" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, gap: 40, flexWrap: "wrap" }}>
          <div>
            <div className="section-label">Gear Up  /  N°05</div>
            <h2 className="display-xl">Components &<br/><span className="serif-italic">accessories.</span></h2>
          </div>
          <button className="btn btn-outline" data-cursor="link" onClick={() => window.cl.go("parts")}>
            Browse All <ArrowRight />
          </button>
        </div>
      </div>
      <div className="hscroll" style={{ overflowX: "auto", paddingLeft: 40, paddingRight: 40, scrollSnapType: "x mandatory" }}>
        <div style={{ display: "flex", gap: 24, paddingBottom: 24 }}>
          {cats.map((c, i) => (
            <a key={i} href="#" data-cursor="link" style={{ flex: "0 0 280px", scrollSnapAlign: "start" }}
               onClick={e => { e.preventDefault(); window.cl.go("parts", { tab: c.tab }); }}>
              <div className={c.img ? "" : "ph ph-corners"} style={{ aspectRatio: "3/4", position: "relative", overflow: "hidden",
                background: c.img ? "var(--near-black)" : undefined }}>
                {c.img
                  ? <img src={c.img} alt={c.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", display:"block", opacity:.75 }} />
                  : <span className="ph-label">PARTS  ·  {c.name.toUpperCase()}</span>
                }
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />
                <div style={{ position: "absolute", top: 20, left: 20, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, color: "#fff" }}>
                  <div className="display-s" style={{ marginBottom: 10, textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>{c.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
                    <span>Shop now</span>
                    <ArrowRight />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

// Group rides teaser
const GroupRidesTeaser = () => {
  const nextDate = (dow) => {
    const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
    const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const today = new Date();
    const diff = ((dow - today.getDay()) % 7 + 7) % 7 || 7;
    const d = new Date(today); d.setDate(today.getDate() + diff);
    return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  };
  const rides = [
    { dow: 4, name: "Thursday Night Shuttle / Pedal", meta: "MTB · Shuttle or Pedal", level: "All levels" },
    { dow: 5, name: "Friday Night Pedal Ride",        meta: "MTB · Crawford",          level: "All paces"  },
  ].map(r => ({ ...r, date: nextDate(r.dow) }));
  return (
    <section className="section section-pad bg-black" data-screen-label="09 Group Rides">
      <div className="container-wide">
        <div className="home-2col" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 80, alignItems: "center" }}>
          <div className="reveal" style={{ aspectRatio: "5/4", position: "relative", overflow: "hidden" }}>
            <img src={`${WORKER_URL}/r2/lifestyle/rides-group.jpg`} alt="ChainLine group ride"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
          </div>
          <div className="reveal reveal-d-2">
            <div className="section-label" style={{ color: "var(--gray-300)" }}>Community  /  N°06</div>
            <h2 className="display-xl" style={{ marginBottom: 24 }}>Ride <span className="serif-italic">with us.</span></h2>
            <p style={{ fontSize: 16, color: "var(--gray-300)", lineHeight: 1.6, marginBottom: 40 }}>
              Two rides every week, all year. Mountain, shuttle, pedal. Show up, clip in, leave faster than you came.
            </p>
            <div style={{ borderTop: "1px solid var(--hairline-light)" }}>
              {rides.map((r, i) => (
                <a key={i} href="#" data-cursor="link" className="home-rides-row" style={{ display: "grid", gridTemplateColumns: "100px 1fr auto auto", gap: 24, padding: "20px 0", borderBottom: "1px solid var(--hairline-light)", alignItems: "center" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", color: "var(--gray-300)" }}>{r.date}</div>
                  <div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 500, textTransform: "uppercase", letterSpacing: "-.005em" }}>{r.name}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".12em", color: "var(--gray-300)", textTransform: "uppercase", marginTop: 4 }}>{r.meta}</div>
                  </div>
                  <span className="pill home-rides-pill">{r.level}</span>
                  <span className="home-rides-arrow"><ArrowRight /></span>
                </a>
              ))}
            </div>
            <button className="btn btn-outline-light" data-cursor="link" style={{ marginTop: 40 }} onClick={() => window.cl.go("rides")}>View All Rides <ArrowRight /></button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Trail spotlight
const TrailSpotlight = () => {
  const trails = [
    { name: "Knox Mountain", dots: 3, km: "18", gain: "520", type: "MTB · Singletrack", quote: "The best urban trail system in the Okanagan." },
    { name: "Myra Canyon", dots: 1, km: "24", gain: "180", type: "Rail Trail · Family", quote: "Wooden trestles, lake views, easy day." },
    { name: "Black Mountain", dots: 5, km: "32", gain: "920", type: "MTB · Advanced", quote: "If you have to ask, it isn't for you." },
  ];
  const Dots = ({ n }) => (
    <span className="pill-dots">{[1,2,3,4,5].map(i => <i key={i} className={i <= n ? "on" : ""} />)}</span>
  );
  return (
    <section className="section section-pad bg-white" data-screen-label="10 Trails">
      <div className="container-wide">
        <div className="reveal" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 64, flexWrap: "wrap", gap: 32 }}>
          <div>
            <div className="section-label">Field Notes  /  N°07</div>
            <h2 className="display-xl">Know your<br/><span className="serif-italic">backyard.</span></h2>
          </div>
          <button className="btn btn-outline" data-cursor="link" onClick={() => window.cl.go("trails")}>Explore Kelowna Trails <ArrowRight /></button>
        </div>
        <div className="home-trail-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
          <a href="#" data-cursor="link" className="reveal" onClick={e => { e.preventDefault(); window.cl.go("trails"); }}
            style={{ aspectRatio: "16/10", position: "relative", overflow: "hidden", display: "block" }}>
            <img src={`${WORKER_URL}/r2/lifestyle/trail-knox.jpg`} alt="Knox Mountain trails"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)" }} />
            <div style={{ position: "absolute", left: 32, right: 32, bottom: 32, color: "#fff" }}>
              <div className="eyebrow eyebrow-light" style={{ marginBottom: 12 }}>Featured  ·  Spring–Fall</div>
              <div className="display-l" style={{ marginBottom: 16, textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>{trails[0].name}</div>
              <div style={{ display: "flex", gap: 24, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", alignItems: "center" }}>
                <Dots n={trails[0].dots} />
                <span>{trails[0].km} km</span>
                <span>{trails[0].gain} m gain</span>
                <span>{trails[0].type}</span>
              </div>
            </div>
          </a>
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 32 }}>
            {trails.slice(1).map((t, i) => (
              <a key={i} href="#" data-cursor="link" className="reveal reveal-d-2" onClick={e => { e.preventDefault(); window.cl.go("trails"); }}
                style={{ position: "relative", minHeight: 220, overflow: "hidden", display: "block" }}>
                <img src={`${WORKER_URL}/r2/lifestyle/${i === 0 ? "trail-forest.jpg" : "trail-action.jpg"}`} alt={t.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", position: "absolute", inset: 0 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />
                <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, color: "#fff" }}>
                  <div className="display-m" style={{ marginBottom: 8, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{t.name}</div>
                  <div style={{ display: "flex", gap: 16, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", alignItems: "center" }}>
                    <Dots n={t.dots} />
                    <span>{t.km} km</span>
                    <span>{t.gain} m</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Demo Strip
const DemoStrip = () => (
  <section className="section bg-black" data-screen-label="11 Demo" style={{ padding: "120px 0", borderTop: "1px solid var(--hairline-light)", borderBottom: "1px solid var(--hairline-light)" }}>
    <div className="container-narrow" style={{ textAlign: "center" }}>
      <div className="reveal section-label" style={{ justifyContent: "center", color: "var(--gray-300)" }}>Demo Fleet  /  N°08</div>
      <h2 className="display-xl reveal" style={{ marginBottom: 24 }}>
        Demo before<br/><span className="serif-italic">you buy.</span>
      </h2>
      <p className="reveal" style={{ fontSize: 18, color: "var(--gray-300)", maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.6 }}>
        Twelve bikes in our demo fleet. Try the trail before you commit to the bike.
      </p>
      <button className="btn btn-light reveal" data-cursor="link" onClick={() => window.cl.go("book")}>Book a Demo Ride <ArrowRight /></button>
    </div>
  </section>
);

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-label="Google" style={{ flexShrink:0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Stars = ({ n = 5 }) => (
  <div style={{ display:"flex", gap:1, marginBottom:16 }}>
    {[1,2,3,4,5].map(j => (
      <span key={j} style={{ color: j <= n ? "#f59e0b" : "var(--gray-200)", fontSize:15, lineHeight:1 }}>★</span>
    ))}
  </div>
);

const ReviewCard = ({ author, text, time, photo, rating = 5 }) => (
  <div style={{ padding:"32px 28px", border:"1px solid var(--hairline)", background:"var(--white)", display:"flex", flexDirection:"column" }}>
    <Stars n={rating} />
    <p style={{ fontSize:14, lineHeight:1.8, color:"var(--gray-600)", margin:"0 0 20px", flex:1 }}>&ldquo;{text}&rdquo;</p>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {photo
          ? <img src={photo} alt={author} style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover" }} />
          : <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--gray-200)", display:"grid", placeItems:"center", fontFamily:"var(--display)", fontSize:12, fontWeight:600, textTransform:"uppercase" }}>{author[0]}</div>
        }
        <div>
          <div style={{ fontFamily:"var(--display)", fontSize:13, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.005em" }}>{author}</div>
          {time && <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-400)", marginTop:2 }}>{time}</div>}
        </div>
      </div>
      {GOOGLE_ICON}
    </div>
  </div>
);

const WORKER_URL = "https://still-term-f1ec.taocaruso77.workers.dev";

const Testimonials = () => {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    fetch(`${WORKER_URL}/api/reviews`)
      .then(r => r.json())
      .then(d => { if (d.reviews && d.reviews.length > 0) setData(d); })
      .catch(() => {});
  }, []);

  const reviews = data?.reviews || [];
  const rating  = data?.rating  || 4.9;
  const total   = data?.total   || null;

  return (
    <section className="section section-pad" data-screen-label="11 Reviews">
      <div className="container-wide">
        <div className="reveal" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:64, gap:24, flexWrap:"wrap" }}>
          <div>
            <div className="section-label">Customer Reviews  /  N°09</div>
            <h2 className="display-l">What riders<br/><span className="serif-italic">say about us.</span></h2>
          </div>
          <a href="https://search.google.com/local/writereview?placeid=ChIJbbM4_V7zfVMRmOhSjhXRP9o&source=g.page.m._" target="_blank" rel="noopener"
            className="btn btn-outline" data-cursor="link">Leave a Review <ArrowRight /></a>
        </div>

        {reviews.length > 0 ? (
          <div className="reveal home-testimonials-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2 }}>
            {reviews.map((r, i) => <ReviewCard key={i} {...r} />)}
          </div>
        ) : (
          <div className="reveal home-testimonials-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2 }}>
            {[
              { author:"Sarah K.",  time:"Feb 2025", rating:5, text:"Brought my Sentinel in after a rough crash on Knox Mountain. The team had it back in perfect shape within two days. These guys actually ride the trails they service bikes for — you can feel the difference." },
              { author:"Mike T.",   time:"Jan 2025", rating:5, text:"Picked up a Bobcat Trail 4 for my son last fall. Staff spent 45 minutes with us, no pressure, making sure the fit was right. A year later it's still running perfectly. Best bike shop in the Okanagan." },
              { author:"Jess R.",   time:"Mar 2025", rating:5, text:"Full suspension service and tubeless conversion on my Switchblade. Mechanic knew the bike better than I did, explained everything, and the ride difference is night and day. Worth every cent." },
              { author:"Dan W.",    time:"Nov 2024", rating:5, text:"Winter storage program is a game changer. Dropped off in October, picked up in April with a full tune-up included. Bike was literally better than when I left it." },
              { author:"Kat M.",    time:"Dec 2024", rating:5, text:"I was completely new to mountain biking and nervous about buying something expensive. Nobody talked down to me — they helped me find the right hardtail for Bear Creek. I've been riding every weekend since." },
              { author:"Rob L.",    time:"Apr 2025", rating:5, text:"Fitting session with the team was incredible. Three weeks in and I've already shaved 8 minutes off my Myra Canyon lap. The saddle height change alone was worth the appointment." },
            ].map((r, i) => <ReviewCard key={i} {...r} />)}
          </div>
        )}

        <div className="reveal" style={{ textAlign:"center", marginTop:32 }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-400)" }}>
            {rating} ★{total ? `  ·  ${total} reviews` : ""}  ·  Google Reviews  ·{" "}
            <a href="https://maps.google.com/?q=ChainLine+Cycle+Kelowna" target="_blank" rel="noopener"
              style={{ color:"var(--gray-400)", textDecoration:"underline" }}>View all on Google</a>
          </div>
        </div>
      </div>
    </section>
  );
};

// Newsletter
const Newsletter = () => {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  return (
    <section className="section section-pad bg-black" data-screen-label="13 Newsletter">
      <div className="container-narrow">
        <div className="reveal home-newsletter-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 64, alignItems: "center" }}>
          <div>
            <div className="section-label" style={{ color: "var(--gray-300)" }}>Field Mail  /  N°10</div>
            <h2 className="display-l">Stay in the<br/><span className="serif-italic">loop.</span></h2>
          </div>
          <div>
            <p style={{ color: "var(--gray-300)", fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
              New bikes, trail conditions, group rides, and the occasional sale. One email a fortnight, no filler.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); if (email) setSent(true); }} style={{ display: "flex", borderBottom: "1px solid var(--gray-300)", paddingBottom: 12 }}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--white)", fontFamily: "var(--body)", fontSize: 16, padding: "8px 0" }} />
              <button type="submit" data-cursor="link" style={{ fontFamily: "var(--display)", fontSize: 12, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--white)", display: "flex", alignItems: "center", gap: 10 }}>
                {sent ? "Subscribed ✓" : "Subscribe"} <ArrowRight />
              </button>
            </form>
            <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gray-500)" }}>By subscribing you agree to our privacy policy.</div>
          </div>
        </div>
      </div>
    </section>
  );
};

Object.assign(window, { Hero, FeaturedBikes, StatsBar, BrandsGrid, ServicesPreview, BookBanner, LocalStory, BikeScroller, GearHScroll, GroupRidesTeaser, TrailSpotlight, DemoStrip, Testimonials, Newsletter, FEATURED_BIKES, BikeCard, SERVICES });
