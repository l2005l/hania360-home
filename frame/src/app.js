// HaniaFrame (frame.hania360.com): the family's page and grandma's screen. Inlined into frame.html by frame/build.py.
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function el(t, a, kids) { var e = document.createElement(t); for (var k in a || {}) { if (k === "text") e.textContent = a[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), a[k]); else if (a[k] != null && a[k] !== false) e.setAttribute(k, a[k] === true ? "" : a[k]); } (kids || []).forEach(function (c) { if (c != null && c !== false) e.append(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
  var ORIGIN = "https://frame.hania360.com/", RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LS = "frame-v1", S = (function () { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } })();
  S.frames = S.frames || {}; S.seen = S.seen || {};
  if (!S.by) S.by = Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8);
  function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }
  save();
  var CITIES = /*CITIES*/[["ירושלים", 31.778, 35.235, 40]];
  var toastT = 0;
  function toast(t) { var x = $("toast"); x.textContent = t; x.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { x.classList.remove("on"); }, 2800); }
  function api(what, body, q) {
    return fetch("/api/frame/" + what + (q || ""), body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || "http " + r.status); e.code = j.error; throw e; } return j; }); });
  }
  function imgURL(c, i) { return "/api/frame/img?c=" + c + "&i=" + i; }
  function ago(t) {
    var s = (Date.now() - t) / 1000;
    if (s < 90) return "עכשיו"; if (s < 3600) return "לפני " + Math.round(s / 60) + " דקות"; if (s < 7200) return "לפני שעה"; if (s < 86400) return "לפני " + Math.round(s / 3600) + " שעות";
    if (s < 2 * 86400) return "אתמול"; if (s < 7 * 86400) return "לפני " + Math.round(s / 86400) + " ימים";
    return new Date(t).toLocaleDateString("he-IL", { day: "numeric", month: "long" });
  }
  function qrSvg(text) { try { var q = qrcode(0, "M"); q.addData(text); q.make(); var d = el("div", { class: "qr" }); d.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); return d; } catch (e) { return el("p", { class: "fine", text: text }); } }
  // sheets
  function sheet(build) { var b = $("sheetBody"); b.replaceChildren.apply(b, build().filter(Boolean)); $("sheet").classList.add("open"); $("scrim").classList.add("on"); $("sheet").scrollTop = 0; }
  function closeSheet() { $("sheet").classList.remove("open"); $("scrim").classList.remove("on"); }
  $("scrim").addEventListener("click", closeSheet);
  addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });

  // ---------- routes: /#f=<id> the family page, /#s=<id> the screen, otherwise home ----------
  var ID = null, ST = null, POLL = 0;
  function route() {
    clearInterval(POLL); var m = /^#([fs])=([A-Za-z0-9]{16})$/.exec(location.hash);
    if (m && m[1] === "s") return screen(m[2]);
    document.body.classList.remove("screen"); $("scr").hidden = true;
    if (m) return family(m[2]);
    home();
  }
  addEventListener("hashchange", route);

  // =================================== home ===================================
  function home() {
    ID = null; $("hdr").textContent = "";
    var mine = Object.keys(S.frames), name = el("input", { type: "text", maxlength: "40", placeholder: "למשל: המסגרת של סבתא רחל", "aria-label": "שם המסגרת" });
    var city = el("select", { "aria-label": "העיר של סבא וסבתא (לזמני שבת)" }, CITIES.map(function (c) { return el("option", { value: c[0], text: c[0] }); }));
    $("main").replaceChildren(
      el("section", { class: "card", style: "display:grid;gap:14px" }, [
        el("h1", { text: "מסגרת לסבא ולסבתא" }),
        el("p", { class: "sub", style: "font-size:17px", text: "טאבלט ישן על המדף של סבתא הופך למסגרת תמונות חיה. כל המשפחה שולחת תמונות וברכות מהטלפון, והן מופיעות אצלה בתוך דקה, אחת אחרי השנייה, בתנועה עדינה." }),
        el("div", { class: "how" }, [el("div", null, [el("span", { text: "🖼️" }), "יוצרים מסגרת"]), el("div", null, [el("span", { text: "📸" }), "כל המשפחה שולחת"]), el("div", null, [el("span", { text: "❤️" }), "סבתא רואה ואוהבת"])])]),
      mine.length ? el("section", { class: "card" }, [el("h2", { text: "המסגרות שלי" }), el("div", { class: "frames" }, mine.map(function (id) { var f = S.frames[id]; return el("a", { class: "fr", href: "#f=" + id }, [el("span", { style: "font-size:30px", text: "🖼️" }), el("span", { style: "display:grid" }, [el("b", { text: f.name || "מסגרת" }), el("span", { class: "fine", text: f.own ? "אני יצרתי אותה" : "אני שולח/ת אליה" })])]); }))]) : null,
      el("section", { class: "card", style: "display:grid;gap:12px" }, [el("h2", { text: "✨ מסגרת חדשה" }),
        el("label", { class: "f" }, ["איך קוראים למסגרת?", name]), el("label", { class: "f" }, ["העיר של סבא וסבתא (לזמני שבת)", city]),
        el("button", { class: "btn wide", type: "button", text: "✨ ליצור מסגרת", onclick: function (e) {
          var b = e.currentTarget; b.disabled = true;
          api("new", { name: name.value.trim() || "המסגרת שלנו", city: city.value }).then(function (j) { S.frames[j.id] = { name: name.value.trim() || "המסגרת שלנו", own: j.own }; save(); location.hash = "f=" + j.id; toast("✨ המסגרת מוכנה"); }).catch(function () { toast("לא הצלחנו ליצור. נסו שוב"); b.disabled = false; });
        } }),
        el("p", { class: "fine", text: "בלי הרשמה. מי שמקבל את הקישור יכול להוסיף תמונות, כמו בקבוצה משפחתית. התמונות נשמרות בשרתי Hania360, ורק מי שיש לו את הקישור רואה אותן." })]));
  }

  // =================================== the family's page ===================================
  function own(id) { return (S.frames[id] || {}).own || ""; }
  function load(id) { return api("state", null, "?c=" + id + (own(id) ? "&own=" + own(id) : "")); }
  function family(id) {
    ID = id; $("main").replaceChildren(el("section", { class: "card" }, [el("p", { class: "sub", text: "טוען את המסגרת…" })]));
    load(id).then(function (st) { ST = st; S.frames[id] = Object.assign(S.frames[id] || {}, { name: st.name }); save(); drawFamily(); POLL = setInterval(function () { if (!document.hidden) load(id).then(function (s2) { if (s2.at !== ST.at) { ST = s2; drawFamily(true); } }).catch(function () {}); }, 30000); })
      .catch(function (e) { $("main").replaceChildren(el("section", { class: "card" }, [el("h2", { text: e.code === "no frame" ? "המסגרת הזאת לא קיימת (אולי נמחקה)" : "לא הצלחנו לטעון" }), el("a", { class: "btn ghost", href: "/", text: "→ לדף הבית" })])); if (e.code === "no frame") { delete S.frames[id]; save(); } });
  }
  function drawFamily(quiet) {
    var st = ST, items = st.items.slice().reverse(), imgs = items.filter(function (x) { return x.kind === "img"; }), last = imgs[0];
    $("hdr").textContent = st.owner ? "👑 אני המנהל/ת" : "";
    var file = el("input", { type: "file", accept: "image/*", multiple: true, hidden: true, onchange: function () { if (file.files.length) upload([].slice.call(file.files, 0, 12)); file.value = ""; } });
    var liked = items.filter(function (x) { return x.liked && Date.now() - x.liked < 7 * 864e5; }).sort(function (a, b) { return b.liked - a.liked; })[0];
    $("main").replaceChildren(
      el("section", { class: "card hero" }, [
        el("div", { class: "mini", "aria-hidden": "true" }, [el("div", { class: "in" }, [last ? el("img", { src: imgURL(ID, last.id), alt: "" }) : el("div", { class: "empty", text: "כאן תופיע התמונה הראשונה 💛" })])]),
        el("div", { style: "display:grid;gap:10px" }, [el("h1", { text: st.name }),
          el("p", { class: "sub", text: (imgs.length === 1 ? "תמונה אחת" : imgs.length ? imgs.length + " תמונות" : "עוד אין תמונות") + (items.length - imgs.length === 1 ? " · ברכה אחת" : items.length > imgs.length ? " · " + (items.length - imgs.length) + " ברכות" : "") + (items[0] ? " · האחרונה " + ago(items[0].at) : "") }),
          liked ? el("p", { style: "margin:0;color:var(--accent);font-weight:700", text: "❤️ סבתא אהבה את " + (liked.kind === "img" ? "התמונה של " : "הברכה של ") + liked.from + " " + ago(liked.liked) }) : null,
          el("div", { class: "grid2" }, [el("button", { class: "btn big", type: "button", onclick: function () { file.click(); } }, [el("span", { text: "📸" }), "להוסיף תמונות"]), el("button", { class: "btn big ghost", type: "button", onclick: greet }, [el("span", { text: "💌" }), "לכתוב ברכה"])]), file])]),
      el("section", { class: "card", style: "display:grid;gap:10px" }, [el("h2", { text: "המסך של סבתא ובני המשפחה" }),
        el("div", { class: "grid2" }, [el("button", { class: "btn ghost", type: "button", text: "🖥️ לחבר את הטאבלט", onclick: screenSheet }), el("button", { class: "btn ghost", type: "button", text: "👨‍👩‍👧 להזמין את המשפחה", onclick: invite })])]),
      items.length ? el("section", { class: "card" }, [el("h2", { text: "מה שלחנו" }), el("div", { class: "feed" }, items.map(function (x) {
        var nw = Date.now() - x.at < 864e5;
        return el("button", { class: "it" + (x.kind === "text" ? " bg-" + x.bg : ""), type: "button", "aria-label": (x.kind === "img" ? "תמונה" : "ברכה") + " של " + x.from, onclick: function () { open(x); } }, [
          x.kind === "img" ? el("img", { src: imgURL(ID, x.id), alt: x.cap || "", loading: "lazy" }) : el("span", { class: "tx", text: x.cap }),
          x.likes ? el("span", { class: "lk", text: "❤️ " + x.likes }) : null, nw ? el("span", { class: "nw", text: "חדש" }) : null]);
      }))]) : null,
      st.owner ? settings() : null);
  }
  function open(x) {
    var mine = x.by && x.by === S.by;
    sheet(function () { return [
      x.kind === "img" ? el("div", { class: "lb" }, [el("img", { src: imgURL(ID, x.id), alt: x.cap || "" })]) : el("div", { class: "prev bg-" + x.bg, text: x.cap }),
      el("p", { style: "margin:12px 0 4px;font-size:17px" }, [el("b", { text: x.from }), " · " + ago(x.at)]), x.kind === "img" && x.cap ? el("p", { style: "margin:0 0 6px", text: x.cap }) : null,
      el("p", { class: "fine", style: "margin:0 0 12px", text: x.likes ? "❤️ סבתא אהבה" + (x.likes > 1 ? " (" + x.likes + " פעמים)" : "") : "עוד בלי לב" }),
      mine || ST.owner ? el("button", { class: "btn ghost small", type: "button", text: "🗑️ להסיר מהמסגרת", onclick: function () {
        if (!confirm("להסיר מהמסגרת?")) return;
        api("op", { c: ID, op: "del", id: x.id, by: S.by, own: own(ID) }).then(function () { ST.items = ST.items.filter(function (i) { return i.id !== x.id; }); closeSheet(); drawFamily(); toast("הוסר"); }).catch(function () { toast("לא הצלחנו להסיר"); });
      } }) : null]; });
  }
  // ---- photos: made small on the phone, then sent one by one ----
  function shrink(file) {
    var M = 1920, MAX = 600000;
    var draw = function (src, w0, h0) {
      var k = Math.min(1, M / Math.max(w0, h0)), w = Math.round(w0 * k), h = Math.round(h0 * k), c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(src, 0, 0, w, h); var q = 0.84, d = c.toDataURL("image/jpeg", q);
      while (d.length > MAX && q > 0.5) { q -= 0.08; d = c.toDataURL("image/jpeg", q); }
      if (d.length > MAX) { M = Math.round(M * 0.75); return draw(src, w0, h0); }
      return { d: d, w: w, h: h };
    };
    if (window.createImageBitmap) return createImageBitmap(file, { imageOrientation: "from-image" }).then(function (b) { return draw(b, b.width, b.height); }).catch(function () { return viaImg(); });
    return viaImg();
    function viaImg() { return new Promise(function (ok, no) { var u = URL.createObjectURL(file), i = new Image(); i.onload = function () { try { ok(draw(i, i.naturalWidth, i.naturalHeight)); } catch (e) { no(e); } URL.revokeObjectURL(u); }; i.onerror = no; i.src = u; }); }
  }
  function upload(files) {
    var who = el("input", { type: "text", maxlength: "24", value: S.me || "", placeholder: "למשל: נועה", "aria-label": "מי שולח?" });
    var rows = files.map(function (f) { var cap = el("input", { type: "text", maxlength: "140", placeholder: "כמה מילים (לא חובה)", "aria-label": "כיתוב לתמונה" }), im = el("img", { alt: "" }), bar = el("div", { class: "bar" }, [el("b")]); var r = { f: f, cap: cap, im: im, bar: bar, p: shrink(f) }; r.p.then(function (x) { im.src = x.d; }).catch(function () { r.bad = true; im.alt = "⚠️"; }); return r; });
    var send = el("button", { class: "btn wide", type: "button", text: "📤 לשלוח " + (files.length > 1 ? files.length + " תמונות" : "את התמונה"), onclick: function () {
      S.me = who.value.trim().slice(0, 24); save(); if (!S.me) { who.focus(); toast("כתבו מי שולח, כדי שסבתא תדע 💛"); return; }
      send.disabled = true; var i = 0, ok = 0;
      (function nextOne() {
        if (i >= rows.length) { closeSheet(); toast(ok ? "✨ נשלח! סבתא תראה בעוד דקה" : "לא הצלחנו לשלוח"); return load(ID).then(function (s) { ST = s; drawFamily(); }); }
        var r = rows[i++]; if (r.bad) return nextOne();
        r.bar.firstChild.style.width = "40%";
        r.p.then(function (x) { return api("op", { c: ID, op: "post", img: x.d, w: x.w, h: x.h, cap: r.cap.value.trim(), from: S.me, by: S.by }); })
          .then(function () { ok++; r.bar.firstChild.style.width = "100%"; nextOne(); })
          .catch(function (e) { r.bar.firstChild.style.background = "#C0392B"; r.bar.firstChild.style.width = "100%"; if (e.code === "day") { toast("היום כבר נשלחו הרבה תמונות. מחר אפשר עוד"); i = rows.length; } nextOne(); });
      })();
    } });
    sheet(function () { return [el("h2", { text: "📸 " + (files.length > 1 ? files.length + " תמונות" : "תמונה") + " לסבתא" }), el("label", { class: "f", style: "margin:8px 0 12px" }, ["מי שולח?", who]),
      el("div", { style: "display:grid;gap:10px" }, rows.map(function (r) { return el("div", { class: "up" }, [r.im, el("div", { style: "display:grid;gap:6px" }, [r.cap, r.bar])]); })), el("div", { style: "height:12px" }), send]; });
  }
  function greet() {
    var bg = "sunset", txt = el("textarea", { maxlength: "160", placeholder: "סבתא, אוהבים אותך! 💛", "aria-label": "הברכה" }), who = el("input", { type: "text", maxlength: "24", value: S.me || "", placeholder: "מי שולח?", "aria-label": "מי שולח?" });
    var prev = el("div", { class: "prev bg-" + bg, text: "סבתא, אוהבים אותך! 💛" });
    txt.addEventListener("input", function () { prev.textContent = txt.value || "סבתא, אוהבים אותך! 💛"; });
    var sws = ["sunset", "sea", "rose", "mint", "night", "gold"].map(function (b) { return el("button", { class: "sw bg-" + b, type: "button", "aria-label": "צבע", "aria-pressed": String(b === bg), onclick: function () { bg = b; prev.className = "prev bg-" + b; sws.forEach(function (s) { s.setAttribute("aria-pressed", String(s === this)); }, this); } }); });
    sheet(function () { return [el("h2", { text: "💌 ברכה למסגרת" }), prev, el("div", { style: "height:10px" }), txt, el("div", { class: "row", style: "margin:10px 0" }, sws), who,
      el("button", { class: "btn wide", style: "margin-top:12px", type: "button", text: "📤 לשלוח", onclick: function (e) {
        var t = txt.value.trim(); S.me = who.value.trim().slice(0, 24); save();
        if (!t) { txt.focus(); return; } if (!S.me) { who.focus(); toast("כתבו מי שולח"); return; }
        e.currentTarget.disabled = true;
        api("op", { c: ID, op: "text", text: t, bg: bg, from: S.me, by: S.by }).then(function () { closeSheet(); toast("💌 נשלח!"); return load(ID).then(function (s) { ST = s; drawFamily(); }); }).catch(function () { toast("לא הצלחנו לשלוח"); });
      } })]; });
  }
  function screenSheet() {
    var link = ORIGIN + "#s=" + ID;
    sheet(function () { return [el("h2", { text: "🖥️ לחבר את הטאבלט של סבתא" }),
      el("ol", { class: "steps" }, [el("li", { text: "בטאבלט פותחים את המצלמה וסורקים את הקוד, או שולחים אליו את הקישור." }), el("li", { text: "לוחצים ״להתחיל״. מתחילות לרוץ התמונות." }), el("li", { text: "כדאי להוסיף למסך הבית, לחבר למטען, ובהגדרות של הטאבלט לבטל את נעילת המסך האוטומטית." })]),
      el("div", { style: "display:grid;place-items:center;margin:14px 0" }, [qrSvg(link)]),
      el("div", { class: "grid2" }, [el("button", { class: "btn ghost", type: "button", text: "📋 להעתיק קישור", onclick: function () { copy(link); } }), el("a", { class: "btn ghost", href: "https://wa.me/?text=" + encodeURIComponent("המסך של " + ST.name + " 🖼️\n" + link), target: "_blank", rel: "noopener", text: "💬 בוואטסאפ" })]),
      el("a", { class: "btn wide", style: "margin-top:10px", href: "#s=" + ID, text: "▶ לפתוח את המסך כאן" }),
      el("p", { class: "fine", text: "בלילה המסך מחשיך לשעון בלבד, ובשבת ובחג הוא ממשיך להציג את מה שכבר יש, בלי להתחבר לאינטרנט." })]; });
  }
  function invite() {
    var link = ORIGIN + "#f=" + ID, text = "הצטרפו ל" + ST.name + " 🖼️\nשולחים מכאן תמונות וברכות, והן מופיעות אצל סבא וסבתא על המסך:\n" + link;
    if (navigator.share) return navigator.share({ title: ST.name, text: text }).catch(function () {});
    sheet(function () { return [el("h2", { text: "👨‍👩‍👧 להזמין את המשפחה" }), el("p", { class: "sub", text: "כל מי שמקבל את הקישור יכול לשלוח תמונות וברכות." }),
      el("div", { class: "grid2", style: "margin-top:12px" }, [el("a", { class: "btn", href: "https://wa.me/?text=" + encodeURIComponent(text), target: "_blank", rel: "noopener", text: "💬 בוואטסאפ" }), el("button", { class: "btn ghost", type: "button", text: "📋 להעתיק", onclick: function () { copy(link); } })])]; });
  }
  function copy(t) { try { navigator.clipboard.writeText(t).then(function () { toast("📋 הועתק"); }); } catch (e) { prompt("הקישור:", t); } }
  function settings() {
    var s = ST.set, nm = el("input", { type: "text", maxlength: "40", value: ST.name, "aria-label": "שם המסגרת" });
    var sec = el("select", { "aria-label": "כמה זמן כל תמונה" }, [6, 10, 12, 20, 30, 60].map(function (n) { var o = el("option", { value: String(n), text: n < 60 ? n + " שניות" : "דקה" }); if (n === s.sec) o.selected = true; return o; }));
    var from = el("input", { type: "time", value: s.from, "aria-label": "מתי מחשיך" }), to = el("input", { type: "time", value: s.to, "aria-label": "מתי מאיר" });
    var city = el("select", { "aria-label": "העיר לזמני שבת" }, CITIES.map(function (c) { var o = el("option", { value: c[0], text: c[0] }); if (c[0] === (s.city || CITIES[0][0])) o.selected = true; return o; }));
    var tog = function (k, text) { var i = el("input", { type: "checkbox" }); i.checked = !!s[k]; i.dataset.k = k; return el("label", { class: "tog" }, [el("span", { text: text }), i]); };
    var t1 = tog("clock", "🕰️ שעון ותאריך עברי על המסך"), t2 = tog("night", "🌙 בלילה המסך מחשיך לשעון בלבד"), t3 = tog("shab", "🕯️ מצב שבת: בשבת ובחג בלי אינטרנט ובלי כפתור לב");
    return el("details", { class: "card" }, [el("summary", { style: "font-weight:800;font-size:18px;cursor:pointer", text: "⚙️ הגדרות (רק למי שיצר/ה את המסגרת)" }),
      el("div", { style: "display:grid;gap:12px;margin-top:12px" }, [el("label", { class: "f" }, ["שם המסגרת", nm]), el("label", { class: "f" }, ["כמה זמן כל תמונה", sec]), t1, t2,
        el("div", { class: "grid2" }, [el("label", { class: "f" }, ["מחשיך ב־", from]), el("label", { class: "f" }, ["מאיר ב־", to])]), t3, el("label", { class: "f" }, ["העיר של סבא וסבתא", city]),
        el("button", { class: "btn", type: "button", text: "💾 לשמור", onclick: function () {
          var n = { sec: +sec.value, from: from.value, to: to.value, city: city.value }; [t1, t2, t3].forEach(function (t) { var i = t.querySelector("input"); n[i.dataset.k] = i.checked; });
          api("op", { c: ID, op: "set", own: own(ID), set: n, name: nm.value }).then(function (s2) { ST = s2; S.frames[ID].name = s2.name; save(); drawFamily(); toast("💾 נשמר. המסך יתעדכן בעוד דקה"); }).catch(function () { toast("לא נשמר"); });
        } }),
        el("button", { class: "btn ghost small", type: "button", text: "🗑️ למחוק את המסגרת וכל התמונות", onclick: function () {
          if (!confirm("למחוק את המסגרת וכל התמונות שבה? אי אפשר לבטל.")) return;
          api("op", { c: ID, op: "wipe", own: own(ID) }).then(function () { delete S.frames[ID]; save(); location.hash = ""; toast("המסגרת נמחקה"); }).catch(function () { toast("לא נמחקה"); });
        } })])]);
  }

  // =================================== grandma's screen ===================================
  var SC = { id: null, st: null, q: [], hist: [], cur: null, tm: 0, paused: false, ctlT: 0, wl: null, ac: null, holy: 0 };
  function screen(id) {
    SC.id = id; document.body.classList.add("screen"); $("scr").hidden = false;
    // the last copy kept on the tablet starts the screen at once (and is all it needs on Shabbat); the network refreshes it
    var cached = S.cache && S.cache.id === id ? S.cache.st : null;
    (cached ? Promise.resolve(cached) : load(id)).then(function (st) {
      SC.st = st; keep(st); $("stT").textContent = st.name; document.title = st.name;
      if (st.set.shab) loadHebcal();
      var go = function () { $("start").hidden = true; begin(); };
      $("stGo").onclick = function () { try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(function () {}); } catch (e) {} unlockAudio(); go(); };
      if (S.seen["_s" + id]) setTimeout(function () { if (!$("start").hidden) go(); }, 6000); // a screen that was started before starts by itself after a power cut
      S.seen["_s" + id] = 1; save();
    }).catch(function () { $("stT").textContent = "לא הצלחנו לטעון את המסגרת"; setTimeout(function () { location.reload(); }, 60000); });
  }
  function keep(st) { S.cache = { id: SC.id, st: st }; save(); }
  function begin() {
    wake(); clock(); setInterval(clock, 10000); setInterval(poll, 60000); setTimeout(poll, 4000);
    // once in a while the screen takes a fresh copy of itself (not at night, not on Shabbat)
    setInterval(function () { if (Date.now() - T0 > 12 * 3600e3 && !isNight() && !SC.holy && (!SC.st.set.shab || window.HB)) location.reload(); }, 600000);
    show(nextItem());
  }
  var T0 = Date.now();
  function sec() { return (SC.st.set.sec || 12) * 1000; }
  function playlist() { // newer things come up more often; nothing twice in a row
    var now = Date.now(), list = [];
    SC.st.items.forEach(function (x) { var w = now - x.at < 2 * 864e5 ? 3 : now - x.at < 14 * 864e5 ? 2 : 1; for (var i = 0; i < w; i++) list.push(x); });
    for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t; }
    return list.filter(function (x, k) { return !k || list[k - 1].id !== x.id; });
  }
  function nextItem() { // the next in line that was not on the screen a moment ago
    var n = SC.st.items.length; if (!n) return null; if (!SC.q.length) SC.q = playlist();
    var recent = SC.hist.slice(-Math.min(n - 1, 6)).map(function (x) { return x.id; }).concat(SC.cur ? [SC.cur.id] : []);
    for (var i = 0; i < SC.q.length; i++) if (recent.indexOf(SC.q[i].id) < 0) return SC.q.splice(i, 1)[0];
    var x = SC.q.shift(); if (!SC.q.length) SC.q = playlist(); return x;
  }
  function schedule() { clearTimeout(SC.tm); if (!SC.paused) SC.tm = setTimeout(function () { show(nextItem()); }, sec()); }
  function show(x, back) {
    if (!back && SC.cur) { SC.hist.push(SC.cur); if (SC.hist.length > 30) SC.hist.shift(); }
    SC.cur = x; var box = $("layers"), L;
    if (!x) {
      L = el("div", { class: "layer" }, [el("div", { class: "welcome" }, [el("div", null, [el("h2", { text: "המסגרת מוכנה 💛" }), el("p", { text: "ממתינים לתמונה הראשונה. סורקים כדי לשלוח:" }), qrSvg(ORIGIN + "#f=" + SC.id)])])]);
    } else if (x.kind === "text") {
      L = el("div", { class: "layer bg-" + x.bg }, [el("div", { class: "card2" }, [el("p", null, [x.cap, el("small", { text: "💌 " + x.from + " · " + ago(x.at) })])])]);
    } else {
      var sr = innerWidth / innerHeight, ar = (x.w || 4) / (x.h || 3), close = Math.abs(Math.log(ar / sr)) < 0.38, r = function (a, b) { return a + Math.random() * (b - a); };
      var ph = el("img", { class: "ph", alt: x.cap || "", src: imgURL(SC.id, x.id) });
      var vars = "--dur:" + (sec() / 1000 + 3) + "s;--fit:" + (close ? "cover" : "contain") + ";--s0:" + r(1, 1.04).toFixed(3) + ";--s1:" + (close ? r(1.1, 1.17) : r(1.03, 1.07)).toFixed(3) +
        ";--x0:" + r(-1.5, 1.5).toFixed(2) + "%;--y0:" + r(-1.5, 1.5).toFixed(2) + "%;--x1:" + r(-3, 3).toFixed(2) + "%;--y1:" + r(-2.5, 2.5).toFixed(2) + "%;--ox:" + r(30, 70).toFixed(0) + "%;--oy:" + r(30, 70).toFixed(0) + "%";
      if (RM) vars += ";animation:none";
      ph.setAttribute("style", vars);
      L = el("div", { class: "layer" }, [close ? null : el("img", { class: "blur", alt: "", src: imgURL(SC.id, x.id) }), ph,
        el("div", { class: "cap" }, [el("b", { text: x.from }), el("span", { text: " · " + ago(x.at) }), x.cap ? el("div", { text: x.cap }) : null])]);
    }
    if (x && Date.now() - x.at < 864e5 && !S.seen[x.id]) { L.append(el("div", { class: "ribbon", text: "✨ חדש מ" + (x.from || "המשפחה") })); S.seen[x.id] = 1; save(); }
    box.append(L);
    if (!x) { requestAnimationFrame(function () { L.classList.add("on"); [].slice.call(box.children).forEach(function (o) { if (o !== L) o.remove(); }); }); return; }
    var reveal = function () { requestAnimationFrame(function () { L.classList.add("on"); [].slice.call(box.children).forEach(function (o) { if (o !== L) { o.classList.remove("on"); setTimeout(function () { o.remove(); }, 2000); } }); }); };
    var im = L.querySelector(".ph"); if (im && !im.complete) { var done = false, f = function () { if (!done) { done = true; reveal(); } }; im.onload = f; im.onerror = f; setTimeout(f, 8000); } else reveal();
    schedule();
    // the photo after this one starts loading now
    var n = SC.q[0]; if (n && n.kind === "img") { var pre = new Image(); pre.src = imgURL(SC.id, n.id); }
  }
  function poll() {
    if (SC.holy || isNight() || SC.st.set.shab && !window.HB) return;
    api("state", null, "?c=" + SC.id + "&since=" + (SC.st.at || 0)).then(function (s) {
      if (s.same) return; var known = {}; SC.st.items.forEach(function (x) { known[x.id] = 1; });
      var fresh = s.items.filter(function (x) { return !known[x.id]; });
      var wasEmpty = !SC.st.items.length; SC.st = s; keep(s); if (s.set.shab) loadHebcal();
      SC.q = SC.q.filter(function (x) { return s.items.some(function (y) { return y.id === x.id; }); });
      if (fresh.length) { SC.q = fresh.reverse().concat(SC.q); chime(); if (wasEmpty || !SC.paused) show(nextItem()); }
    }).catch(function () {});
  }
  // touching the screen shows the buttons for a few seconds
  $("scr").addEventListener("pointerdown", function (e) { if (e.target.closest("#ctl") || !$("start").hidden) return; showCtl(); });
  function showCtl() { var s = $("scr"); s.classList.add("ctl"); $("cLike").hidden = !!SC.holy; clearTimeout(SC.ctlT); SC.ctlT = setTimeout(function () { s.classList.remove("ctl"); }, 6000); }
  $("cNext").onclick = function () { show(nextItem()); showCtl(); };
  $("cPrev").onclick = function () { var p = SC.hist.pop(); if (p) { if (SC.cur) SC.q.unshift(SC.cur); show(p, true); } showCtl(); };
  $("cPause").onclick = function () { SC.paused = !SC.paused; $("cPause").textContent = SC.paused ? "▶" : "⏸"; $("cPause").setAttribute("aria-label", SC.paused ? "להמשיך" : "עצירה"); if (SC.paused) clearTimeout(SC.tm); else schedule(); showCtl(); };
  $("cFull").onclick = function () { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) {} showCtl(); };
  $("cLike").onclick = function () {
    var x = SC.cur; if (!x || SC.holy) return; var h = $("heart"); h.classList.remove("go"); void h.offsetWidth; h.classList.add("go"); chime(1);
    api("op", { c: SC.id, op: "like", id: x.id }).then(function (j) { x.likes = j.likes; }).catch(function () {}); showCtl();
  };
  function wake() {
    try { if (navigator.wakeLock && !SC.wl) navigator.wakeLock.request("screen").then(function (l) { SC.wl = l; l.addEventListener("release", function () { SC.wl = null; }); }).catch(function () {}); } catch (e) {}
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden && SC.id) wake(); });
  function unlockAudio() { try { SC.ac = SC.ac || new (window.AudioContext || window.webkitAudioContext)(); if (SC.ac.state === "suspended") SC.ac.resume(); } catch (e) {} }
  function chime(love) {
    var a = SC.ac; if (!a || isNight() || SC.holy) return;
    var t = a.currentTime; (love ? [76, 83] : [72, 79, 84]).forEach(function (m, i) { var o = a.createOscillator(), g = a.createGain(); o.frequency.value = 440 * Math.pow(2, (m - 69) / 12); g.gain.setValueAtTime(0.0001, t + i * 0.14); g.gain.linearRampToValueAtTime(0.06, t + i * 0.14 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.14 + 1.4); o.connect(g); g.connect(a.destination); o.start(t + i * 0.14); o.stop(t + i * 0.14 + 1.5); });
  }
  // the clock, the Hebrew date, night and Shabbat
  function gem(n) { var o = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"], t = ["", "י", "כ", "ל"]; if (n === 15) return "ט״ו"; if (n === 16) return "ט״ז"; var s = t[Math.floor(n / 10)] + o[n % 10]; return s.length > 1 ? s.slice(0, -1) + "״" + s.slice(-1) : s + "׳"; }
  function hebDate(d) { try { var p = new Intl.DateTimeFormat("he-u-ca-hebrew", { day: "numeric", month: "long" }).formatToParts(d), day = 0, mon = ""; p.forEach(function (x) { if (x.type === "day") day = +x.value; if (x.type === "month") mon = x.value; }); return gem(day) + " ב" + mon; } catch (e) { return ""; } }
  function hm(d) { return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function mins(s) { var p = s.split(":"); return +p[0] * 60 + +p[1]; }
  function isNight() { var s = SC.st && SC.st.set; if (!s || !s.night) return false; var d = new Date(), m = d.getHours() * 60 + d.getMinutes(), a = mins(s.from), b = mins(s.to); return a > b ? m >= a || m < b : m >= a && m < b; }
  function clock() {
    var d = new Date(), s = SC.st.set;
    $("ckT").textContent = hm(d); $("ckD").textContent = d.toLocaleDateString("he-IL", { weekday: "long" }) + " · " + hebDate(d); $("clock").style.opacity = s.clock ? "1" : "0";
    $("nT").textContent = hm(d);
    var n = isNight(), nl = $("night"); if (n !== nl.classList.contains("on")) { nl.classList.toggle("on", n); if (n) { clearTimeout(SC.tm); } else { schedule(); poll(); } }
    SC.holy = s.shab ? holyEnd(Date.now()) : 0; $("shabB").hidden = !SC.holy;
    if (SC.holy) $("shabB").textContent = new Date(SC.holy).getDay() === 6 ? "🕯️ שבת שלום" : "🕯️ חג שמח";
  }
  var HBL = false;
  function loadHebcal() { if (HBL || window.HB) return; HBL = true; var s = document.createElement("script"); s.src = "/hebcal.js?v=@HEBV@"; document.head.append(s); }
  function place() { var c = SC.st && CITIES.filter(function (x) { return x[0] === SC.st.set.city; })[0] || CITIES[0]; return { name: c[0], lat: c[1], lon: c[2], b: c[3] }; }
  function zOn(d) { var p = place(); return new HB.Zmanim(new HB.Location(p.lat, p.lon, true, "Asia/Jerusalem", p.name, "IL"), d, false); }
  var YT = { "7-1": 1, "7-2": 1, "7-10": 1, "7-15": 1, "7-22": 1, "1-15": 1, "1-21": 1, "3-6": 1 };
  function holy(d) { if (d.getDay() === 6) return true; try { var h = new HB.HDate(d); return !!YT[h.getMonth() + "-" + h.getDate()]; } catch (e) { return false; } }
  function holyEnd(t) {
    if (!window.HB) return 0;
    var day = new Date(t); day.setHours(12, 0, 0, 0);
    var start = function (d) { var e = new Date(d.getTime() - 864e5); return zOn(e).shkiah().getTime() - place().b * 6e4; };
    var end = function (d) { return zOn(d).tzeit(8.5).getTime(); };
    for (var i = -1; i <= 1; i++) {
      var d = new Date(day.getTime() + i * 864e5); if (!holy(d)) continue;
      var a = d, z = d; while (holy(new Date(a.getTime() - 864e5))) a = new Date(a.getTime() - 864e5); while (holy(new Date(z.getTime() + 864e5))) z = new Date(z.getTime() + 864e5);
      if (t >= start(a) && t < end(z)) return end(z);
    }
    return 0;
  }

  route();
  if ("serviceWorker" in navigator) addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
})();
