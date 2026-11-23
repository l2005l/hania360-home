// HaniaParty (party.hania360.com): party games for the whole family. The big screen (a TV or laptop) is the board,
// every phone is a controller. One Durable Object per room, with WebSockets (Hibernation API: a quiet room costs
// nothing). The room keeps the words, the true answers, the clock and the score, so no phone can peek.
// Games: "מציירים ומנחשים" (one draws on the phone, the drawing appears live on the screen, the others guess),
// "בלוף" (everyone invents a fake ending to a true fact, then looks for the real one) and "מי במשפחה הכי..." (a vote).
import { WORDS, BLUFF, VOTE } from "./bank.js";

const MAX_PLAYERS = 16, TTL = 8 * 3600e3, MAX_INK = 24000;
const EMOJI = ["🦊", "🐼", "🐸", "🦁", "🐙", "🦄", "🐝", "🐧", "🦖", "🐢", "🦉", "🐳", "🐯", "🐨", "🦜", "🐹"];
const COLORS = ["#FF5E7E", "#FFB13D", "#3DD68C", "#4DA3FF", "#A66BFF", "#FF7AD9", "#22D3EE", "#F97316", "#84CC16", "#E879F9", "#14B8A6", "#FACC15", "#60A5FA", "#F472B6", "#34D399", "#C084FC"];
const T = { choose: 15e3, draw: 80e3, drawEnd: 7e3, write: 50e3, pick: 30e3, bluffShow: 11e3, vote: 25e3, voteShow: 8e3 };
const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Hebrew answers compare without niqqud, spaces, punctuation, final-letter forms or a leading "ה"
export function norm(s) {
  let t = String(s || "").replace(/[֑-ׇ]/g, "").replace(/[^א-תa-zA-Z0-9]/g, "").toLowerCase()
    .replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ף/g, "פ").replace(/ץ/g, "צ").replace(/יי/g, "י").replace(/וו/g, "ו");
  if (t.length > 3 && t[0] === "ה") t = t.slice(1);
  return t;
}
function dist(a, b) { // Levenshtein, for "almost!"
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

export class PartyRoom {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; this.s = null; }
  async load() { if (!this.s) this.s = (await this.ctx.storage.get("s")) || null; return this.s; }
  async save() { await this.ctx.storage.put("s", this.s); }

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/init") {
      const b = await req.json(); await this.load();
      if (this.s && Date.now() - this.s.created < TTL) return Response.json({ ok: false, busy: true });
      this.s = { created: Date.now(), hostKey: b.hostKey, phase: "lobby", players: {}, order: [], g: null, endsAt: 0, used: { w: [], b: [], v: [] }, round: 0 };
      await this.save(); return Response.json({ ok: true });
    }
    if (req.headers.get("upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
    const s = await this.load();
    if (!s || Date.now() - s.created > TTL) return new Response("no room", { status: 404 });
    const role = url.searchParams.get("role") === "host" ? "host" : "player";
    if (role === "host" && url.searchParams.get("key") !== s.hostKey) return new Response("not the host", { status: 403 });
    const pid = role === "host" ? "host" : clean(url.searchParams.get("pid"), 24) || crypto.randomUUID().slice(0, 12);
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], [role, pid]); pair[1].serializeAttachment({ role, pid });
    queueMicrotask(() => { this.send(pair[1], this.view(role, pid)); if (role === "player" && s.players[pid]) this.toHost(this.view("host")); });
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  sockets(tag) { return this.ctx.getWebSockets(tag); }
  send(ws, msg) { try { ws.send(JSON.stringify(Object.assign({ now: Date.now() }, msg))); } catch (e) {} }
  toHost(msg) { for (const ws of this.sockets("host")) this.send(ws, msg); }
  push() { this.toHost(this.view("host")); for (const ws of this.sockets("player")) { const a = ws.deserializeAttachment() || {}; this.send(ws, this.view("player", a.pid)); } }
  people() { const s = this.s; return s.order.map((id) => { const p = s.players[id]; return { id, name: p.name, emoji: p.emoji, color: p.color, score: p.score, on: this.sockets(id).length > 0, done: this.done(id) }; }); }
  done(id) {
    const g = this.s.g; if (!g) return false;
    if (this.s.phase === "draw") return !!g.got[id] || id === g.drawer;
    if (this.s.phase === "write") return !!g.fakes[id];
    if (this.s.phase === "pick") return g.picks[id] != null;
    if (this.s.phase === "vote") return !!g.votes[id];
    return false;
  }

  // what each screen sees: the host sees the board, a phone sees only what is its own
  view(role, pid) {
    const s = this.s, g = s.g, host = role === "host", me = s.players[pid] || null;
    const v = { t: "view", phase: s.phase, game: g && g.kind, endsAt: s.endsAt, players: this.people(), you: host ? undefined : me && { id: pid, name: me.name, emoji: me.emoji, color: me.color, score: me.score } };
    if (!g) return v;
    v.round = g.n + 1; v.rounds = g.total;
    if (g.kind === "draw") {
      const drawer = s.players[g.drawer] || {}, mine = pid === g.drawer;
      Object.assign(v, { drawer: g.drawer, drawerName: drawer.name, drawerEmoji: drawer.emoji });
      if (s.phase === "choose") { if (mine) v.options = g.options; }
      else if (s.phase === "draw") {
        v.mask = this.mask(); v.got = Object.keys(g.got); v.len = g.word.replace(/ /g, "").length;
        if (host) v.ink = g.ink; if (mine) v.word = g.word; if (!host && !mine) v.solved = !!g.got[pid];
        if (!host && g.got[pid]) v.word = g.word;
      } else if (s.phase === "drawEnd") { v.word = g.word; v.got = Object.entries(g.got).map(([id, p]) => ({ id, p })); v.drawerGain = g.drawerGain; if (host) v.ink = g.ink; }
    }
    if (g.kind === "bluff") {
      v.q = g.q;
      if (s.phase === "write") { if (!host) v.mine = g.fakes[pid] || ""; }
      else if (s.phase === "pick") { v.options = g.options.map((o, i) => ({ i, text: o.text, own: !host && o.by.includes(pid) })); if (!host) v.mine = g.picks[pid]; }
      else if (s.phase === "bluffShow") v.reveal = g.options.map((o, i) => ({ i, text: o.text, truth: o.truth, by: o.by, pickers: Object.keys(g.picks).filter((id) => g.picks[id] === i) }));
    }
    if (g.kind === "vote") {
      v.q = g.q;
      if (s.phase === "vote") { if (!host) v.mine = g.votes[pid] || ""; }
      else if (s.phase === "voteShow") { const c = {}; for (const id in g.votes) c[g.votes[id]] = (c[g.votes[id]] || 0) + 1; v.counts = c; v.top = g.top; }
    }
    if (s.phase === "board") v.gains = g.gains;
    return v;
  }
  mask() { // the word as blanks, with a letter or two shown as the time runs down
    const g = this.s.g, w = g.word; let k = 0;
    return w.split("").map((ch) => { if (ch === " ") return " "; const i = k++; return g.hints.includes(i) ? ch : "_"; }).join("");
  }

  async timer(ms) { this.s.endsAt = Date.now() + ms; await this.ctx.storage.setAlarm(this.s.endsAt); }
  async alarm() {
    const s = await this.load(); if (!s || !s.g) return;
    if (Date.now() < s.endsAt - 250) { await this.ctx.storage.setAlarm(s.endsAt); return; }
    await this.advance();
  }
  async advance() {
    const s = this.s, g = s.g;
    switch (s.phase) {
      case "choose": return this.startDraw(0);
      case "draw": {
        // half way and near the end, the screen shows a letter
        const left = s.endsAt - Date.now();
        if (left > 500) return;
        return this.endDraw();
      }
      case "drawEnd": return this.nextDraw();
      case "write": return this.startPick();
      case "pick": return this.showBluff();
      case "bluffShow": return this.nextBluff();
      case "vote": return this.showVote();
      case "voteShow": return this.nextVote();
    }
  }
  addScore(id, n) { const p = this.s.players[id]; if (!p || !n) return; p.score += n; const g = this.s.g; if (g) g.gains[id] = (g.gains[id] || 0) + n; }

  // ---------- מציירים ומנחשים ----------
  async startGame(kind, rounds) {
    const s = this.s, ids = s.order.filter((id) => this.sockets(id).length);
    if (ids.length < 2) return false;
    if (kind === "draw") {
      const turns = shuffle(ids); const per = ids.length <= 3 ? 2 : 1; let list = []; for (let i = 0; i < per; i++) list = list.concat(turns);
      s.g = { kind, n: -1, total: list.length, turns: list, gains: {} };
      return this.nextDraw();
    }
    if (kind === "bluff") { s.g = { kind, n: -1, total: Math.min(8, Math.max(3, +rounds || 5)), gains: {} }; return this.nextBluff(); }
    if (kind === "vote") { if (ids.length < 3) return false; s.g = { kind, n: -1, total: Math.min(10, Math.max(3, +rounds || 6)), gains: {} }; return this.nextVote(); }
    return false;
  }
  pickFrom(list, usedKey, n) {
    const s = this.s; let free = list.map((_, i) => i).filter((i) => !s.used[usedKey].includes(i)); if (free.length < n) { s.used[usedKey] = []; free = list.map((_, i) => i); }
    const out = shuffle(free).slice(0, n); s.used[usedKey].push(...out); return out;
  }
  async nextDraw() {
    const s = this.s, g = s.g; g.n++;
    while (g.n < g.total && !this.sockets(g.turns[g.n]).length) g.n++; // a player who left is skipped
    if (g.n >= g.total) return this.board();
    Object.assign(g, { drawer: g.turns[g.n], options: this.pickFrom(WORDS, "w", 3).map((i) => WORDS[i]), word: "", hints: [], got: {}, ink: [], inkLen: 0, drawerGain: 0 });
    s.phase = "choose"; await this.timer(T.choose); await this.save(); this.push(); return true;
  }
  async startDraw(i) {
    const s = this.s, g = s.g; g.word = g.options[Math.max(0, Math.min(2, +i || 0))];
    s.phase = "draw"; g.startedAt = Date.now(); await this.timer(T.draw); await this.save(); this.push();
    this.hintLater();
  }
  hintLater() { // letters show at 45% and 75% of the time, by a second alarm-free timer while the room is awake
    const s = this.s, g = s.g, w = g.word.replace(/ /g, ""), word = g.word;
    [0.45, 0.75].forEach((f, k) => setTimeout(async () => {
      const s2 = await this.load(); if (!s2 || s2.phase !== "draw" || s2.g.word !== word) return;
      if (w.length < 3 + k) return; const free = w.split("").map((_, i) => i).filter((i) => !s2.g.hints.includes(i)); s2.g.hints.push(free[Math.floor(Math.random() * free.length)]);
      await this.save(); this.push();
    }, T.draw * f));
  }
  async guess(pid, text) {
    const s = this.s, g = s.g; if (s.phase !== "draw" || pid === g.drawer || g.got[pid]) return;
    const t = clean(text, 40); if (!t) return;
    const a = norm(t), b = norm(g.word);
    if (a && a === b) {
      const left = Math.max(0, s.endsAt - Date.now()), pts = Math.max(30, Math.round(100 * left / T.draw)), first = !Object.keys(g.got).length;
      g.got[pid] = pts + (first ? 20 : 0); this.addScore(pid, g.got[pid]); this.addScore(g.drawer, 25); g.drawerGain += 25;
      this.toHost({ t: "hit", id: pid, pts: g.got[pid] });
      const guessers = s.order.filter((id) => id !== g.drawer && this.sockets(id).length);
      if (guessers.every((id) => g.got[id])) return this.endDraw();
      await this.save(); this.push(); return;
    }
    for (const ws of this.sockets(pid)) this.send(ws, { t: "miss", text: t, close: b.length >= 4 && dist(a, b) <= 1 });
    this.toHost({ t: "try", id: pid, text: b.length >= 4 && dist(a, b) <= 1 ? "כמעט!" : t });
  }
  async endDraw() { const s = this.s; s.phase = "drawEnd"; await this.timer(T.drawEnd); await this.save(); this.push(); }
  async ink(pid, m) {
    const s = this.s, g = s.g; if (s.phase !== "draw" || pid !== g.drawer) return;
    let op = null;
    if (m.op === "begin") { const c = /^#[0-9A-Fa-f]{6}$/.test(m.c) ? m.c : "#222222", w = Math.max(2, Math.min(40, +m.w || 6)); op = { op: "begin", id: +m.id || 0, c, w, p: [Math.round(+m.x) || 0, Math.round(+m.y) || 0] }; g.ink.push({ id: op.id, c, w, p: op.p.slice() }); }
    else if (m.op === "add" && Array.isArray(m.p)) { const st = g.ink[g.ink.length - 1]; if (!st || st.id !== +m.id) return; const p = m.p.slice(0, 120).map((x) => Math.max(0, Math.min(1000, Math.round(+x) || 0))); if (g.inkLen + p.length > MAX_INK) return; st.p.push(...p); g.inkLen += p.length; op = { op: "add", id: st.id, p }; }
    else if (m.op === "undo") { g.ink.pop(); op = { op: "undo" }; }
    else if (m.op === "clear") { g.ink = []; g.inkLen = 0; op = { op: "clear" }; }
    else if (m.op === "fill") { const c = /^#[0-9A-Fa-f]{6}$/.test(m.c) ? m.c : "#FFFFFF"; g.ink.push({ id: -1, c, w: 0, p: [], fill: 1 }); op = { op: "fill", c }; }
    if (!op) return;
    this.toHost(Object.assign({ t: "ink" }, op));
    // the strokes are saved now and then, not on every move
    if (!this.inkSave) this.inkSave = setTimeout(async () => { this.inkSave = null; await this.save(); }, 1500);
  }

  // ---------- בלוף ----------
  async nextBluff() {
    const s = this.s, g = s.g; g.n++;
    if (g.n >= g.total) return this.board();
    const i = this.pickFrom(BLUFF, "b", 1)[0];
    Object.assign(g, { q: BLUFF[i][0], truth: BLUFF[i][1], fakes: {}, picks: {}, options: [] });
    s.phase = "write"; await this.timer(T.write); await this.save(); this.push(); return true;
  }
  async write(pid, text) {
    const s = this.s, g = s.g; if (s.phase !== "write" || !s.players[pid]) return;
    const t = clean(text, 30); if (!t) return;
    if (norm(t) === norm(g.truth)) { for (const ws of this.sockets(pid)) this.send(ws, { t: "truth" }); return; }
    g.fakes[pid] = t;
    const ids = s.order.filter((id) => this.sockets(id).length);
    if (ids.every((id) => g.fakes[id])) return this.startPick();
    await this.save(); this.push();
  }
  async startPick() {
    const s = this.s, g = s.g, by = {};
    for (const [id, t] of Object.entries(g.fakes)) { const k = norm(t); (by[k] = by[k] || { text: t, by: [] }).by.push(id); }
    g.options = shuffle(Object.values(by).concat([{ text: g.truth, by: [], truth: true }]));
    s.phase = "pick"; await this.timer(T.pick); await this.save(); this.push();
  }
  async pick(pid, i) {
    const s = this.s, g = s.g; if (s.phase !== "pick" || !s.players[pid] || g.picks[pid] != null) return;
    const o = g.options[+i]; if (!o || o.by.includes(pid)) return;
    g.picks[pid] = +i;
    const ids = s.order.filter((id) => this.sockets(id).length);
    if (ids.every((id) => g.picks[id] != null)) return this.showBluff();
    await this.save(); this.push();
  }
  async showBluff() {
    const s = this.s, g = s.g;
    for (const [id, i] of Object.entries(g.picks)) { const o = g.options[i]; if (o.truth) this.addScore(id, 100); else o.by.forEach((a) => this.addScore(a, 50)); }
    s.phase = "bluffShow"; await this.timer(T.bluffShow + g.options.length * 1200); await this.save(); this.push();
  }

  // ---------- מי במשפחה הכי ----------
  async nextVote() {
    const s = this.s, g = s.g; g.n++;
    if (g.n >= g.total) return this.board();
    g.q = VOTE[this.pickFrom(VOTE, "v", 1)[0]]; g.votes = {}; g.top = [];
    s.phase = "vote"; await this.timer(T.vote); await this.save(); this.push(); return true;
  }
  async vote(pid, who) {
    const s = this.s, g = s.g; if (s.phase !== "vote" || !s.players[pid] || !s.players[who] || g.votes[pid]) return;
    g.votes[pid] = who;
    const ids = s.order.filter((id) => this.sockets(id).length);
    if (ids.every((id) => g.votes[id])) return this.showVote();
    await this.save(); this.push();
  }
  async showVote() {
    const s = this.s, g = s.g, c = {};
    for (const id in g.votes) c[g.votes[id]] = (c[g.votes[id]] || 0) + 1;
    const max = Math.max(0, ...Object.values(c)); g.top = Object.keys(c).filter((id) => c[id] === max && max > 0);
    for (const [id, w] of Object.entries(g.votes)) if (g.top.includes(w)) this.addScore(id, 50);
    g.top.forEach((id) => this.addScore(id, 20));
    s.phase = "voteShow"; await this.timer(T.voteShow); await this.save(); this.push();
  }

  async board() { const s = this.s; s.phase = "board"; s.endsAt = 0; await this.ctx.storage.deleteAlarm(); await this.save(); this.push(); return true; }

  async webSocketMessage(ws, raw) {
    const s = await this.load(); if (!s) return;
    const { role, pid } = ws.deserializeAttachment() || {};
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t === "ping") return this.send(ws, { t: "pong" });
    if (role === "player") {
      if (m.t === "join") {
        const name = clean(m.name, 14); if (!name) return this.send(ws, { t: "error", e: "name" });
        if (!s.players[pid]) {
          if (s.order.length >= MAX_PLAYERS) return this.send(ws, { t: "error", e: "full" });
          if (Object.values(s.players).some((p) => p.name === name)) return this.send(ws, { t: "error", e: "taken" });
          const i = s.order.length; s.players[pid] = { name, emoji: EMOJI.includes(m.emoji) ? m.emoji : EMOJI[i % EMOJI.length], color: COLORS[i % COLORS.length], score: 0 }; s.order.push(pid);
          this.toHost({ t: "joined", id: pid });
        } else if (EMOJI.includes(m.emoji)) s.players[pid].emoji = m.emoji;
        await this.save(); return this.push();
      }
      if (!s.players[pid]) return;
      if (m.t === "choose" && s.phase === "choose" && s.g.drawer === pid) return this.startDraw(m.i);
      if (m.t === "ink") return this.ink(pid, m);
      if (m.t === "guess") return this.guess(pid, m.text);
      if (m.t === "write") return this.write(pid, m.text);
      if (m.t === "pick") return this.pick(pid, m.i);
      if (m.t === "vote") return this.vote(pid, m.who);
      if (m.t === "react" && typeof m.e === "string" && ["👏", "😂", "😮", "❤️", "🔥"].includes(m.e)) return this.toHost({ t: "react", id: pid, e: m.e });
      return;
    }
    // the host
    if (m.t === "start" && ["draw", "bluff", "vote"].includes(m.game)) { const ok = await this.startGame(m.game, m.rounds); if (!ok) this.send(ws, { t: "error", e: m.game === "vote" ? "need3" : "need2" }); return; }
    if (m.t === "skip" && s.g) { if (s.phase === "draw") return this.endDraw(); s.endsAt = Date.now(); return this.advance(); }
    if (m.t === "stop" && s.g) return this.board();
    if (m.t === "lobby") { s.phase = "lobby"; s.g = null; s.endsAt = 0; await this.ctx.storage.deleteAlarm(); await this.save(); return this.push(); }
    if (m.t === "kick" && s.players[m.id] && s.phase === "lobby") { delete s.players[m.id]; s.order = s.order.filter((x) => x !== m.id); for (const w of this.sockets(m.id)) this.send(w, { t: "kicked" }); await this.save(); return this.push(); }
    if (m.t === "zero") { for (const id of s.order) s.players[id].score = 0; await this.save(); return this.push(); }
  }
  async webSocketClose(ws) { const s = await this.load(); if (s) this.toHost(this.view("host")); }
  async webSocketError(ws) { return this.webSocketClose(ws); }
}

/** party.hania360.com/api/party/new and /api/party/ws: open a room, connect to one. */
export async function partyApi(req, env, url) {
  if (!env.PARTY) return Response.json({ error: "not configured" }, { status: 503 });
  if (url.pathname === "/api/party/new" && req.method === "POST") {
    for (let i = 0; i < 6; i++) {
      const code = String(1000 + Math.floor(Math.random() * 9000)), hostKey = crypto.randomUUID();
      const r = await (await env.PARTY.get(env.PARTY.idFromName("p" + code)).fetch("https://room/init", { method: "POST", body: JSON.stringify({ hostKey }) })).json();
      if (r.ok) return Response.json({ code, hostKey }, { headers: { "cache-control": "no-store" } });
    }
    return Response.json({ error: "busy" }, { status: 503 });
  }
  if (url.pathname === "/api/party/ws") {
    const code = url.searchParams.get("code") || "";
    if (!/^\d{4}$/.test(code)) return new Response("bad code", { status: 400 });
    return env.PARTY.get(env.PARTY.idFromName("p" + code)).fetch(req);
  }
  return new Response("not found", { status: 404 });
}
