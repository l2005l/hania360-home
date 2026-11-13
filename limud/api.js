import { groupApi } from "./group.js";
// HaniaLimud's server side: help with the day's learning, from Workers AI.
// The text itself comes from Sefaria (fetched here by its ref, never from the browser), so every answer is grounded
// in the actual daf or halacha. The answers are labelled as AI help on the page, and are not a halachic ruling.
// POST /api/limud/ai {ref, kind: "daf"|"halacha", mode: "explain"|"quiz"|"ask", q}
// Learning together (a group of friends, or a father and son) is limud/group.js.
// "explain" and "quiz" answers are the same for everyone, so they are kept in the edge cache for a week.

const AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";
const AI_FALLBACK = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const out = (o) => o && (o.response ?? (o.choices && o.choices[0] && o.choices[0].message && o.choices[0].message.content));
const json = (o, s = 200, cache) => Response.json(o, { status: s, headers: { "cache-control": cache || "no-store", "access-control-allow-origin": "*" } });

const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
const flat = (t) => (Array.isArray(t) ? t.map(flat).join("\n") : strip(t));

async function sefaria(ref, version) {
  const u = "https://www.sefaria.org/api/v3/texts/" + encodeURIComponent(ref) + "?version=" + encodeURIComponent(version) + "&return_format=text_only";
  const r = await fetch(u, { cf: { cacheTtl: 86400, cacheEverything: true } });
  if (!r.ok) return "";
  const j = await r.json().catch(() => null);
  return j && j.versions && j.versions[0] ? flat(j.versions[0].text) : "";
}

// The text the AI reads: the Steinsaltz Hebrew (it already translates the Aramaic in brackets) for a daf,
// the Shulchan Arukh with the Rema for a halacha.
async function source(ref, kind) {
  if (kind === "halacha") return sefaria(ref, "hebrew");
  const amudim = /\d+[ab]$/.test(ref) ? [ref] : [ref + "a", ref + "b"];
  const parts = await Promise.all(amudim.map((a) => sefaria("Steinsaltz on " + a, "hebrew")));
  return parts.filter(Boolean).join("\n");
}

const SYS = {
  daf: "אתה חברותא סבלני שעוזר ללמוד את הדף היומי בגמרא. כותבים בעברית פשוטה וברורה, בלי ארמית לא מתורגמת. " +
    "נשענים רק על הטקסט שניתן (ביאור שטיינזלץ על הדף). לא ממציאים מקורות, שמות או מראי מקום. אם משהו לא ברור מהטקסט, אומרים את זה. לא פוסקים הלכה.",
  halacha: "אתה עוזר ללמוד הלכה יומית מהשולחן ערוך. כותבים בעברית פשוטה וברורה. " +
    "נשענים רק על הטקסט שניתן (השולחן ערוך עם הגהות הרמ״א). מבחינים בין דעת המחבר (בדרך כלל מנהג הספרדים) לדעת הרמ״א (בדרך כלל מנהג האשכנזים). " +
    "לא פוסקים הלכה למעשה ולא ממציאים מקורות. בסוף מזכירים בקצרה שלהלכה למעשה שואלים רב.",
};
const ASK = {
  explain: { daf: "הסבר את הדף בשפה פשוטה, לפי הסדר: מה השאלה או הנושא, מה כל צד אומר, איך הגמרא מתקדמת (קושיה, תירוץ), ומה המסקנה. עד 8 נקודות קצרות, כל נקודה בשורה שמתחילה ב־•.",
    halacha: "הסבר בשפה פשוטה מה כתוב כאן: כל סעיף בנקודה אחת או שתיים, כל נקודה בשורה שמתחילה ב־•. אם יש הגהה של הרמ״א, הסבר במה היא מוסיפה או חולקת." },
  quiz: { daf: "כתוב 4 שאלות חזרה קצרות על הדף, ואחרי כל שאלה את התשובה. פורמט: שורה שמתחילה ב־❓ לשאלה, ושורה שמתחילה ב־✅ לתשובה.",
    halacha: "כתוב 3 שאלות חזרה קצרות על ההלכות האלה, ואחרי כל שאלה את התשובה. פורמט: שורה שמתחילה ב־❓ לשאלה, ושורה שמתחילה ב־✅ לתשובה." },
};

