// "עכשיו" on hania360.com: the daily items from now/feed.js, shown only after the owner approves them.
// Decisions live in the StatsHub Durable Object (table now_dec: id -> ok | no | auto).
// From about an hour before Shabbat starts in Jerusalem until about 50 minutes after it ends, the owner is away,
// so any item still waiting goes up by itself, and that "auto" decision is saved so it stays after Shabbat.

import FEED, { TICKER } from "./feed.js";
import { IMG, credit } from "../lib/images.js";

const LAT = 31.778, LON = 35.235; // Jerusalem
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Sunset in Jerusalem (UTC ms) on the UTC calendar day of `t`, NOAA approximation, good to about a minute. */
export function sunset(t) {
  const d = new Date(t), y0 = Date.UTC(d.getUTCFullYear(), 0, 0), n = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - y0) / 864e5);
  const g = 2 * Math.PI / 365 * (n - 1 + 0.5);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const lat = LAT * Math.PI / 180;
  const ha = Math.acos(Math.cos(90.833 * Math.PI / 180) / (Math.cos(lat) * Math.cos(dec)) - Math.tan(lat) * Math.tan(dec)) * 180 / Math.PI;
  const min = 720 - 4 * (LON - ha) - eq; // minutes after UTC midnight
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + min * 60e3;
}

/** True from Friday sunset minus 60 minutes to Saturday sunset plus 50 minutes (Jerusalem). */
export function isShabbat(t = Date.now()) {
  const local = new Date(t + 2 * 3600e3), wd = local.getUTCDay(); // Israel is UTC+2 or +3; +2 is enough to tell the weekday around sunset
  if (wd === 5) return t >= sunset(t) - 60 * 60e3;
  if (wd === 6) return t <= sunset(t) + 50 * 60e3;
  return false;
}

const today = (t = Date.now()) => new Date(t).toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
const live = (it, d) => (!it.from || it.from <= d) && (!it.until || it.until >= d);

async function desk(env, path, body) {
  if (!env || !env.STATS) return null;
  const stub = env.STATS.get(env.STATS.idFromName("stats"));
  const r = await stub.fetch("https://stats" + path, body ? { method: "POST", body: JSON.stringify(body) } : undefined);
  return r.ok ? r.json() : null;
}

/** Items to show now, with Shabbat auto-approval applied (and saved). */
export async function nowItems(env, t = Date.now(), preview = false) {
  const d = today(t), dec = (await desk(env, "/now/get")) || {};
  const shabbat = isShabbat(t), auto = [];
  const shown = FEED.filter((it) => live(it, d)).filter((it) => {
    const v = dec[it.id];
    if (v === "ok" || v === "auto") return true;
    if (!v && preview) return true; // the owner's preview also shows what still waits
    if (!v && shabbat) { auto.push(it.id); return true; }
    return false;
  });
  if (auto.length) await desk(env, "/now/set", { ids: auto, d: "auto" });
  return shown;
}

