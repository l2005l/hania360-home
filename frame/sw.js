// HaniaFrame offline: the page from the network when there is one, from the cache when not. Photos never change
// once sent, so they are kept and served from the cache: grandma's screen keeps showing them with no internet.
const C = "frame-v1", P = "frame-photos-v1", FILES = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/install.js", "/qrcode.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C && k !== P).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname === "/api/frame/img") {
    e.respondWith(caches.open(P).then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (u.pathname.startsWith("/api/")) return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(C).then((c) => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: u.pathname === "/hebcal.js" }).then((r) => r || caches.match("/"))));
});
