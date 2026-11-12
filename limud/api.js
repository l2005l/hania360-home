// HaniaLimud's server side: help with the day's learning, from Workers AI.
// The text itself comes from Sefaria (fetched here by its ref, never from the browser), so every answer is grounded
// in the actual daf or halacha. The answers are labelled as AI help on the page, and are not a halachic ruling.
// POST /api/limud/ai {ref, kind: "daf"|"halacha", mode: "explain"|"quiz"|"ask", q}
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
  const parts = await Promise.all(amudim.map((a) => sefaria(a, "hebrew|William Davidson Edition - Hebrew")));
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

export async function limudApi(request, env, ctx) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST", "access-control-allow-headers": "content-type" } });
  if (url.pathname !== "/api/limud/ai" || request.method !== "POST") return json({ error: "not found" }, 404);
  if (!env.AI) return json({ error: "unavailable" }, 503);
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
