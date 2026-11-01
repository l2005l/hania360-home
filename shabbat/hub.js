// HaniaShabbat reminders: one Durable Object keeps, per phone (its push subscription), the next
// candle-lighting times the page computed for its town, and wakes the phone with an empty Web Push
// the chosen minutes before each one. The service worker then asks /api/shabbat/msg what to show.

const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = new TextEncoder();
const HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
const okEndpoint = (u) => { try { const x = new URL(u); return x.protocol === "https:" && u.length <= 800 && HOSTS.some((h) => h.test(x.hostname)); } catch { return false; } };
const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);
const hm = (t) => new Date(t).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" });
async function idOf(endpoint) { return b64u(await crypto.subtle.digest("SHA-256", enc.encode(endpoint))).slice(0, 32); }

export class ShabbatHub {
  constructor(ctx) { this.ctx = ctx; }

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
    const body = part({ typ: "JWT", alg: "ES256" }) + "." + part({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "https://shabbat.hania360.com" });
    const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(body));
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { Authorization: "vapid t=" + body + "." + b64u(sig) + ", k=" + v.pub, TTL: "1800", Urgency: "high", "Content-Length": "0" } });
      return !(r.status === 404 || r.status === 410);
    } catch { return true; }
  }

  // The next reminder of a subscription: the first candle lighting whose reminder time has not passed.
  nextOf(r, now) {
    for (const it of r.items) { const at = it.t - r.before * 60000; if (at > (r.last || 0) && it.t > now) return { at, it }; }
    return null;
  }
  async schedule() {
    const now = Date.now(), all = new Map([...(await this.ctx.storage.list({ prefix: "s:" })), ...(await this.ctx.storage.list({ prefix: "z:" }))]);
    let next = 0;
    for (const r of all.values()) { const n = this.nextOf(r, now); if (n && (!next || n.at < next)) next = n.at; }
    if (next) await this.ctx.storage.setAlarm(Math.max(now + 1000, next)); else await this.ctx.storage.deleteAlarm();
  }
  async alarm() {
    const now = Date.now(), all = new Map([...(await this.ctx.storage.list({ prefix: "s:" })), ...(await this.ctx.storage.list({ prefix: "z:" }))]);
    for (const [k, r] of all) {
      const n = this.nextOf(r, now);
      if (!n) { if (r.items.every((it) => it.t < now - 864e5 * 14)) await this.ctx.storage.delete(k); continue; }
      if (n.at > now + 30000) continue;
      const mins = Math.max(1, Math.round((n.it.t - now) / 60000));
      const h = Math.round(mins / 60), when = mins < 55 ? "בעוד " + mins + " דקות" : h === 1 ? "בעוד שעה" : h === 2 ? "בעוד שעתיים" : "בעוד " + h + " שעות";
      r.msg = k.startsWith("z:")
        ? { title: "⏰ " + n.it.label + " ב־" + hm(n.it.t), body: when + " · " + r.city, url: "/", at: now }
        : { title: "🕯️ הדלקת נרות ב־" + hm(n.it.t), body: when + " · " + r.city + " · " + n.it.label + ". שבת שלום!", url: "/", at: now };
      r.last = n.at;
      await this.ctx.storage.put(k, r);
      if (!(await this.wake(r.endpoint))) await this.ctx.storage.delete(k);
    }
    await this.schedule();
  }

  async fetch(req) {
    const url = new URL(req.url), p = url.pathname;
    const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
    if (p === "/api/shabbat/key") return json({ key: (await this.vapid()).pub });
    if (req.method !== "POST") return json({ error: "method" }, 405);
    const b = await req.json().catch(() => null);
    if (p === "/api/shabbat/msg") {
      if (!b || typeof b.endpoint !== "string") return json({});
      // Candle lighting and the daily zman reminders share a phone; the most recent message wins.
      const id = await idOf(b.endpoint), a = await this.ctx.storage.get("s:" + id), z = await this.ctx.storage.get("z:" + id);
      const m = [a && a.msg, z && z.msg].filter(Boolean).sort((x, y) => (y.at || 0) - (x.at || 0))[0];
      return json(m || {});
    }
    if (p === "/api/shabbat/unsub") {
      if (b && typeof b.endpoint === "string") await this.ctx.storage.delete((b.kind === "z" ? "z:" : "s:") + (await idOf(b.endpoint)));
      await this.schedule();
      return json({ ok: true });
    }
    if (p === "/api/shabbat/sub") {
      const endpoint = b && b.sub && b.sub.endpoint;
      if (!okEndpoint(endpoint)) return json({ error: "endpoint" }, 400);
      const now = Date.now();
      const items = (Array.isArray(b.items) ? b.items : []).map((x) => ({ t: +x.t, label: clean(x.label, 40) })).filter((x) => x.t > now - 864e5 && x.t < now + 120 * 864e5).sort((a, c) => a.t - c.t).slice(0, 40);
      if (!items.length) return json({ error: "items" }, 400);
      const k = (b.kind === "z" ? "z:" : "s:") + (await idOf(endpoint)), old = (await this.ctx.storage.get(k)) || {};
      const before = Math.min(240, Math.max(10, +b.before || 60));
      await this.ctx.storage.put(k, { endpoint, before, city: clean(b.city, 30) || "העיר שלך", items, last: old.before === before ? old.last || 0 : 0, msg: old.msg || null });
      await this.schedule();
      return json({ ok: true });
    }
    return json({ error: "not found" }, 404);
  }
}

export function shabbatApi(req, env) {
  if (!env.SHABBAT) return Response.json({ error: "not configured" }, { status: 503 });
  return env.SHABBAT.get(env.SHABBAT.idFromName("hub")).fetch(req);
}
