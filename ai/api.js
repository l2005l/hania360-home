// Hania (סוכנת AI): the owner's personal assistant at ai.hania360.com. Only the owner's Hania360 account reaches it
// (the AI_OWNER secret, else KASEFET_OWNER). It reads what the apps already know (the day, Shabbat, Daf Yomi, the
// owner's Today: tasks, notes, birthdays, calendar; news, sport, live TV, the app map) and can act in Today
// (add a task or a note with a reminder, mark a task done, add a repeating reminder) only after the owner says yes.
//
// Light on requests: one chat turn is one counted request (a daily cap), at most three model steps, short history,
// and a confirmed action runs without asking the model again. On Shabbat and holidays it rests.

import { widgetApi } from "../now/widget.js";
import { newsItems, fxRates } from "../now/live.js";
import { sportApi } from "../sport/api.js";
import { tvApi } from "../tv/api.js";
import { WORLDS } from "../now/map.js";
import { APPS } from "../lib/growth.js";
import { CITIES } from "../lib/cities.js";

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast", FALLBACK = "@cf/google/gemma-4-26b-a4b-it";
const PER_DAY = 120, STEPS = 3, TZ = "Asia/Jerusalem";
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const ymd = (t) => new Date(t).toLocaleDateString("en-CA", { timeZone: TZ });
const clip = (o, n = 2600) => { const s = typeof o === "string" ? o : JSON.stringify(o); return s.length > n ? s.slice(0, n) + "…" : s; };
const cookieOf = (h, k) => { const m = new RegExp("(?:^|;\\s*)" + k + "=([^;]*)").exec(h || ""); return m ? decodeURIComponent(m[1]) : ""; };

// Live TV: the channels HaniaTV checks, by name (YouTube channel id).
const TV = { "i24NEWS עברית": "UCisowXt5wZkp2sR3rFh9lnQ", "כאן 11": "UCKqFqiCe1dCUxRe0_YNZ6gg", "כאן חדשות": "UC_HwfTAcjBESKZRJq6BTCpg", "N12": "UCZH1ZFHSLSZEh_Ek2L-vrgA", "רשת 13": "UC8vRsz-RmoBznazlIULyqhQ", "ערוץ 14": "UCI2UmoF6sGS4jpc0UOOpiZA", "ערוץ הכנסת": "UCpjNXONNE-JUz7QACB1Cgcw",
  "DW": "UCknLrEdhRCp1aegoMqRaCZg", "France 24": "UCQfwfsi5VrQ8yKZ-UWmAEFg", "Sky News": "UCoMdktPbSTixAyNGwb-UYkQ", "NASA": "UCLA_DiR1FfKNvjuUpBHmylQ", "FIFA": "UCpcTrCXblq78GZrTUTLWeBw", "ספורט 5": "UCyDXSV8tcOBzReuW49tG3MA", "ליגת העל בכדורסל": "UCNWMa_pdt1GIWH_zwbTldEQ", "ATP": "UCY_5h5zaSwN7Or4kIJDYNXA", "Lofi Girl": "UCSJ4gkVC6NrvII8umztf0Ow" };

