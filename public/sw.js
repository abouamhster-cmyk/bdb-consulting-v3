// public/sw.js
const CACHE_NAME = 'bdb-cache-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
  console.log('[SW] Installé');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/', '/offline.html', '/dashboard']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activé');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) return;
  if (event.request.url.includes('supabase')) return;
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    }).catch(() => {
      if (event.request.headers.get('accept').includes('text/html')) {
        return caches.match('/offline.html');
      }
    })
  );
});

self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'BDB Consulting', body: 'Nouvelle notification', url: '/dashboard' };
  }

  const options = {
    body: data.body || 'Nouvelle alerte',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/dashboard' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'BDB Consulting', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url.includes(event.notification.data.url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});