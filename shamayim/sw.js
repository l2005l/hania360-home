// HaniaShamayim offline: the page and the sky (sky.js) from the network when there is one, from the cache when not.
// The sky is computed on the phone, so it works without internet (only the space station's orbit needs a refresh).
const C = "shamayim-v1", FILES = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/install.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(C).then((c) => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: u.pathname === "/sky.js" }).then((r) => r || caches.match("/"))));
});
