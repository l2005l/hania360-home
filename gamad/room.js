// HaniaGamad (גמד וענק): one Durable Object per group. The organizer types the names, the draw
// happens on the server, and every participant gets a private link that shows only whose gamad
// they are. Nobody, the organizer included, can see the whole draw before the reveal date.
// Participants can keep a wish list for their gamad and send anonymous questions to their ענק.

const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const token = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[x % 57]).join(""); };
const okId = (s) => typeof s === "string" && /^[A-Za-z0-9]{6,24}$/.test(s);

// A random draw where nobody gets themselves or someone they must not get.
export function draw(ids, banned) {
  for (let tries = 0; tries < 2000; tries++) {
    const to = ids.slice();
    for (let i = to.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [to[i], to[j]] = [to[j], to[i]]; }
    if (ids.every((id, i) => to[i] !== id && !banned.has(id + ">" + to[i]))) return Object.fromEntries(ids.map((id, i) => [id, to[i]]));
  }
  return null;
}

export class GiftGroup {
  constructor(ctx) { this.ctx = ctx; }
  async load() { return (this.g = this.g || (await this.ctx.storage.get("g")) || null); }
  async save() { await this.ctx.storage.put("g", this.g); }

  revealed() { return this.g.reveal && Date.now() >= Date.parse(this.g.reveal + "T20:00:00+02:00"); }
  byToken(t) { return Object.values(this.g.people).find((p) => p.t === t) || null; }

  async fetch(req) {
    const url = new URL(req.url), p = url.pathname;
    const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
    const b = req.method === "POST" ? await req.json().catch(() => ({})) : Object.fromEntries(url.searchParams);
    if (p === "/init") {
      if (await this.load()) return json({ error: "exists" }, 409);
      const names = [...new Set((b.people || []).map((x) => clean(x, 24)).filter(Boolean))].slice(0, 60);
      if (names.length < 3) return json({ error: "few" }, 400);
      const people = {};
      names.forEach((n, i) => { const id = "p" + i; people[id] = { id, name: n, t: token(10), wish: "", seen: 0 }; });
      const byName = Object.fromEntries(names.map((n, i) => ["" + n, "p" + i]));
      const banned = new Set();
      for (const pair of (b.pairs || []).slice(0, 30)) { const a = byName[clean(pair[0], 24)], c = byName[clean(pair[1], 24)]; if (a && c) { banned.add(a + ">" + c); banned.add(c + ">" + a); } }
      const to = draw(Object.keys(people), banned);
      if (!to) return json({ error: "impossible" }, 400);
      this.g = { id: b.id, admin: b.admin, name: clean(b.name, 40) || "גמד וענק", budget: Math.max(0, Math.min(5000, Math.round(+b.budget || 0))), reveal: /^\d{4}-\d{2}-\d{2}$/.test(b.reveal || "") ? b.reveal : "", created: Date.now(), people, to, notes: [], banned: [...banned] };
      await this.save();
      return json({ ok: true });
    }
    if (!(await this.load())) return json({ error: "no group" }, 404);
    const g = this.g;

    if (p === "/admin") {
      if (b.k !== g.admin) return json({ error: "key" }, 403);
      if (b.op === "redraw") {
        const to = draw(Object.keys(g.people), new Set(g.banned || []));
        if (!to) return json({ error: "impossible" }, 400);
        g.to = to; g.notes = []; for (const x of Object.values(g.people)) { x.t = token(10); x.seen = 0; }
        await this.save();
      }
      return json({ name: g.name, budget: g.budget, reveal: g.reveal, revealed: this.revealed(), people: Object.values(g.people).map((x) => ({ name: x.name, t: x.t, seen: x.seen, wish: !!x.wish })), draw: this.revealed() ? Object.entries(g.to).map(([a, c]) => [g.people[a].name, g.people[c].name]) : null });
    }

    const me = this.byToken(b.t);
    if (!me) return json({ error: "token" }, 403);
    const target = g.people[g.to[me.id]];
    const giverId = Object.keys(g.to).find((a) => g.to[a] === me.id);
    if (p === "/me") {
      if (!me.seen) { me.seen = Date.now(); await this.save(); }
      return json({
        name: g.name, budget: g.budget, reveal: g.reveal, revealed: this.revealed(), count: Object.keys(g.people).length,
        you: { name: me.name, wish: me.wish }, target: { name: target.name, wish: target.wish },
        // Questions I sent to my ענק, and questions my gamad sent me, without saying who.
        asked: g.notes.filter((n) => n.from === me.id).map((n) => ({ id: n.id, q: n.q, a: n.a, at: n.at })),
        inbox: g.notes.filter((n) => n.to === me.id).map((n) => ({ id: n.id, q: n.q, a: n.a, at: n.at })),
        myGamad: this.revealed() && giverId ? g.people[giverId].name : null,
        all: this.revealed() ? Object.entries(g.to).map(([a, c]) => [g.people[a].name, g.people[c].name]) : null,
      });
    }
    if (p === "/wish") { me.wish = clean(b.wish, 400); await this.save(); return json({ ok: true }); }
    if (p === "/ask") {
      const q = clean(b.q, 200); if (!q) return json({ error: "empty" }, 400);
      if (g.notes.filter((n) => n.from === me.id).length >= 20) return json({ error: "limit" }, 429);
      g.notes.push({ id: token(6), from: me.id, to: target.id, q, a: "", at: Date.now() }); await this.save();
      return json({ ok: true });
    }
    if (p === "/answer") {
      const n = g.notes.find((x) => x.id === b.id && x.to === me.id); if (!n) return json({ error: "note" }, 404);
      n.a = clean(b.a, 200); await this.save(); return json({ ok: true });
    }
    return json({ error: "not found" }, 404);
  }
}

/** gamad.hania360.com/api/*: create a group, or talk to one. */
export async function gamadApi(req, env, url) {
  if (!env.GAMAD) return Response.json({ error: "not configured" }, { status: 503 });
  const stub = (id) => env.GAMAD.get(env.GAMAD.idFromName("g:" + id));
  if (url.pathname === "/api/gamad/new" && req.method === "POST") {
    const b = await req.json().catch(() => null); if (!b) return Response.json({ error: "json" }, { status: 400 });
    const id = token(8), admin = token(14);
    const r = await stub(id).fetch("https://g/init", { method: "POST", body: JSON.stringify(Object.assign({}, b, { id, admin })) });
    const j = await r.json();
    return Response.json(j.ok ? { id, admin } : j, { status: r.status, headers: { "cache-control": "no-store" } });
  }
  const m = url.pathname.match(/^\/api\/gamad\/(admin|me|wish|ask|answer)$/);
  const g = req.method === "GET" ? url.searchParams.get("g") : null;
  let body = null, gid = g;
  if (req.method === "POST") { body = await req.text(); try { gid = JSON.parse(body).g; } catch (e) { gid = null; } }
  if (!m || !okId(gid)) return Response.json({ error: "group" }, { status: 400 });
  return stub(gid).fetch("https://g/" + m[1] + url.search, { method: req.method, body });
}