// The weekly portion for the Shabbat table: a short telling for children, questions for three ages and a riddle.
// The model reads the opening of the portion (Sefaria's Hebrew text) and the portion's name; the answer is JSON.
// POST /api/limud/table {ref, name}; the same for everyone, so cached for ten days.
const TABLE_SYS = "אתה מכין חומר קצר לשולחן שבת של משפחה דתית־מסורתית בישראל, על פרשת השבוע. כותבים בעברית פשוטה, חמה ומדויקת, בלי מדרשים מומצאים ובלי ציטוטים שאינך בטוח בהם. " +
  "את השם כותבים ה׳ ואת המילה אלוהים כותבים אלוקים. כותבים רק דברים שכתובים בפסוקים שניתנו, לפי הסדר שלהם, בלי להוסיף אירועים, מקומות או פרטים שלא כתובים בהם. כל שאלה צריכה תשובה ברורה מתוך הפרשה. לא פוסקים הלכה. עונים ב־JSON בלבד.";
const TABLE_ASK = "החזר JSON בדיוק במבנה הזה, בלי טקסט נוסף:\n" +
  '{"story":["5 עד 7 משפטים קצרים (עד 20 מילים כל אחד) שמספרים לילדים מה קורה בפרשה, לפי הסדר"],' +
  '"small":["2 שאלות פשוטות לילדים בני 3 עד 6"],"big":["3 שאלות לילדים בני 7 עד 12, שתיים על מה שקרה ואחת שמחברת לחיים שלהם"],' +
  '"adult":["2 שאלות למחשבה לנוער ולמבוגרים"],"riddle":{"q":"חידה קצרה על משהו מהפרשה","a":"התשובה"},"value":"מילה או שתיים: הרעיון שאפשר לקחת לשבוע"}';
