// ChainLine — Logo glyph (chainlink mark)
const ChainLogo = ({ size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.6" aria-hidden="true">
    <rect x="3" y="11" width="14" height="10" rx="5" />
    <rect x="15" y="11" width="14" height="10" rx="5" />
  </svg>
);

// Brand wordmark — uses the real ChainLine Cycle logo
const Wordmark = () => (
  <a href="#" onClick={(e) => { e.preventDefault(); window.cl.go("home"); }} className="nav-logo" data-cursor="link" aria-label="ChainLine Cycle — Home">
    <img src="logo-dark.png" alt="ChainLine Cycle" className="logo-img" />
  </a>
);

// Announcement bar (rotating)
const Announce = () => {
  const messages = [
    "Free shipping over $150",
    "Book a service online — same-week slots open",
    "Now taking demo bookings for spring 2026",
    "Winter storage program — sign up before Nov 15",
  ];
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % messages.length), 4200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="announce">
      <div className="container" style={{ position: "relative", height: "100%" }}>
        {messages.map((m, idx) => (
          <div key={idx} className={"announce-msg " + (idx === i ? "on" : "")}>
            <span className="dot" />{m}<span className="dot" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Header / Nav
const Header = ({ page, scrolled, onCart, cartCount, onMobile, onMega, megaOpen }) => {
  const items = [
    { id: "shop", label: "Shop", panel: "shop" },
    { id: "services", label: "Services", panel: "services" },
    { id: "explore", label: "Explore", panel: "explore" },
    { id: "about", label: "About", panel: null, route: "about" },
  ];

  const closeTimer = React.useRef(null);
  const openMega = (p) => { if (closeTimer.current) clearTimeout(closeTimer.current); onMega(p); };
  const scheduleClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => onMega(null), 180); };

  return (
    <header className={"header " + (scrolled ? (page === "home" ? "solid" : "light") : "")} data-screen-label="00 Header">
      <Announce />
      <div className="container-wide">
        <div className="nav" onMouseLeave={scheduleClose}>
          <Wordmark />
          <nav className="nav-links">
            {items.map((it) => (
              <div
                key={it.id}
                className={"nav-link " + (page === it.id || (it.route && page === it.route) ? "active" : "")}
                data-cursor="link"
                onMouseEnter={() => it.panel ? openMega(it.panel) : openMega(null)}
                onClick={() => it.route && window.cl.go(it.route)}
              >
                {it.label}
                {it.panel && <span className="chev" />}
              </div>
            ))}
          </nav>
          <div className="nav-utility">
            <button className="nav-utility-btn" data-cursor="link"><span className="nav-utility-text">Search</span><SearchIcon/></button>
            <button className="nav-utility-btn" data-cursor="link"><span className="nav-utility-text">Account</span></button>
            <button className="nav-utility-btn" data-cursor="link" onClick={onCart}>
              <span className="nav-utility-text">Cart</span>
              <span className="cart-count"><span>{cartCount}</span></span>
            </button>
            <button className="menu-toggle" data-cursor="link" onClick={onMobile}>
              <span/><span/><span/>
            </button>
          </div>
        </div>
      </div>
      <MegaMenu open={megaOpen} onOpen={openMega} onClose={scheduleClose} />
    </header>
  );
};

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/>
  </svg>
);

const ArrowRight = ({ size = 12 }) => (
  <svg className="arrow" width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M1 6h10M7 2l4 4-4 4"/>
  </svg>
);

const MegaMenu = ({ open, onOpen, onClose }) => {
  const data = {
    shop: {
      cols: [
        { h: "Bikes", items: ["All Bikes", "Mountain", "Road", "Gravel", "E-Bike", "Commuter", "Kids"] },
        { h: "Parts & Accessories", items: ["Helmets & Protection", "Apparel", "Components", "Tools", "Bags & Racks", "Lights"] },
        { h: "More", items: ["Sale", "Gift Cards", "Classifieds"], feature: { label: "FEATURED  /  THE LINEUP", title: "2026 Marin Rift Zone" } },
      ],
    },
    services: {
      cols: [
        { h: "Book", items: ["Book a Service", "Book a Fitting", "Book a Demo", "Book Storage"] },
        { h: "Service Menu", items: ["Tune-Ups", "Drivetrain", "Suspension", "Wheels & Tubeless", "Custom Builds"] },
        { h: "Programs", items: ["Bike Fitting", "Storage", "Demo Fleet", "Warranty"], feature: { label: "AVAILABILITY  /  THIS WEEK", title: "12 service slots open" } },
      ],
    },
    explore: {
      cols: [
        { h: "Community", items: ["Group Rides", "Strava Club", "Skill Clinics", "Events"] },
        { h: "Trails", items: ["Knox Mountain", "Bear Creek", "Myra Canyon", "Kelowna Bike Park"] },
        { h: "Stories", items: ["Journal", "Trail Conditions", "Classifieds"], feature: { label: "FIELD NOTES  /  APRIL 2026", title: "First Light on Knox" } },
      ],
    },
  };
  // map a label to a route + optional filter intent
  const routeFor = (label) => {
    const l = label.toLowerCase();
    // Shop sub-categories with type filter
    if (l === "all bikes" || l === "bikes") return ["shop", { type: "All" }];
    if (l === "mountain") return ["shop", { type: "Mountain" }];
    if (l === "road") return ["shop", { type: "Road" }];
    if (l === "gravel") return ["shop", { type: "Gravel" }];
    if (l === "e-bike" || l === "ebike") return ["shop", { type: "E-Bike" }];
    if (l === "commuter") return ["shop", { type: "Commuter" }];
    if (l === "kids") return ["shop", { type: "Kids" }];
    // Brand filters in mega
    if (["marin", "transition", "surly", "salsa", "pivot", "bianchi", "moots"].includes(l)) return ["shop", { brand: label }];
    // Parts / accessories — generic shop view
    if (l.includes("helmet") || l.includes("apparel") || l.includes("component") || l.includes("tool") || l.includes("bag") || l.includes("light") || l.includes("sale") || l.includes("gift") || l.includes("classified")) return ["shop", null];
    // Services / book
    if (l.startsWith("book")) return ["book", null];
    if (l.includes("tune") || l.includes("drivetrain") || l.includes("suspension") || l.includes("wheel") || l.includes("custom") || l.includes("warranty") || l.includes("fit") || l.includes("storage") || l.includes("demo")) return ["services", null];
    // Explore
    if (l.includes("ride") || l.includes("strava") || l.includes("clinic") || l.includes("event")) return ["rides", null];
    if (l.includes("trail") || l.includes("knox") || l.includes("bear") || l.includes("myra") || l.includes("park") || l.includes("condition")) return ["trails", null];
    if (l.includes("journal") || l.includes("stories") || l.includes("note")) return ["home", null];
    return ["home", null];
  };
  const handleClick = (e, label) => {
    e.preventDefault();
    onClose();
    const [route, intent] = routeFor(label);
    window.cl.go(route, intent);
  };
  const d = open && data[open];
  return (
    <div className={"mega " + (open ? "open" : "")} onMouseEnter={() => onOpen(open)} onMouseLeave={onClose}>
      {d && (
        <div className="container-wide">
          <div className="mega-grid">
            {d.cols.slice(0, 2).map((c, i) => (
              <div key={i} className="mega-col">
                <h4>{c.h}</h4>
                <ul>{c.items.map((it) => <li key={it}><a href="#" data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
              </div>
            ))}
            <div className="mega-col">
              <h4>{d.cols[2].h}</h4>
              <ul style={{ marginBottom: 24 }}>{d.cols[2].items.map((it) => <li key={it}><a href="#" data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
              <a href="#" data-cursor="link" onClick={(e) => handleClick(e, d.cols[2].feature.title)} className="mega-feature ph ph-corners" style={{ aspectRatio: "16/8", display: "flex", alignItems: "flex-end", padding: 24, textDecoration: "none" }}>
                <div style={{ position: "relative", zIndex: 2, color: "var(--white)" }}>
                  <div className="eyebrow eyebrow-light" style={{ marginBottom: 8 }}>{d.cols[2].feature.label}</div>
                  <div className="display-s" style={{ color: "var(--white)" }}>{d.cols[2].feature.title}</div>
                </div>
                <span className="ph-label">PHOTO  /  16x8</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mobile nav
const MobileNav = ({ open, onClose }) => (
  <div className={"mobile-nav " + (open ? "open" : "")}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 24px", borderBottom: "1px solid var(--hairline-light)" }}>
      <div className="nav-logo"><img src="logo.png" alt="ChainLine Cycle" className="logo-img logo-img-light" /></div>
      <button className="nav-utility-btn" onClick={onClose} data-cursor="link" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>Close</button>
    </div>
    <div style={{ padding: "40px 24px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
      {["Shop", "Services", "Explore", "About", "Book Online", "Contact"].map((l) => (
        <a key={l} href="#" className="display-l" style={{ color: "var(--white)", padding: "10px 0", borderBottom: "1px solid var(--hairline-light)" }} onClick={onClose}>{l}</a>
      ))}
    </div>
    <div style={{ padding: "24px", borderTop: "1px solid var(--hairline-light)", display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gray-300)" }}>
      <span>MON–SAT  10–6</span>
      <span>IG · STRAVA · FB</span>
    </div>
  </div>
);

// Sticky Book button (after hero)
const StickyCTA = ({ show }) => (
  <div className={"sticky-cta " + (show ? "show" : "")}>
    <button className="btn" data-cursor="link" onClick={() => window.cl.go("book")}>
      Book a Service <ArrowRight />
    </button>
  </div>
);

// Cart drawer
const CartDrawer = ({ open, onClose, items, onRemove }) => {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <>
      <div className={"drawer-backdrop " + (open ? "open" : "")} onClick={onClose} />
      <aside className={"drawer " + (open ? "open" : "")}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "28px", borderBottom: "1px solid var(--hairline)" }}>
          <div className="display-s">Cart  /  {items.length}</div>
          <button onClick={onClose} className="link-underline" data-cursor="link" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>Close</button>
        </div>
        <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto" }}>
          {items.length === 0 && <div style={{ color: "var(--gray-500)", fontSize: 14 }}>Your cart is empty.</div>}
          {items.map((it, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 16, padding: "16px 0", borderBottom: "1px solid var(--hairline)" }}>
              <div className="ph" style={{ aspectRatio: "1", height: 100 }}><span className="ph-label">PROD</span></div>
              <div>
                <div className="eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>{it.brand}</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 500, textTransform: "uppercase", letterSpacing: "-.005em", marginBottom: 8 }}>{it.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".1em" }}>
                  <span>QTY</span>
                  <span style={{ display: "inline-flex", border: "1px solid var(--hairline)" }}>
                    <button style={{ width: 26, height: 26 }}>−</button>
                    <span style={{ width: 26, height: 26, display: "grid", placeItems: "center" }}>{it.qty}</span>
                    <button style={{ width: 26, height: 26 }}>+</button>
                  </span>
                  <button className="link-underline" onClick={() => onRemove(idx)} style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--gray-500)" }}>Remove</button>
                </div>
              </div>
              <div style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 500 }}>${it.price.toLocaleString()}</div>
            </div>
          ))}
          <div style={{ marginTop: 32 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>You might also need</div>
            {[
              { name: "Shimano Chain Lube", price: 18 },
              { name: "Park Tool Multi-Tool", price: 32 },
            ].map((p) => (
              <div key={p.name} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--hairline)" }}>
                <span style={{ fontSize: 13 }}>{p.name}</span>
                <button className="link-underline" data-cursor="link" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase" }}>Add  ${p.price}</button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "24px 28px", borderTop: "1px solid var(--hairline)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontFamily: "var(--display)", fontSize: 16, textTransform: "uppercase", letterSpacing: "-.01em" }}>
            <span>Subtotal</span><span>${subtotal.toLocaleString()}</span>
          </div>
          <button className="btn" style={{ width: "100%", justifyContent: "center" }} data-cursor="link">Checkout <ArrowRight /></button>
          <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-500)", textAlign: "center" }}>Free shipping over $150</div>
        </div>
      </aside>
    </>
  );
};

// Footer
const Footer = () => (
  <footer className="footer">
    <div className="container-wide">
      <div className="footer-grid">
        <div className="footer-col">
          <div className="nav-logo" style={{ marginBottom: 24 }}>
            <img src="logo.png" alt="ChainLine Cycle" className="logo-img logo-img-light" />
          </div>
          <div className="serif-italic" style={{ fontSize: 22, lineHeight: 1.3, color: "var(--gray-300)", marginBottom: 24, maxWidth: 360 }}>
            Built for Kelowna.<br/>Backed by Canada.<br/>Since 2009.
          </div>
          <div style={{ display: "flex", gap: 18, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>
            <a href="#" className="link-underline" data-cursor="link">Instagram</a>
            <a href="#" className="link-underline" data-cursor="link">Strava</a>
            <a href="#" className="link-underline" data-cursor="link">Facebook</a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Shop</h4>
          <ul>{["Bikes", "Parts & Accessories", "Apparel", "Sale", "Gift Cards", "Classifieds"].map((i) => <li key={i}><a href="#" className="link-underline" data-cursor="link">{i}</a></li>)}</ul>
        </div>
        <div className="footer-col">
          <h4>Services</h4>
          <ul>{["Book a Service", "Bike Fitting", "Custom Builds", "Storage Program", "Demo Bikes", "Warranty"].map((i) => <li key={i}><a href="#" className="link-underline" data-cursor="link">{i}</a></li>)}</ul>
        </div>
        <div className="footer-col">
          <h4>Visit Us</h4>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--gray-300)" }}>
            1139 Ellis St.<br/>
            Kelowna, BC V1Y 1Z5<br/>
            <a href="tel:2508601968" className="link-underline" data-cursor="link">(250) 860-1968</a><br/>
            <a href="mailto:bikes@chainline.ca" className="link-underline" data-cursor="link">bikes@chainline.ca</a>
          </div>
          <div style={{ marginTop: 18, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-300)" }}>
            Mon  10–5<br/>Tue–Fri  9:30–5:30<br/>Sat  10–4  ·  Sun  closed
          </div>
        </div>
      </div>
      <div className="footer-massive">CHAINLINE</div>
      <hr className="hr-light" style={{ marginBottom: 24 }} />
      <div className="footer-bottom">
        <div>© 2026 ChainLine Cycle Inc.</div>
        <div style={{ display: "flex", gap: 18 }}>
          <span>VISA</span><span>MC</span><span>AMEX</span><span>APPLE PAY</span><span>SHOP PAY</span>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <a href="#" className="link-underline" data-cursor="link">Privacy</a>
          <a href="#" className="link-underline" data-cursor="link">Terms</a>
          <a href="#" className="link-underline" data-cursor="link">Accessibility</a>
        </div>
      </div>
    </div>
  </footer>
);

// Reveal hook — IntersectionObserver wrapper
const useReveal = () => {
  React.useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.in)");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
};

// Split text on load
const SplitText = ({ children, delay = 0, go = true, className = "" }) => {
  const chars = String(children).split("");
  return (
    <span className={"split-line " + (go ? "go" : "") + " " + className}>
      {chars.map((c, i) => (
        <span key={i} className="split-char" style={{ animationDelay: `${delay + i * 0.022}s` }}>
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </span>
  );
};

// Counter
const Counter = ({ to, suffix = "", prefix = "", duration = 1600 }) => {
  const ref = React.useRef(null);
  const [val, setVal] = React.useState(0);
  const started = React.useRef(false);
  React.useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(Math.floor(eased * to));
            if (t < 1) requestAnimationFrame(tick);
            else setVal(to);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
};

// Brand marquee
const BrandMarquee = ({ fast }) => {
  const brands = ["MARIN", "TRANSITION", "SURLY", "SALSA", "PIVOT", "BIANCHI", "MOOTS", "SHIMANO", "SRAM", "FOX", "RACEFACE", "ENVE"];
  const renderRow = (k) => (
    <div className="marquee-track" key={k}>
      {brands.map((b, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", padding: "0 56px", fontFamily: "var(--display)", fontSize: 22, fontWeight: 500, letterSpacing: ".12em" }}>
          {b}
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", margin: "0 0 0 56px", opacity: 0.4 }} />
        </span>
      ))}
    </div>
  );
  return (
    <div className={"marquee " + (fast ? "marquee-fast" : "")} style={{ padding: "32px 0", borderTop: "1px solid var(--hairline-light)", borderBottom: "1px solid var(--hairline-light)" }}>
      {renderRow(0)}
      {renderRow(1)}
    </div>
  );
};

Object.assign(window, { ChainLogo, Wordmark, Header, MobileNav, MegaMenu, StickyCTA, CartDrawer, Footer, useReveal, SplitText, Counter, BrandMarquee, ArrowRight, SearchIcon, Announce });
