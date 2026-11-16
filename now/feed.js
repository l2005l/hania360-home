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
  ["אינפלציה שנתית, אוקטובר", "1.1%"],
  ["לישראל–אוסטריה בליגת האומות", null, "2026-11-17T21:45"],
  ["לבלאק פריידיי", null, "2026-11-27T00:00"],
  ["לנר ראשון של חנוכה", null, "2026-12-04T16:00"],
];

export default [
  {
    id: "2026-11-16-cpi-october", from: "2026-11-16", until: "2026-11-30", chip: "כסף", big: "‎-0.1%",
    title: "מדד אוקטובר ירד ב־0.1%, והאינפלציה ירדה ל־1.1%",
    body: "לפי הלמ״ס, המדד ירד ב־0.1% באוקטובר, כשהתחזיות דיברו על עלייה של עד 0.5%. ירדו: פירות טריים (2.8%־) ותחבורה (1.4%־, בעיקר טיסות לחו״ל). עלו: הלבשה והנעלה (4.1%+) וירקות טריים (3.5%+). למי שיש משכנתא או הלוואה צמודה, זו בשורה קטנה. החלטת הריבית הבאה של בנק ישראל: 23.11, הריבית היום 3.25%.",
    sources: [["ynet", "https://www.ynet.co.il/economy/article/sqm15han4"], ["TheMarker", "https://www.themarker.com/news/macroeconomics/2026-11-15/ty-article/000001a1-dee6-d59b-a1f3-def6175a0000"], ["אמס", "https://www.emess.co.il/radio/1962630"], ["אייס (מועד הריבית)", "https://www.ice.co.il/finance/news/article/1137705"]],
    apps: [["🛒", "HaniaCart", "רשימת הקניות והמחירים בסופר", "https://cart.hania360.com/", "לקניות"]],
  },
  {
    id: "2026-11-16-avdija-34", from: "2026-11-16", until: "2026-11-20", chip: "כדורסל", big: "34",
    title: "דני אבדיה קלע 34 נקודות, ופורטלנד ב־9 ניצחונות ו־3 הפסדים",
    body: "בניצחון 107:120 על סקרמנטו קלע אבדיה 11 מ־13 מהשדה ו־9 מ־9 מהעונשין. במשחקי חוץ פורטלנד ב־6 ניצחונות והפסד אחד. המשחקים הבאים: פעמיים במינסוטה, בלילות שני ושלישי (שעון ארה״ב).",
    sources: [["Times of Israel", "https://www.timesofisrael.com/liveblog_entry/deni-avdija-scores-34-points-as-trail-blazers-beat-kings-120-107/"], ["CBS Sports", "https://www.cbssports.com/nba/news/deni-avdija-scores-34-to-lead-trail-blazers-past-kings-120-107/"]],
    apps: [["🏀", "HaniaSport", "תוצאות, טבלאות והמשחק הבא", "https://sport.hania360.com/", "לספורט"]],
  },
  {
    id: "2026-11-15-israel-kosovo", from: "2026-11-15", until: "2026-11-18", chip: "כדורגל",
    title: "הנבחרת סיימה 0:0 בקוסובו. ביום שלישי: המשחק האחרון מול אוסטריה",
    body: "אחרי חמישה משחקים בליגת האומות ישראל עדיין בלי ניצחון, במקום האחרון בבית עם 3 נקודות. המשחק האחרון בבית: מול אוסטריה ביום שלישי 17.11 ב־21:45, בדברצן שבהונגריה. כדי לחמוק ממשחקי הפלייאוף נגד ירידה, הנבחרת צריכה לנצח ולקוות לתוצאות שמתאימות לה.",
    big: "0:0",
    sources: [["ONE", "https://www.one.co.il/Article/538830.html"], ["וואלה ספורט", "https://sports.walla.co.il/item/3876216"]],
    apps: [["⚽", "HaniaSport", "תוצאות, טבלאות והמשחק הבא", "https://sport.hania360.com/", "לספורט"]],
  },
  {
    id: "2026-11-15-ev-tax", from: "2026-11-15", until: "2027-01-31", chip: "רכב", big: "10.2.2027",
    title: "מס הקנייה המופחת על רכב חשמלי נשאר עד 10.2.2027",
    body: "ההטבה הייתה אמורה להיגמר בסוף 2026, אבל בגלל הבחירות היא הוארכה אוטומטית. לפי רשות המסים, עד 10.2.2027 רכב חשמלי פרטי משלם 48% מס קנייה במקום 83%, עם תקרת הטבה של 22,000 ₪. אחרי זה המחירון יכול לעלות באלפי שקלים, ובאוצר שוקלים העלאה הדרגתית. מתכננים לקנות? כדאי לבדוק את מועד המסירה.",
    sources: [["ביזפורטל", "https://www.bizportal.co.il/car/news/article/20045896"], ["ice", "https://www.ice.co.il/auto/news/article/1134753"]],
    apps: [],
  },
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
