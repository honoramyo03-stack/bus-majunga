// Service worker TransMahajanga — installabilité + coquille hors ligne.
// - Navigation : network-first, repli sur la coquille mise en cache (offline).
// - Assets same-origin : cache-first.
// - Le reste (Firebase, tuiles carte, polices) : réseau par défaut (non bloqué).
const CACHE = "transmahajanga-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(SHELL.map((u) => cache.add(u).catch(() => {})));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Navigations : network-first → repli coquille (expérience hors ligne).
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put("/index.html", fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          return (
            (await caches.match("/index.html")) ||
            (await caches.match("/")) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  // Assets same-origin : cache-first.
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.status === 200 && fresh.type === "basic") {
            const cache = await caches.open(CACHE);
            cache.put(req, fresh.clone()).catch(() => {});
          }
          return fresh;
        } catch {
          return cached || Response.error();
        }
      })()
    );
  }
  // Cross-origin : pas d'interception (réseau par défaut).
});
