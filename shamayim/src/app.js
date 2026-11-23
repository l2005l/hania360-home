// HaniaShamayim (the sky above you): the live sky over the person's town, drawn on one canvas.
// Joined after Astronomy Engine, satellite.js and the star data (SKY) by shamayim/build.py into sky.js.
(function () {
  "use strict";
  var A = window.Astronomy, SAT = window.satellite, D = window.SKY;
  var cv = document.getElementById("sky"), g = cv.getContext("2d");
  var R = Math.PI / 180, TAU = Math.PI * 2;
  var $ = function (id) { return document.getElementById(id); };
  function el(t, a, kids) { var e = document.createElement(t); for (var k in a || {}) { if (k === "text") e.textContent = a[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), a[k]); else if (a[k] != null) e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c != null) e.append(c); }); return e; }

  // ---------- settings (kept on the phone, and in the account through the site's backup) ----------
  var S = (function () { try { return JSON.parse(localStorage.getItem("shamayim-v1")) || {}; } catch (e) { return {}; } })();
  var DEF = { lines: true, names: true, mw: true, ecl: false, grid: false, red: false };
  for (var k in DEF) if (S[k] == null) S[k] = DEF[k];
  function save() { try { localStorage.setItem("shamayim-v1", JSON.stringify(S)); } catch (e) {} }
  var CITIES = /*CITIES*/[["ירושלים", 31.778, 35.235, 40]];
  if (!S.place) {
    var city = CITIES[0];
    try { var cm = document.cookie.match(/(?:^|; *)h360_i=([^;]*)/), co = cm ? JSON.parse(decodeURIComponent(cm[1])) : {}; if (co.c) city = CITIES.filter(function (c) { return c[0] === co.c[0]; })[0] || city; } catch (e) {}
    S.place = { name: city[0], lat: city[1], lon: city[2] };
  }

  // ---------- time ----------
  var T = { off: 0, speed: 0, last: performance.now() };
  function now() { return new Date(Date.now() + T.off); }
  function hm(d) { return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" }); }
  function dayName(d) {
    var a = d.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" }), n = new Date(), b = n.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
    var t = new Date(n.getTime() + 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" }), y = new Date(n.getTime() - 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
    return a === b ? "היום" : a === t ? "מחר" : a === y ? "אתמול" : d.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "numeric", timeZone: "Asia/Jerusalem" });
  }
  function when(d) { return dayName(d) + " " + hm(d); }

  // ---------- vectors ----------
  function eqv(raDeg, decDeg) { var a = raDeg * R, d = decDeg * R, c = Math.cos(d); return [c * Math.cos(a), c * Math.sin(a), Math.sin(d)]; }
  var STARS = D.stars.map(function (s) { var v = eqv(s[0], s[1]); return { v: v, m: s[2], bv: s[3] }; });
  var NAMED = D.named.map(function (n) { return { v: eqv(n[0], n[1]), m: n[2], he: n[3], en: n[4], c: n[5], ra: n[0], dec: n[1] }; });
  var CONS = D.cons.map(function (c) { return { id: c[0], he: c[1], en: c[2], rank: c[3], v: eqv(c[4], c[5]), lines: c[6].map(function (seg) { return seg.map(function (p) { return eqv(p[0], p[1]); }); }), ra: c[4], dec: c[5] }; });
  var MW = D.mw.map(function (m) { return { lvl: m[0], polys: m[1].map(function (p) { return p.map(function (q) { return eqv(q[0], q[1]); }); }) }; });
  var CONSBY = {}; CONS.forEach(function (c) { CONSBY[c.id] = c; });
  // the twelve mazalot, by Hebrew month (from Nisan)
  var MAZAL = ["Ari", "Tau", "Gem", "Cnc", "Leo", "Vir", "Lib", "Sco", "Sgr", "Cap", "Aqr", "Psc"];
  var MAZSET = {}; MAZAL.forEach(function (m) { MAZSET[m] = 1; });
  var TRAD = { Ori: "כסיל", UMa: "העגלה הגדולה · עש", Sco: "מזל עקרב", Tau: "מזל שור, ובו כימה", Leo: "מזל אריה", Gem: "מזל תאומים", Cnc: "מזל סרטן", Vir: "מזל בתולה", Lib: "מזל מאזניים", Sgr: "מזל קשת", Cap: "מזל גדי", Aqr: "מזל דלי", Psc: "מזל דגים", Ari: "מזל טלה" };
  // the Pleiades, Kima (Iyov 38:31)
  NAMED.push({ v: eqv(56.75, 24.12), m: 1.6, he: "כימה (הפליאדות)", en: "Pleiades", c: "Tau", ra: 56.75, dec: 24.12, cluster: 1 });

  // ---------- the observer, the camera ----------
  var cam = { az: 180, alt: 35, fov: 80, roll: 0 }, W = 0, H = 0, DPR = 1, ON = { eh: null, P: null };
  function resize() { DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; g.setTransform(DPR, 0, 0, DPR, 0, 0); need = 1; }
  addEventListener("resize", resize); resize();
  function lst(d) { return (A.SiderealTime(d) * 15 + S.place.lon + 720) % 360; }
  // equatorial (J2000) -> horizontal East/North/Up
  function eq2hor(d) {
    var L = lst(d) * R, f = S.place.lat * R, sL = Math.sin(L), cL = Math.cos(L), sf = Math.sin(f), cf = Math.cos(f);
    return [[-sL, cL, 0], [-sf * cL, -sf * sL, cf], [cf * cL, cf * sL, sf]];
  }
  function camBasis() {
    var a = cam.az * R, h = cam.alt * R, ca = Math.cos(a), sa = Math.sin(a), ch = Math.cos(h), sh = Math.sin(h);
    var f = [sa * ch, ca * ch, sh], r = [ca, -sa, 0], u = [-sa * sh, -ca * sh, ch], cr = Math.cos(cam.roll * R), sr = Math.sin(cam.roll * R);
    return { f: f, r: [r[0] * cr + u[0] * sr, r[1] * cr + u[1] * sr, r[2] * cr + u[2] * sr], u: [u[0] * cr - r[0] * sr, u[1] * cr - r[1] * sr, u[2] * cr - r[2] * sr] };
  }
  function mul(M, v) { return [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]]; }
  var F = { M: null, B: null, s: 1 };
  function frameSetup(d) {
    F.M = eq2hor(d); F.B = camBasis();
    F.s = (W / 2) / (2 * Math.tan(cam.fov * R / 4));
    var M = F.M, B = F.B;
    // one matrix from the sky to the camera
    F.P = [0, 1, 2].map(function (i) { var row = [B.r, B.u, B.f][i]; return [0, 1, 2].map(function (j) { return row[0] * M[0][j] + row[1] * M[1][j] + row[2] * M[2][j]; }); });
  }
  // horizontal vector -> screen; returns null behind the camera
  function projH(h) {
    var B = F.B, x = h[0] * B.r[0] + h[1] * B.r[1] + h[2] * B.r[2], y = h[0] * B.u[0] + h[1] * B.u[1] + h[2] * B.u[2], z = h[0] * B.f[0] + h[1] * B.f[1] + h[2] * B.f[2];
    if (z < -0.6) return null; var k = 2 / (1 + z); return [W / 2 + F.s * k * x, H / 2 - F.s * k * y, z];
  }
  function projE(v) {
    var P = F.P, x = P[0][0] * v[0] + P[0][1] * v[1] + P[0][2] * v[2], y = P[1][0] * v[0] + P[1][1] * v[1] + P[1][2] * v[2], z = P[2][0] * v[0] + P[2][1] * v[1] + P[2][2] * v[2];
    if (z < -0.6) return null; var k = 2 / (1 + z); return [W / 2 + F.s * k * x, H / 2 - F.s * k * y, z];
  }
  function altOf(v) { var M = F.M; return Math.asin(Math.max(-1, Math.min(1, M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]))) / R; }
  function azOf(v) { var M = F.M, e = M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], n = M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2]; return (Math.atan2(e, n) / R + 360) % 360; }
  function hv(az, alt) { var a = az * R, h = alt * R; return [Math.sin(a) * Math.cos(h), Math.cos(a) * Math.cos(h), Math.sin(h)]; }
  var DIRS = ["צפון", "צפון־מזרח", "מזרח", "דרום־מזרח", "דרום", "דרום־מערב", "מערב", "צפון־מערב"];
  function dirName(az) { return DIRS[Math.round(az / 45) % 8]; }

  // ---------- the Sun, Moon and planets ----------
  var BODIES = [["Sun", "השמש", "#FFE7A3"], ["Moon", "הירח", "#F4F1E8"], ["Mercury", "כוכב חמה", "#D9C7A7"], ["Venus", "נוגה", "#FFF4D6"], ["Mars", "מאדים", "#FF8A5B"], ["Jupiter", "צדק", "#F3D9B0"], ["Saturn", "שבתאי", "#EBD58F"], ["Uranus", "אורנוס", "#AEE7F0"], ["Neptune", "נפטון", "#8FB3FF"]];
  var BOD = {}, bodT = 0;
  function observer() { return new A.Observer(S.place.lat, S.place.lon, 100); }
  function updBodies(d, force) {
    if (!force && Math.abs(d - bodT) < 20000) return; bodT = +d;
    var o = observer();
    BODIES.forEach(function (b) {
      var eq = A.Equator(A.Body[b[0]], d, o, false, true), mag = null, dist = eq.dist;
      try { if (b[0] !== "Sun") mag = A.Illumination(A.Body[b[0]], d).mag; } catch (e) {}
      BOD[b[0]] = { id: b[0], he: b[1], col: b[2], v: eqv(eq.ra * 15, eq.dec), mag: b[0] === "Sun" ? -26.7 : mag, dist: dist, ra: eq.ra * 15, dec: eq.dec };
    });
    var il = A.Illumination(A.Body.Moon, d); BOD.Moon.frac = il.phase_fraction; BOD.Moon.phase = A.MoonPhase(d);
  }
  function sunAlt(d) { updBodies(d); frameSetup(d); return altOf(BOD.Sun.v); }

  // ---------- the space station: orbit from /api/sky/tle (CelesTrak), positions here ----------
  var ISS = { rec: null, pos: null, trail: [], passes: null };
  function loadTLE() {
    fetch("/api/sky/tle").then(function (r) { return r.ok ? r.text() : ""; }).then(function (t) {
      var L = t.trim().split(/\r?\n/); if (L.length < 3) return;
      ISS.rec = SAT.twoline2satrec(L[1].trim(), L[2].trim()); ISS.passes = null; setTimeout(computePasses, 400);
    }).catch(function () {});
  }
  function issLook(d) {
    if (!ISS.rec) return null;
    var pv = SAT.propagate(ISS.rec, d); if (!pv || !pv.position) return null;
    var gm = SAT.gstime(d), geo = { longitude: S.place.lon * R, latitude: S.place.lat * R, height: 0.1 };
    var la = SAT.ecfToLookAngles(geo, SAT.eciToEcf(pv.position, gm));
    return { az: la.azimuth / R, alt: la.elevation / R, km: la.rangeSat, eci: pv.position };
  }
  function sunlit(eci, d) {
    var s = A.GeoVector(A.Body.Sun, d, false), n = Math.hypot(s.x, s.y, s.z), u = [s.x / n, s.y / n, s.z / n];
    var dot = eci.x * u[0] + eci.y * u[1] + eci.z * u[2]; if (dot > 0) return true;
    var px = eci.x - dot * u[0], py = eci.y - dot * u[1], pz = eci.z - dot * u[2]; return Math.hypot(px, py, pz) > 6371;
  }
  function computePasses() {
    if (!ISS.rec) return;
    var out = [], t0 = Date.now(), cur = null, o = observer(), day = 0, run = ISS.run = {};
    (function chunk() {
      if (ISS.run !== run) return;
      var end = t0 + (day + 1) * 864e5;
      for (var t = t0 + day * 864e5; t < end; t += 30000) {
        var d = new Date(t), l = issLook(d); if (!l) continue;
        if (l.alt > 10) {
          if (!cur) cur = { start: t, max: 0, maxT: t, az0: l.az, vis: false };
          if (l.alt > cur.max) { cur.max = l.alt; cur.maxT = t; }
          cur.end = t; cur.az1 = l.az;
          if (!cur.vis) { var se = A.Equator(A.Body.Sun, d, o, true, true); if (A.Horizon(d, o, se.ra, se.dec, "normal").altitude < -6 && sunlit(l.eci, d)) cur.vis = true; }
        } else if (cur) { if (cur.vis) out.push(cur); cur = null; }
      }
      day++;
      if (out.length >= 3 || day >= 10) { ISS.passes = out; drawCards(); } else setTimeout(chunk, 30);
    })();
  }

  // ---------- the Hebrew calendar: molad and Kiddush Levana (Calendrical Calculations, Reingold & Dershowitz) ----------
  function hebLeap(y) { return (7 * y + 1) % 19 < 7; }
  function hebParts(d) {
    var p = new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jerusalem" }).formatToParts(d), o = {};
    p.forEach(function (x) { o[x.type] = x.value; }); return { y: +o.year, m: o.month, d: +o.day };
  }
  var MN = { Nisan: 1, Iyar: 2, Sivan: 3, Tamuz: 4, Av: 5, Elul: 6, Tishri: 7, Heshvan: 8, Kislev: 9, Tevet: 10, Shevat: 11, Adar: 12, "Adar I": 12, "Adar II": 13 };
  function molad(y, m) { // m: Nisan = 1 … Adar II = 13
    var me = m - 7 + Math.floor((235 * y - 234) / 19); if (m < 7) me += hebLeap(y) ? 13 : 12;
    var rd = -1373427 - 876 / 25920 + me * (29 + 13753 / 25920); // a moment in Jerusalem mean time
    var ms = Date.UTC(2000, 0, 1) + (rd - 730120) * 864e5;  // R.D. 730120 = 1 Jan 2000
    return { utc: new Date(ms - (35.2347 / 15) * 3600e3), rd: rd };
  }
  function moladText(mo) {
    var frac = mo.rd - Math.floor(mo.rd), parts = Math.round(frac * 25920), h = Math.floor(parts / 1080), rem = parts - h * 1080, mi = Math.floor(rem / 18), ch = rem - mi * 18;
    var wd = ((Math.floor(mo.rd) % 7) + 7) % 7; // R.D. 1 (1 January of year 1) was a Monday, so R.D. mod 7 = 0 is Sunday
    var DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    var cd = new Date(Date.UTC(2000, 0, 1) + (Math.floor(mo.rd) - 730120) * 864e5);
    return "יום " + DAYS[wd] + " " + cd.getUTCDate() + "." + (cd.getUTCMonth() + 1) + ", " + String(h).padStart(2, "0") + ":" + String(mi).padStart(2, "0") + " ו־" + ch + " חלקים";
  }
  function levana(d) {
    var hp = hebParts(d), m = MN[hp.m] || 1;
    if (hp.m === "Adar" && hebLeap(hp.y)) m = 13;
    var mo = molad(hp.y, m);
    var from = new Date(mo.utc.getTime() + 3 * 864e5), until = new Date(mo.utc.getTime() + (14 * 24 + 18) * 3600e3 + 22 * 60e3);
    return { mo: mo, from: from, until: until, month: hp.m, hd: hp.d };
  }

  // ---------- sprites ----------
  function bvColor(bv) {
    var t = Math.max(-0.3, Math.min(1.8, bv));
    var stops = [[-0.3, [160, 190, 255]], [0, [205, 220, 255]], [0.4, [250, 248, 255]], [0.8, [255, 236, 200]], [1.2, [255, 210, 150]], [1.8, [255, 170, 110]]];
    for (var i = 1; i < stops.length; i++) if (t <= stops[i][0]) { var a = stops[i - 1], b = stops[i], f = (t - a[0]) / (b[0] - a[0]); return a[1].map(function (c, j) { return Math.round(c + (b[1][j] - c) * f); }); }
    return stops[stops.length - 1][1];
  }
  var SPR = {};
  function sprite(rgb) {
    var key = rgb.join(","); if (SPR[key]) return SPR[key];
    var c = document.createElement("canvas"); c.width = c.height = 64; var x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.12, "rgba(" + key + ",0.95)"); gr.addColorStop(0.35, "rgba(" + key + ",0.28)"); gr.addColorStop(1, "rgba(" + key + ",0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return SPR[key] = c;
  }
  STARS.forEach(function (s) { var c = bvColor(s.bv); s.rgb = "rgb(" + c.join(",") + ")"; s.spr = sprite(c.map(function (q) { return q - q % 16; })); });

  // ---------- hills on the horizon (a gentle silhouette, the same every night) ----------
  var HILL = []; for (var hz = 0; hz <= 360; hz += 3) HILL.push([hz, 0.6 + 1.3 * Math.max(0, Math.sin(hz * R * 2.3) * Math.sin(hz * R * 0.7 + 1)) + 0.5 * Math.sin(hz * R * 7.1) * 0.5 + 0.35 * Math.sin(hz * R * 13)]);

  // ---------- drawing ----------
  var need = 1, sel = null, hits = [], twinkle = 0, fly = null, target = null, game = null, intro = 1, introT = performance.now();
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(c1, c2, t) { return "rgb(" + [0, 1, 2].map(function (i) { return Math.round(lerp(c1[i], c2[i], t)); }).join(",") + ")"; }
  function draw(t) {
    var d = now(); updBodies(d); frameSetup(d);
    var sun = BOD.Sun, sAlt = altOf(sun.v), night = Math.max(0, Math.min(1, (-sAlt - 2) / 14)); // 0 day … 1 full night
    var showStars = Math.max(0.08, night);
    hits = []; PLACED = [];
    // the sky's color
    var zen = projH([0, 0, 1]), horC = projH(hv(cam.az, 0)), top = zen ? zen[1] : -H, hy = horC ? horC[1] : H * 1.5;
    var gr = g.createLinearGradient(0, Math.min(top, hy - 10), 0, Math.max(hy, top + 10));
    var zDay = [44, 110, 200], zTw = [24, 32, 78], zN = [3, 6, 20], hDay = [150, 200, 240], hTw = [210, 120, 90], hN = [14, 22, 52];
    var tw = Math.max(0, 1 - Math.abs(sAlt + 4) / 10);
    var zc = sAlt > 0 ? mix(zTw, zDay, Math.min(1, sAlt / 10)) : mix(zN, zTw, Math.max(0, 1 - night)), hc = sAlt > 0 ? mix(hTw, hDay, Math.min(1, sAlt / 8)) : mix(hN, hTw, tw);
    gr.addColorStop(0, zc); gr.addColorStop(1, hc);
    g.globalCompositeOperation = "source-over"; g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // the Sun's glow over the horizon
    var sp = projE(sun.v);
    if (sp && sAlt > -18) {
      var low = sAlt < 0 ? Math.max(0, 1 + sAlt / 18) : Math.max(0, 1 - sAlt / 12), rg = g.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], Math.max(W, H) * (0.35 + 0.35 * low));
      if (low > 0) { rg.addColorStop(0, "rgba(255,190,120," + 0.5 * low + ")"); rg.addColorStop(1, "rgba(255,120,80,0)"); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
      if (sAlt > 0) { var hr = g.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], Math.max(W, H) * 0.45); hr.addColorStop(0, "rgba(255,255,240," + 0.4 * Math.min(1, sAlt / 6) + ")"); hr.addColorStop(1, "rgba(255,255,240,0)"); g.fillStyle = hr; g.fillRect(0, 0, W, H); }
    }
    var fade = intro < 1 ? intro : 1;
    // the Milky Way
    if (S.mw && night > 0.2) {
      g.globalCompositeOperation = "lighter";
      MW.forEach(function (m) {
        g.fillStyle = "rgba(170,185,255," + (0.022 * night * fade) + ")";
        m.polys.forEach(function (poly) { g.beginPath(); var ok = 0; for (var i = 0; i < poly.length; i++) { var p = projE(poly[i]); if (!p || p[2] < -0.2) { ok = 0; break; } if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); ok = 1; } if (ok) g.fill(); });
      });
    }
    // grid of altitude and azimuth
    if (S.grid) { g.globalCompositeOperation = "source-over"; g.strokeStyle = "rgba(125,211,252,.14)"; g.lineWidth = 1;
      for (var al = 15; al < 90; al += 15) path(function (i) { return hv(i * 5, al); }, 73);
      for (var az0 = 0; az0 < 360; az0 += 30) path(function (i) { return hv(az0, i * 3); }, 31); }
    // the ecliptic: the road of the mazalot
    if (S.ecl) { g.strokeStyle = "rgba(245,199,107,.35)"; g.setLineDash([6, 6]); g.lineWidth = 1.2; var e = 23.4393 * R;
      g.beginPath(); var st = 0; for (var i2 = 0; i2 <= 180; i2++) { var L = i2 * 2 * R, v = [Math.cos(L), Math.sin(L) * Math.cos(e), Math.sin(L) * Math.sin(e)], p2 = projE(v); if (!p2 || p2[2] < -0.2) { st = 0; continue; } if (st) g.lineTo(p2[0], p2[1]); else g.moveTo(p2[0], p2[1]); st = 1; } g.stroke(); g.setLineDash([]); }
    // constellation lines
    g.globalCompositeOperation = "source-over";
    if (S.lines) {
      CONS.forEach(function (c) {
        var mz = MAZSET[c.id], hl = (sel && sel.cons === c.id) || (game && game.id === c.id && game.found);
        g.strokeStyle = hl ? "rgba(245,199,107,.95)" : mz ? "rgba(245,199,107," + (0.28 * showStars * fade + 0.04) + ")" : "rgba(150,170,255," + (0.26 * showStars * fade + 0.03) + ")";
        g.lineWidth = hl ? 2 : 1;
        c.lines.forEach(function (seg) { g.beginPath(); var on = 0; seg.forEach(function (v) { var p = projE(v); if (!p || p[2] < -0.1) { on = 0; return; } if (on) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); on = 1; }); g.stroke(); });
      });
    }
    // stars
    var zf = Math.sqrt(80 / cam.fov), lim = 3.2 + 3 * showStars + (cam.fov < 40 ? 0.6 : 0);
    g.globalCompositeOperation = "lighter";
    twinkle += 0.05;
    for (var i = 0; i < STARS.length; i++) {
      var s = STARS[i]; if (s.m > lim) break;
      var p = projE(s.v); if (!p || p[0] < -20 || p[0] > W + 20 || p[1] < -20 || p[1] > H + 20) continue;
      var a = altOf(s.v); if (a < -1) continue;
      var ext = a < 12 ? Math.max(0.15, a / 12) : 1;
      var r = Math.max(0.55, (3.0 - 0.5 * s.m)) * zf, al2 = Math.min(1, (0.25 + (lim - s.m) / 4)) * showStars * ext * fade;
      if (s.m < 2.5) al2 *= 0.85 + 0.15 * Math.sin(twinkle * (1 + i % 7 * 0.13) + i);
      if (r > 1.4) { g.globalAlpha = al2; var q = r * 5.2; g.drawImage(s.spr, p[0] - q / 2, p[1] - q / 2, q, q); }
      else { g.globalAlpha = al2; g.fillStyle = s.rgb; g.fillRect(p[0] - r / 2, p[1] - r / 2, r + 0.4, r + 0.4); }
      if (s.m < 4.2) hits.push([p[0], p[1], 6 - s.m, { star: s, alt: a }]);
    }
    g.globalAlpha = 1;
    // the planets, the Moon and the Sun
    g.globalCompositeOperation = "source-over";
    ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"].forEach(function (id) {
      var b = BOD[id], p = projE(b.v); if (!p) return; var a = altOf(b.v); if (a < -1) return;
      var r = Math.max(2.2, 5 - 0.7 * (b.mag || 0)) * zf * 0.9, vis = Math.max(0.35, showStars);
      g.globalCompositeOperation = "lighter"; g.globalAlpha = vis * fade; var q = r * 6; g.drawImage(sprite(hexRgb(b.col)), p[0] - q / 2, p[1] - q / 2, q, q);
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.fillStyle = b.col; g.beginPath(); g.arc(p[0], p[1], r * 0.55, 0, TAU); g.fill();
      if (id === "Saturn") { g.strokeStyle = "rgba(235,213,143,.8)"; g.lineWidth = 1.2; g.beginPath(); g.ellipse(p[0], p[1], r * 1.3, r * 0.45, -0.4, 0, TAU); g.stroke(); }
      label(p, b.he, "#FFE9B8", 13, r + 6); hits.push([p[0], p[1], 9, { body: id, alt: a }]);
    });
    drawMoon(); drawSun(sAlt);
    // the space station
    var il = issLook(d);
    if (il && il.alt > -2) {
      var ip = projH(hv(il.az, il.alt));
      if (ip) { ISS.trail.push(ip); if (ISS.trail.length > 24) ISS.trail.shift();
        g.strokeStyle = "rgba(125,211,252,.5)"; g.lineWidth = 2; g.beginPath(); ISS.trail.forEach(function (q, k) { if (k) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.stroke();
        g.fillStyle = "#E0F7FF"; g.beginPath(); g.arc(ip[0], ip[1], 4, 0, TAU); g.fill(); label(ip, "🛰️ תחנת החלל", "#BDEBFF", 13, 10); hits.push([ip[0], ip[1], 10, { iss: 1, alt: il.alt, az: il.az, km: il.km }]); }
    } else ISS.trail = [];
    // labels: stars with names, constellations
    if (S.names && fade > 0.5 && night > 0.15) {
      g.globalAlpha = Math.min(1, night * 1.4);
      NAMED.forEach(function (n) { if (n.m > (cam.fov > 90 ? 1.6 : cam.fov > 50 ? 2.3 : 3.3)) return; var p = projE(n.v); if (!p || altOf(n.v) < 0) return; if (label(p, n.he, "rgba(225,232,255,.85)", 12, 7)) hits.push([p[0], p[1], 7 - n.m, { named: n }]); else hits.push([p[0], p[1], 5 - n.m, { named: n }]); });
      CONS.forEach(function (c) { if (c.rank > (cam.fov > 90 ? 1 : cam.fov > 50 ? 2 : 3)) return; var p = projE(c.v); if (!p || altOf(c.v) < 2) return; var mz = MAZSET[c.id];
        if (label([p[0], p[1] - 15], c.he, mz ? "rgba(245,199,107,.85)" : "rgba(170,185,255,.7)", mz ? 15 : 14, 0, mz ? "600 " : "500 ")) hits.push([p[0], p[1], 3, { cons: c }]); });
      g.globalAlpha = 1;
    }
    drawGround(sAlt);
    // the selected object: a ring
    if (sel && sel.v) { var p3 = projE(sel.v); if (p3) { var pulse = 1 + 0.12 * Math.sin(t / 300); g.strokeStyle = "rgba(245,199,107,.95)"; g.lineWidth = 2; g.beginPath(); g.arc(p3[0], p3[1], 16 * pulse, 0, TAU); g.stroke(); } }
    pointer(d);
  }
  function hexRgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function path(fn, n) { g.beginPath(); var on = 0; for (var i = 0; i < n; i++) { var p = projH(fn(i)); if (!p || p[2] < -0.2) { on = 0; continue; } if (on) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); on = 1; } g.stroke(); }
  var PLACED = [];
  function room(x, y, w, h) { for (var i = 0; i < PLACED.length; i++) { var q = PLACED[i]; if (x < q[0] + q[2] && x + w > q[0] && y < q[1] + q[3] && y + h > q[1]) return false; } PLACED.push([x, y, w, h]); return true; }
  function label(p, text, color, size, dy, font) {
    g.font = (font || "500 ") + size + "px Rubik, sans-serif"; g.textAlign = "center"; g.direction = "rtl";
    var w = g.measureText(text).width + 6, y = p[1] + dy + size;
    if (!room(p[0] - w / 2, y - size, w, size + 4)) { y = p[1] - dy; if (!room(p[0] - w / 2, y - size, w, size + 4)) return false; }
    g.fillStyle = "rgba(0,0,0,.55)"; g.fillText(text, p[0] + 1, y + 1); g.fillStyle = color; g.fillText(text, p[0], y); return true;
  }
  function drawMoon() {
    var m = BOD.Moon, p = projE(m.v); if (!p) return; var a = altOf(m.v); if (a < -1) return;
    var r = Math.max(9, F.s * 0.03);
    var glow = g.createRadialGradient(p[0], p[1], r * 0.8, p[0], p[1], r * 5); glow.addColorStop(0, "rgba(240,240,225," + 0.25 * m.frac + ")"); glow.addColorStop(1, "rgba(240,240,225,0)");
    g.fillStyle = glow; g.beginPath(); g.arc(p[0], p[1], r * 5, 0, TAU); g.fill();
    // the lit side points toward the Sun
    var sp = projE(BOD.Sun.v), ang = sp ? Math.atan2(sp[1] - p[1], sp[0] - p[0]) : 0;
    g.save(); g.translate(p[0], p[1]); g.rotate(ang);
    g.fillStyle = "#2A2C33"; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    var k = Math.cos(m.frac * Math.PI); // terminator: +1 new … -1 full
    g.fillStyle = "#F4F1E4"; g.beginPath(); g.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false); g.ellipse(0, 0, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k > 0); g.fill();
    g.globalAlpha = 0.18; g.fillStyle = "#9A9688"; [[-0.3, -0.25, 0.22], [0.2, 0.3, 0.18], [0.35, -0.2, 0.12], [-0.1, 0.45, 0.1]].forEach(function (c) { g.beginPath(); g.arc(c[0] * r, c[1] * r, c[2] * r, 0, TAU); g.fill(); });
    g.globalAlpha = 1; g.restore();
    label(p, "הירח", "#FFF6DA", 13, r + 4); hits.push([p[0], p[1], 12, { body: "Moon", alt: a }]);
  }
  function drawSun(sAlt) {
    var p = projE(BOD.Sun.v); if (!p || sAlt < -2) return;
    var r = 11 * Math.sqrt(80 / cam.fov), gl = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 6);
    gl.addColorStop(0, "rgba(255,250,220,1)"); gl.addColorStop(0.2, "rgba(255,220,140,.7)"); gl.addColorStop(1, "rgba(255,180,80,0)");
    g.fillStyle = gl; g.beginPath(); g.arc(p[0], p[1], r * 6, 0, TAU); g.fill(); hits.push([p[0], p[1], 12, { body: "Sun", alt: sAlt }]);
  }
  // stereographic projection keeps circles: the horizon is one circle on the screen. Looking up, the ground is
  // everything outside it; looking down, everything inside it. The hills are a thin band drawn on top.
  function projRaw(h) { var B = F.B, x = h[0] * B.r[0] + h[1] * B.r[1] + h[2] * B.r[2], y = h[0] * B.u[0] + h[1] * B.u[1] + h[2] * B.u[2], z = h[0] * B.f[0] + h[1] * B.f[1] + h[2] * B.f[2], k = 2 / Math.max(1e-6, 1 + z); return [W / 2 + F.s * k * x, H / 2 - F.s * k * y]; }
  function hillAt(az) { az = ((az % 360) + 360) % 360; var i = Math.floor(az / 3), f = az / 3 - i; return HILL[i][1] + (HILL[Math.min(HILL.length - 1, i + 1)][1] - HILL[i][1]) * f; }
  function drawGround(sAlt) {
    var light = Math.max(0, Math.min(1, (sAlt + 8) / 16)), col = mix([4, 7, 14], [32, 46, 40], light), col2 = mix([1, 2, 6], [18, 26, 22], light);
    var mid = projRaw(hv(cam.az, 0)), nad = projRaw([0, 0, -1]), dx = nad[0] - mid[0], dy = nad[1] - mid[1], n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
    var gr = g.createLinearGradient(mid[0], mid[1], mid[0] + dx * H * 0.8, mid[1] + dy * H * 0.8); gr.addColorStop(0, col); gr.addColorStop(1, col2);
    g.fillStyle = gr; g.beginPath();
    var p1 = projRaw(hv(cam.az, 0)), p2 = projRaw(hv(cam.az + 90, 0)), p3 = projRaw(hv(cam.az - 90, 0));
    var bx = p2[0] - p1[0], by = p2[1] - p1[1], cx = p3[0] - p1[0], cy = p3[1] - p1[1], dd = 2 * (bx * cy - by * cx);
    if (Math.abs(cam.alt) < 0.3 || Math.abs(dd) < 1e-6) { // the horizon is a straight line: fill the side with the nadir
      var lx = p3[0] - p2[0], ly = p3[1] - p2[1], ln = Math.hypot(lx, ly) || 1, BIG = 1e5; lx /= ln; ly /= ln; var nx = -ly, ny = lx; if (nx * dx + ny * dy < 0) { nx = -nx; ny = -ny; }
      g.moveTo(p2[0] - lx * BIG, p2[1] - ly * BIG); g.lineTo(p2[0] + lx * BIG, p2[1] + ly * BIG); g.lineTo(p2[0] + lx * BIG + nx * BIG, p2[1] + ly * BIG + ny * BIG); g.lineTo(p2[0] - lx * BIG + nx * BIG, p2[1] - ly * BIG + ny * BIG); g.closePath(); g.fill();
    } else {
      var ux = (cy * (bx * bx + by * by) - by * (cx * cx + cy * cy)) / dd, uy = (bx * (cx * cx + cy * cy) - cx * (bx * bx + by * by)) / dd, rr = Math.hypot(ux, uy);
      if (cam.alt > 0) { g.rect(-10, -10, W + 20, H + 20); g.arc(p1[0] + ux, p1[1] + uy, rr, 0, TAU); g.fill("evenodd"); }
      else { g.arc(p1[0] + ux, p1[1] + uy, rr, 0, TAU); g.fill(); }
    }
    // the hills
    var run = [], base = [];
    function flush() { if (run.length > 1) { g.beginPath(); g.moveTo(run[0][0], run[0][1]); run.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = base.length - 1; i >= 0; i--) g.lineTo(base[i][0], base[i][1]); g.closePath(); g.fill();
      g.strokeStyle = "rgba(160,175,255,.18)"; g.lineWidth = 1; g.beginPath(); g.moveTo(run[0][0], run[0][1]); run.forEach(function (p) { g.lineTo(p[0], p[1]); }); g.stroke(); g.fillStyle = gr; } run = []; base = []; }
    for (var az = cam.az - 180; az <= cam.az + 180; az += 2) {
      var p = projH(hv(az, hillAt(az))), q = projH(hv(az, -0.4));
      if (p && q && p[2] > -0.35 && q[2] > -0.35) { run.push(p); base.push(q); } else flush();
    }
    flush();
    // the four directions
    [[0, "צפון"], [90, "מזרח"], [180, "דרום"], [270, "מערב"], [45, "צ״מ"], [135, "ד״מ"], [225, "ד״מע"], [315, "צ״מע"]].forEach(function (c) {
      var p = projH(hv(c[0], -2.5)); if (!p || p[2] < 0) return; var main = c[0] % 90 === 0;
      g.font = (main ? "700 15px" : "500 12px") + " Rubik, sans-serif"; g.textAlign = "center"; g.direction = "rtl"; g.fillStyle = main ? "rgba(245,199,107,.9)" : "rgba(167,176,214,.7)"; g.fillText(c[1], p[0], p[1] + 14);
    });
  }
  // when the phone points elsewhere: an arrow toward the chosen object
  function pointer(d) {
    var ar = $("arrow"); if (!target) { ar.hidden = true; return; }
    var v = target.v || (target.h && null), p = v ? projE(v) : target.hv ? projH(target.hv) : null;
    var a = v ? altOf(v) : target.alt;
    if (p && p[0] > 30 && p[0] < W - 30 && p[1] > 70 && p[1] < H - 220 && p[2] > 0) { ar.hidden = true; if (gyro.on && Date.now() - (target.t || 0) > 600) { toast("✨ הנה " + target.name); target = null; } return; }
    ar.hidden = false;
    var B = F.B, h = v ? mul(F.M, v) : target.hv, x = h[0] * B.r[0] + h[1] * B.r[1] + h[2] * B.r[2], y = h[0] * B.u[0] + h[1] * B.u[1] + h[2] * B.u[2], ang = Math.atan2(-y, x);
    var cx = W / 2 + Math.cos(ang) * (W / 2 - 46), cy = (H - 160) / 2 + Math.sin(ang) * ((H - 160) / 2 - 60);
    ar.style.left = cx + "px"; ar.style.top = cy + "px"; ar.firstChild.style.transform = "rotate(" + (ang / R + 90) + "deg)";
    $("arrowT").textContent = target.name + (a < 0 ? " (מתחת לאופק)" : "");
  }

  // ---------- the loop ----------
  var lastFrame = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    if (T.speed) { T.off += (t - T.last) * T.speed; need = 1; timeLabel(); }
    T.last = t;
    if (intro < 1) { intro = Math.min(1, (t - introT) / 2200); need = 1; }
    if (fly) { var k = Math.min(1, (t - fly.t0) / fly.ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; cam.az = fly.az0 + fly.daz * e; cam.alt = fly.alt0 + (fly.alt1 - fly.alt0) * e; cam.fov = fly.f0 + (fly.f1 - fly.f0) * e; need = 1; if (k >= 1) fly = null; }
    if (gyro.on) need = 1;
    // idle: a gentle 12 frames a second keeps the twinkle and the station moving without spending the battery
    if (!need && t - lastFrame < 83) return;
    need = 0; lastFrame = t;
    try { draw(t); } catch (err) { console.error(err); }
    if (game) gameTick();
  }

  // ---------- touch: drag, pinch, tap ----------
  var ptrs = {}, drag = null, pinch = null, moved = 0;
  cv.addEventListener("pointerdown", function (e) { cv.setPointerCapture(e.pointerId); ptrs[e.pointerId] = [e.clientX, e.clientY]; var ids = Object.keys(ptrs); moved = 0; fly = null;
    if (ids.length === 1) drag = { x: e.clientX, y: e.clientY, az: cam.az, alt: cam.alt };
    if (ids.length === 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), f: cam.fov }; drag = null; } });
  cv.addEventListener("pointermove", function (e) {
    if (!ptrs[e.pointerId]) return; ptrs[e.pointerId] = [e.clientX, e.clientY]; var ids = Object.keys(ptrs);
    if (pinch && ids.length === 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]], dd = Math.hypot(a[0] - b[0], a[1] - b[1]); cam.fov = clampF(pinch.f * pinch.d / dd); need = 1; moved = 9; return; }
    if (drag && !gyro.on) { var dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); var k = cam.fov / W * 1.15;
      cam.az = (drag.az - dx * k + 720) % 360; cam.alt = Math.max(-85, Math.min(89, drag.alt + dy * k)); need = 1; }
  });
  function up(e) { delete ptrs[e.pointerId]; if (Object.keys(ptrs).length < 2) pinch = null; if (!Object.keys(ptrs).length) { if (moved < 6 && drag) tap(e.clientX, e.clientY); drag = null; } }
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", function (e) { e.preventDefault(); cam.fov = clampF(cam.fov * (1 + e.deltaY * 0.0012)); need = 1; }, { passive: false });
  addEventListener("keydown", function (e) { var k = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 4], ArrowDown: [0, -4] }[e.key]; if (k && !document.querySelector(".sheet.open")) { cam.az = (cam.az + k[0] + 360) % 360; cam.alt = Math.max(-85, Math.min(89, cam.alt + k[1])); need = 1; } });
  function clampF(f) { return Math.max(12, Math.min(130, f)); }
  function tap(x, y) {
    var best = null, bd = 30;
    hits.forEach(function (h) { var dd = Math.hypot(h[0] - x, h[1] - y) - h[2] * 1.5; if (dd < bd) { bd = dd; best = h[3]; } });
    if (best) openObj(best); else { sel = null; need = 1; closeSheet(); }
  }
  function flyTo(v, name, fovTo) {
    frameSetup(now());
    var az = azOf(v), al = altOf(v);
    target = { v: v, name: name, t: Date.now() };
    if (gyro.on) { need = 1; return; }
    var daz = ((az - cam.az + 540) % 360) - 180;
    fly = { t0: performance.now(), ms: 1100, az0: cam.az, daz: daz, alt0: cam.alt, alt1: Math.max(-10, Math.min(80, al + (al < 5 ? 15 : 0))), f0: cam.fov, f1: fovTo || Math.min(cam.fov, 70) };
    setTimeout(function () { if (!gyro.on) target = null; }, 1300);
  }

  // ---------- facts ----------
  var KIDS = {
    Sun: "השמש היא כוכב, כמו כל הכוכבים בלילה, רק הכי קרוב אלינו. נכנסים בה יותר ממיליון כדורי ארץ!",
    Moon: "הירח לא מאיר בעצמו: הוא מחזיר את אור השמש. לכן כל לילה רואים חלק אחר ממנו מואר, ובראש חודש הוא כמעט נעלם.",
    Mercury: "כוכב חמה הוא הכוכב הקרוב ביותר לשמש, ושנה שלו נמשכת רק 88 ימים.", Venus: "נוגה הוא הדבר הכי בהיר בשמיים אחרי השמש והירח. קוראים לו גם ״כוכב השחר״ ו״כוכב הערב״.",
    Mars: "מאדים אדום כי האדמה שלו מלאה חלודה. יש בו את ההר הגבוה ביותר במערכת השמש!", Jupiter: "צדק הוא כוכב הלכת הגדול ביותר: נכנסים בו יותר מ־1,300 כדורי ארץ. יש לו עשרות ירחים.",
    Saturn: "שבתאי מוקף טבעות יפות מקרח ואבן. הוא כל כך קל, שהיה צף על מים (אילו הייתה אמבטיה גדולה מספיק).", Uranus: "אורנוס מסתובב על הצד, כאילו התגלגל.", Neptune: "בנפטון נושבות הרוחות המהירות ביותר שנמדדו במערכת השמש."
  };
  var STARFACT = { "סיריוס": "הכוכב הבהיר ביותר בשמי הלילה. האור שלו יצא לפני כ־9 שנים.", "כוכב הצפון": "כמעט לא זז! כל השמיים מסתובבים סביבו, ולכן אפשר למצוא בעזרתו את הצפון.", "ביטלג'וז": "ענק אדום ענקי: אילו היה במקום השמש, הוא היה בולע את מאדים.", "וגה": "אחד הכוכבים הבהירים, כחלחל, במרחק 25 שנות אור.", "אנטארס": "״הלב של העקרב״: ענק אדום שקל לזהות בקיץ.", "כימה (הפליאדות)": "צביר של כוכבים צעירים. ״התקשר מעדנות כימה״ (איוב לח). בעין רואים 6 או 7 מהם." };
  function riseSetText(v, isBody) {
    try {
      var o = observer(), d = now(), r, s;
      if (isBody) { r = A.SearchRiseSet(A.Body[isBody], o, +1, d, 1.2); s = A.SearchRiseSet(A.Body[isBody], o, -1, d, 1.2); }
      else { A.DefineStar(A.Body.Star1, v.ra / 15, v.dec, 1000); r = A.SearchRiseSet(A.Body.Star1, o, +1, d, 1.2); s = A.SearchRiseSet(A.Body.Star1, o, -1, d, 1.2); }
      return [r ? when(r.date) : "לא עולה", s ? when(s.date) : "לא שוקע"];
    } catch (e) { return ["—", "—"]; }
  }
  function phaseName(ph, fr) { if (fr == null) fr = (1 - Math.cos(ph * R)) / 2; var wax = ph < 180;
    return fr < 0.03 ? "מולד הלבנה" : fr > 0.97 ? "ירח מלא" : fr > 0.88 ? (wax ? "כמעט מלא" : "אחרי המילוי") : fr > 0.58 ? (wax ? "מתמלא" : "הולך ומתמעט") : fr > 0.42 ? (wax ? "חצי ירח, מתמלא" : "חצי ירח, מתמעט") : (wax ? "סהר מתמלא" : "סהר הולך וקטן"); }
  function openObj(o) {
    var d = now(); frameSetup(d);
    if (o.body) {
      var b = BOD[o.body]; sel = { v: b.v }; var rs = riseSetText(null, o.body), a = altOf(b.v), az = azOf(b.v);
      var facts = [["גובה מעל האופק", a.toFixed(0) + "°"], ["כיוון", dirName(az)], ["זריחה", rs[0]], ["שקיעה", rs[1]]];
      if (o.body === "Moon") facts.push(["מואר", Math.round(b.frac * 100) + "%"], ["שלב", phaseName(b.phase, b.frac)]);
      else if (o.body !== "Sun") facts.push(["מרחק", Math.round(b.dist * 149.6).toLocaleString("he-IL") + " מיליון ק״מ"], ["בהירות", (b.mag || 0).toFixed(1)]);
      sheet(b.he, o.body === "Sun" ? "הכוכב שלנו" : o.body === "Moon" ? "הלוויין של כדור הארץ" : "כוכב לכת", facts, KIDS[o.body], a < 0 ? "מתחת לאופק עכשיו." : "");
    } else if (o.named || o.star) {
      var n = o.named || nearestNamed(o.star) || null, v = n ? n.v : o.star.v; sel = { v: v };
      var a2 = altOf(v), az2 = azOf(v), c = n && CONSBY[n.c], rs2 = n ? riseSetText(n) : ["—", "—"];
      if (c) sel.cons = c.id;
      sheet(n ? n.he : "כוכב", n ? (n.cluster ? "צביר כוכבים" : "כוכב") + (c ? " בקבוצת " + c.he : "") + (n.en ? " · " + n.en : "") : "כוכב בבהירות " + o.star.m.toFixed(1),
        [["גובה מעל האופק", a2.toFixed(0) + "°"], ["כיוון", dirName(az2)], ["בהירות", (n ? n.m : o.star.m).toFixed(1)], ["זריחה", rs2[0]]], n && STARFACT[n.he], "");
    } else if (o.cons) {
      var cc = o.cons; sel = { v: cc.v, cons: cc.id }; var a3 = altOf(cc.v);
      var stars = NAMED.filter(function (x) { return x.c === cc.id; }).map(function (x) { return x.he; }).slice(0, 4).join(", ");
      sheet(cc.he, "קבוצת כוכבים · " + cc.en + (TRAD[cc.id] ? " · " + TRAD[cc.id] : ""), [["גובה מעל האופק", a3.toFixed(0) + "°"], ["כיוון", dirName(azOf(cc.v))]].concat(stars ? [["כוכבים בולטים", stars]] : []), MAZSET[cc.id] ? "אחד משנים־עשר המזלות: הקבוצות שהשמש עוברת דרכן במשך השנה, חודש אחרי חודש." : "", "");
    } else if (o.iss) {
      sel = null; sheet("תחנת החלל הבין־לאומית", "מעבדה שמקיפה את כדור הארץ כל 92 דקות", [["גובה מעל האופק", o.alt.toFixed(0) + "°"], ["כיוון", dirName(o.az)], ["מרחק ממך", Math.round(o.km).toLocaleString("he-IL") + " ק״מ"], ["מהירות", "כ־28,000 קמ״ש"]], "גרים בה אסטרונאוטים, והם רואים 16 זריחות ו־16 שקיעות בכל יום!", "");
    }
    need = 1;
  }
  function nearestNamed(s) { var b = null, bd = 0.9999; NAMED.forEach(function (n) { var dot = n.v[0] * s.v[0] + n.v[1] * s.v[1] + n.v[2] * s.v[2]; if (dot > bd) { bd = dot; b = n; } }); return b; }

  // ---------- sheets ----------
  function sheet(title, sub, facts, kid, note, extra) {
    var b = $("sheetBody"); b.replaceChildren.apply(b, [el("h2", { text: title }), el("p", { class: "sub", text: sub }),
      note ? el("p", { class: "sub", style: "color:var(--gold)", text: note }) : null,
      facts && facts.length ? el("div", { class: "facts" }, facts.map(function (f) { return el("div", null, [el("small", { text: f[0] }), el("b", { text: f[1] })]); })) : null,
      kid ? el("div", { class: "kid", text: "💡 " + kid }) : null].filter(Boolean));
    (extra || []).forEach(function (x) { b.append(x); });
    $("sheet").classList.add("open"); $("scrim").classList.add("on"); $("cards").classList.add("hide"); $("timebar").style.bottom = "calc(10px + env(safe-area-inset-bottom,0px))";
  }
  function closeSheet() { $("sheet").classList.remove("open"); $("scrim").classList.remove("on"); $("cards").classList.remove("hide"); $("timebar").style.bottom = ""; }
  $("scrim").addEventListener("click", function () { closeSheet(); sel = null; need = 1; });
  (function () { var y0 = null; $("sheet").addEventListener("touchstart", function (e) { y0 = e.touches[0].clientY; }, { passive: true }); $("sheet").addEventListener("touchend", function (e) { if (y0 != null && e.changedTouches[0].clientY - y0 > 70 && $("sheet").scrollTop <= 0) { closeSheet(); sel = null; need = 1; } y0 = null; }); })();
  var toastT = 0;
  function toast(t) { var x = $("toast"); x.textContent = t; x.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { x.classList.remove("on"); }, 2600); }

  // ---------- the cards: tonight in the sky ----------
  function moonIcon(frac, phase) { var c = document.createElement("canvas"); c.width = c.height = 104; c.style.width = c.style.height = "52px"; var x = c.getContext("2d"); x.translate(52, 52); if (phase > 180) x.scale(-1, 1);
    x.fillStyle = "#2A2C33"; x.beginPath(); x.arc(0, 0, 44, 0, TAU); x.fill(); var k = Math.cos(frac * Math.PI); x.fillStyle = "#F4F1E4"; x.beginPath(); x.arc(0, 0, 44, -Math.PI / 2, Math.PI / 2, false); x.ellipse(0, 0, Math.abs(k) * 44, 44, 0, Math.PI / 2, -Math.PI / 2, k > 0); x.fill(); return c; }
  function card(cls, kicker, title, text, icon, onclick, extra) { return el("div", { class: "card glass " + (cls || ""), role: "button", tabindex: "0", onclick: onclick }, [icon && typeof icon === "string" ? el("span", { class: "big", text: icon }) : icon, el("span", { class: "k", text: kicker }), el("h3", { text: title }), text ? el("p", { text: text }) : null].concat(extra || [])); }
  function drawCards() {
    var d = new Date(), o = observer(); updBodies(d, true);
    var box = $("cards"), list = [], m = BOD.Moon, hp = hebParts(d);
    var hebDate = d.toLocaleDateString("he-u-ca-hebrew", { day: "numeric", month: "long", timeZone: "Asia/Jerusalem" });
    var mr = null; try { mr = A.SearchRiseSet(A.Body.Moon, o, +1, d, 1); } catch (e) {}
    var ms = null; try { ms = A.SearchRiseSet(A.Body.Moon, o, -1, d, 1); } catch (e) {}
    var mUp = (function () { frameSetup(d); return altOf(m.v) > 0; })();
    list.push(card("", "הירח · " + hebDate, phaseName(m.phase, m.frac), Math.round(m.frac * 100) + "% מואר" + (mUp ? (ms ? " · בשמיים עד " + when(ms.date) : "") : (mr ? " · עולה " + when(mr.date) : "")), moonIcon(m.frac, m.phase), function () { flyTo(BOD.Moon.v, "הירח"); openObj({ body: "Moon" }); }));
    // Kiddush Levana
    var lv = levana(d), nowT = Date.now(), kl;
    if (nowT < lv.from) kl = "אפשר לקדש מ־" + when(lv.from);
    else if (nowT <= lv.until) kl = "אפשר לקדש עד " + when(lv.until);
    else { var nx = levana(new Date(nowT + 16 * 864e5)); kl = "המולד הבא: " + moladText(nx.mo); }
    list.push(card("gold", "קידוש לבנה", nowT >= lv.from && nowT <= lv.until ? "אפשר לקדש הלילה" : "קידוש לבנה", kl + ". המולד: " + moladText(lv.mo) + " (לפי שעון ירושלים)", "🌙", function () { kidushSheet(lv); }));
    // planets tonight: up at 21:00 today
    var eve = new Date(d); if (d.getHours() > 21) eve = d; else eve.setHours(21, 0, 0, 0);
    frameSetup(eve); updBodies(eve, true);
    var up = ["Venus", "Jupiter", "Mars", "Saturn", "Mercury"].filter(function (id) { return altOf(BOD[id].v) > 8; });
    updBodies(new Date(), true);
    list.push(card("", "כוכבי לכת הלילה", up.length === 1 ? BOD[up[0]].he + " נראה בעין" : up.length ? ["", "", "שניים", "שלושה", "ארבעה", "חמישה"][up.length] + " נראים בעין" : "אין הלילה", up.length ? "בשעה 21:00. לחצו כדי למצוא:" : "כוכבי הלכת קרובים מדי לשמש הלילה.", "🪐", null, up.length ? [el("div", { class: "pl" }, up.map(function (id) { return el("span", { role: "button", text: BOD[id].he, onclick: function (e) { e.stopPropagation(); flyTo(BOD[id].v, BOD[id].he); openObj({ body: id }); } }); }))] : []));
    // the space station
    var ps = ISS.passes && ISS.passes[0];
    list.push(card("", "תחנת החלל", ps ? "נראית " + dayName(new Date(ps.start)) : ISS.passes ? "לא נראית בימים הקרובים" : "מחשבים מסלול…",
      ps ? hm(new Date(ps.start)) + " מ" + dirName(ps.az0) + " ל" + dirName(ps.az1) + ", עד " + Math.round(ps.max) + "° בשמיים, " + Math.max(1, Math.round((ps.end - ps.start) / 60000)) + " דקות" : "נקודת אור מהירה שחוצה את השמיים בלי להבהב.", "🛰️",
      function () { if (ps) { T.off = ps.start - 60000 - Date.now(); T.speed = 6; $("play").classList.add("on"); timeLabel(); var l = issLook(new Date(ps.maxT)); if (l) flyToH(l.az, l.alt, "תחנת החלל"); toast("🛰️ רואים את המעבר בהילוך מהיר"); } else openObj({ iss: 1, alt: 0, az: 0, km: 0 }); }));
    // the month's mazal
    var mi = MN[hp.m] || 1; if (hp.m === "Adar" && hebLeap(hp.y)) mi = 12; var mzId = MAZAL[(mi === 13 ? 12 : mi) - 1], mz = CONSBY[mzId];
    var hebMonth = d.toLocaleDateString("he-u-ca-hebrew", { month: "long", timeZone: "Asia/Jerusalem" });
    list.push(card("gold", "מזל החודש", "חודש " + hebMonth + ": " + mz.he, "קבוצת הכוכבים של החודש. לחצו כדי לראות איפה היא עכשיו.", "♈♉♊♋♌♍♎♏♐♑♒♓".charAt(MAZAL.indexOf(mzId)), function () { flyTo(mz.v, mz.he, 60); openObj({ cons: mz }); }));
    // Shabbat and the stars: on Friday and Saturday, the end of Shabbat; on other days, nightfall
    var tz = null; try { tz = A.SearchAltitude(A.Body.Sun, o, -1, new Date(d.getTime() - 3 * 3600e3), 1.2, -8.5); } catch (e) {}
    var wd = d.getDay();
    list.push(card("gold", wd === 6 ? "מוצאי שבת" : wd === 5 ? "ליל שבת" : "צאת הכוכבים", wd === 6 ? "שלושה כוכבים בינוניים" : "צאת הכוכבים", (tz ? "היום ב־" + hm(tz.date) + " " : "") + "(השמש 8.5° מתחת לאופק, ב" + S.place.name + "). לחצו כדי לראות את הרגע.", "✨", function () { if (tz) { T.off = tz.date - Date.now(); T.speed = 0; timeLabel(); flyToH(260, 25, "המערב"); toast("✨ " + hm(tz.date) + ": צאת הכוכבים"); } }));
    list.push(card("", "משחק לילדים", "מצאו את…", "השמיים בוחרים קבוצת כוכבים, ואתם מחפשים אותה. אפשר גם עם הטלפון מכוון לשמיים.", "🎯", startGame));
    box.replaceChildren.apply(box, list);
  }
  function flyToH(az, alt, name) { var v = mul(transpose(eq2hor(now())), hv(az, alt)); flyTo(v, name); }
  function transpose(M) { return [[M[0][0], M[1][0], M[2][0]], [M[0][1], M[1][1], M[2][1]], [M[0][2], M[1][2], M[2][2]]]; }
  function kidushSheet(lv) {
    var o = observer(), d = new Date(), rs = null; try { rs = A.SearchRiseSet(A.Body.Moon, o, +1, d, 1); } catch (e) {}
    sheet("קידוש לבנה", "חודש " + d.toLocaleDateString("he-u-ca-hebrew", { month: "long", timeZone: "Asia/Jerusalem" }),
      [["המולד", moladText(lv.mo)], ["מתחילים (3 ימים)", when(lv.from)], ["מאז 7 ימים", when(new Date(lv.mo.utc.getTime() + 7 * 864e5))], ["עד (חצי חודש)", when(lv.until)], ["הירח עולה", rs ? when(rs.date) : "—"], ["מואר עכשיו", Math.round(BOD.Moon.frac * 100) + "%"]],
      "מקדשים כשהירח נראה, בלילה, ונוהגים במוצאי שבת. יש שמחכים 7 ימים מהמולד: כדאי לשאול את הרב מה המנהג.", "שעת המולד היא לפי זמן ירושלים הממוצע, כפי שמכריזים בבית הכנסת.");
  }

  // ---------- the game: find the constellation ----------
  var GAMEPOOL = ["Ori", "UMa", "Cas", "Sco", "Leo", "Cyg", "Lyr", "Tau", "Gem", "Sgr", "Peg", "Boo", "CMa", "Aql", "UMi", "Per", "And", "Vir", "Aur", "Crv"];
  function startGame() {
    var d = now(); frameSetup(d);
    var pool = GAMEPOOL.filter(function (id) { return CONSBY[id] && altOf(CONSBY[id].v) > 15; });
    if (!pool.length) { toast("עכשיו כמעט אין קבוצות גבוהות בשמיים. נסו בלילה!"); return; }
    var c = CONSBY[pool[Math.floor(Math.random() * pool.length)]];
    game = { id: c.id, c: c, t0: Date.now(), found: false, score: (game && game.score) || 0 };
    $("game").hidden = false; $("reticle").hidden = false; $("gameT").textContent = c.he; $("gameH").textContent = "כוונו את העיגול אל הקבוצה · רמז: " + dirName(azOf(c.v)) + ", בגובה " + Math.round(altOf(c.v)) + "°";
    closeSheet(); $("cards").classList.add("hide"); cam.fov = Math.max(cam.fov, 75); need = 1;
  }
  function gameTick() {
    if (!game || game.found) return; frameSetup(now()); var h = mul(F.M, game.c.v), B = F.B, z = h[0] * B.f[0] + h[1] * B.f[1] + h[2] * B.f[2];
    if (z > Math.cos(9 * R)) { game.found = true; game.score++; need = 1; confetti(); $("gameH").textContent = "🎉 מצאתם! " + Math.round((Date.now() - game.t0) / 1000) + " שניות · ניקוד: " + game.score;
      setTimeout(function () { if (game && game.found) { $("game").hidden = true; $("reticle").hidden = true; var c = game.c; openObj({ cons: c }); var again = el("button", { class: "btn", type: "button", text: "🎯 עוד אחת", onclick: startGame }), stop = el("button", { class: "btn ghost", type: "button", text: "סיום", onclick: function () { game = null; closeSheet(); } }); $("sheetBody").append(el("div", { class: "row" }, [again, stop])); } }, 1600); }
  }
  function confetti() {
    var c = document.createElement("canvas"); c.style.cssText = "position:fixed;inset:0;z-index:8;pointer-events:none"; c.width = W; c.height = H; document.body.append(c); var x = c.getContext("2d"), P = [];
    for (var i = 0; i < 90; i++) P.push({ x: W / 2, y: H / 2, vx: (Math.random() - .5) * 9, vy: (Math.random() - .8) * 9, r: 2 + Math.random() * 3, c: ["#F5C76B", "#7DD3FC", "#F9A8D4", "#FFFFFF"][i % 4] });
    var t0 = performance.now(); (function f(t) { var k = (t - t0) / 1600; x.clearRect(0, 0, W, H); P.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.18; x.globalAlpha = Math.max(0, 1 - k); x.fillStyle = p.c; x.beginPath(); x.arc(p.x, p.y, p.r, 0, TAU); x.fill(); }); if (k < 1) requestAnimationFrame(f); else c.remove(); })(t0);
  }

  // ---------- pointing the phone at the sky ----------
  var gyro = { on: false, q: null };
  function onOri(e) {
    var al = e.alpha, be = e.beta, ga = e.gamma; if (al == null) return;
    if (e.webkitCompassHeading != null) al = 360 - e.webkitCompassHeading;
    var a = al * R, b = be * R, c = ga * R, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
    // device -> earth (East, North, Up), as in the Device Orientation specification
    var Rm = [[ca * cc - sa * sb * sc, -cb * sa, ca * sc + cc * sa * sb], [cc * sa + ca * sb * sc, ca * cb, sa * sc - ca * cc * sb], [-cb * sc, sb, cb * cc]];
    var so = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * R;
    var back = [-Rm[0][2], -Rm[1][2], -Rm[2][2]], upv = [Rm[0][1] * Math.cos(so) + Rm[0][0] * Math.sin(so), Rm[1][1] * Math.cos(so) + Rm[1][0] * Math.sin(so), Rm[2][1] * Math.cos(so) + Rm[2][0] * Math.sin(so)];
    if (!gyro.q) gyro.q = [back, upv];
    else for (var i = 0; i < 3; i++) { gyro.q[0][i] += (back[i] - gyro.q[0][i]) * 0.25; gyro.q[1][i] += (upv[i] - gyro.q[1][i]) * 0.25; }
    var f = gyro.q[0], u = gyro.q[1], fn = Math.hypot(f[0], f[1], f[2]) || 1;
    cam.alt = Math.asin(f[2] / fn) / R; cam.az = (Math.atan2(f[0], f[1]) / R + 360) % 360;
    // roll: the angle between the phone's up and the camera's up without roll
    var a2 = cam.az * R, h2 = cam.alt * R, r0 = [Math.cos(a2), -Math.sin(a2), 0], u0 = [-Math.sin(a2) * Math.sin(h2), -Math.cos(a2) * Math.sin(h2), Math.cos(h2)];
    cam.roll = Math.atan2(u[0] * r0[0] + u[1] * r0[1] + u[2] * r0[2], u[0] * u0[0] + u[1] * u0[1] + u[2] * u0[2]) / R * -1;
  }
  function gyroOn(on) {
    if (on) {
      var start = function () { gyro.on = true; gyro.q = null; $("gyro").classList.add("on"); addEventListener("deviceorientationabsolute", onOri); if (!("ondeviceorientationabsolute" in window)) addEventListener("deviceorientation", onOri); toast("📱 הרימו את הטלפון לשמיים"); setTimeout(function () { if (gyro.on && !gyro.q) { toast("הטלפון הזה לא מדווח על כיוון. אפשר לגרור באצבע."); gyroOn(false); } }, 2500); };
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") DeviceOrientationEvent.requestPermission().then(function (p) { if (p === "granted") start(); else toast("לא אושרה גישה לחיישנים"); }).catch(function () {}); else start();
    } else { gyro.on = false; cam.roll = 0; $("gyro").classList.remove("on"); removeEventListener("deviceorientationabsolute", onOri); removeEventListener("deviceorientation", onOri); need = 1; }
  }
  $("gyro").addEventListener("click", function () { gyroOn(!gyro.on); });

  // ---------- time travel ----------
  function timeLabel() { var d = now(), away = Math.abs(T.off) > 120000 || T.speed; $("tl").textContent = away ? when(d) : "עכשיו"; $("tlabel").classList.toggle("away", !!away); }
  $("play").addEventListener("click", function () { T.speed = T.speed ? 0 : 600; $("play").classList.toggle("on", !!T.speed); if (T.speed) toast("⏩ דקה בכל עשירית שנייה: רואים איך השמיים מסתובבים"); timeLabel(); });
  $("tlabel").addEventListener("click", function () {
    var r = el("input", { type: "range", min: "-1440", max: "1440", step: "10", value: String(Math.round(T.off / 60000)), "aria-label": "דקות מעכשיו" });
    var out = el("p", { class: "sub", text: when(now()) });
    r.addEventListener("input", function () { T.off = +r.value * 60000; T.speed = 0; $("play").classList.remove("on"); out.textContent = when(now()); timeLabel(); need = 1; });
    var day = function (n) { return el("button", { class: "btn ghost", type: "button", text: n > 0 ? "יום קדימה ⬅" : "➡ יום אחורה", onclick: function () { T.off += n * 864e5; out.textContent = when(now()); timeLabel(); need = 1; } }); };
    sheet("מסע בזמן", "גוררים כדי לראות את השמיים בכל שעה", [], null, null, [r, out, el("div", { class: "row" }, [day(-1), day(1), el("button", { class: "btn", type: "button", text: "↩ עכשיו", onclick: function () { T.off = 0; T.speed = 0; $("play").classList.remove("on"); timeLabel(); closeSheet(); need = 1; } })])]);
  });

  // ---------- search ----------
  $("find").addEventListener("click", function () {
    var q = el("input", { type: "search", placeholder: "ירח, צדק, אוריון, סיריוס…", "aria-label": "חיפוש" }), list = el("div", { class: "list" });
    var all = BODIES.map(function (b) { return { name: b[1], sub: b[0] === "Sun" ? "הכוכב שלנו" : b[0] === "Moon" ? "הירח" : "כוכב לכת", go: function () { flyTo(BOD[b[0]].v, b[1]); openObj({ body: b[0] }); } }; })
      .concat(CONS.map(function (c) { return { name: c.he, sub: "קבוצת כוכבים" + (TRAD[c.id] ? " · " + TRAD[c.id] : ""), go: function () { flyTo(c.v, c.he, 60); openObj({ cons: c }); } }; }))
      .concat(NAMED.map(function (n) { return { name: n.he, sub: n.cluster ? "צביר כוכבים" : "כוכב", go: function () { flyTo(n.v, n.he, 50); openObj({ named: n }); } }; }));
    function fill() { var t = q.value.trim(), d = now(); frameSetup(d);
      list.replaceChildren.apply(list, all.filter(function (x) { return !t || x.name.indexOf(t) >= 0 || x.sub.indexOf(t) >= 0; }).slice(0, t ? 30 : 12).map(function (x) {
        return el("button", { type: "button", onclick: function () { x.go(); } }, [el("span", { text: x.name }), el("small", { text: x.sub })]); })); }
    q.addEventListener("input", fill); fill();
    sheet("מה מחפשים?", "כוכבי לכת, קבוצות כוכבים וכוכבים בשמם", [], null, null, [q, list]); setTimeout(function () { q.focus(); }, 300);
  });

  // ---------- place and view ----------
  $("title").addEventListener("click", function () {
    var list = el("div", { class: "list" }, [el("button", { type: "button", onclick: function () {
      if (!navigator.geolocation) return toast("אין גישה למיקום");
      navigator.geolocation.getCurrentPosition(function (p) { S.place = { name: "המיקום שלי", lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3) }; save(); placeChanged(); closeSheet(); }, function () { toast("לא התקבל מיקום"); }, { timeout: 9000 });
    } }, [el("span", { text: "📍 המיקום המדויק שלי" }), el("small", { text: "GPS" })])].concat(CITIES.map(function (c) { return el("button", { type: "button", onclick: function () { S.place = { name: c[0], lat: c[1], lon: c[2] }; save(); placeChanged(); closeSheet(); } }, [el("span", { text: c[0] }), el("small", { text: c[0] === S.place.name ? "✓" : "" })]); })));
    sheet("איפה אתם?", "השמיים מחושבים לפי המקום", [], null, null, [list]);
  });
  function placeChanged() { $("where").textContent = S.place.name + " · " + when(now()); ISS.passes = null; bodT = 0; computePasses(); drawCards(); need = 1; }
  $("menu").addEventListener("click", function () {
    var t = function (key, text) { var i = el("input", { type: "checkbox" }); i.checked = !!S[key]; i.addEventListener("change", function () { S[key] = i.checked; save(); document.body.classList.toggle("red", !!S.red); need = 1; }); return el("label", { class: "tog" }, [el("span", { text: text }), i]); };
    sheet("תצוגה", "מה לראות בשמיים", [], null, null, [t("lines", "קווי קבוצות הכוכבים"), t("names", "שמות"), t("mw", "שביל החלב"), t("ecl", "דרך המזלות (המילקה)"), t("grid", "רשת גובה וכיוון"), t("red", "🔴 אור אדום (שומר על ראיית הלילה)"),
      el("p", { class: "credit", html: null }, [document.createTextNode("נתוני הכוכבים וקבוצות הכוכבים: "), el("a", { href: "https://github.com/ofrohn/d3-celestial", target: "_blank", rel: "noopener", text: "d3-celestial" }), document.createTextNode(" (BSD), מבוסס על קטלוג היפרכוס (XHIP) ו־IAU; קו שביל החלב: Milky Way Outline Catalog, J. R. Vieira. מיקומי השמש, הירח וכוכבי הלכת: "), el("a", { href: "https://github.com/cosinekitty/astronomy", target: "_blank", rel: "noopener", text: "Astronomy Engine" }), document.createTextNode(" (MIT). מסלול תחנת החלל: CelesTrak ו־satellite.js (MIT). המולד לפי חשבון העיבור.")])]);
  });

  // ---------- start ----------
  document.body.classList.toggle("red", !!S.red);
  (function startView() { var d = new Date(); frameSetup(d); updBodies(d, true); var m = BOD.Moon, a = altOf(m.v); if (a > 5 && altOf(BOD.Sun.v) < 0) { cam.az = azOf(m.v); cam.alt = Math.min(60, a + 10); } else { cam.az = 180; cam.alt = 30; } })();
  $("where").textContent = S.place.name + " · " + when(new Date());
  setInterval(function () { $("where").textContent = S.place.name + " · " + when(now()); if (!T.speed) timeLabel(); }, 30000);
  drawCards(); loadTLE(); requestAnimationFrame(loop);
  setTimeout(function () { var s = $("splash"); s.style.opacity = "0"; setTimeout(function () { s.remove(); }, 1300); }, 2100);
  if ("serviceWorker" in navigator) addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
})();