// ---- what the assistant can do ----
const TOOLS = {
  day: { d: "התאריך העברי והלועזי, זמני השבת הקרובה (הדלקה ויציאה) לפי עיר, החג הבא, מזג האוויר, דולר ויורו, וכותרות", a: '{"city":"שם עיר בישראל, לא חובה"}' },
  my_today: { d: "מה יש לי היום ב־Today: משימות פתוחות (עם id), פתקים ותזכורות, תזכורות חוזרות, ימי הולדת קרובים, היומן של היום, שוברים שפג תוקפם", a: "{}" },
  limud: { d: "הלימוד היומי: הדף היומי, ההלכה היומית, רמב״ם, פרשת השבוע, תהלים", a: "{}" },
  news: { d: "כותרות חדשות אחרונות", a: "{}" },
  sport: { d: "ספורט: il = ליגת העל בכדורגל (טבלה ומשחקים), euro = יורוליג (מכבי והפועל ת״א), nba = דני אבדיה, world = משחקי היום בעולם", a: '{"what":"il|euro|nba|world"}' },
  tv: { d: "אילו ערוצים משדרים עכשיו בשידור חי ב־HaniaTV", a: "{}" },
  find_app: { d: "מציאת אפליקציה של Hania360 לפי מה שרוצים לעשות, עם קישור", a: '{"q":"מה מחפשים"}' },
  add_task: { d: "הוספת משימה ל־Today", a: '{"text":"עד 80 תווים","day":"YYYY-MM-DD, לא חובה"}', write: 1 },
  add_note: { d: "פתק ליום מסוים, ואם יש שעה אפשר תזכורת לטלפון 15 דקות לפני", a: '{"text":"עד 80 תווים","day":"YYYY-MM-DD","time":"HH:MM, לא חובה","remind":true}', write: 1 },
  done_task: { d: "סימון משימה כבוצעה (id מ־my_today)", a: '{"id":"...","text":"שם המשימה"}', write: 1 },
  add_event: { d: "אירוע ביומן של הטלפון (יומן גוגל וכו׳), גם חוזר, עם תזכורות. לכל אירוע: כותרת, תאריך, שעה, מקום", a: '{"title":"...","date":"YYYY-MM-DD","time":"HH:MM, לא חובה (בלי = כל היום)","end":"HH:MM, לא חובה","place":"לא חובה","note":"לא חובה","repeat":"weekly|monthly|, לא חובה","until":"YYYY-MM-DD, לא חובה","remind":[120,720],"train":true,"from":"מאיפה יוצאים, למשל תחנת רכבת נתיבות","arrive":"HH:MM שעת הגעה ליעד"}', write: 1, phone: 1 },
  train: { d: "נסיעה ברכבת או בתחבורה ציבורית: מתי לצאת כדי להגיע בזמן, וקישור לזמני הרכבת האמיתיים של אותו יום", a: '{"from":"מאיפה","to":"לאן","date":"YYYY-MM-DD","arrive":"HH:MM"}' },
  add_repeat: { d: "תזכורת חוזרת: weekly (wd 0=ראשון..6=שבת), monthly (md יום בחודש), yearly (md ו־mon)", a: '{"title":"...","kind":"weekly|monthly|yearly","wd":0,"md":1,"mon":1,"lead":1}', write: 1 }
};

async function pass(env, cookie, path, body) {
  if (!env.PASS) throw new Error("no pass");
  const h = { cookie };
  if (body) Object.assign(h, { "content-type": "application/json", origin: "https://pass.internal", "x-csrf-token": cookieOf(cookie, "hp_csrf") });
  const r = await env.PASS.fetch("https://pass.internal" + path, body ? { method: "POST", headers: h, body: JSON.stringify(body) } : { headers: h });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "pass " + r.status);
  return j;
}
function cityIndex(name) { if (!name) return 0; const i = CITIES.findIndex((c) => c[0] === name || name.indexOf(c[0]) >= 0 || c[0].indexOf(name) >= 0); return i < 0 ? 0 : i; }

