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
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.2) 40%, rgba(10,10,10,0.85) 100%)" }} />
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
      <style>{`
        @media(max-width:768px){
          .hero-content{padding-top:190px!important;padding-bottom:60px!important;justify-content:flex-start!important}
          .hero-section{height:100svh!important;min-height:600px!important}
        }
      `}</style>
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
          <div style={{ display: "flex", gap: 16, opacity: 0, animation: "splitIn 1s 1.6s forwards ease", transform: "translateY(20px)" }}>
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
      <style>{`@keyframes scrollDrip { 0% { top: -40px; } 100% { top: 80px; } }`}</style>

    </section>
  );
};

// Featured bikes — sourced from real ChainLine inventory
const FEATURED_BIKES = [
  {"brand":"Transition","name":"Sentinel","type":"Mountain","rawType":"Mountain Bike","price":8900,"badge":"PRO","img":"https://www.transitionbikes.com/images/Sentinel_MainPage_HannahBlur.jpg","handle":"transition-sentinel"},
  {"brand":"Pivot","name":"Switchblade Ride Eagle 70/90","type":"Mountain","rawType":"Mountain Bike","price":8000,"badge":"PRO","img":"https://cms.pivotcycles.com/wp-content/uploads/2025/11/switchbladev3-highlight-right-aurhm3my.jpg","handle":"pivot-switchblade-ride-eagle-70-90"},
  {"brand":"Surly","name":"Bridge Club","type":"Gravel","rawType":"Gravel Bike","price":1850,"badge":null,"img":"https://surlybikes.com/cdn/shop/files/surly-bridge-club-bike-lingering-cranberry-BK01508.jpg?v=1773411087&width=1946","handle":"surly-bridge-club"},
  {"brand":"Marin","name":"Gestalt 2","type":"Gravel","rawType":"Gravel Bike","price":2000,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_GESTALT_2_BLACK_SIDE_grande.png?v=1753870775","handle":"marin-gestalt-2"},
  {"brand":"Marin","name":"Pine Mountain 1 29","type":"Mountain","rawType":"Mountain Bike","price":1960,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2024_MARIN_BIKES_PINE_MOUNTAIN_1_BLUE_SIDE_1_grande.png?v=1753864935","handle":"marin-pine-mountain-1-29"},
  {"brand":"Marin","name":"Stinson E","type":"E-Bike","rawType":"Electric Bike","price":2100,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_STINSON_E_BLACK_SIDE_1_grande.png?v=1753862906","handle":"marin-stinson-e"},
  {"brand":"Marin","name":"Four Corners 1","type":"Touring","rawType":"Touring Bike","price":1600,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_FOUR_CORNERS_1_BLACK_SIDE_grande.png?v=1753786228","handle":"marin-four-corners-1"},
  {"brand":"Transition","name":"Spire Carbon Eagle 90","type":"Mountain","rawType":"Mountain Bike","price":9700,"badge":"PRO","img":"https://www.transitionbikes.com/images/MainLandingImage_Spire2020_V2.jpg","handle":"transition-spire-carbon-eagle-90"}
];

// Full catalog — used by Shop page
const BIKE_CATALOG = [
  {"brand":"Marin","name":"Bobcat Trail 4 27.5","type":"Mountain","rawType":"Mountain Bike","price":1000,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOBCAT_TRAIL_4_275_BLUE_SIDE_grande.png?v=1753779684","handle":"marin-bobcat-trail-4-27-5"},
  {"brand":"Marin","name":"Fairfax 2","type":"Dual-Sport","rawType":"Dual-Sport Bike","price":960,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2022_MARIN_FAIRFAX_2_MAROON_SIDE_391346d2-76af-4fa7-8e8a-4f0a68e0cf32_grande.png?v=1753872171","handle":"marin-fairfax-2"},
  {"brand":"Marin","name":"Gestalt X10","type":"Gravel","rawType":"Gravel Bike","price":1400,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2023_Gestalt_X10_GalleryE_side.jpg?v=1744825311&width=1000","handle":"marin-gestalt-x10"},
  {"brand":"Marin","name":"Bolinas Ridge 1 27.5","type":"Mountain","rawType":"Mountain Bike","price":760,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOLINAS_RIDGE_1_27_CHARCOAL_SIDE_grande.png?v=1755782077","handle":"marin-bolinas-ridge-1-27-5"},
  {"brand":"Marin","name":"Bolinas Ridge 1 29","type":"Mountain","rawType":"Mountain Bike","price":760,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOLINAS_RIDGE_1_27_CHARCOAL_SIDE_grande.png?v=1755782077","handle":"marin-bolinas-ridge-1-29"},
  {"brand":"Marin","name":"Bobcat Trail 3 29","type":"Mountain","rawType":"Mountain Bike","price":960,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOBCAT_TRAIL_3_29_RED_GRAY_SIDE_grande.png?v=1753779938","handle":"marin-bobcat-trail-3-29"},
  {"brand":"Marin","name":"Bobcat Trail 4 29","type":"Mountain","rawType":"Mountain Bike","price":1060,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOBCAT_TRAIL_4_275_BLUE_SIDE_grande.png?v=1753779684","handle":"marin-bobcat-trail-4-29"},
  {"brand":"Marin","name":"Wildcat Trail 1 27.5","type":"Mountain","rawType":"Mountain Bike","price":860,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_FAIRFAX_E_SILVER_SIDE.png?v=1753785175&width=500","handle":"marin-wildcat-trail-1-27-5"},
  {"brand":"Marin","name":"Pine Mountain 1 29","type":"Mountain","rawType":"Mountain Bike","price":1960,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2024_MARIN_BIKES_PINE_MOUNTAIN_1_BLUE_SIDE_1_grande.png?v=1753864935","handle":"marin-pine-mountain-1-29"},
  {"brand":"Marin","name":"Fairfax 1","type":"Dual-Sport","rawType":"Dual-Sport Bike","price":700,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_FAIRFAX_1_RED_SIDE_4f661e02-11de-454f-bb55-5ef9d8d805fc_grande.png?v=1755769099","handle":"marin-fairfax-1"},
  {"brand":"Marin","name":"Kentfield ST 1","type":"Comfort","rawType":"Comfort/Cruiser Bike","price":670,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_FAIRFAX_E_SILVER_SIDE.png?v=1753785175&width=500","handle":"marin-kentfield-st-1"},
  {"brand":"Marin","name":"Stinson 1 27.5","type":"Comfort","rawType":"Comfort/Cruiser Bike","price":860,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2024_MARIN_STINSON_1_BLACK_SIDE_grande.png?v=1755792681","handle":"marin-stinson-1-27-5"},
  {"brand":"Marin","name":"Bayview Trail","type":"Kids","rawType":"Kids Bike","price":600,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BAYVIEW_TRAIL_24_RED_SIDE_b00a2921-5476-4067-9ed7-c48ee7cd06c1.png?v=1755780477&width=500","handle":"marin-bayview-trail"},
  {"brand":"Transition","name":"Sentinel","type":"Mountain","rawType":"Mountain Bike","price":8900,"badge":"PRO","img":"https://www.transitionbikes.com/images/Sentinel_MainPage_HannahBlur.jpg","handle":"transition-sentinel"},
  {"brand":"Marin","name":"Rift Zone Jr","type":"Kids","rawType":"Kids Bike","price":2200,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_RIFT_ZONE_JR_24_GREEN_SIDE_grande.png?v=1753783522","handle":"marin-rift-zone-jr"},
  {"brand":"Marin","name":"Presidio 3","type":"Gravel","rawType":"Gravel Bike","price":1470,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2024_MARIN_PRESIDIO_3_BLUE_SIDE_grande.png?v=1753868606","handle":"marin-presidio-3"},
  {"brand":"Marin","name":"Stinson 2 LS 27.5","type":"Comfort","rawType":"Comfort/Cruiser Bike","price":900,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_STINSON_LS_2_SILVER_SIDE_grande.png?v=1753799688","handle":"marin-stinson-2-ls-27-5"},
  {"brand":"Marin","name":"Bolinas Ridge 2 29","type":"Mountain","rawType":"Mountain Bike","price":800,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOLINAS_RIDGE_2_27_BLACK_grande.png?v=1755781803","handle":"marin-bolinas-ridge-2-29"},
  {"brand":"Marin","name":"Nicasio 2","type":"Gravel","rawType":"Gravel Bike","price":2300,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_NICASIO_2_RED_SIDE_grande.png?v=1753866430","handle":"marin-nicasio-2"},
  {"brand":"Marin","name":"Kentfield ST 2","type":"Comfort","rawType":"Comfort/Cruiser Bike","price":900,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_FAIRFAX_E_SILVER_SIDE.png?v=1753785175&width=500","handle":"marin-kentfield-st-2"},
  {"brand":"Marin","name":"Stinson E","type":"E-Bike","rawType":"Electric Bike","price":2100,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_STINSON_E_BLACK_SIDE_1_grande.png?v=1753862906","handle":"marin-stinson-e"},
  {"brand":"Marin","name":"Four Corners 1","type":"Touring","rawType":"Touring Bike","price":1600,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_FOUR_CORNERS_1_BLACK_SIDE_grande.png?v=1753786228","handle":"marin-four-corners-1"},
  {"brand":"Marin","name":"Gestalt 2","type":"Gravel","rawType":"Gravel Bike","price":2000,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_GESTALT_2_BLACK_SIDE_grande.png?v=1753870775","handle":"marin-gestalt-2"},
  {"brand":"Marin","name":"Donky Jr","type":"Kids","rawType":"Kids Bike","price":430,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_DONKEY_JR_24_AQUA_BLUE_SIDE_2005a345-ce2b-4b9f-9baf-52f1bb79129a_grande.png?v=1755784888","handle":"marin-donky-jr"},
  {"brand":"Marin","name":"Stinson 1 LS 27.5","type":"Comfort","rawType":"Comfort/Cruiser Bike","price":800,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2024_MARIN_STINSON_1_ST_BROWN_SIDE_grande.png?v=1755792592","handle":"marin-stinson-1-ls-27-5"},
  {"brand":"Pivot","name":"Switchblade Ride Eagle 70/90","type":"Mountain","rawType":"Mountain Bike","price":8000,"badge":"PRO","img":"https://cms.pivotcycles.com/wp-content/uploads/2025/11/switchbladev3-highlight-right-aurhm3my.jpg","handle":"pivot-switchblade-ride-eagle-70-90"},
  {"brand":"Pivot","name":"Shuttle AM Ride Eagle 70/90","type":"E-Bike","rawType":"Electric Bike","price":11500,"badge":"PRO","img":"https://cms.pivotcycles.com/wp-content/uploads/2025/10/shuttleam-photo-gallery-beauty-4-msswiet3.jpg","handle":"pivot-shuttle-am-ride-eagle-70-90"},
  {"brand":"Transition","name":"Regulator CX Eagle 90","type":"E-Bike","rawType":"Electric Bike","price":13000,"badge":"PRO","img":"https://www.transitionbikes.com/WebStoreImages/Carbon_Eagle70_Button.png","handle":"transition-regulator-cx-eagle-90"},
  {"brand":"Surly","name":"Sorceress","type":"Mountain","rawType":"Mountain Bike","price":3400,"badge":null,"img":"https://surlybikes.com/cdn/shop/files/surly-sorceress-eagle-90-bike-purple-BK01561.jpg?v=1774378038&width=1946","handle":"surly-sorceress"},
  {"brand":"Surly","name":"Bridge Club","type":"Gravel","rawType":"Gravel Bike","price":1850,"badge":null,"img":"https://surlybikes.com/cdn/shop/files/surly-bridge-club-bike-lingering-cranberry-BK01508.jpg?v=1773411087&width=1946","handle":"surly-bridge-club"},
  {"brand":"Transition","name":"Spire Carbon Eagle 90","type":"Mountain","rawType":"Mountain Bike","price":9700,"badge":"PRO","img":"https://www.transitionbikes.com/images/MainLandingImage_Spire2020_V2.jpg","handle":"transition-spire-carbon-eagle-90"},
  {"brand":"Marin","name":"San Anselmo DS2","type":"Dual-Sport","rawType":"Dual-Sport Bike","price":960,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2021_San_Anselmo_DS1_Color.jpg?v=1744825386&width=1000","handle":"marin-san-anselmo-ds2"},
  {"brand":"Marin","name":"Bobcat Trail 5 29","type":"Mountain","rawType":"Mountain Bike","price":1360,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_BIKES_BOBCAT_TRAIL_5_275_BLUE_BLACK_FRONT_grande.png?v=1753779495","handle":"marin-bobcat-trail-5-29"},
  {"brand":"Marin","name":"Stinson E ST","type":"Comfort","rawType":"Comfort/Cruiser Bike","price":2100,"badge":null,"img":"https://marinbikes.com/cdn/shop/files/2025_MARIN_STINSON_E_SILVER_SIDE_52da63a1-edc3-401a-a329-2405e10cfb54_grande.png?v=1755715647","handle":"marin-stinson-e-st"}
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
        <div style={{ position: "absolute", top: 16, right: 16, padding: "4px 10px", border: "1px solid var(--black)", color: "var(--black)", background: "rgba(255,255,255,0.85)", fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", zIndex: 2 }}>{b.badge}</div>
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
    <style>{`a:hover .bike-hover { transform: translateY(0); }`}</style>
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

// Brand logos grid
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
        <div className="reveal home-brands-grid" style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", border: "1px solid var(--hairline)", borderRight: 0, borderBottom: 0 }}>
          {brands.map((b, i) => (
            <a key={i} href="#" data-cursor="link" className="brand-tile" style={{ aspectRatio: "1.1/1", display: "grid", placeItems: "center", borderRight: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)", background: "var(--white)", fontFamily: "var(--display)", fontSize: 14, fontWeight: 600, letterSpacing: ".14em", transition: "background .3s, color .3s" }}>
              {b}
            </a>
          ))}
        </div>
        <style>{`.brand-tile:hover { background: var(--black); color: var(--white); }`}</style>
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
  { n: "06", name: "Warranty & Recall Service", desc: "We handle the paperwork. Authorized for all our brands.", price: "NO CHARGE" },
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
      <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "var(--white)", color: "var(--black)", padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div className="eyebrow">{s.n}  ·  STARTING AT</div>
        <div className="display-l" style={{ fontSize: 56 }}>{s.price}</div>
        <button className="btn" data-cursor="link" style={{ alignSelf: "flex-start" }} onClick={() => window.cl.go("book")}>Book Now <ArrowRight /></button>
      </div>
    </div>
    <style>{`.svc-card:hover .svc-inner { transform: rotateY(180deg); }`}</style>
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
          Six dedicated mechanics. Seventeen torque wrenches. One unbreakable rule — no bike leaves the stand until it leaves perfect.
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
        <button className="btn btn-outline" data-cursor="link" onClick={() => window.cl.go("book")}>Book a Fitting <ArrowRight /></button>
      </div>
    </div>
  </section>
);

// Bike image scroller — infinite marquee of bike photos
const BikeScroller = () => {
  const bikes = FEATURED_BIKES.filter(b => b.img);
  const BikeItem = ({ b }) => (
    <div onClick={() => window.cl.go("bike", { bike: b })}
      style={{ flexShrink:0, width:200, height:148, marginRight:20, position:"relative", background:"var(--white)", cursor:"pointer", overflow:"hidden" }}>
      <img src={b.img} alt={b.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain", padding:"8%", mixBlendMode:"multiply" }} />
    </div>
  );
  const Track = () => (
    <div className="marquee-track" style={{ display:"flex" }}>
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
        <div className="reveal ph ph-light ph-corners" style={{ aspectRatio: "4/5", position: "relative" }}>
          <span className="ph-label">SHOP INTERIOR  /  B&W  /  4:5</span>
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
  const cats = [
    { name: "Helmets & Protection", count: "84 products" },
    { name: "Apparel", count: "212 products" },
    { name: "Components", count: "1,408 products" },
    { name: "Tools & Maintenance", count: "326 products" },
    { name: "Bags & Racks", count: "97 products" },
    { name: "Lights & Safety", count: "112 products" },
    { name: "Shoes", count: "68 products" },
    { name: "Nutrition", count: "44 products" },
  ];
  return (
    <section className="section section-pad bg-white" data-screen-label="08 Gear" style={{ paddingBottom: 80 }}>
      <div className="container-wide">
        <div className="reveal" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, gap: 40, flexWrap: "wrap" }}>
          <div>
            <div className="section-label">Gear Up  /  N°05</div>
            <h2 className="display-xl">Parts &<br/><span className="serif-italic">accessories.</span></h2>
          </div>
          <div style={{ display: "flex", gap: 12, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gray-500)" }}>
            <span>Scroll →</span>
          </div>
        </div>
      </div>
      <div className="hscroll" style={{ overflowX: "auto", paddingLeft: 40, paddingRight: 40, scrollSnapType: "x mandatory" }}>
        <div style={{ display: "flex", gap: 24, paddingBottom: 24 }}>
          {cats.map((c, i) => (
            <a key={i} href="#" data-cursor="link" style={{ flex: "0 0 360px", scrollSnapAlign: "start" }}>
              <div className="ph ph-corners" style={{ aspectRatio: "3/4", position: "relative" }}>
                <span className="ph-label">PHOTO  /  3:4  /  B&W</span>
                <div style={{ position: "absolute", top: 20, left: 20, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gray-300)" }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, color: "var(--white)" }}>
                  <div className="display-m" style={{ marginBottom: 8 }}>{c.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gray-300)" }}>
                    <span>{c.count}</span>
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
  const rides = [
    { date: "MON 28 APR", name: "Knox Mountain Monday", meta: "MTB · 22km · 650m", level: "Intermediate" },
    { date: "WED 30 APR", name: "Lunch Loop", meta: "Road · 35km · Flat", level: "All abilities" },
    { date: "SAT 03 MAY", name: "Gravel Sundays", meta: "Gravel · 75km · Backcountry", level: "Advanced" },
  ];
  return (
    <section className="section section-pad bg-black" data-screen-label="09 Group Rides">
      <div className="container-wide">
        <div className="home-2col" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 80, alignItems: "center" }}>
          <div className="reveal ph ph-corners" style={{ aspectRatio: "5/4" }}>
            <span className="ph-label">GROUP RIDE  /  B&W  /  5:4</span>
          </div>
          <div className="reveal reveal-d-2">
            <div className="section-label" style={{ color: "var(--gray-300)" }}>Community  /  N°06</div>
            <h2 className="display-xl" style={{ marginBottom: 24 }}>Ride <span className="serif-italic">with us.</span></h2>
            <p style={{ fontSize: 16, color: "var(--gray-300)", lineHeight: 1.6, marginBottom: 40 }}>
              Five regular rides every week. Road, gravel, mountain, social. Show up, clip in, leave faster than you came.
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
          <a href="#" data-cursor="link" className="reveal ph ph-corners" style={{ aspectRatio: "16/10", position: "relative" }}>
            <span className="ph-label">HERO TRAIL  /  KNOX MOUNTAIN  /  16:10</span>
            <div style={{ position: "absolute", left: 32, right: 32, bottom: 32, color: "var(--white)" }}>
              <div className="eyebrow eyebrow-light" style={{ marginBottom: 12 }}>Featured  ·  Spring–Fall</div>
              <div className="display-l" style={{ marginBottom: 16 }}>{trails[0].name}</div>
              <div style={{ display: "flex", gap: 24, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gray-300)", alignItems: "center" }}>
                <Dots n={trails[0].dots} />
                <span>{trails[0].km} km</span>
                <span>{trails[0].gain} m gain</span>
                <span>{trails[0].type}</span>
              </div>
            </div>
          </a>
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 32 }}>
            {trails.slice(1).map((t, i) => (
              <a key={i} href="#" data-cursor="link" className="reveal reveal-d-2 ph ph-corners" style={{ position: "relative", minHeight: 220 }}>
                <span className="ph-label">TRAIL  /  {t.name.toUpperCase()}</span>
                <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, color: "var(--white)" }}>
                  <div className="display-m" style={{ marginBottom: 8 }}>{t.name}</div>
                  <div style={{ display: "flex", gap: 16, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gray-300)", alignItems: "center" }}>
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

// Testimonials
const Testimonials = () => {
  const t = [
    { quote: "These folks built me a wheel that's stayed true for three seasons of bike park abuse. Nobody else in the valley does it like ChainLine.", name: "Marcus W.", ride: "Trail / Bike Park" },
    { quote: "I came in with a budget and a vague idea. They listened, didn't upsell me once, and put me on the right bike on the first try.", name: "Eliana K.", ride: "Gravel / Commuter" },
    { quote: "The bike fit changed my riding. Two hours, video analysis, no rush. I bought my last bike here. I'll buy my next one here too.", name: "David R.", ride: "Road" },
  ];
  return (
    <section className="section section-pad bg-paper" data-screen-label="12 Testimonials">
      <div className="container-wide">
        <div className="reveal section-label">What Riders Say  /  N°09</div>
        <div className="home-testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
          {t.map((q, i) => (
            <div key={i} className={"reveal reveal-d-" + (i + 1)} style={{ borderTop: "1px solid var(--hairline)", paddingTop: 32 }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 20, color: "var(--gray-600)" }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 14 }}>★</span>)}
              </div>
              <blockquote className="serif-italic" style={{ fontSize: 24, lineHeight: 1.4, margin: "0 0 24px", color: "var(--black)" }}>
                "{q.quote}"
              </blockquote>
              <div className="eyebrow">{q.name}  ·  {q.ride}</div>
            </div>
          ))}
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

Object.assign(window, { Hero, FeaturedBikes, StatsBar, BrandsGrid, ServicesPreview, BookBanner, LocalStory, BikeScroller, GearHScroll, GroupRidesTeaser, TrailSpotlight, DemoStrip, Testimonials, Newsletter, FEATURED_BIKES, BIKE_CATALOG, BikeCard, SERVICES });
