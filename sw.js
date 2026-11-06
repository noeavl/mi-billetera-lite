// sw.js — Service Worker for Mi Billetera Lite
const CACHE_VERSION = 'v1';
const CACHE_NAME = `mi-billetera-${CACHE_VERSION}`;
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/db.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch((err) => {
        console.error('SW install failed:', err);
        throw err;
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).catch((err) => {
      console.error('SW activate failed:', err);
      throw err;
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache)).catch((err) => {
          console.error('SW cache put failed:', err);
        });
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});