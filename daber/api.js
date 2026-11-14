// HaniaDaber's server side: a spoken English conversation partner for Hebrew speakers.
//   POST /api/daber/hear  {device, audio(base64)}              -> {text}            English Whisper
//   POST /api/daber/talk  {device, sc, level, hist, mode}      -> the partner's next line, a gentle correction, a hint
//   POST /api/daber/say   {device, text, voice}                -> audio/mpeg         Deepgram Aura 2 (the page falls back to the phone's voice)
// Nothing is stored here: the conversation lives on the phone and comes with each request. Limits per phone and per day
// go through the SIPUR limits object, like the other AI apps.

const AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";
const AI_FALLBACK = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const WHISPER = "@cf/openai/whisper-large-v3-turbo";
const TTS = "@cf/deepgram/aura-2-en";
const VOICES = new Set(["luna", "thalia", "asteria", "apollo", "orion", "arcas"]);
const out = (o) => o && (o.response ?? (o.choices && o.choices[0] && o.choices[0].message && o.choices[0].message.content));
const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
function loose(t) { if (t && typeof t === "object") return t; const s = String(t || ""), a = s.indexOf("{"), b = s.lastIndexOf("}"); if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; } }
const en = (s, n) => String(s || "").replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

// The scenes. The page shows the Hebrew; the model gets the English brief. Same ids on both sides.
export const SCENES = {
  meet: "You are Sam, a friendly person meeting the learner at a party abroad. Small talk: names, where they are from, work, hobbies.",
  cafe: "You are a barista in a busy coffee shop in London. Take the learner's order, ask about size, milk, to stay or to go, and payment.",
  hotel: "You are the front desk clerk at a hotel in New York. Check the learner in: reservation name, passport, nights, breakfast, Wi-Fi, checkout time.",
  airport: "You are an airline check-in agent. Ask for the passport, bags, seat preference, and explain the gate and boarding time.",
  shop: "You are a sales assistant in a clothing store. Help the learner find a size and color, the fitting room, a discount, and paying.",
  doctor: "You are a doctor at a clinic abroad. Ask what is wrong, since when, symptoms, allergies, and explain simply what to do.",
  street: "You are a local on the street. The learner is lost and asks for directions to the train station or a museum. Give simple directions.",
  restaurant: "You are a waiter in a restaurant. Seat the learner, take drinks and food orders, handle an allergy or a change, and bring the bill.",
  phone: "You are a customer service agent on the phone. The learner has a problem with an order that did not arrive. Ask for details and solve it.",
  interview: "You are an HR manager interviewing the learner for a job at an international company. Ask typical interview questions one at a time.",
  work: "You are a new colleague from the US on a video call. Small talk before a meeting, then talk about the project and plans.",
  free: "You are a warm, curious conversation partner. Talk about whatever the learner likes: family, hobbies, travel, food, plans.",
};
const LEVELS = {
  1: "The learner is a BEGINNER (A1-A2). Use very short, simple sentences (max 10 words), common words, present tense. Speak slowly and clearly.",
  2: "The learner is INTERMEDIATE (B1). Use natural everyday sentences (max 18 words), common idioms only when clear.",
  3: "The learner is ADVANCED (B2-C1). Speak naturally like a native, with idioms and follow-up questions.",
};

const SYS = (sc, lv, topic) => `You are an English conversation partner inside an app for Hebrew-speaking Israelis who want to speak English with confidence.
ROLE-PLAY: ${SCENES[sc]}${topic ? " The learner chose this topic: " + topic + "." : ""}
${LEVELS[lv]}
RULES:
- Stay in the role. Keep each reply to 1-3 sentences and usually end with a question, so the learner keeps talking.
- Never lecture inside "reply". Corrections go only in "fix".
- "fix": if the learner's LAST message has a real grammar or word mistake, or sounds unnatural, give: "said" (their words, short), "better" (the natural English), "why" (ONE short sentence in simple Hebrew that explains the RULE or the reason, e.g. that adjectives come before the noun; do not just repeat the correction). If it was fine, "fix" is null. Ignore missing punctuation, capital letters and small speech-recognition glitches.
- "he": a natural Hebrew translation of your reply.
- "words": up to 2 useful English words or phrases from YOUR reply that a learner at this level may not know, each {"en":"...","he":"..."}.
- "done": true only when the scene has naturally reached its end (the order is complete, check-in is done, the interview ends...).
Answer ONLY with JSON: {"reply":"...","he":"...","fix":null|{"said":"...","better":"...","why":"..."},"words":[...],"done":false}`;

async function ask(env, messages, max) {
  for (const m of [AI_MODEL, AI_FALLBACK]) { try { const o = loose(out(await env.AI.run(m, { messages, max_tokens: max }))); if (o) return o; } catch {} }
  return null;
}
async function limit(env, device, ns, per) {
  if (!env.SIPUR) return true;
  const r = await env.SIPUR.get(env.SIPUR.idFromName("limits")).fetch("https://l/", { method: "POST", body: JSON.stringify({ device, ns, perDevice: per, perDay: 6000 }) }).then((r) => r.json()).catch(() => ({ ok: true }));
  return !!r.ok;
}
const cleanFix = (f) => f && typeof f === "object" && f.better && en(f.better, 200).toLowerCase() !== en(f.said, 200).toLowerCase()
  ? { said: en(f.said, 200), better: en(f.better, 200), why: String(f.why || "").replace(/[<>]/g, "").slice(0, 200) } : null;
