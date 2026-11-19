// Hania's morning briefing: one notification a day at the owner's chosen time with what the morning needs:
// the weather, the train for the regular trip (real Israel Railways times), today's tasks and calendar, birthdays,
// Daf Yomi, and on Friday the Shabbat times. Not on Shabbat or a festival.
// One Durable Object ("owner") keeps the phone's push address, the settings and the owner's Hania Pass cookie (to read
// Today; refreshed whenever the owner uses Hania). At the time it builds the message, stores it, and wakes the phone
// with an empty push; the page's service worker then asks /api/ai/brief/msg what to show (as HaniaDat does).

import { widgetApi } from "../now/widget.js";
import { CITIES } from "../lib/cities.js";
import { trains, trainLink } from "./api.js";

const TZ = "Asia/Jerusalem";
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = new TextEncoder();
const HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
const okEndpoint = (u) => { try { const x = new URL(u); return x.protocol === "https:" && u.length <= 800 && HOSTS.some((h) => h.test(x.hostname)); } catch { return false; } };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const ymd = (t) => new Date(t).toLocaleDateString("en-CA", { timeZone: TZ });
const WD = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const cookieOf = (h, k) => { const m = new RegExp("(?:^|;\\s*)" + k + "=([^;]*)").exec(h || ""); return m ? m[1] : ""; };

