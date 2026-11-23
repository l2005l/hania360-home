// hania360.com, the front door. A first-time visitor should get it in five seconds: free Hebrew apps for the whole
// family, open in the browser, no download, no sign-up. The page shows it rather than says it: a 24-hour dial ("your
// home, around the clock", the 360 in the name) with the app that fits each hour, a "who is it for" picker with a few
// apps each, Hania Today and the phone widget explained with live examples, sign-in by e-mail right here, the live
// strip, every app by world, and the questions people (and search engines and AI assistants) ask, answered plainly.
// Returning visitors get "היום שלך" (lib/homeme.js) above all this. /classic keeps the old page as it was.
import { WORLDS } from "../now/map.js";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// about 55 apps in all (the hubs, the games, the tools); said as "more than 50"
export const APP_TXT = "יותר מ־50";
export const SLOGAN = "הבית שלך, מסביב לשעון.";

// The dial: what fits each hour of the day. [hour, emoji, title, line, address]
export const MOMENTS = [
  [5.75, "📚", "דף יומי", "דף יומי, הלכה יומית ופרשת השבוע, עם ביאור", "https://yahadut.hania360.com/#limud"],
  [7, "☀️", "שגרת בוקר", "הילדים מתארגנים לבד: שלב אחרי שלב, טיימר וכוכבים", "https://kids.hania360.com/#shigra"],
  [8.25, "📋", "Hania Today", "הבוקר שלך בדף אחד: משימות, תזכורות, ימי הולדת ושוברים", "https://today.hania360.com/"],
  [10, "🛒", "קניות", "רשימה משותפת לכל הבית, ומה כבר יש במקרר", "https://bayit.hania360.com/#cart"],
  [11.75, "💳", "חיסכון", "איזה כרטיס, שובר או הטבה הכי משתלמים בכל חנות", "https://save.hania360.com/"],
  [13.25, "🚗", "בדיקת רכב", "טסט, בעלויות וריקולים לפי מספר הרכב", "https://check.hania360.com/"],
  [15, "🦉", "שיעורי בית", "עזרה צעד אחר צעד, בלי לתת את התשובה", "https://kids.hania360.com/#shiurim"],
  [16.5, "🧹", "מטלות הבית", "לכל ילד המטלות שלו, ונקודות לפרס", "https://kids.hania360.com/#matalot"],
  [18, "⚽", "ספורט", "תוצאות חיות וטבלה של ליגת העל", "https://sport.hania360.com/"],
  [19.25, "🌙", "שגרת ערב", "מקלחת, פיג׳מה, צחצוח. בלי ויכוחים", "https://kids.hania360.com/#shigra"],
  [20.5, "🌛", "לילה טוב", "צלילי שינה, שירי ערש ומנורת לילה", "https://layla.hania360.com/"],
  [21.5, "📺", "טלוויזיה", "ערוצים ישראליים בשידור חי, רק שידורים רשמיים", "https://tv.hania360.com/"],
  [22.6, "🏎️", "עיר פתוחה", "נהיגה ברחובות אמיתיים של 20 ערים בישראל", "https://race.hania360.com/"],
  [23.7, "✨", "השמיים מעליך", "כוכבים, הירח ותחנת החלל, מכוונים לשמיים", "https://sky.hania360.com/"]
];
// "Who is it for": a few apps each, so nobody has to read a list of sixty
const FOR = [
  ["parents", "👨‍👩‍👧", "הורים", [["🌙", "שגרת בוקר וערב", "שלב אחרי שלב, טיימר וכוכבים", "https://kids.hania360.com/#shigra"], ["🧹", "מטלות הבית", "מטלות לכל ילד, נקודות ובונוסים", "https://kids.hania360.com/#matalot"], ["📺", "זמן מסך הוגן", "זמן מסך ויוטיוב מסונן", "https://kids.hania360.com/#masach"], ["🦉", "שיעורי בית", "עזרה בלי לתת את התשובה", "https://kids.hania360.com/#shiurim"], ["🌛", "לילה טוב", "צלילים, שירי ערש ומנורת לילה", "https://layla.hania360.com/"], ["🔤", "אנגלית וקריאה", "מהאותיות ועד משפטים, עם קול", "https://kids.hania360.com/#english"]]],
  ["shabbat", "🕯️", "שבת וחגים", [["🕯️", "זמני שבת וסידור", "הדלקת נרות, התפילה של עכשיו, והסידור", "https://yahadut.hania360.com/#dat"], ["🧺", "מכינים שבת", "רשימת הכנות שמתאפסת כל שבוע", "https://yahadut.hania360.com/#dat"], ["📚", "לימוד יומי", "דף יומי, הלכה ופרשה עם ביאור", "https://yahadut.hania360.com/#limud"], ["🗓️", "החג הקרוב", "זמנים, הכנות וברכות", "https://chag.hania360.com/"], ["🗺️", "מסע בארץ ישראל", "מקומות מהתנ״ך ומסלולי האבות", "https://eretz.hania360.com/"], ["🙏", "איזו ברכה?", "משחק ברכות לילדים", "https://yahadut.hania360.com/#bracha"]]],
  ["home", "💰", "כסף ובית", [["💳", "HaniaSave", "איזו הטבה הכי משתלמת בכל חנות", "https://save.hania360.com/"], ["🛒", "קניות ומלאי", "רשימה משותפת, ומה כבר יש בבית", "https://bayit.hania360.com/#cart"], ["💡", "חשבונות הבית", "כמה יוצא בחודש על חשבונות ומנויים", "https://bayit.hania360.com/#bills"], ["🎂", "ימי הולדת", "גיל ויום הולדת עברי, עם תזכורת", "https://bayit.hania360.com/#gil"], ["🔎", "HaniaCheck", "בודקים רכב, חברה או קבלן לפני שמשלמים", "https://check.hania360.com/"], ["💌", "הזמנה ואישורי הגעה", "הזמנה מעוצבת ואישורים בוואטסאפ, בחינם", "https://hazmana.hania360.com/"]]],
  ["fun", "🎮", "כיף", [["🏎️", "HaniaRace", "חדש: נהיגה ברחובות אמיתיים של 20 ערים", "https://race.hania360.com/"], ["✈️", "HaniaFlight", "סימולטור טיסה עם מטוסי חיל האוויר", "https://flight.hania360.com/?ref=home"], ["🎮", "HaniaParty", "משחקי מסיבה על המסך הגדול", "https://party.hania360.com/"], ["📺", "HaniaTV", "טלוויזיה ורדיו בשידור חי", "https://tv.hania360.com/"], ["⚽", "HaniaSport", "תוצאות חיות וטבלה", "https://sport.hania360.com/"], ["🌍", "כדור הארץ", "מדינות, דגלים ודרכון לילדים", "https://globe.hania360.com/"]]]
];
export const FAQ = [
  ["מה זה Hania360?", `Hania360 הוא אוסף של ${APP_TXT} אפליקציות חינמיות בעברית למשפחה הישראלית: שגרה ומטלות לילדים, זמני שבת וחגים, לימוד יומי, רשימת קניות, חיסכון והטבות, ימי הולדת, הזמנות לאירועים, טיולים, טלוויזיה, ספורט ומשחקים. כל האפליקציות נפתחות ישר בדפדפן, בטלפון ובמחשב.`],
  ["כמה זה עולה?", "כלום. כל האפליקציות חינמיות. בחלק מהעמודים יש פרסומות או קישורי שותפים, וזה לא משנה את המחיר שלכם."],
  ["צריך להוריד אפליקציה או להירשם?", "לא. לוחצים ומשתמשים. אפשר להוסיף כל אפליקציה למסך הבית של הטלפון כמו אפליקציה רגילה. חשבון הוא רק אם רוצים לשמור את הנתונים בכמה מכשירים."],
  ["מה זה Hania Today?", "Hania Today הוא הדף האישי שלך: הוא אוסף לבד מהאפליקציות האחרות את מה שחשוב היום (משימות, תזכורות, ימי הולדת קרובים, שוברים שעומדים לפוג וזמני שבת) ומראה הכול במקום אחד. לא צריך למלא בו כלום."],
  ["מה זה Hania Pass ואיך נכנסים?", "Hania Pass הוא חשבון אחד לכל האפליקציות. נכנסים רק עם מייל: מקבלים קישור, לוחצים, וזהו. בלי סיסמה. אפשר גם להיכנס עם טביעת אצבע או פנים (Passkey)."],
  ["יש ווידג׳ט למסך הבית?", "כן. באנדרואיד מורידים את האפליקציה של Hania360 (hania360.com/app) ומוסיפים את הווידג׳ט: תאריך עברי, זמני שבת והדבר הבא שלך. באייפון מוסיפים את האתר למסך הבית מתפריט השיתוף."],
  ["מה עם שבת?", "האפליקציות מכבדות את השבת: אין תזכורות מכניסת שבת ועד צאתה, וגם לא בחגים. זמני השבת מחושבים לפי העיר שלכם."],
  ["מה קורה עם הפרטיות שלי?", "רוב הנתונים נשמרים בטלפון שלכם בלבד. אם בוחרים חשבון, הנתונים נשמרים מוצפנים ורק בשבילכם. לא מוכרים מידע לאף אחד. כל חיבור בין אפליקציות נעשה רק באישורכם."]
];

