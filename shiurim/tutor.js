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

// A bare exercise (like "456 + 278 =" or "3/4 + 1/2") gets its steps here, the way it is taught in school:
// exact, instant, and without the model. Word problems go to the model.
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const digits = (n) => String(n).split("").reverse().map(Number);
const PLACE = ["היחידות", "העשרות", "המאות", "האלפים", "רבבות"];
export function localPlan(raw, g) {
  const t = String(raw || "").replace(/[×xX]/g, "*").replace(/[÷:]/g, "/").replace(/−|–/g, "-").replace(/=\s*\?*\s*$/, "").replace(/\?/g, "").replace(/\s+/g, " ").trim();
  const N = (n, a) => ({ ask: a, answer: fmt(n), num: true, hint: "" });
  let m = t.match(/^(\d+)\s*\/\s*(\d+)\s*([+-])\s*(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const [n1, d1, op, n2, d2] = [+m[1], +m[2], m[3], +m[4], +m[5]]; if (!d1 || !d2) return null;
    const L = d1 * d2 / gcd(d1, d2), a = n1 * L / d1, b = n2 * L / d2, n = op === "+" ? a + b : a - b, steps = [];
    if (d1 !== d2) {
      steps.push(Object.assign(N(L, "מה המכנה המשותף הקטן ביותר של " + d1 + " ושל " + d2 + "?"), { hint: "מחפשים את המספר הקטן ביותר שגם " + d1 + " וגם " + d2 + " נכנסים בו בלי שארית." }));
      if (L !== d1) steps.push(Object.assign(N(a, n1 + "/" + d1 + " = ?/" + L + " . מה המונה החדש?"), { hint: "בכמה כפלנו את " + d1 + " כדי להגיע ל־" + L + "? כופלים גם את המונה באותו מספר." }));
      if (L !== d2) steps.push(Object.assign(N(b, n2 + "/" + d2 + " = ?/" + L + " . מה המונה החדש?"), { hint: "בכמה כפלנו את " + d2 + " כדי להגיע ל־" + L + "? כופלים גם את המונה באותו מספר." }));
    }
    steps.push(Object.assign(N(n, a + "/" + L + " " + op + " " + b + "/" + L + " = ?/" + L + " . מה המונה?"), { hint: "כשהמכנה שווה, " + (op === "+" ? "מחברים" : "מחסרים") + " רק את המונים, והמכנה נשאר " + L + "." }));
    const k = gcd(Math.abs(n), L);
    const whole = Math.trunc(n / L), rest = Math.abs(n) % L, sh = (whole ? whole + (rest ? " " : "") : "") + (rest ? rest / k + "/" + L / k : "") || "0";
    if (k > 1 || Math.abs(n) >= L) steps.push(Object.assign(N(n / L, "ומה התוצאה הסופית" + (k > 1 ? " אחרי צמצום" : "") + (Math.abs(n) >= L ? " (אפשר כמספר מעורב)" : "") + "?"), { hint: (k > 1 ? "מחלקים את " + n + " ואת " + L + " ב־" + k + ". " : "") + (Math.abs(n) >= L ? "כמה שלמים יש ב־" + n + "/" + L + "? כותבים מספר שלם, רווח ושבר." : ""), show: n + "/" + L + " = " + sh }));
    return { restate: t, steps, tip: "בודקים: האם התוצאה הגיונית? " + n1 + "/" + d1 + " " + (op === "+" ? "ועוד" : "פחות") + " " + n2 + "/" + d2 + (op === "+" ? " גדול מכל אחד מהם." : " קטן מ־" + n1 + "/" + d1 + ".") };
  }
  m = t.match(/^(\d{1,6})\s*([+\-*/])\s*(\d{1,6})$/);
  if (!m) return null;
  const x = +m[1], op = m[2], y = +m[3], steps = [], sign = { "+": "+", "-": "−", "*": "×", "/": ":" }[op], restate = x + " " + sign + " " + y;
  if (op === "+") {
    if (x < 10 && y < 10 || x + y <= 20) return { restate, steps: [Object.assign(N(x + y, "כמה זה " + restate + "?"), { hint: y <= x ? "מתחילים מ־" + x + " וסופרים עוד " + y + " על האצבעות." : "מתחילים מהמספר הגדול, " + y + ", וסופרים עוד " + x + "." })], tip: "בודקים בחיסור: התוצאה פחות " + y + " צריכה לצאת " + x + "." };
    const A = digits(x), B = digits(y), n = Math.max(A.length, B.length); let c = 0;
    for (let i = 0; i < n; i++) {
      const a = A[i] || 0, b = B[i] || 0, s = a + b + c;
      steps.push(Object.assign(N(s, "מחברים את " + PLACE[i] + ": " + a + " + " + b + (c ? " ועוד 1 שעבר" : "") + " = ?"), { hint: s >= 10 ? "אם יוצא 10 או יותר, כותבים את " + (s % 10) + " ומעבירים 1 לטור הבא." : "מחברים רק את הספרות בטור של " + PLACE[i] + "." }));
      c = s >= 10 ? 1 : 0;
    }
    steps.push(Object.assign(N(x + y, "אז כמה זה " + restate + "?"), { hint: "קוראים את הספרות שכתבנו בכל טור, מהשמאלי לימני." }));
    return { restate, steps: steps.slice(-5), tip: "בודקים בחיסור: התוצאה פחות " + y + " צריכה לצאת " + x + "." };
  }
  if (op === "-") {
    if (y > x) return null;
    if (x <= 20) return { restate, steps: [Object.assign(N(x - y, "כמה זה " + restate + "?"), { hint: "מתחילים מ־" + y + " וסופרים קדימה עד " + x + ". כמה צעדים?" })], tip: "בודקים בחיבור: התוצאה ועוד " + y + " צריכה לצאת " + x + "." };
    const A = digits(x), B = digits(y); let br = 0;
    for (let i = 0; i < A.length; i++) {
      let a = A[i] - br; const b = B[i] || 0, was = a;
      if (i >= B.length && !br) continue;
      const borrow = a < b; if (borrow) a += 10;
      const why = was < 0 ? "ב" + PLACE[i].slice(1) + " היה 0 ונתנו 1 לטור הקודם, אז לוקחים גם כאן 1 מהטור הבא, ונשארים עם " + a + ". " : borrow ? "ב" + PLACE[i].slice(1) + ": " + was + " קטן מ־" + b + ", אז לוקחים 1 מהטור הבא. " : "מחסרים את " + PLACE[i] + ": ";
      steps.push(Object.assign(N(a - b, why + a + " − " + b + " = ?"), { hint: borrow ? "אחרי שלקחנו, יש לנו " + a + ". מורידים " + b + "." : "מחסרים רק את הספרות בטור של " + PLACE[i] + (br ? ", ולא שוכחים שלקחנו 1 מהטור הזה." : ".") }));
      br = borrow ? 1 : 0;
    }
    steps.push(Object.assign(N(x - y, "אז כמה זה " + restate + "?"), { hint: "קוראים את הספרות שכתבנו בכל טור." }));
    return { restate, steps: steps.slice(-5), tip: "בודקים בחיבור: התוצאה ועוד " + y + " צריכה לצאת " + x + "." };
  }
  if (op === "*") {
    if (x <= 10 && y <= 10) return { restate, steps: [Object.assign(N(x * y, "כמה זה " + restate + "?"), { hint: x + " פעמים " + y + ": אפשר לחבר " + y + " שוב ושוב, " + x + " פעמים, או להיזכר בלוח הכפל." })], tip: "בודקים בחילוק: התוצאה לחלק ל־" + y + " צריכה לצאת " + x + "." };
    const [big, small] = x >= y ? [x, y] : [y, x], tens = big - big % 10, ones = big % 10;
    if (small < 10 && big < 1000) {
      steps.push(Object.assign(N(tens * small, "מפרקים: " + big + " = " + tens + " + " + ones + ". כמה זה " + tens + " × " + small + "?"), { hint: "כמה זה " + tens / 10 + " × " + small + "? ומוסיפים אפס." }));
      if (ones) steps.push(Object.assign(N(ones * small, "כמה זה " + ones + " × " + small + "?"), { hint: "מלוח הכפל." }));
      steps.push(Object.assign(N(x * y, "מחברים: " + tens * small + (ones ? " + " + ones * small : "") + " = ?"), { hint: "מחברים את שתי התוצאות." }));
      return { restate, steps, tip: "בודקים: " + big + " קרוב ל־" + Math.round(big / 10) * 10 + ", אז התוצאה קרובה ל־" + Math.round(big / 10) * 10 * small + "." };
    }
    return null;
  }
  if (op === "/") {
    if (!y) return null;
    const q = Math.floor(x / y), r = x % y;
    if (!r && q <= 10 && y <= 10) return { restate, steps: [Object.assign(N(q, "כמה זה " + restate + "?"), { hint: "איזה מספר כפול " + y + " נותן " + x + "? חושבים על לוח הכפל של " + y + "." })], tip: "בודקים בכפל: התוצאה כפול " + y + " צריכה לצאת " + x + "." };
    if (y >= 10) return null;
    const tens = Math.floor(x / 10) * 10;
    if (x >= 20 && Math.floor(tens / y) * y > 0) {
      const part = Math.floor(x / y / 10) * 10 * y;
      if (part > 0) {
        steps.push(Object.assign(N(part / y, "מתחילים מחלק נוח: כמה זה " + part + " : " + y + "?"), { hint: "כמה זה " + part / 10 + " : " + y + "? ומוסיפים אפס." }));
        steps.push(Object.assign(N(x - part, "כמה נשאר לחלק? " + x + " − " + part + " = ?"), { hint: "מחסרים את החלק שכבר חילקנו." }));
        steps.push(Object.assign(N(Math.floor((x - part) / y), "כמה פעמים " + y + " נכנס ב־" + (x - part) + "?"), { hint: "חושבים על לוח הכפל של " + y + "." }));
      }
    }
    steps.push(Object.assign(N(q, "אז כמה זה " + restate + (r ? " (בלי השארית)" : "") + "?"), { hint: "מחברים את התוצאות של החלקים." }));
    if (r) steps.push(Object.assign(N(r, "וכמה נשאר בסוף (השארית)?"), { hint: "מחשבים " + q + " × " + y + " ובודקים כמה חסר עד " + x + "." }));
    return { restate, steps, tip: "בודקים בכפל: " + q + " × " + y + (r ? " + " + r : "") + " צריך לצאת " + x + "." };
  }
  return null;
}

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
    : "This is a photo of a homework exercise from an Israeli elementary-school workbook (in Hebrew, or in English for an English lesson). Copy the exercise exactly as written: the words in their own language, the numbers and the math signs. If there are several exercises, copy them all, one per line. Output only the exercise text, nothing else.";
  const url = "data:image/jpeg;base64," + b64, why = [];
  const tries = [
    [VISION_MODELS[0], () => ({ messages: [{ role: "user", content: [{ type: "text", text: q }, { type: "image_url", image_url: { url } }] }], max_tokens: 700 })],
    ["@cf/mistralai/mistral-small-3.1-24b-instruct", () => ({ messages: [{ role: "user", content: [{ type: "text", text: q }, { type: "image_url", image_url: { url } }] }], max_tokens: 700 })],
    ["@cf/meta/llama-4-scout-17b-16e-instruct", () => ({ messages: [{ role: "user", content: [{ type: "text", text: q }, { type: "image_url", image_url: { url } }] }], max_tokens: 700 })],
    [VISION_MODELS[1], () => ({ messages: [{ role: "user", content: q }], image: [...Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], max_tokens: 700 })]
  ];
  for (const [m, body] of tries) {
    try {
      const out = await env.AI.run(m, body());
      const t = asText(text(out)).replace(/^```[a-z]*\n?|```$/g, "").trim();
      if (t && t.length > 1) return { text: t.slice(0, 3000) };
      why.push(m.split("/").pop() + ": empty");
    } catch (e) {
      const msg = String((e && e.message) || e).slice(0, 120); why.push(m.split("/").pop() + ": " + msg);
      if (m.includes("llama-3.2") && /agree|license|5016/i.test(msg)) { try { await env.AI.run(m, { prompt: "agree" }); const out = await env.AI.run(m, body()); const t = asText(text(out)).trim(); if (t) return { text: t.slice(0, 3000) }; } catch {} }
    }
  }
  return { why: why.join(" | ") };
}