// ---------- the homepage section ----------
const CHIP = { "טיסות": "#38BDF8", "כדורסל": "#FB923C", "כדורגל": "#34D399", "כסף": "#FBBF24", "קניות": "#F472B6", "רכב": "#818CF8", "חגים": "#F5C04A", "אזרחי": "#94A3B8" };
const HEB_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export const NOW_CSS = `
.n26{max-width:980px;margin:30px auto 0;display:grid;gap:16px}
.n26-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap}
.n26-head h2{margin:0;font:400 clamp(1.6rem,5.5vw,2.2rem)/1.05 "Secular One",Rubik,sans-serif;background:linear-gradient(90deg,var(--c1),var(--c2) 55%,var(--c3));-webkit-background-clip:text;background-clip:text;color:transparent}
.n26-live{display:inline-flex;align-items:center;gap:8px;font:800 .78rem/1 Rubik,sans-serif;letter-spacing:.08em;color:#FB7185;margin-bottom:6px}
.n26-live i{width:9px;height:9px;border-radius:50%;background:#FB7185;animation:n26p 1.8s infinite}
@keyframes n26p{0%{box-shadow:0 0 0 0 rgba(251,113,133,.6)}100%{box-shadow:0 0 0 10px rgba(251,113,133,0)}}
@media (prefers-reduced-motion:reduce){.n26-live i{animation:none}}
.n26-date{color:#94A3B8;font-size:.92rem}
.n26-tick{display:flex;flex-wrap:wrap;gap:8px;padding:2px 0}
.n26-tick::-webkit-scrollbar{display:none}
.n26-tk{flex:0 1 auto;display:flex;gap:8px;align-items:center;background:var(--glass);border:1px solid var(--edge);border-radius:999px;padding:8px 14px;font-size:.9rem;white-space:nowrap;color:#CBD5E1}
.n26-tk b{font:800 1rem/1 Rubik,sans-serif;color:#F1F5F9;font-variant-numeric:tabular-nums}
.n26-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px}
.n26-card{position:relative;overflow:hidden;background:linear-gradient(160deg,rgba(22,32,60,.92),rgba(10,16,34,.92));border:1px solid var(--edge);border-radius:22px;padding:18px;display:grid;gap:10px;align-content:start;min-width:0;box-shadow:var(--glow)}
.n26-card::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,var(--k),transparent)}
.n26-card.lead{grid-column:1/-1;grid-template-columns:1.35fr 1fr;gap:22px;padding:22px;background:radial-gradient(120% 140% at 100% 0%,color-mix(in srgb,var(--k) 22%,transparent),transparent 60%),linear-gradient(160deg,rgba(22,32,60,.95),rgba(10,16,34,.95))}
@media (max-width:720px){.n26-tick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.n26-tk{display:grid;gap:2px;justify-items:start;border-radius:14px;padding:8px 12px;font-size:.78rem;white-space:normal}.n26-tk b{font-size:.95rem}.n26-tk:last-child:nth-child(odd){grid-column:1/-1}.n26-sp:nth-child(n+3){display:none}.n26-grid{display:grid;gap:10px}.n26-card.lead{grid-template-columns:1fr;padding:18px;gap:14px}.n26-card:not(.lead){padding:14px 14px 12px;gap:8px}.n26-card:not(.lead) h3{font-size:1.04rem;cursor:pointer;display:flex;gap:8px;justify-content:space-between;align-items:flex-start}.n26-card:not(.lead) h3::after{content:"▾";flex:none;color:#8A94AB;font-size:.9rem;transition:transform .2s}.n26-card.open h3::after{transform:rotate(180deg)}.n26-card:not(.lead):not(.open) p,.n26-card:not(.lead):not(.open) .n26-src,.n26-card:not(.lead):not(.open) .n26-civic,.n26-card:not(.lead):not(.open) .n26-app:not(:first-child),.n26-card:not(.lead):not(.open) .n26-app small{display:none}.n26-card:not(.lead) .n26-big{font-size:1.6rem}.n26-card.lead .n26-img{margin:-18px -18px 0;height:170px}.n26-card.pic:not(.lead){grid-template-columns:72px minmax(0,1fr);column-gap:12px;align-items:start}.n26-card.pic:not(.lead) .n26-img{grid-row:1;grid-column:1;margin:0;width:72px;height:72px;max-height:none;aspect-ratio:auto;border-radius:14px}.n26-card.pic:not(.lead)>div:nth-child(2){grid-column:2}.n26-card.pic:not(.lead)>div:nth-child(n+3){grid-column:1/-1}.n26-card:not(.lead) .n26-app{padding-top:8px}.n26-card:not(.lead) .n26-ic{width:34px;height:34px;font-size:1.05rem}.n26-card:not(.lead) .n26-go{padding:8px 12px}}

.n26-img{margin:-18px -18px 0;aspect-ratio:16/9;max-height:170px;overflow:hidden;background:#E3E6F2}.n26-img img{display:block;width:100%;height:100%;object-fit:cover}.n26-card.lead .n26-img{grid-column:1/-1;margin:-22px -22px 0;max-height:240px;aspect-ratio:auto;height:240px}.n26-card.pic::before{z-index:1}
.n26-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:.8rem;color:#94A3B8}
.n26-chip{font:800 .74rem/1 Rubik,sans-serif;padding:6px 10px;border-radius:999px;color:var(--k);background:color-mix(in srgb,var(--k) 16%,transparent);border:1px solid color-mix(in srgb,var(--k) 35%,transparent)}
.n26-card h3{margin:0;font:700 1.18rem/1.32 Rubik,sans-serif;color:#F8FAFC;text-wrap:balance}
.n26-card.lead h3{font-size:clamp(1.3rem,3.2vw,1.7rem)}
.n26-card p{margin:0;color:#CBD5E1;font-size:.96rem;line-height:1.6}
.n26-big{font:800 2.4rem/1 Rubik,sans-serif;color:var(--k);font-variant-numeric:tabular-nums}
.n26-src{font-size:.78rem;color:#7C8BA3}.n26-src a{color:inherit}
.n26-apps{display:grid;gap:10px}
.n26-app{display:flex;align-items:center;gap:12px;border-top:1px dashed rgba(148,163,184,.25);padding-top:12px;color:inherit;text-decoration:none}
.n26-card.lead .n26-app{border:1px solid rgba(148,163,184,.18);border-radius:16px;padding:12px;background:rgba(5,9,20,.4)}
.n26-ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:1.3rem;flex:none;background:color-mix(in srgb,var(--k) 18%,rgba(5,9,20,.6))}
.n26-app div{min-width:0;flex:1}.n26-app b{display:block;color:#F1F5F9;font:700 .95rem Rubik,sans-serif}.n26-app small{color:#94A3B8;font-size:.8rem}
.n26-go{flex:none;font:800 .85rem/1 Rubik,sans-serif;padding:10px 14px;border-radius:12px;color:#050914;background:linear-gradient(90deg,var(--c1),var(--c2))}
.n26-app:hover .n26-go{filter:brightness(1.1)}
.n26-civic{font-size:.8rem;color:#94A3B8;border-top:1px solid rgba(148,163,184,.2);padding-top:10px}
.n26-sport{display:flex;flex-wrap:wrap;gap:8px}.n26-sport::-webkit-scrollbar{display:none}
.n26-sp{flex:0 1 auto;max-width:100%;display:flex;gap:10px;align-items:center;background:linear-gradient(135deg,rgba(16,185,129,.16),rgba(10,16,34,.9));border:1px solid rgba(52,211,153,.3);border-radius:16px;padding:10px 14px;color:#E2E8F0;text-decoration:none;font-size:.88rem}
.n26-sp b{font:800 1rem Rubik,sans-serif;color:#F8FAFC;font-variant-numeric:tabular-nums}.n26-sp small{color:#94A3B8}
.n26-sp.live{border-color:#FB7185}
`;

