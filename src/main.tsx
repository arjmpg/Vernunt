import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import { getGeneratedSitemapXml } from './utils/sitemapXml.ts';

// Direct browser render for search crawlers and raw sitemap/robots views
const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

if (pathname === '/sitemap.xml') {
  const xml = getGeneratedSitemapXml();
  try {
    document.open('text/xml');
    document.write(xml);
    document.close();
  } catch {
    try {
      const xmlDoc = new DOMParser().parseFromString(xml, 'text/xml');
      if (xmlDoc.documentElement) {
        document.replaceChild(document.importNode(xmlDoc.documentElement, true), document.documentElement);
      }
    } catch {
      document.documentElement.innerText = xml;
    }
  }
} else if (pathname === '/robots.txt') {
  const robotsText = `User-agent: *\nAllow: /\n\nSitemap: https://app.vernunt.com/sitemap.xml\n`;
  try {
    document.open('text/plain');
    document.write(robotsText);
    document.close();
  } catch {
    document.documentElement.innerText = robotsText;
  }
} else {
  // Loop-breaker safety guard: detect and prevent rapid reload loops
  try {
    const RELOAD_KEY = 'vernunt_reload_guard';
    const now = Date.now();
    const raw = sessionStorage.getItem(RELOAD_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (now - data.timestamp < 10000 && data.count >= 4) {
        console.warn('⚠️ Reload loop prevented by Vernunt Safety Guard. Purging stale workers...');
        sessionStorage.removeItem(RELOAD_KEY);
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((regs) => {
            for (const r of regs) r.unregister();
          });
        }
      } else if (now - data.timestamp < 10000) {
        sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ count: data.count + 1, timestamp: now }));
      } else {
        sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ count: 1, timestamp: now }));
      }
    } else {
      sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ count: 1, timestamp: now }));
    }
  } catch {
    // Non-blocking
  }

  // Service Worker Management: In development/preview sandboxes, purge stale workers and caches
  const isDevOrPreview = 
    import.meta.env.DEV || 
    window.location.hostname.includes('localhost') || 
    window.location.hostname.includes('127.0.0.1') ||
    window.location.hostname.includes('run.app');

  if ('serviceWorker' in navigator) {
    if (isDevOrPreview) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
      if (typeof caches !== 'undefined') {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key.includes('vernunt')) {
              caches.delete(key);
            }
          });
        });
      }
    } else {
      // Production service worker registration
      window.addEventListener('load', () => {
        // Clean up any conflicting legacy workers like firebase-messaging-sw.js
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            const scriptUrl = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
            if (scriptUrl.includes('firebase-messaging-sw.js')) {
              console.log('🧹 Purging redundant firebase-messaging-sw.js in favor of unified /sw.js');
              reg.unregister();
            }
          }
        }).catch(() => {});

        // Register the unified PWA service worker without reload loops
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('🤖 PWA Active: Unified ServiceWorker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('❌ ServiceWorker registration error:', error);
          });
      });
    }
  }

  const rootElement = document.getElementById('root');
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  }
}