function dialHtml() {
  const bubbles = MOMENTS.map((m, i) => { const a = m[0] / 24 * Math.PI * 2; return `<button class="v3-b" type="button" data-i="${i}" style="--x:${(50 + Math.sin(a) * 43).toFixed(2)}%;--y:${(50 - Math.cos(a) * 43).toFixed(2)}%" aria-label="${esc(m[2])}">${m[1]}</button>`; }).join("");
  const ticks = Array.from({ length: 24 }, (_, h) => { const a = h / 24 * 360; return `<i class="v3-t${h % 6 ? "" : " big"}" style="--r:${a}deg"></i>`; }).join("");
  const labels = [[0, "00"], [6, "06"], [12, "12"], [18, "18"]].map(([h, t]) => { const a = h / 24 * Math.PI * 2; return `<span class="v3-hl" style="--x:${(50 + Math.sin(a) * 31).toFixed(1)}%;--y:${(50 - Math.cos(a) * 31).toFixed(1)}%">${t}</span>`; }).join("");
  return `<div class="v3-dial" id="dial" role="group" aria-label="היום שלך עם Hania360, שעה אחרי שעה">
  <div class="v3-ring" aria-hidden="true"></div>${ticks}${labels}
  <div class="v3-hand" id="dHand" aria-hidden="true" title="השעה עכשיו"><span id="dSun">☀️</span></div>
  ${bubbles}
  <a class="v3-center" id="dCard" href="${MOMENTS[2][4]}"><small id="dTime">08:15</small><span class="v3-ce" id="dE">${MOMENTS[2][1]}</span><b id="dT">${esc(MOMENTS[2][2])}</b><span class="v3-cl" id="dL">${esc(MOMENTS[2][3])}</span><span class="v3-go">לפתוח ←</span></a>
</div>`;
}
function forHtml() {
  return `<section class="v3-sec" id="for" aria-labelledby="for-h"><h2 id="for-h">בשביל מי זה?</h2><p class="v3-sub">בוחרים, ומקבלים את מה שהכי מתאים. כל השאר מחכה למטה.</p>
<div class="v3-tabs" role="tablist">${FOR.map((f, i) => `<button role="tab" type="button" id="tab-${f[0]}" aria-controls="pan-${f[0]}" aria-selected="${i === 0}" data-k="${f[0]}"><span aria-hidden="true">${f[1]}</span> ${esc(f[2])}</button>`).join("")}</div>
${FOR.map((f, i) => `<div class="v3-pan" role="tabpanel" id="pan-${f[0]}" aria-labelledby="tab-${f[0]}"${i ? " hidden" : ""}>${f[3].map((a) => `<a class="v3-app" href="${esc(a[3])}"><span class="v3-ae" aria-hidden="true">${a[0]}</span><span><b>${esc(a[1])}</b><small>${esc(a[2])}</small></span></a>`).join("")}</div>`).join("")}
</section>`;
}
function todayHtml() {
  const items = [["☀️", "בוקר טוב, שירה", "יום שלישי · כ״ה בכסלו · נר ראשון של חנוכה"], ["🕯️", "הדלקת נרות ביום שישי", "15:55 בירושלים · צאת שבת 17:14"], ["🎂", "סבתא רחל חוגגת 80", "בעוד יומיים · להזמין עוגה?"], ["🎟️", "שובר של ₪120 פג מחר", "בסופר · מתוך HaniaSave"], ["📌", "לשלם ארנונה", "משימה להיום · באיחור"], ["⭐", "נועה: 5 כוכבים בבוקר", "שגרת בוקר הושלמה"]];
  return `<section class="v3-sec v3-split" id="today" aria-labelledby="today-h">
<div class="v3-phone" aria-hidden="true"><div class="v3-notch"></div><div class="v3-scr"><div class="v3-ph-h"><b>Hania Today</b><span>☀️</span></div>${items.map((x, i) => `<div class="v3-it" style="--d:${i * 0.35}s"><span>${x[0]}</span><span><b>${x[1]}</b><small>${x[2]}</small></span></div>`).join("")}</div></div>
<div class="v3-copy"><p class="v3-eyebrow">Hania Today</p><h2 id="today-h">הבוקר שלך, בדף אחד.</h2>
<p>Today לא עוד אפליקציה שצריך למלא. הוא <b>אוסף לבד</b> מכל האפליקציות את מה שחשוב היום: משימות, תזכורות, ימי הולדת, שוברים שעומדים לפוג, הילדים וזמני השבת. פותחים פעם אחת בבוקר ויודעים הכול.</p>
<ul class="v3-ticks"><li>מתעדכן לבד מהאפליקציות שבהן כבר השתמשת</li><li>מסונכרן בין הטלפון למחשב, ובין בני הבית</li><li>שקט בשבת ובחג</li></ul>
<form class="v3-in" id="signIn" novalidate><label for="inMail">נכנסים עם מייל בלבד, בלי סיסמה:</label><div class="v3-inrow"><input id="inMail" type="email" inputmode="email" autocomplete="email" placeholder="your@email.com" dir="ltr" required><button type="submit">שלחו לי קישור</button></div><p class="v3-inmsg" id="inMsg" role="status"></p></form>
</div></section>`;
}
function widgetHtml() {
  return `<section class="v3-sec v3-split rev" id="widget" aria-labelledby="w-h">
<div class="v3-home" aria-hidden="true"><div class="v3-wdg"><div class="v3-wt"><b id="wDay">יום שלישי</b><span id="wHeb">כ״ה בכסלו</span></div><div class="v3-wshab"><span>🕯️ <b id="wIn">15:55</b></span><span>✨ <b id="wOut">17:14</b></span></div><div class="v3-wnext" id="wNext">📋 הבא: לאסוף את נועה מהחוג · 16:30</div></div>
<div class="v3-icons">${["🛒", "🌙", "🕯️", "💳", "📺", "🏎️", "🎂", "⚽"].map((e) => `<span>${e}</span>`).join("")}</div></div>
<div class="v3-copy"><p class="v3-eyebrow">הווידג׳ט</p><h2 id="w-h">היום שלך, על מסך הבית.</h2>
<p>תאריך עברי, זמני שבת בעיר שלך, והדבר הבא ביומן. בלי לפתוח כלום: מסתכלים על הטלפון ויודעים.</p>
<div class="v3-btns"><a class="v3-btn" href="/app">📥 הורדה לאנדרואיד</a><button class="v3-btn ghost" type="button" id="iosBtn">🍎 יש לי אייפון</button></div>
<p class="v3-ios" id="iosTip" hidden>באייפון: פותחים את hania360.com בספארי ← כפתור השיתוף <b>⬆️</b> ← <b>הוספה למסך הבית</b>. כך כל אפליקציה נפתחת במסך מלא, כמו אפליקציה רגילה.</p>
</div></section>`;
}
function howHtml() {
  return `<section class="v3-sec" id="how" aria-labelledby="how-h"><h2 id="how-h">איך זה עובד</h2><ol class="v3-steps">
<li><span class="v3-n">1</span><b>פותחים ומשתמשים</b><span>כל אפליקציה נפתחת בלחיצה, בטלפון או במחשב. בלי להוריד ובלי להירשם.</span></li>
<li><span class="v3-n">2</span><b>חשבון אחד, אם רוצים</b><span>Hania Pass: רק מייל, בלי סיסמה. הרשימות והתזכורות נשמרות בכל מכשיר.</span></li>
<li><span class="v3-n">3</span><b>הכול מתחבר</b><span>Today אוסף מכל האפליקציות, והווידג׳ט שם את היום שלך על מסך הבית.</span></li></ol></section>`;
}
function gamesHtml() {
  return `<section class="v3-sec" id="play" aria-labelledby="play-h"><h2 id="play-h">🎮 ובשביל הכיף</h2><div class="v3-games">
<a class="v3-game race" href="https://race.hania360.com/"><span class="v3-new">חדש</span><b>🏎️ HaniaRace: עיר פתוחה</b><span>נוהגים ברחובות האמיתיים של תל אביב, ירושלים, חיפה, נתיבות ועוד 16 ערים. תנועה, רמזורים, משימות של כבאית, אמבולנס ומונית.</span></a>
<a class="v3-game flight" href="https://flight.hania360.com/?ref=home"><b>✈️ HaniaFlight</b><span>סימולטור טיסה עם מטוסי חיל האוויר מעל מפה אמיתית של ישראל.</span></a>
<a class="v3-game party" href="https://party.hania360.com/"><b>🎮 HaniaParty</b><span>מסיבה לכל המשפחה על המסך הגדול: כל אחד משחק מהטלפון שלו.</span></a></div></section>`;
}
function faqHtml() {
  return `<section class="v3-sec" id="faq" aria-labelledby="faq-h"><h2 id="faq-h">שאלות ששואלים אותנו</h2><div class="v3-faq">${FAQ.map((q, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join("")}</div></section>`;
}
export function homeJsonLd() {
  const ld = [
    { "@context": "https://schema.org", "@type": "Organization", "@id": "https://hania360.com/#org", name: "Hania360", url: "https://hania360.com/", logo: "https://hania360.com/icons/icon-512.png", slogan: SLOGAN, description: `אוסף של ${APP_TXT} אפליקציות חינמיות בעברית למשפחה: שגרה לילדים, שבת וחגים, קניות וחיסכון, טיולים ומשחקים.`, areaServed: "IL", knowsLanguage: "he" },
    { "@context": "https://schema.org", "@type": "WebSite", "@id": "https://hania360.com/#site", name: "Hania360", alternateName: ["הניה 360", "חניה 360", "Hania 360"], url: "https://hania360.com/", inLanguage: "he-IL", publisher: { "@id": "https://hania360.com/#org" },
      potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: "https://hania360.com/?q={search_term_string}" }, "query-input": "required name=search_term_string" } },
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Hania360", url: "https://hania360.com/", applicationCategory: "LifestyleApplication", operatingSystem: "Web, Android, iOS", inLanguage: "he", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "ILS" }, featureList: FOR.flatMap((f) => f[3].map((a) => a[1] + ": " + a[2])) },
    { "@context": "https://schema.org", "@type": "ItemList", name: "האפליקציות של Hania360", itemListElement: WORLDS.flatMap((w) => w.apps).slice(0, 40).map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a[1], description: a[2], url: a[3] })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((q) => ({ "@type": "Question", name: q[0], acceptedAnswer: { "@type": "Answer", text: q[1] } })) }
  ];
  return ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("");
}
// The living logo: a ring of the day's colours, and the sun (or the moon) where the hour is now
export const LOGO = `<span class="v3-logo" aria-hidden="true"><span class="v3-lr"></span><span class="v3-ld" id="logoDot"></span><b>H</b></span>`;

