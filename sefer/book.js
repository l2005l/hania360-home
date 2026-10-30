// HaniaSefer (הספר שלי): turns a child's drawings and story into a flip book.
// The child's words are never rewritten: the story is cut into sentences here, and the AI only
// chooses on which drawing each part starts (and suggests a title when there is none).
// Small copies of the drawings go to Workers AI to be described in a few words, and are not kept.
// Counted in the shared StoryLimits object under "sefer:", to stay inside Workers AI's free tier.

const VISION_MODELS = ["@cf/google/gemma-4-26b-a4b-it", "@cf/meta/llama-3.2-11b-vision-instruct"];
const TEXT_MODEL = "@cf/google/gemma-4-26b-a4b-it";
const TEXT_FALLBACK = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const PER_DEVICE = 6, PER_DAY = 150, MAX_PAGES = 16, MAX_IMG = 400000;
const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
const text = (out) => out && (out.response ?? (out.choices && out.choices[0] && out.choices[0].message && out.choices[0].message.content) ?? out.description);
const asText = (r) => (r && typeof r === "object" ? JSON.stringify(r) : r == null ? "" : String(r));
function looseJson(r) {
  if (r && typeof r === "object") return r;
  if (typeof r !== "string") return null;
  try { return JSON.parse(r); } catch {}
  const a = r.indexOf("{"), b = r.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(r.slice(a, b + 1)); } catch { return null; }
}

