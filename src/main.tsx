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
  // Service Worker Management: In development/preview sandboxes, purge stale workers and caches to prevent white screen issues
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
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            registration.update().catch(() => {});
            console.log('🤖 PWA Active: ServiceWorker successfully registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('❌ ServiceWorker registration failed:', error);
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


