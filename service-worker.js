const CACHE_NAME = "shophub-cache-v5";
const urlsToCache = ["/", "/index.html", "/icon_192.png", "/Icon_512.png", "/manifest.json"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Let Netlify serve clean product/job routes through the SPA rewrite.
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(response => response || caches.match("/index.html"))));
});
