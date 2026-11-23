// HaniaParty (party.hania360.com): the big screen and the phones. Inlined into party.html by party/build.py.
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function el(t, a, kids) { var e = document.createElement(t); for (var k in a || {}) { if (k === "text") e.textContent = a[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), a[k]); else if (a[k] != null && a[k] !== false) e.setAttribute(k, a[k] === true ? "" : a[k]); } (kids || []).forEach(function (c) { if (c != null && c !== false) e.append(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
  var LS = "party-v1", S = (function () { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } })();
  S.pids = S.pids || {}; if (S.shab == null) S.shab = true;
  function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }
  var EMOJI = ["🦊", "🐼", "🐸", "🦁", "🐙", "🦄", "🐝", "🐧", "🦖", "🐢", "🦉", "🐳", "🐯", "🐨", "🦜", "🐹"];
  var GAMES = { draw: ["🎨", "מציירים ומנחשים", "אחד מצייר בטלפון, הציור מופיע כאן בזמן אמת, וכולם מנחשים מהטלפון.", "#FF5E7E", 2], bluff: ["🤥", "בלוף", "עובדה אמיתית עם מילה חסרה. כל אחד ממציא סוף מבלבל, ואז מחפשים את האמת.", "#FFC93D", 2], vote: ["🗳️", "מי במשפחה הכי...", "שאלה מצחיקה, וכולם מצביעים מהטלפון. מי שבחר כמו הרוב מקבל נקודות.", "#4DA3FF", 3] };
  var toastT = 0, OFF = 0;
  function toast(t) { var x = $("toast"); x.textContent = t; x.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { x.classList.remove("on"); }, 2600); }
  function now() { return Date.now() + OFF; }
  function wsURL(q) { return (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/api/party/ws?" + q; }
  function sock(url, onmsg, onstate) {
    var ws = null, tries = 0, alive = true, opened = false, pingT = 0, api = { opened: function () { return opened; }, fails: 0 };
    function open() {
      try { ws = new WebSocket(url); } catch (e) { return retry(); }
      ws.onopen = function () { tries = 0; opened = true; api.fails = 0; onstate && onstate(true); clearInterval(pingT); pingT = setInterval(function () { api.send({ t: "ping" }); }, 25000); };
      ws.onmessage = function (e) { var m; try { m = JSON.parse(e.data); } catch (x) { return; } if (m.now) OFF = m.now - Date.now(); onmsg(m); };
      ws.onclose = function () { clearInterval(pingT); if (!opened) api.fails++; opened = false; onstate && onstate(false); retry(); };
    }
    function retry() { if (alive) setTimeout(open, Math.min(8000, 500 * Math.pow(2, tries++))); }
    api.send = function (o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
    api.close = function () { alive = false; try { ws.close(); } catch (e) {} };
    open(); return api;
  }
  function av(p, cls) { return el("span", { class: cls || "av", style: "--pc:" + (p.color || "#A66BFF"), text: p.emoji || "🙂" }); }
  function qrSvg(text) { try { var q = qrcode(0, "M"); q.addData(text); q.make(); var d = el("div", { class: "qr" }); d.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); return d; } catch (e) { return null; } }
  function left(v) { return Math.max(0, (v && v.endsAt ? v.endsAt - now() : 0) / 1000); }
  function qText(q) { var parts = String(q || "").split("___"); return el("div", { class: "q" }, parts.length > 1 ? [parts[0], el("span", { class: "blank", text: "?" }), parts[1]] : [q]); }

  // ---------- sound on the big screen ----------
  var AC = null, MUTE = false;
  function ac() { if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} if (AC && AC.state === "suspended") AC.resume(); return AC; }
  function beep(notes, type, len, vol) {
    var a = AC; if (!a || MUTE) return; var t = a.currentTime;
    notes.forEach(function (m, i) { var o = a.createOscillator(), g = a.createGain(); o.type = type || "triangle"; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12); g.gain.setValueAtTime(0.0001, t + i * 0.09); g.gain.linearRampToValueAtTime(vol || 0.12, t + i * 0.09 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + (len || 0.35)); o.connect(g); g.connect(a.destination); o.start(t + i * 0.09); o.stop(t + i * 0.09 + (len || 0.35) + 0.05); });
  }
  var SND = { join: function () { beep([72, 79], "sine", 0.3); }, hit: function () { beep([76, 79, 84], "triangle", 0.4); }, tick: function () { beep([88], "square", 0.06, 0.04); }, show: function () { beep([67, 72, 76, 79, 84], "triangle", 0.5, 0.1); }, start: function () { beep([60, 64, 67, 72], "sawtooth", 0.25, 0.05); } };
  function confetti() {
    var c = el("canvas", { class: "conf" }), W = c.width = innerWidth, H = c.height = innerHeight, x = c.getContext("2d"), P = [];
    document.body.append(c);
    for (var i = 0; i < 160; i++) P.push({ x: W / 2 + (Math.random() - 0.5) * W * 0.4, y: H * 0.35, vx: (Math.random() - 0.5) * 16, vy: -6 - Math.random() * 12, r: 5 + Math.random() * 6, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, c: ["#FFC93D", "#FF5E7E", "#3DD68C", "#4DA3FF", "#A66BFF", "#fff"][i % 6] });
    var t0 = performance.now();
    (function f(t) { var k = (t - t0) / 3000; x.clearRect(0, 0, W, H); P.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.a += p.va; x.save(); x.globalAlpha = Math.max(0, 1 - k); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8); x.restore(); }); if (k < 1) requestAnimationFrame(f); else c.remove(); })(t0);
  }

  // =================================== home ===================================
  function home() {
    show("home");
    var code = el("input", { type: "text", inputmode: "numeric", maxlength: "4", placeholder: "הקוד מהמסך", "aria-label": "קוד החדר", style: "text-align:center;letter-spacing:.3em;font-size:28px;max-width:260px" });
    $("home").replaceChildren(
      el("div", { class: "hero" }, [el("h1", { text: "מסיבה במסך הגדול" }), el("p", { class: "muted", text: "הטלוויזיה או המחשב הם הלוח, וכל טלפון הוא שלט. בלי הורדות, בלי הרשמה, מ־2 עד 16 משתתפים." }),
        el("div", { style: "display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:10px" }, [
          el("a", { class: "btn", href: "#host", text: "🖥️ לפתוח משחק במסך הגדול" }),
          el("form", { style: "display:flex;gap:8px", onsubmit: function (e) { e.preventDefault(); if (/^\d{4}$/.test(code.value)) location.hash = "j=" + code.value; else toast("4 ספרות מהמסך הגדול"); } }, [code, el("button", { class: "btn mint", type: "submit", text: "📱 להצטרף" })])])]),
      el("div", { class: "cards3" }, Object.keys(GAMES).map(function (k) { var g = GAMES[k]; return el("div", { class: "gcard glass", style: "--c:" + g[3] }, [el("span", { class: "e", text: g[0] }), el("h3", { text: g[1] }), el("p", { text: g[2] })]); })),
      el("p", { class: "muted", style: "text-align:center;margin-top:26px", text: "רוצים חידון טריוויה? יש לנו גם את HaniaQuiz: quiz.hania360.com" }));
  }
  function show(id) { ["home", "host", "phone"].forEach(function (x) { $(x).hidden = x !== id; }); }

  // =================================== the big screen ===================================
  var H = { v: null, sock: null, key: "", ink: [], last: {}, cv: null, g: null, feed: null, ticked: -1 };
  function host() {
    show("host"); ac();
    var s = S.host;
    if (s && Date.now() - s.at < 7.5 * 3600e3) return connectHost(s);
    $("host").replaceChildren(el("div", { class: "main", style: "min-height:80vh" }, [el("h2", { class: "title", text: "פותחים חדר…" })]));
    fetch("/api/party/new", { method: "POST" }).then(function (r) { return r.json(); }).then(function (j) { if (!j.code) throw 0; S.host = { code: j.code, key: j.hostKey, at: Date.now() }; save(); connectHost(S.host); })
      .catch(function () { $("host").replaceChildren(el("div", { class: "main" }, [el("h2", { text: "לא הצלחנו לפתוח חדר" }), el("button", { class: "btn", type: "button", text: "לנסות שוב", onclick: host })])); });
  }
  function connectHost(s) {
    if (H.sock) H.sock.close();
    H.code = s.code; H.key = "";
    H.sock = sock(wsURL("code=" + s.code + "&role=host&key=" + encodeURIComponent(s.key)), onHost, function (on) { if (!on && H.sock && H.sock.fails >= 2) { H.sock.close(); S.host = null; save(); host(); } });
  }
  function onHost(m) {
    if (m.t === "view") { var prev = H.v; H.v = m; drawHost(prev); return; }
    if (m.t === "ink") return applyInk(m);
    if (m.t === "hit") { var p = player(m.id); SND.hit(); confetti(); feed((p ? p.emoji + " " + p.name : "") + " ניחש/ה! +" + m.pts, true); return; }
    if (m.t === "try") { var q = player(m.id); feed((q ? q.emoji + " " : "") + m.text); return; }
    if (m.t === "joined") return SND.join();
    if (m.t === "react") { var r = player(m.id); var x = el("span", { class: "react", text: m.e, style: "left:" + (10 + Math.random() * 80) + "%;filter:drop-shadow(0 0 12px " + (r ? r.color : "#fff") + ")" }); document.body.append(x); setTimeout(function () { x.remove(); }, 3100); return; }
    if (m.t === "error") toast(m.e === "need3" ? "צריך לפחות 3 משתתפים מחוברים" : m.e === "need2" ? "צריך לפחות 2 משתתפים מחוברים" : "משהו השתבש");
  }
  function player(id) { return H.v && H.v.players.filter(function (p) { return p.id === id; })[0]; }
  function hsend(o) { ac(); H.sock && H.sock.send(o); }
  function drawHost(prev) {
    var v = H.v, key = v.phase + "|" + (v.round || 0) + "|" + (v.game || "");
    var keep = prev && H.key === key;
    H.key = key;
    if (!keep) {
      var bar = el("div", { class: "hbar" }, [el("div", { class: "code" }, ["party.hania360.com · קוד ", el("b", { text: H.code })]), el("div", { class: "muted", text: v.game ? GAMES[v.game][0] + " " + GAMES[v.game][1] + (v.rounds ? " · סיבוב " + v.round + " מתוך " + v.rounds : "") : "" })]);
      var main = el("div", { class: "main", id: "hmain" }), side = el("div", { class: "side glass", id: "hside" });
      var showSide = !(v.phase === "lobby" || v.phase === "board");
      $("host").replaceChildren(bar, el("div", { class: "stage", style: showSide ? "" : "grid-template-columns:1fr" }, [main, showSide ? side : null]), controls());
      if (v.phase === "lobby" || v.phase === "board") main.classList.add("top");
      buildMain(main, v);
      if (v.phase !== "lobby" && v.phase !== "board" && prev && prev.phase !== v.phase) SND.start();
    }
    updSide(); updLive(v);
  }
  function controls() {
    var v = H.v, inGame = v.phase !== "lobby" && v.phase !== "board";
    return el("div", { class: "hctl" }, inGame ? [el("button", { class: "btn ghost small", type: "button", text: "⏭ לדלג", onclick: function () { hsend({ t: "skip" }); } }), el("button", { class: "btn ghost small", type: "button", text: "⏹ לסיים את המשחק", onclick: function () { hsend({ t: "stop" }); } }), mute()]
      : [v.phase === "board" ? el("button", { class: "btn ghost small", type: "button", text: "🏠 ללובי", onclick: function () { hsend({ t: "lobby" }); } }) : null, el("button", { class: "btn ghost small", type: "button", text: "🔄 ניקוד מאפס", onclick: function () { hsend({ t: "zero" }); } }), mute(),
        el("button", { class: "btn ghost small", type: "button", text: "🚪 חדר חדש", onclick: function () { if (confirm("לפתוח חדר חדש? כולם יצטרכו להצטרף שוב.")) { S.host = null; save(); host(); } } })]);
  }
  function mute() { return el("button", { class: "btn ghost small", type: "button", text: MUTE ? "🔇" : "🔊", "aria-label": "צלילים", onclick: function (e) { MUTE = !MUTE; e.currentTarget.textContent = MUTE ? "🔇" : "🔊"; } }); }
  function updSide() {
    var side = $("hside"); if (!side) return; var v = H.v;
    var list = v.players.slice().sort(function (a, b) { return b.score - a.score; });
    side.replaceChildren.apply(side, [el("h3", { style: "font-size:20px;margin:0 0 6px", text: "🏆 ניקוד" })].concat(list.map(function (p) {
      return el("div", { class: "pl" + (p.on ? "" : " off") + (p.done ? " done" : ""), style: "--pc:" + p.color }, [av(p), el("b", { text: p.name + (v.drawer === p.id && v.game === "draw" ? " ✏️" : "") }), el("span", { class: p.done ? "ok" : "sc", text: p.done && v.phase !== "drawEnd" ? "✓" : String(p.score) })]);
    })));
  }
  function picker() {
    var n = H.v.players.filter(function (p) { return p.on; }).length;
    return el("div", { class: "picker", id: "picker", "data-n": String(n) }, Object.keys(GAMES).map(function (k) { var g = GAMES[k], ok = n >= g[4];
      return el("div", { class: "gcard glass", style: "--c:" + g[3] }, [el("span", { class: "e", text: g[0] }), el("h3", { text: g[1] }), el("p", { text: g[2] }),
        el("button", { class: "btn", type: "button", disabled: !ok, text: ok ? "▶ להתחיל" : "צריך " + g[4] + " משתתפים", onclick: function () { ac(); hsend({ t: "start", game: k, rounds: k === "bluff" ? 5 : 6 }); } })]); }));
  }
  function ring() { return el("div", { class: "ring", id: "ring" }, [svgRing(), el("b", { id: "ringT" })]); }
  function svgRing() { var d = document.createElementNS("http://www.w3.org/2000/svg", "svg"); d.setAttribute("width", "86"); d.setAttribute("height", "86"); d.innerHTML = '<circle cx="43" cy="43" r="38" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="8"/><circle id="ringC" cx="43" cy="43" r="38" fill="none" stroke="#FFC93D" stroke-width="8" stroke-linecap="round" stroke-dasharray="238.8" stroke-dashoffset="0"/>'; return d; }
  function buildMain(main, v) {
    var P = function (id) { return player(id) || { name: "", emoji: "🙂" }; };
    if (v.phase === "lobby") {
      var url = location.origin + "/#j=" + H.code;
      main.append(el("div", { class: "lobby" }, [
        el("div", { class: "join glass" }, [el("h2", { style: "font-size:26px", text: "📱 מצטרפים מהטלפון" }), el("div", { class: "jrow" }, [qrSvg(url), el("div", null, [el("div", { class: "url", text: "party.hania360.com" }), el("div", { class: "muted", text: "והקוד:" }), el("div", { class: "big", text: H.code })])])]),
        el("div", { style: "display:grid;gap:12px" }, [el("h2", { class: "title", id: "crowdT", style: "font-size:clamp(26px,3vw,40px)" }), el("div", { class: "crowd", id: "crowd" })])]), el("h2", { style: "font-size:24px;margin-top:4px", text: "מה משחקים?" }), picker());
    } else if (v.phase === "board") {
      main.append(el("h2", { class: "title", text: "🏆 הניקוד" }), el("div", { class: "board", id: "board" }), el("h2", { style: "font-size:26px;margin-top:16px", text: "משחקים עוד?" }), picker());
      setTimeout(function () { SND.show(); confetti(); }, 300);
    } else if (v.phase === "choose") {
      var d = P(v.drawer); main.append(el("div", { class: "pencil", text: "✏️" }), el("h2", { class: "title" }, [av(d, "av"), " " + d.name + " בוחר/ת מילה…"]), el("p", { class: "muted", style: "font-size:22px", text: "כל השאר: להתכונן לנחש מהטלפון!" }));
    } else if (v.phase === "draw" || v.phase === "drawEnd") {
      var paper = el("div", { class: "paper" }, [el("canvas", { width: "1600", height: "1200", id: "hcv" }), el("div", { class: "feedfloat", id: "feed" })]);
      main.append(el("div", { style: "display:flex;gap:20px;align-items:center;justify-content:center;flex-wrap:wrap" }, [v.phase === "draw" ? ring() : null, el("div", { class: "mask", id: "mask" })]), paper);
      if (v.phase === "drawEnd") { main.append(el("p", { style: "font-size:24px;margin:0", text: (v.got && v.got.length ? "ניחשו: " + v.got.map(function (x) { var p = P(x.id); return p.emoji + " " + p.name + " (+" + x.p + ")"; }).join(" · ") : "הפעם אף אחד לא ניחש 🙈") + (v.drawerGain ? " · ✏️ " + P(v.drawer).name + " +" + v.drawerGain : "") })); SND.show(); }
      H.cv = $("hcv"); H.g = H.cv.getContext("2d"); H.ink = JSON.parse(JSON.stringify(v.ink || [])); redraw();
    } else if (v.phase === "write") {
      main.append(ring(), qText(v.q), el("p", { class: "muted", style: "font-size:24px", text: "✍️ כל אחד כותב בטלפון סוף מבלבל, שייראה אמיתי" }));
    } else if (v.phase === "pick") {
      main.append(ring(), qText(v.q), el("div", { class: "opts" }, v.options.map(function (o) { return el("div", { class: "opt", text: o.text }); })), el("p", { class: "muted", style: "font-size:22px", text: "🔎 מה האמת? בוחרים בטלפון" }));
    } else if (v.phase === "bluffShow") {
      var cards = v.reveal.map(function (o) { return el("div", { class: "opt", "data-i": String(o.i) }, [o.text]); });
      main.append(qText(v.q), el("div", { class: "opts" }, cards));
      // one by one: the fakes first, the truth last
      var order = v.reveal.filter(function (o) { return !o.truth; }).concat(v.reveal.filter(function (o) { return o.truth; }));
      order.forEach(function (o, k) { setTimeout(function () {
        var c = cards[v.reveal.indexOf(o)]; if (!c || !document.body.contains(c)) return;
        cards.forEach(function (x) { x.classList.remove("lit"); }); c.classList.add(o.truth ? "truth" : "fake");
        if (o.pickers.length) c.append(el("div", { class: "who" }, o.pickers.map(function (id) { var p = P(id); return el("span", { style: "--pc:" + p.color, text: p.emoji, title: p.name }); })));
        c.append(el("span", { class: "tag", text: o.truth ? "✅ האמת!" + (o.pickers.length ? " +100" : "") : "🤥 בלוף של " + o.by.map(function (id) { return P(id).name; }).join(" ו") + (o.pickers.length ? " · +" + 50 * o.pickers.length : "") }));
        if (o.truth) { SND.hit(); if (o.pickers.length) confetti(); } else SND.tick();
      }, 900 + k * 1500); });
    } else if (v.phase === "vote") {
      main.append(ring(), el("div", { class: "q", text: v.q }), el("div", { class: "crowd", id: "crowd" }), el("p", { class: "muted", style: "font-size:22px", text: "🗳️ מצביעים בטלפון" }));
    } else if (v.phase === "voteShow") {
      var list = v.players.slice().sort(function (a, b) { return (v.counts[b.id] || 0) - (v.counts[a.id] || 0); }), max = Math.max.apply(null, list.map(function (p) { return v.counts[p.id] || 0; }).concat([1]));
      main.append(el("div", { class: "q", text: v.q }), el("div", { class: "vbars" }, list.map(function (p) { var n = v.counts[p.id] || 0;
        return el("div", { class: "vb", style: "--pc:" + p.color }, [el("span", { class: "av" }, [p.emoji, v.top.indexOf(p.id) >= 0 ? el("span", { class: "crown", text: "👑" }) : null]), el("div", { style: "display:grid;gap:4px;text-align:start" }, [el("span", { text: p.name }), el("div", { class: "track" }, [el("b", { "data-w": String(Math.round(n / max * 100)) })])]), el("span", { text: String(n) })]); })));
      setTimeout(function () { document.querySelectorAll(".vb .track b").forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; }); SND.show(); }, 200);
    }
  }
  function updLive(v) {
    var pk = $("picker"); if (pk && +pk.dataset.n !== v.players.filter(function (p) { return p.on; }).length) pk.replaceWith(picker());
    var crowd = $("crowd"), ct = $("crowdT"); if (ct) ct.textContent = v.players.length ? "מי כבר כאן (" + v.players.length + ")" : "מחכים למשתתפים…";
    if (crowd) {
      var have = {}; [].forEach.call(crowd.children, function (c) { have[c.dataset.id] = c; });
      v.players.forEach(function (p, i) {
        var c = have[p.id]; if (!c) { c = el("div", { class: "pop", "data-id": p.id, style: "--pc:" + p.color + ";--dl:" + (i * 0.2) + "s" }, [el("span", { class: "av", text: p.emoji }), el("b", { text: p.name })]); crowd.append(c); }
        c.style.opacity = p.on ? "1" : ".4"; var b = c.querySelector("b"); b.textContent = p.name + (v.phase === "vote" && p.done ? " ✓" : "");
        delete have[p.id];
      });
      Object.keys(have).forEach(function (k) { have[k].remove(); });
    }
    var mask = $("mask");
    if (mask && (v.mask || v.word)) { var w = v.phase === "drawEnd" ? v.word : v.mask, tiles = w.split("").map(function (ch) { return ch === " " ? el("i", { class: "sp" }) : el("i", { class: ch !== "_" ? "on" : "", text: ch === "_" ? "" : ch }); }); mask.replaceChildren.apply(mask, tiles); }
    var board = $("board");
    if (board && !board.children.length) {
      var list = v.players.slice().sort(function (a, b) { return b.score - a.score; });
      list.forEach(function (p, i) { board.append(el("div", { class: "brow" + (i === 0 && p.score ? " first" : ""), style: "--pc:" + p.color + ";--dl:" + (list.length - i) * 0.15 + "s" }, [el("span", { class: "rk", text: i === 0 && p.score ? "👑" : String(i + 1) }), el("span", { class: "av", text: p.emoji }), el("b", { text: p.name }), el("span", null, [el("span", { class: "sc", text: String(p.score) }), v.gains && v.gains[p.id] ? el("span", { class: "gain", text: "+" + v.gains[p.id] }) : null])])); });
    }
  }
  function feed(text, hit) { var f = $("feed"); if (!f) return; var s = el("span", { class: hit ? "hit" : "", text: text }); f.append(s); setTimeout(function () { s.remove(); }, 4000); while (f.children.length > 6) f.firstChild.remove(); }
  // the drawing, on the big screen
  function redraw() {
    var g = H.g; if (!g) return; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#fff"; g.fillRect(0, 0, 1600, 1200); g.setTransform(1.6, 0, 0, 1.6, 0, 0); H.last = {};
    H.ink.forEach(function (st) { if (st.fill) { g.fillStyle = st.c; g.fillRect(0, 0, 1000, 750); } else strokeFrom(st, 0); });
  }
  function strokeFrom(st, from) {
    var g = H.g, p = st.p; g.strokeStyle = st.c; g.fillStyle = st.c; g.lineWidth = st.w; g.lineCap = "round"; g.lineJoin = "round";
    if (p.length === 2 && from === 0) { g.beginPath(); g.arc(p[0], p[1], st.w / 2, 0, Math.PI * 2); g.fill(); return; }
    g.beginPath(); var i0 = Math.max(0, from - 2); g.moveTo(p[i0], p[i0 + 1]); for (var i = i0 + 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke();
  }
  function applyInk(m) {
    if (!H.g) return;
    if (m.op === "begin") { var st = { id: m.id, c: m.c, w: m.w, p: m.p.slice() }; H.ink.push(st); strokeFrom(st, 0); }
    else if (m.op === "add") { var s = H.ink[H.ink.length - 1]; if (!s || s.id !== m.id) return; var from = s.p.length; s.p.push.apply(s.p, m.p); strokeFrom(s, from); }
    else if (m.op === "undo") { H.ink.pop(); redraw(); }
    else if (m.op === "clear") { H.ink = []; redraw(); }
    else if (m.op === "fill") { H.ink.push({ id: -1, c: m.c, w: 0, p: [], fill: 1 }); redraw(); }
  }

  // =================================== the phone ===================================
  var P = { code: "", pid: "", v: null, sock: null, key: "", tries: [], pad: null, sid: 0, buf: [], flushT: 0, color: "#1D1240", size: 8 };
  function phone(code) {
    show("phone"); P.code = code; P.pid = S.pids[code] || (S.pids[code] = Math.random().toString(36).slice(2, 12)); save();
    $("phone").replaceChildren(el("div", { class: "pmain" }, [el("h2", { text: "מתחברים לחדר " + code + "…" })]));
    if (P.sock) P.sock.close();
    P.sock = sock(wsURL("code=" + code + "&role=player&pid=" + P.pid), onPhone, function (on) { if (!on && P.sock && P.sock.fails >= 3) { P.sock.close(); $("phone").replaceChildren(el("div", { class: "pmain" }, [el("h2", { text: "החדר " + code + " לא נמצא 🤔" }), el("p", { class: "muted", text: "בודקים את הקוד על המסך הגדול." }), el("a", { class: "btn", href: "#", text: "להקליד קוד אחר" })])); } });
  }
  function onPhone(m) {
    if (m.t === "view") { var prev = P.v; P.v = m; drawPhone(prev); return; }
    if (m.t === "miss") { P.tries.unshift({ t: m.text, close: m.close }); P.tries = P.tries.slice(0, 8); if (m.close) toast("🔥 כמעט! עוד קצת"); drawTries(); if (navigator.vibrate) navigator.vibrate(40); return; }
    if (m.t === "truth") return toast("זו בדיוק התשובה האמיתית 😄 תמציאו משהו אחר");
    if (m.t === "error") { toast(m.e === "taken" ? "השם הזה כבר תפוס. בחרו שם אחר" : m.e === "full" ? "החדר מלא" : "צריך שם"); if (m.e) joinForm(); return; }
    if (m.t === "kicked") { P.sock.close(); $("phone").replaceChildren(el("div", { class: "pmain" }, [el("h2", { text: "יצאת מהחדר" }), el("a", { class: "btn", href: "#", text: "לדף הבית" })])); }
  }
  function psend(o) { P.sock && P.sock.send(o); }
  function joinForm() {
    var pick = S.emoji || EMOJI[Math.floor(Math.random() * EMOJI.length)], name = el("input", { type: "text", maxlength: "14", value: S.name || "", placeholder: "השם שלך", "aria-label": "השם שלך", style: "text-align:center" });
    var grid = el("div", { class: "emojis" }, EMOJI.map(function (e) { return el("button", { type: "button", "aria-pressed": String(e === pick), text: e, onclick: function (ev) { pick = e; [].forEach.call(grid.children, function (b) { b.setAttribute("aria-pressed", String(b === ev.currentTarget)); }); } }); }));
    $("phone").replaceChildren(el("div", { class: "pbar" }, [el("span", { class: "muted", text: "חדר " + P.code }), el("a", { class: "muted", href: "#", text: "יציאה" })]),
      el("form", { class: "pmain", onsubmit: function (e) { e.preventDefault(); var n = name.value.trim(); if (!n) { name.focus(); return; } S.name = n; S.emoji = pick; save(); psend({ t: "join", name: n, emoji: pick }); } },
        [el("h2", { text: "🎉 מצטרפים למסיבה" }), name, el("p", { class: "muted", style: "margin:0", text: "בוחרים חיה:" }), grid, el("button", { class: "btn", type: "submit", text: "יאללה! 🚀" })]));
    name.focus();
  }
  function drawPhone(prev) {
    var v = P.v;
    if (!v.you) { if (!document.querySelector("#phone form")) joinForm(); if (prev && prev.you) toast("החדר התחיל מחדש. מצטרפים שוב"); return; }
    var key = v.phase + "|" + (v.round || 0) + "|" + (v.game || "") + "|" + (v.drawer === P.pid ? "d" : "") + "|" + (v.solved ? "s" : "") + "|" + (v.mine != null && v.mine !== "" ? "m" : "");
    var me = v.you, keep = P.key === key; P.key = key;
    if (keep) return updPhone();
    if (!prev || prev.phase !== v.phase || prev.round !== v.round) { P.tries = []; if (navigator.vibrate) navigator.vibrate(30); }
    var bar = el("div", { class: "pbar" }, [el("div", { class: "me", style: "--pc:" + me.color }, [el("span", { class: "av", text: me.emoji }), me.name]), el("b", { text: "⭐ " + me.score })]);
    $("phone").replaceChildren(bar, el("div", { class: "pmain", id: "pmain" }, phoneMain(v)));
    updPhone();
  }
  function timerBar() { return el("div", { class: "ptimer" }, [el("b", { id: "pt" })]); }
  function reacts() { return el("div", { class: "reacts" }, ["👏", "😂", "😮", "❤️", "🔥"].map(function (e) { return el("button", { type: "button", text: e, "aria-label": "תגובה " + e, onclick: function () { psend({ t: "react", e: e }); if (navigator.vibrate) navigator.vibrate(15); } }); })); }
  function phoneMain(v) {
    var me = v.you, isDrawer = v.drawer === P.pid, P2 = function (id) { return v.players.filter(function (p) { return p.id === id; })[0] || { name: "", emoji: "🙂", color: "#A66BFF" }; };
    if (v.phase === "lobby" || v.phase === "board") {
      var rank = v.players.slice().sort(function (a, b) { return b.score - a.score; }).findIndex(function (p) { return p.id === P.pid; }) + 1;
      return [el("div", { class: "bigav", style: "--pc:" + me.color, text: me.emoji }), el("h2", { text: v.phase === "board" ? (rank === 1 && me.score ? "👑 את/ה במקום הראשון!" : "מקום " + rank + " מתוך " + v.players.length) : "את/ה בפנים, " + me.name + "!" }),
        el("p", { class: "muted", text: v.phase === "board" ? "⭐ " + me.score + " נקודות · מחכים למשחק הבא" : "מסתכלים על המסך הגדול. המשחק מתחיל בקרוב" }), reacts()];
    }
    if (v.phase === "choose") return isDrawer ? [el("h2", { text: "✏️ תורך לצייר! בוחרים מילה:" }), el("div", { class: "choices" }, (v.options || []).map(function (w, i) { return el("button", { class: "btn " + ["", "mint", "sky"][i], type: "button", text: w, onclick: function () { psend({ t: "choose", i: i }); } }); })), timerBar()]
      : [el("div", { class: "pencil", text: "✏️" }), el("h2", { text: P2(v.drawer).name + " בוחר/ת מילה…" }), el("p", { class: "muted", text: "עוד רגע מנחשים!" })];
    if (v.phase === "draw" && isDrawer) return drawPad(v);
    if (v.phase === "draw") {
      if (v.solved) return [el("div", { style: "font-size:70px", text: "🎉" }), el("h2", { text: "ניחשת! זה " + v.word }), el("p", { class: "muted", text: "מחכים לשאר…" }), timerBar(), reacts()];
      var inp = el("input", { type: "text", maxlength: "40", placeholder: "מה זה?", "aria-label": "הניחוש שלך", autocomplete: "off", style: "text-align:center" });
      return [el("p", { class: "muted", style: "margin:0", text: "👀 מסתכלים על המסך ומנחשים" }), el("div", { class: "mask", id: "pmask" }), timerBar(),
        el("form", { style: "display:grid;gap:10px", onsubmit: function (e) { e.preventDefault(); var t = inp.value.trim(); if (t) psend({ t: "guess", text: t }); inp.value = ""; inp.focus(); } }, [inp, el("button", { class: "btn mint", type: "submit", text: "לנחש" })]),
        el("div", { class: "tries", id: "tries" })];
    }
    if (v.phase === "drawEnd") return [el("p", { class: "muted", style: "margin:0", text: "המילה הייתה" }), el("h2", { style: "font-size:40px", text: v.word }), el("p", { text: isDrawer ? "✏️ ציירת יפה! +" + (v.drawerGain || 0) : ((v.got || []).filter(function (x) { return x.id === P.pid; })[0] ? "🎉 ניחשת!" : "בפעם הבאה 💪") }), reacts()];
    if (v.phase === "write") {
      if (v.mine) return [el("div", { style: "font-size:64px", text: "🤫" }), el("h2", { text: "הבלוף שלך: " + v.mine }), el("p", { class: "muted", text: "מחכים לכולם…" }), timerBar()];
      var w = el("input", { type: "text", maxlength: "30", placeholder: "סוף מבלבל…", "aria-label": "הבלוף שלך", autocomplete: "off", style: "text-align:center" });
      return [qText(v.q), timerBar(), el("p", { class: "muted", style: "margin:0", text: "ממציאים סוף שנשמע אמיתי, כדי שאחרים יבחרו בו" }),
        el("form", { style: "display:grid;gap:10px", onsubmit: function (e) { e.preventDefault(); var t = w.value.trim(); if (t) psend({ t: "write", text: t }); } }, [w, el("button", { class: "btn", type: "submit", text: "🤥 לשלוח בלוף" })])];
    }
    if (v.phase === "pick") {
      return [el("p", { class: "muted", style: "margin:0", text: "מה האמת?" }), qText(v.q), timerBar(), el("div", { class: "list" }, v.options.map(function (o) {
        return el("button", { type: "button", disabled: o.own || v.mine != null, "aria-pressed": String(v.mine === o.i), onclick: function () { psend({ t: "pick", i: o.i }); } }, [o.own ? "🤫 " + o.text + " (שלך)" : o.text]); }))];
    }
    if (v.phase === "bluffShow") return [el("div", { style: "font-size:64px", text: "🔎" }), el("h2", { text: "מסתכלים על המסך!" }), el("p", { class: "muted", text: "מי בלף ומי מצא את האמת" }), reacts()];
    if (v.phase === "vote") {
      return [qText(v.q), timerBar(), el("div", { class: "list" }, v.players.map(function (p) {
        return el("button", { type: "button", disabled: !!v.mine, "aria-pressed": String(v.mine === p.id), style: "--pc:" + p.color, onclick: function () { psend({ t: "vote", who: p.id }); } }, [el("span", { class: "av", text: p.emoji }), p.name + (p.id === P.pid ? " (אני)" : "")]); }))];
    }
    if (v.phase === "voteShow") return [el("div", { style: "font-size:64px", text: "👑" }), el("h2", { text: (v.top || []).map(function (id) { return P2(id).name; }).join(" ו") || "תיקו!" }), el("p", { class: "muted", text: "מסתכלים על המסך" }), reacts()];
    return [el("h2", { text: "…" })];
  }
  function updPhone() {
    var v = P.v, m = $("pmask");
    if (m && v.mask) m.replaceChildren.apply(m, v.mask.split("").map(function (ch) { return ch === " " ? el("i", { class: "sp" }) : el("i", { class: ch !== "_" ? "on" : "", text: ch === "_" ? "" : ch }); }));
    var bar = document.querySelector("#phone .pbar b"); if (bar && v.you) bar.textContent = "⭐ " + v.you.score;
    drawTries();
  }
  function drawTries() { var t = $("tries"); if (!t) return; t.replaceChildren.apply(t, P.tries.map(function (x) { return el("span", { class: x.close ? "close" : "", text: x.t }); })); }
  // the drawing pad on the drawer's phone
  function drawPad(v) {
    var cv = el("canvas", { width: "1000", height: "750" }), pad = el("div", { class: "pad" }, [cv]), g = cv.getContext("2d"), strokes = [];
    g.fillStyle = "#fff"; g.fillRect(0, 0, 1000, 750); g.lineCap = "round"; g.lineJoin = "round";
    var COLS = ["#1D1240", "#FF5E7E", "#FF9A3D", "#FFC93D", "#3DD68C", "#4DA3FF", "#A66BFF", "#8B5A2B", "#FFFFFF"], SIZES = [4, 10, 22];
    var redrawPad = function () { g.fillStyle = "#fff"; g.fillRect(0, 0, 1000, 750); strokes.forEach(function (s) { if (s.fill) { g.fillStyle = s.c; g.fillRect(0, 0, 1000, 750); return; } g.strokeStyle = s.c; g.fillStyle = s.c; g.lineWidth = s.w; g.beginPath(); g.moveTo(s.p[0], s.p[1]); if (s.p.length === 2) { g.arc(s.p[0], s.p[1], s.w / 2, 0, 7); g.fill(); return; } for (var i = 2; i < s.p.length; i += 2) g.lineTo(s.p[i], s.p[i + 1]); g.stroke(); }); };
    var cur = null, pos = function (e) { var r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * 1000), Math.round((e.clientY - r.top) / r.height * 750)]; };
    var flush = function () { if (cur && P.buf.length) { psend({ t: "ink", op: "add", id: cur.id, p: P.buf }); P.buf = []; } };
    cv.addEventListener("pointerdown", function (e) { e.preventDefault(); cv.setPointerCapture(e.pointerId); var p = pos(e); cur = { id: ++P.sid, c: P.color, w: P.size, p: p.slice() }; strokes.push(cur); psend({ t: "ink", op: "begin", id: cur.id, c: cur.c, w: cur.w, x: p[0], y: p[1] }); g.fillStyle = cur.c; g.beginPath(); g.arc(p[0], p[1], cur.w / 2, 0, 7); g.fill(); clearInterval(P.flushT); P.flushT = setInterval(flush, 60); });
    cv.addEventListener("pointermove", function (e) { if (!cur) return; var p = pos(e), l = cur.p; var lx = l[l.length - 2], ly = l[l.length - 1]; if (Math.abs(p[0] - lx) + Math.abs(p[1] - ly) < 3) return; g.strokeStyle = cur.c; g.lineWidth = cur.w; g.beginPath(); g.moveTo(lx, ly); g.lineTo(p[0], p[1]); g.stroke(); cur.p.push(p[0], p[1]); P.buf.push(p[0], p[1]); });
    var up = function () { if (!cur) return; flush(); clearInterval(P.flushT); cur = null; };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    var colors = el("div", { class: "tools" }, COLS.map(function (c) { return el("button", { class: "c", type: "button", "aria-label": c === "#FFFFFF" ? "מחק" : "צבע", "aria-pressed": String(c === P.color), style: "background:" + c, onclick: function (e) { P.color = c; [].forEach.call(colors.children, function (b) { b.setAttribute("aria-pressed", String(b === e.currentTarget)); }); } }); }));
    var sizes = el("div", { class: "tools" }, SIZES.map(function (s) { return el("button", { class: "s", type: "button", "aria-label": "עובי " + s, "aria-pressed": String(s === P.size), onclick: function (e) { P.size = s; [].forEach.call(sizes.children, function (b) { b.setAttribute("aria-pressed", String(b === e.currentTarget)); }); } }, [el("i", { style: "width:" + (s / 1.6 + 4) + "px;height:" + (s / 1.6 + 4) + "px" })]); }).concat([
      el("button", { class: "s", type: "button", "aria-label": "ביטול", text: "↩️", onclick: function () { strokes.pop(); redrawPad(); psend({ t: "ink", op: "undo" }); } }),
      el("button", { class: "s", type: "button", "aria-label": "רקע בצבע הנבחר", text: "🪣", onclick: function () { strokes.push({ fill: 1, c: P.color }); redrawPad(); psend({ t: "ink", op: "fill", c: P.color }); } }),
      el("button", { class: "s", type: "button", "aria-label": "לנקות", text: "🗑️", onclick: function () { strokes = []; redrawPad(); psend({ t: "ink", op: "clear" }); } })]));
    return [el("h2", { style: "font-size:22px", text: "✏️ מציירים: " + v.word }), timerBar(), pad, colors, sizes, el("p", { class: "muted", style: "margin:0;font-size:14px", text: "בלי אותיות ובלי מספרים 😉" })];
  }

  // ---------- the clock on both screens ----------
  setInterval(function () {
    var v = H.v && !$("host").hidden ? H.v : P.v && !$("phone").hidden ? P.v : null; if (!v || !v.endsAt) return;
    var total = { choose: 15, draw: 80, drawEnd: 7, write: 50, pick: 30, vote: 25 }[v.phase] || 30, l = left(v), k = Math.max(0, Math.min(1, l / total));
    var rc = $("ringC"), rt = $("ringT"); if (rc) rc.setAttribute("stroke-dashoffset", String(238.8 * (1 - k))); if (rt) { rt.textContent = String(Math.ceil(l)); $("ring").classList.toggle("low", l <= 5 && l > 0); }
    var pt = $("pt"); if (pt) pt.style.transform = "scaleX(" + k + ")";
    if (v === H.v && l <= 5 && l > 0 && Math.ceil(l) !== H.ticked) { H.ticked = Math.ceil(l); SND.tick(); }
  }, 200);

  // ---------- Shabbat and holidays: the app rests, by the town in the site's cookie ----------
  var CITIES = /*CITIES*/[["ירושלים", 31.778, 35.235, 40]];
  function place() { var c = CITIES[0]; try { var cm = document.cookie.match(/(?:^|; *)h360_i=([^;]*)/), co = cm ? JSON.parse(decodeURIComponent(cm[1])) : {}; if (co.c) c = CITIES.filter(function (x) { return x[0] === co.c[0]; })[0] || c; } catch (e) {} return { name: c[0], lat: c[1], lon: c[2], b: c[3] }; }
  function zOn(d) { var p = place(); return new HB.Zmanim(new HB.Location(p.lat, p.lon, true, "Asia/Jerusalem", p.name, "IL"), d, false); }
  var YT = { "7-1": 1, "7-2": 1, "7-10": 1, "7-15": 1, "7-22": 1, "1-15": 1, "1-21": 1, "3-6": 1 };
  function holy(d) { if (d.getDay() === 6) return true; try { var h = new HB.HDate(d); return !!YT[h.getMonth() + "-" + h.getDate()]; } catch (e) { return false; } }
  function holyEnd(t) {
    if (!window.HB) return 0; var day = new Date(t); day.setHours(12, 0, 0, 0);
    var start = function (d) { var e = new Date(d.getTime() - 864e5); return zOn(e).shkiah().getTime() - place().b * 6e4; }, end = function (d) { return zOn(d).tzeit(8.5).getTime(); };
    for (var i = -1; i <= 1; i++) { var d = new Date(day.getTime() + i * 864e5); if (!holy(d)) continue; var a = d, z = d; while (holy(new Date(a.getTime() - 864e5))) a = new Date(a.getTime() - 864e5); while (holy(new Date(z.getTime() + 864e5))) z = new Date(z.getTime() + 864e5); if (t >= start(a) && t < end(z)) return end(z); }
    return 0;
  }
  function checkRest() { var e = S.shab ? holyEnd(Date.now()) : 0, r = $("rest"); r.hidden = !e; if (e) { var d = new Date(e); $("restT").textContent = d.getDay() === 6 ? "שבת שלום" : "חג שמח"; $("restP").textContent = "HaniaParty נחה עכשיו ותחזור ב־" + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); } }
  $("restOff").addEventListener("click", function () { S.shab = false; save(); checkRest(); });
  addEventListener("load", checkRest); setInterval(checkRest, 60000);

  // ---------- routes: #host the big screen, #j=1234 a phone, otherwise home ----------
  function route() { var m = /^#j=(\d{4})$/.exec(location.hash); if (location.hash === "#host") host(); else if (m) phone(m[1]); else { if (P.sock) { P.sock.close(); P.sock = null; } home(); } }
  addEventListener("hashchange", route);
  document.addEventListener("pointerdown", function () { if (!$("host").hidden) ac(); }, { once: false });
  route();
  if ("serviceWorker" in navigator) addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
})();
