// HaniaQuiz: one Durable Object per game room. The host's screen (a TV or laptop) and every
// player's phone keep a WebSocket to the room; the room keeps the score and the clock, so
// nobody can see the right answer before the reveal or answer after the time is up.
// Uses the WebSocket Hibernation API: the room sleeps between messages and costs nothing idle.

const MAX_PLAYERS = 60;
const ROOM_TTL = 6 * 3600 * 1000;
const EMOJI = ["🦊", "🐼", "🐸", "🦁", "🐙", "🦄", "🐝", "🐧", "🦖", "🐢", "🦉", "🐳", "🐯", "🐨", "🦜", "🐹"];
const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);

export class QuizRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.s = null;
  }

  async load() {
    if (!this.s) this.s = (await this.ctx.storage.get("s")) || null;
    return this.s;
  }
  async save() { await this.ctx.storage.put("s", this.s); }

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/init") {
      const b = await req.json();
      await this.load();
      if (this.s && Date.now() - this.s.created < ROOM_TTL && this.s.phase !== "final") return Response.json({ ok: false, busy: true });
      this.s = { created: Date.now(), hostKey: b.hostKey, phase: "lobby", players: {}, order: [], qs: [], n: -1, endsAt: 0, answers: {} };
      await this.save();
      return Response.json({ ok: true });
    }
    if (req.headers.get("upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
    const s = await this.load();
    if (!s || Date.now() - s.created > ROOM_TTL) return new Response("no room", { status: 404 });
    const role = url.searchParams.get("role") === "host" ? "host" : "player";
    if (role === "host" && url.searchParams.get("key") !== s.hostKey) return new Response("not the host", { status: 403 });
    const pair = new WebSocketPair();
    const pid = role === "host" ? "host" : clean(url.searchParams.get("pid"), 24) || crypto.randomUUID().slice(0, 12);
    this.ctx.acceptWebSocket(pair[1], [role, pid]);
    pair[1].serializeAttachment({ role, pid });
    // The newcomer gets the current state at once.
    queueMicrotask(() => this.sendState(pair[1], role, pid));
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  sockets(tag) { return this.ctx.getWebSockets(tag); }
  send(ws, msg) { try { ws.send(JSON.stringify(Object.assign({ now: Date.now() }, msg))); } catch (e) {} }
  toHost(msg) { for (const ws of this.sockets("host")) this.send(ws, msg); }
  toPlayers(fn) { for (const ws of this.sockets("player")) { const a = ws.deserializeAttachment() || {}; const m = fn(a.pid); if (m) this.send(ws, m); } }

  lobby() {
    const s = this.s;
    return { t: "lobby", players: s.order.map((id) => ({ id, name: s.players[id].name, emoji: s.players[id].emoji, online: this.sockets(id).length > 0 })) };
  }
  board() {
    const s = this.s;
    return s.order.map((id) => ({ id, name: s.players[id].name, emoji: s.players[id].emoji, score: s.players[id].score })).sort((a, b) => b.score - a.score);
  }
  question(forHost) {
    const s = this.s, q = s.qs[s.n];
    return { t: "question", n: s.n + 1, total: s.qs.length, q: q.q, a: q.a, time: q.time, endsAt: s.endsAt, cat: q.cat || "", answered: Object.keys(s.answers).length, players: s.order.length, ...(forHost ? {} : {}) };
  }
  reveal() {
    const s = this.s, q = s.qs[s.n], counts = q.a.map(() => 0);
    for (const id in s.answers) counts[s.answers[id].i]++;
    return { t: "reveal", n: s.n + 1, total: s.qs.length, q: q.q, a: q.a, c: q.c, counts, board: this.board().slice(0, 8), last: s.n === s.qs.length - 1 };
  }
  you(pid) {
    const s = this.s, p = s.players[pid]; if (!p) return null;
    const b = this.board(), rank = b.findIndex((x) => x.id === pid) + 1, ans = s.answers[pid];
    return { score: p.score, rank, of: b.length, gain: ans ? ans.gain : 0, correct: ans ? ans.correct : false, answered: !!ans, streak: p.streak };
  }

  sendState(ws, role, pid) {
    const s = this.s; if (!s) return;
    if (role === "player" && !s.players[pid] && s.phase !== "lobby") { this.send(ws, { t: "late" }); }
    if (s.phase === "lobby") this.send(ws, Object.assign(this.lobby(), { you: role === "player" ? s.players[pid] || null : undefined }));
    else if (s.phase === "question") {
      const m = this.question(role === "host");
      if (role === "player") m.mine = s.answers[pid] ? s.answers[pid].i : null;
      this.send(ws, m);
    } else if (s.phase === "reveal") this.send(ws, Object.assign(this.reveal(), role === "player" ? { you: this.you(pid) } : {}));
    else if (s.phase === "final") this.send(ws, { t: "final", board: this.board(), you: role === "player" ? this.you(pid) : undefined });
  }

  async webSocketMessage(ws, raw) {
    const s = await this.load(); if (!s) return;
    const { role, pid } = ws.deserializeAttachment() || {};
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t === "ping") { this.send(ws, { t: "pong" }); return; }

    if (role === "player" && m.t === "join") {
      const name = clean(m.name, 16);
      if (!name) return this.send(ws, { t: "error", e: "name" });
      if (!s.players[pid]) {
        if (s.order.length >= MAX_PLAYERS) return this.send(ws, { t: "error", e: "full" });
        if (Object.values(s.players).some((p) => p.name === name)) return this.send(ws, { t: "error", e: "taken" });
        s.players[pid] = { name, emoji: EMOJI.includes(m.emoji) ? m.emoji : EMOJI[s.order.length % EMOJI.length], score: 0, streak: 0 };
        s.order.push(pid);
      } else s.players[pid].name = name;
      await this.save();
      this.send(ws, { t: "joined", you: s.players[pid] });
      this.toHost(this.lobby());
      if (s.phase !== "lobby") this.sendState(ws, role, pid);
      return;
    }

    if (role === "player" && m.t === "answer" && s.phase === "question" && s.players[pid] && !s.answers[pid]) {
      const q = s.qs[s.n], i = m.i | 0;
      if (i < 0 || i >= q.a.length || Date.now() > s.endsAt + 600 || Date.now() < s.endsAt - q.time * 1000 - 200) return;
      const left = Math.max(0, s.endsAt - Date.now()) / (q.time * 1000);
      const correct = i === q.c, p = s.players[pid];
      p.streak = correct ? p.streak + 1 : 0;
      // Right answers earn 500 to 1000 by speed, plus a small bonus for a streak.
      const gain = correct ? Math.round(500 + 500 * left) + Math.min(300, (p.streak - 1) * 100) : 0;
      p.score += gain;
      s.answers[pid] = { i, correct, gain };
      await this.save();
      this.send(ws, { t: "locked", i });
      const n = Object.keys(s.answers).length;
      this.toHost({ t: "progress", answered: n, players: s.order.length });
      if (n >= s.order.filter((id) => this.sockets(id).length).length) await this.doReveal();
      return;
    }

    if (role !== "host") return;
    if (m.t === "start" && (s.phase === "lobby" || s.phase === "final")) {
      const qs = (Array.isArray(m.questions) ? m.questions : []).slice(0, 40).map((q) => ({
        q: clean(q.q, 160), a: (Array.isArray(q.a) ? q.a : []).slice(0, 4).map((x) => clean(x, 60)), c: q.c | 0, time: Math.min(60, Math.max(8, q.time | 0 || 20)), cat: clean(q.cat, 30),
      })).filter((q) => q.q && q.a.length >= 2 && q.a.every(Boolean) && q.c >= 0 && q.c < q.a.length);
      if (!qs.length) return this.send(ws, { t: "error", e: "questions" });
      if (!s.order.length) return this.send(ws, { t: "error", e: "nobody" });
      s.qs = qs; s.n = -1;
      for (const id of s.order) { s.players[id].score = 0; s.players[id].streak = 0; }
      await this.nextQuestion();
    } else if (m.t === "next") {
      if (s.phase === "question") await this.doReveal();
      else if (s.phase === "reveal") { if (s.n >= s.qs.length - 1) await this.finish(); else await this.nextQuestion(); }
    } else if (m.t === "end") await this.finish();
    else if (m.t === "kick" && s.players[m.id]) {
      delete s.players[m.id]; s.order = s.order.filter((x) => x !== m.id); await this.save();
      for (const p of this.sockets(m.id)) { this.send(p, { t: "kicked" }); try { p.close(4000, "kicked"); } catch (e) {} }
      this.toHost(this.lobby());
    } else if (m.t === "lobby") { s.phase = "lobby"; s.n = -1; await this.save(); this.toHost(this.lobby()); this.toPlayers((id) => Object.assign(this.lobby(), { you: s.players[id] || null })); }
  }

  async nextQuestion() {
    const s = this.s;
    s.n++; s.phase = "question"; s.answers = {};
    // A 3-second "get ready" before the clock starts.
    s.endsAt = Date.now() + 3000 + s.qs[s.n].time * 1000;
    await this.save();
    await this.ctx.storage.setAlarm(s.endsAt + 300);
    const m = this.question(true);
    this.toHost(m);
    this.toPlayers(() => this.question(false));
  }
  async doReveal() {
    const s = this.s; if (s.phase !== "question") return;
    s.phase = "reveal";
    await this.save();
    await this.ctx.storage.deleteAlarm();
    const r = this.reveal();
    this.toHost(r);
    this.toPlayers((id) => Object.assign({}, r, { you: this.you(id) }));
  }
  async finish() {
    const s = this.s;
    s.phase = "final"; await this.save(); await this.ctx.storage.deleteAlarm();
    const board = this.board();
    this.toHost({ t: "final", board });
    this.toPlayers((id) => ({ t: "final", board: board.slice(0, 5), you: this.you(id) }));
  }
  async alarm() {
    const s = await this.load(); if (!s) return;
    if (s.phase === "question" && Date.now() >= s.endsAt) await this.doReveal();
  }
  async webSocketClose(ws) {
    const s = await this.load(); if (!s) return;
    const { role } = ws.deserializeAttachment() || {};
    if (role === "player" && s.phase === "lobby") this.toHost(this.lobby());
  }
  async webSocketError(ws) { return this.webSocketClose(ws); }
}

/** quiz.hania360.com/api/new and /api/ws: create a room, connect to one. */
export async function quizApi(req, env, url) {
  if (!env.QUIZ) return Response.json({ error: "not configured" }, { status: 503 });
  if (url.pathname === "/api/new" && req.method === "POST") {
    for (let i = 0; i < 6; i++) {
      const code = String(10000 + Math.floor(Math.random() * 90000)), hostKey = crypto.randomUUID();
      const stub = env.QUIZ.get(env.QUIZ.idFromName(code));
      const r = await (await stub.fetch("https://room/init", { method: "POST", body: JSON.stringify({ hostKey }) })).json();
      if (r.ok) return Response.json({ code, hostKey }, { headers: { "cache-control": "no-store" } });
    }
    return Response.json({ error: "busy" }, { status: 503 });
  }
  if (url.pathname === "/api/ws") {
    const code = url.searchParams.get("code") || "";
    if (!/^\d{5}$/.test(code)) return new Response("bad code", { status: 400 });
    return env.QUIZ.get(env.QUIZ.idFromName(code)).fetch(req);
  }
  return new Response("not found", { status: 404 });
}
