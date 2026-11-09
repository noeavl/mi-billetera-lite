// sw.js — Service Worker de Mi Billetera Lite

const CACHE_NAME = 'mi-billetera-v1';

const APP_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './db.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instalar y guardar archivos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Error al instalar el Service Worker:', error);
        throw error;
      })
  );
});

// Activar y eliminar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Interceptar solicitudes
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Solo solicitudes GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // No interceptar otros dominios
  if (url.origin !== self.location.origin) return;

  // Navegación: intentar red y recurrir a caché
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => cache.put('./index.html', copy));

          }

          return response;
        })
        .catch(async () => {
          return (
            await caches.match(request) ||
            await caches.match('./index.html')
          );
        })
    );

    return;
  }

  // Recursos estáticos: caché primero
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, copy));
          }

          return response;
        });
      })
      .catch(() => {
        return new Response(
          'No se pudo cargar el recurso sin conexión.',
          {
            status: 503,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8'
            }
          }
        );
      })
  );
});