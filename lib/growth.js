// Growth helpers for every Hania360 site served by this Worker:
// 1. Private usage counts: a tiny beacon counts page views, WhatsApp shares, calls and installs per app.
//    No cookies and no personal data: a visitor is a daily hash of the network address and browser,
//    kept only to count distinct visitors that day. The owner reads it at hania360.com/stats.
// 2. Link previews: every app page gets Open Graph tags and a 1200x630 image, so a link shared in
//    WhatsApp shows a picture, a title and a line about the app.

import OG from "../og/images.js";

export const APPS = {
  "hania360.com": ["Hania360", "חשבון אחד לכל האפליקציות של המשפחה: קניות, שוברים, טיסות, הזמנות, ימי הולדת ועוד. בחינם.", "home"],
  "home": ["HaniaHome", "כל מה שהבית לא יכול לפספס: מסמכים, רכב, חשבונות וחופשות, במסך אחד.", "homeapp"],
  "pick": ["HaniaPick · מי שוטף כלים?", "גלגל מזל צבעוני לתורנות הוגנת בבית.", "pick"],
  "park": ["HaniaPark · איפה החניתי?", "מפה לרכב, טיימר חניה ותזכורת לעצור את פנגו.", "park"],
  "quiz": ["HaniaQuiz · חידון לכל הבית", "המסך הגדול שואל, כל טלפון הוא באזר. מי עונה נכון ומהר מנצח.", "quiz"],
  "shabbat": ["HaniaShabbat · זמני שבת", "כניסת ויציאת שבת וחג לפי העיר, פרשת השבוע ותזכורת לפני הדלקת נרות.", "shabbat"],
  "gamad": ["HaniaGamad · גמד וענק", "הגרלה בלחיצה, קישור פרטי לכל אחד ורשימת משאלות. בלי פתקים.", "gamad"],
  "ride": ["HaniaRide · תורנות הסעות", "לוח הסעות משותף להורים, חלוקה הוגנת ותזכורת בערב שלפני.", "ride"],
  "caption": ["HaniaCaption · כתוביות לשיחה", "כל מה שנאמר בחדר באותיות גדולות, לכבדי שמיעה.", "caption"],
  "years": ["HaniaYears · סרטון גדילה", "מתמונות של הילד לסרטון מרגש מהלידה ועד היום.", "years"],
  "check": ["HaniaCheck · בודקים לפני שמשלמים", "רכב לפי מספר, חברה, קבלן, מתווך, עמותה, פנסיה ומחירי דירות, ממאגרי המדינה.", "check"],
  "plate": ["HaniaCheck · בודקים לפני שמשלמים", "רכב לפי מספר, חברה, קבלן, מתווך, עמותה, פנסיה ומחירי דירות, ממאגרי המדינה.", "check"],
  "tisa": ["HaniaTisa · הטיסה שלך ומה מגיע לך", "מעקב חי אחרי טיסות מנתב״ג, קישור למי שאוסף ופיצוי על עיכוב או ביטול.", "tisa"],
  "hazmana": ["HaniaHazmana · הזמנה ואישורי הגעה בחינם", "הזמנה מעוצבת, אישורי הגעה בוואטסאפ, ספירה חיה וסידור שולחנות.", "hazmana"],
  "sipur": ["HaniaSipur · סיפור לפני השינה", "סיפור חדש כל ערב, שנכתב רק לילד שלך, והטלפון מקריא.", "sipur"],
  "ezra": ["HaniaEzra · עזרה ראשונה", "החייאה, חנק, דימום ועוד, בצעדים גדולים. גם בלי אינטרנט.", "ezra"],
  "bills": ["HaniaBills · החשבונות של הבית", "כל החשבונות והמנויים: כמה יוצא בחודש ואיפה אפשר לחסוך.", "bills"],
};
export const appOf = (host) => (host === "hania360.com" || host === "www.hania360.com" ? "hania360.com" : host.endsWith(".hania360.com") ? host.slice(0, -".hania360.com".length) : "");

// ---- counting ---------------------------------------------------------------------------------
const EVENTS = ["view", "share", "call", "install", "action"];
const day = () => new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10);

