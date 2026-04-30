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

// ── Announcement bar — clickable, each opens a quick inquiry form ──
const ANNOUNCE_ITEMS = [
  {
    msg: "Free shipping on orders over $250",
  },
  {
    msg: "Tune-ups — booking 1–2 weeks out",
    form: { title: "Book a Service", subject: "Service Booking",
      fields: [
        { key:"name",    label:"Your Name",     type:"text",     placeholder:"Jane Smith",             required:true  },
        { key:"phone",   label:"Phone",          type:"tel",      placeholder:"(250) 555-0100",         required:true  },
        { key:"service", label:"Service needed", type:"text",     placeholder:"Tune-up, flat fix, brake bleed…", required:false },
        { key:"notes",   label:"Details",        type:"textarea", placeholder:"Bike brand/model, issue, preferred drop-off day…", required:false },
      ],
    },
  },
  {
    msg: "Flat fixes — walk-ins welcome",
    form: { title: "Book a Service", subject: "Flat Fix",
      fields: [
        { key:"name",    label:"Your Name", type:"text", placeholder:"Jane Smith",     required:true  },
        { key:"phone",   label:"Phone",      type:"tel",  placeholder:"(250) 555-0100", required:true  },
        { key:"notes",   label:"Details",   type:"textarea", placeholder:"Bike type, tube size if known…", required:false },
      ],
    },
  },
  {
    msg: "Bike storage — drop off anytime",
    form: { title: "Bike Storage Enquiry", subject: "Bike Storage",
      fields: [
        { key:"name",  label:"Your Name",  type:"text",     placeholder:"Jane Smith",                              required:true  },
        { key:"phone", label:"Phone",       type:"tel",      placeholder:"(250) 555-0100",                          required:true  },
        { key:"email", label:"Email",       type:"email",    placeholder:"jane@email.com",                          required:false },
        { key:"bikes", label:"Bike(s)",     type:"text",     placeholder:"e.g. Transition Sentinel, Trek Marlin",   required:false },
        { key:"notes", label:"Notes",       type:"textarea", placeholder:"Approx. drop-off date, duration, questions…", required:false },
      ],
    },
  },
];

const AnnounceFormModal = ({ item, onClose }) => {
  const [data, setData] = React.useState({});
  const [sent, setSent] = React.useState(false);
  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));
  const inp = { width:"100%", padding:"10px 0", border:"none", borderBottom:"1px solid var(--hairline)", fontSize:14, fontFamily:"var(--body)", background:"transparent", outline:"none", color:"var(--black)", marginBottom:16 };

  const submit = () => {
    const lines = item.form.fields.map(f => `${f.label}: ${data[f.key]||'–'}`).join('\n');
    const body = encodeURIComponent(`ChainLine — ${item.form.subject}\n\n${lines}`);
    window.location.href = `mailto:bikes@chainline.ca?subject=${encodeURIComponent(item.form.subject + ' — ' + (data.name||'Customer'))}&body=${body}`;
    setSent(true);
  };

  React.useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(10,10,10,0.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"var(--white)", width:"100%", maxWidth:440, padding:36, boxShadow:"0 12px 60px rgba(0,0,0,0.2)" }}>
        {sent ? (
          <>
            <div className="display-m" style={{ marginBottom:12 }}>Request sent ✓</div>
            <p style={{ color:"var(--gray-500)", fontSize:14, marginBottom:24 }}>We'll be in touch within 24 hours.</p>
            <button className="btn" onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <div className="display-s">{item.form.title}</div>
              <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)" }}>ESC</button>
            </div>
            {item.form.fields.map(f => (
              <div key={f.key}>
                <div className="eyebrow" style={{ marginBottom:4, fontSize:9 }}>{f.label}{f.required ? " *" : ""}</div>
                {f.type === "textarea"
                  ? <textarea rows={3} placeholder={f.placeholder} value={data[f.key]||""} onChange={e=>upd(f.key,e.target.value)} style={{ ...inp, resize:"vertical", borderBottom:"none", border:"1px solid var(--hairline)", padding:10 }} />
                  : <input type={f.type} placeholder={f.placeholder} value={data[f.key]||""} onChange={e=>upd(f.key,e.target.value)} style={inp} />
                }
              </div>
            ))}
            <button className="btn" style={{ width:"100%", justifyContent:"center", marginTop:8 }}
              disabled={!item.form.fields.filter(f=>f.required).every(f=>data[f.key])}
              onClick={submit}>
              Send Request <ArrowRight />
            </button>
            <p style={{ marginTop:12, fontFamily:"var(--mono)", fontSize:9, letterSpacing:".1em", textTransform:"uppercase", color:"var(--gray-400)", textAlign:"center" }}>Opens your email app · bikes@chainline.ca</p>
          </>
        )}
      </div>
    </div>
  );
};

