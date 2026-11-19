// Today on the home-screen widget. The widget has no browser cookies, so the person connects it once:
// hania360.com/widget/connect (opened in the app, where they are signed in to Hania360) keeps their Hania Pass
// session in a WidgetLink object under a random widget key, and hands the key to the Android app
// (hania360://widget?t=<key>). The widget then sends the key with /api/widget, and gets a few personal lines from
// Today: tasks for today, notes, calendar events, vouchers about to expire, birthdays this week.
// The session is refreshed each time the person opens hania360.com signed in (cookie h360_wt names their key), and
// the key only ever reads that summary.

const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
const cookieOf = (req, name) => { const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)")); return m ? m[1] : ""; };
const okKey = (t) => /^[A-Za-z0-9_-]{32,48}$/.test(t || "");
async function sha(t) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
const box = async (env, key) => env.WLINK.get(env.WLINK.idFromName("w:" + await sha(key)));

export class WidgetLink {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async fetch(req) {
    const b = await req.json().catch(() => ({})), st = this.ctx.storage;
    if (b.op === "put" && typeof b.sess === "string" && b.sess.length < 200) { await st.put("s", { sess: b.sess, at: Date.now() }); return json({ ok: true }); }
    if (b.op === "get") return json((await st.get("s")) || {});
    if (b.op === "del") { await st.deleteAll(); return json({ ok: true }); }
    return json({ error: "op" }, 400);
  }
}

