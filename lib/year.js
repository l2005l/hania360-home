// "השנה שלנו" (hania360.com/shana): a family's year with Hania360 as an animated story.
// /api/year reads the signed-in person's own backup (HaniaSync, lib/sync.js: one record per app, each the app's
// localStorage) and turns the apps it knows into a few numbers and moments for the last twelve months.
// Only this person's own data, only to them; nothing is stored. Apps without dates count everything so far.
import { HUBS } from "./hub.js";

const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const MORE = {
  fit: ["💪", "כושר"], daber: ["🗣️", "מדברים אנגלית"], tv: ["📺", "HaniaTV"], race: ["🏎️", "מרוץ"], sport: ["⚽", "ספורט"], sky: ["✨", "השמיים מעליך"], frame: ["🖼️", "מסגרת לסבתא"], party: ["🎮", "מסיבה"], globe: ["🌍", "כדור הארץ"],
  layla: ["🌛", "לילה טוב"], hazmana: ["💌", "הזמנות"], park: ["🅿️", "חניה"], chanukah: ["🕎", "חנוכה"], dat: ["🕯️", "HaniaDat"], limud: ["📚", "לימוד יומי"],
  home: ["🏡", "הבית"], pick: ["🍽️", "מה אוכלים"], ride: ["🚗", "נסיעות"], quiz: ["❓", "חידון"], play: ["🎲", "משחקים"], tisa: ["✈️", "טיסות"], ezra: ["🤝", "עזרה"],
  kibud: ["🍰", "כיבוד"], gamad: ["🧙", "גמד וענק"], caption: ["💬", "כיתובים"], check: ["✅", "בדיקות"], years: ["🎂", "ימי הולדת"], chag: ["🗓️", "החג הקרוב"]
};
function appInfo(k) { for (const h of Object.values(HUBS)) for (const a of h.apps) if (a[0] === k) return [a[1], a[2]]; return MORE[k] || null; }
const KEYS = { shigra: "haniashigra-v1", matalot: "matalot-v1", english: "haniaenglish-v1", ivrit: "haniaivrit-v1", fit: "fit-v1", daber: "daber-v1", limud: "hanialimud-v1", bracha: "haniabracha-v1", race: "race-v1" };
const ymd = (t) => new Date(t).toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
const isDay = (d) => typeof d === "string" && /^\d{4}-\d\d-\d\d$/.test(d);
const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
const nm = (s, n) => String(s == null ? "" : s).slice(0, n || 20);
function spread(a, n) { if (a.length <= n) return a; const out = []; for (let i = 0; i < n; i++) out.push(a[Math.round(i * (a.length - 1) / (n - 1))]); return out; }
function streak(days) { // the longest run of days in a row
  const s = [...new Set(days)].sort(); let best = 0, cur = 0, prev = null;
  for (const d of s) { const t = Date.parse(d + "T12:00:00Z"); cur = prev != null && t - prev < 1.5 * 864e5 ? cur + 1 : 1; prev = t; if (cur > best) best = cur; }
  return best;
}