function card(it, draft = false) {
  const k = CHIP[it.chip] || "#38BDF8";
  const apps = (it.apps || []).map(([ic, name, line, href, btn]) => `<a class="n26-app" href="${esc(href)}"><span class="n26-ic">${ic}</span><div><b>${esc(name)}</b><small>${esc(line)}</small></div><span class="n26-go">${esc(btn)}</span></a>`).join("");
  const src = (it.sources || []).map(([l, u]) => `<a href="${esc(u)}" rel="noopener" target="_blank">${esc(l)}</a>`).join(" · ");
  const im = it.img && IMG[it.img], pic = im ? `<div class="n26-img"><img src="${esc(im.src)}" width="720" height="405" alt="" loading="lazy" decoding="async"></div>` : "";
  const until = it.until ? `עד ${+it.until.slice(8)}.${+it.until.slice(5, 7)}` : "";
  const text = `<div style="display:grid;gap:10px"><div class="n26-meta">${draft ? `<span class="n26-chip" style="--k:#FBBF24">טיוטה · ממתין לאישור</span>` : ""}<span class="n26-chip">${esc(it.chip)}</span>${until ? `<span>${until}</span>` : ""}</div>${it.big ? `<div class="n26-big">${esc(it.big)}</div>` : ""}<h3>${esc(it.title)}</h3><p>${esc(it.body)}</p>${src || im ? `<div class="n26-src">${src ? "מקור: " + src : ""}${src && im ? " · " : ""}${credit(im)}</div>` : ""}</div>`;
  const side = apps ? `<div class="n26-apps">${apps}</div>` : it.civic ? `<div class="n26-civic">מידע אזרחי בלבד, בלי עמדה ובלי קישור לאפליקציה.</div>` : "";
  return `<article class="n26-card${it.lead ? " lead" : ""}${im ? " pic" : ""}" style="--k:${k}">${pic}${text}${side}</article>`;
}

