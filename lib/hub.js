// The three combined apps: HaniaKids (kids.hania360.com), HaniaBayit (bayit.hania360.com) and HaniaYahadut (yahadut.hania360.com).
// Each is one installable app with its own home screen; the apps it holds open inside it (each in its own frame, kept
// alive while you switch, so a running timer or a half-done lesson waits for you). The separate addresses keep working,
// with the same saved data: a frame of masach.hania360.com is the same site, so it reads the same storage.
// A small page on each app (/_bridge) hands the home screen a few numbers (stars, the next routine) to show at a glance.
import { HUB_IMAGES } from "./hub-icons.js";

export const HUBS = {
  kids: {
    name: "HaniaKids", he: "הילדים שלי", tag: "זמן מסך, שגרה, לימוד וסיפורים, הכול במקום אחד", color: "#7A5CFA", color2: "#FF8FB1", bg: "#FBF7FF", bgDark: "#16122E",
    apps: [
      ["masach", "📺", "זמן מסך", "זמן מסך הוגן ויוטיוב לילדים", "#5B8CFF"],
      ["shigra", "🌙", "שגרה", "שגרת ערב ובוקר עם כוכבים", "#7A5CFA"],
      ["english", "🔤", "אנגלית", "מהאותיות ועד משפטים", "#14B37D"],
      ["kita", "🧮", "חשבון", "משחקי חשבון לכיתות א׳–ו׳", "#FF9F1C"],
      ["shiurim", "🦉", "שיעורי בית", "פותרים יחד, צעד אחר צעד", "#6B4CE6"],
      ["sipur", "📚", "סיפור לפני השינה", "סיפור שנכתב רק בשבילו", "#E5487B"],
      ["sefer", "🎨", "הספר שלי", "הציורים הופכים לספר", "#00A6A6"]
    ]
  },
  bayit: {
    name: "HaniaBayit", he: "הבית שלנו", tag: "תורנויות, הסעות, סבא וסבתא וימי הולדת, בלי ויכוחים", color: "#0E9F8E", color2: "#FFB547", bg: "#F3FBF9", bgDark: "#0F1F1D",
    apps: [
      ["pick", "🎡", "מי בתור?", "גלגל מזל לתורנויות", "#FF6B6B"],
      ["ride", "🚗", "הסעות", "תורנות הסעות להורים", "#3BA3FF"],
      ["kibud", "📞", "כיבוד הורים", "כל יום מישהו אחר מתקשר", "#0E9F8E"],
      ["gil", "🎂", "ימי הולדת", "גיל ויום הולדת עברי ולועזי", "#E5487B"],
      ["gamad", "🎁", "גמד וענק", "הגרלה וקישור לכל אחד", "#8E5CF5"]
    ]
  },
  yahadut: {
    name: "HaniaYahadut", he: "היהדות שלי", tag: "זמני שבת, התפילה של היום, סידור, תזכורות וחגים", color: "#2D4BC7", color2: "#F5C04A", bg: "#F5F7FF", bgDark: "#0E1330",
    apps: [
      ["dat", "🕯️", "שבת, תפילה וסידור", "זמנים, תזכורות והסידור של היום", "#2D4BC7"],
      ["chanukah", "🕎", "חנוכה", "חנוכייה, זמנים וסביבון", "#D99A1E"]
    ]
  }
};
export const HUB_OF = {}; for (const [h, c] of Object.entries(HUBS)) for (const a of c.apps) HUB_OF[a[0]] = h;

