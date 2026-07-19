const CACHE = 'ss-v1';

const PRECACHE = [
  '/',
  '/bundle.js',
  '/bundle.css',
  '/favicon.svg',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
];

// Never cache these origins — always go to the network
const NETWORK_ONLY_ORIGINS = [
  'supabase.co',
  'signalwire.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests that aren't network-only
  if (request.method !== 'GET') return;

  // Network-only for API origins (Supabase, SignalWire)
  if (NETWORK_ONLY_ORIGINS.some((origin) => url.hostname.includes(origin))) return;

  // Network-first for HTML navigation — always get fresh page shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Cache-first for everything else (JS, CSS, icons, fonts)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, clone));
        return res;
      });
    })
  );
});
