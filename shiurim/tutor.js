// HaniaShiurim (עזרה בשיעורי בית): a patient tutor for grades א–ו in math and Hebrew reading comprehension.
// It never hands over the answer: the exercise becomes 2–5 small questions the child answers one by one.
// In math every number the child should reach is computed here from an expression, not trusted to the model.
// A photo of the page is read by a vision model into text the child can fix, and is not kept.
// Counted in the shared StoryLimits object under "shiur:" (plans and photos) and "shiurc:" (checking answers).

const VISION_MODELS = ["@cf/google/gemma-4-26b-a4b-it", "@cf/meta/llama-3.2-11b-vision-instruct"];
const TEXT_MODEL = "@cf/google/gemma-4-26b-a4b-it";
const TEXT_FALLBACK = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const MAX_IMG = 600000;
const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
const text = (out) => out && (out.response ?? (out.choices && out.choices[0] && out.choices[0].message && out.choices[0].message.content) ?? out.description);
const asText = (r) => (r && typeof r === "object" ? JSON.stringify(r) : r == null ? "" : String(r));
const clean = (s, n) => String(s == null ? "" : s).replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const GRADES = ["א", "ב", "ג", "ד", "ה", "ו"];
function looseJson(r) {
  if (r && typeof r === "object") return r;
  if (typeof r !== "string") return null;
  try { return JSON.parse(r); } catch {}
  const a = r.indexOf("{"), b = r.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(r.slice(a, b + 1)); } catch { return null; }
}

/** Evaluates + − × ÷ and parentheses on plain numbers only (no names, no code). Returns null when it cannot. */
export function calc(expr) {
  const s = String(expr || "").replace(/[×xX]/g, "*").replace(/[÷:]/g, "/").replace(/−/g, "-").replace(/,/g, "").replace(/\s+/g, "");
  if (!s || s.length > 80 || !/^[0-9.+\-*/()]+$/.test(s)) return null;
  let i = 0;
  const num = () => { const m = s.slice(i).match(/^\d+(\.\d+)?/); if (!m) throw 0; i += m[0].length; return +m[0]; };
  const atom = () => { if (s[i] === "(") { i++; const v = sum(); if (s[i] !== ")") throw 0; i++; return v; } if (s[i] === "-") { i++; return -atom(); } return num(); };
  const prod = () => { let v = atom(); while (s[i] === "*" || s[i] === "/") { const o = s[i++], w = atom(); if (o === "/" && w === 0) throw 0; v = o === "*" ? v * w : v / w; } return v; };
  const sum = () => { let v = prod(); while (s[i] === "+" || s[i] === "-") { const o = s[i++], w = prod(); v = o === "+" ? v + w : v - w; } return v; };
  try { const v = sum(); if (i !== s.length || !Number.isFinite(v)) return null; return Math.round(v * 1e6) / 1e6; } catch { return null; }
}
const fmt = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(4)));

async function limit(env, device, ns, perDevice, perDay) {
  if (!env.SIPUR) return { ok: true };
  return env.SIPUR.get(env.SIPUR.idFromName("limits")).fetch("https://l/", { method: "POST", body: JSON.stringify({ device, ns, perDevice, perDay }) }).then((r) => r.json()).catch(() => ({ ok: true }));
}
async function ask(env, system, input, max) {
  for (const [m, extra] of [[TEXT_MODEL, {}], [TEXT_FALLBACK, { response_format: { type: "json_object" } }]]) {
    try {
      const j = looseJson(asText(text(await env.AI.run(m, Object.assign({ messages: [{ role: "system", content: system }, { role: "user", content: input }], max_tokens: max }, extra)))));
      if (j) return j;
    } catch {}
  }
  return null;
}

// A photo of the exercise (or of the reading passage) becomes text the child sees and can fix.
async function read(env, b64, what) {
  const q = what === "passage"
    ? "This is a photo of a Hebrew reading passage from an Israeli elementary-school workbook. Copy the Hebrew text exactly as written, paragraph by paragraph. Output only the text, nothing else."
    : "This is a photo of a homework exercise from an Israeli elementary-school workbook (Hebrew). Copy the exercise exactly as written: the Hebrew words, the numbers and the math signs. If there are several exercises, copy them all, one per line. Output only the exercise text, nothing else.";
  for (const m of VISION_MODELS) {
    try {
      const out = m.includes("llama-3.2")
        ? await env.AI.run(m, { messages: [{ role: "user", content: q }], image: b64, max_tokens: 700 })
        : await env.AI.run(m, { messages: [{ role: "user", content: [{ type: "text", text: q }, { type: "image_url", image_url: { url: "data:image/jpeg;base64," + b64 } }] }], max_tokens: 700 });
      const t = asText(text(out)).replace(/^```[a-z]*\n?|```$/g, "").trim();
      if (t && t.length > 1) return t.slice(0, 3000);
    } catch (e) {
      if (m.includes("llama-3.2") && /agree|license|5016/i.test(String(e && e.message || e))) { try { await env.AI.run(m, { prompt: "agree" }); } catch {} }
    }
  }
  return "";
}

