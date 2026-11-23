// Backup and sync of the small apps to the Hania360 account (Hania Pass).
// Every small app keeps its data in the phone's localStorage (each app on its own address). When the person is
// signed in, a short script in the page (SYNC_SNIPPET, added by smallApp) copies what changes to the account, key by
// key with the time of the change, and on another phone (or after the browser was cleared) brings it back:
// a newer value on the server replaces the local one, a newer local value goes up. Nothing happens for someone
// who is not signed in. One Durable Object per account (HaniaSync), one record per app.
// Not for HaniaKasefet (the vault keeps its own encrypted copy) or Hania (the assistant).

const APP = /^[a-z]{2,12}$/, MAX_APP = 1_500_000, MAX_KEY = 400_000;
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export class HaniaSync {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(req) {
    const url = new URL(req.url), app = url.searchParams.get("app") || "";
    if (url.pathname === "/list") { const out = []; for (const [k, v] of await this.ctx.storage.list()) out.push({ app: k, at: v.at, size: v.size, keys: Object.keys(v.keys || {}).length }); return json({ apps: out }); }
    if (!APP.test(app)) return json({ error: "app" }, 400);
    const cur = (await this.ctx.storage.get(app)) || { keys: {}, at: 0, size: 0 };
    if (url.pathname === "/del") { await this.ctx.storage.delete(app); return json({ ok: true }); }
    if (req.method === "GET") return json({ keys: cur.keys, at: cur.at });
    const b = await req.json().catch(() => null);
    if (!b || typeof b.keys !== "object") return json({ error: "body" }, 400);
    // per key: the newer change wins; null is a removed key (kept as a marker so other phones remove it too)
    let changed = 0;
    for (const [k, pair] of Object.entries(b.keys).slice(0, 500)) {
      if (typeof k !== "string" || k.length > 120 || !Array.isArray(pair)) continue;
      const [v, t] = pair; if (!(+t > 0) || (v !== null && (typeof v !== "string" || v.length > MAX_KEY))) continue;
      const old = cur.keys[k]; if (old && old[1] >= +t) continue;
      cur.keys[k] = [v, Math.min(+t, Date.now() + 60e3)]; changed++;
    }
    cur.size = Object.values(cur.keys).reduce((s, x) => s + (x[0] ? x[0].length : 0) + 20, 0);
    if (cur.size > MAX_APP) return json({ error: "too big", size: cur.size }, 413);
    if (changed) { cur.at = Date.now(); await this.ctx.storage.put(app, cur); }
    return json({ ok: true, changed, at: cur.at });
  }
}

// /api/sync on an app's own address: who is signed in comes from Hania Pass (passUser), the app from the address.
export async function syncApi(request, env, passUser, appName) {
  if (!env.SYNC) return json({ error: "off" }, 503);
  const who = await passUser(request, env).catch(() => null);
  if (!who) return json({ error: "signin" }, 401);
  const stub = env.SYNC.get(env.SYNC.idFromName("u:" + who.id));
  const url = new URL(request.url);
  if (url.pathname === "/api/sync/list") return stub.fetch("https://sync/list");
  const app = appName || url.searchParams.get("app") || "";
  if (request.method === "GET") return stub.fetch("https://sync/get?app=" + app);
  if (request.method === "POST" && url.pathname === "/api/sync/del") return stub.fetch("https://sync/del?app=" + app, { method: "POST" });
  if (request.method === "POST") return stub.fetch("https://sync/put?app=" + app, { method: "POST", body: await request.text() });
  return json({ error: "method" }, 405);
}

// The page side. Runs before the app's own script: wraps localStorage so each change is remembered with its time,
// then (signed in only) pulls what the account has, applies newer values, reloads once if something came back,
// and sends local changes up a few seconds after they happen and when the page is hidden. A phone's own id
// (keys like mt.dev, daber-dev, haniapark-device) stays on that phone.
export const SYNC_SNIPPET = `<script>(function(){try{
var LS=window.localStorage,META="__hs_meta",P=Storage.prototype,set=P.setItem,rem=P.removeItem,clr=P.clear,meta={};
try{meta=JSON.parse(LS.getItem(META)||"{}")||{}}catch(e){meta={}}
var skip=function(k){return k===META||/^__/.test(k)||/(^|[.\\-_])dev(ice)?$|device|^h360_inst$/.test(k)};
var t0=null,dirty={},off=false;
function saveMeta(){try{set.call(LS,META,JSON.stringify(meta))}catch(e){}}
function mark(k){if(skip(k))return;meta[k]=Date.now();dirty[k]=1;saveMeta();if(!off){clearTimeout(t0);t0=setTimeout(push,4000)}}
P.setItem=function(k,v){set.call(this,k,v);if(this===LS)mark(String(k))};
P.removeItem=function(k){rem.call(this,k);if(this===LS)mark(String(k))};
P.clear=function(){if(this===LS)for(var i=0;i<LS.length;i++){var k=LS.key(i);if(!skip(k))mark(k)}clr.call(this);if(this===LS)saveMeta()};
function push(){var ks=Object.keys(dirty);if(!ks.length||off)return;var body={};ks.forEach(function(k){var v=LS.getItem(k);body[k]=[v,meta[k]||Date.now()]});dirty={};
  fetch("/api/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({keys:body}),keepalive:true,credentials:"same-origin"}).then(function(r){if(r.status===401||r.status===503)off=true}).catch(function(){ks.forEach(function(k){dirty[k]=1})})}
addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")push()});
addEventListener("pagehide",push);
fetch("/api/sync",{credentials:"same-origin",cache:"no-store"}).then(function(r){if(!r.ok){off=true;return null}return r.json()}).then(function(j){if(!j||!j.keys)return;
  var got=0;Object.keys(j.keys).forEach(function(k){if(skip(k))return;var p=j.keys[k],lt=meta[k]||0;
    if(p[1]>lt){var cur=LS.getItem(k);if(p[0]===null){if(cur!==null){rem.call(LS,k);got++}}else if(cur!==p[0]){set.call(LS,k,p[0]);got++}meta[k]=p[1]}});
  // what this phone has that the account does not (the first time, or changed while offline) goes up
  for(var i=0;i<LS.length;i++){var k=LS.key(i);if(skip(k))continue;var sp=j.keys[k];if(!meta[k])meta[k]=1;if(!sp||meta[k]>sp[1])dirty[k]=1}
  saveMeta();if(Object.keys(dirty).length)setTimeout(push,1500);
  if(got&&!sessionStorage.getItem("__hs_reload")){sessionStorage.setItem("__hs_reload","1");
    var d=document.createElement("div");d.textContent="☁️ הנתונים שלך חזרו מהחשבון";d.style.cssText="position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:99999;background:#16203A;color:#fff;padding:10px 16px;border-radius:12px;font:600 15px system-ui,sans-serif;direction:rtl";(document.body||document.documentElement).append(d);
    setTimeout(function(){location.reload()},900)}
}).catch(function(){});
}catch(e){}})();</script>`;
