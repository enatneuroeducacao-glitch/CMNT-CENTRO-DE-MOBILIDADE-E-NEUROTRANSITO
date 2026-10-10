/* Neurotrânsito PWA — fallback offline explícito; não armazena dados do usuário. */
const CACHE_NAME = "neurotransito-shell-v1";
const APP_SHELL = ["/offline.html", "/icons/icon-enat.svg", "/icons/icon-enat-192.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("neurotransito-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Nunca intercepta CDNs, Supabase, autenticação ou endpoints externos.
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch (_) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match("/offline.html"));
      }
    })());
    return;
  }
  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(request)) || fetch(request);
    })());
  }
});
