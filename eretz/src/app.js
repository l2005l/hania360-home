// HaniaEretz (eretz.hania360.com): the map, the places, the routes, the game. Inlined into eretz.html by eretz/build.py.
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function el(t, a, kids) { var e = document.createElement(t); for (var k in a || {}) { if (k === "text") e.textContent = a[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), a[k]); else if (a[k] != null && a[k] !== false) e.setAttribute(k, a[k] === true ? "" : a[k]); } (kids || []).forEach(function (c) { if (c != null && c !== false) e.append(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches, TAU = Math.PI * 2;
  var LS = "eretz-v1", S = (function () { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } })();
  S.been = S.been || {}; S.best = S.best || 0;
  function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }
  var toastT = 0;
  function toast(t) { var x = $("toast"); x.textContent = t; x.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { x.classList.remove("on"); }, 2800); }

  // ---------- the land: the coast from Natural Earth; the land between the sea and the Jordan, the lakes and the river by hand ----------
  var COAST = /*COAST*/[];
  var REGION = [[33.9, 31.32], [34.24, 31.30], [34.267, 31.22], [34.40, 30.92], [34.53, 30.40], [34.66, 30.00], [34.80, 29.72], [34.90, 29.49], [34.98, 29.545], [35.05, 29.85], [35.10, 30.10], [35.15, 30.40], [35.20, 30.65], [35.30, 30.85], [35.42, 31.05], [35.45, 31.10], [35.50, 31.30], [35.53, 31.50], [35.55, 31.76], [35.55, 31.85], [35.54, 31.95], [35.52, 32.10], [35.55, 32.30], [35.56, 32.45], [35.57, 32.60], [35.57, 32.64], [35.66, 32.685], [35.77, 32.75], [35.82, 32.90], [35.84, 33.05], [35.83, 33.20], [35.80, 33.33], [35.70, 33.30], [35.63, 33.28], [35.578, 33.28], [35.55, 33.25], [35.52, 33.12], [35.40, 33.07], [35.20, 33.10], [35.105, 33.093], [33.9, 33.093]];
  var KIN = [[35.59, 32.905], [35.625, 32.885], [35.645, 32.84], [35.645, 32.79], [35.63, 32.75], [35.60, 32.715], [35.575, 32.705], [35.545, 32.73], [35.535, 32.78], [35.525, 32.80], [35.535, 32.84], [35.555, 32.875]];
  var DEAD = [[35.52, 31.77], [35.565, 31.74], [35.585, 31.65], [35.59, 31.55], [35.57, 31.45], [35.55, 31.35], [35.52, 31.30], [35.48, 31.27], [35.44, 31.24], [35.43, 31.16], [35.42, 31.08], [35.39, 31.06], [35.37, 31.12], [35.37, 31.22], [35.385, 31.33], [35.395, 31.46], [35.42, 31.60], [35.46, 31.70], [35.49, 31.75]];
  var JORDAN = [[[35.575, 32.705], [35.57, 32.64], [35.565, 32.50], [35.555, 32.35], [35.545, 32.20], [35.53, 32.05], [35.535, 31.92], [35.545, 31.83], [35.55, 31.77]], [[35.65, 33.24], [35.63, 33.15], [35.61, 33.05], [35.615, 32.96], [35.60, 32.905]]];
  var HULA = [[35.605, 33.09], [35.615, 33.085], [35.618, 33.07], [35.61, 33.06], [35.602, 33.07]];
  var AREAS = [["הגליל", 35.33, 32.93], ["הגולן", 35.75, 32.98], ["עמק יזרעאל", 35.28, 32.62], ["השומרון", 35.18, 32.22], ["יהודה", 35.1, 31.62], ["מדבר יהודה", 35.33, 31.5], ["השפלה", 34.84, 31.66], ["השרון", 34.88, 32.3], ["הנגב", 34.85, 30.95], ["הערבה", 35.13, 30.35], ["הר הנגב", 34.82, 30.45]];
  var SEAS = [["הים התיכון", 34.28, 32.35, 22], ["הכנרת", 35.71, 32.82, 13], ["ים המלח", 35.66, 31.5, 14], ["מפרץ אילת", 34.78, 29.42, 13]];
  var HILLS = [[35.35, 32.98, 0.18, 0.5], [35.05, 32.70, 0.12, 0.35], [35.42, 32.47, 0.08, 0.3], [35.25, 32.2, 0.2, 0.4], [35.18, 31.75, 0.2, 0.45], [35.1, 31.5, 0.18, 0.4], [34.85, 30.65, 0.3, 0.35], [34.95, 29.7, 0.12, 0.35], [35.78, 33.31, 0.07, 0.6]];

  // ---------- the places ----------
  var CAT = { t: ["📜 תנ״ך", "#C2643B"], h: ["🏛️ היסטוריה", "#7A4FB8"], n: ["🌿 טבע", "#4E8B3A"], c: ["🏙️ עיר", "#2F7FC1"] };
  var P = [
    ["kotel", "ירושלים · הכותל המערבי", 31.7767, 35.2345, "t", "🕍", "דוד המלך עשה את ירושלים לבירה, ושלמה בנו בנה בה את בית המקדש. הכותל המערבי הוא חלק מהחומה שהקיפה את הר הבית, ומכל העולם באים להתפלל לידו.", "שמואל ב ה · מלכים א ו"],
    ["hevron", "חברון · מערת המכפלה", 31.5247, 35.1107, "t", "🪨", "אברהם קנה את המערה מעפרון החתי, ושם קבורים אבות האומה ואמהותיה: אברהם ושרה, יצחק ורבקה, יעקב ולאה.", "בראשית כג"],
    ["rachel", "בית לחם · קבר רחל", 31.7192, 35.2021, "t", "🕯️", "רחל אמנו נקברה ״בדרך אפרתה, היא בית לחם״. בבית לחם נולד גם דוד המלך, הרועה הצעיר.", "בראשית לה, יט"],
    ["beersheva", "באר שבע · באר אברהם", 31.2430, 34.7980, "t", "🪣", "אברהם חפר כאן באר וכרת ברית עם אבימלך, ״על כן קרא למקום ההוא באר שבע״.", "בראשית כא, לא"],
    ["shechem", "שכם · קבר יוסף", 32.2133, 35.2850, "t", "🌾", "לשכם הגיע אברהם ראשון כשבא לארץ. כשבני ישראל יצאו ממצרים הם העלו איתם את עצמות יוסף, וקברו אותן כאן.", "בראשית יב · יהושע כד, לב"],
    ["beitel", "בית אל", 31.9430, 35.2240, "t", "🪜", "כאן חלם יעקב על סולם שמוצב ארצה וראשו מגיע השמימה, ומלאכים עולים ויורדים בו.", "בראשית כח"],
    ["shilo", "שילה", 32.0555, 35.2897, "t", "⛺", "המשכן עמד בשילה כמעט 369 שנה. כאן התפללה חנה בלב שלם, ונולד לה שמואל הנביא.", "שמואל א א"],
    ["yericho", "יריחו", 31.8710, 35.4440, "t", "📯", "בני ישראל הקיפו את העיר שבעה ימים ותקעו בשופרות, והחומה נפלה. זו העיר הראשונה שכבשו בארץ.", "יהושע ו"],
    ["ela", "עמק האלה", 31.6900, 34.9600, "t", "🪨", "כאן יצא דוד הצעיר מול גלית הענק, עם קלע וחמש אבנים חלוקות מן הנחל, וניצח.", "שמואל א יז"],
    ["eingedi", "עין גדי", 31.4613, 35.3870, "n", "🐐", "דוד הסתתר משאול במערות עין גדי. היום יש כאן מפלים ובריכות במדבר, ויעלים ושפנים מסתובבים ליד המטיילים.", "שמואל א כד"],
    ["masada", "מצדה", 31.3156, 35.3536, "h", "🏰", "מבצר על ראש הר מול ים המלח, שבנה המלך הורדוס. בסוף המרד הגדול ברומאים, המורדים האחרונים החזיקו בו מעמד עד הסוף.", ""],
    ["deadsea", "ים המלח", 31.5000, 35.5000, "n", "🧂", "המקום הנמוך ביותר על פני היבשה בכל העולם. המים מלוחים כל כך, שאפשר לצוף עליהם בלי לשחות.", ""],
    ["carmel", "הכרמל · מקום אליהו", 32.6630, 35.0930, "t", "🔥", "על הכרמל עמד אליהו הנביא מול נביאי הבעל, אש ירדה מן השמים, וכל העם קרא: ״ה׳ הוא האלוקים״.", "מלכים א יח"],
    ["tavor", "הר תבור", 32.6870, 35.3900, "t", "⛰️", "הר עגול שעומד לבד בעמק. מכאן יצאו ברק ודבורה הנביאה עם עשרת אלפים איש, וניצחו את סיסרא.", "שופטים ד"],
    ["harod", "מעיין חרוד · גדעון", 32.5500, 35.3600, "t", "💧", "גדעון בחר כאן את לוחמיו: רק 300 שלקקו את המים מכף ידם. איתם ובשופרות וכדים ניצח את מדיין.", "שופטים ז"],
    ["megido", "מגידו", 32.5850, 35.1850, "h", "🏺", "עיר עתיקה מאוד ששלמה המלך ביצר. במשך אלפי שנים נבנו בה ערים זו על גבי זו, יותר מעשרים שכבות.", "מלכים א ט, טו"],
    ["tzfat", "צפת", 32.9646, 35.4960, "h", "✡️", "עיר המקובלים. חיו כאן האר״י הקדוש ורבי יוסף קארו, שכתב את השולחן ערוך. יש בה בתי כנסת עתיקים וסמטאות כחולות.", ""],
    ["meron", "מירון · ציון רשב״י", 32.9800, 35.4400, "h", "🔥", "רבי שמעון בר יוחאי קבור במירון, ובל״ג בעומר מדליקים כאן מדורות ושרים.", ""],
    ["tveria", "טבריה", 32.7922, 35.5312, "h", "📖", "בטבריה הושלם התלמוד הירושלמי ונקבע הניקוד של התנ״ך, ובה קבור הרמב״ם.", ""],
    ["kineret", "הכנרת", 32.8300, 35.5900, "n", "🐟", "האגם המתוק הגדול בארץ. מסביבו הרים, ובתוכו שוחים דגים, כמו האמנון.", ""],
    ["hermon", "החרמון", 33.3100, 35.7800, "n", "🏔️", "ההר הגבוה בישראל. בחורף יורד עליו שלג, ואפשר אפילו לגלוש בו בסקי.", ""],
    ["banias", "הבניאס", 33.2480, 35.6940, "n", "🌊", "מעיין ומפל רועש, אחד משלושת המקורות של הירדן.", ""],
    ["dan", "תל דן", 33.2480, 35.6520, "t", "🌳", "נחל דן הוא הגדול במקורות הירדן. ״מדן ועד באר שבע״ היה בתנ״ך הביטוי לכל הארץ, מהצפון עד הדרום.", "שופטים כ, א"],
    ["hula", "עמק החולה", 33.1000, 35.6100, "n", "🕊️", "בכל סתיו עוברים כאן מאות אלפי עגורים בדרכם לאפריקה, ורבים מהם נשארים לכל החורף.", ""],
    ["gamla", "גמלא", 32.9000, 35.7400, "h", "🦅", "עיר עתיקה על רכס שנראה כמו גב של גמל. היום מקננים בצוקים שלה נשרים.", ""],
    ["bental", "הר בנטל", 33.1300, 35.7800, "n", "🔭", "הר געש כבוי ברמת הגולן, עם תצפית רחבה על החרמון ועל הגולן.", ""],
    ["rosh", "ראש הנקרה", 33.0930, 35.1040, "n", "🪨", "מערות לבנות שהגלים חצבו בסלע. יורדים אליהן ברכבל, ושומעים את הים מתנפץ.", ""],
    ["ako", "עכו", 32.9200, 35.0700, "h", "🏯", "עיר נמל עתיקה עם חומות לים, ומנהרות ואולמות מימי האבירים הצלבנים.", ""],
    ["haifa", "חיפה", 32.7900, 34.9900, "c", "⚓", "עיר הנמל הגדולה, על מורדות הכרמל. מלמעלה רואים את כל מפרץ חיפה.", ""],
    ["kesarya", "קיסריה", 32.5000, 34.8900, "h", "🏟️", "הורדוס בנה כאן נמל ענק בלב הים. יש בה תיאטרון רומי שמופיעים בו גם היום.", ""],
    ["beitshean", "בית שאן", 32.5000, 35.5000, "h", "🏛️", "עיר רומית עתיקה וענקית, עם רחובות של עמודים, מרחצאות ותיאטרון.", ""],
    ["grizim", "הר גריזים והר עיבל", 32.2000, 35.2700, "t", "⛰️", "בני ישראל עמדו על שני ההרים שליד שכם, חציים מול חציים, ושמעו את הברכה ואת הקללה מהתורה.", "דברים כז · יהושע ח"],
    ["telaviv", "תל אביב · היכל העצמאות", 32.0637, 34.7716, "h", "🇮🇱", "כאן קרא דוד בן גוריון את מגילת העצמאות, בה׳ באייר תש״ח, וקמה מדינת ישראל.", ""],
    ["yafo", "יפו", 32.0540, 34.7500, "t", "🐋", "מנמל יפו ניסה יונה הנביא לברוח באונייה לתרשיש, לפני שבלע אותו הדג הגדול.", "יונה א, ג"],
    ["modiin", "מודיעין · המכבים", 31.9300, 35.0400, "h", "🕎", "מכאן יצאו מתתיהו הכהן ובניו המכבים למרד ביוונים. כך התחיל סיפור חנוכה!", ""],
    ["beitshemesh", "בית שמש", 31.7500, 34.9900, "t", "🐄", "לכאן החזירו הפלשתים את ארון הברית, על עגלה חדשה שמשכו שתי פרות.", "שמואל א ו"],
    ["shaar", "שער הגיא", 31.8100, 35.0200, "h", "🚚", "במלחמת העצמאות עלו כאן שיירות לירושלים הנצורה. עד היום עומדים בצד הדרך משוריינים לזכרם.", ""],
    ["guvrin", "בית גוברין · מערות הפעמון", 31.6000, 34.9000, "h", "🔔", "מאות מערות ענקיות בצורת פעמון, שנחצבו לפני יותר מאלף שנה בסלע הגיר הרך.", ""],
    ["herodion", "הרודיון", 31.6660, 35.2410, "h", "🌋", "הר שהורדוס הגביה ובנה עליו ארמון־מבצר. מרחוק הוא נראה כמו הר געש קטן.", ""],
    ["qumran", "קומראן · המגילות הגנוזות", 31.7410, 35.4590, "h", "📜", "במערות שכאן מצא רועה צעיר כדים עם מגילות: ספרי תנ״ך עתיקים בני יותר מאלפיים שנה.", ""],
    ["ramon", "מכתש רמון", 30.6100, 34.8000, "n", "🌌", "מכתש ענק שנוצר במשך מיליוני שנים מסחיפה, ולא מפגיעה של מטאוריט. בלילה רואים כאן אינספור כוכבים.", ""],
    ["avdat", "עין עבדת", 30.8200, 34.7700, "n", "🏜️", "קניון לבן במדבר, עם מעיינות, בריכות ומפל, ועופות דורסים שדואים מעל.", ""],
    ["sdeboker", "שדה בוקר", 30.8700, 34.7900, "h", "🌵", "דוד בן גוריון חלם להפריח את הנגב, ועבר לגור כאן בצריף צנוע. הוא קבור בשדה בוקר.", ""],
    ["timna", "תמנע", 29.7900, 34.9800, "n", "🟥", "מכרות נחושת עתיקים מאוד, ו״עמודי שלמה״: צוקים אדומים ענקיים במדבר.", ""],
    ["eilat", "אילת · ים סוף", 29.5500, 34.9500, "n", "🐠", "העיר הדרומית בישראל. במים יש שוניות אלמוגים ודגים בכל הצבעים.", ""]
  ];
  var BY = {}; P.forEach(function (p) { BY[p[0]] = p; });
  var ROUTES = [
    { e: "🐪", name: "בעקבות אברהם אבינו", sub: "שכם · בית אל · חברון · באר שבע", stops: [["shechem", "אברהם הגיע לארץ כנען ועבר בה עד שכם. כאן אמר לו ה׳: ״לזרעך אתן את הארץ הזאת״, ואברהם בנה מזבח."], ["beitel", "משם המשיך אל ההר שבין בית אל לעי, נטה את אוהלו ובנה עוד מזבח."], ["hevron", "אחרי שנפרד מלוט, בא אברהם וישב באלוני ממרא אשר בחברון."], ["beersheva", "בבאר שבע חפר אברהם באר, נטע אשל וקרא שם בשם ה׳."]] },
    { e: "🐑", name: "יעקב אבינו", sub: "באר שבע · בית אל · שכם · בית לחם · חברון", stops: [["beersheva", "יעקב יצא מבאר שבע ללכת לחרן, לבית לבן."], ["beitel", "בדרך לן ללילה וחלם על סולם שראשו מגיע השמימה. בבוקר קרא למקום בית אל."], ["shechem", "אחרי שנים רבות חזר לארץ עם משפחתו הגדולה, וקנה חלקת שדה ליד שכם."], ["rachel", "בדרך אפרתה נולד בנימין, ורחל אמנו נפטרה ונקברה שם."], ["hevron", "ולבסוף בא יעקב אל יצחק אביו, לממרא, היא חברון."]] },
    { e: "👑", name: "דוד המלך", sub: "בית לחם · עמק האלה · עין גדי · חברון · ירושלים", stops: [["rachel", "דוד נולד בבית לחם, והיה רועה צאן צעיר, אמיץ ומנגן בכינור."], ["ela", "בעמק האלה יצא מול גלית הענק, וניצח בקלע ואבן."], ["eingedi", "כשברח משאול הסתתר במערות עין גדי, ולא פגע בשאול גם כשיכול היה."], ["hevron", "בחברון נמשח דוד למלך, ומלך בה שבע שנים וחצי."], ["kotel", "דוד כבש את ירושלים ועשה אותה לבירה של כל ישראל. שלמה בנו בנה בה את בית המקדש."]] },
    { e: "📣", name: "הנביאים", sub: "שילה · הכרמל · יפו", stops: [["shilo", "בשילה גדל שמואל הנביא אצל עלי הכהן, ליד המשכן."], ["carmel", "על הכרמל הוכיח אליהו הנביא לכל העם ש״ה׳ הוא האלוקים״."], ["yafo", "יונה ירד ליפו ומצא אונייה לתרשיש, אבל הדג הגדול החזיר אותו לדרכו, אל נינווה."]] },
    { e: "🛡️", name: "המכבים", sub: "מודיעין · ירושלים", stops: [["modiin", "מתתיהו הכהן ובניו יצאו ממודיעין למרד נגד היוונים, שרצו להשכיח את התורה."], ["kotel", "יהודה המכבי שחרר את ירושלים, טיהר את בית המקדש, ופך השמן הקטן דלק שמונה ימים."]] },
    { e: "🚶", name: "מדן ועד באר שבע", sub: "כל הארץ, מהצפון עד הדרום", stops: [["dan", "״מדן ועד באר שבע״: כך קראו בתנ״ך לכל הארץ. מתחילים בצפון, במקורות הירדן."], ["tzfat", "צפת, עיר המקובלים, גבוה בהרי הגליל."], ["kineret", "הכנרת, האגם המתוק הגדול בארץ."], ["tavor", "הר תבור, שעומד לבד באמצע העמק."], ["shilo", "שילה, שבה עמד המשכן."], ["kotel", "ירושלים, לב הארץ."], ["hevron", "חברון, עיר האבות."], ["beersheva", "ובאר שבע, בירת הנגב. מכאן ודרומה, המדבר."]] }
  ];

  // ---------- the map ----------
  var cv = $("m"), g = cv.getContext("2d"), W = 0, H = 0, DPR = 1, K0 = Math.cos(31.5 * Math.PI / 180);
  var V = { s: 100, ox: 0, oy: 0 }, need = 1, FILTER = "", SEL = null, ROUTE = null, QZ = null, ME = null, ANIM = null;
  function wx(lon) { return (lon - 34.15) * K0; } function wy(lat) { return 33.45 - lat; }
  function X(lon) { return V.ox + wx(lon) * V.s; } function Y(lat) { return V.oy + wy(lat) * V.s; }
  function unX(x) { return (x - V.ox) / V.s / K0 + 34.15; } function unY(y) { return 33.45 - (y - V.oy) / V.s; }
  function fitView(b, pad) { // b: [lonW, latS, lonE, latN]
    var top = 120, bottom = 100, w = (b[2] - b[0]) * K0, h = b[3] - b[1], s = Math.min((W - 2 * (pad || 20)) / w, (H - top - bottom) / h);
    return { s: s, ox: W / 2 - (wx(b[0]) + w / 2) * s, oy: top + (H - top - bottom) / 2 - (wy(b[3]) + h / 2) * s };
  }
  var ALL = [34.2, 29.45, 35.9, 33.38];
  function resize() { DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; g.setTransform(DPR, 0, 0, DPR, 0, 0); var f = fitView(ALL); V.s = f.s; V.ox = f.ox; V.oy = f.oy; BASE = f.s; need = 1; }
  var BASE = 100;
  addEventListener("resize", resize);
  function ring(pts) { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(X(p[0]), Y(p[1])); else g.moveTo(X(p[0]), Y(p[1])); }); g.closePath(); }
  function rnd(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  var DOTS = (function () { var r = rnd(4), out = []; for (var i = 0; i < 900; i++) { var lon = 34.3 + r() * 1.3, lat = 29.5 + r() * 2.4; if (lat < 31.15 || lon > 35.28 && lat < 31.85 && lat > 31.2) out.push([lon, lat, r()]); } return out; })();
  function draw() {
    // the sea
    var sea = g.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, "#A9D3EC"); sea.addColorStop(1, "#7FB4DA"); g.fillStyle = sea; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1.2;
    for (var yy = (V.oy % 26) - 26; yy < H; yy += 26) for (var xx = ((V.ox * 0.9) % 60) - 60 + (Math.floor(yy / 26) % 2) * 30; xx < X(34.6); xx += 60) { g.beginPath(); g.arc(xx, yy, 9, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    // the land around
    g.save(); g.shadowColor = "rgba(40,60,90,.35)"; g.shadowBlur = 14;
    COAST.forEach(function (r) { ring(r); g.fillStyle = "#E9E0C9"; g.fill(); }); g.restore();
    COAST.forEach(function (r) { ring(r); g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 2.2; g.stroke(); });
    // the land between the sea and the Jordan, painted from green north to sand south
    g.save(); g.beginPath(); COAST.forEach(function (r) { r.forEach(function (p, i) { if (i) g.lineTo(X(p[0]), Y(p[1])); else g.moveTo(X(p[0]), Y(p[1])); }); g.closePath(); }); g.clip();
    ring(REGION); var gr = g.createLinearGradient(0, Y(33.3), 0, Y(29.5));
    [[0, "#A3CF8A"], [0.2, "#B7D592"], [0.38, "#D4D79C"], [0.5, "#E6D6A0"], [0.62, "#EFCF92"], [0.8, "#EDC181"], [1, "#E5AE6E"]].forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    g.fillStyle = gr; g.fill();
    g.save(); ring(REGION); g.clip();
    HILLS.forEach(function (h) { var x = X(h[0]), y = Y(h[1]), r = h[2] * V.s, hg = g.createRadialGradient(x - r * 0.2, y - r * 0.3, 0, x, y, r); var snow = h[0] > 35.7; hg.addColorStop(0, snow ? "rgba(255,255,255,.95)" : "rgba(120,96,60," + h[3] * 0.55 + ")"); hg.addColorStop(1, "rgba(120,96,60,0)"); g.fillStyle = hg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
    g.fillStyle = "rgba(150,100,50,.25)"; var ds = Math.max(1, V.s / 250); DOTS.forEach(function (d) { g.fillRect(X(d[0]), Y(d[1]), ds, ds); });
    g.restore();
    ring(REGION); g.strokeStyle = "rgba(110,70,30,.45)"; g.lineWidth = 2; g.setLineDash([]); g.stroke();
    g.restore();
    // water
    [KIN, DEAD, HULA].forEach(function (w) { ring(w); var wg = g.createLinearGradient(0, Y(w[0][1]), 0, Y(w[w.length / 2 | 0][1])); wg.addColorStop(0, "#5DAEE0"); wg.addColorStop(1, "#3D8FCB"); g.fillStyle = wg; g.fill(); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.5; g.stroke(); });
    g.strokeStyle = "#4E9ED6"; g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = Math.max(2, V.s / 160);
    JORDAN.forEach(function (l) { g.beginPath(); l.forEach(function (p, i) { if (i) g.lineTo(X(p[0]), Y(p[1])); else g.moveTo(X(p[0]), Y(p[1])); }); g.stroke(); });
    // names of the land and the waters
    g.textAlign = "center"; g.direction = "rtl";
    var z = V.s / BASE;
    AREAS.forEach(function (a) { g.font = "italic 700 " + Math.round(13 + 3 * Math.min(2, z)) + "px 'Frank Ruhl Libre', serif"; g.fillStyle = "rgba(95,62,28,.42)"; g.fillText(a[0], X(a[1]), Y(a[2])); });
    SEAS.forEach(function (a) { g.font = "italic 700 " + Math.round(a[3] + 2 * Math.min(2, z)) + "px 'Frank Ruhl Libre', serif"; g.fillStyle = "rgba(25,85,140,.55)"; g.fillText(a[0], X(a[1]), Y(a[2])); });
    // the route being walked
    if (ROUTE) drawRoute();
    // the places
    var r0 = Math.max(8, Math.min(19, 5 + z * 4.5)), labels = z > 1.7;
    P.forEach(function (p) {
      if (FILTER && p[4] !== FILTER) return; var x = X(p[3]), y = Y(p[2]); if (x < -30 || x > W + 30 || y < -30 || y > H + 30) return;
      var sel = SEL === p, r = sel ? r0 * 1.3 : r0, col = CAT[p[4]][1];
      g.save(); g.shadowColor = "rgba(60,30,0,.35)"; g.shadowBlur = 6; g.shadowOffsetY = 2; g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore();
      g.lineWidth = sel ? 4 : 3; g.strokeStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
      g.font = Math.round(r * 1.05) + "px sans-serif"; g.textBaseline = "middle"; g.fillStyle = "#000"; g.fillText(p[5], x, y + 1); g.textBaseline = "alphabetic";
      if (S.been[p[0]]) { g.fillStyle = "#4E8B3A"; g.beginPath(); g.arc(x + r * 0.75, y - r * 0.75, r * 0.42, 0, TAU); g.fill(); g.fillStyle = "#fff"; g.font = "700 " + Math.round(r * 0.55) + "px Rubik"; g.textBaseline = "middle"; g.fillText("✓", x + r * 0.75, y - r * 0.72); g.textBaseline = "alphabetic"; }
      if (labels || sel) { g.font = "700 " + (sel ? 15 : 12.5) + "px Rubik, sans-serif"; g.lineWidth = 3.5; g.strokeStyle = "rgba(255,250,238,.95)"; var t = p[1].split(" · ")[0]; g.strokeText(t, x, y + r + 14); g.fillStyle = "#3A2A18"; g.fillText(t, x, y + r + 14); }
    });
    if (ME) { var mx = X(ME[1]), my = Y(ME[0]); g.fillStyle = "rgba(47,127,193,.2)"; g.beginPath(); g.arc(mx, my, 22, 0, TAU); g.fill(); g.fillStyle = "#2F7FC1"; g.beginPath(); g.arc(mx, my, 8, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 3; g.stroke(); }
    if (QZ && QZ.mark) { var q = QZ.mark, k = (performance.now() / 900) % 1; g.strokeStyle = q.col; g.globalAlpha = 1 - k; g.lineWidth = 3; g.beginPath(); g.arc(X(q.lon), Y(q.lat), 14 + 30 * k, 0, TAU); g.stroke(); g.globalAlpha = 1; need = 1; }
  }

  // ---------- moving the map ----------
  var pts = {}, drag = null, pinch = null, moved = 0, last = performance.now();
  cv.addEventListener("pointerdown", function (e) { cv.setPointerCapture(e.pointerId); pts[e.pointerId] = [e.clientX, e.clientY]; moved = 0; ANIM = null; var ids = Object.keys(pts);
    if (ids.length === 1) drag = { x: e.clientX, y: e.clientY };
    if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: V.s, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2, lon: unX((a[0] + b[0]) / 2), lat: unY((a[1] + b[1]) / 2) }; drag = null; } });
  cv.addEventListener("pointermove", function (e) {
    if (!pts[e.pointerId]) return; pts[e.pointerId] = [e.clientX, e.clientY]; var ids = Object.keys(pts);
    if (pinch && ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]], s = clampS(pinch.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2; V.s = s; V.ox = cx - wx(pinch.lon) * s; V.oy = cy - wy(pinch.lat) * s; moved = 9; need = 1; return; }
    if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved += Math.abs(dx) + Math.abs(dy); V.ox += dx; V.oy += dy; drag.x = e.clientX; drag.y = e.clientY; need = 1;
  });
  function up(e) { delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinch = null; if (!Object.keys(pts).length) { if (drag && moved < 8) tap(e.clientX, e.clientY); drag = null; } }
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", function (e) { e.preventDefault(); zoomAt(e.clientX, e.clientY, V.s * (1 - e.deltaY * 0.0015)); }, { passive: false });
  cv.addEventListener("dblclick", function (e) { zoomAt(e.clientX, e.clientY, V.s * 1.8); });
  function clampS(s) { return Math.max(BASE * 0.8, Math.min(BASE * 12, s)); }
  function zoomAt(x, y, s) { var lon = unX(x), lat = unY(y); s = clampS(s); V.s = s; V.ox = x - wx(lon) * s; V.oy = y - wy(lat) * s; need = 1; }
  function goTo(lon, lat, s, ms, done) { // fly smoothly so that (lon, lat) sits in the middle of the free space
    var top = 120, bottom = SEL || ROUTE ? H * 0.42 : 100, cy = top + (H - top - bottom) / 2, s1 = clampS(s || V.s);
    ANIM = { t0: performance.now(), ms: RM ? 1 : ms || 900, a: { s: V.s, ox: V.ox, oy: V.oy }, b: { s: s1, ox: W / 2 - wx(lon) * s1, oy: cy - wy(lat) * s1 }, done: done };
  }
  function goFit(b, ms, done) { var f = fitView(b, 50); if (SEL || ROUTE) { f = fitView(b, 50); var h = H * 0.42; f.oy -= (h - 100) / 2; } ANIM = { t0: performance.now(), ms: RM ? 1 : ms || 1000, a: { s: V.s, ox: V.ox, oy: V.oy }, b: f, done: done }; }
  function loop(t) {
    requestAnimationFrame(loop);
    if (ANIM) { var k = Math.min(1, (t - ANIM.t0) / ANIM.ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; ["s", "ox", "oy"].forEach(function (p) { V[p] = ANIM.a[p] + (ANIM.b[p] - ANIM.a[p]) * e; }); need = 1; if (k >= 1) { var d = ANIM.done; ANIM = null; d && d(); } }
    if (ROUTE && ROUTE.walk) { need = 1; }
    if (need) { need = 0; draw(); }
  }

  // ---------- touching a place ----------
  function hit(x, y) { var z = V.s / BASE, r0 = Math.max(8, Math.min(19, 5 + z * 4.5)), best = null, bd = 1e9; P.forEach(function (p) { if (FILTER && p[4] !== FILTER) return; var d = Math.hypot(X(p[3]) - x, Y(p[2]) - y); if (d < r0 + 10 && d < bd) { bd = d; best = p; } }); return best; }
  function tap(x, y) {
    if (QZ) return quizTap(unX(x), unY(y));
    if (ROUTE) return;
    var p = hit(x, y); if (p) open(p); else close();
  }
  function open(p, keep) {
    SEL = p; need = 1; var c = CAT[p[4]];
    if (!keep) goTo(p[3], p[2], Math.max(V.s, BASE * 2.6), 900);
    var card = $("card"), been = !!S.been[p[0]];
    var routes = ROUTES.filter(function (r) { return r.stops.some(function (s) { return s[0] === p[0]; }); });
    card.style.setProperty("--c", c[1]);
    card.replaceChildren(el("button", { class: "x", type: "button", "aria-label": "סגירה", text: "✕", onclick: close }),
      el("div", { class: "hd" }, [el("span", { class: "em", text: p[5] }), el("div", null, [el("h2", { text: p[1] }), el("span", { class: "cat", text: c[0] })])]),
      el("p", { class: "story", text: p[6] }), p[7] ? el("div", { class: "ref", text: "📖 " + p[7] }) : null,
      el("div", { class: "row" }, [
        el("button", { class: "btn" + (been ? " on" : " terra"), type: "button", text: been ? "✓ הייתי כאן" : "📍 הייתי כאן", onclick: function () { if (S.been[p[0]]) delete S.been[p[0]]; else { S.been[p[0]] = Date.now(); chime(); toast("🛂 נוסף לדרכון! " + Object.keys(S.been).length + " מתוך " + P.length); } save(); count(); open(p, true); } }),
        el("a", { class: "btn ghost", href: "https://www.google.com/maps/search/?api=1&query=" + p[2] + "," + p[3], target: "_blank", rel: "noopener", text: "🚗 ניווט" })]),
      routes.length ? el("div", { class: "row" }, routes.map(function (r) { return el("button", { class: "btn ghost", type: "button", text: r.e + " " + r.name, onclick: function () { walk(r); } }); })) : null);
    card.classList.add("open"); $("dock").classList.add("hide"); card.scrollTop = 0;
  }
  function close() { SEL = null; need = 1; $("card").classList.remove("open"); if (!QZ && !ROUTE) $("dock").classList.remove("hide"); }
  function count() { var n = Object.keys(S.been).length; $("cnt").textContent = n ? "🛂 הייתם ב־" + n + " מתוך " + P.length + " מקומות" : P.length + " מקומות מהתנ״ך, מההיסטוריה ומהטבע"; }

  // ---------- the routes: the path draws itself, a traveller walks it, and the story is told stop by stop ----------
  function walk(r) {
    close(); $("dock").classList.add("hide"); var stops = r.stops.map(function (s) { return BY[s[0]]; });
    ROUTE = { r: r, stops: stops, i: 0, seg: 0, t0: 0, walk: false };
    var lons = stops.map(function (p) { return p[3]; }), lats = stops.map(function (p) { return p[2]; });
    var pad = 0.12, b = [Math.min.apply(null, lons) - pad, Math.min.apply(null, lats) - pad, Math.max.apply(null, lons) + pad, Math.max.apply(null, lats) + pad];
    goFit(b, 1000, function () { showStop(0); });
  }
  function showStop(i) {
    var R = ROUTE; if (!R) return; R.i = i; SEL = R.stops[i]; need = 1; chime();
    var st = $("strip"); st.hidden = false;
    st.replaceChildren(el("div", { class: "dots" }, R.stops.map(function (s, k) { return el("i", { class: k <= i ? "on" : "" }); })),
      el("h3", { text: R.r.e + " " + R.stops[i][1] }), el("p", { text: R.r.stops[i][1] }),
      el("div", { class: "row", style: "margin-top:0" }, [i < R.stops.length - 1 ? el("button", { class: "btn terra", type: "button", text: "ממשיכים ←", onclick: function () { step(i); } }) : el("button", { class: "btn", type: "button", text: "🎉 סיימנו את המסלול", onclick: endWalk }),
        el("button", { class: "btn ghost", type: "button", text: "✕", "aria-label": "יציאה מהמסלול", onclick: endWalk })]));
  }
  function step(i) { var R = ROUTE; R.walk = true; R.seg = i; R.t0 = performance.now(); setTimeout(function () { if (ROUTE === R) { R.walk = false; showStop(i + 1); } }, RM ? 10 : 1700); }
  function endWalk() { ROUTE = null; SEL = null; $("strip").hidden = true; $("dock").classList.remove("hide"); need = 1; }
  function drawRoute() {
    var R = ROUTE, st = R.stops, upto = R.walk ? R.seg + Math.min(1, (performance.now() - R.t0) / 1500) : R.i;
    g.save(); g.setLineDash([2, 9]); g.lineCap = "round"; g.strokeStyle = "rgba(194,100,59,.9)"; g.lineWidth = 5;
    g.beginPath(); g.moveTo(X(st[0][3]), Y(st[0][2]));
    for (var k = 1; k <= Math.ceil(upto) && k < st.length; k++) { var f = Math.min(1, upto - (k - 1)), a = st[k - 1], b = st[k]; g.lineTo(X(a[3] + (b[3] - a[3]) * f), Y(a[2] + (b[2] - a[2]) * f)); }
    g.stroke(); g.restore();
    var kk = Math.min(st.length - 1, Math.floor(upto)), ff = upto - kk, A = st[kk], B = st[Math.min(st.length - 1, kk + 1)];
    var tx = X(A[3] + (B[3] - A[3]) * ff), ty = Y(A[2] + (B[2] - A[2]) * ff), bob = R.walk ? Math.abs(Math.sin(performance.now() / 120)) * 5 : 0;
    g.font = "34px sans-serif"; g.textAlign = "center"; g.textBaseline = "bottom"; g.fillText(R.r.e, tx, ty - 14 - bob); g.textBaseline = "alphabetic";
  }

  // ---------- the game: where is it? ----------
  function startQuiz() { close(); $("dock").classList.add("hide"); QZ = { n: 0, ok: 0, total: 8, used: [] }; goFit(ALL, 800); nextQuiz(); }
  function nextQuiz() {
    if (!QZ) return; if (QZ.n >= QZ.total) return endQuiz();
    QZ.n++; QZ.done = false; QZ.mark = null; var pool = P.filter(function (p) { return QZ.used.indexOf(p[0]) < 0; }), p = pool[Math.floor(Math.random() * pool.length)]; QZ.used.push(p[0]); QZ.p = p;
    var box = $("quiz"); box.hidden = false; box.replaceChildren(el("div", { style: "font-size:34px", text: p[5] }), el("b", { text: "איפה " + p[1].split(" · ")[0] + "?" }), el("small", { text: "נוגעים במפה · " + QZ.n + " מתוך " + QZ.total + " · ⭐ " + QZ.ok }));
    FILTER = "__none__"; need = 1;
  }
  function quizTap(lon, lat) {
    if (!QZ || QZ.done) return; QZ.done = true; var p = QZ.p, km = Math.round(Math.hypot((lon - p[3]) * 111 * K0, (lat - p[2]) * 111));
    var good = km <= 18; if (good) { QZ.ok++; chime(); toast("🎯 בול! רק " + km + " ק״מ"); } else toast("📍 פספסת ב־" + km + " ק״מ. הנה זה!");
    QZ.mark = { lon: p[3], lat: p[2], col: good ? "#4E8B3A" : "#C2643B" }; FILTER = ""; SEL = p; need = 1;
    setTimeout(function () { SEL = null; nextQuiz(); }, 2300);
  }
  function endQuiz() {
    var q = QZ; QZ = null; FILTER = ""; $("quiz").hidden = true; $("dock").classList.remove("hide"); need = 1;
    var best = S.best; if (q.ok > best) { S.best = q.ok; save(); }
    sheet(function () { return [el("h2", { text: (q.ok >= 7 ? "🏆 " : q.ok >= 4 ? "👏 " : "💪 ") + q.ok + " מתוך " + q.total }), el("p", { class: "sub", text: q.ok > best ? "שיא חדש!" : "השיא שלכם: " + best + " מתוך 8" }),
      el("div", { class: "row" }, [el("button", { class: "btn terra", type: "button", text: "🔁 עוד פעם", onclick: function () { closeSheet(); startQuiz(); } }), el("button", { class: "btn ghost", type: "button", text: "סיום", onclick: closeSheet })])]; });
  }

  // ---------- sheets ----------
  function sheet(build) { var b = $("sheetBody"); b.replaceChildren.apply(b, build().filter(Boolean)); $("sheet").classList.add("open"); $("scrim").classList.add("on"); }
  function closeSheet() { $("sheet").classList.remove("open"); $("scrim").classList.remove("on"); }
  $("scrim").addEventListener("click", closeSheet);
  addEventListener("keydown", function (e) { if (e.key === "Escape") { closeSheet(); close(); if (ROUTE) endWalk(); if (QZ) { QZ.n = QZ.total; endQuiz(); } } });
  $("dRoute").addEventListener("click", function () { sheet(function () { return [el("h2", { text: "📜 מסלולים" }), el("p", { class: "sub", text: "הולכים בעקבות האבות, המלכים והנביאים, תחנה אחרי תחנה" }),
    el("div", { class: "routes" }, ROUTES.map(function (r) { return el("button", { class: "route", type: "button", onclick: function () { closeSheet(); walk(r); } }, [el("span", { text: r.e }), el("div", null, [el("b", { text: r.name }), el("small", { text: r.sub })])]); }))]; }); });
  $("dQuiz").addEventListener("click", startQuiz);
  $("find").addEventListener("click", function () {
    var q = el("input", { type: "search", placeholder: "שם של מקום…", "aria-label": "חיפוש מקום", style: "width:100%;border:1px solid var(--line);border-radius:14px;padding:11px 12px;font-size:16px;background:#fff;margin-bottom:10px" }), list = el("div", { class: "list" });
    var fill = function () { var t = q.value.trim(); list.replaceChildren.apply(list, P.filter(function (p) { return !t || p[1].indexOf(t) >= 0 || p[6].indexOf(t) >= 0; }).map(function (p) { return el("button", { type: "button", onclick: function () { closeSheet(); open(p); } }, [el("span", { text: p[5] }), p[1], el("small", { text: CAT[p[4]][0] })]); })); };
    q.addEventListener("input", fill); fill();
    sheet(function () { return [el("h2", { text: "🔍 לאן?" }), q, list]; }); setTimeout(function () { q.focus(); }, 350);
  });
  $("fit").addEventListener("click", function () { close(); goFit(ALL, 900); });
  $("dNear").addEventListener("click", function () {
    if (!navigator.geolocation) return toast("אין גישה למיקום בטלפון הזה");
    toast("🧭 מחפשים איפה אתם…");
    navigator.geolocation.getCurrentPosition(function (pos) {
      ME = [pos.coords.latitude, pos.coords.longitude]; need = 1;
      var near = P.map(function (p) { return [p, Math.round(Math.hypot((p[3] - ME[1]) * 111 * K0, (p[2] - ME[0]) * 111))]; }).sort(function (a, b) { return a[1] - b[1]; }).slice(0, 7);
      if (near[0][1] > 300) { toast("נראה שאתם רחוק מהארץ. נתראה כשתגיעו 💛"); return; }
      goTo(ME[1], ME[0], BASE * 3, 900);
      sheet(function () { return [el("h2", { text: "🧭 קרוב אליכם" }), el("p", { class: "sub", text: "המקומות הקרובים ביותר, בקו אווירי" }), el("div", { class: "list" }, near.map(function (n) { return el("button", { type: "button", onclick: function () { closeSheet(); open(n[0]); } }, [el("span", { text: n[0][5] }), n[0][1], el("small", { text: n[1] + " ק״מ" })]); }))]; });
    }, function () { toast("לא התקבל מיקום"); }, { timeout: 10000, maximumAge: 600000 });
  });
  $("dPass").addEventListener("click", function () {
    var n = Object.keys(S.been).length;
    sheet(function () { return [el("h2", { text: "🛂 הייתי כאן" }), el("p", { class: "sub", text: n ? "הייתם ב־" + n + " מתוך " + P.length + " מקומות. כל הכבוד!" : "כשמגיעים למקום, נוגעים בו ולוחצים ״הייתי כאן״, ומקבלים חותמת." }), el("div", { class: "prog" }, [el("b", { style: "width:" + Math.round(n / P.length * 100) + "%" })]),
      el("div", { class: "pass" }, P.slice().sort(function (a, b) { return (S.been[b[0]] ? 1 : 0) - (S.been[a[0]] ? 1 : 0); }).map(function (p) { var h = 0; for (var i = 0; i < p[0].length; i++) h = (h * 31 + p[0].charCodeAt(i)) | 0;
        return el("button", { class: "stamp" + (S.been[p[0]] ? "" : " off"), type: "button", style: "--c:" + CAT[p[4]][1] + ";--r:" + ((h % 17) - 8) + "deg", onclick: function () { closeSheet(); open(p); } }, [el("span", { text: p[5] }), p[1].split(" · ")[0]]); })),
      S.best ? el("p", { class: "sub", style: "margin-top:14px", text: "🎯 השיא במשחק ״איפה זה?״: " + S.best + " מתוך 8" }) : null,
      el("p", { class: "sub", style: "margin-top:10px;font-size:12.5px", text: "קו החוף: Natural Earth (נחלת הכלל). צורת הארץ, הכנרת, ים המלח והירדן מצוירים ביד, והמפה מאוירת ולא מדויקת למדידה." })]; });
  });
  // the filter chips
  (function () { var box = $("chips"), list = [["", "הכול"]].concat(Object.keys(CAT).map(function (k) { return [k, CAT[k][0]]; }));
    var draw2 = function () { box.replaceChildren.apply(box, list.map(function (c) { return el("button", { class: "chip", type: "button", "aria-pressed": String(FILTER === c[0]), text: c[1], onclick: function () { FILTER = c[0]; need = 1; draw2(); } }); })); };
    draw2(); })();
  var AC = null;
  function chime() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); var t = AC.currentTime; [74, 81].forEach(function (m, i) { var o = AC.createOscillator(), gn = AC.createGain(); o.type = "sine"; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12); gn.gain.setValueAtTime(0.0001, t + i * 0.1); gn.gain.linearRampToValueAtTime(0.08, t + i * 0.1 + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 0.6); o.connect(gn); gn.connect(AC.destination); o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.65); }); } catch (e) {} }

  // ---------- start ----------
  resize(); count(); requestAnimationFrame(loop);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { need = 1; });
  setTimeout(function () { var s = $("splash"); s.style.opacity = "0"; setTimeout(function () { s.remove(); }, 1000); }, 900);
  if (navigator.webdriver) window.__E = { open: function (id) { open(BY[id]); }, walk: function (i) { walk(ROUTES[i]); }, V: V };
  if ("serviceWorker" in navigator) addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
})();
