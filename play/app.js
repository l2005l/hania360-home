// מועדון הערב – השרת של play.hania360.com, בתוך hania360-home.
// ה־AI הוא Workers AI (בלי מפתח ובלי חיוב בתוכנית החינמית), והנתונים ב־Durable Object (store.js) במקום D1.
import { cleanConfig, priceOf, promptFor, validate, extractJSON, InputError, PASSES, punchCovers, subCovers } from './games.js';
import { sampleFor } from './samples.js';
import { db } from './store.js';
import { settings, payReady, payBlock, manualPay, claim, notify, adminApi, pushMsg, ADMIN_PAGE, SW } from './pay.js';
import PAGE, { FILES, IMAGES } from './page.js';

const AI_MODEL = '@cf/google/gemma-4-26b-a4b-it';
const AI_FALLBACK_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
// Workers AI נותן מכסה יומית חינמית אחת לכל האפליקציות, אז סופרים יצירות לכל משתמש ולכל האתר.
const AI_PER_USER = 8, AI_PER_DAY = 60;
const CONFIG = { ENVIRONMENT: 'production', APP_URL: 'https://play.hania360.com', PASS_URL: 'https://pass.hania360.com', PAYMENTS_MODE: 'manual', FREE_FIRST_GAME: '1', FREE_DAILY_LIMIT: '30' };

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
class HttpError extends Error { constructor(status, code, message) { super(message || code); this.status = status; this.code = code; } }
const now = () => new Date().toISOString();
const rid = (n = 16) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');

const LIVE_GAMES = new Set(['murder', 'trivia', 'escape']);
const MAX_GENERATIONS = 3;          // יצירה ראשונה + 2 גרסאות נוספות לכל הזמנה
const ORDERS_PER_HOUR = 20;
const ROOM_HOURS = 6;

/* ---------- כניסה דרך pass.hania360.com ---------- */
async function currentUser(request, env) {
  if (env.DEV_USER && env.ENVIRONMENT !== 'production') return { id: 'dev-user', email: env.DEV_USER, displayName: 'מפתח' };
  const cookie = request.headers.get('cookie') || '';
  if (!/(^|;\s*)hp_session=/.test(cookie)) return null;
  const url = `${env.PASS_URL}/api/session`;
  const req = new Request(url, { headers: { cookie, accept: 'application/json' } });
  try {
    const res = env.PASS ? await env.PASS.fetch(req) : await fetch(req);
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.signedIn && data.user && data.user.id ? data.user : null;
  } catch {
    return null;
  }
}
async function requireUser(request, env) {
  const u = await currentUser(request, env);
  if (!u) throw new HttpError(401, 'signed_out', 'צריך להיכנס לחשבון Hania360.');
  return u;
}
/** בקשות שמשנות משהו חייבות להגיע מהאתר עצמו, עם כותרת מיוחדת (הגנת CSRF). */
function requireSameSite(request, env) {
  const origin = request.headers.get('origin');
  const self = new URL(request.url).origin;
  if (request.headers.get('x-hania-play') !== '1') throw new HttpError(403, 'bad_request');
  if (origin && origin !== self && origin !== env.APP_URL) throw new HttpError(403, 'bad_origin');
}
async function readBody(request) {
  const text = await request.text();
  if (text.length > 20000) throw new HttpError(413, 'too_large');
  try { return text ? JSON.parse(text) : {}; } catch { throw new HttpError(400, 'bad_json'); }
}

