// "💬 משוב ובעיות": anyone can tell us about a problem or an idea, from any app. The form lives on
// hania360.com/feedback (each app links to it with its own name and page); the messages are kept in one Durable
// Object (FeedbackBox) and only the owner reads them, on hania360.com/feedback/admin. The owner's address is never
// in the code: it is the FEEDBACK_OWNER secret in Cloudflare, else AI_OWNER, else KASEFET_OWNER.
import { APPS } from "./growth.js";

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");
const js = (v) => JSON.stringify(v).replace(/</g, "\\u003c"); // a value inside a <script>
const ilDay = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
const KINDS = { bug: ["🐞", "בעיה"], idea: ["💡", "רעיון לשיפור"], other: ["💬", "אחר"] };
// the apps, by their short names (HaniaRace, not "HaniaRace · ..."), in the order of APPS
export const FB_APPS = Object.fromEntries([["general", "כללי / כל האתר"], ["hania360.com", "דף הבית hania360.com"]].concat(
  Object.entries(APPS).filter(([k]) => k !== "hania360.com").map(([k, v]) => [k, String(v[0]).split(" · ")[0]])));
const ownersOf = (env) => String(env.FEEDBACK_OWNER || env.AI_OWNER || env.KASEFET_OWNER || "").toLowerCase().split(/[\s,]+/).filter(Boolean);
const box = (env) => env.FEEDBACK.get(env.FEEDBACK.idFromName("all"));
const ask = (env, body) => box(env).fetch("https://feedback/", { method: "POST", body: JSON.stringify(body) });

// ---- the store: one SQLite Durable Object for all the messages ----
export class FeedbackBox {
  constructor(ctx, env) {
    this.ctx = ctx; this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS fb (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER, kind TEXT, app TEXT, page TEXT, text TEXT, email TEXT, dev TEXT, done INTEGER DEFAULT 0)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS rl (k TEXT, t INTEGER)"); // who sent how many, for the limits (a daily hash, not the address)
    this.sql.exec("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)");
  }
  async fetch(req) {
    const b = await req.json().catch(() => ({})), now = Date.now(), one = (q, ...a) => this.sql.exec(q, ...a).one().n;
    if (b.op === "add") {
      this.sql.exec("DELETE FROM rl WHERE t < ?", now - 86400e3);
      const k = String(b.k || "");
      // at most 5 in ten minutes and 20 a day from one sender, and 500 a day from everyone together
      if (one("SELECT COUNT(*) n FROM rl WHERE k = ? AND t > ?", k, now - 600e3) >= 5 || one("SELECT COUNT(*) n FROM rl WHERE k = ?", k) >= 20 || one("SELECT COUNT(*) n FROM rl") >= 500) return json({ error: "limit" }, 429);
      this.sql.exec("INSERT INTO rl (k, t) VALUES (?, ?)", k, now);
      this.sql.exec("INSERT INTO fb (t, kind, app, page, text, email, dev) VALUES (?, ?, ?, ?, ?, ?, ?)", now, b.kind, b.app, b.page, b.text, b.email, b.dev);
      // kept for a year; never more than 5000 (the oldest handled ones go first)
      this.sql.exec("DELETE FROM fb WHERE t < ?", now - 365 * 86400e3);
      const n = one("SELECT COUNT(*) n FROM fb");
      if (n > 5000) this.sql.exec("DELETE FROM fb WHERE id IN (SELECT id FROM fb ORDER BY done DESC, id ASC LIMIT ?)", n - 5000);
      return json({ ok: true });
    }
    if (b.op === "list") return json({ items: this.sql.exec("SELECT id, t, kind, app, page, text, email, dev, done FROM fb ORDER BY id DESC LIMIT 1000").toArray() });
    if (b.op === "mark") { this.sql.exec("UPDATE fb SET done = ? WHERE id = ?", b.done ? 1 : 0, Number(b.id) || 0); return json({ ok: true }); }
    if (b.op === "del") { this.sql.exec("DELETE FROM fb WHERE id = ?", Number(b.id) || 0); return json({ ok: true }); }
    // the owner's account (a hash of its Hania Pass id), so the homepage can show them how many are waiting
    if (b.op === "owner") { this.sql.exec("INSERT OR REPLACE INTO kv (k, v) VALUES ('owner', ?)", String(b.u || "")); return json({ ok: true }); }
    if (b.op === "badge") {
      const o = this.sql.exec("SELECT v FROM kv WHERE k = 'owner'").toArray()[0];
      return json(o && b.u && o.v === String(b.u) ? { n: one("SELECT COUNT(*) n FROM fb WHERE done = 0") } : {});
    }
    return json({ error: "op" }, 400);
  }
}

