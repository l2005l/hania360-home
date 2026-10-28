// HaniaHazmana: one Durable Object per event. The hosts keep the invitation, the guest list and the
// seating; every guest has a private link where they answer, and the event also has an open link
// where anyone can answer by name. The hosts' phones are woken (payload-less push) when answers come in.
import { okEndpoint, subId, vapidKeys, wake } from "../lib/webpush.js";

const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const text = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u0009\u000b-\u001f<>]/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, n);
const token = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[x % 57]).join(""); };
const okId = (s) => typeof s === "string" && /^[A-Za-z0-9]{6,24}$/.test(s);
const int = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const phone = (s) => { let d = String(s || "").replace(/\D/g, ""); if (d.startsWith("972")) d = "0" + d.slice(3); return /^0\d{8,9}$/.test(d) ? d : ""; };
const KINDS = ["wedding", "bar", "bat", "brit", "birthday", "henna", "other"];
const THEMES = ["gold", "bloom", "night", "kids", "sea"];
const STATUS = ["", "yes", "no", "maybe"];
const MAX_GUESTS = 1500, MAX_TABLES = 200;
const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });

function eventOf(b, old) {
  const e = Object.assign({}, old || {});
  if (b.kind !== undefined) e.kind = KINDS.includes(b.kind) ? b.kind : "other";
  if (b.theme !== undefined) e.theme = THEMES.includes(b.theme) ? b.theme : "gold";
  for (const [k, n] of [["title", 60], ["hosts", 120], ["venue", 80], ["address", 120], ["time", 5], ["chuppah", 5], ["gift", 200], ["dress", 60]]) if (b[k] !== undefined) e[k] = clean(b[k], n);
  if (b.date !== undefined) e.date = /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : "";
  if (b.deadline !== undefined) e.deadline = /^\d{4}-\d{2}-\d{2}$/.test(b.deadline) ? b.deadline : "";
  if (b.message !== undefined) e.message = text(b.message, 900);
  if (b.askKids !== undefined) e.askKids = !!b.askKids;
  if (b.askDiet !== undefined) e.askDiet = !!b.askDiet;
  if (b.showTable !== undefined) e.showTable = !!b.showTable;
  return e;
}
const pub = (e, hasPhoto) => ({ kind: e.kind, theme: e.theme, title: e.title, hosts: e.hosts, venue: e.venue, address: e.address, date: e.date, time: e.time, chuppah: e.chuppah, message: e.message, gift: e.gift, dress: e.dress, deadline: e.deadline, askKids: e.askKids !== false, askDiet: e.askDiet !== false, photo: !!hasPhoto });

export class EventRoom {
  constructor(ctx) {
    this.ctx = ctx;
    const sql = ctx.storage.sql;
    sql.exec("CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)");
    sql.exec("CREATE TABLE IF NOT EXISTS guests (id TEXT PRIMARY KEY, t TEXT UNIQUE, name TEXT, phone TEXT, side TEXT, grp TEXT, invited INTEGER, status TEXT, adults INTEGER, kids INTEGER, diet TEXT, note TEXT, tbl TEXT, sent INTEGER, upd INTEGER, src TEXT)");
    sql.exec("CREATE TABLE IF NOT EXISTS tables (id TEXT PRIMARY KEY, name TEXT, seats INTEGER, ord INTEGER)");
    sql.exec("CREATE TABLE IF NOT EXISTS subs (id TEXT PRIMARY KEY, endpoint TEXT)");
  }
  rows(q, ...b) { return [...this.ctx.storage.sql.exec(q, ...b)]; }
  get(k) { const r = this.rows("SELECT v FROM meta WHERE k = ?", k)[0]; return r ? JSON.parse(r.v) : null; }
  put(k, v) { this.ctx.storage.sql.exec("INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v", k, JSON.stringify(v)); }
  guest(r) { return { id: r.id, t: r.t, name: r.name, phone: r.phone, side: r.side, grp: r.grp, invited: r.invited, status: r.status, adults: r.adults, kids: r.kids, diet: r.diet, note: r.note, tbl: r.tbl, sent: r.sent, upd: r.upd, src: r.src }; }
  all() { return { event: this.get("event"), guests: this.rows("SELECT * FROM guests ORDER BY rowid").map((r) => this.guest(r)), tables: this.rows("SELECT * FROM tables ORDER BY ord, rowid"), photo: !!this.get("photo") }; }
  count() { return this.rows("SELECT COUNT(*) AS n FROM guests")[0].n; }

