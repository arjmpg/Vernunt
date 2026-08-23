/*
  Vernunt Service Worker
  Provides lightning-fast startup with Network-First strategy for application shell
  to guarantee the latest deployed version is always served immediately.
*/

const CACHE_NAME = 'vernunt-static-cache-v4';
const DYNAMIC_CACHE_NAME = 'vernunt-dynamic-cache-v4';

// Pre-cache core structural assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html'
];

// Listen for skip waiting messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Installation phase - warm up static precache & immediately take control
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching application shell v4...');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[Service Worker] Pre-cache warning:', err);
      });
    })
  );
});

// Activation phase - purge all old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Purging outdated cache:', cacheName);
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

  // Bypass non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Bypass Vite dev server requests, source modules, and HMR
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.jsx') ||
    url.search.includes('import') ||
    url.search.includes('t=')
  ) {
    return;
  }

  // Bypass Firestore websocket, Firebase auth, or Google auth exchanges
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.search.includes('apiKey=') ||
    url.pathname.includes('/__/auth/')
  ) {
    return;
  }

  // Always bypass Service Worker for sitemap.xml, robots.txt, sw.js and backend API routes
  if (
    url.pathname === '/sw.js' ||
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/robots.txt' ||
    url.pathname.endsWith('.xml') ||
    url.pathname.endsWith('.txt') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/uploads/')
  ) {
    return;
  }

  // Strategy 1: Google Web Fonts & Static Assets via Unsplash (Cache-First)
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('images.unsplash.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
          }
          return networkResponse;
        }).catch(() => {
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

  // Strategy 2: Navigation & HTML requests (Network-First to always deliver the newest deployed version)
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match('/index.html').then((cached) => cached || caches.match('/'));
      })
    );
    return;
  }

  // Strategy 3: Versioned Hashed Static Assets (Stale-While-Revalidate with quick cache fallback)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
        }
        return networkResponse;
      }).catch((fetchErr) => {
        console.log('[Service Worker] Offline asset fallback:', request.url);
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
        throw fetchErr;
      });

      return cachedResponse || networkFetch;
    })
  );
});