const cleanWords = (w) => (Array.isArray(w) ? w : []).filter((x) => x && x.en && x.he).slice(0, 3).map((x) => ({ en: en(x.en, 40), he: String(x.he).replace(/[<>]/g, "").slice(0, 40) }));

export async function daberApi(request, env) {
  const path = new URL(request.url).pathname;
  if (request.method !== "POST") return json({ error: "method" }, 405);
  if (!env.AI) return json({ error: "unavailable" }, 503);
  const b = await request.json().catch(() => null) || {};
  const device = /^[A-Za-z0-9_-]{16,40}$/.test(b.device || "") ? b.device : "";
  if (!device) return json({ error: "input" }, 400);

  if (path === "/api/daber/hear") {
    const audio = typeof b.audio === "string" && b.audio.length <= 2800000 && /^[A-Za-z0-9+/=]+$/.test(b.audio) ? b.audio : "";
    if (!audio) return json({ error: "input" }, 400);
    if (!await limit(env, device, "daberh:", 400)) return json({ error: "limit" }, 429);
    try {
      const o = await env.AI.run(WHISPER, { audio, language: "en", vad_filter: true });
      let text = en(o && o.text, 600);
      if (/^(you|thank you\.?|thanks for watching!?|\.)$/i.test(text)) text = ""; // Whisper's usual words for silence
      return json({ text });
    } catch { return json({ error: "hear" }, 502); }
  }

  if (path === "/api/daber/say") {
    const text = en(b.text, 600);
    if (!text) return json({ error: "input" }, 400);
    if (!await limit(env, device, "daberv:", 500)) return json({ error: "limit" }, 429);
    try {
      const r = await env.AI.run(TTS, { text, speaker: VOICES.has(b.voice) ? b.voice : "luna", encoding: "mp3" }, { returnRawResponse: true });
      if (!r || !r.ok) return json({ error: "voice" }, 502);
      return new Response(r.body, { headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=86400" } });
    } catch { return json({ error: "voice" }, 502); }
  }

  if (path === "/api/daber/talk") {
    const sc = SCENES[b.sc] ? b.sc : "free", lv = [1, 2, 3].includes(+b.level) ? +b.level : 1, topic = en(b.topic, 80);
    const hist = (Array.isArray(b.hist) ? b.hist : []).slice(-16).map((m) => ({ role: m.me ? "user" : "assistant", content: en(m.t, 600) })).filter((m) => m.content);
    if (!await limit(env, device, "dabert:", 300)) return json({ error: "limit" }, 429);
    const sys = { role: "system", content: SYS(sc, lv, topic) };

    if (b.mode === "hint") { // "what can I say?": three possible answers to the partner's last line, easy to hard
      const o = await ask(env, [sys, ...hist, { role: "user", content: '[The learner is stuck. Do NOT continue the role-play. Suggest 3 different things the learner could say next, natural for their level, from simple to richer. JSON only: {"hints":[{"en":"...","he":"Hebrew translation"}]}]' }], 400);
      const hints = (o && Array.isArray(o.hints) ? o.hints : []).filter((h) => h && h.en).slice(0, 3).map((h) => ({ en: en(h.en, 200), he: String(h.he || "").replace(/[<>]/g, "").slice(0, 200) }));
      return hints.length ? json({ hints }) : json({ error: "busy" }, 503);
    }

    if (b.mode === "end") { // the summary at the end: what went well, what to work on, and the corrected sentences
      const said = hist.filter((m) => m.role === "user").map((m) => m.content);
      if (!said.length) return json({ error: "empty" }, 400);
      const o = await ask(env, [{ role: "system", content: "You are a kind, encouraging English teacher for Hebrew speakers. Write feedback in simple Hebrew (English only for example sentences)." },
        { role: "user", content: "Level: " + LEVELS[lv] + "\nScene: " + SCENES[sc] + "\nThe learner said, in order:\n" + said.map((s, i) => i + 1 + ". " + s).join("\n") +
          '\n\nJSON only: {"score":1-5 (how well they communicated for their level; be fair and encouraging),"good":"one or two sentences in Hebrew: what went well, specifically","work":"one or two sentences in Hebrew: the ONE most useful thing to improve, quoting what they said and the correct English (e.g. how much does it cost?)","phrases":[{"en":"3 natural phrases for this scene that would help next time","he":"Hebrew"}]}' }], 700);
      if (!o) return json({ error: "busy" }, 503);
      return json({ score: Math.max(1, Math.min(5, Math.round(+o.score || 3))), good: String(o.good || "").replace(/[<>]/g, "").slice(0, 400), work: String(o.work || "").replace(/[<>]/g, "").slice(0, 400), phrases: cleanWords(o.phrases) });
    }

    // the next line. With no history the partner opens the scene.
    const msgs = hist.length ? [sys, ...hist] : [sys, { role: "user", content: "[Start the scene now with your first line, in the role. The learner has not said anything yet. fix is null.]" }];
    if (hist.length && hist[hist.length - 1].role !== "user") return json({ error: "input" }, 400);
    if (hist.length) msgs[msgs.length - 1] = { role: "user", content: msgs[msgs.length - 1].content + "\n\n[Answer in JSON as instructed.]" };
    const o = await ask(env, msgs, 600);
    const reply = o && en(o.reply, 600);
    if (!reply) return json({ error: "busy" }, 503);
    return json({ reply, he: String(o.he || "").replace(/[<>]/g, "").slice(0, 600), fix: hist.length ? cleanFix(o.fix) : null, words: cleanWords(o.words), done: !!o.done && hist.length >= 4 });
  }
  return json({ error: "not found" }, 404);
}
