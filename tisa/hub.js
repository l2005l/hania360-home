// HaniaTisa: one Durable Object keeps the Airports Authority board (data.gov.il, refreshed there every
// 15 minutes), a history of every flight's delay so reliability can be shown, and the phones that
// asked to be told when a flight changes. Pushes carry no payload: the service worker asks
// /api/tisa/msg what to show.
import { okEndpoint, subId, vapidKeys, wake } from "../lib/webpush.js";
import { passUser, hanCors } from "../lib/account.js";

const RESOURCE = "e83f763b-b7d7-479e-b172-ae981ddc6de5";
const EVERY = 10 * 60 * 1000;
const json = (o, s = 200, extra = {}) => Response.json(o, { status: s, headers: Object.assign({ "cache-control": "no-store" }, extra) });

/** One row of the board, the same shape the page uses. */
export function norm(r) {
  const g = (...ks) => { for (const k of ks) if (r[k] != null && String(r[k]).trim() !== "") return String(r[k]).trim(); return ""; };
  const dir = g("CHAORD") === "A" ? "A" : "D", al = g("CHOPER"), num = g("CHFLTN"), sched = g("CHSTOL").slice(0, 16);
  if (!al || !num || !sched) return null;
  return { k: dir + "|" + al + "|" + num + "|" + sched.slice(0, 10), dir, al, aln: g("CHOPERD"), num, sched, est: g("CHPTOL").slice(0, 16) || sched,
    code: g("CHLOC1"), city: g("CHLOC1TH", "CHLOC1T", "CHLOC1D"), cityEn: g("CHLOC1D"), country: g("CHLOC1CH", "CHLOCCT"), term: g("CHTERM"), counters: g("CHCINT"), zone: g("CHCKZN"),
    st: g("CHRMINE").toUpperCase(), sth: g("CHRMINH") };
}
const mins = (a, b) => Math.round((Date.parse(b + ":00Z") - Date.parse(a + ":00Z")) / 60000);
const hm = (s) => (s || "").slice(11, 16);
const done = (f) => /LANDED|DEPARTED|CANCEL/.test(f.st);

export class FlightHub {
  constructor(ctx) {
    this.ctx = ctx;
    const sql = ctx.storage.sql;
    sql.exec("CREATE TABLE IF NOT EXISTS board (k TEXT PRIMARY KEY, d TEXT NOT NULL, upd INTEGER NOT NULL)");
    sql.exec("CREATE TABLE IF NOT EXISTS hist (k TEXT PRIMARY KEY, day TEXT, al TEXT, num TEXT, dir TEXT, code TEXT, delay INTEGER, cancel INTEGER, final INTEGER)");
    sql.exec("CREATE INDEX IF NOT EXISTS hist_f ON hist (al, num, dir)");
    sql.exec("CREATE TABLE IF NOT EXISTS subs (id TEXT PRIMARY KEY, endpoint TEXT, keys TEXT, msg TEXT, at INTEGER)");
    // What a signed-in person keeps: flight keys (HaniaTisa) and cars (HaniaCheck).
    sql.exec("CREATE TABLE IF NOT EXISTS acct (user TEXT PRIMARY KEY, flights TEXT NOT NULL DEFAULT '[]', cars TEXT NOT NULL DEFAULT '[]', upd INTEGER)");
  }
  rows(q, ...b) { return [...this.ctx.storage.sql.exec(q, ...b)]; }

  async refresh() {
    const r = await fetch("https://data.gov.il/api/3/action/datastore_search?resource_id=" + RESOURCE + "&limit=5000", { headers: { accept: "application/json", "user-agent": "HaniaTisa/1 (+https://tisa.hania360.com)" } }).catch(() => null);
    if (!r || !r.ok) return false;
    const j = await r.json().catch(() => null), recs = j && j.success && j.result && j.result.records;
    if (!Array.isArray(recs) || !recs.length) return false;
    const now = Date.now(), old = new Map(this.rows("SELECT k, d FROM board").map((x) => [x.k, JSON.parse(x.d)])), fresh = new Map();
    for (const rec of recs) { const f = norm(rec); if (f) fresh.set(f.k, f); }
    const sql = this.ctx.storage.sql;
    for (const f of fresh.values()) {
      sql.exec("INSERT INTO board (k, d, upd) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET d = excluded.d, upd = excluded.upd", f.k, JSON.stringify(f), now);
      sql.exec("INSERT INTO hist (k, day, al, num, dir, code, delay, cancel, final) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(k) DO UPDATE SET delay = excluded.delay, cancel = excluded.cancel, final = excluded.final",
        f.k, f.sched.slice(0, 10), f.al, f.num, f.dir, f.code, Math.max(0, mins(f.sched, f.est)), /CANCEL/.test(f.st) ? 1 : 0, done(f) ? 1 : 0);
    }
    // Flights that left the board more than two days ago; history is kept for 120 days.
    sql.exec("DELETE FROM board WHERE upd < ?", now - 2 * 864e5);
    sql.exec("DELETE FROM hist WHERE day < ?", new Date(now - 120 * 864e5).toISOString().slice(0, 10));
    await this.ctx.storage.put("at", now);
    await this.notify(old, fresh);
    return true;
  }