export const HOME3_CSS = `
.v3 [hidden]{display:none!important}
body.v3{background:#FFFBF4;color:#17133A;font-family:Rubik,system-ui,-apple-system,"Segoe UI",Arial,sans-serif;margin:0}
.v3 *{box-sizing:border-box}.v3 a{color:inherit}
.v3-top{position:sticky;top:0;z-index:30;background:rgba(255,251,244,.86);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(23,19,58,.06)}
.v3-bar{width:min(1120px,calc(100% - 28px));margin:auto;display:flex;align-items:center;gap:14px;height:62px}
.v3-brand{display:flex;align-items:center;gap:10px;text-decoration:none;font:400 22px/1 "Secular One",Rubik,sans-serif;color:#17133A}
.v3-logo{position:relative;width:38px;height:38px;display:inline-grid;place-items:center;flex:none}
.v3-lr{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,#1B1F4B 0deg,#3B2F7A 60deg,#FF7A59 85deg,#FFC24B 110deg,#57B8FF 160deg,#4DA3FF 230deg,#FF8A4C 265deg,#B5487A 290deg,#2B2361 320deg,#1B1F4B 360deg);-webkit-mask:radial-gradient(circle,transparent 54%,#000 56%);mask:radial-gradient(circle,transparent 54%,#000 56%)}
.v3-ld{position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px;border-radius:50%;background:#FFE38A;box-shadow:0 0 8px 2px rgba(255,200,80,.9);transform:rotate(var(--a,0deg)) translateY(-16px)}
.v3-logo b{font:400 17px/1 "Secular One",Rubik,sans-serif;color:#17133A}
.v3-nav{display:flex;gap:4px;margin-inline-start:auto}.v3-nav a{text-decoration:none;font-weight:600;font-size:15px;padding:8px 12px;border-radius:999px;color:#3D3866}.v3-nav a:hover{background:rgba(23,19,58,.06)}
.v3-acc{display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:0 16px;border-radius:999px;background:#17133A;color:#fff!important;text-decoration:none;font-weight:700;font-size:14.5px;white-space:nowrap;max-width:46vw;overflow:hidden;text-overflow:ellipsis}
.v3-acc.on{background:#fff;color:#17133A!important;border:1.5px solid #FF8A4C}
@media (max-width:720px){.v3-nav{display:none}.v3-acc{margin-inline-start:auto}}
.v3-wrap{width:min(1120px,calc(100% - 28px));margin:auto}
.v3-hero{display:grid;grid-template-columns:1.05fr .95fr;gap:36px;align-items:center;padding:42px 0 26px}
@media (max-width:900px){.v3-hero{grid-template-columns:1fr;gap:18px;padding:22px 0 10px}}
.v3-eyebrow{display:inline-flex;gap:8px;align-items:center;margin:0 0 10px;font-weight:700;font-size:14px;color:#7B3FE4;background:#F1E9FF;border-radius:999px;padding:5px 12px}
.v3-hero h1{font:400 clamp(44px,7.2vw,84px)/1.02 "Secular One",Rubik,sans-serif;margin:0;letter-spacing:-.01em}
.v3-hero h1 em{font-style:normal;background:linear-gradient(90deg,#FF7A59,#FFB13B 40%,#7B3FE4);-webkit-background-clip:text;background-clip:text;color:transparent}
.v3-lead{font-size:clamp(17px,2.1vw,20px);line-height:1.6;color:#4A4570;margin:16px 0 14px;max-width:34em}
.v3-chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px;padding:0;list-style:none}.v3-chips li{background:#fff;border:1px solid rgba(23,19,58,.1);border-radius:999px;padding:6px 12px;font-weight:600;font-size:14.5px}
.v3 .h26-find{position:relative;max-width:560px}
.v3 .h26-search{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #17133A;border-radius:18px;padding:4px 14px;box-shadow:0 10px 0 -4px rgba(23,19,58,.12)}
.v3 .h26-search input{flex:1;border:0;outline:0;background:none;font:inherit;font-size:17px;padding:12px 0;color:#17133A;min-width:0}
.v3 .h26-res{position:absolute;inset:calc(100% + 8px) 0 auto;z-index:20;background:#fff;border-radius:18px;box-shadow:0 24px 60px -18px rgba(23,19,58,.35);padding:6px;display:grid;gap:2px;max-height:60vh;overflow:auto}
.v3 .h26-r{display:flex;gap:10px;align-items:center;padding:10px;border-radius:12px;text-decoration:none}.v3 .h26-r:hover,.v3 .h26-r:focus{background:#F6F1FF}
.v3 .h26-r-e{font-size:22px;width:30px;text-align:center}.v3 .h26-r b{display:block}.v3 .h26-r small{color:#6B6690}.v3 .h26-none{margin:10px;color:#6B6690}
.v3-now{display:inline-flex;align-items:center;gap:10px;margin-top:14px;text-decoration:none;background:linear-gradient(90deg,#FFF1E2,#F4ECFF);border-radius:16px;padding:10px 14px;font-size:15px}
.v3-now small{display:block;color:#7B3FE4;font-weight:700;font-size:12.5px}.v3-now b{font-weight:700}.v3-now .e{font-size:24px}
.v3-dial{position:relative;width:min(470px,92vw);aspect-ratio:1;margin:auto;touch-action:none;user-select:none;-webkit-user-select:none}
.v3-ring{position:absolute;inset:7%;border-radius:50%;background:conic-gradient(from 0deg,#1B1F4B 0deg,#3B2F7A 60deg,#FF7A59 85deg,#FFC24B 110deg,#7CC8FF 160deg,#57B0FF 230deg,#FF8A4C 265deg,#B5487A 290deg,#2B2361 320deg,#1B1F4B 360deg);-webkit-mask:radial-gradient(circle,transparent 61%,#000 62%);mask:radial-gradient(circle,transparent 61%,#000 62%);box-shadow:0 30px 80px -30px rgba(123,63,228,.5)}
.v3-t{position:absolute;left:50%;top:50%;width:2px;height:7px;margin:-3.5px -1px;background:rgba(255,255,255,.55);border-radius:2px;transform:rotate(var(--r)) translateY(calc(-1 * min(470px,92vw) * .385))}
.v3-t.big{height:12px;width:3px;background:#fff}
.v3-hl{position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);font-size:12px;font-weight:700;color:#8C86B3;font-variant-numeric:tabular-nums}
.v3-hand{position:absolute;inset:0;transform:rotate(var(--a,0deg));pointer-events:none;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.v3-hand span{position:absolute;left:50%;top:15%;transform:translate(-50%,-50%) rotate(calc(-1 * var(--a,0deg)));font-size:clamp(22px,5vw,30px);filter:drop-shadow(0 0 10px rgba(255,214,120,.95))}
.v3-b{position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);width:clamp(40px,9.5vw,52px);height:clamp(40px,9.5vw,52px);border-radius:50%;border:2.5px solid #fff;background:#fff;box-shadow:0 8px 20px -8px rgba(23,19,58,.45);font-size:clamp(19px,4.4vw,25px);cursor:pointer;display:grid;place-items:center;transition:transform .2s,box-shadow .2s;padding:0}
.v3-b:hover{transform:translate(-50%,-50%) scale(1.12)}.v3-b.on{transform:translate(-50%,-50%) scale(1.22);box-shadow:0 0 0 4px #FFB13B,0 10px 24px -6px rgba(255,138,76,.8);z-index:2}
.v3-b:focus-visible{outline:3px solid #7B3FE4;outline-offset:2px}
.v3-center{position:absolute;inset:25%;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 1px rgba(23,19,58,.06),0 20px 50px -24px rgba(23,19,58,.35);display:grid;align-content:center;justify-items:center;text-align:center;padding:8% 10%;gap:2px;text-decoration:none}
.v3-center small{font-weight:700;color:#7B3FE4;font-variant-numeric:tabular-nums;font-size:clamp(12px,2.6vw,14px)}
.v3-ce{font-size:clamp(30px,7vw,44px);line-height:1.1}.v3-center b{font-size:clamp(16px,3.4vw,20px)}
.v3-cl{font-size:clamp(11.5px,2.5vw,13.5px);color:#5D5885;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.v3-go{margin-top:4px;font-weight:800;color:#FF6A3D;font-size:clamp(12.5px,2.6vw,14.5px)}
.v3-center.flip{animation:v3f .45s ease}@keyframes v3f{from{opacity:.2;transform:scale(.94)}}
.v3-sec{padding:44px 0}.v3-sec h2{font:400 clamp(30px,4.6vw,46px)/1.1 "Secular One",Rubik,sans-serif;margin:0 0 8px}.v3-sub{color:#5D5885;margin:0 0 18px;font-size:17px}
.v3-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}.v3-tabs button{appearance:none;border:2px solid #17133A;background:#fff;border-radius:999px;padding:10px 18px;font:inherit;font-weight:700;font-size:16px;cursor:pointer;color:#17133A}
.v3-tabs button[aria-selected="true"]{background:#17133A;color:#fff}
.v3-pan{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.v3-app{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid rgba(23,19,58,.08);border-radius:20px;padding:14px;text-decoration:none;transition:transform .15s,box-shadow .15s}
.v3-app:hover{transform:translateY(-2px);box-shadow:0 14px 30px -18px rgba(23,19,58,.45)}
.v3-ae{font-size:28px;width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#FFF1E2,#F1E9FF);display:grid;place-items:center;flex:none}
.v3-app b{display:block;font-size:16.5px}.v3-app small{color:#5D5885;font-size:14px;line-height:1.35}
.v3-steps{list-style:none;padding:0;margin:14px 0 0;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}@media (max-width:820px){.v3-steps{grid-template-columns:1fr}}
.v3-steps li{background:#fff;border-radius:22px;padding:20px;display:grid;gap:6px;border:1px solid rgba(23,19,58,.08)}.v3-steps b{font-size:19px}.v3-steps span:last-child{color:#5D5885;line-height:1.5}
.v3-n{width:38px;height:38px;border-radius:50%;background:#17133A;color:#fff;display:grid;place-items:center;font:400 20px/1 "Secular One",sans-serif}
.v3-split{display:grid;grid-template-columns:.8fr 1.2fr;gap:40px;align-items:center}.v3-split.rev{grid-template-columns:1.2fr .8fr}.v3-split.rev .v3-home{order:2}
@media (max-width:860px){.v3-split,.v3-split.rev{grid-template-columns:1fr}.v3-split.rev .v3-home{order:0}}
.v3-copy p{font-size:17.5px;line-height:1.65;color:#3D3866}.v3-copy .v3-eyebrow{font-size:14px}
.v3-ticks{list-style:none;padding:0;margin:0 0 18px;display:grid;gap:6px}.v3-ticks li::before{content:"✓";color:#16A34A;font-weight:900;margin-inline-end:8px}
.v3-phone{width:min(300px,80vw);margin:auto;aspect-ratio:9/18.5;border-radius:42px;background:#17133A;padding:12px;box-shadow:0 40px 80px -30px rgba(23,19,58,.6);position:relative}
.v3-notch{position:absolute;top:18px;left:50%;width:90px;height:22px;margin-left:-45px;border-radius:12px;background:#000;z-index:2}
.v3-scr{height:100%;border-radius:32px;background:linear-gradient(180deg,#FFF6EA,#F3ECFF);padding:52px 12px 12px;display:grid;align-content:start;gap:8px;overflow:hidden}
.v3-ph-h{display:flex;justify-content:space-between;align-items:center;font-size:17px;padding:0 4px 4px}
.v3-it{display:flex;gap:10px;align-items:center;background:#fff;border-radius:16px;padding:9px 10px;box-shadow:0 6px 16px -12px rgba(23,19,58,.5);opacity:0;transform:translateY(10px);animation:v3in .6s ease forwards;animation-delay:var(--d)}
.v3-it>span:first-child{font-size:20px}.v3-it b{display:block;font-size:13.5px}.v3-it small{display:block;font-size:11.5px;color:#6B6690}
@keyframes v3in{to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.v3-it{animation:none;opacity:1;transform:none}.v3-hand{transition:none}}
.v3-in{display:grid;gap:8px;background:#fff;border:1px solid rgba(23,19,58,.1);border-radius:20px;padding:16px;margin-top:6px}.v3-in label{font-weight:700}
.v3-inrow{display:flex;gap:8px;flex-wrap:wrap}.v3-inrow input{flex:1 1 220px;min-width:0;font:inherit;font-size:17px;border:2px solid #D9D3EE;border-radius:14px;padding:12px 14px;text-align:left}
.v3-inrow input:focus{outline:0;border-color:#7B3FE4}
.v3-inrow button,.v3-btn{appearance:none;border:0;border-radius:14px;background:linear-gradient(90deg,#FF7A59,#FF9F3B);color:#fff;font:inherit;font-weight:800;font-size:16.5px;padding:12px 20px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;box-shadow:0 10px 24px -12px rgba(255,106,61,.8)}
.v3-btn.ghost{background:#fff;color:#17133A;border:2px solid #17133A;box-shadow:none}
.v3-btns{display:flex;gap:10px;flex-wrap:wrap}.v3-inmsg{margin:0;font-weight:600;min-height:1.4em}.v3-inmsg.ok{color:#15803D}.v3-inmsg.err{color:#C2410C}
.v3-ios{background:#fff;border-radius:16px;padding:12px 14px;border:1px solid rgba(23,19,58,.1)}
.v3-home{width:min(330px,84vw);margin:auto;aspect-ratio:9/16;border-radius:36px;padding:22px 16px;background:linear-gradient(160deg,#3B2F7A,#FF7A59 75%,#FFC24B);box-shadow:0 40px 80px -30px rgba(23,19,58,.6);display:grid;align-content:start;gap:18px}
.v3-wdg{background:rgba(255,255,255,.92);border-radius:24px;padding:14px;display:grid;gap:8px;box-shadow:0 10px 30px -10px rgba(0,0,0,.35)}
.v3-wt{display:flex;justify-content:space-between;align-items:baseline}.v3-wt b{font-size:18px}.v3-wt span{color:#6B6690;font-size:14px}
.v3-wshab{display:flex;gap:16px;font-size:15px}.v3-wnext{font-size:13.5px;background:#F4ECFF;border-radius:12px;padding:8px 10px}
.v3-icons{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;justify-items:center}.v3-icons span{width:54px;height:54px;border-radius:16px;background:rgba(255,255,255,.88);display:grid;place-items:center;font-size:26px}
.v3-games{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px}@media (max-width:860px){.v3-games{grid-template-columns:1fr}}
.v3-game{position:relative;border-radius:24px;padding:22px;color:#fff;text-decoration:none;display:grid;gap:8px;align-content:end;min-height:190px;overflow:hidden}
.v3-game b{font:400 24px/1.15 "Secular One",Rubik,sans-serif}.v3-game span{line-height:1.5;opacity:.92}
.v3-game.race{background:linear-gradient(160deg,rgba(11,16,32,.2),rgba(11,16,32,.85)),repeating-linear-gradient(90deg,#2B2F3A 0 40px,#30343F 40px 80px);}
.v3-game>*{position:relative;z-index:1}
.v3-game.race::before{content:"";position:absolute;inset:18% -10% auto -10%;height:6px;z-index:0;background:repeating-linear-gradient(90deg,#fff 0 30px,transparent 30px 60px);opacity:.6;transform:perspective(200px) rotateX(55deg)}
.v3-game.flight{background:linear-gradient(170deg,#57B0FF,#1B3F8C)}.v3-game.party{background:linear-gradient(170deg,#B5487A,#3B2F7A)}
.v3-new{position:absolute;top:14px;inset-inline-start:14px;background:#FF4D4F;color:#fff;font-weight:800;font-size:13px;border-radius:999px;padding:3px 10px}
.v3-faq{display:grid;gap:10px;max-width:860px}.v3-faq details{background:#fff;border-radius:18px;border:1px solid rgba(23,19,58,.08);padding:4px 18px}
.v3-faq summary{cursor:pointer;font-weight:700;font-size:17.5px;padding:14px 0;list-style:none}.v3-faq summary::after{content:"+";float:left;font-weight:400;font-size:22px;line-height:1}.v3-faq details[open] summary::after{content:"−"}
.v3-faq p{margin:0 0 16px;line-height:1.7;color:#3D3866}
.v3-foot{border-top:1px solid rgba(23,19,58,.08);margin-top:30px;padding:26px 0 40px;color:#6B6690;font-size:14.5px}
.v3-foot nav{display:flex;flex-wrap:wrap;gap:6px 16px;margin-bottom:10px}.v3-foot a{text-decoration:none;font-weight:600;color:#3D3866}
.v3-slogan{font:400 20px/1.2 "Secular One",Rubik,sans-serif;color:#17133A;margin:0 0 6px}
/* the reused sections, on the new page */
.v3 .h26-sec{width:auto;margin:0;padding:44px 0}.v3 .l26,.v3 .y26{margin-inline:auto}
.v3 #me{margin-top:16px}
.y26-back .v3-hero h1,.y26-back .v3-lead,.y26-back .v3-chips,.y26-back .v3-hero .v3-eyebrow{display:none}
.y26-back .v3-hero{padding-top:8px}
`;