function mathPrompt(g) {
  return "You are a warm, patient math tutor for an Israeli child in grade " + g + " (כיתה " + g + "'). The child sends a homework exercise in Hebrew. " +
    "Never give the final answer. Break the exercise into 2 to 5 small steps that the child solves, each one a short question in simple Hebrew suited to grade " + g + " (short sentences, everyday words, like a kind teacher). " +
    "For every step whose answer is a number, give \"expr\": an arithmetic expression with only numbers, + - * / and parentheses that computes that step's answer from the exercise's numbers (for example \"(12+8)*3\"). " +
    "For a step whose answer is not a number (such as a word, \">\" or a choice), give \"answer\" as a short text and no expr. " +
    "\"hint\" helps without revealing the answer (for example: which operation, a picture to imagine, an easier example). " +
    "The last step's answer is the answer to the whole exercise. If there are several exercises, take only the first one. If the text is not a math exercise, return {\"error\":\"notmath\"}. " +
    "Answer with JSON only: {\"restate\":\"the exercise in one short Hebrew line\",\"steps\":[{\"ask\":\"...\",\"expr\":\"...\",\"answer\":\"...\",\"hint\":\"...\"}],\"tip\":\"one short Hebrew sentence on how to check the answer\"}";
}
function readingPrompt(g) {
  return "You are a warm, patient Hebrew reading-comprehension tutor for an Israeli child in grade " + g + " (כיתה " + g + "'). The child sends a reading passage and a question about it. " +
    "Never write the answer for the child. Lead them to find it in the passage in 2 to 4 short steps, in simple Hebrew for grade " + g + ": " +
    "first where to look (which paragraph or sentence, or which key word to search for), then small questions about what is written there, and the last step asks the original question in the child's own words. " +
    "For each step give \"answer\": the expected answer in a few Hebrew words (taken from the passage when possible), and \"hint\" that points to the place in the text without giving the answer. " +
    "Answer with JSON only: {\"restate\":\"the question in one short Hebrew line\",\"steps\":[{\"ask\":\"...\",\"answer\":\"...\",\"hint\":\"...\"}],\"tip\":\"one short Hebrew sentence on how to write a full answer (for example: to start the answer with words from the question)\"}";
}

export async function tutorApi(req, env, url) {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!env.AI) return json({ error: "unavailable" }, 503);
  const raw = await req.text(); if (raw.length > 900000) return json({ error: "size" }, 413);
  let b = {}; try { b = JSON.parse(raw || "{}"); } catch { return json({ error: "json" }, 400); }
  const device = /^[A-Za-z0-9_-]{16,40}$/.test(b.device || "") ? b.device : "";
  if (!device) return json({ error: "input" }, 400);
  const g = GRADES.includes(b.grade) ? b.grade : "ג", what = url.pathname.split("/").pop();

  if (what === "read") {
    const img = String(b.image || "");
    if (!img || img.length > MAX_IMG || !/^[A-Za-z0-9+/=]+$/.test(img)) return json({ error: "image" }, 400);
    const lim = await limit(env, device, "shiur:", 30, 600); if (!lim.ok) return json({ error: lim.why }, 429);
    const t = await read(env, img, b.what === "passage" ? "passage" : "task");
    return t ? json({ text: t }) : json({ error: "unreadable" }, 422);
  }

  if (what === "plan") {
    const subject = b.subject === "heb" ? "heb" : "math", task = clean(b.text, 600), passage = String(b.passage || "").replace(/[<>]/g, "").trim().slice(0, 3500);
    if (task.length < 2 || (subject === "heb" && passage.length < 20)) return json({ error: "input" }, 400);
    const lim = await limit(env, device, "shiur:", 30, 600); if (!lim.ok) return json({ error: lim.why }, 429);
    const j = subject === "math" ? await ask(env, mathPrompt(g), "The exercise:\n" + task, 900) : await ask(env, readingPrompt(g), "The passage:\n" + passage + "\n\nThe question:\n" + task, 900);
    if (!j) return json({ error: "ai" }, 502);
    if (j.error === "notmath") return json({ error: "notmath" }, 422);
    let steps = (Array.isArray(j.steps) ? j.steps : []).slice(0, 6).map((s) => {
      const st = { ask: clean(s && s.ask, 220), hint: clean(s && s.hint, 220), answer: clean(s && s.answer, 80) };
      if (subject === "math") { const v = calc(s && s.expr); if (v !== null) { st.answer = fmt(v); st.num = true; } else if (/^-?\d+([.,]\d+)?$/.test(st.answer.replace(/\s/g, ""))) { st.answer = st.answer.replace(/\s/g, "").replace(",", "."); st.num = true; } }
      return st;
    }).filter((s) => s.ask && s.answer);
    if (!steps.length) return json({ error: "ai" }, 502);
    return json({ restate: clean(j.restate, 200), steps, tip: clean(j.tip, 200) });
  }

  if (what === "check") {
    // A word answer (reading, or a math step that is not a number): is it right in meaning?
    const q = clean(b.ask, 220), exp = clean(b.answer, 80), got = clean(b.given, 200);
    if (!q || !got) return json({ error: "input" }, 400);
    const lim = await limit(env, device, "shiurc:", 150, 4000); if (!lim.ok) return json({ ok: false, say: "להיום נגמרו הבדיקות. אפשר לבדוק עם אבא או אמא." });
    const j = await ask(env, "You check a child's short answer (grade " + g + ", Hebrew). Be generous: spelling mistakes, other words with the same meaning, or a fuller sentence all count as right. Answer with JSON only: {\"ok\": true or false, \"say\": \"one short, kind Hebrew sentence to the child; if wrong, a nudge that does not give the answer\"}",
      "Question: " + q + "\nExpected answer: " + exp + "\nThe child's answer: " + got, 120);
    if (!j) return json({ ok: false, say: "לא הצלחנו לבדוק. נסו שוב." });
    return json({ ok: !!j.ok, say: clean(j.say, 200) });
  }
  return json({ error: "not found" }, 404);
}
