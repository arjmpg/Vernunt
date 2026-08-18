/*
  Vernunt Service Worker
  Provides lightning-fast startup by serving cached static assets stale-while-revalidate 
  and fallback cache support for dynamic assets.
*/

const CACHE_NAME = 'vernunt-static-cache-v2';
const DYNAMIC_CACHE_NAME = 'vernunt-dynamic-cache-v2';

// Pre-cache core structural assets to guarantee instant shell boot
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧸</text></svg>'
];

// Installation phase - warm up static precache
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching application shell...');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[Service Worker] Pre-cache warning (some paths may be dynamic):', err);
      });
    })
  );
});

// Activation phase - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Removing deprecated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Catch and respond to network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET requests (e.g., Firestore REST API, Auth, Razorpay APIs)
  if (request.method !== 'GET') {
    return;
  }

  // Bypass Firestore websocket, Firebase auth, or Google auth exchanges
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.search.includes('apiKey=') ||
    url.pathname.includes('/__/auth/')
  ) {
    return;
  }

  // CRITICAL: Always bypass Service Worker for sitemap.xml, robots.txt, API routes, and XML documents
  if (
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/robots.txt' ||
    url.pathname.endsWith('.xml') ||
    url.pathname.endsWith('.txt') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/uploads/')
  ) {
    return;
  }

  // Strategy 1: Google Web Fonts & Static Assets via Unsplash (Cache-First, fast layout rendering)
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('images.unsplash.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve immediately, spawn background update
          fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {/* ignore background update failures when offline */});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
          }
          return networkResponse;
        }).catch(() => {
          // Offline fallback for unsplash images - yield a beautiful placeholder symbol
          if (url.hostname.includes('images.unsplash.com')) {
            return new Response(
              `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                <rect width="100%" height="100%" fill="#f1f5f9"/>
                <text x="50%" y="50%" font-size="64" text-anchor="middle" dominant-baseline="middle">🧸</text>
              </svg>`,
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        });
      })
    );
    return;
  }

  // Strategy 2: Stale-While-Revalidate for application assets (JS, CSS, HTML, local icons)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
        }
        return networkResponse;
      }).catch((fetchErr) => {
        console.log('[Service Worker] Dynamic cache fetch fallback triggered offline:', request.url, fetchErr);
        // Fallback for navigation requests to parent document shell index.html
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
        throw fetchErr;
      });

      return cachedResponse || networkFetch;
    })
  );
});