const Announce = () => {
  const [i, setI] = React.useState(0);
  const [formItem, setFormItem] = React.useState(null);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI(x => (x + 1) % ANNOUNCE_ITEMS.length), 4800);
    return () => clearInterval(t);
  }, [paused]);

  const current = ANNOUNCE_ITEMS[i];

  const handleCta = (e, item) => {
    e.stopPropagation();
    if (item.onClick) item.onClick();
    else if (item.form) { setPaused(true); setFormItem(item); }
  };

  return (
    <>
      <div className="announce" style={{ cursor:"default" }}>
        <div className="container" style={{ position:"relative", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:16 }}>
          {ANNOUNCE_ITEMS.map((item, idx) => (
            <div key={idx} className={"announce-msg " + (idx === i ? "on" : "")} style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span className="dot" />
              <span>{item.msg}</span>
              {item.cta && (
                <button onClick={e => handleCta(e, item)} style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".14em", textTransform:"uppercase", color:"var(--white)", opacity:0.75, background:"none", border:"1px solid rgba(255,255,255,0.35)", borderRadius:2, padding:"2px 8px", cursor:"pointer" }}>
                  {item.cta}
                </button>
              )}
              <span className="dot" />
            </div>
          ))}
        </div>
      </div>
      {formItem && <AnnounceFormModal item={formItem} onClose={() => { setFormItem(null); setPaused(false); }} />}
    </>
  );
};

// Contact bar
const ContactBar = () => {
  const ls = { display:"flex", alignItems:"center", gap:"clamp(4px,1vw,7px)", fontFamily:"var(--mono)", fontSize:"clamp(8px,2.2vw,10px)", letterSpacing:".1em", textTransform:"uppercase", color:"var(--gray-600)", textDecoration:"none", whiteSpace:"nowrap" };
  const ic = { flexShrink:0 };
  return (
    <div className="contact-bar" style={{ background:"var(--paper)", borderBottom:"1px solid var(--hairline)", padding:"6px 0", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"clamp(8px,2.5vw,40px)", flexWrap:"nowrap", padding:"0 clamp(6px,2vw,24px)" }}>
        <a href="tel:2508601968" data-cursor="link" style={ls}>
          <svg style={ic} width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2.5A1.5 1.5 0 013.5 1h1.376a1 1 0 01.984.821l.53 2.646a1 1 0 01-.29.98L4.97 6.568a11.04 11.04 0 005.46 5.46l1.12-1.13a1 1 0 01.981-.291l2.646.53A1 1 0 0115 12.124V13.5A1.5 1.5 0 0113.5 15C6.596 15 1 9.404 1 2.5z"/></svg>
          (250) 860-1968
        </a>
        <a href="sms:2508601968" data-cursor="link" style={ls}>
          <svg style={ic} width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l2 2.5L9 12h5a1 1 0 001-1V3a1 1 0 00-1-1z"/>
            <circle cx="5" cy="7" r=".6" fill="currentColor" stroke="none"/><circle cx="8" cy="7" r=".6" fill="currentColor" stroke="none"/><circle cx="11" cy="7" r=".6" fill="currentColor" stroke="none"/>
          </svg>
          Text
        </a>
        <a href="https://maps.google.com/?q=1139+Ellis+St+Kelowna+BC+V1Y+1Z5" target="_blank" rel="noopener" data-cursor="link" style={ls}>
          <svg style={ic} width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1a5 5 0 00-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 00-5-5z"/><circle cx="8" cy="6" r="1.5"/></svg>
          1139 Ellis St, Kelowna
        </a>
      </div>
    </div>
  );
};

// Header / Nav
const Header = ({ page, scrolled, onCart, cartCount, onMobile, onMega, megaOpen, onSearch, darkMode, onToggleDark }) => {
  const items = [
    { id: "shop",     label: "Bikes",    panel: "shop",     route: "shop" },
    { id: "store",    label: "Store",    panel: "store",    route: "store" },
    { id: "services", label: "Services", panel: "services", route: "services" },
    { id: "explore",  label: "Explore",  panel: "explore",  route: "rides" },
    { id: "more",     label: "More",     panel: "more",     route: "about" },
  ];

  const closeTimer = React.useRef(null);
  const openMega = (p) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    onMega(p);
    // Preload inventory when hovering Store or Bikes
    if (p === 'store') window.lightspeedWarmCache?.();
    if (p === 'shop')  window.lightspeedGetBikes?.();
  };
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
      <ContactBar />
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
                onClick={() => { if (it.route) { onMega(null); window.cl.go(it.route, it.intent || null); } }}
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
              <CartIcon count={cartCount} />
            </button>
            <button className="menu-toggle" data-cursor="link" onClick={onMobile} style={{ marginRight: 20 }}>
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

