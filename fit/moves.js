// HaniaFit's exercise library and the moving figure that shows each one. Inlined into the page by fit/build.py.
// A pose is a side view, facing right: the hip point, the torso's angle (0 = upright, 90 = leaning forward flat),
// and for each arm and leg either two absolute angles (0 = pointing down, 90 = forward, 180 = up) or a point the
// hand or foot reaches (the elbow or knee is then worked out, bending the way "ep"/"kp" points).
// Frames play back and forth (or in order, for "seq"), so every demo is a short, smooth loop.
var FIT_L = { t: 26, ua: 15, fa: 14, th: 21, sh: 20, hd: 6.5 };
var FIT_GROUND = 94;
function fitRad(a) { return a * Math.PI / 180; }
function fitIK(S, T, a, b, pref) {
  var dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy);
  d = Math.max(Math.abs(a - b) + 0.01, Math.min(a + b - 0.01, d));
  var ph = Math.atan2(dy, dx), al = Math.acos((a * a + d * d - b * b) / (2 * a * d));
  var c1 = [S[0] + a * Math.cos(ph + al), S[1] + a * Math.sin(ph + al)], c2 = [S[0] + a * Math.cos(ph - al), S[1] + a * Math.sin(ph - al)];
  var m = [(S[0] + T[0]) / 2, (S[1] + T[1]) / 2];
  var E = (c1[0] - m[0]) * pref[0] + (c1[1] - m[1]) * pref[1] >= (c2[0] - m[0]) * pref[0] + (c2[1] - m[1]) * pref[1] ? c1 : c2;
  var ex = T[0] - E[0], ey = T[1] - E[1], e = Math.hypot(ex, ey) || 1;
  return [E, [E[0] + ex / e * b, E[1] + ey / e * b]];
}
function fitLimb(S, spec, a, b, pref) {
  if (spec && spec.p) return fitIK(S, spec.p, a, b, pref);
  var s = spec || [0, 0], E = [S[0] + a * Math.sin(fitRad(s[0])), S[1] + a * Math.cos(fitRad(s[0]))];
  return [E, [E[0] + b * Math.sin(fitRad(s[1])), E[1] + b * Math.cos(fitRad(s[1]))]];
}
function fitPose(f) {
  var L = FIT_L, H = f.h, d = [Math.sin(fitRad(f.t)), -Math.cos(fitRad(f.t))];
  var N = [H[0] + L.t * d[0], H[1] + L.t * d[1]], hd = [N[0] + (L.hd + 1.8) * d[0], N[1] + (L.hd + 1.8) * d[1]];
  var ep = f.ep || [-1, 0.6], kp = f.kp || [1, -0.3];
  var arm = fitLimb(N, f.A, L.ua, L.fa, ep), arm2 = fitLimb(N, f.A2 || f.A, L.ua, L.fa, f.ep2 || ep);
  var leg = fitLimb(H, f.G, L.th, L.sh, kp), leg2 = fitLimb(H, f.G2 || f.G, L.th, L.sh, f.kp2 || kp);
  var toe = function (lg) { var k = lg[0], a = lg[1], dx = a[0] - k[0], dy = a[1] - k[1], n = Math.hypot(dx, dy) || 1; return f.tip && a[1] < FIT_GROUND - 1 ? [a[0] + 5, FIT_GROUND] : [a[0] + 5.5 * dy / n, a[1] - 5.5 * dx / n]; };
  return { H: H, N: N, hd: hd, e: arm[0], w: arm[1], e2: arm2[0], w2: arm2[1], k: leg[0], a: leg[1], k2: leg2[0], a2: leg2[1], o: toe(leg), o2: toe(leg2) };
}
function fitMix(a, b, x) {
  if (typeof a === "number") return a + (b - a) * x;
  if (Array.isArray(a)) return a.map(function (v, i) { return fitMix(v, b[i], x); });
  if (a && typeof a === "object") { var o = {}; for (var k in a) o[k] = k in b ? fitMix(a[k], b[k], x) : a[k]; return o; }
  return x < 0.5 ? a : b;
}
// The equipment drawn around the figure
function fitGear(ex, P) {
  var g = "", st = 'stroke="#7C8496"', eq = ex.draw || "";
  var bell = function (w, far) { return '<g opacity="' + (far ? .45 : 1) + '"><line x1="' + (w[0] - 4) + '" y1="' + w[1] + '" x2="' + (w[0] + 4) + '" y2="' + w[1] + '" stroke="#3B4256" stroke-width="2.4"/><rect x="' + (w[0] - 6.5) + '" y="' + (w[1] - 4) + '" width="3.4" height="8" rx="1" fill="#3B4256"/><rect x="' + (w[0] + 3.1) + '" y="' + (w[1] - 4) + '" width="3.4" height="8" rx="1" fill="#3B4256"/></g>'; };
  if (/db/.test(eq)) g += bell(P.w2, 1) + bell(P.w);
  if (/bb/.test(eq)) g += '<circle cx="' + P.w[0] + '" cy="' + P.w[1] + '" r="8.5" fill="none" stroke="#3B4256" stroke-width="3"/><circle cx="' + P.w[0] + '" cy="' + P.w[1] + '" r="2" fill="#3B4256"/>';
  return g;
}
function fitScene(ex) {
  var s = "", eq = ex.draw || "";
  if (/bench/.test(eq)) s += '<rect x="22" y="' + (ex.benchY || 74) + '" width="56" height="5" rx="2" fill="#B8BED0"/><line x1="30" y1="' + (ex.benchY || 74) + '" x2="30" y2="94" stroke="#B8BED0" stroke-width="3"/><line x1="70" y1="' + (ex.benchY || 74) + '" x2="70" y2="94" stroke="#B8BED0" stroke-width="3"/>';
  if (/pullbar/.test(eq)) s += '<line x1="30" y1="8" x2="96" y2="8" stroke="#7C8496" stroke-width="3" stroke-linecap="round"/>';
  if (/box/.test(eq)) { var b = ex.box || [66, 78, 26, 16]; s += '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '" rx="2" fill="#C9CFDD"/>'; }
  if (/wall/.test(eq)) s += '<rect x="30" y="4" width="5" height="90" fill="#C9CFDD"/>';
  if (/seat/.test(eq)) s += '<rect x="40" y="70" width="24" height="5" rx="2" fill="#B8BED0"/><line x1="52" y1="75" x2="52" y2="94" stroke="#B8BED0" stroke-width="3"/>';
  return s;
}
function fitSVG(ex, P) {
  var ln = function (a, b, w, o) { return '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke-width="' + w + '"' + (o ? ' opacity="' + o + '"' : "") + '/>'; };
  var cable = /cable/.test(ex.draw || "") ? '<line x1="' + P.w[0].toFixed(1) + '" y1="' + P.w[1].toFixed(1) + '" x2="' + P.w[0].toFixed(1) + '" y2="0" stroke="#9AA2B5" stroke-width="1.2"/><line x1="' + (P.w[0] - 7).toFixed(1) + '" y1="' + P.w[1].toFixed(1) + '" x2="' + (P.w[0] + 7).toFixed(1) + '" y2="' + P.w[1].toFixed(1) + '" stroke="#3B4256" stroke-width="2.4"/>' : "";
  var far = '<g stroke="var(--fig2,#9AA0B8)">' + ln(P.H, P.k2, 5.2) + ln(P.k2, P.a2, 4.6) + ln(P.a2, P.o2, 3.6) + ln(P.N, P.e2, 4.4) + ln(P.e2, P.w2, 4) + '</g>';
  var near = '<g stroke="var(--fig,#2A2F45)">' + ln(P.H, P.N, 7.5) + ln(P.H, P.k, 5.6) + ln(P.k, P.a, 5) + ln(P.a, P.o, 3.8) + ln(P.N, P.e, 4.8) + ln(P.e, P.w, 4.2) + '</g>';
  return '<line x1="2" y1="' + (FIT_GROUND + 2.6) + '" x2="118" y2="' + (FIT_GROUND + 2.6) + '" stroke="#D5D9E5" stroke-width="2"/>' + fitScene(ex) + cable +
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' + far + near + '</g>' + fitGear(ex, P) +
    '<circle cx="' + P.hd[0].toFixed(1) + '" cy="' + P.hd[1].toFixed(1) + '" r="' + FIT_L.hd + '" fill="var(--fig,#2A2F45)"/>';
}
// A live figure: an <svg> that loops the move while it is on screen.
var FIT_LIVE = [];
function fitFigure(ex, still) {
  var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 120 100"); s.setAttribute("class", "fig"); s.setAttribute("role", "img"); s.setAttribute("aria-label", "הדגמה: " + ex.n);
  var F = ex.f, x = still ? F[F.length > 2 ? 1 : 1] : F[0];
  s.innerHTML = fitSVG(ex, fitPose(x));
  if (!still) FIT_LIVE.push({ s: s, ex: ex, t0: performance.now() });
  return s;
}
(function loop() {
  var now = performance.now(), red = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  FIT_LIVE = FIT_LIVE.filter(function (o) { return o.s.isConnected || now - o.t0 < 1000; });
  FIT_LIVE.forEach(function (o) {
    if (!o.s.isConnected) return;
    var F = o.ex.f, per = (o.ex.ms || 1500) * (red ? 2.5 : 1), n = F.length, ph, i, j;
    if (o.ex.seq) { var tt = ((now - o.t0) / per) % n; i = Math.floor(tt); j = (i + 1) % n; ph = tt - i; }
    else { var c = ((now - o.t0) / per) % 2, u = c < 1 ? c : 2 - c, seg = u * (n - 1); i = Math.min(n - 2, Math.floor(seg)); j = i + 1; ph = seg - i; }
    var e = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, (ph - 0.12) / 0.76)));
    o.s.innerHTML = fitSVG(o.ex, fitPose(fitMix(F[i], F[j], e)));
  });
  requestAnimationFrame(loop);
})();

