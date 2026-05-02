// ChainLine — Logo glyph (chainlink mark)
const ChainLogo = ({ size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.6" aria-hidden="true">
    <rect x="3" y="11" width="14" height="10" rx="5" />
    <rect x="15" y="11" width="14" height="10" rx="5" />
  </svg>
);

// Brand wordmark — uses the real ChainLine Cycle logo
const Wordmark = () => (
  <a href="/" onClick={(e) => { e.preventDefault(); window.cl.go("home"); }} className="nav-logo" data-cursor="link" aria-label="ChainLine Cycle — Home">
    <img src="/logo-dark.png" alt="ChainLine Cycle" className="logo-img" />
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
  const inp = { width:"100%", padding:"10px 0", border:"none", borderBottom:"1px solid var(--hairline)", fontSize:16, fontFamily:"var(--body)", background:"transparent", outline:"none", color:"var(--black)", marginBottom:16 };

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
    { id: "shop",        label: "Bikes",       panel: "shop",        route: "shop" },
    { id: "parts",       label: "Parts",       panel: "parts",       route: "components" },
    { id: "accessories", label: "Accessories", panel: "accessories", route: "accessories" },
    { id: "services",    label: "Services",    panel: "services",    route: "services" },
    { id: "explore",     label: "Explore",     panel: "explore",     route: "rides" },
    { id: "more",        label: "More",        panel: "more",        route: "about" },
  ];

  const closeTimer = React.useRef(null);
  const openMega = (p) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    onMega(p);
    if (p === 'parts')       window.lightspeedWarmCache?.(['drivetrain','brakes','wheels','cockpit','suspension']);
    if (p === 'accessories') window.lightspeedWarmCache?.(['helmets','protection','shoes','tools','bags','lights','locks','racks']);
    if (p === 'shop') window.lightspeedGetBikes?.();
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
  React.useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); onSearch(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSearch]);

  return (
    <header className={"header " + (scrolled ? (page === "home" ? "solid" : "light") : "")} data-screen-label="00 Header">
      <Announce />
      <ContactBar />
      <div className="container-wide">
        <div className="nav" onMouseLeave={scheduleClose}>
          <Wordmark />
          <nav className="nav-links">
            {items.map((it) => (
              <a
                key={it.id}
                href={pageHref(it.route)}
                className={"nav-link " + (page === it.id || (it.route && page === it.route) ? "active" : "")}
                data-cursor="link"
                onMouseEnter={() => it.panel ? openMega(it.panel) : openMega(null)}
                onClick={(e) => { e.preventDefault(); if (it.route) { onMega(null); window.cl.go(it.route, it.intent || null); } }}
              >
                {it.label}
                {it.panel && <span className="chev" />}
              </a>
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
      <a href={`${SHOPIFY_STORE}/account/login?return_url=${encodeURIComponent("https://chainline.ca")}`} style={rowStyle} onClick={onClose}
        onMouseEnter={e => e.currentTarget.style.background="var(--paper)"}
        onMouseLeave={e => e.currentTarget.style.background=""}>Sign In</a>
      {divider}
      <a href={`${SHOPIFY_STORE}/account/register?return_url=${encodeURIComponent("https://chainline.ca")}`} style={rowStyle} onClick={onClose}
        onMouseEnter={e => e.currentTarget.style.background="var(--paper)"}
        onMouseLeave={e => e.currentTarget.style.background=""}>Create Account</a>
      {divider}
      <a href={`${SHOPIFY_STORE}/account`} style={{ ...rowStyle, color: "var(--gray-500)" }} onClick={onClose}
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

const pageHref = (page, intent) => {
  if (!page || page === 'home') return '/';
  if (page === 'shop') {
    if (intent?.type && intent.type !== 'All') return `/bikes/${intent.type.toLowerCase().replace(/\s+/g,'-')}`;
    if (intent?.brand) return `/bikes/${intent.brand.toLowerCase()}`;
    return '/bikes';
  }
  if (page === 'components') return intent?.tab ? `/components/${intent.tab}` : '/components';
  if (page === 'accessories') return intent?.tab ? `/accessories/${intent.tab}` : '/accessories';
  if (page === 'parts') return intent?.tab ? `/parts/${intent.tab}` : '/parts';
  return `/${page}`;
};

const MegaMenu = ({ open, onOpen, onClose }) => {
  const [saleState, setSaleState] = React.useState({ checked: false, hasSale: false, count: 0 });
  React.useEffect(() => {
    const onSale = () => setSaleState({
      checked: !!(window.CL_LS?.saleChecked),
      hasSale: !!(window.CL_LS?.hasSale),
      count:   window.CL_LS?.saleHandles?.length || 0,
    });
    window.addEventListener('lightspeed:sale', onSale);
    if (window.CL_LS?.saleChecked) onSale();
    return () => window.removeEventListener('lightspeed:sale', onSale);
  }, []);

  const BIKE_BRANDS  = ["Marin", "Transition", "Surly", "Pivot", "Salsa"];
  const BIKE_BRANDS2 = ["Bianchi", "Moots", "Knolly", "Revel"];
  const data = {
    shop: {
      styleCol: ["Mountain", "Gravel", "E-Bike", "Commuter", "Comfort", "Kids"],
      brandCol:  BIKE_BRANDS,
      brandCol2: BIKE_BRANDS2,
    },
    parts: {
      searchPage: "components",
      allLabel: "All Parts",
      cols: [
        { h: "Drivetrain", items: [
          { label:"Cassettes",         go:["components",{tab:"drivetrain",search:"Cassette"}] },
          { label:"Chains",            go:["components",{tab:"drivetrain",search:"Chain"}] },
          { label:"Chainrings",        go:["components",{tab:"drivetrain",search:"Chainring"}] },
          { label:"Cranks",            go:["components",{tab:"drivetrain",search:"Crank"}] },
          { label:"Rear Derailleur",   go:["components",{tab:"drivetrain",search:"Rear Derai"}] },
          { label:"Front Derailleur",  go:["components",{tab:"drivetrain",search:"Front Derai"}] },
          { label:"Shifters",          go:["components",{tab:"drivetrain",search:"Shift"}] },
          { label:"Cables",            go:["components",{tab:"drivetrain",search:"Cable"}] },
          { label:"Bottom Brackets",   go:["components",{tab:"drivetrain",search:"Bottom Brac"}] },
        ]},
        { h: "Brakes & Suspension", items: [
          { label:"Disc Brakes",       go:["components",{tab:"brakes"}] },
          { label:"Brake Pads",        go:["components",{tab:"brakes",search:"Brake pad"}] },
          { label:"Brake Levers",      go:["components",{tab:"brakes",search:"Lever"}] },
          { label:"Forks",             go:["components",{tab:"suspension",search:"Fork"}] },
          { label:"Rear Shocks",       go:["components",{tab:"suspension",search:"Shock"}] },
          { label:"Fork Parts & Oil",  go:["components",{tab:"suspension",search:"Fork Part"}] },
        ]},
        { h: "Wheels & Tires", items: [
          { label:'Tires 29"',         go:["components",{tab:"wheels",search:"29"}] },
          { label:"Tires 700C",        go:["components",{tab:"wheels",search:"700C"}] },
          { label:'Tires 27.5"',       go:["components",{tab:"wheels",search:"27"}] },
          { label:"Fat Bike Tires",    go:["components",{tab:"wheels",search:"Fatbike"}] },
          { label:"Tubes",             go:["components",{tab:"wheels",search:"Tube"}] },
          { label:"Tire Sealant",      go:["components",{tab:"wheels",search:"Sealant"}] },
          { label:"Wheelsets",         go:["components",{tab:"wheels",search:"Wheel"}] },
          { label:"Hubs & Rims",       go:["components",{tab:"wheels",search:"Hub"}] },
        ]},
        { h: "Cockpit & Controls", items: [
          { label:"Handlebars",        go:["components",{tab:"cockpit",search:"Handle"}] },
          { label:"Stems",             go:["components",{tab:"cockpit",search:"Stem"}] },
          { label:"Grips",             go:["components",{tab:"cockpit",search:"Grip"}] },
          { label:"Bar Tape",          go:["components",{tab:"cockpit",search:"Bar tape"}] },
          { label:"Saddles",           go:["components",{tab:"cockpit",search:"Saddle"}] },
          { label:"Seatposts",         go:["components",{tab:"cockpit",search:"Seat post"}] },
          { label:"Headsets",          go:["components",{tab:"cockpit",search:"Head"}] },
        ]},
      ],
    },
    accessories: {
      searchPage: "accessories",
      allLabel: "All Accessories",
      cols: [
        { h: "Protection", items: [
          { label:"Helmets",           go:["accessories",{tab:"helmets"}] },
          { label:"MTB Helmets",       go:["accessories",{tab:"helmets",search:"MTB"}] },
          { label:"Gloves",            go:["accessories",{tab:"protection",search:"Glove"}] },
          { label:"Armour & Pads",     go:["accessories",{tab:"protection",search:"Armour"}] },
          { label:"Sunglasses",        go:["accessories",{tab:"protection",search:"Sunglass"}] },
        ]},
        { h: "Shoes & Cleats", items: [
          { label:"MTB Shoes",         go:["accessories",{tab:"shoes",search:"MTB"}] },
          { label:"Road Shoes",        go:["accessories",{tab:"shoes",search:"Road"}] },
          { label:"SPD Cleats",        go:["accessories",{tab:"shoes",search:"Cleat"}] },
        ]},
        { h: "Carry & Lights", items: [
          { label:"Bags & Packs",      go:["accessories",{tab:"bags"}] },
          { label:"Hydration",         go:["accessories",{tab:"bags",search:"Hydrat"}] },
          { label:"Water Bottles",     go:["accessories",{tab:"bags",search:"Bottle"}] },
          { label:"Lights",            go:["accessories",{tab:"lights",search:"Light"}] },
          { label:"Computers & GPS",   go:["accessories",{tab:"lights",search:"Comput"}] },
          { label:"Locks",             go:["accessories",{tab:"locks"}] },
        ]},
        { h: "Tools & Gear", items: [
          { label:"Pumps",             go:["accessories",{tab:"tools",search:"Pump"}] },
          { label:"Lube",              go:["accessories",{tab:"tools",search:"Lube"}] },
          { label:"Degreasers",        go:["accessories",{tab:"tools",search:"Degreaser"}] },
          { label:"Workshop Tools",    go:["accessories",{tab:"tools"}] },
          { label:"Bike Racks",        go:["accessories",{tab:"racks",search:"Bike Rack"}] },
          { label:"Car Racks",         go:["accessories",{tab:"racks",search:"Car Rack"}] },
          { label:"Fenders",           go:["accessories",{tab:"racks",search:"Fender"}] },
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
        { h: "Community", items: ["MTBCO", "Pinkbike", "Social", "Trail Conditions"] },
      ],
    },
    more: {
      cols: [
        { h: "About Us", items: ["About", "Contact", "Brands"] },
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
    if (l === "comfort")  return ["shop", { type: "Comfort" }];
    if (l === "adventure") return ["shop", { type: "Adventure" }];
    if (l === "kids") return ["shop", { type: "Kids" }];
    // Brand filters → shop page filtered by brand
    if (["marin", "transition", "surly", "salsa", "pivot", "bianchi", "moots", "knolly", "revel", "revel cycles"].includes(l)) return ["shop", { brand: l.charAt(0).toUpperCase() + l.slice(1).replace(/ cycles$/,'') }];
    // Components vs Accessories split — tabs in ACC_TABS go to /accessories, rest to /components
    const ACC_TABS = ["helmets","protection","shoes","tools","bags","lights","locks","racks","accessories"];
    const tabPage  = (tab) => ACC_TABS.includes(tab) ? "accessories" : "components";
    const PM={"cassette":{dept:"Cassette",tab:"drivetrain"},"chains":{dept:"Chains",tab:"drivetrain"},"chainrings":{dept:"Chainrings",tab:"drivetrain"},"cranks":{dept:"Cranks",tab:"drivetrain"},"derailleurs":{dept:"Derailleur Rear",tab:"drivetrain"},"shifters":{dept:"Shifters MTB",tab:"drivetrain"},"bottom brackets":{dept:"Bottom Brackets",tab:"drivetrain"},"cables":{dept:"Cables",tab:"drivetrain"},"brake pads":{dept:"Brake pads",tab:"brakes"},"brake levers":{dept:"Brake Lever U",tab:"brakes"},"rims":{dept:"Rims",tab:"wheels"},"hubs":{dept:"Hubs",tab:"wheels"},"spokes":{dept:"Spokes",tab:"wheels"},"wheelsets":{dept:"Wheelset (FR+RR)",tab:"wheels"},"skewers":{dept:"Skewers QR",tab:"wheels"}};
    const PM2={'tires 29"':{dept:'Tires 29"',tab:"wheels"},"tires 700c":{dept:"Tires 700C",tab:"wheels"},'tires 27.5"':{dept:'Tires 27" & 26x1&1/4 etc...',tab:"wheels"},'tires 26"':{dept:'Tires 26"',tab:"wheels"},"fat bike tires":{dept:"Tires Fatbike",tab:"wheels"},"tubes":{dept:"Tubes",tab:"wheels"},"tire sealant":{dept:"Tire Sealant",tab:"wheels"},"tire protection":{dept:"Tire Protection",tab:"wheels"},"forks":{dept:"Forks",tab:"suspension"},"rear shock":{dept:"Rear Shock",tab:"suspension"},"handlebar":{dept:"Handlebar",tab:"cockpit"},"stem":{dept:"Stem",tab:"cockpit"},"grips":{dept:"Grips",tab:"cockpit"},"bar tape":{dept:"Bar tape",tab:"cockpit"},"headsets":{dept:"Headsets",tab:"cockpit"},"seat post":{dept:"Seat post",tab:"cockpit"},"saddles":{dept:"Saddles",tab:"cockpit"},"helmets":{dept:"Helmet",tab:"helmets"},"armour":{dept:"Armour",tab:"protection"},"gloves":{dept:"Gloves",tab:"protection"},"sunglasses":{dept:"Sunglasses",tab:"protection"},"clothing":{dept:"Clothing",tab:"clothing"},"socks":{dept:"Socks",tab:"clothing"},"arm warmers":{dept:"Arm Warmers",tab:"clothing"},"leg warmers":{dept:"Leg Warmers",tab:"clothing"},"shoes":{dept:"Shoes Mountain",tab:"shoes"},"cleats":{dept:"Cleats",tab:"shoes"},"pumps":{dept:"Pumps",tab:"tools"},"tools":{dept:"Tools",tab:"tools"},"bags":{dept:"Bags",tab:"bags"},"packs":{dept:"Packs",tab:"bags"},"hydration":{dept:"Hydration",tab:"bags"},"lights":{dept:"Lights",tab:"lights"},"computers":{dept:"Computers",tab:"lights"},"locks":{dept:"Locks",tab:"locks"},"fenders":{dept:"Fenders",tab:"racks"},"bells":{dept:"Bells",tab:"racks"},"kickstands":{dept:"Kickstands",tab:"racks"},"bike racks":{dept:"Bike Racks",tab:"racks"},"water bottles":{dept:"Water Bottle",tab:"bags"}};
    const pMatch = PM[l] || PM2[l];
    if (pMatch) return [tabPage(pMatch.tab), pMatch];
    if (l.includes("helmet")) return ["accessories",{tab:"helmets"}];
    if (l.includes("glove") || l.includes("armour") || l.includes("armor") || l.includes("protection") || l.includes("sunglass")) return ["accessories",{tab:"protection"}];
    if (l.includes("shoe") || l.includes("cleat")) return ["accessories",{tab:"shoes"}];
    if (l.includes("clothing") || l.includes("apparel")) return ["accessories",{tab:"clothing"}];
    if (l.includes("bag") || l.includes("pack") || l.includes("backpack") || l.includes("hydration") || l.includes("bottle") || l.includes("camel")) return ["accessories",{tab:"bags"}];
    if (l.includes("rack") || l.includes("fender"))                 return ["accessories",{tab:"racks"}];
    if (l.includes("pump") || l.includes("lube") || l.includes("degreaser") || l.includes("maintenance")) return ["accessories",{tab:"tools"}];
    if (l.includes("light") || l.includes("computer") || l.includes("gps"))  return ["accessories",{tab:"lights"}];
    if (l.includes("lock"))                                         return ["accessories",{tab:"locks"}];
    if (l === "all bikes" || l === "bikes") return ["shop", null];
    if (l.includes("tire") || l.includes("tyre") || l.includes("tube")) return ["components",{tab:"wheels"}];
    if (l.includes("saddle") || l.includes("seat") || l.includes("handlebar") || l.includes("grip") || l.includes("cockpit")) return ["components",{tab:"cockpit"}];
    if (l.includes("cassette") || l.includes("chain") || l.includes("derail") || l.includes("drivetrain") || l.includes("chainring")) return ["components",{tab:"drivetrain"}];
    if (l.includes("brake"))                                        return ["components",{tab:"brakes"}];
    if (l.includes("suspension") || l.includes("fork") || l.includes("shock")) return ["components",{tab:"suspension"}];
    if (l.includes("wheel") || l.includes("rim") || l.includes("hub")) return ["components",{tab:"wheels"}];
    if (l === "all parts" || l === "parts") return ["components", null];
    if (l.includes("component"))                                    return ["components",{tab:"drivetrain"}];
    if (l.includes("accessor"))                                     return ["accessories",{tab:"helmets"}];
    if (l === "store") return ["store", null];
    if (l.includes("gift")) return ["giftcards", null];
    if (l.includes("classified") || l.includes("pinkbike")) return ["classifieds", null];
    if (l.includes("sale")) return ["shop", null];
    // Services / book
    if (l.startsWith("book a service") || l === "book") return ["book", null];
    if (l.includes("demo")) return ["demo", null];
    if (l.includes("warranty")) return ["warranty", null];
    if (l.includes("fitting") || l.includes("bike fit") || l.includes("bike fitting")) return ["fitting", null];
    if (l.includes("storage")) return ["storage", null];
    if (l.includes("custom")) return ["services", null];
    if (l.includes("tune") || l === "custom builds" || l.includes("service pricing") || l.includes("service menu") || l === "tune-ups") return ["services", null];
    // Explore
    if (l.includes("social")) return ["social", null];
    if (l.includes("mtbco") || l.includes("mountain bike club")) return ["mtbco", null];
    if (l.includes("clinic") || l.includes("skill")) return ["clinics", null];
    if (l.includes("event")) return ["events", null];
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
          {/* Bikes: All Bikes | By Style + Sale | Brands col1 | Brands col2 */}
          {d.styleCol ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:48 }}>
              <div className="mega-col">
                <h4>
                  <a href="/bikes" data-cursor="link" style={{ color:"var(--black)", display:"flex", alignItems:"center", gap:6 }} onClick={(e) => handleClick(e, "All Bikes")}>
                    All Bikes <ArrowRight size={10} />
                  </a>
                </h4>
                <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-400)", margin:"8px 0 8px" }}>By Style</div>
                <ul>
                  {d.styleCol.map(it => <li key={it}><a href={pageHref(...routeFor(it))} data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}
                  {saleState.hasSale && (
                    <li style={{ marginTop:8, paddingTop:8, borderTop:"1px solid var(--hairline)" }}>
                      <a href="/bikes" data-cursor="link" style={{ color:"#dc2626", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}
                        onClick={e => { e.preventDefault(); onClose(); window.cl.go("shop", { sale:true }); }}>
                        Sale <span style={{ fontFamily:"var(--mono)", fontSize:9, background:"#dc2626", color:"#fff", padding:"2px 6px", borderRadius:10 }}>{saleState.count}</span>
                      </a>
                    </li>
                  )}
                </ul>
              </div>
              <div className="mega-col">
                <h4>By Brand</h4>
                <ul>{d.brandCol.map(it => <li key={it}><a href={pageHref(...routeFor(it))} data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
              </div>
              <div className="mega-col">
                <ul style={{ marginTop:28 }}>{d.brandCol2.map(it => <li key={it}><a href={pageHref(...routeFor(it))} data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
              </div>
            </div>
          ) : d.searchPage ? (
            /* Parts / Accessories: "All X" as first-column header + category cols — same style as Bikes */
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${d.cols.length}, 1fr)`, gap:40 }}>
              {d.cols.map((col, ci) => (
                <div key={ci} className="mega-col">
                  {ci === 0 ? (
                    <>
                      <h4>
                        <a href={"/" + d.searchPage} data-cursor="link" style={{ color:"var(--black)", display:"flex", alignItems:"center", gap:6 }}
                          onClick={e => { e.preventDefault(); onClose(); window.cl.go(d.searchPage); }}>
                          {d.allLabel} <ArrowRight size={10} />
                        </a>
                      </h4>
                      <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-400)", margin:"8px 0 8px" }}>{col.h}</div>
                    </>
                  ) : (
                    <h4>{col.h}</h4>
                  )}
                  <ul>{col.items.map(item => (
                    <li key={item.label}>
                      <a href={pageHref(item.go[0], item.go[1])} data-cursor="link" onClick={e => { e.preventDefault(); onClose(); window.cl.go(item.go[0], item.go[1]); }}>{item.label}</a>
                    </li>
                  ))}</ul>
                </div>
              ))}
            </div>
          ) : d.cols ? (
            /* Services / Explore / More: 3-col layout */
            <div className="mega-grid">
              {d.cols.slice(0, 2).map((c, i) => (
                <div key={i} className="mega-col">
                  <h4>{c.h}</h4>
                  <ul>{c.items.map(it => <li key={it}><a href={pageHref(...routeFor(it))} data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
                </div>
              ))}
              {d.cols[2] && (
                <div className="mega-col">
                  <h4>{d.cols[2].h}</h4>
                  <ul style={{ marginBottom: 24 }}>{d.cols[2].items.map(it => <li key={it}><a href={pageHref(...routeFor(it))} data-cursor="link" onClick={(e) => handleClick(e, it)}>{it}</a></li>)}</ul>
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

  // Lock body scroll when nav is open
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const dismiss = (fn) => { onClose(); fn && fn(); };

  const BRANDS = ["Marin","Transition","Surly","Pivot","Salsa","Bianchi","Moots","Knolly","Revel"];
  const TYPES  = ["All Bikes","Mountain","Gravel","Road","E-Bike","Commuter","Comfort","Kids"];
  const ACC_TABS_MOB = ["helmets","protection","shoes","tools","bags","lights","locks","racks","accessories"];
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
    { label:"Helmets",         tab:"helmets",    items:["Helmets","MTB Helmets","Road Helmets"] },
    { label:"Gloves & Armour", tab:"protection", items:["Gloves","Knee Pads","Elbow Pads","Sunglasses"] },
    { label:"Shoes & Cleats",  tab:"shoes",      items:["MTB Shoes","Road Shoes","SPD Cleats"] },
    { label:"Tools & Pumps",   tab:"tools",      items:["Pumps","Tools","Lube","Degreasers"] },
    { label:"Bags & Hydration",tab:"bags",       items:["Bags","Packs","Hydration"] },
    { label:"Lights",          tab:"lights",     items:["Lights","Computers"] },
    { label:"Locks",           tab:"locks",      items:["Locks"] },
    { label:"Racks & Fenders", tab:"racks",      items:["Bike Racks","Fenders","Kickstands","Bells"] },
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
    <>
    <div className={"mobile-nav-backdrop " + (open ? "open" : "")} onClick={() => dismiss()} />
    <div className={"mobile-nav " + (open ? "open" : "")} style={{ overflow:"hidden" }}>
      {/* ── Panel 1: Main ── */}
      <div className={"mob-panel " + (panel === 'main' ? "mob-panel-active" : "mob-panel-left")}
        style={{ pointerEvents: panel === 'main' ? 'all' : 'none' }}>
        {hdr(<div className="nav-logo"><img src="/logo.png" alt="ChainLine Cycle" className="logo-img logo-img-light" style={{ height:28 }} /></div>)}
        <div style={{ padding:"24px 24px 0", flex:1, overflowY:"auto" }}>
          <div style={linkA} onClick={() => setPanel('shop')}>Bikes <ChevR /></div>
          <div style={linkA} onClick={() => setPanel('parts')}>Parts <ChevR /></div>
          <div style={linkA} onClick={() => setPanel('accessories')}>Accessories <ChevR /></div>
          <div style={linkA} onClick={() => setPanel('services')}>Services <ChevR /></div>
          <div style={linkA} onClick={() => setPanel('explore')}>Explore <ChevR /></div>
          <div style={linkA} onClick={() => setPanel('more')}>More <ChevR /></div>
        </div>
      </div>

      {/* ── Panel 2: Bikes ── */}
      <div className={"mob-panel " + (panel === 'shop' ? "mob-panel-active" : "mob-panel-right")}>
        {hdr(<button onClick={() => setPanel('main')} style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}><ChevL /> Back</button>)}
        <div style={{ padding:"24px", flex:1, overflowY:"auto" }}>
          <a href="/bikes" style={{ ...linkA, fontSize:28, marginBottom:20, display:"block" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("shop")); }}>All Bikes</a>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:16 }}>
            <div style={{ paddingRight:16 }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:12 }}>By Brand</div>
              {BRANDS.map(br => (
                <a key={br} href={'/bikes/' + br.toLowerCase()} style={{ ...subA, fontSize:15, padding:"7px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("shop", { brand: br })); }}>{br}</a>
              ))}
            </div>
            <div style={{ paddingLeft:16, borderLeft:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:12 }}>By Style</div>
              {TYPES.map(t => (
                <a key={t} href={t === "All Bikes" ? "/bikes" : '/bikes/' + t.toLowerCase().replace(/\s+/g,'-')} style={{ ...subA, fontSize:15, padding:"7px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("shop", t === "All Bikes" ? null : { type: t })); }}>{t}</a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel: Parts (merged components + parts) ── */}
      <div className={"mob-panel " + (panel === 'parts' ? "mob-panel-active" : "mob-panel-right")}>
        {hdr(<button onClick={() => setPanel('main')} style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}><ChevL /> Back</button>)}
        <div style={{ padding:"0 24px", flex:1, overflowY:"auto" }}>
          <a href="/components" style={{ ...linkA, fontSize:24, display:"block", padding:"18px 0 14px", borderBottom:"1px solid rgba(255,255,255,0.1)", marginBottom:4 }}
            onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("components")); }}>All Parts</a>
          {[
            { label:"Drivetrain",      tab:"drivetrain" },
            { label:"Brakes",          tab:"brakes" },
            { label:"Suspension",      tab:"suspension" },
            { label:"Wheels & Tires",  tab:"wheels" },
            { label:"Cockpit",         tab:"cockpit" },
          ].map(it => (
            <a key={it.label} href={'/components/' + it.tab} style={{ ...subA, fontSize:22 }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("components", { tab: it.tab })); }}>{it.label}</a>
          ))}
          <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:10 }}>Quick Access</div>
            {[
              { label:'Tires 29"',    tab:"wheels",    search:"29" },
              { label:"Brake Pads",   tab:"brakes",    search:"Brake pad" },
              { label:"Chains",       tab:"drivetrain",search:"Chain" },
              { label:"Tubes",        tab:"wheels",    search:"Tube" },
              { label:"Cables",       tab:"drivetrain",search:"Cable" },
              { label:"Tire Sealant", tab:"wheels",    search:"Sealant" },
            ].map(it => (
              <a key={it.label} href={'/components/' + it.tab} style={{ ...subA, fontSize:16, padding:"7px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("components", { tab: it.tab, search: it.search })); }}>{it.label}</a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel: Accessories ── */}
      <div className={"mob-panel " + (panel === 'accessories' ? "mob-panel-active" : "mob-panel-right")}>
        {hdr(<button onClick={() => setPanel('main')} style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}><ChevL /> Back</button>)}
        <div style={{ padding:"0 24px", flex:1, overflowY:"auto" }}>
          <a href="/accessories" style={{ ...linkA, fontSize:24, display:"block", padding:"18px 0 14px", borderBottom:"1px solid rgba(255,255,255,0.1)", marginBottom:4 }}
            onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("accessories")); }}>All Accessories</a>
          {[
            { label:"Helmets",             tab:"helmets" },
            { label:"Gloves & Armour",     tab:"protection" },
            { label:"Shoes & Cleats",      tab:"shoes" },
            { label:"Bags & Packs",        tab:"bags" },
            { label:"Lights & Computers",  tab:"lights" },
            { label:"Locks",               tab:"locks" },
            { label:"Racks & Fenders",     tab:"racks" },
            { label:"Pumps & Tools",       tab:"tools" },
          ].map(it => (
            <a key={it.label} href={'/accessories/' + it.tab} style={{ ...subA, fontSize:22 }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("accessories", { tab: it.tab })); }}>{it.label}</a>
          ))}
        </div>
      </div>

      {/* ── Panel 4: Services ── */}
      <div className={"mob-panel " + (panel === 'services' ? "mob-panel-active" : "mob-panel-right")}>
        {hdr(<button onClick={() => setPanel('main')} style={{ background:"none", border:"none", color:"var(--white)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:11, letterSpacing:".14em", textTransform:"uppercase" }}><ChevL /> Back</button>)}
        <div style={{ padding:"24px", flex:1, overflowY:"auto" }}>
          <a href="/services" style={{ ...linkA, fontSize:28, marginBottom:24, display:"block" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("services")); }}>All Services</a>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:20 }}>
            {[
              { label:"Book a Service",  route:"book"      },
              { label:"Book a Demo",     route:"demo"      },
              { label:"Bike Fitting",    route:"fitting"   },
              { label:"Bike Storage",    route:"storage"   },
              { label:"Warranty",        route:"warranty"  },
              { label:"Service Pricing", route:"services"  },
            ].map(it => (
              <a key={it.label} href={pageHref(it.route)} style={{ ...subA, fontSize:20 }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go(it.route)); }}>{it.label}</a>
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
                { label:"Skill Clinics", route:"clinics" },
                { label:"Events",        route:"events" },
              ].map(it => (
                <a key={it.label} href={pageHref(it.route)} style={{ ...subA, fontSize:18, padding:"9px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go(it.route)); }}>{it.label}</a>
              ))}
              <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:14, marginTop:24 }}>Community</div>
              {[
                { label:"MTBCO",    route:"mtbco"       },
                { label:"Pinkbike", route:"classifieds" },
                { label:"Social",   route:"social"      },
              ].map(it => (
                <a key={it.label} href={pageHref(it.route)} style={{ ...subA, fontSize:18, padding:"9px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go(it.route)); }}>{it.label}</a>
              ))}
            </div>
            <div style={{ paddingLeft:16, borderLeft:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:14 }}>Trails</div>
              {["Knox Mountain","Bear Creek","Myra Canyon","Kelowna Bike Park"].map(it => (
                <a key={it} href="/trails" style={{ ...subA, fontSize:18, padding:"9px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go("trails")); }}>{it}</a>
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
                { label:"Brands",     route:"brands"  },
              ].map(it => (
                <a key={it.label} href={pageHref(it.route)} style={{ ...subA, fontSize:18, padding:"9px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go(it.route)); }}>{it.label}</a>
              ))}
            </div>
            <div style={{ paddingLeft:16, borderLeft:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:14 }}>Shop</div>
              {[
                { label:"Gift Cards", route:"giftcards" },
                { label:"Sale",       route:"shop"      },
              ].map(it => (
                <a key={it.label} href={pageHref(it.route)} style={{ ...subA, fontSize:18, padding:"9px 0" }} onClick={e => { e.preventDefault(); dismiss(() => window.cl.go(it.route)); }}>{it.label}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
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
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
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
            // Look up available stock from Lightspeed by SKU (caps + button)
            const lsBike  = it.sku ? (window.CL_LS?.bikes || []).find(b => b.sku === it.sku) : null;
            const availQty = lsBike ? (lsBike.qty ?? 999) : 999;
            const atMax    = availQty > 0 && qty >= availQty;
            return (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 14, padding: "16px 0", borderBottom: "1px solid var(--hairline)" }}>
                {it.image
                  ? <img src={it.image} alt={it.name} style={{ width: 72, height: 72, objectFit: "contain", background: "var(--paper)", padding: 4, mixBlendMode: "multiply" }} />
                  : <div className="ph" style={{ width: 72, height: 72 }} />
                }
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 2 }}>
                    <div style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: "-.005em", lineHeight: 1.3 }}>{it.name}</div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
                      <div style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" }}>${lineTotal % 1 === 0 ? lineTotal.toLocaleString() : lineTotal.toFixed(2)}</div>
                      <button onClick={() => window.shopifyCart?.remove(it.variantId)}
                        title="Remove" data-cursor="link"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", fontSize: 14, padding: 0, lineHeight: 1, marginTop: 1 }}>✕</button>
                    </div>
                  </div>
                  {it.variant && <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gray-500)", marginBottom:4 }}>{it.variant}</div>}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
                    {/* Qty stepper */}
                    <div style={{ display:"flex", alignItems:"center", gap:0, border:"1px solid var(--hairline)", background:"var(--paper)" }}>
                      <button onClick={() => window.shopifyCart?.decrementBySku(it.variantId || it.sku)}
                        style={{ width:30, height:28, border:"none", background:"none", cursor:"pointer", fontFamily:"var(--mono)", fontSize:16, color:"var(--black)", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent" }}>−</button>
                      <span style={{ minWidth:24, textAlign:"center", fontFamily:"var(--mono)", fontSize:11, letterSpacing:".06em", color:"var(--black)", userSelect:"none" }}>{qty}</span>
                      <button onClick={() => { if (!atMax) window.shopifyCart?.add(it.variantId, it.name, it.price, it.image, 1, it.variant, it.sku); }}
                        disabled={atMax}
                        title={atMax ? `Max stock: ${availQty}` : undefined}
                        style={{ width:30, height:28, border:"none", background:"none", cursor: atMax ? "default" : "pointer", fontFamily:"var(--mono)", fontSize:16, color:"var(--black)", display:"flex", alignItems:"center", justifyContent:"center", WebkitTapHighlightColor:"transparent", opacity: atMax ? 0.3 : 1 }}>+</button>
                    </div>
                    {qty > 1 && <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--gray-400)", letterSpacing:".1em", textTransform:"uppercase" }}>${(it.price||0) % 1 === 0 ? (it.price||0) : (it.price||0).toFixed(2)} ea</div>}
                    {atMax && <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--gray-400)", letterSpacing:".1em", textTransform:"uppercase" }}>Max stock</div>}
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
      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:40, marginBottom:32 }}>
        <div className="footer-col">
          <div className="nav-logo" style={{ marginBottom: 20 }}>
            <img src="/logo.png" alt="ChainLine Cycle" className="logo-img logo-img-light" />
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--gray-400)", marginBottom: 20, fontFamily:"var(--body)" }}>
            Built for Kelowna. Backed by Canada. Since 2009.
          </div>
          <div style={{ display: "flex", gap: 12, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", flexWrap: "wrap" }}>
            {[
              ["Instagram","https://instagram.com/ChainLineCycle"],
              ["TikTok","https://tiktok.com/@ChainLineCycle"],
              ["Facebook","https://facebook.com/ChainLineCycle"],
              ["YouTube","https://youtube.com/@ChainLine_Cycle"],
              ["Pinkbike","https://www.pinkbike.com/u/ChainLineCycle/buysell/"],
              ["Threads","https://threads.net/@ChainLineCycle"],
            ].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener" className="link-underline" data-cursor="link">{label}</a>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <a href="https://search.google.com/local/writereview?placeid=ChIJbbM4_V7zfVMRmOhSjhXRP9o&source=g.page.m._&laa=merchant-review-solicitation" target="_blank" rel="noopener"
              className="link-underline" data-cursor="link"
              style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)", display:"inline-flex", alignItems:"center", gap:6 }}>
              ★ Rate us on Google
            </a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Visit Us</h4>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--gray-300)" }}>
            <a href="https://maps.google.com/?q=1139+Ellis+St+Kelowna+BC+V1Y+1Z5" target="_blank" rel="noopener" className="link-underline" data-cursor="link">
              1139 Ellis St. · Kelowna, BC V1Y 1Z5
            </a><br/>
            <a href="tel:2508601968" className="link-underline" data-cursor="link">(250) 860-1968</a>
            {" · "}
            <a href="mailto:bikes@chainline.ca" className="link-underline" data-cursor="link">bikes@chainline.ca</a>
          </div>
          <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-300)" }}>
            Mon 10-5 · Tue-Fri 9:30-5:30 · Sat 10-4 · Sun closed
          </div>
        </div>
      </div>
      <div style={{ borderTop:"1px solid var(--hairline)", paddingTop:20, marginBottom:8 }}>
        {[
          ["Bikes", [["All Bikes","shop",null],["Mountain","shop",{type:"Mountain"}],["Gravel","shop",{type:"Gravel"}],["E-Bikes","shop",{type:"E-Bike"}],["Commuter","shop",{type:"Commuter"}],["Kids","shop",{type:"Kids"}],["Classifieds","classifieds",null],["Gift Cards","giftcards",null]]],
          ["Parts", [["Components","components",null],["Drivetrain","components",{tab:"drivetrain"}],["Brakes","components",{tab:"brakes"}],["Wheels","components",{tab:"wheels"}]]],
          ["Accessories", [["Helmets","accessories",{tab:"helmets"}],["Tools","accessories",{tab:"tools"}],["Bags","accessories",{tab:"bags"}]]],
          ["Services", [["Book","book",null],["Fitting","fitting",null],["Builds","services",null],["Demo","demo",null],["Storage","storage",null],["Warranty","warranty",null]]],
          ["Explore", [["Rides","rides",null],["Trails","trails",null],["Events","events",null],["MTBCO","mtbco",null],["About","about",null],["Contact","contact",null]]],
        ].map(([heading, links]) => (
          <div key={heading} style={{ display:"inline-flex", alignItems:"baseline", flexWrap:"wrap", gap:"4px 6px", marginRight:24, marginBottom:10 }}>
            <span style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:".14em", textTransform:"uppercase", color:"var(--gray-400)", marginRight:4 }}>{heading}</span>
            {links.map(([label,route,intent], i) => (
              <React.Fragment key={label}>
                <a href={pageHref(route,intent)} className="link-underline" data-cursor="link" style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--gray-300)" }}
                  onClick={e=>{e.preventDefault();window.cl.go(route,intent);}}>{label}</a>
                {i < links.length-1 && <span style={{ color:"var(--gray-600)" }}>·</span>}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-massive">CHAINLINE</div>
      <hr className="hr-light" style={{ marginBottom: 24 }} />
      <div className="footer-bottom">
        <div>© 2026 ChainLine Cycle Inc.</div>
        <div style={{ display: "flex", gap: 18 }}>
          <span>VISA</span><span>MC</span><span>AMEX</span><span>APPLE PAY</span><span>SHOP PAY</span>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <a href="/privacy" className="link-underline" data-cursor="link" onClick={e=>{e.preventDefault();window.cl.go("privacy");}}>Privacy</a>
          <a href="/terms" className="link-underline" data-cursor="link" onClick={e=>{e.preventDefault();window.cl.go("terms");}}>Terms</a>
          <a href="/contact" className="link-underline" data-cursor="link" onClick={e=>{e.preventDefault();window.cl.go("contact");}}>Accessibility</a>
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

  const chatRight = 16;
  const chatBottom = window.innerWidth <= 768 ? 76 : 24;
  return (
    <>
      <button onClick={() => setOpen(o => !o)} data-cursor="link" className="chat-toggle-btn"
        style={{ position: "fixed", left: 16, bottom: chatBottom, zIndex: 90, width: 52, height: 52, borderRadius: "50%", background: "var(--black)", color: "var(--white)", display: "grid", placeItems: "center", border: "1px solid var(--black)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
        {open
          ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2l12 12M14 2L2 14"/></svg>
          : <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h16v10H8l-4 3v-3H2z"/></svg>
        }
      </button>
      {open && (
        <div className="chat-popup" style={{ position: "fixed", left: 16, bottom: chatBottom + 64, zIndex: 90, width: "min(320px, calc(100vw - 32px))", background: "var(--white)", border: "1px solid var(--hairline)", boxShadow: "0 8px 40px rgba(0,0,0,0.16)", display: "flex", flexDirection: "column", maxHeight: "min(440px, calc(100vh - 200px))" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--black)", color: "var(--white)" }}>
            <div>
              <div style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em" }}>ChainLine Support</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gray-300)", marginTop: 2 }}>Ask us anything · Usually instant</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
              <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.7)", display:"flex", alignItems:"center", padding:4 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l12 12M13 1L1 13"/></svg>
              </button>
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
              <button key={i} onClick={() => { const tab=(window.PART_TABS||[]).find(t=>t.depts.some(d=>d===(p.department||"")));const tabId=tab?.id;const accTabs=['fit','tools','bags','lights','locks','racks'];window.cl.go(accTabs.includes(tabId)?'accessories':'components',{dept:p.department,tab:tabId});onClose(); }} data-cursor="link" style={rowStyle}>
                <div style={{ flex:1 }}>
                  <div className="eyebrow" style={{ marginBottom:3 }}>{p.department}</div>
                  <div style={{ fontFamily:"var(--display)", fontSize:16, fontWeight:500, textTransform:"uppercase", letterSpacing:"-.01em" }}>{p.name}</div>
                </div>
                {p.price > 0 && <div style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:500, flexShrink:0 }}>${p.price.toFixed(2)}</div>}
              </button>
            ))}
            <button onClick={() => { window.cl.go("components"); onClose(); }} data-cursor="link"
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

// ── Bottom Navigation Bar (mobile / PWA) ─────────────────────────────────
const HomeIcon  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/></svg>;
const BikeIcon  = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5"/>
    <circle cx="18.5" cy="17.5" r="3.5"/>
    <path d="M15 6h-3l-2 5.5"/>
    <path d="M5.5 17.5L10 8l3 9.5"/>
    <path d="M10 8h5l1.5 3.5"/>
    <circle cx="15" cy="5" r="1"/>
  </svg>
);
const WrenchIcon= () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
const BagIcon   = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19.4a2 2 0 001.98-1.71l1.62-9.29H6"/>
  </svg>
);

const ShopIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h10M7 12h6"/></svg>;

const BottomNav = ({ page, cartCount, onSearch, onCart }) => {
  const [shopOpen, setShopOpen] = React.useState(false);
  React.useEffect(() => { setShopOpen(false); }, [page]);

  const isPartPage = ['components','accessories','parts'].includes(page);
  const tabs = [
    { id:'home',   label:'Home',   icon:<HomeIcon />,  action:() => window.cl.go('home') },
    { id:'bikes',  label:'Bikes',  icon:<BikeIcon />,  action:() => window.cl.go('shop') },
    { id:'shop',   label:'Shop',   icon:<ShopIcon />,  action:() => setShopOpen(o => !o) },
    { id:'search', label:'Search', icon:<SearchIcon />,action: onSearch },
    { id:'cart',   label:'Cart',   icon:<BagIcon />,   action: onCart, badge: cartCount },
  ];
  const isActive = (id) => {
    if (id === 'home')  return page === 'home';
    if (id === 'bikes') return page === 'shop' || page === 'bike';
    if (id === 'shop')  return isPartPage || shopOpen;
    return false;
  };
  const shopSections = [
    { label:'Components', sub:'Drivetrain · Brakes · Suspension',  route:'components', emoji:'⚙️' },
    { label:'Parts',      sub:'Tires · Tubes · Chains · Lube',     route:'parts',      emoji:'🔩' },
    { label:'Accessories',sub:'Helmets · Shoes · Bags · Lights', route:'accessories',emoji:'⛑️' },
  ];
  return (
    <>
      {shopOpen && <div onClick={() => setShopOpen(false)} style={{ position:'fixed', inset:0, zIndex:195, background:'rgba(0,0,0,0.3)', backdropFilter:'blur(2px)' }} />}
      {shopOpen && (
        <div style={{ position:'fixed', bottom:'calc(56px + env(safe-area-inset-bottom, 0px))', left:0, right:0, zIndex:196, background:'var(--white)', borderTop:'2px solid var(--black)', paddingBottom:4 }}>
          <div style={{ padding:'12px 20px 4px', fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--gray-400)' }}>Shop by section</div>
          {shopSections.map(s => (
            <button key={s.route} onClick={() => { window.cl.go(s.route); setShopOpen(false); }} data-cursor="link"
              style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderTop:'1px solid var(--hairline)', background:'none', border:'none', borderTop:'1px solid var(--hairline)', cursor:'pointer', width:'100%', textAlign:'left', WebkitTapHighlightColor:'transparent' }}>
              <span style={{ fontSize:22, lineHeight:1, flexShrink:0 }}>{s.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--display)', fontSize:17, fontWeight:500, textTransform:'uppercase', letterSpacing:'-.01em', color:'var(--black)' }}>{s.label}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--gray-400)', marginTop:2 }}>{s.sub}</div>
              </div>
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
      )}
      <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
        {tabs.map(t => (
          <button key={t.id} className={"bottom-nav-btn" + (isActive(t.id) ? " active" : "")}
            onClick={t.action} aria-label={t.label} data-cursor="link">
            {t.icon}
            <span className="bottom-nav-lbl">{t.label}</span>
            {t.badge > 0 && <span className="bottom-nav-badge">{t.badge}</span>}
          </button>
        ))}
      </nav>
    </>
  );
};

Object.assign(window, { ChainLogo, Wordmark, Header, MobileNav, MegaMenu, StickyCTA, CartDrawer, Footer, useReveal, SplitText, Counter, BrandMarquee, ArrowRight, SearchIcon, AccountIcon, AccountDropdown, DarkToggle, Announce, ContactBar, ChatWidget, SearchModal, BottomNav });
