const CACHE = 'chainline-v7';

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

// NOTE: CDN scripts (React, Babel) must NOT be cached by the SW.
// Caching with no-cors produces opaque responses (status 0) which
// browsers refuse to execute as scripts → ERR_FAILED blank page.
// unpkg.com serves these with long max-age; the HTTP cache handles them.

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
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

  // Skip ALL cross-origin requests (CDN scripts, API, fonts, etc.)
  // Let the browser + HTTP cache handle them directly.
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
