// The "עכשיו" strip on hania360.com: what is happening now, each item linked to the app that helps.
// Written by the daily scan (a scheduled task) after checking every fact against its sources; nothing shows
// until the owner approves it at hania360.com/now, except during Shabbat, when new items go up on their own.
// Each item: id, from/until (YYYY-MM-DD, Israel), chip, title, body, optional big number, sources [[label, url]],
// apps [[icon, name, line, href, button]] (none for civic or sensitive items), lead (the wide first card),
// for: whom it is most for, "f:<FotMob team id>" (ids in sport/api.js HE) or "b:TEL"/"b:HTA" (EuroLeague);
// img: a key of IMG in lib/images.js (free Wikimedia Commons photos with credit), or none.
// Ticker: [label, value] or [label, null, "YYYY-MM-DDTHH:MM" Israel time] for a live countdown.

export const TICKER = [
  ["ליטר בנזין 95, מ־5.11", "7.85 ₪"],
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
    id: "2026-11-10-air-canada", from: "2026-11-10", until: "2026-12-07", chip: "טיסות",
    title: "אייר קנדה חוזרת לנתב״ג ב־30.11: טיסה ישירה לטורונטו",
    body: "לפי הודעת החברה, הקו תל אביב–טורונטו חוזר ב־30.11.2026, ארבע פעמים בשבוע (שני, שלישי, רביעי ושישי), במטוסי בואינג 787. זה מוקדם בכשישה שבועות מהמועד הקודם, 17.1.2027. אייר קנדה כותבת שזו תוכנית, אז כדאי לבדוק מול החברה לפני שמזמינים.",
    sources: [["Air Canada", "https://www.aircanada.com/ca/en/aco/home/book/travel-news-and-updates/2026/middle-east-travel.html"], ["ישראל היום", "https://www.israelhayom.co.il/travel/aviation/article/21427809"]],
    apps: [["🛫", "HaniaTisa", "מה המריא ונחת בנתב״ג עכשיו", "https://tisa.hania360.com/", "לטיסות"], ["🧳", "ביטוח נסיעות", "ימים חינם וביטול לפי הכרטיסים שלכם", "https://save.hania360.com/insurance/travel", "לבדיקה"]],
  },
  {
    id: "2026-11-11-air-india", from: "2026-11-11", until: "2026-12-08", chip: "טיסות",
    title: "אייר אינדיה מתכננת לחזור לנתב״ג ב־1.12: טיסה ישירה לדלהי",
    body: "לפי הודעת נציגות החברה ומשרד התיירות, הקו תל אביב–דלהי חוזר ב־1.12.2026, חמש פעמים בשבוע (ראשון עד חמישי), כשש שעות טיסה. דרך דלהי אפשר להמשיך לדרום־מזרח אסיה. החזרה נדחתה כבר בעבר, אז כדאי לבדוק מול החברה לפני שמזמינים.",
    sources: [["אתר התעופה הישראלי", "https://www.ias.co.il/?p=191647"], ["ThePrint (משרד התיירות)", "https://theprint.in/economy/air-india-to-resume-direct-flights-between-delhi-tel-aviv-from-dec-1-israel-ministry-of-tourism/3055972/"], ["ביזפורטל", "https://www.bizportal.co.il/airlines/news/article/20047213"]],
    apps: [["🛫", "HaniaTisa", "מה המריא ונחת בנתב״ג עכשיו", "https://tisa.hania360.com/", "לטיסות"], ["🧳", "ביטוח נסיעות", "ימים חינם וביטול לפי הכרטיסים שלכם", "https://save.hania360.com/insurance/travel", "לבדיקה"]],
  },
  {
    id: "2026-11-13-derby-result", img: "now-derby", for: ["b:TEL", "b:HTA"], from: "2026-11-13", until: "2026-11-19", chip: "כדורסל",
    title: "מכבי תל אביב ניצחה את הפועל בדרבי היורוליג, 73:80",
    body: "זה הניצחון השלישי של מכבי ביורוליג העונה, והוא קטע רצף של ארבעה הפסדים באירופה. להפועל זה ההפסד השלישי ברציפות.",
    big: "73:80",
    sources: [["ynet", "https://www.ynet.co.il/news/article/h1sxuqxcmg"], ["ONE", "https://www.one.co.il/Article/538740.html"], ["הארץ", "https://www.haaretz.co.il/sport/basketball/2026-11-12/ty-article/000001a1-d194-d15e-adb1-f3f5e3fe0000"]],
    apps: [["🏀", "HaniaSport", "תוצאות, טבלת היורוליג והמשחק הבא", "https://sport.hania360.com/#hoops", "לטבלה"]],
  },
  {
    id: "2026-11-09-fuel", img: "now-fuel", from: "2026-11-05", until: "2026-11-30", chip: "כסף", big: "7.85 ₪",
    title: "הבנזין התייקר ב־50 אגורות, אבל פחות מהצפוי",
    body: "שר האוצר האריך חלקית את הפחתת הבלו, אז המחיר עלה ל־7.85 ₪ לליטר (95, שירות עצמי) ולא ל־8.35 ₪.",
    sources: [["כלכליסט", "https://www.calcalist.co.il/local_news/article/rje0rn116gx"]],
    apps: [["⛽", "HaniaSave", "איזה כרטיס שלכם נותן הנחה בתדלוק", "https://save.hania360.com/", "לבדוק"]],
  },
  {
    id: "2026-11-09-ligat-haal", img: "now-ligat-haal", for: ["f:10181", "f:7855", "f:9754"], from: "2026-11-09", until: "2026-11-27", chip: "כדורגל",
    title: "הפועל תל אביב יוצאת לפגרה בראש ליגת העל",
    body: "1:0 בבאר שבע בדקה ה־91 העלה את הפועל למקום הראשון, נקודה לפני מכבי תל אביב. הליגה חוזרת ב־27.11.",
    sources: [["וואלה ספורט", "https://sports.walla.co.il/item/3875308"]],
    apps: [["⚽", "HaniaSport", "הטבלה, המחזור הבא והקבוצה שלכם", "https://sport.hania360.com/#il", "לטבלה"], ["📰", "הכתבה המלאה", "מה הוביל לפסגה, ומה בהמשך", "/guides/hapoel-tel-aviv-top-before-break", "לקריאה"]],
  },
  {
    id: "2026-11-14-water-2027", from: "2026-11-14", until: "2026-12-31", chip: "כסף", big: "2.3%",
    title: "המים צפויים להתייקר בכ־2.3% מינואר 2027",
    body: "מועצת רשות המים החליטה החלטה מקדמית ופתחה שימוע. התעריף הנמוך יעלה מכ־8.51 ל־8.70 ₪ למ״ק, והגבוה מכ־15.62 ל־15.97 ₪ (כולל מע״מ). למשפחה של חמש נפשות זה כ־3.5 ₪ יותר בחודש. ההערות לשימוע עד 29.11, והתעריף הסופי ייקבע בסוף דצמבר.",
    sources: [["מעריב", "https://www.maariv.co.il/economy/israel/article-1387699"], ["NEWSru", "https://www.newsru.co.il/finance/5nov2026/maim326.html"]],
    apps: [["🧾", "HaniaBills", "כל החשבונות של הבית במקום אחד", "https://bills.hania360.com/", "לחשבונות"]],
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
