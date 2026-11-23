// HaniaGlobe (globe.hania360.com): the globe, the countries, the flights and the games.
// Joined after d3-geo + topojson-client (window.G3) and the map data (window.GLOBE) by globe/build.py into globe.js.
(function () {
  "use strict";
  var G = window.G3, D = window.GLOBE, R2D = 180 / Math.PI, TAU = Math.PI * 2;
  var $ = function (id) { return document.getElementById(id); };
  function el(t, a, kids) { var e = document.createElement(t); for (var k in a || {}) { if (k === "text") e.textContent = a[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), a[k]); else if (a[k] != null && a[k] !== false) e.setAttribute(k, a[k] === true ? "" : a[k]); } (kids || []).forEach(function (c) { if (c != null && c !== false) e.append(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LS = "globe-v1", S = (function () { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } })();
  S.stamps = S.stamps || {}; S.best = S.best || {};
  function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }
  var toastT = 0;
  function toast(t) { var x = $("toast"); x.textContent = t; x.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { x.classList.remove("on"); }, 2600); }

  // ---------- the countries ----------
  var CONT = { AF: "אפריקה", AN: "אנטארקטיקה", AS: "אסיה", EU: "אירופה", NA: "צפון אמריקה", OC: "אוקיאניה", SA: "דרום אמריקה" };
  var PAL = { AF: [240, 176, 92], AN: [226, 236, 246], AS: [244, 128, 128], EU: [128, 170, 250], NA: [120, 206, 150], OC: [196, 140, 240], SA: [250, 206, 96] };
  var CAP = { BG: "סופיה", MM: "נייפידו", BI: "גיטגה", BY: "מינסק", KH: "פנום פן", CM: "יאונדה", CA: "אוטווה", CF: "בנגי", LK: "קוטה", TD: "נג׳מנה", CL: "סנטיאגו", CN: "בייג׳ינג", TW: "טאיפיי", CO: "בוגוטה", CG: "ברזוויל", CD: "קינשאסה", CR: "סן חוסה", HR: "זאגרב", CU: "הוואנה", CY: "ניקוסיה", CZ: "פראג", BJ: "פורטו נובו", DK: "קופנהגן", DO: "סנטו דומינגו", EC: "קיטו", SV: "סן סלבדור", GQ: "מלאבו", ET: "אדיס אבבה", ER: "אסמרה", EE: "טאלין", FJ: "סובה", FI: "הלסינקי", FR: "פריז", DJ: "ג׳יבוטי", GA: "ליברוויל", GE: "טביליסי", GM: "בנג׳ול", IL: "ירושלים", DE: "ברלין", GH: "אקרה", GR: "אתונה", GL: "נוק", GT: "גואטמלה סיטי", GN: "קונאקרי", GY: "ג׳ורג׳טאון", HT: "פורט-או-פרנס", HN: "טגוסיגלפה", HU: "בודפשט", IS: "רייקיאוויק", IN: "ניו דלהי", ID: "ג׳קרטה", IR: "טהרן", IQ: "בגדד", IE: "דבלין", IT: "רומא", CI: "יאמוסוקרו", JM: "קינגסטון", JP: "טוקיו", KZ: "אסטנה", JO: "עמאן", KE: "ניירובי", KP: "פיונגיאנג", KR: "סיאול", KW: "כווית", KG: "בישקק", LA: "ויינטיאן", LB: "ביירות", LS: "מאסרו", LV: "ריגה", LR: "מונרוביה", LY: "טריפולי", LT: "וילנה", LU: "לוקסמבורג", MG: "אנטננריבו", MW: "לילונגווה", MY: "קואלה לומפור", ML: "במאקו", MR: "נואקשוט", MX: "מקסיקו סיטי", MN: "אולן בטור", MD: "קישינב", ME: "פודגוריצה", MA: "רבאט", MZ: "מאפוטו", OM: "מוסקט", NA: "וינדהוק", NP: "קטמנדו", NL: "אמסטרדם", NC: "נומאה", VU: "פורט וילה", NZ: "ולינגטון", NI: "מנגואה", NE: "ניאמיי", NG: "אבוג׳ה", NO: "אוסלו", PK: "איסלמבאד", PA: "פנמה סיטי", PG: "פורט מורסבי", PY: "אסונסיון", PE: "לימה", PH: "מנילה", PL: "ורשה", PT: "ליסבון", GW: "ביסאו", TL: "דילי", PR: "סן חואן", QA: "דוחה", RO: "בוקרשט", RU: "מוסקבה", RW: "קיגאלי", SA: "ריאד", SN: "דקאר", RS: "בלגרד", SL: "פריטאון", SK: "ברטיסלבה", VN: "האנוי", SI: "ליובליאנה", SO: "מוגדישו", ZA: "פרטוריה", ZW: "הרארה", ES: "מדריד", SS: "ג׳ובה", SD: "חרטום", SR: "פרמריבו", SZ: "מבבנה", SE: "סטוקהולם", CH: "ברן", SY: "דמשק", TJ: "דושנבה", TH: "בנגקוק", TG: "לומה", TT: "פורט אוף ספיין", AE: "אבו דאבי", TN: "תוניס", TR: "אנקרה", TM: "אשגבט", UG: "קמפלה", UA: "קייב", MK: "סקופיה", EG: "קהיר", GB: "לונדון", TZ: "דודומה", US: "וושינגטון", BF: "ואגאדוגו", UY: "מונטווידאו", UZ: "טשקנט", VE: "קראקס", YE: "צנעא", ZM: "לוסקה", AR: "בואנוס איירס", BS: "נסאו", BR: "ברזיליה", BO: "סוקרה", BZ: "בלמופן", BW: "גבורונה", AO: "לואנדה", DZ: "אלג׳יר", BD: "דאקה", BT: "טהימפהו", AF: "קאבול", AM: "ירוואן", AT: "וינה", AL: "טירנה", BE: "בריסל", SB: "הוניארה", AU: "קנברה", AZ: "באקו", BN: "בנדר סרי בגוואן", BA: "סרייבו", XK: "פרישטינה" };
  var FACT = {
    IL: ["🕍", "המדינה שלנו! יש בה את ים המלח, המקום הנמוך ביותר על פני היבשה בכל העולם."],
    US: ["🗽", "יש בה 50 מדינות קטנות יותר. את פסל החירות קיבלה במתנה מצרפת."],
    FR: ["🥐", "מגדל אייפל בפריז נבנה לפני יותר מ־130 שנה, וקוראים לו על שם המהנדס שבנה אותו."],
    GB: ["💂", "״ביג בן״ בלונדון הוא בעצם שם הפעמון הגדול שבתוך המגדל, ולא של השעון."],
    IT: ["🍕", "בעיר ונציה יש תעלות במקום רחובות, ונוסעים בהן בסירות."],
    ES: ["💃", "בספרד נוהגים לאכול ארוחת ערב מאוחר מאוד, לפעמים בעשר בלילה."],
    DE: ["🧸", "בגרמניה הומצאו הדובונים הגומיים המפורסמים, לפני יותר מ־100 שנה."],
    RU: ["🪆", "המדינה הגדולה בעולם. כשבצד אחד שלה מתחיל הבוקר, בצד השני כבר ערב."],
    CN: ["🐼", "החומה הסינית ארוכה מאוד, ופנדות חיות בטבע רק בסין."],
    JP: ["🍣", "ביפן נוסעות רכבות מהירות ביותר מ־300 קמ״ש."],
    IN: ["🐘", "הודו היא המדינה עם הכי הרבה אנשים בעולם."],
    BR: ["⚽", "ברזיל זכתה בגביע העולם בכדורגל 5 פעמים, יותר מכל מדינה אחרת. ברובה יער האמזונס."],
    AU: ["🦘", "קואלות חיות בטבע רק באוסטרליה. גם רוב הקנגורו בעולם חיים בה."],
    CA: ["🍁", "בקנדה יש יותר אגמים מבכל מדינה אחרת בעולם."],
    MX: ["🌮", "העמים הקדומים של מקסיקו היו בין הראשונים ששתו משקה שוקולד."],
    EG: ["🐫", "הפירמידות בגיזה נבנו לפני יותר מ־4,500 שנה. ומשם יצאו בני ישראל ממצרים!"],
    GR: ["🏛️", "ביוון התחילו המשחקים האולימפיים, לפני כמעט 3,000 שנה."],
    TR: ["🌉", "העיר איסטנבול נמצאת על שתי יבשות: חלק באירופה וחלק באסיה."],
    NL: ["🌷", "בהולנד יש יותר אופניים מאנשים, וחלק גדול מהמדינה נמצא מתחת לגובה הים."],
    CH: ["🧀", "בשווייץ מכינים שוקולד וגבינות מפורסמים, ומדברים בה ארבע שפות רשמיות."],
    NO: ["🌞", "בצפון נורבגיה יש שבועות בקיץ שבהם השמש לא שוקעת בכלל."],
    SE: ["🧊", "בשוודיה בונים בכל חורף מחדש מלון שכולו מקרח ושלג."],
    FI: ["🧖", "בפינלנד יש מיליוני סאונות, כמעט אחת לכל בית."],
    IS: ["🌋", "באיסלנד יש הרי געש וקרחונים, ומעיינות מים חמים שמחממים בתים."],
    GL: ["🧊", "גרינלנד היא האי הגדול בעולם, ורובו מכוסה בשכבה עבה של קרח."],
    AR: ["🏔️", "בארגנטינה נמצא ההר הגבוה ביותר ביבשות אמריקה, אקונקגואה."],
    PE: ["🦙", "בפרו נמצאת העיר העתיקה מאצ׳ו פיצ׳ו, גבוה בין ההרים. חיות בה גם הרבה למות."],
    CL: ["📏", "צ׳ילה היא אחת המדינות הארוכות והצרות בעולם: ארוכה מאוד וצרה מאוד."],
    KE: ["🦒", "בקניה יוצאים לספארי ורואים אריות, פילים וג׳ירפות בטבע."],
    ZA: ["🏙️", "לדרום אפריקה יש שלוש ערי בירה!"],
    NZ: ["🐑", "בניו זילנד יש הרבה יותר כבשים מאנשים."],
    TH: ["🐘", "בתאילנד יש מקדשים מוזהבים, והפיל הוא אחד הסמלים של המדינה."],
    KR: ["🥢", "בקוריאה אוכלים קימצ׳י, כרוב חריף, כמעט בכל ארוחה."],
    MN: ["⛺", "במונגוליה הרבה משפחות גרות באוהלים עגולים שנקראים ״גר״."],
    NP: ["🏔️", "בנפאל נמצא ההר הגבוה בעולם, האוורסט."],
    SA: ["🐪", "רוב ערב הסעודית היא מדבר, ואין בה אף נהר שזורם כל השנה."],
    MG: ["🐒", "רוב בעלי החיים במדגסקר לא חיים בשום מקום אחר בעולם, כמו הלמורים."],
    IE: ["☘️", "אירלנד כל כך ירוקה, שקוראים לה ״אי האזמרגד״."],
    PT: ["⛵", "מפורטוגל יצאו לפני 500 שנה ספינות שגילו דרכים חדשות בים."],
    AQ: ["🐧", "המקום הקר ביותר בכדור הארץ. אין בו מדינה, אבל חיים בו פינגווינים."],
    CU: ["🚗", "ברחובות קובה נוסעות עדיין הרבה מכוניות ישנות מאוד."],
    JM: ["🏃", "מג׳מייקה מגיע יוסיין בולט, האיש המהיר ביותר בעולם."],
    ET: ["☕", "לפי האגדה, באתיופיה גילו לראשונה את פולי הקפה."],
    MA: ["🕌", "ממרוקו הגיעו לישראל הרבה משפחות, וגם הרבה מטעמים."],
    UA: ["🌻", "באוקראינה גדלים שדות חמניות ענקיים."]
  };
  var feats = G.feature(D.topo, D.topo.objects.countries).features, C = {};
  feats.forEach(function (f) {
    var m = D.meta[f.id]; if (!m) return;
    var c = C[m[0]] || (C[m[0]] = { iso: m[0], he: m[1], cont: m[2], ratio: 0, feats: [], area: 0 });
    c.feats.push(f); c.ratio += m[3]; f.c = c;
    // a label point: the middle of the biggest piece
    var polys = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
    polys.forEach(function (p) { var g = { type: "Polygon", coordinates: p }, a = G.geoArea(g); if (a > c.area) { c.area = a; c.at = G.geoCentroid(g); } });
  });
  var hash = function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
  Object.values(C).forEach(function (c) { var p = PAL[c.cont] || [200, 200, 200], v = (hash(c.iso) % 7) * 6 - 18; c.fill = "rgb(" + p.map(function (x) { return Math.max(0, Math.min(255, x + v)); }).join(",") + ")"; });
  // drawing in batches: one fill per color, and the borders as one line (each shared border once)
  var GROUPS = {}; feats.forEach(function (f) { if (f.c) (GROUPS[f.c.fill] = GROUPS[f.c.fill] || []).push(f); });
  var BORDERS = G.mesh(D.topo, D.topo.objects.countries, function (a, b) { return a !== b; });
  function flag(iso) { if (iso === "AQ") return "🇦🇶"; if (iso === "XK") return "🇽🇰"; return String.fromCodePoint.apply(null, iso.split("").map(function (ch) { return 0x1F1E6 + ch.charCodeAt(0) - 65; })); }
  var HOME = [35.0, 31.6], ISR = C.IL;

  // ---------- the globe ----------
  var cv = $("g"), g = cv.getContext("2d"), W = 0, H = 0, DPR = 1, BASE = 1, STARS = null;
  var V = { lon: -HOME[0] + 20, lat: -HOME[1] + 6, zoom: 1, vx: 0, vy: 0, idle: 0 };
  var proj = G.geoOrthographic().clipAngle(90).precision(0.35), path = G.geoPath(proj, g), grat = G.geoGraticule10();
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; g.setTransform(DPR, 0, 0, DPR, 0, 0);
    BASE = Math.min(W, H) * (W > H ? 0.42 : 0.44);
    STARS = document.createElement("canvas"); STARS.width = W; STARS.height = H; var x = STARS.getContext("2d");
    for (var i = 0; i < W * H / 2600; i++) { var r = Math.random(); x.globalAlpha = 0.25 + Math.random() * 0.7; x.fillStyle = r < 0.1 ? "#FFE4B5" : r < 0.2 ? "#BBD4FF" : "#fff"; var s = Math.random() < 0.93 ? 1 : 2; x.fillRect(Math.random() * W, Math.random() * H, s, s); }
    need = 1;
  }
  addEventListener("resize", resize);
  var need = 1, SEL = null, MARK = null, FLY = null, ANIM = null;
  function center() { return [-V.lon, -V.lat]; }
  function visible(p) { return G.geoDistance(p, center()) < Math.PI / 2 - 0.02; }
  function sunPoint(d) { // the place on Earth where the Sun is right overhead now
    var start = Date.UTC(d.getUTCFullYear(), 0, 0), n = (d - start) / 864e5, dec = -23.44 * Math.cos(TAU / 365 * (n + 10)), hrs = d.getUTCHours() + d.getUTCMinutes() / 60;
    return [((12 - hrs) * 15 + 540) % 360 - 180, dec];
  }
  var circle = G.geoCircle();
  function draw() {
    var cx = W / 2, cy = H / 2 + (W > H ? 10 : 0), r = BASE * V.zoom;
    proj.scale(r).translate([cx, cy]).rotate([V.lon, V.lat, 0]).precision(MOVING ? 1.2 : 0.5);
    g.clearRect(0, 0, W, H); g.drawImage(STARS, 0, 0, W, H);
    // the air around the Earth
    var at = g.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.16); at.addColorStop(0, "rgba(90,170,255,.55)"); at.addColorStop(1, "rgba(90,170,255,0)");
    g.fillStyle = at; g.beginPath(); g.arc(cx, cy, r * 1.16, 0, TAU); g.fill();
    var sea = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); sea.addColorStop(0, "#3C8DFF"); sea.addColorStop(0.7, "#1A57C9"); sea.addColorStop(1, "#0E3A8F");
    g.fillStyle = sea; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    g.beginPath(); path(grat); g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1; g.stroke();
    // the countries
    g.lineJoin = "round";
    var special = function (c) { return c === SEL || MARK && c === MARK.c; };
    Object.keys(GROUPS).forEach(function (col) { g.beginPath(); GROUPS[col].forEach(function (f) { if (!special(f.c)) path(f); }); g.fillStyle = col; g.fill(); });
    [SEL, MARK && MARK.c].forEach(function (c, i) { if (!c) return; g.beginPath(); c.feats.forEach(function (f) { path(f); }); g.fillStyle = i === 0 ? "#FFD15C" : MARK.col; g.fill(); });
    g.beginPath(); path(BORDERS); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 0.6; g.stroke();
    if (SEL) { g.beginPath(); SEL.feats.forEach(function (f) { path(f); }); g.strokeStyle = "#fff"; g.lineWidth = 2; g.stroke(); }
    // night, as it is right now
    var sp = sunPoint(new Date()), anti = [sp[0] > 0 ? sp[0] - 180 : sp[0] + 180, -sp[1]];
    [[97, 0.07], [94, 0.08], [91, 0.1], [88, 0.1], [84, 0.1], [78, 0.08]].forEach(function (n) { g.beginPath(); path(circle.center(anti).radius(n[0])()); g.fillStyle = "rgba(4,10,40," + n[1] + ")"; g.fill(); });
    // depth: darker toward the rim, a little light on the side facing the viewer
    var sh = g.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.2, cx, cy, r); sh.addColorStop(0, "rgba(255,255,255,.10)"); sh.addColorStop(0.6, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,40,.45)");
    g.fillStyle = sh; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    // the flight
    if (FLY && FLY.trail.length > 1) {
      g.beginPath(); path({ type: "LineString", coordinates: FLY.trail }); g.setLineDash([7, 7]); g.strokeStyle = "#FFD15C"; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
      var pp = proj(FLY.at), pn = proj(FLY.next);
      if (pp && visible(FLY.at)) { var ang = pn ? Math.atan2(pn[1] - pp[1], pn[0] - pp[0]) : 0; g.save(); g.translate(pp[0], pp[1]); g.rotate(ang + Math.PI / 4); g.font = "34px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("✈️", 0, 0); g.restore(); }
    }
    // labels
    g.textAlign = "center"; g.direction = "rtl";
    var home = proj(ISR.at); if (home && visible(ISR.at)) { g.font = "22px sans-serif"; g.fillText("🏠", home[0], home[1] - 6); }
    if (V.zoom > 1.6) Object.values(C).forEach(function (c) {
      if (!c.at || c === SEL || c.ratio * V.zoom * V.zoom < 60 || !visible(c.at)) return; var p = proj(c.at); if (!p) return;
      label(c.he, p[0], p[1], 12 + Math.min(4, V.zoom), "rgba(20,30,60,.85)", "rgba(255,255,255,.75)");
    });
    if (SEL && SEL.at && visible(SEL.at)) { var q = proj(SEL.at); if (q) label(flag(SEL.iso) + " " + SEL.he, q[0], q[1] - 4, 17, "#1A1A3A", "#fff"); }
    if (MARK && MARK.pulse && MARK.c.at && visible(MARK.c.at)) { var m = proj(MARK.c.at), k = (performance.now() / 900) % 1; if (m) { g.strokeStyle = "rgba(255,209,92," + (1 - k) + ")"; g.lineWidth = 3; g.beginPath(); g.arc(m[0], m[1], 12 + k * 30, 0, TAU); g.stroke(); } }
  }
  function label(t, x, y, size, ink, halo) { g.font = "700 " + size + "px Rubik, sans-serif"; g.lineWidth = 4; g.strokeStyle = halo; g.strokeText(t, x, y); g.fillStyle = ink; g.fillText(t, x, y); }

  // ---------- the loop: inertia, a slow spin when nobody touches, flights and fly-to ----------
  var last = performance.now(), MOVING = false, odd = false;
  function loop(t) {
    requestAnimationFrame(loop); var dt = Math.min(64, t - last); last = t; MOVING = !!(ANIM || FLY || drag || pinch);
    if (ANIM) { var k = Math.min(1, (t - ANIM.t0) / ANIM.ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, p = ANIM.i(e); V.lon = -p[0]; V.lat = -p[1]; V.zoom = ANIM.z0 + (ANIM.z1 - ANIM.z0) * e; need = 1; if (k >= 1) { var done = ANIM.done; ANIM = null; done && done(); } }
    else if (FLY) flyStep(t);
    else if (!drag) {
      if (Math.abs(V.vx) + Math.abs(V.vy) > 0.001) { V.lon += V.vx * dt; V.lat = clampLat(V.lat - V.vy * dt); V.vx *= 0.94; V.vy *= 0.94; need = 1; }
      else if (!RM && t - V.idle > 5000 && !SEL && !Q) { odd = !odd; if (odd) { V.lon += dt * 0.008; need = 1; MOVING = true; } }
    }
    if (MARK && MARK.pulse) need = 1;
    if (need) { need = 0; draw(); }
  }
  function clampLat(l) { return Math.max(-80, Math.min(80, l)); }
  function goTo(lonlat, zoom, ms, done) {
    var from = center(); ANIM = { t0: performance.now(), ms: RM ? 1 : ms || 1200, i: G.geoInterpolate(from, lonlat), z0: V.zoom, z1: zoom || V.zoom, done: done };
  }
  function zoomFor(c) { var a = c.ratio; return a > 300 ? 1.15 : a > 60 ? 1.5 : a > 10 ? 2.2 : a > 2 ? 3 : 3.8; }

  // ---------- touch ----------
  var drag = null, pts = {}, pinch = null, moved = 0;
  cv.addEventListener("pointerdown", function (e) { cv.setPointerCapture(e.pointerId); pts[e.pointerId] = [e.clientX, e.clientY]; moved = 0; V.idle = performance.now(); ANIM = null; var ids = Object.keys(pts);
    if (ids.length === 1) drag = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: V.zoom }; drag = null; } });
  cv.addEventListener("pointermove", function (e) {
    if (!pts[e.pointerId]) return; pts[e.pointerId] = [e.clientX, e.clientY]; var ids = Object.keys(pts);
    if (pinch && ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; V.zoom = Math.max(0.8, Math.min(7, pinch.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d)); moved = 9; need = 1; return; }
    if (!drag || FLY) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y, now = performance.now(); moved += Math.abs(dx) + Math.abs(dy);
    var k = 0.28 / V.zoom; V.lon += dx * k; V.lat = clampLat(V.lat - dy * k); var dtt = Math.max(1, now - drag.t); V.vx = dx * k / dtt; V.vy = dy * k / dtt;
    drag.x = e.clientX; drag.y = e.clientY; drag.t = now; need = 1;
  });
  function up(e) { delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinch = null; if (!Object.keys(pts).length) { if (drag && moved < 8) { V.vx = V.vy = 0; tap(e.clientX, e.clientY); } drag = null; V.idle = performance.now(); } }
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", function (e) { e.preventDefault(); V.zoom = Math.max(0.8, Math.min(7, V.zoom * (1 - e.deltaY * 0.0012))); V.idle = performance.now(); need = 1; }, { passive: false });
  function at(x, y) { var p = proj.invert([x, y]); if (!p || Math.hypot(x - W / 2, y - (H / 2 + (W > H ? 10 : 0))) > BASE * V.zoom) return null; for (var i = 0; i < feats.length; i++) if (feats[i].c && G.geoContains(feats[i], p)) return feats[i].c; return null; }
  function tap(x, y) {
    if (FLY) return; var c = at(x, y);
    if (Q) return quizTap(c);
    if (c) open(c); else close();
  }

  // ---------- the country card ----------
  function km(c) { return Math.round(G.geoDistance(HOME, c.at) * 6371); }
  function open(c, noFly) {
    SEL = c; need = 1; if (!noFly) goTo(c.at, Math.max(V.zoom, zoomFor(c)), 1100);
    var d = km(c), f = FACT[c.iso], card = $("card");
    var size = c.iso === "IL" ? "הבית" : c.ratio >= 1.5 ? "פי " + (c.ratio >= 20 ? Math.round(c.ratio).toLocaleString("he-IL") : c.ratio.toFixed(1).replace(/\.0$/, "")) + " מישראל" : c.ratio >= 0.7 ? "בערך כמו ישראל" : "קטנה מישראל";
    card.replaceChildren(el("button", { class: "x", type: "button", "aria-label": "סגירה", text: "✕", onclick: close }),
      el("div", { class: "hd" }, [el("span", { class: "flag", text: flag(c.iso) }), el("div", null, [el("h2", { text: c.he }), el("div", { class: "sub", text: (CONT[c.cont] || "") + (S.stamps[c.iso] ? " · 🛂 ביקרת כאן" : "") })])]),
      el("div", { class: "facts" }, [el("div", null, ["עיר הבירה", el("b", { text: CAP[c.iso] || "—" })]), el("div", null, ["גודל", el("b", { text: size })]), el("div", null, ["מרחק מאיתנו", el("b", { text: c.iso === "IL" ? "🏠" : d.toLocaleString("he-IL") + " ק״מ" })])]),
      f ? el("div", { class: "fun", text: f[0] + " " + f[1] }) : null,
      c.iso !== "IL" ? el("div", { class: "row" }, [el("button", { class: "btn gold", type: "button", text: "✈️ לטוס לשם", onclick: function () { fly(c); } })]) : null);
    card.classList.add("open"); $("dock").classList.add("hide");
  }
  function close() { SEL = null; need = 1; $("card").classList.remove("open"); if (!Q) $("dock").classList.remove("hide"); }

  // ---------- flights: from home, along the shortest way round, then a stamp ----------
  function fly(c) {
    close(); $("dock").classList.add("hide");
    var d = km(c), hrs = d / 850 + 0.5;
    toast("✈️ טסים ל" + c.he + " · " + d.toLocaleString("he-IL") + " ק״מ · בערך " + (hrs < 1.5 ? "שעה" : Math.round(hrs) + " שעות") + " טיסה");
    goTo(HOME, 1.3, 900, function () { FLY = { c: c, i: G.geoInterpolate(HOME, c.at), t0: performance.now(), ms: RM ? 400 : Math.min(7000, 2600 + d / 2.2), trail: [HOME], at: HOME, next: HOME }; });
  }
  function flyStep(t) {
    if (FLY.done) return;
    var k = Math.min(1, (t - FLY.t0) / FLY.ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    FLY.at = FLY.i(e); FLY.next = FLY.i(Math.min(1, e + 0.02)); FLY.trail.push(FLY.at);
    var cam = FLY.i(Math.min(1, e * 1.05)); V.lon = -cam[0]; V.lat = -cam[1]; V.zoom = 1.3 + Math.sin(Math.PI * e) * -0.15; need = 1;
    if (k >= 1) { var c = FLY.c; FLY.done = true; setTimeout(function () { FLY = null; need = 1; stampIt(c); open(c, true); }, 300); }
  }
  function stampIt(c) {
    var first = !S.stamps[c.iso]; S.stamps[c.iso] = Date.now(); save();
    var col = ["#FF6B8B", "#3DDC97", "#FFD15C", "#7AB8FF", "#C58CFF"][hash(c.iso) & 3];
    var box = $("big"); box.replaceChildren(el("div", { class: "st", style: "--c:" + col }, [el("div", null, [el("span", { text: flag(c.iso) }), c.he, el("div", { style: "font-size:14px;font-family:Rubik", text: new Date().toLocaleDateString("he-IL") })])]));
    beep(first ? [72, 76, 79, 84] : [72, 79]); setTimeout(function () { box.replaceChildren(); }, 1800);
  }

  // ---------- the games ----------
  var Q = null;
  var POOL = Object.keys(FACT).filter(function (k) { return C[k] && k !== "IL" && k !== "AQ"; }).concat(["KZ", "DZ", "CD", "LY", "IR", "SD", "ID", "PK", "NG", "CO", "VE", "PL", "UA", "SY", "JO", "IQ", "PH", "VN", "MY", "AF", "TZ"].filter(function (k) { return C[k]; }));
  function pickN(list, n, not) { var a = list.filter(function (x) { return (not || []).indexOf(x) < 0; }), out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]); return out; }
  function startGame(kind) {
    close(); $("dock").classList.add("hide"); Q = { kind: kind, n: 0, ok: 0, total: 10, used: [] }; $("score").hidden = false; nextQ();
  }
  function endGame() {
    var Q0 = Q; Q = null; MARK = null; need = 1; $("quiz").hidden = true; $("score").hidden = true; $("dock").classList.remove("hide");
    var best = S.best[Q0.kind] || 0; if (Q0.ok > best) { S.best[Q0.kind] = Q0.ok; save(); }
    var stars = Q0.ok >= 9 ? "⭐⭐⭐" : Q0.ok >= 6 ? "⭐⭐" : Q0.ok >= 3 ? "⭐" : "💪";
    sheet(function () { return [el("h2", { text: stars + " " + Q0.ok + " מתוך " + Q0.total }), el("p", { class: "sub", text: Q0.ok > best ? "🏆 שיא חדש!" : "השיא שלך: " + best + " מתוך 10" }),
      el("div", { class: "row" }, [el("button", { class: "btn", type: "button", text: "🔁 עוד פעם", onclick: function () { closeSheet(); startGame(Q0.kind); } }), el("button", { class: "btn ghost", type: "button", text: "סיום", onclick: closeSheet })])]; });
    if (Q0.ok >= 6) confetti();
  }
  function nextQ() {
    if (!Q) return;
    if (Q.n >= Q.total) return endGame();
    Q.n++; Q.tries = 0; MARK = null; need = 1; $("score").textContent = "⭐ " + Q.ok + " · " + Q.n + "/" + Q.total;
    var iso = pickN(POOL, 1, Q.used)[0]; Q.used.push(iso); Q.c = C[iso];
    var box = $("quiz"); box.hidden = false;
    if (Q.kind === "where") {
      box.replaceChildren(el("div", { class: "fl", text: flag(iso) }), el("b", { text: "איפה " + Q.c.he + "?" }), el("small", { text: "מסובבים את הכדור ונוגעים בה" }));
      var r = pickN(Object.keys(C), 1, [iso])[0]; goTo(C[r].at, 1.05, 900);
    } else {
      var opts = pickN(POOL.concat(Object.keys(C)).filter(function (k, i, a) { return a.indexOf(k) === i && k !== "AQ"; }), 3, [iso]).concat([iso]).sort(function () { return Math.random() - 0.5; });
      var grid = el("div", { id: "quizOpts" }, opts.map(function (k) { return el("button", { type: "button", text: C[k].he, onclick: function (e) { flagAnswer(k, e.currentTarget, grid); } }); }));
      box.replaceChildren(el("div", { class: "fl", style: "font-size:72px", text: flag(iso) }), el("b", { text: "של איזו מדינה הדגל?" }), grid);
    }
  }
  function good() { Q.ok++; beep([76, 79, 84]); $("score").textContent = "⭐ " + Q.ok + " · " + Q.n + "/" + Q.total; if (navigator.vibrate) navigator.vibrate(30); }
  function flagAnswer(k, btn, grid) {
    if (Q.answered === Q.n) return; Q.answered = Q.n;
    var right = k === Q.c.iso; [].forEach.call(grid.children, function (b) { if (b.textContent === Q.c.he) b.classList.add("ok"); }); if (!right) { btn.classList.add("no"); beep([60, 55]); } else good();
    MARK = { c: Q.c, col: right ? "#3DDC97" : "#FFD15C", pulse: true }; goTo(Q.c.at, zoomFor(Q.c), 1000);
    setTimeout(nextQ, right ? 1700 : 2600);
  }
  function quizTap(c) {
    if (Q.kind !== "where" || !c || Q.answered === Q.n) return;
    if (c === Q.c) { Q.answered = Q.n; good(); MARK = { c: c, col: "#3DDC97", pulse: true }; need = 1; toast("🎉 נכון! זו " + c.he); setTimeout(nextQ, 1600); return; }
    Q.tries++; beep([60, 55]); MARK = { c: c, col: "#FF6B8B" }; need = 1;
    var miss = Math.round(G.geoDistance(c.at, Q.c.at) * 6371);
    if (Q.tries < 3) toast("זו " + c.he + " 🙂 " + (miss < 1500 ? "חם! ממש קרוב" : miss < 4000 ? "פושר… עוד קצת" : "קר! רחוק") + " · נסו שוב");
    else { Q.answered = Q.n; toast("הנה " + Q.c.he + "!"); MARK = { c: Q.c, col: "#FFD15C", pulse: true }; goTo(Q.c.at, zoomFor(Q.c), 1100); setTimeout(nextQ, 2800); }
  }
  $("dWhere").addEventListener("click", function () { startGame("where"); });
  $("dFlag").addEventListener("click", function () { startGame("flag"); });

  // ---------- sheets: search, flights, passport ----------
  function sheet(build) { var b = $("sheetBody"); b.replaceChildren.apply(b, build().filter(Boolean)); $("sheet").classList.add("open"); $("scrim").classList.add("on"); }
  function closeSheet() { $("sheet").classList.remove("open"); $("scrim").classList.remove("on"); }
  $("scrim").addEventListener("click", closeSheet);
  addEventListener("keydown", function (e) { if (e.key === "Escape") { closeSheet(); close(); if (Q) endGame(); } });
  function countryList(onpick, popular) {
    var q = el("input", { class: "search", type: "search", placeholder: "שם של מדינה…", "aria-label": "חיפוש מדינה" }), list = el("div", { class: "list" });
    var all = Object.values(C).filter(function (c) { return c.iso !== "IL"; }).sort(function (a, b) { return a.he.localeCompare(b.he, "he"); });
    var fill = function () { var t = q.value.trim(), arr = t ? all.filter(function (c) { return c.he.indexOf(t) >= 0 || (CAP[c.iso] || "").indexOf(t) >= 0; }) : (popular || all);
      list.replaceChildren.apply(list, arr.slice(0, 40).map(function (c) { return el("button", { type: "button", onclick: function () { closeSheet(); onpick(c); } }, [el("span", { text: flag(c.iso) }), c.he, el("small", { text: S.stamps[c.iso] ? "🛂" : CONT[c.cont] || "" })]); })); };
    q.addEventListener("input", fill); fill(); setTimeout(function () { q.focus(); }, 350);
    return [q, list];
  }
  $("find").addEventListener("click", function () { sheet(function () { return [el("h2", { text: "🔍 איזו מדינה?" })].concat(countryList(function (c) { open(c); })); }); });
  $("dFly").addEventListener("click", function () {
    var pop = ["US", "FR", "GB", "IT", "JP", "AU", "BR", "EG", "CN", "IN", "KE", "IS", "NZ", "AR", "CA", "GR", "TH", "NO"].map(function (k) { return C[k]; });
    sheet(function () { return [el("h2", { text: "✈️ לאן טסים?" }), el("p", { class: "sub", text: "ממריאים מישראל, ובסוף מקבלים חותמת בדרכון" })].concat(countryList(fly, pop)); });
  });
  $("dPass").addEventListener("click", function () {
    var list = Object.keys(S.stamps).filter(function (k) { return C[k]; }).sort(function (a, b) { return S.stamps[b] - S.stamps[a]; }), by = {};
    list.forEach(function (k) { var ct = C[k].cont; by[ct] = (by[ct] || 0) + 1; });
    sheet(function () { return [el("h2", { text: "🛂 הדרכון שלי" }), el("p", { class: "sub", text: list.length ? "ביקרת ב־" + list.length + " מדינות" + (Object.keys(by).length > 1 ? ", ב־" + Object.keys(by).length + " יבשות" : "") : "עוד אין חותמות. טסים למדינה ומקבלים חותמת!" }),
      list.length ? el("div", { class: "conts" }, Object.keys(by).map(function (k) { return el("span", { text: CONT[k] + " " + by[k] }); })) : null,
      el("div", { class: "stamps" }, list.map(function (k, i) { return el("button", { class: "stamp", type: "button", style: "--c:" + ["#FF6B8B", "#3DDC97", "#FFD15C", "#7AB8FF", "#C58CFF"][hash(k) & 3] + ";--r:" + ((hash(k) % 17) - 8) + "deg;cursor:pointer", onclick: function () { closeSheet(); open(C[k]); } }, [el("span", { text: flag(k) }), C[k].he]); })),
      S.best.where || S.best.flag ? el("p", { class: "sub", style: "margin-top:14px", text: "🏆 שיאים: איפה זה? " + (S.best.where || 0) + "/10 · דגלים " + (S.best.flag || 0) + "/10" }) : null,
      el("p", { class: "sub", style: "margin-top:14px;font-size:12.5px", text: "המפה: Natural Earth (נחלת הכלל) דרך world-atlas. הכדור מצויר עם d3-geo. היום והלילה על הכדור מחושבים לפי השעה עכשיו." })]; });
  });
  $("home").addEventListener("click", function () { close(); goTo(HOME, 1.6, 1200, function () { open(ISR, true); }); });

  // ---------- small joys ----------
  var AC = null;
  function beep(notes) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); var t = AC.currentTime; notes.forEach(function (m, i) { var o = AC.createOscillator(), gn = AC.createGain(); o.type = "triangle"; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12); gn.gain.setValueAtTime(0.0001, t + i * 0.09); gn.gain.linearRampToValueAtTime(0.1, t + i * 0.09 + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.4); o.connect(gn); gn.connect(AC.destination); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.45); }); } catch (e) {} }
  function confetti() {
    var c = el("canvas", { style: "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:40" }), w = c.width = W, h = c.height = H, x = c.getContext("2d"), P = [];
    document.body.append(c); for (var i = 0; i < 130; i++) P.push({ x: w / 2, y: h / 2, vx: (Math.random() - 0.5) * 14, vy: -5 - Math.random() * 10, r: 4 + Math.random() * 5, a: Math.random() * 6, c: ["#FFD15C", "#FF6B8B", "#3DDC97", "#7AB8FF", "#fff"][i % 5] });
    var t0 = performance.now(); (function f(t) { var k = (t - t0) / 2800; x.clearRect(0, 0, w, h); P.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.a += 0.1; x.save(); x.globalAlpha = Math.max(0, 1 - k); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8); x.restore(); }); if (k < 1) requestAnimationFrame(f); else c.remove(); })(t0);
  }
  function sunLine() {
    var sp = sunPoint(new Date()), under = null; for (var i = 0; i < feats.length; i++) if (feats[i].c && G.geoContains(feats[i], sp)) { under = feats[i].c; break; }
    var night = G.geoDistance(sp, HOME) > Math.PI / 2;
    $("sun").textContent = (night ? "🌙 עכשיו לילה אצלנו" : "☀️ עכשיו יום אצלנו") + " · " + (under ? "השמש בדיוק מעל " + under.he : "השמש מעל האוקיינוס");
  }

  // ---------- start ----------
  resize(); sunLine(); setInterval(function () { sunLine(); need = 1; }, 60000);
  requestAnimationFrame(loop);
  setTimeout(function () { var s = $("splash"); s.style.opacity = "0"; setTimeout(function () { s.remove(); }, 1000); goTo(HOME, 1.05, 2200); }, 500);
  if (navigator.webdriver) window.__G = { open: open, C: C, fly: fly, V: V };
  if ("serviceWorker" in navigator) addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
})();