/** The whole section, or "" when nothing is approved. The ticker and sport strip fill in on the phone. */
export function nowSection(items, t = Date.now(), pending = new Set()) {
  if (!items.length) return "";
  const ordered = [...items.filter((i) => i.lead), ...items.filter((i) => !i.lead)];
  if (ordered.length && !ordered[0].lead) ordered[0] = { ...ordered[0], lead: true };
  const local = new Date(t + 2 * 3600e3), dl = new Date(t).toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "long" });
  const tick = TICKER.map(([l, v, at]) => `<span class="n26-tk"${at ? ` data-at="${esc(at)}"` : ""}><b>${esc(v || "")}</b><span>${esc(l)}</span></span>`).join("");
  return `<section class="n26" id="now" aria-labelledby="now-h"><div class="n26-head"><div><div class="n26-live"><i></i>עכשיו</div><h2 id="now-h">מה קורה היום, ואיך זה נוגע לכם</h2></div><div class="n26-date">יום ${HEB_DAYS[local.getUTCDay()]}, ${esc(dl)} · מתעדכן כל בוקר</div></div><div class="n26-tick">${tick}</div><div class="n26-sport" id="nowSport" hidden></div><div class="n26-grid">${ordered.map((it) => card(it, pending.has(it.id))).join("")}</div></section>
<script>(function(){
function il(s){var m=/^(\\d{4})-(\\d\\d)-(\\d\\d)T(\\d\\d):(\\d\\d)/.exec(s);if(!m)return 0;var u=Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5]),x=new Date(u),off=Date.parse(x.toLocaleString("en-US",{timeZone:"Asia/Jerusalem"}))-Date.parse(x.toLocaleString("en-US",{timeZone:"UTC"}));return u-off}
function fmt(ms){if(ms<=0)return "היום";var d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5);return d>1?d+" ימים":d===1?"יום ו־"+h+" שע׳":h>0?h+" שע׳":Math.max(1,Math.floor(ms/6e4))+" דק׳"}
function tick(){document.querySelectorAll(".n26-tk[data-at]").forEach(function(e){var at=e._at||(e._at=il(e.dataset.at)),left=at-Date.now();if(left<-36e5*6){e.remove();return}e.querySelector("b").textContent=left<=0?"עכשיו":"בעוד "+fmt(left)})}
tick();setInterval(tick,6e4);
document.querySelectorAll(".n26-card:not(.lead) h3").forEach(function(h){h.setAttribute("role","button");h.tabIndex=0;h.onclick=h.onkeydown=function(e){if(e.type==="keydown"&&e.key!=="Enter"&&e.key!==" ")return;e.preventDefault();var c=h.closest(".n26-card");h.setAttribute("aria-expanded",c.classList.toggle("open"))}});
var box=document.getElementById("nowSport");if(!box||!window.fetch)return;
fetch("/api/sport/il").then(function(r){return r.ok?r.json():null}).then(function(d){if(!d||!d.matches)return;
var now=Date.now(),ms=d.matches,lv=ms.filter(function(m){return m.live}),dn=ms.filter(function(m){return m.done}).slice(-3).reverse(),nx=ms.filter(function(m){return !m.done&&!m.live&&Date.parse(m.utc)>now}).slice(0,3);
function t(m){return new Date(m.utc).toLocaleString("he-IL",{timeZone:"Asia/Jerusalem",weekday:"short",day:"numeric",month:"numeric",hour:"2-digit",minute:"2-digit"})}
function a(m,c,mid){return '<a class="n26-sp'+c+'" href="https://sport.hania360.com/#il"><span>⚽</span><span>'+m.home.name+' <b>'+mid+'</b> '+m.away.name+'</span></a>'}
var h=lv.map(function(m){return a(m," live",(m.score||"")+" · "+(m.min||"חי"))}).concat(dn.length&&!lv.length?[a(dn[0],"",dn[0].score)]:[]).concat(nx.map(function(m){return a(m,"",'<small>'+t(m)+'</small>')}));
var top=d.table&&d.table[0];if(top)h.unshift('<a class="n26-sp" href="https://sport.hania360.com/#il"><span>🏆</span><span>ליגת העל: <b>'+top.name+'</b> ראשונה עם '+top.pts+' נק׳</span></a>');
if(h.length){box.innerHTML=h.join("");box.hidden=false}}).catch(function(){})})();</script>`;
}

