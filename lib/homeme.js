// "היום שלך" at the top of hania360.com: one panel with what matters today, for everyone who comes back.
// GET /api/home?c=<town> (same origin) answers with:
//   day  – the Hebrew date, the coming Shabbat or holiday in the visitor's town (the page sends only the town:
//          its number in CITIES, or "g:lat,lon,minutes,name" for a place picked by GPS; else Jerusalem),
//          and "rest" while it is Shabbat or a holiday there (then the page shows only when it ends);
//   me   – only when signed in to Hania Pass: today's lines from Hania Today, the next reminders from every app
//          (the reminders hub), and each child's stars and chores today (their own HaniaSync backup).
// The server never reads the h360_i cookie (the privacy page promises that): the page itself reads it, sends the
// town, and lays out "the apps you opened last" on its own. Nothing is stored; the personal part is kept for a
// minute per person so a reload costs nothing.
import { CITIES } from "./cities.js";
import { HUBS, HUB_OF } from "./hub.js";
import { WORLDS } from "../now/map.js";
import { PREF_JS } from "./growth.js";
import { feedbackBadge } from "./feedback.js";
import { evening, hebDate, nextHoliday, parasha, addDay, ilYmd, ilHm } from "../now/widget.js";

const json = (o, init) => new Response(JSON.stringify(o), { status: (init && init.status) || 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store" } });
const cut = (s, n) => { s = String(s == null ? "" : s).replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// ---------- the town and the holy days ----------
/** The town the page sent: a number in CITIES, or "g:lat,lon,minutes,name" for a place in Israel picked by GPS. */
export function townOf(q) {
  q = String(q || "");
  if (/^\d{1,3}$/.test(q) && CITIES[+q]) return CITIES[+q];
  const m = /^g:(-?[\d.]+),(-?[\d.]+),(\d{1,2}),(.{1,40})$/.exec(q);
  if (m) { const lat = +m[1], lon = +m[2]; if (lat > 29 && lat < 33.6 && lon > 34 && lon < 36) return [cut(m[4], 24), lat, lon, Math.min(40, Math.max(18, +m[3]))]; }
  return CITIES[0];
}
// Yom tov in Israel (one day each), by the Hebrew date of the daytime
const YT = { "Tishri 1": "ראש השנה", "Tishri 2": "ראש השנה", "Tishri 10": "יום כיפור", "Tishri 15": "סוכות", "Tishri 22": "שמחת תורה", "Nisan 15": "פסח", "Nisan 21": "שביעי של פסח", "Sivan 6": "שבועות" };
const HF = new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long", timeZone: "UTC" });
/** "שבת", a holiday's name, or "" for the Israeli calendar day `day` (YYYY-MM-DD). */
export function holyDay(day) {
  const t = new Date(day + "T12:00:00Z"), p = HF.formatToParts(t);
  const yt = YT[(p.find((x) => x.type === "month") || {}).value + " " + (p.find((x) => x.type === "day") || {}).value];
  return yt || (t.getUTCDay() === 6 ? "שבת" : "");
}
const lightOn = (day, c) => evening(day, c[1], c[2], 0.833) - c[3] * 60e3; // candle lighting: sunset minus the town's minutes
const outOn = (day, c) => evening(day, c[1], c[2], 8.5); // the end: 8.5° below the horizon
const lastOf = (day) => { let d = day; for (let i = 0; i < 3 && holyDay(addDay(d, 1)); i++) d = addDay(d, 1); return d; };
/** Shabbat or a holiday now in this town: { name, until } or null. */
export function restNow(now, c) {
  const today = ilYmd(now), h = holyDay(today), tom = addDay(today, 1), ht = holyDay(tom);
  if (h && now < outOn(today, c)) return { name: h, until: outOn(lastOf(today), c) };
  if (ht && now >= lightOn(today, c)) return { name: ht, until: outOn(lastOf(tom), c) };
  return null;
}
/** The next candle lighting (within ten days) and when that Shabbat or holiday ends. */
export function nextHoly(now, c) {
  const today = ilYmd(now);
  for (let i = 0; i < 10; i++) {
    const d = addDay(today, i), n = addDay(d, 1);
    if (!holyDay(n) || holyDay(d)) continue;
    const lit = lightOn(d, c);
    if (lit < now) continue;
    const names = []; for (let x = n; holyDay(x) && names.length < 4; x = addDay(x, 1)) { names.push(holyDay(x)); if (new Date(x + "T12:00:00Z").getUTCDay() === 6) names.push("שבת"); }
    return { lit, out: outOn(lastOf(n), c), in: i, wd: new Date(d + "T12:00:00Z").getUTCDay(), names: [...new Set(names)] };
  }
  return null;
}
const whenDay = (i, wd) => (i === 0 ? "היום" : i === 1 ? "מחר" : "ביום " + DAYS[wd]);

export async function dayInfo(now, c) {
  const today = ilYmd(now), wd = new Date(today + "T12:00:00Z").getUTCDay(), rest = restNow(now, c);
  const hour = +new Date(now).toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Jerusalem" }) % 24;
  const hello = rest ? (rest.name === "שבת" ? "שבת שלום" : "חג שמח") : hour >= 5 && hour < 12 ? "בוקר טוב" : hour >= 12 && hour < 17 ? "צהריים טובים" : hour >= 17 && hour < 22 ? "ערב טוב" : "לילה טוב";
  const o = { city: c[0], today, day: "יום " + DAYS[wd], heb: hebDate(now), greg: new Date(now).toLocaleDateString("he-IL", { day: "numeric", month: "long", timeZone: "Asia/Jerusalem" }), hello };
  if (rest) { o.rest = { name: rest.name, until: ilHm(rest.until), at: rest.until }; return o; }
  const nh = nextHoly(now, c);
  if (nh) {
    const isShab = nh.names.length === 1 && nh.names[0] === "שבת";
    const par = isShab ? await parasha().catch(() => "") : "";
    o.holy = { name: isShab ? "שבת" + (par ? " פרשת " + par : "") : nh.names.filter((x) => x !== "שבת").join(" ו") + (nh.names.includes("שבת") ? " ושבת" : ""),
      when: whenDay(nh.in, nh.wd), lit: ilHm(nh.lit), out: ilHm(nh.out), chag: !isShab };
  }
  const ch = nextHoliday(now);
  if (ch && ch.days <= 21) o.chag = ch;
  return o;
}

// ---------- the apps this browser opened ----------
const AINFO = (() => {
  const m = {};
  for (const [hub, h] of Object.entries(HUBS)) {
    m[hub] = [(WORLDS.find((w) => w.k === hub) || {}).e || "✨", h.he, "https://" + hub + ".hania360.com/"];
    for (const a of h.apps) m[a[0]] = [a[1], a[2], "https://" + hub + ".hania360.com/#" + a[0]];
  }
  for (const w of WORLDS) for (const a of w.apps.concat(w.more ? [w.more] : [])) {
    let u; try { u = new URL(a[3]); } catch { continue; }
    const key = u.hostname.split(".")[0];
    if (!HUBS[key] && !m[key] && /\.hania360\.com$/.test(u.hostname)) m[key] = [a[0], a[1], "https://" + u.hostname + "/"];
  }
  return m;
})();
const SHORT = { sky: "השמיים", party: "מסיבה", globe: "כדור הארץ", eretz: "ארץ ישראל", frame: "מסגרת", tv: "טלוויזיה", layla: "לילה טוב", play: "משחקי ערב", sport: "ספורט", tisa: "טיסות", go: "טיולים", park: "חניה", save: "הטבות", check: "בדיקות", stock: "מניות", daber: "אנגלית", cart: "קניות", hazmana: "הזמנות", today: "Today" };
// app key (as the apps write it in h360_i "a") → [emoji, short name, address], for the page
export const TILES = Object.fromEntries(Object.entries(AINFO).map(([k, i]) => [k, [i[0], SHORT[k] || i[1].replace(/^Hania(?=[A-Z])/, ""), i[2]]]));

// ---------- the signed-in part ----------
/** Today (Hania Pass) → a few lines, most pressing first: [emoji, text, sub, url]. */
export function todayLines(d, now) {
  const out = [], day = ilYmd(now), nowHm = ilHm(now), TODAY = "https://today.hania360.com/";
  const when = (n) => (n === 0 ? "היום" : n === 1 ? "מחר" : "בעוד " + n + " ימים");
  const cal = ((d.calendar && d.calendar.today) || []).filter((e) => e.allDay || !e.time || e.time >= nowHm).map((e) => [e.allDay ? "" : e.time, "📅", cut(e.title, 50)]);
  const notes = ((d.notes && d.notes.today) || []).filter((n) => !n.done && (!n.time || n.time >= nowHm)).map((n) => [n.time || "", "📝", cut(n.text, 50)]);
  for (const x of cal.concat(notes).sort((a, b) => (a[0] || "99").localeCompare(b[0] || "99"))) out.push([x[1], x[2], x[0] || "היום", TODAY]);
  const tasks = ((d.tasks && d.tasks.tasks) || []).filter((t) => !t.done && t.mine && (!t.day || t.day <= day));
  // a task carries its id, so it can be ticked off right on the homepage (see homeTaskApi)
  for (const t of tasks.slice(0, 3)) out.push(["📌", cut(t.text, 50), t.late ? "באיחור" : "משימה להיום", TODAY, /^[A-Za-z0-9]{1,20}$/.test(String(t.id || "")) ? String(t.id) : ""]);
  if (tasks.length > 3) out.push(["📌", "ועוד " + (tasks.length - 3) + " משימות", "", TODAY]);
  for (const b of ((d.gil && d.gil.birthdays) || []).filter((x) => x.days <= 7).slice(0, 2)) out.push(["🎂", cut(b.name, 24) + (b.days === 0 ? " חוגג/ת היום!" : " · יום הולדת" + (b.age ? " " + b.age : "")), when(b.days), "https://bayit.hania360.com/#gil"]);
  for (const v of ((d.save && d.save.expiring) || []).filter((x) => x.days <= 7).slice(0, 2)) out.push(["🎟️", "שובר " + cut(v.store, 22) + (v.balance ? " · ₪" + Math.round(v.balance) : ""), "פג " + when(v.days), "https://save.hania360.com/"]);
  for (const r of (d.repeats || []).filter((x) => x.due === 0).slice(0, 2)) out.push(["🔁", cut(r.title, 50), "היום", TODAY]);
  return out;
}
/** The reminders hub's lists → the next few reminders in the coming two days, and how many lists are on. */
export function nextReminders(list, now) {
  const items = [];
  for (const r of list || []) {
    if (r.pause) continue;
    for (const it of r.next || []) if (it.t > now && it.t < now + 48 * 3600e3) items.push({ t: it.t, label: cut(it.label, 60), host: r.host || "" });
  }
  items.sort((a, b) => a.t - b.t);
  const seen = new Set(), next = [];
  for (const it of items) { const k = it.t + it.label; if (seen.has(k)) continue; seen.add(k); next.push(it); if (next.length >= 3) break; }
  return { n: (list || []).filter((r) => !r.pause && r.count).length, next: next.map((x) => ({ t: x.t, label: x.label, url: /^[a-z0-9-]+\.hania360\.com$/.test(x.host) ? "https://" + x.host + "/" : "https://hania360.com/reminders" })) };
}
// HaniaShigra and HaniaMatalot keep their whole state in one localStorage key each, backed up in HaniaSync
const weekNo = (day) => { const t = new Date(day + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() - t.getUTCDay()); return Math.floor(t.getTime() / (7 * 864e5)); };
export function kidsToday(shigra, matalot, day) {
  const kids = [], by = (name) => { let k = kids.find((x) => x.name === name); if (!k) { k = { name, av: "⭐" }; kids.push(k); } return k; };
  if (shigra && Array.isArray(shigra.kids)) {
    const st = (shigra.stars || {})[day] || {}, runs = (shigra.runs || {})[day] || {};
    let week = {}; for (let i = 0; i < 7; i++) { const o = (shigra.stars || {})[addDay(day, -i)] || {}; for (const id in o) week[id] = (week[id] || 0) + Math.max(0, +o[id] || 0); }
    for (const s of shigra.kids.slice(0, 8)) {
      if (!s || !s.name) continue; const k = by(cut(s.name, 16));
      k.av = cut(s.av, 8) || k.av; k.stars = Math.max(0, +st[s.id] || 0); k.week = week[s.id] || 0;
      k.am = !!(runs["morning:" + s.id] && runs["morning:" + s.id].fin); k.pm = !!(runs["evening:" + s.id] && runs["evening:" + s.id].fin);
    }
  }
  if (matalot && Array.isArray(matalot.kids) && Array.isArray(matalot.chores)) {
    const wd = new Date(day + "T12:00:00Z").getUTCDay(), L = (matalot.log || {})[day] || {}, live = new Set(matalot.kids.map((k) => k.id));
    const whoFor = (c) => { const w = (c.who || []).filter((id) => live.has(id)); if (!w.length || !c.rot) return w; const i = matalot.chores.indexOf(c); return [w[((weekNo(day) + i) % w.length + w.length) % w.length]]; };
    for (const m of matalot.kids.slice(0, 8)) {
      if (!m || !m.name) continue;
      const mine = matalot.chores.filter((c) => (c.once ? c.once === day : (c.days || []).includes(wd)) && whoFor(c).includes(m.id));
      if (!mine.length) continue;
      const k = by(cut(m.name, 16)); if (k.av === "⭐") k.av = cut(m.av, 8) || "🧹";
      k.chores = [mine.filter((c) => { const e = L[c.id + "|" + m.id]; return e && (e.st === "ok" || e.st === "d"); }).length, mine.length];
      k.wait = mine.filter((c) => { const e = L[c.id + "|" + m.id]; return e && e.st === "d"; }).length;
    }
  }
  return kids.slice(0, 6);
}
async function syncState(stub, app, key) {
  const r = await (await stub.fetch("https://sync/get?app=" + app)).json().catch(() => null), v = r && r.keys && r.keys[key];
  if (!v || typeof v[0] !== "string") return null;
  try { return JSON.parse(v[0]); } catch { return null; }
}
async function sha(t) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)); return [...new Uint8Array(b)].slice(0, 16).map((x) => x.toString(16).padStart(2, "0")).join(""); }

