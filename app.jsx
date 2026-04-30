// ChainLine — App shell

// ── URL hash routing ──────────────────────────────────────────
const _BRANDS    = ["marin","transition","surly","pivot","salsa","bianchi","moots","knolly","revel"];
const _TYPES     = ["mountain","gravel","road","e-bike","commuter","comfort","kids"];
const _PART_TABS = ["drivetrain","brakes","wheels","cockpit","suspension","fit","tools"];
const _PAGES     = ["services","book","about","contact","rides","trails","classifieds","giftcards","brands","terms","privacy"];

function pathToRoute(pathname) {
  const p = (pathname || '/').replace(/^\//, '').trim();
  if (!p || p === 'home') return { page: 'home', intent: null };
  const [seg1, seg2] = p.split('/');
  const s1 = seg1.toLowerCase(), s2 = (seg2 || '').toLowerCase();

  if (s1 === 'bikes' || s1 === 'shop') {
    if (!s2) return { page: 'shop', intent: null };
    if (_TYPES.includes(s2)) return { page: 'shop', intent: { type: s2 === 'e-bike' ? 'E-Bike' : s2.charAt(0).toUpperCase() + s2.slice(1) } };
    if (_BRANDS.includes(s2)) return { page: 'shop', intent: { brand: s2.charAt(0).toUpperCase() + s2.slice(1) } };
    return { page: 'shop', intent: null };
  }
  if (s1 === 'bike' && s2) {
    const bike = (window.SHOP_BIKES || []).find(b => b.handle === s2);
    return bike ? { page: 'bike', intent: { bike } } : { page: 'shop', intent: null };
  }
  if (s1 === 'parts') return { page: 'parts', intent: s2 && _PART_TABS.includes(s2) ? { tab: s2 } : null };
  if (_PAGES.includes(s1)) return { page: s1, intent: null };
  return { page: 'home', intent: null };
}

function routeToPath(page, intent) {
  if (!page || page === 'home') return '/';
  if (page === 'shop') {
    if (intent?.type) return `/bikes/${intent.type.toLowerCase()}`;
    if (intent?.brand) return `/bikes/${intent.brand.toLowerCase()}`;
    return '/bikes';
  }
  if (page === 'bike') {
    const h = intent?.bike?.handle;
    return h ? `/bike/${h}` : '/bikes';
  }
  if (page === 'parts') return intent?.tab ? `/parts/${intent.tab}` : '/parts';
  return `/${page}`;
}

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
  const [page, setPage] = React.useState(() => {
    const { page: p, intent } = pathToRoute(window.location.pathname);
    window.cl = window.cl || {};
    window.cl.intent = intent;
    window.cl.currentPage = p;
    return p;
  });
  const [scrolled, setScrolled] = React.useState(false);
  const [showSticky, setShowSticky] = React.useState(false);
  const [megaOpen, setMegaOpen] = React.useState(null);
  const [mobileNav, setMobileNav] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [cart, setCart] = React.useState([]);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(() => localStorage.getItem('cl-theme') === 'dark');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('cl-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Sync cart from Shopify events
  React.useEffect(() => {
    const onCartUpdate = (e) => {
      const items = (e.detail?.items || []).map(i => ({
        brand: i.vendor || '', name: i.name || i.title, price: i.price, qty: i.qty, image: i.image, variantId: i.variantId, variant: i.variant || null,
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

  // Routing — hash-based, supports optional filter intent
  React.useEffect(() => {
    window.cl = window.cl || {};
    window.cl.history = window.cl.history || [];
    let _fromCode = false;

    window.cl.go = (p, intent) => {
      const cur = window.cl.currentPage;
      if (cur && cur !== p) window.cl.history.push({ page: cur, intent: window.cl.intent });
      if (window.cl.history.length > 20) window.cl.history.shift();
      window.cl.currentPage = p;
      window.cl.intent = intent || null;
      _fromCode = true;
      window.history.pushState({ page: p, intent: intent || null }, '', routeToPath(p, intent));
      setTimeout(() => { _fromCode = false; }, 50);
      setPage(p);
      window.scrollTo({ top: 0, behavior: "auto" });
    };

    window.cl.back = () => {
      const prev = window.cl.history.pop();
      if (prev) window.cl.go(prev.page, prev.intent);
      else window.cl.go("shop");
    };

    // Browser back/forward via popstate
    const onPopState = (e) => {
      if (_fromCode) return;
      const { page: p, intent } = e.state?.page
        ? { page: e.state.page, intent: e.state.intent }
        : pathToRoute(window.location.pathname);
      window.cl.currentPage = p;
      window.cl.intent = intent;
      setPage(p);
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener('popstate', onPopState);

    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Scroll
  React.useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      setShowSticky(page !== "book");
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
      <ScrollProgress onDark={dark} />
      <div className="grain" />

      <Header page={page} scrolled={scrolled} cartCount={cart.length} onCart={() => setCartOpen(true)} onMobile={() => setMobileNav(true)} onMega={setMegaOpen} megaOpen={megaOpen} onSearch={() => setSearchOpen(true)} darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
      <MobileNav open={mobileNav} onClose={() => setMobileNav(false)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} items={cart} onRemove={(i) => setCart(cart.filter((_, idx) => idx !== i))} />
      <StickyCTA show={showSticky} />

      <main key={page}>
        {page === "home" && (
          <>
            <Hero variant={tweaks.heroVariant || 0} />
            <BrandMarquee />
            <BikeScroller />
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
