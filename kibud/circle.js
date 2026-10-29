// HaniaKibud (כיבוד הורים): one Durable Object per family circle around a parent or grandparent.
// Every day someone else calls: a fair rota by the days each one can, a morning reminder to whoever's
// turn it is, a ✓ with a line for the family feed after the call, and an evening alert to the whole
// circle when nobody has called yet. Pushes carry no payload; the phone asks /msg what to show.

import { okEndpoint, subId, vapidKeys, wake } from "../lib/webpush.js";

const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const token = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[x % 57]).join(""); };
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const IL = (t = Date.now()) => { const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(t)); const o = {}; for (const p of f) o[p.type] = p.value; return { day: o.year + "-" + o.month + "-" + o.day, hour: +o.hour, min: +o.minute }; };
const addDays = (d, n) => new Date(Date.parse(d + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const wd = (d) => new Date(d + "T12:00:00Z").getUTCDay();
const COLORS = ["#E8833A", "#2E86DE", "#10AC84", "#C0392B", "#8E44AD", "#D4A017", "#0ABDE3", "#E15F41", "#3B3B98", "#16A085", "#B33771", "#6D214F"];
const MORNING = 9, EVENING = 19, AHEAD = 14, KEEP = 180;
const MOODS = ["😊", "😐", "😟"];
const phoneOk = (s) => { const d = String(s || "").replace(/[^\d+]/g, ""); return /^(\+?972|0)\d{8,9}$/.test(d) ? d : ""; };

export class KibudCircle {
  constructor(ctx) { this.ctx = ctx; }
  async load() { return (this.c = this.c || (await this.ctx.storage.get("c")) || null); }
  async save() { await this.ctx.storage.put("c", this.c); }

  view() {
    const c = this.c;
    return { name: c.name, phone: c.phone, members: c.members, plan: c.plan, calls: c.calls, feed: c.feed.slice(-80), today: IL().day };
  }
  // Fills the next days that have nobody yet: the one who called least lately, among those who can that day.
  fill(from) {
    const c = this.c, ids = Object.keys(c.members); if (!ids.length) return;
    const n = {}; ids.forEach((m) => (n[m] = 0));
    const since = addDays(from, -28);
    for (const d in c.plan) if (d >= since && n[c.plan[d]] != null) n[c.plan[d]]++;
    let last = c.plan[addDays(from, -1)];
    for (let i = 0; i < AHEAD; i++) {
      const d = addDays(from, i);
      if (c.plan[d] && c.members[c.plan[d]]) { last = c.plan[d]; continue; }
      let can = ids.filter((m) => c.members[m].days.includes(wd(d)));
      if (!can.length) can = ids;
      const pick = can.slice().sort((a, b) => ((a === last) - (b === last)) || (n[a] - n[b]) || (Math.random() - 0.5))[0];
      c.plan[d] = pick; n[pick]++; last = pick;
    }
  }
  tidy() {
    const c = this.c, cut = addDays(IL().day, -KEEP);
    for (const d in c.plan) if (d < cut) delete c.plan[d];
    for (const d in c.calls) if (d < cut) delete c.calls[d];
    c.feed = c.feed.filter((f) => f.at > Date.now() - KEEP * 864e5).slice(-300);
  }

  async notify(only, except, msg) {
    const c = this.c, v = await vapidKeys(this.ctx.storage);
    for (const [id, s] of Object.entries(c.subs)) {
      if (only && s.m !== only) continue;
      if (except && s.m === except) continue;
      s.msg = { title: msg.title, body: msg.body, url: "/#" + c.id };
      if (!(await wake(v, s.endpoint, "https://kibud.hania360.com"))) delete c.subs[id];
    }
    await this.save();
  }
  async schedule() {
    const now = IL(), mins = now.hour * 60 + now.min, base = Date.now() - mins * 60000 - (Date.now() % 60000);
    const next = [MORNING, EVENING, MORNING + 24].map((h) => base + h * 3600000).find((t) => t > Date.now() + 30000);
    await this.ctx.storage.setAlarm(next);
  }
  async alarm() {
    if (!(await this.load())) return;
    const c = this.c, now = IL(), d = now.day;
    this.fill(d);
    if (Object.keys(c.subs).length && !(c.calls[d] || []).length) {
      const who = c.plan[d];
      if (now.hour < 12) {
        if (who) await this.notify(who, null, { title: "☎️ היום תורך להתקשר ל" + c.name, body: "שיחה קצרה עושה לו/ה את היום. אחרי השיחה מסמנים ✓." });
      } else {
        await this.notify(null, null, { title: "📵 עוד לא דיברו היום עם " + c.name, body: (who && c.members[who] ? "היום זה היה התור של " + c.members[who].name + ". " : "") + "מי יכול/ה להתקשר עכשיו?" });
      }
    }
    this.tidy(); await this.save(); await this.schedule();
  }

  async fetch(req) {
    const url = new URL(req.url), p = url.pathname;
    const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
    const b = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (p === "/init") {
      if (await this.load()) return json({ error: "exists" }, 409);
      const members = {};
      (b.members || []).map((x) => clean(x, 24)).filter(Boolean).slice(0, 12).forEach((n, i) => { members["m" + i] = { name: n, color: COLORS[i % COLORS.length], days: [0, 1, 2, 3, 4, 5, 6] }; });
      if (Object.keys(members).length < 1) return json({ error: "few" }, 400);
      this.c = { id: b.id, name: clean(b.name, 30) || "סבתא", phone: phoneOk(b.phone), members, plan: {}, calls: {}, feed: [], subs: {}, next: Object.keys(members).length, created: Date.now() };
      this.fill(IL().day);
      await this.save(); await this.schedule();
      return json({ ok: true });
    }
    if (!(await this.load())) return json({ error: "no circle" }, 404);
    const c = this.c;
    if (p === "/state") return json(this.view());
    if (p === "/key") return json({ key: (await vapidKeys(this.ctx.storage)).pub });
    if (p === "/msg") { const s = b.endpoint ? c.subs[await subId(b.endpoint)] : null; return json(s && s.msg ? s.msg : {}); }
    if (p !== "/op") return json({ error: "not found" }, 404);

    const m = c.members[b.m] ? b.m : "";
    switch (b.op) {
      case "called": { // ✓ after a call or a visit, with an optional line for the family
        if (!m) return json({ error: "who" }, 400);
        const d = IL().day, kind = b.kind === "visit" ? "visit" : "call", mood = MOODS.includes(b.mood) ? b.mood : "";
        const first = !(c.calls[d] || []).length;
        (c.calls[d] = c.calls[d] || []).push({ m, at: Date.now(), kind });
        c.feed.push({ id: token(6), at: Date.now(), m, kind, mood, text: clean(b.text, 300) });
        await this.save();
        if (first && c.plan[d] && c.plan[d] !== m) await this.notify(c.plan[d], null, { title: "✅ " + c.members[m].name + " כבר דיבר/ה היום עם " + c.name, body: "אפשר להתקשר גם, אבל התור של היום מכוסה." });
        break;
      }
      case "note": { // a line without a call: "she asked about the holiday", a doctor's appointment
        if (!m) return json({ error: "who" }, 400);
        const t = clean(b.text, 300); if (!t) return json({ error: "text" }, 400);
        c.feed.push({ id: token(6), at: Date.now(), m, kind: "note", mood: "", text: t });
        break;
      }
      case "unfeed": c.feed = c.feed.filter((f) => !(f.id === b.id && f.m === m)); break;
      case "take": // "I'll call today" or swap a day
        if (!isDate(b.date) || !m) return json({ error: "date" }, 400);
        c.plan[b.date] = m; break;
      case "days": if (!m) return json({ error: "who" }, 400); c.members[m].days = (Array.isArray(b.days) ? b.days : []).map(Number).filter((d) => d >= 0 && d <= 6); for (let i = 1; i < AHEAD; i++) { const d = addDays(IL().day, i); if (c.plan[d] === m && !c.members[m].days.includes(wd(d))) delete c.plan[d]; } this.fill(IL().day); break;
      case "refill": for (let i = 1; i < AHEAD; i++) delete c.plan[addDays(IL().day, i)]; this.fill(IL().day); break;
      case "member": {
        if (b.remove && c.members[b.remove]) { delete c.members[b.remove]; for (const d in c.plan) if (c.plan[d] === b.remove && d >= IL().day) delete c.plan[d]; this.fill(IL().day); break; }
        const name = clean(b.name, 24); if (!name) return json({ error: "name" }, 400);
        if (b.id && c.members[b.id]) c.members[b.id].name = name;
        else { if (Object.keys(c.members).length >= 12) return json({ error: "full" }, 400); const id = "m" + c.next++; c.members[id] = { name, color: COLORS[(c.next - 1) % COLORS.length], days: [0, 1, 2, 3, 4, 5, 6] }; for (let i = 1; i < AHEAD; i++) delete c.plan[addDays(IL().day, i)]; this.fill(IL().day); }
        break;
      }
      case "parent": c.name = clean(b.name, 30) || c.name; if (b.phone !== undefined) c.phone = phoneOk(b.phone); break;
      case "sub": {
        const ep = b.sub && b.sub.endpoint; if (!okEndpoint(ep)) return json({ error: "endpoint" }, 400);
        if (!m) return json({ error: "who" }, 400);
        c.subs[await subId(ep)] = { endpoint: ep, m, msg: null };
        break;
      }
      case "unsub": if (b.endpoint) delete c.subs[await subId(b.endpoint)]; break;
      default: return json({ error: "op" }, 400);
    }
    this.tidy(); await this.save();
    return json(this.view());
  }
}

/** kibud.hania360.com/api/kibud/*: create a circle, read it, change it. */
export async function kibudApi(req, env, url) {
  if (!env.KIBUD) return Response.json({ error: "not configured" }, { status: 503 });
  const stub = (id) => env.KIBUD.get(env.KIBUD.idFromName("k:" + id));
  const mm = url.pathname.match(/^\/api\/kibud\/(new|state|op|key|msg)$/);
  if (!mm) return Response.json({ error: "not found" }, { status: 404 });
  if (mm[1] === "new" && req.method === "POST") {
    const b = await req.json().catch(() => null); if (!b) return Response.json({ error: "json" }, { status: 400 });
    const id = token(10);
    const r = await stub(id).fetch("https://k/init", { method: "POST", body: JSON.stringify(Object.assign({}, b, { id })) });
    const j = await r.json();
    return Response.json(j.ok ? { id } : j, { status: r.status });
  }
  let cid = url.searchParams.get("c"), body;
  if (req.method === "POST") { body = await req.text(); try { cid = JSON.parse(body).c || cid; } catch (e) {} }
  if (!/^[A-Za-z0-9]{6,20}$/.test(cid || "")) return Response.json({ error: "circle" }, { status: 400 });
  return stub(cid).fetch("https://k/" + mm[1], { method: req.method, body });
}
