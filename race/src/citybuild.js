// The open city in 3D, from the map read by citydata.js: the ground, sea and parks; the roads with pavements, the
// painted kerbs (red-white and blue-white, as in Israel), lane lines and zebra crossings; the buildings (by the city:
// Jerusalem stone, Tel Aviv's white plaster, glass towers), with solar water heaters on the roofs and windows lit at
// night; street-name signs at the junctions, stop and give-way signs, speed limits, traffic lights, bus stops, lamps,
// trees and palms. Everything is merged into a few meshes per area of the city (so the far parts are skipped).
var CB = { tile: 400, H: function () { return 0; } }; // CB.H(x, z): the ground's height there (set by cityBuild)
function cbRand(seed) { var s = Math.abs(Math.floor(seed * 9301 + 49297)) % 233280 || 1; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
// a growing set of triangles for one material, split by area of the city
function cbBatch() {
  var T = {};
  return {
    get: function (x, z) { var k = Math.floor(x / CB.tile) + "," + Math.floor(z / CB.tile); return T[k] || (T[k] = { p: [], n: [], u: [], c: [] }); },
    tiles: T
  };
}
function cbQuad(b, a1, a2, a3, a4, n, uv, col) { // a quad as two triangles: corners [x,y,z] in order, normal, uv [u0,v0,u1,v1]
  var P = b.p, N = b.n, U = b.u, Cc = b.c, cs = [a1, a2, a3, a1, a3, a4], us = [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]];
  // face the way of the normal (three.js draws only the front of a triangle): turn the corners round if needed
  var ux = a2[0] - a1[0], uy = a2[1] - a1[1], uz = a2[2] - a1[2], vx = a3[0] - a1[0], vy = a3[1] - a1[1], vz = a3[2] - a1[2];
  if ((uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2] < 0) { cs = [a1, a3, a2, a1, a4, a3]; us = [us[0], us[2], us[1], us[3], us[5], us[4]]; }
  for (var i = 0; i < 6; i++) { P.push(cs[i][0], cs[i][1], cs[i][2]); N.push(n[0], n[1], n[2]); U.push(us[i][0], us[i][1]); if (col) Cc.push(col[0], col[1], col[2]); }
}
function cbTri(b, a1, a2, a3, uvs, col) { // a flat triangle, facing up whichever way its corners go
  if ((a2[2] - a1[2]) * (a3[0] - a1[0]) - (a2[0] - a1[0]) * (a3[2] - a1[2]) < 0) { var tt = a2; a2 = a3; a3 = tt; if (uvs) uvs = [uvs[0], uvs[2], uvs[1]]; }
  [a1, a2, a3].forEach(function (a, i) { b.p.push(a[0], a[1], a[2]); b.n.push(0, 1, 0); b.u.push(uvs ? uvs[i][0] : a[0] / 4, uvs ? uvs[i][1] : a[2] / 4); if (col) b.c.push(col[0], col[1], col[2]); });
}
function cbFlush(scene, batch, mat, opt) { // the batch → meshes in the scene
  var out = [];
  for (var k in batch.tiles) {
    var t = batch.tiles[k]; if (!t.p.length) continue;
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(t.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(t.n, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(t.u, 2));
    if (t.c.length) g.setAttribute("color", new THREE.Float32BufferAttribute(t.c, 3));
    g.computeBoundingSphere();
    var m = new THREE.Mesh(g, mat); m.matrixAutoUpdate = false; m.receiveShadow = !(opt && opt.noRecv); m.castShadow = !!(opt && opt.cast); if (opt && opt.order) m.renderOrder = opt.order;
    scene.add(m); out.push(m);
  }
  return out;
}
// a polygon (flat [x,z,...]), triangulated: on the ground (draped over the hills, `y` above it) or, with abs, level at y
function cbFlat(b, pts, y, s, abs) {
  var v = []; for (var i = 0; i < pts.length; i += 2) v.push(new THREE.Vector2(pts[i], pts[i + 1]));
  if (v.length < 3) return;
  if (THREE.ShapeUtils.isClockWise(v)) v.reverse();
  var tri; try { tri = THREE.ShapeUtils.triangulateShape(v, []); } catch (e) { return; }
  s = s || 4;
  var put = function (a, c, d) { cbTri(b, a, c, d, [[a[0] / s, a[2] / s], [c[0] / s, c[2] / s], [d[0] / s, d[2] / s]]); };
  var drape = function (a, c, d, depth) { // split long triangles so they follow the ground
    var ac = Math.hypot(a[0] - c[0], a[2] - c[2]), cd = Math.hypot(c[0] - d[0], c[2] - d[2]), da = Math.hypot(d[0] - a[0], d[2] - a[2]);
    if (depth > 0 && Math.max(ac, cd, da) > 14) {
      var m = function (p, q) { var x = (p[0] + q[0]) / 2, z = (p[2] + q[2]) / 2; return [x, CB.H(x, z) + y, z]; };
      var p1 = m(a, c), p2 = m(c, d), p3 = m(d, a);
      var lv = function (p, q, r) { return Math.abs(r[1] - (p[1] + q[1]) / 2) < 0.04; }; // the ground is level along this side
      var cx3 = (a[0] + c[0] + d[0]) / 3, cz3 = (a[2] + c[2] + d[2]) / 3;
      if (lv(a, c, p1) && lv(c, d, p2) && lv(d, a, p3) && Math.abs(CB.H(cx3, cz3) + y - (a[1] + c[1] + d[1]) / 3) < 0.04) { put(a, c, d); return; }
      drape(a, p1, p3, depth - 1); drape(p1, c, p2, depth - 1); drape(p3, p2, d, depth - 1); drape(p1, p2, p3, depth - 1); return;
    }
    put(a, c, d);
  };
  var Y = function (x, z) { return abs ? y : CB.H(x, z) + y; };
  tri.forEach(function (t) { var A1 = v[t[0]], A2 = v[t[2]], A3 = v[t[1]]; var a = [A1.x, Y(A1.x, A1.y), A1.y], c = [A2.x, Y(A2.x, A2.y), A2.y], d = [A3.x, Y(A3.x, A3.y), A3.y]; if (abs) put(a, c, d); else drape(a, c, d, 5); });
}
// a strip along a polyline (points as [x,z] pairs): from offset o1 to o2 to its right, `y` above the ground,
// texture every `rep` m; long pieces are cut so the strip follows the hills
function cbStrip(b, P, o1, o2, y, rep, col) {
  var acc = 0;
  for (var k = 0; k + 1 < P.length; k++) {
    var ax = P[k][0], az = P[k][1], bx = P[k + 1][0], bz = P[k + 1][1], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz); if (L < 0.01) continue;
    var n0 = cbNormal(P, k), n1 = cbNormal(P, k + 1), parts = Math.max(1, Math.ceil(L / 7));
    if (parts > 1) { // on level ground one piece is enough
      var ha = CB.H(ax, az), hb = CB.H(bx, bz), flat = true;
      for (var f9 = 0.25; f9 < 1 && flat; f9 += 0.25) if (Math.abs(CB.H(ax + dx * f9, az + dz * f9) - (ha + (hb - ha) * f9)) > 0.04) flat = false;
      if (flat) parts = 1;
    }
    for (var q = 0; q < parts; q++) {
      var f0 = q / parts, f1 = (q + 1) / parts, nx0 = n0[0] + (n1[0] - n0[0]) * f0, nz0 = n0[1] + (n1[1] - n0[1]) * f0, nx1 = n0[0] + (n1[0] - n0[0]) * f1, nz1 = n0[1] + (n1[1] - n0[1]) * f1;
      var x0 = ax + dx * f0, z0 = az + dz * f0, x1 = ax + dx * f1, z1 = az + dz * f1;
      var u0 = (acc + L * f0) / rep, u1 = (acc + L * f1) / rep;
      var c = function (x, z, nx, nz, o) { var px = x + nx * o, pz = z + nz * o; return [px, CB.H(px, pz) + y, pz]; };
      cbQuad(b, c(x0, z0, nx0, nz0, o1), c(x1, z1, nx1, nz1, o1), c(x1, z1, nx1, nz1, o2), c(x0, z0, nx0, nz0, o2), [0, 1, 0], [u0, 0, u1, 1], col);
    }
    acc += L;
  }
}
// is (x, z) inside the outline (flat [x,z,...]) and at least `m` metres from its edges?
function cbInside(p, x, z, m) {
  var n = p.length / 2, inn = false;
  for (var i = 0, j = n - 1; i < n; j = i++) {
    var xi = p[2 * i], zi = p[2 * i + 1], xj = p[2 * j], zj = p[2 * j + 1];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inn = !inn;
    var ex = xj - xi, ez = zj - zi, l2 = ex * ex + ez * ez || 1, t = Math.max(0, Math.min(1, ((x - xi) * ex + (z - zi) * ez) / l2));
    if (Math.hypot(x - xi - ex * t, z - zi - ez * t) < m) return false;
  }
  return inn;
}
function cbNormal(P, k) { // the right-hand side at point k (x east, z south: right of (dx,dz) is (-dz,dx))
  var a = P[Math.max(0, k - 1)], b = P[k], c = P[Math.min(P.length - 1, k + 1)], d1x = b[0] - a[0], d1z = b[1] - a[1], d2x = c[0] - b[0], d2z = c[1] - b[1];
  var l1 = Math.hypot(d1x, d1z) || 1, l2 = Math.hypot(d2x, d2z) || 1;
  if (k === 0) { d1x = d2x; d1z = d2z; l1 = l2; } if (k === P.length - 1) { d2x = d1x; d2z = d1z; l2 = l1; }
  var nx = -(d1z / l1 + d2z / l2), nz = d1x / l1 + d2x / l2, nl = Math.hypot(nx, nz) || 1, cos = (nx / nl) * (-d2z / l2) + (nz / nl) * (d2x / l2);
  var m = 1 / Math.max(0.5, cos); // longer at sharp joints, but not too long
  return [nx / nl * m, nz / nl * m];
}
// ---------- textures ----------
function cbCanvas(w, h, draw) { var c = document.createElement("canvas"); c.width = w; c.height = h; var x = c.getContext("2d"); draw(x, w, h); var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.encoding = THREE.sRGBEncoding; return t; }
function cbNoise(x, w, h, base, n, a, sz) { x.fillStyle = base; x.fillRect(0, 0, w, h); for (var i = 0; i < n; i++) { var v = Math.random(); x.fillStyle = "rgba(" + (v < 0.5 ? "0,0,0" : "255,255,255") + "," + (Math.random() * a) + ")"; x.fillRect(Math.random() * w, Math.random() * h, sz || 2, sz || 2); } }
// Facades: one tile is 4 windows across and 4 floors up (3.4 m × 3.1 m each). style: 0 white plaster, 1 Jerusalem stone,
// 2 glass tower, 3 older block with air conditioners, 4 coloured plaster. The second texture lights some windows at night.
var FACADE = { cols: 4, rows: 4, cw: 3.4, fh: 3.1 };
function cbFacade(style, lit) {
  var W = 512, H = 512, cw = W / 4, fh = H / 4, R = cbRand(style * 7 + (lit ? 3 : 1));
  return cbCanvas(W, H, function (x) {
    if (lit) { x.fillStyle = "#000"; x.fillRect(0, 0, W, H); }
    else if (style === 1) { // stone courses
      x.fillStyle = "#D9C6A0"; x.fillRect(0, 0, W, H);
      for (var y = 0; y < H; y += 16) for (var xx = (y / 16) % 2 ? -18 : 0; xx < W; xx += 36) { var t = 0.85 + Math.random() * 0.2; x.fillStyle = "rgb(" + Math.round(217 * t) + "," + Math.round(198 * t) + "," + Math.round(160 * t) + ")"; x.fillRect(xx + 1, y + 1, 34, 14); }
    } else if (style === 2) { x.fillStyle = "#5E7A93"; x.fillRect(0, 0, W, H); }
    else { cbNoise(x, W, H, style === 0 ? "#F1EEE6" : style === 3 ? "#C9C4B8" : "#EBDDC7", 4000, 0.06); }
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
      var X = c * cw, Y = r * fh, on = R() < 0.28;
      if (style === 2) { // glass: full panels with thin mullions
        if (lit) { if (on) { x.fillStyle = R() < 0.5 ? "#FFE2A8" : "#CFE6FF"; x.fillRect(X + 3, Y + 3, cw - 6, fh - 6); } continue; }
        var gr = x.createLinearGradient(X, Y, X + cw, Y + fh); gr.addColorStop(0, "#8FB3CF"); gr.addColorStop(1, "#3F5C78"); x.fillStyle = gr; x.fillRect(X + 3, Y + 3, cw - 6, fh - 6); continue;
      }
      var ww = style === 0 && c % 2 ? cw * 0.72 : cw * 0.46, wh = fh * 0.5, wx = X + (cw - ww) / 2, wy = Y + fh * 0.2;
      if (lit) { if (on) { x.fillStyle = R() < 0.7 ? "#FFD58A" : "#BFD9FF"; x.fillRect(wx, wy, ww, wh); } continue; }
      x.fillStyle = "#2B3440"; x.fillRect(wx, wy, ww, wh);
      x.fillStyle = "rgba(170,200,230,.35)"; x.fillRect(wx + 3, wy + 3, ww * 0.45, wh - 6);
      if (style === 1) { x.fillStyle = "#3F6B5A"; x.fillRect(wx - 6, wy, 6, wh); x.fillRect(wx + ww, wy, 6, wh); } // shutters
      if (style === 0 && c % 2) { x.fillStyle = "#FFFFFF"; x.fillRect(X + 4, wy + wh, cw - 8, fh * 0.26); x.fillStyle = "#DAD6CC"; x.fillRect(X + 4, wy + wh, cw - 8, 3); } // balcony
      if ((style === 3 || style === 4) && R() < 0.55) { x.fillStyle = "#E9E9E4"; x.fillRect(wx + ww * 0.15, wy + wh + 4, ww * 0.7, fh * 0.16); x.fillStyle = "#9AA0A6"; for (var g = 0; g < 4; g++) x.fillRect(wx + ww * 0.2 + g * ww * 0.15, wy + wh + 7, 2, fh * 0.1); } // air conditioner
      if (style !== 1) { x.fillStyle = "rgba(0,0,0,.08)"; x.fillRect(X, Y + fh - 4, cw, 4); }
    }
  });
}
// A sheet of street-name plates (white with a blue frame, like many Israeli street signs) and traffic signs
function cbSignSheet(names) {
  var cols = 4, slotW = 512, slotH = 128, rows = Math.max(1, Math.ceil((names.length + 8) / cols)), H = Math.min(4096, rows * slotH);
  var tex = cbCanvas(cols * slotW, H, function (x) {
    x.textAlign = "center"; x.textBaseline = "middle";
    names.forEach(function (n, i) {
      var X = (i % cols) * slotW, Y = Math.floor(i / cols) * slotH; if (Y + slotH > H) return;
      x.fillStyle = "#1B3F8C"; x.fillRect(X, Y, slotW, slotH); x.fillStyle = "#FFFFFF"; x.fillRect(X + 9, Y + 9, slotW - 18, slotH - 18);
      x.fillStyle = "#1B3F8C"; var fs = 64; x.font = "800 " + fs + "px Rubik, Arial, sans-serif"; while (x.measureText(n).width > slotW - 40 && fs > 26) { fs -= 4; x.font = "800 " + fs + "px Rubik, Arial, sans-serif"; }
      x.fillText(n, X + slotW / 2, Y + slotH / 2 + 3);
    });
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return { tex: tex, uv: function (i) { var X = (i % cols) * slotW, Y = Math.floor(i / cols) * slotH, W2 = cols * slotW; return [X / W2, 1 - (Y + slotH) / H, (X + slotW) / W2, 1 - Y / H]; } };
}
function cbTrafficSigns() {
  // 0 stop, 1 give way, 2..: speed limits 30 40 50 60 70 80 90, 9 bus stop, 10 the grey back of a sign
  var sp = [30, 40, 50, 60, 70, 80, 90], S = 128, n = 11;
  var tex = cbCanvas(S * n, S, function (x) {
    x.textAlign = "center"; x.textBaseline = "middle";
    // stop: a red octagon with "עצור"
    x.save(); x.translate(S / 2, S / 2); x.fillStyle = "#FFFFFF"; x.beginPath(); for (var i = 0; i < 8; i++) { var a = Math.PI / 8 + i * Math.PI / 4; x.lineTo(Math.cos(a) * 62, Math.sin(a) * 62); } x.fill();
    x.fillStyle = "#C8102E"; x.beginPath(); for (i = 0; i < 8; i++) { a = Math.PI / 8 + i * Math.PI / 4; x.lineTo(Math.cos(a) * 56, Math.sin(a) * 56); } x.fill();
    x.fillStyle = "#FFFFFF"; x.font = "900 34px Rubik, Arial"; x.fillText("עצור", 0, 3); x.restore();
    // give way: a red-edged triangle pointing down
    x.save(); x.translate(S * 1.5, S / 2); x.fillStyle = "#C8102E"; x.beginPath(); x.moveTo(-60, -50); x.lineTo(60, -50); x.lineTo(0, 56); x.fill(); x.fillStyle = "#FFFFFF"; x.beginPath(); x.moveTo(-40, -38); x.lineTo(40, -38); x.lineTo(0, 32); x.fill(); x.restore();
    sp.forEach(function (v, k) { x.save(); x.translate(S * (2.5 + k), S / 2); x.fillStyle = "#C8102E"; x.beginPath(); x.arc(0, 0, 60, 0, 7); x.fill(); x.fillStyle = "#FFFFFF"; x.beginPath(); x.arc(0, 0, 46, 0, 7); x.fill(); x.fillStyle = "#111"; x.font = "900 46px Arial"; x.fillText(String(v), 0, 3); x.restore(); });
    x.fillStyle = "#9AA0A6"; x.fillRect(S * 10 + 8, 8, S - 16, S - 16);
    x.save(); x.translate(S * 9.5, S / 2); x.fillStyle = "#1B6FD0"; x.fillRect(-56, -56, 112, 112); x.fillStyle = "#FFF"; x.font = "64px Arial"; x.fillText("🚌", 0, 4); x.restore();
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return { tex: tex, uv: function (i) { return [i / n, 0, (i + 1) / n, 1]; }, speed: function (v) { var k = sp.indexOf(v); return k < 0 ? -1 : 2 + k; } };
}
// the kinds of places (tools/osm2city.py): [emoji, what it is, the sign's colour]
var SHOP_T = { S: ["🛒", "סופרמרקט", "#2F9E44"], M: ["🏪", "מכולת", "#1971C2"], B: ["🥐", "מאפייה", "#E8590C"], V: ["🍅", "ירקן", "#2B8A3E"], U: ["🥩", "קצביה", "#C92A2A"], K: ["🗞️", "קיוסק", "#5F3DC4"],
  C: ["👗", "בגדים", "#862E9C"], H: ["💇", "מספרה", "#D6336C"], F: ["💐", "פרחים", "#E64980"], L: ["📚", "ספרים", "#364FC7"], T: ["🧸", "צעצועים", "#E67700"], E: ["📱", "סלולר ומחשבים", "#1864AB"],
  O: ["👓", "אופטיקה", "#0B7285"], J: ["💍", "תכשיטים", "#9C36B5"], W: ["🔧", "כלי בית ועבודה", "#495057"], N: ["🛋️", "רהיטים", "#795548"], P: ["🐶", "חיות מחמד", "#2B8A3E"], A: ["🍷", "משקאות", "#862E9C"],
  D: ["🧀", "מעדנייה", "#E67700"], Y: ["👔", "ניקוי יבש", "#1C7ED6"], Q: ["🚲", "ספורט ואופניים", "#0CA678"], R: ["🚗", "מוסך", "#495057"], I: ["🍦", "גלידה", "#F06595"], s: ["🛍️", "חנות", "#1098AD"],
  c: ["☕", "בית קפה", "#6F4E37"], r: ["🍽️", "מסעדה", "#C92A2A"], ff: ["🍔", "אוכל מהיר", "#F59F00"], m: ["💊", "בית מרקחת", "#2B8A3E"], b: ["🏦", "בנק", "#1864AB"], o: ["📮", "דואר", "#E03131"],
  u: ["⛽", "תחנת דלק", "#E03131"], h: ["🏥", "בית חולים", "#C92A2A"], f: ["🚒", "תחנת כיבוי", "#C92A2A"], k: ["🏫", "בית ספר", "#1971C2"], g: ["🧸", "גן ילדים", "#E67700"] };
// ---------- the whole city ----------
function cityBuild(C, scene, cityId) {
  var VX = C.VX, VZ = C.VZ, R = cbRand(C.nv + 7), M = {}, hi = G.hi;
  var lam = function (o) { return new THREE.MeshLambertMaterial(o); };
  // ground and sea
  var big = (C.L + 1800) * 2;
  var gTex = cbCanvas(256, 256, function (x, w, h) { cbNoise(x, w, h, "#CBBF9F", 3000, 0.08); }); gTex.repeat.set(big / 12, big / 12);
  CB.H = C.hAt;
  var gMat = lam({ map: gTex });
  if (C.EL) {
    // the hills: one vertex every `step` metres; under the sea the ground goes down, so the water covers it
    var E2 = C.EL, tg = new THREE.PlaneGeometry(E2.step * (E2.n - 1), E2.step * (E2.n - 1), E2.n - 1, E2.n - 1); tg.rotateX(-Math.PI / 2);
    var off0 = E2.step * (E2.n - 1) / 2 - E2.L; tg.translate(off0, 0, off0); // vertices exactly on the height grid
    var tp = tg.attributes.position, tuv = tg.attributes.uv, edge = 0, ec = 0;
    // near streets the ground sinks a little, so the roads (cut every few metres) never dip under it
    var nearRoad = function (x, z) { for (var dz2 = -9; dz2 <= 9; dz2 += 3) for (var dx2 = -9; dx2 <= 9; dx2 += 3) { var g9 = C.at(x + dx2, z + dz2); if (g9 === 1 || g9 === 3) return true; } return false; };
    for (var q = 0; q < tp.count; q++) { var tx = tp.getX(q), tz = tp.getZ(q), th = C.hAt(tx, tz); if (C.at(tx, tz) === 4) th = Math.min(th, C.seaY - 1.2); tp.setY(q, th - (nearRoad(tx, tz) ? 0.45 : 0.02)); tuv.setXY(q, tx / 12, tz / 12); if (Math.abs(tx) > E2.L - E2.step || Math.abs(tz) > E2.L - E2.step) { edge += th; ec++; } }
    tg.computeVertexNormals(); gTex.repeat.set(1, 1);
    var terr = new THREE.Mesh(tg, gMat); terr.receiveShadow = true; scene.add(terr);
    var plain = new THREE.Mesh(new THREE.PlaneGeometry(big, big), gMat.clone()); plain.material.map = gTex.clone(); plain.material.map.repeat.set(big / 12, big / 12); plain.material.map.needsUpdate = true;
    plain.rotation.x = -Math.PI / 2; plain.position.y = (ec ? edge / ec : 0) - 0.6; scene.add(plain);
  } else { var ground = new THREE.Mesh(new THREE.PlaneGeometry(big, big), gMat); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground); }
  var SEA = C.seaY + 0.05;
  M.sea = new THREE.MeshPhongMaterial({ color: 0x1D6FA3, shininess: 90, specular: 0x88AACC, transparent: true, opacity: 0.94 });
  var sea = cbBatch(), G2 = C.G, N = C.N, L = C.L;
  // the sea and lakes from the grid: runs of water cells per row (4 m rows), plus the open sea beyond the map edge
  for (var j = 0; j < N; j += 4) {
    var row = Math.min(N - 1, j + 2) * N, i0 = -1;
    for (var i = 0; i <= N; i++) {
      var wet = i < N && G2[row + i] === 4;
      if (wet && i0 < 0) i0 = i; if (!wet && i0 >= 0) {
        var xa = i0 - L - (i0 === 0 ? 1800 : 0.6), xb = i - L + (i === N ? 1800 : 0.6), za = j - L - (j === 0 ? 1800 : 0), zb = j + 4 - L + (j + 4 >= N ? 1800 : 0);
        cbQuad(sea.get((xa + xb) / 2, (za + zb) / 2), [xa, SEA, za], [xb, SEA, za], [xb, SEA, zb], [xa, SEA, zb], [0, 1, 0], [0, 0, 1, 1]); i0 = -1;
      }
    }
  }
  if (C.hasSea) { // the far sea: extend the first and last rows outwards
    for (var side = 0; side < 2; side++) {
      var jr = side ? N - 1 : 0, rr = jr * N, s0 = -1;
      for (i = 0; i <= N; i++) { var w2 = i < N && G2[rr + i] === 4; if (w2 && s0 < 0) s0 = i; if (!w2 && s0 >= 0) { var xa2 = s0 - L - (s0 === 0 ? 1800 : 0), xb2 = i - L + (i === N ? 1800 : 0), za2 = side ? L : -L - 1800, zb2 = side ? L + 1800 : -L; cbQuad(sea.get(xa2, za2), [xa2, SEA, za2], [xb2, SEA, za2], [xb2, SEA, zb2], [xa2, SEA, zb2], [0, 1, 0], [0, 0, 1, 1]); s0 = -1; } }
    }
  }
  cbFlush(scene, sea, M.sea, { noRecv: true });
  // parks, sand, squares, car parks
  var gr = cbCanvas(256, 256, function (x, w, h) { cbNoise(x, w, h, "#6E9E4A", 5000, 0.12); }), sd = cbCanvas(256, 256, function (x, w, h) { cbNoise(x, w, h, "#E6D3A3", 4000, 0.08); });
  var pv = cbCanvas(256, 256, function (x, w, h) { x.fillStyle = "#C9C6BE"; x.fillRect(0, 0, w, h); x.strokeStyle = "rgba(0,0,0,.12)"; for (var k = 0; k <= w; k += 32) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, h); x.stroke(); x.beginPath(); x.moveTo(0, k); x.lineTo(w, k); x.stroke(); } });
  var asph = cbCanvas(256, 256, function (x, w, h) { cbNoise(x, w, h, "#4A4D52", 6000, 0.1); });
  M.grass = lam({ map: gr, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }); M.sand = lam({ map: sd, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  M.pave = lam({ map: pv, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); M.lot = lam({ map: asph, color: 0xB8B8B8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  var bG = cbBatch(), bS = cbBatch(), bP = cbBatch(), bL = cbBatch();
  C.areas.forEach(function (a) { var b = a.k === "g" ? bG : a.k === "s" ? bS : a.k === "p" ? bL : a.k === "l" ? bP : null; if (b) cbFlat(b.get(a.p[0], a.p[1]), a.p, a.k === "g" ? 0.03 : 0.04, a.k === "p" ? 6 : 4); });
  var bWa = cbBatch(); C.areas.forEach(function (a) { if (a.k !== "w") return; var cx = 0, cz = 0, n = a.p.length / 2; for (var k = 0; k < n; k++) { cx += a.p[2 * k]; cz += a.p[2 * k + 1]; } cbFlat(bWa.get(cx / n, cz / n), a.p, C.hAt(cx / n, cz / n) + 0.06, 4, true); });
  cbFlush(scene, bWa, M.sea, { noRecv: true });
  // pavements along streets, paths
  roadsAsPts().forEach(function (r) { if (r.t < 2 || r.t > 6) return; var b = bP.get(r.P[0][0], r.P[0][1]); cbStrip(b, r.P, r.w / 2 - 0.2, r.w / 2 + 2.8, 0.06, 3); cbStrip(b, r.P, -r.w / 2 - 2.8, -r.w / 2 + 0.2, 0.06, 3); });
  C.walks.forEach(function (w) { var P = []; for (var k = 0; k < w.length; k += 2) P.push([w[k], w[k + 1]]); cbStrip(bP.get(P[0][0], P[0][1]), P, -1.2, 1.2, 0.05, 3); });
  cbFlush(scene, bG, M.grass); cbFlush(scene, bS, M.sand); cbFlush(scene, bP, M.pave); cbFlush(scene, bL, M.lot);
  function roadsAsPts() { return C._rp || (C._rp = C.roads.map(function (r) { return { t: r.t, w: r.w, ow: r.ow, name: r.name, lanes: r.lanes, vmax: r.vmax, P: r.v.map(function (v) { return [VX[v], VZ[v]]; }) }; })); }
  // roads: asphalt, then round patches at the junctions, kerbs and paint
  M.road = lam({ map: asph, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  var curbT = cbCanvas(64, 8, function (x) { x.fillStyle = "#E8E8E8"; x.fillRect(0, 0, 64, 8); x.fillStyle = "#C8102E"; x.fillRect(0, 0, 32, 8); });
  var curbB = cbCanvas(64, 8, function (x) { x.fillStyle = "#E8E8E8"; x.fillRect(0, 0, 64, 8); x.fillStyle = "#1B5FC0"; x.fillRect(0, 0, 32, 8); });
  var curbG = cbCanvas(64, 8, function (x) { x.fillStyle = "#B9B9B4"; x.fillRect(0, 0, 64, 8); });
  M.curb = [lam({ map: curbG, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), lam({ map: curbT, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), lam({ map: curbB, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })];
  var dash = cbCanvas(16, 64, function (x) { x.clearRect(0, 0, 16, 64); x.fillStyle = "#F4F4F0"; x.fillRect(0, 0, 16, 32); });
  M.paint = new THREE.MeshLambertMaterial({ map: dash, transparent: true, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5, depthWrite: false });
  M.white = new THREE.MeshLambertMaterial({ color: 0xF4F4F0, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5, depthWrite: false });
  var bR = cbBatch(), bC = [cbBatch(), cbBatch(), cbBatch()], bD = cbBatch(), bW = cbBatch();
  roadsAsPts().forEach(function (r, ri) {
    var b = bR.get(r.P[0][0], r.P[0][1]); cbStrip(b, r.P, -r.w / 2, r.w / 2, 0.08, 8);
    if (r.t >= 2 && r.t <= 6) { // kerbs: main roads red-white (no stopping), some streets blue-white (paid parking), the rest grey
      var ck = r.t <= 3 ? 1 : (ri % 3 === 0 ? 2 : 0), cb = bC[ck].get(r.P[0][0], r.P[0][1]);
      cbStrip(cb, r.P, r.w / 2 - 0.05, r.w / 2 + 0.3, 0.09, 2); cbStrip(cb, r.P, -r.w / 2 - 0.3, -r.w / 2 + 0.05, 0.09, 2);
    }
    if (!r.ow && r.t <= 5 && r.w >= 7) cbStrip(bD.get(r.P[0][0], r.P[0][1]), r.P, -0.08, 0.08, 0.1, 6); // the dashed middle line
    if (r.ow && r.w >= 7) { var nl = Math.max(2, Math.round(r.w / 3.4)); for (var q = 1; q < nl; q++) { var o = -r.w / 2 + q * r.w / nl; cbStrip(bD.get(r.P[0][0], r.P[0][1]), r.P, o - 0.07, o + 0.07, 0.1, 6); } }
  });
  // round patches where roads meet, so the corners are filled
  for (var v = 0; v < C.nv; v++) {
    if (C.deg[v] < 3) continue;
    var wmax = 0; C.OUT[v].forEach(function (e) { wmax = Math.max(wmax, C.roads[C.E.road[e]].w); });
    if (!wmax) continue; var rr2 = wmax / 2 + 0.4, b2 = bR.get(VX[v], VZ[v]), cx = VX[v], cz = VZ[v];
    for (var a = 0; a < 12; a++) { var a0 = a / 12 * Math.PI * 2, a1 = (a + 1) / 12 * Math.PI * 2; var j1x = cx + Math.cos(a1) * rr2, j1z = cz + Math.sin(a1) * rr2, j0x = cx + Math.cos(a0) * rr2, j0z = cz + Math.sin(a0) * rr2; cbTri(b2, [cx, C.hAt(cx, cz) + 0.081, cz], [j1x, C.hAt(j1x, j1z) + 0.081, j1z], [j0x, C.hAt(j0x, j0z) + 0.081, j0z]); }
  }
  // zebra crossings and stop lines
  var cross = C.nodes.cross || [];
  C.zebras = [];
  for (var k = 0; k < cross.length; k += 2) {
    var nr = C.near(cross[k], cross[k + 1], 6); if (!nr) continue; var rd = C.roads[nr.road]; if (rd.t > 6) continue;
    var dx = nr.dx, dz = nr.dz, rx = -dz, rz = dx, bw = bW.get(nr.x, nr.z), hw = rd.w / 2 - 0.3;
    C.zebras.push({ x: nr.x, z: nr.z, dx: dx, dz: dz, w: rd.w });
    var zy = function (x, z) { return [x, C.hAt(x, z) + 0.11, z]; };
    for (var s = -hw; s < hw - 0.3; s += 1.0) cbQuad(bw, zy(nr.x + rx * s - dx * 1.6, nr.z + rz * s - dz * 1.6), zy(nr.x + rx * (s + 0.5) - dx * 1.6, nr.z + rz * (s + 0.5) - dz * 1.6), zy(nr.x + rx * (s + 0.5) + dx * 1.6, nr.z + rz * (s + 0.5) + dz * 1.6), zy(nr.x + rx * s + dx * 1.6, nr.z + rz * s + dz * 1.6), [0, 1, 0], [0, 0, 1, 1]);
  }
  cbFlush(scene, bR, M.road); bC.forEach(function (b, i3) { cbFlush(scene, b, M.curb[i3]); }); cbFlush(scene, bD, M.paint, { noRecv: true }); cbFlush(scene, bW, M.white, { noRecv: true });
  // ---------- buildings ----------
  var style = cityId === "jerusalem" ? [1, 1, 1, 1] : cityId === "tel-aviv" ? [0, 0, 0, 4] : cityId === "bnei-brak" || cityId === "beit-shemesh" ? [3, 4, 1, 0] : [4, 3, 0, 4];
  M.fac = []; M.facLit = [];
  for (var st = 0; st < 5; st++) { var lit = cbFacade(st, 1); M.facLit.push(lit); M.fac.push(new THREE.MeshLambertMaterial({ map: cbFacade(st, 0), emissiveMap: lit, emissive: 0x000000, vertexColors: true })); }
  M.roof = lam({ color: 0xBDB8AE });
  var bF = [0, 1, 2, 3, 4].map(cbBatch), bRf = cbBatch(), heaters = [];
  var tint = function (st2) { var t = 0.9 + R() * 0.12; return st2 === 4 ? [[1, 0.95, 0.86], [0.98, 0.93, 0.9], [0.95, 0.97, 1], [1, 0.9, 0.82]][Math.floor(R() * 4)].map(function (c) { return c * t; }) : [t, t, t]; };
  C.bld.forEach(function (b, bi) {
    var p = b.p, n = p.length / 2; if (n < 3) return;
    var area = 0, cx = 0, cz = 0; for (var q2 = 0; q2 < n; q2++) { var q3 = (q2 + 1) % n; area += p[2 * q2] * p[2 * q3 + 1] - p[2 * q3] * p[2 * q2 + 1]; cx += p[2 * q2]; cz += p[2 * q2 + 1]; }
    var ccw = area > 0; area = Math.abs(area) / 2; cx /= n; cz /= n;
    var h = b.h;
    if (!h) { var fl = area < 60 ? 1 + Math.floor(R() * 2) : area < 250 ? 2 + Math.floor(R() * 3) : area < 1500 ? 3 + Math.floor(R() * (cityId === "netivot" ? 3 : 6)) : 2 + Math.floor(R() * 3); if (b.k === 2) fl = Math.min(fl, 2); h = fl * FACADE.fh + 0.6; }
    var st2 = h > 45 ? 2 : b.k === 7 ? 1 : style[Math.floor(R() * 4)], col = tint(st2), bb = bF[st2].get(cx, cz);
    var g0 = 1e9, g1 = -1e9; for (var q4 = 0; q4 < n; q4++) { var gh = C.hAt(p[2 * q4], p[2 * q4 + 1]); g0 = Math.min(g0, gh); g1 = Math.max(g1, gh); }
    var base = g0 - 0.6, top = g1 + h; b.base = g0; b.top = top;
    var tw = FACADE.cols * FACADE.cw, th = FACADE.rows * FACADE.fh, acc2 = R() * 4;
    for (q2 = 0; q2 < n; q2++) {
      var ia = ccw ? q2 : (q2 + 1) % n, ib = ccw ? (q2 + 1) % n : q2;
      var ax = p[2 * ia], az = p[2 * ia + 1], bx = p[2 * ib], bz = p[2 * ib + 1], el = Math.hypot(bx - ax, bz - az); if (el < 0.05) continue;
      // outward normal: with the outline counter-clockwise in (x, z) the outside is to the right of each edge
      var nx = (bz - az) / el, nz = -(bx - ax) / el;
      if (!ccw) { nx = -nx; nz = -nz; }
      cbQuad(bb, [bx, base, bz], [ax, base, az], [ax, top, az], [bx, top, bz], [nx, 0, nz], [(acc2 + el) / tw, (base - g1) / th, acc2 / tw, (top - g1) / th], col);
      acc2 += el;
    }
    cbFlat(bRf.get(cx, cz), p, top, 6, true);
    if (h < 40 && area > 70 && b.k !== 3 && b.k !== 4 && R() < 0.8) { var nh = Math.min(6, 1 + Math.floor(area / 160)); for (var hh = 0; hh < nh; hh++) { var hx = cx + (R() - 0.5) * Math.sqrt(area) * 0.5, hz2 = cz + (R() - 0.5) * Math.sqrt(area) * 0.5, hr = R() * 0.4; if (cbInside(p, hx, hz2, 1.3)) heaters.push([hx, top, hz2, hr]); } }
  });
  C.facMeshes = [];
  bF.forEach(function (b, i4) { C.facMeshes = C.facMeshes.concat(cbFlush(scene, b, M.fac[i4], { cast: hi })); });
  cbFlush(scene, bRf, M.roof, { cast: false });
  // solar water heaters (a white tank and a dark panel) on the roofs: one instanced mesh each
  if (heaters.length) {
    // light shapes (there are thousands): a six-sided tank without ends, a flat panel; the farthest ones are dropped
    if (heaters.length > 3000) { heaters.sort(function (a, b) { return Math.hypot(a[0], a[2]) - Math.hypot(b[0], b[2]); }); heaters.length = 3000; }
    var tankG = new THREE.CylinderGeometry(0.32, 0.32, 1.4, 6, 1, true); tankG.rotateZ(Math.PI / 2); tankG.translate(0, 0.9, -0.4);
    var panG = new THREE.PlaneGeometry(1.1, 1.8); panG.rotateX(-Math.PI / 2 - 0.5); panG.translate(0, 0.55, 0.5);
    var tank = new THREE.InstancedMesh(tankG, lam({ color: 0xF2F2EE }), heaters.length), pan = new THREE.InstancedMesh(panG, new THREE.MeshPhongMaterial({ color: 0x1D2C4A, shininess: 80, side: THREE.DoubleSide }), heaters.length), mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
    heaters.forEach(function (hz, i5) { qq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI + hz[3]); mm.compose(new THREE.Vector3(hz[0], hz[1], hz[2]), qq, one); tank.setMatrixAt(i5, mm); pan.setMatrixAt(i5, mm); });
    scene.add(tank); scene.add(pan);
  }
  // ---------- street furniture ----------
  var poleG = new THREE.CylinderGeometry(0.06, 0.06, 1, 6); poleG.translate(0, 0.5, 0);
  var poles = [], signs = []; // poles: [x, z, height]; signs: plates [x, y, z, angle, w, h, sheet, slot]
  // street-name plates: at junctions where streets with names meet, one pole at a corner with a plate along each street
  var sheetNames = C.names.slice(0, 1000), sheet = cbSignSheet(sheetNames), named = {};
  for (v = 0; v < C.nv; v++) {
    if (C.deg[v] < 3) continue;
    var byName = {}; C.OUT[v].forEach(function (e) { var r = C.roads[C.E.road[e]]; if (r.name && r.t <= 6 && !byName[r.name]) byName[r.name] = { e: e, r: r }; });
    var keys = Object.keys(byName); if (keys.length < 2) continue;
    var key2 = Math.round(VX[v] / 25) + "," + Math.round(VZ[v] / 25); if (named[key2]) continue; named[key2] = 1;
    var e0 = byName[keys[0]], e1 = byName[keys[1]], d0 = [C.E.dx[e0.e], C.E.dz[e0.e]], d1 = [C.E.dx[e1.e], C.E.dz[e1.e]];
    // the pole stands on the corner between the two streets
    var bx = d0[0] + d1[0], bz = d0[1] + d1[1], bl = Math.hypot(bx, bz); if (bl < 0.2) { bx = -d0[1]; bz = d0[0]; bl = 1; }
    var reach = Math.max(e0.r.w, e1.r.w) / 2 + 2.2, cxp = VX[v] + bx / bl * reach * 1.25, czp = VZ[v] + bz / bl * reach * 1.25;
    if (C.at(cxp, czp) === 1 || C.at(cxp, czp) === 2) continue;
    poles.push([cxp, czp, 3.2]);
    // each plate runs along its street, so the drivers on the other street read it as they come
    [e0, e1].forEach(function (it, m2) {
      var idx = sheetNames.indexOf(it.r.name); if (idx < 0) return;
      signs.push([cxp, C.hAt(cxp, czp) + 2.75 + m2 * 0.42, czp, -C.E.dz[it.e], C.E.dx[it.e], 1.5, 0.38, 0, idx, 1]);
    });
  }
  // traffic signs on the right side of the road, facing the drivers coming toward the point
  var ts = cbTrafficSigns();
  function roadside(x, z, maxd, slot, hgt) {
    var nr2 = C.near(x, z, maxd || 8); if (!nr2) return null; var rd2 = C.roads[nr2.road];
    var dir = rd2.ow < 0 ? -1 : 1, dx2 = nr2.dx * dir, dz2 = nr2.dz * dir, rx2 = -dz2, rz2 = dx2, off = rd2.w / 2 + 0.9;
    var px = nr2.x + rx2 * off - dx2 * 4, pz = nr2.z + rz2 * off - dz2 * 4;
    poles.push([px, pz, hgt || 2.4]); signs.push([px, C.hAt(px, pz) + (hgt || 2.4) - 0.35, pz, -dx2, -dz2, 0.7, 0.7, 1, slot, 0]);
    return nr2;
  }
  var stops = C.nodes.stop || [], gives = C.nodes.give || [];
  for (k = 0; k < stops.length; k += 2) roadside(stops[k], stops[k + 1], 8, 0);
  for (k = 0; k < gives.length; k += 2) roadside(gives[k], gives[k + 1], 8, 1);
  // a speed sign at the start of each long street with a known limit
  roadsAsPts().forEach(function (r) { var sl = ts.speed(Math.round(r.vmax * 3.6)); if (sl < 0 || r.t > 4 || r.P.length < 2) return; var len = 0; for (var k2 = 0; k2 + 1 < r.P.length; k2++) len += Math.hypot(r.P[k2 + 1][0] - r.P[k2][0], r.P[k2 + 1][1] - r.P[k2][1]); if (len < 120) return; roadside(r.P[1][0], r.P[1][1], 6, sl); });
  // bus stops: a shelter and a sign
  var bus = C.nodes.bus || [], shelters = [];
  for (k = 0; k < bus.length; k += 2) { var nb2 = C.near(bus[k], bus[k + 1], 14); if (!nb2) continue; var rdb = C.roads[nb2.road], sgn = (bus[k] - nb2.x) * -nb2.dz + (bus[k + 1] - nb2.z) * nb2.dx >= 0 ? 1 : -1, off2 = rdb.w / 2 + 1.6; shelters.push([nb2.x - nb2.dz * off2 * sgn, nb2.z + nb2.dx * off2 * sgn, Math.atan2(nb2.dx, nb2.dz) + (sgn > 0 ? 0 : Math.PI)]); }
  C.busStops = shelters;
  // ---------- shops, cafés and petrol stations ----------
  // A shop's sign goes on the nearest wall facing its street, with a shop window under it (lit at night) and an
  // awning. Independent places show their own name; chains show what they are (osm2city.py leaves their name out).
  var placed = [], shops = [];
  C.poi.filter(function (p) { return SHOP_T[p.k] && "uhfkg".indexOf(p.k) < 0; }).sort(function (a, b) { return Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z); }).forEach(function (p) {
    if (shops.length >= 120) return; // the sign atlas holds 128: room left for the petrol stations
    var nr = C.near(p.x, p.z, 40, function (r) { return r.t >= 2 && r.t <= 6; }); if (!nr) return;
    var r = C.roads[nr.road], vx = p.x - nr.x, vz = p.z - nr.z, vl = Math.hypot(vx, vz);
    if (vl < 0.5) { vx = -nr.dz; vz = nr.dx; vl = 1; } vx /= vl; vz /= vl;
    var wx = null, wz = null, d0 = r.w / 2 + 1.2;
    for (var d = d0; d < d0 + 28; d += 0.5) { var x = nr.x + vx * d, z = nr.z + vz * d; if (C.at(x, z) === 2) { wx = nr.x + vx * (d - 0.7); wz = nr.z + vz * (d - 0.7); break; } }
    if (wx == null || placed.some(function (q) { return Math.hypot(q[0] - wx, q[1] - wz) < 5.5; })) return;
    placed.push([wx, wz]);
    var T = SHOP_T[p.k], label = p.name || T[1];
    shops.push({ x: wx, z: wz, nx: -vx, nz: -vz, k: p.k, label: label, e: T[0], col: T[2], w: Math.max(2.6, Math.min(5.6, 1.4 + label.length * 0.24)) });
  });
  // petrol stations: a canopy over pumps beside the road, and a tall sign
  var stations = [];
  C.poi.filter(function (p) { return p.k === "u"; }).forEach(function (p) {
    if (stations.length >= 8) return;
    var nr = C.near(p.x, p.z, 60, function (r) { return r.t <= 5; }); if (!nr) return;
    var r = C.roads[nr.road], vx = p.x - nr.x, vz = p.z - nr.z, vl = Math.hypot(vx, vz);
    if (vl < 1) { vx = -nr.dz; vz = nr.dx; vl = 1; } vx /= vl; vz /= vl;
    // the forecourt must be clear of buildings and water: try a little further from the road each time
    var cx = null, cz = null;
    for (var dd = r.w / 2 + 7; dd < r.w / 2 + 16 && cx == null; dd += 3) {
      var ok = true, px0 = nr.x + vx * dd, pz0 = nr.z + vz * dd;
      for (var a1 = -8; a1 <= 8 && ok; a1 += 2) for (var a2 = -5.5; a2 <= 5.5 && ok; a2 += 1.8) { var gg = C.at(px0 + nr.dx * a1 + vx * a2, pz0 + nr.dz * a1 + vz * a2); if (gg === 2 || gg === 4 || (gg === 1 && Math.abs(a2) < 4)) ok = false; }
      if (ok) { cx = px0; cz = pz0; }
    }
    if (cx == null || stations.some(function (q) { return Math.hypot(q.x - cx, q.z - cz) < 40; })) return;
    stations.push({ x: cx, z: cz, h: Math.atan2(nr.dx, nr.dz), label: p.name || "תחנת דלק", rx: vx, rz: vz, rw: r.w, dx: nr.dx, dz: nr.dz, d0: Math.hypot(cx - nr.x, cz - nr.z) });
    C.thick(cx - nr.dx * 8, cz - nr.dz * 8, cx + nr.dx * 8, cz + nr.dz * 8, 6, 3, function (g) { return g === 0 || g === 5; }); // a forecourt you can drive into
  });
  if (stations.length) { // the forecourt: concrete from the road's edge to behind the pumps
    var bFc = cbBatch();
    stations.forEach(function (st) {
      var a0 = -(st.d0 - st.rw / 2), a1 = 6.5, P4 = [];
      [[-9, a0], [9, a0], [9, a1], [-9, a1]].forEach(function (o) { P4.push(st.x + st.dx * o[0] + st.rx * o[1], st.z + st.dz * o[0] + st.rz * o[1]); });
      cbFlat(bFc.get(st.x, st.z), P4, 0.075, 4);
    });
    cbFlush(scene, bFc, M.pave, { noRecv: false });
  }
  // the station's tall sign: at the corner by the road, across it so both directions see it
  stations.forEach(function (st) { var ac = -(st.d0 - st.rw / 2 - 1.6); shops.push({ x: st.x + st.rx * ac + st.dx * 10, z: st.z + st.rz * ac + st.dz * 10, nx: st.dx, nz: st.dz, k: "u", label: st.label, e: "⛽", col: "#E03131", w: 3.4, pole: 1 }); });
  C.shops = shops; C.stations = stations;
  if (shops.length) {
    var SW = 256, SH = 64, cols = 4, rowsN = Math.ceil(shops.length / cols), AH = Math.min(2048, Math.max(64, rowsN * SH));
    var atl = cbCanvas(SW * cols, AH, function (x) {
      x.textBaseline = "middle";
      shops.forEach(function (sh, i) {
        var X = (i % cols) * SW, Y = Math.floor(i / cols) * SH; if (Y + SH > AH) return;
        x.fillStyle = sh.col; x.fillRect(X, Y, SW, SH); x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 4; x.strokeRect(X + 4, Y + 4, SW - 8, SH - 8);
        x.font = "34px 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif"; x.textAlign = "center"; x.fillText(sh.e, X + SW - 30, Y + SH / 2 + 2);
        x.fillStyle = "#FFFFFF"; var fs = 30; x.font = "800 " + fs + "px Rubik, Arial, sans-serif"; while (x.measureText(sh.label).width > SW - 72 && fs > 15) { fs -= 2; x.font = "800 " + fs + "px Rubik, Arial, sans-serif"; }
        x.fillText(sh.label, X + (SW - 56) / 2 + 4, Y + SH / 2 + 2);
      });
    });
    atl.wrapS = atl.wrapT = THREE.ClampToEdgeWrapping;
    var bSg = cbBatch(), bWin = cbBatch(), bAw = cbBatch();
    shops.forEach(function (sh, i) {
      var X = (i % cols) * SW, Y = Math.floor(i / cols) * SH, uv = [X / (SW * cols), 1 - (Y + SH) / AH, (X + SW) / (SW * cols), 1 - Y / AH];
      var g0 = C.hAt(sh.x, sh.z), nx = sh.nx, nz = sh.nz, rx = nz, rz = -nx, hw = sh.w / 2, y0 = g0 + (sh.pole ? 4.6 : 3.05), y1 = y0 + (sh.pole ? 0.9 : 0.72);
      var q = function (o, a, b, yy0, yy1, B, U, col) { var lx = sh.x - rx * a + nx * o, lz = sh.z - rz * a + nz * o, qx = sh.x + rx * b + nx * o, qz = sh.z + rz * b + nz * o; cbQuad(B.get(sh.x, sh.z), [lx, yy0, lz], [qx, yy0, qz], [qx, yy1, qz], [lx, yy1, lz], [nx, 0, nz], U, col); };
      q(0.05, hw, hw, y0, y1, bSg, uv);
      if (sh.pole) { q(-0.05, hw, hw, y0, y1, bSg, uv); poles.push([sh.x, sh.z, y1 - g0]); return; }
      q(0.04, hw * 0.92, hw * 0.92, g0 + 0.3, g0 + 2.55, bWin, [0, 0, 1, 1]);
      // the awning: from the wall, out and a little down
      var c = new THREE.Color(sh.col), cc = [c.r, c.g, c.b], ax0 = sh.x - rx * hw, az0 = sh.z - rz * hw, ax1 = sh.x + rx * hw, az1 = sh.z + rz * hw;
      cbQuad(bAw.get(sh.x, sh.z), [ax0, g0 + 2.85, az0], [ax1, g0 + 2.85, az1], [ax1 + nx * 1.1, g0 + 2.45, az1 + nz * 1.1], [ax0 + nx * 1.1, g0 + 2.45, az0 + nz * 1.1], [nx * 0.3, 0.95, nz * 0.3], [0, 0, 1, 1], cc);
    });
    cbFlush(scene, bSg, new THREE.MeshBasicMaterial({ map: atl, side: THREE.DoubleSide }), { noRecv: true });
    M.shopWin = new THREE.MeshBasicMaterial({ color: 0x33414F });
    cbFlush(scene, bWin, M.shopWin, { noRecv: true });
    cbFlush(scene, bAw, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), { noRecv: true });
  }
  if (stations.length) {
    var roofG = new THREE.BoxGeometry(13, 0.5, 8.5); roofG.translate(0, 5.3, 0);
    var pilG = new THREE.BoxGeometry(0.35, 5.1, 0.35), pumpG = new THREE.BoxGeometry(0.7, 1.6, 0.45); pumpG.translate(0, 0.8, 0);
    var nS = stations.length, roofM = new THREE.InstancedMesh(roofG, lam({ color: 0xF1F3F5 }), nS), stripe = new THREE.InstancedMesh(new THREE.BoxGeometry(13.05, 0.22, 8.55).translate(0, 5.35, 0), lam({ color: 0xE03131 }), nS);
    var pilM = new THREE.InstancedMesh(pilG, lam({ color: 0xDEE2E6 }), nS * 4), pumpM = new THREE.InstancedMesh(pumpG, lam({ color: 0x228BE6 }), nS * 2), m10 = new THREE.Matrix4(), q10 = new THREE.Quaternion(), up10 = new THREE.Vector3(0, 1, 0), one10 = new THREE.Vector3(1, 1, 1), v10 = new THREE.Vector3();
    stations.forEach(function (st, i) {
      var gy = C.hAt(st.x, st.z); q10.setFromAxisAngle(up10, st.h);
      m10.compose(v10.set(st.x, gy, st.z), q10, one10); roofM.setMatrixAt(i, m10); stripe.setMatrixAt(i, m10);
      [[-5.5, -3.6], [5.5, -3.6], [-5.5, 3.6], [5.5, 3.6]].forEach(function (o, k) { var ca = Math.cos(st.h), sa = Math.sin(st.h), px = st.x + o[0] * ca + o[1] * sa, pz = st.z - o[0] * sa + o[1] * ca; m10.compose(v10.set(px, gy + 2.55, pz), q10, one10); pilM.setMatrixAt(i * 4 + k, m10); });
      [[-2.5, 0], [2.5, 0]].forEach(function (o, k) { var ca = Math.cos(st.h), sa = Math.sin(st.h), px = st.x + o[0] * ca + o[1] * sa, pz = st.z - o[0] * sa + o[1] * ca; m10.compose(v10.set(px, gy, pz), q10, one10); pumpM.setMatrixAt(i * 2 + k, m10); });
    });
    [roofM, stripe, pilM, pumpM].forEach(function (m) { m.castShadow = hi; scene.add(m); });
  }
  // plates: two materials (street names, traffic signs), merged
  var plateB = [cbBatch(), cbBatch()];
  // sg: [x, y, z, normal x, normal z, width, height, sheet, slot, two-sided]. The text reads left to right for
  // someone facing the plate: their right hand is (nz, -nx) in this map (x east, z south).
  signs.forEach(function (sg) {
    var uv = sg[7] ? ts.uv(sg[8]) : sheet.uv(sg[8]), b3 = plateB[sg[7]].get(sg[0], sg[2]), hw2 = sg[5] / 2, hh2 = sg[6] / 2;
    var face = function (nx, nz, u) {
      var rx = nz, rz = -nx, lx = sg[0] - rx * hw2 + nx * 0.02, lz = sg[2] - rz * hw2 + nz * 0.02, qx = sg[0] + rx * hw2 + nx * 0.02, qz = sg[2] + rz * hw2 + nz * 0.02;
      cbQuad(b3, [lx, sg[1] - hh2, lz], [qx, sg[1] - hh2, qz], [qx, sg[1] + hh2, qz], [lx, sg[1] + hh2, lz], [nx, 0, nz], u);
    };
    face(sg[3], sg[4], uv);
    face(-sg[3], -sg[4], sg[9] ? uv : ts.uv(10));
  });
  cbFlush(scene, plateB[0], new THREE.MeshLambertMaterial({ map: sheet.tex, side: THREE.FrontSide }), { noRecv: true });
  cbFlush(scene, plateB[1], new THREE.MeshLambertMaterial({ map: ts.tex, transparent: true, alphaTest: 0.5 }), { noRecv: true });
  // traffic lights: a pole with a box on each street coming in; the lamps are instanced so their colours can change
  var sig = C.nodes.sig || [], lights = [], seenV = {};
  for (k = 0; k < sig.length; k += 2) {
    var best = -1, bd = 15 * 15; for (v = 0; v < C.nv; v++) { if (C.deg[v] < 2) continue; var dd = (VX[v] - sig[k]) * (VX[v] - sig[k]) + (VZ[v] - sig[k + 1]) * (VZ[v] - sig[k + 1]); if (dd < bd) { bd = dd; best = v; } }
    if (best < 0 || seenV[best]) continue; seenV[best] = 1;
    var ins = []; for (var e = 0; e < C.ne; e++) if (C.E.b[e] === best) ins.push(e);
    ins.forEach(function (e2) {
      var r = C.roads[C.E.road[e2]], dx3 = C.E.dx[e2], dz3 = C.E.dz[e2], ox = -dz3 * (r.w / 2 + 0.8), oz = dx3 * (r.w / 2 + 0.8);
      var px = VX[best] - dx3 * (r.w * 0.6 + 2) + ox, pz = VZ[best] - dz3 * (r.w * 0.6 + 2) + oz;
      poles.push([px, pz, 3.6]); lights.push({ v: best, e: e2, x: px, z: pz, h: Math.atan2(-dx3, -dz3), axis: Math.abs(dx3) > Math.abs(dz3) ? 0 : 1 });
    });
  }
  C.lights = lights; C.sigV = seenV;
  if (lights.length) {
    var box = new THREE.BoxGeometry(0.36, 1.0, 0.3); box.translate(0, 3.35, 0);
    var boxes = new THREE.InstancedMesh(box, lam({ color: 0x23262B }), lights.length), lampG = new THREE.SphereGeometry(0.11, 6, 4);
    var mk = function (y) { var g2 = lampG.clone(); g2.translate(0, y, 0.17); return g2; };
    C.lampMesh = [mk(3.67), mk(3.35), mk(3.03)].map(function (g3) { var im = new THREE.InstancedMesh(g3, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }), lights.length); scene.add(im); return im; });
    var m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one2 = new THREE.Vector3(1, 1, 1);
    lights.forEach(function (lt, i6) { q4.setFromAxisAngle(up, lt.h); m4.compose(new THREE.Vector3(lt.x, C.hAt(lt.x, lt.z), lt.z), q4, one2); boxes.setMatrixAt(i6, m4); C.lampMesh.forEach(function (im) { im.setMatrixAt(i6, m4); }); });
    scene.add(boxes);
  }
  // street lamps along the bigger streets, every 32 m, alternating sides
  var lamps = [];
  roadsAsPts().forEach(function (r) { if (r.t > 4) return; var acc3 = 16, sideL = 1; for (var k3 = 0; k3 + 1 < r.P.length; k3++) { var ax3 = r.P[k3][0], az3 = r.P[k3][1], dx4 = r.P[k3 + 1][0] - ax3, dz4 = r.P[k3 + 1][1] - az3, l4 = Math.hypot(dx4, dz4); if (l4 < 0.1) continue; dx4 /= l4; dz4 /= l4; while (acc3 < l4) { var o3 = (r.w / 2 + 0.7) * sideL, lx = ax3 + dx4 * acc3 - dz4 * o3, lz = az3 + dz4 * acc3 + dx4 * o3; var gl = C.at(lx, lz); if (gl !== 1 && gl !== 2 && gl !== 4) lamps.push([lx, lz, Math.atan2(dz4 * sideL, -dx4 * sideL)]); sideL = -sideL; acc3 += 32; } acc3 -= l4; } });
  C.lamps = lamps;
  if (lamps.length) {
    var lpG = new THREE.CylinderGeometry(0.07, 0.1, 7, 6); lpG.translate(0, 3.5, 0); var armG = new THREE.BoxGeometry(0.1, 0.1, 1.6); armG.translate(0, 6.9, 0.7);
    var headG = new THREE.BoxGeometry(0.35, 0.12, 0.6); headG.translate(0, 6.85, 1.4);
    var lpM = new THREE.InstancedMesh(lpG, lam({ color: 0x8D9399 }), lamps.length), arM = new THREE.InstancedMesh(armG, lam({ color: 0x8D9399 }), lamps.length);
    C.lampHeads = new THREE.InstancedMesh(headG, new THREE.MeshBasicMaterial({ color: 0x9AA0A6 }), lamps.length);
    var m5 = new THREE.Matrix4(), q5 = new THREE.Quaternion(), up2 = new THREE.Vector3(0, 1, 0), o5 = new THREE.Vector3(1, 1, 1);
    lamps.forEach(function (lp, i7) { q5.setFromAxisAngle(up2, lp[2]); m5.compose(new THREE.Vector3(lp[0], C.hAt(lp[0], lp[1]), lp[1]), q5, o5); lpM.setMatrixAt(i7, m5); arM.setMatrixAt(i7, m5); C.lampHeads.setMatrixAt(i7, m5); });
    scene.add(lpM); scene.add(arM); scene.add(C.lampHeads);
  }
  // poles for the signs
  if (poles.length) { var pm = new THREE.InstancedMesh(poleG, lam({ color: 0x9AA0A6 }), poles.length), m6 = new THREE.Matrix4(); poles.forEach(function (p2, i8) { m6.makeScale(1, p2[2], 1); m6.setPosition(p2[0], C.hAt(p2[0], p2[1]), p2[1]); pm.setMatrixAt(i8, m6); }); scene.add(pm); }
  // bus shelters
  if (shelters.length) {
    var shG = new THREE.BoxGeometry(3.2, 0.12, 1.5); shG.translate(0, 2.5, 0); var bkG = new THREE.BoxGeometry(3.2, 2.2, 0.06); bkG.translate(0, 1.3, -0.7);
    var shM = new THREE.InstancedMesh(shG, lam({ color: 0x2F6FC0 }), shelters.length), bkM = new THREE.InstancedMesh(bkG, new THREE.MeshLambertMaterial({ color: 0xBFD9F2, transparent: true, opacity: 0.55 }), shelters.length), m7 = new THREE.Matrix4(), q7 = new THREE.Quaternion(), up3 = new THREE.Vector3(0, 1, 0), o7 = new THREE.Vector3(1, 1, 1);
    shelters.forEach(function (s2, i9) { q7.setFromAxisAngle(up3, s2[2]); m7.compose(new THREE.Vector3(s2[0], C.hAt(s2[0], s2[1]), s2[1]), q7, o7); shM.setMatrixAt(i9, m7); bkM.setMatrixAt(i9, m7); });
    scene.add(shM); scene.add(bkM);
  }
  // trees: from the map, and along the bigger streets where the map has none; palms by the sea
  var trees = [], palms = [], tr = C.nodes.tree || [];
  for (k = 0; k < tr.length && trees.length < 6000; k += 2) { var g4 = C.at(tr[k], tr[k + 1]); if (g4 !== 1 && g4 !== 2 && g4 !== 4) trees.push([tr[k], tr[k + 1], 0.8 + R() * 0.6]); }
  C.areas.forEach(function (a) { if (a.k !== "g" && a.k !== "s") return; var p = a.p, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (var k4 = 0; k4 < p.length; k4 += 2) { x0 = Math.min(x0, p[k4]); x1 = Math.max(x1, p[k4]); z0 = Math.min(z0, p[k4 + 1]); z1 = Math.max(z1, p[k4 + 1]); } var nT = Math.min(60, Math.floor((x1 - x0) * (z1 - z0) / (a.k === "s" ? 900 : 260))); for (var t2 = 0; t2 < nT; t2++) { var x5 = x0 + R() * (x1 - x0), z5 = z0 + R() * (z1 - z0), g5 = C.at(x5, z5); if (a.k === "g" ? g5 === 5 : g5 === 3) (a.k === "s" ? palms : trees).push([x5, z5, 0.8 + R() * 0.6]); } });
  if (C.hasSea) roadsAsPts().forEach(function (r) { if (r.t > 4) return; for (var k5 = 0; k5 < r.P.length; k5++) { var x6 = r.P[k5][0], z6 = r.P[k5][1], near = 0; for (var dd2 = -30; dd2 <= 30; dd2 += 10) if (C.at(x6 + dd2, z6) === 4 || C.at(x6, z6 + dd2) === 4) near = 1; if (near && R() < 0.7) palms.push([x6 - (r.w / 2 + 1.6), z6, 1]); } });
  if (trees.length) {
    var trunkG = new THREE.CylinderGeometry(0.12, 0.18, 2.4, 5); trunkG.translate(0, 1.2, 0); var crownG = new THREE.IcosahedronGeometry(1.7, 0); crownG.translate(0, 3.4, 0);
    var tM = new THREE.InstancedMesh(trunkG, lam({ color: 0x6B4F36 }), trees.length), cM = new THREE.InstancedMesh(crownG, lam({ color: 0x4F7F3A }), trees.length), m8 = new THREE.Matrix4(), col2 = new THREE.Color();
    trees.forEach(function (t3, i10) { m8.makeScale(t3[2], t3[2], t3[2]); m8.setPosition(t3[0], C.hAt(t3[0], t3[1]), t3[1]); tM.setMatrixAt(i10, m8); cM.setMatrixAt(i10, m8); col2.setHSL(0.24 + R() * 0.06, 0.45, 0.32 + R() * 0.1); cM.setColorAt(i10, col2); });
    cM.castShadow = hi; scene.add(tM); scene.add(cM);
  }
  if (palms.length) {
    var ptG = new THREE.CylinderGeometry(0.14, 0.22, 7, 6); ptG.translate(0, 3.5, 0); var lf = new THREE.ConeGeometry(2.6, 1.2, 7, 1, true); lf.translate(0, 6.9, 0);
    var pT = new THREE.InstancedMesh(ptG, lam({ color: 0x8A6B47 }), palms.length), pL = new THREE.InstancedMesh(lf, new THREE.MeshLambertMaterial({ color: 0x3E7A34, side: THREE.DoubleSide }), palms.length), m9 = new THREE.Matrix4();
    palms.forEach(function (p3, i11) { m9.makeScale(p3[2], p3[2], p3[2]); m9.setPosition(p3[0], C.hAt(p3[0], p3[1]), p3[1]); pT.setMatrixAt(i11, m9); pL.setMatrixAt(i11, m9); });
    scene.add(pT); scene.add(pL);
  }
  C.M = M;
  return C;
}
