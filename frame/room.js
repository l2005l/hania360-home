// HaniaFrame (frame.hania360.com): a photo frame for grandparents, fed by the whole family.
// One Durable Object per frame. The family link (/#f=<id>) adds photos and greetings and sees what grandma liked;
// the screen link (/#s=<id>) is the old tablet on grandma's shelf, playing the photos one after another.
// Anyone with the link can add, like a family group, so the id is long and random; only the creator's phone
// (holding the owner key) changes the settings or removes other people's photos. A photo arrives already small
// (made on the phone, at most about 450 KB) and is kept as bytes. The newest 300 items stay.

const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const token = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[x % 57]).join(""); };
const MAX_ITEMS = 300, MAX_IMG = 620_000, DAY_CAP = 120;
const BGS = ["sunset", "sea", "rose", "mint", "night", "gold"];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class HaniaFrame {
  constructor(ctx) { this.ctx = ctx; }
  async load() { return (this.f = this.f || (await this.ctx.storage.get("f")) || null); }
  async save() { await this.ctx.storage.put("f", this.f); }
  view(owner) {
    const f = this.f;
    return { name: f.name, owner: !!owner, set: f.set, at: f.at || 0,
      items: f.items.slice(-MAX_ITEMS).map((x) => ({ id: x.id, at: x.at, from: x.from, by: x.by, cap: x.cap, kind: x.kind, bg: x.bg, w: x.w, h: x.h, likes: x.likes || 0, liked: x.liked || 0 })) };
  }
  async fetch(req) {
    const url = new URL(req.url), p = url.pathname;
    const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
    const b = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (p === "/init") {
      if (await this.load()) return json({ error: "exists" }, 409);
      this.f = { id: b.id, own: b.own, name: clean(b.name, 40) || "המסגרת שלנו", items: [], created: Date.now(), at: Date.now(), day: {},
        set: { sec: 12, night: true, from: "22:00", to: "06:30", clock: true, shab: true, city: clean(b.city, 30) } };
      await this.save();
      return json({ ok: true });
    }
    if (!(await this.load())) return json({ error: "no frame" }, 404);
    const f = this.f, owner = !!b.own && b.own === f.own || url.searchParams.get("own") === f.own;
    if (p === "/state") {
      const since = +url.searchParams.get("since") || 0;
      if (since && since >= (f.at || 0)) return json({ same: true, at: f.at || 0 });
      return json(this.view(owner));
    }
    if (p === "/img") {
      const x = f.items.find((i) => i.id === url.searchParams.get("i") && i.kind === "img");
      const data = x && (await this.ctx.storage.get("img:" + x.id));
      if (!data) return new Response("", { status: 404 });
      return new Response(data, { headers: { "content-type": "image/jpeg", "cache-control": "private, max-age=2592000, immutable", "x-content-type-options": "nosniff" } });
    }
    if (p !== "/op") return json({ error: "not found" }, 404);
    const day = new Date().toISOString().slice(0, 10);
    switch (b.op) {
      case "post": { // a photo, made small on the phone, with a line and who sent it
        if ((f.day[day] || 0) >= DAY_CAP) return json({ error: "day" }, 429);
        const m = typeof b.img === "string" && /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(b.img);
        if (!m || b.img.length > MAX_IMG) return json({ error: "img" }, 400);
        const bytes = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0)), id = token(10);
        await this.ctx.storage.put("img:" + id, bytes);
        f.items.push({ id, at: Date.now(), kind: "img", from: clean(b.from, 24) || "מהמשפחה", by: clean(b.by, 24), cap: clean(b.cap, 140), w: Math.min(9999, Math.max(1, +b.w || 4)), h: Math.min(9999, Math.max(1, +b.h || 3)), likes: 0 });
        f.day = { [day]: (f.day[day] || 0) + 1 };
        await this.tidy(); f.at = Date.now(); await this.save();
        return json({ ok: true, id, at: f.at });
      }
      case "text": { // a greeting: a few words on a colored card
        if ((f.day[day] || 0) >= DAY_CAP) return json({ error: "day" }, 429);
        const cap = clean(b.text, 160); if (!cap) return json({ error: "empty" }, 400);
        const id = token(10);
        f.items.push({ id, at: Date.now(), kind: "text", from: clean(b.from, 24) || "מהמשפחה", by: clean(b.by, 24), cap, bg: BGS.includes(b.bg) ? b.bg : BGS[0], likes: 0 });
        f.day = { [day]: (f.day[day] || 0) + 1 };
        await this.tidy(); f.at = Date.now(); await this.save();
        return json({ ok: true, id, at: f.at });
      }
      case "like": { // from the screen: grandma touched the heart
        const x = f.items.find((i) => i.id === b.id); if (!x) return json({ error: "item" }, 404);
        x.likes = Math.min(999, (x.likes || 0) + 1); x.liked = Date.now(); f.at = Date.now(); await this.save();
        return json({ ok: true, likes: x.likes });
      }
      case "del": { // the sender (same phone) or the frame's owner
        const x = f.items.find((i) => i.id === b.id); if (!x) return json({ ok: true });
        if (!owner && !(b.by && x.by && b.by === x.by)) return json({ error: "owner" }, 403);
        if (x.kind === "img") await this.ctx.storage.delete("img:" + x.id);
        f.items = f.items.filter((i) => i.id !== x.id); f.at = Date.now(); await this.save();
        return json({ ok: true });
      }
      case "set": {
        if (!owner) return json({ error: "owner" }, 403);
        const s = f.set, n = b.set || {};
        if ([6, 10, 12, 20, 30, 60].includes(+n.sec)) s.sec = +n.sec;
        for (const k of ["night", "clock", "shab"]) if (typeof n[k] === "boolean") s[k] = n[k];
        if (HHMM.test(n.from || "")) s.from = n.from; if (HHMM.test(n.to || "")) s.to = n.to;
        if (typeof n.city === "string") s.city = clean(n.city, 30);
        if (typeof b.name === "string" && clean(b.name, 40)) f.name = clean(b.name, 40);
        f.at = Date.now(); await this.save();
        return json(this.view(true));
      }
      case "wipe": { // the owner removes the frame and every photo in it
        if (!owner) return json({ error: "owner" }, 403);
        await this.ctx.storage.deleteAll(); this.f = null;
        return json({ ok: true });
      }
    }
    return json({ error: "op" }, 400);
  }
  async tidy() {
    const f = this.f;
    while (f.items.length > MAX_ITEMS) { const x = f.items.shift(); if (x.kind === "img") await this.ctx.storage.delete("img:" + x.id); }
  }
}

export async function frameApi(req, env, url) {
  const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
  const mm = url.pathname.match(/^\/api\/frame\/(new|state|op|img)$/);
  if (!mm) return json({ error: "not found" }, 404);
  if (!env.FRAME) return json({ error: "not configured" }, 503);
  const what = mm[1], stub = (id) => env.FRAME.get(env.FRAME.idFromName("f:" + id));
  if (what === "new") {
    if (req.method !== "POST") return json({ error: "method" }, 405);
    const b = await req.json().catch(() => ({}));
    const id = token(16), own = token(24);
    const r = await stub(id).fetch("https://f/init", { method: "POST", body: JSON.stringify({ id, own, name: b.name, city: b.city }) });
    return r.ok ? json({ id, own }) : json({ error: "init" }, 500);
  }
  let fid = url.searchParams.get("c"), body;
  if (req.method === "POST") { body = await req.text(); if (body.length > 700_000) return json({ error: "big" }, 413); try { fid = JSON.parse(body).c || fid; } catch {} }
  if (!/^[A-Za-z0-9]{16}$/.test(fid || "")) return json({ error: "frame" }, 400);
  return stub(fid).fetch("https://f/" + what + url.search, { method: req.method, body });
}
