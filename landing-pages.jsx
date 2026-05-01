// ChainLine — Landing Pages (stub for diagnostics)
function BrandLandingPage({ brand }) {
  return React.createElement("div", { className: "page-fade" },
    React.createElement("h1", null, brand + " Bikes Kelowna")
  );
}
function TypeLandingPage({ type }) {
  return React.createElement("div", { className: "page-fade" },
    React.createElement("h1", null, type + " Bikes Kelowna")
  );
}
function ServiceLandingPage({ service }) {
  return React.createElement("div", { className: "page-fade" },
    React.createElement("h1", null, "Bike " + service + " Kelowna")
  );
}
