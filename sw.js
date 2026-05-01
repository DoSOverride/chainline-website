const CACHE = 'chainline-v5';

const PRECACHE = [
  '/',
  '/styles.css',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/apple-touch-icon.png',
  '/logo.png',
  '/logo-dark.png',
  '/bike-data.js',
  '/lightspeed.js',
  '/shopify.js',
];

// CDN scripts that must be cached for offline PWA to function
const CDN_PRECACHE = [
  'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      await c.addAll(PRECACHE);
      // Cache CDN scripts with no-cors (opaque responses) for offline support
      for (const url of CDN_PRECACHE) {
        try {
          const resp = await fetch(url, { mode: 'no-cors' });
          await c.put(url, resp);
        } catch {}
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (e.request.method !== 'GET') return;

  // Cache CDN scripts (React, ReactDOM, Babel) for offline support
  if (CDN_PRECACHE.includes(e.request.url)) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request, { mode: 'no-cors' }).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      }))
    );
    return;
  }

  // Skip all other cross-origin requests: API, fonts, Shopify, R2, etc.
  if (url.origin !== location.origin) return;

  // App shell: always serve index.html for navigation requests (SPA routing)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets: cache-first, then network, then cache on miss
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp.ok && resp.type !== 'opaque') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('/'));
    })
  );
});
