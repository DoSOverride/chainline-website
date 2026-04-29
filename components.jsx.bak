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
const Header = ({ page, scrolled, onCart, cartCount, onMobile, onMega, megaOpen, onSearch, darkMode, onToggleDark }) => {
  const items = [
    { id: "shop",        label: "Bikes",        panel: "shop" },
    { id: "components",  label: "Components",   panel: "components" },
    { id: "accessories", label: "Accessories",  panel: "accessories" },
    { id: "services",    label: "Services",     panel: "services" },
    { id: "explore",     label: "Explore",      panel: "explore" },
    { id: "about",       label: "About",        panel: null, route: "about" },
  ];

  const closeTimer = React.useRef(null);
  const openMega = (p) => { if (closeTimer.current) clearTimeout(closeTimer.current); onMega(p); };
  const scheduleClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => onMega(null), 180); };

  const [accountOpen, setAccountOpen] = React.useState(false);
  const accountRef = React.useRef(null);
  React.useEffect(() => {
    if (!accountOpen) return;
    const handler = (e) => { if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [accountOpen]);

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
            <button className="nav-utility-btn" data-cursor="link" onClick={onSearch}><span className="nav-utility-text">Search</span><SearchIcon/></button>
            <DarkToggle on={darkMode} onToggle={onToggleDark} />
            <div ref={accountRef} style={{ position: "relative" }}>
              <button className="nav-utility-btn" data-cursor="link" onClick={() => setAccountOpen(o => !o)}>
                <span className="nav-utility-text">Account</span><AccountIcon/>
              </button>
              {accountOpen && <AccountDropdown onClose={() => setAccountOpen(false)} />}
            </div>
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

const AccountIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
);
const DarkToggle = ({ on, onToggle }) => (
  <button className="nav-utility-btn" onClick={onToggle} data-cursor="link"
    title={on ? "Switch to light mode" : "Switch to dark mode"}
    style={{ opacity: on ? 1 : 0.7, transition: "opacity .2s" }}>
    {on ? <SunIcon /> : <MoonIcon />}
  </button>
);

const SHOPIFY_STORE = "https://4nie4h-ek.myshopify.com";

const AccountDropdown = ({ onClose }) => {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const rowStyle = { display: "block", padding: "13px 24px", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--black)", textDecoration: "none", transition: "background .15s" };
  const divider = <div style={{ height: 1, background: "var(--hairline)", margin: "0 24px" }} />;

  return (
    <div style={{ position: "absolute", top: "calc(100% + 16px)", right: 0, background: "var(--white)", border: "1px solid var(--hairline)", boxShadow: "0 8px 40px rgba(0,0,0,0.12)", minWidth: 220, zIndex: 200, padding: "8px 0" }}
      onMouseLeave={onClose}>
      <a href={`${SHOPIFY_STORE}/account/login`} target="_blank" rel="noopener" style={rowStyle} onClick={onClose}
        onMouseEnter={e => e.currentTarget.style.background="var(--paper)"}
        onMouseLeave={e => e.currentTarget.style.background=""}>Sign In</a>
      {divider}
      <a href={`${SHOPIFY_STORE}/account/register`} target="_blank" rel="noopener" style={rowStyle} onClick={onClose}
        onMouseEnter={e => e.currentTarget.style.background="var(--paper)"}
        onMouseLeave={e => e.currentTarget.style.background=""}>Create Account</a>
      {divider}
      <a href={`${SHOPIFY_STORE}/account`} target="_blank" rel="noopener" style={{ ...rowStyle, color: "var(--gray-500)" }} onClick={onClose}
        onMouseEnter={e => e.currentTarget.style.background="var(--paper)"}
        onMouseLeave={e => e.currentTarget.style.background=""}>My Orders</a>
    </div>
  );
};

const ArrowRight = ({ size = 12 }) => (
  <svg className="arrow" width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M1 6h10M7 2l4 4-4 4"/>
  </svg>
);

const MegaMenu = ({ open, onOpen, onClose }) => {
  const BIKE_BRANDS = ["Marin", "Transition", "Surly", "Pivot", "Salsa", "Bianchi", "Moots", "Knolly", "Revel"];
  const BIKE_TYPES  = ["All Bikes", "Mountain", "Gravel", "E-Bike", "Commuter", "Comfort", "Kids"];
  const data = {
    shop: {
      brandCol: BIKE_BRANDS,
      typeCol:  BIKE_TYPES,
      cols: [
        { h: "Parts & Accessories", items: ["Helmets & Protection", "Apparel", "Components", "Tools", "Bags & Racks", "Lights"] },
        { h: "More", items: ["Sale", "Gift Cards", "Pinkbike"] },
      ],
    },
    components: {
      cols: [
        { h: "Drivetrain", items: ["Cassette", "Chains", "Chainrings", "Cranks", "Derailleurs", "Shifters", "Bottom Brackets", "Cables"] },
        { h: "Brakes & Wheels", items: ["Brake pads", "Brake Levers", "Rims", "Hubs", "Spokes", "Wheelsets", "Skewers"] },
        { h: "Suspension & Cockpit", items: ["Forks", "Rear Shock", "Handlebar", "Stem", "Grips", "Bar tape", "Headsets", "Seat post", "Saddles"] },
        { h: "Tires & Tubes", items: ['Tires 29"', 'Tires 700C', 'Tires 27.5"', 'Tires 26"', "Fat Bike Tires", "Tubes", "Tire Sealant", "Tire Protection"] },
      ],
    },
    accessories: {
      cols: [
        { h: "Protection", items: ["Helmets", "Armour", "Gloves", "Sunglasses"] },
        { h: "Bags & Lighting", items: ["Bags", "Packs", "Hydration", "Lights", "Computers"] },
        { h: "Apparel", items: ["Clothing", "Socks", "Arm Warmers", "Leg Warmers", "Shoes", "Cleats"] },
        { h: "Tools & More", items: ["Pumps", "Tools", "Locks", "Fenders", "Bells", "Kickstands", "Bike Racks", "Water Bottles"] },
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
    // Brand filters → shop page filtered by brand
    if (["marin", "transition", "surly", "salsa", "pivot", "bianchi", "moots", "knolly", "revel"].includes(l)) return ["shop", { brand: l.charAt(0).toUpperCase() + l.slice(1) }];
    // Components → tab IDs matching PART_TABS in pages.jsx
    if (["cassette","chains","chainrings","cranks","derailleurs","shifters","bottom brackets","cables"].includes(l)) return ["parts", { tab: "drivetrain" }];
    if (["brake pads","brake levers"].includes(l)) return ["parts", { tab: "brakes" }];
    if (["rims","hubs","spokes","wheelsets","skewers","tires 29\"","tires 700c","tires 27.5\"","tires 26\"","fat bike tires","tubes","tire sealant","tire protection"].includes(l)) return ["parts", { tab: "wheels" }];
    if (["handlebar","stem","grips","bar tape","headsets","seat post","saddles"].includes(l)) return ["parts", { tab: "cockpit" }];
    if (["forks","rear shock"].includes(l)) return ["parts", { tab: "suspension" }];
    // Accessories → tab IDs matching PART_TABS in pages.jsx
    if (["helmets","armour","sunglasses","clothing","socks","arm warmers","leg warmers","shoes","cleats"].includes(l)) return ["parts", { tab: "fit" }];
    if (["bags","packs","hydration","lights","computers","pumps","tools","locks","fenders","bells","kickstands","bike racks","water bottles"].includes(l)) return ["parts", { tab: "tools" }];
    if (l.includes("gift")) return ["giftcards", null];
    if (l.includes("classified") || l.includes("pinkbike")) return ["classifieds", null];
    if (l.includes("sale")) return ["shop", null];
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
  const linkStyle = { padding:"5px 0", fontFamily:"var(--mono)", fontSize:11, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-500)", textDecoration:"none", transition:"color .2s", whiteSpace:"nowrap" };
  return (
    <div className={"mega " + (open ? "open" : "")} onMouseEnter={() => onOpen(open)} onMouseLeave={onClose}>
      {d && (
        <div className="container-wide">
          {/* Shop panel: brands | styles | parts | more */}
          {d.brandCol ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:48 }}>
              <div className="mega-col">
                <h4>By Brand</h4>
                <ul>{d.brandCol.map(it => <li key={it}><a href="#" data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
              </div>
              <div className="mega-col">
                <h4>By Style</h4>
                <ul>{d.typeCol.map(it => <li key={it}><a href="#" data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
              </div>
              {d.cols.map((c, i) => (
                <div key={i} className="mega-col">
                  <h4>{c.h}</h4>
                  <ul>{c.items.map(it => <li key={it}><a href="#" data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
                </div>
              ))}
            </div>
          ) : d.cols ? (
            /* Components / Accessories: 4-col grid */
            d.cols.length === 4 ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:48 }}>
                {d.cols.map((c, i) => (
                  <div key={i} className="mega-col">
                    <h4>{c.h}</h4>
                    <ul>{c.items.map(it => <li key={it}><a href="#" data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
                  </div>
                ))}
              </div>
            ) : (
            /* Services / Explore: keep existing 3-col layout */
            <div className="mega-grid">
              {d.cols.slice(0, 2).map((c, i) => (
                <div key={i} className="mega-col">
                  <h4>{c.h}</h4>
                  <ul>{c.items.map(it => <li key={it}><a href="#" data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
                </div>
              ))}
              {d.cols[2] && (
                <div className="mega-col">
                  <h4>{d.cols[2].h}</h4>
                  <ul style={{ marginBottom: 24 }}>{d.cols[2].items.map(it => <li key={it}><a href="#" data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
                  {d.cols[2].feature && (
                    <a href="#" data-cursor="link" onClick={(e) => handleClick(e, d.cols[2].feature.title)} className="mega-feature" style={{ aspectRatio:"16/8", display:"flex", alignItems:"flex-end", padding:24, textDecoration:"none", position:"relative", overflow:"hidden", background:"var(--gray-100)" }}>
                      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 60%)" }} />
                      <div style={{ position:"relative", zIndex:2, color:"var(--white)" }}>
                        <div className="eyebrow eyebrow-light" style={{ marginBottom:8 }}>{d.cols[2].feature.label}</div>
                        <div className="display-s" style={{ color:"var(--white)" }}>{d.cols[2].feature.title}</div>
                      </div>
                    </a>
                  )}
                </div>
              )}
            </div>
          )
          ) : null}
        </div>
      )}
    </div>
  );
};

// Mobile nav — two-panel: Main → Shop (brands + styles)
const MobileNav = ({ open, onClose }) => {
  const [panel, setPanel] = React.useState('main');

  // Reset to main panel when nav closes
  React.useEffect(() => { if (!open) setTimeout(() => setPanel('main'), 500); }, [open]);

  const dismiss = (fn) => { onClose(); fn && fn(); };

  const BRANDS = ["Marin","Transition","Surly","Pivot","Salsa","Bianchi","Moots","Knolly","Revel"];
  const TYPES  = ["All Bikes","Mountain","Gravel","E-Bike","Commuter","Comfort","Kids"];
  const COMP_CATS = [
    { label:"Drivetrain", tab:"drivetrain", items:["Cassette","Chains","Chainrings","Cranks","Derailleurs","Shifters","Bottom Brackets","Cables"] },
    { label:"Brakes",     tab:"brakes",     items:["Brake pads","Brake Levers","Brake Parts"] },
    { label:"Wheels & Tires", tab:"wheels", items:["Rims","Hubs","Spokes","Wheelsets",'Tires 29"','Tires 700C','Tires 26"',"Tubes","Tire Sealant"] },
    { label:"Cockpit",    tab:"cockpit",    items:["Handlebar","Stem","Grips","Headsets","Saddles","Seat post"] },
    { label:"Suspension", tab:"suspension", items:["Forks","Rear Shock","Fork Parts"] },
  ];
  const ACC_CATS = [
    { label:"Clothing & Helmets", tab:"fit",   items:["Helmets","Armour","Gloves","Sunglasses","Clothing","Socks","Shoes"] },
    { label:"Tools & Bags",       tab:"tools", items:["Bags","Packs","Lights","Computers","Pumps","Tools","Locks","Fenders"] },
  ];

  const ChevR = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3l5 5-5 5"/></svg>;
  const ChevL = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3L5 8l5 5"/></svg>;

  const hdr = (content) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", borderBottom:"1px solid var(--hairline-light)", flexShrink:0 }}>
      {content}
      <button onClick={() => dismiss()} style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}>Close</button>
    </div>
  );

  const linkA = { color:"var(--white)", padding:"13px 0", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center", textDecoration:"none", fontFamily:"var(--display)", fontSize:26, fontWeight:500, letterSpacing:"-.01em", textTransform:"uppercase", cursor:"pointer" };
  const subA  = { color:"var(--white)", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"block", textDecoration:"none", fontFamily:"var(--display)", fontSize:20, fontWeight:500, letterSpacing:"-.01em", textTransform:"uppercase", cursor:"pointer" };

  return (
    <div className={"mobile-nav " + (open ? "open" : "")} style={{ overflow:"hidden" }}>
      {/* ── Panel 1: Main ── */}
      <div className={"mob-panel " + (panel === 'main' ? "mob-panel-active" : "mob-panel-left")}
        style={{ pointerEvents: panel === 'main' ? 'all' : 'none' }}>
        {hdr(<div className="nav-logo"><img src="logo.png" alt="ChainLine Cycle" className="logo-img logo-img-light" style={{ height:28 }} /></div>)}
        <div style={{ padding:"24px 24px 0", flex:1, overflowY:"auto" }}>
          <div style={linkA} onClick={() => setPanel('shop')}>Bikes <ChevR /></div>
          <div style={linkA} onClick={() => setPanel('components')}>Components <ChevR /></div>
          <div style={linkA} onClick={() => setPanel('accessories')}>Accessories <ChevR /></div>
          {[
            { label:"Services", route:"services" },
            { label:"Book Online", route:"book" },
            { label:"Group Rides", route:"rides" },
            { label:"Trails", route:"trails" },
            { label:"Pinkbike", route:"classifieds" },
            { label:"About", route:"about" },
            { label:"Contact", route:"contact" },
          ].map(l => (
            <a key={l.label} href="#" style={linkA}
              onClick={e => { e.preventDefault(); dismiss(() => window.cl.go(l.route)); }}>
              {l.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Panel 2: Bikes ── */}
      <div className={"mob-panel " + (panel === 'shop' ? "mob-panel-active" : "mob-panel-right")}>
        {hdr(<button onClick={() => setPanel('main')} style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}><ChevL /> Back</button>)}
        <div style={{ padding:"24px", flex:1, overflowY:"auto" }}>
          <a href="#" style={{ ...linkA, fontSize:28 }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("shop")); }}>All Bikes</a>
          <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", padding:"20px 0 10px" }}>By Brand</div>
          {BRANDS.map(br => (
            <a key={br} href="#" style={subA} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("shop", { brand: br })); }}>{br}</a>
          ))}
          <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", padding:"20px 0 10px" }}>By Style</div>
          {TYPES.map(t => (
            <a key={t} href="#" style={subA} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("shop", t === "All Bikes" ? null : { type: t })); }}>{t}</a>
          ))}
        </div>
      </div>

      {/* ── Panel 3: Components ── */}
      <div className={"mob-panel " + (panel === 'components' ? "mob-panel-active" : "mob-panel-right")}>
        {hdr(<button onClick={() => setPanel('main')} style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}><ChevL /> Back</button>)}
        <div style={{ padding:"24px", flex:1, overflowY:"auto" }}>
          <a href="#" style={{ ...linkA, fontSize:28 }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("parts", { tab:"drivetrain" })); }}>All Components</a>
          {COMP_CATS.map(cat => (
            <div key={cat.label}>
              <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", padding:"20px 0 8px" }}>{cat.label}</div>
              {cat.items.map(it => (
                <a key={it} href="#" style={subA} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("parts", { tab: cat.tab })); }}>{it}</a>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel 4: Accessories ── */}
      <div className={"mob-panel " + (panel === 'accessories' ? "mob-panel-active" : "mob-panel-right")}>
        {hdr(<button onClick={() => setPanel('main')} style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}><ChevL /> Back</button>)}
        <div style={{ padding:"24px", flex:1, overflowY:"auto" }}>
          <a href="#" style={{ ...linkA, fontSize:28 }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("parts", { tab:"fit" })); }}>All Accessories</a>
          {ACC_CATS.map(cat => (
            <div key={cat.label}>
              <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", padding:"20px 0 8px" }}>{cat.label}</div>
              {cat.items.map(it => (
                <a key={it} href="#" style={subA} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("parts", { tab: cat.tab })); }}>{it}</a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
  const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  return (
    <>
      <div className={"drawer-backdrop " + (open ? "open" : "")} onClick={onClose} />
      <aside className={"drawer " + (open ? "open" : "")}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "28px", borderBottom: "1px solid var(--hairline)" }}>
          <div className="display-s">Cart  /  {items.length}</div>
          <button onClick={onClose} className="link-underline" data-cursor="link" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>Close</button>
        </div>
        <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto" }}>
          {items.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div className="display-s" style={{ marginBottom: 12 }}>Cart is empty</div>
              <p style={{ color: "var(--gray-500)", fontSize: 14, marginBottom: 24 }}>Add a bike to get started.</p>
              <button className="btn btn-outline" onClick={() => { onClose(); window.cl.go("shop"); }} data-cursor="link">Shop Bikes <ArrowRight /></button>
            </div>
          )}
          {items.map((it, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 16, padding: "16px 0", borderBottom: "1px solid var(--hairline)" }}>
              {it.image
                ? <img src={it.image} alt={it.name} style={{ width: 80, height: 80, objectFit: "contain", background: "var(--paper)", padding: 4 }} />
                : <div className="ph" style={{ width: 80, height: 80 }} />
              }
              <div>
                <div className="eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>{it.brand}</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: "-.005em", marginBottom: 8, lineHeight: 1.3 }}>{it.name}</div>
                <button className="link-underline" onClick={() => { window.shopifyCart.remove(it.variantId); onRemove(idx); }} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--gray-500)", letterSpacing: ".1em", textTransform: "uppercase" }}>Remove</button>
              </div>
              <div style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 500, whiteSpace: "nowrap" }}>${(it.price || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "24px 28px", borderTop: "1px solid var(--hairline)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontFamily: "var(--display)", fontSize: 16, textTransform: "uppercase", letterSpacing: "-.01em" }}>
            <span>Subtotal</span><span>${subtotal.toLocaleString()}</span>
          </div>
          <button className="btn" style={{ width: "100%", justifyContent: "center" }} data-cursor="link" onClick={() => window.shopifyCart.checkout()}>Checkout <ArrowRight /></button>
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
          <div style={{ display: "flex", gap: 14, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", flexWrap: "wrap" }}>
            {[
              ["Instagram","https://instagram.com/ChainLineCycle"],
              ["TikTok","https://tiktok.com/@ChainLineCycle"],
              ["Facebook","https://facebook.com/ChainLineCycle"],
              ["YouTube","https://youtube.com/@ChainLine_Cycle"],
              ["Pinkbike","https://www.pinkbike.com/u/ChainLineCycle/buysell/"],
              ["Threads","https://threads.net/@ChainLineCycle"],
              ["X","https://x.com/ChainLineCycle"],
              ["Bluesky","https://bsky.app/profile/ChainLineCycle.bsky.social"],
              ["Snapchat","https://snapchat.com/add/ChainLineCycle"],
            ].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener" className="link-underline" data-cursor="link">{label}</a>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <a href="https://search.google.com/local/writereview?placeid=ChIJbbM4_V7zfVMRmOhSjhXRP9o&source=g.page.m._&laa=merchant-review-solicitation" target="_blank" rel="noopener"
              className="link-underline" data-cursor="link"
              style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)", display:"inline-flex", alignItems:"center", gap:6 }}>
              ★ Rate us on Google
            </a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            {[["Bikes","shop"],["Parts & Accessories","parts"],["Gift Cards","giftcards"],["Sale","shop"],["Pinkbike","classifieds"],["Our Brands","brands"]].map(([label,route]) => (
              <li key={label}><a href="#" className="link-underline" data-cursor="link" onClick={e=>{e.preventDefault();window.cl.go(route);}}>{label}</a></li>
            ))}
          </ul>
        </div>
        <div className="footer-col">
          <h4>Services</h4>
          <ul>
            {[["Book a Service","book"],["Bike Fitting","book"],["Custom Builds","services"],["Storage Program","services"],["Demo Bikes","book"],["Warranty","services"]].map(([label,route]) => (
              <li key={label}><a href="#" className="link-underline" data-cursor="link" onClick={e=>{e.preventDefault();window.cl.go(route);}}>{label}</a></li>
            ))}
          </ul>
        </div>
        <div className="footer-col">
          <h4>Visit Us</h4>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--gray-300)" }}>
            <a href="https://maps.google.com/?q=1139+Ellis+St+Kelowna+BC+V1Y+1Z5" target="_blank" rel="noopener" className="link-underline" data-cursor="link">
              1139 Ellis St.<br/>Kelowna, BC V1Y 1Z5
            </a><br/>
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
          <a href="#" className="link-underline" data-cursor="link" onClick={e=>{e.preventDefault();window.cl.go("privacy");}}>Privacy</a>
          <a href="#" className="link-underline" data-cursor="link" onClick={e=>{e.preventDefault();window.cl.go("terms");}}>Terms</a>
          <a href="#" className="link-underline" data-cursor="link" onClick={e=>{e.preventDefault();window.cl.go("contact");}}>Accessibility</a>
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
  const brands = ["MARIN", "TRANSITION", "SURLY", "SALSA", "PIVOT", "BIANCHI", "MOOTS", "KNOLLY", "REVEL"];
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

// Chat widget
const ChatWidget = () => {
  const WORKER = "https://still-term-f1ec.taocaruso77.workers.dev";
  const [open, setOpen] = React.useState(false);
  const [msgs, setMsgs] = React.useState([
    { role: "bot", text: "Hey, I'm Jake — head mechanic at ChainLine. Ask me anything about bikes, service, or what we've got in stock." }
  ]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open, thinking]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    const history = [...msgs, { role: "user", text }];
    setMsgs(history);
    setThinking(true);
    try {
      const res = await fetch(`${WORKER}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history
            .filter(m => m.role !== "bot" || m !== msgs[0])
            .map(m => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text }))
        }),
      });
      const { reply } = await res.json();
      setMsgs(m => [...m, { role: "bot", text: reply || "Give us a call at (250) 860-1968 — happy to help." }]);
    } catch {
      setMsgs(m => [...m, { role: "bot", text: "Sorry, having trouble connecting. Call us at (250) 860-1968." }]);
    }
    setThinking(false);
  };

  return (
    <>
      <button onClick={() => setOpen(o => !o)} data-cursor="link"
        style={{ position: "fixed", left: 32, bottom: 32, zIndex: 80, width: 52, height: 52, borderRadius: "50%", background: "var(--black)", color: "var(--white)", display: "grid", placeItems: "center", border: "1px solid var(--black)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
        {open
          ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2l12 12M14 2L2 14"/></svg>
          : <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h16v10H8l-4 3v-3H2z"/></svg>
        }
      </button>
      {open && (
        <div style={{ position: "fixed", left: 32, bottom: 96, zIndex: 80, width: 320, background: "var(--white)", border: "1px solid var(--hairline)", boxShadow: "0 8px 40px rgba(0,0,0,0.16)", display: "flex", flexDirection: "column", maxHeight: 440 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--black)", color: "var(--white)" }}>
            <div>
              <div style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em" }}>Jake · Head Mechanic</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gray-300)", marginTop: 2 }}>ChainLine Cycle · Ask me anything</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-300)" }}>Online</span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "82%", padding: "9px 13px", background: m.role === "user" ? "var(--black)" : "var(--paper)", color: m.role === "user" ? "var(--white)" : "var(--black)", fontSize: 13, lineHeight: 1.55, fontFamily: "var(--body)" }}>
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "9px 13px", background: "var(--paper)", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gray-400)", display: "inline-block", animation: "chatDot .9s ease-in-out infinite", animationDelay: `${i * 0.18}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
            <style>{`@keyframes chatDot { 0%,80%,100%{transform:scale(0.6);opacity:.4} 40%{transform:scale(1);opacity:1} }`}</style>
          </div>
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--hairline)", display: "flex", gap: 8, alignItems: "center" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask anything..."
              style={{ flex: 1, border: "none", outline: "none", fontFamily: "var(--body)", fontSize: 13, background: "transparent", padding: "4px 0" }} />
            <button onClick={send}
              style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-500)", cursor: "pointer", background: "none", border: "none", padding: 0 }}>Send</button>
          </div>
        </div>
      )}
    </>
  );
};