function mathPrompt(g) {
  return "You are a warm, patient math tutor for an Israeli child in grade " + g + " (כיתה " + g + "'). The child sends a homework exercise in Hebrew. " +
    "Never give the final answer. Break the exercise into 2 to 5 small steps that the child solves, each one a short question in simple Hebrew suited to grade " + g + " (short sentences, everyday words, like a kind teacher). " +
    "Follow the way Israeli schools teach: for column addition or subtraction go units, then tens, then hundreds (with carrying or borrowing); for word problems first find what is given, then which operation, then compute; for fractions find a common denominator and ask for the new numerators. " +
    "Write to the child in a gender-neutral way, in the plural present (\"קוראים\", \"מחשבים\", \"חושבים\"), never \"תחשוב\" or \"קרא\". " +
    "For every step whose answer is a number, give \"expr\": an arithmetic expression with only numbers, + - * / and parentheses that computes exactly the number the step asks for (for example \"(12+8)*3\"; for \"3/4 = ?/4\" the expr is \"3\", the missing numerator, not 3/4). " +
    "For a step whose answer is not a number (such as a word, \">\" or a choice), give \"answer\" as a short text and no expr. " +
    "\"hint\" helps without revealing the answer (for example: which operation, a picture to imagine, an easier example). " +
    "The last step's answer is the answer to the whole exercise. If there are several exercises, take only the first one. If the text is not a math exercise, return {\"error\":\"notmath\"}. " +
    "Answer with JSON only: {\"restate\":\"the exercise in one short Hebrew line\",\"steps\":[{\"ask\":\"...\",\"expr\":\"...\",\"answer\":\"...\",\"hint\":\"...\"}],\"tip\":\"one short Hebrew sentence on how to check the answer by thinking (never a calculator)\"}";
}
function englishPrompt(g) {
  return "You are a warm, patient English teacher for an Israeli child in grade " + g + " (כיתה " + g + "'), who learns English as a foreign language and reads Hebrew. The child sends an exercise from an English workbook (it may be a word to translate, a sentence to complete, a question about a short text, or spelling). " +
    "Never give the final answer. Lead the child in 2 to 4 short steps: explain in simple Hebrew, gender-neutral, in the plural present (\"קוראים\", \"חושבים\"), and ask the child to answer in English (one word or a short phrase) whenever the answer is English. Every \"ask\" and every \"hint\" is written in Hebrew (English words may appear inside them in quotes); the child is young, so keep grammar words out (no \"subject\" or \"singular\"): ask about meaning, sounds and who is doing the action. " +
    "For each step give \"answer\": the expected answer (English, exactly as it should be written, or Hebrew when the step asks for a meaning), and \"hint\" in Hebrew that helps without giving the answer (the first letter, a sound, a similar word, the meaning). " +
    "Answer with JSON only: {\"restate\":\"the exercise in one short Hebrew line\",\"steps\":[{\"ask\":\"...\",\"answer\":\"...\",\"hint\":\"...\"}],\"tip\":\"one short Hebrew sentence on how to check the answer\"}";
}
function readingPrompt(g) {
  return "You are a warm, patient Hebrew reading-comprehension tutor for an Israeli child in grade " + g + " (כיתה " + g + "'). The child sends a reading passage and a question about it. " +
    "Never write the answer for the child. Lead them to find it in the passage in 2 to 4 short steps, in simple Hebrew for grade " + g + ": " +
    "first where to look (which paragraph or sentence, or which key word to search for), then small questions about what is written there, and the last step asks the original question in the child's own words. " +
    "For each step give \"answer\": the expected answer in a few Hebrew words (taken from the passage when possible), and \"hint\" that points to the place in the text (which paragraph, which word to look for) and never quotes the answer. " +
    "Write to the child in a gender-neutral way, in the plural present (\"מחפשים\", \"קוראים\"). " +
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
    const r = await read(env, img, b.what === "passage" ? "passage" : "task");
    return r.text ? json({ text: r.text }) : json({ error: "unreadable", why: r.why }, 422);
  }

  if (what === "plan") {
    const subject = b.subject === "heb" ? "heb" : b.subject === "eng" ? "eng" : "math", task = clean(b.text, 600), passage = String(b.passage || "").replace(/[<>]/g, "").trim().slice(0, 3500);
    if (task.length < 2 || (subject === "heb" && passage.length < 20)) return json({ error: "input" }, 400);
    if (subject === "math") { const lp = localPlan(task, g); if (lp && lp.steps.length) return json(lp); }
    const lim = await limit(env, device, "shiur:", 30, 600); if (!lim.ok) return json({ error: lim.why }, 429);
    const j = subject === "math" ? await ask(env, mathPrompt(g), "The exercise:\n" + task, 900) : subject === "eng" ? await ask(env, englishPrompt(g), "The exercise:\n" + task, 900) : await ask(env, readingPrompt(g), "The passage:\n" + passage + "\n\nThe question:\n" + task, 900);
    if (!j) return json({ error: "ai" }, 502);
    if (j.error === "notmath") return json({ error: "notmath" }, 422);
    let steps = (Array.isArray(j.steps) ? j.steps : []).slice(0, 6).map((s) => {
      const st = { ask: clean(s && s.ask, 220), hint: clean(s && s.hint, 220), answer: clean(s && s.answer, 80) };
      if (subject === "math" && s && /^\s*\d+\s*\/\s*\d+\s*$/.test(String(s.answer || ""))) st.show = clean(s.answer, 20);
      if (subject === "math") { const v = calc(s && s.expr); if (v !== null) { st.answer = fmt(v); st.num = true; } else if (/^-?\d+([.,]\d+)?$/.test(st.answer.replace(/\s/g, ""))) { st.answer = st.answer.replace(/\s/g, "").replace(",", "."); st.num = true; } }
      return st;
    }).filter((s) => s.ask && s.answer);
    // A hint that gives away the answer is replaced by a gentler one.
    const bare = (x) => String(x).replace(/[\u0591-\u05C7"'.,!?״׳]/g, "").replace(/\s+/g, " ").trim();
    steps.forEach((st) => { const a = bare(st.answer); if (a.length >= 3 && bare(st.hint).includes(a)) st.hint = subject === "heb" ? "קוראים שוב לאט את המשפטים ליד המילה מהשאלה." : "קוראים שוב את השאלה ומסמנים את המספרים."; });
    if (!steps.length) return json({ error: "ai" }, 502);
    return json({ restate: clean(j.restate, 200), steps, tip: clean(j.tip, 200) });
  }

  if (what === "check") {
    // A word answer (reading, or a math step that is not a number): is it right in meaning?
    const q = clean(b.ask, 220), exp = clean(b.answer, 80), got = clean(b.given, 200);
    if (!q || !got) return json({ error: "input" }, 400);
    const lim = await limit(env, device, "shiurc:", 150, 4000); if (!lim.ok) return json({ ok: false, say: "להיום נגמרו הבדיקות. אפשר לבדוק עם אבא או אמא." });
    const j = await ask(env, "You check a child's short answer (grade " + g + (b.subject === "eng" ? ", an English lesson: the answer should be the right English word or phrase; ignore capital letters and a missing period, but a misspelled English word is wrong unless only one letter is off" : ", Hebrew. Be generous: spelling mistakes, other words with the same meaning, or a fuller sentence all count as right") + ". Answer with JSON only: {\"ok\": true or false, \"say\": \"one short, kind Hebrew sentence to the child; if wrong, a nudge that does not give the answer\"}",
      "Question: " + q + "\nExpected answer: " + exp + "\nThe child's answer: " + got, 120);
    if (!j) return json({ ok: false, say: "לא הצלחנו לבדוק. נסו שוב." });
    return json({ ok: !!j.ok, say: clean(j.say, 200) });
  }
  return json({ error: "not found" }, 404);
}