// how many messages wait for the owner (for "היום שלך" on the homepage); nothing for anyone else
export async function feedbackBadge(env, userId) {
  if (!env.FEEDBACK || !userId) return 0;
  const r = await ask(env, { op: "badge", u: await sha("fb|" + userId) }).catch(() => null);
  const j = r && r.ok ? await r.json().catch(() => ({})) : {};
  return j.n || 0;
}

// ---- the calls ----
// POST /api/feedback (anyone); /api/feedback/list, /mark, /del (the owner only)
export async function feedbackApi(request, env, url, passUser) {
  if (!env.FEEDBACK) return json({ error: "off" }, 503);
  if (request.method === "POST" && request.headers.get("origin") !== url.origin) return json({ error: "origin" }, 403);
  if (url.pathname === "/api/feedback") {
    if (request.method !== "POST") return json({ error: "method" }, 405);
    const b = (await request.json().catch(() => null)) || {};
    const text = String(b.text || "").replace(/\r/g, "").trim().slice(0, 1500), email = String(b.email || "").trim().slice(0, 200);
    // a field people never see (only robots fill it), and a form sent faster than anyone types: thanked and dropped
    if (b.hp || !(Number(b.ms) >= 2500)) return json({ ok: true });
    if (!KINDS[b.kind]) return json({ error: "kind" }, 400);
    if (text.length < 3) return json({ error: "text" }, 400);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "email" }, 400);
    const app = FB_APPS[b.app] ? b.app : "general", page = /^\/[^\s]{0,199}$/.test(String(b.page || "")) ? String(b.page) : "";
    const dev = String(b.dev || "").replace(/[^\w .,;:()\/×x+-]/g, "").slice(0, 220);
    const k = (await sha((request.headers.get("cf-connecting-ip") || "?") + "|" + ilDay())).slice(0, 20);
    const r = await ask(env, { op: "add", k, kind: b.kind, app, page, text, email, dev });
    return json(r.ok ? { ok: true } : { error: r.status === 429 ? "limit" : "store" }, r.ok ? 200 : r.status === 429 ? 429 : 502);
  }
  const who = await owner(request, env, passUser);
  if (!who) return json({ error: "not found" }, 404);
  if (url.pathname === "/api/feedback/list" && request.method === "GET") return ask(env, { op: "list" }).then((r) => new Response(r.body, { status: r.status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }));
  if ((url.pathname === "/api/feedback/mark" || url.pathname === "/api/feedback/del") && request.method === "POST") {
    const b = (await request.json().catch(() => null)) || {};
    const r = await ask(env, { op: url.pathname.endsWith("del") ? "del" : "mark", id: b.id, done: !!b.done });
    return json(r.ok ? { ok: true } : { error: "store" }, r.ok ? 200 : 502);
  }
  return json({ error: "not found" }, 404);
}

async function owner(request, env, passUser) {
  const owners = ownersOf(env);
  if (!owners.length) return null;
  const who = await passUser(request, env).catch(() => null);
  return who && who.email && owners.includes(who.email.toLowerCase()) ? who : null;
}

// ---- the pages ----
const HEAD = (title) => `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#FFFBF4"><meta name="robots" content="noindex, follow"><title>${esc(title)}</title><link rel="icon" href="/icons/icon-192.png"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700;800&family=Secular+One&display=swap">`;
const CSS = `*{box-sizing:border-box}body{margin:0;background:#FFFBF4;color:#17133A;font-family:Rubik,system-ui,-apple-system,"Segoe UI",Arial,sans-serif;line-height:1.5}
a{color:#7B3FE4}.w{max-width:640px;margin:0 auto;padding:18px 16px 40px}.top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}
.brand{font:400 21px/1 "Secular One",Rubik,sans-serif;color:#17133A;text-decoration:none}h1{font:400 clamp(28px,7vw,38px)/1.1 "Secular One",Rubik,sans-serif;margin:8px 0 6px}
.sub{color:#4A4570;margin:0 0 18px;font-size:16.5px}.card{background:#fff;border:1px solid rgba(23,19,58,.08);border-radius:22px;padding:18px;box-shadow:0 10px 30px rgba(23,19,58,.06)}
label.l{display:block;font-weight:700;margin:14px 0 6px}.kinds{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.kinds button{appearance:none;border:2px solid rgba(23,19,58,.14);background:#fff;border-radius:16px;padding:12px 6px;font:inherit;font-weight:700;font-size:15px;cursor:pointer;color:#17133A;display:grid;gap:2px;justify-items:center}
.kinds button span{font-size:26px}.kinds button[aria-pressed="true"]{border-color:#7B3FE4;background:#F4ECFF}
select,textarea,input[type=email]{width:100%;font:inherit;font-size:16px;color:#17133A;border:2px solid rgba(23,19,58,.14);border-radius:14px;padding:11px 12px;background:#fff}
textarea{min-height:140px;resize:vertical}select:focus,textarea:focus,input:focus,.kinds button:focus-visible{outline:3px solid rgba(123,63,228,.35);outline-offset:1px}
.n{font-size:13px;color:#6B6690;margin-top:6px}.go{appearance:none;border:0;border-radius:16px;background:linear-gradient(90deg,#FF7A59,#FF9F3B);color:#fff;font:inherit;font-weight:800;font-size:17px;padding:13px 22px;cursor:pointer;width:100%;margin-top:18px}
.go:disabled{opacity:.6}.hp{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.err{color:#C92A2A;font-weight:700;margin-top:10px}
.done{text-align:center;padding:26px 10px}.done b{display:block;font:400 30px/1.2 "Secular One",Rubik,sans-serif;margin:8px 0}.e{font-size:54px}`;

