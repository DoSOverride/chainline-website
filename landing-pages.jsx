// ChainLine — Programmatic SEO Landing Pages
// Brand × Kelowna (9), Type × Kelowna (6), Service × Kelowna (4)

const BRAND_DATA = {
  marin: {
    name: "Marin",
    tagline: "Built for the dirt. Proven on Knox.",
    intro: "Marin has been the trail rider's choice since 1986 — aggressive geometry, reliable builds, and a range that covers everything from beginner hardtails to full enduro rigs. ChainLine has carried Marin since 2009. These bikes know Knox Mountain and Bear Creek.",
    localNote: "Marin's trail geometry was made for the kind of varied terrain Kelowna throws at you — flowy singletrack on Bear Creek, technical rock rolls on Knox, steep chutes at Gillard. The range slots in at every skill level and price point.",
    trails: ["Knox Mountain Park", "Bear Creek", "Smith Creek"],
    whyUs: "We've been selling and servicing Marin bikes in Kelowna for 15+ years. Our mechanics have ridden every model in the lineup. When we set up your Marin, we set it up for Knox — not a spec sheet.",
    types: "Trail hardtails, trail full-suspension, enduro",
    accentColor: "#1d4ed8",
  },
  transition: {
    name: "Transition",
    tagline: "Enduro-built. Okanagan-tested.",
    intro: "Transition Bikes from Bellingham, WA builds some of the most rider-loved enduro machines on the planet. Long travel, slack angles, and kinematics that reward commitment. ChainLine is one of BC's select authorized Transition dealers.",
    localNote: "Transition's geometry was engineered for the steep and chunky — exactly what you find at Gillard and the upper lines on Knox. These bikes reward riders who want to go faster down the mountain and aren't afraid of consequence.",
    trails: ["Gillard Trails (MTBCO)", "Smith Creek", "Knox Enduro Lines"],
    whyUs: "We're a select Transition dealer — not every shop gets them. We stock what actually sells in the Okanagan and set up every bike for local conditions. Sag, compression, rebound — dialed at the shop.",
    types: "Enduro and trail full-suspension",
    accentColor: "#dc2626",
  },
  surly: {
    name: "Surly",
    tagline: "Go long. Go anywhere.",
    intro: "Surly makes bikes for the real world — steel frames, generous tire clearance, and a philosophy that prioritizes usefulness over weight savings. Gravel, bikepacking, loaded touring, fat bikes. If you want to ride the Okanagan's gravel network end to end, Surly is purpose-built for it.",
    localNote: "The Okanagan has hundreds of kilometres of gravel and rail trail to explore. Surly bikes eat all of it — big tires, rack mounts for bags, and steel that absorbs the chatter on loose sections.",
    trails: ["Okanagan Rail Trail", "KVR (Kettle Valley Railway)", "Naramata Bench routes"],
    whyUs: "We love Surly bikes because they're honest. No marketing fluff — just bikes that work hard for years. Our mechanics have put serious mileage on these frames and know every detail.",
    types: "Gravel, bikepacking, touring, fat bikes",
    accentColor: "#16a34a",
  },
  pivot: {
    name: "Pivot",
    tagline: "Precision on every trail.",
    intro: "Pivot Cycles builds around the DW-Link suspension system — engineered by Dave Weagle for efficient pedaling and composed, planted descending. Race-proven and trail-refined. ChainLine is an authorized Pivot dealer in Kelowna.",
    localNote: "Pivot's climbing efficiency shines on Knox's long fireroad access sections. Their suspension pedals efficiently uphill and opens fully on descents — a real advantage on Kelowna's up-down terrain where you earn every descent.",
    trails: ["Knox Mountain XC + Trail", "Bear Creek", "Myra Canyon"],
    whyUs: "Pivot bikes require expertise to set up correctly. Our mechanics understand DW-Link kinematics and tune sag and damping specifically for Okanagan conditions. Don't buy a Pivot from a shop that won't set it up properly.",
    types: "XC, trail, enduro full-suspension",
    accentColor: "#7c3aed",
  },
  salsa: {
    name: "Salsa",
    tagline: "Adventure built for the Okanagan.",
    intro: "Salsa Cycles builds bikes for exploring — gravel bikes that devour the Okanagan rail trails, fat bikes for winter, and bikepacking rigs designed for every bag you own. If your ride takes you somewhere remote, Salsa gets you there.",
    localNote: "The Okanagan is bikepacking country — desert terrain, long gravel routes, and lake views for days. Salsa's bikepacking-specific designs fit purpose-built bags in every spot, so your gear rides well and doesn't rattle loose on gravel.",
    trails: ["Trans Canada Trail", "Okanagan Rail Trail", "Naramata gravel routes"],
    whyUs: "We'll spec your Salsa for your actual routes — which bags work where, what tire width to run on the KVR, how to set up for multi-day loads. We've done these rides ourselves.",
    types: "Gravel, bikepacking, adventure, fat bikes",
    accentColor: "#ea580c",
  },
  bianchi: {
    name: "Bianchi",
    tagline: "Italian heritage. Kelowna roads.",
    intro: "Bianchi has been building bikes since 1885 — the oldest bicycle brand in the world, still making some of the most capable and beautiful road bikes available. Their iconic celeste finish is as recognizable as their quality.",
    localNote: "The Okanagan road network is world-class riding territory — rolling past vineyards, climbing into the highlands, descending to the lake. Bianchi's road and endurance geometry handles long days with serious elevation.",
    trails: ["Kelowna orchard circuit", "Crawford area climbs", "Okanagan Valley road routes"],
    whyUs: "Italian bikes deserve careful setup. We do a proper fitting with every Bianchi sale — bar height, saddle position, cleat alignment. A Bianchi should feel like it was built for your body, because we make sure it rides that way.",
    types: "Road, endurance road, gravel",
    accentColor: "#0891b2",
  },
  moots: {
    name: "Moots",
    tagline: "Titanium. Lifetime quality.",
    intro: "Moots builds titanium bikes by hand in Steamboat Springs, Colorado. Every frame is hand-TIG welded, inspected, and backed by a lifetime warranty. A Moots is a once-in-a-lifetime purchase — made to outlast every trend.",
    localNote: "Titanium has a unique ride quality — springy, durable, and smooth on rough pavement and gravel. A Moots gravel bike on the Kelowna Rail Trail is in its element. These bikes ride better as the miles accumulate.",
    trails: ["Kelowna road network", "Okanagan gravel routes", "Multi-day bikepacking"],
    whyUs: "ChainLine is one of the very few dealers in British Columbia that carries Moots. We stock them because our customers ask for quality that lasts. If you're investing in a Moots, buy it from a shop that understands the build.",
    types: "Titanium road, gravel, mountain",
    accentColor: "#b45309",
  },
  knolly: {
    name: "Knolly",
    tagline: "BC-built. Knox-ready.",
    intro: "Knolly Bikes is from Vancouver Island — a Canadian brand built for steep, chunky, technical BC terrain. Long travel, aggressive geometry, and kinematics designed for the rowdy trails that Kelowna's enduro scene demands.",
    localNote: "Knolly frames were designed on Vancouver Island trails that share DNA with Kelowna's steeper lines. Long-travel geometry makes big moves feel controlled and rough sections feel planted. This is a serious machine.",
    trails: ["Gillard Trails (MTBCO)", "Knox Enduro", "Smith Creek"],
    whyUs: "Not many shops in the Interior carry Knolly. We do because we believe in the brand and because Kelowna's enduro scene deserves access to Canadian-built bikes. We'll set up your Knolly for local trails specifically.",
    types: "Enduro, trail full-suspension",
    accentColor: "#15803d",
  },
  revel: {
    name: "Revel",
    tagline: "CBF suspension. Serious traction.",
    intro: "Revel Bikes from Carbondale, Colorado builds around their patented CBF (Canfield Balance Formula) suspension linkage — a kinematic system designed to maximize traction and pedaling efficiency simultaneously. Newer brand, serious engineering.",
    localNote: "Revel's CBF suspension excels on loose-over-hard terrain — exactly what Kelowna's summer-dry trails deliver. The traction advantage is real and noticeable on Knox and Gillard when the dirt gets sketchy.",
    trails: ["Knox Mountain", "Gillard Trails", "Smith Creek"],
    whyUs: "Revel is a small brand doing things right. We carry them because the engineering is genuinely different and quality is excellent. We'll walk you through CBF kinematics so you understand what you're buying.",
    types: "Trail and enduro full-suspension",
    accentColor: "#7c3aed",
  },
};

