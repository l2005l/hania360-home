// HaniaRega offline: the page from the network when there is one, from the cache when not.
const C = "haniarega-v1", FILES = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/install.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C && k !== "rega-meta").map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  const key = u.pathname.startsWith("/f/") ? "/" : e.request; // the family page is the same page
  e.respondWith(fetch(e.request).then((r) => { if (r.ok && !u.pathname.startsWith("/f/")) { const copy = r.clone(); caches.open(C).then((c) => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(key).then((r) => r || caches.match("/"))));
});
// A new message (to the patient) or a reply (to the family) arrives as an empty push; the text waits in the room.
self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    let m = null;
    try {
      const room = await (await (await caches.open("rega-meta")).match("/__room")).text();
      const sub = await self.registration.pushManager.getSubscription();
      const r = await fetch("/api/rega/msg", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ c: room, endpoint: sub && sub.endpoint }) });
      m = r.ok ? await r.json() : null;
    } catch { m = null; }
    if (!m || !m.title) m = { title: "💌 HaniaRega", body: "יש משהו חדש מהמשפחה.", url: "/" };
    await self.registration.showNotification(m.title, { body: m.body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", lang: "he", dir: "rtl", tag: "rega", renotify: true, data: { url: m.url || "/" } });
  })());
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    for (const w of ws) if (w.url.startsWith(self.location.origin) && "focus" in w) { w.navigate && url !== "/" && w.navigate(url); return w.focus(); }
    return self.clients.openWindow(url === "/" ? "/#family" : url);
  }));
});