async function mePart(request, env, now, passUser) {
  if (!env.PASS) return null;
  // only the Hania Pass session goes on to Pass, none of the other cookies
  const m = /(?:^|;\s*)hp_session=([^;]+)/.exec(request.headers.get("cookie") || "");
  if (!m) return null;
  const tr = await env.PASS.fetch("https://pass.internal/api/today", { headers: { cookie: "hp_session=" + m[1] } }).catch(() => null);
  const d = tr && tr.ok ? await tr.json().catch(() => null) : null;
  if (!d || !d.signedIn) return null;
  const who = d.user && d.user.id ? { id: String(d.user.id) } : await passUser(request, env).catch(() => null);
  const me = { name: cut((d.user && d.user.displayName) || "", 20).split(" ")[0], lines: todayLines(d, now).slice(0, 6), rem: null, kids: [] };
  if (!who) return me;
  const ck = new Request("https://hania360.com/home-me/v1/" + await sha(who.id + "|" + ilYmd(now))), hit = await caches.default.match(ck).catch(() => null);
  let extra = hit ? await hit.json().catch(() => null) : null;
  if (!extra) {
    extra = { rem: null, kids: [] };
    await Promise.all([
      (async () => {
        if (!env.SHABBAT) return;
        const r = await env.SHABBAT.get(env.SHABBAT.idFromName("hub")).fetch("https://hania360.com/api/shabbat/mine", { headers: { "x-hania-uid": who.id, "x-hania-host": "hania360.com" } });
        if (r.ok) extra.rem = nextReminders(((await r.json()) || {}).list, now);
      })().catch(() => {}),
      (async () => {
        if (!env.SYNC) return;
        const stub = env.SYNC.get(env.SYNC.idFromName("u:" + who.id));
        const list = ((await (await stub.fetch("https://sync/list")).json()) || {}).apps || [];
        const has = (a) => list.some((x) => x.app === a);
        const [s, m] = await Promise.all([has("shigra") ? syncState(stub, "shigra", "haniashigra-v1") : null, has("matalot") ? syncState(stub, "matalot", "matalot-v1") : null]);
        extra.kids = kidsToday(s, m, ilYmd(now));
      })().catch(() => {})
    ]);
    await caches.default.put(ck, new Response(JSON.stringify(extra), { headers: { "cache-control": "max-age=60" } })).catch(() => {});
  }
  // a reminder already gone by while it was kept drops off
  if (extra.rem) extra.rem.next = extra.rem.next.filter((x) => x.t > now);
  // the owner sees how many messages from "משוב ובעיות" are waiting (everyone else: nothing, and no extra call to Pass)
  const fb = await feedbackBadge(env, who.id).catch(() => 0);
  return Object.assign(me, extra, fb ? { fb } : {});
}

