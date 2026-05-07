const CACHE_NAME = 'memoryforge-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Handle notification clicks — focus or open the app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('memoryforge') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('./');
    })
  );
});

// Periodic background sync — fires recall check even when app is closed
// (Chromium-based browsers on Android support this)
self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'recall-check') {
    e.waitUntil(checkPendingRecall());
  }
});

async function checkPendingRecall() {
  // Read timer state from the cache or a stored value
  // If a timer has expired, show a notification
  try {
    const cache = await caches.open(CACHE_NAME);
    // We can't read localStorage from SW, but we can use the client to message
    const allClients = await clients.matchAll({ includeUncontrolled: true });
    if (allClients.length === 0) {
      // App is fully closed — show a generic "come back and practice" notification
      await self.registration.showNotification('MemoryForge', {
        body: 'Time to check your recall! Open the app.',
        icon: 'icons/icon-192.png',
        tag: 'memoryforge-periodic',
        requireInteraction: false,
      });
    }
  } catch (err) {
    // Silently fail — periodic sync is best-effort
  }
}
