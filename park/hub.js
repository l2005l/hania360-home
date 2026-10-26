// HaniaPark reminders: "paid parking is still on". One Durable Object keeps, per phone (a random
// device id), which app is charging since when, and wakes the phone with a Web Push on a
// schedule until the parking is stopped. The push has no payload: the phone's service worker
// asks /api/park/msg what to show. The VAPID key pair is made once and kept in the object.
// The same record answers /api/park/active, which an iPhone Shortcut can read when the phone
// connects to the car's Bluetooth.

const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = new TextEncoder();
const HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
const okEndpoint = (u) => { try { const x = new URL(u); return x.protocol === "https:" && u.length <= 800 && HOSTS.some((h) => h.test(x.hostname)); } catch { return false; } };
const okDevice = (d) => typeof d === "string" && /^[A-Za-z0-9_-]{16,40}$/.test(d);
const APPS = ["פנגו", "סלופארק"];
const MAX_AGE = 14 * 3600 * 1000;
const hm = (t) => new Date(t).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" });
const since = (t) => { const m = Math.round((Date.now() - t) / 60000), h = Math.floor(m / 60); return m < 60 ? m + " דקות" : (h === 1 ? "שעה" : h === 2 ? "שעתיים" : h + " שעות") + (m % 60 >= 30 ? " וחצי" : ""); };

export class ParkHub {
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
    const body = part({ typ: "JWT", alg: "ES256" }) + "." + part({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "https://park.hania360.com" });
    const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(body));
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { Authorization: "vapid t=" + body + "." + b64u(sig) + ", k=" + v.pub, TTL: "3600", Urgency: "high", "Content-Length": "0" } });
      return !(r.status === 404 || r.status === 410);
    } catch { return true; }
  }

  async schedule() {
    const all = await this.ctx.storage.list({ prefix: "d:" });
    let next = 0;
    for (const r of all.values()) if (r.endpoint && r.next && (!next || r.next < next)) next = r.next;
    if (next) await this.ctx.storage.setAlarm(Math.max(Date.now() + 1000, next)); else await this.ctx.storage.deleteAlarm();
  }

  async alarm() {
    const now = Date.now(), all = await this.ctx.storage.list({ prefix: "d:" });
    for (const [k, r] of all) {
      if (now - r.at > MAX_AGE) { await this.ctx.storage.delete(k); continue; }
      if (!r.endpoint || !r.next || r.next > now) continue;
      r.msg = { title: "🅿️ " + r.app + " עדיין פעיל", body: "החניה עולה כסף כבר " + since(r.at) + " (מ־" + hm(r.at) + "). חזרתם לרכב? לא לשכוח לעצור.", url: "/#paid", d: k.slice(2) };
      r.next = r.every ? now + r.every * 60000 : 0;
      await this.ctx.storage.put(k, r);
      if (!(await this.wake(r.endpoint))) { r.endpoint = ""; r.next = 0; await this.ctx.storage.put(k, r); }
    }
    await this.schedule();
  }

  async fetch(req) {
    const url = new URL(req.url), p = url.pathname;
    const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
    if (p === "/api/park/key") return json({ key: (await this.vapid()).pub });
    if (p === "/api/park/active") {
      const d = url.searchParams.get("d") || "";
      const r = okDevice(d) ? await this.ctx.storage.get("d:" + d) : null;
      const on = r && Date.now() - r.at < MAX_AGE;
      // Plain words, so an iPhone Shortcut can check "contains פעיל".
      return new Response(on ? r.app + " פעיל מ־" + hm(r.at) : "לא", { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" } });
    }
    if (req.method !== "POST") return json({ error: "method" }, 405);
    const b = await req.json().catch(() => null);
    if (p === "/api/park/msg") {
      if (!b || typeof b.endpoint !== "string") return json({});
      const all = await this.ctx.storage.list({ prefix: "d:" });
      for (const r of all.values()) if (r.endpoint === b.endpoint && r.msg) return json(r.msg);
      return json({});
    }
    if (!b || !okDevice(b.d)) return json({ error: "device" }, 400);
    const k = "d:" + b.d;
    if (p === "/api/park/pay") {
      const app = APPS.includes(b.app) ? b.app : "התשלום";
      const at = Math.min(Date.now(), Math.max(Date.now() - MAX_AGE, +b.at || Date.now()));
      const first = Math.min(240, Math.max(10, +b.first || 60)), every = Math.min(180, Math.max(0, +b.every || 60));
      const endpoint = b.sub && okEndpoint(b.sub.endpoint) ? b.sub.endpoint : "";
      await this.ctx.storage.put(k, { app, at, endpoint, first, every, next: endpoint ? at + first * 60000 : 0, msg: null });
      await this.schedule();
      return json({ ok: true, push: !!endpoint, firstAt: endpoint ? at + first * 60000 : 0 });
    }
    if (p === "/api/park/stop") {
      await this.ctx.storage.delete(k);
      await this.schedule();
      return json({ ok: true });
    }
    return json({ error: "not found" }, 404);
  }
}

/** park.hania360.com/api/park/*: everything goes to the one reminder hub. */
export function parkApi(req, env) {
  if (!env.PARK) return Response.json({ error: "not configured" }, { status: 503 });
  return env.PARK.get(env.PARK.idFromName("hub")).fetch(req);
}