async function today(env, sess) {
  if (!env.PASS || !sess) return null;
  const r = await env.PASS.fetch("https://pass.internal/api/today", { headers: { cookie: "hp_session=" + sess } }).catch(() => null);
  if (!r || !r.ok) return null;
  return r.json().catch(() => null);
}
const ilDay = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
const cut = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const minus = (hm, m) => { const t = +hm.slice(0, 2) * 60 + +hm.slice(3) - m; return t < 0 ? "00:00" : String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); };
// The few lines the widget shows, most pressing first
function lines(d) {
  const out = [], day = ilDay(), when = (n) => (n === 0 ? "היום" : n === 1 ? "מחר" : "בעוד " + n + " ימים");
  const tasks = ((d.tasks && d.tasks.tasks) || []).filter((t) => !t.done && t.mine && (!t.day || t.day <= day));
  if (tasks.length) out.push("✅ " + (tasks.length === 1 ? "משימה: " + cut(tasks[0].text, 40) : tasks.length + " משימות: " + tasks.slice(0, 2).map((t) => cut(t.text, 22)).join(", ")) + (tasks.some((t) => t.late) ? " ⚠️" : ""));
  const notes = ((d.notes && d.notes.today) || []).filter((n) => !n.done);
  const cal = (d.calendar && d.calendar.today) || [];
  // what is still ahead today, in time order (what already passed drops off), all of it when it fits, else "ועוד N"
  const nowHm = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jerusalem" });
  const soon = (t) => !t || t >= nowHm || t >= minus(nowHm, 20);
  const items = cal.filter((e) => e.allDay || soon(e.time)).map((e) => [e.allDay ? "" : e.time, cut(e.title, 24)])
    .concat(notes.filter((n) => soon(n.time)).map((n) => [n.time || "", cut(n.text, 24)]))
    .sort((a, b) => (a[0] || "00:00").localeCompare(b[0] || "00:00")).map((x) => (x[0] ? x[0] + " " : "") + x[1]);
  if (items.length) out.push("📅 " + items.slice(0, 4).join(" · ") + (items.length > 4 ? " · ועוד " + (items.length - 4) : ""));
  const v = ((d.save && d.save.expiring) || []).filter((x) => x.days <= 7)[0];
  if (v) out.push("🎟️ שובר " + cut(v.store, 18) + " (₪" + Math.round(v.balance) + ") פג " + when(v.days));
  const b = ((d.gil && d.gil.birthdays) || []).filter((x) => x.days <= 7)[0];
  if (b) out.push("🎂 " + cut(b.name, 18) + (b.days === 0 ? " חוגג/ת היום!" : " יום הולדת " + when(b.days)) + (b.age ? " (" + b.age + ")" : ""));
  const rep = ((d.repeats) || []).filter((x) => x.due === 0)[0];
  if (rep && out.length < 3) out.push("🔁 " + cut(rep.title, 40));
  return out.slice(0, 3);
}
// Personal lines for /api/widget (null: no key; {relink}: the key no longer works and the person should reconnect)
export async function widgetMe(env, key) {
  if (!okKey(key) || !env.WLINK) return null;
  const ck = new Request("https://hania360.com/widget-me/" + await sha(key));
  const hit = await caches.default.match(ck); if (hit) return hit.json();
  const s = await (await box(env, key)).fetch("https://w/", { method: "POST", body: JSON.stringify({ op: "get" }) }).then((r) => r.json()).catch(() => ({}));
  const d = s.sess ? await today(env, s.sess) : null;
  const me = !d || !d.signedIn ? { relink: 1 } : { name: cut((d.user && d.user.displayName) || "", 20), lines: lines(d) };
  await caches.default.put(ck, new Response(JSON.stringify(me), { headers: { "cache-control": "max-age=" + (me.relink ? 120 : 600) } }));
  return me;
}
// On hania360.com: keep the widget's copy of the session fresh while the person uses the site signed in
export function widgetRefresh(request, env, ctx) {
  const key = cookieOf(request, "h360_wt"), sess = cookieOf(request, "hp_session");
  if (!env.WLINK || !okKey(key) || !sess || !ctx) return;
  ctx.waitUntil(box(env, key).then((b) => b.fetch("https://w/", { method: "POST", body: JSON.stringify({ op: "put", sess }) })).catch(() => {}));
}
const page = (title, body) => new Response(`<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="robots" content="noindex">
<style>body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:linear-gradient(135deg,#1E293B,#2563EB);color:#fff;min-height:100vh;display:grid;place-items:center;padding:20px;box-sizing:border-box}
.c{max-width:420px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:24px;padding:22px;display:grid;gap:12px;text-align:center}h1{margin:0;font-size:24px}p{margin:0;line-height:1.5;color:#E2E8F0}
a.b{display:block;background:#FFC53D;color:#1A1300;font-weight:800;text-decoration:none;border-radius:16px;padding:14px;font-size:18px}a.l{color:#fff}small{color:#CBD5E1}</style></head><body><div class="c">${body}</div></body></html>`,
  { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

// GET /widget/connect: connect this person's Today to the widget on this phone
export async function widgetConnect(request, env) {
  const sess = cookieOf(request, "hp_session");
  const back = "https://pass.hania360.com/?return=" + encodeURIComponent("https://hania360.com/widget/connect");
  if (!env.WLINK || !env.PASS) return page("Today בווידג'ט", "<h1>לא זמין כרגע</h1><p>נסו שוב מאוחר יותר.</p>");
  const d = sess ? await today(env, sess) : null;
  if (!d || !d.signedIn) return page("Today בווידג'ט", `<h1>📋 Today בווידג'ט</h1><p>כדי שהווידג'ט יראה את המשימות, השוברים וימי ההולדת שלכם, קודם נכנסים לחשבון Hania360.</p><a class="b" href="${back}">כניסה לחשבון</a>`);
  let key = cookieOf(request, "h360_wt");
  if (!okKey(key)) key = [...crypto.getRandomValues(new Uint8Array(40))].map((x) => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[x & 63]).join("") + "Wt";
  await (await box(env, key)).fetch("https://w/", { method: "POST", body: JSON.stringify({ op: "put", sess }) });
  const name = cut((d.user && d.user.displayName) || "", 20), app = "hania360://widget?t=" + key;
  const res = page("Today בווידג'ט", `<h1>✓ החשבון${name ? " של " + name.replace(/[<>&"]/g, "") : ""} מוכן</h1><p>עכשיו לוחצים כדי לחבר את הווידג'ט בטלפון הזה:</p><a class="b" href="${app}">📲 לחבר את הווידג'ט</a>
<p><small>אם לא קורה כלום, צריך את הגרסה החדשה של האפליקציה: <a class="l" href="https://hania360.com/app">להורדה</a>, ואז לחזור לכאן.</small></p><p><small>הווידג'ט רואה רק סיכום של היום (משימות, יומן, שוברים וימי הולדת), ולא יכול לשנות שום דבר.</small></p>`);
  const h = new Headers(res.headers); h.append("set-cookie", "h360_wt=" + key + "; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax");
  return new Response(res.body, { headers: h });
}
