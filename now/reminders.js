// hania360.com/reminders: one place for every reminder the signed-in person set in any Hania360 app, on any phone:
// what comes next, how long before, pause one or all (today, until tomorrow morning), or remove a list.
// The lists themselves stay where they are (the reminders Durable Object, shabbat/hub.js); this page only shows and steers.
const PAGE = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>התזכורות שלי · Hania360</title><meta name="robots" content="noindex"><meta name="theme-color" content="#2D4BC7">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700;800&display=swap">
<style>
:root{--bg:#F5F7FF;--surface:#fff;--ink:#16203A;--muted:#55607A;--line:#E1E6F5;--main:#2D4BC7;--warn:#9A5B00;--font:"Rubik",system-ui,-apple-system,"Segoe UI",sans-serif}
@media (prefers-color-scheme:dark){:root{--bg:#0E1330;--surface:#161D42;--ink:#EEF1FF;--muted:#A9B2D6;--line:#28305E;--main:#8EA2FF;--warn:#F5C04A}}
*{box-sizing:border-box}[hidden]{display:none!important}
body{margin:0;font-family:var(--font);background:var(--bg);color:var(--ink);line-height:1.5}
.wrap{max-width:640px;margin:0 auto;padding:16px 14px 40px;display:grid;gap:14px}
header{display:flex;justify-content:space-between;align-items:center;gap:10px}
h1{margin:0;font-size:24px}.back{color:var(--main);font-weight:700;text-decoration:none}
.card{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:14px 16px;display:grid;gap:10px}
.top{display:flex;gap:12px;align-items:center}.top .e{font-size:30px}.top b{font-size:17px;display:block}.top small{color:var(--muted)}
.next{margin:0;padding:0;list-style:none;display:grid;gap:4px;font-size:15px}.next li{display:flex;justify-content:space-between;gap:8px;border-top:1px dashed var(--line);padding-top:4px}
.next time{color:var(--muted);white-space:nowrap}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.btn{appearance:none;font:inherit;font-weight:700;font-size:14.5px;border-radius:12px;padding:9px 13px;border:1px solid var(--line);background:var(--bg);color:var(--ink);cursor:pointer;min-height:40px}
.btn.main{background:var(--main);border-color:var(--main);color:#fff}.btn.del{color:#B42318}
select{font:inherit;font-size:15px;padding:8px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);min-height:40px}
.paused{color:var(--warn);font-weight:700}.fine{font-size:13.5px;color:var(--muted);margin:0}
.empty{text-align:center;color:var(--muted);padding:26px 10px}
</style></head><body><div class="wrap">
<header><h1>🔔 התזכורות שלי</h1><a class="back" href="/">Hania360 ←</a></header>
<div id="out"><p class="empty">טוען…</p></div>
<section class="card" id="bk" hidden><b>☁️ הגיבוי שלי</b><p class="fine">האפליקציות שהנתונים שלהן נשמרים בחשבון. בטלפון חדש מתחברים, פותחים את האפליקציה, והכול חוזר.</p><ul class="next" id="bkList"></ul></section>
<p class="fine">כאן מופיעות התזכורות שהופעלו כשהייתם מחוברים ל־Hania Pass, מכל האפליקציות ומכל הטלפונים. תזכורת שהופעלה לפני כן תופיע אחרי שתפתחו שוב את האפליקציה שלה. בשבת ובחג לא נשלחות תזכורות.</p>
</div><script>
(function(){"use strict";
var NAMES={limud:["📚","לימוד יומי"],fit:["💪","HaniaFit"],shigra:["🌙","שגרת בוקר וערב"],matalot:["🧹","מטלות הבית"],chanukah:["🕎","חנוכה"]};
var KINDS={s:["🕯️","הדלקת נרות"],z:["⏰","זמן היום"],h:["🗓️","ערבי חג"],t:["🙏","תפילות"],c:["🚗","טסט וביטוח לרכב"],v:["🔐","הכספת"]};
var HOSTS={"dat.hania360.com":"HaniaDat","yahadut.hania360.com":"היהדות שלי","kids.hania360.com":"הילדים שלי","bayit.hania360.com":"הבית שלנו","check.hania360.com":"HaniaCheck","kasefet.hania360.com":"HaniaKasefet","sport.hania360.com":"HaniaSport"};
function el(t,a,k){var e=document.createElement(t);for(var x in a||{}){if(x==="text")e.textContent=a[x];else if(x.slice(0,2)==="on")e.addEventListener(x.slice(2),a[x]);else if(a[x]!=null)e.setAttribute(x,a[x])}(k||[]).forEach(function(c){if(c!=null)e.append(c)});return e}
function hm(t){return new Date(t).toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Jerusalem"})}
function day(t){var d=new Date(t),n=new Date();var a=d.toLocaleDateString("en-CA",{timeZone:"Asia/Jerusalem"}),b=n.toLocaleDateString("en-CA",{timeZone:"Asia/Jerusalem"}),c=new Date(n.getTime()+864e5).toLocaleDateString("en-CA",{timeZone:"Asia/Jerusalem"});return a===b?"היום":a===c?"מחר":d.toLocaleDateString("he-IL",{weekday:"short",day:"numeric",month:"numeric",timeZone:"Asia/Jerusalem"})}
function tomorrowMorning(){var n=new Date(),d=new Date(n.toLocaleDateString("en-CA",{timeZone:"Asia/Jerusalem"})+"T06:00:00+02:00");d=new Date(d.getTime()+864e5);return d.getTime()}
function call(p,b){return fetch("/api/shabbat/"+p,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b||{})}).then(function(r){if(r.status===401)throw new Error("signin");return r.json()})}
function draw(j){var out=document.getElementById("out"),L=j.list||[];
  if(!L.length){out.replaceChildren(el("div",{class:"card empty"},[el("div",{text:"עוד אין כאן תזכורות."}),el("p",{class:"fine",text:"מפעילים תזכורת באחת האפליקציות (זמני שבת, הדף היומי, חנוכה, שגרה, מטלות, כושר) כשמחוברים, והיא תופיע כאן."})]));return}
  var anyOn=L.some(function(x){return !x.pause});
  var all=el("div",{class:"card"},[el("div",{class:"row",style:"justify-content:space-between"},[el("b",{text:L.length+" רשימות תזכורות"}),
    anyOn?el("button",{class:"btn",type:"button",text:"🔕 להשתיק הכול עד מחר בבוקר",onclick:function(){call("mine-op",{op:"pauseAll",until:tomorrowMorning()}).then(draw)}}):el("button",{class:"btn main",type:"button",text:"🔔 להחזיר את כולן",onclick:function(){call("mine-op",{op:"resumeAll"}).then(draw)}})])]);
  out.replaceChildren.apply(out,[all].concat(L.sort(function(a,b){return ((a.next[0]||{}).t||9e15)-((b.next[0]||{}).t||9e15)}).map(function(x){
    var n=NAMES[x.app]||KINDS[x.kind]||["🔔","תזכורות"],where=HOSTS[x.host]||"";
    var before=["s","z","h"].indexOf(x.kind)>=0?el("select",{"aria-label":"כמה זמן לפני",onchange:function(){call("mine-op",{op:"before",key:x.key,before:+this.value}).then(draw)}},[10,15,20,30,45,60,90,120].map(function(m){var o=el("option",{value:m,text:(m<60?m+" דק׳":m===60?"שעה":m===90?"שעה וחצי":"שעתיים")+" לפני"});if(m===x.before)o.selected=true;return o})):null;
    return el("section",{class:"card"},[
      el("div",{class:"top"},[el("span",{class:"e",text:n[0]}),el("div",null,[el("b",{text:n[1]}),el("small",{text:[where,x.city].filter(Boolean).join(" · ")+(x.count?" · עוד "+x.count+" תזכורות":"")})])]),
      x.pause?el("div",{class:"paused",text:"🔕 מושתק עד "+day(x.pause)+" "+hm(x.pause)}):null,
      x.next.length?el("ul",{class:"next"},x.next.map(function(i){return el("li",null,[el("span",{text:i.label}),el("time",{text:day(i.t)+" "+hm(i.t)})])})):el("p",{class:"fine",text:"אין תזכורות קרובות. האפליקציה תוסיף עוד כשתיפתח."}),
      el("div",{class:"row"},[before,
        x.pause?el("button",{class:"btn",type:"button",text:"🔔 להחזיר",onclick:function(){call("mine-op",{op:"resume",key:x.key}).then(draw)}}):el("button",{class:"btn",type:"button",text:"🔕 להשתיק עד מחר",onclick:function(){call("mine-op",{op:"pause",key:x.key,until:tomorrowMorning()}).then(draw)}}),
        el("button",{class:"btn del",type:"button",text:"🗑️ להסיר",onclick:function(){if(confirm("להסיר את התזכורות של "+n[1]+"? אפשר להפעיל שוב מהאפליקציה."))call("mine-op",{op:"del",key:x.key}).then(draw)}})])]);
  })));
}
var AN={shigra:"🌙 שגרה",matalot:"🧹 מטלות",fit:"💪 כושר",limud:"📚 לימוד יומי",chanukah:"🕎 חנוכה",dat:"🕯️ שבת ותפילה",tv:"📺 HaniaTV",hazmana:"💌 הזמנות",race:"🏎️ מירוץ",sport:"⚽ ספורט",daber:"🗣️ HaniaDaber",bills:"🧾 חשבונות",park:"🅿️ חניה",check:"🚗 HaniaCheck",tisa:"✈️ טיסות",home:"🏠 HaniaHome",kufsa:"💰 קופה",english:"🔤 אנגלית",ivrit:"🔠 עברית",kita:"🏫 כיתה",sipur:"📖 סיפור",chag:"✡️ החג",play:"🎮 משחקים"};
fetch("/api/sync/list",{credentials:"same-origin",cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(function(j){if(!j||!j.apps||!j.apps.length)return;document.getElementById("bk").hidden=false;
  document.getElementById("bkList").replaceChildren.apply(document.getElementById("bkList"),j.apps.sort(function(a,b){return b.at-a.at}).map(function(a){return el("li",null,[el("span",{text:AN[a.app]||a.app}),el("time",{text:"נשמר "+day(a.at)+" "+hm(a.at)})])}))}).catch(function(){});
call("mine").then(draw).catch(function(e){document.getElementById("out").replaceChildren(el("div",{class:"card empty"},e.message==="signin"?[el("div",{text:"צריך להתחבר כדי לראות את התזכורות."}),el("a",{class:"btn main",href:"https://pass.hania360.com/?return="+encodeURIComponent(location.href),text:"התחברות ל־Hania Pass"})]:[el("div",{text:"אין חיבור כרגע. ננסה שוב?"})]))});
})();
</script></body></html>`;
export function remindersPage() { return new Response(PAGE, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } }); }