// ---------- the owner's approval page: hania360.com/now ----------
export async function nowApi(request, env, url) {
  const j = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  const want = String(env && env.STATS_KEY || "").trim();
  if (request.method === "POST" && url.pathname === "/api/now/decide") {
    const b = await request.json().catch(() => ({}));
    if (!want || String(b.k || "").trim() !== want) return j({ error: "key" }, 403);
    const ids = (Array.isArray(b.ids) ? b.ids : [b.id]).filter((id) => FEED.some((it) => it.id === id));
    if (!ids.length || !/^(ok|no)$/.test(b.d)) return j({ error: "bad" }, 400);
    await desk(env, "/now/set", { ids, d: b.d });
    return j({ ok: true });
  }
  if (url.pathname === "/api/now/list") {
    if (!want || (url.searchParams.get("k") || "").trim() !== want) return j({ error: "key" }, 403);
    const dec = (await desk(env, "/now/get")) || {}, d = today();
    return j({ shabbat: isShabbat(), today: d, items: FEED.map((it) => ({ id: it.id, chip: it.chip, title: it.title, body: it.body, from: it.from, until: it.until, live: live(it, d), sources: it.sources, apps: (it.apps || []).map((a) => a[1] + " → " + a[3]), d: dec[it.id] || "" })) });
  }
  return j({ error: "not found" }, 404);
}

