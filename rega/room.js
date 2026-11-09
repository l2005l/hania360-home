// HaniaRega (רגע טוב): time well spent in a hospital bed or at home in bed.
// The server side: one Durable Object per "room" (the patient and the family around them), and the AI calls.
//
// The room: family members open the room link and leave a message or a photo; the patient's screen shows it big,
// with a chime, and the patient answers with one tap ("❤️ תודה", "📞 אשמח שתתקשרו"). Pushes carry no payload; the
// phone asks /msg what to show (lib/webpush.js). Anyone with the link can read and write, like a family group, so the
// link is long and random. Only the patient's device (holding the owner key) can delete or rename. Messages and
// photos are kept 30 days.
//
// The AI: a short, warm conversation (שיחה) and a short story, from Workers AI, with daily caps per device and in
// total, counted by HaniaSipur's StoryLimits (namespace "rega:") so the daily cost check sees them.

import { okEndpoint, subId, vapidKeys, wake } from "../lib/webpush.js";

const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const token = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[x % 57]).join(""); };
const KEEP = 30 * 864e5, MAX_MSGS = 200, MAX_IMG = 450_000;
const REPLIES = { thanks: ["❤️ תודה, שימחתם אותי"], call: ["📞 אשמח שתתקשרו אליי"], better: ["😊 אני מרגיש קצת יותר טוב", "😊 אני מרגישה קצת יותר טוב"], rest: ["😴 אני נח עכשיו, נדבר אחר כך", "😴 אני נחה עכשיו, נדבר אחר כך"], visit: ["🤗 מחכה לביקור"] };

