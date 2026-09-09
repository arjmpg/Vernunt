// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "gen-lang-client-0519197985",
  appId: "1:440135393217:web:9b35f7060ea35f0dc89940",
  apiKey: "AIzaSyCEucaDirlRGUMCJp9L3-bRiMwXIKhanq0",
  authDomain: "gen-lang-client-0519197985.firebaseapp.com",
  storageBucket: "gen-lang-client-0519197985.firebasestorage.app",
  messagingSenderId: "440135393217"
};

firebase.initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Messaging init note:', e);
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message payload:', payload);

    const title = payload.notification?.title || payload.data?.title || 'Vernunt Update';
    const body = payload.notification?.body || payload.data?.body || 'You have a new update in Vernunt.';
    const icon = payload.notification?.icon || payload.data?.icon || '/pwa-192x192.png';
    const badge = '/favicon.png';
    const url = payload.data?.url || (payload.data?.type === 'playdate' ? '/?tab=planner' : '/?tab=events');

    const notificationOptions = {
      body,
      icon,
      badge,
      vibrate: [200, 100, 200],
      tag: payload.data?.tag || `vernunt-fcm-${Date.now()}`,
      renotify: true,
      data: {
        url,
        ...payload.data
      },
      actions: [
        { action: 'open', title: 'Open Vernunt' },
        { action: 'dismiss', title: 'Close' }
      ]
    };

    return self.registration.showNotification(title, notificationOptions);
  });
}

// Fallback direct Push event listener for iOS Web Push & Android
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.notification?.title || data.title || 'Vernunt Update';
    const body = data.notification?.body || data.body || 'You have a new update in Vernunt.';
    const icon = data.notification?.icon || data.icon || '/pwa-192x192.png';
    const url = data.data?.url || data.url || '/';

    const options = {
      body,
      icon,
      badge: '/favicon.png',
      vibrate: [200, 100, 200],
      tag: data.data?.tag || `vernunt-push-${Date.now()}`,
      renotify: true,
      data: { url, ...(data.data || {}) },
      actions: [
        { action: 'open', title: 'Open Vernunt' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Vernunt Alert', {
        body: text,
        icon: '/pwa-192x192.png',
        badge: '/favicon.png',
        data: { url: '/' }
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.registration.scope)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
