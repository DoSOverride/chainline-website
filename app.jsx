// ChainLine — App shell

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


const App = () => {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "displayFont": "Space Grotesk",
    "accentMode": "Pure Mono",
    "accentColor": "#c8392c",
    "heroVariant": 0,
    "imageStyle": "Striped",
    "grain": 0.04
  }/*EDITMODE-END*/;
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [page, setPage] = React.useState("home");
  const [scrolled, setScrolled] = React.useState(false);
  const [showSticky, setShowSticky] = React.useState(false);
  const [megaOpen, setMegaOpen] = React.useState(null);
  const [mobileNav, setMobileNav] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [cart, setCart] = React.useState([]);
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Sync cart from Shopify events
  React.useEffect(() => {
    const onCartUpdate = (e) => {
      const items = (e.detail?.items || []).map(i => ({
        brand: i.vendor || '', name: i.name || i.title, price: i.price, qty: i.qty, image: i.image, variantId: i.variantId,
      }));
      setCart(items);
    };
    window.addEventListener('cart:updated', onCartUpdate);
    return () => window.removeEventListener('cart:updated', onCartUpdate);
  }, []);
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
    }, { threshold: 0.04, rootMargin: "0px 0px 60px 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [page, megaOpen]);

  const onDark = page !== "home" || scrolled;
  const dark = page !== "home" && !scrolled;

  return (
    <>
      <ScrollProgress onDark={dark} />
      <div className="grain" />

      <Header page={page} scrolled={scrolled} cartCount={cart.length} onCart={() => setCartOpen(true)} onMobile={() => setMobileNav(true)} onMega={setMegaOpen} megaOpen={megaOpen} onSearch={() => setSearchOpen(true)} />
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
        {page === "bike" && <BikePage bike={window.cl.intent?.bike} onBack={() => window.cl.go("shop")} onCart={() => setCartOpen(true)} />}
        {page === "services" && <ServicesPage />}
        {page === "book" && <BookPage />}
        {page === "about" && <AboutPage />}
        {page === "rides" && <RidesPage />}
        {page === "trails" && <TrailsPage />}
        {page === "contact" && <ContactPage />}
        {page === "giftcards" && <GiftCardsPage />}
        {page === "parts" && <PartsPage />}
        {page === "classifieds" && <ClassifiedsPage />}
        {page === "brands" && <BrandPage />}
        {page === "terms" && <TermsPage />}
        {page === "privacy" && <PrivacyPage />}
      </main>

      <Footer />

      <ChatWidget />
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

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
          <TweakSlider label="Grain intensity" value={tweaks.grain} min={0} max={0.15} step={0.01} onChange={(v) => setTweak("grain", v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