// POST /api/home/task {op:"add", text} or {op:"done", id, done}: a task added or ticked off from the homepage panel,
// passed on to Hania Today in Hania Pass with the person's own session and CSRF token (the page reads hp_csrf, which
// Pass shares with every hania360.com site). Only from this site's own pages (Origin), like Pass itself requires.
export async function homeTaskApi(request, env) {
  const no = (e, s) => json({ error: e }, { status: s || 400 });
  if (request.method !== "POST") return no("method", 405);
  const self = new URL(request.url).origin;
  if (request.headers.get("origin") !== self) return no("origin", 403);
  const m = /(?:^|;\s*)hp_session=([^;]+)/.exec(request.headers.get("cookie") || ""), csrf = request.headers.get("x-csrf-token") || "";
  if (!env.PASS || !m || !/^[A-Za-z0-9_-]{8,200}$/.test(csrf)) return no("signin", 401);
  const b = (await request.json().catch(() => null)) || {};
  let path, body;
  if (b.op === "add") { const t = cut(b.text, 80); if (!t) return no("text"); path = "task-add"; body = { text: t, day: ilYmd(Date.now()), assignee: "", shared: false }; }
  else if (b.op === "done") { const id = String(b.id || ""); if (!/^[A-Za-z0-9]{1,20}$/.test(id)) return no("id"); path = "task-done"; body = { id, done: b.done !== false }; }
  else return no("op");
  const r = await env.PASS.fetch("https://pass.internal/api/daily/" + path, { method: "POST", body: JSON.stringify(body),
    headers: { origin: "https://pass.internal", "content-type": "application/json", cookie: "hp_session=" + m[1], "x-csrf-token": csrf } }).catch(() => null);
  if (!r) return no("pass", 502);
  if (!r.ok) return r.status === 401 || r.status === 403 ? no("signin", 401) : no("pass", 502);
  return json({ ok: true });
}

