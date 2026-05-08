const CACHE_NAME = 'memoryforge-v10';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './scripture.js',
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

// -- Scheduled notification from page --
// Page posts { type: 'schedule-notification', delay: ms, title, body, tag }
// SW uses setTimeout inside waitUntil to fire even when page is backgrounded
let scheduledTimers = {};

self.addEventListener('message', (e) => {
  const data = e.data;
  if (!data || !data.type) return;

  if (data.type === 'schedule-notification') {
    const id = data.tag || 'memoryforge-scheduled';
    // Cancel any existing timer with this tag
    if (scheduledTimers[id]) clearTimeout(scheduledTimers[id]);

    // Use waitUntil to keep SW alive during the delay
    const delay = Math.max(0, data.delay || 0);
    const promise = new Promise((resolve) => {
      scheduledTimers[id] = setTimeout(async () => {
        delete scheduledTimers[id];
        try {
          await self.registration.showNotification(data.title || 'MemoryForge', {
            body: data.body || 'Timer expired!',
            icon: 'icon-192.png',
            badge: 'icon-192.png',
            tag: id,
            renotify: true,
            requireInteraction: true,
            silent: false,
            vibrate: [200, 100, 200, 100, 200],
            data: { action: 'recall' },
            actions: [
              { action: 'open', title: 'Open App' },
              { action: 'dismiss', title: 'Dismiss' }
            ]
          });
        } catch (err) {
          // SW may have been killed — best effort
        }
        resolve();
      }, delay);
    });
    // Keep SW alive for the duration (Chrome allows ~5 min max)
    e.waitUntil(promise);

  } else if (data.type === 'cancel-notification') {
    const id = data.tag || 'memoryforge-scheduled';
    if (scheduledTimers[id]) {
      clearTimeout(scheduledTimers[id]);
      delete scheduledTimers[id];
    }
  }
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
        icon: 'icon-192.png',
        tag: 'memoryforge-periodic',
        requireInteraction: false,
      });
    }
  } catch (err) {
    // Silently fail — periodic sync is best-effort
  }
}
