// HaniaHazmana offline: the page from the network when there is one, from the cache when not.
// Reminders arrive as an empty push; the message waits in the group it is about.
const C = "haniahazmana-v1", FILES = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/install.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C && k !== "hz-meta").map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(C).then((c) => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match("/"))));
});
self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    let m = null;
    try {
      const sub = await self.registration.pushManager.getSubscription();
      const meta = await (await caches.open("hz-meta")).match("/hz-events");
      const ids = meta ? await meta.json() : [];
      {
        const r = await fetch("/api/hz/msg", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids, endpoint: sub && sub.endpoint }) });
        const j = r.ok ? await r.json() : null;
        if (j && j.title) m = j;
      }
    } catch { m = null; }
    if (!m) m = { title: "💌 תשובות חדשות לאירוע", body: "לוחצים כדי לראות מי ענה", url: "/" };
    await self.registration.showNotification(m.title, { body: m.body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", lang: "he", dir: "rtl", tag: "hazmana", renotify: true, data: { url: m.url || "/" } });
  })());
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    for (const w of ws) if (w.url.startsWith(self.location.origin) && "focus" in w) return w.navigate(url).then((x) => (x || w).focus());
    return self.clients.openWindow(url);
  }));
});
