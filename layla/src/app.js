// HaniaLayla (layla.hania360.com): the minutes before sleep. Inlined into layla.html by layla/build.py.
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function el(t, a, kids) { var e = document.createElement(t); for (var k in a || {}) { if (k === "text") e.textContent = a[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), a[k]); else if (a[k] != null) e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c != null) e.append(c); }); return e; }
  var TAU = Math.PI * 2, RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- settings: on this phone (and in the account, through the site's backup) ----------
  var KEY = "layla-v1", S = (function () { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  var DEF = { name: "", fam: ["אמא", "אבא", "סבתא", "סבא", "האחים", "הדובי", "החברים"], sound: "rain", timer: 30, vol: 0.7, mvol: 0.55, color: "amber", proj: true, bright: 0.7, voice: false, btone: true, shab: true, city: "" };
  for (var k in DEF) if (S[k] == null) S[k] = DEF[k];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  (function () { var q = new URLSearchParams(location.search), n = (q.get("n") || "").trim().slice(0, 24); if (n) { S.name = n; save(); } if (q.has("n")) try { history.replaceState(null, "", "/"); } catch (e) {} })();
  var toastT = 0;
  function toast(t) { var x = $("toast"); x.textContent = t; x.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { x.classList.remove("on"); }, 2600); }

  // =====================================================================================
  // The night sky
  // =====================================================================================
  var cv = $("scene"), g = cv.getContext("2d"), W = 0, H = 0, DPR = 1, U = 1;
  var SC = { t: 0, dim: 0, dimTo: 0, stars: [], bg: [], clouds: [], flies: [], parts: [], zs: [], bubbles: [], shoot: null, nextShoot: 6, moon: { sleep: 0, yawn: 0, wob: 0, blink: 0 }, house: { on: 1 }, fin: 0, finT: 0, quiet: false, paused: false };
  function rnd(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  var HILLS = [[0.70, 22, 1.3, 2.7, 0.4, 1.9, ["#2B2170", "#1D165A"]], [0.775, 18, 0.9, 2.1, 2.2, 0.7, ["#1B1452", "#130E40"]], [0.86, 15, 1.6, 3.3, 1.1, 2.6, ["#0F0B34", "#090624"]]];
  function hillY(i, x) { var h = HILLS[i]; return H * h[0] + h[1] * U * (Math.sin(x / W * TAU * h[2] + h[4]) * 0.6 + Math.sin(x / W * TAU * h[3] + h[5]) * 0.4); }
  function layout() {
    DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); g.setTransform(DPR, 0, 0, DPR, 0, 0);
    U = Math.max(0.8, Math.min(1.5, Math.min(W, H) / 400));
    var m = SC.moon; m.r = 44 * U; m.x = W < 700 ? W * 0.25 : W * 0.2; m.y = Math.max(m.r + 96, H * 0.2);
    SC.house.x = W * 0.72; SC.house.s = 24 * U; SC.house.y = hillY(1, SC.house.x) + 4 * U;
    SC.tree = { x: W * 0.13, s: 30 * U }; SC.tree.y = hillY(2, SC.tree.x) + 6 * U;
    var r = rnd(5); SC.bg = [];
    for (var i = 0; i < Math.round(170 * Math.min(2, W * H / 340000)); i++) SC.bg.push({ x: r() * W, y: r() * H * 0.74, s: 0.4 + Math.pow(r(), 3) * 1.6, p: r() * TAU, v: 0.6 + r() * 1.6, warm: r() < 0.15 });
    // the stars that get a goodnight: spread out, away from the moon and the top line
    var r2 = rnd(7 + S.fam.length), old = SC.stars, list = S.fam.slice(0, 9), top = Math.max(H * 0.17, 122), bot = Math.min(H * 0.6, hillY(0, W / 2) - 60 * U);
    SC.stars = list.map(function (name, i) {
      var best = null;
      for (var tries = 0; tries < 300; tries++) {
        var R = (30 + r2() * 8) * U, x = W * 0.09 + r2() * W * 0.82, y = top + r2() * Math.max(40, bot - top), ok = Math.hypot(x - m.x, y - m.y) > m.r + R * 2.2;
        for (var j = 0; j < i && ok; j++) { var o = SC.stars_tmp[j]; if (Math.hypot(x - o.x, y - o.y) < (R + o.R) * (tries < 200 ? 1.75 : 1.25)) ok = false; }
        if (ok) { best = { x: x, y: y, R: R }; break; }
        if (!best) best = { x: x, y: y, R: R };
      }
      (SC.stars_tmp = SC.stars_tmp || [])[i] = best;
      var prev = old.filter(function (o) { return o.name === name; })[0];
      return { name: name, x: best.x, y: best.y, R: best.R, ph: r2() * TAU, sleep: prev ? prev.sleep : 0, asleep: prev ? prev.asleep : false, pop: 0, blink: 0, nb: 2 + r2() * 5, wig: 0 };
    });
    SC.stars_tmp = null;
    var r3 = rnd(3); SC.clouds = [0, 1, 2, 3].map(function (i) { return { x: r3() * W, y: H * (0.12 + 0.36 * r3()), s: (40 + r3() * 34) * U, v: (4 + r3() * 7) * U, a: 0.06 + r3() * 0.06 }; });
    var r4 = rnd(9); SC.flies = []; for (i = 0; i < 14; i++) SC.flies.push({ bx: r4() * W, by: hillY(1, r4() * W) - (10 + r4() * 70) * U, p: r4() * TAU, v: 0.2 + r4() * 0.4 });
    need = 1;
  }
  var need = 1;
  addEventListener("resize", layout);

  // sprites: soft glows made once
  var SPR = {};
  function glow(rgb) { if (SPR[rgb]) return SPR[rgb]; var c = document.createElement("canvas"); c.width = c.height = 128; var x = c.getContext("2d"), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(" + rgb + ",.9)"); gr.addColorStop(0.25, "rgba(" + rgb + ",.35)"); gr.addColorStop(1, "rgba(" + rgb + ",0)"); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return SPR[rgb] = c; }

  function drawSky(t) {
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#080420"); gr.addColorStop(0.45, "#1C1260"); gr.addColorStop(0.72, "#3A2A8E"); gr.addColorStop(1, "#5A3EA6");
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // slow clouds of color
    [[0.75, 0.25, 0.55, "123,92,255", 0.13], [0.25, 0.5, 0.45, "255,126,182", 0.08], [0.55, 0.62, 0.5, "79,209,197", 0.06]].forEach(function (b, i) {
      var x = W * b[0] + Math.sin(t * 0.03 + i * 2) * 40 * U, y = H * b[1] + Math.cos(t * 0.025 + i) * 30 * U, r = Math.max(W, H) * b[2], gg = g.createRadialGradient(x, y, 0, x, y, r);
      gg.addColorStop(0, "rgba(" + b[3] + "," + b[4] + ")"); gg.addColorStop(1, "rgba(" + b[3] + ",0)"); g.fillStyle = gg; g.fillRect(0, 0, W, H);
    });
    g.globalCompositeOperation = "lighter";
    SC.bg.forEach(function (s) {
      var a = 0.3 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.v + s.p)); if (RM) a = 0.6;
      if (s.s > 1.3) { g.globalAlpha = a * 0.8; var q = s.s * 7; g.drawImage(glow(s.warm ? "255,220,170" : "220,215,255"), s.x - q / 2, s.y - q / 2, q, q); }
      g.globalAlpha = a; g.fillStyle = s.warm ? "#FFE3B5" : "#EDEBFF"; g.fillRect(s.x - s.s / 2, s.y - s.s / 2, s.s, s.s);
    });
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  }
  function drawShoot(t) {
    if (RM) return;
    if (!SC.shoot && t > SC.nextShoot && !SC.fin) { var a = (200 + Math.random() * 18) * Math.PI / 180; SC.shoot = { x: W * (0.35 + Math.random() * 0.6), y: H * (0.05 + Math.random() * 0.25), vx: Math.cos(a) * 760 * U, vy: -Math.sin(a) * 760 * U, t0: t, d: 0.9 }; SC.nextShoot = t + 14 + Math.random() * 20; }
    var s = SC.shoot; if (!s) return; var k = (t - s.t0) / s.d; if (k > 1) { SC.shoot = null; return; }
    var hx = s.x + s.vx * (t - s.t0), hy = s.y + s.vy * (t - s.t0), len = 130 * U * Math.sin(Math.PI * Math.min(1, k * 1.2)), n = Math.hypot(s.vx, s.vy);
    s.hx = hx; s.hy = hy;
    var tx = hx - s.vx / n * len, ty = hy - s.vy / n * len, gr = g.createLinearGradient(hx, hy, tx, ty);
    gr.addColorStop(0, "rgba(255,250,230," + (1 - k) + ")"); gr.addColorStop(1, "rgba(255,250,230,0)");
    g.strokeStyle = gr; g.lineWidth = 2.2 * U; g.lineCap = "round"; g.beginPath(); g.moveTo(hx, hy); g.lineTo(tx, ty); g.stroke();
    g.globalCompositeOperation = "lighter"; var q = 26 * U; g.drawImage(glow("255,245,220"), hx - q / 2, hy - q / 2, q, q); g.globalCompositeOperation = "source-over";
  }
  function drawMoon(t) {
    var m = SC.moon, r = m.r, bob = RM ? 0 : Math.sin(t * 0.7) * 3 * U, x = m.x + Math.sin(m.wob * 18) * m.wob * 10 * U, y = m.y + bob;
    m.wob = Math.max(0, m.wob - 0.02);
    var pulse = 0.85 + 0.15 * Math.sin(t * 1.2);
    var halo = g.createRadialGradient(x, y, r * 0.8, x, y, r * 3.4); halo.addColorStop(0, "rgba(255,236,190," + 0.32 * pulse * (1 - m.sleep * 0.35) + ")"); halo.addColorStop(1, "rgba(255,236,190,0)");
    g.fillStyle = halo; g.beginPath(); g.arc(x, y, r * 3.4, 0, TAU); g.fill();
    var body = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); body.addColorStop(0, "#FFFAE6"); body.addColorStop(0.6, "#FFEAB0"); body.addColorStop(1, "#F2C977");
    g.fillStyle = body; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.fillStyle = "rgba(214,170,96,.25)"; [[0.42, 0.38, 0.13], [-0.5, 0.42, 0.09], [0.55, -0.1, 0.07]].forEach(function (c) { g.beginPath(); g.arc(x + c[0] * r, y + c[1] * r, c[2] * r, 0, TAU); g.fill(); });
    // cheeks
    g.fillStyle = "rgba(255,140,150,.38)"; [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(x + s * 0.5 * r, y + 0.2 * r, 0.13 * r, 0.09 * r, 0, 0, TAU); g.fill(); });
    // eyes: sleepy and half closed while awake, closed when asleep
    if (m.blink > 0) m.blink -= 0.05; else if (Math.random() < 0.006) m.blink = 1;
    g.strokeStyle = "#7A4A22"; g.fillStyle = "#5A3412"; g.lineWidth = 0.05 * r; g.lineCap = "round";
    [-1, 1].forEach(function (s) {
      var ex = x + s * 0.3 * r, ey = y - 0.06 * r;
      if (m.sleep > 0.5 || m.blink > 0.5) { g.beginPath(); g.arc(ex, ey - 0.04 * r, 0.12 * r, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
      else { var o = 1 - m.sleep * 2; g.beginPath(); g.ellipse(ex, ey, 0.085 * r, 0.1 * r * Math.max(0.15, o), 0, 0, TAU); g.fill();
        g.fillStyle = "#FFEAB0"; g.fillRect(ex - 0.11 * r, ey - 0.13 * r, 0.22 * r, 0.11 * r * (0.55 + m.sleep)); g.fillStyle = "#5A3412";
        g.beginPath(); g.moveTo(ex - 0.11 * r, ey - 0.02 * r + 0.06 * m.sleep * r); g.lineTo(ex + 0.11 * r, ey - 0.02 * r + 0.06 * m.sleep * r); g.stroke(); }
    });
    // mouth: a smile, or a big yawn
    if (m.yawn > 0.05) { g.fillStyle = "#8A4B2A"; g.beginPath(); g.ellipse(x, y + 0.32 * r, 0.09 * r * (0.6 + m.yawn), 0.14 * r * m.yawn, 0, 0, TAU); g.fill(); }
    else { g.beginPath(); g.arc(x, y + 0.14 * r, 0.16 * r, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
    // a nightcap with a pompom
    var sway = RM ? 0 : Math.sin(t * 0.9) * 0.08 * r, a1 = -160 * Math.PI / 180, a2 = -20 * Math.PI / 180, tipx = x + 1.18 * r + sway, tipy = y - 0.42 * r + sway * 0.5;
    var cap = g.createLinearGradient(x - r, y - 1.5 * r, x + r, y); cap.addColorStop(0, "#8B7BFF"); cap.addColorStop(1, "#5340D8");
    g.fillStyle = cap; g.beginPath(); g.moveTo(x + r * Math.cos(a1), y + r * Math.sin(a1));
    g.quadraticCurveTo(x - 0.55 * r, y - 1.55 * r, x + 0.25 * r, y - 1.42 * r); g.quadraticCurveTo(x + 0.95 * r, y - 1.32 * r, tipx, tipy);
    g.quadraticCurveTo(x + 0.95 * r, y - 0.85 * r, x + r * Math.cos(a2), y + r * Math.sin(a2)); g.arc(x, y, r, a2, a1, true); g.closePath(); g.fill();
    g.strokeStyle = "#F1EBFF"; g.lineWidth = 0.2 * r; g.beginPath(); g.arc(x, y, r * 0.98, -165 * Math.PI / 180, -15 * Math.PI / 180); g.stroke();
    g.fillStyle = "#F7F3FF"; g.beginPath(); g.arc(tipx, tipy, 0.17 * r, 0, TAU); g.fill();
    m.hit = [x, y, r * 1.2];
    if (m.sleep > 0.9 && Math.random() < 0.012) SC.zs.push({ x: x + 0.7 * r, y: y - 0.7 * r, t0: t, s: 18 * U });
  }
  function drawClouds(t, dt) {
    SC.clouds.forEach(function (c) {
      c.x += c.v * dt; if (c.x - c.s * 2.4 > W) c.x = -c.s * 2.4;
      var a = c.a * (1 + SC.fin * 0.8);
      [[0, 0, 1], [0.95, 0.12, 0.72], [-0.95, 0.15, 0.7], [0.4, -0.45, 0.72], [-0.42, -0.34, 0.66]].forEach(function (p) {
        var cx = c.x + p[0] * c.s, cy = c.y + p[1] * c.s, rr = p[2] * c.s, gg = g.createRadialGradient(cx, cy - rr * 0.3, rr * 0.1, cx, cy, rr * 1.15);
        gg.addColorStop(0, "rgba(225,215,255," + a + ")"); gg.addColorStop(1, "rgba(200,185,255,0)"); g.fillStyle = gg; g.beginPath(); g.arc(cx, cy, rr * 1.15, 0, TAU); g.fill();
      });
    });
  }
  function starPath(R) { g.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.5 : R; if (i) g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); }
  function drawStars(t) {
    SC.stars.forEach(function (s) {
      s.sleep += ((s.asleep ? 1 : 0) - s.sleep) * 0.06; s.pop = Math.max(0, s.pop - 0.035); s.wig = Math.max(0, s.wig - 0.03);
      if (s.blink > 0) s.blink -= 0.08; else if (t > s.nb) { s.blink = 1; s.nb = t + 2 + Math.random() * 5; }
      var bob = RM ? 0 : Math.sin(t * 0.9 + s.ph) * 4 * U * (1 - s.sleep * 0.5), x = s.x, y = s.y + bob - s.sleep * 6 * U, R = s.R * (1 + 0.28 * Math.sin(Math.PI * (1 - s.pop)) * (s.pop > 0 ? 1 : 0));
      var rot = (RM ? 0 : Math.sin(t * 0.6 + s.ph) * 0.06) + Math.sin(s.wig * 20) * s.wig * 0.3;
      g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.75 - s.sleep * 0.4; var q = R * 5; g.drawImage(glow("255,214,107"), x - q / 2, y - q / 2, q, q); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
      g.save(); g.translate(x, y); g.rotate(rot);
      var gr = g.createLinearGradient(0, -R, 0, R); gr.addColorStop(0, s.sleep > 0.5 ? "#FFF4CF" : "#FFE98C"); gr.addColorStop(1, s.sleep > 0.5 ? "#E9D59C" : "#FFC23A");
      g.globalAlpha = 1 - s.sleep * 0.22; starPath(R * 0.9); g.fillStyle = gr; g.fill(); g.lineJoin = "round"; g.lineWidth = R * 0.2; g.strokeStyle = gr; g.stroke(); g.globalAlpha = 1;
      // face
      g.fillStyle = "rgba(255,130,140,.42)"; [-1, 1].forEach(function (k) { g.beginPath(); g.ellipse(k * 0.34 * R, 0.17 * R, 0.1 * R, 0.07 * R, 0, 0, TAU); g.fill(); });
      g.strokeStyle = "#6A4214"; g.fillStyle = "#5A3410"; g.lineWidth = 0.07 * R; g.lineCap = "round";
      [-1, 1].forEach(function (k) {
        var ex = k * 0.2 * R, ey = -0.02 * R;
        if (s.sleep > 0.5 || s.blink > 0.5) { g.beginPath(); g.arc(ex, ey - 0.05 * R, 0.1 * R, 0.18 * Math.PI, 0.82 * Math.PI); g.stroke(); }
        else { g.beginPath(); g.ellipse(ex, ey, 0.07 * R, 0.1 * R, 0, 0, TAU); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(ex - 0.02 * R, ey - 0.04 * R, 0.025 * R, 0, TAU); g.fill(); g.fillStyle = "#5A3410"; }
      });
      if (s.sleep > 0.5) { g.beginPath(); g.ellipse(0, 0.2 * R, 0.05 * R, 0.035 * R, 0, 0, TAU); g.fill(); }
      else { g.beginPath(); g.arc(0, 0.09 * R, 0.13 * R, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
      g.restore();
      g.font = "600 " + Math.round(14 * U) + "px Fredoka, Rubik, sans-serif"; g.textAlign = "center"; g.direction = "rtl";
      g.fillStyle = "rgba(10,5,40,.6)"; g.fillText(s.name, x + 1, y + R * 1.55 + 1); g.fillStyle = "rgba(255,248,230," + (1 - s.sleep * 0.4) + ")"; g.fillText(s.name, x, y + R * 1.55);
      s.hx = x; s.hy = y;
      if (s.asleep && Math.random() < 0.004) SC.zs.push({ x: x + R * 0.6, y: y - R * 0.6, t0: t, s: 12 * U });
    });
  }
  function drawLand(t) {
    [0, 1, 2].forEach(function (i) {
      var h = HILLS[i], gr = g.createLinearGradient(0, H * h[0] - 30 * U, 0, H); gr.addColorStop(0, h[6][0]); gr.addColorStop(1, h[6][1]);
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, H); for (var x = 0; x <= W + 8; x += 8) g.lineTo(x, hillY(i, x)); g.lineTo(W, H); g.closePath(); g.fill();
      g.strokeStyle = "rgba(190,170,255," + (0.16 - i * 0.04) + ")"; g.lineWidth = 1.2; g.beginPath(); for (x = 0; x <= W + 8; x += 8) { if (x) g.lineTo(x, hillY(i, x)); else g.moveTo(x, hillY(i, x)); } g.stroke();
      if (i === 1) drawHouse(t);
      if (i === 2) drawTree();
    });
  }
  function drawHouse(t) {
    var h = SC.house, s = h.s, x = h.x, y = h.y;
    if (h.on > 0.02) { g.globalCompositeOperation = "lighter"; g.globalAlpha = h.on * (0.75 + 0.1 * Math.sin(t * 2.3)); var q = s * 4.2; g.drawImage(glow("255,190,100"), x - q / 2, y - s * 0.55 - q / 2, q, q); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; }
    g.fillStyle = "#130D3C"; g.fillRect(x - s * 0.62, y - s, s * 1.24, s);
    g.fillStyle = "#0D0930"; g.beginPath(); g.moveTo(x - s * 0.82, y - s * 0.95); g.lineTo(x, y - s * 1.75); g.lineTo(x + s * 0.82, y - s * 0.95); g.closePath(); g.fill();
    g.fillRect(x + s * 0.3, y - s * 1.62, s * 0.18, s * 0.42);
    var wc = h.on > 0.02 ? "rgba(255,205,120," + (0.25 + 0.75 * h.on) + ")" : "#221A55";
    g.fillStyle = wc; g.fillRect(x - s * 0.38, y - s * 0.72, s * 0.34, s * 0.3); g.fillRect(x + s * 0.06, y - s * 0.72, s * 0.32, s * 0.3);
    g.fillStyle = "#0A0726"; g.fillRect(x - s * 0.06, y - s * 0.72, s * 0.04, s * 0.3);
    g.fillStyle = "#1E1650"; g.fillRect(x - s * 0.14, y - s * 0.36, s * 0.28, s * 0.36);
    h.hit = [x, y - s * 0.8, s * 1.1];
  }
  function drawTree() {
    var tr = SC.tree, s = tr.s, x = tr.x, y = tr.y;
    g.fillStyle = "#08051E"; g.fillRect(x - s * 0.08, y - s * 1.1, s * 0.16, s * 1.1);
    [[0, -1.5, 0.62], [-0.38, -1.15, 0.48], [0.4, -1.12, 0.5], [0, -1.05, 0.5]].forEach(function (c) { g.beginPath(); g.arc(x + c[0] * s, y + c[1] * s, c[2] * s, 0, TAU); g.fill(); });
  }
  function drawFlies(t) {
    if (SC.fin > 0.5) return;
    g.globalCompositeOperation = "lighter";
    SC.flies.forEach(function (f) {
      if (f.scat) { f.bx += f.sx; f.by += f.sy; f.sx *= 0.96; f.sy *= 0.96; if (Math.abs(f.sx) < 0.05) f.scat = 0; }
      var x = f.bx + Math.sin(t * f.v + f.p) * 40 * U, y = f.by + Math.cos(t * f.v * 1.3 + f.p * 1.7) * 18 * U, a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 1.6 + f.p * 3));
      f.x = x; f.y = y; g.globalAlpha = a; var q = 16 * U; g.drawImage(glow("220,255,140"), x - q / 2, y - q / 2, q, q);
    });
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  }
  function drawFx(t, dt) {
    // sparkles
    SC.parts = SC.parts.filter(function (p) { p.life -= dt; return p.life > 0; });
    g.globalCompositeOperation = "lighter";
    SC.parts.forEach(function (p) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * U * dt; var k = p.life / p.max; g.globalAlpha = k;
      var q = p.r * (1 + (1 - k)); g.drawImage(glow(p.c), p.x - q * 2, p.y - q * 2, q * 4, q * 4);
      g.strokeStyle = "rgba(" + p.c + "," + k + ")"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(p.x - q, p.y); g.lineTo(p.x + q, p.y); g.moveTo(p.x, p.y - q); g.lineTo(p.x, p.y + q); g.stroke();
    });
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    // z z z
    SC.zs = SC.zs.filter(function (z) { return t - z.t0 < 2.8; });
    SC.zs.forEach(function (z) { var k = (t - z.t0) / 2.8; g.globalAlpha = Math.sin(Math.PI * k) * 0.9; g.font = "700 " + Math.round(z.s * (0.7 + k * 0.6)) + "px Fredoka, Rubik, sans-serif"; g.fillStyle = "#E8E2FF"; g.textAlign = "center"; g.fillText("z", z.x + Math.sin(k * 6) * 8 * U + k * 22 * U, z.y - k * 60 * U); });
    g.globalAlpha = 1;
    // speech bubbles
    SC.bubbles = SC.bubbles.filter(function (b) { return t - b.t0 < 2.8; });
    SC.bubbles.forEach(function (b) {
      var k = (t - b.t0) / 2.8, a = k < 0.12 ? k / 0.12 : k > 0.75 ? (1 - k) / 0.25 : 1, fs = Math.round(17 * U);
      g.font = "600 " + fs + "px Fredoka, Rubik, sans-serif"; g.textAlign = "center"; g.direction = "rtl";
      var w = g.measureText(b.text).width + 26 * U, hh = fs + 18 * U, x = Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, b.x)), y = b.y - k * 34 * U - (1 - Math.min(1, k * 6)) * -8 * U;
      g.globalAlpha = a; g.fillStyle = "rgba(255,255,255,.94)"; rr(x - w / 2, y - hh, w, hh, hh / 2); g.fill();
      g.beginPath(); g.moveTo(x - 7 * U, y - 1); g.lineTo(x, y + 8 * U); g.lineTo(x + 7 * U, y - 1); g.fill();
      g.fillStyle = "#2A1666"; g.fillText(b.text, x, y - hh / 2 + fs * 0.36); g.globalAlpha = 1;
    });
  }
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function burst(x, y, n, c) { for (var i = 0; i < n; i++) { var a = Math.random() * TAU, v = (40 + Math.random() * 140) * U; SC.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * U, r: (2 + Math.random() * 3) * U, life: 0.7 + Math.random() * 0.7, max: 1.4, c: c || (i % 3 ? "255,224,140" : "255,170,210") }); } }
  function say(x, y, text) { SC.bubbles.push({ x: x, y: y, text: text, t0: SC.t }); }

  var last = 0, frameAt = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.1, (now - last) / 1000 || 0); last = now;
    if (SC.paused) return;
    if (now - frameAt < 32) return; // about 30 frames a second is plenty for a calm sky
    var fdt = (now - frameAt) / 1000; frameAt = now; if (fdt > 0.2) fdt = 0.033;
    SC.t += fdt; var t = SC.t;
    SC.dim += (SC.dimTo - SC.dim) * 0.03; SC.moon.yawn += ((SC.yawnTo || 0) - SC.moon.yawn) * 0.08; SC.moon.sleep += ((SC.moonSleep ? 1 : 0) - SC.moon.sleep) * 0.05; SC.house.on += ((SC.houseOff ? 0 : 1) - SC.house.on) * 0.06;
    SC.fin += ((SC.finT ? 1 : 0) - SC.fin) * 0.02;
    try {
      drawSky(t); drawShoot(t); drawMoon(t); drawClouds(t, fdt); drawStars(t); drawLand(t); drawFlies(t); drawFx(t, fdt);
      if (SC.dim > 0.01) { g.fillStyle = "rgba(4,2,16," + SC.dim + ")"; g.fillRect(0, 0, W, H); }
    } catch (e) { console.error(e); }
  }

  // ---------- touching the sky ----------
  var TW = [72, 72, 79, 79, 81, 81, 79, 77, 77]; // a star's goodnight plays the next note of "Twinkle, Twinkle"
  cv.addEventListener("pointerdown", function (e) {
    var x = e.clientX, y = e.clientY, t = SC.t;
    if (SC.quiet) { setQuiet(false); hideFinale(); return; }
    var best = null, bd = 1e9;
    SC.stars.forEach(function (s) { var d = Math.hypot(s.hx - x, s.hy - y); if (d < s.R * 1.5 && d < bd) { bd = d; best = s; } });
    if (best) return tapStar(best);
    var m = SC.moon.hit; if (m && Math.hypot(m[0] - x, m[1] - y) < m[2]) { SC.moon.wob = 1; chime(84, 0.08); var left = SC.stars.filter(function (s) { return !s.asleep; }).length; say(m[0], m[1] - m[2] - 6, SC.finT ? "ששש... 😴" : left ? "קודם הכוכבים! ⭐" : "אוווו... 🥱"); return; }
    var h = SC.house.hit; if (h && Math.hypot(h[0] - x, h[1] - y) < h[2]) { SC.houseOff = !SC.houseOff; chime(SC.houseOff ? 67 : 72, 0.07); say(h[0], h[1] - h[2], SC.houseOff ? "לילה טוב, בית! 🏠" : "האור דולק 💡"); return; }
    var sh = SC.shoot; if (sh && sh.hx != null && Math.hypot(sh.hx - x, sh.hy - y) < 60 * U) { burst(sh.hx, sh.hy, 24, "255,250,220"); say(sh.hx, sh.hy - 20, "✨ משאלה!"); SC.shoot = null; [84, 88, 91, 96].forEach(function (n, i) { setTimeout(function () { chime(n, 0.06); }, i * 90); }); return; }
    var hitFly = false; SC.flies.forEach(function (f) { if (f.x != null && Math.hypot(f.x - x, f.y - y) < 70 * U) { var a = Math.atan2(f.y - y, f.x - x); f.sx = Math.cos(a) * 3 * U; f.sy = Math.sin(a) * 3 * U; f.scat = 1; hitFly = true; } });
    burst(x, y, hitFly ? 6 : 8, hitFly ? "220,255,140" : null);
  });
  function tapStar(s) {
    if (s.asleep) { s.wig = 1; say(s.hx, s.hy - s.R * 1.3, "ששש... " + s.name + " כבר ישנים 😴"); return; }
    s.asleep = true; s.pop = 1; burst(s.hx, s.hy, 16);
    var i = SC.stars.filter(function (x) { return x.asleep; }).length - 1;
    chime(TW[i % TW.length], 0.13);
    say(s.hx, s.hy - s.R * 1.3, "לילה טוב, " + s.name + "!");
    speak("לילה טוב " + s.name);
    for (var k = 0; k < 3; k++) (function (k) { setTimeout(function () { SC.zs.push({ x: s.hx + s.R * 0.5, y: s.hy - s.R * 0.5, t0: SC.t, s: 14 * U }); }, k * 500); })(k);
    hello();
    if (SC.stars.every(function (x) { return x.asleep; })) setTimeout(finale, 1300);
  }
  function hello() {
    var left = SC.stars.filter(function (s) { return !s.asleep; }).length, h = new Date().getHours();
    $("hi").textContent = "לילה טוב" + (S.name ? ", " + S.name : "");
    $("hip").textContent = !SC.stars.length ? "מוסיפים שמות בהגדרות ⚙️" : !left ? "כל הכוכבים ישנים 💤" : left === SC.stars.length ? (h >= 6 && h < 16 ? "עוד מעט לילה 🌅 · " : "") + "נוגעים בכוכב ואומרים לו לילה טוב" : left === 1 ? "עוד כוכב אחד מחכה ללילה טוב" : "עוד " + left + " כוכבים מחכים ללילה טוב";
  }
  function setQuiet(on) { SC.quiet = on; document.body.classList.toggle("quiet", on); }

  // ---------- when every star is asleep ----------
  function finale() {
    SC.yawnTo = 1; say(SC.moon.x, SC.moon.y - SC.moon.r * 1.7, "אוווווה... 🥱");
    setTimeout(function () { SC.yawnTo = 0; SC.moonSleep = true; [72, 76, 79, 84].forEach(function (n, i) { setTimeout(function () { chime(n, 0.1); }, i * 260); }); }, 1900);
    setTimeout(function () { SC.houseOff = true; }, 3000);
    setTimeout(function () { SC.dimTo = 0.45; SC.finT = 1; }, 3300);
    setTimeout(function () {
      var nm = S.name ? "לילה טוב, " + S.name : "לילה טוב";
      $("finT").textContent = nm + " 💤"; speak(nm);
      var snd = AMB.filter(function (a) { return a[0] === S.sound; })[0] || AMB[0];
      $("finB").replaceChildren(
        el("button", { class: "btn", type: "button", text: snd[1] + " " + snd[2] + " ומנורה", onclick: function () { unlock(); setSound("amb", snd[0], true); hideFinale(); setQuiet(false); startNight(); } }),
        el("button", { class: "btn ghost", type: "button", text: "🔁 עוד פעם", onclick: function () { hideFinale(); wakeAll(); } }),
        el("button", { class: "btn ghost", type: "button", text: "סיום", onclick: function () { hideFinale(); setQuiet(true); } }));
      $("finale").classList.add("on"); setQuiet(true);
    }, 4400);
  }
  function hideFinale() { $("finale").classList.remove("on"); }
  function wakeAll() { SC.stars.forEach(function (s) { s.asleep = false; s.pop = 1; }); SC.moonSleep = false; SC.houseOff = false; SC.dimTo = 0; SC.finT = 0; setQuiet(false); hello(); [79, 76, 72].forEach(function (n, i) { setTimeout(function () { chime(n, 0.08); }, i * 140); }); }

  // =====================================================================================
  // Sounds: made on the phone. Each is a loop of a few dozen seconds that plays in an audio element,
  // so it keeps playing with the screen off.
  // =====================================================================================
  var SR = 22050;
  var AMB = [["rain", "🌧️", "גשם"], ["sea", "🌊", "גלי ים"], ["heart", "💗", "דופק לב"], ["wind", "🍃", "רוח בעצים"], ["crickets", "🦗", "לילה בשדה"], ["pink", "🌬️", "רחש רך"], ["brown", "🌫️", "רחש עמוק"]];
  var MUS = [["twinkle", "⭐", "כוכב קטן"], ["brahms", "🌙", "שיר ערש"], ["canon", "🔔", "שיר הפעמונים"], ["chimes", "🎐", "פעמוני רוח"]];
  function pinkArr(n, r) { var a = new Float32Array(n), b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; for (var i = 0; i < n; i++) { var w = r() * 2 - 1; b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; a[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; } return a; }
  function brownArr(n, r) { var a = new Float32Array(n), l = 0; for (var i = 0; i < n; i++) { l = (l + 0.02 * (r() * 2 - 1)) / 1.02; a[i] = l * 3.5; } return a; }
  function lp(a, k) { var y = 0; for (var i = 0; i < a.length; i++) { y += k * (a[i] - y); a[i] = y; } return a; }
  function hp(a, k) { var y = 0; for (var i = 0; i < a.length; i++) { y += k * (a[i] - y); a[i] -= y; } return a; }
  // a low-pass over a loop: run it over two rounds, keep the second, so there is no step where the loop meets itself
  function lpLoop(o, k) { var L = o.length, y = 0, i; for (i = 0; i < L; i++) y += k * (o[i] - y); for (i = 0; i < L; i++) { y += k * (o[i] - y); o[i] = y; } return o; }
  // the end of the loop flows into its start: the last seconds fade into the first
  function loopify(a, L, X) { var o = new Float32Array(L); for (var i = 0; i < L; i++) o[i] = a[i]; for (i = 0; i < X; i++) { var t = i / X; o[i] = a[i] * Math.sin(t * Math.PI / 2) + a[L + i] * Math.cos(t * Math.PI / 2); } return o; }
  function addC(o, pos, arr, amp) { var L = o.length; pos = Math.round(pos); for (var j = 0; j < arr.length; j++) o[(pos + j) % L] += arr[j] * amp; }
  function level(o, rms) { var s = 0; for (var i = 0; i < o.length; i++) s += o[i] * o[i]; var k = rms / Math.sqrt(s / o.length || 1e-12); for (i = 0; i < o.length; i++) o[i] = Math.tanh(o[i] * k); return o; }
  var GEN = {
    rain: function () {
      var L = SR * 36, X = SR * 2, r = rnd(11), a = hp(pinkArr(L + X, r), 0.18), b = lp(brownArr(L + X, r), 0.2);
      for (var i = 0; i < L + X; i++) a[i] = a[i] * 0.55 + b[i] * 0.4;
      var o = loopify(a, L, X);
      for (var n = 0; n < 36 * 110; n++) { var len = Math.round(SR * (0.002 + r() * 0.01)), d = new Float32Array(len), prev = 0; for (var j = 0; j < len; j++) { var w = (r() * 2 - 1) * Math.exp(-j / (len * 0.22)); d[j] = w - prev; prev = w; } addC(o, r() * L, d, Math.pow(r(), 2.4) * 0.7); }
      for (n = 0; n < 36 * 1.4; n++) { var f = 1600 + r() * 2400, pl = Math.round(SR * 0.06), p = new Float32Array(pl); for (j = 0; j < pl; j++) p[j] = Math.sin(TAU * f * j / SR) * Math.exp(-j / (SR * 0.01)); addC(o, r() * L, p, 0.12 * r()); }
      return level(lpLoop(o, 0.55), 0.15);
    },
    sea: function () {
      var L = SR * 36, X = SR * 2, P = L / 4, r = rnd(12), a = pinkArr(L + X, r), b = brownArr(L + X, r), y = 0, HT = [1, 0.72, 0.9, 0.62];
      for (var i = 0; i < L + X; i++) {
        var ii = i % L, ph = (ii % P) / P, s = ph < 0.62 ? (1 - Math.cos(Math.PI * ph / 0.62)) / 2 : (1 + Math.cos(Math.PI * (ph - 0.62) / 0.38)) / 2, env = (0.16 + 0.84 * Math.pow(s, 1.5)) * HT[Math.floor(ii / P)];
        y += (0.025 + 0.33 * env) * (a[i] - y); a[i] = y * env * 1.1 + b[i] * (0.22 + 0.5 * env) * 0.55;
      }
      return level(loopify(a, L, X), 0.16);
    },
    heart: function () {
      var L = SR * 36, X = SR * 2, N = 42, P = L / N, r = rnd(13), b = lp(brownArr(L + X, r), 0.05), o = loopify(b, L, X);
      for (var i = 0; i < L; i++) { var tb = (i % P) / SR; o[i] *= 0.5 + 0.5 * Math.exp(-Math.pow(tb - 0.12, 2) / 0.008); }
      level(o, 0.05);
      function thump(f0, df, dec, amp) { var n = Math.round(SR * 0.22), a = new Float32Array(n), ph = 0, nz = 0; for (var j = 0; j < n; j++) { var t = j / SR, f = f0 + df * Math.exp(-t / 0.025); ph += TAU * f / SR; var env = (1 - Math.exp(-t / 0.004)) * Math.exp(-t / dec); nz += 0.04 * ((r() * 2 - 1) - nz); a[j] = (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.25 * Math.sin(3 * ph) + nz * 2.5 * Math.exp(-t / 0.03)) * env * amp; } return a; }
      var lub = thump(54, 40, 0.07, 1), dub = thump(46, 30, 0.06, 0.62);
      for (var k = 0; k < N; k++) { addC(o, k * P, lub, 0.55); addC(o, k * P + SR * 0.29, dub, 0.55); }
      return level(lpLoop(lpLoop(o, 0.12), 0.2), 0.17);
    },
    wind: function () {
      var L = SR * 36, X = SR * 2, r = rnd(14), a = pinkArr(L + X, r), c = hp(pinkArr(L + X, r), 0.45), y = 0, y2 = 0;
      for (var i = 0; i < L + X; i++) {
        var q = (i % L) / L, gu = Math.max(0, Math.min(1, 0.5 + 0.25 * Math.sin(TAU * q * 3 + 1) + 0.16 * Math.sin(TAU * q * 5 + 2) + 0.1 * Math.sin(TAU * q * 7 + 0.5)));
        y += (0.015 + 0.1 * gu) * (a[i] - y); y2 += 0.004 * (y - y2); a[i] = (y - y2) * (0.25 + 1.1 * gu) + c[i] * Math.pow(gu, 3) * 0.3;
      }
      return level(loopify(a, L, X), 0.13);
    },
    crickets: function () {
      var L = SR * 36, X = SR * 2, r = rnd(15), a = lp(pinkArr(L + X, r), 0.08), b = brownArr(L + X, r);
      for (var i = 0; i < L + X; i++) a[i] = a[i] * 0.3 + b[i] * 0.2;
      var o = level(loopify(a, L, X), 0.035);
      [[4150, 0.2], [4600, 0.13], [3850, 0.09]].forEach(function (c) {
        var len = Math.round(SR * 0.02), pulse = new Float32Array(len); for (var j = 0; j < len; j++) pulse[j] = Math.sin(TAU * c[0] * j / SR) * Math.sin(Math.PI * j / len);
        for (var t = r() * SR; t < L; t += SR * (0.6 + r() * 0.9)) { var np = 3 + Math.floor(r() * 2); for (var p = 0; p < np; p++) addC(o, t + p * SR * 0.042, pulse, c[1] * (0.7 + 0.3 * r())); }
      });
      return level(o, 0.08);
    },
    pink: function () { var L = SR * 30, X = SR * 2; return level(loopify(lp(pinkArr(L + X, rnd(16)), 0.5), L, X), 0.15); },
    brown: function () { var L = SR * 30, X = SR * 2; return level(loopify(brownArr(L + X, rnd(17)), L, X), 0.19); },
    twinkle: function () {
      var mel = "C C G G A A G:2 F F E E D D C:2 G G F F E E D:2 G G F F E E D:2 C C G G A A G:2 F F E E D D C:2";
      var bass = "C C F C F C G C C F C G C F C G C C F C F C G C";
      return music(notes(mel, 72), notes(bass.split(" ").map(function (x) { return x + ":2"; }).join(" "), 60, { F: -12, G: -12 }), 0.74, 50, 0.35);
    },
    brahms: function () {
      var mel = "E:.5 E:.5 G:2 E:.5 E:.5 G:2 E:.5 G:.5 c:1 B:1.5 A:.5 A:1 G:1 D:.5 E:.5 F:1 D:1 D:.5 E:.5 F:2 D:.5 F:.5 B:.5 A:.5 G:1 B:1 c:2 C:.5 C:.5 c:2 A:.5 F:.5 G:2 E:.5 C:.5 F:1 G:1 A:1 G:2 C:.5 C:.5 c:2 A:.5 F:.5 G:2 F:.5 E:.5 D:1 E:1 C:1 R:3";
      var bass = "R:1 " + "C C F G G G G C F C F C F C G C".split(" ").map(function (x) { return x + ":3"; }).join(" ");
      return music(notes(mel, 72), notes(bass, 60, { F: -12, G: -12 }), 0.66, 49, 0.32);
    },
    canon: function () { // "Frère Jacques" as a round: the second voice comes in two bars later, and goes round forever
      var mel = "C D E C C D E C E F G:2 E F G:2 G:.5 A:.5 G:.5 F:.5 E C G:.5 A:.5 G:.5 F:.5 E C C g C:2 C g C:2";
      var v1 = notes(mel, 72, { g: -12 }), v2 = v1.map(function (n) { return [n[0] ? n[0] - 12 : 0, n[1], n[2], n[3] + 8]; });
      return music(v1, v2, 0.8, 32, 0.5);
    },
    chimes: function () {
      var r = rnd(18), sc = [72, 74, 76, 79, 81, 84, 86, 88], out = [], b = 0, i = 3;
      while (b < 48) { i = Math.max(0, Math.min(sc.length - 1, i + Math.round((r() - 0.5) * 4))); out.push([sc[i], 1, 0.35 + 0.5 * r(), b]); b += 1.1 + r() * 2.4; }
      return music(out, [], 0.75, 52, 0, 0.55);
    }
  };
  var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11, c: 12, g: 7 };
  function notes(s, base, shift) { var b = 0; return s.split(/\s+/).filter(Boolean).map(function (tok) { var p = tok.split(":"), d = p[1] ? +p[1] : 1, n = p[0], m = n === "R" ? 0 : base + NOTE[n] + ((shift || {})[n] || 0); var o = [m, d, 1, b]; b += d; return o; }); }
  var TINE = {};
  function tine(m) { // a music-box tine: a bright attack and a slow, soft ring
    if (TINE[m]) return TINE[m]; var f = 440 * Math.pow(2, (m - 69) / 12), n = Math.round(SR * 2.6), a = new Float32Array(n);
    [[1, 1, 1.5], [2, 0.3, 0.55], [3, 0.1, 0.25], [4.2, 0.07, 0.12]].forEach(function (p) { var w = TAU * f * p[0] / SR, dec = Math.exp(-1 / (SR * p[2])), e = p[1]; for (var j = 0; j < n; j++) { a[j] += Math.sin(w * j) * e * (j < 90 ? j / 90 : 1); e *= dec; } });
    return TINE[m] = a;
  }
  function music(v1, v2, beat, beats, bassAmp, wet) {
    var L = Math.round(beats * beat * SR), o = new Float32Array(L);
    v1.forEach(function (n) { if (n[0]) addC(o, n[3] * beat * SR, tine(n[0]), 0.5 * (n[2] || 1)); });
    v2.forEach(function (n) { if (n[0]) addC(o, n[3] * beat * SR, tine(n[0]), 0.5 * bassAmp); });
    return level(reverb(o, wet == null ? 0.35 : wet), 0.11);
  }
  function reverb(dry, wet) { // a small room: four combs and two all-passes, run over two rounds of the loop so the tail wraps
    var L = dry.length, N = 2 * L, x = new Float32Array(N), out = new Float32Array(N); x.set(dry); x.set(dry, L);
    [778, 808, 745, 711].forEach(function (d) { var buf = new Float32Array(d), idx = 0, fs = 0; for (var i = 0; i < N; i++) { var y = buf[idx]; fs = y * 0.75 + fs * 0.25; buf[idx] = x[i] + fs * 0.8; idx = (idx + 1) % d; out[i] += y; } });
    [112, 278].forEach(function (d) { var buf = new Float32Array(d), idx = 0; for (var i = 0; i < N; i++) { var bo = buf[idx], v = out[i]; buf[idx] = v + bo * 0.5; out[i] = bo - v * 0.5; idx = (idx + 1) % d; } });
    var o = new Float32Array(L); for (var i = 0; i < L; i++) o[i] = dry[i] + out[L + i] * wet * 0.25; return o;
  }
  function wav(f) {
    var n = f.length, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = function (o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
    for (var i = 0; i < n; i++) { var s = Math.max(-1, Math.min(1, f[i])); v.setInt16(44 + i * 2, s < 0 ? s * 32768 : s * 32767, true); }
    return URL.createObjectURL(new Blob([b], { type: "audio/wav" }));
  }
  var SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=";
  var URLS = {}, P = { amb: { id: null, el: new Audio() }, mus: { id: null, el: new Audio() }, end: 0, tick: 0 };
  P.amb.el.loop = P.mus.el.loop = true; P.amb.el.preload = P.mus.el.preload = "auto";
  function unlock() { ["amb", "mus"].forEach(function (k) { var e = P[k].el; if (!P[k].id && e.paused) { try { e.src = SILENT; var p = e.play(); if (p) p.catch(function () {}); } catch (x) {} } }); ac(); }
  function name(kind, id) { return (kind === "amb" ? AMB : MUS).filter(function (a) { return a[0] === id; })[0]; }
  function setSound(kind, id, keep) {
    var ch = P[kind];
    if (ch.id === id && !keep) { stopCh(kind); return; }
    if (ch.id === id) return;
    ch.id = id; ch.busy = true; drawSoundSheet();
    setTimeout(function () {
      try { if (!URLS[id]) URLS[id] = wav(GEN[id]()); } catch (e) { console.error(e); ch.id = null; ch.busy = false; toast("לא הצלחנו להכין את הצליל"); drawSoundSheet(); return; }
      if (ch.id !== id) return;
      ch.busy = false; ch.el.src = URLS[id]; ch.el.volume = (kind === "amb" ? S.vol : S.mvol) * fadeK(); var p = ch.el.play(); if (p) p.catch(function () { toast("לוחצים שוב כדי לנגן"); ch.id = null; drawSoundSheet(); updNow(); });
      if (!P.end || !anyOn(kind)) startTimer();
      media(); updNow(); drawSoundSheet();
    }, 40);
  }
  function anyOn(except) { return ["amb", "mus"].some(function (k) { return k !== except && P[k].id; }) || NIGHT.on; }
  function stopCh(kind) { var ch = P[kind]; ch.id = null; ch.busy = false; try { ch.el.pause(); } catch (e) {} if (!anyOn()) { P.end = 0; } updNow(); drawSoundSheet(); media(); }
  function stopAll() { stopCh("amb"); stopCh("mus"); }
  function startTimer() { P.end = S.timer ? Date.now() + S.timer * 60000 : 0; clearInterval(P.tick); P.tick = setInterval(tick, 1000); tick(); }
  function fadeK() { if (!P.end) return 1; var left = (P.end - Date.now()) / 1000; return Math.max(0, Math.min(1, left / 90)); }
  function tick() {
    if (P.end && Date.now() >= P.end) { P.end = 0; stopAll(); if (NIGHT.on) nightSleep(); clearInterval(P.tick); return; }
    var k = fadeK(); P.amb.el.volume = Math.max(0, Math.min(1, S.vol * k)); P.mus.el.volume = Math.max(0, Math.min(1, S.mvol * k));
    updNow();
  }
  function left() { if (!P.end) return "∞"; var s = Math.max(0, Math.round((P.end - Date.now()) / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function updNow() {
    var on = [P.amb, P.mus].filter(function (c) { return c.id; }), box = $("now");
    if (!on.length) { box.hidden = true; $("dSound").classList.remove("on"); if (!NIGHT.on) clearInterval(P.tick); return; }
    box.hidden = false; $("nowT").textContent = on.map(function (c, i) { var n = name(c === P.amb ? "amb" : "mus", c.id); return n[1] + " " + n[2]; }).join(" + ");
    $("nowR").textContent = P.end ? "⏲️ " + left() : "";
    $("dSound").classList.add("on");
  }
  $("nowStop").addEventListener("click", function () { stopAll(); $("dSound").classList.remove("on"); });
  function media() {
    try {
      if (!("mediaSession" in navigator)) return; var on = [P.amb, P.mus].filter(function (c) { return c.id; });
      navigator.mediaSession.metadata = on.length ? new MediaMetadata({ title: on.map(function (c) { return name(c === P.amb ? "amb" : "mus", c.id)[2]; }).join(" + "), artist: "HaniaLayla · לילה טוב", artwork: [{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }] }) : null;
      navigator.mediaSession.setActionHandler("pause", function () { stopAll(); });
    } catch (e) {}
  }
  // a short bell, played live (for the stars and the moon)
  var AC = null;
  function ac() { if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } if (AC && AC.state === "suspended") AC.resume(); return AC; }
  function chime(m, amp) {
    var a = ac(); if (!a) return; var t = a.currentTime, f = 440 * Math.pow(2, (m - 69) / 12), out = a.createGain(); out.gain.value = amp || 0.12; out.connect(a.destination);
    [[1, 1, 1.4], [2, 0.3, 0.5], [3, 0.1, 0.25], [4.2, 0.06, 0.12]].forEach(function (p) { var o = a.createOscillator(), gn = a.createGain(); o.frequency.value = f * p[0]; gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(p[1], t + 0.006); gn.gain.exponentialRampToValueAtTime(0.0001, t + p[2] * 3); o.connect(gn); gn.connect(out); o.start(t); o.stop(t + p[2] * 3 + 0.05); });
  }
  var HEV = null;
  function speak(t) {
    if (!S.voice || !window.speechSynthesis) return;
    try { HEV = HEV || speechSynthesis.getVoices().filter(function (v) { return /^he|^iw/i.test(v.lang); })[0]; if (!HEV) return; var u = new SpeechSynthesisUtterance(t); u.voice = HEV; u.lang = HEV.lang; u.rate = 0.85; u.pitch = 1.15; speechSynthesis.speak(u); } catch (e) {}
  }

  // =====================================================================================
  // Sheets
  // =====================================================================================
  var SHEET = null;
  function sheet(kind, build) { SHEET = kind; var b = $("sheetBody"); b.replaceChildren.apply(b, build().filter(Boolean)); $("sheet").classList.add("open"); $("scrim").classList.add("on"); }
  function closeSheet() { SHEET = null; $("sheet").classList.remove("open"); $("scrim").classList.remove("on"); }
  $("scrim").addEventListener("click", closeSheet);
  (function () { var y0 = null, sh = $("sheet"); sh.addEventListener("touchstart", function (e) { y0 = e.touches[0].clientY; }, { passive: true }); sh.addEventListener("touchend", function (e) { if (y0 != null && e.changedTouches[0].clientY - y0 > 80 && sh.scrollTop <= 0) closeSheet(); y0 = null; }); })();
  addEventListener("keydown", function (e) { if (e.key === "Escape") { if (SHEET) closeSheet(); else if ($("breath").classList.contains("on")) closeBreath(); else if ($("shema").classList.contains("on")) closeShema(); } });
  function chips(list, cur, on) { return el("div", { class: "row" }, list.map(function (x) { return el("button", { class: "chip", type: "button", "aria-pressed": String(cur === x[0]), text: x[1], onclick: function () { on(x[0]); } }); })); }
  var TIMERS = [[10, "10 דק׳"], [20, "20 דק׳"], [30, "30 דק׳"], [45, "45 דק׳"], [60, "שעה"], [0, "בלי הגבלה"]];
  function tiles(list, kind) {
    return el("div", { class: "tiles" }, list.map(function (a) {
      var ch = P[kind], on = ch.id === a[0];
      return el("button", { class: "tile" + (on ? " on" : "") + (on && ch.busy ? " busy" : ""), type: "button", "aria-pressed": String(on), onclick: function () { unlock(); setSound(kind, a[0]); } }, [el("span", { text: a[1] }), document.createTextNode(a[2])]);
    }));
  }
  function slider(label, key, kind) {
    var i = el("input", { type: "range", min: "0", max: "1", step: "0.05", value: String(S[key]), "aria-label": label });
    i.addEventListener("input", function () { S[key] = +i.value; save(); P[kind].el.volume = S[key] * fadeK(); });
    return el("label", { class: "vol" }, [el("span", { text: label }), i]);
  }
  function drawSoundSheet() {
    if (SHEET !== "sound") return; var sc = $("sheetBody").scrollTop;
    sheet("sound", soundBody); $("sheetBody").scrollTop = sc;
  }
  function soundBody() {
    return [el("h2", { text: "🎵 צלילים לשינה" }), el("p", { class: "sub", text: "צליל רקע אחד ומנגינה אחת, אפשר יחד. ממשיכים גם כשהמסך כבוי." }),
      el("h3", { text: "צלילי רקע" }), tiles(AMB, "amb"), slider("עוצמה", "vol", "amb"),
      el("h3", { text: "מנגינות ערש" }), tiles(MUS, "mus"), slider("עוצמה", "mvol", "mus"),
      el("h3", { text: "⏲️ כמה זמן?" }), chips(TIMERS, S.timer, function (v) { S.timer = v; save(); if (P.amb.id || P.mus.id || NIGHT.on) startTimer(); drawSoundSheet(); }),
      el("p", { class: "fine", text: "בסוף הזמן הצלילים נחלשים לאט ונעצרים." }),
      el("button", { class: "btn wide", type: "button", text: "🌌 להדליק מנורת לילה", onclick: function () { closeSheet(); openNight(); } })];
  }
  $("dSound").addEventListener("click", function () { unlock(); sheet("sound", soundBody); });
  $("dStars").addEventListener("click", function () {
    if (SC.stars.length && SC.stars.every(function (s) { return s.asleep; })) { wakeAll(); toast("⭐ הכוכבים התעוררו. אומרים להם לילה טוב שוב"); return; }
    var s = SC.stars.filter(function (x) { return !x.asleep; })[0]; if (!s) { openSettings(); return; }
    burst(s.hx, s.hy, 10); say(s.hx, s.hy - s.R * 1.3, "נוגעים בי! 👋"); s.wig = 1; ac();
  });

  // ---------- settings for parents ----------
  var CITIES = /*CITIES*/[["ירושלים", 31.778, 35.235, 40]];
  if (!S.city) { try { var cm = document.cookie.match(/(?:^|; *)h360_i=([^;]*)/), co = cm ? JSON.parse(decodeURIComponent(cm[1])) : {}; if (co.c && CITIES.some(function (c) { return c[0] === co.c[0]; })) S.city = co.c[0]; } catch (e) {} }
  function openSettings() {
    sheet("set", function () {
      var nm = el("input", { value: S.name, maxlength: "24", placeholder: "למשל: נועה", "aria-label": "שם הילד/ה" });
      nm.addEventListener("change", function () { S.name = nm.value.trim().slice(0, 24); save(); hello(); });
      var fam = el("div", { class: "row" }), add = el("input", { maxlength: "14", placeholder: "שם נוסף", "aria-label": "שם לכוכב חדש", style: "flex:1;min-width:120px" });
      var drawFam = function () { fam.replaceChildren.apply(fam, S.fam.map(function (f, i) { return el("button", { class: "chip", type: "button", "aria-label": "להסיר את " + f, text: "⭐ " + f + " ✕", onclick: function () { S.fam.splice(i, 1); save(); layout(); hello(); drawFam(); } }); })); };
      drawFam();
      var form = el("form", { class: "row", style: "margin-top:8px", onsubmit: function (e) { e.preventDefault(); var v = add.value.trim().slice(0, 14); if (!v) return; if (S.fam.length >= 9) { toast("עד 9 כוכבים"); return; } S.fam.push(v); add.value = ""; save(); layout(); hello(); drawFam(); } }, [add, el("button", { class: "btn ghost", type: "submit", text: "+ להוסיף" })]);
      var snd = el("select", { "aria-label": "הצליל אחרי הלילה טוב" }, AMB.map(function (a) { var o = el("option", { value: a[0], text: a[1] + " " + a[2] }); if (a[0] === S.sound) o.selected = true; return o; }));
      snd.addEventListener("change", function () { S.sound = snd.value; save(); });
      var tog = function (key, text, fn) { var i = el("input", { type: "checkbox" }); i.checked = !!S[key]; i.addEventListener("change", function () { S[key] = i.checked; save(); fn && fn(); }); return el("label", { class: "tog" }, [el("span", { text: text }), i]); };
      var city = el("select", { "aria-label": "העיר לזמני שבת" }, CITIES.map(function (c) { var o = el("option", { value: c[0], text: c[0] }); if (c[0] === place().name) o.selected = true; return o; }));
      city.addEventListener("change", function () { S.city = city.value; save(); });
      return [el("h2", { text: "⚙️ להורים" }), el("p", { class: "sub", text: "הכול נשמר בטלפון הזה." }),
        el("label", { class: "field" }, [el("span", { text: "שם הילד או הילדה" }), nm]),
        el("h3", { text: "⭐ למי אומרים לילה טוב?" }), el("p", { class: "fine", text: "כל שם הוא כוכב בשמיים (עד 9). אפשר בני משפחה, חברים מהגן, בובות וחיות." }), fam, form,
        el("label", { class: "field", style: "margin-top:14px" }, [el("span", { text: "הצליל שמתחיל כשכל הכוכבים ישנים" }), snd]),
        tog("voice", "🗣️ קול אומר ״לילה טוב״ (אם יש בטלפון קול בעברית)"),
        tog("btone", "🫧 צליל עדין בתרגיל הנשימה"),
        tog("shab", "🕯️ מצב שבת: בשבת ובחג האפליקציה נחה", checkRest),
        el("label", { class: "field" }, [el("span", { text: "העיר (לזמני שבת)" }), city]),
        el("p", { class: "fine", style: "margin-top:16px", text: "כל הצלילים והמנגינות נוצרים בטלפון עצמו, בלי הקלטות ובלי אינטרנט. המנגינות עממיות וישנות מאוד (נחלת הכלל): ״כוכב קטן״, שיר הערש של ברהמס ו״פְרֵרֶה ז׳אק״. כשמנגנים צליל, הוא ממשיך גם כשהמסך כבוי." })];
    });
  }
  $("set").addEventListener("click", openSettings);

  // =====================================================================================
  // Breathing with a bubble
  // =====================================================================================
  var BR = { on: false, mode: "bubble", n: 0, tm: 0, osc: null };
  var BMODES = [["bubble", "🫧 בועה"], ["flower", "🌸 פרח ונר"], ["balloon", "🎈 בלון"]];
  function openBreath() { $("breath").classList.add("on"); BR.on = true; BR.n = 0; SC.paused = true; ac(); drawBModes(); setTimeout(breathe, 700); }
  function closeBreath() { BR.on = false; clearTimeout(BR.tm); $("breath").classList.remove("on"); SC.paused = false; tone(0, 0.4); var b = $("bubble"); b.style.transitionDuration = "1s"; b.style.transform = "scale(.55)"; }
  function drawBModes() { var box = $("bmode"); box.replaceChildren.apply(box, BMODES.map(function (m) { return el("button", { class: "chip", type: "button", "aria-pressed": String(BR.mode === m[0]), text: m[1], onclick: function () { BR.mode = m[0]; drawBModes(); } }); })); }
  function breathe() {
    if (!BR.on) return;
    var b = $("bubble"), w = $("bword"), M = BR.mode, IN = 4, HOLD = 2, OUT = 6;
    if (BR.n >= 5) { w.textContent = "כל הכבוד! הגוף רגוע 💜"; $("bcount").textContent = "אפשר עוד סיבוב, או לעצום עיניים"; b.textContent = "😌"; BR.n = 0; BR.tm = setTimeout(breathe, 6000); return; }
    BR.n++; $("bcount").textContent = "נשימה " + BR.n + " מתוך 5";
    b.textContent = M === "flower" ? "🌸" : M === "balloon" ? "🎈" : ""; w.textContent = M === "flower" ? "מריחים את הפרח..." : M === "balloon" ? "מנפחים את הבלון..." : "שואפים...";
    b.style.transitionDuration = IN + "s"; b.style.transform = "scale(1)"; tone(1, IN);
    BR.tm = setTimeout(function () {
      if (!BR.on) return; w.textContent = "עוצרים רגע"; tone(0.6, HOLD);
      BR.tm = setTimeout(function () {
        if (!BR.on) return; b.textContent = M === "flower" ? "🕯️" : M === "balloon" ? "🎈" : ""; w.textContent = M === "flower" ? "מכבים את הנר... פוּוּוּ" : M === "balloon" ? "משחררים את האוויר..." : "נושפים לאט...";
        b.style.transitionDuration = OUT + "s"; b.style.transform = "scale(.55)"; tone(0, OUT);
        BR.tm = setTimeout(breathe, OUT * 1000 + 300);
      }, HOLD * 1000);
    }, IN * 1000);
  }
  function tone(level, secs) { // a soft hum that rises with the breath in and falls with the breath out
    if (!S.btone) return; var a = ac(); if (!a) return;
    if (!BR.osc) { var o = a.createOscillator(), o2 = a.createOscillator(), gn = a.createGain(), lpf = a.createBiquadFilter(); lpf.type = "lowpass"; lpf.frequency.value = 900; o.type = "sine"; o2.type = "triangle"; o.frequency.value = 196; o2.frequency.value = 294; gn.gain.value = 0.0001; o.connect(gn); o2.connect(gn); gn.connect(lpf); lpf.connect(a.destination); o.start(); o2.start(); BR.osc = { o: o, o2: o2, g: gn }; }
    var t = a.currentTime, x = BR.osc; x.g.gain.cancelScheduledValues(t); x.g.gain.setValueAtTime(Math.max(0.0001, x.g.gain.value), t); x.g.gain.linearRampToValueAtTime(level ? 0.05 * level : 0.0001, t + secs);
    x.o.frequency.cancelScheduledValues(t); x.o.frequency.setValueAtTime(x.o.frequency.value, t); x.o.frequency.linearRampToValueAtTime(level ? 196 + 60 * level : 196, t + secs);
  }
  $("dBreath").addEventListener("click", openBreath);
  $("bclose").addEventListener("click", closeBreath);

  // =====================================================================================
  // Shema before sleep, with the four angels
  // =====================================================================================
  var SH = { i: 0, tm: 0 };
  var PAGES = [
    function () { return [el("p", { class: "note", text: "מכסים את העיניים ביד ואומרים לאט" }), el("p", { class: "verse", text: "שְׁמַע יִשְׂרָאֵל, ה׳ אֱלֹהֵינוּ, ה׳ אֶחָד." }), el("p", { class: "verse quiet", text: "בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד." })]; },
    function () { return [el("p", { class: "note", text: "הפרשה הראשונה, למי שרוצה" }), el("p", { class: "verse small", text: "וְאָהַבְתָּ אֵת ה׳ אֱלֹהֶיךָ בְּכָל לְבָבְךָ וּבְכָל נַפְשְׁךָ וּבְכָל מְאֹדֶךָ. וְהָיוּ הַדְּבָרִים הָאֵלֶּה אֲשֶׁר אָנֹכִי מְצַוְּךָ הַיּוֹם עַל לְבָבֶךָ. וְשִׁנַּנְתָּם לְבָנֶיךָ וְדִבַּרְתָּ בָּם בְּשִׁבְתְּךָ בְּבֵיתֶךָ וּבְלֶכְתְּךָ בַדֶּרֶךְ וּבְשָׁכְבְּךָ וּבְקוּמֶךָ. וּקְשַׁרְתָּם לְאוֹת עַל יָדֶךָ וְהָיוּ לְטֹטָפֹת בֵּין עֵינֶיךָ. וּכְתַבְתָּם עַל מְזֻזוֹת בֵּיתֶךָ וּבִשְׁעָרֶיךָ." })]; },
    function () { return [el("p", { class: "verse small", text: "הַמַּלְאָךְ הַגֹּאֵל אֹתִי מִכָּל רָע יְבָרֵךְ אֶת הַנְּעָרִים, וְיִקָּרֵא בָהֶם שְׁמִי וְשֵׁם אֲבֹתַי אַבְרָהָם וְיִצְחָק, וְיִדְגּוּ לָרֹב בְּקֶרֶב הָאָרֶץ." })]; },
    function () {
      var ph = [["בְּשֵׁם ה׳ אֱלֹהֵי יִשְׂרָאֵל:", -1], ["מִימִינִי מִיכָאֵל,", 0], ["וּמִשְּׂמֹאלִי גַּבְרִיאֵל,", 1], ["וּמִלְּפָנַי אוּרִיאֵל,", 2], ["וּמֵאֲחוֹרַי רְפָאֵל,", 3], ["וְעַל רֹאשִׁי שְׁכִינַת אֵל.", 4]];
      var v = el("p", { class: "verse small" }); ph.forEach(function (p, i) { v.append(el("span", { class: "ph", "data-o": String(p[1]), role: "button", tabindex: "0", text: p[0], onclick: function () { light(i); } }), document.createTextNode(" ")); });
      return [angels(), v];
    }
  ];
  function angels() {
    var NS = "http://www.w3.org/2000/svg", s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 360 340"); s.id = "angels"; s.setAttribute("role", "img"); s.setAttribute("aria-label", "ילד מגבו, ומסביבו ארבעה אורות: מימין מיכאל, משמאל גבריאל, מלפנים אוריאל, מאחור רפאל, ומעל הראש אור השכינה");
    s.innerHTML = '<defs><radialGradient id="og"><stop offset="0" stop-color="#FFF6D6"/><stop offset=".45" stop-color="#FFD66B" stop-opacity=".85"/><stop offset="1" stop-color="#FFD66B" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="hg"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".95"/><stop offset="1" stop-color="#FFD66B" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="pj" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E7CFF"/><stop offset="1" stop-color="#5B47D6"/></linearGradient></defs>' +
      '<g class="orb dim" data-o="2"><circle cx="180" cy="40" r="34" fill="url(#og)"/><circle cx="180" cy="40" r="9" fill="#FFF8E1"/><text x="180" y="88">אוריאל · לפניי</text></g>' +
      '<g class="orb dim" data-o="4"><ellipse cx="180" cy="122" rx="58" ry="18" fill="url(#hg)"/><text x="180" y="112" style="font-size:13px">שכינת אל</text></g>' +
      '<path d="M140 250 Q138 196 160 182 L200 182 Q222 196 220 250 Z" fill="url(#pj)"/>' +
      '<path d="M146 214 Q128 228 132 252" stroke="#7B6AF2" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M214 214 Q232 228 228 252" stroke="#7B6AF2" stroke-width="13" fill="none" stroke-linecap="round"/>' +
      '<circle cx="180" cy="156" r="30" fill="#3A2668"/><path d="M152 150 Q156 122 180 122 Q204 122 208 150 Q196 138 180 140 Q164 138 152 150Z" fill="#4A3384"/>' +
      '<g fill="#FFD66B" opacity=".7"><circle cx="165" cy="215" r="3"/><circle cx="195" cy="232" r="3"/><circle cx="178" cy="242" r="2.5"/><circle cx="160" cy="236" r="2"/><circle cx="200" cy="208" r="2"/></g>' +
      '<rect x="150" y="248" width="24" height="16" rx="8" fill="#2E2260"/><rect x="186" y="248" width="24" height="16" rx="8" fill="#2E2260"/>' +
      '<g class="orb dim" data-o="0"><circle cx="312" cy="196" r="44" fill="url(#og)"/><circle cx="312" cy="196" r="12" fill="#FFF8E1"/><text x="312" y="256">מיכאל · מימין</text></g>' +
      '<g class="orb dim" data-o="1"><circle cx="48" cy="196" r="44" fill="url(#og)"/><circle cx="48" cy="196" r="12" fill="#FFF8E1"/><text x="48" y="256">גבריאל · משמאל</text></g>' +
      '<g class="orb dim" data-o="3"><circle cx="180" cy="300" r="52" fill="url(#og)"/><circle cx="180" cy="300" r="15" fill="#FFF8E1"/><text x="180" y="336">רפאל · מאחוריי</text></g>';
    return s;
  }
  function light(i) {
    var spans = document.querySelectorAll("#shpage .ph"); if (!spans.length) return;
    spans.forEach(function (s, j) { s.classList.toggle("lit", j === i); });
    var o = spans[i] ? spans[i].getAttribute("data-o") : "-1";
    document.querySelectorAll("#angels .orb").forEach(function (g2) { var on = g2.getAttribute("data-o") === o; g2.classList.toggle("dim", !on && o !== "all"); });
    if (o !== "-1") chime([76, 79, 81, 84, 88][+o] || 79, 0.06);
  }
  function showPage() {
    clearInterval(SH.tm);
    var p = $("shpage"); p.replaceChildren.apply(p, PAGES[SH.i]()); $("shema").scrollTop = 0;
    $("shdots").replaceChildren.apply($("shdots"), PAGES.map(function (x, i) { return el("i", { class: i === SH.i ? "on" : "" }); }));
    $("shprev").style.visibility = SH.i ? "visible" : "hidden"; $("shnext").textContent = SH.i === PAGES.length - 1 ? "לילה טוב 🌙" : "הבא ←";
    if (SH.i === PAGES.length - 1) { var k = 0; light(0); SH.tm = setInterval(function () { k++; if (k > 5) { clearInterval(SH.tm); document.querySelectorAll("#angels .orb").forEach(function (g2) { g2.classList.remove("dim"); }); document.querySelectorAll("#shpage .ph").forEach(function (s) { s.classList.add("lit"); }); return; } light(k); }, 2600); }
  }
  function openShema() { SH.i = 0; $("shema").classList.add("on"); $("shclose").hidden = false; $("shnav").hidden = false; SC.paused = true; showPage(); }
  function closeShema() { clearInterval(SH.tm); $("shema").classList.remove("on"); $("shclose").hidden = true; $("shnav").hidden = true; SC.paused = false; }
  $("dShema").addEventListener("click", openShema);
  $("shclose").addEventListener("click", closeShema);
  $("shprev").addEventListener("click", function () { if (SH.i) { SH.i--; showPage(); } });
  $("shnext").addEventListener("click", function () { if (SH.i < PAGES.length - 1) { SH.i++; showPage(); } else closeShema(); });

  // =====================================================================================
  // Night light: a star projector, or a soft glow that breathes
  // =====================================================================================
  var COLORS = [["amber", "🧡 ענבר", [255, 176, 90]], ["rose", "🩷 ורוד", [255, 132, 178]], ["lav", "💜 לילך", [170, 140, 255]], ["aqua", "🩵 תכלת", [110, 210, 235]], ["moon", "🤍 ירח", [255, 238, 205]]];
  var NIGHT = { on: false, cv: $("ncv"), stars: [], t0: 0, raf: 0, asleep: false, press: 0, wl: null };
  function col() { return (COLORS.filter(function (c) { return c[0] === S.color; })[0] || COLORS[0])[2]; }
  function openNight() {
    sheet("night", function () {
      var b = el("input", { type: "range", min: "0.15", max: "1", step: "0.05", value: String(S.bright), "aria-label": "בהירות" }); b.addEventListener("input", function () { S.bright = +b.value; save(); });
      return [el("h2", { text: "🌌 מנורת לילה" }), el("p", { class: "sub", text: "המסך נשאר דולק עד סוף הזמן. יוצאים בלחיצה ארוכה." }),
        el("h3", { text: "מה מאיר?" }), chips([[true, "⭐ מקרן כוכבים"], [false, "🕯️ אור רך שנושם"]], S.proj, function (v) { S.proj = v; save(); openNight(); }),
        el("h3", { text: "צבע" }), chips(COLORS, S.color, function (v) { S.color = v; save(); openNight(); }),
        el("label", { class: "vol" }, [el("span", { text: "בהירות" }), b]),
        el("h3", { text: "⏲️ כמה זמן?" }), chips(TIMERS, S.timer, function (v) { S.timer = v; save(); openNight(); }),
        el("button", { class: "btn wide", type: "button", text: "🌙 להדליק", onclick: function () { closeSheet(); startNight(); } })];
    });
  }
  function startNight() {
    var c = NIGHT.cv, d = Math.min(2, window.devicePixelRatio || 1); c.width = innerWidth * d; c.height = innerHeight * d;
    var r = rnd(21); NIGHT.stars = [];
    for (var i = 0; i < 170; i++) NIGHT.stars.push({ a: r() * TAU, d: Math.sqrt(r()), s: 0.6 + Math.pow(r(), 3) * 3.2, p: r() * TAU, big: r() < 0.07 });
    NIGHT.on = true; NIGHT.asleep = false; NIGHT.t0 = performance.now(); SC.paused = true; $("night").classList.add("on"); hint("לחיצה ארוכה ליציאה");
    if (!P.end || !(P.amb.id || P.mus.id)) startTimer();
    wake(true); nightLoop();
  }
  function nightLoop() {
    cancelAnimationFrame(NIGHT.raf); var c = NIGHT.cv, x = c.getContext("2d"), last = 0;
    (function f(now) {
      if (!NIGHT.on) return; NIGHT.raf = requestAnimationFrame(f); if (now - last < 48) return; last = now;
      var d = Math.min(2, window.devicePixelRatio || 1), Wn = c.width / d, Hn = c.height / d, t = (now - NIGHT.t0) / 1000, k = col(), br = S.bright * (NIGHT.asleep ? 0 : 1) * fadeNight();
      x.setTransform(d, 0, 0, d, 0, 0); x.fillStyle = "#000"; x.fillRect(0, 0, Wn, Hn); if (br <= 0.001) return;
      var rgb = k.join(",");
      if (S.proj) {
        [[0.3, 0.35, 0.6, 0.22], [0.75, 0.6, 0.55, 0.17], [0.5, 0.85, 0.7, 0.14]].forEach(function (b, i) { var bx = Wn * b[0] + Math.sin(t * 0.05 + i * 2) * 60, by = Hn * b[1] + Math.cos(t * 0.04 + i) * 50, rr = Math.max(Wn, Hn) * b[2], gg = x.createRadialGradient(bx, by, 0, bx, by, rr); gg.addColorStop(0, "rgba(" + rgb + "," + b[3] * br + ")"); gg.addColorStop(1, "rgba(" + rgb + ",0)"); x.fillStyle = gg; x.fillRect(0, 0, Wn, Hn); });
        var cx = Wn / 2, cy = Hn * 1.1, R = Math.hypot(Wn, Hn) * 1.15, w = RM ? 0 : t * TAU / 300;
        x.globalCompositeOperation = "lighter";
        NIGHT.stars.forEach(function (s) {
          var a = s.a + w, sx = cx + Math.cos(a) * s.d * R, sy = cy + Math.sin(a) * s.d * R; if (sx < -20 || sx > Wn + 20 || sy < -20 || sy > Hn + 20) return;
          var al = Math.min(1, (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.8 + s.p))) * br * 1.25), q = s.s * (s.big ? 12 : 7);
          x.globalAlpha = al; x.drawImage(glow(Math.round((k[0] + 255) / 2) + "," + Math.round((k[1] + 255) / 2) + "," + Math.round((k[2] + 255) / 2)), sx - q / 2, sy - q / 2, q, q);
          if (s.big) { x.save(); x.translate(sx, sy); x.rotate(a); x.fillStyle = "rgba(255,255,255," + 0.8 * al + ")"; var Rr = s.s * 2.2; x.beginPath(); for (var i = 0; i < 10; i++) { var aa = -Math.PI / 2 + i * Math.PI / 5, r2 = i % 2 ? Rr * 0.45 : Rr; if (i) x.lineTo(Math.cos(aa) * r2, Math.sin(aa) * r2); else x.moveTo(Math.cos(aa) * r2, Math.sin(aa) * r2); } x.closePath(); x.fill(); x.restore(); }
        });
        // a crescent moon that goes round with the stars
        var ma = -Math.PI / 2 - 0.35 + w, mx = cx + Math.cos(ma) * R * 0.62, my = cy + Math.sin(ma) * R * 0.62, mr = Math.min(Wn, Hn) * 0.07;
        x.globalAlpha = 0.85 * br; x.fillStyle = "rgba(" + Math.round((k[0] + 255) / 2) + "," + Math.round((k[1] + 255) / 2) + "," + Math.round((k[2] + 255) / 2) + ",1)";
        x.beginPath(); x.arc(mx, my, mr, 0, TAU); x.arc(mx + mr * 0.45, my - mr * 0.2, mr * 0.88, 0, TAU, true); x.fill("evenodd");
        x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
      } else {
        var bre = 0.5 + 0.5 * Math.sin(t * TAU / 9), rr = Math.min(Wn, Hn) * (0.55 + 0.12 * bre), gg = x.createRadialGradient(Wn / 2, Hn * 0.45, 0, Wn / 2, Hn * 0.45, rr);
        gg.addColorStop(0, "rgba(" + rgb + "," + (0.55 + 0.25 * bre) * br + ")"); gg.addColorStop(0.5, "rgba(" + rgb + "," + 0.22 * br + ")"); gg.addColorStop(1, "rgba(" + rgb + ",0)");
        x.fillStyle = gg; x.fillRect(0, 0, Wn, Hn);
      }
    })(0);
  }
  function fadeNight() { if (!P.end) return 1; return Math.max(0, Math.min(1, (P.end - Date.now()) / 120000)); }
  function nightSleep() { NIGHT.asleep = true; wake(false); hint(""); }
  function stopNight() { NIGHT.on = false; cancelAnimationFrame(NIGHT.raf); $("night").classList.remove("on"); SC.paused = false; wake(false); if (!P.amb.id && !P.mus.id) P.end = 0; updNow(); checkRest(); }
  var hintT = 0;
  function hint(t) { var h = $("nhint"); h.textContent = t; h.style.opacity = "1"; clearTimeout(hintT); hintT = setTimeout(function () { h.style.opacity = "0"; }, 3500); }
  (function () {
    var n = $("night"), ring = $("nring"), tm = 0;
    n.addEventListener("pointerdown", function (e) {
      ring.style.left = e.clientX + "px"; ring.style.top = e.clientY + "px"; ring.classList.remove("go"); void ring.offsetWidth; ring.classList.add("go");
      tm = setTimeout(function () { ring.classList.remove("go"); stopNight(); }, 800);
      if (NIGHT.asleep) { NIGHT.asleep = false; startTimer(); wake(true); }
      hint((P.end ? "⏲️ עוד " + left() + " · " : "") + "לחיצה ארוכה ליציאה");
    });
    var cancel = function () { clearTimeout(tm); ring.classList.remove("go"); };
    n.addEventListener("pointerup", cancel); n.addEventListener("pointercancel", cancel); n.addEventListener("pointerleave", cancel);
  })();
  function wake(on) {
    try {
      if (on && navigator.wakeLock && !NIGHT.wl) navigator.wakeLock.request("screen").then(function (l) { NIGHT.wl = l; l.addEventListener("release", function () { NIGHT.wl = null; }); }).catch(function () {});
      if (!on && NIGHT.wl) { NIGHT.wl.release(); NIGHT.wl = null; }
    } catch (e) {}
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && NIGHT.on && !NIGHT.asleep) wake(true); });
  $("dNight").addEventListener("click", function () { unlock(); openNight(); });

  // =====================================================================================
  // Shabbat and holidays: the app rests from candle lighting to the end, by the chosen town.
  // A light or a sound started before Shabbat keeps going until its timer ends.
  // =====================================================================================
  function place() { var c = CITIES.filter(function (x) { return x[0] === S.city; })[0] || CITIES[0]; return { name: c[0], lat: c[1], lon: c[2], b: c[3] }; }
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
  function hm(t) { var d = new Date(t); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function checkRest() {
    var busy = NIGHT.on || P.amb.id || P.mus.id, e = S.shab && !busy ? holyEnd(Date.now()) : 0, r = $("rest");
    if (e) { r.hidden = false; $("restT").textContent = new Date(e).getDay() === 6 ? "שבת שלום" : "חג שמח"; $("restP").textContent = "HaniaLayla נחה עכשיו, ותחזור ב־" + hm(e) + " (" + place().name + ")"; SC.paused = true; }
    else if (!r.hidden) { r.hidden = true; SC.paused = false; }
  }
  $("restOff").addEventListener("click", function () { S.shab = false; save(); checkRest(); });
  setInterval(checkRest, 60000);

  // ---------- start ----------
  layout(); hello(); checkRest(); requestAnimationFrame(loop);
  if (navigator.webdriver) window.__L = SC; // automated tests read the star positions
  setTimeout(function () { var s = $("splash"); s.style.opacity = "0"; setTimeout(function () { s.remove(); }, 1200); }, 1300);
  if (window.speechSynthesis) try { speechSynthesis.getVoices(); speechSynthesis.addEventListener("voiceschanged", function () { HEV = null; }); } catch (e) {}
  if ("serviceWorker" in navigator) addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
})();
