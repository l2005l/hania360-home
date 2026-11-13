// HaniaHaktava's server side: from the teacher's message about what the class learned today, find what to practise.
// The model only reads the message and says which letters and vowel sounds it is about, and which words it names;
// the words for the dictation (with niqqud) come from the word bank in the page, whose niqqud was checked by hand.
// POST /api/haktava/plan {text} -> {letters: ["ק"], vowels: ["a"], words: ["..."], topic: "..."}

const AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";
const AI_FALLBACK = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const out = (o) => o && (o.response ?? (o.choices && o.choices[0] && o.choices[0].message && o.choices[0].message.content));
const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
function loose(t) { if (t && typeof t === "object") return t; const s = String(t || ""), a = s.indexOf("{"), b = s.lastIndexOf("}"); if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; } }

const SYS = "אתה עוזר להורה של ילד בכיתה א׳ או ב׳ להכין הכתבה. ההורה מדביק הודעה מהמורה על מה שלמדו היום. " +
  "מזהים מההודעה בלבד: אילו אותיות, אילו תנועות (ניקוד) ואילו מילים מוזכרות. לא ממציאים. עונים ב־JSON בלבד.";
const ASK = 'החזר JSON בדיוק כך: {"letters":["אותיות עבריות שנלמדו, למשל ק"],"vowels":["מתוך: a (קמץ/פתח), i (חיריק), e (צירה/סגול), o (חולם), u (שורוק/קובוץ), shva (שווא)"],' +
  '"words":["מילים שמוזכרות בהודעה כמילים לתרגול, כמו שהן כתובות"],"topic":"במשפט קצר: מה למדו"}. אם משהו לא מוזכר, משאירים רשימה ריקה.';

export async function haktavaApi(request, env) {
  if (request.method !== "POST" || new URL(request.url).pathname !== "/api/haktava/plan") return json({ error: "not found" }, 404);
  if (!env.AI) return json({ error: "unavailable" }, 503);
  const b = await request.json().catch(() => ({}));
  const text = String(b.text || "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500);
  if (text.length < 3) return json({ error: "empty" }, 400);
  const messages = [{ role: "system", content: SYS }, { role: "user", content: "ההודעה:\n" + text + "\n\n" + ASK }];
  let o = null;
  for (const m of [AI_MODEL, AI_FALLBACK]) { if (o) break; try { o = loose(out(await env.AI.run(m, { messages, max_tokens: 500 }))); } catch {} }
  if (!o) return json({ error: "busy" }, 503);
  const heb = (s) => String(s || "").replace(/[^֑-ׇא-ת ]/g, "").trim();
  const letters = [...new Set((Array.isArray(o.letters) ? o.letters : []).map((x) => heb(x).replace(/[֑-ׇ]/g, "").slice(0, 1)).filter((x) => /^[א-ת]$/.test(x)))].slice(0, 6);
  const vowels = [...new Set((Array.isArray(o.vowels) ? o.vowels : []).map((x) => String(x).toLowerCase().trim()).filter((x) => ["a", "i", "e", "o", "u", "shva"].includes(x)))];
  const words = (Array.isArray(o.words) ? o.words : []).map((x) => heb(x).slice(0, 30)).filter((x) => x.length > 1).slice(0, 15);
  return json({ letters, vowels, words, topic: String(o.topic || "").replace(/[<>]/g, "").slice(0, 120) });
}
