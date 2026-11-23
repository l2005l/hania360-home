// The homepage's map of every app, by "world": what each world is for, and the apps in it, so it is clear where
// things are and what belongs with what. A world with a hub (הילדים שלי, הבית שלנו, היהדות שלי) opens as one app,
// with its tools inside; the others are separate apps that sit together here. Shown on "/" only (/classic keeps
// the old sections).

const W = [
  { k: "kids", e: "👧", name: "הילדים שלי", hub: ["HaniaKids", "https://kids.hania360.com/"], c: "#7A5CFA", line: "אפליקציה אחת לילדים: שגרה, זמן מסך, לימוד וסיפורים. כל ילד עם הכוכבים שלו.",
    apps: [["🌙", "שגרת בוקר וערב", "שלב אחרי שלב, עם טיימר, כוכבים ופרס שבועי", "https://kids.hania360.com/#shigra"], ["🧹", "מטלות הבית", "לכל ילד המטלות שלו, נקודות לפרס או לדמי כיס", "https://kids.hania360.com/#matalot"], ["📺", "זמן מסך", "זמן מסך הוגן ויוטיוב מסונן", "https://kids.hania360.com/#masach"],
      ["📖", "לומדים לקרוא", "אותיות, ניקוד ומילים, עם קול", "https://kids.hania360.com/#ivrit"], ["✍️", "הכתבה", "הטלפון מקריא את מילות השבוע, והילד כותב", "https://kids.hania360.com/#haktava"],
      ["🔤", "אנגלית", "מהאותיות ועד משפטים, מכיתה א׳", "https://kids.hania360.com/#english"], ["🧮", "חשבון", "משחקי חשבון וחידונים", "https://kids.hania360.com/#kita"],
      ["🦉", "שיעורי בית", "עזרה צעד אחר צעד, בלי לתת את התשובה", "https://kids.hania360.com/#shiurim"], ["📚", "סיפור לפני השינה", "סיפור שנכתב לילד, והטלפון מקריא", "https://kids.hania360.com/#sipur"],
      ["🎨", "הספר שלי", "ספר מהציורים של הילד", "https://kids.hania360.com/#sefer"], ["🥪", "קופסת אוכל", "מה בקופסה כל יום, ורשימת קניות", "https://kids.hania360.com/#kufsa"]],
    more: ["🧑‍🏫", "למורים: HaniaKita", "דפי עבודה בלחיצה, תלמיד אקראי, קבוצות וטיימר", "https://kita.hania360.com/"] },
  { k: "bayit", e: "🏠", name: "הבית שלנו", hub: ["HaniaBayit", "https://bayit.hania360.com/"], c: "#0E9F8E", line: "כל מה שמנהל את הבית: קניות, חשבונות, מסמכים, תורנויות וימי הולדת.",
    apps: [["🛒", "קניות ומלאי", "רשימה משותפת, ומה כבר יש בבית", "https://bayit.hania360.com/#cart"], ["💡", "חשבונות", "כל החשבונות והמנויים, כמה יוצא בחודש", "https://bayit.hania360.com/#bills"],
      ["📁", "מסמכי הבית", "דרכונים, אחריות ותוקף של כל המסמכים", "https://bayit.hania360.com/#home"], ["🎂", "ימי הולדת", "גיל ויום הולדת עברי, עם תזכורת", "https://bayit.hania360.com/#gil"],
      ["🎡", "מי בתור?", "גלגל לתורנויות", "https://bayit.hania360.com/#pick"], ["🚗", "הסעות", "מי מסיע היום", "https://bayit.hania360.com/#ride"], ["📞", "כיבוד הורים", "מי מתקשר לסבא וסבתא היום", "https://bayit.hania360.com/#kibud"]],
    more: ["🎉", "לאירועים", "הזמנה ואישורי הגעה (HaniaHazmana), גמד וענק (HaniaGamad)", "https://hazmana.hania360.com/"] },
  { k: "yahadut", e: "🕯️", name: "היהדות שלי", hub: ["HaniaYahadut", "https://yahadut.hania360.com/"], c: "#2D4BC7", line: "שבת, תפילה, לימוד וחגים, לפי העיר שלכם. בשבת בלי תזכורות.",
    apps: [["🕯️", "שבת, תפילה וסידור", "זמני שבת, התפילה של עכשיו והסידור", "https://yahadut.hania360.com/#dat"], ["📚", "לימוד יומי", "דף יומי, הלכה יומית ופרשה לשולחן שבת, עם ביאור", "https://yahadut.hania360.com/#limud"],
      ["🗓️", "החג הקרוב", "זמנים, הכנות וברכות לחג שמגיע", "https://chag.hania360.com/"], ["🙏", "איזו ברכה?", "משחק ברכות לילדים", "https://yahadut.hania360.com/#bracha"]] },
  { k: "learn", e: "🎓", name: "לומדים ומתפתחים", c: "#6A45FF", line: "למבוגרים ולנוער: לדבר אנגלית בביטחון, ללמוד כל יום.",
    apps: [["✨", "HaniaShamayim", "השמיים החיים מעליך: כוכבים, הירח, כוכבי הלכת ותחנת החלל. מכוונים את הטלפון ורואים", "https://shamayim.hania360.com/"], ["🗣️", "HaniaDaber", "מדברים אנגלית בקול: בית קפה, מלון, שדה תעופה, ראיון עבודה. תיקונים עדינים בעברית", "https://daber.hania360.com/"], ["📚", "לימוד יומי", "דף יומי, הלכה יומית ופרשה, עם ביאור", "https://yahadut.hania360.com/#limud"],
      ["🧑‍🏫", "HaniaKita למורים", "דפי עבודה בלחיצה, תלמיד אקראי, קבוצות וטיימר", "https://kita.hania360.com/"]] },
  { k: "money", e: "💰", name: "כסף וחיסכון", c: "#C98A06", line: "לשלם פחות ולבדוק לפני שמשלמים.",
    apps: [["💳", "HaniaSave", "איזה כרטיס, שובר או הטבה הכי משתלמים בכל חנות", "https://save.hania360.com/"], ["🔎", "HaniaCheck", "לבדוק רכב, חברה או קבלן לפני שמשלמים", "https://check.hania360.com/"],
      ["📈", "HaniaStock", "מצב השוק והמניות, מידע בלבד", "https://stock.hania360.com/"], ["💡", "חשבונות הבית", "כמה יוצא בחודש על חשבונות ומנויים", "https://bayit.hania360.com/#bills"]] },
  { k: "out", e: "🚗", name: "יוצאים מהבית", c: "#0284C7", line: "טיסות, טיולים וחניה.",
    apps: [["🛫", "HaniaTisa", "מה ממריא ונוחת בנתב״ג, עכשיו", "https://tisa.hania360.com/"], ["🧭", "HaniaGo", "טיול משפחתי מהדלת ועד החזרה", "https://go.hania360.com/"], ["🅿️", "HaniaPark", "איפה החניתי, וטיימר חניה", "https://park.hania360.com/"]] },
  { k: "fun", e: "🎉", name: "פנאי וספורט", c: "#E0457B", line: "הקבוצה שלכם, משחקים לכל הבית ועוד.",
    apps: [["📺", "HaniaTV", "ערוצי טלוויזיה ורדיו בשידור חי, רק שידורים רשמיים", "https://tv.hania360.com/"], ["⚽", "HaniaSport", "ליגת העל והיורוליג: תוצאות חיות וטבלה, והקבוצה שלכם", "https://sport.hania360.com/"], ["✈️", "HaniaFlight", "סימולטור טיסה עם מטוסי חיל האוויר", "https://flight.hania360.com/?ref=home"], ["🏎️", "HaniaRace", "מרוץ מכוניות בתלת־ממד: 17 רכבים, 5 מסלולים ואליפות", "https://race.hania360.com/"],
      ["🎲", "מועדון הערב", "משחקי ערב שנכתבים בשבילכם", "https://play.hania360.com/"], ["❓", "HaniaQuiz", "חידון לכל הבית על המסך הגדול", "https://quiz.hania360.com/"],
      ["🎵", "HaniaMusic", "השיר שהיה מספר 1 ביום שנולדתם", "https://music.hania360.com/"], ["🎞️", "HaniaYears", "סרטון גדילה מהתמונות של הילד", "https://years.hania360.com/"]] },
  { k: "care", e: "🫶", name: "בריאות, כושר ועזרה", c: "#14B37D", line: "להיות בכושר, וכשמישהו צריך עזרה.",
    apps: [["🏋️", "HaniaFit", "תוכנית אימון ותזונה אישית: הדגמות, טיימר, תפריט עם תחליפים ותזכורות", "https://fit.hania360.com/"], ["💗", "HaniaRegaTov", "למטופלים בבית חולים או במיטה: משחקים, שיחה, משפחה ותיאום ביקורים", "https://regatov.hania360.com/"], ["⛑️", "HaniaEzra", "עזרה ראשונה צעד אחר צעד", "https://ezra.hania360.com/"],
      ["💬", "HaniaCaption", "כתוביות חיות לשיחה, לכבדי שמיעה", "https://caption.hania360.com/"]] },
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const row = (a) => `<a class="m26-app" href="${esc(a[3])}"><span class="m26-ae" aria-hidden="true">${a[0]}</span><span><b>${esc(a[1])}</b><small>${esc(a[2])}</small></span><span class="m26-go" aria-hidden="true">←</span></a>`;

export function appMap() {
  const n = W.reduce((s, w) => s + w.apps.length, 0);
  return `<section class="h26-sec m26" id="apps" aria-labelledby="m26-h"><h2 id="m26-h">🗺️ כל האפליקציות, לפי עולם</h2>
<p class="m26-lead">${W.length} עולמות ו־${n} כלים. בכל עולם יש כמה כלים קטנים שעובדים יחד. לוחצים על עולם כדי לראות מה יש בו.</p>
<div class="m26-list">${W.map((w, i) => `<details class="m26-w" style="--c:${w.c}"><summary><span class="m26-we" aria-hidden="true">${w.e}</span><span class="m26-wt"><b>${esc(w.name)}</b><small>${esc(w.line)}</small></span><span class="m26-n">${w.apps.length} כלים</span></summary>
<div class="m26-body">${w.hub ? `<a class="m26-hub" href="${esc(w.hub[1])}"><span>📲 הכול באפליקציה אחת: <b dir="ltr">${esc(w.hub[0])}</b></span><span>לפתוח ←</span></a>` : ""}${w.apps.map(row).join("")}${w.more ? row(w.more) : ""}</div></details>`).join("")}</div>
<a class="m26-today" href="https://today.hania360.com/"><span aria-hidden="true">📋</span><span><b>Hania Today מחבר את הכול</b><small>מה חשוב היום מכל העולמות, בדף אחד: שוברים שפגים, מה נגמר בבית, יום הולדת קרוב, שבת וחג.</small></span><span aria-hidden="true">←</span></a>
<div id="toolTabs" hidden></div></section>`;
}

export const MAP_CSS = `
.m26-lead{margin:0;text-align:center;color:#475569;font-size:15px}
.m26-list{display:grid;gap:10px}
.m26-w{border:1px solid rgba(15,23,42,.08);background:#fff;border-radius:20px;box-shadow:0 10px 26px -20px rgba(15,23,42,.45);overflow:hidden}
.m26-w>summary{list-style:none;display:flex;gap:12px;align-items:center;padding:13px 14px;cursor:pointer}
.m26-w>summary::-webkit-details-marker{display:none}
.m26-we{width:46px;height:46px;flex:0 0 46px;border-radius:15px;display:grid;place-items:center;font-size:24px;background:color-mix(in srgb,var(--c) 16%,#fff);border:1.5px solid color-mix(in srgb,var(--c) 30%,#fff)}
.m26-wt{flex:1;min-width:0;display:grid}.m26-wt b{font-size:17px;color:#0F172A}.m26-wt small{color:#64748B;font-size:13px;line-height:1.35}
.m26-n{font-size:12.5px;font-weight:800;color:color-mix(in srgb,var(--c) 62%,#000);background:color-mix(in srgb,var(--c) 10%,#fff);border-radius:99px;padding:3px 9px;white-space:nowrap}
.m26-n:after{content:" ▾";display:inline-block;transition:transform .2s}
.m26-w[open] .m26-n:after{transform:rotate(180deg)}
.m26-w[open]>summary{border-bottom:1px solid rgba(15,23,42,.07);background:color-mix(in srgb,var(--c) 5%,#fff)}
.m26-body{display:grid;padding:6px 8px 10px}
.m26-hub{display:flex;justify-content:space-between;gap:8px;align-items:center;margin:6px 6px 8px;padding:10px 12px;border-radius:14px;background:var(--c);color:#fff;text-decoration:none;font-size:14px;font-weight:600}
.m26-hub b{font-weight:900}
.m26-app{display:flex;gap:10px;align-items:center;padding:9px 8px;border-radius:12px;color:inherit;text-decoration:none}
.m26-app:hover,.m26-app:focus-visible{background:color-mix(in srgb,var(--c) 8%,#fff)}
.m26-ae{font-size:22px;width:34px;text-align:center}.m26-app b{display:block;font-size:15px;color:#0F172A}.m26-app small{color:#64748B;font-size:13px;line-height:1.35}
.m26-app>span:nth-child(2){flex:1;min-width:0}.m26-go{color:#94A3B8}
.m26-today{display:flex;gap:12px;align-items:center;padding:14px;border-radius:20px;text-decoration:none;color:inherit;background:linear-gradient(135deg,#FFF4E5,#FFFFFF);border:1.5px solid #FAD7A0}
.m26-today>span:first-child{font-size:28px}.m26-today b{display:block;color:#0F172A}.m26-today small{color:#64748B;font-size:13px}.m26-today>span:nth-child(2){flex:1}
`;
export const WORLDS = W;