  /** What changed on the flights people follow, as one message per phone. */
  async notify(old, fresh) {
    const subs = this.rows("SELECT id, endpoint, keys FROM subs");
    if (!subs.length) return;
    const v = await vapidKeys(this.ctx.storage);
    for (const s of subs) {
      const lines = []; let last = "";
      for (const k of JSON.parse(s.keys || "[]")) {
        const a = old.get(k), b = fresh.get(k); if (!a || !b) continue;
        const before = lines.length;
        const name = b.al + b.num + " " + (b.dir === "D" ? "ל" : "מ") + (b.city || b.code);
        if (a.st !== b.st && b.st) {
          if (/CANCEL/.test(b.st)) lines.push("❌ " + name + " בוטלה. ייתכן שמגיע לך פיצוי.");
          else if (/LANDED/.test(b.st)) lines.push("🛬 " + name + " נחתה ב־" + hm(b.est) + (b.term ? " · טרמינל " + b.term : ""));
          else if (/DEPARTED/.test(b.st)) lines.push("🛫 " + name + " המריאה ב־" + hm(b.est));
          else if (/DELAY/.test(b.st)) lines.push("⏳ " + name + " מתעכבת: " + hm(b.est) + " במקום " + hm(b.sched));
          else if (/FINAL/.test(b.st) && b.dir === "A") lines.push("🛬 " + name + " בנחיתה, צפויה ב־" + hm(b.est));
          else if (b.sth) lines.push("✈️ " + name + ": " + b.sth);
        } else if (Math.abs(mins(a.est, b.est)) >= 15) lines.push("🕒 " + name + ": שעה חדשה " + hm(b.est) + " (היה " + hm(a.est) + ")");
        if (lines.length > before) last = k;
      }
      if (!lines.length) continue;
      const msg = { title: lines.length === 1 ? lines[0].split(" ").slice(0, 2).join(" ") + " עדכון טיסה" : "עדכון ב־" + lines.length + " טיסות", body: lines.join("\n"), url: "/#mine" };
      if (lines.length === 1) { msg.title = lines[0]; msg.body = "לחיצה פותחת את הטיסה"; msg.url = "/#f=" + encodeURIComponent(last); }
      this.ctx.storage.sql.exec("UPDATE subs SET msg = ? WHERE id = ?", JSON.stringify(msg), s.id);
      if (!(await wake(v, s.endpoint, "https://tisa.hania360.com"))) this.ctx.storage.sql.exec("DELETE FROM subs WHERE id = ?", s.id);
    }
  }