// What the home screens may read from each app's storage on this phone, and only for their own pages.
const BRIDGE_KEYS = { english: ["haniaenglish-v1"], shigra: ["haniashigra-v1"], kita: ["kt.stars", "kt.av"], shiurim: ["haniashiurim-v1"], masach: ["masach.v1"] };
export function bridge(app) {
  const keys = BRIDGE_KEYS[app]; if (!keys) return null;
  const html = `<!doctype html><meta charset="utf-8"><script>(function(){var o={};${JSON.stringify(keys)}.forEach(function(k){try{o[k]=localStorage.getItem(k)}catch(e){}});
if(parent!==window){var ok=/^https:\\/\\/(kids|bayit|yahadut)\\.hania360\\.com$/;try{parent.postMessage({hania:"bridge",app:${JSON.stringify(app)},data:o},"*")}catch(e){}
addEventListener("message",function(e){if(ok.test(e.origin)&&e.data==="again")e.source.postMessage({hania:"bridge",app:${JSON.stringify(app)},data:o},e.origin)})}})()</script>`;
  // The data is sent only to a parent that is one of the home screens (checked by the browser through frame-ancestors).
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": "frame-ancestors https://kids.hania360.com https://bayit.hania360.com https://yahadut.hania360.com" } });
}

// Inside a home screen the app's own logo bar is hidden (the home screen shows the name), and links back to Hania360 too.
const HIDE_HEADER = new Set(["masach", "shigra", "english", "shiurim", "sipur", "chanukah"]);
export function embedCss(app) {
  return "<style id=\"in-hub\">" + (HIDE_HEADER.has(app) ? "body>header,body>.wrap>header,.wrap>header:first-child{display:none!important}" : "header .logo{pointer-events:none}") +
    "a[href=\"https://hania360.com/\"]{display:none!important}body{padding-top:8px!important}</style>";
}

