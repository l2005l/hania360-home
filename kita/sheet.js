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
  // A rich sheet, built like a good teacher's: what we practise, a worked example, then parts that go up step by step
  // (warm-up, practice, using it, find the mistake, a challenge). Arithmetic answers are worked out here, not trusted.
  const system = "את/ה מורה ישראלי/ת מנוסה ומוערך/ת שכותב/ת דפי עבודה עשירים ומגוונים לפי תוכנית הלימודים בישראל. " +
    (english ? "השאלות עצמן באנגלית ברמה שמתאימה לכיתה, וההוראות וכותרות החלקים בעברית. " : "כותבים בעברית תקנית, ברורה ומותאמת לגיל. ") +
    "התוכן נכון עובדתית ומדויק. בחשבון: מספרים מתאימים לכיתה ותשובות מחושבות בדיוק; תרגיל חשבון כותבים כביטוי בלבד (למשל 47 × 6) ב־type calc. " +
    "הדף בנוי בחלקים שעולים בהדרגה: חימום קצר, תרגול, יישום (בעיות מילוליות מחיי היום־יום של ילדים בישראל, בעיה בכל שאלה, ב־type word), \"מצאו את הטעות\" (פתרון שגוי שהתלמיד צריך לתקן), ואתגר. " +
    "סוגי שאלות: open (פתוחה), mc (אמריקאית, בדיוק 4 אפשרויות, התשובה אחת מהן), fill (השלמה, המקום מסומן ב־_____), tf (נכון/לא נכון: טענה), calc (תרגיל חשבון), word (בעיה מילולית). " +
    "מחזירים JSON בלבד: {\"title\":\"כותרת\",\"goal\":\"משפט: מה נתרגל היום\",\"example\":{\"title\":\"דוגמה פתורה: ...\",\"steps\":[\"שלב 1 ...\",\"שלב 2 ...\"]}," +
    "\"sections\":[{\"name\":\"שם החלק\",\"ins\":\"הוראה קצרה לחלק\",\"questions\":[{\"q\":\"...\",\"type\":\"open|mc|fill|tf|calc|word\",\"options\":[\"...\"],\"answer\":\"התשובה המלאה\"}]}]}. בלי טקסט נוסף.";
  const input = "דף עבודה לכיתה " + grade + ", מקצוע: " + subject + ", נושא: " + topic + ". רמה " + level + ". בערך " + n + " שאלות בסך הכול, ב־4 עד 5 חלקים. העדפת סוג שאלות: " + type + ".";
  let j = null;
  const ok = (x) => x && (Array.isArray(x.sections) && x.sections.some((s) => Array.isArray(s.questions) && s.questions.length) || Array.isArray(x.questions) && x.questions.length);
  try { j = looseJson(text(await env.AI.run(AI_MODEL, { messages: [{ role: "system", content: system }, { role: "user", content: input }], max_tokens: 5000 }))); } catch {}
  if (!ok(j)) { try { j = looseJson(text(await env.AI.run(AI_FALLBACK_MODEL, { messages: [{ role: "system", content: system }, { role: "user", content: input }], response_format: { type: "json_object" }, max_tokens: 5000 }))); } catch {} }
  if (!ok(j)) return json({ error: "ai" }, 502);
  const one = (q) => {
    const t = ["open", "mc", "fill", "tf", "calc", "word"].includes(q.type) ? q.type : Array.isArray(q.options) && q.options.length >= 2 ? "mc" : "open";
    const o = { q: clean(q.q, 600), type: t, options: t === "mc" ? (q.options || []).slice(0, 4).map((x) => clean(x, 200)) : [], answer: clean(q.answer, 400) };
    if (t === "calc") { const v = arith(o.q); if (v != null) o.answer = String(v); }
    return o;
  };
  let sections = (Array.isArray(j.sections) ? j.sections : [{ name: "", ins: "", questions: j.questions }]).slice(0, 7).map((s) => ({ name: clean(s.name, 80), ins: clean(s.ins, 240), questions: (Array.isArray(s.questions) ? s.questions : []).slice(0, 12).map(one).filter((q) => q.q) })).filter((s) => s.questions.length);
  let ex = j.example && Array.isArray(j.example.steps) && j.example.steps.length ? { title: clean(j.example.title, 120), steps: j.example.steps.slice(0, 6).map((x) => clean(x, 260)).filter(Boolean) } : null;
  // A worked example must be right. Any sum in it that is wrong: for "a × b" we write the steps ourselves, otherwise it goes.
  if (ex && wrongEq([ex.title].concat(ex.steps).join(" ")).length) {
    const m = /(\d{1,4})\s*[×x*]\s*(\d{1,3})/.exec(ex.title + " " + ex.steps.join(" "));
    ex = m ? columnExample(+m[1], +m[2]) : null;
  }
  // answers: true/false about a sum is decided by working it out; a sum written in an answer is corrected
  for (const sec of sections) for (const q of sec.questions) {
    if (q.type === "tf") { const m = EQ.exec(q.q); if (m && new RegExp("^\\s*" + EQ.source + "\\s*\\.?\\s*$").test(q.q)) { const v = arith(m[1]); if (v != null) q.answer = Math.abs(v - +m[2]) < 1e-9 ? "נכון" : "לא נכון (" + m[1].trim() + " = " + v + ")"; } }
    if (q.type !== "calc") q.answer = fixEq(q.answer);
  }
  return json({ v: 2, title: clean(j.title, 100) || topic, goal: clean(j.goal, 220), instructions: clean(j.instructions, 300), example: ex, sections, questions: [].concat(...sections.map((s) => s.questions)), grade, subject: b.subject in SUBJECTS ? b.subject : "other", topic });
}

