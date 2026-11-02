// HaniaMasach (מסך): screen time a child can see. One Durable Object per family keeps each child's
// daily minutes, what was used today, whether the clock is running, and minutes earned by doing an
// activity away from the screen. The parent's link carries a secret key; each child has a link of their
// own that can only start, pause and report an activity. Nothing here blocks other apps: the timer is
// shown on the child's screen (or the TV), and the parents get a push when time is up.
// One more object ("pair") holds short TV codes: the TV shows 4 digits, the parent types them, the TV
// opens that child's screen.

import { okEndpoint, subId, vapidKeys, wake } from "../lib/webpush.js";

const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const token = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[x % 57]).join(""); };
const IL = (t = Date.now()) => { const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(t)); const o = {}; for (const p of f) o[p.type] = p.value; return o.year + "-" + o.month + "-" + o.day; };
// Milliseconds since midnight in Israel (for a clock that was running across midnight).
const sinceMidnight = () => { const f = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date()); const o = {}; for (const p of f) o[p.type] = +p.value; return ((o.hour * 60 + o.minute) * 60 + o.second) * 1000; };
const EMOJI = ["🦊", "🐼", "🦁", "🐸", "🦄", "🐙", "🐯", "🐨", "🐵", "🐬"];
const COLORS = ["#FF7A59", "#3BA3FF", "#21B573", "#B66DFF", "#FFB020", "#FF5D8F"];
const MAX_KIDS = 6, WARN = 5 * 60000, KEEP_DAYS = 14;
const mins = (n, lo, hi, d) => { n = Math.round(+n); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };

export class MasachFamily {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async load() { return (this.f = this.f || (await this.ctx.storage.get("f")) || null); }
  async save() { await this.ctx.storage.put("f", this.f); }

  // A new day: yesterday goes to the history, today starts from zero (a running clock keeps running from midnight).
  roll(k) {
    const today = IL();
    if (k.day === today) return;
    if (k.day) { k.hist[k.day] = Math.round((k.used + (k.run ? Date.now() - k.run : 0)) / 60000); }
    const cut = IL(Date.now() - KEEP_DAYS * 864e5);
    for (const d in k.hist) if (d < cut) delete k.hist[d];
    k.day = today; k.used = 0; k.bonus = 0; k.tasks = 0; k.warned = false; k.warned1 = false; k.ended = false;
    if (k.run) k.run = Math.max(k.run, Date.now() - sinceMidnight());
  }
  used(k) { return k.used + (k.run ? Date.now() - k.run : 0); }
  left(k) { return (k.daily + k.bonus) * 60000 - this.used(k); }
  kidView(id, k, withToken) {
    this.roll(k);
    const o = { id, name: k.name, emoji: k.emoji, color: k.color, daily: k.daily, bonus: k.bonus, bonusOn: k.bonusOn, bonusMin: k.bonusMin, maxTasks: k.maxTasks, tasks: k.tasks, running: !!k.run, left: Math.round(this.left(k) / 1000), used: Math.round(this.used(k) / 1000), hist: k.hist };
    if (withToken) o.t = k.t;
    return o;
  }
  view(kid) {
    const f = this.f, watch = f.watch || [];
    if (kid) return { family: f.name, kids: [this.kidView(kid, f.kids[kid], false)], watch, now: Date.now() };
    return { family: f.name, kids: Object.entries(f.kids).map(([id, k]) => this.kidView(id, k, true)), watch, feed: f.feed.slice(-30), now: Date.now() };
  }

  async notify(to, msg) {
    const f = this.f, v = await vapidKeys(this.ctx.storage);
    for (const [id, s] of Object.entries(f.subs)) {
      if (!to.includes(s.r)) continue;
      s.msg = { title: msg.title, body: msg.body, url: s.r === "p" ? "/#p-" + f.id + "-" + f.key : "/#k-" + f.id + "-" + (f.kids[s.r] && f.kids[s.r].t) };
      if (!(await wake(v, s.endpoint, "https://masach.hania360.com"))) delete f.subs[id];
    }
  }
  // The next moment something happens: five minutes left, or time is up, for any running clock.
  async schedule() {
    let next = 0;
    for (const k of Object.values(this.f.kids)) {
      if (!k.run) continue;
      const left = this.left(k), at = Date.now() + (left > WARN && !k.warned ? left - WARN : left > 60000 && !k.warned1 ? left - 60000 : Math.max(0, left));
      if (!next || at < next) next = at;
    }
    if (next) await this.ctx.storage.setAlarm(Math.max(Date.now() + 1000, next)); else await this.ctx.storage.deleteAlarm();
  }
  async alarm() {
    if (!(await this.load())) return;
    for (const [id, k] of Object.entries(this.f.kids)) {
      this.roll(k);
      if (!k.run) continue;
      const left = this.left(k);
      if (left <= 1500) {
        k.used = (k.daily + k.bonus) * 60000; k.run = 0; k.ended = true;
        this.f.feed.push({ at: Date.now(), k: id, text: "הזמן נגמר" });
        await this.notify(["p", id], { title: "⏰ הזמן של " + k.name + " נגמר", body: k.bonusOn && k.tasks < k.maxTasks ? "אפשר להרוויח עוד " + k.bonusMin + " דקות בפעילות בלי מסך." : "זהו להיום. כל הכבוד!" });
      } else if (left <= 61500 && !k.warned1) {
        k.warned1 = true; k.warned = true;
        await this.notify([id], { title: "⏳ עוד דקה אחת", body: k.name + ", הזמן כמעט נגמר." });
      } else if (left <= WARN + 1500 && !k.warned) {
        k.warned = true;
        await this.notify([id], { title: "⏳ עוד 5 דקות מסך", body: k.name + ", כדאי לסיים את מה שמתחילים." });
      }
    }
    this.tidy(); await this.save(); await this.schedule();
  }
  tidy() { this.f.feed = this.f.feed.filter((x) => x.at > Date.now() - 7 * 864e5).slice(-100); }