// ---- the library ----
// eq: b = body weight only, d = dumbbells, g = gym (machines, barbell, pull-up bar)
// slot: what the move does in a plan; mus: the muscles it works (for "focus" and the library);
// lv: 1 easy … 3 hard; no: what it is not for (k knees, b lower back, s shoulders, w wrists); t: seconds instead of reps
var STAND = { h: [60, 53], t: 0, A: [4, 6], G: { p: [60, 94] } };
var FIT_EX = [
  { id: "squat", n: "סקוואט", eq: "b", slot: "squat", mus: ["legs", "glutes"], lv: 1, no: "", ms: 1400,
    cues: ["כפות רגליים ברוחב הכתפיים", "יורדים כאילו מתיישבים על כיסא, הברכיים בכיוון האצבעות", "עקבים על הרצפה, גב ישר"],
    f: [{ h: [60, 53], t: 3, A: [10, 10], G: { p: [60, 94] } }, { h: [45, 72], t: 38, A: [92, 92], G: { p: [60, 94] } }] },
  { id: "goblet", n: "סקוואט גביע עם משקולת", eq: "d", slot: "squat", mus: ["legs", "glutes"], lv: 1, no: "", draw: "db", ms: 1500,
    cues: ["מחזיקים משקולת אחת צמוד לחזה", "יורדים עמוק ככל שנוח, מרפקים בין הברכיים", "דוחפים את הרצפה כדי לעלות"],
    f: [{ h: [60, 53], t: 3, A: [25, 168], G: { p: [60, 94] } }, { h: [45, 72], t: 30, A: [50, 190], G: { p: [60, 94] } }] },
  { id: "bsquat", n: "סקוואט עם מוט", eq: "g", slot: "squat", mus: ["legs", "glutes"], lv: 2, no: "kb", draw: "bb", ms: 1700,
    cues: ["המוט על השרירים שמאחורי הכתפיים, לא על הצוואר", "חזה למעלה, יורדים עד שהירכיים מקבילות לרצפה", "מתחילים במשקל קל ומוסיפים בהדרגה"],
    f: [{ h: [60, 53], t: 3, A: [-40, 190], G: { p: [60, 94] } }, { h: [45, 72], t: 35, A: [-5, 215], G: { p: [60, 94] } }] },
  { id: "lunge", n: "מכרע (לאנג׳)", eq: "b", slot: "lunge", mus: ["legs", "glutes"], lv: 1, no: "k", ms: 1500, side: 1,
    cues: ["צעד גדול קדימה, יורדים עד שהברך האחורית כמעט נוגעת", "הגב זקוף, הברך הקדמית מעל הקרסול", "מחליפים רגל בכל חזרה או בכל סט"],
    f: [{ h: [60, 53], t: 0, A: [-25, 25], G: { p: [62, 94] }, G2: { p: [58, 94] } }, { h: [58, 70], t: 0, A: [-25, 25], G: { p: [80, 94] }, G2: { p: [34, 92] }, kp2: [0, 1], tip: 1 }] },
  { id: "stepup", n: "עלייה על כיסא או מדרגה", eq: "b", slot: "lunge", mus: ["legs", "glutes"], lv: 1, no: "", draw: "box", box: [66, 84, 30, 10], ms: 1600, side: 1,
    cues: ["כיסא יציב או מדרגה", "דוחפים עם העקב של הרגל שלמעלה", "יורדים לאט, באותה רגל"],
    f: [{ h: [58, 54], t: 2, A: [10, 10], G: { p: [76, 84] }, G2: { p: [56, 94] } }, { h: [74, 44], t: 0, A: [5, 5], G: { p: [76, 84] }, G2: { p: [70, 78] }, kp2: [1, 0] }] },
  { id: "wallsit", n: "ישיבה על קיר", eq: "b", slot: "squat", mus: ["legs"], lv: 1, no: "", draw: "wall", t: 30, ms: 2600,
    cues: ["גב צמוד לקיר, ירכיים מקבילות לרצפה", "ברכיים מעל הקרסוליים", "נושמים רגוע ומחזיקים"],
    f: [{ h: [38, 73], t: 0, A: [0, 0], G: { p: [60, 94] } }, { h: [38, 72], t: 0, A: [4, 4], G: { p: [60, 94] } }] },
  { id: "bridge", n: "גשר ישבן", eq: "b", slot: "glute", mus: ["glutes", "legs", "core"], lv: 1, no: "", ms: 1400,
    cues: ["שוכבים על הגב, ברכיים כפופות", "מרימים את האגן עד קו ישר מהכתפיים לברכיים", "מכווצים את הישבן למעלה שנייה"],
    f: [{ h: [64, 90], t: -95, A: { p: [60, 94] }, ep: [0, 1], G: { p: [86, 94] }, kp: [0, -1] }, { h: [64, 75], t: -112, A: { p: [58, 94] }, ep: [0, 1], G: { p: [86, 94] }, kp: [0, -1] }] },
  { id: "donkey", n: "בעיטת חמור", eq: "b", slot: "glute", mus: ["glutes"], lv: 1, no: "w", ms: 1300, side: 1,
    cues: ["על הידיים והברכיים, גב ישר", "בועטים עם העקב לכיוון התקרה", "לא מקמרים את הגב התחתון"],
    f: [{ h: [48, 72], t: 90, A: { p: [74, 94] }, G: [0, -90], G2: [0, -90] }, { h: [48, 72], t: 90, A: { p: [74, 94] }, G: [-110, -10], G2: [0, -90] }] },
  { id: "rdl", n: "דדליפט רומני עם משקולות", eq: "d", slot: "hinge", mus: ["legs", "glutes", "back"], lv: 2, no: "b", draw: "db", ms: 1700,
    cues: ["ברכיים מעט כפופות לאורך כל התנועה", "דוחפים את האגן אחורה, המשקולות צמודות לרגליים", "גב ישר, עוצרים כשמרגישים מתיחה מאחורי הירך"],
    f: [{ h: [60, 53], t: 2, A: [3, 3], G: { p: [60, 94] } }, { h: [46, 58], t: 80, A: [0, 0], G: { p: [60, 94] } }] },
  { id: "deadlift", n: "דדליפט עם מוט", eq: "g", slot: "hinge", mus: ["back", "legs", "glutes"], lv: 3, no: "b", draw: "bb", ms: 1800,
    cues: ["המוט צמוד לשוקיים, גב ישר מההתחלה", "דוחפים את הרצפה ועומדים זקוף", "מתחילים קל מאוד. אם הגב מתעגל, מורידים משקל"],
    f: [{ h: [60, 53], t: 2, A: [0, 0], G: { p: [60, 94] } }, { h: [44, 68], t: 62, A: { p: [66, 87] }, G: { p: [60, 94] } }] },
  { id: "calf", n: "עלייה על בהונות", eq: "b", slot: "calf", mus: ["legs"], lv: 1, no: "", ms: 1100,
    cues: ["עולים לאט עד הסוף על הבהונות", "מחזיקים שנייה למעלה", "יורדים לאט"],
    f: [{ h: [60, 53], t: 0, A: [3, 3], G: { p: [60, 94] } }, { h: [60, 47], t: 0, A: [3, 3], G: { p: [60, 88] }, tip: 1 }] },
  { id: "pushup", n: "שכיבת סמיכה", eq: "b", slot: "push_h", mus: ["chest", "arms", "shoulders"], lv: 2, no: "sw", ms: 1400,
    cues: ["גוף ישר כמו קרש מהראש עד העקבים", "ידיים מעט רחבות מהכתפיים", "יורדים עד שהחזה קרוב לרצפה"],
    f: [{ h: [61, 76], t: 64, A: { p: [86, 94] }, ep: [-1, -1], G: { p: [24, 94] } }, { h: [64, 87], t: 82, A: { p: [86, 94] }, ep: [-1, -1], G: { p: [24, 94] } }] },
  { id: "kpush", n: "שכיבת סמיכה על הברכיים", eq: "b", slot: "push_h", mus: ["chest", "arms"], lv: 1, no: "w", ms: 1400,
    cues: ["ברכיים על הרצפה, גוף ישר מהברכיים לראש", "יורדים לאט עם החזה", "הכנה מצוינת לשכיבת סמיכה מלאה"],
    f: [{ h: [57, 81], t: 58, A: { p: [80, 94] }, ep: [-1, -1], G: [-55, -140] }, { h: [60, 89], t: 80, A: { p: [80, 94] }, ep: [-1, -1], G: [-78, -150] }] },
  { id: "floorpress", n: "לחיצת חזה על הרצפה", eq: "d", slot: "push_h", mus: ["chest", "arms"], lv: 1, no: "", draw: "db", ms: 1400,
    cues: ["שוכבים על הגב, ברכיים כפופות", "דוחפים את המשקולות למעלה מעל החזה", "מורידים לאט עד שהמרפקים נוגעים ברצפה"],
    f: [{ h: [66, 90], t: -90, A: { p: [41, 82] }, ep: [0, 1], G: { p: [88, 94] }, kp: [0, -1] }, { h: [66, 90], t: -90, A: { p: [41, 63] }, ep: [0, 1], G: { p: [88, 94] }, kp: [0, -1] }] },
  { id: "bench", n: "לחיצת חזה על ספסל", eq: "g", slot: "push_h", mus: ["chest", "arms", "shoulders"], lv: 2, no: "s", draw: "bench bb", benchY: 74, ms: 1600,
    cues: ["עיניים מתחת למוט, כפות רגליים על הרצפה", "מורידים את המוט לאמצע החזה", "דוחפים למעלה בקו ישר"],
    f: [{ h: [64, 70], t: -90, A: { p: [40, 43] }, ep: [0, 1], G: { p: [84, 94] }, kp: [1, -1] }, { h: [64, 70], t: -90, A: { p: [40, 62] }, ep: [0, 1], G: { p: [84, 94] }, kp: [1, -1] }] },
  { id: "press", n: "לחיצת כתפיים עם משקולות", eq: "d", slot: "push_v", mus: ["shoulders", "arms"], lv: 1, no: "s", draw: "db", ms: 1500,
    cues: ["משקולות בגובה הכתפיים", "דוחפים ישר למעלה עד שהידיים כמעט ישרות", "בטן אסופה, לא מקמרים את הגב"],
    f: [{ h: [60, 53], t: 0, A: { p: [66, 26] }, ep: [1, 1], G: { p: [60, 94] } }, { h: [60, 53], t: 0, A: [178, 180], G: { p: [60, 94] } }] },
  { id: "raise", n: "הרמת ידיים קדימה", eq: "d", slot: "push_v", mus: ["shoulders"], lv: 1, no: "", draw: "db", ms: 1500,
    cues: ["משקולות קלות", "מרימים עד גובה הכתפיים, ידיים כמעט ישרות", "מורידים לאט, בלי לנדנד את הגוף"],
    f: [{ h: [60, 53], t: 0, A: [8, 8], G: { p: [60, 94] } }, { h: [60, 53], t: 0, A: [88, 92], G: { p: [60, 94] } }] },
  { id: "pike", n: "שכיבת סמיכה בפייק (לכתפיים)", eq: "b", slot: "push_v", mus: ["shoulders", "arms"], lv: 3, no: "sw", ms: 1500,
    cues: ["אגן גבוה, הגוף בצורת V הפוכה", "מורידים את הראש בין הידיים", "דוחפים חזרה למעלה"],
    f: [{ h: [50, 55], t: 140, A: { p: [80, 94] }, G: { p: [30, 94] } }, { h: [52, 57], t: 152, A: { p: [80, 94] }, ep: [-1, -0.3], G: { p: [30, 94] } }] },
  { id: "row", n: "חתירה עם משקולת", eq: "d", slot: "pull_h", mus: ["back", "arms"], lv: 1, no: "b", draw: "db", ms: 1400,
    cues: ["רכינה קדימה, גב ישר, ברכיים מעט כפופות", "מושכים את המשקולות לכיוון המותניים", "מקרבים את השכמות בסוף"],
    f: [{ h: [48, 60], t: 72, A: [0, 0], G: { p: [60, 94] } }, { h: [48, 60], t: 72, A: { p: [60, 58] }, ep: [-1, -1], G: { p: [60, 94] } }] },
  { id: "bbrow", n: "חתירה עם מוט", eq: "g", slot: "pull_h", mus: ["back", "arms"], lv: 2, no: "b", draw: "bb", ms: 1500,
    cues: ["רכינה של 45 מעלות, גב ישר", "מושכים את המוט לבטן", "יורדים לאט"],
    f: [{ h: [48, 60], t: 62, A: [5, 5], G: { p: [60, 94] } }, { h: [48, 60], t: 62, A: { p: [62, 60] }, ep: [-1, -1], G: { p: [60, 94] } }] },
  { id: "pullup", n: "מתח", eq: "g", slot: "pull_v", mus: ["back", "arms"], lv: 3, no: "s", draw: "pullbar", ms: 1700,
    cues: ["אחיזה מעט רחבה מהכתפיים", "מושכים עד שהסנטר מעל המוט", "קשה? מתחילים בתלייה או עם גומייה"],
    f: [{ h: [62, 66], t: -2, A: { p: [62, 10] }, ep: [1, 0], G: [5, -25] }, { h: [62, 44], t: -4, A: { p: [62, 10] }, ep: [1, 0.6], G: [10, -30] }] },
  { id: "pulldown", n: "פולי עליון", eq: "g", slot: "pull_v", mus: ["back", "arms"], lv: 1, no: "", draw: "seat cable", ms: 1500,
    cues: ["יושבים, ירכיים מתחת לרפידה", "מושכים את המוט עד החזה העליון", "חוזרים לאט עד שהידיים ישרות"],
    f: [{ h: [50, 70], t: -8, A: { p: [52, 15] }, ep: [1, 0], G: [88, 2] }, { h: [50, 70], t: -14, A: { p: [52, 42] }, ep: [0, 1], G: [88, 2] }] },
  { id: "superman", n: "סופרמן", eq: "b", slot: "pull_h", mus: ["back", "glutes"], lv: 1, no: "", ms: 1700,
    cues: ["שוכבים על הבטן, ידיים קדימה", "מרימים יחד ידיים, חזה ורגליים", "מחזיקים 2 שניות למעלה"],
    f: [{ h: [52, 90], t: 90, A: [90, 90], G: [-90, -90] }, { h: [52, 91], t: 82, A: [106, 106], G: [-98, -98] }] },
  { id: "curl", n: "כפיפת מרפקים (יד קדמית)", eq: "d", slot: "arms_bi", mus: ["arms"], lv: 1, no: "", draw: "db", ms: 1300,
    cues: ["מרפקים צמודים לגוף ולא זזים", "מכופפים עד הכתפיים", "יורדים לאט, בלי לנדנד"],
    f: [{ h: [60, 53], t: 0, A: [2, 4], G: { p: [60, 94] } }, { h: [60, 53], t: 0, A: [4, 160], G: { p: [60, 94] } }] },
  { id: "ohext", n: "פשיטת מרפק מעל הראש", eq: "d", slot: "arms_tri", mus: ["arms"], lv: 1, no: "s", draw: "db", ms: 1400,
    cues: ["מחזיקים משקולת אחת בשתי הידיים מעל הראש", "מורידים מאחורי הראש, מרפקים קדימה", "פושטים את הידיים למעלה"],
    f: [{ h: [60, 53], t: 0, A: [172, 178], G: { p: [60, 94] } }, { h: [60, 53], t: 0, A: [168, 20], G: { p: [60, 94] } }] },
  { id: "dips", n: "מקבילים על כיסא", eq: "b", slot: "arms_tri", mus: ["arms", "chest"], lv: 2, no: "sw", draw: "box", box: [30, 70, 24, 24], ms: 1400,
    cues: ["ידיים על קצה כיסא יציב מאחוריכם", "יורדים עד זווית ישרה במרפקים", "דוחפים חזרה למעלה"],
    f: [{ h: [58, 66], t: -6, A: { p: [50, 70] }, ep: [-1, 0], G: { p: [86, 94] } }, { h: [56, 80], t: -6, A: { p: [50, 70] }, ep: [-1, -0.5], G: { p: [86, 94] } }] },
  { id: "plank", n: "פלאנק", eq: "b", slot: "core", mus: ["core"], lv: 1, no: "", t: 30, ms: 2600,
    cues: ["על האמות, מרפקים מתחת לכתפיים", "גוף ישר, בטן וישבן מכווצים", "לא להוריד ולא להרים את האגן"],
    f: [{ h: [60, 80], t: 77, A: [0, 90], G: { p: [20, 94] } }, { h: [60, 79.5], t: 77, A: [0, 90], G: { p: [20, 94] } }] },
  { id: "crunch", n: "כפיפות בטן", eq: "b", slot: "core", mus: ["core"], lv: 1, no: "", ms: 1300,
    cues: ["שוכבים על הגב, ברכיים כפופות", "מרימים את הכתפיים מהרצפה, הסנטר רחוק מהחזה", "יורדים לאט"],
    f: [{ h: [64, 90], t: -92, A: [-120, -90], G: { p: [86, 94] }, kp: [0, -1] }, { h: [64, 90], t: -60, A: [-100, -60], G: { p: [86, 94] }, kp: [0, -1] }] },
  { id: "legraise", n: "הרמת רגליים בשכיבה", eq: "b", slot: "core", mus: ["core"], lv: 2, no: "b", ms: 1600,
    cues: ["שוכבים על הגב, ידיים לצד הגוף", "מרימים רגליים ישרות עד 90 מעלות", "יורדים לאט בלי לגעת ברצפה"],
    f: [{ h: [58, 91], t: -90, A: [90, 90], G: [80, 84] }, { h: [58, 91], t: -90, A: [90, 90], G: [178, 178] }] },
  { id: "birddog", n: "ציפור־כלב", eq: "b", slot: "core", mus: ["core", "back"], lv: 1, no: "w", ms: 1700, side: 1,
    cues: ["על הידיים והברכיים", "מושיטים יד אחת קדימה ורגל נגדית אחורה", "גב ישר, תנועה איטית"],
    f: [{ h: [48, 72], t: 90, A: { p: [74, 94] }, A2: { p: [74, 94] }, G: [0, -90] }, { h: [48, 72], t: 90, A: [168, 170], A2: { p: [74, 94] }, G: [-88, -90], G2: [0, -90] }] },
  { id: "climber", n: "מטפס הרים", eq: "b", slot: "cardio", mus: ["core", "cardio"], lv: 2, no: "w", ms: 520, side: 1,
    cues: ["עמידת שכיבת סמיכה", "מביאים ברך לחזה ומחליפים מהר", "אגן נמוך ויציב"],
    f: [{ h: [58, 75], t: 66, A: { p: [84, 94] }, G: { p: [32, 92] }, G2: [32, 160], kp2: [1, 0], tip: 1 }, { h: [58, 75], t: 66, A: { p: [84, 94] }, G: [32, 160], G2: { p: [32, 92] }, tip: 1 }] },
  { id: "knees", n: "ברכיים גבוהות במקום", eq: "b", slot: "cardio", mus: ["cardio", "legs"], lv: 1, no: "", t: 30, ms: 420,
    cues: ["רצים במקום ומרימים ברכיים לגובה המותניים", "ידיים עובדות", "רך על הבהונות"],
    f: [{ h: [60, 52], t: 0, A: [-35, 60], A2: [35, 110], G: [92, 0], G2: { p: [60, 93] }, tip: 1 }, { h: [60, 52], t: 0, A: [35, 110], A2: [-35, 60], G: { p: [60, 93] }, G2: [92, 0], tip: 1 }] },
  { id: "jumpsq", n: "סקוואט קפיצה", eq: "b", slot: "cardio", mus: ["legs", "cardio"], lv: 2, no: "k", ms: 700,
    cues: ["יורדים לסקוואט", "קופצים בכוח למעלה", "נוחתים רך ויורדים ישר לסקוואט הבא"],
    f: [{ h: [46, 71], t: 36, A: [-30, -30], G: { p: [60, 94] } }, { h: [60, 44], t: 0, A: [170, 175], G: { p: [62, 86] }, tip: 0 }] },
  { id: "burpee", n: "בורפי", eq: "b", slot: "cardio", mus: ["cardio", "chest", "legs"], lv: 3, no: "kw", ms: 650, seq: 1,
    cues: ["יורדים לכריעה, ידיים לרצפה", "קופצים אחורה לשכיבת סמיכה וחוזרים", "קופצים למעלה עם ידיים מעל הראש"],
    f: [{ h: [60, 53], t: 0, A: [175, 178], G: { p: [60, 94] } }, { h: [50, 74], t: 70, A: { p: [76, 94] }, G: { p: [58, 94] } }, { h: [56, 76], t: 66, A: { p: [80, 94] }, G: { p: [22, 94] } }, { h: [50, 74], t: 70, A: { p: [76, 94] }, G: { p: [58, 94] } }] },
];
// Frames may give a limb as angles in one frame and as a target point in another. So they can be mixed, each limb
// takes one form in all frames: where any frame uses a point, the others become the point their angles reach,
// bending the same way they did.
function fitNorm(ex) {
  ex.f.forEach(function (f) { if (!f.A2) f.A2 = f.A; if (!f.G2) f.G2 = f.G; f.ep = f.ep || [-1, 0.6]; f.kp = f.kp || [1, -0.3]; if (!f.ep2) f.ep2 = f.ep; if (!f.kp2) f.kp2 = f.kp; f.tip = f.tip ? 1 : 0; });
  [["A", "ep", "e", "w", "N", "N"], ["A2", "ep2", "e2", "w2", "N", "N"], ["G", "kp", "k", "a", "H", "H"], ["G2", "kp2", "k2", "a2", "H", "H"]].forEach(function (L) {
    if (!ex.f.some(function (f) { return f[L[0]] && f[L[0]].p; })) return;
    ex.f.forEach(function (f) {
      if (f[L[0]] && f[L[0]].p) return;
      var P = fitPose(f), S = P[L[4]], E = P[L[2]], W = P[L[3]], m = [(S[0] + W[0]) / 2, (S[1] + W[1]) / 2];
      f[L[0]] = { p: [W[0], W[1]] }; f[L[1]] = [E[0] - m[0], E[1] - m[1]];
    });
  });
}
FIT_EX.forEach(fitNorm);
var FIT_BY = {}; FIT_EX.forEach(function (e) { FIT_BY[e.id] = e; });