const TYPE_DATA = {
  mountain: {
    name: "Mountain Bikes",
    slug: "mountain",
    tagline: "Kelowna's mountain biking starts here.",
    intro: "Kelowna has some of Canada's best mountain biking — Knox Mountain, Bear Creek, Smith Creek, and MTBCO's Gillard Trails are all within minutes of the city. The right mountain bike makes every one of those trails better.",
    localContext: "Knox Mountain alone has 30+ km spanning beginner-friendly flow to technical enduro lines. Bear Creek is rolling and accessible. Gillard and Smith Creek are for riders looking for proper challenge. We'll match your bike to where you actually ride.",
    buyingGuide: [
      { q: "Hardtail or full-suspension?", a: "Hardtail for beginners, tight budgets, and XC riding. Full-suspension for trail and enduro once you're hitting the technical stuff regularly. Most Kelowna riders end up wanting full-sus." },
      { q: "How much travel do I need?", a: "100–120mm for XC and smooth trail. 130–150mm covers most Kelowna trail riding well. 160mm+ for enduro and the rowdy stuff at Gillard and Smith Creek." },
      { q: "27.5\" or 29\" wheels?", a: "29\" rolls faster and smooths out rough terrain — most trail riders prefer it now. 27.5\" suits shorter riders or riders who want more agility and snap." },
    ],
    intentType: "Mountain",
  },
  gravel: {
    name: "Gravel Bikes",
    slug: "gravel",
    tagline: "Kelowna gravel is some of BC's best.",
    intro: "The Okanagan has hundreds of kilometres of gravel — the Rail Trail, orchard roads, the Naramata Bench, and routes heading into the Highland. Gravel bikes let you access all of it without giving up road speed.",
    localContext: "The KVR (Kettle Valley Railway) route alone stretches 600km across the Okanagan. The Naramata Bench winds through vineyard country on loose gravel with lake views. The Rail Trail connects communities from Kelowna to Coldstream. This is gravel riding that justifies the bike.",
    buyingGuide: [
      { q: "How wide should my tires be?", a: "700×38–45mm covers most Okanagan gravel well. Go wider (47–50mm) if you're doing multi-day bikepacking or hitting loose, rougher sections of the KVR." },
      { q: "Drop bars or flat bars?", a: "Drop bars give more hand positions for long days and are faster on pavement. Flat bars suit riders coming from mountain bikes who want a familiar feel." },
      { q: "Do I need bikepacking mounts?", a: "If you're doing multi-day routes like the KVR, yes — every mount matters. If you're day riding the Rail Trail, standard bottle cages are fine." },
    ],
    intentType: "Gravel",
  },
  road: {
    name: "Road Bikes",
    slug: "road",
    tagline: "Kelowna's roads reward the right bike.",
    intro: "The Okanagan Valley has exceptional road cycling — rolling orchard circuits, real climbs up to the highlands, and the lakeshore highway south toward Penticton. A performance road bike makes every kilometre better.",
    localContext: "The classic Kelowna road ride climbs Dilworth or Crawford and drops back through the orchards. Longer days take you south toward Naramata or north to Vernon on roads that reward speed and efficiency. The Okanagan is genuinely beautiful road cycling territory.",
    buyingGuide: [
      { q: "Carbon or aluminum?", a: "Carbon is lighter and more compliant for long days — worth it for serious riders. Aluminum is more durable and better value for those newer to road riding." },
      { q: "Endurance or race geometry?", a: "Endurance geometry (more upright) is better for most riders and most long days. Race geometry suits experienced riders chasing maximum speed and performance." },
      { q: "Rim or disc brakes?", a: "Disc brakes are now standard — superior control in wet conditions and on descents. Almost every new road bike ships with disc. Go disc." },
    ],
    intentType: "Road",
  },
  "e-bike": {
    name: "E-Bikes",
    slug: "e-bike",
    tagline: "Kelowna's hills just got easier.",
    intro: "Kelowna is hilly — that's what makes the riding spectacular and what makes e-bikes make sense here. Whether you want to extend your range, tackle climbs you'd normally skip, or just keep pace with faster riders, e-bikes open up the Okanagan.",
    localContext: "Knox Mountain's access climbs are genuinely punishing on a regular bike. With an e-MTB, you spend more time on trails and less recovering from the grind up. The Okanagan Rail Trail becomes a full-day adventure. E-bikes change what's possible for a lot of riders.",
    buyingGuide: [
      { q: "Mid-drive or hub motor?", a: "Mid-drive (Bosch, Shimano, Brose) is better for mountain biking and performance riding — better weight distribution and trail feel. Hub motors are simpler and lower cost for casual use." },
      { q: "How much range do I need?", a: "Most Kelowna riders need 40–70km of range. Trail e-bikes draw more power than road e-bikes on climbs, so check actual range numbers for your type of riding." },
      { q: "What about trail access rules?", a: "Class 1 (pedal assist to 32km/h) is allowed on most Kelowna trails. Check trail-specific rules before buying — Knox and Gillard have their own policies." },
    ],
    intentType: "E-Bike",
  },
  commuter: {
    name: "Commuter Bikes",
    slug: "commuter",
    tagline: "Get across Kelowna. Every day.",
    intro: "Kelowna's growing bike lane network and the Mission Creek Greenway make cycling a genuinely practical choice for getting around the city. A proper commuter bike — built for reliability, daily use, and weather — means you'll actually ride it.",
    localContext: "The Mission Creek Greenway gives you a car-free route through the city. Downtown Kelowna has solid bike infrastructure connecting the waterfront, KGH, and the university. A commuter bike with fenders, a rack, and a solid lock is all you need to cut the car trips.",
    buyingGuide: [
      { q: "Do I need fenders and a rack?", a: "Yes if you're commuting year-round. Kelowna gets wet in spring — fenders keep your clothes clean. A rear rack means you're not sweating through a backpack every day." },
      { q: "Flat bar or drop bar?", a: "Flat bar is more upright and better for city riding with frequent stops. Drop bar commuters are faster but more aggressive — suited to longer commutes." },
      { q: "How much should I spend?", a: "Budget $700–$1,200 for a quality commuter that won't fail on you in year two. Department store bikes cost you more in repairs and frustration." },
    ],
    intentType: "Commuter",
  },
  kids: {
    name: "Kids Bikes",
    slug: "kids",
    tagline: "Their first real bike. Get it right.",
    intro: "Kids who start on well-fitted, quality bikes learn faster, gain confidence sooner, and stay more motivated to ride. ChainLine carries kids bikes built for actual riding — not department store bikes that discourage progression.",
    localContext: "Kelowna is a great city to grow up riding in. The Mission Creek Greenway, Knox Mountain's beginner trails, and the Rail Trail give kids safe, exciting places to ride from an early age. The right bike from the start makes a real difference in whether they stick with it.",
    buyingGuide: [
      { q: "Should I buy a size up to grow into?", a: "No. Proper fit is far more important than room to grow. An oversized bike is harder to control and kills confidence. Fit now, upgrade when they grow — it's worth it." },
      { q: "How do I know what size to buy?", a: "Bring your child in. We'll measure inseam and reach and have them test ride options. Sizing charts are a starting point, not a final answer." },
      { q: "Why not a department store bike?", a: "Heavy frames, undersized brakes kids can't actually squeeze, and components that fall apart. Kids on bad bikes are less safe and less motivated to ride. Quality matters more for kids, not less." },
    ],
    intentType: "Kids",
  },
};

