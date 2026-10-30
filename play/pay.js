// מועדון הערב – תשלום בביט או בפייבוקס, בלי סולקת.
// הלקוח מעביר את הסכום עם קוד בן 4 ספרות בהערה ולוחץ "שילמתי", והמשחק נפתח לו מיד.
// המנהל מקבל התראה ומסמן ✓ או ✗ בדף /admin. מי שסומן ✗ לא יכול להזמין שוב עד שיסדיר.
// אישור אוטומטי: אפליקציה באנדרואיד (למשל MacroDroid) שולחת את ההתראה של ביט או פייבוקס
// ל־/api/pay/notify, והשרת מחפש בה את הקוד ואת הסכום.

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const rid = (n = 16) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');
const now = () => new Date().toISOString();
const MAX_OPEN_CLAIMS = 2;   // כמה "שילמתי" שעוד לא אושרו מותר לאדם אחד באותו זמן

// ---- settings (in PlayStore) -----------------------------------------------------------------
export async function settings(env) {
  const rows = (await env.DB.prepare('SELECT k, v FROM settings').all()).results || [];
  const s = {}; for (const r of rows) s[r.k] = r.v;
  if (!s.notify_token) { s.notify_token = rid(16); await env.DB.prepare('INSERT OR IGNORE INTO settings(k,v) VALUES(?,?)').bind('notify_token', s.notify_token).run(); }
  return s;
}
export const payReady = (s) => !!(s.bit_phone || s.paybox_phone || s.paybox_link);
const phoneOk = (v) => { const d = String(v || '').replace(/[^\d]/g, ''); return /^0\d{8,9}$/.test(d) ? d.replace(/^(\d{3})(\d+)$/, '$1-$2') : ''; };
const linkOk = (v) => { try { const u = new URL(String(v || '').trim()); return u.protocol === 'https:' && /(^|\.)payboxapp\.(page\.link|com)$|(^|\.)paybox\.co\.il$|(^|\.)bitpay\.co\.il$/.test(u.hostname) ? u.href : ''; } catch { return ''; } };

/** מי שסומן ✗ או שיש לו יותר מדי תשלומים שעוד לא אושרו – לא מזמין עכשיו */
export async function payBlock(env, user) {
  const bad = await env.DB.prepare("SELECT id, price FROM orders WHERE user_id=? AND review='bad' LIMIT 1").bind(user.id).first();
  if (bad) return { code: 'unpaid', message: `לא מצאנו את התשלום על הזמנה קודמת (${bad.price} ₪). אחרי שתעבירו אותו ונאשר, אפשר להמשיך. אם כבר שילמתם, זה יסתדר ברגע שנמצא את ההעברה.` };
  const open = await env.DB.prepare("SELECT COUNT(*) n FROM orders WHERE user_id=? AND review='pending'").bind(user.id).first();
  if ((open?.n || 0) >= MAX_OPEN_CLAIMS) return { code: 'claims_pending', message: 'יש לכם תשלומים שעוד מחכים לאישור. ברגע שנאשר אותם, אפשר להזמין עוד.' };
  return null;
}

/** נותן להזמנה קוד תשלום ומחזיר את מה שהלקוח צריך כדי להעביר */
export async function manualPay(env, orderId) {
  const s = await settings(env);
  let code = '';
  for (let i = 0; i < 10 && !code; i++) {
    const c = String(1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000));
    const used = await env.DB.prepare("SELECT 1 FROM orders WHERE pay_code=? AND created_at>?").bind(c, new Date(Date.now() - 14 * 864e5).toISOString()).first();
    if (!used) code = c;
  }
  await env.DB.prepare('UPDATE orders SET pay_code=? WHERE id=?').bind(code, orderId).run();
  return { mode: 'manual', code, bit: s.bit_phone || '', paybox: s.paybox_phone || '', payboxLink: s.paybox_link || '', name: s.payee_name || '' };
}