function page(key) {
  const H = HUBS[key], cfg = { key, name: H.name, he: H.he, apps: H.apps };
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${H.name} · ${H.he}</title><meta name="description" content="${H.name}: ${H.tag}. אפליקציה אחת בחינם, בלי הרשמה.">
<link rel="canonical" href="https://${key}.hania360.com/"><meta name="theme-color" content="${H.color}"><link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icons/icon-192.png"><link rel="apple-touch-icon" href="/icons/apple-180.png"><meta name="apple-mobile-web-app-title" content="${H.he}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700;800;900&display=swap">
<style>
:root{--c:${H.color};--c2:${H.color2};--bg:${H.bg};--surface:#fff;--ink:#1E1B33;--muted:#6B6888;--line:rgba(30,27,51,.09);--font:"Rubik",system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:${H.bgDark};--surface:rgba(255,255,255,.06);--ink:#F4F2FF;--muted:#B5B1D3;--line:rgba(255,255,255,.1);color-scheme:dark}}
*{box-sizing:border-box}[hidden]{display:none!important}
html,body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font)}
body{direction:rtl;min-height:100vh;padding-top:env(safe-area-inset-top,0px)}
#home{max-width:720px;margin:0 auto;padding:14px max(16px,env(safe-area-inset-right,0px)) calc(96px + env(safe-area-inset-bottom,0px));display:grid;gap:18px}
.hero{border-radius:28px;padding:22px 20px 20px;color:#fff;background:radial-gradient(120% 140% at 100% 0%,var(--c2) 0%,transparent 55%),linear-gradient(150deg,var(--c),color-mix(in srgb,var(--c) 70%,#000));box-shadow:0 18px 40px -18px color-mix(in srgb,var(--c) 70%,transparent);position:relative;overflow:hidden}
.hero::after{content:"";position:absolute;inset:auto -40px -60px auto;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.10)}
.hero .brand{display:flex;align-items:center;gap:10px;font-weight:900;font-size:18px;opacity:.95}.hero .brand img{width:34px;height:34px;border-radius:10px;background:#fff}
.hero h1{font-size:clamp(28px,8vw,40px);line-height:1.1;margin:14px 0 6px;font-weight:900}
.hero p{margin:0;opacity:.9;font-size:16px}
.hero .date{margin-top:12px;font-size:14px;font-weight:700;opacity:.85}
h2{font-size:19px;font-weight:800;margin:0 0 10px}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media (min-width:640px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.app{appearance:none;border:0;text-align:start;font:inherit;color:var(--ink);cursor:pointer;background:var(--surface);border-radius:24px;padding:14px;display:grid;gap:8px;align-content:start;box-shadow:0 1px 0 var(--line),0 10px 24px -16px rgba(20,16,60,.25);border:1px solid var(--line);transition:transform .15s}
.app:active{transform:scale(.97)}
.app:focus-visible,.tab:focus-visible,.bar button:focus-visible{outline:3px solid var(--c2);outline-offset:2px}
.app .ic{width:54px;height:54px;border-radius:17px;display:grid;place-content:center;font-size:30px;background:color-mix(in srgb,var(--a) 16%,transparent);position:relative}
.app .ic img{width:54px;height:54px;border-radius:17px;position:absolute;inset:0;object-fit:cover}
.app b{font-size:17.5px;font-weight:800;line-height:1.2}.app span.d{font-size:13.5px;color:var(--muted);line-height:1.35}
.widgets{display:grid;gap:10px}
.w{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:14px 16px;display:grid;gap:10px}
.kidsrow{display:flex;gap:10px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
.kid{flex:0 0 auto;min-width:148px;border-radius:18px;padding:12px;background:color-mix(in srgb,var(--c) 9%,transparent);display:grid;gap:4px}
.kid .av{font-size:34px;line-height:1}.kid.on{outline:3px solid var(--c);background:color-mix(in srgb,var(--c) 16%,transparent)}.kid[role=button]{cursor:pointer}.kid b{font-size:17px}.kid small{color:var(--muted);font-size:13px;line-height:1.4}
.next{display:flex;gap:12px;align-items:center;font-weight:700}.next .e{font-size:30px}
.next button{margin-inline-start:auto}
.pill{appearance:none;border:0;border-radius:99px;padding:8px 14px;font:inherit;font-weight:800;font-size:14.5px;background:var(--c);color:#fff;cursor:pointer}
.fine{font-size:13px;color:var(--muted);text-align:center}
.fine a{color:inherit}
/* the open app */
#view{position:fixed;inset:0;z-index:20;background:var(--bg);display:grid;grid-template-rows:auto 1fr}
.bar{display:flex;align-items:center;gap:8px;padding:calc(6px + env(safe-area-inset-top,0px)) 10px 6px;background:var(--surface);border-bottom:1px solid var(--line);backdrop-filter:blur(10px)}
.bar button,.bar a{appearance:none;border:0;background:transparent;color:var(--ink);font:inherit;font-weight:800;font-size:15px;border-radius:12px;padding:8px 10px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.bar .t{font-weight:900;font-size:17px;display:flex;align-items:center;gap:8px;min-width:0}.bar .t span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar .sp{margin-inline-start:auto}
#frames{position:relative}
#frames iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:var(--bg)}
/* the tab bar */
.tabs{position:fixed;inset:auto 0 0 0;z-index:30;display:flex;gap:2px;justify-content:space-around;padding:6px 6px calc(6px + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(14px);border-top:1px solid var(--line)}
.tab{appearance:none;border:0;background:transparent;color:var(--muted);font:inherit;font-size:11px;font-weight:700;display:grid;justify-items:center;gap:2px;padding:4px 2px;border-radius:12px;cursor:pointer;min-width:0;flex:1}
.tab i{font-style:normal;font-size:23px;line-height:1.1}.tab span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.tab[aria-current="true"]{color:var(--c)}
.tab[aria-current="true"] i{transform:translateY(-1px)}
body.open .tabs{position:fixed}
body.open #view{bottom:calc(58px + env(safe-area-inset-bottom,0px))}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style></head><body>
<main id="home">
  <section class="hero"><div class="brand" dir="ltr"><img src="/icons/icon-192.png" alt=""><span>${H.name}</span></div><h1 id="hi">${H.he}</h1><p>${H.tag}</p><div class="date" id="date"></div></section>
  <section class="widgets" id="widgets"></section>
  <section><h2>הכול כאן</h2><div class="grid" id="grid"></div></section>
  <p class="fine">בחינם, בלי הרשמה ובלי פרסומות. כל אפליקציה פתוחה גם בכתובת שלה. <a href="https://hania360.com/">Hania360</a></p>
</main>
<div id="view" hidden><div class="bar"><button type="button" id="back" aria-label="לדף הבית">→ הבית</button><div class="t" id="vt"></div><span class="sp"></span><a id="ext" target="_blank" rel="noopener" aria-label="לפתוח בנפרד" title="לפתוח בנפרד (לתזכורות ולהתקנה)">↗</a></div><div id="frames"></div></div>
<nav class="tabs" id="tabs" aria-label="האפליקציות"></nav>
<div id="bridges" hidden></div>
<script>
(function(){"use strict";
var C=${JSON.stringify(cfg)},$=function(i){return document.getElementById(i)};
function el(t,a,k){var e=document.createElement(t);if(typeof a==="string"){e.textContent=a;a=null}Object.keys(a||{}).forEach(function(n){if(n.slice(0,2)==="on")e.addEventListener(n.slice(2),a[n]);else if(n==="text")e.textContent=a[n];else if(a[n]!=null)e.setAttribute(n,a[n])});[].concat(k==null?[]:k).forEach(function(x){if(x!=null&&x!==false)e.append(typeof x==="string"||typeof x==="number"?String(x):x)});return e}
var KID=null;function url(k,hash){if(k==="gil")return"https://gil.hania360.com/"+(hash||"");var q="?in=hub";if(KID&&k!=="masach")q+="&kid="+encodeURIComponent(KID.name)+"&av="+encodeURIComponent(KID.emoji||"")+"&g="+encodeURIComponent(KID.grade||"");return"https://"+k+".hania360.com/"+q+(hash||"")}
var h=new Date().getHours();$("hi").textContent=(h<5?"לילה טוב":h<12?"בוקר טוב":h<17?"צהריים טובים":h<21?"ערב טוב":"לילה טוב")+" 👋";
try{$("date").textContent=new Date().toLocaleDateString("he-IL",{weekday:"long",day:"numeric",month:"long"})+" · "+new Date().toLocaleDateString("he-IL-u-ca-hebrew",{day:"numeric",month:"long",year:"numeric"})}catch(e){}
// the apps
var byKey={};C.apps.forEach(function(a){byKey[a[0]]=a});
$("grid").replaceChildren.apply($("grid"),C.apps.map(function(a){var ic=el("span",{class:"ic","aria-hidden":"true"},[a[1]]);var im=el("img",{src:"https://"+(a[0])+".hania360.com/icons/icon-192.png",alt:"",loading:"lazy"});im.onerror=function(){im.remove()};ic.append(im);
  return el("button",{class:"app",type:"button",style:"--a:"+a[4],onclick:function(){open(a[0])}},[ic,el("b",a[2]),el("span",{class:"d",text:a[3]})])}));
function tabs(cur){$("tabs").replaceChildren.apply($("tabs"),[el("button",{class:"tab",type:"button","aria-current":String(!cur),onclick:function(){home()}},[el("i","🏠"),el("span","בית")])].concat(C.apps.slice(0,5).map(function(a){return el("button",{class:"tab",type:"button","aria-current":String(cur===a[0]),onclick:function(){open(a[0])}},[el("i",a[1]),el("span",a[2])])})))}
// an app opens in its own frame, which stays (hidden) while another is open
var frames={},cur=null;
function open(k,hash,noPush){var a=byKey[k];if(!a)return;cur=k;
  if(!frames[k]){var f=el("iframe",{src:url(k,hash),title:a[2],allow:"microphone; camera; fullscreen; autoplay; clipboard-write; picture-in-picture; web-share; screen-wake-lock",allowfullscreen:""});frames[k]=f;$("frames").append(f)}
  Object.keys(frames).forEach(function(x){frames[x].hidden=x!==k});
  $("vt").replaceChildren(el("span",{text:a[1]}),el("span",{text:a[2]}));$("ext").href=url(k,hash).replace("?in=hub","");
  $("view").hidden=false;$("home").hidden=true;document.body.classList.add("open");tabs(k);document.title=a[2]+" · "+C.he;
  if(!noPush)history.pushState({k:k},"","#"+k)}
function home(noPush){cur=null;$("view").hidden=true;$("home").hidden=false;document.body.classList.remove("open");tabs(null);document.title=C.name+" · "+C.he;if(!noPush&&location.hash)history.pushState({},"",location.pathname);load();famLoad()}
$("back").addEventListener("click",function(){history.length>1&&history.state&&history.state.k?history.back():home()});
addEventListener("popstate",function(){var k=(location.hash||"").slice(1);if(byKey[k])open(k,"",true);else home(true)});
tabs(null);
// at a glance: a few numbers from the apps on this phone
var D={};
function load(){var b=$("bridges");b.replaceChildren();["english","shigra","kita","shiurim","masach"].forEach(function(k){if(byKey[k])b.append(el("iframe",{src:"https://"+k+".hania360.com/_bridge",title:"",tabindex:"-1","aria-hidden":"true"}))})}
addEventListener("message",function(e){var d=e.data;if(!d||d.hania!=="bridge"||!/^https:\\/\\/[a-z]+\\.hania360\\.com$/.test(e.origin))return;var o={};Object.keys(d.data||{}).forEach(function(k){try{o[k]=JSON.parse(d.data[k])}catch(x){o[k]=null}});D[d.app]=o;
  if(d.app==="masach"&&!FAM){var m=o["masach.v1"];if(m&&m.mode==="k"&&m.kid)FAM={f:m.kid.f,t:m.kid.t};else if(m&&m.fams&&m.fams[0])FAM={f:m.fams[0].f,key:m.fams[0].key};if(FAM){ls("hub.fam",FAM);famLoad()}}
  widgets()});
function day(n){return new Date(Date.now()-n*864e5).toLocaleDateString("en-CA")}
// The family lives in HaniaMasach: the parents' key or a child's link on this phone. Everyone else reads it from there.
function ls(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||"null");localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
var FAM=ls("hub.fam"),FS=null;
function fam(path,body){return fetch("/api/masach/"+path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.assign({},FAM.key?{f:FAM.f,key:FAM.key}:{f:FAM.f,t:FAM.t},body||{}))}).then(function(r){return r.json().then(function(j){if(!r.ok){var e=new Error(j.error||r.status);e.code=j.error;throw e}return j})})}
function famLoad(){if(!FAM||C.key!=="kids")return;fam("state").then(function(j){FS=j;var pick=ls("hub.kid"),list=j.kids||[];var k=list.filter(function(x){return x.id===pick})[0]||(FAM.t?list[0]:null)||(list.length===1?list[0]:null);setKid(k,true);widgets()}).catch(function(e){if(e.code==="auth"||e.code==="no family"){FAM=null;ls("hub.fam",null)}widgets()})}
function setKid(k,quiet){var was=KID&&KID.id;KID=k||null;ls("hub.kid",k?k.id:null);if((KID&&KID.id)!==was){Object.keys(frames).forEach(function(x){if(x!=="masach"&&x!==cur){frames[x].remove();delete frames[x]}});if(!quiet&&cur&&cur!=="masach"){var c=cur;frames[c].remove();delete frames[c];open(c,"",true)}}}
// Stars from the apps (a finished lesson, a solved exercise, a routine step) go to the child's wallet.
addEventListener("message",function(e){var d=e.data;if(!d||d.hania!=="stars"||!/^https:\\/\\/[a-z]+\\.hania360\\.com$/.test(e.origin))return;if(!FAM||!KID)return;var n=Math.max(1,Math.min(10,+d.n||1));
  fam("op",{op:"star",k:KID.id,n:n,src:String(d.src||"").slice(0,24)}).then(function(j){FS=j;var me=(j.kids||[]).filter(function(x){return x.id===KID.id})[0];if(me)KID=me;toast((j.capped?"להיום כבר נאספו כל הכוכבים · ":"⭐ +"+n+" ל"+KID.name+" · ")+"יש "+((me||KID).stars||0));if(!cur)widgets()}).catch(function(){})});
function toast(t){var x=el("div",{style:"position:fixed;left:50%;transform:translateX(-50%);bottom:calc(76px + env(safe-area-inset-bottom,0px));background:#1E1B33;color:#fff;padding:10px 16px;border-radius:14px;font-weight:700;z-index:90;box-shadow:0 10px 30px rgba(0,0,0,.3)",text:t});document.body.append(x);setTimeout(function(){x.remove()},2600)}
function mm(sec){sec=Math.max(0,Math.round(sec));var h=Math.floor(sec/3600),m=Math.floor(sec/60)%60;return h?h+":"+String(m).padStart(2,"0")+" שע׳":m+" דק׳"}
function widgets(){var w=$("widgets"),out=[];
  if(C.key==="kids"&&FS&&FS.kids&&FS.kids.length){
    out.push(el("div",{class:"w"},[el("h2",{style:"margin:0",text:FAM.t?"👋 "+FS.kids[0].name:"מי משתמש עכשיו?"}),el("div",{class:"kidsrow"},FS.kids.map(function(k){var on=KID&&KID.id===k.id;
      var can=k.starOn&&(k.stars||0)>=10&&(k.sRedeem||0)+k.starRate<=k.starCap&&!k.asleep;
      return el("div",{class:"kid"+(on?" on":""),role:FAM.t?null:"button",tabindex:FAM.t?null:"0",onclick:function(e){if(e.target.closest("button"))return;if(!FAM.t){setKid(on?null:k);widgets()}}},[el("span",{class:"av",text:k.emoji}),el("b",k.name+(on&&!FAM.t?" ✓":"")),
        el("small",null,["⏱️ "+(k.asleep?"שעת שינה":mm(k.left)+" היום"),el("br"),k.starOn?"⭐ "+(k.stars||0)+" כוכבים":"⭐ כוכבים כבויים"]),
        k.starOn?el("button",{class:"pill",type:"button",style:"font-size:12.5px;padding:6px 10px"+(can?"":";opacity:.45"),text:"⭐10 → "+k.starRate+" דק׳",onclick:function(){if(!can){toast((k.stars||0)<10?"צריך 10 כוכבים":"להיום כבר הומר כל מה שמותר");return}fam("op",{op:"redeem",k:k.id}).then(function(j){FS=j;toast("⏱️ +"+k.starRate+" דקות מסך ל"+k.name);widgets()}).catch(function(e){toast(e.code==="cap"?"להיום כבר הומר כל מה שמותר":"לא הצלחנו")})}}):null])})),
      el("p",{class:"fine",style:"text-align:start;margin:0",text:FAM.t?"כוכבים מאנגלית, מחשבון, משיעורי בית ומהשגרה הופכים לדקות מסך.":KID?"האפליקציות פתוחות עכשיו בשביל "+KID.name+", והכוכבים נכנסים לארנק שלו/ה.":"בוחרים ילד/ה, והאפליקציות נפתחות בשבילו/ה (שם, כיתה וכוכבים)."})]));
  } else if(C.key==="kids"&&!FAM){out.push(el("div",{class:"w next"},[el("span",{class:"e",text:"🔗"}),el("span","מחברים את המשפחה פעם אחת ב״זמן מסך״, ומאז כל ילד מקבל פרופיל אחד וכוכבים שהופכים לדקות מסך."),el("button",{class:"pill",type:"button",text:"לחיבור",onclick:function(){open("masach")}})]))}
  if(C.key==="kids"&&!(FS&&FS.kids&&FS.kids.length)){var kids={},sh=D.shigra&&D.shigra["haniashigra-v1"],en=D.english&&D.english["haniaenglish-v1"];
    if(sh&&sh.kids)sh.kids.forEach(function(k){var x=kids[k.name]=kids[k.name]||{n:k.name,av:k.av};var s=0;for(var i=0;i<7;i++)s+=((sh.stars||{})[day(i)]||{})[k.id]||0;x.sh=s});
    if(en&&en.kids)en.kids.forEach(function(k){var x=kids[k.name]=kids[k.name]||{n:k.name,av:k.av};x.en=k.stars||0;x.streak=k.last===day(0)||k.last===day(1)?k.streak||0:0});
    var list=Object.keys(kids).map(function(n){return kids[n]});
    if(list.length)out.push(el("div",{class:"w"},[el("h2",{style:"margin:0",text:"⭐ הילדים השבוע"}),el("div",{class:"kidsrow"},list.map(function(k){return el("div",{class:"kid"},[el("span",{class:"av",text:k.av||"🙂"}),el("b",k.n),el("small",null,[k.sh!=null?"🌙 שגרה: "+k.sh+" ⭐":null,k.sh!=null?el("br"):null,k.en!=null?"🔤 אנגלית: "+k.en+" ⭐"+(k.streak?" · 🔥 "+k.streak:""):null])])}))]));
    if(sh&&sh.r){var hr=new Date().getHours(),m=hr>=4&&hr<12?"morning":"evening",r=sh.r[m],tot=r.steps.reduce(function(a,s){return a+(+s[2]||0)},0),p=r.at.split(":"),end=new Date();end.setHours(+p[0],+p[1],0,0);var st=new Date(end-tot*6e4);
      if(Date.now()<end)out.push(el("div",{class:"w next"},[el("span",{class:"e",text:m==="evening"?"🌙":"☀️"}),el("span",(m==="evening"?"שגרת ערב":"שגרת בוקר")+(Date.now()<st?" מתחילה ב־"+st.toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"}):" עכשיו! עד "+r.at)),el("button",{class:"pill",type:"button",text:"פתיחה",onclick:function(){open("shigra")}})]))}
    if(!list.length)out.push(el("div",{class:"w next"},[el("span",{class:"e",text:"👋"}),el("span","מתחילים מהשגרה או מהאנגלית, והכוכבים של כל ילד יופיעו כאן.")]));
  }
  if(C.key==="yahadut"){try{var d=new Date(),f=new Intl.DateTimeFormat("he-IL-u-ca-hebrew",{month:"long",day:"numeric"}),hit=-1;for(var i=0;i<400;i++){var t=f.format(new Date(d.getTime()+i*864e5));if(/^כ״ה בכסלו$|^25 בכסלו$|^כ"ה בכסלו$/.test(t)||(/כסלו/.test(t)&&/^(25|כ״ה|כ"ה)/.test(t))){hit=i;break}}
    if(hit>=0&&hit<45)out.push(el("div",{class:"w next"},[el("span",{class:"e",text:"🕎"}),el("span",hit<=1?"חנוכה מתחיל "+(hit?"מחר":"היום")+" בערב":"עוד "+(hit-1)+" ימים לנר הראשון של חנוכה"),el("button",{class:"pill",type:"button",text:"פתיחה",onclick:function(){open("chanukah")}})]))}catch(e){}
    var fri=(5-new Date().getDay()+7)%7;out.push(el("div",{class:"w next"},[el("span",{class:"e",text:"🕯️"}),el("span",fri===0?"היום ערב שבת. זמני הדלקה וההבדלה לפי העיר שלך":"עוד "+fri+" ימים לשבת"),el("button",{class:"pill",type:"button",text:"זמני שבת",onclick:function(){open("dat")}})]))}
  w.replaceChildren.apply(w,out)}
// Reminders asked for by an app inside: this page asks for notifications and keeps them on its own address.
addEventListener("message",function(e){var d=e.data;if(!d||d.hania!=="push"||!/^https:\\/\\/[a-z]+\\.hania360\\.com$/.test(e.origin))return;
  var reply=function(ok,err){try{e.source.postMessage({hania:"push-done",id:d.id,ok:ok,error:err},e.origin)}catch(x){}};
  if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window)){reply(false,"unsupported");toast(/iPhone|iPad/.test(navigator.userAgent)?"באייפון: קודם מוסיפים את האפליקציה למסך הבית, ומשם מפעילים תזכורת":"הדפדפן הזה לא תומך בהתראות");return}
  var post=function(p,b){return fetch("/api/shabbat/"+p,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)}).then(function(r){return r.json()})};
  if(d.op==="unsub"){navigator.serviceWorker.ready.then(function(reg){return reg.pushManager.getSubscription()}).then(function(s){return s?post("unsub",{endpoint:s.endpoint,kind:d.body&&d.body.kind}):null}).then(function(){reply(true)}).catch(function(){reply(true)});return}
  Notification.requestPermission().then(function(p){if(p!=="granted")throw new Error("perm");return navigator.serviceWorker.ready}).then(function(reg){return reg.pushManager.getSubscription().then(function(s){if(s)return s;return fetch("/api/shabbat/key").then(function(r){return r.json()}).then(function(j){var k=j.key,raw=atob(k.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((k.length+3)%4)),a=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);return reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:a})})})})
    .then(function(s){return post("sub",Object.assign({},d.body,{sub:s.toJSON()}))}).then(function(j){reply(!!(j&&j.ok),j&&j.error)}).catch(function(x){reply(false,x&&x.message);if(x&&x.message==="perm")toast("בלי אישור להתראות אי אפשר להזכיר")})});
widgets();load();famLoad();
var k0=(location.hash||"").slice(1);if(byKey[k0])open(k0,"",true);
if("serviceWorker" in navigator)addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(){})});
})();
</script></body></html>`;
}

const SW = `const C="hania-hub-v1";self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(["/","/manifest.webmanifest","/icons/icon-192.png"])).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("push",e=>{e.waitUntil((async()=>{let m=null;try{const s=await self.registration.pushManager.getSubscription();const r=await fetch("/api/shabbat/msg",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({endpoint:s&&s.endpoint})});m=r.ok?await r.json():null}catch{m=null}
if(!m||!m.title)m={title:"🔔 תזכורת",body:"לוחצים לפרטים."};await self.registration.showNotification(m.title,{body:m.body,icon:"/icons/icon-192.png",badge:"/icons/icon-192.png",lang:"he",dir:"rtl",tag:"hub",renotify:true,data:{url:"/"}})})())});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(ws=>{for(const w of ws)if(w.url.startsWith(self.location.origin)&&"focus" in w)return w.focus();return self.clients.openWindow("/")}))});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin||u.pathname.startsWith("/_")||u.pathname.startsWith("/api/"))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("/"))))});`;

export function hubApp(url, key) {
  const H = HUBS[key], p = url.pathname;
  if (p === "/" || p === "/index.html") return new Response(page(key), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache", "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin" } });
  if (p === "/sw.js") return new Response(SW, { headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-cache" } });
  if (p === "/manifest.webmanifest") return new Response(JSON.stringify({ name: H.name + " · " + H.he, short_name: H.he, description: H.tag, lang: "he", dir: "rtl", id: "/", start_url: "/", scope: "/", display: "standalone", orientation: "portrait", background_color: H.bg, theme_color: H.color, icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" }, { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }] }), { headers: { "content-type": "application/manifest+json", "cache-control": "public, max-age=3600" } });
  const m = p.match(/^\/icons\/(icon-192|icon-512|apple-180)\.png$/);
  if (m && HUB_IMAGES[key + "-" + m[1]]) return new Response(Uint8Array.from(atob(HUB_IMAGES[key + "-" + m[1]]), (c) => c.charCodeAt(0)), { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" } });
  if (p === "/robots.txt") return new Response("User-agent: *\nAllow: /\n", { headers: { "content-type": "text/plain" } });
  return Response.redirect("https://" + key + ".hania360.com/", 302);
}