const X = {
  shigra(S, f) {
    const kids = (S.kids || []).map((k) => ({ id: k.id, name: nm(k.name), av: nm(k.av, 8) || "⭐", stars: 0, eve: 0 })), by = Object.fromEntries(kids.map((k) => [k.id, k]));
    let stars = 0, days = 0, best = null;
    for (const [d, o] of Object.entries(S.stars || {})) {
      if (!isDay(d) || d < f) continue; let n = 0;
      for (const [id, v] of Object.entries(o || {})) { const x = Math.max(0, +v || 0); n += x; if (by[id]) by[id].stars += x; }
      stars += n; if (n) days++; if (!best || n > best.n) best = { d, n };
    }
    let eve = 0, morn = 0; const eveDays = [];
    for (const [d, o] of Object.entries(S.runs || {})) {
      if (!isDay(d) || d < f) continue;
      for (const [key, r] of Object.entries(o || {})) { if (!r || !r.fin) continue; const [mode, id] = key.split(":"); if (mode === "evening") { eve++; eveDays.push(d); if (by[id]) by[id].eve++; } else morn++; }
    }
    const faces = {}, moments = [];
    for (const [d, o] of Object.entries(S.diary || {})) {
      if (!isDay(d) || d < f) continue;
      for (const [id, e] of Object.entries(o || {})) { if (!e) continue; if (e.f) faces[nm(e.f, 8)] = (faces[nm(e.f, 8)] || 0) + 1; if (e.txt && String(e.txt).trim()) moments.push({ d, name: by[id] ? by[id].name : "", txt: nm(String(e.txt).trim(), 140) }); }
    }
    moments.sort((a, b) => (a.d < b.d ? -1 : 1));
    const prizes = {}, fromT = Date.parse(f); let won = 0;
    for (const m of S.mem || []) { if (!m || !(+m.at >= fromT)) continue; won++; const p = nm(m.prize || "🎁", 30); prizes[p] = (prizes[p] || 0) + 1; }
    if (!stars && !eve && !morn && !won && !moments.length) return null;
    return { stars, days, best, eve, morn, streak: streak(eveDays), kids: kids.filter((k) => k.stars || k.eve).sort((a, b) => b.stars - a.stars).map(({ id, ...k }) => k), faces: top(faces, 3), moments: spread(moments, 5), won, prizes: top(prizes, 5) };
  },
  matalot(S, f) {
    const kids = Object.fromEntries((S.kids || []).map((k) => [k.id, { name: nm(k.name), av: nm(k.av, 8) || "🧹", n: 0 }])), chores = Object.fromEntries((S.chores || []).map((c) => [c.id, c]));
    let done = 0, pts = 0; const cc = {};
    for (const [d, L] of Object.entries(S.log || {})) {
      if (!isDay(d) || d < f) continue;
      for (const [key, e] of Object.entries(L || {})) {
        if (!e || (e.st !== "ok" && e.st !== "d")) continue; const [cid, kid] = key.split("|"), c = chores[cid];
        done++; pts += c ? +c.p || 1 : 1; if (kids[kid]) kids[kid].n++; if (c) { const k = (nm(c.e, 8) + " " + nm(c.n, 30)).trim(); cc[k] = (cc[k] || 0) + 1; }
      }
    }
    if (!done) return null;
    return { done, pts, kids: Object.values(kids).filter((k) => k.n).sort((a, b) => b.n - a.n), top: top(cc, 3) };
  },
  english(S) { return learnKids(S, 3); },
  ivrit(S) { return learnKids(S, 3); },
  limud(S, f) {
    let daf = 0, hal = 0; const days = [];
    for (const [d, o] of Object.entries(S.learned || {})) { if (!isDay(d) || d < f || !o) continue; const k = Object.keys(o).filter((x) => o[x]); if (!k.length) continue; days.push(d); if (o.daf) daf++; if (o.hal) hal++; }
    return days.length ? { days: days.length, daf, hal, streak: streak(days) } : null;
  },
  daber(S, f) {
    const log = (S.log || []).filter((e) => e && isDay(e.d) && e.d >= f);
    let mins = 0; for (const [d, m] of Object.entries(S.days || {})) if (isDay(d) && d >= f) mins += Math.max(0, +m || 0);
    if (!log.length && !mins) return null;
    return { talks: log.length, mins: Math.round(mins), words: log.reduce((s, e) => s + (+e.words || 0), 0), level: +S.level || 1 };
  },
  fit(S, f) {
    const log = (S.log || []).filter((e) => e && isDay(e.d) && e.d >= f); if (!log.length) return null;
    const names = {}, months = {}; let mins = 0;
    for (const e of log) { mins += Math.max(0, +e.min || 0); const n = nm(e.name, 40); if (n) names[n] = (names[n] || 0) + 1; const m = e.d.slice(0, 7); months[m] = (months[m] || 0) + 1; }
    return { workouts: log.length, mins: Math.round(mins), fav: top(names, 1)[0] || null, month: top(months, 1)[0] || null, streak: streak(log.map((e) => e.d)) };
  },
  bracha(S) { const n = Math.max(0, +S.stars || 0); return n ? { stars: n } : null; },
  race(S) { const v = Object.values(S.stars || {}).map((x) => Math.max(0, +x || 0)); const n = v.reduce((a, b) => a + b, 0); return n ? { stars: n, tracks: v.filter(Boolean).length } : null; }
};
function learnKids(S, LESSONS) {
  const kids = (S.kids || []).map((k) => ({ name: nm(k.name), av: nm(k.av, 8) || "⭐", stars: Math.max(0, +k.stars || 0), units: Object.values(k.prog || {}).filter((p) => Array.isArray(p) && p.filter((x) => x > 0).length >= LESSONS).length })).filter((k) => k.stars || k.units);
  if (!kids.length) return null;
  return { stars: kids.reduce((s, k) => s + k.stars, 0), units: kids.reduce((s, k) => s + k.units, 0), kids: kids.sort((a, b) => b.stars - a.stars) };
}

export async function yearApi(request, env, passUser) {
  if (!env.SYNC) return json({ error: "off" }, 503);
  const who = await passUser(request, env).catch(() => null);
  if (!who) return json({ signin: true }, 401);
  const stub = env.SYNC.get(env.SYNC.idFromName("u:" + who.id));
  const list = ((await (await stub.fetch("https://sync/list")).json()) || {}).apps || [];
  const now = Date.now(), from = ymd(now - 365 * 864e5), fromT = Date.parse(from);
  const out = { from, to: ymd(now), apps: [] };
  for (const a of list) { const i = appInfo(a.app); if (i && a.keys && +a.at >= fromT) out.apps.push({ app: a.app, e: i[0], name: i[1] }); }
  await Promise.all(Object.keys(KEYS).filter((k) => list.some((a) => a.app === k)).map(async (k) => {
    try {
      const r = await (await stub.fetch("https://sync/get?app=" + k)).json(), v = r && r.keys && r.keys[KEYS[k]];
      if (!v || typeof v[0] !== "string") return;
      const res = X[k](JSON.parse(v[0]) || {}, from); if (res) out[k] = res;
    } catch (e) { /* one app that cannot be read does not stop the others */ }
  }));
  return json(out);
}
export const YEAR_X = X; // for the tests
