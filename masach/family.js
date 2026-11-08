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
// Bedtime: from the chosen hour until five in the morning the screen stays closed, whatever minutes are left.
const bedMin = (k) => { const m = /^(\d{2}):(\d{2})$/.exec(k.bed || ""); return m ? +m[1] * 60 + +m[2] : null; };
const asleep = (k) => { const b = bedMin(k); if (b == null) return false; const m = Math.floor(sinceMidnight() / 60000); return m >= b || m < 300; };
const EMOJI = ["🦊", "🐼", "🦁", "🐸", "🦄", "🐙", "🐯", "🐨", "🐵", "🐬"];
const COLORS = ["#FF7A59", "#3BA3FF", "#21B573", "#B66DFF", "#FFB020", "#FF5D8F"];
const MAX_KIDS = 6, WARN = 5 * 60000, KEEP_DAYS = 14, STAR_DAY = 60;
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
    k.day = today; k.used = 0; k.bonus = 0; k.tasks = 0; k.warned = false; k.warned1 = false; k.ended = false; k.sEarn = 0; k.sRedeem = 0;
    if (k.run) k.run = Math.max(k.run, Date.now() - sinceMidnight());
  }
  used(k) { return k.used + (k.run ? Date.now() - k.run : 0); }
  left(k) { return (k.daily + k.bonus) * 60000 - this.used(k); }
  kidView(id, k, withToken) {
    this.roll(k);
    const o = { id, name: k.name, emoji: k.emoji, color: k.color, daily: k.daily, bonus: k.bonus, bonusOn: k.bonusOn, bonusMin: k.bonusMin, maxTasks: k.maxTasks, tasks: k.tasks, running: !!k.run, left: Math.round(this.left(k) / 1000), used: Math.round(this.used(k) / 1000), hist: k.hist, bed: k.bed || "", asleep: asleep(k), read: k.read || 0,
      stars: k.stars || 0, grade: k.grade || "", starOn: k.starOn !== false, starRate: k.starRate || 10, starCap: k.starCap || 30, sRedeem: k.sRedeem || 0, sEarn: k.sEarn || 0 };
    if (withToken) o.t = k.t;
    return o;
  }
  view(kid) {
    const f = this.f, watch = f.watch || [], hasKey = !!(this.env && this.env.YT_KEY), search = hasKey && !!f.search;
    if (kid) return { family: f.name, kids: [this.kidView(kid, f.kids[kid], false)], watch, search, hasKey, cc: f.cc !== false, now: Date.now() };
    return { family: f.name, kids: Object.entries(f.kids).map(([id, k]) => this.kidView(id, k, true)), watch, search, hasKey, searchOn: !!f.search, cc: f.cc !== false, feed: f.feed.slice(-30), now: Date.now() };
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
      const b = bedMin(k); if (b != null) { const bt = Date.now() + (b * 60000 - sinceMidnight()); if (bt > Date.now() && bt < next) next = bt; }
    }
    if (next) await this.ctx.storage.setAlarm(Math.max(Date.now() + 1000, next)); else await this.ctx.storage.deleteAlarm();
  }
  async alarm() {
    if (!(await this.load())) return;
    for (const [id, k] of Object.entries(this.f.kids)) {
      this.roll(k);
      if (!k.run) continue;
      const left = this.left(k);
      if (asleep(k)) {
        k.used += Date.now() - k.run; k.run = 0;
        this.f.feed.push({ at: Date.now(), k: id, text: "🌙 שעת שינה, המסך נסגר" });
        await this.notify(["p", id], { title: "🌙 שעת שינה של " + k.name, body: "המסך נסגר. לילה טוב!" });
      } else if (left <= 1500) {
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
    if (p === "/search") return json(await this.search(b, kid, parent));
    if (p === "/list") return json(await this.episodes(b));
    if (p === "/state") { const v = this.view(kid); await this.save(); return json(v); }
    if (p !== "/op") return json({ error: "not found" }, 404);

    const id = kid || (f.kids[b.k] ? b.k : ""), k = id ? f.kids[id] : null;
    if (k) this.roll(k);
    switch (b.op) {
      case "start": if (!k) return json({ error: "kid" }, 400); if (asleep(k) && kid) return json({ error: "bed" }, 400); if (!k.run && this.left(k) > 0) { k.run = Date.now(); k.ended = false; } break;
      case "pause": if (!k) return json({ error: "kid" }, 400); if (k.run) { k.used += Date.now() - k.run; k.run = 0; } break;
      case "sub": { // pushes: the parents hear when time is up and when minutes were earned; a child hears "5 minutes left"
        const ep = b.sub && b.sub.endpoint; if (!okEndpoint(ep)) return json({ error: "endpoint" }, 400);
        f.subs[await subId(ep)] = { endpoint: ep, r: parent ? "p" : kid, msg: null };
        await this.save(); return json({ ok: true });
      }
      case "unsub": if (b.endpoint) delete f.subs[await subId(b.endpoint)]; await this.save(); return json({ ok: true });
      case "star": { // stars from learning and routines in HaniaKids (English, math, homework, the evening routine)
        if (!k) return json({ error: "kid" }, 400);
        const n = mins(b.n, 1, 10, 1), src = clean(b.src, 24) || "לימוד";
        if ((k.sEarn || 0) >= STAR_DAY) return json(Object.assign(this.view(kid), { capped: true }));
        const add = Math.min(n, STAR_DAY - (k.sEarn || 0));
        k.stars = (k.stars || 0) + add; k.sEarn = (k.sEarn || 0) + add;
        const last = f.feed[f.feed.length - 1];
        if (last && last.k === id && last.src === src && Date.now() - last.at < 3 * 3600000) { last.n = (last.n || 0) + add; last.text = "⭐ +" + last.n + " · " + src; last.at = Date.now(); }
        else f.feed.push({ at: Date.now(), k: id, src, n: add, text: "⭐ +" + add + " · " + src });
        break;
      }
      case "redeem": { // 10 stars become screen minutes, as the parents set (and up to their daily limit)
        if (!k) return json({ error: "kid" }, 400);
        const rate = k.starRate || 10, cap = k.starCap || 30;
        if (k.starOn === false) return json({ error: "stars off" }, 400);
        if ((k.stars || 0) < 10) return json({ error: "few stars" }, 400);
        if ((k.sRedeem || 0) + rate > cap) return json({ error: "cap" }, 400);
        if (asleep(k)) return json({ error: "bed" }, 400);
        k.stars -= 10; k.bonus += rate; k.sRedeem = (k.sRedeem || 0) + rate; k.warned = false; k.warned1 = false; k.ended = false;
        f.feed.push({ at: Date.now(), k: id, text: "⭐ 10 כוכבים → +" + rate + " דק׳" });
        await this.save();
        await this.notify(["p"], { title: "⭐ " + k.name + " המיר/ה כוכבים", body: "10 כוכבים מלמידה → " + rate + " דקות מסך" });
        break;
      }
      case "task": { // the child did something away from the screen and earns minutes
        if (!kid) return json({ error: "kid" }, 400);
        if (!k.bonusOn || k.tasks >= k.maxTasks || asleep(k)) return json({ error: "no bonus" }, 400);
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
              if (b.bed !== undefined) k.bed = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(b.bed)) ? String(b.bed) : "";
              if (b.maxTasks !== undefined) k.maxTasks = mins(b.maxTasks, 1, 6, k.maxTasks);
              if (b.read !== undefined) k.read = mins(b.read, 0, 3, 0);
              if (b.grade !== undefined) k.grade = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"].includes(b.grade) ? b.grade : "";
              if (b.starOn !== undefined) k.starOn = !!b.starOn;
              if (b.starRate !== undefined) k.starRate = mins(b.starRate, 5, 30, 10);
              if (b.starCap !== undefined) k.starCap = mins(b.starCap, 5, 120, 30);
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
          case "searchOn": f.search = !!b.on; break;
          case "cc": f.cc = !!b.on; break;
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
  // YouTube search for the children, when the parents allowed it: strict SafeSearch, only videos that can be
  // embedded, Hebrew first. Each search costs the shared daily quota, so results are cached for a day and
  // each family has a daily limit.
  async search(b, kid, parent) {
    const f = this.f, key = this.env && this.env.YT_KEY;
    if (!key) return { error: "nokey" };
    if (!f.search && !parent) return { error: "off" };
    const q = clean(b.q, 60).toLowerCase(); if (q.length < 2) return { items: [] };
    const today = IL(); if (f.sDay !== today) { f.sDay = today; f.sCount = 0; }
    // The parents search channels, playlists and videos to add to the list; the children search videos only.
    const all = !!(b.all && parent);
    const url = "https://www.googleapis.com/youtube/v3/search?part=snippet" + (all ? "&type=channel,playlist,video" : "&type=video&videoEmbeddable=true") + "&safeSearch=strict&maxResults=" + (all ? 20 : 24) + "&regionCode=IL&relevanceLanguage=he&q=" + encodeURIComponent(q);
    const ck = new Request("https://masach.hania360.com/yt-search?" + (all ? "all=2&" : "") + "q=" + encodeURIComponent(q)), cache = caches.default;
    let hit = await cache.match(ck).catch(() => null), j = hit ? await hit.json().catch(() => null) : null;
    if (!j) {
      if (f.sCount >= 60) return { error: "limit" };
      f.sCount++; await this.save();
      const r = await fetch(url + "&key=" + encodeURIComponent(key)).catch(() => null);
      if (!r || !r.ok) return { error: "yt" };
      const raw = await r.json().catch(() => null);
      const t = (x) => clean(String(x || "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&"), 80);
      const th = (x) => { const u = x.snippet.thumbnails && (x.snippet.thumbnails.medium || x.snippet.thumbnails.default); return u && /^https:\/\/(i\.ytimg\.com|yt\d\.ggpht\.com|yt\d\.googleusercontent\.com)\//.test(u.url) ? u.url : ""; };
      j = { items: ((raw && raw.items) || []).filter((x) => x.id && x.snippet && x.snippet.liveBroadcastContent !== "live").map((x) =>
        x.id.videoId ? { type: "v", id: x.id.videoId, title: t(x.snippet.title), ch: t(x.snippet.channelTitle), chId: /^UC[A-Za-z0-9_-]{22}$/.test(x.snippet.channelId || "") ? x.snippet.channelId : "", thumb: "https://i.ytimg.com/vi/" + x.id.videoId + "/mqdefault.jpg" }
        : x.id.channelId ? { type: "c", id: x.id.channelId, title: t(x.snippet.title), ch: "ערוץ", thumb: th(x) }
        : x.id.playlistId ? { type: "p", id: x.id.playlistId, title: t(x.snippet.title), ch: "רשימת השמעה · " + t(x.snippet.channelTitle), thumb: th(x) } : null).filter(Boolean) };
      await cache.put(ck, new Response(JSON.stringify(j), { headers: { "content-type": "application/json", "cache-control": "public, max-age=86400" } })).catch(() => {});
    }
    if (kid) { f.feed.push({ at: Date.now(), k: kid, text: "חיפש/ה ביוטיוב: " + q }); this.tidy(); await this.save(); }
    return j;
  }
  // The episodes of a series or channel on the family's list (so a child picks a chapter, not only "play all").
  async episodes(b) {
    const key = this.env && this.env.YT_KEY, id = String(b.id || "");
    if (!key) return { error: "nokey" };
    if (!(this.f.watch || []).some((w) => w.type === "p" && w.id === id)) return { error: "list" };
    const ck = new Request("https://masach.hania360.com/yt-list?id=" + encodeURIComponent(id)), cache = caches.default;
    const hit = await cache.match(ck).catch(() => null), j0 = hit ? await hit.json().catch(() => null) : null;
    if (j0) return j0;
    const r = await fetch("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,status&maxResults=50&playlistId=" + encodeURIComponent(id) + "&key=" + encodeURIComponent(key)).catch(() => null);
    if (!r || !r.ok) return { error: "yt" };
    const raw = await r.json().catch(() => null);
    const t = (x) => clean(String(x || "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&"), 80);
    const j = { items: ((raw && raw.items) || []).filter((x) => x.snippet && x.snippet.resourceId && YT_ID.test(x.snippet.resourceId.videoId || "") && !/^(Private|Deleted) video$/.test(x.snippet.title || "") && !(x.status && x.status.privacyStatus === "private"))
      .map((x) => ({ type: "v", id: x.snippet.resourceId.videoId, title: t(x.snippet.title), thumb: "https://i.ytimg.com/vi/" + x.snippet.resourceId.videoId + "/mqdefault.jpg" })) };
    await cache.put(ck, new Response(JSON.stringify(j), { headers: { "content-type": "application/json", "cache-control": "public, max-age=21600" } })).catch(() => {});
    return j;
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
  return { type: "p", id: up, title: clean(title || (o && String(o.title || "").replace(/^Uploads from /i, "")), 80) || "ערוץ ביוטיוב", thumb: o && /^https:\/\/i\.ytimg\.com\//.test(o.thumbnail_url || "") ? o.thumbnail_url : "" };
}

// A child says what to look for: a few seconds of audio become Hebrew text (Whisper on Workers AI),
// only for a child's link of a real family, counted in the shared limits like HaniaSefer's recordings.
async function hear(b, env, stub) {
  const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
  if (!env.AI) return json({ error: "unavailable" }, 503);
  if (!/^[A-Za-z0-9]{6,20}$/.test(b.f || "") || !(b.t || b.key)) return json({ error: "auth" }, 403);
  const audio = typeof b.audio === "string" && b.audio.length <= 700000 && /^[A-Za-z0-9+/=]+$/.test(b.audio) ? b.audio : "";
  if (!audio) return json({ error: "input" }, 400);
  const ok = await stub(b.f).fetch("https://m/state", { method: "POST", body: JSON.stringify(b.key ? { f: b.f, key: String(b.key) } : { f: b.f, t: String(b.t) }) });
  if (!ok.ok) return json({ error: "auth" }, 403);
  if (env.SIPUR) {
    const lim = await env.SIPUR.get(env.SIPUR.idFromName("limits")).fetch("https://l/", { method: "POST", body: JSON.stringify({ device: "f" + b.f + "xxxxxxxx", ns: "masachh:", perDevice: 80, perDay: 1500 }) }).then((r) => r.json()).catch(() => ({ ok: true }));
    if (!lim.ok) return json({ error: "limit" }, 429);
  }
  try {
    const out = await env.AI.run("@cf/openai/whisper-large-v3-turbo", { audio, language: "he", vad_filter: true });
    const text = clean(out && out.text, 60).replace(/[.!?,]+$/, "");
    return json({ text });
  } catch { return json({ error: "hear" }, 502); }
}

/** masach.hania360.com/api/masach/*: create a family, read it, change it, pair a TV. */
export async function masachApi(req, env, url) {
  if (!env.MASACH) return Response.json({ error: "not configured" }, { status: 503 });
  const stub = (id) => env.MASACH.get(env.MASACH.idFromName("f:" + id));
  const mm = url.pathname.match(/^\/api\/masach\/(new|state|op|key|msg|tv|search|hear|list)$/);
  if (!mm) return Response.json({ error: "not found" }, { status: 404 });
  if (req.method !== "POST") return Response.json({ error: "method" }, { status: 405 });
  const body = await req.text();
  if (body.length > 4000) return Response.json({ error: "size" }, { status: 413 });
  let b = {}; try { b = JSON.parse(body || "{}"); } catch { return Response.json({ error: "json" }, { status: 400 }); }
  if (mm[1] === "hear") return hear(b, env, stub);
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