export class StatsHub {
  constructor(ctx) {
    this.ctx = ctx;
    const sql = ctx.storage.sql;
    sql.exec("CREATE TABLE IF NOT EXISTS hits (day TEXT, app TEXT, ev TEXT, n INTEGER, PRIMARY KEY (day, app, ev))");
    sql.exec("CREATE TABLE IF NOT EXISTS uniq (day TEXT, app TEXT, v TEXT, PRIMARY KEY (day, app, v))");
  }
  async fetch(req) {
    const url = new URL(req.url), sql = this.ctx.storage.sql;
    if (url.pathname === "/hit") {
      const b = await req.json(); const d = day();
      sql.exec("INSERT INTO hits (day, app, ev, n) VALUES (?, ?, ?, 1) ON CONFLICT(day, app, ev) DO UPDATE SET n = n + 1", d, b.app, b.ev);
      if (b.ev === "view" && b.v) sql.exec("INSERT OR IGNORE INTO uniq (day, app, v) VALUES (?, ?, ?)", d, b.app, b.v);
      // Visitor hashes are only needed for today and the last month's counts.
      if (Math.random() < 0.01) { const old = new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10); sql.exec("DELETE FROM uniq WHERE day < ?", old); sql.exec("DELETE FROM hits WHERE day < ?", new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10)); }
      return new Response("ok");
    }
    if (url.pathname === "/report") {
      const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
      return Response.json({
        hits: [...sql.exec("SELECT day, app, ev, n FROM hits WHERE day >= ?", since)],
        uniq: [...sql.exec("SELECT day, app, COUNT(*) AS n FROM uniq WHERE day >= ? GROUP BY day, app", since)],
        uniq7: [...sql.exec("SELECT app, COUNT(DISTINCT v) AS n FROM uniq WHERE day >= ? GROUP BY app", new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10))],
      });
    }
    return new Response("not found", { status: 404 });
  }
}

export async function statApi(req, env, url, ctx) {
  const ok = new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  if (req.method !== "POST" || !env.STATS) return ok;
  const app = appOf(url.hostname); if (!APPS[app]) return ok;
  const body = await req.text().catch(() => ""); if (body.length > 200) return ok;
  let ev = "view"; try { ev = JSON.parse(body).e; } catch {}
  if (!EVENTS.includes(ev)) return ok;
  // Bots and link previews don't count.
  const ua = req.headers.get("user-agent") || ""; if (/bot|crawl|spider|preview|facebookexternalhit|whatsapp|slurp/i.test(ua)) return ok;
  const raw = (req.headers.get("cf-connecting-ip") || "") + "|" + ua + "|" + day() + "|hania360";
  const v = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))).slice(0, 8), (x) => x.toString(16).padStart(2, "0")).join("");
  // The owner's own phones carry a cookie (set when opening the dashboard) and are counted apart.
  const me = /(^|;\s*)h360_owner=1/.test(req.headers.get("cookie") || "");
  const p = env.STATS.get(env.STATS.idFromName("stats")).fetch("https://s/hit", { method: "POST", body: JSON.stringify({ app: APPS[app][2], ev: me ? "me:" + ev : ev, v: me ? "" : v }) }).catch(() => {});
  if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
  return ok;
}

const BEACON = `<script>(function(){try{var s=function(e){try{var b=JSON.stringify({e:e});if(navigator.sendBeacon)navigator.sendBeacon("/api/stat",b);else fetch("/api/stat",{method:"POST",body:b,keepalive:true})}catch(x){}};s("view");document.addEventListener("click",function(ev){var t=ev.target&&ev.target.closest&&ev.target.closest("a");if(!t)return;var h=t.getAttribute("href")||"";if(/wa\\.me|whatsapp/i.test(h))s("share");else if(/^tel:/.test(h))s("call")},true);window.addEventListener("appinstalled",function(){s("install")});if(navigator.share){var sh=navigator.share.bind(navigator);navigator.share=function(d){s("share");return sh(d)}}window.hStat=s}catch(e){}})();</script>`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
/** Adds the beacon and, where the page has none, the link preview tags. */
export function decorate(response, url) {
  const ct = response.headers.get("content-type") || "";
  if (response.status !== 200 || !/text\/html/.test(ct) || url.pathname.startsWith("/api/")) return response;
  const app = appOf(url.hostname), info = APPS[app];
  if (!info) return response;
  const hasOg = response.headers.get("x-og") === "1";
  let rw = new HTMLRewriter().on("body", { element(e) { e.append(BEACON, { html: true }); } });
  if (!hasOg) {
    const tags = `<meta property="og:type" content="website"><meta property="og:site_name" content="Hania360"><meta property="og:title" content="${esc(info[0])}"><meta property="og:description" content="${esc(info[1])}"><meta property="og:url" content="${esc(url.origin + url.pathname)}"><meta property="og:image" content="https://hania360.com/og/${info[2]}.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="he_IL"><meta name="twitter:card" content="summary_large_image">`;
    rw = rw.on("head", { element(e) { e.append(tags, { html: true }); } });
  }
  const out = rw.transform(response);
  out.headers.delete("x-og");
  return out;
}

