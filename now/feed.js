// The "עכשיו" strip on hania360.com: what is happening now, each item linked to the app that helps.
// Written by the daily scan (a scheduled task) after checking every fact against its sources; nothing shows
// until the owner approves it at hania360.com/now, except during Shabbat, when new items go up on their own.
// Each item: id, from/until (YYYY-MM-DD, Israel), chip, title, body, optional big number, sources [[label, url]],
// apps [[icon, name, line, href, button]] (none for civic or sensitive items), lead (the wide first card),
// img: a key of IMG in lib/images.js (free Wikimedia Commons photos with credit), or none.
// Ticker: [label, value] or [label, null, "YYYY-MM-DDTHH:MM" Israel time] for a live countdown.

export const TICKER = [
  ["ליטר בנזין 95, מ־5.11", "7.85 ₪"],
  ["לדרבי היורוליג", null, "2026-11-12T21:05"],
  ["ליום הרווקים", null, "2026-11-11T00:00"],
  ["לבלאק פריידיי", null, "2026-11-27T00:00"],
  ["לנר ראשון של חנוכה", null, "2026-12-04T16:00"],
];

export default [
  {
    id: "2026-11-09-flydubai", img: "now-flydubai", from: "2026-11-09", until: "2026-11-30", chip: "טיסות", lead: true,
    title: "פליי דובאי לא טסה לתל אביב עד 30.11. מה עושים אם יש לכם כרטיס?",
    body: "הקו הושעה אחרי ניסיון ההשתלטות על טיסה לנתב״ג ב־30.9, וההשעיה הוארכה עד סוף נובמבר. החלופה הישירה לאמירויות כרגע היא Etihad מאבו דאבי. מי שיש לו כרטיס: לבדוק מול החברה החזר או שינוי, ולוודא שביטוח הנסיעות מכסה ביטול.",
    sources: [["Middle East Monitor", "https://www.middleeastmonitor.com/20261030-flydubai-extends-suspension-of-tel-aviv-flights-until-nov-30-israeli-media/"], ["Times of Israel", "https://www.timesofisrael.com/stranded-israeli-travelers-in-dire-straits-as-dubai-flights-remain-grounded/"]],
    apps: [["🛫", "HaniaTisa", "מה המריא ונחת בנתב״ג עכשיו", "https://tisa.hania360.com/", "לטיסות"], ["🧳", "ביטוח נסיעות", "ימים חינם וביטול לפי הכרטיסים שלכם", "https://save.hania360.com/insurance/travel", "לבדיקה"]],
  },
  {
    id: "2026-11-09-derby", img: "now-derby", from: "2026-11-09", until: "2026-11-12", chip: "כדורסל",
    title: "דרבי תל אביבי ביורוליג: מכבי מארחת את הפועל ביום חמישי",
    body: "הפועל תל אביב במקום ה־6 בטבלה, ומכבי תל אביב במקום ה־17. המשחק ביום חמישי 12.11 ב־21:05.",
    sources: [["EuroLeague", "https://www.euroleaguebasketball.net/euroleague/"]],
    apps: [["🏀", "HaniaSport", "תוצאה חיה, טבלה ותזכורת לפני המשחק", "https://sport.hania360.com/#hoops", "לדרבי"]],
  },
  {
    id: "2026-11-09-fuel", img: "now-fuel", from: "2026-11-05", until: "2026-11-30", chip: "כסף", big: "7.85 ₪",
    title: "הבנזין התייקר ב־50 אגורות, אבל פחות מהצפוי",
    body: "שר האוצר האריך חלקית את הפחתת הבלו, אז המחיר עלה ל־7.85 ₪ לליטר (95, שירות עצמי) ולא ל־8.35 ₪.",
    sources: [["כלכליסט", "https://www.calcalist.co.il/local_news/article/rje0rn116gx"]],
    apps: [["⛽", "HaniaSave", "איזה כרטיס שלכם נותן הנחה בתדלוק", "https://save.hania360.com/", "לבדוק"]],
  },
  {
    id: "2026-11-09-ligat-haal", img: "now-ligat-haal", from: "2026-11-09", until: "2026-11-27", chip: "כדורגל",
    title: "הפועל תל אביב יוצאת לפגרה בראש ליגת העל",
    body: "1:0 בבאר שבע בדקה ה־91 העלה את הפועל למקום הראשון, נקודה לפני מכבי תל אביב. הליגה חוזרת ב־27.11.",
    sources: [["וואלה ספורט", "https://sports.walla.co.il/item/3875308"]],
    apps: [["⚽", "HaniaSport", "הטבלה, המחזור הבא והקבוצה שלכם", "https://sport.hania360.com/#il", "לטבלה"], ["📰", "הכתבה המלאה", "מה הוביל לפסגה, ומה בהמשך", "/guides/hapoel-tel-aviv-top-before-break", "לקריאה"]],
  },
  {
    id: "2026-11-09-shopping", img: "now-shopping", from: "2026-11-09", until: "2026-11-30", chip: "קניות",
    title: "יום הרווקים ובלאק פריידיי: איך לא ליפול על \"עד 70%\"",
    body: "\"עד\" חל בדרך כלל על מעט פריטים, ומשלוח חינם מחו״ל יכול לקחת עד 45 יום. על מוצר יקר, לפעמים עדיף לשלם קצת יותר בחנות מקומית בשביל אחריות והחזרה.",
    sources: [["מעריב", "https://www.maariv.co.il/economy/israel/article-1383537"]],
    apps: [["💳", "HaniaSave", "איזה כרטיס נותן הכי הרבה בחנות שבחרתם", "https://save.hania360.com/", "לחנות"]],
  },
  {
    id: "2026-11-09-car-insurance", img: "now-car", from: "2026-11-09", until: "2026-11-30", chip: "רכב",
    title: "שני מבצעי ביטוח רכב נגמרים בסוף החודש",
    body: "AIG לחברי בהצדעה: עד 60% במקיף, עד 30.11. איילון לעמיתי חבר: גיפט כארד של 150 ₪ ברכישת מקיף וחובה, עד 30.11 או עד גמר המלאי.",
    sources: [["AIG", "https://join.aig.co.il/partnership/car_behazdaha"]],
    apps: [["🚗", "HaniaSave · ביטוח רכב", "רק ההטבות של המועדונים שלכם", "https://save.hania360.com/services/car", "להטבות"]],
  },
  {
    id: "2026-11-09-chanukah", img: "now-chanukah", from: "2026-11-09", until: "2026-12-12", chip: "חגים",
    title: "חנוכה מתחיל בערב שבת: הנר הראשון ביום שישי 4.12",
    body: "בשישי מדליקים לפני כניסת השבת, ובשאר הערבים לפי זמני העיר שלכם.",
    sources: [["כל זכות", "https://www.kolzchut.org.il/he/%D7%97%D7%A0%D7%95%D7%9B%D7%94"]],
    apps: [["🕎", "היהדות שלי · חנוכה", "זמני הדלקה לפי העיר ותזכורת לכל ערב", "https://yahadut.hania360.com/#chanukah", "לזמנים"]],
  },
  {
    id: "2026-11-09-knesset", img: "now-knesset", from: "2026-11-09", until: "2026-11-30", chip: "אזרחי", civic: true,
    title: "אחרי הבחירות לכנסת ה־26: מה השלבים עכשיו",
    body: "הבחירות התקיימו ב־27.10, ועכשיו מתנהל תהליך הרכבת הממשלה. כאן מביאים רק לוחות זמנים ומידע אזרחי, בלי עמדה.",
    sources: [["כל זכות", "https://www.kolzchut.org.il/he/%D7%91%D7%97%D7%99%D7%A8%D7%95%D7%AA_%D7%9C%D7%9B%D7%A0%D7%A1%D7%AA"]],
    apps: [],
  },
];
