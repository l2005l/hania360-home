// The 3D world: the road, its edges and barriers, the ground and sea, the scenery for each theme, the sky and light,
// the cars (models with turning, steering wheels and body roll), smoke, skid marks, nitro, and the camera.
var G = { scale: 1.7, models: {}, hi: true };
function canvasTex(w, h, draw, rep) {
  var c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
function noiseFill(x, w, h, base, n, a) { x.fillStyle = base; x.fillRect(0, 0, w, h); for (var i = 0; i < n; i++) { x.fillStyle = "rgba(" + (Math.random() < 0.5 ? "0,0,0" : "255,255,255") + "," + (Math.random() * a) + ")"; x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3); } }
function rnd(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }

// ---------- the track ----------
function buildWorld(tr, th, scene) {
  var T = tr.T, N = tr.N, w = tr.w, i, R = rnd(T.R * 7 + N);
  var fogc = new THREE.Color(th.fog);
  scene.fog = new THREE.Fog(fogc, th.night ? 60 : 140, th.night ? 650 : 1150);
  scene.background = canvasTex(4, 256, function (x, W, H) { var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.sky[0]); g.addColorStop(0.62, th.sky[1]); g.addColorStop(1, th.fog); x.fillStyle = g; x.fillRect(0, 0, W, H); });
  var hemi = new THREE.HemisphereLight(new THREE.Color(th.sky[1]), new THREE.Color(th.ground), th.amb); scene.add(hemi);
  var sun = new THREE.DirectionalLight(th.warm ? 0xFFD2A0 : 0xFFFFFF, th.sun); sun.position.set(120, 220, 80);
  if (G.hi) { sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70; sc.near = 10; sc.far = 500; sun.shadow.bias = -0.0005; }
  scene.add(sun); scene.add(sun.target);
  // bounds
  var minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  for (i = 0; i < N; i++) { minX = Math.min(minX, tr.X[i]); maxX = Math.max(maxX, tr.X[i]); minZ = Math.min(minZ, tr.Z[i]); maxZ = Math.max(maxZ, tr.Z[i]); }
  var cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2, size = Math.max(maxX - minX, maxZ - minZ) + 1600;
  // ground
  var gtex = canvasTex(256, 256, function (x, W, H) { noiseFill(x, W, H, th.ground, 2600, th.snow ? 0.05 : 0.12); x.globalAlpha = 0.25; for (var k = 0; k < 40; k++) { x.fillStyle = th.ground2; x.beginPath(); x.arc(Math.random() * W, Math.random() * H, 8 + Math.random() * 30, 0, 7); x.fill(); } }, 1);
  gtex.repeat.set(size / 40, size / 40);
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshLambertMaterial({ map: gtex }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(cx, -0.05, cz); ground.receiveShadow = G.hi; scene.add(ground);
  if (th.sea) {
    var sea = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshPhongMaterial({ color: 0x1F7FA8, shininess: 90, specular: 0xFFE0B0 }));
    sea.rotation.x = -Math.PI / 2; sea.position.set(maxX + 70 + size / 2, 0.02, cz); scene.add(sea);
    var foam = new THREE.Mesh(new THREE.PlaneGeometry(6, size), new THREE.MeshBasicMaterial({ color: 0xF4F1E6 })); foam.rotation.x = -Math.PI / 2; foam.position.set(maxX + 70, 0.03, cz); scene.add(foam);
    G.sea = sea;
  }
  // the road: asphalt with white edges and a dashed middle line
  var rtex = canvasTex(256, 512, function (x, W, H) {
    noiseFill(x, W, H, th.road, 5000, 0.18);
    x.fillStyle = th.night ? "#D8D8C8" : "#F2F2EA"; x.fillRect(8, 0, 7, H); x.fillRect(W - 15, 0, 7, H);
    x.fillStyle = th.snow ? "#E9D96C" : "#F2F2EA"; x.fillRect(W / 2 - 3, 0, 6, H * 0.45);
  }, 1);
  var pos = [], uv = [], idx = [], len = tr.len, vrep = len / 14;
  for (i = 0; i <= N; i++) {
    var k = i % N, v = i / N * vrep;
    for (var sd = -1; sd <= 1; sd += 2) { pos.push(tr.X[k] + tr.RX[k] * sd * w / 2, 0.02, tr.Z[k] + tr.RZ[k] * sd * w / 2); uv.push(sd < 0 ? 0 : 1, v); }
    if (i < N) { var a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  var rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); rg.setIndex(idx); rg.computeVertexNormals();
  var road = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({ map: rtex })); road.receiveShadow = G.hi; scene.add(road);
  // a strip of verge (sand or gravel) next to the road
  ribbonFlat(scene, tr, w / 2, w / 2 + 5.5, 0.01, new THREE.MeshLambertMaterial({ color: th.snow ? 0xD8E2EC : th.night ? 0x34363D : new THREE.Color(th.ground2).multiplyScalar(0.9) }));
  ribbonFlat(scene, tr, -w / 2 - 5.5, -w / 2, 0.01, new THREE.MeshLambertMaterial({ color: th.snow ? 0xD8E2EC : th.night ? 0x34363D : new THREE.Color(th.ground2).multiplyScalar(0.9) }));
  // red and white kerbs on the bends
  var ktex = canvasTex(16, 64, function (x) { x.fillStyle = "#E03131"; x.fillRect(0, 0, 16, 32); x.fillStyle = "#F8F9FA"; x.fillRect(0, 32, 16, 32); }, 1);
  var kmat = new THREE.MeshLambertMaterial({ map: ktex });
  [1, -1].forEach(function (sd) { ribbonFlat(scene, tr, sd > 0 ? w / 2 : -w / 2 - 1.3, sd > 0 ? w / 2 + 1.3 : -w / 2, 0.035, kmat, function (k) { return Math.abs(tr.K[k]) > 0.0045; }, 2.2); });
  // the barriers
  var bh = th.night ? 1.1 : 0.95, btex = canvasTex(64, 32, function (x, W, H) {
    if (T.theme === "circuit") { for (var q = 0; q < 4; q++) { x.fillStyle = q % 2 ? "#F1F3F5" : "#E03131"; x.fillRect(q * 16, 0, 16, H); } }
    else if (th.night) { x.fillStyle = "#9AA3B2"; x.fillRect(0, 0, W, H); x.fillStyle = "#FFD43B"; for (var q2 = 0; q2 < 4; q2++) x.fillRect(q2 * 16, 10, 8, 12); }
    else { x.fillStyle = "#C9CED6"; x.fillRect(0, 0, W, H); x.fillStyle = "#8D96A3"; x.fillRect(0, 6, W, 4); x.fillRect(0, 22, W, 4); }
  }, 1);
  [1, -1].forEach(function (sd) { wallRibbon(scene, tr, sd * (w / 2 + 5.9), bh, new THREE.MeshLambertMaterial({ map: btex, side: THREE.DoubleSide })); });
  // start line and gantry
  var st = canvasTex(64, 16, function (x) { for (var a2 = 0; a2 < 16; a2++) for (var b2 = 0; b2 < 4; b2++) { x.fillStyle = (a2 + b2) % 2 ? "#111" : "#FFF"; x.fillRect(a2 * 4, b2 * 4, 4, 4); } });
  var sl = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.2), new THREE.MeshLambertMaterial({ map: st }));
  sl.rotation.x = -Math.PI / 2; sl.rotation.z = Math.atan2(tr.TX[0], tr.TZ[0]) + Math.PI / 2; sl.position.set(tr.X[0], 0.04, tr.Z[0]); scene.add(sl);
  var gan = new THREE.Group(), pm = new THREE.MeshLambertMaterial({ color: 0x343A40 });
  [-1, 1].forEach(function (sd) { var p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7, 0.6), pm); p.position.set(sd * (w / 2 + 2), 3.5, 0); gan.add(p); });
  var ban = canvasTex(512, 64, function (x, W, H) { x.fillStyle = "#0B1F4D"; x.fillRect(0, 0, W, H); x.fillStyle = "#FFD43B"; x.font = "bold 40px Rubik, Arial"; x.textAlign = "center"; x.fillText("HaniaRace  ·  START / FINISH", W / 2, 46); });
  var beam = new THREE.Mesh(new THREE.BoxGeometry(w + 5, 1.6, 0.5), [pm, pm, pm, pm, new THREE.MeshBasicMaterial({ map: ban }), new THREE.MeshBasicMaterial({ map: ban })]);
  beam.position.set(0, 7.3, 0); gan.add(beam); gan.position.set(tr.X[0], 0, tr.Z[0]); gan.rotation.y = Math.atan2(tr.TX[0], tr.TZ[0]); scene.add(gan);
  scenery(scene, tr, th, R, { minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ, cx: cx, cz: cz });
  return { sun: sun, hemi: hemi };
}
function ribbonFlat(scene, tr, a, b, y, mat, only, vlen) {
  var N = tr.N, pos = [], uv = [], ix = [], n = 0;
  for (var i = 0; i <= N; i++) {
    var k = i % N, on = !only || only(k) || only((k + 1) % N);
    if (!on) { n = 0; continue; }
    pos.push(tr.X[k] + tr.RX[k] * a, y, tr.Z[k] + tr.RZ[k] * a, tr.X[k] + tr.RX[k] * b, y, tr.Z[k] + tr.RZ[k] * b);
    var v = i * tr.step / (vlen || 6); uv.push(0, v, 1, v);
    var base = pos.length / 3 - 2; if (n) ix.push(base - 2, base - 1, base, base - 1, base + 1, base); n++;
  }
  var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix); g.computeVertexNormals();
  var m = new THREE.Mesh(g, mat); m.receiveShadow = G.hi; scene.add(m); return m;
}
function wallRibbon(scene, tr, off, hgt, mat) {
  var N = tr.N, pos = [], uv = [], ix = [];
  for (var i = 0; i <= N; i++) {
    var k = i % N, x = tr.X[k] + tr.RX[k] * off, z = tr.Z[k] + tr.RZ[k] * off, v = i * tr.step / 4;
    pos.push(x, 0, z, x, hgt, z); uv.push(v, 0, v, 1);
    if (i < N) { var a = i * 2; ix.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix); g.computeVertexNormals();
  var m = new THREE.Mesh(g, mat); m.castShadow = false; scene.add(m);
}
// Scenery: many copies of a few simple shapes (one draw call each)
function scenery(scene, tr, th, R, B) {
  var N = tr.N, w = tr.w, dens = G.hi ? 1 : 0.5;
  var near = function (x, z, gap) { for (var i = 0; i < N; i += 4) { var dx = x - tr.X[i], dz = z - tr.Z[i]; if (dx * dx + dz * dz < gap * gap) return true; } return false; };
  var spots = function (count, dmin, dmax) {
    var out = [];
    for (var t = 0; t < count * 4 && out.length < count; t++) {
      var i = Math.floor(R() * N), sd = R() < 0.5 ? -1 : 1, d = w / 2 + dmin + R() * (dmax - dmin);
      var x = tr.X[i] + tr.RX[i] * d * sd, z = tr.Z[i] + tr.RZ[i] * d * sd;
      if (th.sea && x > B.maxX + 55) continue;
      if (!near(x, z, w / 2 + dmin - 1)) out.push([x, z, R(), i, sd]);
    }
    return out;
  };
  var inst = function (geo, mat, list, place, shadow) {
    if (!list.length) return;
    var im = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D();
    list.forEach(function (p, j) { place(o, p); o.updateMatrix(); im.setMatrixAt(j, o.matrix); });
    im.castShadow = !!shadow && G.hi; scene.add(im); return im;
  };
  var kinds = th.scen, n = Math.round(420 * dens);
  kinds.forEach(function (kind) {
    var L, cnt = Math.round(n / kinds.length);
    if (kind === "tree" || kind === "pine") {
      L = spots(cnt, 10, 140);
      var pine = kind === "pine", col = pine ? 0x2F5D3A : 0x3E8E3A;
      inst(new THREE.CylinderGeometry(0.35, 0.5, 3, 6), new THREE.MeshLambertMaterial({ color: 0x6B4A2E }), L, function (o, p) { var s = 0.8 + p[2] * 0.8; o.position.set(p[0], 1.5 * s, p[1]); o.scale.set(s, s, s); o.rotation.set(0, 0, 0); });
      inst(new THREE.ConeGeometry(pine ? 2.2 : 3, pine ? 8 : 6, 7), new THREE.MeshLambertMaterial({ color: col }), L, function (o, p) { var s = 0.8 + p[2] * 0.8; o.position.set(p[0], (pine ? 6.5 : 5.5) * s, p[1]); o.scale.set(s, s, s); }, 1);
      if (pine && th.snow) inst(new THREE.ConeGeometry(1.3, 3, 7), new THREE.MeshLambertMaterial({ color: 0xF4F8FB }), L, function (o, p) { var s = 0.8 + p[2] * 0.8; o.position.set(p[0], 9.4 * s, p[1]); o.scale.set(s, s, s); });
    } else if (kind === "palm") {
      L = spots(cnt, 8, 70);
      inst(new THREE.CylinderGeometry(0.25, 0.4, 9, 6), new THREE.MeshLambertMaterial({ color: 0x8A6A45 }), L, function (o, p) { o.position.set(p[0], 4.5, p[1]); o.rotation.set(0, 0, (p[2] - 0.5) * 0.25); o.scale.set(1, 0.8 + p[2] * 0.5, 1); });
      inst(new THREE.ConeGeometry(3.6, 2.2, 8, 1, true), new THREE.MeshLambertMaterial({ color: 0x3C9A43, side: THREE.DoubleSide }), L, function (o, p) { o.position.set(p[0] + (p[2] - 0.5) * 1.1, 4.5 + 4.5 * (0.8 + p[2] * 0.5) - 0.2, p[1]); o.rotation.set(Math.PI, p[2] * 6, 0); o.scale.set(1, 1, 1); }, 1);
    } else if (kind === "rock") {
      L = spots(cnt, 9, 160);
      inst(new THREE.DodecahedronGeometry(1.6, 0), new THREE.MeshLambertMaterial({ color: th.snow ? 0x8A929B : th.sea ? 0xA08C6E : 0xA0602E, flatShading: true }), L, function (o, p) { var s = 0.6 + p[2] * 2.6; o.position.set(p[0], s * 0.6, p[1]); o.scale.set(s, s * (0.5 + p[2] * 0.6), s * 1.2); o.rotation.set(p[2] * 3, p[2] * 9, 0); }, 1);
    } else if (kind === "bush") {
      L = spots(cnt, 8, 120);
      inst(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0x7C8F3A, flatShading: true }), L, function (o, p) { var s = 0.6 + p[2]; o.position.set(p[0], s * 0.5, p[1]); o.scale.set(s, s * 0.7, s); o.rotation.set(0, p[2] * 6, 0); });
    } else if (kind === "mesa") {
      L = spots(Math.round(cnt / 3), 140, 420);
      inst(new THREE.CylinderGeometry(1, 1.25, 1, 7), new THREE.MeshLambertMaterial({ color: 0xB4683A, flatShading: true }), L, function (o, p) { var s = 30 + p[2] * 50; o.position.set(p[0], s * 0.35, p[1]); o.scale.set(s, s * 0.7, s * (0.7 + p[2])); o.rotation.set(0, p[2] * 5, 0); });
    } else if (kind === "tower") {
      L = spots(cnt, 14, 110);
      var wt = canvasTex(64, 128, function (x, W, H) { x.fillStyle = "#1A1F2E"; x.fillRect(0, 0, W, H); for (var yy = 4; yy < H; yy += 8) for (var xx = 4; xx < W; xx += 8) { x.fillStyle = Math.random() < 0.45 ? ["#FFE8A3", "#FFF4D6", "#9AD1FF"][Math.floor(Math.random() * 3)] : "#232A3D"; x.fillRect(xx, yy, 5, 5); } }, 1);
      var tm = new THREE.MeshLambertMaterial({ color: 0x2A3042, emissive: 0xFFFFFF, emissiveMap: wt, map: wt });
      inst(new THREE.BoxGeometry(1, 1, 1), tm, L, function (o, p) { var hh = 25 + p[2] * p[2] * 130, ww = 12 + p[2] * 14; o.position.set(p[0], hh / 2, p[1]); o.scale.set(ww, hh, ww * (0.7 + p[2] * 0.6)); o.rotation.set(0, p[3] * 0.01, 0); }, 1);
    } else if (kind === "lamp") {
      var LL = []; for (var i = 0; i < N; i += 13) { [-1, 1].forEach(function (sd) { var d = w / 2 + 6.6; LL.push([tr.X[i] + tr.RX[i] * d * sd, tr.Z[i] + tr.RZ[i] * d * sd, 0, i, sd]); }); }
      inst(new THREE.CylinderGeometry(0.12, 0.16, 8, 5), new THREE.MeshLambertMaterial({ color: 0x55606E }), LL, function (o, p) { o.position.set(p[0], 4, p[1]); });
      inst(new THREE.SphereGeometry(0.55, 8, 6), new THREE.MeshBasicMaterial({ color: 0xFFE7A8 }), LL, function (o, p) { o.position.set(p[0] - tr.RX[p[3]] * p[4] * 1.2, 8, p[1] - tr.RZ[p[3]] * p[4] * 1.2); });
      // pools of light on the road
      var glow = canvasTex(64, 64, function (x) { var g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, "rgba(255,226,150,.55)"); g.addColorStop(1, "rgba(255,226,150,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
      inst(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), LL, function (o, p) { o.position.set(p[0] - tr.RX[p[3]] * p[4] * 4, 0.06, p[1] - tr.RZ[p[3]] * p[4] * 4); o.rotation.set(-Math.PI / 2, 0, 0); });
    } else if (kind === "stand") {
      var SL = []; for (var i2 = 30; i2 < N; i2 += 90) if (Math.abs(tr.K[i2]) < 0.002) SL.push([0, 0, 0, i2, (i2 / 90) % 2 ? 1 : -1]);
      var crowd = canvasTex(128, 64, function (x, W, H) { x.fillStyle = "#495057"; x.fillRect(0, 0, W, H); for (var a = 0; a < 700; a++) { x.fillStyle = "hsl(" + Math.random() * 360 + ",70%,60%)"; x.fillRect(Math.random() * W, Math.random() * H, 2, 2); } }, 1);
      inst(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ map: crowd }), SL, function (o, p) { var i3 = p[3], d = w / 2 + 14; o.position.set(tr.X[i3] + tr.RX[i3] * d * p[4], 3, tr.Z[i3] + tr.RZ[i3] * d * p[4]); o.scale.set(36, 6, 8); o.rotation.set(0, Math.atan2(tr.TX[i3], tr.TZ[i3]) + Math.PI / 2, 0); }, 1);
    } else if (kind === "tires") {
      L = []; for (var i4 = 0; i4 < N; i4 += 7) if (Math.abs(tr.K[i4]) > 0.006) { var sd2 = tr.K[i4] > 0 ? 1 : -1, d2 = w / 2 + 6.4; L.push([tr.X[i4] + tr.RX[i4] * d2 * sd2, tr.Z[i4] + tr.RZ[i4] * d2 * sd2, 0, i4, sd2]); }
      inst(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 10), new THREE.MeshLambertMaterial({ color: 0x1E1E22 }), L, function (o, p) { o.position.set(p[0], 0.6, p[1]); });
    }
  });
  // far mountains (none in the city: towers instead)
  if (!th.night) {
    var M = [], R2 = Math.max(B.maxX - B.minX, B.maxZ - B.minZ) * 0.5 + 520;
    for (var m = 0; m < 26; m++) { var a = m / 26 * Math.PI * 2 + R() * 0.2; if (th.sea && Math.cos(a) > 0.2) continue; M.push([B.cx + Math.cos(a) * R2 * (1 + R() * 0.4), B.cz + Math.sin(a) * R2 * (1 + R() * 0.4), R()]); }
    inst(new THREE.ConeGeometry(1, 1, 6), new THREE.MeshLambertMaterial({ color: th.snow ? 0xE9F0F6 : th.sea ? 0x9C8B76 : T_mount(th), flatShading: true }), M, function (o, p) { var s = 160 + p[2] * 200; o.position.set(p[0], s * 0.4, p[1]); o.scale.set(s * 1.4, s * 0.8 + 40, s * 1.2); o.rotation.set(0, p[2] * 4, 0); });
  } else {
    var S = [], R3 = Math.max(B.maxX - B.minX, B.maxZ - B.minZ) * 0.5 + 300;
    for (var q = 0; q < 70; q++) { var a3 = q / 70 * Math.PI * 2; S.push([B.cx + Math.cos(a3) * R3 * (1 + R() * 0.3), B.cz + Math.sin(a3) * R3 * (1 + R() * 0.3), R()]); }
    var wt2 = canvasTex(64, 128, function (x, W, H) { x.fillStyle = "#121726"; x.fillRect(0, 0, W, H); for (var yy = 4; yy < H; yy += 8) for (var xx = 4; xx < W; xx += 8) { x.fillStyle = Math.random() < 0.5 ? "#FFE8A3" : "#1C2233"; x.fillRect(xx, yy, 5, 5); } }, 1);
    inst(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0x1B2133, emissive: 0xFFFFFF, emissiveMap: wt2, map: wt2 }), S, function (o, p) { var hh = 60 + p[2] * 200; o.position.set(p[0], hh / 2, p[1]); o.scale.set(30 + p[2] * 30, hh, 30); });
  }
}
function T_mount(th) { return th.grip < 0.99 ? 0xB06A3A : 0x6F8F6A; }