  async ensureAlarm() { if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + 5000); }
  async alarm() {
    await this.refresh().catch(() => false);
    // Keeps collecting while anyone used the app in the last two weeks.
    const seen = (await this.ctx.storage.get("seen")) || 0;
    if (Date.now() - seen < 14 * 864e5) await this.ctx.storage.setAlarm(Date.now() + EVERY);
  }

  async board() {
    const at = (await this.ctx.storage.get("at")) || 0;
    if (Date.now() - at > 20 * 60 * 1000) await this.refresh().catch(() => false);
    return { at: (await this.ctx.storage.get("at")) || 0, flights: this.rows("SELECT d FROM board").map((x) => JSON.parse(x.d)) };
  }

  stats(al, num, dir) {
    const since = new Date(Date.now() - 45 * 864e5).toISOString().slice(0, 10);
    const sum = (rows) => { const n = rows.length; if (!n) return null; const late = rows.filter((r) => r.delay >= 30 && !r.cancel).length, cancel = rows.filter((r) => r.cancel).length, ok = rows.filter((r) => !r.cancel);
      const delays = ok.map((r) => r.delay).sort((a, b) => a - b); return { n, late, cancel, onTime: n - late - cancel, median: delays.length ? delays[delays.length >> 1] : 0, big: ok.filter((r) => r.delay >= 180).length }; };
    const flight = this.rows("SELECT delay, cancel FROM hist WHERE al = ? AND num = ? AND dir = ? AND final = 1 AND day >= ?", al, num, dir, since);
    const airline = this.rows("SELECT delay, cancel FROM hist WHERE al = ? AND final = 1 AND day >= ?", al, since);
    const first = this.rows("SELECT MIN(day) AS d FROM hist")[0];
    return { flight: sum(flight), airline: sum(airline), since: (first && first.d) || "" };
  }

  async fetch(req) {
    const url = new URL(req.url), p = url.pathname;
    if (p.startsWith("/me/")) return this.me(req, p);
    await this.ctx.storage.put("seen", Date.now()); await this.ensureAlarm();
    if (p === "/api/tisa/board") return json(await this.board(), 200, { "cache-control": "public, max-age=60" });
    if (p === "/api/tisa/stats") {
      const al = (url.searchParams.get("al") || "").slice(0, 4), num = (url.searchParams.get("num") || "").slice(0, 6), dir = url.searchParams.get("dir") === "A" ? "A" : "D";
      if (!/^[A-Z0-9]{2,3}$/.test(al)) return json({ error: "al" }, 400);
      return json(this.stats(al, num, dir), 200, { "cache-control": "public, max-age=600" });
    }
    if (p === "/api/tisa/key") return json({ key: (await vapidKeys(this.ctx.storage)).pub });
    if (req.method !== "POST") return json({ error: "method" }, 405);
    const b = await req.json().catch(() => null);
    if (!b || !okEndpoint(b.endpoint)) return json({ error: "endpoint" }, 400);
    const id = await subId(b.endpoint);
    if (p === "/api/tisa/sub") {
      const keys = (Array.isArray(b.keys) ? b.keys : []).filter((k) => typeof k === "string" && /^[AD]\|[A-Z0-9]{2,3}\|[0-9A-Z]{1,6}\|\d{4}-\d{2}-\d{2}$/.test(k)).slice(0, 20);
      if (!keys.length) { this.ctx.storage.sql.exec("DELETE FROM subs WHERE id = ?", id); return json({ ok: true, keys: 0 }); }
      this.ctx.storage.sql.exec("INSERT INTO subs (id, endpoint, keys, msg, at) VALUES (?, ?, ?, '', ?) ON CONFLICT(id) DO UPDATE SET endpoint = excluded.endpoint, keys = excluded.keys, at = excluded.at", id, b.endpoint, JSON.stringify(keys), Date.now());
      return json({ ok: true, keys: keys.length });
    }
    if (p === "/api/tisa/msg") { const r = this.rows("SELECT msg FROM subs WHERE id = ?", id)[0]; return json(r && r.msg ? JSON.parse(r.msg) : {}); }
    return json({ error: "not found" }, 404);
  }

  // Called only by meApi below, with the user already checked; never reachable from a browser.
  async me(req, p) {
    const user = req.headers.get("x-hania-user") || ""; if (!user) return json({ error: "user" }, 400);
    const row = this.rows("SELECT flights, cars FROM acct WHERE user = ?", user)[0] || { flights: "[]", cars: "[]" };
    const flights = JSON.parse(row.flights), cars = JSON.parse(row.cars);
    if (p === "/me/get") return json({ flights, cars });
    if (p === "/me/summary") {
      const today = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10), board = new Map(this.rows("SELECT k, d FROM board").map((x) => [x.k, JSON.parse(x.d)]));
      return json({ flights: flights.filter((k) => k.slice(-10) >= today || board.has(k)).map((k) => board.get(k) || { k, gone: true }).slice(0, 10), cars });
    }
    const b = await req.json().catch(() => null) || {};
    if (p === "/me/flights") { const keys = (Array.isArray(b.keys) ? b.keys : []).filter((k) => typeof k === "string" && /^[AD]\|[A-Z0-9]{2,3}\|[0-9A-Z]{1,6}\|\d{4}-\d{2}-\d{2}$/.test(k)).slice(0, 30);
      this.ctx.storage.sql.exec("INSERT INTO acct (user, flights, upd) VALUES (?, ?, ?) ON CONFLICT(user) DO UPDATE SET flights = excluded.flights, upd = excluded.upd", user, JSON.stringify(keys), Date.now()); return json({ ok: true, flights: keys }); }
    if (p === "/me/cars") { const list = (Array.isArray(b.cars) ? b.cars : []).filter((c) => c && /^\d{5,8}$/.test(String(c.p))).map((c) => ({ p: String(c.p), t: String(c.t || "").slice(0, 60) })).slice(0, 6);
      this.ctx.storage.sql.exec("INSERT INTO acct (user, cars, upd) VALUES (?, ?, ?) ON CONFLICT(user) DO UPDATE SET cars = excluded.cars, upd = excluded.upd", user, JSON.stringify(list), Date.now()); return json({ ok: true, cars: list }); }
    return json({ error: "not found" }, 404);
  }
}