const SERVICE_DATA = {
  "tune-up": {
    title: "Bike Tune-Up",
    tagline: "Your bike, properly dialed.",
    intro: "After a season on Knox or a winter in storage, your bike deserves more than a quick wipe-down. ChainLine's mechanics do thorough, honest tune-ups — we check everything that actually matters to your safety and ride feel.",
    whatsIncluded: [
      "Full drivetrain clean and lube (chain, cassette, chainring, jockey wheels)",
      "Front and rear derailleur adjustment and limit screw check",
      "Brake adjustment, pad inspection and alignment",
      "Cable tension check and housing inspection",
      "Bearing check — headset, bottom bracket, wheel hubs",
      "Wheel true check and spoke tension",
      "Full safety inspection before return",
    ],
    price: "From $75",
    turnaround: "Same-day available",
    bookPage: "book",
    metaDesc: "Expert bike tune-up in Kelowna at ChainLine Cycle. Full drivetrain service, brake adjustment, bearing check. From $75. Same-day turnaround available.",
  },
  "fitting": {
    title: "Professional Bike Fitting",
    tagline: "Dial your position. Ride better.",
    intro: "A bike that doesn't fit you is slower, less comfortable, and more likely to cause injury. ChainLine's professional bike fitting uses video analysis and measurement to find your optimal position — whether you're a weekend rider or training for events.",
    whatsIncluded: [
      "Full body measurement and flexibility assessment",
      "Video analysis of your pedaling motion",
      "Saddle height and fore-aft positioning",
      "Cleat alignment and float setup (clipless systems)",
      "Bar height, reach and stack adjustment",
      "Written position report to keep for reference",
    ],
    price: "From $80",
    turnaround: "90-minute appointment",
    bookPage: "fitting",
    metaDesc: "Professional bike fitting in Kelowna at ChainLine Cycle. Video analysis, full position setup. Road, mountain, gravel. From $80. Book online.",
  },
  "storage": {
    title: "Bike Storage",
    tagline: "We keep it safe. You get it back ready.",
    intro: "Kelowna winters mean many bikes sit unused for months. Storing a bike properly — clean, dry, and protected — makes a real difference come spring. ChainLine's secure storage service handles everything, and your bike comes back tuned and ready.",
    whatsIncluded: [
      "Secure, climate-controlled storage facility",
      "Bike tagged and catalogued on intake",
      "Spring tune-up included with every return",
      "Season coverage from fall drop-off to spring return",
      "Optional pickup service available",
    ],
    price: "From $180/season",
    turnaround: "Drop off anytime in fall",
    bookPage: "storage",
    metaDesc: "Secure bike storage in Kelowna at ChainLine Cycle. Climate-controlled facility, spring tune-up included. From $180/season. Drop off in fall, pick up ride-ready in spring.",
  },
  "demo": {
    title: "Bike Demo",
    tagline: "Ride it before you buy it.",
    intro: "Buying a bike without riding it is a guess. ChainLine maintains a demo fleet so you can test bikes on actual Kelowna trails before committing. Demo fees apply toward your purchase.",
    whatsIncluded: [
      "Demo fleet of mountain, gravel and trail bikes",
      "Full setup and safety check before your ride",
      "Trail recommendations matched to your demo bike",
      "Demo fee credited toward purchase",
      "Helmet loan available if needed",
    ],
    price: "Ask in store",
    turnaround: "Half-day and full-day options",
    bookPage: "demo",
    metaDesc: "Demo bikes in Kelowna at ChainLine Cycle. Test mountain, gravel and trail bikes on real Kelowna trails before you buy. Demo fee credited toward purchase.",
  },
};

