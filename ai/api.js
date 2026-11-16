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
  if (tool === "add_task") { const j = await pass(env, cookie, "/api/daily/task-add", { text: String(a.text || "").slice(0, 80), day: a.day || "", assignee: "", shared: false }); return { ok: true, added: j.added }; }
  if (tool === "add_note") { await pass(env, cookie, "/api/notes/add", { text: String(a.text || "").slice(0, 80), day: a.day || ymd(Date.now()), time: a.time || "", remind: !!a.remind && !!a.time }); return { ok: true }; }
  if (tool === "done_task") { await pass(env, cookie, "/api/daily/task-done", { id: String(a.id || ""), done: true }); return { ok: true }; }
  if (tool === "add_repeat") { await pass(env, cookie, "/api/daily/repeat-add", { title: String(a.title || "").slice(0, 60), kind: a.kind, wd: +a.wd || 0, md: +a.md || 1, mon: +a.mon || 1, lead: a.lead == null ? 1 : +a.lead, shared: false }); return { ok: true }; }
  return { error: "אין כלי כזה" };
}

const WD = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
function describe(tool, a) {
  const day = (d) => { if (!d) return ""; const t = new Date(d + "T12:00:00Z"); return " ליום " + WD[t.getUTCDay()] + " " + t.getUTCDate() + "." + (t.getUTCMonth() + 1); };
  if (tool === "add_task") return "להוסיף משימה ל־Today: \"" + a.text + "\"" + day(a.day);
  if (tool === "add_note") return "להוסיף פתק: \"" + a.text + "\"" + day(a.day) + (a.time ? " בשעה " + a.time : "") + (a.remind && a.time ? ", עם תזכורת לטלפון 15 דקות לפני" : "");
  if (tool === "done_task") return "לסמן כבוצעה: \"" + (a.text || a.id) + "\"";
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
- כל תשובה שלך היא JSON אחד בלבד, בלי שום טקסט מסביב: {"tool":"שם","args":{...}} כדי להשתמש בכלי, או {"answer":"התשובה"} כדי לענות.
- עובדות על היום, שבת, לימוד, משימות, חדשות וספורט: רק מתוך כלי, לא מהזיכרון.
- פעולה (add_task, add_note, done_task, add_repeat): קוראים לכלי, והמשתמש יאשר בכפתור. תאריכים מחושבים מהיום ("מחר" = היום ועוד יום).
- אם חסר פרט הכרחי (למשל שעה לתזכורת), שואלים ב־answer.
- כשנותנים קישור לאפליקציה, כותבים את הכתובת המלאה.`;
}
function loose(t) {
  if (t && typeof t === "object") return t;
  const s = String(t || ""), a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return { answer: s.trim() };
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return { answer: s.replace(/[{}"]/g, "").replace(/^\s*answer\s*:\s*/, "").trim() }; }
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

export async function aiApi(request, env, ctx) {
  const url = new URL(request.url);
  if (url.pathname === "/api/ai/usage") { const r = await env.SIPUR.get(env.SIPUR.idFromName("limits")).fetch("https://l/", { method: "GET" }); const j = await r.json(); const d = ymd(Date.now()); return json({ today: (j.days && j.days[d] && j.days[d].ai) || 0, cap: PER_DAY }); }
  if (url.pathname !== "/api/ai/chat" || request.method !== "POST") return json({ error: "not found" }, 404);
  const b = await request.json().catch(() => ({})), cookie = request.headers.get("cookie") || "", city = typeof b.city === "string" ? b.city.slice(0, 30) : "";
  const rest = await resting(env, city);
  if (rest) return json({ answer: "שבת שלום 🕯️ אני נחה עכשיו, ונחזור לדבר במוצאי שבת אחרי " + rest + "." });
  const c = { env, cookie, city, ctx };

  // A confirmed action: run it, no model call.
  if (b.confirm && TOOLS[b.confirm.tool] && TOOLS[b.confirm.tool].write) {
    try { await run(b.confirm.tool, b.confirm.args, c); return json({ answer: "✅ בוצע: " + describe(b.confirm.tool, b.confirm.args || {}).replace(/^להוסיף /, "נוסף ").replace(/^לסמן /, "סומן "), done: true }); }
    catch (e) { return json({ answer: "לא הצלחתי: " + (String(e.message) === "signed_out" ? "צריך להתחבר ל־Hania Pass." : String(e.message).slice(0, 60)) }); }
  }

  if (env.SIPUR) {
    const lim = await env.SIPUR.get(env.SIPUR.idFromName("limits")).fetch("https://l/", { method: "POST", body: JSON.stringify({ ns: "ai:", device: "owner", perDay: PER_DAY, perDevice: PER_DAY }) }).then((r) => r.json()).catch(() => ({ ok: true }));
    if (!lim.ok) return json({ answer: "הגעתי למכסה היומית (" + PER_DAY + " שאלות). נמשיך מחר 🙂" });
  }
  const hist = (Array.isArray(b.messages) ? b.messages : []).slice(-8).filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }));
  if (!hist.length || hist[hist.length - 1].role !== "user") return json({ error: "empty" }, 400);
  const msgs = [{ role: "system", content: system(Date.now(), city) }].concat(hist), used = [];
  for (let step = 0; step < STEPS; step++) {
    const o = await think(env, msgs);
    if (!o) return json({ answer: "משהו לא עבד אצלי. ננסה שוב בעוד רגע?" });
    if (o.tool && TOOLS[o.tool]) {
      if (TOOLS[o.tool].write) {
        const args = o.args || {};
        return json({ answer: o.say || "", pending: { tool: o.tool, args, text: describe(o.tool, args) }, used });
      }
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