/** /api/me/* on tisa.hania360.com and check.hania360.com: the signed-in person's flights and cars. */
export async function meApi(req, env, ctx) {
  const url = new URL(req.url), p = url.pathname, cors = hanCors(req.headers.get("origin"));
  const reply = (body, status = 200) => { const r = json(body, status); if (cors) for (const [k, v] of Object.entries(cors)) r.headers.set(k, v); return r; };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors ? { ...cors, "access-control-allow-methods": "GET", "access-control-max-age": "600" } : {} });
  if (!env.TISA) return reply({ available: false });
  const user = await passUser(req, env);
  if (user === undefined) return reply({ available: false });
  if (!user) return reply({ available: true, signedIn: false });
  const hub = env.TISA.get(env.TISA.idFromName("board")), call = (path, body) => hub.fetch(new Request("https://hub" + path, { method: body ? "POST" : "GET", headers: { "x-hania-user": user.id, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined })).then((r) => r.json());
  if (p === "/api/me" && req.method === "GET") return reply(Object.assign({ available: true, signedIn: true, email: user.email }, await call("/me/get")));
  if (p === "/api/me/summary") {
    const s = await call("/me/summary");
    s.cars = await Promise.all((s.cars || []).map((c) => carFacts(c, ctx)));
    return reply(Object.assign({ available: true, signedIn: true }, s));
  }
  // Changes come only from the app's own page: a cookie alone is not enough.
  if (req.method !== "POST" || req.headers.get("origin") !== url.origin) return reply({ error: "origin" }, 403);
  if (p === "/api/me/flights" || p === "/api/me/cars") return reply(await call(p.slice(4), await req.json().catch(() => ({}))));
  return reply({ error: "not found" }, 404);
}

/** Licence date and open recalls of a saved car, from the Ministry of Transport (cached half a day). */
async function carFacts(c, ctx) {
  const get = async (rid, f) => {
    const u = "https://data.gov.il/api/3/action/datastore_search?resource_id=" + rid + "&limit=5&filters=" + encodeURIComponent(JSON.stringify(f)), key = new Request(u), cache = caches.default;
    let r = await cache.match(key);
    if (!r) { const x = await fetch(u, { headers: { accept: "application/json", "user-agent": "HaniaCheck/1 (+https://check.hania360.com)" } }).catch(() => null); if (!x || !x.ok) return null; r = new Response(await x.text(), { headers: { "content-type": "application/json", "cache-control": "public, max-age=43200" } }); ctx && ctx.waitUntil && ctx.waitUntil(cache.put(key, r.clone())); }
    const j = await r.json().catch(() => null); return j && j.success ? j.result.records || [] : null;
  };
  const n = +c.p, [car, rec] = await Promise.all([get("053cea08-09bc-40ec-8f7a-156f0677aff3", { mispar_rechev: n }), get("36bf1404-0be4-49d2-82dc-2f1ead4a8b93", { MISPAR_RECHEV: n })]);
  const row = car && car[0];
  return { p: c.p, t: c.t || (row ? [row.tozeret_nm, row.kinuy_mishari].filter(Boolean).join(" ") : ""), tokef: row ? String(row.tokef_dt || "").slice(0, 10) : "", recalls: rec ? rec.length : 0, recall: rec && rec[0] ? String(rec[0].SUG_TAKALA || rec[0].TEUR_TAKALA || "") : "" };
}

export async function tisaApi(req, env, url) {
  if (!env.TISA) return json({ error: "unavailable" }, 503);
  const clean = new Request(req); clean.headers.delete("x-hania-user");
  return env.TISA.get(env.TISA.idFromName("board")).fetch(clean);
}
