const CACHE_NAME = 'fc26-images-v1';
const IMAGE_PATH = '/player_cards/';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

async function updateImage(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || new Response('', { status: 503, statusText: 'Image unavailable' });
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin ||
      (!url.pathname.startsWith(IMAGE_PATH) && url.pathname !== '/favicon.svg')) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) {
      event.waitUntil(updateImage(event.request));
      return cached;
    }
    return updateImage(event.request);
  })());
});