export function ogImage(url) {
  const m = url.pathname.match(/^\/og\/([a-z0-9]+)\.jpg$/); if (!m || !OG[m[1]]) return null;
  return new Response(Uint8Array.from(atob(OG[m[1]]), (c) => c.charCodeAt(0)), { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=604800" } });
}

// ---- the owner's dashboard ----------------------------------------------------------------------
export async function statsPage(req, env, url) {
  const owner = { "set-cookie": "h360_owner=1; Domain=hania360.com; Path=/; Max-Age=157680000; Secure; HttpOnly; SameSite=Lax" };
  const page = (body, extra) => new Response(`<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Hania360 · שימוש</title><style>body{margin:0;background:#0B1424;color:#E6EEF8;font-family:system-ui,"Arial Hebrew",sans-serif}main{max-width:760px;margin:0 auto;padding:18px 14px 40px}h1{font-size:24px;margin:0 0 4px}p{color:#9DB0C8}table{width:100%;border-collapse:collapse;font-size:15px;font-variant-numeric:tabular-nums}th,td{padding:9px 6px;border-bottom:1px solid #1F3048;text-align:start}th{color:#9DB0C8;font-weight:600;font-size:13px}td b{font-weight:800}.k{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:14px 0}.k div{background:#13223A;border-radius:14px;padding:12px}.k small{display:block;color:#9DB0C8}.k b{font-size:28px}.bars{display:flex;align-items:flex-end;gap:3px;height:90px;margin:10px 0 18px}.bars i{flex:1;background:#38BDF8;border-radius:3px 3px 0 0;min-height:2px}.wrap{overflow-x:auto}</style></head><body><main>${body}</main></body></html>`, { headers: Object.assign({ "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" }, extra || {}) });
  if (!env.STATS_KEY) return page("<h1>מדידת שימוש</h1><p>כדי לראות את הנתונים צריך להגדיר סוד בשם <b>STATS_KEY</b> ב־Cloudflare (Worker hania360-home ← Settings ← Variables and Secrets), ואז לפתוח את הכתובת hania360.com/stats?k= עם הסוד.</p>");
  if (url.searchParams.get("k") !== env.STATS_KEY) return page("<h1>אין גישה</h1><p>הקישור צריך לכלול את הסוד הנכון.</p>");
  const r = await env.STATS.get(env.STATS.idFromName("stats")).fetch("https://s/report").then((x) => x.json());
  const today = day(), d7 = new Date(Date.now() - 6 * 864e5 + 2 * 3600e3).toISOString().slice(0, 10);
  const apps = {}, byDay = {};
  for (const h of r.hits) {
    const a = (apps[h.app] = apps[h.app] || { today: 0, w: 0, m: 0, share: 0, install: 0, call: 0, me: 0 });
    if (h.ev.startsWith("me:")) { if (h.ev === "me:view" && h.day >= d7) a.me += h.n; continue; }
    if (h.ev === "view") { a.m += h.n; if (h.day >= d7) a.w += h.n; if (h.day === today) a.today += h.n; byDay[h.day] = (byDay[h.day] || 0) + h.n; }
    else if (h.day >= d7) a[h.ev] = (a[h.ev] || 0) + h.n;
  }
  for (const u of r.uniq7) (apps[u.app] = apps[u.app] || { today: 0, w: 0, m: 0, share: 0, install: 0, call: 0, me: 0 }).u = u.n;
  const names = Object.fromEntries(Object.values(APPS).map((x) => [x[2], x[0].split(" ·")[0]]));
  const rows = Object.entries(apps).sort((a, b) => b[1].w - a[1].w || b[1].me - a[1].me);
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * 864e5 + 2 * 3600e3).toISOString().slice(0, 10)), max = Math.max(1, ...days.map((d) => byDay[d] || 0));
  const tot = rows.reduce((s, [, a]) => ({ w: s.w + a.w, u: s.u + (a.u || 0), share: s.share + (a.share || 0), install: s.install + (a.install || 0), me: s.me + a.me }), { w: 0, u: 0, share: 0, install: 0, me: 0 });
  return page(`<h1>שימוש באפליקציות</h1><p>7 הימים האחרונים, בלי הכניסות שלך (הן בעמודה "שלי"). בלי מידע אישי על המשתמשים.</p>
<div class="k"><div><small>צפיות של אחרים</small><b>${tot.w}</b></div><div><small>מבקרים (סכום לפי אפליקציה)</small><b>${tot.u}</b></div><div><small>שיתופים בוואטסאפ</small><b>${tot.share}</b></div><div><small>התקנות</small><b>${tot.install}</b></div><div><small>הכניסות שלך</small><b>${tot.me}</b></div></div>
<p>צפיות של אחרים ביום, 14 ימים (היום משמאל). הטלפון הזה מסומן כשלך, וכל טלפון שתפתח בו את הדף הזה יסומן גם.</p><div class="bars" role="img" aria-label="צפיות ביום">${days.map((d) => `<i title="${d}: ${byDay[d] || 0}" style="height:${Math.round(((byDay[d] || 0) / max) * 100)}%"></i>`).join("")}</div>
<div class="wrap"><table><tr><th>אפליקציה</th><th>היום</th><th>7 ימים</th><th>שלי</th><th>מבקרים</th><th>שיתופים</th><th>התקנות</th><th>30 יום</th></tr>${rows.map(([k, a]) => `<tr><td><b>${esc(names[k] || k)}</b></td><td>${a.today}</td><td>${a.w}</td><td>${a.me}</td><td>${a.u || 0}</td><td>${a.share || 0}</td><td>${a.install || 0}</td><td>${a.m}</td></tr>`).join("")}</table></div>`, owner);
}
