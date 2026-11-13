// Learning together in HaniaLimud: a small group (friends, a father and son, a shiur) on the same daf and halacha.
// One Durable Object per group keeps who is in it (a name each, by phone), which days each one learned,
// and where to send "X learned today's daf" (each phone's push address, sent through HaniaDat's reminder service).
// A group is reached by its id and a secret key (in the invite link); nothing else identifies anyone.
// POST /api/limud/group {op, g, key, dev, ...}

const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
const token = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[x % 57]).join(""); };
const sha = async (s) => btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))))).slice(0, 43);
const DAY = /^\d{4}-\d{2}-\d{2}$/, KEEP_DAYS = 70, MAX = 25;

export class LimudGroup {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async view() {
    const st = this.ctx.storage, cut = new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10), days = (await st.get("days")) || {};
    return { name: (await st.get("name")) || "", members: (await st.get("members")) || {}, days: Object.fromEntries(Object.entries(days).filter(([d]) => d >= cut)) };
  }
  async fetch(req) {
    const b = await req.json().catch(() => null);
    if (!b || typeof b.op !== "string") return json({ error: "bad" }, 400);
    const st = this.ctx.storage, dev = clean(b.dev, 40);
    if (!/^[A-Za-z0-9_-]{8,40}$/.test(dev)) return json({ error: "dev" }, 400);
    if (b.op === "new") {
      if (await st.get("key")) return json({ error: "taken" }, 409);
      const who = clean(b.who, 20); if (!who) return json({ error: "name" }, 400);
      await st.put({ key: await sha(String(b.key)), name: clean(b.name, 40) || "לומדים ביחד", members: { [dev]: { name: who, t: Date.now() } }, days: {}, subs: {} });
      return json(Object.assign({ ok: true }, await this.view()));
    }
    const key = await st.get("key");
    if (!key || key !== (await sha(String(b.key || "")))) return json({ error: "key" }, 403);
    const members = (await st.get("members")) || {};
    if (b.op === "join") {
      const who = clean(b.who, 20); if (!who) return json({ error: "name" }, 400);
      if (!members[dev] && Object.keys(members).length >= MAX) return json({ error: "full" }, 409);
      members[dev] = { name: who, t: (members[dev] && members[dev].t) || Date.now() }; await st.put("members", members);
      return json(Object.assign({ ok: true }, await this.view()));
    }
    if (!members[dev]) return json({ error: "member" }, 403);
    if (b.op === "state") return json(await this.view());
    if (b.op === "mark") {
      const d = String(b.date || ""), kind = b.kind === "hal" ? "hal" : "daf";
      if (!DAY.test(d)) return json({ error: "date" }, 400);
      const days = (await st.get("days")) || {}; days[d] = days[d] || {}; const mine = days[d][dev] || {}, was = !!mine[kind];
      if (b.on) mine[kind] = 1; else delete mine[kind];
      if (Object.keys(mine).length) days[d][dev] = mine; else delete days[d][dev];
      if (!Object.keys(days[d]).length) delete days[d];
      const cut = new Date(Date.now() - KEEP_DAYS * 864e5).toISOString().slice(0, 10);
      for (const k of Object.keys(days)) if (k < cut) delete days[k];
      await st.put("days", days);
      // tell the others, once per person, kind and day
      if (b.on && !was && d === new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date())) {
        const subs = (await st.get("subs")) || {}, what = clean(b.what, 40);
        const title = "📚 " + members[dev].name + (kind === "daf" ? " למד/ה את הדף היומי" : " למד/ה את ההלכה היומית"), body = (what ? what + " · " : "") + "ומה איתך? 😊";
        for (const [d2, s] of Object.entries(subs)) {
          if (d2 === dev || !members[d2]) continue;
          try { await this.env.SHABBAT.get(this.env.SHABBAT.idFromName("hub")).fetch("https://internal/internal/send", { method: "POST", body: JSON.stringify({ endpoint: s.endpoint, title, body }) }); } catch {}
        }
      }
      return json(await this.view());
    }
    if (b.op === "sub" || b.op === "unsub") {
      const subs = (await st.get("subs")) || {};
      if (b.op === "unsub") delete subs[dev];
      else { if (typeof b.endpoint !== "string" || b.endpoint.length > 800 || !/^https:\/\//.test(b.endpoint)) return json({ error: "endpoint" }, 400); subs[dev] = { endpoint: b.endpoint }; }
      await st.put("subs", subs); return json({ ok: true });
    }
    if (b.op === "leave") {
      delete members[dev]; await st.put("members", members);
      const subs = (await st.get("subs")) || {}; delete subs[dev]; await st.put("subs", subs);
      return json({ ok: true });
    }
    return json({ error: "op" }, 400);
  }
}

export async function groupApi(request, env) {
  if (!env.LIMUD) return json({ error: "not configured" }, 503);
  const b = await request.json().catch(() => null);
  if (!b) return json({ error: "bad" }, 400);
  if (b.op === "new") { b.g = token(10); b.key = token(22); }
  if (!/^[A-Za-z0-9]{10}$/.test(b.g || "") || !/^[A-Za-z0-9]{22}$/.test(b.key || "")) return json({ error: "key" }, 403);
  const r = await env.LIMUD.get(env.LIMUD.idFromName("g:" + b.g)).fetch("https://g/", { method: "POST", body: JSON.stringify(b) });
  if (b.op !== "new" || !r.ok) return r;
  return json(Object.assign(await r.json(), { g: b.g, key: b.key }));
}