async function run(tool, a, ctx) {
  const { env, cookie, city } = ctx;
  a = a || {};
  if (tool === "day") { const r = await widgetApi(new URL("https://hania360.com/api/widget?c=" + cityIndex(a.city || city)), env); return await r.json(); }
  if (tool === "my_today") {
    const j = await pass(env, cookie, "/api/today");
    if (!j.signedIn) return { error: "לא מחובר" };
    const t = j.tasks || {}, today = ymd(Date.now());
    const nt = (n) => ({ text: n.text, time: n.time || "", done: !!n.done });
    return {
      tasks: (t.tasks || []).filter((x) => !x.done).slice(0, 25).map((x) => ({ id: x.id, text: x.text, day: x.day || "", late: !!x.late, who: x.assigneeName || "" })),
      notes_today: ((j.notes && j.notes.today) || []).map(nt), notes_tomorrow: ((j.notes && j.notes.tomorrow) || []).map(nt),
      repeats: (Array.isArray(j.repeats) ? j.repeats : []).slice(0, 15).map((x) => ({ title: x.title, when: x.when, next: x.next, in_days: x.due })),
      birthdays: (j.gil && j.gil.birthdays || []).slice(0, 6), calendar_today: (j.calendar && j.calendar.today || []).slice(0, 10), calendar_tomorrow: (j.calendar && j.calendar.tomorrow || []).slice(0, 10), vouchers_expiring: (j.save && j.save.expiring || []).slice(0, 5), today
    };
  }
  if (tool === "limud") {
    const r = await fetch("https://www.sefaria.org/api/calendars?timezone=Asia/Jerusalem&diaspora=0", { cf: { cacheTtl: 3600 } });
    const j = await r.json();
    return (j.calendar_items || []).map((x) => ({ what: x.title && x.title.he, value: x.displayValue && x.displayValue.he })).filter((x) => x.what);
  }
  if (tool === "news") return ((await newsItems()) || []).map((x) => x.t);
  if (tool === "sport") { const w = ["il", "euro", "nba", "world"].includes(a.what) ? a.what : "il"; const r = await sportApi(new Request("https://sport.hania360.com/api/sport/" + w), ctx.ctx); const o = await r.json(); if (o.matches) o.matches = o.matches.filter((m) => m.live || !m.done).slice(0, 8).concat(o.matches.filter((m) => m.done).slice(-5)); if (o.table) o.table = o.table.map((t) => t.pos + ". " + t.name + " " + t.pts); return o; }
  if (tool === "tv") {
    const ids = Object.values(TV), r = await tvApi(new Request("https://tv.hania360.com/api/tv/live?ids=" + ids.join(",")), env, ctx.ctx), j = await r.json();
    return { live: Object.keys(TV).filter((n) => j.live && j.live[TV[n]]).map((n) => n + ": " + (j.live[TV[n]].t || "")), open: "https://tv.hania360.com/" };
  }
  if (tool === "find_app") {
    const q = String(a.q || "").trim(), words = q.split(/\s+/).filter((w) => w.length > 1), out = [];
    for (const w of WORLDS) for (const x of [].concat(w.apps || [], w.more ? [w.more] : [])) { const s = x[1] + " " + x[2]; const score = words.filter((k) => s.indexOf(k) >= 0).length; if (score) out.push([score, x[1] + ": " + x[2] + " " + x[3]]); }
    for (const k in APPS) { const x = APPS[k], s = x[0] + " " + x[1]; const score = words.filter((w) => s.indexOf(w) >= 0).length; if (score) out.push([score - 0.5, x[0] + ": " + x[1]]); }
    return out.sort((p, q2) => q2[0] - p[0]).slice(0, 5).map((x) => x[1]);
  }
  if (tool === "train") {
    const from = a.from || ("תחנת רכבת " + (city || "")), date = a.date || ymd(Date.now()), t = await trains(from, a.to, date, a.arrive || "");
    const link = trainLink(from, a.to, date, a.arrive || "");
    if (t.error || t.none) return Object.assign(trainPlan(from, a.to, date, a.arrive || ""), { timetable: t.error ? "לא נמצאה תחנה או תאריך בלוח הרכבות" : "אין רכבת ישירה, אולי צריך החלפה" });
    return Object.assign(t, { link, note: "מלוח הזמנים הרשמי (משרד התחבורה). עיכובים של היום רואים בקישור." });
  }
  if (tool === "add_task") { const j = await pass(env, cookie, "/api/daily/task-add", { text: String(a.text || "").slice(0, 80), day: a.day || "", assignee: "", shared: false }); return { ok: true, added: j.added }; }
  if (tool === "add_note") { await pass(env, cookie, "/api/notes/add", { text: String(a.text || "").slice(0, 80), day: a.day || ymd(Date.now()), time: a.time || "", remind: !!a.remind && !!a.time }); return { ok: true }; }
  if (tool === "done_task") { await pass(env, cookie, "/api/daily/task-done", { id: String(a.id || ""), done: true }); return { ok: true }; }
  if (tool === "add_repeat") { await pass(env, cookie, "/api/daily/repeat-add", { title: String(a.title || "").slice(0, 60), kind: a.kind, wd: +a.wd || 0, md: +a.md || 1, mon: +a.mon || 1, lead: a.lead == null ? 1 : +a.lead, shared: false }); return { ok: true }; }
  return { error: "אין כלי כזה" };
}

