// ChainLine — Landing Pages (diagnostic stub v2)
window._lp_loaded = true;
function BrandLandingPage({ brand }) {
  return React.createElement("div", { className: "page-fade" },
    React.createElement("section", { style: { background: "#0a0a0a", minHeight: "60vh", display: "flex", alignItems: "center", padding: "140px 0 80px" } },
      React.createElement("div", { className: "container-wide" },
        React.createElement("h1", { className: "display-2xl", style: { color: "#fafafa" } }, brand + " Bikes in Kelowna"),
        React.createElement("p", { style: { color: "var(--gray-400)", marginTop: 20 } }, "Authorized dealer at ChainLine Cycle — 1139 Ellis St, Kelowna BC.")
      )
    )
  );
}
function TypeLandingPage({ type }) {
  return React.createElement("div", { className: "page-fade" },
    React.createElement("section", { style: { background: "#0a0a0a", minHeight: "60vh", display: "flex", alignItems: "center", padding: "140px 0 80px" } },
      React.createElement("div", { className: "container-wide" },
        React.createElement("h1", { className: "display-2xl", style: { color: "#fafafa" } }, type + " Bikes in Kelowna"),
        React.createElement("p", { style: { color: "var(--gray-400)", marginTop: 20 } }, "In-stock selection at ChainLine Cycle — 1139 Ellis St, Kelowna BC.")
      )
    )
  );
}
function ServiceLandingPage({ service }) {
  return React.createElement("div", { className: "page-fade" },
    React.createElement("section", { style: { background: "#0a0a0a", minHeight: "60vh", display: "flex", alignItems: "center", padding: "140px 0 80px" } },
      React.createElement("div", { className: "container-wide" },
        React.createElement("h1", { className: "display-2xl", style: { color: "#fafafa" } }, "Bike " + service + " in Kelowna"),
        React.createElement("p", { style: { color: "var(--gray-400)", marginTop: 20 } }, "Book at ChainLine Cycle — 1139 Ellis St, Kelowna BC. (250) 860-1968.")
      )
    )
  );
}