export async function homeApi(request, env, passUser) {
  const now = Date.now();
  const c = townOf(new URL(request.url).searchParams.get("c")), day = await dayInfo(now, c);
  const out = { day, me: null, signin: "https://pass.hania360.com/?return=" + encodeURIComponent("https://hania360.com/") };
  // on Shabbat and holidays the panel stays quiet: no tasks, no reminders
  if (!day.rest) out.me = await mePart(request, env, now, passUser).catch(() => null);
  return json(out);
}

// ---------- on the page ----------
export const ME_HTML = `<section class="y26" id="me" aria-label="היום שלך" hidden></section>`;
export const ME_CSS = `
.y26{max-width:980px;margin:18px auto 0;background:linear-gradient(160deg,#ffffff 0%,#F5F3FF 100%);border:1px solid rgba(98,62,249,.16);border-radius:24px;padding:16px 16px 14px;box-shadow:0 18px 40px -30px rgba(76,29,149,.55);display:grid;gap:12px;text-align:right}
.y26[hidden]{display:none}
.y26-hd{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap}
.y26-hd h2{margin:0;font:800 21px/1.25 Rubik,system-ui,sans-serif;color:#1E1B4B}
.y26-hd span{color:#64748B;font-size:13.5px}
.y26-holy{display:flex;align-items:center;gap:10px;background:#1E1B4B;color:#fff;border-radius:16px;padding:10px 12px;text-decoration:none}
.y26-holy .e{font-size:22px}.y26-holy b{display:block;font-size:15px}.y26-holy small{display:block;color:#C7D2FE;font-size:13px;margin-top:1px}
.y26-holy .tm{margin-inline-start:auto;text-align:center;font:800 18px/1.1 Rubik,system-ui,sans-serif;font-variant-numeric:tabular-nums}.y26-holy .tm small{font-weight:600;font-size:11px}
.y26-city{background:none;border:0;color:#C7D2FE;font:inherit;font-size:12.5px;text-decoration:underline dotted;padding:0;cursor:pointer}
.y26-sel{font:inherit;font-size:14px;border-radius:10px;border:1px solid #C7D2FE;padding:6px 8px;max-width:100%}
.y26-rest{background:radial-gradient(circle at 80% 0,#312E81,#1E1B4B);color:#fff;border-radius:18px;padding:18px;text-align:center;display:grid;gap:4px}
.y26-rest b{font:800 24px/1.2 Rubik,system-ui,sans-serif}.y26-rest span{color:#C7D2FE}
.y26-l{display:grid;gap:6px;margin:0;padding:0;list-style:none}
.y26-l a{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid rgba(15,23,42,.07);border-radius:14px;padding:9px 12px;color:#0F172A;text-decoration:none;min-height:44px;box-sizing:border-box}
.y26-l .e{font-size:19px;width:24px;text-align:center;flex:none}.y26-l .t{flex:1;min-width:0;font-size:15px;line-height:1.3;overflow-wrap:anywhere}
.y26-l .s{flex:none;color:#6D28D9;font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums}.y26-l .s.late{color:#DC2626}
.y26-l li.tk{display:flex;gap:6px;align-items:stretch}.y26-l li.tk a{flex:1;min-width:0}
.y26-ck{flex:none;width:44px;border-radius:14px;border:1px solid rgba(15,23,42,.1);background:#fff;font-size:18px;color:#16A34A;cursor:pointer}
.y26-ck[aria-pressed="true"]{background:#DCFCE7}.y26-l li.tk.dn a .t{text-decoration:line-through;color:#64748B}
.y26-add{display:flex;gap:6px}.y26-add input{flex:1;min-width:0;font:inherit;font-size:15px;border:1px dashed rgba(98,62,249,.35);background:#fff;border-radius:14px;padding:9px 12px}
.y26-add button{flex:none;border:0;border-radius:14px;background:#6D28D9;color:#fff;font:inherit;font-weight:800;padding:0 14px;cursor:pointer}
.y26-toast{position:fixed;bottom:calc(18px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);background:#1E1B4B;color:#fff;border-radius:14px;padding:10px 14px;font-size:14px;z-index:90;display:flex;gap:12px;align-items:center;max-width:92vw}
.y26-toast button{background:none;border:0;color:#C4B5FD;font:inherit;font-weight:800;cursor:pointer;padding:0}
.y26-k{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.y26-k a{display:grid;gap:3px;background:#fff;border:1px solid rgba(15,23,42,.07);border-radius:16px;padding:10px 12px;color:#0F172A;text-decoration:none}
.y26-k .n{font-weight:800;font-size:15px}.y26-k .n i{font-style:normal;font-size:20px;margin-inline-end:4px}
.y26-k .r{display:flex;gap:6px;flex-wrap:wrap;font-size:12.5px;color:#475569}.y26-k .r span{background:#F1F5F9;border-radius:999px;padding:2px 8px}.y26-k .r .on{background:#DCFCE7;color:#166534}.y26-k .r .w{background:#FEF3C7;color:#92400E}
.y26-h{margin:2px 0 -4px;font-size:13px;font-weight:800;color:#6D28D9;letter-spacing:.01em}
.y26-a{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}.y26-a::-webkit-scrollbar{display:none}
.y26-a a{flex:none;width:76px;display:grid;justify-items:center;align-content:start;gap:4px;color:#0F172A;text-decoration:none;font-size:12px;text-align:center;line-height:1.2}
.y26-a a span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.y26-a a i{font-style:normal;font-size:24px;width:52px;height:52px;display:grid;place-items:center;background:#fff;border:1px solid rgba(98,62,249,.14);border-radius:16px;box-shadow:0 6px 14px -12px rgba(76,29,149,.6)}
.y26-f{display:flex;gap:8px;flex-wrap:wrap}
.y26-f a{display:inline-flex;align-items:center;gap:6px;background:#EDE9FE;color:#4C1D95;border-radius:999px;padding:8px 13px;font-size:13.5px;font-weight:700;text-decoration:none}
.y26-f a.p{background:linear-gradient(90deg,#6D28D9,#2563EB);color:#fff}
.y26-sk{height:64px;border-radius:16px;background:linear-gradient(90deg,#EEF2FF,#F8FAFC,#EEF2FF);background-size:200% 100%;animation:y26s 1.2s infinite linear}
@keyframes y26s{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.y26-sk{animation:none}}
@media (min-width:760px){.y26{padding:20px 22px 18px}.y26-hd h2{font-size:24px}}
.y26-back .h26-hero h1,.y26-back .h26-lead,.y26-back #heroNote{display:none}
.y26-back .h26-hero{padding-top:14px}.y26-back .y26-sk{height:240px}
body:has(#me .y26-l) #todayCard{display:none!important}
`;
// The panel draws itself from /api/home; if that fails it simply stays hidden.
export const ME_JS = `<script>${PREF_JS}(function(){var el=document.getElementById("me");if(!el||!window.fetch)return;
var E=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var CITIES=${JSON.stringify(CITIES)},AP=${JSON.stringify(TILES)},po={};try{po=h360pref()}catch(e){}
// the town and the recent apps come from this browser's own h360_i; only the town goes to the server
function townQ(){var c=po.c;if(!c||!c[0])return"";for(var i=0;i<CITIES.length;i++)if(CITIES[i][0]===c[0])return String(i);if(+c[1]&&+c[2])return "g:"+(+c[1])+","+(+c[2])+","+Math.round(+c[3]||18)+","+String(c[0]).slice(0,40);return""}
function apps(){var out=[],seen={};(po.a||[]).slice(0,12).forEach(function(k){var i=AP[k];if(!i||seen[i[2]]||out.length>=8)return;seen[i[2]]=1;out.push(i)});return out}
function hm(t){return new Date(t).toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Jerusalem"})}
function dayOf(t){var a=new Date(t).toLocaleDateString("en-CA",{timeZone:"Asia/Jerusalem"}),b=new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Jerusalem"});return a===b?"היום":"מחר"}
function draw(o){var d=o.day||{},me=o.me,h="";
 h+='<div class="y26-hd"><h2>'+E(d.hello)+(me&&me.name?", "+E(me.name):"")+'</h2><span>'+E(d.day)+" · "+E(d.heb)+" · "+E(d.greg)+'</span></div>';
 if(d.rest){h+='<div class="y26-rest"><b>🕯️ '+(d.rest.name==="שבת"?"צאת השבת":"צאת החג")+" "+E(d.rest.until)+'</b><span>ב'+E(d.city)+' · כל השאר מחכה למוצאי '+(d.rest.name==="שבת"?"שבת":"החג")+'</span></div>';el.innerHTML=h;el.hidden=false;return}
 if(d.holy)h+='<div class="y26-holy"><span class="e" aria-hidden="true">🕯️</span><span><b>'+E(d.holy.name)+'</b><small>הדלקת נרות '+E(d.holy.when)+' · <button class="y26-city" type="button" id="yCity">'+E(d.city)+' ▾</button></small></span><span class="tm">'+E(d.holy.lit)+'<small>'+(d.holy.chag?"צאת החג ":"צאת שבת ")+E(d.holy.out)+'</small></span></div>';
 if(me){var L=(me.lines||[]).map(function(x){var row='<a href="'+E(x[3])+'"><span class="e" aria-hidden="true">'+E(x[0])+'</span><span class="t">'+E(x[1])+'</span><span class="s'+(x[2]==="באיחור"?" late":"")+'">'+E(x[2])+'</span></a>';return x[4]?'<li class="tk"><button class="y26-ck" type="button" data-id="'+E(x[4])+'" aria-pressed="false" aria-label="בוצע: '+E(x[1])+'">✓</button>'+row+'</li>':'<li>'+row+'</li>'});
  ((me.rem&&me.rem.next)||[]).forEach(function(r){L.push('<li><a href="'+E(r.url)+'"><span class="e" aria-hidden="true">⏰</span><span class="t">'+E(r.label)+'</span><span class="s">'+dayOf(r.t)+" "+hm(r.t)+'</span></a></li>')});
  if(me.fb)L.unshift('<li><a href="/feedback/admin"><span class="e" aria-hidden="true">💬</span><span class="t">'+(me.fb===1?"פנייה אחת חדשה מהמשתמשים":me.fb+" פניות חדשות מהמשתמשים")+'</span><span class="s">לקריאה</span></a></li>');
  if(L.length)h+='<p class="y26-h">מה מחכה לך</p><ul class="y26-l">'+L.slice(0,7).join("")+'</ul>';
  else h+='<ul class="y26-l"><li><a href="https://today.hania360.com/"><span class="e" aria-hidden="true">🌿</span><span class="t">אין משימות פתוחות להיום</span><span class="s">Today ←</span></a></li></ul>';
  h+='<form class="y26-add" id="yAdd"><input id="yAddT" maxlength="80" placeholder="➕ משימה חדשה להיום" aria-label="משימה חדשה להיום" autocomplete="off"><button type="submit">הוספה</button></form>';
  if(me.kids&&me.kids.length){h+='<p class="y26-h">הילדים היום</p><div class="y26-k">'+me.kids.map(function(k){var r=[];if(k.stars!=null)r.push('<span>⭐ '+(k.stars?k.stars+" היום"+(k.week>k.stars?" · "+k.week+" השבוע":""):(k.week||0)+" השבוע")+'</span>');if(k.am)r.push('<span class="on">🌅 בוקר ✓</span>');if(k.pm)r.push('<span class="on">🌙 ערב ✓</span>');if(k.chores)r.push('<span class="'+(k.chores[0]>=k.chores[1]?"on":"")+'">🧹 '+k.chores[0]+"/"+k.chores[1]+'</span>');if(k.wait)r.push('<span class="w">'+k.wait+' לאישור</span>');return '<a href="https://kids.hania360.com/#'+(k.chores&&!k.stars&&!k.am&&!k.pm?"matalot":"shigra")+'"><span class="n"><i aria-hidden="true">'+E(k.av)+'</i>'+E(k.name)+'</span><span class="r">'+r.join("")+'</span></a>'}).join("")+'</div>'}}
 if(o.apps&&o.apps.length)h+='<p class="y26-h">האפליקציות שלך</p><div class="y26-a">'+o.apps.map(function(a){return '<a href="'+E(a[2])+'"><i aria-hidden="true">'+E(a[0])+'</i><span>'+E(a[1])+'</span></a>'}).join("")+'</div>';
 var f=[];if(me){if(me.rem&&me.rem.n)f.push('<a href="/reminders">🔔 '+me.rem.n+' רשימות תזכורות</a>');f.push('<a href="https://today.hania360.com/">📋 Hania Today</a>')}else f.push('<a class="p" href="'+E(o.signin)+'">להתחבר ולראות כאן את המשימות והתזכורות</a>');
 h+='<div class="y26-f">'+f.join("")+'</div>';
 el.innerHTML=h;el.hidden=false;
 var cb=document.getElementById("yCity");if(cb)cb.onclick=function(){var s=document.createElement("select");s.className="y26-sel";s.setAttribute("aria-label","העיר לזמני שבת");s.innerHTML=CITIES.map(function(c,i){return '<option value="'+i+'"'+(c[0]===d.city?" selected":"")+">"+E(c[0])+"</option>"}).join("");cb.replaceWith(s);s.focus();s.onchange=function(){try{po=h360pref({c:CITIES[+s.value]})}catch(e){}load()}};
}
// ticking off and adding tasks: straight to Hania Today, with the Pass CSRF token this site shares
function csrf(){var m=document.cookie.match(/(?:^|; *)hp_csrf=([^;]+)/);return m?m[1]:""}
function toast(t,undo){var o=document.querySelector(".y26-toast");if(o)o.remove();var x=document.createElement("div");x.className="y26-toast";x.setAttribute("role","status");x.innerHTML="<span>"+E(t)+"</span>";if(undo){var b=document.createElement("button");b.type="button";b.textContent="ביטול";b.onclick=function(){x.remove();undo()};x.append(b)}document.body.append(x);setTimeout(function(){x.remove()},5000)}
function task(body){return fetch("/api/home/task",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json","x-csrf-token":csrf()},body:JSON.stringify(body)}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok)throw new Error(j.error||"x");return j})})}
function fail(e){toast(e&&e.message==="signin"?"צריך להתחבר שוב ל־Hania360":"לא הצלחנו לשמור. נסו שוב")}
el.addEventListener("click",function(ev){var b=ev.target.closest&&ev.target.closest(".y26-ck");if(!b)return;var id=b.getAttribute("data-id"),li=b.parentNode,on=b.getAttribute("aria-pressed")!=="true";
 b.setAttribute("aria-pressed",String(on));li.classList.toggle("dn",on);
 task({op:"done",id:id,done:on}).then(function(){if(on)toast("✓ בוצע",function(){task({op:"done",id:id,done:false}).then(load).catch(fail)});setTimeout(load,1800)}).catch(function(e){b.setAttribute("aria-pressed",String(!on));li.classList.toggle("dn",!on);fail(e)})});
el.addEventListener("submit",function(ev){if(ev.target.id!=="yAdd")return;ev.preventDefault();var i=document.getElementById("yAddT"),v=(i.value||"").trim();if(!v)return;i.disabled=true;
 task({op:"add",text:v}).then(function(){toast("➕ נוספה להיום: "+v.slice(0,40));load()}).catch(function(e){i.disabled=false;fail(e)})});
// the last answer is kept on this device and drawn at once (same day only), then replaced by a fresh one, so the page never jumps
var KEY="h360_home",today=new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Jerusalem"});
function keep(o){try{localStorage.setItem(KEY,JSON.stringify({d:today,o:o,h:el.offsetHeight}))}catch(e){}}
function load(){fetch("/api/home?c="+encodeURIComponent(townQ()),{credentials:"same-origin",cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(function(o){if(o&&o.day){o.apps=apps();draw(o);keep(o)}else if(!el.firstChild||el.querySelector(".y26-sk"))el.hidden=true}).catch(function(){if(el.querySelector(".y26-sk"))el.hidden=true})}
var old=null;try{old=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
if(old&&old.d===today&&old.o&&old.o.day&&!old.o.day.rest){try{draw(old.o)}catch(e){}}else{el.innerHTML='<div class="y26-sk"'+(old&&old.h>60&&old.h<1600?' style="height:'+(old.h-40)+'px"':"")+'></div>';el.hidden=false}
// someone who already uses the apps gets their day first, above the welcome for new visitors (before the first paint, so nothing jumps)
try{var hero=document.querySelector(".v3-hero,.h26-hero");if(hero&&(po.a||[]).some(function(x){return x&&x!=="www"})){document.documentElement.classList.add("y26-back");hero.parentNode.insertBefore(el,hero)}}catch(e){}
load();
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible"&&Date.now()-(window.__yAt||0)>300000){window.__yAt=Date.now();load()}});window.__yAt=Date.now();
})()</script>`;

// POST /api/home/signin {email}: the sign-in form on the homepage. Hania Pass sends the one-time link (to
// today.hania360.com) exactly as when the form is on pass.hania360.com, with the visitor's own address for its limit.
export async function homeSigninApi(request, env) {
  if (request.method !== "POST") return json({ error: "method" }, { status: 405 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "origin" }, { status: 403 });
  if (!env.PASS) return json({ error: "pass" }, { status: 503 });
  const b = (await request.json().catch(() => null)) || {}, email = String(b.email || "").trim().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "email" }, { status: 400 });
  const r = await env.PASS.fetch("https://pass.hania360.com/api/auth/link", { method: "POST", body: JSON.stringify({ email, returnTo: "https://today.hania360.com/" }),
    headers: { origin: "https://pass.hania360.com", "content-type": "application/json", "cf-connecting-ip": request.headers.get("cf-connecting-ip") || "" } }).catch(() => null);
  if (!r) return json({ error: "pass" }, { status: 502 });
  const j = await r.json().catch(() => ({}));
  return json(r.ok ? { ok: true } : { error: j.error || "pass" }, { status: r.ok ? 200 : r.status === 429 ? 429 : 502 });
}
