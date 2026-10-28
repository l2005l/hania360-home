// HaniaSipur: a bedtime story written for one child by Workers AI, read aloud on the phone.
// Only choices from fixed lists and a first name reach the model, so nothing typed can steer it.
// A small Durable Object counts stories per phone and per day, to keep Workers AI inside its free tier.

const AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";
const AI_FALLBACK_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const PER_DEVICE = 6, PER_DAY = 300;
const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });

export const PLACES = { space: "בחלל, בין כוכבים וירחים", forest: "ביער קסום עם עצים מדברים", sea: "מתחת לים, עם דגים צבעוניים", castle: "בטירה עתיקה", desert: "במדבר, במכתש רמון בלילה", city: "בעיר שלהם, בלילה שקט", farm: "בחווה עם בעלי חיים", clouds: "על ענן רך בשמיים" };
export const FRIENDS = { none: "", dragon: "דרקון קטן וחביב", cat: "חתול מדבר", owl: "ינשוף חכם", dog: "כלב נאמן", unicorn: "חד־קרן", robot: "רובוט קטן", bear: "דובי רך", turtle: "צב זקן וטוב לב" };
export const VALUES = { share: "לשתף ולתת לאחרים", brave: "להיות אמיץ גם כשמפחדים", dark: "לא לפחד מהחושך", friend: "להיות חבר טוב", patient: "סבלנות", sorry: "לבקש סליחה ולסלוח", help: "לעזור בבית ולאחרים", new: "להתחיל דבר חדש (גן, כיתה, אח קטן)", kind: "להיות נחמד לבעלי חיים ולטבע", sleep: "שהלילה הוא זמן לנוח ולחלום" };

const day = () => new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10);

export class StoryLimits {
  constructor(ctx) { this.ctx = ctx; ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS n (k TEXT PRIMARY KEY, c INTEGER)"); }
  async fetch(req) {
    const { device } = await req.json(), d = day(), sql = this.ctx.storage.sql;
    const get = (k) => { const r = [...sql.exec("SELECT c FROM n WHERE k = ?", k)][0]; return r ? r.c : 0; };
    if (get("all:" + d) >= PER_DAY) return json({ ok: false, why: "day" });
    if (get(device + ":" + d) >= PER_DEVICE) return json({ ok: false, why: "device" });
    for (const k of ["all:" + d, device + ":" + d]) sql.exec("INSERT INTO n (k, c) VALUES (?, 1) ON CONFLICT(k) DO UPDATE SET c = c + 1", k);
    sql.exec("DELETE FROM n WHERE k NOT LIKE ?", "%" + d);
    return json({ ok: true });
  }
}

const text = (out) => out && (out.response ?? (out.choices && out.choices[0] && out.choices[0].message && out.choices[0].message.content));
function looseJson(r) {
  if (r && typeof r === "object") return r;
  if (typeof r !== "string") return null;
  try { return JSON.parse(r); } catch {}
  const a = r.indexOf("{"), b = r.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(r.slice(a, b + 1)); } catch { return null; }
}

export async function storyApi(req, env) {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!env.AI || !env.SIPUR) return json({ error: "unavailable" }, 503);
  const b = await req.json().catch(() => null) || {};
  const device = /^[A-Za-z0-9_-]{16,40}$/.test(b.device || "") ? b.device : "";
  const name = String(b.name || "").replace(/[^א-תa-zA-Z' \-]/g, "").trim().slice(0, 20);
  const boy = b.g !== "f", age = Math.max(2, Math.min(10, +b.age || 5));
  const place = PLACES[b.place] || PLACES.forest, friend = FRIENDS[b.friend] ?? "", value = VALUES[b.value] || VALUES.friend;
  const long = b.len === "long", sib = String(b.sib || "").replace(/[^א-תa-zA-Z' \-]/g, "").trim().slice(0, 20);
  if (!device || !name) return json({ error: "input" }, 400);
  const lim = await env.SIPUR.get(env.SIPUR.idFromName("limits")).fetch("https://l/", { method: "POST", body: JSON.stringify({ device }) }).then((r) => r.json());
  if (!lim.ok) return json({ error: lim.why === "device" ? "device" : "day" }, 429);

  const he = boy ? "בן" : "בת", pr = boy ? "הוא" : "היא";
  const system = "את/ה סופר/ת ילדים ישראלי/ת. כותבים סיפור לפני השינה בעברית תקנית, פשוטה וחמה, בלשון " + (boy ? "זכר" : "נקבה") + " לגיבור. " +
    "הסיפור רגוע ומרגיע, בלי פחד אמיתי, בלי אלימות, בלי מוות ובלי מסרים מפחידים. משפטים קצרים שקל להקריא בקול. " +
    "מותר מעט הומור וחזרות קצביות שילדים אוהבים. הסוף נרגע ומסתיים בשינה מתוקה. " +
    "מחזירים JSON בלבד: {\"title\": \"כותרת קצרה\", \"paragraphs\": [\"פסקה\", ...]} בלי טקסט נוסף.";
  const input = "גיבור הסיפור: " + name + ", " + he + " " + age + ". " +
    "המקום: " + place + ". " + (friend ? "חבר בסיפור: " + friend + ". " : "") + (sib ? "גם " + sib + " (אח/ות) מופיע/ה בסיפור. " : "") +
    "המסר העדין של הסיפור: " + value + " (בלי להטיף, דרך מה שקורה). " +
    "אורך: " + (long ? "כ־450 מילים, 7–9 פסקאות" : "כ־250 מילים, 4–5 פסקאות") + ". " + pr + " הגיבור/ה, והשם " + name + " חוזר כמה פעמים.";
  let j = null;
  try { j = looseJson(text(await env.AI.run(AI_MODEL, { messages: [{ role: "system", content: system }, { role: "user", content: input }], max_tokens: 2500 }))); } catch {}
  if (!j || !Array.isArray(j.paragraphs)) {
    try { j = looseJson(text(await env.AI.run(AI_FALLBACK_MODEL, { messages: [{ role: "system", content: system }, { role: "user", content: input }], response_format: { type: "json_object" }, max_tokens: 2500 }))); } catch {}
  }
  if (!j || !Array.isArray(j.paragraphs) || !j.paragraphs.length) return json({ error: "ai" }, 502);
  const clean = (s, n) => String(s || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
  return json({ title: clean(j.title, 80) || "סיפור ל" + name, paragraphs: j.paragraphs.map((p) => clean(p, 1200)).filter(Boolean).slice(0, 12) });
}
