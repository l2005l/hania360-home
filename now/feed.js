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
  ["למכבי ת״א–דובאי ביורוליג", null, "2026-11-19T19:15"],
  ["לבלאק פריידיי", null, "2026-11-27T00:00"],
  ["לנר ראשון של חנוכה", null, "2026-12-04T16:00"],
];

export default [
  {
    id: "2026-11-18-maccabi-olympiacos-ot", for: ["b:TEL"], from: "2026-11-18", until: "2026-11-20", chip: "כדורסל", big: "95:97",
    title: "מכבי תל אביב חזרה מפיגור 15, אבל הפסידה לאולימפיאקוס בהארכה",
    body: "בלימסול, במחזור ה־12 של היורוליג, סשה וזנקוב הוביל את מכבי להארכה עם סל בסיום, ואולימפיאקוס ניצחה 95:97. מכבי עכשיו עם 3 ניצחונות ו־9 הפסדים. המשחק הבא: ביום חמישי 19.11 ב־19:15, מול דובאי.",
    sources: [["ONE", "https://www.one.co.il/Article/539166.html"], ["הארץ", "https://www.haaretz.co.il/sport/basketball/2026-11-17/ty-article/000001a1-ead6-d3e7-a9ff-eede14970000"]],
    apps: [["🏀", "HaniaSport", "יורוליג: תוצאות, טבלה והמשחק הבא", "https://sport.hania360.com/#hoops", "לכדורסל"]],
  },
  {
    id: "2026-11-18-israel-austria", from: "2026-11-18", until: "2026-12-07", chip: "כדורגל", big: "1:1",
    title: "הנבחרת סיימה 1:1 מול אוסטריה. במרץ: פלייאוף על ההישארות בליגה B",
    body: "ישראל סיימה את ליגת האומות במקום האחרון בבית, בלי ניצחון. במרץ היא תשחק פלייאוף, בית וחוץ, מול בלארוס, קפריסין, איי פארו או אסטוניה: המנצחת נשארת בליגה B. ההגרלה של מוקדמות יורו 2028 ב־6.12, וישראל בסיר 3.",
    sources: [["ONE", "https://www.one.co.il/Article/539171.html"], ["ערוץ 7", "https://www.inn.co.il/news/711054"], ["הארץ", "https://www.haaretz.co.il/sport/israel-soccer/2026-11-18/ty-article/000001a1-eb79-dc88-a1a7-fffbfd710000"]],
    apps: [["⚽", "HaniaSport", "תוצאות, טבלאות והמשחק הבא", "https://sport.hania360.com/", "לספורט"]],
  },
  {
    id: "2026-11-17-january-prices", from: "2026-11-17", until: "2026-12-31", chip: "כסף", big: "3.05%",
    title: "מינואר: הארנונה עולה ב־3.05%, ועוד כמה חשבונות בדרך למעלה",
    body: "העדכון האוטומטי של הארנונה ל־2027 הוא 3.05%, בכל הרשויות. כמה ערים ביקשו להעלות יותר (למשל רחובות ונס ציונה), וזה עוד צריך אישור של שרי הפנים והאוצר. עוד צפוי בינואר, אבל עדיין לא סופי: חשמל כ־2%, מים כ־2.3%, ואוטובוס עירוני שיכול לעלות מ־8 ל־8.5–9 ₪. לפי ביזפורטל, למשק בית ממוצע זה כ־87 ₪ יותר בחודש, כולל דלק.",
    sources: [["ביזפורטל", "https://www.bizportal.co.il/financialconsumerism/news/article/20048643"], ["מעריב (ארנונה)", "https://www.maariv.co.il/news/politics/article-1387641"], ["מעריב (תחבורה ציבורית)", "https://www.maariv.co.il/economy/israel/article-1388586"]],
    apps: [["🧾", "HaniaBills", "כל החשבונות של הבית במקום אחד", "https://bills.hania360.com/", "לחשבונות"]],
  },

  {
    id: "2026-11-16-cpi-october", from: "2026-11-16", until: "2026-11-30", chip: "כסף", big: "‎-0.1%",
    title: "מדד אוקטובר ירד ב־0.1%, והאינפלציה ירדה ל־1.1%",
    body: "לפי הלמ״ס, המדד ירד ב־0.1% באוקטובר, כשהתחזיות דיברו על עלייה של עד 0.5%. ירדו: פירות טריים (2.8%־) ותחבורה (1.4%־, בעיקר טיסות לחו״ל). עלו: הלבשה והנעלה (4.1%+) וירקות טריים (3.5%+). למי שיש משכנתא או הלוואה צמודה, זו בשורה קטנה. החלטת הריבית הבאה של בנק ישראל: 23.11, הריבית היום 3.25%.",
    sources: [["ynet", "https://www.ynet.co.il/economy/article/sqm15han4"], ["TheMarker", "https://www.themarker.com/news/macroeconomics/2026-11-15/ty-article/000001a1-dee6-d59b-a1f3-def6175a0000"], ["אמס", "https://www.emess.co.il/radio/1962630"], ["אייס (מועד הריבית)", "https://www.ice.co.il/finance/news/article/1137705"]],
    apps: [["🛒", "HaniaCart", "רשימת הקניות והמחירים בסופר", "https://cart.hania360.com/", "לקניות"]],
  },
  {
    id: "2026-11-19-avdija-foot", from: "2026-11-19", until: "2026-11-24", chip: "כדורסל",
    title: "דני אבדיה פספס משחק ראשון העונה, בגלל כאב בכף הרגל",
    body: "בשני קלע אבדיה 27 נקודות (11 מ־19) ו־8 ריבאונדים, אבל פורטלנד הפסידה במינסוטה 98:106. בשלישי הוא לא שיחק בגלל כאב בכף הרגל השמאלית, ופורטלנד הפסידה שוב, 105:106, מסל בשנייה האחרונה. המשחק הבא: ביום חמישי (שעון ארה״ב) במילווקי.",
    sources: [["CBS Minnesota", "https://www.cbsnews.com/minnesota/news/mcdaniels-scores-to-lift-timberwolves-to-win-over-trail-blazers/"], ["TSN", "https://www.tsn.ca/nba/article/trail-blazers-rule-out-avdija-vs-timberwolves-with-sore-foot-n1-50515349/"], ["NBC Sports", "https://www.nbcsports.com/fantasy/basketball/player-news/2026-11-17/deni-avdija-foot-downgraded-to-out-tuesday"]],
    apps: [["🏀", "HaniaSport", "תוצאות, טבלאות והמשחק הבא", "https://sport.hania360.com/", "לספורט"]],
  },
  {
    id: "2026-11-19-grocery-gap", from: "2026-11-19", until: "2026-12-03", chip: "קניות", big: "957 ₪",
    title: "אותה עגלה, כמעט 1,000 ₪ הבדל בין הרשתות",
    body: "בסקר שבדק 243 מוצרים בשמונה רשתות, רמי לוי שוב הזולה, עם סל של 3,127 ₪. אותו סל בטיב טעם עלה 957 ₪ יותר (30.6%). נבדקו גם אושר עד, נטו חיסכון, קרפור היפר, שופרסל דיל, ויקטורי ויוחננוף. למשפחה שקונה הרבה, השוואה לפני קנייה גדולה יכולה לחסוך.",
    sources: [["מעריב", "https://www.maariv.co.il/economy/consumerism/article-1389791"]],
    apps: [["🛒", "HaniaCart", "רשימת הקניות והמחירים בסופר", "https://cart.hania360.com/", "לקניות"]],
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
