// "חי עכשיו" on the homepage: a strip that keeps itself up to date while the page is open.
// The page asks /api/live for the shekel's rates (Bank of Israel) and ynet's breaking-news headlines (titles and
// links only, no pictures), /api/sport/il for Ligat Ha'Al, and Open-Meteo (from the browser) for the weather in the
// visitor's town (their HaniaYahadut town if they chose one, else Jerusalem). The clock and Hebrew date are local.

const json = (o, age) => new Response(JSON.stringify(o), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=" + age, "access-control-allow-origin": "*" } });
const unx = (s) => String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

async function cached(key, ttl, make) {
  const k = new Request("https://hania360.com/live-cache/" + key), c = caches.default, hit = await c.match(k);
  if (hit) return hit.json();
  const v = await make();
  if (v) await c.put(k, new Response(JSON.stringify(v), { headers: { "cache-control": "max-age=" + ttl } }));
  return v;
}
async function fx() {
  const r = await fetch("https://boi.org.il/PublicApi/GetExchangeRates?asJson=true", { headers: { accept: "application/json" } });
  if (!r.ok) return null;
  const j = await r.json(), pick = (k) => { const x = (j.exchangeRates || []).find((e) => e.key === k); return x ? { v: +x.currentExchangeRate, ch: Math.round(+x.currentChange * 100) / 100, at: x.lastUpdate } : null; };
  return { usd: pick("USD"), eur: pick("EUR") };
}
async function news() {
  const r = await fetch("https://www.ynet.co.il/Integration/StoryRss1854.xml", { headers: { "user-agent": "Mozilla/5.0 (Hania360 live strip)" } });
  if (!r.ok) return null;
  const x = await r.text(), out = [];
  for (const m of x.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const t = unx((/<title>([\s\S]*?)<\/title>/.exec(m[1]) || [])[1]), link = unx((/<link>([\s\S]*?)<\/link>/.exec(m[1]) || [])[1]), at = Date.parse(unx((/<pubDate>([\s\S]*?)<\/pubDate>/.exec(m[1]) || [])[1]));
    if (t && /^https:\/\/www\.ynet\.co\.il\//.test(link)) out.push({ t: t.slice(0, 160), link, at: isFinite(at) ? at : 0 });
    if (out.length >= 8) break;
  }
  return out.length ? out : null;
}
export const fxRates = () => cached("fx-v1", 1800, () => fx().catch(() => null));
export const newsItems = () => cached("news-v1", 120, () => news().catch(() => null));
export async function liveApi() {
  const [a, b] = await Promise.all([cached("fx-v1", 1800, () => fx().catch(() => null)), cached("news-v1", 120, () => news().catch(() => null))]);
  return json({ fx: a, news: b || [] }, 60);
}

export const LIVE_CSS = `
.l26{max-width:980px;margin:22px auto 0;display:grid;gap:10px}
.l26-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.l26-dot{display:inline-flex;align-items:center;gap:6px;font-weight:900;color:#DC2626;font-size:14px;letter-spacing:.02em}
.l26-dot i{width:9px;height:9px;border-radius:50%;background:#EF4444;box-shadow:0 0 0 0 rgba(239,68,68,.6);animation:l26p 1.6s infinite}
@keyframes l26p{70%{box-shadow:0 0 0 9px rgba(239,68,68,0)}100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}}
@media (prefers-reduced-motion:reduce){.l26-dot i{animation:none}}
.l26-clock{font:800 22px/1 Rubik,system-ui,sans-serif;color:#0F172A;font-variant-numeric:tabular-nums;direction:ltr}
.l26-heb{color:#64748B;font-size:14px}
.l26-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
@media (min-width:760px){.l26-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
.l26-t{display:grid;gap:2px;align-content:start;background:#fff;border:1px solid rgba(15,23,42,.08);border-radius:16px;padding:10px 12px;color:inherit;text-decoration:none;box-shadow:0 8px 20px -18px rgba(15,23,42,.5);min-height:74px}
.l26-t small{color:#64748B;font-size:12px;font-weight:700}.l26-t b{font-size:17px;color:#0F172A;font-variant-numeric:tabular-nums}.l26-t span{font-size:12.5px;color:#475569;line-height:1.35}
.l26-up{color:#DC2626}.l26-down{color:#059669}
.l26-news{grid-column:1/-1;display:flex;gap:10px;align-items:center;min-height:0}
.l26-news .l26-h{flex:1;min-width:0;font-size:15px;font-weight:700;color:#0F172A;transition:opacity .35s}
.l26-news .l26-ago{white-space:nowrap}
.l26-badge{background:#B91C1C;color:#fff!important;border-radius:8px;padding:2px 8px;font-size:12px;font-weight:900;white-space:nowrap}
.l26-src{font-size:11px;color:#94A3B8;text-align:left}
`;

export const LIVE_HTML = `<section class="l26" id="live" aria-label="חי עכשיו">
<div class="l26-top"><span class="l26-dot"><i></i>חי עכשיו</span><span class="l26-clock" id="lvClock">--:--</span><span class="l26-heb" id="lvHeb"></span></div>
<div class="l26-grid">
<a class="l26-t l26-news" id="lvNews" href="https://www.ynet.co.il/news/category/184" target="_blank" rel="noopener"><span class="l26-badge">מבזק</span><span class="l26-h" id="lvNewsT">טוען מבזקים…</span><span class="l26-ago" id="lvNewsA"></span></a>
<a class="l26-t" id="lvSport" href="https://sport.hania360.com/#il"><small>⚽ ליגת העל</small><b id="lvSportB">…</b><span id="lvSportS"></span></a>
<a class="l26-t" id="lvWx" href="https://yahadut.hania360.com/"><small id="lvWxK">🌤️ מזג האוויר</small><b id="lvWxB">…</b><span id="lvWxS"></span></a>
<div class="l26-t"><small>💵 דולר</small><b id="lvUsd">…</b><span id="lvUsdS"></span></div>
<div class="l26-t"><small>💶 אירו</small><b id="lvEur">…</b><span id="lvEurS"></span></div>
</div><div class="l26-src">מבזקים: ynet · שערים: בנק ישראל · מזג אוויר: Open-Meteo</div></section>
<script>(function(){
var $=function(i){return document.getElementById(i)},DAYS=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
function clock(){var d=new Date();$("lvClock").textContent=d.toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit",second:"2-digit",timeZone:"Asia/Jerusalem"});
try{$("lvHeb").textContent="יום "+DAYS[new Date(d.toLocaleString("en-US",{timeZone:"Asia/Jerusalem"})).getDay()]+" · "+d.toLocaleDateString("he-IL-u-ca-hebrew",{day:"numeric",month:"long",timeZone:"Asia/Jerusalem"})+" · "+d.toLocaleDateString("he-IL",{day:"numeric",month:"long",timeZone:"Asia/Jerusalem"})}catch(e){}}
clock();setInterval(clock,1000);
function ago(t){var m=Math.round((Date.now()-t)/6e4);return !t?"":m<1?"עכשיו":m<60?"לפני "+m+" דק׳":"לפני "+Math.round(m/60)+" שע׳"}
var N=[],ni=0;function showNews(){if(!N.length)return;var x=N[ni%N.length],h=$("lvNewsT");h.style.opacity=0;setTimeout(function(){h.textContent=x.t;$("lvNewsA").textContent=ago(x.at);$("lvNews").href=x.link;h.style.opacity=1},250);ni++}
setInterval(showNews,7000);
function rate(id,o){if(!o)return;$(id).textContent=o.v.toFixed(3)+" ₪";var s=$(id+"S");s.textContent=(o.ch>0?"▲ ":o.ch<0?"▼ ":"")+Math.abs(o.ch).toFixed(2)+"% "+(o.ch>0?"עלה":o.ch<0?"ירד":"ללא שינוי");s.className=o.ch>0?"l26-up":o.ch<0?"l26-down":""}
function live(){fetch("/api/live",{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){if(j.news&&j.news.length){N=j.news;ni=0;showNews()}else $("lvNewsT").textContent="אין מבזקים חדשים";if(j.fx){rate("lvUsd",j.fx.usd);rate("lvEur",j.fx.eur)}}).catch(function(){})}
live();setInterval(live,120000);
// Ligat Ha'Al: a game on now, else the next one, else the leader
function sport(){fetch("/api/sport/il",{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){var M=j.matches||[],now=Date.now(),L=M.filter(function(m){return m.live});
var b=$("lvSportB"),s=$("lvSportS");
if(L.length){var m=L[0];b.textContent=m.home.name+" "+(m.score||"")+" "+m.away.name;s.textContent="🔴 עכשיו "+(m.min||"")+(L.length>1?" · ועוד "+(L.length-1)+" משחקים":"");return}
var nx=M.filter(function(m){return!m.done&&!m.off&&Date.parse(m.utc)>now}).sort(function(a,c){return Date.parse(a.utc)-Date.parse(c.utc)})[0];
if(nx){var d=new Date(nx.utc);b.textContent=nx.home.name+" – "+nx.away.name;s.textContent="המשחק הבא: יום "+DAYS[d.getDay()]+" "+d.toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"});return}
var t=(j.table||[])[0];if(t){b.textContent=t.name;s.textContent="במקום הראשון · "+t.pts+" נק׳"}}).catch(function(){$("lvSport").hidden=true})}
sport();setInterval(sport,60000);
// the weather in the visitor's town
var city=["ירושלים",31.778,35.235];try{var cm=document.cookie.match(/(?:^|; *)h360_i=([^;]*)/),co=cm?JSON.parse(decodeURIComponent(cm[1])):{};if(co.c&&co.c[1])city=co.c}catch(e){}
var WX={0:"☀️ בהיר",1:"🌤️ בהיר ברובו",2:"⛅ מעונן חלקית",3:"☁️ מעונן",45:"🌫️ ערפל",48:"🌫️ ערפל",51:"🌦️ טפטוף",53:"🌦️ טפטוף",55:"🌦️ טפטוף",61:"🌧️ גשם קל",63:"🌧️ גשם",65:"🌧️ גשם חזק",80:"🌦️ ממטרים",81:"🌧️ ממטרים",82:"⛈️ ממטרים חזקים",95:"⛈️ סופת רעמים",96:"⛈️ סופת רעמים",99:"⛈️ סופת רעמים"};
function wx(){fetch("https://api.open-meteo.com/v1/forecast?latitude="+city[1]+"&longitude="+city[2]+"&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FJerusalem&forecast_days=1").then(function(r){return r.json()}).then(function(j){
var c=j.current,dd=j.daily,w=WX[c.weather_code]||"🌡️";if(!c.is_day&&c.weather_code<2)w="🌙 בהיר";
$("lvWxK").textContent=w.split(" ")[0]+" "+city[0];$("lvWxB").textContent=Math.round(c.temperature_2m)+"°";$("lvWxS").textContent=w.replace(/^\\S+ /,"")+" · היום עד "+Math.round(dd.temperature_2m_max[0])+"°"+(dd.precipitation_probability_max[0]>=30?" · ☔ "+dd.precipitation_probability_max[0]+"%":"")}).catch(function(){$("lvWx").hidden=true})}
wx();setInterval(wx,1800000);
})();</script>`;