// Trains: Israel Railways' own timetable is not open to programs, so the assistant plans with a usual travel time
// and hands over a Google Maps link already set to "arrive by" that time, where the real trains of that day show.
const TRAVEL = [[/נתיבות/, /תל.?אביב|השלום|סבידור|ההגנה|אוניברסיטה|אטלס/, 80], [/נתיבות/, /באר.?שבע/, 25], [/נתיבות/, /נתב.?ג|נמל התעופה|בן.?גוריון|לוד|מודיעין/, 95], [/נתיבות/, /ירושלים/, 120], [/נתיבות/, /חיפה/, 150], [/נתיבות/, /אשקלון|אשדוד|שדרות/, 30]];
export function travelMin(from, to) { for (const [a, b, m] of TRAVEL) if (a.test(from || "") && b.test(to || "") || a.test(to || "") && b.test(from || "")) return m; return 90; }
export function trainLink(from, to, date, arrive) {
  const [y, m, d] = String(date || "").split("-"), q = new URLSearchParams({ saddr: from || "", daddr: to || "", dirflg: "r" });
  if (y && arrive) { const [h, mi] = arrive.split(":").map(Number); q.set("ttype", "arr"); q.set("date", m + "/" + d + "/" + y); q.set("time", ((h + 11) % 12 + 1) + ":" + String(mi).padStart(2, "0") + (h < 12 ? "am" : "pm")); }
  return "https://www.google.com/maps?" + q.toString();
}
// The real Israel Railways timetable (Ministry of Transport open data, refreshed every morning by .github/workflows/rail.yml).
const RAIL_URL = "https://raw.githubusercontent.com/l2005l/hania360-home/rail-data/rail.json";
let RAIL = null, RAIL_AT = 0;
async function rail() {
  if (RAIL && Date.now() - RAIL_AT < 3600e3) return RAIL;
  try { const r = await fetch(RAIL_URL, { cf: { cacheTtl: 3600, cacheEverything: true } }); if (r.ok) { RAIL = await r.json(); RAIL_AT = Date.now(); } } catch {}
  return RAIL;
}
const ALIAS = [[/השלום|עזריאלי|אטלס|קריית הממשלה|הקריה/, "השלום"], [/סבידור|מרכז ת|תל.?אביב מרכז|ארלוזורוב/, "תל אביב מרכז"], [/אוניברסיט|אקספו|גני התערוכה/, "תל אביב האוניברסיטה"], [/ההגנה/, "תל אביב ההגנה"],
  [/נתב|נמל התעופה|בן.?גוריון|שדה התעופה/, "נתב"], [/ירושלים|נבון/, "ירושלים/יצחק נבון"], [/^תל.?אביב$|תל.?אביב/, "השלום"], [/חיפה/, "חיפה מרכז"], [/באר.?שבע/, "באר שבע מרכז"], [/אשדוד/, "אשדוד עד הלום"], [/מודיעין/, "מודיעין מרכז"]];