// ── Brand Landing Page ──────────────────────────────────────────
function BrandLandingPage({ brand }) {
  const data = BRAND_DATA[brand];
  if (!data) return null;

  const bikes = (window.SHOP_BIKES || []).filter(b =>
    (b.brand || "").toLowerCase() === brand ||
    (b.handle || "").startsWith(brand + "-")
  );

  return (
    <div className="page-fade">
      {/* Hero */}
      <section style={{ background: "#0a0a0a", minHeight: "65vh", display: "flex", alignItems: "flex-end", padding: "140px 0 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${data.accentColor}18 0%, transparent 55%)` }} />
        <div className="container-wide" style={{ position: "relative", zIndex: 1 }}>
          <div className="section-label" style={{ color: "var(--gray-500)", marginBottom: 20 }}>Authorized Dealer · Kelowna, BC</div>
          <h1 className="display-2xl" style={{ color: "#fafafa", marginBottom: 20 }}>
            {data.name} Bikes<br />
            <span className="serif-italic" style={{ color: "var(--gray-400)" }}>in Kelowna.</span>
          </h1>
          <p style={{ color: "var(--gray-400)", fontSize: "clamp(16px,1.8vw,20px)", maxWidth: 540, lineHeight: 1.65, marginBottom: 48 }}>{data.tagline}</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => window.cl.go("shop", { brand: data.name })}>Shop {data.name}</button>
            <button className="btn btn-ghost-white" onClick={() => window.cl.go("book")}>Book a Service</button>
          </div>
        </div>
      </section>

      {/* About + Why ChainLine */}
      <section className="section bg-white">
        <div className="container-wide">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            <div className="reveal">
              <div className="section-label" style={{ marginBottom: 20 }}>About {data.name}</div>
              <p style={{ fontSize: "clamp(16px,1.6vw,19px)", lineHeight: 1.75, color: "var(--gray-700)", marginBottom: 24 }}>{data.intro}</p>
              <p style={{ color: "var(--gray-500)", lineHeight: 1.7 }}>{data.localNote}</p>
              <div style={{ marginTop: 32, display: "flex", gap: 10, flexWrap: "wrap" }}>
                {data.trails.map(t => (
                  <span key={t} style={{ padding: "6px 14px", background: "var(--gray-100)", borderRadius: 2, fontSize: 12, fontFamily: "var(--mono)", color: "var(--gray-600)", letterSpacing: ".06em" }}>{t}</span>
                ))}
              </div>
            </div>
            <div className="reveal reveal-d-2" style={{ background: "var(--paper)", padding: 40 }}>
              <div className="section-label" style={{ marginBottom: 20 }}>Why ChainLine</div>
              <p style={{ color: "var(--gray-600)", lineHeight: 1.75, marginBottom: 32, fontSize: 16 }}>{data.whyUs}</p>
              <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 28 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray-400)", marginBottom: 12 }}>Bikes We Carry</div>
                <div style={{ color: "var(--gray-700)", fontSize: 15 }}>{data.types}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* In-stock bikes */}
      {bikes.length > 0 && (
        <section className="section" style={{ background: "var(--paper)" }}>
          <div className="container-wide">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, flexWrap: "wrap", gap: 20 }}>
              <div>
                <div className="section-label" style={{ marginBottom: 12 }}>In Stock Now</div>
                <h2 className="display-l">Current {data.name} Selection</h2>
              </div>
              <button className="btn btn-secondary" onClick={() => window.cl.go("shop", { brand: data.name })}>View All {data.name}</button>
            </div>
            <div className="bike-grid">
              {bikes.slice(0, 6).map(b => (
                <div key={b.handle} className="bike-card reveal" onClick={() => window.cl.go("bike", { bike: b })} style={{ cursor: "pointer" }}>
                  <div style={{ aspectRatio: "1", background: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, overflow: "hidden" }}>
                    {b.images?.[0]
                      ? <img src={b.images[0]} alt={`${data.name} ${b.name} — available at ChainLine Cycle in Kelowna`} loading="lazy" decoding="async" className="bike-img" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "8%" }} onError={e => e.target.style.display = "none"} />
                      : <div className="ph ph-corners" style={{ width: "100%", height: "100%" }} />}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--gray-500)", marginBottom: 6, letterSpacing: ".06em" }}>{data.name}</div>
                  <div style={{ fontFamily: "var(--display)", fontSize: "clamp(15px,1.4vw,18px)", fontWeight: 600, marginBottom: 8 }}>{b.name}</div>
                  {b.price && <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--gray-600)" }}>${Number(b.price).toLocaleString()}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trails section */}
      <section className="section bg-black">
        <div className="container-wide" style={{ textAlign: "center" }}>
          <div className="section-label" style={{ color: "var(--gray-500)", marginBottom: 20 }}>Where You'll Ride</div>
          <h2 className="display-l" style={{ color: "#fafafa", marginBottom: 20 }}>
            {data.name} on Kelowna's Trails
          </h2>
          <p style={{ color: "var(--gray-400)", maxWidth: 580, margin: "0 auto 48px", lineHeight: 1.7, fontSize: "clamp(15px,1.6vw,18px)" }}>{data.localNote}</p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {data.trails.map(t => (
              <div key={t} onClick={() => window.cl.go("trails")} style={{ padding: "14px 24px", border: "1px solid var(--gray-700)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: 12, color: "var(--gray-400)", letterSpacing: ".08em", transition: "border-color .2s, color .2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gray-400)"; e.currentTarget.style.color = "#fafafa"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--gray-700)"; e.currentTarget.style.color = "var(--gray-400)"; }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service CTA */}
      <section className="section bg-white">
        <div className="container-wide" style={{ textAlign: "center" }}>
          <div className="section-label" style={{ marginBottom: 20 }}>Expert Service</div>
          <h2 className="display-l" style={{ marginBottom: 20 }}>We Service Every {data.name} We Sell</h2>
          <p style={{ color: "var(--gray-600)", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7, fontSize: 17 }}>
            ChainLine mechanics are authorized to perform warranty service on {data.name} bikes. Tune-ups, suspension rebuilds, warranty claims — handled in-house in Kelowna.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => window.cl.go("book")}>Book a Service</button>
            <button className="btn btn-secondary" onClick={() => window.cl.go("contact")}>Ask a Question</button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Type Landing Page ──────────────────────────────────────────
function TypeLandingPage({ type }) {
  const data = TYPE_DATA[type];
  if (!data) return null;

  const typeLabel = data.intentType;
  const bikes = (window.SHOP_BIKES || []).filter(b => {
    const t = (b.type || b.category || "").toLowerCase().replace(/\s+/g, "-");
    return t === type || t === typeLabel.toLowerCase() || (type === "e-bike" && (t.includes("e-bike") || t.includes("electric")));
  });

  return (
    <div className="page-fade">
      {/* Hero */}
      <section style={{ background: "#0a0a0a", minHeight: "65vh", display: "flex", alignItems: "flex-end", padding: "140px 0 80px", position: "relative" }}>
        <div className="container-wide" style={{ position: "relative", zIndex: 1 }}>
          <div className="section-label" style={{ color: "var(--gray-500)", marginBottom: 20 }}>ChainLine Cycle · Kelowna, BC</div>
          <h1 className="display-2xl" style={{ color: "#fafafa", marginBottom: 20 }}>
            {typeLabel} Bikes<br />
            <span className="serif-italic" style={{ color: "var(--gray-400)" }}>in Kelowna.</span>
          </h1>
          <p style={{ color: "var(--gray-400)", fontSize: "clamp(16px,1.8vw,20px)", maxWidth: 540, lineHeight: 1.65, marginBottom: 48 }}>{data.tagline}</p>
          <button className="btn btn-primary" onClick={() => window.cl.go("shop", { type: typeLabel })}>Shop {typeLabel} Bikes</button>
        </div>
      </section>

      {/* Local context + buying guide */}
      <section className="section bg-white">
        <div className="container-wide">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            <div className="reveal">
              <div className="section-label" style={{ marginBottom: 20 }}>{typeLabel} Riding in Kelowna</div>
              <p style={{ fontSize: "clamp(16px,1.6vw,19px)", lineHeight: 1.75, color: "var(--gray-700)", marginBottom: 24 }}>{data.intro}</p>
              <p style={{ color: "var(--gray-500)", lineHeight: 1.7 }}>{data.localContext}</p>
            </div>
            <div className="reveal reveal-d-2">
              <div className="section-label" style={{ marginBottom: 24 }}>Buying Guide</div>
              {data.buyingGuide.map((item, i) => (
                <div key={i} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: i < data.buyingGuide.length - 1 ? "1px solid var(--hairline)" : "none" }}>
                  <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 16 }}>{item.q}</div>
                  <div style={{ color: "var(--gray-600)", lineHeight: 1.65, fontSize: 15 }}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bikes in stock */}
      {bikes.length > 0 && (
        <section className="section" style={{ background: "var(--paper)" }}>
          <div className="container-wide">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, flexWrap: "wrap", gap: 20 }}>
              <div>
                <div className="section-label" style={{ marginBottom: 12 }}>In Stock Now</div>
                <h2 className="display-l">{typeLabel} Bikes at ChainLine</h2>
              </div>
              <button className="btn btn-secondary" onClick={() => window.cl.go("shop", { type: typeLabel })}>View All</button>
            </div>
            <div className="bike-grid">
              {bikes.slice(0, 6).map(b => (
                <div key={b.handle} className="bike-card reveal" onClick={() => window.cl.go("bike", { bike: b })} style={{ cursor: "pointer" }}>
                  <div style={{ aspectRatio: "1", background: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, overflow: "hidden" }}>
                    {b.images?.[0]
                      ? <img src={b.images[0]} alt={`${b.name} ${typeLabel} bike — ChainLine Cycle Kelowna`} loading="lazy" decoding="async" className="bike-img" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "8%" }} onError={e => e.target.style.display = "none"} />
                      : <div className="ph ph-corners" style={{ width: "100%", height: "100%" }} />}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--gray-500)", marginBottom: 6 }}>{b.brand}</div>
                  <div style={{ fontFamily: "var(--display)", fontSize: "clamp(15px,1.4vw,18px)", fontWeight: 600, marginBottom: 8 }}>{b.name}</div>
                  {b.price && <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--gray-600)" }}>${Number(b.price).toLocaleString()}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Expert help CTA */}
      <section className="section bg-black">
        <div className="container-wide" style={{ textAlign: "center" }}>
          <div className="section-label" style={{ color: "var(--gray-500)", marginBottom: 20 }}>Expert Advice</div>
          <h2 className="display-l" style={{ color: "#fafafa", marginBottom: 20 }}>Not Sure Which One's Right?</h2>
          <p style={{ color: "var(--gray-400)", maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.7, fontSize: "clamp(15px,1.6vw,18px)" }}>
            Come into ChainLine at 1139 Ellis St. We'll talk through your trails, your fitness, and your budget — then put you on the right bike. Not the most expensive one.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => window.cl.go("contact")}>Ask Us</button>
            <button className="btn btn-ghost-white" onClick={() => window.cl.go("fitting")}>Get a Bike Fit</button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Service Landing Page ──────────────────────────────────────────
function ServiceLandingPage({ service }) {
  const data = SERVICE_DATA[service];
  if (!data) return null;

  return (
    <div className="page-fade">
      {/* Hero */}
      <section style={{ background: "#0a0a0a", minHeight: "58vh", display: "flex", alignItems: "flex-end", padding: "140px 0 80px", position: "relative" }}>
        <div className="container-wide" style={{ position: "relative", zIndex: 1 }}>
          <div className="section-label" style={{ color: "var(--gray-500)", marginBottom: 20 }}>ChainLine Cycle · 1139 Ellis St, Kelowna</div>
          <h1 className="display-2xl" style={{ color: "#fafafa", marginBottom: 20 }}>
            {data.title}<br />
            <span className="serif-italic" style={{ color: "var(--gray-400)" }}>in Kelowna.</span>
          </h1>
          <p style={{ color: "var(--gray-400)", fontSize: "clamp(16px,1.8vw,20px)", maxWidth: 500, lineHeight: 1.65, marginBottom: 48 }}>{data.tagline}</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => window.cl.go(data.bookPage)}>
              {data.bookPage === "book" ? "Book a Service" : "Learn More"}
            </button>
            <button className="btn btn-ghost-white" onClick={() => window.cl.go("contact")}>Call (250) 860-1968</button>
          </div>
        </div>
      </section>

      {/* About + what's included */}
      <section className="section bg-white">
        <div className="container-wide">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            <div className="reveal">
              <div className="section-label" style={{ marginBottom: 20 }}>What We Do</div>
              <p style={{ fontSize: "clamp(16px,1.6vw,19px)", lineHeight: 1.75, color: "var(--gray-700)", marginBottom: 40 }}>{data.intro}</p>
              <div style={{ display: "flex", gap: 48 }}>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--gray-400)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 }}>Price</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{data.price}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--gray-400)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 }}>Turnaround</div>
                  <div style={{ fontSize: 18, fontWeight: 500 }}>{data.turnaround}</div>
                </div>
              </div>
            </div>
            <div className="reveal reveal-d-2" style={{ background: "var(--paper)", padding: 40 }}>
              <div className="section-label" style={{ marginBottom: 20 }}>What's Included</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {data.whatsIncluded.map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18, color: "var(--gray-700)", lineHeight: 1.55, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, flexShrink: 0, marginTop: 1, color: "var(--black)" }}>→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Book CTA */}
      <section className="section bg-black">
        <div className="container-wide" style={{ textAlign: "center" }}>
          <h2 className="display-l" style={{ color: "#fafafa", marginBottom: 20 }}>Book at ChainLine</h2>
          <p style={{ color: "var(--gray-400)", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.7 }}>
            1139 Ellis St, Kelowna · (250) 860-1968 · bikes@chainline.ca<br />
            Mon 10–5 · Tue–Fri 9:30–5:30 · Sat 10–4
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => window.cl.go(data.bookPage)}>Book Now</button>
            <button className="btn btn-ghost-white" onClick={() => window.cl.go("services")}>All Services</button>
          </div>
        </div>
      </section>
    </div>
  );
}