  addGuest(g, src) {
    if (this.count() >= MAX_GUESTS) return null;
    const id = "g" + token(8), t = token(10);
    this.ctx.storage.sql.exec("INSERT INTO guests (id, t, name, phone, side, grp, invited, status, adults, kids, diet, note, tbl, sent, upd, src) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 0, ?, ?)",
      id, t, clean(g.name, 40), phone(g.phone), clean(g.side, 20), clean(g.grp, 30), int(g.invited, 1, 30, 2), STATUS.includes(g.status) ? g.status : "", int(g.adults, 0, 30, 0), int(g.kids, 0, 30, 0), clean(g.diet, 40), text(g.note, 300), Date.now(), src || "list");
    return id;
  }

  async notifyHosts(line) {
    const subs = this.rows("SELECT id, endpoint FROM subs"); if (!subs.length) return;
    const recent = (this.get("recent") || []).slice(-9); recent.push({ line, at: Date.now() }); this.put("recent", recent);
    // At most one wake every two minutes; the message lists everything since.
    const last = this.get("woke") || 0; if (Date.now() - last < 120000) return; this.put("woke", Date.now());
    const v = await vapidKeys(this.ctx.storage);
    for (const s of subs) if (!(await wake(v, s.endpoint, "https://hazmana.hania360.com"))) this.ctx.storage.sql.exec("DELETE FROM subs WHERE id = ?", s.id);
  }