  async fetch(req) {
    const url = new URL(req.url), p = url.pathname;
    const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
    const b = await req.json().catch(() => ({}));
    if (p === "/pair") return this.pair(b, json);
    if (p === "/init") {
      if (await this.load()) return json({ error: "exists" }, 409);
      const names = (Array.isArray(b.kids) ? b.kids : []).map((x) => clean(x, 20)).filter(Boolean).slice(0, MAX_KIDS);
      if (!names.length) return json({ error: "kids" }, 400);
      const daily = mins(b.daily, 5, 600, 60);
      this.f = { id: b.id, key: b.key, name: clean(b.name, 30), kids: {}, next: 0, subs: {}, feed: [], created: Date.now() };
      names.forEach((n) => this.addKid(n, daily));
      await this.save();
      return json({ ok: true });
    }
    if (!(await this.load())) return json({ error: "no family" }, 404);
    const f = this.f;
    // The service worker asks what to show for its own endpoint; the key for pushes is public.
    if (p === "/msg") { const s = b.endpoint ? f.subs[await subId(b.endpoint)] : null; return json(s && s.msg ? s.msg : {}); }
    if (p === "/key") return json({ key: (await vapidKeys(this.ctx.storage)).pub });
    const parent = b.key && b.key === f.key;
    const kid = !parent && b.t ? Object.keys(f.kids).find((id) => f.kids[id].t === b.t) : null;
    if (!parent && !kid) return json({ error: "auth" }, 403);
    if (p === "/state") { const v = this.view(kid); await this.save(); return json(v); }
    if (p !== "/op") return json({ error: "not found" }, 404);

    const id = kid || (f.kids[b.k] ? b.k : ""), k = id ? f.kids[id] : null;
    if (k) this.roll(k);
    switch (b.op) {
      case "start": if (!k) return json({ error: "kid" }, 400); if (!k.run && this.left(k) > 0) { k.run = Date.now(); k.ended = false; } break;
      case "pause": if (!k) return json({ error: "kid" }, 400); if (k.run) { k.used += Date.now() - k.run; k.run = 0; } break;
      case "sub": { // pushes: the parents hear when time is up and when minutes were earned; a child hears "5 minutes left"
        const ep = b.sub && b.sub.endpoint; if (!okEndpoint(ep)) return json({ error: "endpoint" }, 400);
        f.subs[await subId(ep)] = { endpoint: ep, r: parent ? "p" : kid, msg: null };
        await this.save(); return json({ ok: true });
      }
      case "unsub": if (b.endpoint) delete f.subs[await subId(b.endpoint)]; await this.save(); return json({ ok: true });
      case "task": { // the child did something away from the screen and earns minutes
        if (!kid) return json({ error: "kid" }, 400);
        if (!k.bonusOn || k.tasks >= k.maxTasks) return json({ error: "no bonus" }, 400);
        k.tasks++; k.bonus += k.bonusMin; k.warned = false; k.warned1 = false; k.ended = false;
        const t = clean(b.text, 60) || "פעילות בלי מסך";
        f.feed.push({ at: Date.now(), k: id, text: t + " · +" + k.bonusMin + " דק׳" });
        await this.save();
        await this.notify(["p"], { title: "⭐ " + k.name + " הרוויח/ה " + k.bonusMin + " דקות", body: t });
        break;
      }
      default: {
        if (!parent) return json({ error: "parent" }, 403);
        switch (b.op) {
          case "add": if (!k) return json({ error: "kid" }, 400); { const m = mins(b.min, -600, 600, 0); k.bonus += m; if (m > 0) { k.warned = false; k.warned1 = false; k.ended = false; } f.feed.push({ at: Date.now(), k: id, text: (m > 0 ? "+" : "") + m + " דק׳ מההורים" }); } break;
          case "reset": if (!k) return json({ error: "kid" }, 400); k.used = 0; k.bonus = 0; k.tasks = 0; k.warned = false; k.warned1 = false; k.ended = false; if (k.run) k.run = Date.now(); break;
          case "kid": {
            if (b.remove) { if (!k) return json({ error: "kid" }, 400); delete f.kids[id]; for (const [sid, s] of Object.entries(f.subs)) if (s.r === id) delete f.subs[sid]; break; }
            if (k) {
              if (b.name !== undefined) k.name = clean(b.name, 20) || k.name;
              if (b.daily !== undefined) k.daily = mins(b.daily, 5, 600, k.daily);
              if (b.bonusOn !== undefined) k.bonusOn = !!b.bonusOn;
              if (b.bonusMin !== undefined) k.bonusMin = mins(b.bonusMin, 5, 60, k.bonusMin);
              if (b.maxTasks !== undefined) k.maxTasks = mins(b.maxTasks, 1, 6, k.maxTasks);
              if (b.emoji !== undefined && EMOJI.includes(b.emoji)) k.emoji = b.emoji;
            } else {
              if (Object.keys(f.kids).length >= MAX_KIDS) return json({ error: "full" }, 400);
              const n = clean(b.name, 20); if (!n) return json({ error: "name" }, 400);
              this.addKid(n, mins(b.daily, 5, 600, 60));
            }
            break;
          }
          case "family": f.name = clean(b.name, 30); break;
          case "watchAdd": { // a YouTube video, playlist or channel the parents chose; the children watch only these
            f.watch = f.watch || [];
            if (f.watch.length >= 60) return json({ error: "full" }, 400);
            const w = await ytItem(String(b.url || ""));
            if (!w) return json({ error: "link" }, 400);
            if (!f.watch.some((x) => x.type === w.type && x.id === w.id)) f.watch.unshift(w);
            break;
          }
          case "watchDel": f.watch = (f.watch || []).filter((x) => !(x.type === b.type && x.id === b.id)); break;
          case "pairTv": { // sends one child's screen to a TV that shows a 4-digit code
            if (!k || !/^\d{4}$/.test(String(b.code || ""))) return json({ error: "code" }, 400);
            const r = await this.env.MASACH.get(this.env.MASACH.idFromName("pair")).fetch("https://m/pair", { method: "POST", body: JSON.stringify({ op: "give", code: b.code, link: "/#k-" + f.id + "-" + k.t }) }).then((x) => x.json());
            if (!r.ok) return json({ error: "code" }, 404);
            break;
          }
          default: return json({ error: "op" }, 400);
        }
      }
    }
    this.tidy(); await this.save(); await this.schedule();
    return json(this.view(kid));
  }
  addKid(name, daily) {
    const i = this.f.next++;
    this.f.kids["k" + i] = { name, emoji: EMOJI[i % EMOJI.length], color: COLORS[i % COLORS.length], daily, t: token(8), day: IL(), used: 0, bonus: 0, tasks: 0, run: 0, warned: false, ended: false, bonusOn: true, bonusMin: 10, maxTasks: 3, hist: {} };
  }