/* ---------- מצב הדגמה ומשחק ראשון בחינם ---------- */
/** במצב הדגמה רק מיילים מהרשימה DEMO_EMAILS יכולים "לשלם" בטופס ההדגמה. */
function canDemoPay(env, user) {
  if (env.PAYMENTS_MODE !== 'demo') return false;
  const list = String(env.DEMO_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes('*') || list.includes(String(user.email || '').toLowerCase());
}
async function requirePayable(env, user) {
  if (env.PAYMENTS_MODE === 'manual') {
    if (!payReady(await settings(env))) throw new HttpError(403, 'payments_soon', 'התשלום באתר ייפתח בקרוב. בינתיים המשחק הראשון במסלול הפרטי עלינו.');
    const b = await payBlock(env, user); if (b) throw new HttpError(402, b.code, b.message);
    return;
  }
  if (env.PAYMENTS_MODE === 'demo' && !canDemoPay(env, user))
    throw new HttpError(403, 'payments_soon', 'התשלום באתר ייפתח בקרוב. בינתיים המשחק הראשון במסלול הפרטי עלינו.');
}
/** האם המשתמש עוד לא ניצל את המשחק הראשון בחינם, והמכסה היומית לא נגמרה */
async function freeGameAvailable(env, userId) {
  if (env.FREE_FIRST_GAME !== '1') return false;
  const used = await env.DB.prepare("SELECT 1 FROM orders WHERE user_id=? AND provider='free' LIMIT 1").bind(userId).first();
  if (used) return false;
  const dayAgo = new Date(Date.now() - 864e5).toISOString();
  const today = await env.DB.prepare("SELECT COUNT(*) n FROM orders WHERE provider='free' AND created_at>?").bind(dayAgo).first();
  return (today?.n || 0) < Number(env.FREE_DAILY_LIMIT || 200);
}

/* ---------- כרטיסייה ומנוי ---------- */
async function entitlements(env, userId) {
  const t = now();
  const [sub, cr] = await Promise.all([
    env.DB.prepare('SELECT plan, active_until FROM subscriptions WHERE user_id=?').bind(userId).first(),
    env.DB.prepare('SELECT COALESCE(SUM(remaining),0) n, MIN(expires_at) soonest FROM credits WHERE user_id=? AND remaining>0 AND expires_at>?').bind(userId, t).first(),
  ]);
  return {
    sub: sub && sub.active_until > t ? { plan: sub.plan, until: sub.active_until } : null,
    subExpired: sub && sub.active_until <= t ? { until: sub.active_until } : null,
    punch: { remaining: cr?.n || 0, soonestExpiry: cr?.soonest || null },
  };
}
/** מעניק את מה שנקנה, פעם אחת בלבד (נקרא אחרי שההזמנה עברה ל־paid) */
async function grantPass(env, o) {
  if (o.kind === 'punch') {
    const p = PASSES.punch;
    await env.DB.prepare('INSERT OR IGNORE INTO credits(id,user_id,order_id,total,remaining,expires_at,created_at) VALUES(?,?,?,?,?,?,?)')
      .bind('cr_' + rid(8), o.user_id, o.id, p.count, p.count, new Date(Date.now() + p.days * 864e5).toISOString(), now()).run();
  } else if (o.kind === 'sub') {
    const cur = await env.DB.prepare('SELECT active_until, last_order_id FROM subscriptions WHERE user_id=?').bind(o.user_id).first();
    if (cur && cur.last_order_id === o.id) return;
    const base = cur && cur.active_until > now() ? Date.parse(cur.active_until) : Date.now();
    const until = new Date(base + PASSES.sub.days * 864e5).toISOString();
    await env.DB.prepare('INSERT INTO subscriptions(user_id,plan,active_until,last_order_id,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET plan=excluded.plan, active_until=excluded.active_until, last_order_id=excluded.last_order_id, updated_at=excluded.updated_at')
      .bind(o.user_id, 'biz', until, o.id, now()).run();
  }
}
async function buyPass(request, env) {
  requireSameSite(request, env);
  const user = await requireUser(request, env);
  const body = await readBody(request);
  const kind = String(body.kind || '');
  const p = PASSES[kind];
  if (!p) throw new InputError('מוצר לא מוכר.');
  await requirePayable(env, user);
  const id = 'ord_' + rid(10);
  await env.DB.prepare('INSERT INTO orders(id,user_id,email,kind,game,cfg_json,tier,price,status,provider,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id, user.id, user.email || '', kind, 'pass', '{}', p.tier, p.price, 'pending', env.PAYMENTS_MODE === 'demo' ? 'demo' : '', now()).run();
  if (env.PAYMENTS_MODE === 'manual') return json({ order: { id, kind, tier: p.tier, price: p.price, status: 'pending' }, pay: await manualPay(env, id) });
  if (env.PAYMENTS_MODE === 'demo') return json({ order: { id, kind, tier: p.tier, price: p.price, status: 'pending' }, pay: { mode: 'demo' } });
  throw new HttpError(501, 'payments_not_configured', 'התשלום עדיין לא מחובר לסולקת.');
}
async function useCredit(request, env, id) {
  requireSameSite(request, env);
  const user = await requireUser(request, env);
  const o = await loadOrder(env, user, id);
  if (o.kind !== 'game' || o.status !== 'pending') throw new HttpError(409, 'bad_state', 'ההזמנה כבר טופלה.');
  if (!punchCovers(o.game, JSON.parse(o.cfg_json))) throw new HttpError(400, 'not_covered', 'הכרטיסייה מכסה רק משחקים במסלול הפרטי.');
  const r = await env.DB.prepare('UPDATE credits SET remaining=remaining-1 WHERE id=(SELECT id FROM credits WHERE user_id=? AND remaining>0 AND expires_at>? ORDER BY expires_at LIMIT 1) AND remaining>0')
    .bind(user.id, now()).run();
  if (!r.meta || r.meta.changes !== 1) throw new HttpError(409, 'no_credits', 'לא נשארו משחקים בכרטיסייה.');
  await env.DB.prepare("UPDATE orders SET status='paid', paid_at=?, provider='punch' WHERE id=? AND status='pending'").bind(now(), o.id).run();
  return json({ order: orderView(await loadOrder(env, user, id)), ent: await entitlements(env, user.id) });
}

/* ---------- הזמנות ותשלום ---------- */
async function createOrder(request, env) {
  requireSameSite(request, env);
  const user = await requireUser(request, env);
  const body = await readBody(request);
  const game = String(body.game || '');
  const cfg = cleanConfig(game, body.cfg);
  const { price, tier } = priceOf(game, cfg);

  const hourAgo = new Date(Date.now() - 3600e3).toISOString();
  const recent = await env.DB.prepare('SELECT COUNT(*) n FROM orders WHERE user_id=? AND created_at>?').bind(user.id, hourAgo).first();
  if ((recent?.n || 0) >= ORDERS_PER_HOUR) throw new HttpError(429, 'rate_limited', 'יותר מדי הזמנות בשעה האחרונה. נסו שוב מאוחר יותר.');

  const id = 'ord_' + rid(10);
  const ent = await entitlements(env, user.id);
  if (ent.sub && subCovers(game)) {
    // כלול במנוי העסקים: ההזמנה נפתחת כבר משולמת
    await env.DB.prepare("INSERT INTO orders(id,user_id,email,kind,game,cfg_json,tier,price,status,provider,created_at,paid_at) VALUES(?,?,?,'game',?,?,?,?,'paid','sub',?,?)")
      .bind(id, user.id, user.email || '', game, JSON.stringify(cfg), tier, 0, now(), now()).run();
    const o = await loadOrder(env, user, id);
    return json({ order: orderView(o), covered: 'sub', ent });
  }
  if (punchCovers(game, cfg) && await freeGameAvailable(env, user.id)) {
    // המשחק הראשון במסלול הפרטי עלינו
    await env.DB.prepare("INSERT INTO orders(id,user_id,email,kind,game,cfg_json,tier,price,status,provider,created_at,paid_at) VALUES(?,?,?,'game',?,?,?,?,'paid','free',?,?)")
      .bind(id, user.id, user.email || '', game, JSON.stringify(cfg), tier, 0, now(), now()).run();
    return json({ order: orderView(await loadOrder(env, user, id)), covered: 'free', ent });
  }
  // כרטיסייה בתוקף מאפשרת להמשיך גם כשהתשלום עוד סגור
  if (!(punchCovers(game, cfg) && ent.punch.remaining > 0)) await requirePayable(env, user);
  await env.DB.prepare('INSERT INTO orders(id,user_id,email,game,cfg_json,tier,price,status,provider,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
    .bind(id, user.id, user.email || '', game, JSON.stringify(cfg), tier, price, 'pending', env.PAYMENTS_MODE === 'demo' ? 'demo' : '', now()).run();
  const options = { punch: punchCovers(game, cfg) ? ent.punch.remaining : 0 };

  if (env.PAYMENTS_MODE === 'manual') {
    // כרטיסייה שנשארה מספיקה גם כשהתשלום עוד לא מוגדר או חסום
    let pay = { mode: 'closed' };
    try { await requirePayable(env, user); pay = await manualPay(env, id); } catch (e) { if (!(e instanceof HttpError)) throw e; }
    return json({ order: { id, game, cfg, tier, price, status: 'pending' }, pay, options });
  }
  if (env.PAYMENTS_MODE === 'demo') return json({ order: { id, game, cfg, tier, price, status: 'pending' }, pay: { mode: canDemoPay(env, user) ? 'demo' : 'closed' }, options });
  // כאן מתחברים לסולקת האמיתית: יוצרים דף תשלום ומחזירים את הקישור אליו.
  // ראו README, סעיף "חיבור סולקת אמיתית".
  throw new HttpError(501, 'payments_not_configured', 'התשלום עדיין לא מחובר לסולקת.');
}
async function loadOrder(env, user, id) {
  const o = await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(String(id)).first();
  if (!o || o.user_id !== user.id) throw new HttpError(404, 'not_found', 'ההזמנה לא נמצאה.');
  return o;
}
const orderView = (o) => ({ id: o.id, kind: o.kind, provider: o.provider, game: o.game, cfg: JSON.parse(o.cfg_json), tier: o.tier, price: o.price, status: o.status, gens: o.gens, gensLeft: Math.max(0, MAX_GENERATIONS - o.gens) });

async function getOrder(request, env, id) {
  const user = await requireUser(request, env);
  return json({ order: orderView(await loadOrder(env, user, id)) });
}
async function demoPay(request, env, id) {
  requireSameSite(request, env);
  if (env.PAYMENTS_MODE !== 'demo') throw new HttpError(404, 'not_found');
  const user = await requireUser(request, env);
  await requirePayable(env, user);
  const o = await loadOrder(env, user, id);
  if (o.status === 'pending') {
    const r = await env.DB.prepare("UPDATE orders SET status='paid', paid_at=?, provider='demo', provider_ref=? WHERE id=? AND status='pending'")
      .bind(now(), 'DEMO-' + rid(4), o.id).run();
    if (r.meta && r.meta.changes === 1) await grantPass(env, o);   // אחרי חיבור סולקת: אותה קריאה מתוך ה־webhook
  }
  return json({ order: orderView(await loadOrder(env, user, id)), ent: await entitlements(env, user.id) });
}

async function claimPay(request, env, id) {
  requireSameSite(request, env);
  const user = await requireUser(request, env);
  const body = await readBody(request);
  const o = await loadOrder(env, user, id);
  try { await claim(env, user, o, body.method, grantPass); }
  catch (e) { throw new HttpError(e.status || 409, e.code || 'bad_state', e.message !== 'bad_state' ? e.message : 'ההזמנה כבר טופלה.'); }
  return json({ order: orderView(await loadOrder(env, user, id)), ent: await entitlements(env, user.id) });
}

/* ---------- יצירת תוכן עם Workers AI ---------- */
async function askAI(env, prompt, wantJson) {
  if (!env.AI) throw new HttpError(503, 'ai_unavailable');
  const text = (out) => out && (out.response ?? (out.choices && out.choices[0] && out.choices[0].message && out.choices[0].message.content));
  const asText = (r) => (r && typeof r === 'object' ? JSON.stringify(r) : r == null ? '' : String(r));
  const messages = [{ role: 'system', content: 'You write party games in natural, fluent Hebrew. Follow the requested format exactly.' }, { role: 'user', content: prompt }];
  try { const t = asText(text(await env.AI.run(AI_MODEL, { messages, max_tokens: 4096 }))); if (t.trim()) return t; } catch (e) { console.error('ai_error', String(e).slice(0, 200)); }
  try { const t = asText(text(await env.AI.run(AI_FALLBACK_MODEL, { messages, max_tokens: 4096 }))); if (t.trim()) return t; } catch (e) { console.error('ai_fallback_error', String(e).slice(0, 200)); }
  throw new HttpError(502, 'ai_failed');
}
/** סופר יצירות AI לכל משתמש ולכל האתר (באותו מונה של HaniaSipur ו־HaniaKita, בשם נפרד) */
async function aiAllowed(env, user) {
  if (!env.SIPUR) return true;
  const r = await env.SIPUR.get(env.SIPUR.idFromName('limits')).fetch('https://l/', { method: 'POST', body: JSON.stringify({ device: 'u' + String(user.id).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40), ns: 'play:', perDevice: AI_PER_USER, perDay: AI_PER_DAY }) }).then((x) => x.json()).catch(() => ({ ok: true }));
  return r.ok;
}
async function generate(request, env, id) {
  requireSameSite(request, env);
  const user = await requireUser(request, env);
  const o = await loadOrder(env, user, id);
  if (o.kind !== 'game') throw new HttpError(400, 'not_a_game');
  if (o.status !== 'paid') throw new HttpError(402, 'not_paid', 'ההזמנה עוד לא שולמה.');
  if (o.gens >= MAX_GENERATIONS) throw new HttpError(409, 'no_generations_left', 'נוצלו כל היצירות להזמנה הזו.');
  const body = await readBody(request);
  const cfg = JSON.parse(o.cfg_json);

  let content = null, source = 'ai';
  if (body.useSample) {
    content = sampleFor(o.game, cfg); source = 'sample';
  } else if (!env.AI) {
    content = sampleFor(o.game, cfg); source = 'sample';      // בלי Workers AI: תוכן מוכן
  } else {
    if (!(await aiAllowed(env, user))) throw new HttpError(429, 'ai_busy', 'היום כבר נוצרו הרבה משחקים. אפשר לשחק עכשיו בתוכן מוכן, או לנסות שוב מחר.');
    const { prompt, json: wantJson } = promptFor(o.game, cfg);
    let lastErr = 'ai_failed';
    for (let attempt = 0; attempt < 2 && !content; attempt++) {
      try {
        const text = await askAI(env, prompt, wantJson);
        content = validate(o.game, cfg, wantJson ? extractJSON(text) : text);
        if (!content) console.warn('ai_invalid', o.game, o.id, attempt);
      } catch (e) {
        lastErr = e.code || 'ai_failed';
        if (e.code === 'ai_unavailable') break;
      }
    }
    if (!content) throw new HttpError(502, lastErr, 'היצירה לא הצליחה הפעם. אפשר לנסות שוב או לשחק בתוכן מוכן.');
  }

  // רק יצירה מוצלחת נספרת. התנאי ב־WHERE מונע יצירות כפולות במקביל.
  const upd = await env.DB.prepare('UPDATE orders SET gens=gens+1 WHERE id=? AND gens=?').bind(o.id, o.gens).run();
  if (!upd.meta || upd.meta.changes !== 1) throw new HttpError(409, 'busy', 'יצירה אחרת רצה במקביל. נסו שוב.');
  const gameId = 'gm_' + rid(10);
  await env.DB.prepare('INSERT INTO games(id,order_id,user_id,game,content_json,source,created_at) VALUES(?,?,?,?,?,?,?)')
    .bind(gameId, o.id, user.id, o.game, JSON.stringify(content), source, now()).run();
  return json({ gameId, source, content, gensLeft: Math.max(0, MAX_GENERATIONS - o.gens - 1) });
}

/* ---------- המשחקים שלי ---------- */
async function myAccount(request, env) {
  const user = await requireUser(request, env);
  const rows = await env.DB.prepare(
    `SELECT g.id, g.game, g.source, g.created_at, o.id order_id, o.cfg_json, o.gens, o.provider
       FROM games g JOIN orders o ON o.id=g.order_id
      WHERE g.user_id=? ORDER BY g.created_at DESC LIMIT 40`).bind(user.id).all();
  const games = (rows.results || []).map((r) => {
    const cfg = JSON.parse(r.cfg_json);
    return { id: r.id, game: r.game, source: r.source, createdAt: r.created_at, orderId: r.order_id,
      label: cfg.topic || cfg.name || '', cfg, gensLeft: Math.max(0, MAX_GENERATIONS - r.gens), paidWith: r.provider };
  });
  return json({ ent: await entitlements(env, user.id), games });
}
async function getGame(request, env, id) {
  const user = await requireUser(request, env);
  const g = await env.DB.prepare('SELECT * FROM games WHERE id=?').bind(String(id)).first();
  if (!g || g.user_id !== user.id) throw new HttpError(404, 'not_found', 'המשחק לא נמצא.');
  const o = await loadOrder(env, user, g.order_id);
  return json({ gameId: g.id, game: g.game, source: g.source, content: JSON.parse(g.content_json), order: orderView(o) });
}

/* ---------- חדרי משחק חיים ---------- */
async function createRoom(request, env) {
  requireSameSite(request, env);
  const user = await requireUser(request, env);
  const body = await readBody(request);
  const g = await env.DB.prepare('SELECT * FROM games WHERE id=?').bind(String(body.gameId || '')).first();
  if (!g || g.user_id !== user.id) throw new HttpError(404, 'not_found', 'המשחק לא נמצא.');
  if (!LIVE_GAMES.has(g.game)) throw new HttpError(400, 'not_live', 'המשחק הזה לא תומך במשחק מהטלפונים.');
  const teams = (Array.isArray(body.teams) ? body.teams : []).map((t) => String(t).slice(0, 30)).filter(Boolean).slice(0, 20);
  if (teams.length < 2) throw new HttpError(400, 'bad_teams');

  await env.DB.prepare('DELETE FROM rooms WHERE expires_at<?').bind(now()).run();
  const expires = new Date(Date.now() + ROOM_HOURS * 3600e3).toISOString();
  let code = null, doName = null;
  for (let i = 0; i < 12 && !code; i++) {
    const c = String(1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000));
    const d = `${c}-${rid(6)}`;
    const r = await env.DB.prepare('INSERT OR IGNORE INTO rooms(code,game_id,user_id,do_name,created_at,expires_at) VALUES(?,?,?,?,?,?)')
      .bind(c, g.id, user.id, d, now(), expires).run();
    if (r.meta && r.meta.changes === 1) { code = c; doName = d; }
  }
  if (!code) throw new HttpError(503, 'no_codes', 'אין כרגע קודים פנויים. נסו שוב בעוד דקה.');

  const hostToken = rid(24);
  const stub = env.PLAYROOM.get(env.PLAYROOM.idFromName(doName));
  const init = await stub.fetch('https://room/init', { method: 'POST', body: JSON.stringify({ hostToken, teams, expiresAt: Date.parse(expires) }) });
  if (!init.ok) throw new HttpError(500, 'room_failed');
  return json({ code, hostToken, expiresAt: expires });
}
async function roomSocket(request, env, code) {
  if (request.headers.get('upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });
  const room = await env.DB.prepare('SELECT do_name, expires_at FROM rooms WHERE code=?').bind(String(code)).first();
  if (!room || room.expires_at < now()) return new Response('room not found', { status: 404 });
  const stub = env.PLAYROOM.get(env.PLAYROOM.idFromName(room.do_name));
  return stub.fetch(request);
}

/* ---------- ניתוב ---------- */
export async function playApp(request, baseEnv) {
    const env = Object.assign({}, CONFIG, baseEnv, { DEMO_EMAILS: (baseEnv && baseEnv.PLAY_DEMO_EMAILS) || '', DB: db(baseEnv) });
    const url = new URL(request.url);
    const path = url.pathname, method = request.method;
    try {
      if (path === '/api/me' && method === 'GET') {
        const u = await currentUser(request, env);
        return json({
          signedIn: !!u, user: u ? { email: u.email, displayName: u.displayName || '' } : null,
          loginUrl: `${env.PASS_URL}/?return=${encodeURIComponent(env.APP_URL + '/')}`,
          payments: env.PAYMENTS_MODE === 'manual' ? (payReady(await settings(env)) ? 'manual' : 'soon') : env.PAYMENTS_MODE === 'demo' ? (u && canDemoPay(env, u) ? 'demo' : 'soon') : 'live',
          firstFree: env.FREE_FIRST_GAME === '1' && (!u || await freeGameAvailable(env, u.id)),
        });
      }
      if (path === '/api/orders' && method === 'POST') return await createOrder(request, env);
      if (path === '/api/passes' && method === 'POST') return await buyPass(request, env);
      if (path === '/api/my' && method === 'GET') return await myAccount(request, env);
      let m;
      if ((m = path.match(/^\/api\/orders\/(ord_[0-9a-f]{20})$/)) && method === 'GET') return await getOrder(request, env, m[1]);
      if ((m = path.match(/^\/api\/orders\/(ord_[0-9a-f]{20})\/demo-pay$/)) && method === 'POST') return await demoPay(request, env, m[1]);
      if ((m = path.match(/^\/api\/orders\/(ord_[0-9a-f]{20})\/generate$/)) && method === 'POST') return await generate(request, env, m[1]);
      if ((m = path.match(/^\/api\/orders\/(ord_[0-9a-f]{20})\/use-credit$/)) && method === 'POST') return await useCredit(request, env, m[1]);
      if ((m = path.match(/^\/api\/games\/(gm_[0-9a-f]{20})$/)) && method === 'GET') return await getGame(request, env, m[1]);
      if ((m = path.match(/^\/api\/orders\/(ord_[0-9a-f]{20})\/claim$/)) && method === 'POST') return await claimPay(request, env, m[1]);
      if (path === '/api/pay/notify' && method === 'POST') return await notify(request, env, grantPass);
      if (path === '/api/admin/msg' && method === 'POST') { const b = await readBody(request); return json(await pushMsg(env, String(b.endpoint || ''))); }
      if (path.startsWith('/api/admin/')) return await adminApi(request, env, path, grantPass);
      if (path === '/admin') return new Response(ADMIN_PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex', 'x-og': '1', 'referrer-policy': 'no-referrer' } });
      if (path === '/sw.js') return new Response(SW, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache' } });
      if (path === '/api/rooms' && method === 'POST') return await createRoom(request, env);
      if ((m = path.match(/^\/ws\/(\d{4})$/))) return await roomSocket(request, env, m[1]);
      if (path === '/api/payments/webhook' && method === 'POST') {
        // מקום לאישור התשלום מהסולקת (webhook). ראו README.
        return json({ error: 'payments_not_configured' }, 501);
      }
      if (path.startsWith('/api/') || path.startsWith('/ws/')) return json({ error: 'not_found' }, 404);
      return page(path);
    } catch (e) {
      if (e instanceof InputError) return json({ error: 'invalid', message: e.message }, 400);
      if (e instanceof HttpError) return json({ error: e.code, message: e.message !== e.code ? e.message : undefined }, e.status);
      console.error('unhandled', e && e.stack || e);
      return json({ error: 'server_error' }, 500);
    }
}


/** הממשק: דף אחד ל־/ ול־/join, והמניפסט והאייקונים */
function page(path) {
  if (path === '/' || path === '/index.html' || path === '/join' || path === '/join/') return new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' } });
  if (FILES[path]) return new Response(FILES[path][1], { headers: { 'content-type': FILES[path][0], 'cache-control': 'public, max-age=3600' } });
  if (IMAGES[path]) return new Response(Uint8Array.from(atob(IMAGES[path]), (c) => c.charCodeAt(0)), { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' } });
  if (path === '/robots.txt') return new Response('User-agent: *\nAllow: /\nSitemap: https://play.hania360.com/sitemap.xml\n', { headers: { 'content-type': 'text/plain' } });
  if (path === '/sitemap.xml') return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://play.hania360.com/</loc><changefreq>weekly</changefreq></url></urlset>', { headers: { 'content-type': 'application/xml; charset=utf-8' } });
  return Response.redirect('https://play.hania360.com/', 302);
}