  async fetch(req) {
    const url = new URL(req.url), p = url.pathname.slice(1);
    const b = req.method === "POST" ? await req.json().catch(() => ({})) : Object.fromEntries(url.searchParams);
    const sql = this.ctx.storage.sql;
    if (p === "init") {
      if (this.get("event")) return json({ error: "exists" }, 409);
      this.put("event", eventOf(Object.assign({ theme: "gold", kind: "other", askKids: true, askDiet: true, showTable: false }, b), {})); this.put("admin", b.admin); this.put("id", b.id); this.put("created", Date.now());
      return json({ ok: true });
    }
    const e = this.get("event"); if (!e) return json({ error: "event" }, 404);
    const admin = b.k && b.k === this.get("admin");

    // ---- guests ----
    if (p === "photo" && req.method === "GET") { const ph = this.get("photo"); if (!ph) return new Response("", { status: 404 }); return new Response(Uint8Array.from(atob(ph), (c) => c.charCodeAt(0)), { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=300" } }); }
    if (p === "open") return json({ event: pub(e, this.get("photo")) });
    if (p === "me") {
      const r = this.rows("SELECT * FROM guests WHERE t = ?", String(b.t || ""))[0]; if (!r) return json({ error: "guest" }, 404);
      const tb = e.showTable && r.tbl ? this.rows("SELECT name FROM tables WHERE id = ?", r.tbl)[0] : null;
      return json({ event: pub(e, this.get("photo")), guest: { name: r.name, invited: r.invited, status: r.status, adults: r.adults, kids: r.kids, diet: r.diet, note: r.note, table: tb ? tb.name : "" } });
    }
    if (p === "rsvp" && req.method === "POST") {
      const st = STATUS.includes(b.status) && b.status ? b.status : null; if (!st) return json({ error: "status" }, 400);
      const adults = st === "no" ? 0 : int(b.adults, 1, 30, 1), kids = st === "no" ? 0 : int(b.kids, 0, 30, 0), diet = clean(b.diet, 40), note = text(b.note, 300);
      let r = b.t ? this.rows("SELECT * FROM guests WHERE t = ?", String(b.t))[0] : null, name;
      if (r) { sql.exec("UPDATE guests SET status = ?, adults = ?, kids = ?, diet = ?, note = ?, upd = ? WHERE id = ?", st, adults, kids, diet, note, Date.now(), r.id); name = r.name; }
      else {
        // The open link: a name (and a phone, so a second answer updates the first).
        name = clean(b.name, 40); if (!name) return json({ error: "name" }, 400);
        const ph = phone(b.phone), same = ph ? this.rows("SELECT * FROM guests WHERE phone = ?", ph)[0] : this.rows("SELECT * FROM guests WHERE name = ? AND src = 'open'", name)[0];
        if (same) { sql.exec("UPDATE guests SET status = ?, adults = ?, kids = ?, diet = ?, note = ?, upd = ? WHERE id = ?", st, adults, kids, diet, note, Date.now(), same.id); r = same; }
        else { const id = this.addGuest({ name, phone: ph, invited: adults + kids, status: st, adults, kids, diet, note, grp: "קישור כללי" }, "open"); if (!id) return json({ error: "full" }, 507); r = this.rows("SELECT * FROM guests WHERE id = ?", id)[0]; }
      }
      await this.notifyHosts(st === "yes" ? "✅ " + name + " מגיע/ה" + (adults + kids > 1 ? " (" + (adults + kids) + ")" : "") : st === "no" ? "❌ " + name + " לא מגיע/ה" : "🤔 " + name + " אולי");
      return json({ ok: true, t: r.t });
    }

    if (p === "msg" && req.method === "POST") return json(await this.msgFor(b.endpoint));

    // ---- hosts ----
    if (!admin) return json({ error: "key" }, 403);
    if (p === "admin") return json(this.all());
    if (p === "event" && req.method === "POST") { this.put("event", eventOf(b.event || {}, e)); return json({ ok: true, event: this.get("event") }); }
    if (p === "upload" && req.method === "POST") {
      if (!b.jpeg) { sql.exec("DELETE FROM meta WHERE k = 'photo'"); return json({ ok: true }); }
      if (typeof b.jpeg !== "string" || b.jpeg.length > 900000 || !/^[A-Za-z0-9+/=]+$/.test(b.jpeg)) return json({ error: "photo" }, 400);
      this.put("photo", b.jpeg); return json({ ok: true });
    }
    if (p === "guests" && req.method === "POST") {
      const added = [];
      for (const g of (Array.isArray(b.add) ? b.add : []).slice(0, 500)) { if (!clean(g.name, 40)) continue; const id = this.addGuest(g, "list"); if (!id) break; added.push(id); }
      for (const g of (Array.isArray(b.update) ? b.update : []).slice(0, 500)) {
        if (!g || !/^g[A-Za-z0-9]{8}$/.test(g.id)) continue;
        const r = this.rows("SELECT * FROM guests WHERE id = ?", g.id)[0]; if (!r) continue;
        const v = (k, f) => (g[k] === undefined ? r[k] : f(g[k]));
        sql.exec("UPDATE guests SET name = ?, phone = ?, side = ?, grp = ?, invited = ?, status = ?, adults = ?, kids = ?, diet = ?, note = ?, tbl = ?, sent = ?, upd = ? WHERE id = ?",
          v("name", (x) => clean(x, 40) || r.name), v("phone", phone), v("side", (x) => clean(x, 20)), v("grp", (x) => clean(x, 30)), v("invited", (x) => int(x, 1, 30, 2)), v("status", (x) => (STATUS.includes(x) ? x : "")),
          v("adults", (x) => int(x, 0, 30, 0)), v("kids", (x) => int(x, 0, 30, 0)), v("diet", (x) => clean(x, 40)), v("note", (x) => text(x, 300)), v("tbl", (x) => clean(x, 12)), v("sent", (x) => int(x, 0, 1e13, 0)), g.status !== undefined && g.status !== r.status ? Date.now() : r.upd, g.id);
      }
      for (const id of (Array.isArray(b.remove) ? b.remove : []).slice(0, 500)) sql.exec("DELETE FROM guests WHERE id = ?", String(id));
      return json(Object.assign({ ok: true, added }, this.all()));
    }
    if (p === "tables" && req.method === "POST") {
      const list = (Array.isArray(b.tables) ? b.tables : []).slice(0, MAX_TABLES);
      sql.exec("DELETE FROM tables");
      list.forEach((t, i) => { const id = /^t[A-Za-z0-9]{4,10}$/.test(t.id) ? t.id : "t" + token(6); sql.exec("INSERT INTO tables (id, name, seats, ord) VALUES (?, ?, ?, ?)", id, clean(t.name, 24) || String(i + 1), int(t.seats, 1, 60, 10), i); });
      const ids = new Set(this.rows("SELECT id FROM tables").map((r) => r.id));
      for (const r of this.rows("SELECT id, tbl FROM guests WHERE tbl <> ''")) if (!ids.has(r.tbl)) sql.exec("UPDATE guests SET tbl = '' WHERE id = ?", r.id);
      return json(Object.assign({ ok: true }, this.all()));
    }
    if (p === "key") return json({ key: (await vapidKeys(this.ctx.storage)).pub });
    if (p === "sub" && req.method === "POST") { if (!okEndpoint(b.endpoint)) return json({ error: "endpoint" }, 400); sql.exec("INSERT OR REPLACE INTO subs (id, endpoint) VALUES (?, ?)", await subId(b.endpoint), b.endpoint); return json({ ok: true }); }
    return json({ error: "not found" }, 404);
  }

  /** What the service worker shows when a host's phone is woken. */
  async msgFor(endpoint) {
    if (!okEndpoint(endpoint)) return {};
    const id = await subId(endpoint); if (!this.rows("SELECT id FROM subs WHERE id = ?", id).length) return {};
    const r = (this.get("recent") || []).filter((x) => Date.now() - x.at < 3600e3); this.put("recent", []);
    const e = this.get("event") || {};
    return r.length ? { title: r.length === 1 ? r[0].line : r.length + " תשובות חדשות ל" + (e.title || "אירוע"), body: r.length === 1 ? "לחיצה פותחת את רשימת האורחים" : r.map((x) => x.line).join("\n"), url: "/#a-" + this.get("id") + "-" + this.get("admin") } : {};
  }
}

export async function hazmanaApi(req, env, url) {
  if (!env.HAZMANA) return json({ error: "not configured" }, 503);
  const stub = (id) => env.HAZMANA.get(env.HAZMANA.idFromName("e:" + id));
  if (url.pathname === "/api/hz/new" && req.method === "POST") {
    const b = await req.json().catch(() => null); if (!b) return json({ error: "json" }, 400);
    const id = token(8), admin = token(16);
    const r = await stub(id).fetch("https://e/init", { method: "POST", body: JSON.stringify(Object.assign({}, b, { id, admin })) });
    const j = await r.json();
    return json(j.ok ? { id, admin } : j, r.status);
  }
  // The service worker asks every event this phone follows; it sends the event id.
  if (url.pathname === "/api/hz/msg" && req.method === "POST") {
    const b = await req.json().catch(() => ({}));
    const ids = (Array.isArray(b.ids) ? b.ids : []).filter(okId).slice(0, 10);
    if (!okEndpoint(b.endpoint)) return json({});
    for (const id of ids) { const m = await stub(id).fetch("https://e/msg", { method: "POST", body: JSON.stringify({ endpoint: b.endpoint }) }).then((r) => r.json()).catch(() => ({})); if (m && m.title) return json(m); }
    return json({});
  }
  const m = url.pathname.match(/^\/api\/hz\/(open|me|rsvp|photo|admin|event|upload|guests|tables|key|sub)$/);
  let body = null, eid = url.searchParams.get("e");
  if (req.method === "POST") { body = await req.text(); if (body.length > 1200000) return json({ error: "size" }, 413); try { eid = JSON.parse(body).e; } catch { eid = null; } }
  if (!m || !okId(eid)) return json({ error: "event" }, 400);
  return stub(eid).fetch("https://e/" + m[1] + url.search, { method: req.method, body });
}
