// ChainLine — App shell

const Cursor = () => {
  React.useEffect(() => {
    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;
    let mx = 0, my = 0, rx = 0, ry = 0;
    const onMove = (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`; };
    const tick = () => { rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18; ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`; requestAnimationFrame(tick); };
    const onOver = (e) => {
      const link = e.target.closest("[data-cursor='link'], a, button, input, textarea, select");
      if (link) { dot.classList.add("hover"); ring.classList.add("hover"); }
      else { dot.classList.remove("hover"); ring.classList.remove("hover"); }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    requestAnimationFrame(tick);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseover", onOver); };
  }, []);
  return null;
};

const ScrollProgress = ({ onDark }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? window.scrollY / h : 0;
      if (ref.current) ref.current.style.width = (p * 100) + "%";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div ref={ref} className={"scroll-progress " + (onDark ? "on-dark" : "")} />;
};

const Splash = () => {
  const [gone, setGone] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setGone(true), 1700); return () => clearTimeout(t); }, []);
  return (
    <div className={"splash " + (gone ? "gone" : "")}>
      <div className="splash-mark">
        <span className="mark-glyph" />
        <span className="mark-word">CHAINLINE  ·  KELOWNA</span>
      </div>
    </div>
  );
};

const ExitPopup = ({ enabled }) => {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (!enabled) return;
    let triggered = sessionStorage.getItem("cl-exit") === "1";
    const onLeave = (e) => {
      if (triggered) return;
      if (e.clientY <= 0) { triggered = true; sessionStorage.setItem("cl-exit", "1"); setShow(true); }
    };
    document.addEventListener("mouseleave", onLeave);
    return () => document.removeEventListener("mouseleave", onLeave);
  }, [enabled]);
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,10,0.85)", zIndex: 400, display: "grid", placeItems: "center" }} onClick={() => setShow(false)}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--white)", padding: 64, maxWidth: 520, position: "relative" }}>
        <button onClick={() => setShow(false)} className="link-underline" style={{ position: "absolute", top: 20, right: 24, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>Close</button>
        <div className="eyebrow" style={{ marginBottom: 16 }}>Before you go</div>
        <h2 className="display-l" style={{ marginBottom: 16 }}>10% off your<br/><span className="serif-italic">first service.</span></h2>
        <p style={{ color: "var(--gray-500)", fontSize: 15, marginBottom: 24 }}>One-time code, your inbox, no nonsense.</p>
        <form onSubmit={(e) => { e.preventDefault(); setShow(false); }} style={{ display: "flex", borderBottom: "1px solid var(--black)" }}>
          <input type="email" placeholder="your@email.com" style={{ flex: 1, padding: "12px 0", border: "none", outline: "none", fontFamily: "var(--body)", fontSize: 16, background: "transparent" }} />
          <button className="link-underline" style={{ fontFamily: "var(--display)", fontSize: 12, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase" }}>Get Code →</button>
        </form>
      </div>
    </div>
  );
};

const App = () => {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "displayFont": "Space Grotesk",
    "accentMode": "Pure Mono",
    "accentColor": "#c8392c",
    "heroVariant": 0,
    "imageStyle": "Striped",
    "cursor": true,
    "grain": 0.04
  }/*EDITMODE-END*/;
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [page, setPage] = React.useState("home");
  const [scrolled, setScrolled] = React.useState(false);
  const [showSticky, setShowSticky] = React.useState(false);
  const [megaOpen, setMegaOpen] = React.useState(null);
  const [mobileNav, setMobileNav] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [cart, setCart] = React.useState([
    { brand: "Transition", name: "Sentinel V3", price: 6299, qty: 1 },
    { brand: "Park Tool", name: "PCS-10.3 Repair Stand", price: 425, qty: 1 },
  ]);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  // Apply tweaks
  React.useEffect(() => {
    const fontMap = {
      "Space Grotesk": "'Space Grotesk', 'Helvetica Neue', sans-serif",
      "Bebas Neue": "'Bebas Neue', 'Helvetica Neue', sans-serif",
      "Syne": "'Syne', 'Helvetica Neue', sans-serif",
      "Archivo Black": "'Archivo Black', 'Helvetica Neue', sans-serif",
    };
    document.documentElement.style.setProperty("--display", fontMap[tweaks.displayFont] || fontMap["Space Grotesk"]);
    document.documentElement.style.setProperty("--grain-opacity", tweaks.grain);
    if (tweaks.accentMode === "Single Accent") {
      document.documentElement.style.setProperty("--accent", tweaks.accentColor);
    } else {
      document.documentElement.style.setProperty("--accent", "var(--black)");
    }
    document.body.classList.toggle("custom-cursor", !!tweaks.cursor);
  }, [tweaks]);

  // Routing — supports optional filter intent: cl.go("shop", { type: "Mountain" })
  React.useEffect(() => {
    window.cl = window.cl || {};
    window.cl.go = (p, intent) => {
      window.cl.intent = intent || null;
      setPage(p);
      window.scrollTo({ top: 0, behavior: "auto" });
    };
  }, []);

  // Scroll
  React.useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      setShowSticky(window.scrollY > 800 && page !== "book");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [page]);

  // Reveal observer (re-runs on page change)
  React.useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.in)");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [page, megaOpen]);

  const onDark = page !== "home" || scrolled;
  const dark = page !== "home" && !scrolled;

  return (
    <>
      <Splash />
      <Cursor />
      <ScrollProgress onDark={dark} />
      <div className="grain" />

      <Header page={page} scrolled={scrolled} cartCount={cart.length} onCart={() => setCartOpen(true)} onMobile={() => setMobileNav(true)} onMega={setMegaOpen} megaOpen={megaOpen} />
      <MobileNav open={mobileNav} onClose={() => setMobileNav(false)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} items={cart} onRemove={(i) => setCart(cart.filter((_, idx) => idx !== i))} />
      <StickyCTA show={showSticky} />

      <main key={page}>
        {page === "home" && (
          <>
            <Hero variant={tweaks.heroVariant || 0} />
            <BrandMarquee />
            <FeaturedBikes />
            <StatsBar />
            <BrandsGrid />
            <ServicesPreview />
            <BookBanner />
            <LocalStory />
            <GearHScroll />
            <GroupRidesTeaser />
            <TrailSpotlight />
            <DemoStrip />
            <Testimonials />
            <Newsletter />
          </>
        )}
        {page === "shop" && <ShopPage />}
        {page === "services" && <ServicesPage />}
        {page === "book" && <BookPage />}
        {page === "about" && <AboutPage />}
        {page === "rides" && <RidesPage />}
        {page === "trails" && <TrailsPage />}
        {page === "contact" && <ContactPage />}
      </main>

      <Footer />

      <ExitPopup enabled={page === "home"} />

      {/* Live chat bubble */}
      <button data-cursor="link" style={{ position: "fixed", left: 32, bottom: 32, zIndex: 80, width: 52, height: 52, borderRadius: "50%", background: "var(--black)", color: "var(--white)", display: "grid", placeItems: "center", border: "1px solid var(--black)" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h16v10H8l-4 3v-3H2z"/></svg>
      </button>

      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)}>
        <TweakSection title="Type">
          <TweakSelect label="Display font" value={tweaks.displayFont} options={["Space Grotesk", "Bebas Neue", "Syne", "Archivo Black"]} onChange={(v) => setTweak("displayFont", v)} />
        </TweakSection>
        <TweakSection title="Accent">
          <TweakRadio label="Treatment" value={tweaks.accentMode} options={["Pure Mono", "Single Accent"]} onChange={(v) => setTweak("accentMode", v)} />
          {tweaks.accentMode === "Single Accent" && <TweakColor label="Accent color" value={tweaks.accentColor} onChange={(v) => setTweak("accentColor", v)} />}
        </TweakSection>
        <TweakSection title="Hero">
          <TweakRadio label="Variant" value={String(tweaks.heroVariant)} options={["0", "1", "2"]} onChange={(v) => setTweak("heroVariant", parseInt(v))} />
          <TweakSelect label="Image style" value={tweaks.imageStyle} options={["Striped", "Gradient"]} onChange={(v) => setTweak("imageStyle", v)} />
        </TweakSection>
        <TweakSection title="Effects">
          <TweakToggle label="Custom cursor" value={tweaks.cursor} onChange={(v) => setTweak("cursor", v)} />
          <TweakSlider label="Grain intensity" value={tweaks.grain} min={0} max={0.15} step={0.01} onChange={(v) => setTweak("grain", v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