export class RegaRoom {
  constructor(ctx) { this.ctx = ctx; }
  async load() { return (this.r = this.r || (await this.ctx.storage.get("r")) || null); }
  async save() { await this.ctx.storage.put("r", this.r); }
  view(owner) {
    const r = this.r;
    return { name: r.name, owner: !!owner, msgs: r.msgs.slice(-60).map((m) => ({ id: m.id, at: m.at, from: m.from, me: !!m.me, text: m.text, img: !!m.img, kind: m.kind || "" })), fam: Object.values(r.subs).filter((s) => s.role === "fam").length };
  }
  async tidy() {
    const r = this.r, cut = Date.now() - KEEP, gone = r.msgs.filter((m) => m.at < cut || false);
    r.msgs = r.msgs.filter((m) => m.at >= cut);
    while (r.msgs.length > MAX_MSGS) gone.push(r.msgs.shift());
    for (const m of gone) if (m.img) await this.ctx.storage.delete("img:" + m.id);
  }
  async notify(role, msg) {
    const r = this.r, v = await vapidKeys(this.ctx.storage);
    for (const [id, s] of Object.entries(r.subs)) {
      if (s.role !== role) continue;
      s.msg = msg;
      if (!(await wake(v, s.endpoint, "https://rega.hania360.com"))) delete r.subs[id];
    }
  }
  async fetch(req) {
    const url = new URL(req.url), p = url.pathname;
    const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
    const b = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (p === "/init") {
      if (await this.load()) return json({ error: "exists" }, 409);
      this.r = { id: b.id, own: b.own, name: clean(b.name, 24), msgs: [], subs: {}, created: Date.now() };
      await this.save();
      return json({ ok: true });
    }
    if (!(await this.load())) return json({ error: "no room" }, 404);
    const r = this.r, owner = !!b.own && b.own === r.own || url.searchParams.get("own") === r.own;
    if (p === "/state") return json(this.view(owner));
    if (p === "/key") return json({ key: (await vapidKeys(this.ctx.storage)).pub });
    if (p === "/msg") { const s = b.endpoint ? r.subs[await subId(b.endpoint)] : null; return json(s && s.msg ? s.msg : {}); }
    if (p === "/img") {
      const m = r.msgs.find((x) => x.id === url.searchParams.get("i") && x.img);
      const data = m && (await this.ctx.storage.get("img:" + m.id));
      if (!data) return new Response("", { status: 404 });
      const bin = Uint8Array.from(atob(data.split(",")[1]), (c) => c.charCodeAt(0));
      return new Response(bin, { headers: { "content-type": "image/jpeg", "cache-control": "private, max-age=86400", "x-content-type-options": "nosniff" } });
    }
    if (p !== "/op") return json({ error: "not found" }, 404);
    switch (b.op) {
      case "post": { // from the family: a few words and/or a photo (already made small on the phone)
        const text = clean(b.text, 500), from = clean(b.from, 24) || "מישהו מהמשפחה";
        const img = typeof b.img === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(b.img) && b.img.length <= MAX_IMG ? b.img : "";
        if (!text && !img) return json({ error: "empty" }, 400);
        const id = token(8);
        if (img) await this.ctx.storage.put("img:" + id, img);
        r.msgs.push({ id, at: Date.now(), from, me: false, text, img: !!img });
        await this.tidy(); await this.save();
        await this.notify("me", { title: "💌 " + from + (img ? " שלח/ה תמונה" : " שלח/ה הודעה"), body: text.slice(0, 120) || "נגיעה קטנה מהבית ❤️", url: "/" });
        break;
      }
      case "reply": { // from the patient: one tap, or a short line; the drawing comes as a photo
        if (!owner) return json({ error: "owner" }, 403);
        const text = REPLIES[b.k] ? REPLIES[b.k][b.g === "f" ? REPLIES[b.k].length - 1 : 0] : clean(b.text, 300);
        const img = typeof b.img === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(b.img) && b.img.length <= MAX_IMG ? b.img : "";
        if (!text && !img) return json({ error: "empty" }, 400);
        const id = token(8);
        if (img) await this.ctx.storage.put("img:" + id, img);
        r.msgs.push({ id, at: Date.now(), from: r.name || "", me: true, text, img: !!img, kind: b.k || "" });
        await this.tidy(); await this.save();
        await this.notify("fam", { title: (r.name ? r.name + ": " : "") + (text || "🎨 ציור בשבילכם"), body: b.k === "call" ? "זה זמן טוב להתקשר." : "פתחו לראות.", url: "/f/" + r.id });
        break;
      }
      case "del": if (!owner) return json({ error: "owner" }, 403); { const m = r.msgs.find((x) => x.id === b.id); if (m && m.img) await this.ctx.storage.delete("img:" + m.id); r.msgs = r.msgs.filter((x) => x.id !== b.id); } break;
      case "name": if (!owner) return json({ error: "owner" }, 403); r.name = clean(b.name, 24); break;
      case "sub": {
        const ep = b.sub && b.sub.endpoint; if (!okEndpoint(ep)) return json({ error: "endpoint" }, 400);
        const role = b.role === "me" ? "me" : "fam";
        if (role === "me" && !owner) return json({ error: "owner" }, 403);
        r.subs[await subId(ep)] = { endpoint: ep, role, msg: null };
        break;
      }
      case "unsub": if (b.endpoint) delete r.subs[await subId(b.endpoint)]; break;
      default: return json({ error: "op" }, 400);
    }
    await this.save();
    return json(this.view(owner));
  }
}

// ---------- AI: a short conversation, and a short story ----------
const AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";
const AI_FALLBACK = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const text = (out) => out && (out.response ?? (out.choices && out.choices[0] && out.choices[0].message && out.choices[0].message.content));
function looseJson(s) {
  if (s && typeof s === "object") return s;
  if (typeof s !== "string") return null;
  try { return JSON.parse(s); } catch {}
  const a = s.indexOf("{"), z = s.lastIndexOf("}");
  if (a < 0 || z <= a) return null;
  try { return JSON.parse(s.slice(a, z + 1)); } catch { return null; }
}
async function allowed(env, device, perDevice, perDay, ns) {
  const r = await env.SIPUR.get(env.SIPUR.idFromName("limits")).fetch("https://l/", { method: "POST", body: JSON.stringify({ device, ns, perDevice, perDay }) });
  return r.json();
}

