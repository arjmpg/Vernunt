import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
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
  // Register PWA Service Worker for offline survival capability (with automatic update checking)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          // Automatically check for SW updates
          registration.update().catch(() => {});
          console.log('🤖 PWA Active: ServiceWorker successfully registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ ServiceWorker registration failed:', error);
        });
    });
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}