/** Cuts the story into the child's own sentences (and lines), keeping every word and mark. */
export function pieces(story) {
  const out = [];
  for (const line of String(story).replace(/\r/g, "").split(/\n+/)) {
    const t = line.trim(); if (!t) continue;
    const parts = t.match(/[^.!?…]+(?:[.!?…]+["'״”)]*|$)/g) || [t];
    for (const p of parts) { const x = p.trim(); if (x) out.push(x); }
  }
  return out;
}
/** Splits n pieces as evenly as possible over k pages: the first piece of each page. */
export function evenStarts(n, k) {
  const s = []; for (let i = 0; i < k; i++) s.push(Math.min(n - 1, Math.floor(i * n / k)));
  return s;
}
/** When there are fewer sentences than drawings, long sentences are cut once more at commas. */
function enough(ps, k) {
  let out = ps.slice();
  while (out.length < k) {
    let best = -1, len = 0;
    out.forEach((p, i) => { if (p.includes(",") && p.length > len) { best = i; len = p.length; } });
    if (best < 0) break;
    const p = out[best], cut = p.indexOf(",", Math.floor(p.length / 3));
    const at = cut > 0 ? cut : p.indexOf(",");
    out.splice(best, 1, p.slice(0, at + 1).trim(), p.slice(at + 1).trim());
  }
  return out.filter(Boolean);
}

async function describe(env, b64) {
  const ask = "This is a child's drawing. In one short English sentence, say what it shows (characters, objects, place, colors). No guessing about the story.";
  for (const m of VISION_MODELS) {
    try {
      const out = m.includes("llama-3.2")
        ? await env.AI.run(m, { messages: [{ role: "user", content: ask }], image: b64, max_tokens: 60 })
        : await env.AI.run(m, { messages: [{ role: "user", content: [{ type: "text", text: ask }, { type: "image_url", image_url: { url: "data:image/jpeg;base64," + b64 } }] }], max_tokens: 60 });
      const t = asText(text(out)).replace(/\s+/g, " ").trim();
      if (t && t.length > 6) return t.slice(0, 200);
    } catch (e) {
      // Llama 3.2 Vision asks once per account to accept Meta's license before the first use.
      if (m.includes("llama-3.2") && /agree|license|5016/i.test(String(e && e.message || e))) {
        try { await env.AI.run(m, { prompt: "agree" }); } catch {}
      }
    }
  }
  return "";
}

export async function seferApi(req, env) {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const b = await req.json().catch(() => null) || {};
  const device = /^[A-Za-z0-9_-]{16,40}$/.test(b.device || "") ? b.device : "";
  const story = String(b.story || "").replace(/[<>]/g, "").slice(0, 6000);
  const images = (Array.isArray(b.images) ? b.images : []).slice(0, MAX_PAGES).map((x) => String(x || "")).map((x) => (x.length <= MAX_IMG && /^[A-Za-z0-9+/=]+$/.test(x) ? x : ""));
  const k = Math.max(1, Math.min(MAX_PAGES, +b.pages || images.length || 1));
  if (!device || story.trim().length < 3) return json({ error: "input" }, 400);

  let ps = enough(pieces(story), k);
  const needTitle = !String(b.title || "").trim();
  let starts = evenStarts(ps.length, k), title = "", how = "even";

  if (env.AI && env.SIPUR && ps.length > 1) {
    const lim = await env.SIPUR.get(env.SIPUR.idFromName("limits")).fetch("https://l/", { method: "POST", body: JSON.stringify({ device, ns: "sefer:", perDevice: PER_DEVICE, perDay: PER_DAY }) }).then((r) => r.json()).catch(() => ({ ok: true }));
    if (!lim.ok) return json({ error: lim.why === "device" ? "device" : "day", pages: ps.length ? group(ps, starts) : [], how }, 429);
    const desc = await Promise.all(images.map((x) => (x ? describe(env, x) : "")));
    const system = "You arrange a child's own story into the pages of a picture book. Never change, translate or add words: you only choose where each page starts. Answer with JSON only.";
    const input = "Story parts (Hebrew, in order):\n" + ps.map((p, i) => (i + 1) + ". " + p).join("\n") +
      "\n\nDrawings, one per page, in this order:\n" + Array.from({ length: k }, (_, i) => (i + 1) + ". " + (desc[i] || "(no description)")).join("\n") +
      "\n\nEvery page gets at least one part when possible, parts stay in order, and each page's parts should match its drawing." +
      "\nReturn {\"starts\": [the number of the first part on page 1, page 2, ... page " + k + "]" + (needTitle ? ", \"title\": \"a short Hebrew title, 2-4 words, from the story's own words\"" : "") + "}. starts[0] is 1 and the numbers go up.";
    let j = null;
    for (const [m, extra] of [[TEXT_MODEL, {}], [TEXT_FALLBACK, { response_format: { type: "json_object" } }]]) {
      try { j = looseJson(asText(text(await env.AI.run(m, Object.assign({ messages: [{ role: "system", content: system }, { role: "user", content: input }], max_tokens: 400 }, extra))))); } catch {}
      if (j && Array.isArray(j.starts)) break;
    }
    if (j && Array.isArray(j.starts)) {
      const s = j.starts.slice(0, k).map((x) => Math.round(+x) - 1);
      const ok = s.length === k && s[0] === 0 && s.every((x, i) => Number.isFinite(x) && x >= 0 && x < ps.length && (i === 0 || x > s[i - 1] || (ps.length < k && x >= s[i - 1])));
      if (ok) { starts = s; how = desc.some(Boolean) ? "ai" : "ai-text"; }
      if (needTitle && typeof j.title === "string") title = j.title.replace(/[<>"]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
    }
  }
  return json({ pages: group(ps, starts), title, how });
}

function group(ps, starts) {
  return starts.map((s, i) => {
    const end = i + 1 < starts.length ? starts[i + 1] : ps.length;
    return end > s ? ps.slice(s, end).join(" ") : "";
  });
}

// ---- the child tells the story out loud ---------------------------------------------------------------
const WHISPER = "@cf/openai/whisper-large-v3-turbo";
const MAX_AUDIO = 2800000; // about a minute of compressed speech, as base64
const norm = (w) => w.replace(/[֑-ׇ]/g, "").replace(/[^א-תa-zA-Z0-9]/g, "").toLowerCase();
/** True when every word of b was said in a (no word added or changed, only dropped or re-punctuated). */
export function onlyTheirWords(a, b) {
  const have = new Map();
  for (const w of a.split(/\s+/).map(norm).filter(Boolean)) have.set(w, (have.get(w) || 0) + 1);
  for (const w of b.split(/\s+/).map(norm).filter(Boolean)) { const n = have.get(w) || 0; if (!n) return false; have.set(w, n - 1); }
  return true;
}

/** A short recording becomes text (Hebrew Whisper), lightly tidied, plus one gentle question to go on. */
export async function hearApi(req, env) {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!env.AI) return json({ error: "unavailable" }, 503);
  const b = await req.json().catch(() => null) || {};
  const device = /^[A-Za-z0-9_-]{16,40}$/.test(b.device || "") ? b.device : "";
  const audio = typeof b.audio === "string" && b.audio.length <= MAX_AUDIO && /^[A-Za-z0-9+/=]+$/.test(b.audio) ? b.audio : "";
  const before = String(b.story || "").replace(/[<>]/g, "").slice(-1500);
  const name = String(b.name || "").replace(/[^א-תa-zA-Z' \-]/g, "").trim().slice(0, 20);
  const age = Math.max(3, Math.min(12, +b.age || 6));
  if (!device || (!audio && !b.askOnly)) return json({ error: "input" }, 400);
  if (env.SIPUR) {
    const lim = await env.SIPUR.get(env.SIPUR.idFromName("limits")).fetch("https://l/", { method: "POST", body: JSON.stringify({ device, ns: "seferh:", perDevice: 60, perDay: 1500 }) }).then((r) => r.json()).catch(() => ({ ok: true }));
    if (!lim.ok) return json({ error: lim.why === "device" ? "device" : "day" }, 429);
  }
  let raw = "";
  if (audio) {
    try { const out = await env.AI.run(WHISPER, { audio, language: "he", vad_filter: true }); raw = String((out && (out.text || (out.transcription_info && out.text))) || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim(); } catch (e) { return json({ error: "hear" }, 502); }
    if (!raw) return json({ text: "", q: "" });
  }
  // Light tidying: only drop "אה", "אמ" and words said twice by mistake, and add punctuation. Checked word by word.
  let text = raw;
  if (raw && b.tidy !== false) {
    try {
      const out = await env.AI.run(TEXT_MODEL, { messages: [
        { role: "system", content: "את/ה מקליד/ה סיפור שילד/ה מספר/ת בקול. מחזירים את אותו טקסט בדיוק, רק בלי מילות מילוי (אה, אמ, אממ, כאילו) ובלי מילה שנאמרה פעמיים בטעות, ועם פיסוק נכון. אסור להוסיף, להחליף או לתקן מילים. מחזירים רק את הטקסט." },
        { role: "user", content: raw }], max_tokens: 600 });
      const t = asText(text_(out)).replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
      if (t && t.length >= raw.length * 0.5 && onlyTheirWords(raw, t)) text = t;
    } catch {}
  }
  // One short question that helps the child go on, without giving them ideas.
  let q = "";
  try {
    const story = (before + " " + text).trim();
    const out = await env.AI.run(TEXT_MODEL, { messages: [
      { role: "system", content: "את/ה עוזר/ת לילד/ה בן/בת " + age + " לספר סיפור משלו/ה. שואלים שאלה אחת קצרה ופשוטה בעברית (עד 8 מילים) שעוזרת להמשיך, כמו \"ומה קרה אחר כך?\" או \"איך קוראים לחבר שלו?\". לא מציעים רעיונות ולא מספרים בעצמך. אם הסיפור נשמע גמור, שואלים \"איך הסיפור נגמר?\". מחזירים רק את השאלה." },
      { role: "user", content: (name ? "הילד/ה: " + name + ". " : "") + "הסיפור עד עכשיו: " + story.slice(-1200) }], max_tokens: 40 });
    q = asText(text_(out)).replace(/["<>]/g, "").replace(/\s+/g, " ").trim();
    if (q.length > 70 || !/[א-ת]/.test(q)) q = "";
  } catch {}
  return json({ text, raw, q });
}
const text_ = text;