/** "שילמתי": המשחק נפתח מיד, והמנהל מקבל התראה לבדוק */
export async function claim(env, user, o, method, grantPass) {
  if (o.status === 'paid') return;
  if (o.status !== 'pending' || !o.pay_code) throw Object.assign(new Error('bad_state'), { status: 409 });
  const block = await payBlock(env, user);
  if (block) throw Object.assign(new Error(block.message), { status: 402, code: block.code });
  const r = await env.DB.prepare("UPDATE orders SET status='paid', paid_at=?, provider='manual', provider_ref=?, review=CASE WHEN review='ok' THEN 'ok' ELSE 'pending' END, claimed_at=? WHERE id=? AND status='pending'")
    .bind(now(), method === 'paybox' ? 'paybox' : 'bit', now(), o.id).run();
  if (r.meta && r.meta.changes === 1) {
    await grantPass(env, o);
    const fresh = await env.DB.prepare('SELECT review FROM orders WHERE id=?').bind(o.id).first();
    if (fresh && fresh.review === 'pending') await push(env, { title: `💰 ${o.price} ₪ ב${method === 'paybox' ? 'פייבוקס' : 'ביט'} · קוד ${o.pay_code}`, body: `${user.email || 'משתמש'} סימן/ה ששילם/ה על ${o.tier}. לבדוק ולסמן ✓.` });
  }
}

// ---- automatic confirmation from the phone ---------------------------------------------------------
/** מקבל את הטקסט של ההתראה מביט או מפייבוקס, ומאשר את ההזמנה שמתאימה לקוד או לסכום */
export async function notify(request, env, grantPass) {
  const s = await settings(env), url = new URL(request.url);
  if (url.searchParams.get('t') !== s.notify_token) return json({ error: 'forbidden' }, 403);
  const raw = (await request.text()).slice(0, 2000);
  let text = raw; try { const j = JSON.parse(raw); text = [j.title, j.text, j.body, j.message].filter(Boolean).join(' ') || raw; } catch {}
  text = text.replace(/\s+/g, ' ').trim();
  const amountM = text.match(/(\d{1,5}(?:[.,]\d{1,2})?)\s*(?:₪|ש"ח|ש״ח|שח|ILS)|(?:₪|ש"ח|ש״ח)\s*(\d{1,5}(?:[.,]\d{1,2})?)/);
  const amount = amountM ? Math.round(parseFloat((amountM[1] || amountM[2]).replace(',', '.'))) : null;
  const codes = [...text.matchAll(/(?<![\d.,])(\d{4})(?![\d.,])/g)].map((m) => m[1]).filter((c) => +c !== amount);
  const since = new Date(Date.now() - 3 * 864e5).toISOString();
  let o = null, how = '';
  for (const c of codes) {
    o = await env.DB.prepare("SELECT * FROM orders WHERE pay_code=? AND review!='ok' AND created_at>? ORDER BY created_at DESC LIMIT 1").bind(c, since).first();
    if (o && (amount == null || amount >= o.price)) { how = 'קוד ' + c; break; }
    o = null;
  }
  if (!o && amount != null) {
    // בלי קוד: רק אם יש בדיוק הזמנה אחת שמחכה עם הסכום הזה
    const rows = (await env.DB.prepare("SELECT * FROM orders WHERE price=? AND review='pending' AND claimed_at>? LIMIT 2").bind(amount, since).all()).results || [];
    if (rows.length === 1) { o = rows[0]; how = 'סכום ' + amount + ' ₪'; }
  }
  await env.DB.prepare('INSERT INTO pay_log(at,text,order_id,how) VALUES(?,?,?,?)').bind(now(), text.slice(0, 400), o ? o.id : '', how).run();
  await env.DB.prepare('DELETE FROM pay_log WHERE at<?').bind(new Date(Date.now() - 60 * 864e5).toISOString()).run();
  if (!o) return json({ ok: true, matched: false });
  if (o.status === 'pending') {
    // שילמו ועוד לא לחצו "שילמתי": המשחק נפתח להם כבר עכשיו
    const r = await env.DB.prepare("UPDATE orders SET status='paid', paid_at=?, provider='manual', provider_ref='auto', review='ok', claimed_at=? WHERE id=? AND status='pending'").bind(now(), now(), o.id).run();
    if (r.meta && r.meta.changes === 1) await grantPass(env, o);
  } else {
    await env.DB.prepare("UPDATE orders SET review='ok' WHERE id=?").bind(o.id).run();
  }
  return json({ ok: true, matched: true, order: o.id.slice(-8), how });
}

