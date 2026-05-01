// ChainLine — App shell

// ── URL hash routing ──────────────────────────────────────────
const _BRANDS    = ["marin","transition","surly","pivot","salsa","bianchi","moots","knolly","revel"];
const _TYPES     = ["mountain","gravel","road","e-bike","commuter","comfort","kids"];
const _PART_TABS = ["drivetrain","brakes","wheels","cockpit","suspension","helmets","protection","shoes","clothing","tools","bags","lights","locks","racks","fit","accessories"];
const _COMP_TABS = ["drivetrain","brakes","wheels","cockpit","suspension"];
const _ACC_TABS  = ["helmets","protection","shoes","clothing","tools","bags","lights","locks","racks","fit","accessories"];
const _PAGES     = ["services","book","about","contact","rides","trails","events","clinics","classifieds","giftcards","brands","terms","privacy","demo","warranty","fitting","storage","social","mtbco"];
const partPageFor = (tab) => _ACC_TABS.includes(tab) ? "accessories" : "components";

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
  if (s1 === 'store') return { page: 'store', intent: null };
  if (s1 === 'components') return { page: 'components', intent: s2 && _PART_TABS.includes(s2) ? { tab: s2 } : null };
  if (s1 === 'accessories') return { page: 'accessories', intent: s2 && _PART_TABS.includes(s2) ? { tab: s2 } : null };
  if (s1 === 'parts') return { page: 'parts', intent: s2 && _PART_TABS.includes(s2) ? { tab: s2 } : null };
  if (_PAGES.includes(s1)) return { page: s1, intent: null };

  if (s1 === 'e-bikes-kelowna') return { page: 'type-landing', intent: { type: 'e-bike' } };
  // Programmatic SEO: /[brand]-bikes-kelowna, /[type]-bikes-kelowna
  const bikeKelownaMatch = s1.match(/^(.+?)-bikes-kelowna$/);
  if (bikeKelownaMatch) {
    const slug = bikeKelownaMatch[1];
    if (_BRANDS.includes(slug)) return { page: 'brand-landing', intent: { brand: slug } };
    if (_TYPES.includes(slug)) return { page: 'type-landing', intent: { type: slug } };
  }
  // Programmatic SEO: service landing pages
  const _SVC_ROUTES = { 'bike-tune-up-kelowna': 'tune-up', 'bike-fitting-kelowna': 'fitting', 'bike-storage-kelowna': 'storage', 'bike-demo-kelowna': 'demo' };
  if (_SVC_ROUTES[s1]) return { page: 'service-landing', intent: { service: _SVC_ROUTES[s1] } };

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
  if (page === 'store')       return '/store';
  if (page === 'components')  return intent?.tab ? `/components/${intent.tab}`  : '/components';
  if (page === 'parts')       return intent?.tab ? `/parts/${intent.tab}`       : '/parts';
  if (page === 'accessories') return intent?.tab ? `/accessories/${intent.tab}` : '/accessories';
  if (page === 'brand-landing') return `/${intent?.brand}-bikes-kelowna`;
  if (page === 'type-landing')  return `/${intent?.type === 'e-bike' ? 'e-bikes' : intent?.type + '-bikes'}-kelowna`;
  if (page === 'service-landing') {
    const svcSlug = { 'tune-up': 'bike-tune-up-kelowna', 'fitting': 'bike-fitting-kelowna', 'storage': 'bike-storage-kelowna', 'demo': 'bike-demo-kelowna' };
    return `/${svcSlug[intent?.service] || 'services'}`;
  }
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
  const [intentState, setIntentState] = React.useState(() => pathToRoute(window.location.pathname).intent);
  const [scrolled, setScrolled] = React.useState(false);
  const [pwaInstallable, setPwaInstallable] = React.useState(false);
  const [pwaDismissed, setPwaDismissed] = React.useState(() => !!localStorage.getItem('pwa-dismissed'));
  React.useEffect(() => {
    const onInstallable = () => setPwaInstallable(true);
    const onInstalled   = () => { setPwaInstallable(false); setPwaDismissed(true); };
    window.addEventListener('pwa:installable', onInstallable);
    window.addEventListener('pwa:installed', onInstalled);
    if (window._pwaPrompt) setPwaInstallable(true);
    return () => { window.removeEventListener('pwa:installable', onInstallable); window.removeEventListener('pwa:installed', onInstalled); };
  }, []);
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

  React.useEffect(() => {
    const onCartOpen = () => setCartOpen(true);
    window.addEventListener('cart:open', onCartOpen);
    return () => window.removeEventListener('cart:open', onCartOpen);
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
      // "parts" is now its own page again
      const cur = window.cl.currentPage;
      if (cur && cur !== p) window.cl.history.push({ page: cur, intent: window.cl.intent });
      if (window.cl.history.length > 20) window.cl.history.shift();
      window.cl.currentPage = p;
      window.cl.intent = intent || null;
      _fromCode = true;
      window.history.pushState({ page: p, intent: intent || null }, '', routeToPath(p, intent));
      setTimeout(() => { _fromCode = false; }, 50);
      setPage(p);
      setIntentState(intent || null);
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
      setIntentState(intent);
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener('popstate', onPopState);

    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Scroll
  React.useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      if (page === "book") {
        setShowSticky(false);
      } else if (page === "home") {
        // Hide while the hero CTA is still on screen (~100vh hero); appear once it's gone
        setShowSticky(window.scrollY > window.innerHeight * 0.82);
      } else {
        setShowSticky(window.scrollY > 80);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [page]);

  // Per-route title + meta description + canonical
  React.useEffect(() => {
    const intent = window.cl?.intent;
    const brand = intent?.brand;
    const type = intent?.type;
    const tab = intent?.tab;
    const META = {
      home:        ["ChainLine Cycle — Kelowna's Bike Shop. Since 2009.", "Kelowna's performance bike shop since 2009. Marin, Transition, Surly, Pivot, Salsa, Bianchi, Moots. Expert mechanics, bike fitting, storage."],
      shop:        [brand ? `${brand} Bikes Kelowna | ChainLine Cycle` : type ? `${type} Bikes Kelowna | ChainLine Cycle` : "Bikes In Stock | ChainLine Cycle", brand ? `Shop ${brand} bikes in Kelowna. In-stock at ChainLine Cycle — expert assembly, full warranty support.` : "Shop bikes in stock at ChainLine Cycle, Kelowna. Mountain, gravel, road, e-bikes and kids bikes. Expert mechanics on site."],
      services:    ["Bike Service Kelowna | ChainLine Cycle", "Expert bike service in Kelowna. Tune-ups, hydraulic brakes, suspension, custom builds, wheel building. Same-day turnaround available."],
      book:        ["Book a Bike Service | ChainLine Cycle Kelowna", "Book your bike service online. Tune-ups, flat fixes, brake bleeds and more. Real availability, no phone tag."],
      fitting:     ["Professional Bike Fitting Kelowna | ChainLine Cycle", "Expert bike fitting in Kelowna with video analysis. Road, mountain, gravel positions. From $80."],
      storage:     ["Bike Storage Kelowna | ChainLine Cycle", "Secure, dry bike storage in Kelowna. Climate-controlled facility. Spring-ready return service included."],
      demo:        ["Demo Fleet | ChainLine Cycle Kelowna", "Try before you buy. Demo our fleet of mountain, gravel and e-bikes on Kelowna's trails."],
      components:  [tab ? `${tab.charAt(0).toUpperCase()+tab.slice(1)} Parts | ChainLine Cycle` : "Bike Components | ChainLine Cycle", "In-stock bike components in Kelowna. Drivetrain, brakes, suspension, cockpit and wheels."],
      accessories: ["Bike Accessories Kelowna | ChainLine Cycle", "Helmets, gloves, shoes, lights, locks, bags and tools. In stock at ChainLine Cycle, Kelowna."],
      parts:       [tab ? `${tab.charAt(0).toUpperCase()+tab.slice(1)} | ChainLine Cycle Kelowna` : "Bike Parts Kelowna | ChainLine Cycle", "In-stock bike parts in Kelowna. Drivetrain, brakes, wheels, suspension, cockpit and more."],
      trails:      ["Kelowna Mountain Bike Trails | ChainLine Cycle", "Trail guide for Knox Mountain, Bear Creek, Myra Canyon and Kelowna Bike Park. Conditions, maps and local knowledge."],
      rides:       ["Group Rides Kelowna | ChainLine Cycle", "Join ChainLine's weekly group rides in Kelowna. All abilities welcome. Thursday and Friday evenings."],
      events:      ["Bike Events Kelowna | ChainLine Cycle", "Upcoming mountain bike events, races and rides near Kelowna. Marin Wildside Enduro, Smith Creek Enduro and more."],
      clinics:     ["MTB Skill Clinics Kelowna | ChainLine Cycle", "Mountain bike skill clinics in Kelowna with McGee Cycle. PMBIA-certified coaches, adult and youth programs, Knox Mountain and Gillard trails."],
      about:       ["About ChainLine Cycle | Kelowna's Bike Shop Since 2009", "ChainLine Cycle — Kelowna's only full-service performance bike shop. Four dedicated mechanics, real riders."],
      contact:     ["Contact ChainLine Cycle | 1139 Ellis St, Kelowna", "Get in touch with ChainLine Cycle. 1139 Ellis St, Kelowna BC. (250) 860-1968 · bikes@chainline.ca."],
      giftcards:   ["Gift Cards | ChainLine Cycle Kelowna", "Give the gift of bikes. ChainLine Cycle gift cards — valid on bikes, parts, accessories and services."],
      brands:      ["Bike Brands | ChainLine Cycle Kelowna", "Authorized dealer for Marin, Transition, Surly, Pivot, Salsa, Bianchi, Moots, Knolly and Revel in Kelowna, BC."],
      classifieds: ["Used Bikes Kelowna | ChainLine Classifieds", "Buy and sell used bikes in Kelowna. Community classifieds powered by ChainLine Cycle."],
      social:      ["ChainLine Cycle on Social | Kelowna MTB Community", "Follow ChainLine on Instagram, Facebook, YouTube, Pinkbike and Strava. Kelowna's mountain bike community."],
      mtbco:       ["MTBCO — Kelowna Mountain Bike Club | ChainLine Cycle", "ChainLine Cycle supports the Mountain Bike Club of the Okanagan. Lost Lake Loop, Pink Highway and trail building in the Okanagan."],
      warranty:    ["Bike Warranty Service Kelowna | ChainLine Cycle", "Warranty claims for Marin, Transition, Surly, Pivot, Salsa, Bianchi, Moots and more. Authorized dealer in Kelowna, BC."],
      terms:       ["Terms of Service | ChainLine Cycle", "ChainLine Cycle terms of service and purchase policies."],
      store:       ["Shop Bikes & Gear | ChainLine Cycle Kelowna", "Browse in-stock bikes, parts and accessories at ChainLine Cycle. Kelowna's performance bike shop since 2009."],
      privacy:     ["Privacy Policy | ChainLine Cycle", "ChainLine Cycle privacy policy. How we handle your personal information."],
    };
    const setMeta = (t, d, c) => {
      document.title = t;
      document.querySelector('meta[name="description"]')?.setAttribute('content', d);
      document.querySelector('link[rel="canonical"]')?.setAttribute('href', c);
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', t);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', d);
      document.querySelector('meta[property="og:url"]')?.setAttribute('content', c);
      document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', t);
      document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', d);
    };
    // Programmatic landing page meta (dynamic per brand/type/service)
    const brandSlug = intent?.brand;
    const typeSlug  = intent?.type;
    const svcSlug   = intent?.service;
    const brandName = brandSlug ? brandSlug.charAt(0).toUpperCase() + brandSlug.slice(1) : "";
    const typeName  = typeSlug  ? (typeSlug === "e-bike" ? "E-Bike" : typeSlug.charAt(0).toUpperCase() + typeSlug.slice(1)) : "";
    const svcTitles = { 'tune-up': 'Bike Tune-Up', 'fitting': 'Bike Fitting', 'storage': 'Bike Storage', 'demo': 'Bike Demo' };
    const svcDescs  = { 'tune-up': 'Expert bike tune-up in Kelowna at ChainLine Cycle. Drivetrain service, brake adjustment, bearing check. From $75. Same-day available.', 'fitting': 'Professional bike fitting in Kelowna. Video analysis, full position setup. Road, mountain, gravel. From $80.', 'storage': 'Secure bike storage in Kelowna. Climate-controlled, spring tune-up included. From $180/season.', 'demo': 'Demo bikes in Kelowna at ChainLine Cycle. Test before you buy. Demo fee credited toward purchase.' };
    if (page === 'bike') {
      const bike = window.cl?.intent?.bike;
      if (bike) {
        const n = bike.name || bike.title;
        const br = bike.brand || bike.vendor || '';
        const can = `https://chainline.ca/bike/${bike.handle}`;
        setMeta(`${br ? br + ' ' : ''}${n} | ChainLine Cycle Kelowna`, `${br ? br + ' ' : ''}${n} available at ChainLine Cycle in Kelowna, BC. Expert assembly, warranty support, and local trail knowledge.`, can);
        return;
      }
    }
    if (page === 'brand-landing' && brandName) {
      setMeta(`${brandName} Bikes Kelowna | ChainLine Cycle`, `Authorized ${brandName} dealer in Kelowna, BC. In-stock ${brandName} bikes at ChainLine Cycle — expert mechanics, warranty service, local trail knowledge.`, `https://chainline.ca/${brandSlug}-bikes-kelowna`);
      return;
    }
    if (page === 'type-landing' && typeName) {
      const typeUrl = typeSlug === 'e-bike' ? 'e-bikes-kelowna' : `${typeSlug}-bikes-kelowna`;
      setMeta(`${typeName} Bikes Kelowna | ChainLine Cycle`, `Shop ${typeName.toLowerCase()} bikes in Kelowna at ChainLine Cycle. Expert advice, in-stock selection, professional fitting. Kelowna's performance bike shop since 2009.`, `https://chainline.ca/${typeUrl}`);
      return;
    }
    if (page === 'service-landing' && svcSlug) {
      const svcRoutes = { 'tune-up': 'bike-tune-up-kelowna', 'fitting': 'bike-fitting-kelowna', 'storage': 'bike-storage-kelowna', 'demo': 'bike-demo-kelowna' };
      setMeta(`${svcTitles[svcSlug] || 'Bike Service'} Kelowna | ChainLine Cycle`, svcDescs[svcSlug] || '', `https://chainline.ca/${svcRoutes[svcSlug]}`);
      return;
    }

    const [title, desc] = META[page] || META.home;
    setMeta(title, desc, `https://chainline.ca${routeToPath(page, intent)}`);
  }, [page]);

  // Silent background cache warmer — starts 4s after initial load
  React.useEffect(() => {
    const t = setTimeout(() => window.lightspeedWarmCache?.(), 4000);
    return () => clearTimeout(t);
  }, []);

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

      {pwaInstallable && !pwaDismissed && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:300, background:"var(--black)", color:"var(--white)", display:"flex", alignItems:"center", gap:16, padding:"14px 20px", boxShadow:"0 4px 32px rgba(0,0,0,0.5)", maxWidth:420, width:"calc(100% - 48px)" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"var(--display)", fontSize:13, fontWeight:600, textTransform:"uppercase", letterSpacing:"-.01em" }}>Install ChainLine</div>
            <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(255,255,255,0.5)", marginTop:2 }}>Add to home screen — works offline</div>
          </div>
          <button onClick={() => { window._pwaPrompt?.prompt(); setPwaInstallable(false); }} data-cursor="link"
            style={{ background:"var(--white)", color:"var(--black)", border:"none", padding:"8px 16px", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase", cursor:"pointer", flexShrink:0 }}>
            Install
          </button>
          <button onClick={() => { setPwaDismissed(true); localStorage.setItem('pwa-dismissed','1'); }} data-cursor="link"
            style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontFamily:"var(--mono)", fontSize:11, flexShrink:0, padding:"4px 0" }}>✕</button>
        </div>
      )}

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
            <Newsletter />
          </>
        )}
        {page === "shop" && <ShopPage />}
        {page === "bike" && <BikePage bike={intentState?.bike} onBack={() => window.cl.go("shop")} onCart={() => setCartOpen(true)} />}
        {page === "services" && <ServicesPage />}
        {page === "book" && <BookPage />}
        {page === "about" && <AboutPage />}
        {page === "rides" && <RidesPage />}
        {page === "trails" && <TrailsPage />}
        {page === "contact" && <ContactPage />}
        {page === "giftcards" && <GiftCardsPage />}
        {page === "store"       && <StorePage />}
        {page === "components"  && <PartsPage key={intentState?.tab || 'drivetrain'} pageType="components" />}
        {page === "parts"       && (intentState?.tab ? <PartsPage key={"p-"+intentState.tab} pageType="components" /> : <PartsLandingPage />)}
        {page === "accessories" && <PartsPage key={intentState?.tab || 'helmets'} pageType="accessories" />}
        {page === "classifieds" && <ClassifiedsPage />}
        {page === "brands" && <BrandPage />}
        {page === "terms" && <TermsPage />}
        {page === "privacy" && <PrivacyPage />}
        {page === "warranty" && <WarrantyPage />}
        {page === "demo" && <DemoPage />}
        {page === "fitting" && <FittingPage />}
        {page === "storage" && <StoragePage />}
        {page === "events" && <EventsPage />}
        {page === "clinics" && <ClinicsPage />}
        {page === "social" && <SocialPage />}
        {page === "mtbco" && <MTBCOPage />}
        {page === "brand-landing"   && window.BrandLandingPage   && React.createElement(window.BrandLandingPage,   { brand:   intentState?.brand })}
        {page === "type-landing"    && window.TypeLandingPage    && React.createElement(window.TypeLandingPage,    { type:    intentState?.type })}
        {page === "service-landing" && window.ServiceLandingPage && React.createElement(window.ServiceLandingPage, { service: intentState?.service })}
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
