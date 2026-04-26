// ChainLine Cycle — Shopify Storefront API Integration
window.CL_SHOP = {
  domain: '4nie4h-ek.myshopify.com',
  token:  'a4fb17bce30d6a5f66dc779130b48843',
  api:    '2024-01',
};

// Core fetch
async function shopFetch(query, variables = {}) {
  const { domain, token, api } = window.CL_SHOP;
  const res = await fetch(`https://${domain}/api/${api}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) { console.error('Shopify error:', json.errors); throw new Error(json.errors[0].message); }
  return json.data;
}

// ── Products ──────────────────────────────────────────────────
window.shopifyGetProducts = async function({ first = 50, query = '' } = {}) {
  const data = await shopFetch(`
    query GetProducts($first: Int!, $query: String) {
      products(first: $first, query: $query) {
        edges {
          node {
            id title handle vendor tags
            priceRange { minVariantPrice { amount currencyCode } }
            compareAtPriceRange { minVariantPrice { amount currencyCode } }
            images(first: 1) { edges { node { url altText } } }
            variants(first: 1) {
              edges { node { id availableForSale } }
            }
          }
        }
      }
    }
  `, { first, query });

  return data.products.edges.map(({ node: p }) => ({
    id:           p.id,
    title:        p.title,
    handle:       p.handle,
    vendor:       p.vendor,
    tags:         p.tags,
    price:        parseFloat(p.priceRange.minVariantPrice.amount),
    compareAt:    p.compareAtPriceRange?.minVariantPrice?.amount
                    ? parseFloat(p.compareAtPriceRange.minVariantPrice.amount) : null,
    currency:     p.priceRange.minVariantPrice.currencyCode,
    image:        p.images.edges[0]?.node.url || null,
    variantId:    p.variants.edges[0]?.node.id || null,
    available:    p.variants.edges[0]?.node.availableForSale || false,
  }));
};

// ── Cart ──────────────────────────────────────────────────────
window.shopifyCart = {
  _id: localStorage.getItem('cl-cart-id') || null,
  _url: null,

  _lineFragment: `
    id checkoutUrl totalQuantity
    cost { totalAmount { amount currencyCode } }
    lines(first: 30) {
      edges { node {
        id quantity
        cost { totalAmount { amount currencyCode } }
        merchandise { ... on ProductVariant {
          id title
          product { title vendor }
          priceV2 { amount currencyCode }
          image { url altText }
        }}
      }}
    }
  `,

  _normalize(cart) {
    if (!cart) return null;
    this._id  = cart.id;
    this._url = cart.checkoutUrl;
    localStorage.setItem('cl-cart-id', cart.id);
    return {
      id:       cart.id,
      url:      cart.checkoutUrl,
      count:    cart.totalQuantity,
      total:    parseFloat(cart.cost.totalAmount.amount),
      currency: cart.cost.totalAmount.currencyCode,
      lines:    cart.lines.edges.map(({ node: l }) => ({
        lineId:   l.id,
        qty:      l.quantity,
        total:    parseFloat(l.cost.totalAmount.amount),
        variantId: l.merchandise.id,
        variant:  l.merchandise.title,
        name:     l.merchandise.product.title,
        vendor:   l.merchandise.product.vendor,
        price:    parseFloat(l.merchandise.priceV2.amount),
        image:    l.merchandise.image?.url || null,
      })),
    };
  },

  async get() {
    if (!this._id) return null;
    try {
      const data = await shopFetch(`query GetCart($id: ID!) { cart(id: $id) { ${this._lineFragment} } }`, { id: this._id });
      return this._normalize(data.cart);
    } catch { this._id = null; localStorage.removeItem('cl-cart-id'); return null; }
  },

  async add(variantId, quantity = 1) {
    if (!this._id) {
      const data = await shopFetch(`
        mutation CartCreate($input: CartInput!) {
          cartCreate(input: $input) { cart { ${this._lineFragment} } userErrors { field message } }
        }
      `, { input: { lines: [{ merchandiseId: variantId, quantity }] } });
      return this._normalize(data.cartCreate.cart);
    }
    const data = await shopFetch(`
      mutation CartAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${this._lineFragment} } userErrors { field message } }
      }
    `, { cartId: this._id, lines: [{ merchandiseId: variantId, quantity }] });
    return this._normalize(data.cartLinesAdd.cart);
  },

  async remove(lineId) {
    const data = await shopFetch(`
      mutation CartRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${this._lineFragment} } }
      }
    `, { cartId: this._id, lineIds: [lineId] });
    return this._normalize(data.cartLinesRemove.cart);
  },

  checkout() {
    if (this._url) window.location.href = this._url;
  },
};

// ── Init: pre-load Shopify products and merge with existing catalog ──
window.shopifyReady = (async () => {
  try {
    const products = await window.shopifyGetProducts({ first: 100 });
    window.CL_SHOP.products = products;

    // Build a handle→variantId lookup for "Add to Cart"
    window.CL_SHOP.variantMap = {};
    products.forEach(p => {
      window.CL_SHOP.variantMap[p.handle] = p.variantId;
      // also match by lowercased title
      window.CL_SHOP.variantMap[p.title.toLowerCase()] = p.variantId;
    });

    // Restore existing cart
    const cart = await window.shopifyCart.get();
    if (cart) {
      window.CL_SHOP.cartCount = cart.count;
      document.querySelectorAll('.cart-count span').forEach(el => { el.textContent = cart.count; });
    }

    console.log(`[ChainLine] Shopify connected — ${products.length} products loaded.`);
    window.dispatchEvent(new CustomEvent('shopify:ready', { detail: { products } }));
  } catch (err) {
    console.warn('[ChainLine] Shopify connection issue:', err.message);
  }
})();

// ── Helper: add to cart by handle or variantId ──
window.clAddToCart = async function(handleOrVariantId) {
  let variantId = handleOrVariantId;
  if (!handleOrVariantId.startsWith('gid://')) {
    variantId = window.CL_SHOP.variantMap?.[handleOrVariantId]
              || window.CL_SHOP.variantMap?.[handleOrVariantId.toLowerCase()]
              || null;
  }
  if (!variantId) { console.warn('[ChainLine] No variant found for:', handleOrVariantId); return; }

  const cart = await window.shopifyCart.add(variantId);
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
  return cart;
};
