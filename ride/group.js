// HaniaRide (הסעות): one Durable Object per carpool group. Everyone with the group link sees the
// same week and can change it: who drives each leg, asking for a replacement, days off.
// Each phone can say which family it is and get a push the evening before it drives, and when
// someone asks for a replacement.

import { okEndpoint, subId, vapidKeys, wake } from "../lib/webpush.js";

const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const token = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[x % 57]).join(""); };
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTime = (s) => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const IL = (t = Date.now()) => { const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(t)); const o = {}; for (const p of f) o[p.type] = p.value; return { day: o.year + "-" + o.month + "-" + o.day, hour: +o.hour, min: +o.minute }; };
const addDays = (d, n) => new Date(Date.parse(d + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const wd = (d) => new Date(d + "T12:00:00Z").getUTCDay();
const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const COLORS = ["#FF8A1F", "#2E86DE", "#10AC84", "#EE5253", "#8E44AD", "#F6B93B", "#0ABDE3", "#E15F41", "#3B3B98", "#1DD1A1"];
const EVENING = 20; // the reminder for tomorrow goes out at 20:00 Israel time

export class RideGroup {
  constructor(ctx) { this.ctx = ctx; }
  async load() { return (this.g = this.g || (await this.ctx.storage.get("g")) || null); }
  async save() { await this.ctx.storage.put("g", this.g); }

  view() {
    const g = this.g;
    return { name: g.name, fams: g.fams, legs: g.legs, plan: g.plan, help: g.help, off: g.off, today: IL().day };
  }
  // Drives per family over the 5 weeks around a date, for a fair fill.
  counts(around) {
    const g = this.g, from = addDays(around, -28), to = addDays(around, 7), n = {};
    for (const id in g.fams) n[id] = 0;
    for (const k in g.plan) { const [d] = k.split("|"); if (d >= from && d <= to && n[g.plan[k]] != null) n[g.plan[k]]++; }
    return n;
  }
  fillWeek(start) {
    const g = this.g, ids = Object.keys(g.fams); if (!ids.length) return 0;
    const n = this.counts(start); let filled = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i); if (g.off[d]) continue;
      const busy = new Set();
      for (const leg of g.legs) {
        if (!leg.days.includes(wd(d))) continue;
        const k = d + "|" + leg.id; if (g.plan[k]) { busy.add(g.plan[k]); continue; }
        // The family with the fewest drives, preferring one that does not drive the other leg that day.
        const pick = ids.slice().sort((a, b) => (busy.has(a) - busy.has(b)) || (n[a] - n[b]) || (Math.random() - 0.5))[0];
        g.plan[k] = pick; n[pick]++; busy.add(pick); filled++;
      }
    }
    return filled;
  }

  async notify(fam, msg) {
    const g = this.g, v = await vapidKeys(this.ctx.storage);
    for (const [id, s] of Object.entries(g.subs)) {
      if (fam && s.fam !== fam) continue;
      if (!fam && msg.except && s.fam === msg.except) continue;
      s.msg = { title: msg.title, body: msg.body, url: "/#" + g.id };
      if (!(await wake(v, s.endpoint, "https://ride.hania360.com"))) delete g.subs[id];
    }
    await this.save();
  }
  async schedule() {
    const now = IL(), base = Date.now() - ((now.hour * 60 + now.min) * 60000);
    let at = base + EVENING * 3600000; if (at <= Date.now() + 30000) at += 864e5;
    await this.ctx.storage.setAlarm(at);
  }
  async alarm() {
    if (!(await this.load())) return;
    const g = this.g, tomorrow = addDays(IL().day, 1);
    if (!g.off[tomorrow] && Object.keys(g.subs).length) {
      const mine = {};
      for (const leg of g.legs) { const f = g.plan[tomorrow + "|" + leg.id]; if (f && leg.days.includes(wd(tomorrow))) (mine[f] = mine[f] || []).push(leg.label + " ב־" + leg.time); }
      for (const f in mine) await this.notify(f, { title: "🚗 מחר את/ה מסיע/ה", body: "יום " + DAYS[wd(tomorrow)] + ": " + mine[f].join(", ") + " · " + g.name });
    }
    await this.schedule();
  }

  async fetch(req) {
    const url = new URL(req.url), p = url.pathname;
    const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
    const b = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (p === "/init") {
      if (await this.load()) return json({ error: "exists" }, 409);
      const fams = {};
      (b.fams || []).map((x) => clean(x, 24)).filter(Boolean).slice(0, 12).forEach((n, i) => { fams["f" + i] = { name: n, color: COLORS[i % COLORS.length] }; });
      if (Object.keys(fams).length < 2) return json({ error: "few" }, 400);
      const legs = (b.legs || []).slice(0, 4).map((l, i) => ({ id: "l" + i, label: clean(l.label, 16) || (i ? "חזור" : "הלוך"), time: isTime(l.time) ? l.time : i ? "13:00" : "07:30", days: (Array.isArray(l.days) ? l.days : [0, 1, 2, 3, 4]).map(Number).filter((d) => d >= 0 && d <= 6) }));
      if (!legs.length) return json({ error: "legs" }, 400);
      this.g = { id: b.id, name: clean(b.name, 40) || "ההסעות שלנו", fams, legs, plan: {}, help: {}, off: {}, subs: {}, next: Object.keys(fams).length, created: Date.now() };
      this.fillWeek(addDays(IL().day, -wd(IL().day)));
      await this.save(); await this.schedule();
      return json({ ok: true });
    }
    if (!(await this.load())) return json({ error: "no group" }, 404);
    const g = this.g;
    if (p === "/state") return json(this.view());
    if (p === "/key") return json({ key: (await vapidKeys(this.ctx.storage)).pub });
    if (p === "/msg") { const s = b.endpoint ? g.subs[await subId(b.endpoint)] : null; return json(s && s.msg ? s.msg : {}); }
    if (p !== "/op") return json({ error: "not found" }, 404);

    const k = isDate(b.date) && g.legs.some((l) => l.id === b.leg) ? b.date + "|" + b.leg : null;
    switch (b.op) {
      case "set": // who drives a leg; empty clears it
        if (!k) return json({ error: "slot" }, 400);
        if (b.fam && g.fams[b.fam]) g.plan[k] = b.fam; else delete g.plan[k];
        if (g.help[k] && g.plan[k] !== g.help[k]) {
          const asked = g.help[k]; delete g.help[k];
          if (g.plan[k]) await this.notify(asked, { title: "🙌 נמצא מחליף", body: g.fams[g.plan[k]].name + " יסיע/תסיע ב" + DAYS[wd(b.date)] + " " + (g.legs.find((l) => l.id === b.leg) || {}).label });
        }
        break;
      case "help": { // ask for a replacement, or take the request back
        if (!k || !g.plan[k]) return json({ error: "slot" }, 400);
        if (g.help[k]) { delete g.help[k]; break; }
        g.help[k] = g.plan[k];
        const leg = g.legs.find((l) => l.id === b.leg);
        await this.save();
        await this.notify(null, { title: "🙋 מחפשים מחליף", body: g.fams[g.plan[k]].name + " צריך/ה מחליף ליום " + DAYS[wd(b.date)] + " " + b.date.slice(8) + "/" + b.date.slice(5, 7) + ", " + leg.label + " ב־" + leg.time, except: g.plan[k] });
        break;
      }
      case "off": if (!isDate(b.date)) return json({ error: "date" }, 400); if (g.off[b.date]) delete g.off[b.date]; else g.off[b.date] = true; break;
      case "fill": if (!isDate(b.week)) return json({ error: "week" }, 400); this.fillWeek(b.week); break;
      case "clearweek": if (!isDate(b.week)) return json({ error: "week" }, 400); for (let i = 0; i < 7; i++) for (const l of g.legs) { delete g.plan[addDays(b.week, i) + "|" + l.id]; delete g.help[addDays(b.week, i) + "|" + l.id]; } break;
      case "fam": { // add, rename or remove a family
        if (b.remove && g.fams[b.remove]) { delete g.fams[b.remove]; for (const x in g.plan) if (g.plan[x] === b.remove && x.split("|")[0] >= IL().day) delete g.plan[x]; break; }
        const name = clean(b.name, 24); if (!name) return json({ error: "name" }, 400);
        if (b.id && g.fams[b.id]) g.fams[b.id].name = name;
        else { if (Object.keys(g.fams).length >= 12) return json({ error: "full" }, 400); const id = "f" + g.next++; g.fams[id] = { name, color: COLORS[(g.next - 1) % COLORS.length] }; }
        break;
      }
      case "legs": {
        const legs = (b.legs || []).slice(0, 4).map((l, i) => ({ id: g.legs[i] ? g.legs[i].id : "l" + i + token(2), label: clean(l.label, 16) || "נסיעה", time: isTime(l.time) ? l.time : "07:30", days: (Array.isArray(l.days) ? l.days : []).map(Number).filter((d) => d >= 0 && d <= 6) }));
        if (legs.length) g.legs = legs;
        break;
      }
      case "name": g.name = clean(b.name, 40) || g.name; break;
      case "sub": {
        const ep = b.sub && b.sub.endpoint; if (!okEndpoint(ep)) return json({ error: "endpoint" }, 400);
        if (!g.fams[b.fam]) return json({ error: "fam" }, 400);
        g.subs[await subId(ep)] = { endpoint: ep, fam: b.fam, msg: null };
        break;
      }
      case "unsub": if (b.endpoint) delete g.subs[await subId(b.endpoint)]; break;
      default: return json({ error: "op" }, 400);
    }
    // Old weeks are dropped after 120 days.
    const cut = addDays(IL().day, -120);
    for (const x in g.plan) if (x < cut) delete g.plan[x];
    for (const x in g.off) if (x < cut) delete g.off[x];
    await this.save();
    return json(this.view());
  }
}

/** ride.hania360.com/api/ride/*: create a group, read it, change it. */
export async function rideApi(req, env, url) {
  if (!env.RIDE) return Response.json({ error: "not configured" }, { status: 503 });
  const stub = (id) => env.RIDE.get(env.RIDE.idFromName("r:" + id));
  const m = url.pathname.match(/^\/api\/ride\/(new|state|op|key|msg)$/);
  if (!m) return Response.json({ error: "not found" }, { status: 404 });
  if (m[1] === "new" && req.method === "POST") {
    const b = await req.json().catch(() => null); if (!b) return Response.json({ error: "json" }, { status: 400 });
    const id = token(9);
    const r = await stub(id).fetch("https://r/init", { method: "POST", body: JSON.stringify(Object.assign({}, b, { id })) });
    const j = await r.json();
    return Response.json(j.ok ? { id } : j, { status: r.status });
  }
  let gid = url.searchParams.get("g"), body;
  if (req.method === "POST") { body = await req.text(); try { gid = JSON.parse(body).g || gid; } catch (e) {} }
  if (!/^[A-Za-z0-9]{6,20}$/.test(gid || "")) return Response.json({ error: "group" }, { status: 400 });
  return stub(gid).fetch("https://r/" + m[1], { method: req.method, body });
}
