// HaniaShigra shared between parents: one Durable Object per family keeps the routine exactly as each
// phone has it (children, steps, prize, today's progress, stars, the diary, saved stories, the parents'
// recorded voice for each step), so every phone that joined shows the same thing.
// A family is reached by its id and a secret key (in the share link); nothing else identifies anyone.
// Each phone sends its whole copy; the copies are merged field by field (see merge), and the merged copy
// goes back to every phone. When a child finishes a routine, the other parents' phones get a notification
// through HaniaDat's reminder service, which already holds their push subscriptions.

const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
const token = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[x % 57]).join(""); };
const sha = async (s) => btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))))).slice(0, 43);
const isObj = (o) => o && typeof o === "object" && !Array.isArray(o);
const MAX_DOC = 900000, MAX_VOICE = 400000, DAYS = 35;

// Fields that are changed as a whole: the newer copy wins (each phone stamps _t[field] when it changes one).
const WHOLE = ["kids", "r", "goal", "opts"];
// Per-day maps, merged entry by entry.
function mergeDays(a, b, pick) {
  const out = {}, cut = new Date(Date.now() - DAYS * 864e5).toISOString().slice(0, 10);
  for (const src of [a, b]) for (const d of Object.keys(isObj(src) ? src : {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < cut) continue;
    out[d] = out[d] || {};
    for (const k of Object.keys(isObj(src[d]) ? src[d] : {})) out[d][k] = k in out[d] ? pick(out[d][k], src[d][k]) : src[d][k];
  }
  return out;
}
export function merge(srv, cli) {
  const s = isObj(srv) ? srv : {}, c = isObj(cli) ? cli : {}, st = isObj(s._t) ? s._t : {}, ct = isObj(c._t) ? c._t : {};
  const out = { _t: {} };
  for (const f of WHOLE) {
    const a = +st[f] || 0, b = +ct[f] || 0;
    if (c[f] !== undefined && (b > a || s[f] === undefined)) { out[f] = c[f]; out._t[f] = b; } else if (s[f] !== undefined) { out[f] = s[f]; out._t[f] = a; }
  }
  // a run (one child, one routine, one day): the one changed last wins
  out.runs = mergeDays(s.runs, c.runs, (x, y) => ((+(y && y.u) || 0) > (+(x && x.u) || 0) ? y : x));
  out.stars = mergeDays(s.stars, c.stars, (x, y) => Math.max(+x || 0, +y || 0));
  out.hair = mergeDays(s.hair, c.hair, (x, y) => y || x);
  out.diary = mergeDays(s.diary, c.diary, (x, y) => ((+(y && y.t) || 0) >= (+(x && x.t) || 0) ? y : x));
  // stories: everything either side has, newest first
  const seen = {}, st2 = [];
  for (const x of [].concat(Array.isArray(c.stories) ? c.stories : [], Array.isArray(s.stories) ? s.stories : [])) if (x && x.id && !seen[x.id]) { seen[x.id] = 1; st2.push(x); }
  out.stories = st2.sort((x, y) => (y.at || 0) - (x.at || 0)).slice(0, 30);
  // recorded voices: step key -> {id, t}; a removed one stays as {id: null, t}
  out.voices = {};
  for (const src of [s.voices, c.voices]) for (const [k, v] of Object.entries(isObj(src) ? src : {})) if (isObj(v) && (!out.voices[k] || (+v.t || 0) > (+out.voices[k].t || 0))) out.voices[k] = { id: v.id ? clean(v.id, 24) : null, t: +v.t || 0 };
  return out;
}

export class ShigraFamily {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async fetch(req) {
    const b = await req.json().catch(() => null);
    if (!b || typeof b.op !== "string") return json({ error: "bad" }, 400);
    const st = this.ctx.storage;
    if (b.op === "new") {
      if (await st.get("key")) return json({ error: "taken" }, 409);
      const doc = merge({}, b.doc);
      if (JSON.stringify(doc).length > MAX_DOC) return json({ error: "big" }, 413);
      await st.put({ key: await sha(String(b.key)), doc, ver: 1, subs: {} });
      return json({ ok: true, ver: 1, doc });
    }
    const key = await st.get("key");
    if (!key || key !== (await sha(String(b.key || "")))) return json({ error: "key" }, 403);
    if (b.op === "get") { const ver = (await st.get("ver")) || 1; if (+b.ver === ver) return json({ ver, same: true }); return json({ ver, doc: (await st.get("doc")) || {} }); }
    if (b.op === "put") {
      const doc = merge((await st.get("doc")) || {}, b.doc);
      if (JSON.stringify(doc).length > MAX_DOC) return json({ error: "big" }, 413);
      const ver = ((await st.get("ver")) || 1) + 1;
      await st.put({ doc, ver });
      return json({ ok: true, ver, doc });
    }
    // which phones get "a child finished the routine": the endpoint of each phone's push subscription
    if (b.op === "sub" || b.op === "unsub") {
      const subs = (await st.get("subs")) || {}, dev = clean(b.dev, 40);
      if (!dev) return json({ error: "dev" }, 400);
      if (b.op === "unsub") delete subs[dev];
      else { if (typeof b.endpoint !== "string" || b.endpoint.length > 800 || !/^https:\/\//.test(b.endpoint)) return json({ error: "endpoint" }, 400); subs[dev] = { endpoint: b.endpoint, t: Date.now() }; }
      const keep = Object.entries(subs).sort((x, y) => y[1].t - x[1].t).slice(0, 8);
      await st.put("subs", Object.fromEntries(keep));
      return json({ ok: true });
    }
    if (b.op === "note") {
      const subs = (await st.get("subs")) || {}, dev = clean(b.dev, 40), title = clean(b.title, 70), body = clean(b.body, 90);
      if (!title) return json({ error: "empty" }, 400);
      // at most one note a minute from a phone, so a mistake cannot flood the others
      const last = (await st.get("last:" + dev)) || 0; if (Date.now() - last < 60000) return json({ ok: true, skipped: true });
      await st.put("last:" + dev, Date.now());
      let n = 0;
      for (const [d, s] of Object.entries(subs)) {
        if (d === dev) continue;
        try { await this.env.SHABBAT.get(this.env.SHABBAT.idFromName("hub")).fetch("https://internal/internal/send", { method: "POST", body: JSON.stringify({ endpoint: s.endpoint, title, body }) }); n++; } catch {}
      }
      return json({ ok: true, sent: n });
    }
    if (b.op === "voice-put") {
      const id = clean(b.id, 24), data = String(b.data || ""), mime = clean(b.mime, 40);
      if (!/^[A-Za-z0-9]{6,24}$/.test(id) || !/^audio\//.test(mime) || data.length > MAX_VOICE || !/^[A-Za-z0-9+/=]+$/.test(data)) return json({ error: "bad" }, 400);
      await st.put("v:" + id, { mime, data, t: Date.now() });
      // keep the 60 newest recordings
      const all = [...(await st.list({ prefix: "v:" })).entries()].sort((x, y) => y[1].t - x[1].t);
      for (const [k] of all.slice(60)) await st.delete(k);
      return json({ ok: true });
    }
    if (b.op === "voice-get") { const v = await st.get("v:" + clean(b.id, 24)); return v ? json({ mime: v.mime, data: v.data }) : json({ error: "gone" }, 404); }
    return json({ error: "op" }, 400);
  }
}

// POST /api/shigra/fam {op, fam, key, ...}; "new" makes the family id and key here.
export async function shigraApi(request, env) {
  if (request.method !== "POST" || !env.SHIGRA) return json({ error: "not found" }, 404);
  const b = await request.json().catch(() => null);
  if (!b) return json({ error: "bad" }, 400);
  if (b.op === "new") { b.fam = token(10); b.key = token(22); }
  if (!/^[A-Za-z0-9]{10}$/.test(b.fam || "") || !/^[A-Za-z0-9]{22}$/.test(b.key || "")) return json({ error: "key" }, 403);
  const r = await env.SHIGRA.get(env.SHIGRA.idFromName("fam:" + b.fam)).fetch("https://f/", { method: "POST", body: JSON.stringify(b) });
  if (b.op !== "new" || !r.ok) return r;
  const j = await r.json();
  return json(Object.assign(j, { fam: b.fam, key: b.key }));
}