  // ---- TV codes (only in the "pair" object) ----
  async pair(b, json) {
    const now = Date.now(), all = (await this.ctx.storage.get("codes")) || {};
    for (const c in all) if (all[c].exp < now) delete all[c];
    if (b.op === "new") {
      let code; do { code = String(1000 + Math.floor(Math.random() * 9000)); } while (all[code]);
      const secret = token(12); all[code] = { secret, exp: now + 15 * 60000, link: "" };
      await this.ctx.storage.put("codes", all);
      return json({ code, secret });
    }
    if (b.op === "give") { const c = all[b.code]; if (!c || c.link) return json({ ok: false }); c.link = String(b.link).slice(0, 80); await this.ctx.storage.put("codes", all); return json({ ok: true }); }
    if (b.op === "wait") { const c = all[b.code]; if (!c || c.secret !== b.secret) return json({ gone: true }); if (c.link) { delete all[b.code]; await this.ctx.storage.put("codes", all); return json({ link: c.link }); } return json({}); }
    return json({ error: "op" }, 400);
  }
}

// ---- YouTube links the parents add: a video, a playlist, or a channel (its uploads playlist) ----
const YT_ID = /^[A-Za-z0-9_-]{11}$/, LIST_ID = /^[A-Za-z0-9_-]{12,64}$/;
async function oembed(u) {
  const r = await fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(u), { headers: { "user-agent": "Mozilla/5.0 (HaniaMasach)" } }).catch(() => null);
  return r && r.ok ? r.json().catch(() => null) : null;
}
export async function ytItem(raw) {
  let u; try { u = new URL(/^https?:\/\//.test(raw.trim()) ? raw.trim() : "https://" + raw.trim()); } catch { return null; }
  const host = u.hostname.replace(/^(www|m|music)\./, "");
  if (!["youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host)) return null;
  const path = u.pathname.split("/").filter(Boolean);
  let v = host === "youtu.be" ? path[0] : u.searchParams.get("v") || (["shorts", "live", "embed"].includes(path[0]) ? path[1] : "");
  const list = u.searchParams.get("list");
  if (list && LIST_ID.test(list) && !/^(RD|WL|LL)/.test(list)) { // a playlist (also when the link is a video inside one)
    const o = await oembed("https://www.youtube.com/playlist?list=" + list);
    return { type: "p", id: list, title: clean(o && o.title, 80) || "רשימת השמעה", thumb: o && /^https:\/\/i\.ytimg\.com\//.test(o.thumbnail_url || "") ? o.thumbnail_url : (v && YT_ID.test(v) ? "https://i.ytimg.com/vi/" + v + "/hqdefault.jpg" : "") };
  }
  if (v && YT_ID.test(v)) {
    const o = await oembed("https://www.youtube.com/watch?v=" + v);
    if (!o) return null;
    return { type: "v", id: v, title: clean(o.title, 80), thumb: "https://i.ytimg.com/vi/" + v + "/hqdefault.jpg" };
  }
  // A channel: /channel/UC..., /@name, /c/name or /user/name. Its uploads are the playlist "UU" + the rest of the id.
  let uc = path[0] === "channel" && /^UC[A-Za-z0-9_-]{22}$/.test(path[1] || "") ? path[1] : "";
  let title = "";
  if (!uc && path[0] && (path[0].startsWith("@") || ["c", "user"].includes(path[0]))) {
    const r = await fetch("https://www.youtube.com/" + path.slice(0, path[0].startsWith("@") ? 1 : 2).map(encodeURIComponent).join("/").replace("%40", "@"), { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36", "accept-language": "he,en;q=0.8", cookie: "CONSENT=YES+1" } }).catch(() => null);
    const html = r && r.ok ? await r.text().catch(() => "") : "";
    const m = html.match(/"(?:channelId|externalId)":"(UC[A-Za-z0-9_-]{22})"/) || html.match(/channel\/(UC[A-Za-z0-9_-]{22})/);
    uc = m ? m[1] : "";
    const t = html.match(/<meta property="og:title" content="([^"]{1,120})"/); title = t ? t[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"') : "";
  }
  if (!uc) return null;
  const up = "UU" + uc.slice(2), o = await oembed("https://www.youtube.com/playlist?list=" + up);
  return { type: "p", id: up, title: clean(title || (o && o.title), 80) || "ערוץ ביוטיוב", thumb: o && /^https:\/\/i\.ytimg\.com\//.test(o.thumbnail_url || "") ? o.thumbnail_url : "" };
}

/** masach.hania360.com/api/masach/*: create a family, read it, change it, pair a TV. */
export async function masachApi(req, env, url) {
  if (!env.MASACH) return Response.json({ error: "not configured" }, { status: 503 });
  const stub = (id) => env.MASACH.get(env.MASACH.idFromName("f:" + id));
  const mm = url.pathname.match(/^\/api\/masach\/(new|state|op|key|msg|tv)$/);
  if (!mm) return Response.json({ error: "not found" }, { status: 404 });
  if (req.method !== "POST") return Response.json({ error: "method" }, { status: 405 });
  const body = await req.text();
  if (body.length > 4000) return Response.json({ error: "size" }, { status: 413 });
  let b = {}; try { b = JSON.parse(body || "{}"); } catch { return Response.json({ error: "json" }, { status: 400 }); }
  if (mm[1] === "tv") return env.MASACH.get(env.MASACH.idFromName("pair")).fetch("https://m/pair", { method: "POST", body: JSON.stringify({ op: b.op === "wait" ? "wait" : "new", code: String(b.code || ""), secret: String(b.secret || "") }) });
  if (mm[1] === "new") {
    const id = token(10), key = token(14);
    const r = await stub(id).fetch("https://m/init", { method: "POST", body: JSON.stringify(Object.assign({}, b, { id, key })) });
    const j = await r.json();
    return Response.json(j.ok ? { id, key } : j, { status: r.status });
  }
  if (!/^[A-Za-z0-9]{6,20}$/.test(b.f || "")) return Response.json({ error: "family" }, { status: 400 });
  return stub(b.f).fetch("https://m/" + mm[1], { method: "POST", body });
}
