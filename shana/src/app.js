// "השנה שלנו" (hania360.com/shana): the story player. Inlined into shana.html by shana/build.py.
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function el(t, a, kids) { var e = document.createElement(t); for (var k in a || {}) { if (k === "text") e.textContent = a[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), a[k]); else if (a[k] != null) e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c != null) e.append(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var YEAR = (function () { var d = new Date(); return d.getMonth() < 2 ? d.getFullYear() - 1 : d.getFullYear(); })();
  $("yr").textContent = String(YEAR);
  function fmt(n) { return Math.round(n).toLocaleString("he-IL"); }
  function day(d) { try { return new Date(d + "T12:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "long" }); } catch (e) { return d; } }
  function times(n) { return n === 1 ? "פעם אחת" : fmt(n) + " פעמים"; }

  // ---------- pieces of a slide ----------
  var d0 = 0;
  function P(t, a, kids) { a = a || {}; a.class = ((a.class || "") + " pop").trim(); a.style = "--d:" + (d0 += 0.16).toFixed(2) + "s;" + (a.style || ""); return el(t, a, kids); }
  function big(n, unit) { return [P("div", { class: "big", "data-n": String(n), text: "0" }), unit ? P("div", { class: "unit", text: unit }) : null]; }
  function deco(colors, floats) {
    var d = el("div", { class: "deco", "aria-hidden": "true" });
    colors.forEach(function (c, i) { var s = 180 + (i * 67) % 140; d.append(el("i", { class: "blob", style: "background:" + c + ";width:" + s + "px;height:" + s + "px;top:" + [8, 58, 30, 74][i % 4] + "%;" + (i % 2 ? "left" : "right") + ":" + [-12, -8, 52, 10][i % 4] + "%;--dx:" + (i % 2 ? 50 : -50) + "px;--dy:" + (i % 3 ? -40 : 30) + "px;animation-delay:" + -i * 3 + "s" })); });
    (floats || []).forEach(function (f, i) { var pos = [[8, 12], [14, 78], [72, 8], [82, 70], [44, 88], [90, 34], [28, 4], [60, 84], [6, 46], [94, 6], [36, 92], [70, 50]][i % 12]; d.append(el("span", { class: "float", text: f, style: "top:" + pos[0] + "%;left:" + pos[1] + "%;--s:" + (26 + (i * 7) % 20) + "px;--t:" + (6 + i % 4) + "s;--d0:" + -i * 0.7 + "s" })); });
    return d;
  }
  function slide(theme, deco0, kids, opt) { d0 = 0; var s = el("section", { class: "slide t-" + theme }, [deco0, el("div", { class: "inner" }, kids.reduce(function (a, k) { return a.concat(k); }, []).filter(Boolean))]); s._opt = opt || {}; return s; }
  function rows(list, key, color) {
    var max = Math.max.apply(null, list.map(function (k) { return k[key]; }).concat([1]));
    return P("div", { class: "rows" }, list.slice(0, 5).map(function (k) { return el("div", { class: "rowk" }, [el("span", { class: "av", text: k.av || "⭐" }), el("span", { style: "display:grid;gap:4px;text-align:start" }, [el("span", { text: k.name }), el("span", { class: "bar", style: "--bar:" + (color || "#FFD66B") }, [el("b", { "data-w": String(Math.max(6, Math.round(k[key] / max * 100))) })])]), el("span", { class: "n", "data-n": String(k[key]), text: "0" })]); }));
  }
  function tiles(list) { return P("div", { class: "tiles" }, list.map(function (t) { return el("div", { class: "tile" }, [el("span", { class: "e", text: t[0] }), el("b", { "data-n": String(t[1]), text: "0" }), el("small", { text: t[2] })]); })); }

  // ---------- the slides, from the year's numbers ----------
  function build(D) {
    var L = [], sh = D.shigra, mt = D.matalot;
    L.push({ dur: 6000, make: function () { return slide("cover", deco(["#FF4FA3", "#FF9A3D", "#7B3CFF"], ["⭐", "🌙", "🎈", "💛", "✨", "🏡", "🌈", "🎉"]), [
      P("p", { class: "kicker", text: "Hania360 · " + YEAR }), P("h1", { text: "השנה שלנו" }),
      P("p", { class: "lead", text: D.demo ? "זו שנה לדוגמה. עם חשבון Hania360 תראו כאן את השנה של המשפחה שלכם." : "שנה שלמה של שגרות, כוכבים, לימוד וצחוק. בואו נראה מה עשינו יחד ✨" })]); } });
    if (D.apps && D.apps.length >= 2) L.push({ make: function () { return slide("apps", deco(["#2FC7B9", "#1E90FF", "#7CF7D4"], D.apps.slice(0, 12).map(function (a) { return a.e; })), [
      P("p", { class: "kicker", text: "📱 האפליקציות שלנו" }), P("h2", { text: "השנה השתמשנו ב־" }), big(D.apps.length, "אפליקציות"),
      P("div", { class: "chips" }, D.apps.slice(0, 9).map(function (a) { return el("span", { class: "chip", text: a.e + " " + a.name }); }))]); } });
    if (sh && sh.stars) L.push({ make: function () { return slide("stars", deco(["#5B3BFF", "#B04BFF", "#2A1F9E"], ["⭐", "🌟", "✨", "⭐", "💫", "🌟"]), [
      P("p", { class: "kicker", text: "⭐ הילדים שלנו" }), P("h2", { text: "אספו השנה" }), big(sh.stars, "כוכבים"),
      sh.kids && sh.kids.length > 1 ? rows(sh.kids, "stars") : null,
      sh.best && sh.best.n ? P("p", { class: "lead small", text: "היום הכי מנצנץ: " + day(sh.best.d) + ", עם " + fmt(sh.best.n) + " כוכבים" }) : null]); } });
    if (sh && (sh.eve || sh.morn)) L.push({ make: function () { return slide("eve", deco(["#6C4BFF", "#FF7AB6", "#2B2C9E"], ["🌙", "🛁", "🪥", "📖", "😴", "🧸"]), [
      P("p", { class: "kicker", text: "🌙 שגרה" }), P("h2", { text: sh.eve ? "סיימנו את שגרת הערב" : "סיימנו את שגרת הבוקר" }), big(sh.eve || sh.morn, sh.eve ? "ערבים" : "בקרים"),
      tiles([sh.streak > 1 ? ["🔥", sh.streak, "ערבים ברצף, השיא שלנו"] : null, sh.eve && sh.morn ? ["☀️", sh.morn, "בקרים של שגרה"] : null, sh.days ? ["📅", sh.days, "ימים עם כוכבים"] : null].filter(Boolean).slice(0, 2)),
      P("p", { class: "lead small", text: "ערב רגוע מתחיל בשגרה טובה 💜" })]); } });
    if (sh && (sh.moments && sh.moments.length || sh.faces && sh.faces.length)) L.push({ dur: 10000, make: function () {
      var m = (sh.moments || []).slice(-3), f = sh.faces && sh.faces[0];
      return slide("moments", deco(["#FFD36E", "#FF5FA2", "#B44BFF"], ["💛", "📔", "✏️", "🌼"]), [
        P("p", { class: "kicker", text: "📔 היומן שלנו" }), P("h2", { text: m.length ? "מה היה הכי טוב היום?" : "איך היו הימים שלנו?" }),
        m.length ? P("div", { class: "notes" }, m.map(function (x, i) { return el("div", { class: "note pop", style: "--d:" + (0.7 + i * 0.5) + "s;transform:rotate(" + [-2.5, 2, -1][i % 3] + "deg)" }, [x.txt, el("small", { text: (x.name ? x.name + " · " : "") + day(x.d) })]); })) : null,
        f ? P("p", { class: "lead", text: "רוב הימים היו " + f[0] + (f[1] > 1 ? " (" + times(f[1]) + ")" : "") }) : null]); } });
    if (sh && sh.won) L.push({ confetti: 1, make: function () { return slide("prize", deco(["#FFE66D", "#FF3D7F", "#FF9A5C"], ["🏆", "🎁", "🍦", "🎉", "🍕", "🎈"]), [
      P("p", { class: "kicker", text: "🏆 פרסים" }), P("h2", { text: "הרווחנו יחד" }), big(sh.won, sh.won === 1 ? "פרס" : "פרסים"),
      P("div", { class: "chips" }, (sh.prizes || []).map(function (p) { return el("span", { class: "chip", text: p[0] + (p[1] > 1 ? " ×" + p[1] : "") }); })),
      P("p", { class: "lead small", text: "כל פרס הוא שבוע שלם של עבודת צוות 💪" })]); } });
    if (mt && mt.done) L.push({ make: function () { var t = mt.top && mt.top[0]; return slide("chores", deco(["#9BE15D", "#13865A", "#00C9A7"], ["🧹", "🧺", "🍽️", "🪴", "🧽", "🛏️"]), [
      P("p", { class: "kicker", text: "🧹 עוזרים בבית" }), P("h2", { text: "עשינו השנה" }), big(mt.done, "מטלות בית"),
      mt.kids && mt.kids.length > 1 ? rows(mt.kids, "n", "#C9F25A") : null,
      t ? P("p", { class: "lead small", text: "הכי הרבה: " + t[0] + " (" + times(t[1]) + ")" }) : null]); } });
    var lt = [];
    if (D.english) lt.push(["🔤", D.english.stars, "כוכבים באנגלית"]);
    if (D.ivrit) lt.push(["📖", D.ivrit.stars, "כוכבים בקריאה"]);
    if (D.limud) lt.push(["📜", D.limud.days, D.limud.daf ? "ימי לימוד, " + fmt(D.limud.daf) + " דפים" : "ימים של לימוד יומי"]);
    if (D.daber) lt.push(["🗣️", D.daber.mins || D.daber.talks, D.daber.mins ? "דקות של אנגלית בקול" : "שיחות באנגלית"]);
    if (lt.length) L.push({ make: function () { var b = lt.length === 1; return slide("learn", deco(["#8E6BFF", "#3F35C8", "#00B3FF"], ["📚", "✏️", "🔤", "🎓", "💡", "📖"]), [
      P("p", { class: "kicker", text: "📚 לומדים" }), P("h2", { text: "השנה למדנו" }), b ? big(lt[0][1], lt[0][2]) : tiles(lt.slice(0, 4)),
      D.limud && D.limud.streak > 2 ? P("p", { class: "lead small", text: "🔥 " + fmt(D.limud.streak) + " ימי לימוד ברצף, השיא שלנו" }) : D.english && D.english.units ? P("p", { class: "lead small", text: fmt(D.english.units) + " יחידות אנגלית הושלמו עד הסוף" }) : null]); } });
    if (D.fit) L.push({ make: function () { var f = D.fit; return slide("fit", deco(["#FFB03A", "#FF2A68", "#FF6F3C"], ["💪", "🏃", "🔥", "⏱️", "🧘", "🚴"]), [
      P("p", { class: "kicker", text: "💪 כושר" }), P("h2", { text: "התאמנו השנה" }), big(f.workouts, "אימונים"),
      tiles([["⏱️", f.mins, "דקות של אימון"], f.streak > 1 ? ["🔥", f.streak, "ימים ברצף"] : ["📅", f.month ? f.month[1] : 0, "אימונים בחודש הכי חזק"]]),
      f.fav ? P("p", { class: "lead small", text: "האימון האהוב: " + f.fav[0] }) : null]); } });
    var fun = [];
    if (D.race) fun.push(["🏎️", D.race.stars, "כוכבים במרוץ"]);
    if (D.bracha) fun.push(["🙏", D.bracha.stars, "תשובות נכונות ב״איזו ברכה?״"]);
    if (fun.length) L.push({ make: function () { return slide("fun", deco(["#C9F25A", "#00A6A6", "#00E0FF"], ["🎮", "🏁", "🎯", "🎲", "🙏", "⭐"]), [
      P("p", { class: "kicker", text: "🎮 משחקים" }), P("h2", { text: "גם שיחקנו" }), fun.length === 1 ? big(fun[0][1], fun[0][2]) : tiles(fun)]); } });
    L.push({ end: 1, confetti: 1, make: function () {
      var st = stats(D).slice(0, 6);
      return slide("end", deco(["#7B3CFF", "#FF4FA3", "#2FC7B9"], ["💛", "✨", "🎉", "⭐"]), [
        P("p", { class: "kicker", text: "Hania360 · " + YEAR }), P("h2", { text: "תודה על שנה מדהימה 💛" }),
        st.length ? tiles(st) : P("p", { class: "lead", text: "שנה טובה ומתוקה!" }),
        P("div", { class: "btns" }, [
          D.demo ? el("a", { class: "btn light", href: "https://pass.hania360.com/?return=" + encodeURIComponent("https://shana.hania360.com/"), text: "🔐 לראות את השנה שלנו" }) : el("button", { class: "btn light", type: "button", text: "📤 לשתף תמונה", onclick: share }),
          el("button", { class: "btn ghost", type: "button", text: "↻ מההתחלה", onclick: function () { go(0); } })])]);
    } });
    return L;
  }
  function stats(D) {
    var s = [], sh = D.shigra || {}, mt = D.matalot || {};
    if (sh.stars) s.push(["⭐", sh.stars, "כוכבים"]);
    if (sh.eve) s.push(["🌙", sh.eve, "ערבים של שגרה"]);
    if (mt.done) s.push(["🧹", mt.done, "מטלות בית"]);
    if (sh.won) s.push(["🏆", sh.won, "פרסים"]);
    var ls = (D.english ? D.english.stars : 0) + (D.ivrit ? D.ivrit.stars : 0); if (ls) s.push(["📚", ls, "כוכבי לימוד"]);
    if (D.limud) s.push(["📜", D.limud.days, "ימי לימוד יומי"]);
    if (D.daber && D.daber.mins) s.push(["🗣️", D.daber.mins, "דקות אנגלית"]);
    if (D.fit) s.push(["💪", D.fit.workouts, "אימונים"]);
    if (D.apps && D.apps.length) s.push(["📱", D.apps.length, "אפליקציות"]);
    return s;
  }
  function signin(empty) {
    return [{ end: 1, make: function () { return slide("cover", deco(["#FF4FA3", "#FF9A3D", "#7B3CFF"], ["⭐", "🌙", "🎈", "💛", "✨", "🏡"]), [
      P("p", { class: "kicker", text: "Hania360 · " + YEAR }), P("h1", { text: "השנה שלנו" }),
      P("p", { class: "lead", text: empty ? "עוד אין מספיק בגיבוי כדי לספר שנה. השנה נבנית מהשגרה, המטלות, הלימוד והכושר באפליקציות של Hania360, כשמחוברים לחשבון." : "השנה שלכם נבנית מהגיבוי בחשבון Hania360: שגרה, מטלות, לימוד וכושר. מתחברים פעם אחת, והגיבוי עובד מעצמו." }),
      P("div", { class: "btns" }, [empty ? null : el("a", { class: "btn light", href: "https://pass.hania360.com/?return=" + encodeURIComponent("https://shana.hania360.com/"), text: "🔐 התחברות" }),
        el("button", { class: "btn " + (empty ? "light" : "ghost"), type: "button", text: "👀 שנה לדוגמה", onclick: function () { start(demo()); } })])]); } }];
  }
  function demo() {
    return { demo: true, apps: [["shigra", "🌙", "שגרה"], ["matalot", "🧹", "מטלות הבית"], ["english", "🔤", "אנגלית"], ["ivrit", "📖", "לומדים לקרוא"], ["limud", "📚", "לימוד יומי"], ["fit", "💪", "כושר"], ["cart", "🛒", "קניות"], ["layla", "🌛", "לילה טוב"], ["race", "🏎️", "מרוץ"]].map(function (a) { return { app: a[0], e: a[1], name: a[2] }; }),
      shigra: { stars: 1284, days: 241, best: { d: YEAR + "-03-12", n: 18 }, eve: 198, morn: 156, streak: 23, kids: [{ name: "נועה", av: "🦊", stars: 702 }, { name: "איתי", av: "🐼", stars: 582 }],
        faces: [["😄", 142], ["🙂", 61]], moments: [{ d: YEAR + "-02-04", name: "נועה", txt: "בנינו מבצר מכריות בסלון 🏰" }, { d: YEAR + "-06-18", name: "איתי", txt: "למדתי לרכוב על אופניים בלי גלגלי עזר!" }, { d: YEAR + "-09-30", name: "נועה", txt: "ראינו ירח ענק וכתום מהחלון 🌕" }], won: 19, prizes: [["🍦 גלידה", 7], ["🎬 ערב סרט", 5], ["🛝 יציאה לגינה", 4], ["🍕 פיצה", 3]] },
      matalot: { done: 612, pts: 740, kids: [{ name: "נועה", av: "🦊", n: 331 }, { name: "איתי", av: "🐼", n: 281 }], top: [["🧺 לקפל כביסה", 84]] },
      english: { stars: 236, units: 9 }, ivrit: { stars: 318, units: 14 }, limud: { days: 174, daf: 160, hal: 120, streak: 41 }, fit: { workouts: 96, mins: 3120, fav: ["יום רגליים · חיזוק", 22], month: ["2026-05", 14], streak: 9 }, race: { stars: 47, tracks: 6 } };
  }

  // ---------- the player ----------
  var SL = [], I = -1, T = { t0: 0, dur: 7000, paused: false, hold: 0 }, CUR = null;
  function bars() { var b = $("bars"); b.replaceChildren.apply(b, SL.map(function (s, i) { return el("i", { class: i < I ? "done" : "" }, [el("b")]); })); }
  function go(i) {
    if (!SL.length) return; i = Math.max(0, Math.min(SL.length - 1, i));
    var old = CUR; if (old) { old.classList.add("out"); setTimeout(function () { old.remove(); }, 450); }
    I = i; var s = SL[i].make(); CUR = s; $("slides").append(s); bars();
    T.dur = SL[i].dur || 7500; T.t0 = performance.now(); T.paused = false;
    var end = !!SL[i].end; $("tapL").hidden = end; $("tapR").hidden = end; $("hint").style.opacity = i === 0 ? "1" : "0";
    setTimeout(function () { animate(s); }, 350);
    if (SL[i].confetti && !RM) confetti(s);
  }
  function animate(s) {
    s.querySelectorAll("[data-n]").forEach(function (e, j) { var n = +e.getAttribute("data-n") || 0, t0 = performance.now() + j * 120, ms = n > 50 ? 1500 : 900; (function f(now) { var k = Math.max(0, Math.min(1, (now - t0) / ms)); e.textContent = fmt(n * (1 - Math.pow(1 - k, 3))); if (k < 1 && document.body.contains(e)) requestAnimationFrame(f); })(t0); });
    s.querySelectorAll("[data-w]").forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; });
  }
  function tick(now) {
    requestAnimationFrame(tick);
    if (I < 0 || !SL.length) return;
    var bar = $("bars").children[I]; if (!bar) return;
    if (T.paused || SL[I].end) { T.t0 = now - (T.el || 0); if (SL[I].end) bar.firstChild.style.transform = "scaleX(1)"; return; }
    T.el = now - T.t0; var k = Math.min(1, T.el / T.dur); bar.firstChild.style.transform = "scaleX(" + k + ")";
    if (k >= 1) { T.el = 0; go(I + 1); }
  }
  function next() { if (I < SL.length - 1) { T.el = 0; go(I + 1); } }
  function prev() { T.el = 0; go(I - 1); }
  // tap to go on, hold to pause, swipe sideways
  function zone(id, fn) {
    var z = $(id), x0 = 0, held = false, tm = 0;
    z.addEventListener("pointerdown", function (e) { x0 = e.clientX; held = false; tm = setTimeout(function () { held = true; T.paused = true; }, 230); });
    z.addEventListener("pointerup", function (e) { clearTimeout(tm); if (held) { T.paused = false; return; } var dx = e.clientX - x0; if (dx > 60) prev(); else if (dx < -60) next(); else fn(); });
    z.addEventListener("pointercancel", function () { clearTimeout(tm); T.paused = false; });
    z.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
  }
  zone("tapL", next); zone("tapR", prev);
  addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") next(); else if (e.key === "ArrowRight") prev(); else if (e.key === " " && document.activeElement === document.body) { e.preventDefault(); T.paused = !T.paused; } });
  document.addEventListener("visibilitychange", function () { T.paused = document.hidden; });
  function start(D) {
    SL = D && D.signin ? signin(false) : D && D.empty ? signin(true) : build(D);
    if (D && !D.signin && !D.empty) DATA = D;
    var dm = document.querySelector(".demo"); if (dm) dm.remove();
    if (D && D.demo) $("frame").append(el("div", { class: "demo", text: "שנה לדוגמה" }));
    I = -1; if (CUR) { CUR.remove(); CUR = null; } go(0);
  }

  // ---------- confetti ----------
  function confetti(s) {
    var c = el("canvas", { class: "confetti", "aria-hidden": "true" }), r = s.getBoundingClientRect(), W = c.width = Math.round(r.width), H = c.height = Math.round(r.height), x = c.getContext("2d"), P0 = [];
    s.insertBefore(c, s.firstChild.nextSibling);
    for (var i = 0; i < 120; i++) P0.push({ x: W / 2 + (Math.random() - 0.5) * 80, y: H * 0.42, vx: (Math.random() - 0.5) * 11, vy: -4 - Math.random() * 9, r: 4 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, c: ["#FFD66B", "#FF5FA2", "#7CF7D4", "#FFFFFF", "#8E6BFF"][i % 5] });
    var t0 = performance.now();
    (function f(now) { var k = (now - t0) / 3200; x.clearRect(0, 0, W, H); P0.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.vx *= 0.99; p.a += p.va; x.save(); x.globalAlpha = Math.max(0, 1 - k); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9); x.restore(); }); if (k < 1 && document.body.contains(c)) requestAnimationFrame(f); else c.remove(); })(t0);
  }

  // ---------- a picture to share ----------
  var DATA = null;
  function share() {
    var go2 = function () {
      var c = document.createElement("canvas"); c.width = 1080; c.height = 1920; var g = c.getContext("2d");
      var gr = g.createLinearGradient(0, 0, 1080, 1920); gr.addColorStop(0, "#2B0B5E"); gr.addColorStop(0.5, "#8E1A8C"); gr.addColorStop(1, "#FF7A3D"); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920);
      [[180, 300, 420, "255,79,163"], [900, 900, 460, "123,60,255"], [300, 1600, 480, "255,154,61"]].forEach(function (b) { var rg = g.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2]); rg.addColorStop(0, "rgba(" + b[3] + ",.55)"); rg.addColorStop(1, "rgba(" + b[3] + ",0)"); g.fillStyle = rg; g.fillRect(0, 0, 1080, 1920); });
      g.direction = "rtl"; g.textAlign = "center"; g.fillStyle = "#fff";
      g.font = "600 44px Fredoka, Rubik, sans-serif"; g.globalAlpha = 0.85; g.fillText("Hania360 · " + YEAR, 540, 230); g.globalAlpha = 1;
      g.font = "700 170px Fredoka, Rubik, sans-serif"; g.fillText("השנה שלנו", 540, 420);
      var st = stats(DATA).slice(0, 6);
      st.forEach(function (s, i) {
        var rows = Math.ceil(st.length / 2), top0 = 560 + Math.max(0, (1100 - (rows * 370 - 40)) / 2), col = i % 2, row = Math.floor(i / 2), w = 440, h = 330;
        var x0 = i === st.length - 1 && st.length % 2 ? 320 : col ? 80 : 560, y0 = top0 + row * 370;
        g.fillStyle = "rgba(255,255,255,.16)"; rrect(g, x0, y0, w, h, 48); g.fill(); g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 3; g.stroke();
        g.fillStyle = "#fff"; g.font = "88px sans-serif"; g.fillText(s[0], x0 + w / 2, y0 + 110);
        g.font = "900 104px Rubik, sans-serif"; g.fillText(fmt(s[1]), x0 + w / 2, y0 + 225);
        g.font = "500 40px Rubik, sans-serif"; g.globalAlpha = 0.9; g.fillText(s[2], x0 + w / 2, y0 + 290); g.globalAlpha = 1;
      });
      g.font = "600 46px Fredoka, Rubik, sans-serif"; g.fillText("תודה על שנה מדהימה 💛", 540, 1760); g.font = "500 34px Rubik, sans-serif"; g.globalAlpha = 0.75; g.fillText("hania360.com", 540, 1830); g.globalAlpha = 1;
      c.toBlob(function (b) {
        if (!b) return; var f = null; try { f = new File([b], "hashana-shelanu-" + YEAR + ".png", { type: "image/png" }); } catch (e) {}
        if (f && navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: "השנה שלנו", text: "השנה שלנו עם Hania360 💛" }).catch(function () {});
        else { var a = el("a", { href: URL.createObjectURL(b), download: "hashana-shelanu-" + YEAR + ".png" }); document.body.append(a); a.click(); a.remove(); }
      }, "image/png");
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go2);
  }
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  // ---------- start ----------
  requestAnimationFrame(tick);
  if (/[?&]demo\b/.test(location.search)) { start(demo()); return; }
  fetch("/api/year", { credentials: "same-origin" }).then(function (r) { return r.status === 401 ? { signin: true } : r.ok ? r.json() : null; }).then(function (D) {
    if (!D) throw 0; if (D.signin) return start(D);
    var has = stats(D).filter(function (s) { return s[0] !== "📱"; }).length; if (!has && !(D.apps && D.apps.length >= 3)) return start({ empty: true });
    start(D);
  }).catch(function () { start({ signin: true }); });
})();