// Festival days (no work, no briefing), by Hebrew date as Intl names the months in English.
const YT = [["Tishri", 1], ["Tishri", 2], ["Tishri", 10], ["Tishri", 15], ["Tishri", 22], ["Nisan", 15], ["Nisan", 21], ["Sivan", 6]];
function yomTov(t) {
  const p = new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long", timeZone: TZ }).formatToParts(new Date(t));
  const d = +(p.find((x) => x.type === "day") || {}).value, m = (p.find((x) => x.type === "month") || {}).value;
  return YT.some((x) => x[0] === m && x[1] === d);
}
// The UTC moment of hh:mm Israel time on a given Israel date.
function atIL(day, hhmm) {
  const guess = Date.parse(day + "T" + hhmm + ":00Z");
  const p = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "shortOffset" }).formatToParts(new Date(guess));
  const z = (p.find((x) => x.type === "timeZoneName") || {}).value || "GMT+2", m = /GMT([+-]\d+)/.exec(z);
  return guess - (m ? +m[1] : 2) * 3600e3;
}
const addDay = (day, n) => { const d = new Date(day + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export class HaniaBrief {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async vapid() {
    let v = await this.ctx.storage.get("vapid");
    if (v) return v;
    const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    v = { pub: b64u(await crypto.subtle.exportKey("raw", kp.publicKey)), jwk: await crypto.subtle.exportKey("jwk", kp.privateKey) };
    await this.ctx.storage.put("vapid", v);
    return v;
  }
  async wake(endpoint) {
    const v = await this.vapid(), key = await crypto.subtle.importKey("jwk", v.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
    const part = (o) => b64u(enc.encode(JSON.stringify(o)));
    const body = part({ typ: "JWT", alg: "ES256" }) + "." + part({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "https://ai.hania360.com" });
    const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(body));
    try { const r = await fetch(endpoint, { method: "POST", headers: { Authorization: "vapid t=" + body + "." + b64u(sig) + ", k=" + v.pub, TTL: "3600", Urgency: "high", "Content-Length": "0" } }); return !(r.status === 404 || r.status === 410); } catch { return true; }
  }
  async settings() { return (await this.ctx.storage.get("set")) || { on: false, time: "06:45", city: "", commute: null }; }

  // The next briefing: the chosen time, today if still ahead, else tomorrow; Shabbat and festival days are skipped at send time.
  async plan() {
    const s = await this.settings();
    if (!s.on || !(await this.ctx.storage.get("sub"))) { await this.ctx.storage.deleteAlarm(); return null; }
    let day = ymd(Date.now()), t = atIL(day, s.time);
    if (t <= Date.now() + 30e3) { day = addDay(day, 1); t = atIL(day, s.time); }
    await this.ctx.storage.setAlarm(t);
    return t;
  }

  async alarm() {
    try {
      const sub = await this.ctx.storage.get("sub"), s = await this.settings(), now = Date.now();
      const wd = new Date(ymd(now) + "T12:00:00Z").getUTCDay();
      if (sub && s.on && wd !== 6 && !yomTov(now)) {
        const m = await this.build(s).catch((e) => ({ title: "🌅 בוקר טוב", body: "התדריך לא נבנה הבוקר (" + String(e.message || e).slice(0, 40) + ")." }));
        await this.ctx.storage.put("msg", Object.assign(m, { at: now }));
        if (!(await this.wake(sub.endpoint))) await this.ctx.storage.delete("sub");
      }
    } finally { await this.plan(); }
  }

  async build(s) {
    const env = this.env, ci = Math.max(0, CITIES.findIndex((c) => c[0] === s.city)), now = Date.now(), today = ymd(now), wd = new Date(today + "T12:00:00Z").getUTCDay();
    const lines = [];
    const w = await widgetApi(new URL("https://hania360.com/api/widget?c=" + ci), env).then((r) => r.json()).catch(() => ({}));
    const title = "🌅 בוקר טוב · יום " + WD[wd] + (w.heb ? " " + w.heb : "");
    if (w.wx) lines.push(w.wx.d + " " + w.wx.t + "° (" + w.wx.lo + "°–" + w.wx.hi + "°)");
    const c = s.commute;
    if (c && c.from && c.to && (c.days || [0, 1, 2, 3, 4]).includes(wd)) {
      const t = await trains(c.from, c.to, today, c.arrive || "").catch(() => null), x = t && t.direct_trains && t.direct_trains[t.direct_trains.length - 1];
      if (x) lines.push("🚆 רכבת " + x.leaves + " מ" + t.from + ", מגיעה ל" + t.to + " ב־" + x.arrives);
    }
    const cookie = await this.ctx.storage.get("cookie");
    if (cookie && env.PASS) {
      const j = await env.PASS.fetch("https://pass.internal/api/today", { headers: { cookie } }).then((r) => r.json()).catch(() => null);
      if (j && j.signedIn) {
        const cal = (j.calendar && j.calendar.today || []).slice(0, 3).map((e) => (e.time || e.start || "") + " " + (e.title || e.summary || "")).filter((x) => x.trim());
        if (cal.length) lines.push("📅 " + cal.join(" · "));
        const tasks = (j.tasks && j.tasks.tasks || []).filter((x) => !x.done), notes = (j.notes && j.notes.today || []).filter((x) => !x.done);
        if (tasks.length || notes.length) lines.push("✅ " + [].concat(notes.map((n) => (n.time ? n.time + " " : "") + n.text), tasks.map((x) => x.text)).slice(0, 3).join(" · ") + (tasks.length + notes.length > 3 ? " (+" + (tasks.length + notes.length - 3) + ")" : ""));
        const bd = (j.gil && j.gil.birthdays || []).filter((b) => b.days === 0 || b.today);
        if (bd.length) lines.push("🎂 " + bd.map((b) => b.name).join(", "));
      } else lines.push("🔑 להתחבר שוב ל־Hania כדי לראות כאן את Today");
    }
    try {
      const r = await fetch("https://www.sefaria.org/api/calendars?timezone=Asia/Jerusalem&diaspora=0", { cf: { cacheTtl: 3600 } }), j = await r.json();
      const daf = (j.calendar_items || []).find((x) => x.title && x.title.en === "Daf Yomi");
      if (daf) lines.push("📖 הדף היומי: " + (daf.displayValue && daf.displayValue.he));
    } catch {}
    if (wd === 5 && w.shab) lines.push("🕯️ הדלקה " + w.shab.in + " · צאת השבת " + w.shab.out);
    else if (w.chag && w.chag.days > 0 && w.chag.days <= 3) lines.push("🗓️ " + w.chag.n + " בעוד " + w.chag.days + " ימים");
    return { title, body: lines.join("\n") || "יום טוב!", url: "/" };
  }

  async fetch(req) {
    const url = new URL(req.url), p = url.pathname, b = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (p === "/key") return json({ key: (await this.vapid()).pub });
    if (p === "/msg") { const sub = await this.ctx.storage.get("sub"); if (!sub || sub.endpoint !== b.endpoint) return json({}); return json((await this.ctx.storage.get("msg")) || {}); }
    if (p === "/cookie") { if (b.cookie) await this.ctx.storage.put("cookie", b.cookie); return json({ ok: true }); }
    if (p === "/get") { const s = await this.settings(), a = await this.ctx.storage.getAlarm(); return json(Object.assign({}, s, { subscribed: !!(await this.ctx.storage.get("sub")), next: a || null })); }
    if (p === "/test") { const s = await this.settings(), m = await this.build(s); await this.ctx.storage.put("msg", Object.assign(m, { at: Date.now() })); const sub = await this.ctx.storage.get("sub"); if (sub) await this.wake(sub.endpoint); return json(Object.assign({ sent: !!sub }, m)); }
    if (p === "/set") {
      const old = await this.settings(), x = b.set || {};
      const time = /^([01]\d|2[0-3]):[0-5]\d$/.test(x.time || "") ? x.time : old.time;
      let commute = null;
      if (x.commute && x.commute.from && x.commute.to) commute = { from: String(x.commute.from).slice(0, 40), to: String(x.commute.to).slice(0, 40), arrive: /^\d\d:\d\d$/.test(x.commute.arrive || "") ? x.commute.arrive : "", days: (Array.isArray(x.commute.days) ? x.commute.days : [0, 1, 2, 3, 4]).map(Number).filter((d) => d >= 0 && d <= 5) };
      const s = { on: !!x.on, time, city: String(x.city || old.city || "").slice(0, 30), commute };
      await this.ctx.storage.put("set", s);
      if (b.sub && okEndpoint(b.sub.endpoint)) await this.ctx.storage.put("sub", { endpoint: b.sub.endpoint });
      if (b.cookie) await this.ctx.storage.put("cookie", b.cookie);
      const next = await this.plan();
      return json(Object.assign({}, s, { subscribed: !!(await this.ctx.storage.get("sub")), next }));
    }
    return json({ error: "not found" }, 404);
  }
}

// The owner's own address for the briefing object, and the Hania Pass cookie it needs (only the two Pass cookies).
export function passCookie(h) { const s = cookieOf(h, "hp_session"), c = cookieOf(h, "hp_csrf"); return s ? "hp_session=" + s + (c ? "; hp_csrf=" + c : "") : ""; }
export async function briefApi(request, env, path) {
  const stub = env.BRIEF.get(env.BRIEF.idFromName("owner"));
  const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
  if (path === "set" || path === "test") body.cookie = passCookie(request.headers.get("cookie") || "");
  return stub.fetch("https://brief/" + path, request.method === "POST" ? { method: "POST", body: JSON.stringify(body) } : {});
}
export { trainLink };