// Some models hand back the JSON already parsed.
function loose(t) { if (t && typeof t === "object") return t; const s = String(t || ""), a = s.indexOf("{"), b = s.lastIndexOf("}"); if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; } }
// For the Shabbat table: the Name is written ה׳ and אלוקים, as in printed material for the home.
const holy = (t) => String(t).replace(/יהוה|יקוק|ה'(?=[\s,.:;!?]|$)/g, "ה׳").replace(/(^|[^\u05D0-\u05EA])([והלבמשכ]{0,3})אלו?הי/g, "$1$2אלוקי");
// a sentence that is too long is cut at the end of a sentence (or a word), never in the middle of a word
const cut = (t, len) => { t = holy(strip(t)); if (t.length <= len) return t; const a = t.slice(0, len), p = Math.max(a.lastIndexOf(". "), a.lastIndexOf("! "), a.lastIndexOf("? ")); return p > len * 0.5 ? a.slice(0, p + 1) : a.slice(0, a.lastIndexOf(" ")) + "..."; };
const strs = (a, n, len) => (Array.isArray(a) ? a : []).map((x) => cut(x, len)).filter(Boolean).slice(0, n);
async function table(request, env, ctx) {
  const b = await request.json().catch(() => ({}));
  const ref = String(b.ref || "").slice(0, 80), name = strip(b.name).slice(0, 30);
  if (!/^[A-Za-z][A-Za-z_ ,'.0-9:-]{1,79}$/.test(ref) || !name) return json({ error: "bad" }, 400);
  const key = new Request("https://limud.hania360.com/ai-cache/v3/table/" + encodeURIComponent(ref));
  const hit = await caches.default.match(key); if (hit) return hit;
  // the whole portion, without niqqud and cantillation marks; if that is too much for the model, a shorter part
  const full = (await sefaria(ref.replace(/ /g, "_"), "hebrew")).replace(/[\u0591-\u05C7]/g, "").replace(/\{[פס]\}/g, "").replace(/\s+/g, " ");
  let o = null; const why = [];
  for (const [m, n] of [[AI_MODEL, 12000], [AI_MODEL, 7000], [AI_FALLBACK, 7000]]) {
    if (o) break;
    const messages = [{ role: "system", content: TABLE_SYS }, { role: "user", content: "פרשת " + name + " (" + ref + ").\n" + (full.length > n ? "הפרשה (חלק ממנה):\n" : "הפרשה כולה:\n") + full.slice(0, n) + "\n\n" + TABLE_ASK }];
    let raw = "";
    try { raw = out(await env.AI.run(m, { messages, max_tokens: 1600 })); o = loose(raw); } catch (e) { why.push(n + ": " + String(e && e.message || e).slice(0, 120)); }
    if (o && !(Array.isArray(o.story) && o.story.length)) o = null;
    if (!o && raw) why.push(n + ": not json: " + String(raw).slice(0, 80));
  }
  if (!o) return json({ error: "busy", why }, 503);
  const r = { story: strs(o.story, 7, 260), small: strs(o.small, 3, 140), big: strs(o.big, 4, 160), adult: strs(o.adult, 3, 180),
    riddle: o.riddle && o.riddle.q ? { q: cut(o.riddle.q, 200), a: cut(o.riddle.a, 160) } : null, value: cut(o.value, 40) };
  if (!r.story.length) return json({ error: "busy" }, 503);
  const res = json(r, 200, "public, max-age=864000");
  ctx && ctx.waitUntil ? ctx.waitUntil(caches.default.put(key, res.clone())) : await caches.default.put(key, res.clone());
  return res;
}

export async function limudApi(request, env, ctx) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST", "access-control-allow-headers": "content-type" } });
  if (url.pathname === "/api/limud/group" && request.method === "POST") return groupApi(request, env);
  if (!env.AI) return json({ error: "unavailable" }, 503);
  if (url.pathname === "/api/limud/table" && request.method === "POST") return table(request, env, ctx);
  if (url.pathname !== "/api/limud/ai" || request.method !== "POST") return json({ error: "not found" }, 404);
  const b = await request.json().catch(() => ({}));
  const ref = String(b.ref || "").slice(0, 80), kind = b.kind === "halacha" ? "halacha" : "daf", mode = ["explain", "quiz", "ask"].includes(b.mode) ? b.mode : "explain";
  const q = String(b.q || "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (!/^[A-Za-z][A-Za-z_ ,'.0-9-]{1,79}$/.test(ref)) return json({ error: "bad ref" }, 400);
  if (mode === "ask" && q.length < 3) return json({ error: "empty" }, 400);

  const key = new Request("https://limud.hania360.com/ai-cache/v1/" + kind + "/" + mode + "/" + encodeURIComponent(ref));
  const cache = caches.default;
  if (mode !== "ask") { const hit = await cache.match(key); if (hit) return hit; }

  const text = (await source(ref, kind)).slice(0, 9000);
  if (!text) return json({ error: "no text" }, 502);
  const user = "הטקסט (" + ref + "):\n" + text + "\n\n" + (mode === "ask" ? "שאלה של הלומד: " + q + "\nענה בקצרה (עד 6 שורות), רק לפי הטקסט." : ASK[mode][kind]);
  const messages = [{ role: "system", content: SYS[kind] }, { role: "user", content: user }];
  let answer = "";
  try { answer = out(await env.AI.run(AI_MODEL, { messages, max_tokens: 900 })); } catch {}
  if (!answer) { try { answer = out(await env.AI.run(AI_FALLBACK, { messages, max_tokens: 900 })); } catch {} }
  answer = String(answer || "").replace(/\*\*/g, "").replace(/^#+\s*/gm, "").trim().slice(0, 4000);
  if (!answer) return json({ error: "busy" }, 503);
  const res = json({ answer }, 200, mode === "ask" ? "no-store" : "public, max-age=604800");
  if (mode !== "ask") ctx && ctx.waitUntil ? ctx.waitUntil(cache.put(key, res.clone())) : await cache.put(key, res.clone());
  return res;
}