const CartIcon = ({ count }) => (
  <div style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19.4a2 2 0 001.98-1.71l1.62-9.29H6"/>
    </svg>
    {count > 0 && (
      <span style={{ position:"absolute", top:-5, right:-6, background:"var(--black)", color:"var(--white)", width:13, height:13, borderRadius:"50%", fontSize:7, fontFamily:"var(--mono)", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>
        {count}
      </span>
    )}
  </div>
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
  const BIKE_BRANDS  = ["Marin", "Transition", "Surly", "Pivot", "Salsa"];
  const BIKE_BRANDS2 = ["Bianchi", "Moots", "Knolly", "Revel"];
  const data = {
    shop: {
      styleCol: ["Mountain", "Gravel", "E-Bike", "Commuter", "Comfort", "Kids"],
      brandCol:  BIKE_BRANDS,
      brandCol2: BIKE_BRANDS2,
    },
    store: {
      storeCols: [
        { h: "Components", route: "components", items: [
          { label:"Drivetrain",  go:["components",{tab:"drivetrain"}] },
          { label:"Brakes",      go:["components",{tab:"brakes"}] },
          { label:"Suspension",  go:["components",{tab:"suspension"}] },
          { label:"Cockpit",     go:["components",{tab:"cockpit"}] },
          { label:"Wheelsets",   go:["components",{tab:"wheels"}] },
          { label:"Rims",        go:["components",{tab:"wheels"}] },
          { label:"Hubs",        go:["components",{tab:"wheels"}] },
          { label:"Headsets",    go:["components",{tab:"cockpit"}] },
        ]},
        { h: "Parts", route: "parts", items: [
          { label:'Tires 29"',   go:["store",{search:'Tires 29"'}] },
          { label:"Tires 700C",  go:["store",{search:"Tires 700C"}] },
          { label:'Tires 27.5"', go:["store",{search:"Tires 27"}] },
          { label:"Fat Tires",   go:["store",{search:"Fatbike"}] },
          { label:"Tubes",       go:["store",{search:"Tubes"}] },
          { label:"Chains",      go:["store",{search:"Chains"}] },
          { label:"Cables",      go:["store",{search:"Cables"}] },
          { label:"Brake Pads",  go:["store",{search:"Brake pads"}] },
        ]},
        { h: "Accessories", route: "accessories", items: [
          { label:"Helmets",   go:["accessories",{tab:"fit"}] },
          { label:"Gloves",    go:["accessories",{tab:"fit"}] },
          { label:"Clothing",  go:["accessories",{tab:"fit"}] },
          { label:"Lights",    go:["accessories",{tab:"accessories"}] },
          { label:"Locks",     go:["accessories",{tab:"accessories"}] },
          { label:"Bags",      go:["accessories",{tab:"accessories"}] },
          { label:"Computers", go:["accessories",{tab:"accessories"}] },
          { label:"Tools",     go:["accessories",{tab:"tools"}] },
        ]},
      ],
    },
    services: {
      cols: [
        { h: "Book", items: ["Book a Service", "Book a Fitting", "Book a Demo", "Book Storage"] },
        { h: "Service Menu", items: ["Tune-Ups", "Drivetrain", "Suspension", "Wheels & Tubeless", "Custom Builds"] },
        { h: "Programs", items: ["Bike Fitting", "Storage", "Demo Fleet", "Warranty"] },
      ],
    },
    explore: {
      cols: [
        { h: "Rides & Events", items: ["Group Rides", "Skill Clinics", "Events"] },
        { h: "Trails", items: ["Knox Mountain", "Bear Creek", "Myra Canyon", "Kelowna Bike Park"] },
        { h: "Community", items: ["Pinkbike", "Social", "Trail Conditions"] },
      ],
    },
    more: {
      cols: [
        { h: "About Us", items: ["About", "Contact", "Our Brands"] },
        { h: "Shop", items: ["Gift Cards", "Sale"] },
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
    if (["marin", "transition", "surly", "salsa", "pivot", "bianchi", "moots", "knolly", "revel", "revel cycles"].includes(l)) return ["shop", { brand: l.charAt(0).toUpperCase() + l.slice(1).replace(/ cycles$/,'') }];
    // Components vs Accessories split — tabs in ACC_TABS go to /accessories, rest to /components
    const ACC_TABS = ["fit","tools","accessories"];
    const tabPage  = (tab) => ACC_TABS.includes(tab) ? "accessories" : "components";
    const PM={"cassette":{dept:"Cassette",tab:"drivetrain"},"chains":{dept:"Chains",tab:"drivetrain"},"chainrings":{dept:"Chainrings",tab:"drivetrain"},"cranks":{dept:"Cranks",tab:"drivetrain"},"derailleurs":{dept:"Derailleur Rear",tab:"drivetrain"},"shifters":{dept:"Shifters MTB",tab:"drivetrain"},"bottom brackets":{dept:"Bottom Brackets",tab:"drivetrain"},"cables":{dept:"Cables",tab:"drivetrain"},"brake pads":{dept:"Brake pads",tab:"brakes"},"brake levers":{dept:"Brake Lever U",tab:"brakes"},"rims":{dept:"Rims",tab:"wheels"},"hubs":{dept:"Hubs",tab:"wheels"},"spokes":{dept:"Spokes",tab:"wheels"},"wheelsets":{dept:"Wheelset (FR+RR)",tab:"wheels"},"skewers":{dept:"Skewers QR",tab:"wheels"}};
    const PM2={'tires 29"':{dept:'Tires 29"',tab:"wheels"},"tires 700c":{dept:"Tires 700C",tab:"wheels"},'tires 27.5"':{dept:'Tires 27" & 26x1&1/4 etc...',tab:"wheels"},'tires 26"':{dept:'Tires 26"',tab:"wheels"},"fat bike tires":{dept:"Tires Fatbike",tab:"wheels"},"tubes":{dept:"Tubes",tab:"wheels"},"tire sealant":{dept:"Tire Sealant",tab:"wheels"},"tire protection":{dept:"Tire Protection",tab:"wheels"},"forks":{dept:"Forks",tab:"suspension"},"rear shock":{dept:"Rear Shock",tab:"suspension"},"handlebar":{dept:"Handlebar",tab:"cockpit"},"stem":{dept:"Stem",tab:"cockpit"},"grips":{dept:"Grips",tab:"cockpit"},"bar tape":{dept:"Bar tape",tab:"cockpit"},"headsets":{dept:"Headsets",tab:"cockpit"},"seat post":{dept:"Seat post",tab:"cockpit"},"saddles":{dept:"Saddles",tab:"cockpit"},"helmets":{dept:"Helmet",tab:"fit"},"armour":{dept:"Armour",tab:"fit"},"gloves":{dept:"Gloves",tab:"fit"},"sunglasses":{dept:"Sunglasses",tab:"fit"},"clothing":{dept:"Clothing",tab:"fit"},"socks":{dept:"Socks",tab:"fit"},"arm warmers":{dept:"Arm Warmers",tab:"fit"},"leg warmers":{dept:"Leg Warmers",tab:"fit"},"shoes":{dept:"Shoes Mountain",tab:"fit"},"cleats":{dept:"Cleats",tab:"fit"},"pumps":{dept:"Pumps",tab:"tools"},"tools":{dept:"Tools",tab:"tools"},"bags":{dept:"Bags",tab:"accessories"},"packs":{dept:"Packs",tab:"accessories"},"hydration":{dept:"Hydration",tab:"accessories"},"lights":{dept:"Lights",tab:"accessories"},"computers":{dept:"Computers",tab:"accessories"},"locks":{dept:"Locks",tab:"accessories"},"fenders":{dept:"Fenders",tab:"accessories"},"bells":{dept:"Bells",tab:"accessories"},"kickstands":{dept:"Kickstands",tab:"accessories"},"bike racks":{dept:"Bike Racks",tab:"accessories"},"water bottles":{dept:"Water Bottle",tab:"accessories"}};
    const pMatch = PM[l] || PM2[l];
    if (pMatch) return [tabPage(pMatch.tab), pMatch];
    if (l.includes("helmet") || l.includes("protection") || l.includes("apparel")) return ["accessories",{tab:"fit"}];
    if (l.includes("bags & rack") || l.includes("bags and rack")) return ["accessories",{tab:"accessories"}];
    if (l === "all bikes" || l === "bikes") return ["shop", null];
    if (l === "tires") return ["parts",{tab:"wheels"}];
    if (l === "drivetrain") return ["components",{tab:"drivetrain"}];
    if (l === "brakes" || l === "brake") return ["components",{tab:"brakes"}];
    if (l === "suspension") return ["components",{tab:"suspension"}];
    if (l === "cockpit") return ["components",{tab:"cockpit"}];
    if (l === "wheelsets" || l === "wheels & tubeless") return ["components",{tab:"wheels"}];
    if (l.includes("component")) return ["components",{tab:"drivetrain"}];
    if (l.includes("accessor")) return ["accessories",{tab:"accessories"}];
    if (l === "store") return ["store", null];
    if (l.includes("gift")) return ["giftcards", null];
    if (l.includes("classified") || l.includes("pinkbike")) return ["classifieds", null];
    if (l.includes("sale")) return ["shop", null];
    // Services / book
    if (l.startsWith("book a service") || l === "book") return ["book", null];
    if (l.includes("demo")) return ["demo", null];
    if (l.includes("warranty")) return ["warranty", null];
    if (l.includes("fitting") || l.includes("bike fit") || l.includes("bike fitting")) return ["fitting", null];
    if (l === "storage" || l.includes("storage program")) return ["storage", null];
    if (l.includes("tune") || l === "custom builds" || l.includes("service pricing") || l.includes("service menu") || l === "tune-ups") return ["services", null];
    // Explore
    if (l.includes("social")) return ["social", null];
    if (l.includes("clinic") || l.includes("event") || l.includes("skill")) return ["events", null];
    if (l.includes("ride")) return ["rides", null];
    if (l.includes("trail") || l.includes("knox") || l.includes("bear") || l.includes("myra") || l.includes("park") || l.includes("condition")) return ["trails", null];
    if (l === "about") return ["about", null];
    if (l === "contact") return ["contact", null];
    if (l.includes("brand")) return ["brands", null];
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
          {/* Bikes panel: By Style | Brands col1 | Brands col2 */}
          {d.styleCol ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:48 }}>
              <div className="mega-col">
                <h4>By Style</h4>
                <ul>
                  <li><a href="#" data-cursor="link" onClick={(e) => handleClick(e, "All Bikes")}>All Bikes</a></li>
                  {d.styleCol.map(it => <li key={it}><a href="#" data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}
                </ul>
              </div>
              <div className="mega-col">
                <h4>By Brand</h4>
                <ul>{d.brandCol.map(it => <li key={it}><a href="#" data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
              </div>
              <div className="mega-col">
                <ul style={{ marginTop:28 }}>{d.brandCol2.map(it => <li key={it}><a href="#" data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
              </div>
            </div>
          ) : /* Store panel: 3 cols — Components | Parts | Accessories */
          d.storeCols ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:48 }}>
              {d.storeCols.map((col, ci) => (
                <div key={ci} className="mega-col">
                  <h4 style={{ cursor:"pointer" }} onClick={() => { onClose(); window.cl.go(col.route); }}>{col.h}</h4>
                  <ul>{col.items.map(item => (
                    <li key={item.label}>
                      <a href="#" data-cursor="link" onClick={e => { e.preventDefault(); onClose(); window.cl.go(item.go[0], item.go[1]); }}>{item.label}</a>
                    </li>
                  ))}</ul>
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
  const TYPES  = ["All Bikes","Mountain","Gravel","Road","E-Bike","Commuter","Comfort","Kids"];
  const ACC_TABS_MOB = ["fit","tools","accessories"];
  const mobPage = (tab) => ACC_TABS_MOB.includes(tab) ? "accessories" : "components";
  const COMP_CATS = [
    { label:"Drivetrain",   tab:"drivetrain", items:["Cassette","Chains","Chainrings","Cranks","Derailleurs","Shifters","Bottom Brackets","Cables"] },
    { label:"Brakes",       tab:"brakes",     items:["Brake pads","Brake Levers","Brake Parts"] },
    { label:"Wheels",       tab:"wheels",     items:["Rims","Hubs","Spokes","Wheelsets","Skewers"] },
    { label:"Tires & Tubes",tab:"wheels",     items:['Tires 29"','Tires 700C','Tires 27.5"','Tires 26"',"Fat Bike Tires","Tubes","Tire Sealant","Tire Protection"] },
    { label:"Cockpit",      tab:"cockpit",    items:["Handlebar","Stem","Grips","Bar tape","Headsets","Saddles","Seat post"] },
    { label:"Suspension",   tab:"suspension", items:["Forks","Rear Shock","Fork Parts"] },
  ];
  const ACC_CATS = [
    { label:"Clothing & Helmets", tab:"fit",         items:["Helmets","Armour","Gloves","Sunglasses","Clothing","Socks","Shoes"] },
    { label:"Bags & Lighting",    tab:"accessories",  items:["Bags","Packs","Lights","Computers","Hydration"] },
    { label:"Tools & More",       tab:"tools",        items:["Pumps","Tools","Locks","Fenders","Bells","Kickstands","Bike Racks"] },
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
          <div style={linkA} onClick={() => setPanel('store')}>Store <ChevR /></div>
          <div style={linkA} onClick={() => setPanel('services')}>Services <ChevR /></div>
          <div style={linkA} onClick={() => setPanel('explore')}>Explore <ChevR /></div>
          <div style={linkA} onClick={() => setPanel('more')}>More <ChevR /></div>
        </div>
      </div>

      {/* ── Panel 2: Bikes ── */}
      <div className={"mob-panel " + (panel === 'shop' ? "mob-panel-active" : "mob-panel-right")}>
        {hdr(<button onClick={() => setPanel('main')} style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}><ChevL /> Back</button>)}
        <div style={{ padding:"24px", flex:1, overflowY:"auto" }}>
          <a href="#" style={{ ...linkA, fontSize:28, marginBottom:20, display:"block" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("shop")); }}>All Bikes</a>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:16 }}>
            <div style={{ paddingRight:16 }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:12 }}>By Brand</div>
              {BRANDS.map(br => (
                <a key={br} href="#" style={{ ...subA, fontSize:15, padding:"7px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("shop", { brand: br })); }}>{br}</a>
              ))}
            </div>
            <div style={{ paddingLeft:16, borderLeft:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:12 }}>By Style</div>
              {TYPES.map(t => (
                <a key={t} href="#" style={{ ...subA, fontSize:15, padding:"7px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("shop", t === "All Bikes" ? null : { type: t })); }}>{t}</a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel 3: Store ── */}
      <div className={"mob-panel " + (panel === 'store' ? "mob-panel-active" : "mob-panel-right")}>
        {hdr(<button onClick={() => setPanel('main')} style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}><ChevL /> Back</button>)}
        <div style={{ padding:"24px", flex:1, overflowY:"auto" }}>
          <a href="#" style={{ ...linkA, fontSize:28, marginBottom:24, display:"block" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("store")); }}>Shop the Store</a>
          {[
            { label:"Components",  route:"components", sub:"Drivetrain, Brakes, Suspension, Cockpit" },
            { label:"Parts",       route:"parts",      sub:"Tires, Tubes, Chains, Cables, Brake Pads" },
            { label:"Accessories", route:"accessories",sub:"Helmets, Lights, Bags, Clothing, Tools" },
          ].map(it => (
            <a key={it.label} href="#" onClick={e => { e.preventDefault(); dismiss(() => window.cl.go(it.route)); }}
              style={{ ...linkA, flexDirection:"column", alignItems:"flex-start", gap:2, paddingRight:40, position:"relative" }}>
              {it.label}
              <span style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".12em", textTransform:"uppercase", color:"rgba(255,255,255,0.4)", fontWeight:400 }}>{it.sub}</span>
              <span style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)" }}><ChevR /></span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Panel 4: Services ── */}
      <div className={"mob-panel " + (panel === 'services' ? "mob-panel-active" : "mob-panel-right")}>
        {hdr(<button onClick={() => setPanel('main')} style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}><ChevL /> Back</button>)}
        <div style={{ padding:"24px", flex:1, overflowY:"auto" }}>
          <a href="#" style={{ ...linkA, fontSize:28, marginBottom:24, display:"block" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("services")); }}>All Services</a>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:20 }}>
            {[
              { label:"Book a Service",  route:"book"      },
              { label:"Book a Demo",     route:"demo"      },
              { label:"Bike Fitting",    route:"fitting"   },
              { label:"Bike Storage",    route:"storage"   },
              { label:"Warranty",        route:"warranty"  },
              { label:"Service Pricing", route:"services"  },
            ].map(it => (
              <a key={it.label} href="#" style={{ ...subA, fontSize:20 }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go(it.route)); }}>{it.label}</a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel 6: Explore ── */}
      <div className={"mob-panel " + (panel === 'explore' ? "mob-panel-active" : "mob-panel-right")}>
        {hdr(<button onClick={() => setPanel('main')} style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}><ChevL /> Back</button>)}
        <div style={{ padding:"24px", flex:1, overflowY:"auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:20 }}>
            <div style={{ paddingRight:16 }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:14 }}>Rides & Events</div>
              {[
                { label:"Group Rides",   route:"rides"  },
                { label:"Skill Clinics", route:"events" },
                { label:"Events",        route:"events" },
              ].map(it => (
                <a key={it.label} href="#" style={{ ...subA, fontSize:18, padding:"9px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go(it.route)); }}>{it.label}</a>
              ))}
              <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:14, marginTop:24 }}>Community</div>
              {[
                { label:"Pinkbike", route:"classifieds" },
                { label:"Social",   route:"social"      },
              ].map(it => (
                <a key={it.label} href="#" style={{ ...subA, fontSize:18, padding:"9px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go(it.route)); }}>{it.label}</a>
              ))}
            </div>
            <div style={{ paddingLeft:16, borderLeft:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:14 }}>Trails</div>
              {["Knox Mountain","Bear Creek","Myra Canyon","Kelowna Bike Park"].map(it => (
                <a key={it} href="#" style={{ ...subA, fontSize:18, padding:"9px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("trails")); }}>{it}</a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel 7: More ── */}
      <div className={"mob-panel " + (panel === 'more' ? "mob-panel-active" : "mob-panel-right")}>
        {hdr(<button onClick={() => setPanel('main')} style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}><ChevL /> Back</button>)}
        <div style={{ padding:"24px", flex:1, overflowY:"auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:20 }}>
            <div style={{ paddingRight:16 }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:14 }}>About Us</div>
              {[
                { label:"About",      route:"about"  },
                { label:"Contact",    route:"contact" },
                { label:"Our Brands", route:"brands"  },
              ].map(it => (
                <a key={it.label} href="#" style={{ ...subA, fontSize:18, padding:"9px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go(it.route)); }}>{it.label}</a>
              ))}
            </div>
            <div style={{ paddingLeft:16, borderLeft:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:14 }}>Shop</div>
              {[
                { label:"Gift Cards", route:"giftcards" },
                { label:"Sale",       route:"shop"      },
              ].map(it => (
                <a key={it.label} href="#" style={{ ...subA, fontSize:18, padding:"9px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go(it.route)); }}>{it.label}</a>
              ))}
            </div>
          </div>
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
  const totalQty  = items.reduce((s, i) => s + (i.qty || 1), 0);
  const subtotal  = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  return (
    <>
      <div className={"drawer-backdrop " + (open ? "open" : "")} onClick={onClose} />
      <aside className={"drawer " + (open ? "open" : "")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 28px", borderBottom: "1px solid var(--hairline)", flexShrink: 0 }}>
          <div className="display-s">Cart  {totalQty > 0 ? `/ ${totalQty}` : ""}</div>
          <button onClick={onClose} className="link-underline" data-cursor="link" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>Close</button>
        </div>

        <div style={{ padding: "0 28px", flex: 1, overflowY: "auto" }}>
          {items.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div className="display-s" style={{ marginBottom: 12 }}>Cart is empty</div>
              <p style={{ color: "var(--gray-500)", fontSize: 14, marginBottom: 24 }}>Add a bike to get started.</p>
              <button className="btn btn-outline" onClick={() => { onClose(); window.cl.go("shop"); }} data-cursor="link">Shop Bikes <ArrowRight /></button>
            </div>
          )}
          {items.map((it, idx) => {
            const qty       = it.qty || 1;
            const lineTotal = (it.price || 0) * qty;
            return (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 14, padding: "16px 0", borderBottom: "1px solid var(--hairline)" }}>
                {it.image
                  ? <img src={it.image} alt={it.name} style={{ width: 72, height: 72, objectFit: "contain", background: "var(--paper)", padding: 4 }} />
                  : <div className="ph" style={{ width: 72, height: 72 }} />
                }
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 2 }}>
                    <div style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: "-.005em", lineHeight: 1.3 }}>{it.name}</div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>${lineTotal.toLocaleString()}</div>
                  </div>
                  {it.variant && <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:4 }}>{it.variant}</div>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {qty > 1 && (
                        <span style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".1em", textTransform:"uppercase", color:"var(--gray-500)", background:"var(--gray-100)", padding:"2px 6px" }}>×{qty}</span>
                      )}
                      <button className="link-underline" onClick={() => { window.shopifyCart?.remove(it.variantId); onRemove(idx); }}
                        style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--gray-400)", letterSpacing:".1em", textTransform:"uppercase" }}>Remove</button>
                    </div>
                    {qty > 1 && <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--gray-400)", letterSpacing:".1em", textTransform:"uppercase" }}>${(it.price||0).toLocaleString()} ea</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "20px 28px", borderTop: "1px solid var(--hairline)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontFamily: "var(--display)", fontSize: 16, textTransform: "uppercase", letterSpacing: "-.01em" }}>
            <span>Subtotal</span><span>${subtotal.toLocaleString()}</span>
          </div>
          <button className="btn" style={{ width: "100%", justifyContent: "center" }} data-cursor="link"
            disabled={items.length === 0} onClick={() => window.shopifyCart?.checkout()}>
            Checkout <ArrowRight />
          </button>
          <div style={{ marginTop: 10, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-500)", textAlign: "center" }}>Free shipping over $250</div>
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
            {[["Store","store"],["Bikes","shop"],["Components","components"],["Parts","parts"],["Accessories","accessories"],["Gift Cards","giftcards"]].map(([label,route,intent]) => (
              <li key={label}><a href="#" className="link-underline" data-cursor="link" onClick={e=>{e.preventDefault();window.cl.go(route,intent||null);}}>{label}</a></li>
            ))}
          </ul>
        </div>
        <div className="footer-col">
          <h4>Services</h4>
          <ul>
            {[["Book a Service","book"],["Book a Demo","demo"],["Bike Fitting","fitting"],["Custom Builds","services"],["Storage Program","storage"],["Warranty","warranty"]].map(([label,route]) => (
              <li key={label}><a href="#" className="link-underline" data-cursor="link" onClick={e=>{e.preventDefault();window.cl.go(route,intent||null);}}>{label}</a></li>
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
    { role: "bot", text: "Hey — ChainLine here. Ask me anything about bikes, service, or what we've got in stock." }
  ]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const bottomRef = React.useRef(null);
  const [btnBottom, setBtnBottom] = React.useState(window.innerWidth <= 768 ? 16 : 32);

  React.useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open, thinking]);

  React.useEffect(() => {
    const onResize = () => setBtnBottom(window.innerWidth <= 768 ? 16 : 32);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
      <button onClick={() => setOpen(o => !o)} data-cursor="link" className="chat-toggle-btn"
        style={{ position: "fixed", left: btnBottom, bottom: btnBottom, zIndex: 80, width: 52, height: 52, borderRadius: "50%", background: "var(--black)", color: "var(--white)", display: "grid", placeItems: "center", border: "1px solid var(--black)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
        {open
          ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2l12 12M14 2L2 14"/></svg>
          : <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h16v10H8l-4 3v-3H2z"/></svg>
        }
      </button>
      {open && (
        <div className="chat-popup" style={{ position: "fixed", left: btnBottom, bottom: btnBottom + 64, zIndex: 80, width: 320, background: "var(--white)", border: "1px solid var(--hairline)", boxShadow: "0 8px 40px rgba(0,0,0,0.16)", display: "flex", flexDirection: "column", maxHeight: 440 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--black)", color: "var(--white)" }}>
            <div>
              <div style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em" }}>ChainLine Cycle Support</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gray-300)", marginTop: 2 }}>Ask us anything · Usually instant</div>
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
            <div className="eyebrow" style={{ marginBottom:12, color:"var(--gray-500)" }}>Components &amp; Accessories</div>
            {partResults.map((p, i) => (
              <button key={i} onClick={() => { const tab = (window.PART_TABS||[]).find(t=>t.depts.some(d=>d===(p.department||"")));  window.cl.go("parts",{dept:p.department,tab:tab?.id}); onClose(); }} data-cursor="link" style={rowStyle}>
                <div style={{ flex:1 }}>
                  <div className="eyebrow" style={{ marginBottom:3 }}>{p.department}</div>
                  <div style={{ fontFamily:"var(--display)", fontSize:16, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em" }}>{p.name}</div>
                </div>
                {p.price > 0 && <div style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:500, flexShrink:0 }}>${p.price.toFixed(2)}</div>}
              </button>
            ))}
            <button onClick={() => { window.cl.go("parts"); onClose(); }} data-cursor="link"
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 0", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)" }}>
              Browse all components &amp; accessories <ArrowRight size={10} />
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

Object.assign(window, { ChainLogo, Wordmark, Header, MobileNav, MegaMenu, StickyCTA, CartDrawer, Footer, useReveal, SplitText, Counter, BrandMarquee, ArrowRight, SearchIcon, AccountIcon, AccountDropdown, DarkToggle, Announce, ContactBar, ChatWidget, SearchModal });
