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
  ["ריבית בנק ישראל, מ־23.11", "3.25%"],
  ["לבלאק פריידיי", null, "2026-11-27T00:00"],
  ["לדרבי הירושלמי", null, "2026-11-28T20:15"],
  ["לנר ראשון של חנוכה", null, "2026-12-04T16:00"],
];

export default [
  {
    id: "2026-11-26-jerusalem-derby", for: ["f:8173", "f:459591"], from: "2026-11-26", until: "2026-11-29", chip: "כדורגל", big: "20:15",
    title: "הדרבי הירושלמי במוצאי שבת 28.11 בטדי, ב־20:15",
    body: "בית״ר ירושלים (מקום 4, 18 נקודות) מול הפועל ירושלים (מקום 10, 9 נקודות), במחזור ה־11. באותו ערב יש גם מופע בארנה ב־22:00, אז צפויים עומסים במלחה. רכבת ישראל לא מגיעה לירושלים במוצאי שבת בגלל עבודות. הרכבת הקלה מתוגברת ב־18:00–21:30 בין בנייני האומה למלחה, וקווי אוטובוס 77, 31, 504, 509 ו־531 מגיעים למלחה. חלק מהכבישים ליד האצטדיון ייסגרו.",
    sources: [["וואלה ספורט", "https://sports.walla.co.il/item/3877623"], ["ONE (הסדרי תנועה)", "https://www.one.co.il/Article/539828.html"], ["ONE (שעת המשחק)", "https://www.one.co.il/Article/539289.html"]],
    apps: [["⚽", "HaniaSport", "הטבלה, המחזור הבא והקבוצה שלכם", "https://sport.hania360.com/#il", "לטבלה"]],
  },
  {
    id: "2026-11-26-delta-atlanta", from: "2026-11-26", until: "2026-12-26", chip: "טיסות", big: "19.12",
    title: "דלתא חוזרת לאטלנטה ב־19.12, ומוסיפה טיסה שנייה ביום לניו יורק מ־29.11",
    body: "לפי ההודעה, הקו תל אביב–אטלנטה חוזר ב־19.12, שלוש פעמים בשבוע (בחורף: שלישי, חמישי ושבת), באיירבוס A350-900. מ־29.11 דלתא מוסיפה טיסה יומית שנייה בין JFK בניו יורק לנתב״ג, באיירבוס A330-900neo, בגלל הביקוש בחגים. כדאי לבדוק את הלו״ז באתר של דלתא לפני שמזמינים.",
    sources: [["ישראל היום", "https://www.israelhayom.com/2026/11/25/delta-air-lines-atlanta-tel-aviv-flights-second-daily-new-york-flight/"], ["Jerusalem Post", "https://www.jpost.com/travel/article-916101"]],
    apps: [["🛫", "HaniaTisa", "מה המריא ונחת בנתב״ג עכשיו", "https://tisa.hania360.com/", "לטיסות"], ["🧳", "ביטוח נסיעות", "ימים חינם וביטול לפי הכרטיסים שלכם", "https://save.hania360.com/insurance/travel", "לבדיקה"]],
  },
  {
    id: "2026-11-25-maccabi-bayern", for: ["b:TEL"], from: "2026-11-25", until: "2026-11-30", chip: "כדורסל", big: "79:87",
    title: "מכבי תל אביב ניצחה את באיירן במינכן 79:87",
    body: "ביורוליג, ביום שלישי 24.11, מכבי הובילה כבר במחצית 43:50 וסיימה עם ניצחון חוץ. רומן סורקין היה הקלע המוביל שלה, עם 17 נקודות. אצל באיירן קלעו מרג׳ון ביצ׳אמפ ודוויין וושינגטון 13 כל אחד. אחרי המשחק, לשתי הקבוצות 4 ניצחונות העונה.",
    sources: [["FC Bayern Basketball", "https://fcbayern.com/basketball/en/news/postgame/2026-27/11/fc-bayern-basketball---maccabi-tel-aviv-game-report"], ["Sofascore", "https://www.sofascore.com/news/maccabi-tel-aviv-outlast-bayern-munchen-87-79-in-euroleague-test"]],
    apps: [["🏀", "HaniaSport", "יורוליג: תוצאות, טבלה והמשחק הבא", "https://sport.hania360.com/#hoops", "לכדורסל"]],
  },
  {
    id: "2026-11-25-avdija-31", from: "2026-11-25", until: "2026-11-29", chip: "כדורסל", big: "31",
    title: "דני אבדיה קלע 31, ופורטלנד ניצחה את פילדלפיה 111:128",
    body: "במשחק חוץ ביום שני 23.11 (שעון ארה״ב), אבדיה קלע 12 מ־19 מהשדה, כולל 5 שלשות מ־9, והוסיף 7 אסיסטים. זה ההפסד הרביעי בלבד של ה־76ers העונה, ולפורטלנד עכשיו 11 ניצחונות ו־6 הפסדים.",
    sources: [["OPB (AP)", "https://www.opb.org/article/2026/11/24/portland-trail-blazers-deni-avdija-31-points-beat-philadelphia-76ers/"], ["Jerusalem Post", "https://www.jpost.com/international/article-915921"]],
    apps: [["🏀", "HaniaSport", "תוצאות, טבלאות והמשחק הבא", "https://sport.hania360.com/", "לספורט"]],
  },
  {
    id: "2026-11-24-rate-hold", from: "2026-11-24", until: "2027-01-04", chip: "כסף", big: "3.25%",
    title: "בנק ישראל השאיר את הריבית על 3.25%. ההחלטה הבאה ב־4.1.2027",
    body: "ביום שני 23.11 הריבית נשארה בלי שינוי, כצפוי, והפריים נשאר 4.75%. אז התשלום החודשי במסלול פריים במשכנתא לא משתנה, וגם הריבית על אוברדרפט והלוואות בפריים. האינפלציה השנתית ירדה ל־1.1%, ולפי החזאים שבנק ישראל מצטט, היא צפויה לעלות לכ־2% בתחילת 2027. ההחלטה הבאה: יום שני 4.1.2027.",
    sources: [["ביזפורטל", "https://www.bizportal.co.il/general/news/article/20049762"], ["mako N12", "https://www.mako.co.il/news-money/2026_q4/Article-13e7482de9802a1027.htm"]],
    apps: [["🧾", "HaniaBills", "כל החשבונות של הבית במקום אחד", "https://bills.hania360.com/", "לחשבונות"]],
  },
  {
    id: "2026-11-24-black-friday-malls", from: "2026-11-24", until: "2026-11-30", chip: "קניות", big: "27.11",
    title: "בלאק פריידיי ביום שישי 27.11: בקניונים, שימו לב לסף הקנייה",
    body: "בקניוני עזריאלי יש ארוחות ב־20 ₪ ברשתות משתתפות, 24.11–30.11. בהרבה קניונים המתנה תלויה בקנייה מעל 199, 299 או 399 ₪: מעריב בדק חמישה מבצעים, ובשלושה היה סף קנייה ובשניים צריך להצטרף למועדון. מתכננים לקנות ב־250 ₪? אל תוסיפו עוד 150 ₪ בשביל מתנה קטנה.",
    sources: [["אייס", "https://www.ice.co.il/consumerism/news/article/1138126"], ["מעריב", "https://www.maariv.co.il/economy/consumerism/article-1389962"]],
    apps: [["💳", "HaniaSave", "איזה כרטיס נותן הכי הרבה בחנות שבחרתם", "https://save.hania360.com/", "לחנות"]],
  },
  {
    id: "2026-11-23-tiberias-points", for: ["f:543580"], from: "2026-11-23", until: "2026-11-30", chip: "כדורגל", big: "1",
    title: "עוד 3 נקודות ירדו לעירוני טבריה, והיא במקום האחרון בליגת העל",
    body: "ביום ראשון 22.11 אישר בית הדין של ההתאחדות לכדורגל הסדר טיעון בפרשת העירויים: 3 נקודות פחות וקנס של 70,000 ₪. טבריה פתחה את העונה כבר עם 6 נקודות פחות, בפרשת החוזים הכפולים. אחרי 10 מחזורים יש לה נקודה אחת, 5 פחות מהפועל פתח תקווה שמעל הקו האדום. הליגה חוזרת מהפגרה ב־27.11.",
    sources: [["ynet", "https://www.ynet.co.il/sport/israelisoccer/article/skiwrwgyxx"], ["וואלה ספורט", "https://sports.walla.co.il/item/3877224"], ["ספורט 1 (הטבלה)", "https://sport1.maariv.co.il/israeli-soccer/ligat-haal/article/2003661"]],
    apps: [["⚽", "HaniaSport", "הטבלה, המחזור הבא והקבוצה שלכם", "https://sport.hania360.com/#il", "לטבלה"]],
  },
  {
    id: "2026-11-21-hapoel-paris", for: ["b:HTA"], from: "2026-11-21", until: "2026-11-26", chip: "כדורסל", big: "96:97",
    title: "הפועל תל אביב הפסידה בפריז 97:96, בשניות האחרונות",
    body: "במחזור ה־13 של היורוליג, ביום חמישי 19.11, אנטוניו בלייקני קלע 28 נקודות ואלייז׳ה בראיינט 16. בשניות האחרונות היה איבוד כדור קריטי, ופריז ניצחה בנקודה. זה ההפסד הרביעי שלה בחמישה מחזורים. ביורוליג היא ממשיכה בחוץ, מול אולימפיאקוס בפיראוס.",
    sources: [["וואלה ספורט", "https://sports.walla.co.il/item/3876893"], ["ערוץ הספורט", "https://playbasket.sport5.co.il/?FLNum=24&GameID=153831"], ["Eurohoops", "https://www.eurohoops.net/en/euroleague/2038308/euroleague-roundup-anadolu-efes-cruises-past-asvel/"]],
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
