// Moadon HaErev (play.hania360.com) keeps its orders, games and rooms in one Durable Object's SQLite,
// so it needs no D1 database. db(env) looks like the small part of D1 the server uses:
// prepare(sql).bind(...).first() / .all() / .run() with meta.changes.

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL DEFAULT 'game', game TEXT NOT NULL, cfg_json TEXT NOT NULL, tier TEXT NOT NULL, price INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', provider TEXT NOT NULL DEFAULT '', provider_ref TEXT NOT NULL DEFAULT '', gens INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, paid_at TEXT NOT NULL DEFAULT '')",
  "CREATE INDEX IF NOT EXISTS orders_user ON orders(user_id, created_at)",
  "CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, user_id TEXT NOT NULL, game TEXT NOT NULL, content_json TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'ai', created_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS games_order ON games(order_id)",
  "CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, game_id TEXT NOT NULL, user_id TEXT NOT NULL, do_name TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS credits (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, order_id TEXT NOT NULL UNIQUE, total INTEGER NOT NULL, remaining INTEGER NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS credits_user ON credits(user_id, expires_at)",
  "CREATE TABLE IF NOT EXISTS subscriptions (user_id TEXT PRIMARY KEY, plan TEXT NOT NULL, active_until TEXT NOT NULL, last_order_id TEXT NOT NULL, updated_at TEXT NOT NULL)",
];

export class PlayStore {
  constructor(ctx) { this.ctx = ctx; for (const s of SCHEMA) ctx.storage.sql.exec(s); }
  async fetch(req) {
    const { sql, params } = await req.json(), db = this.ctx.storage.sql;
    try {
      const rows = db.exec(sql, ...(params || [])).toArray();
      const changes = /^\s*(insert|update|delete|replace)/i.test(sql) ? [...db.exec("SELECT changes() AS c")][0].c : 0;
      return Response.json({ rows, changes });
    } catch (e) { return Response.json({ error: String(e && e.message || e) }, { status: 500 }); }
  }
}

export function db(env) {
  const stub = env.PLAYDB.get(env.PLAYDB.idFromName("store"));
  const run = async (sql, params) => {
    const r = await stub.fetch("https://db/", { method: "POST", body: JSON.stringify({ sql, params }) });
    const j = await r.json(); if (j.error) throw new Error("db: " + j.error);
    return j;
  };
  const stmt = (sql, params = []) => ({
    bind: (...p) => stmt(sql, p),
    first: async () => (await run(sql, params)).rows[0] || null,
    all: async () => ({ results: (await run(sql, params)).rows }),
    run: async () => ({ meta: { changes: (await run(sql, params)).changes } }),
  });
  return { prepare: (sql) => stmt(sql) };
}