// ---- admin (/admin?k=STATS_KEY) --------------------------------------------------------------------
const isAdmin = (request, env) => {
  const k = request.headers.get('x-admin-key') || new URL(request.url).searchParams.get('k') || '';
  return !!(env.STATS_KEY && k && k.length === env.STATS_KEY.length && k === env.STATS_KEY);
};
export async function adminApi(request, env, path, grantPass) {
  if (!isAdmin(request, env)) return json({ error: 'forbidden' }, 403);
  const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
  if (path === '/api/admin/settings' && request.method === 'POST') {
    const put = (k, v) => env.DB.prepare('INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(k, v).run();
    if (body.bit_phone !== undefined) await put('bit_phone', phoneOk(body.bit_phone));
    if (body.paybox_phone !== undefined) await put('paybox_phone', phoneOk(body.paybox_phone));
    if (body.paybox_link !== undefined) await put('paybox_link', linkOk(body.paybox_link));
    if (body.payee_name !== undefined) await put('payee_name', String(body.payee_name || '').replace(/[<>]/g, '').trim().slice(0, 30));
    if (body.new_token) await put('notify_token', rid(16));
  }
  if (path === '/api/admin/review' && request.method === 'POST') {
    const o = await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(String(body.id || '')).first();
    if (!o) return json({ error: 'not_found' }, 404);
    const v = body.v === 'ok' ? 'ok' : body.v === 'bad' ? 'bad' : 'pending';
    if (v === 'ok' && o.status === 'pending') { await env.DB.prepare("UPDATE orders SET status='paid', paid_at=?, provider='manual', provider_ref='admin' WHERE id=? AND status='pending'").bind(now(), o.id).run(); await grantPass(env, o); }
    await env.DB.prepare('UPDATE orders SET review=? WHERE id=?').bind(v, o.id).run();
  }
  if (path === '/api/admin/push' && request.method === 'POST') { await pushSub(env, body.sub); }
  if (path === '/api/admin/push-key') return json({ key: await pushKey(env) });
  const s = await settings(env);
  const list = (q) => env.DB.prepare(q).all().then((r) => (r.results || []).map((o) => ({ id: o.id, email: o.email, tier: o.tier, price: o.price, code: o.pay_code, method: o.provider_ref, review: o.review, status: o.status, at: o.claimed_at || o.created_at })));
  return json({
    settings: { bit_phone: s.bit_phone || '', paybox_phone: s.paybox_phone || '', paybox_link: s.paybox_link || '', payee_name: s.payee_name || '' },
    notifyUrl: new URL(request.url).origin + '/api/pay/notify?t=' + s.notify_token,
    waiting: await list("SELECT * FROM orders WHERE review='pending' ORDER BY claimed_at DESC LIMIT 50"),
    bad: await list("SELECT * FROM orders WHERE review='bad' ORDER BY created_at DESC LIMIT 50"),
    open: await list("SELECT * FROM orders WHERE status='pending' AND pay_code!='' AND created_at>'" + new Date(Date.now() - 3 * 864e5).toISOString() + "' ORDER BY created_at DESC LIMIT 30"),
    done: await list("SELECT * FROM orders WHERE review='ok' ORDER BY claimed_at DESC LIMIT 30"),
    log: ((await env.DB.prepare('SELECT * FROM pay_log ORDER BY at DESC LIMIT 20').all()).results || []),
    totals: await env.DB.prepare("SELECT COUNT(*) n, COALESCE(SUM(price),0) sum FROM orders WHERE review='ok'").first(),
  });
}

// ---- push to the admin's phone (the keys and subscriptions live in PlayStore) -------------------------
const store = (env) => env.PLAYDB.get(env.PLAYDB.idFromName('store'));
const pushCall = (env, b) => store(env).fetch('https://db/push', { method: 'POST', body: JSON.stringify(b) }).then((r) => r.json()).catch(() => ({}));
export const pushKey = async (env) => (await pushCall(env, { op: 'key' })).key;
export const pushSub = (env, sub) => pushCall(env, { op: 'sub', sub });
export const push = (env, msg) => pushCall(env, { op: 'send', msg });
export const pushMsg = (env, endpoint) => pushCall(env, { op: 'msg', endpoint });

export const ADMIN_PAGE = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>מועדון הערב · ניהול תשלומים</title>
<style>:root{--bg:#13211c;--card:#1b2d26;--ink:#f3ead8;--muted:#a9b8ae;--gold:#d8b25a;--ok:#4fbf83;--bad:#e26d5a;--line:#2c4238}*{box-sizing:border-box}[hidden]{display:none!important}
body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,"Segoe UI",Arial,sans-serif;padding:14px max(14px,env(safe-area-inset-right)) 40px}
.w{max-width:640px;margin:0 auto;display:grid;gap:12px}h1{margin:0;font-size:22px}h2{margin:0;font-size:17px;display:flex;justify-content:space-between;gap:8px}
.c{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;display:grid;gap:10px}
label{display:grid;gap:4px;font-size:13px;color:var(--muted)}input{font:inherit;font-size:16px;padding:9px 11px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);width:100%}
button{font:inherit;font-weight:700;border:0;border-radius:10px;padding:9px 14px;cursor:pointer;background:var(--gold);color:#1a1a1a}button.g{background:transparent;color:var(--ink);border:1px solid var(--line)}
.o{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:10px;border-radius:12px;background:var(--bg)}
.o b{font-size:16px}.o small{color:var(--muted);display:block;overflow-wrap:anywhere}.btns{display:flex;gap:6px}.ok{background:var(--ok)}.bad{background:var(--bad);color:#fff}
.m{color:var(--muted);font-size:13.5px;margin:0}code{background:var(--bg);padding:6px 8px;border-radius:8px;display:block;overflow-wrap:anywhere;direction:ltr;text-align:left;font-size:12.5px}
.big{font-size:26px;font-weight:800;color:var(--gold)}@media(max-width:480px){.o{grid-template-columns:1fr}}ol{margin:0;padding-inline-start:20px;display:grid;gap:4px;font-size:14px}</style></head><body><div class="w">
<h1>🎲 מועדון הערב · תשלומים</h1><div id="err" class="c" hidden>הקישור לא תקין. פותחים את הדף עם ?k= והמפתח של הסטטיסטיקה.</div>
<div id="app" hidden style="display:grid;gap:12px">
<div class="c"><h2>מחכים לבדיקה <span id="sum" class="m"></span></h2><p class="m">המשחק כבר נפתח ללקוח. בודקים בביט או בפייבוקס שהכסף הגיע, עם הקוד בהערה, ומסמנים.</p><div id="waiting" style="display:grid;gap:8px"></div></div>
<div class="c"><h2>🔔 התראות לטלפון הזה</h2><button id="pushBtn">להפעיל התראה על כל "שילמתי"</button></div>
<div class="c"><h2>פרטי התשלום שהלקוחות רואים</h2>
<label>מספר לביט<input id="bit" inputmode="tel" dir="ltr"></label><label>מספר לפייבוקס<input id="pb" inputmode="tel" dir="ltr"></label>
<label>קישור תשלום בפייבוקס (לא חובה)<input id="pbl" dir="ltr" placeholder="https://payboxapp.page.link/..."></label><label>השם שיופיע (לא חובה)<input id="nm" maxlength="30"></label>
<button id="save">שמירה</button><p class="m">בלי מספר אחד לפחות, הלקוחות רואים "התשלום ייפתח בקרוב".</p></div>
<div class="c"><h2>🤖 אישור אוטומטי מאנדרואיד</h2><p class="m">אפליקציה בטלפון שולחת לכאן כל התראה של ביט או פייבוקס, והשרת מאשר לבד את ההזמנה עם הקוד או הסכום.</p>
<ol><li>מתקינים את MacroDroid מ־Google Play.</li><li>טריגר: "התראה התקבלה" (Notification Received), מהאפליקציות bit ו־PayBox.</li><li>פעולה: "בקשת HTTP" (HTTP Request), שיטה POST, לכתובת שלמטה, ובגוף ההודעה (Body) המשתנים [notification_title] [notification].</li><li>שומרים, ומאשרים ל־MacroDroid גישה להתראות.</li></ol>
<code id="nurl"></code><div class="btns"><button class="g" id="copy">העתקה</button><button class="g" id="newtok">כתובת חדשה</button></div>
<p class="m">הכתובת היא סוד: מי שיש לו אותה יכול לאשר תשלומים. אם דלפה, לוחצים "כתובת חדשה" ומעדכנים ב־MacroDroid.</p>
<h2 style="margin-top:6px">התראות אחרונות שהגיעו</h2><div id="log" style="display:grid;gap:6px"></div></div>
<div class="c"><h2>לא שולם ✗</h2><div id="bad" style="display:grid;gap:8px"></div></div>
<div class="c"><h2>הזמנות פתוחות (לפני "שילמתי")</h2><div id="open" style="display:grid;gap:8px"></div></div>
<div class="c"><h2>אושרו לאחרונה</h2><div id="done" style="display:grid;gap:8px"></div></div>
</div></div>
<script>(function(){var K=new URLSearchParams(location.search).get("k")||"";try{if(K)localStorage.setItem("play_admin",K);else K=localStorage.getItem("play_admin")||""}catch(e){}if(location.search)history.replaceState(null,"","/admin");var $=function(i){return document.getElementById(i)};
function el(t,a,k){var e=document.createElement(t);for(var x in a||{}){if(x==="text")e.textContent=a[x];else if(x.slice(0,2)==="on")e.addEventListener(x.slice(2),a[x]);else e.setAttribute(x,a[x])}(k||[]).forEach(function(c){if(c)e.append(c)});return e}
function api(p,b){return fetch(p,b?{method:"POST",headers:{"content-type":"application/json","x-admin-key":K},body:JSON.stringify(b)}:{headers:{"x-admin-key":K}}).then(function(r){if(r.status===403)throw new Error("k");return r.json()})}
var when=function(t){try{return new Date(t).toLocaleString("he-IL",{day:"numeric",month:"numeric",hour:"2-digit",minute:"2-digit"})}catch(e){return""}};
function row(o,acts){return el("div",{class:"o"},[el("div",{},[el("b",{text:o.price+" ₪ · קוד "+(o.code||"—")+(o.method?" · "+({bit:"ביט",paybox:"פייבוקס",auto:"אוטומטי",admin:"ידני"}[o.method]||o.method):"")}),el("small",{text:o.email+" · "+o.tier+" · "+when(o.at)})]),acts?el("div",{class:"btns"},acts):null])}
function rev(id,v){api("/api/admin/review",{id:id,v:v}).then(paint)}
function paint(d){$("app").hidden=false;var S=d.settings;["bit","pb","pbl","nm"].forEach(function(i,n){var k=["bit_phone","paybox_phone","paybox_link","payee_name"][n];if(document.activeElement!==$(i))$(i).value=S[k]});
$("nurl").textContent=d.notifyUrl;$("sum").textContent="אושרו "+d.totals.n+" · "+d.totals.sum+" ₪";
$("waiting").replaceChildren.apply($("waiting"),d.waiting.length?d.waiting.map(function(o){return row(o,[el("button",{class:"ok",text:"✓ הגיע",onclick:function(){rev(o.id,"ok")}}),el("button",{class:"bad",text:"✗ לא הגיע",onclick:function(){if(confirm("לסמן שלא שולם? הלקוח לא יוכל להזמין עוד עד שיסדיר."))rev(o.id,"bad")}})])}):[el("p",{class:"m",text:"אין כרגע. 👌"})]);
$("bad").replaceChildren.apply($("bad"),d.bad.length?d.bad.map(function(o){return row(o,[el("button",{class:"ok",text:"✓ הסדיר",onclick:function(){rev(o.id,"ok")}})])}):[el("p",{class:"m",text:"אין."})]);
$("open").replaceChildren.apply($("open"),d.open.length?d.open.map(function(o){return row(o,[el("button",{class:"g",text:"✓ שולם",onclick:function(){rev(o.id,"ok")}})])}):[el("p",{class:"m",text:"אין."})]);
$("done").replaceChildren.apply($("done"),d.done.map(function(o){return row(o)}));
$("log").replaceChildren.apply($("log"),d.log.length?d.log.map(function(l){return el("small",{class:"m",text:when(l.at)+" · "+(l.order_id?"✓ אושר לפי "+l.how:"לא נמצאה הזמנה")+" · "+l.text})}):[el("p",{class:"m",text:"עוד לא הגיעו."})]);}
function load(){api("/api/admin/state").then(paint).catch(function(){$("err").hidden=false})}
$("save").onclick=function(){api("/api/admin/settings",{bit_phone:$("bit").value,paybox_phone:$("pb").value,paybox_link:$("pbl").value,payee_name:$("nm").value}).then(function(d){paint(d);alert("נשמר")})};
$("copy").onclick=function(){navigator.clipboard.writeText($("nurl").textContent).then(function(){$("copy").textContent="הועתק ✓"})};
$("newtok").onclick=function(){if(confirm("ליצור כתובת חדשה? הישנה תפסיק לעבוד."))api("/api/admin/settings",{new_token:1}).then(paint)};
$("pushBtn").onclick=function(){if(!("serviceWorker"in navigator)||!("PushManager"in window)){alert("הדפדפן לא תומך בהתראות");return}
Notification.requestPermission().then(function(p){if(p!=="granted")return;return Promise.all([navigator.serviceWorker.register("/sw.js").then(function(){return navigator.serviceWorker.ready}),api("/api/admin/push-key")]).then(function(x){var k=x[1].key,raw=atob(k.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((k.length+3)%4)),a=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);
return x[0].pushManager.getSubscription().then(function(s){return s||x[0].pushManager.subscribe({userVisibleOnly:true,applicationServerKey:a})})}).then(function(s){return api("/api/admin/push",{sub:s.toJSON()})}).then(function(){$("pushBtn").textContent="🔔 ההתראות פעילות"})}).catch(function(){alert("לא הצלחנו להפעיל התראות")})};
load();setInterval(function(){if(!document.hidden)load()},30000);})();</script></body></html>`;

export const SW = `// מועדון הערב: התראה למנהל על כל "שילמתי". ההודעה מגיעה בלי תוכן, והטלפון שואל מה להציג.
self.addEventListener("install",()=>self.skipWaiting());self.addEventListener("activate",(e)=>e.waitUntil(self.clients.claim()));
self.addEventListener("push",(e)=>{e.waitUntil((async()=>{let m=null;try{const s=await self.registration.pushManager.getSubscription();const r=await fetch("/api/admin/msg",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({endpoint:s&&s.endpoint})});m=r.ok?await r.json():null}catch{}
if(!m||!m.title)m={title:"💰 תשלום חדש במועדון הערב",body:"לבדוק ולסמן."};await self.registration.showNotification(m.title,{body:m.body,icon:"/icons/play-192.png",lang:"he",dir:"rtl",tag:"pay",renotify:true,data:{url:"/admin"}})})())});
self.addEventListener("notificationclick",(e)=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then((ws)=>{for(const w of ws)if(w.url.includes("/admin")&&"focus"in w)return w.focus();return self.clients.openWindow("/admin")}))});`;