const CHAT_SYSTEM = {
  adult: "את \"רגע\", בת שיח חמה, סבלנית ומלאת סקרנות, לאדם שנמצא במיטה (בבית חולים או בבית) ורוצה להעביר את הזמן בנעימים. " +
    "מדברים בעברית פשוטה וחמה, במשפטים קצרים (עד 60 מילים בתשובה), ושואלים שאלה אחת פתוחה בכל פעם: על זיכרונות, משפחה, אוכל, מוזיקה, מקומות, תחביבים, חדשות קלילות. " +
    "אפשר להציע משחק מילים קצר, חידה, או סיפור קטן. מקשיבים יותר ממדברים, ומחמיאים בכנות.",
  kid: "את \"רגע\", חברה עליזה וחמה לילד/ה שנמצא/ת במיטה (בבית חולים או בבית). מדברים בעברית פשוטה מאוד, משפטים קצרים (עד 40 מילים), עם הומור עדין. " +
    "מציעים חידות, \"מה היית מעדיף/ה\", סיפור קטן ביחד, שאלות על חיות, גיבורים, משחקים. תמיד אופטימי/ת ומרגיע/ה.",
};
const CHAT_RULES = " מדברים על עצמך בלשון נקבה. כללים חשובים: את לא רופאה ולא נותנים שום עצה רפואית, על תרופות, כאב, תסמינים או טיפול; במקרה כזה אומרים בעדינות לשאול את הצוות הרפואי או ללחוץ על כפתור הקריאה לאחות. " +
  "אם עולה מצוקה קשה, פחד גדול, מחשבות לפגוע בעצמך או מצב חירום: מגיבים בחום ובלי שיפוט, מעודדים לפנות עכשיו לצוות או לבן משפחה, ומזכירים שאפשר לדבר עם ער\"ן בטלפון 1201 בכל שעה. " +
  "לא מדברים על מוות או על מחלות קשות ביוזמתך, לא מבטיחים החלמה, לא נכנסים לפוליטיקה, ולא מבקשים פרטים אישיים מזהים. מחזירים טקסט בלבד, בלי סימני עיצוב.";