// ---------- reflections ----------
// An environment for reflections on the cars: a sky dome in the theme's colours with a sun and a few soft lights,
// turned into a reflection map (PMREM). The garage has its own: dark, with studio light boxes.
function makeEnv(th) {
  var key = th ? th.sky.join() + th.night : "studio";
  G.envs = G.envs || {};
  if (G.envs[key]) return G.envs[key];
  var es = new THREE.Scene(), top = new THREE.Color(th ? th.sky[0] : "#0B0F1C"), hor = new THREE.Color(th ? th.sky[1] : "#2A3350"), gnd = new THREE.Color(th ? th.ground : "#10141F").multiplyScalar(0.55);
  // the dome: colours per vertex (a basic material, so the reflection map stores them correctly)
  var sg = new THREE.SphereGeometry(50, 32, 16), pa = sg.attributes.position, cols = [], tmp = new THREE.Color();
  for (var v = 0; v < pa.count; v++) { var y = pa.getY(v) / 50; if (y > 0) tmp.copy(hor).lerp(top, Math.pow(y, 0.6)); else tmp.copy(hor).multiplyScalar(0.8).lerp(gnd, Math.min(1, -y * 4)); cols.push(tmp.r, tmp.g, tmp.b); }
  sg.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  var dome = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false }));
  es.add(dome);
  var lamp = function (x, y, z, w, h, col, k) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m); };
  if (!th) { lamp(0, 30, 0, 30, 8, 0xFFFFFF, 3); lamp(30, 12, 20, 14, 10, 0xFFFFFF, 2); lamp(-30, 12, -10, 14, 10, 0xBFD4FF, 1.6); lamp(0, 8, -40, 40, 4, 0xFFC53D, 1.2); }
  else if (th.night) { for (var i = 0; i < 14; i++) { var a = i / 14 * Math.PI * 2; lamp(Math.cos(a) * 45, 4 + (i % 3) * 5, Math.sin(a) * 45, 3, 8, i % 2 ? 0xFFE7A8 : 0x9AD1FF, 2.2); } lamp(0, 40, 0, 20, 20, 0x2B3566, 1); }
  else { lamp(30, 35, 20, 10, 10, th.warm ? 0xFFD2A0 : 0xFFFFFF, 6); lamp(-25, 20, -30, 30, 12, 0xFFFFFF, 0.6); }
  var pm = new THREE.PMREMGenerator(G.R), tex = pm.fromScene(es, 0.02).texture; pm.dispose();
  return (G.envs[key] = tex);
}
// Car paint: from the cars' colour palette, a map saying where things are glossy paint, dark tinted glass, chrome
// or matte rubber (red: clearcoat, green: roughness, blue: metal), and the glass made dark like real windows.
function paintMat(src) {
  if (G.paint) return G.paint;
  var img = src.map && src.map.image; if (!img || !img.width) return src;
  var w = img.width, h = img.height, c = document.createElement("canvas"); c.width = w; c.height = h;
  var x = c.getContext("2d"); x.drawImage(img, 0, 0); var D = x.getImageData(0, 0, w, h), P = D.data;
  var c2 = document.createElement("canvas"); c2.width = w; c2.height = h; var x2 = c2.getContext("2d"), M = x2.createImageData(w, h), Q = M.data;
  for (var i = 0; i < P.length; i += 4) {
    var r = P[i], g = P[i + 1], b = P[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255, sat = mx ? (mx - mn) / mx : 0;
    var cc = 1, ro = 0.38, me = 0.12;
    if (lum > 0.62 && b > r + 18 && sat < 0.32) { P[i] = 10 + r * 0.05; P[i + 1] = 14 + g * 0.05; P[i + 2] = 22 + b * 0.07; cc = 0.35; ro = 0.12; me = 0; }   // glass
    else if (lum < 0.3) { cc = 0; ro = 0.82; me = 0; }                       // tyres, rubber, trim
    else if (sat < 0.16 && lum < 0.62) { cc = 0.6; ro = 0.22; me = 0.9; }   // chrome and steel
    else if (sat < 0.12) { cc = 1; ro = 0.35; me = 0.05; }                  // white paint
    Q[i] = cc * 255; Q[i + 1] = ro * 255; Q[i + 2] = me * 255; Q[i + 3] = 255;
  }
  x.putImageData(D, 0, 0); x2.putImageData(M, 0, 0);
  var map = new THREE.CanvasTexture(c), rm = new THREE.CanvasTexture(c2);
  [map, rm].forEach(function (t) { t.flipY = src.map.flipY; t.minFilter = THREE.NearestMipmapLinearFilter; t.magFilter = THREE.NearestFilter; });
  map.encoding = THREE.sRGBEncoding;
  var o = { map: map, roughnessMap: rm, metalnessMap: rm, roughness: 1, metalness: 1, envMapIntensity: 0.85 };
  if (G.hi) { o.clearcoat = 1; o.clearcoatMap = rm; o.clearcoatRoughness = 0.06; }
  return (G.paint = G.hi ? new THREE.MeshPhysicalMaterial(o) : new THREE.MeshStandardMaterial(o));
}
var BLOB = null;
function blobTex() { return BLOB || (BLOB = canvasTex(64, 128, function (x, W, H) { var g = x.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, W / 2); g.addColorStop(0, "rgba(0,0,0,.6)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.save(); x.scale(1, 2); x.fillStyle = g; x.fillRect(0, 0, W, H / 2); x.restore(); })); }

// ---------- cars ----------
function loadModel(id) {
  if (G.models[id]) return G.models[id];
  if (window.GEN && CAR_BY[id]) { G.models[id] = Promise.resolve(GEN.car(CAR_BY[id])); return G.models[id]; }
  G.models[id] = new Promise(function (res, rej) { new THREE.GLTFLoader().load("/models/" + id + ".glb?v=1", function (g) { res(g.scene); }, undefined, rej); });
  return G.models[id];
}
var GLOW = null;
function glowTex() { return GLOW || (GLOW = canvasTex(64, 64, function (x) { var g = x.createRadialGradient(32, 32, 1, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, "rgba(255,255,255,.6)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); })); }
function sprite(color, size) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.set(size, size, 1); return s; }
function carMesh(spec, src, ghost) {
  var root = new THREE.Group(), body = new THREE.Group(), m = src.clone(true);
  var gen = !!src.userData.gen; m.scale.setScalar(gen ? 1 : G.scale); body.add(m); root.add(body); m.updateMatrixWorld(true);
  var wheels = [], box = new THREE.Box3().setFromObject(m);
  m.traverse(function (o) {
    if (o.isMesh) { o.castShadow = G.hi && !ghost; if (!ghost && !gen && o.material && o.material.map) o.material = paintMat(o.material); if (ghost) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.35; o.material.depthWrite = false; } }
    if (/^wheel/.test(o.name) && (!gen || o.isGroup)) { o.rotation.order = "YXZ"; wheels.push({ o: o, y0: o.rotation.y, front: /front/.test(o.name) || o.name === "wheel-front" }); }
  });
  var top = box.max.y, front = box.max.z, back = box.min.z, half = box.max.x;
  if (!ghost) { var bl = new THREE.Mesh(new THREE.PlaneGeometry(half * 2.5, (front - back) * 1.15), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false })); bl.rotation.x = -Math.PI / 2; bl.position.y = 0.04; bl.renderOrder = -1; root.add(bl); }
  var lights = { head: [], brake: [], siren: [] };
  [-1, 1].forEach(function (sd) {
    var h = sprite(0xFFF6D5, 0.85); h.position.set(sd * half * 0.62, 0.75, front + 0.05); root.add(h); lights.head.push(h);
    var b = sprite(0xFF2020, 0.9); b.position.set(sd * half * 0.62, 0.95, back - 0.05); root.add(b); lights.brake.push(b);
  });
  if (spec.siren) { [0xFF2030, 0x2050FF].forEach(function (col, j) { var s = sprite(col, 1.5); s.position.set((j ? -1 : 1) * 0.42, top + 0.12, 0); root.add(s); lights.siren.push(s); }); }
  var flame = sprite(0x4DABF7, 1.3); flame.position.set(0.35, 0.5, back - 0.4); flame.visible = false; root.add(flame);
  return { root: root, body: body, wheels: wheels, lights: lights, flame: flame, spin: 0, len: front - back, wr: src.userData.wr || 0.52 };
}
function syncCar(V, c, dt, night, t) {
  V.root.position.set(c.x, 0, c.z); V.root.rotation.y = c.h;
  V.spin += c.u * dt / V.wr;
  V.wheels.forEach(function (w) { w.o.rotation.x = V.spin; w.o.rotation.y = w.y0 + (w.front ? c.steer * 1.4 : 0); });
  var lat = c.u * c.r, lon = c.acc || 0;
  V.body.rotation.z += (Math.max(-0.07, Math.min(0.07, -lat * 0.006)) - V.body.rotation.z) * Math.min(1, dt * 6);
  V.body.rotation.x += (Math.max(-0.05, Math.min(0.05, -lon * 0.006)) - V.body.rotation.x) * Math.min(1, dt * 6);
  V.lights.head.forEach(function (h) { h.visible = !!night; });
  V.lights.brake.forEach(function (b) { b.visible = c.braking || night; b.material.opacity = c.braking ? 1 : 0.35; });
  V.lights.siren.forEach(function (s, j) { s.visible = !!c.siren && (Math.floor(t * 6) + j) % 2 === 0; });
  V.flame.visible = c.boost > 0.3; if (V.flame.visible) { var f = 1 + Math.random() * 0.8; V.flame.scale.set(f * 1.2, f * 1.2, 1); }
}

// ---------- smoke and skid marks ----------
function makeFx(scene) {
  var smoke = [], tex = canvasTex(64, 64, function (x) { var g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,.75)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
  for (var i = 0; i < 90; i++) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; scene.add(s); smoke.push({ s: s, life: 0 }); }
  var SK = G.hi ? 1600 : 700, skid = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.32, 1.1), new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.45, depthWrite: false }), SK);
  var o = new THREE.Object3D(); o.position.set(0, -50, 0); o.updateMatrix(); for (i = 0; i < SK; i++) skid.setMatrixAt(i, o.matrix);
  skid.frustumCulled = false; scene.add(skid);
  var si = 0, sp = 0;
  return {
    puff: function (x, z, col, big) { var p = smoke[sp++ % smoke.length]; p.life = 1; p.big = big ? 1.8 : 1; p.s.position.set(x + (Math.random() - 0.5) * 0.6, 0.4, z + (Math.random() - 0.5) * 0.6); p.s.material.color.set(col); p.s.visible = true; p.vy = 0.8 + Math.random(); },
    mark: function (x, z, h) { o.position.set(x, 0.045, z); o.rotation.set(-Math.PI / 2, 0, h); o.updateMatrix(); skid.setMatrixAt(si++ % SK, o.matrix); skid.instanceMatrix.needsUpdate = true; },
    step: function (dt) { smoke.forEach(function (p) { if (p.life <= 0) return; p.life -= dt * 0.9; p.s.position.y += p.vy * dt; var sz = (1.2 + (1 - p.life) * 4) * p.big; p.s.scale.set(sz, sz, 1); p.s.material.opacity = Math.max(0, p.life * 0.55); if (p.life <= 0) p.s.visible = false; }); },
  };
}
function makeSnow(scene) {
  var n = G.hi ? 1500 : 600, g = new THREE.BufferGeometry(), P = new Float32Array(n * 3);
  for (var i = 0; i < n; i++) { P[i * 3] = (Math.random() - 0.5) * 120; P[i * 3 + 1] = Math.random() * 40; P[i * 3 + 2] = (Math.random() - 0.5) * 120; }
  g.setAttribute("position", new THREE.BufferAttribute(P, 3));
  var pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.25, transparent: true, opacity: 0.85 })); pts.frustumCulled = false; scene.add(pts);
  return function (cx, cz, dt) { pts.position.set(cx, 0, cz); for (var i = 0; i < n; i++) { P[i * 3 + 1] -= dt * (3 + (i % 5)); P[i * 3] += Math.sin(i + P[i * 3 + 1] * 0.3) * dt * 0.6; if (P[i * 3 + 1] < 0) P[i * 3 + 1] = 40; } g.attributes.position.needsUpdate = true; };
}