export function feedbackPage(url) {
  const app = FB_APPS[url.searchParams.get("app")] ? url.searchParams.get("app") : "general";
  const page = /^\/[^\s]{0,199}$/.test(url.searchParams.get("p") || "") ? url.searchParams.get("p") : "";
  const opts = Object.entries(FB_APPS).map(([k, n]) => `<option value="${esc(k)}"${k === app ? " selected" : ""}>${esc(n)}</option>`).join("");
  const back = app !== "general" && app !== "hania360.com" ? `https://${app}.hania360.com${page || "/"}` : "https://hania360.com/";
  return new Response(`${HEAD("משוב ובעיות · Hania360")}<meta name="description" content="מצאתם תקלה או שיש לכם רעיון לשיפור באחת מאפליקציות Hania360? כתבו לנו כאן."><style>${CSS}</style></head><body><div class="w">
<div class="top"><a class="brand" href="https://hania360.com/">Hania360</a><a href="${esc(back)}">→ חזרה</a></div>
<main id="m"><h1>💬 משוב ובעיות</h1><p class="sub">מצאתם תקלה? יש לכם רעיון שיעשה משהו טוב יותר? כתבו לנו. אנחנו קוראים כל הודעה.</p>
<form class="card" id="f" novalidate>
<label class="l" id="kl">מה תרצו לספר?</label><div class="kinds" role="group" aria-labelledby="kl">${Object.entries(KINDS).map(([k, v], i) => `<button type="button" data-k="${k}" aria-pressed="${i === 0}"><span aria-hidden="true">${v[0]}</span>${v[1]}</button>`).join("")}</div>
<label class="l" for="app">על איזו אפליקציה?</label><select id="app">${opts}</select>
<label class="l" for="t" id="tl">מה קרה?</label><textarea id="t" maxlength="1500" required placeholder="למשל: בטלפון שלי הכפתור לא מגיב כשאני..."></textarea>
<label class="l" for="em">רוצים שנחזור אליכם? (לא חובה)</label><input type="email" id="em" maxlength="200" autocomplete="email" placeholder="המייל שלכם" dir="ltr">
<div class="hp" aria-hidden="true"><label for="site">אתר</label><input id="site" tabindex="-1" autocomplete="off"></div>
<p class="n">נצרף לבד את שם האפליקציה, הדף שבו הייתם וסוג המכשיר, כדי שנבין מהר מה קרה. לא נשמר שום דבר אחר. <a href="/privacy#feedback">פרטיות</a></p>
<button class="go" type="submit" id="go">שליחה</button><p class="err" id="er" role="alert" hidden></p></form></main></div>
<script>(function(){var t0=Date.now(),kind="bug",$=function(i){return document.getElementById(i)},PH={bug:["מה קרה?","למשל: בטלפון שלי הכפתור לא מגיב כשאני..."],idea:["מה הרעיון?","למשל: היה עוזר אם אפשר היה..."],other:["מה תרצו לכתוב?",""]};
document.querySelectorAll(".kinds button").forEach(function(b){b.onclick=function(){kind=b.getAttribute("data-k");document.querySelectorAll(".kinds button").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});$("tl").textContent=PH[kind][0];$("t").placeholder=PH[kind][1]}});
var page=${js(page)};
$("f").addEventListener("submit",function(e){e.preventDefault();var er=$("er"),txt=$("t").value.trim(),em=$("em").value.trim();er.hidden=true;
 if(txt.length<3){er.textContent="כתבו לנו כמה מילים";er.hidden=false;$("t").focus();return}
 if(em&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(em)){er.textContent="המייל לא נראה תקין";er.hidden=false;$("em").focus();return}
 var dev=[(navigator.userAgentData&&navigator.userAgentData.platform)||"",(navigator.userAgent.match(/(Android [\\d.]+|iPhone OS [\\d_]+|iPad|Windows NT [\\d.]+|Mac OS X [\\d_]+|CrOS|Linux)/)||[""])[0],(navigator.userAgent.match(/(SamsungBrowser|EdgA?|OPR|Firefox|CriOS|Chrome|Version)\\/[\\d]+/)||[""])[0],screen.width+"x"+screen.height,(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)?"app":"web"].filter(Boolean).join(" ; ");
 var go=$("go");go.disabled=true;go.textContent="שולחים...";
 fetch("/api/feedback",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind:kind,app:$("app").value,page:page,text:txt,email:em,dev:dev,hp:$("site").value,ms:Date.now()-t0})}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok)throw new Error(j.error||"x")})}).then(function(){
  $("m").innerHTML='<div class="card done"><div class="e">🙏</div><b>תודה! קיבלנו.</b><p class="sub">'+(em?"נחזור אליכם למייל אם יהיה צורך.":"כל הודעה עוזרת לנו לשפר.")+'</p><a href="'+${js(back)}+'">→ חזרה</a></div>';window.scrollTo(0,0)
 }).catch(function(x){go.disabled=false;go.textContent="שליחה";er.textContent=x&&x.message==="limit"?"שלחתם כמה הודעות ברצף. נסו שוב בעוד כמה דקות":"לא הצלחנו לשלוח. בדקו את החיבור ונסו שוב";er.hidden=false})});
})()</script></body></html>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300", "x-og": "1", "referrer-policy": "strict-origin-when-cross-origin" } });
}

// GET /feedback/admin: the owner reads, marks as handled and deletes. Anyone else: not found.
export async function feedbackAdmin(request, env, url, passUser, ctx) {
  const nf = () => new Response("Not found", { status: 404, headers: { "content-type": "text/plain", "cache-control": "no-store", "x-robots-tag": "noindex" } });
  if (!env.FEEDBACK || !ownersOf(env).length) return nf();
  const who = await passUser(request, env).catch(() => null);
  if (who === null) return Response.redirect("https://pass.hania360.com/?return=" + encodeURIComponent("https://hania360.com/feedback/admin"), 302);
  if (!who || !ownersOf(env).includes(String(who.email || "").toLowerCase())) return nf();
  // remember which account is the owner's, so "היום שלך" on the homepage can say how many are waiting
  const p = sha("fb|" + who.id).then((u) => ask(env, { op: "owner", u })).catch(() => {});
  if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
  const KJ = JSON.stringify(KINDS), AJ = JSON.stringify(FB_APPS);
  return new Response(`${HEAD("פניות משתמשים · Hania360")}<style>${CSS}
.w{max-width:860px}.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0 14px}.bar button{appearance:none;border:2px solid #17133A;background:#fff;border-radius:999px;padding:7px 14px;font:inherit;font-weight:700;cursor:pointer}
.bar button[aria-pressed="true"]{background:#17133A;color:#fff}.bar select{width:auto;padding:7px 10px}.it{background:#fff;border:1px solid rgba(23,19,58,.08);border-radius:18px;padding:14px 16px;margin-bottom:10px}
.it.dn{opacity:.55}.it h3{margin:0 0 4px;font-size:15px;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center}.it h3 small{color:#6B6690;font-weight:500}.it p{margin:6px 0;white-space:pre-wrap;font-size:16.5px}
.it .m{font-size:13px;color:#6B6690;word-break:break-word}.it .a{display:flex;gap:8px;margin-top:8px}.it .a button{appearance:none;border:1.5px solid rgba(23,19,58,.18);background:#fff;border-radius:12px;padding:6px 12px;font:inherit;font-weight:700;cursor:pointer}
.it .a .ok{border-color:#2F9E44;color:#2F9E44}.cnt{color:#6B6690}.empty{text-align:center;color:#6B6690;padding:30px}</style></head><body><div class="w">
<div class="top"><a class="brand" href="https://hania360.com/">Hania360</a><a href="/feedback">הטופס →</a></div>
<h1>💬 פניות משתמשים</h1><div class="bar" id="bar"><button type="button" data-s="open" aria-pressed="true">פתוחות</button><button type="button" data-s="done" aria-pressed="false">טופלו</button><button type="button" data-s="all" aria-pressed="false">הכול</button>
<select id="fa" aria-label="אפליקציה"><option value="">כל האפליקציות</option></select><select id="fk" aria-label="סוג"><option value="">כל הסוגים</option></select><span class="cnt" id="cnt"></span></div><div id="L"><p class="empty">טוען...</p></div></div>
<script>(function(){var K=${KJ.replace(/</g, "\\u003c")},A=${AJ.replace(/</g, "\\u003c")},S="open",items=[],$=function(i){return document.getElementById(i)},E=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
Object.keys(K).forEach(function(k){$("fk").insertAdjacentHTML("beforeend",'<option value="'+k+'">'+K[k][0]+" "+K[k][1]+"</option>")});
function when(t){return new Date(t).toLocaleString("he-IL",{timeZone:"Asia/Jerusalem",day:"numeric",month:"numeric",year:"2-digit",hour:"2-digit",minute:"2-digit"})}
function url(x){if(!x.page)return"";var h=x.app==="general"||x.app==="hania360.com"?"hania360.com":x.app+".hania360.com";return"https://"+h+x.page}
function draw(){var fa=$("fa").value,fk=$("fk").value,v=items.filter(function(x){return(S==="all"||(S==="done")===!!x.done)&&(!fa||x.app===fa)&&(!fk||x.kind===fk)});
 $("cnt").textContent=v.length+" מתוך "+items.length;
 $("L").innerHTML=v.length?v.map(function(x){var k=K[x.kind]||["💬",""],u=url(x);return'<article class="it'+(x.done?" dn":"")+'"><h3><span>'+k[0]+" "+E(k[1])+'</span><span>'+E(A[x.app]||x.app)+'</span><small>'+when(x.t)+'</small></h3><p>'+E(x.text)+'</p><div class="m">'+(u?'📍 <a href="'+E(u)+'" target="_blank" rel="noopener">'+E(x.page)+"</a> · ":"")+(x.dev?"📱 "+E(x.dev):"")+(x.email?' · ✉️ <a href="mailto:'+E(x.email)+'">'+E(x.email)+"</a>":"")+'</div><div class="a"><button type="button" class="'+(x.done?"":"ok")+'" data-id="'+x.id+'" data-op="mark">'+(x.done?"↩️ להחזיר לפתוחות":"✓ טופל")+'</button><button type="button" data-id="'+x.id+'" data-op="del">🗑️ מחיקה</button></div></article>'}).join(""):'<p class="empty">'+(S==="open"?"אין פניות פתוחות 🎉":"אין כאן פניות")+"</p>"}
function load(){fetch("/api/feedback/list",{credentials:"same-origin",cache:"no-store"}).then(function(r){return r.json()}).then(function(j){items=j.items||[];var seen={};items.forEach(function(x){seen[x.app]=1});var fa=$("fa"),cur=fa.value;fa.innerHTML='<option value="">כל האפליקציות</option>'+Object.keys(seen).map(function(a){return'<option value="'+E(a)+'"'+(a===cur?" selected":"")+">"+E(A[a]||a)+"</option>"}).join("");draw()}).catch(function(){$("L").innerHTML='<p class="empty">לא הצלחנו לטעון. רעננו את הדף</p>'})}
function post(p,b){return fetch(p,{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify(b)}).then(function(r){if(!r.ok)throw 0})}
$("bar").addEventListener("click",function(e){var b=e.target.closest("button[data-s]");if(!b)return;S=b.getAttribute("data-s");document.querySelectorAll("#bar button").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});draw()});
$("fa").onchange=draw;$("fk").onchange=draw;
$("L").addEventListener("click",function(e){var b=e.target.closest("button[data-op]");if(!b)return;var id=+b.getAttribute("data-id"),x=items.filter(function(i){return i.id===id})[0];if(!x)return;
 if(b.getAttribute("data-op")==="del"){if(!confirm("למחוק את הפנייה?"))return;post("/api/feedback/del",{id:id}).then(function(){items=items.filter(function(i){return i.id!==id});draw()}).catch(function(){alert("לא נמחק. נסו שוב")})}
 else post("/api/feedback/mark",{id:id,done:!x.done}).then(function(){x.done=x.done?0:1;draw()}).catch(function(){alert("לא נשמר. נסו שוב")})});
load();})()</script></body></html>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "referrer-policy": "no-referrer", "x-frame-options": "DENY" } });
}