export async function regaApi(req, env, url) {
  const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
  const mm = url.pathname.match(/^\/api\/rega\/(new|state|op|key|msg|img|chat|story)$/);
  if (!mm) return json({ error: "not found" }, 404);
  const what = mm[1];

  if (what === "chat" || what === "story") {
    if (req.method !== "POST") return json({ error: "method" }, 405);
    if (!env.AI || !env.SIPUR) return json({ error: "unavailable" }, 503);
    const b = await req.json().catch(() => null) || {};
    const device = /^[A-Za-z0-9_-]{16,40}$/.test(b.device || "") ? b.device : "";
    if (!device) return json({ error: "input" }, 400);
    const kid = b.mode === "kid", name = clean(b.name, 20).replace(/[^א-תa-zA-Z' \-]/g, "");
    if (what === "chat") {
      const lim = await allowed(env, device, 40, 500, "rega:");
      if (!lim.ok) return json({ error: lim.why === "device" ? "device" : "day" }, 429);
      const hist = (Array.isArray(b.history) ? b.history : []).slice(-10).map((m) => ({ role: m.r === "a" ? "assistant" : "user", content: clean(m.t, 400) })).filter((m) => m.content);
      if (!hist.length || hist[hist.length - 1].role !== "user") return json({ error: "input" }, 400);
      const sys = (kid ? CHAT_SYSTEM.kid : CHAT_SYSTEM.adult) + CHAT_RULES + (name ? " שם בן/בת השיח: " + name + "." : "") + (b.g === "f" ? " פונים אליה בלשון נקבה." : b.g === "m" ? " פונים אליו בלשון זכר." : "");
      let out = "";
      try { out = text(await env.AI.run(AI_MODEL, { messages: [{ role: "system", content: sys }, ...hist], max_tokens: 400 })); } catch {}
      if (!out) { try { out = text(await env.AI.run(AI_FALLBACK, { messages: [{ role: "system", content: sys }, ...hist], max_tokens: 400 })); } catch {} }
      out = clean(String(out || "").replace(/[*#_`]/g, ""), 700);
      if (!out) return json({ error: "ai" }, 502);
      return json({ reply: out });
    }
    // story: calm and uplifting, for adults or children, read aloud on the phone
    const lim = await allowed(env, device, 6, 150, "rega:");
    if (!lim.ok) return json({ error: lim.why === "device" ? "device" : "day" }, 429);
    const THEMES = kid
      ? { space: "הרפתקה בחלל עם רובוט חמוד", sea: "מסע מתחת לים עם דולפין", zoo: "יום מצחיק בגן החיות", magic: "ממלכה קסומה עם דרקון חביב", football: "משחק כדורגל מטורף בשכונה" }
      : { trip: "טיול בשבילי הגליל באביב", cafe: "בית קפה קטן בתל אביב של פעם", sea: "ערב שקט על חוף הים", market: "בוקר בשוק מחנה יהודה", train: "נסיעה ברכבת דרך נופים יפים", music: "להקה צעירה שמופיעה בפעם הראשונה", family: "ארוחת שישי משפחתית" };
    const theme = THEMES[b.theme] || Object.values(THEMES)[0];
    const system = (kid
      ? "את/ה סופר/ת ילדים ישראלי/ת. סיפור קצר, מצחיק ומרגיע בעברית פשוטה, לילד/ה שנח/ה במיטה. "
      : "את/ה סופר/ת ישראלי/ת. סיפור קצר, חם ומרומם, בעברית פשוטה ויפה, למבוגר/ת שנח/ה במיטה ורוצה לצאת לרגע למקום אחר. ") +
      "בלי מחלות, בלי בתי חולים, בלי מוות, בלי פחד ובלי אלימות. משפטים שנעים להקריא בקול. סוף טוב ושליו. " +
      "מחזירים JSON בלבד: {\"title\": \"כותרת קצרה\", \"paragraphs\": [\"פסקה\", ...]} בלי טקסט נוסף.";
    const input = "הנושא: " + theme + ". אורך: כ־300 מילים, 5–6 פסקאות." + (name && kid ? " גיבור/ת הסיפור נקרא/ת " + name + "." : "");
    let j = null;
    try { j = looseJson(text(await env.AI.run(AI_MODEL, { messages: [{ role: "system", content: system }, { role: "user", content: input }], max_tokens: 2200 }))); } catch {}
    if (!j || !Array.isArray(j.paragraphs)) { try { j = looseJson(text(await env.AI.run(AI_FALLBACK, { messages: [{ role: "system", content: system }, { role: "user", content: input }], response_format: { type: "json_object" }, max_tokens: 2200 }))); } catch {} }
    if (!j || !Array.isArray(j.paragraphs) || !j.paragraphs.length) return json({ error: "ai" }, 502);
    return json({ title: clean(j.title, 80) || "סיפור", paragraphs: j.paragraphs.map((x) => clean(x, 1200)).filter(Boolean).slice(0, 10) });
  }

  // the room
  if (!env.REGA) return json({ error: "not configured" }, 503);
  const stub = (id) => env.REGA.get(env.REGA.idFromName("r:" + id));
  if (what === "new" && req.method === "POST") {
    const b = await req.json().catch(() => ({}));
    const id = token(16), own = token(24);
    const r = await stub(id).fetch("https://r/init", { method: "POST", body: JSON.stringify({ id, own, name: b.name }) });
    return r.ok ? json({ id, own }) : json({ error: "init" }, 500);
  }
  let rid = url.searchParams.get("c"), body;
  if (req.method === "POST") { body = await req.text(); if (body.length > 600_000) return json({ error: "big" }, 413); try { rid = JSON.parse(body).c || rid; } catch {} }
  if (!/^[A-Za-z0-9]{16}$/.test(rid || "")) return json({ error: "room" }, 400);
  return stub(rid).fetch("https://r/" + what + url.search, { method: req.method, body });
}
