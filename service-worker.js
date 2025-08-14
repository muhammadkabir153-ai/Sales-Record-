// Offline-first service worker
const CACHE = 'km-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', (event)=>{
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event)=>{
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event)=>{
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        // Cache same-origin GETs at runtime
        try{
          const url = new URL(event.request.url);
          if (event.request.method === 'GET' && url.origin === location.origin) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(event.request, clone));
          }
        } catch(_) {}
        return resp;
      }).catch(()=> caches.match('./')); // fallback to shell
    })
  );
});
