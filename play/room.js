// מועדון הערב – חדר משחק חי (Durable Object אחד לכל קוד משחק).
// המארח הוא מקור האמת. הטלפונים מקבלים רק את המצב הציבורי ואת הכרטיס של הקבוצה שלהם,
// ותשובות הקבוצות נשלחות רק למארח.
import { DurableObject } from 'cloudflare:workers';

const MAX_PLAYERS = 150;
const MAX_MSG = 8000;
const send = (ws, data) => { try { ws.send(JSON.stringify(data)); } catch {} };

export class GameRoom extends DurableObject {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/init' && request.method === 'POST') {
      const { hostToken, teams, expiresAt } = await request.json();
      await this.ctx.storage.put({ meta: { hostToken, teams, expiresAt }, state: null, cards: {}, answers: {} });
      await this.ctx.storage.setAlarm(expiresAt);
      return new Response('ok');
    }
    if (request.headers.get('upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });

    const meta = await this.ctx.storage.get('meta');
    if (!meta || meta.expiresAt < Date.now()) return new Response('room closed', { status: 410 });
    const role = url.searchParams.get('role') === 'host' ? 'host' : 'player';
    if (role === 'host' && url.searchParams.get('token') !== meta.hostToken) return new Response('forbidden', { status: 403 });
    if (role === 'player' && this.ctx.getWebSockets('player').length >= MAX_PLAYERS) return new Response('room full', { status: 429 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [role]);
    server.serializeAttachment({ role, team: null, seen: false });

    if (role === 'host') {
      send(server, { t: 'hello', teams: meta.teams });
      send(server, { t: 'answers', answers: (await this.ctx.storage.get('answers')) || {} });
      send(server, this.peers());
    } else {
      send(server, { t: 'hello', teams: meta.teams });
      const state = await this.ctx.storage.get('state');
      if (state) send(server, { t: 'state', state });
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  peers(exclude) {
    const counts = {}, seen = {};
    for (const ws of this.ctx.getWebSockets('player')) {
      if (ws === exclude) continue;
      const a = ws.deserializeAttachment() || {};
      if (Number.isInteger(a.team)) {
        counts[a.team] = (counts[a.team] || 0) + 1;
        if (a.seen) seen[a.team] = true;
      }
    }
    return { t: 'peers', counts, seen };
  }
  toHosts(data) { for (const ws of this.ctx.getWebSockets('host')) send(ws, data); }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== 'string' || raw.length > MAX_MSG) return;
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object') return;
    const a = ws.deserializeAttachment() || {};
    const meta = await this.ctx.storage.get('meta');
    if (!meta) return;

    if (a.role === 'host') {
      if (m.t === 'state' && m.state && typeof m.state === 'object') {
        await this.ctx.storage.put('state', m.state);
        for (const p of this.ctx.getWebSockets('player')) send(p, { t: 'state', state: m.state });
      } else if (m.t === 'card' && Number.isInteger(m.team) && m.team >= 0 && m.team < meta.teams.length && m.card) {
        const cards = (await this.ctx.storage.get('cards')) || {};
        cards[m.team] = m.card;
        await this.ctx.storage.put('cards', cards);
        for (const p of this.ctx.getWebSockets('player')) {
          if ((p.deserializeAttachment() || {}).team === m.team) send(p, { t: 'card', card: m.card });
        }
      } else if (m.t === 'reset') {
        await this.ctx.storage.put({ cards: {}, answers: {} });
        for (const p of this.ctx.getWebSockets('player')) {
          const pa = p.deserializeAttachment() || {};
          p.serializeAttachment({ ...pa, seen: false });
        }
        send(ws, this.peers());
      }
      return;
    }

    // טלפון של קבוצה
    if (m.t === 'join' && Number.isInteger(m.team) && m.team >= 0 && m.team < meta.teams.length) {
      ws.serializeAttachment({ ...a, team: m.team, seen: false });
      const [state, cards] = await Promise.all([this.ctx.storage.get('state'), this.ctx.storage.get('cards')]);
      if (state) send(ws, { t: 'state', state });
      if (cards && cards[m.team]) send(ws, { t: 'card', card: cards[m.team] });
      this.toHosts(this.peers());
    } else if (m.t === 'seen' && Number.isInteger(a.team)) {
      ws.serializeAttachment({ ...a, seen: true });
      this.toHosts(this.peers());
    } else if (m.t === 'answer' && Number.isInteger(a.team) && typeof m.qk === 'string' && /^[a-z0-9]{1,20}$/.test(m.qk)) {
      const ans = typeof m.ans === 'number' && Number.isInteger(m.ans) ? m.ans : typeof m.ans === 'string' ? m.ans.slice(0, 60) : null;
      if (ans == null) return;
      const at = Date.now();   // שעון השרת קובע מי הייתה ראשונה
      const answers = (await this.ctx.storage.get('answers')) || {};
      answers[m.qk] = answers[m.qk] || {};
      answers[m.qk][a.team] = { ans, at };
      const keys = Object.keys(answers);
      if (keys.length > 40) delete answers[keys[0]];
      await this.ctx.storage.put('answers', answers);
      this.toHosts({ t: 'answer', qk: m.qk, team: a.team, ans, at });
    }
  }

  async webSocketClose(ws) {
    const a = ws.deserializeAttachment() || {};
    if (a.role === 'player') this.toHosts(this.peers(ws));
  }
  async webSocketError(ws) { await this.webSocketClose(ws); }

  async alarm() {
    for (const ws of this.ctx.getWebSockets()) { try { ws.close(1000, 'room expired'); } catch {} }
    await this.ctx.storage.deleteAll();
  }
}
