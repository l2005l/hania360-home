// HaniaKita worksheets: Workers AI writes a Hebrew worksheet for a grade, subject and topic, with an answer key.
// Counted per device and per day in the same limits object as HaniaSipur, under its own "kita:" namespace.
const AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";
const AI_FALLBACK_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
export const GRADES = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב"];
export const SUBJECTS = { math: "חשבון ומתמטיקה", hebrew: "עברית והבנת הנקרא", english: "אנגלית", science: "מדע וטכנולוגיה", history: "היסטוריה", tanach: "תנ\"ך", geo: "גאוגרפיה", civics: "אזרחות", other: "נושא כללי" };
const LEVELS = { easy: "קלה", mid: "בינונית", hard: "מאתגרת" };
const TYPES = { mix: "מעורב: שאלות פתוחות, אמריקאיות והשלמה", open: "שאלות פתוחות", mc: "שאלות אמריקאיות עם 4 תשובות", fill: "השלמת משפטים" };
const text = (out) => out && (out.response ?? (out.choices && out.choices[0] && out.choices[0].message && out.choices[0].message.content));
function looseJson(r) {
  if (r && typeof r === "object") return r;
  if (typeof r !== "string") return null;
  try { return JSON.parse(r); } catch {}
  const a = r.indexOf("{"), b = r.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(r.slice(a, b + 1)); } catch { return null; }
}
const clean = (s, n) => String(s == null ? "" : s).replace(/[<>]/g, "").replace(/[ \t]+/g, " ").trim().slice(0, n);

export async function sheetApi(req, env) {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!env.AI || !env.SIPUR) return json({ error: "unavailable" }, 503);
  const b = await req.json().catch(() => null) || {};
  const device = /^[A-Za-z0-9_-]{16,40}$/.test(b.device || "") ? b.device : "";
  const grade = GRADES.includes(b.grade) ? b.grade : "ד", subject = SUBJECTS[b.subject] || SUBJECTS.other;
  const topic = clean(b.topic, 80), level = LEVELS[b.level] || LEVELS.mid, type = TYPES[b.type] || TYPES.mix, n = Math.max(4, Math.min(15, +b.n || 8));
  const english = b.subject === "english";
  if (!device || topic.length < 2) return json({ error: "input" }, 400);
  const lim = await env.SIPUR.get(env.SIPUR.idFromName("limits")).fetch("https://l/", { method: "POST", body: JSON.stringify({ device, ns: "kita:", perDevice: 15, perDay: 400 }) }).then((r) => r.json());
  if (!lim.ok) return json({ error: lim.why === "device" ? "device" : "day" }, 429);
  const system = "את/ה מורה ישראלי/ת מנוסה שכותב/ת דפי עבודה לפי תוכנית הלימודים בישראל. " +
    (english ? "השאלות עצמן באנגלית ברמה שמתאימה לכיתה, וההוראות בעברית. " : "כותבים בעברית תקנית, ברורה ומותאמת לגיל. ") +
    "התוכן נכון עובדתית ומדויק. בחשבון: מספרים פשוטים ותשובות מחושבות בדיוק. " +
    "מחזירים JSON בלבד: {\"title\":\"כותרת הדף\",\"instructions\":\"הוראה קצרה לתלמיד\",\"questions\":[{\"q\":\"השאלה\",\"type\":\"open|mc|fill\",\"options\":[\"א\",\"ב\",\"ג\",\"ד\"],\"answer\":\"התשובה הנכונה\"}]}. " +
    "ב־mc יש בדיוק 4 אפשרויות והתשובה היא אחת מהן. ב־fill מסמנים את המקום להשלמה ב־_____. בלי טקסט נוסף.";
  const input = "דף עבודה לכיתה " + grade + ", מקצוע: " + subject + ", נושא: " + topic + ". רמה " + level + ". " + n + " שאלות. סוג: " + type + ".";
  let j = null;
  try { j = looseJson(text(await env.AI.run(AI_MODEL, { messages: [{ role: "system", content: system }, { role: "user", content: input }], max_tokens: 3500 }))); } catch {}
  if (!j || !Array.isArray(j.questions)) { try { j = looseJson(text(await env.AI.run(AI_FALLBACK_MODEL, { messages: [{ role: "system", content: system }, { role: "user", content: input }], response_format: { type: "json_object" }, max_tokens: 3500 }))); } catch {} }
  if (!j || !Array.isArray(j.questions) || !j.questions.length) return json({ error: "ai" }, 502);
  const qs = j.questions.slice(0, 20).map((q) => {
    const t = ["open", "mc", "fill"].includes(q.type) ? q.type : Array.isArray(q.options) && q.options.length >= 2 ? "mc" : "open";
    return { q: clean(q.q, 600), type: t, options: t === "mc" ? (q.options || []).slice(0, 4).map((o) => clean(o, 200)) : [], answer: clean(q.answer, 400) };
  }).filter((q) => q.q);
  return json({ title: clean(j.title, 100) || topic, instructions: clean(j.instructions, 300), questions: qs, grade, subject: b.subject in SUBJECTS ? b.subject : "other", topic });
}