export const NOW_ADMIN = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="theme-color" content="#050914"><title>עכשיו · אישור</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#050914;color:#E2E8F0;font:16px/1.5 Rubik,system-ui,sans-serif}main{max-width:720px;margin:0 auto;padding:18px 16px 60px;display:grid;gap:14px}h1{margin:0;font-size:1.5rem}.m{color:#94A3B8;font-size:.9rem}.c{background:#0F1830;border:1px solid rgba(99,102,241,.34);border-radius:18px;padding:16px;display:grid;gap:8px}.c h2{margin:0;font-size:1.05rem}.c p{margin:0;color:#CBD5E1;font-size:.93rem}.c a{color:#7DD3FC}.row{display:flex;gap:8px;flex-wrap:wrap}button{font:700 1rem Rubik,sans-serif;border:0;border-radius:12px;padding:12px 18px;cursor:pointer}.ok{background:linear-gradient(90deg,#38BDF8,#818CF8);color:#050914}.no{background:#1E293B;color:#E2E8F0}.st{font-weight:800;font-size:.85rem}.st.ok{background:none;color:#34D399}.st.no{background:none;color:#FB7185}.st.auto{color:#FBBF24}input{width:100%;font:inherit;padding:12px;border-radius:12px;border:1px solid #334155;background:#0B1224;color:#fff}.off{opacity:.55}.all{position:sticky;bottom:10px}#pv[hidden]{display:none!important}</style></head><body><main>
<h1>עכשיו · מה עולה לאתר</h1><p class="m" id="info">טוען…</p><a id="pv" hidden target="_blank" rel="noopener" style="display:block;text-align:center;padding:12px;border-radius:12px;border:1px solid #38BDF8;color:#7DD3FC;text-decoration:none;font-weight:700">👀 תצוגה מקדימה: איך דף הבית ייראה עם הכול</a><div id="key" hidden class="c"><p>הקוד הוא אותו STATS_KEY של דף הנתונים. מזינים פעם אחת והוא נשמר בטלפון הזה.</p><input id="k" type="password" autocomplete="current-password" placeholder="הקוד"><button class="ok" id="save">שמירה</button></div><div id="list"></div><button class="ok all" id="all" hidden>לאשר את כל הממתינים</button></main>
<script>
var K="";try{K=localStorage.getItem("now.k")||""}catch(e){}
var q=new URLSearchParams(location.search).get("k");if(q){K=q;try{localStorage.setItem("now.k",q)}catch(e){}history.replaceState(null,"","/now")}
function e(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var S={ok:"✓ מאושר, באתר",no:"✕ נדחה",auto:"✓ עלה אוטומטית בשבת","":"ממתין לאישור"};
var B={"":[["ok","לאשר"],["no","לדחות"]],ok:[["no","להוריד מהאתר"]],auto:[["ok","להשאיר"],["no","להוריד מהאתר"]],no:[["ok","להחזיר לאתר"]]};
function load(){if(!K){document.getElementById("key").hidden=false;document.getElementById("info").textContent="";return}
fetch("/api/now/list?k="+encodeURIComponent(K),{cache:"no-store"}).then(function(r){if(r.status===403){K="";try{localStorage.removeItem("now.k")}catch(x){}load();throw 0}return r.json()}).then(function(d){
document.getElementById("info").textContent=(d.shabbat?"עכשיו שבת: ממתינים עולים לבד. ":"")+"מה שמאשרים עולה לדף הבית תוך דקה, ואפשר להוריד כל פריט בכל זמן, באותה לחיצה.";document.getElementById("pv").href="/?preview="+encodeURIComponent(K);document.getElementById("pv").hidden=false;
var w=d.items.filter(function(i){return i.live&&!i.d});document.getElementById("all").hidden=!w.length;document.getElementById("all").onclick=function(){go(w.map(function(i){return i.id}),"ok")};
document.getElementById("list").innerHTML=d.items.map(function(i){return '<div class="c'+(i.live?"":" off")+'"><div class="m">'+e(i.chip)+" · "+e(i.from)+" עד "+e(i.until)+(i.live?"":" · לא בתוקף היום")+'</div><h2>'+e(i.title)+'</h2><p>'+e(i.body)+'</p><p class="m">'+(i.sources||[]).map(function(s){return '<a href="'+e(s[1])+'" target="_blank" rel="noopener">'+e(s[0])+'</a>'}).join(" · ")+'</p><p class="m">'+e((i.apps||[]).join(" · ")||"בלי קישור לאפליקציה")+'</p><div class="row"><span class="st '+e(i.d)+'">'+S[i.d]+'</span></div><div class="row">'+B[i.d||""].map(function(b){return '<button class="'+b[0]+'" data-id="'+e(i.id)+'" data-d="'+b[0]+'">'+b[1]+'</button>'}).join("")+'</div></div>'}).join("")}).catch(function(){})}
function go(ids,d){fetch("/api/now/decide",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({k:K,ids:ids,d:d})}).then(load)}
document.getElementById("list").onclick=function(ev){var b=ev.target.closest("button[data-id]");if(b)go([b.dataset.id],b.dataset.d)};
document.getElementById("save").onclick=function(){K=document.getElementById("k").value.trim();try{localStorage.setItem("now.k",K)}catch(x){}document.getElementById("key").hidden=true;load()};
load();
</script></body></html>`;