// The value of a plain arithmetic exercise ("47 × 6", "(12 + 8) : 4"), or null when it is anything else.
export function arith(q) {
  const e = String(q).replace(/=\s*_*\s*\??\s*$/, "").replace(/[×x*]/g, "*").replace(/[÷:]/g, "/").replace(/−/g, "-").replace(/\s+/g, "");
  if (!/^[\d.+\-*/()]+$/.test(e) || !/\d[+\-*/]/.test(e) || e.length > 40) return null;
  let i = 0;
  const num = () => { let m = /^\d+(\.\d+)?/.exec(e.slice(i)); if (!m) throw 0; i += m[0].length; return +m[0]; };
  const atom = () => { if (e[i] === "(") { i++; const v = sum(); if (e[i] !== ")") throw 0; i++; return v; } if (e[i] === "-") { i++; return -atom(); } return num(); };
  const prod = () => { let v = atom(); while (e[i] === "*" || e[i] === "/") { const op = e[i++], w = atom(); if (op === "/" && w === 0) throw 0; v = op === "*" ? v * w : v / w; } return v; };
  const sum = () => { let v = prod(); while (e[i] === "+" || e[i] === "-") { const op = e[i++], w = prod(); v = op === "+" ? v + w : v - w; } return v; };
  try { const v = sum(); if (i !== e.length || !isFinite(v)) return null; return Math.round(v * 1000) / 1000; } catch { return null; }
}

// "47 × 6 = 280": an arithmetic statement and its claimed result
const EQ = /((?:\d+(?:\.\d+)?\s*[×x*:÷+\-−]\s*)+\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/;
function wrongEq(t) { const out = [], re = new RegExp(EQ.source, "g"); let m; while ((m = re.exec(String(t)))) { const v = arith(m[1]); if (v != null && Math.abs(v - +m[2]) > 1e-9) out.push(m[0]); } return out; }
function fixEq(t) { return String(t).replace(new RegExp(EQ.source, "g"), (all, e, r) => { const v = arith(e); return v != null && Math.abs(v - +r) > 1e-9 ? e.trim() + " = " + v : all; }); }
// the steps of a column multiplication, worked out here
function columnExample(a, b) {
  const steps = [], ones = b % 10, tens = Math.floor(b / 10) % 10, hund = Math.floor(b / 100);
  if (b < 10) return { title: "דוגמה פתורה: " + a + " × " + b, steps: ["כופלים כל ספרה של " + a + " ב־" + b + ", מימין לשמאל, ומעבירים את מה שעובר לעמודה הבאה.", "התוצאה: " + a + " × " + b + " = " + a * b] };
  steps.push("שלב 1: כופלים את " + a + " בספרת האחדות, " + ones + ": " + a + " × " + ones + " = " + a * ones);
  steps.push("שלב 2: כופלים את " + a + " בספרת העשרות. " + tens + " עשרות הן " + tens * 10 + ", לכן כותבים 0 במקום האחדות: " + a + " × " + tens * 10 + " = " + a * tens * 10);
  if (hund) steps.push("שלב 3: כופלים את " + a + " במאות: " + a + " × " + hund * 100 + " = " + a * hund * 100);
  steps.push("שלב " + (hund ? 4 : 3) + ": מחברים את השורות: " + [a * ones, a * tens * 10].concat(hund ? [a * hund * 100] : []).join(" + ") + " = " + a * b);
  return { title: "דוגמה פתורה: " + a + " × " + b, steps };
}