// Search modal
const SearchModal = ({ onClose }) => {
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef(null);
  React.useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fuzzy = window.fuzzyMatch || ((n, h) => h.toLowerCase().includes(n.toLowerCase()));

  const bikeResults = q.length < 2 ? [] : (window.SHOP_BIKES || []).filter(b =>
    fuzzy(q, (b.name||'') + ' ' + (b.brand||'') + ' ' + (b.type||'') + ' ' + (b.tags||''))
  ).slice(0, 5);

  const partResults = q.length < 2 ? [] : (window.lightspeedSearch ? window.lightspeedSearch(q) : [])
    .filter(p => !['labour','food','shop use','bikes'].some(x => (p.department||'').toLowerCase().includes(x)))
    .slice(0, 5);

  const hasResults = bikeResults.length > 0 || partResults.length > 0;

  const rowStyle = { display:"flex", alignItems:"center", gap:16, padding:"14px 0", borderBottom:"1px solid var(--hairline)", background:"none", border:"none", borderBottom:"1px solid var(--hairline)", cursor:"pointer", textAlign:"left", width:"100%" };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(10,10,10,0.7)", backdropFilter:"blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ position:"absolute", top:0, left:0, right:0, background:"var(--white)", padding:"32px 40px 24px", boxShadow:"0 8px 48px rgba(0,0,0,0.2)", maxHeight:"90vh", overflowY:"auto" }}>

        <div style={{ display:"flex", alignItems:"center", gap:16, borderBottom:"2px solid var(--black)", paddingBottom:16, marginBottom:24 }}>
          <SearchIcon />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search bikes, parts, brands…"
            style={{ flex:1, border:"none", outline:"none", fontSize:22, fontFamily:"var(--display)", fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em", background:"transparent" }} />
          <button onClick={onClose} style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-500)", cursor:"pointer", background:"none", border:"none" }}>ESC</button>
        </div>

        {q.length >= 2 && !hasResults && (
          <div style={{ fontFamily:"var(--mono)", fontSize:12, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)", padding:"16px 0" }}>
            No results — try a different spelling
          </div>
        )}

        {bikeResults.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <div className="eyebrow" style={{ marginBottom:12, color:"var(--gray-500)" }}>Bikes</div>
            {bikeResults.map((b, i) => (
              <button key={i} onClick={() => { window.cl.go("bike", { bike: b }); onClose(); }} data-cursor="link" style={rowStyle}>
                {b.img && <img src={b.img} alt="" loading="lazy" style={{ width:56, height:56, objectFit:"contain", background:"var(--paper)", padding:4, flexShrink:0 }} />}
                <div style={{ flex:1 }}>
                  <div className="eyebrow" style={{ marginBottom:3 }}>{b.brand}  ·  {b.type}</div>
                  <div style={{ fontFamily:"var(--display)", fontSize:17, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em" }}>{b.name}</div>
                </div>
                <div style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:500, flexShrink:0 }}>${(b.price||0).toLocaleString()}</div>
              </button>
            ))}
            <button onClick={() => { window.cl.go("shop"); onClose(); }} data-cursor="link"
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 0", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)" }}>
              All bikes in Shop <ArrowRight size={10} />
            </button>
          </div>
        )}

        {partResults.length > 0 && (
          <div>
            <div className="eyebrow" style={{ marginBottom:12, color:"var(--gray-500)" }}>Parts &amp; Accessories</div>
            {partResults.map((p, i) => (
              <button key={i} onClick={() => { window.cl.go("parts"); onClose(); }} data-cursor="link" style={rowStyle}>
                <div style={{ flex:1 }}>
                  <div className="eyebrow" style={{ marginBottom:3 }}>{p.department}</div>
                  <div style={{ fontFamily:"var(--display)", fontSize:16, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em" }}>{p.name}</div>
                </div>
                {p.price > 0 && <div style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:500, flexShrink:0 }}>${p.price.toFixed(2)}</div>}
              </button>
            ))}
            <button onClick={() => { window.cl.go("parts"); onClose(); }} data-cursor="link"
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 0", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)" }}>
              Browse all parts <ArrowRight size={10} />
            </button>
          </div>
        )}

        {q.length < 2 && (
          <div>
            <div className="eyebrow" style={{ marginBottom:12, color:"var(--gray-500)" }}>Quick search</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["Mountain","Gravel","E-Bike","Marin","Transition","Surly","Cassette","Chain","Brake pads","Tires","Helmet","Pedals"].map(tag => (
                <button key={tag} onClick={() => setQ(tag)} data-cursor="link"
                  style={{ padding:"7px 14px", border:"1px solid var(--hairline)", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".12em", textTransform:"uppercase", cursor:"pointer", background:"none" }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

Object.assign(window, { ChainLogo, Wordmark, Header, MobileNav, MegaMenu, StickyCTA, CartDrawer, Footer, useReveal, SplitText, Counter, BrandMarquee, ArrowRight, SearchIcon, AccountIcon, AccountDropdown, DarkToggle, Announce, ChatWidget, SearchModal });