function station(R, q) {
  if (!R || !q) return null;
  const clean = (x) => String(x).replace(/["'״׳]/g, "").replace(/תחנת?( ה?רכבת)?/g, "").replace(/\s+/g, " ").trim();
  const n = clean(q), list = Object.entries(R.stations).map(([id, name]) => [id, name, clean(name)]);
  let hit = list.find((x) => x[2] === n) || list.find((x) => n.indexOf(x[2]) >= 0 && x[2].length > 2);
  if (!hit) { const al = ALIAS.find((a) => a[0].test(n)); if (al) hit = list.find((x) => x[2].indexOf(clean(al[1])) === 0); }
  if (!hit) hit = list.find((x) => x[2].indexOf(n) >= 0);
  return hit ? { id: hit[0], name: hit[1] } : null;
}
const hhmm = (m) => String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
// Direct trains from → to on that day: those arriving by `arrive` (the last three), or, without it, the next ones.
export async function trains(from, to, date, arrive) {
  const R = await rail(); if (!R) return { error: "no timetable" };
  const a = station(R, from), b = station(R, to);
  if (!a || !b) return { error: "station", from: a && a.name, to: b && b.name };
  const ids = R.days[date]; if (!ids) return { error: "date", from: a.name, to: b.name };
  const list = [];
  for (const i of ids) { const t = R.trips[i]; let x = -1, y = -1; t.forEach((s, k) => { if (s[0] === a.id && x < 0) x = k; if (s[0] === b.id) y = k; }); if (x >= 0 && y > x) list.push([t[x][1], t[y][1]]); }
  list.sort((p, q) => p[0] - q[0]);
  const lim = arrive ? +arrive.split(":")[0] * 60 + +arrive.split(":")[1] : null;
  const nowM = date === ymd(Date.now()) ? +new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).split(":").reduce((h, m) => h * 60 + +m) : 0;
  const pick = lim != null ? list.filter((x) => x[1] <= lim).slice(-3) : list.filter((x) => x[0] >= nowM).slice(0, 4);
  const disp = (n) => (n === "השלום" ? "תל אביב השלום" : n);
  return { from: disp(a.name), to: disp(b.name), date, arrive_by: arrive || "", direct_trains: pick.map((x) => ({ leaves: hhmm(x[0]), arrives: hhmm(x[1]) })), none: !pick.length, updated: R.at };
}

function trainPlan(from, to, date, arrive) {
  const min = travelMin(from, to), out = { from, to, date, arrive, usual_travel_minutes: min, link: trainLink(from, to, date, arrive) };
  if (arrive) { const [h, mi] = arrive.split(":").map(Number), t = h * 60 + mi - min - 20; out.leave_by = String(Math.floor((t + 1440) % 1440 / 60)).padStart(2, "0") + ":" + String((t + 1440) % 60).padStart(2, "0"); out.note = "זמן משוער (נסיעה רגילה ועוד 20 דקות מרווח). את הרכבת המדויקת בודקים בקישור."; }
  return out;
}

const WD = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
function describe(tool, a) {
  const day = (d) => { if (!d) return ""; const t = new Date(d + "T12:00:00Z"); return " ליום " + WD[t.getUTCDay()] + " " + t.getUTCDate() + "." + (t.getUTCMonth() + 1); };
  if (tool === "add_task") return "להוסיף משימה ל־Today: \"" + a.text + "\"" + day(a.day);
  if (tool === "add_note") return "להוסיף פתק: \"" + a.text + "\"" + day(a.day) + (a.time ? " בשעה " + a.time : "") + (a.remind && a.time ? ", עם תזכורת לטלפון 15 דקות לפני" : "");
  if (tool === "done_task") return "לסמן כבוצעה: \"" + (a.text || a.id) + "\"";
  if (tool === "add_event") return "📅 ליומן: " + a.title + (a.train ? " 🚆" + (a.dep ? " (רכבת " + a.dep + " מ" + a.fromSt + ", מגיעה " + a.arr + ")" : "") : "") + day(a.date) + (a.time ? " " + a.time + (a.end ? "–" + a.end : "") : " (כל היום)") + (a.place ? ", " + a.place : "") + (a.repeat === "weekly" ? ", כל שבוע" + (a.until ? " עד " + a.until.split("-").reverse().join(".") : "") : a.repeat === "monthly" ? ", כל חודש" : "");
  if (tool === "add_repeat") return "תזכורת חוזרת: \"" + a.title + "\" " + (a.kind === "weekly" ? "כל יום " + WD[+a.wd || 0] : a.kind === "monthly" ? "כל " + (a.md || 1) + " בחודש" : "כל שנה ב־" + (a.md || 1) + "." + (a.mon || 1));
  return tool;
}

function system(now, city) {
  const d = new Date(now), list = Object.entries(TOOLS).map(([k, v]) => "- " + k + (v.write ? " (פעולה)" : "") + ": " + v.d + ". args: " + v.a).join("\n");
  return `את Hania, העוזרת האישית של בעל Hania360. עונה בעברית, קצר וחם, בגוף נקבה או ניטרלי. בלי Markdown ובלי כוכביות.
עכשיו: יום ${WD[new Date(ymd(now) + "T12:00:00Z").getUTCDay()]}, ${ymd(now)}, השעה ${d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: TZ })} (ישראל). העיר: ${city || "ירושלים"}.
יש לך כלים:
${list}
כללים:
- כל תשובה שלך היא JSON אחד בלבד, בלי שום טקסט מסביב: {"tool":"שם","args":{...}} כדי להשתמש בכלי, {"actions":[{"tool":"שם","args":{...}},...],"say":"משפט קצר"} לכמה פעולות יחד, או {"answer":"התשובה"} כדי לענות.
- "מתי הרכבת / מתי לצאת" = train (לוח הזמנים האמיתי של רכבת ישראל). כותבים בתשובה את שעות היציאה וההגעה ואת הקישור.
- נסיעה ברכבת ("ברכבת", "מתחנת..."): ב־add_event שמים train:true, from (נקודת היציאה), place (היעד) ו־arrive (מתי צריך להגיע). אם לא נאמר מאיפה, from = תחנת רכבת ב${city || "העיר שלך"}.
- "יומן" = add_event (היומן בטלפון). משימה / "תזכירי לי" בלי יומן = add_task או add_note. בבקשה עם כמה אירועים: actions, אחד לכל אירוע.
- עובדות על היום, שבת, לימוד, משימות, חדשות וספורט: רק מתוך כלי, לא מהזיכרון.
- פעולה (add_task, add_note, done_task, add_repeat, add_event): קוראים לכלי, והמשתמש יאשר בכפתור. תאריכים מחושבים מהיום ("מחר" = היום ועוד יום).
- אם חסר פרט הכרחי (למשל שעה לתזכורת), שואלים ב־answer.
- כשנותנים קישור לאפליקציה, כותבים את הכתובת המלאה.`;
}
function objects(s) {
  const out = []; let depth = 0, start = -1, q = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') q = false; continue; }
    if (ch === '"') q = true; else if (ch === "{") { if (!depth) start = i; depth++; } else if (ch === "}" && depth) { depth--; if (!depth) { try { out.push(JSON.parse(s.slice(start, i + 1))); } catch {} } }
  }
  return out;
}
function loose(t) {
  if (t && typeof t === "object") return t;
  const s = String(t || ""), all = objects(s);
  if (all.length === 1) return all[0];
  if (all.length > 1) { const acts = all.filter((o) => o.tool); if (acts.length) return { actions: acts, say: (all.find((o) => o.say || o.answer) || {}).say || "" }; return all[0]; }
  return { answer: s.replace(/[{}"]/g, "").replace(/^\s*answer\s*:\s*/, "").trim() };
}
const out = (r) => r && (r.response ?? (r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content));
async function think(env, messages) {
  for (const m of [MODEL, FALLBACK]) { try { const r = out(await env.AI.run(m, { messages, max_tokens: 700, temperature: 0.3 })); if (r) return loose(r); } catch {} }
  return null;
}

// Shabbat and holidays (by the widget's numbers for the town): no assistant until they end.
async function resting(env, city) {
  try { const r = await widgetApi(new URL("https://hania360.com/api/widget?c=" + cityIndex(city)), env); const j = await r.json(); return j.shab && j.shab.now ? j.shab.out : ""; } catch { return ""; }
}

// a train trip: the link (set to arrive on time), the usual travel time and the real train go into the calendar event
async function enrich(x, city) {
  const g = x.args || {};
  if (x.tool !== "add_event" || !(g.train || /רכבת/.test((g.title || "") + (g.from || "") + (g.note || "")))) return;
  g.train = true; g.from = g.from || "תחנת רכבת " + (city || ""); g.arrive = g.arrive || g.time || "";
  g.travel = travelMin(g.from, g.place || g.title); g.trainLink = trainLink(g.from, g.place || g.title, g.date, g.arrive);
  if (g.arrive && g.date) { const t = await trains(g.from, g.place || g.title, g.date, g.arrive).catch(() => null); const best = t && t.direct_trains && t.direct_trains[t.direct_trains.length - 1]; if (best) { g.dep = best.leaves; g.arr = best.arrives; g.fromSt = t.from; g.toSt = t.to; } }
  x.args = g;
}
const pendingOf = (acts) => ({ items: acts.map((x) => ({ tool: x.tool, args: x.args || {}, text: describe(x.tool, x.args || {}), phone: !!TOOLS[x.tool].phone })) });

// ---- Claude (when the ANTHROPIC_API_KEY secret is set): any subject, the web when needed, and the same tools ----
const CLAUDE_TOOLS = () => Object.entries(TOOLS).map(([name, v]) => ({ name, description: v.d + (v.write ? ". פעולה: המשתמש יאשר בכפתור לפני שהיא מתבצעת." : "") + " Arguments: " + v.a, input_schema: { type: "object", additionalProperties: true } }));
function claudeSystem(now, city, prof) {
  const d = new Date(now);
  return `את Hania, העוזרת האישית של בעל Hania360 (שומר תורה ומצוות, גר בישראל). עונה בעברית טבעית, חמה ותמציתית, על כל נושא: ידע כללי, עצות, כתיבה, חשבון, בישול, טכנולוגיה, יהדות ועוד.
עכשיו: יום ${WD[new Date(ymd(now) + "T12:00:00Z").getUTCDay()]}, ${ymd(now)}, השעה ${d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: TZ })} בישראל. העיר: ${city || "ירושלים"}.${prof}
- לשאלות על מה שקורה עכשיו בעולם (חדשות, מחירים, מזג אוויר במקום אחר, תוצאות, שעות פתיחה) משתמשים ב־web_search.
- למידע האישי ולזמני היום משתמשים בכלים של Hania360 (day, my_today, limud, sport, tv, train, find_app). עובדות על זמני שבת, הדף היומי והמשימות: רק מהכלים.
- פעולות (add_task, add_note, done_task, add_repeat, add_event) המשתמש מאשר בכפתור, אז פשוט קוראים לכלי, גם כמה פעמים יחד. "יומן" = add_event. תאריכים מחושבים מהיום.
- תשובה קצרה וברורה, בלי כותרות ובלי Markdown (בלי ** ובלי #). רשימה קצרה מותרת עם "• ". מקור מהאינטרנט: שם האתר בסוף.
- בשאלות הלכה למעשה: עונים בזהירות, ומציינים שכדאי לשאול רב.`;
}
async function askClaude(env, sys, hist, c, city) {
  const model = env.AI_MODEL || "claude-sonnet-5-5", used = [];
  const tools = CLAUDE_TOOLS().concat([{ type: "web_search_20250305", name: "web_search", max_uses: 3, user_location: { type: "approximate", city: city || "Jerusalem", country: "IL", timezone: TZ } }]);
  const messages = hist.map((m) => ({ role: m.role, content: m.content }));
  for (let step = 0; step < 5; step++) {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 1500, system: sys, tools, messages }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || "claude " + r.status);
    const blocks = j.content || [], calls = blocks.filter((x) => x.type === "tool_use" && TOOLS[x.name]);
    if (blocks.some((x) => x.type === "server_tool_use")) used.push("web");
    const writes = calls.filter((x) => TOOLS[x.name].write);
    const text = blocks.filter((x) => x.type === "text").map((x) => x.text).join("").replace(/\*\*/g, "").replace(/^#+\s*/gm, "").trim();
    if (writes.length) { const acts = writes.map((x) => ({ tool: x.name, args: x.input || {} })); for (const x of acts) await enrich(x, city); return { answer: text, pending: pendingOf(acts), used }; }
    if (j.stop_reason !== "tool_use" || !calls.length) {
      if (j.stop_reason === "pause_turn") { messages.push({ role: "assistant", content: blocks }); continue; }
      return { answer: text || "לא בטוחה שהבנתי. אפשר לנסח אחרת?", used };
    }
    messages.push({ role: "assistant", content: blocks });
    const results = [];
    for (const x of calls) { let res; try { res = await run(x.name, x.input, c); } catch (e) { res = { error: String(e.message || e).slice(0, 80) }; } used.push(x.name); results.push({ type: "tool_result", tool_use_id: x.id, content: clip(res, 6000) }); }
    messages.push({ role: "user", content: results });
  }
  return { answer: "לא הספקתי לסיים. אפשר לשאול שוב בצורה פשוטה יותר?", used };
}

export async function aiApi(request, env, ctx) {
  const url = new URL(request.url);
  if (url.pathname === "/api/ai/usage") { const r = await env.SIPUR.get(env.SIPUR.idFromName("limits")).fetch("https://l/", { method: "GET" }); const j = await r.json(); const d = ymd(Date.now()); return json({ today: (j.days && j.days[d] && j.days[d].ai) || 0, cap: PER_DAY, brain: env.ANTHROPIC_API_KEY ? "Claude" : "Llama" }); }
  if (url.pathname !== "/api/ai/chat" || request.method !== "POST") return json({ error: "not found" }, 404);
  const b = await request.json().catch(() => ({})), cookie = request.headers.get("cookie") || "", city = typeof b.city === "string" ? b.city.slice(0, 30) : "";
  const rest = await resting(env, city);
  if (rest) return json({ answer: "שבת שלום 🕯️ אני נחה עכשיו, ונחזור לדבר במוצאי שבת אחרי " + rest + "." });
  const c = { env, cookie, city, ctx };

  // Confirmed actions: run the Today ones here (the phone-calendar ones the page itself adds), no model call.
  if (b.confirm && Array.isArray(b.confirm.items)) {
    const lines = [];
    for (const it of b.confirm.items.slice(0, 12)) {
      const T = TOOLS[it && it.tool]; if (!T || !T.write || T.phone) continue;
      try { await run(it.tool, it.args, c); lines.push("✅ " + describe(it.tool, it.args || {}).replace(/^להוסיף /, "").replace(/^לסמן כבוצעה/, "בוצע")); }
      catch (e) { lines.push("⚠️ לא הצלחתי: " + describe(it.tool, it.args || {}) + (String(e.message) === "signed_out" ? " (צריך להתחבר ל־Hania Pass)" : "")); }
    }
    return json({ answer: lines.join("\n"), done: true });
  }

  if (env.SIPUR) {
    const lim = await env.SIPUR.get(env.SIPUR.idFromName("limits")).fetch("https://l/", { method: "POST", body: JSON.stringify({ ns: "ai:", device: "owner", perDay: PER_DAY, perDevice: PER_DAY }) }).then((r) => r.json()).catch(() => ({ ok: true }));
    if (!lim.ok) return json({ answer: "הגעתי למכסה היומית (" + PER_DAY + " שאלות). נמשיך מחר 🙂" });
  }
  const hist = (Array.isArray(b.messages) ? b.messages : []).slice(-8).filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }));
  if (!hist.length || hist[hist.length - 1].role !== "user") return json({ error: "empty" }, 400);
  // what Hania knows about the owner's routine (from the morning-briefing settings): the regular train trip
  let prof = "";
  try { if (env.BRIEF) { const st = await env.BRIEF.get(env.BRIEF.idFromName("owner")).fetch("https://brief/get").then((r) => r.json()); if (st.commute) prof = "\nהנסיעה הקבועה של המשתמש: מ" + st.commute.from + " ל" + st.commute.to + (st.commute.arrive ? ", להגיע עד " + st.commute.arrive : "") + ". כשהוא אומר \"הרכבת שלי\" או \"לעבודה\", זו הכוונה."; } } catch {}
  if (env.ANTHROPIC_API_KEY) {
    try { return json(await askClaude(env, claudeSystem(Date.now(), city, prof), hist, c, city)); }
    catch (e) { console.log("claude", e && e.message); /* fall back to the free model below */ }
  }
  const msgs = [{ role: "system", content: system(Date.now(), city) + prof }].concat(hist), used = [];
  for (let step = 0; step < STEPS; step++) {
    const o = await think(env, msgs);
    if (!o) return json({ answer: "משהו לא עבד אצלי. ננסה שוב בעוד רגע?" });
    const acts = (Array.isArray(o.actions) ? o.actions : o.tool ? [o] : []).filter((x) => x && TOOLS[x.tool] && TOOLS[x.tool].write).slice(0, 12);
    for (const x of acts) await enrich(x, city);
    if (acts.length) return json({ answer: o.say || "", pending: pendingOf(acts), used });
    if (o.tool && TOOLS[o.tool]) {
      let res; try { res = await run(o.tool, o.args, c); } catch (e) { res = { error: String(e.message || e).slice(0, 80) }; }
      used.push(o.tool);
      msgs.push({ role: "assistant", content: JSON.stringify({ tool: o.tool, args: o.args || {} }) });
      msgs.push({ role: "user", content: "תוצאת הכלי " + o.tool + ": " + clip(res) + "\nעכשיו תעני למשתמש ({\"answer\":...}) או קראי לכלי נוסף." });
      continue;
    }
    return json({ answer: String(o.answer || "").replace(/\*\*/g, "").trim().slice(0, 3000) || "לא בטוחה שהבנתי. אפשר לנסח אחרת?", used });
  }
  return json({ answer: "לא הספקתי לסיים. אפשר לשאול שוב בצורה פשוטה יותר?", used });
}