export function home3Page(P) {
  // P: { live, now, nowMore, map, me: [html, js], search, accountJs, css, title, description }
  const nowCard = `<a class="v3-now" id="nowCard" href="https://bayit.hania360.com/#cart"><span class="e" id="nowE" aria-hidden="true">🛒</span><span><small id="nowK">עכשיו</small><b id="nowT">רשימת הקניות של הבית</b></span><span aria-hidden="true">←</span></a>`;
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#FFFBF4">
<title>${esc(P.title)}</title><meta name="description" content="${esc(P.description)}"><link rel="canonical" href="https://hania360.com/">
<link rel="manifest" href="/manifest.webmanifest"><link rel="icon" href="/icons/favicon-48.png" sizes="48x48"><link rel="apple-touch-icon" href="/icons/apple-180.png"><meta name="apple-mobile-web-app-title" content="Hania360">
<meta property="og:type" content="website"><meta property="og:site_name" content="Hania360"><meta property="og:locale" content="he_IL"><meta property="og:title" content="Hania360 · ${esc(SLOGAN)}"><meta property="og:description" content="${esc(P.description)}"><meta property="og:url" content="https://hania360.com/"><meta property="og:image" content="https://hania360.com/og/home.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="text/plain" href="/llms.txt" title="Hania360 for AI assistants">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Secular+One&family=Rubik:wght@400;500;600;700;800&display=swap">
${homeJsonLd()}
<style>${P.css}${HOME3_CSS}</style>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5716914780099032" crossorigin="anonymous"></script></head>
<body class="v3">
<header class="v3-top"><div class="v3-bar"><a class="v3-brand" href="/" aria-label="Hania360, לדף הבית">${LOGO}<span>Hania360</span></a>
<nav class="v3-nav" aria-label="ניווט ראשי"><a href="#for">בשביל מי</a><a href="#today">Today</a><a href="#widget">ווידג׳ט</a><a href="#apps">כל האפליקציות</a><a href="#faq">שאלות</a></nav>
<a class="v3-acc" id="acct" href="#today">כניסה</a></div></header>
<main class="v3-wrap">
<section class="v3-hero" aria-labelledby="hero-h">
<div><p class="v3-eyebrow">✨ ${APP_TXT} אפליקציות בעברית · חינם</p>
<h1 id="hero-h">הבית שלך,<br><em>מסביב לשעון.</em></h1>
<p class="v3-lead">כל מה שמשפחה ישראלית צריכה ביום אחד: <b>שגרה ומטלות לילדים, שבת וחגים, קניות וחיסכון, טיולים ומשחקים</b>. הכול נפתח ישר בדפדפן, בלי להוריד ובלי להירשם.</p>
<ul class="v3-chips" aria-label="בקצרה"><li>🆓 חינם לגמרי</li><li>⚡ בלי הורדה</li><li>🙅 בלי הרשמה</li><li>🕯️ שקט בשבת</li></ul>
<div class="h26-find"><label class="h26-search"><span aria-hidden="true">🔎</span><input id="appQ" type="search" autocomplete="off" placeholder="מה צריך? שגרה, זמני שבת, קניות, מספר רכב…" aria-label="חיפוש באפליקציות"></label><div class="h26-res" id="appRes" role="listbox" hidden></div></div>
${nowCard}
<p class="tiny" id="heroNote" hidden></p>
</div>
${dialHtml()}
</section>
${P.me[0]}${P.me[1]}
${forHtml()}
${howHtml()}
${todayHtml()}
${widgetHtml()}
${P.live}
${P.now || ""}
${gamesHtml()}
${P.map}
${faqHtml()}
<nav class="h26-guides" aria-label="מדריכים"><a href="/guides/compare-benefits-before-buying">💳 איזו הטבה הכי משתלמת</a><a href="/guides/vouchers-before-they-expire">⏳ שוברים שלא יפוגו</a><a href="/guides/free-rsvp-wedding-whatsapp">💌 אישורי הגעה בחינם</a><a href="/guides/haniago-family-trip-planning">🧳 טיול משפחתי</a><a href="/guides">כל המדריכים ←</a></nav>
</main>
<footer class="v3-foot"><div class="v3-wrap"><p class="v3-slogan">Hania360 · ${esc(SLOGAN)}</p><nav aria-label="קישורים"><a href="/about">אודות</a><a href="/guides">מדריכים</a><a href="/reminders">התזכורות שלי</a><a href="/app">אפליקציה לאנדרואיד</a><a href="/privacy">מדיניות פרטיות</a><a href="/terms">תנאי שימוש</a><a href="/contact">יצירת קשר</a></nav>
<p>בחלק מהשירותים יש פרסום או קישורי שותפים, וזה לא משנה את המחיר שלכם. הנתונים שלכם נשארים שלכם. © 2026 Hania360 · נבנה בישראל</p></div></footer>
${P.search}
${P.nowMore || ""}
<script>${HOME3_JS}</script>
</body></html>`;
}

// The dial, the picker, the sign-in form, the widget's live numbers, the living logo, the account button, ?q=
export const HOME3_JS = `(function(){var $=function(i){return document.getElementById(i)};
var M=${JSON.stringify(MOMENTS)},fri=new Date().getDay()===5;
if(fri)M.splice(7,0,[14,"🕯️","ערב שבת","זמני שבת בעיר שלך, ורשימת הכנות לשבת","https://yahadut.hania360.com/#dat"]);
function nowH(){var p=new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Asia/Jerusalem"}).split(":");return +p[0]+p[1]/60}
function hm(h){var a=Math.floor(h)%24,b=Math.round((h-Math.floor(h))*60);if(b===60){a=(a+1)%24;b=0}return(a<10?"0":"")+a+":"+(b<10?"0":"")+b}
// the living logo and the hand: where the hour is now
function tick(){var h=nowH(),a=h/24*360,d=$("logoDot");if(d)d.style.setProperty("--a",a+"deg");var sun=$("dSun");if(sun)sun.textContent=h>=6&&h<18.3?"☀️":"🌙";var hd=$("dHand");if(hd)hd.style.setProperty("--a",a+"deg")}
tick();setInterval(tick,60000);
var dial=$("dial");if(dial){
 // the bubbles move round if Friday added one
 var bs=dial.querySelectorAll(".v3-b");
 if(fri){var old=[].slice.call(bs);old.forEach(function(b){b.remove()});M.forEach(function(m,i){var b=document.createElement("button");b.type="button";b.className="v3-b";b.dataset.i=i;var a=m[0]/24*Math.PI*2;b.style.setProperty("--x",(50+Math.sin(a)*43)+"%");b.style.setProperty("--y",(50-Math.cos(a)*43)+"%");b.setAttribute("aria-label",m[2]);b.textContent=m[1];dial.insertBefore(b,$("dCard"))});bs=dial.querySelectorAll(".v3-b")}
 var cur=-1,auto=null,touched=false;
 function nearest(h){var best=0,bd=99;M.forEach(function(m,i){var d=Math.abs(m[0]-h);d=Math.min(d,24-d);if(d<bd){bd=d;best=i}});return best}
 function pick(i,fromNow){if(i===cur)return;cur=i;var m=M[i];[].forEach.call(bs,function(b){b.classList.toggle("on",+b.dataset.i===i)});
  var c=$("dCard");c.href=m[4];$("dTime").textContent=fromNow?"עכשיו · "+hm(nowH()):hm(m[0]);$("dE").textContent=m[1];$("dT").textContent=m[2];$("dL").textContent=m[3];c.classList.remove("flip");void c.offsetWidth;c.classList.add("flip");
}
 pick(nearest(nowH()),true);
 var still=matchMedia("(prefers-reduced-motion: reduce)").matches;
 function demo(){if(touched||still)return;auto=setInterval(function(){if(touched){clearInterval(auto);return}pick((cur+1)%M.length)},3200)}
 setTimeout(demo,4500);
 function stop(){touched=true;if(auto)clearInterval(auto)}
 dial.addEventListener("click",function(e){var b=e.target.closest(".v3-b");if(!b)return;stop();pick(+b.dataset.i)});
 dial.addEventListener("keydown",function(e){if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;stop();e.preventDefault();var n=(cur+(e.key==="ArrowLeft"?1:-1)+M.length)%M.length;pick(n);var b=dial.querySelector('.v3-b[data-i="'+n+'"]');if(b)b.focus()});
 // dragging round the ring turns the day
 var drag=false;function at(e){var r=dial.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.hypot(x,y)/(r.width/2);return{h:((Math.atan2(x,-y)/Math.PI/2*24)+24)%24,d:d}}
 dial.addEventListener("pointerdown",function(e){var p=at(e);if(p.d<.58||e.target.closest(".v3-b"))return;drag=true;stop();dial.setPointerCapture(e.pointerId);pick(nearest(p.h))});
 dial.addEventListener("pointermove",function(e){if(drag)pick(nearest(at(e).h))});
 ["pointerup","pointercancel"].forEach(function(k){dial.addEventListener(k,function(){drag=false})});
 // keep the demo out of the way once the dial is off screen
 if("IntersectionObserver"in window)new IntersectionObserver(function(es){es.forEach(function(x){if(!x.isIntersecting&&auto){clearInterval(auto);auto=null}else if(x.isIntersecting&&!auto&&!touched)demo()})}).observe(dial)}
// who is it for
var tabs=document.querySelector(".v3-tabs");if(tabs){var pref="";try{pref=(h360pref()||{}).who||""}catch(e){}
 function sel(k){[].forEach.call(tabs.children,function(b){b.setAttribute("aria-selected",String(b.dataset.k===k))});document.querySelectorAll(".v3-pan").forEach(function(p){p.hidden=p.id!=="pan-"+k})}
 if(pref&&document.getElementById("pan-"+pref))sel(pref);
 tabs.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;sel(b.dataset.k);try{h360pref({who:b.dataset.k})}catch(x){}})}
// iPhone tip
var ib=$("iosBtn");if(ib)ib.onclick=function(){var t=$("iosTip");t.hidden=!t.hidden};
// the widget shows today's real date and Shabbat times
fetch("/api/home?c=0",{credentials:"same-origin"}).then(function(r){return r.ok?r.json():null}).then(function(o){if(!o||!o.day)return;var d=o.day;$("wDay").textContent=d.day;$("wHeb").textContent=d.heb;if(d.holy){$("wIn").textContent=d.holy.lit;$("wOut").textContent=d.holy.out}}).catch(function(){});
// sign in with an e-mail address, right here
var f=$("signIn");if(f)f.addEventListener("submit",function(e){e.preventDefault();var i=$("inMail"),m=$("inMsg"),v=(i.value||"").trim(),b=f.querySelector("button");
 if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v)){m.className="v3-inmsg err";m.textContent="נראה שחסר משהו בכתובת";i.focus();return}
 b.disabled=true;m.className="v3-inmsg";m.textContent="שולחים…";
 fetch("/api/home/signin",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({email:v})}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){return{ok:r.ok,j:j}})}).then(function(x){b.disabled=false;
  if(x.ok){m.className="v3-inmsg ok";m.textContent="📬 שלחנו קישור ל־"+v+". פותחים את המייל, לוחצים, ונכנסים. (לא הגיע? כדאי להציץ בספאם)"}
  else{m.className="v3-inmsg err";m.textContent=x.j.error==="rate_limited"?"ביקשת כמה קישורים ברצף. נסו שוב בעוד כמה דקות.":"משהו לא עבד. אפשר גם להיכנס דרך pass.hania360.com"}}).catch(function(){b.disabled=false;m.className="v3-inmsg err";m.textContent="אין חיבור כרגע. נסו שוב."})});
// the search box: ?q= from search engines
try{var q=new URLSearchParams(location.search).get("q"),qi=$("appQ");if(q&&qi){qi.value=q.slice(0,60);qi.dispatchEvent(new Event("input"));qi.focus()}}catch(e){}
// the account button: "כניסה" (to the form here), or the person's Today
fetch("https://pass.hania360.com/api/session",{credentials:"include",cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(function(j){var a=$("acct");if(!j||!a)return;
 if(j.signedIn&&j.user){a.textContent="☀️ Today שלי";a.href="https://today.hania360.com/";a.className="v3-acc on";a.title=j.user.email;var t=$("signIn");if(t)t.outerHTML='<p class="v3-in"><b>✓ מחובר כ־'+String(j.user.email).replace(/[<>&"]/g,"")+'</b><a class="v3-btn" href="https://today.hania360.com/">לפתוח את Today שלי ←</a></p>'}}).catch(function(){});
})();`;
