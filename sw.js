const APP_CACHE = 'duelking2026-4con-v1';
const IMAGE_CACHE = 'duelking2026-card-images-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './packs/dm26ex4.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const keep = new Set([APP_CACHE, IMAGE_CACHE]);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => !keep.has(key) && key.startsWith('duelking2026-')).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isOfficialCardImage =
    url.hostname === 'dm.takaratomy.co.jp' &&
    (url.pathname.startsWith('/wp-content/card/cardimage/') || url.pathname.startsWith('/wp-content/card/cardthumb/'));

  if (isOfficialCardImage) {
    event.respondWith(cacheOfficialImage(event.request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          caches.open(APP_CACHE).then(cache => cache.put(event.request, response.clone()));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const clone = response.clone();
      caches.open(APP_CACHE).then(cache => cache.put(event.request, clone));
      return response;
    }))
  );
});

async function cacheOfficialImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}
