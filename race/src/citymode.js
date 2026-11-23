// The open city: driving where you like on real streets, the street you are on, the GPS, missions (deliveries, taxi,
// ambulance, fire truck, a street race, hidden stars), the time of day, rain and the radio.
// main.js hands it what it shares (the renderer, the camera, the controls, the screens) as `A`.
function cityMode(A) {
  var M = { on: false }, W = null, cam = A.cam, R = A.R;
  var $ = function (i) { return document.getElementById(i); };
  var el = function (t, cls, txt) { var e = document.createElement(t); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  var S = A.S; S.city = S.city || {}; S.cset = S.cset || { id: "tel-aviv", time: "now", wx: "clear" };
  var CACHE = {};
  // ---------- the picker ----------
  M.screen = function () {
    A.show("city");
    var box = $("cyList"); box.replaceChildren();
    CITY_LIST.forEach(function (c) {
      var got = (S.city[c[0]] && S.city[c[0]].got || []).length;
      var b = el("button", "trk" + (S.cset.id === c[0] ? " on" : "")); b.append(el("b", "", "🏙️ " + c[1]), el("small", "", c[2] + (got ? " · ⭐ " + got + "/" + STAR_N : "")));
      b.onclick = function () { S.cset.id = c[0]; A.save(); [].forEach.call(box.children, function (x) { x.classList.toggle("on", x === b); }); };
      box.append(b);
    });
    var chips = function (id, key, list) { var g = $(id); g.replaceChildren.apply(g, list.map(function (o) { var b = el("button", "chip" + (S.cset[key] === o[0] ? " on" : ""), o[1]); b.onclick = function () { S.cset[key] = o[0]; A.save(); M.screen(); }; return b; })); };
    chips("cyTime", "time", [["now", "🕐 כמו עכשיו"], ["day", "☀️ צהריים"], ["dusk", "🌅 שקיעה"], ["night", "🌙 לילה"]]);
    chips("cyWx", "wx", [["clear", "☀️ בהיר"], ["rain", "🌧️ גשם"]]);
    $("cyCar").textContent = "🚗 " + CAR_BY[S.car].n;
  };
  // ---------- time of day ----------
  function hourNow() { var p = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jerusalem" }).split(":"); return +p[0] + p[1] / 60; }
  function hourOf(k) { return k === "day" ? 12.5 : k === "dusk" ? 17.6 : k === "night" ? 22 : hourNow(); }
  // colours at a few hours, mixed in between
  var SKY = [[0, "#050A18", "#18223D", 0.06, 0x8FA6D8, 0.2], [5.5, "#1B2547", "#E79A6A", 0.25, 0xFFB07A, 0.35], [7.5, "#5FA8E8", "#DCEBF5", 0.85, 0xFFF2DD, 0.7], [12, "#4F9DE6", "#D7EAF6", 1.0, 0xFFFFFF, 0.78],
    [16.3, "#5FA3E4", "#E8E3D2", 0.85, 0xFFF0D8, 0.7], [17.6, "#3A4C8C", "#F49B5B", 0.45, 0xFFA060, 0.48], [18.6, "#0E1631", "#3B3157", 0.1, 0x9CA8D8, 0.26], [24, "#050A18", "#18223D", 0.06, 0x8FA6D8, 0.2]];
  function skyAt(h) {
    for (var i = 0; i + 1 < SKY.length; i++) if (h >= SKY[i][0] && h <= SKY[i + 1][0]) {
      var a = SKY[i], b = SKY[i + 1], f = (h - a[0]) / (b[0] - a[0] || 1), mix = function (x, y) { return new THREE.Color(x).lerp(new THREE.Color(y), f); };
      return { top: mix(a[1], b[1]), hor: mix(a[2], b[2]), sun: a[3] + (b[3] - a[3]) * f, sunCol: mix(a[4], b[4]), hemi: a[5] + (b[5] - a[5]) * f, night: h < 6 || h > 18.3 };
    }
    return skyAt(12);
  }
  function skyTex(s) { var c = document.createElement("canvas"); c.width = 4; c.height = 256; var x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, "#" + s.top.getHexString()); g.addColorStop(0.62, "#" + s.hor.getHexString()); g.addColorStop(1, "#" + s.hor.getHexString()); x.fillStyle = g; x.fillRect(0, 0, 4, 256); var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }
  // ---------- going into a city ----------
  M.start = function (id) {
    id = id || S.cset.id; A.show("loading"); $("ldText").textContent = "בונה את " + (CITY_LIST.find(function (c) { return c[0] === id; }) || [0, ""])[1] + "…";
    var spec = CAR_BY[S.car];
    var get = CACHE[id] ? Promise.resolve(CACHE[id]) : fetch("/city/" + id + ".json?v=" + CITY_V).then(function (r) { if (!r.ok) throw new Error("map " + r.status); return r.json(); }).then(function (d) { CACHE = {}; CACHE[id] = d; return d; });
    Promise.all([get, loadModel(spec.id)]).then(function (res) {
      setTimeout(function () { try { build(id, res[0], spec, res[1]); } catch (e) { console.error(e); $("ldText").textContent = "לא הצלחנו לבנות את העיר. נסו שוב."; } }, 30);
    }).catch(function (e) { console.error(e); $("ldText").textContent = "לא הצלחנו לטעון את המפה. בדקו את החיבור ונסו שוב."; });
  };
  function build(id, D, spec, model) {
    M.exit(true);
    var scene = new THREE.Scene(), C = cityRead(D), hr = hourOf(S.cset.time), sk = skyAt(hr), rain = S.cset.wx === "rain";
    cityBuild(C, scene, id);
    W = { id: id, C: C, scene: scene, t: 0, hour: hr, sky: sk, night: sk.night, rain: rain, msgT: 0, camH: 0, camP: new THREE.Vector3(), shake: 0, street: "", red: {}, mis: null, said: {} };
    if (rain) { sk.top.multiplyScalar(0.6); sk.hor.lerp(new THREE.Color(0x8C949E), 0.6); sk.sun *= 0.35; }
    scene.background = skyTex(sk);
    scene.fog = new THREE.Fog(sk.hor.clone().lerp(new THREE.Color(0xC8CCD2), rain ? 0.4 : 0.1), rain ? 40 : 90, (G.hi ? 470 : 320) * (rain ? 0.6 : 1));
    var hemi = new THREE.HemisphereLight(sk.top.clone().lerp(new THREE.Color(0xFFFFFF), sk.night ? 0.2 : 0.5), sk.night ? 0x2A2A33 : 0x8A7F6A, sk.night ? 0.32 : sk.hemi + 0.15); scene.add(hemi);
    var sun = new THREE.DirectionalLight(sk.sunCol, sk.sun); sun.castShadow = G.hi && sk.sun > 0.3;
    if (sun.castShadow) { sun.shadow.mapSize.set(1024, 1024); var sc = sun.shadow.camera; sc.left = sc.bottom = -70; sc.right = sc.top = 70; sc.near = 10; sc.far = 400; sun.shadow.bias = -0.0006; }
    scene.add(sun); scene.add(sun.target); W.sun = sun;
    var amb = new THREE.AmbientLight(sk.night ? 0x6C7AA8 : 0xFFFFFF, sk.night ? 0.06 : 0.05); scene.add(amb);
    // the angle of the sun from the hour (east in the morning, west in the evening), so the shadows are right
    var ang = (hr - 6) / 12 * Math.PI; W.sunDir = new THREE.Vector3(-Math.cos(ang) * 120, Math.max(25, Math.sin(Math.max(0.15, Math.min(Math.PI - 0.15, ang))) * 160), 60);
    W.env = makeEnv({ sky: ["#" + sk.top.getHexString(), "#" + sk.hor.getHexString()], ground: "#8A7F6A", night: sk.night, warm: hr > 16 && hr < 19 });
    scene.environment = W.env;
    // night: windows lit, street lamps glowing
    var nightK = sk.night ? 1 : hr > 17.3 && hr < 18.6 ? 0.5 : 0;
    C.M.fac.forEach(function (m) { m.emissive.setRGB(nightK, nightK * 0.92, nightK * 0.8); });
    if (rain) { C.M.road.color.setRGB(0.72, 0.72, 0.76); }
    if (nightK && C.lamps.length) {
      var pos = []; C.lamps.forEach(function (lp) { pos.push(lp[0] + Math.sin(lp[2]) * 1.4, 6.75, lp[1] + Math.cos(lp[2]) * 1.4); });
      var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      scene.add(new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex(), color: 0xFFD9A0, size: 7, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 * nightK })));
      if (C.lampHeads) C.lampHeads.material.color.set(0xFFF2D0);
      W.head = new THREE.SpotLight(0xFFF2D5, 1.6, 70, 0.55, 0.5, 1.2); scene.add(W.head); scene.add(W.head.target);
    }
    if (rain) W.rainFx = makeRain(scene);
    // you: start on a main street near the centre
    var st = startPoint(C), me = { spec: spec, u: 0, v: 0, r: 0, steer: 0, nitro: 1, boost: 0, off: 0, slip: 0, hit: 0, spin: 0, t: 0, lat: 0, vmax: spec.top / 3.6, A0: 27.78 / spec.acc * 1.32, m: spec.m, I: spec.m * 1.6, gear: 1, rpm: 0.2, x: st.x, z: st.z, h: st.h };
    W.me = me; W.V = carMesh(spec, model); scene.add(W.V.root); W.camH = me.h; W.camP.set(me.x - Math.sin(me.h) * 8, 4, me.z - Math.cos(me.h) * 8);
    W.live = cityLive(C, scene, { honk: function () { sndBeep(392, 0.25, 0.08); setTimeout(function () { sndBeep(392, 0.25, 0.08); }, 300); }, dodged: function () { if (W.t - (W.said.dodge || -9) > 8) { W.said.dodge = W.t; flash("😮 זהירות, הולכי רגל!", 1.6); } }, get night() { return W.night; } });
    W.fx = makeFx(scene); W.stars = makeStars(C, scene, id); W.mapC = mapCanvas(C);
    W.guide = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0x4DABF7, transparent: true, opacity: 0.55, depthWrite: false, fog: false })); W.guide.renderOrder = 3; W.guide.frustumCulled = false; scene.add(W.guide);
    W.beam = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 60, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xFFD43B, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, fog: false })); W.beam.visible = false; scene.add(W.beam);
    W.ring = new THREE.Mesh(new THREE.RingGeometry(3.4, 4.2, 32), new THREE.MeshBasicMaterial({ color: 0xFFD43B, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })); W.ring.rotation.x = -Math.PI / 2; W.ring.position.y = 0.2; W.ring.visible = false; scene.add(W.ring);
    M.on = true; G.state = "city"; document.body.classList.add("incity"); $("cStreet").textContent = ""; HC = {};
    A.show(null); $("chud").hidden = false; $("cbWater").hidden = true;
    cam.far = 1200; cam.updateProjectionMatrix();
    flash("🏙️ " + C.name + " · " + (st.name ? "רחוב " + st.name : "סעו לאן שבא לכם"), 3);
    hudMis();
  }
  function startPoint(C) {
    var best = null, bd = 1e18;
    // a named city street (not a highway) near the centre, and not too wide
    C.roads.forEach(function (r) { if (r.t > 5 || r.t < 3 || !r.name || r.w > 13) return; for (var k = 0; k + 1 < r.v.length; k++) { var x = (C.VX[r.v[k]] + C.VX[r.v[k + 1]]) / 2, z = (C.VZ[r.v[k]] + C.VZ[r.v[k + 1]]) / 2, d = x * x + z * z; if (d < bd) { bd = d; best = { r: r, k: k, x: x, z: z }; } } });
    if (!best) C.roads.forEach(function (r) { var x = C.VX[r.v[0]], z = C.VZ[r.v[0]], d = x * x + z * z; if (d < bd) { bd = d; best = { r: r, k: 0, x: x, z: z }; } });
    var r = best.r, dx = C.VX[r.v[best.k + 1]] - C.VX[r.v[best.k]], dz = C.VZ[r.v[best.k + 1]] - C.VZ[r.v[best.k]], l = Math.hypot(dx, dz) || 1, o = r.ow ? 0 : r.w / 4;
    if (r.ow < 0) { dx = -dx; dz = -dz; }
    return { x: best.x - dz / l * o, z: best.z + dx / l * o, h: Math.atan2(dx, dz), name: r.name };
  }
  M.exit = function (keepScreen) {
    if (!W) { M.on = false; return; }
    W.live.dispose(); radio(0, true);
    var seen = new Set();
    W.scene.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      [].concat(o.material || []).forEach(function (m) { if (seen.has(m) || W.V.root === o) return; seen.add(m); ["map", "emissiveMap"].forEach(function (k) { if (m[k] && m[k].isCanvasTexture) m[k].dispose(); }); });
    });
    if (W.scene.background && W.scene.background.dispose) W.scene.background.dispose();
    W = null; M.on = false; document.body.classList.remove("incity"); $("chud").hidden = true; $("cMapBig").hidden = true; $("cPanel").hidden = true;
    if (!keepScreen) { G.state = null; A.menu(); }
  };
  function flash(t, sec) { var m = $("hMsg"); m.textContent = t; m.hidden = false; if (W) W.msgT = sec || 2; }
  // ---------- one step ----------
  var HB = 1.25, CR = 1.05;
  function blocked(x, z) { var g = W.C.at(x, z); return g === 2 || g === 4; }
  M.step = function (dt) {
    var w = W, me = w.me, C = w.C; w.t += dt;
    var inp = w.mis && w.mis.freeze ? { thr: 0, brk: 1, steer: 0 } : A.input();
    me.thr = inp.thr; me.braking = inp.brk > 0 && me.u > 0.5;
    var g = C.at(me.x, me.z); me.lat = g === 1 ? 0 : 99;
    var ox = me.x, oz = me.z;
    drive(me, inp, dt, { w: 4 }, w.rain ? 0.8 : 1);
    // buildings and water: the car stops at them and slides along walls
    var fx = Math.sin(me.h), fz = Math.cos(me.h), hit = 0;
    for (var s = -1; s <= 1; s += 2) {
      var px = me.x + fx * HB * s, pz = me.z + fz * HB * s;
      if (!blockedR(px, pz)) continue;
      var n = normalAt(px, pz), v = vel(me), vn = v[0] * n[0] + v[1] * n[1];
      if (vn < 0) { setVel(me, (v[0] - n[0] * vn * 1.3) * 0.9, (v[1] - n[1] * vn * 1.3) * 0.9); hit = Math.max(hit, -vn); }
      for (var it = 0; it < 6 && blockedR(me.x + fx * HB * s, me.z + fz * HB * s); it++) { me.x += n[0] * 0.25; me.z += n[1] * 0.25; }
    }
    if (blockedR(me.x, me.z)) { me.x = ox; me.z = oz; me.u *= -0.2; me.v = 0; }
    if (C.at(me.x, me.z) === 4 || C.at(me.x + fx * 2.5, me.z + fz * 2.5) === 4) { if (!w.said.sea || w.t - w.said.sea > 3) { w.said.sea = w.t; flash("🌊 זה הים! חוזרים לכביש", 1.6); } }
    var lim = C.L - 8; if (Math.abs(me.x) > lim || Math.abs(me.z) > lim) { me.x = Math.max(-lim, Math.min(lim, me.x)); me.z = Math.max(-lim, Math.min(lim, me.z)); me.u *= 0.5; if (w.t - (w.said.edge || -9) > 4) { w.said.edge = w.t; flash("🗺️ כאן נגמרת המפה של " + C.name, 1.8); } }
    hit = Math.max(hit, w.live.knock(me));
    if (hit > 3) { sndHit(Math.min(1, hit / 15)); w.shake = Math.min(1, hit / 12); }
    // the city around you
    w.live.stepCars(dt, me, w.t); w.live.stepPeds(dt, me, w.t);
    if (Math.floor(w.t * 4) !== Math.floor((w.t - dt) * 4)) w.live.lights(w.t);
    // the street you are on, and its speed limit
    var nr = C.near(me.x, me.z, 14);
    if (nr) { var r = C.roads[nr.road]; if (r.name && r.name !== w.street) { w.street = r.name; $("cStreet").textContent = r.name; $("cStreet").classList.remove("pop"); void $("cStreet").offsetWidth; $("cStreet").classList.add("pop"); } w.lim = Math.round(r.vmax * 3.6 / 10) * 10; w.nr = nr; }
    // red lights and zebra crossings
    if (C.lights.length && Math.abs(me.u) > 4) C.lights.forEach(function (lt) {
      var v = lt.v, dx = C.VX[v] - me.x, dz = C.VZ[v] - me.z; if (dx * dx + dz * dz > 25) return;
      var ex = C.E.dx[lt.e], ez = C.E.dz[lt.e]; if (fx * ex + fz * ez < 0.8) return;
      if (lightState(C, v, lt.axis, w.t) === 2 && w.t - (w.red[v] || -99) > 10) { w.red[v] = w.t; flash("🚦 עברת באור אדום!", 1.8); sndBeep(220, 0.3, 0.1); }
    });
    w.live.peds.forEach(function (p) { if (p.onRoad && Math.abs(me.u) > 3 && Math.hypot(p.x - me.x, p.z - me.z) < 7 && w.t - (w.said.zebra || -9) > 6) { w.said.zebra = w.t; flash("🚸 עוצרים להולכי רגל במעבר החציה!", 2); } });
    w.stars.step(dt, me, w.t, function (n) { got(n); });
    misStep(dt);
    if (w.msgT > 0) { w.msgT -= dt; if (w.msgT <= 0) $("hMsg").hidden = true; }
  };
  function blockedR(x, z) { return blocked(x + CR * 0.7, z) || blocked(x - CR * 0.7, z) || blocked(x, z + CR * 0.7) || blocked(x, z - CR * 0.7); }
  function normalAt(x, z) { var nx = 0, nz = 0; for (var dz = -2; dz <= 2; dz++) for (var dx = -2; dx <= 2; dx++) if (blocked(x + dx, z + dz)) { nx -= dx; nz -= dz; } var l = Math.hypot(nx, nz); return l ? [nx / l, nz / l] : [-Math.sin(W.me.h), -Math.cos(W.me.h)]; }
  M.resetCar = function () { if (!W) return; var me = W.me, nr = W.C.near(me.x, me.z, 400); if (!nr) return; var r = W.C.roads[nr.road], d = r.ow < 0 ? -1 : 1, o = r.ow ? 0 : r.w / 4; me.x = nr.x - nr.dz * d * o; me.z = nr.z + nr.dx * d * o; me.h = Math.atan2(nr.dx * d, nr.dz * d); me.u = me.v = me.r = 0; flash("🔄 חזרה לכביש", 1.2); };
  // ---------- drawing ----------
  M.render = function (dt) {
    var w = W, me = w.me, t = w.t;
    syncCar(w.V, me, dt, w.night, t);
    if (Math.abs(me.u) > 5 && me.slip > 0.55) { var bx = me.x - Math.sin(me.h) * 1.3, bz = me.z - Math.cos(me.h) * 1.3; if (Math.random() < 0.6) w.fx.puff(bx, bz, "#DDDDDD", 0); w.fx.mark(bx + Math.cos(me.h) * 0.85, bz - Math.sin(me.h) * 0.85, me.h); w.fx.mark(bx - Math.cos(me.h) * 0.85, bz + Math.sin(me.h) * 0.85, me.h); }
    w.fx.step(dt); if (w.rainFx) w.rainFx(cam.position, dt);
    if (w.fire) w.fire.step(dt, t);
    var mode = A.S.set.cam, dh = me.h - w.camH; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI;
    w.camH += dh * Math.min(1, dt * (mode === 2 ? 12 : 3.2));
    var fx = Math.sin(w.camH), fz = Math.cos(w.camH), sp = Math.abs(me.u), por = innerHeight > innerWidth;
    var big = me.spec.m > 3000 ? 1.35 : 1, dist = (mode === 1 ? 14 : 7.4 + sp * 0.03) * (por ? 1.3 : 1) * big, hgt = (mode === 1 ? 6.5 : 2.9 + sp * 0.008) * big + (por ? 1 : 0);
    if (mode === 2) { cam.position.set(me.x + Math.sin(me.h) * 0.4, 1.7 * big, me.z + Math.cos(me.h) * 0.4); cam.lookAt(me.x + Math.sin(me.h) * 20, 1.2, me.z + Math.cos(me.h) * 20); }
    else {
      var tx = me.x - fx * dist, tz = me.z - fz * dist;
      // keep the camera out of buildings: come closer when a wall is between
      for (var k = 0; k < 6 && W.C.at(tx, tz) === 2; k++) { tx += fx * dist * 0.15; tz += fz * dist * 0.15; }
      w.camP.x += (tx - w.camP.x) * Math.min(1, dt * 8); w.camP.z += (tz - w.camP.z) * Math.min(1, dt * 8); w.camP.y += (hgt - w.camP.y) * Math.min(1, dt * 5);
      cam.position.copy(w.camP); cam.lookAt(me.x + fx * 4, 1.2, me.z + fz * 4);
    }
    if (w.shake > 0) { cam.position.x += (Math.random() - 0.5) * w.shake * 0.5; cam.position.y += (Math.random() - 0.5) * w.shake * 0.4; w.shake = Math.max(0, w.shake - dt * 2.5); }
    var fov = 62 + Math.min(12, sp * 0.12) + me.boost * 7; if (Math.abs(cam.fov - fov) > 0.1) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix(); }
    w.sun.position.set(me.x + w.sunDir.x * 0.5, w.sunDir.y, me.z + w.sunDir.z * 0.5); w.sun.target.position.set(me.x, 0, me.z);
    if (w.head) { w.head.position.set(me.x + Math.sin(me.h) * 1.5, 1.4, me.z + Math.cos(me.h) * 1.5); w.head.target.position.set(me.x + Math.sin(me.h) * 30, 0, me.z + Math.cos(me.h) * 30); }
    if (w.beam.visible) { w.beam.material.opacity = 0.25 + Math.sin(t * 4) * 0.1; w.ring.scale.setScalar(1 + Math.sin(t * 5) * 0.08); }
    var near = null, nd = 1e9; w.live.cars.forEach(function (c) { var d = Math.hypot(c.x - me.x, c.z - me.z); if (d < nd) { nd = d; near = c; } });
    sndFrame(me, near ? { u: near.v, spec: near.spec, rpm: 0.3, slip: 0, off: 0, boost: 0, thr: 0.3 } : null, nd, !!w.paused);
    R.render(w.scene, cam);
  };
  // ---------- the heads-up display ----------
  var HC = {};
  function set(id, v) { if (HC[id] !== v) { HC[id] = v; $(id).textContent = v; } }
  M.hud = function () {
    var w = W, me = w.me, kmh = Math.round(Math.abs(me.u) * 3.6);
    set("hSpd", String(kmh)); set("hGear", me.u < -0.5 ? "R" : String(me.gear));
    $("hRpm").style.width = Math.round(me.rpm * 100) + "%"; $("hNitro").style.width = Math.round(me.nitro * 100) + "%";
    set("cLim", w.lim ? String(w.lim) : ""); $("cLim").hidden = !w.lim; $("cLim").classList.toggle("over", !!w.lim && kmh > w.lim + 9);
    drawMini();
    if (w.mis) hudMis();
  };
  // the small map: the whole city drawn once, then turned with the car each frame
  function mapCanvas(C) {
    var sc = 0.5, N = Math.ceil(C.N * sc), cv = document.createElement("canvas"); cv.width = cv.height = N;
    var x = cv.getContext("2d"), L = C.L, P = function (X, Z) { return [(X + L) * sc, (Z + L) * sc]; };
    x.fillStyle = "#E9E4D8"; x.fillRect(0, 0, N, N);
    // water and parks from the grid (coarse)
    var G2 = C.G, img = x.getImageData(0, 0, N, N), d = img.data;
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var g = G2[Math.floor(j / sc) * C.N + Math.floor(i / sc)], o = (j * N + i) * 4; if (g === 4) { d[o] = 120; d[o + 1] = 180; d[o + 2] = 225; } else if (g === 5) { d[o] = 182; d[o + 1] = 214; d[o + 2] = 160; } else if (g === 2) { d[o] = 214; d[o + 1] = 206; d[o + 2] = 192; } }
    x.putImageData(img, 0, 0);
    [[7, "#FFFFFF", 2.2], [6, "#FFFFFF", 2.6], [5, "#FFFFFF", 3.4], [4, "#FFF4C9", 4.2], [3, "#FFE58A", 5], [2, "#FFD75E", 5.6], [1, "#F7B267", 6.4]].forEach(function (L2) {
      x.strokeStyle = "#B9B1A2"; x.lineWidth = L2[2] + 1.4; x.lineCap = x.lineJoin = "round";
      C.roads.forEach(function (r) { if (r.t !== L2[0]) return; x.beginPath(); r.v.forEach(function (v, k) { var p = P(C.VX[v], C.VZ[v]); if (k) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); x.stroke(); });
      x.strokeStyle = L2[1]; x.lineWidth = L2[2];
      C.roads.forEach(function (r) { if (r.t !== L2[0]) return; x.beginPath(); r.v.forEach(function (v, k) { var p = P(C.VX[v], C.VZ[v]); if (k) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); x.stroke(); });
    });
    return { cv: cv, sc: sc };
  }
  function drawMini() {
    var w = W, cv = $("cMap"), x = cv.getContext("2d"), S2 = cv.width, me = w.me, mc = w.mapC, z = 2.4; // canvas px per map px
    x.save(); x.clearRect(0, 0, S2, S2); x.beginPath(); x.arc(S2 / 2, S2 / 2, S2 / 2 - 2, 0, 7); x.clip();
    x.translate(S2 / 2, S2 * 0.62); x.rotate(Math.PI + me.h); x.scale(-z, z); // map north is -z; the car points up
    x.drawImage(mc.cv, -(me.x + w.C.L) * mc.sc, -(me.z + w.C.L) * mc.sc);
    var P = function (X, Z) { return [(X - me.x) * mc.sc, (Z - me.z) * mc.sc]; };
    if (w.route && w.route.pts.length) { x.strokeStyle = "rgba(25,113,194,.9)"; x.lineWidth = 4 / z * 1.6; x.lineCap = x.lineJoin = "round"; x.beginPath(); w.route.pts.forEach(function (p, k) { var q = P(p[0], p[1]); if (k) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); }); x.stroke(); }
    if (w.tgt) { var q = P(w.tgt.x, w.tgt.z); x.fillStyle = "#F59F00"; x.beginPath(); x.arc(q[0], q[1], 5 / z * 1.4, 0, 7); x.fill(); x.strokeStyle = "#fff"; x.lineWidth = 1.2 / z * 1.6; x.stroke(); }
    w.stars.list.forEach(function (s) { if (s.got) return; var q2 = P(s.x, s.z); if (Math.abs(q2[0]) > 80 || Math.abs(q2[1]) > 80) return; x.fillStyle = "#FFD43B"; x.font = (9 / z * 1.4) + "px sans-serif"; x.save(); x.translate(q2[0], q2[1]); x.scale(-1, 1); x.rotate(-(Math.PI + me.h)); x.fillText("★", -3, 3); x.restore(); });
    x.fillStyle = "rgba(255,107,107,.9)"; w.live.cars.forEach(function (c) { var q3 = P(c.x, c.z); x.fillRect(q3[0] - 1, q3[1] - 1, 2, 2); });
    x.restore();
    // the car
    x.fillStyle = "#1971C2"; x.strokeStyle = "#fff"; x.lineWidth = 2; x.beginPath(); x.moveTo(S2 / 2, S2 * 0.62 - 9); x.lineTo(S2 / 2 + 7, S2 * 0.62 + 7); x.lineTo(S2 / 2, S2 * 0.62 + 3); x.lineTo(S2 / 2 - 7, S2 * 0.62 + 7); x.closePath(); x.fill(); x.stroke();
    // north
    var nA = Math.PI + me.h; x.save(); x.translate(S2 / 2 + Math.sin(-nA) * (S2 / 2 - 14) * -1, S2 / 2 - Math.cos(nA) * (S2 / 2 - 14) * -1); x.fillStyle = "#C92A2A"; x.font = "bold 14px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("צ", 0, 0); x.restore();
    if (w.route && w.route.left != null) { set("cDist", w.route.left > 950 ? (w.route.left / 1000).toFixed(1) + " ק״מ" : Math.round(w.route.left / 10) * 10 + " מ׳"); $("cDist").hidden = false; } else $("cDist").hidden = true;
  }
  // ---------- the GPS ----------
  function routeTo(x, z) {
    var w = W, C = w.C, me = w.me, nt = C.near(x, z, 80); if (!nt) return null;
    var r = C.roads[nt.road], toV = nt.t < 0.5 ? r.v[nt.k] : r.v[nt.k + 1];
    var nm = C.near(me.x, me.z, 60); if (!nm) return null;
    var rm = C.roads[nm.road], a = rm.v[nm.k], b = rm.v[nm.k + 1], from = [];
    C.OUT[a].forEach(function (e) { if (C.E.b[e] === b) from.push(e); }); C.OUT[b].forEach(function (e) { if (C.E.b[e] === a) from.push(e); });
    var fx = Math.sin(me.h), fz = Math.cos(me.h);
    from.sort(function (p, q) { return (C.E.dx[q] * fx + C.E.dz[q] * fz) - (C.E.dx[p] * fx + C.E.dz[p] * fz); });
    var path = cityRoute(C, from.slice(0, 2), toV); if (!path) return null;
    var pts = [[me.x, me.z]]; path.forEach(function (e) { pts.push([C.VX[C.E.b[e]], C.VZ[C.E.b[e]]]); }); pts.push([x, z]);
    return { pts: pts, edges: path, x: x, z: z };
  }
  function setTarget(x, z, label) {
    var w = W; w.tgt = { x: x, z: z, label: label }; w.route = routeTo(x, z); w.routeT = w.t;
    w.beam.position.set(x, 30, z); w.beam.visible = true; w.ring.position.set(x, 0.2, z); w.ring.visible = true; guide();
  }
  function clearTarget() { var w = W; w.tgt = null; w.route = null; w.beam.visible = w.ring.visible = false; w.guide.geometry.dispose(); w.guide.geometry = new THREE.BufferGeometry(); $("cDist").hidden = true; }
  // a blue line on the road for the next stretch of the way
  function guide() {
    var w = W, rt = w.route; if (!rt) return;
    var me = w.me, pts = rt.pts, k0 = 0, bd = 1e18;
    for (var k = 0; k + 1 < pts.length; k++) { var d = Math.hypot(pts[k][0] - me.x, pts[k][1] - me.z); if (d < bd) { bd = d; k0 = k; } }
    var P = [[me.x, me.z]], len = 0, left = 0;
    for (k = k0 + 1; k < pts.length; k++) { var l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); left += k === k0 + 1 ? Math.hypot(pts[k][0] - me.x, pts[k][1] - me.z) : l; if (len < 160) { P.push(pts[k]); len += l; } }
    rt.left = left;
    if (P.length < 2) return;
    var b = cbBatch(); cbStrip(b.get(0, 0), P, -0.9, 0.9, 0.25, 4);
    var t = b.tiles[Object.keys(b.tiles)[0]], g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(t.p, 3));
    w.guide.geometry.dispose(); w.guide.geometry = g;
    if (bd > 30 && w.t - w.routeT > 2) { w.route = routeTo(w.tgt.x, w.tgt.z); w.routeT = w.t; } // off the way: plan again
  }
  // ---------- hidden stars: 15 in each city, on the streets ----------
  function makeStars(C, scene, id) {
    var rnd = cbRand(C.nv * 3 + id.length), list = [], got = (S.city[id] && S.city[id].got) || [];
    var tries = 0;
    while (list.length < STAR_N && tries++ < 4000) {
      var r = C.roads[Math.floor(rnd() * C.roads.length)]; if (!r || r.t > 6) continue;
      var k = Math.floor(rnd() * r.v.length), x = C.VX[r.v[k]], z = C.VZ[r.v[k]];
      if (Math.hypot(x, z) > C.R) continue; if (list.some(function (s) { return Math.hypot(s.x - x, s.z - z) < C.R / 4; })) continue;
      list.push({ x: x, z: z, got: got.indexOf(list.length) >= 0 });
    }
    var sh = new THREE.Shape(); for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? 0.55 : 1.3; if (i) sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    var geo = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false }), mat = new THREE.MeshBasicMaterial({ color: 0xFFD43B, fog: false });
    list.forEach(function (s) { if (s.got) return; s.m = new THREE.Mesh(geo, mat); s.m.position.set(s.x, 2, s.z); scene.add(s.m); });
    return { list: list, step: function (dt, me, t, cb) { list.forEach(function (s, i2) { if (s.got || !s.m) return; s.m.rotation.y = t * 2; s.m.position.y = 2 + Math.sin(t * 3 + i2) * 0.3; if (Math.hypot(s.x - me.x, s.z - me.z) < 3.5) { s.got = true; W.scene.remove(s.m); cb(i2); } }); } };
  }
  var STAR_N = 15;
  function got(i) {
    var c = S.city[W.id] = S.city[W.id] || { got: [], best: {} }; if (c.got.indexOf(i) < 0) c.got.push(i);
    S.bonus = (S.bonus || 0) + 1; A.save();
    sndBeep(988, 0.12); setTimeout(function () { sndBeep(1319, 0.2); }, 120);
    flash("⭐ מצאת כוכב! " + c.got.length + "/" + STAR_N + " ב" + W.C.name, 2.2);
  }
  // ---------- missions ----------
  var MIS = [
    ["delivery", "🍕 משלוח", "אוספים הזמנה ומביאים אותה בזמן"], ["taxi", "🚕 מונית", "אוספים נוסע ומורידים אותו ביעד"],
    ["ambulance", "🚑 אמבולנס", "מגיעים מהר למי שצריך עזרה ומביאים לבית החולים"], ["fire", "🚒 כבאית", "שריפה בבניין! מגיעים ומכבים"],
    ["race", "🏁 מרוץ רחוב", "עוברים בכל נקודות הביקורת בזמן"], ["goto", "📍 נסיעה לרחוב", "בוחרים רחוב והניווט לוקח אתכם"]
  ];
  M.panel = function () {
    if (!W) return; var p = $("cPanel"), list = $("cpList"); p.hidden = false; W.paused = 1;
    list.replaceChildren();
    if (W.mis) { var b0 = el("button", "trk"); b0.append(el("b", "", "✖ לבטל את המשימה")); b0.onclick = function () { endMis(0); closePanel(); }; list.append(b0); }
    MIS.forEach(function (m) {
      var best = S.city[W.id] && S.city[W.id].best && S.city[W.id].best[m[0]];
      var b = el("button", "trk"); b.append(el("b", "", m[1]), el("small", "", m[2] + (best ? " · " + "⭐".repeat(best) : ""))); b.onclick = function () { closePanel(); if (m[0] === "goto") streets(); else newMis(m[0]); }; list.append(b);
    });
    $("cpStars").textContent = "⭐ " + ((S.city[W.id] && S.city[W.id].got || []).length) + "/" + STAR_N + " כוכבים נסתרים ב" + W.C.name;
  };
  function closePanel() { $("cPanel").hidden = true; $("cStreets").hidden = true; if (W) W.paused = 0; }
  $("cpClose").onclick = closePanel;
  // choosing a street to drive to: all the city's named streets, with a search box
  function streets() {
    var C = W.C, box = $("cStreets"), q = $("csQ"), out = $("csList"), names = {};
    C.roads.forEach(function (r) { if (r.name && r.t <= 6) (names[r.name] = names[r.name] || []).push(r); });
    var all = Object.keys(names).sort(function (a, b) { return a.localeCompare(b, "he"); });
    var draw = function () { var f = q.value.trim(); out.replaceChildren.apply(out, all.filter(function (n) { return !f || n.indexOf(f) >= 0; }).slice(0, 80).map(function (n) { var b = el("button", "chip", n); b.onclick = function () { var rs = names[n], r = rs[Math.floor(rs.length / 2)], v = r.v[Math.floor(r.v.length / 2)]; box.hidden = true; W.paused = 0; startGoto(C.VX[v], C.VZ[v], n); }; return b; })); };
    q.value = ""; q.oninput = draw; draw(); box.hidden = false; W.paused = 1; setTimeout(function () { q.focus(); }, 50);
  }
  $("csClose").onclick = closePanel;
  function startGoto(x, z, name) { W.mis = { kind: "goto", stage: 0, t0: W.t, label: "📍 לרחוב " + name, steps: [{ x: x, z: z, say: "הגעת לרחוב " + name + " 🎉" }] }; setTarget(x, z, name); flash("📍 נוסעים לרחוב " + name, 2); hudMis(); }
  // a random spot on a street, 'min'–'max' metres from a point
  function spot(x0, z0, min, max, filt) {
    var C = W.C;
    for (var i = 0; i < 400; i++) {
      var r = C.roads[Math.floor(Math.random() * C.roads.length)]; if (r.t < 2 || r.t > 6 || (filt && !filt(r))) continue;
      var k = Math.floor(Math.random() * (r.v.length - 1)), x = (C.VX[r.v[k]] + C.VX[r.v[k + 1]]) / 2, z = (C.VZ[r.v[k]] + C.VZ[r.v[k + 1]]) / 2, d = Math.hypot(x - x0, z - z0);
      if (d >= min && d <= max && Math.abs(x) < C.L - 30 && Math.abs(z) < C.L - 30) return { x: x, z: z, name: r.name };
    }
    return null;
  }
  function streetOf(x, z) { var n = W.C.near(x, z, 40); return n ? W.C.roads[n.road].name : ""; }
  function placeName(kinds, fallback) {
    var C = W.C, me = W.me, list = C.poi.filter(function (p) { return kinds.indexOf(p.k) >= 0 && Math.hypot(p.x - me.x, p.z - me.z) > 250 && Math.hypot(p.x - me.x, p.z - me.z) < 1100; });
    if (!list.length) return null; var p = list[Math.floor(Math.random() * list.length)], nr = C.near(p.x, p.z, 60); if (!nr) return null;
    return { x: nr.x, z: nr.z, name: p.name, street: C.roads[nr.road].name };
  }
  var FARES = ["תודה! לאן? 🙂", "שלום, אני ממהר לפגישה!", "אפשר לנסוע לאט? יש לי עוגה ביד 🎂", "יאללה, אני מאחר להצגה!", "תודה שעצרת!"];
  function newMis(kind) {
    var me = W.me, C = W.C, m = { kind: kind, stage: 0, t0: W.t, steps: [] };
    var nm = function (p) { return p && p.name ? p.name : ""; }, st = function (p) { return p && (p.street || p.name) ? "ברחוב " + (p.street || p.name) : ""; };
    if (kind === "delivery") {
      var pick = placeName(["c"]) || spot(me.x, me.z, 150, 500), drop = pick && spot(pick.x, pick.z, 350, 1000);
      if (!pick || !drop) return flash("לא מצאנו כתובת, נסו שוב", 1.5);
      m.label = "🍕 משלוח"; m.steps = [{ x: pick.x, z: pick.z, say: "📦 ההזמנה אצלך! עכשיו ל" + (drop.name ? "רחוב " + drop.name : "כתובת"), what: "לאסוף מבית קפה " + st(pick) }, { x: drop.x, z: drop.z, say: "🍕 נמסר! הלקוח מרוצה", what: "למסור " + (drop.name ? "ברחוב " + drop.name : "בכתובת") }];
    } else if (kind === "taxi") {
      var a = spot(me.x, me.z, 120, 450), b = a && spot(a.x, a.z, 400, 1100);
      if (!a || !b) return flash("לא מצאנו נוסע, נסו שוב", 1.5);
      m.label = "🚕 מונית"; m.steps = [{ x: a.x, z: a.z, say: FARES[Math.floor(Math.random() * FARES.length)] + " לרחוב " + (b.name || "הבא"), what: "לאסוף נוסע " + st(a) }, { x: b.x, z: b.z, say: "🚕 הנוסע הגיע. נסיעה טובה!", what: "להוריד " + st(b) }];
      m.fare = Math.round(12 + Math.hypot(b.x - a.x, b.z - a.z) / 1000 * 7);
    } else if (kind === "ambulance") {
      var pt = spot(me.x, me.z, 250, 700), h = placeName(["h"]) || (pt && spot(pt.x, pt.z, 500, 1200));
      if (!pt || !h) return flash("נסו שוב", 1.5);
      m.label = "🚑 אמבולנס"; m.car = "ambulance"; m.steps = [{ x: pt.x, z: pt.z, say: "🩹 החולה עלה. מהר, לבית החולים!", what: "להגיע למי שצריך עזרה " + st(pt) }, { x: h.x, z: h.z, say: "🏥 הגעתם בזמן. כל הכבוד!", what: "לבית החולים" + (h.name ? " " + h.name : "") }];
    } else if (kind === "fire") {
      var bl = null; for (var i = 0; i < 300 && !bl; i++) { var b2 = C.bld[Math.floor(Math.random() * C.bld.length)]; if (!b2) break; var cx = 0, cz = 0, n = b2.p.length / 2; for (var k = 0; k < n; k++) { cx += b2.p[2 * k]; cz += b2.p[2 * k + 1]; } cx /= n; cz /= n; var dd = Math.hypot(cx - me.x, cz - me.z); var nr = C.near(cx, cz, 30); if (dd > (i < 200 ? 300 : 120) && dd < (i < 200 ? 900 : 1600) && nr) bl = { x: nr.x, z: nr.z, bx: cx, bz: cz, h: b2.h || 10 }; }
      if (!bl) return flash("נסו שוב", 1.5);
      m.label = "🚒 כבאית"; m.car = "firetruck"; m.steps = [{ x: bl.x, z: bl.z, say: "", what: "שריפה " + st({ street: streetOf(bl.x, bl.z) }) + "! מהר!", fire: bl }];
      W.fire = makeFire(W.scene, bl.bx, bl.bz, bl.h);
    } else if (kind === "race") {
      var end = spot(me.x, me.z, 900, 1600), rt = end && routeTo(end.x, end.z);
      if (!rt) return flash("נסו שוב", 1.5);
      var cps = [], acc = 0; for (var q = 1; q < rt.pts.length; q++) { acc += Math.hypot(rt.pts[q][0] - rt.pts[q - 1][0], rt.pts[q][1] - rt.pts[q - 1][1]); if (acc > 220) { cps.push({ x: rt.pts[q][0], z: rt.pts[q][1], what: "נקודת ביקורת", pass: 1 }); acc = 0; } }
      cps.push({ x: end.x, z: end.z, what: "קו הסיום", pass: 1, say: "🏁 סיימת!" });
      m.label = "🏁 מרוץ רחוב"; m.steps = cps; m.race = 1;
    }
    // the time: by the length of the way at a good city speed
    var len = 0, px = me.x, pz = me.z; m.steps.forEach(function (s) { len += Math.hypot(s.x - px, s.z - pz) * 1.35; px = s.x; pz = s.z; });
    m.limit = Math.round(len / (kind === "race" ? 13 : kind === "ambulance" || kind === "fire" ? 11 : 9) + 15);
    W.mis = m;
    var go = function () { m.t0 = W.t; setTarget(m.steps[0].x, m.steps[0].z, m.steps[0].what); flash(m.label + ": " + m.steps[0].what, 2.6); hudMis(); };
    if (m.car && W.me.spec.id !== m.car) swapCar(m.car, go); else go();
    if (m.car) W.me.siren = true;
  }
  function swapCar(id, then) {
    var spec = CAR_BY[id]; loadModel(id).then(function (model) {
      var me = W.me; W.scene.remove(W.V.root); W.V = carMesh(spec, model); W.scene.add(W.V.root);
      me.spec = spec; me.vmax = spec.top / 3.6; me.A0 = 27.78 / spec.acc * 1.32; me.m = spec.m; me.I = spec.m * 1.6; me.u = me.v = me.r = 0;
      then();
    });
  }
  function misStep(dt) {
    var w = W, m = w.mis; if (!m) return;
    if (w.route && Math.floor(w.t * 2) !== Math.floor((w.t - dt) * 2)) guide();
    var s = m.steps[m.stage], me = w.me, d = Math.hypot(s.x - me.x, s.z - me.z), sp = Math.abs(me.u);
    if (s.fire) {
      if (d < 30 && sp < 3) { m.spray = (m.spray || 0) + dt; $("cbWater").hidden = false; w.fire.douse(m.spray / 5); if (m.spray > 5) { w.fire.out(); w.fire = null; s.say = "💦 השריפה כובתה! גיבורים"; next(); } }
      else $("cbWater").hidden = true;
      return;
    }
    var ok = s.pass ? d < 9 : d < 7 && sp < 2.5;
    if (!ok && !s.pass && d < 7 && w.t - (w.said.stop || -9) > 3) { w.said.stop = w.t; flash("✋ עוצרים כדי ש" + (m.kind === "taxi" ? "הנוסע יעלה" : "יוכלו להעמיס"), 1.2); }
    if (ok) next();
  }
  function next() {
    var w = W, m = w.mis, s = m.steps[m.stage];
    if (s.say) flash(s.say, 2.2); sndBeep(784, 0.12); setTimeout(function () { sndBeep(1047, 0.18); }, 110);
    m.stage++;
    if (m.stage >= m.steps.length) return endMis(1);
    var n = m.steps[m.stage]; setTarget(n.x, n.z, n.what);
    if (m.kind === "taxi" && m.stage === 1) m.pick = w.t;
  }
  function endMis(ok) {
    var w = W, m = w.mis; if (!m) return; w.mis = null; clearTarget(); $("cbWater").hidden = true; $("cMis").hidden = true; w.me.siren = false;
    if (m.car && w.me.spec.id !== S.car) setTimeout(function () { if (W && !W.mis) swapCar(S.car, function () {}); }, ok ? 2500 : 0); // back to your own car
    if (w.fire) { w.fire.out(); w.fire = null; }
    if (!ok || m.kind === "goto") { if (ok) flash(m.steps[m.steps.length - 1].say, 2.5); return; }
    var used = w.t - m.t0, st = used <= m.limit * 0.75 ? 3 : used <= m.limit ? 2 : 1;
    var c = S.city[w.id] = S.city[w.id] || { got: [], best: {} }; c.best = c.best || {};
    var gain = Math.max(0, st - (c.best[m.kind] || 0)); c.best[m.kind] = Math.max(c.best[m.kind] || 0, st); S.bonus = (S.bonus || 0) + gain; A.save();
    var t = Math.floor(used / 60) + ":" + String(Math.floor(used % 60)).padStart(2, "0");
    setTimeout(function () { flash(m.label + " הושלם! " + "⭐".repeat(st) + " · " + t + (m.fare ? " · ₪" + m.fare : "") + (gain ? " · +" + gain + " כוכבים" : ""), 4); }, 1600);
  }
  function hudMis() {
    var w = W, box = $("cMis"); if (!w || !w.mis) { box.hidden = true; return; }
    var m = w.mis, s = m.steps[m.stage], left = m.limit ? Math.max(0, m.limit - (w.t - m.t0)) : null;
    set("cMisT", m.label + (m.race ? " · " + (m.stage) + "/" + m.steps.length : ""));
    set("cMisW", s ? s.what || "" : "");
    set("cMisC", left == null ? "" : "⏱ " + Math.floor(left / 60) + ":" + String(Math.floor(left % 60)).padStart(2, "0"));
    $("cMisC").classList.toggle("late", left === 0); box.hidden = false;
  }
  // ---------- fire and smoke ----------
  function makeFire(scene, x, z, h) {
    var g = new THREE.Group(), fl = [], sm = [], top = Math.max(4, h) + 0.5;
    for (var i = 0; i < 10; i++) { var s = sprite(i % 2 ? 0xFF7A1A : 0xFFB020, 5 + Math.random() * 4); s.position.set(x + (Math.random() - 0.5) * 8, top - 2 + Math.random() * 3, z + (Math.random() - 0.5) * 8); g.add(s); fl.push(s); }
    var smM = new THREE.SpriteMaterial({ map: glowTex(), color: 0x444444, transparent: true, opacity: 0.5, depthWrite: false });
    for (i = 0; i < 14; i++) { var p = new THREE.Sprite(smM.clone()); p.position.set(x, top + i * 3, z); p.scale.setScalar(6 + i); p.userData.y0 = i * 3; g.add(p); sm.push(p); }
    var light = new THREE.PointLight(0xFF7A1A, 2.5, 60); light.position.set(x, top + 2, z); g.add(light);
    scene.add(g); var k = 1;
    return { step: function (dt, t) { fl.forEach(function (s, i2) { var f = (0.8 + Math.sin(t * 9 + i2) * 0.25) * k; s.scale.setScalar((5 + i2 % 4) * f); s.material.opacity = k; }); sm.forEach(function (p) { p.userData.y0 = (p.userData.y0 + dt * 4) % 42; p.position.y = top + p.userData.y0; p.material.opacity = 0.5 * (1 - p.userData.y0 / 42) * (0.3 + 0.7 * k); }); light.intensity = 2.5 * k; },
      douse: function (f) { k = Math.max(0, 1 - f); }, out: function () { scene.remove(g); } };
  }
  // ---------- rain ----------
  function makeRain(scene) {
    var n = G.hi ? 2400 : 1100, pos = new Float32Array(n * 6);
    for (var i = 0; i < n; i++) { var x = (Math.random() - 0.5) * 80, y = Math.random() * 30, z = (Math.random() - 0.5) * 80; pos.set([x, y, z, x + 0.05, y - 0.7, z], i * 6); }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var ln = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xBFD3E6, transparent: true, opacity: 0.45 })); ln.frustumCulled = false; scene.add(ln);
    return function (c, dt) {
      for (var i2 = 0; i2 < n; i2++) { var o = i2 * 6; pos[o + 1] -= 26 * dt; pos[o + 4] -= 26 * dt; if (pos[o + 1] < 0) { var y2 = 25 + Math.random() * 5; pos[o + 1] = y2; pos[o + 4] = y2 - 0.7; } }
      g.attributes.position.needsUpdate = true; ln.position.set(c.x, 0, c.z);
    };
  }
  // ---------- the radio: three stations of original music, made on the phone ----------
  var RADIO = [["📻 גלי חניה · פופ", 112, [0, 2, 4, 7, 9], [[0, 4, 7], [9, 0, 4], [5, 9, 0], [7, 11, 2]]], ["📻 רדיו ים תיכון", 96, [0, 1, 4, 5, 7, 8, 10], [[0, 4, 7], [1, 5, 8], [0, 4, 7], [10, 2, 5]]], ["📻 לילה בעיר · לו־פיי", 78, [0, 3, 5, 7, 10], [[0, 3, 7, 10], [5, 8, 0, 3], [3, 7, 10, 2], [8, 0, 3, 7]]]];
  var RS = { st: 0, timer: 0, g: null, step: 0, next: 0 };
  function radio(k, quiet) {
    if (RS.timer) { clearInterval(RS.timer); RS.timer = 0; } if (RS.g) { try { RS.g.gain.setTargetAtTime(0, SND.ctx.currentTime, 0.1); } catch (e) {} RS.g = null; }
    RS.st = k; $("cbRadio").classList.toggle("on", !!k); if (!k) { if (!quiet) flash("📻 הרדיו כבוי", 1); return; }
    if (!SND.ctx) sndInit(); if (!SND.ctx) return;
    var a = SND.ctx, st = RADIO[k - 1], g = a.createGain(); g.gain.value = 0.32; g.connect(SND.master); RS.g = g; RS.step = 0; RS.next = a.currentTime + 0.1;
    var rnd = cbRand(k * 101), mel = []; for (var i = 0; i < 16; i++) mel.push(rnd() < 0.62 ? st[2][Math.floor(rnd() * st[2].length)] + (rnd() < 0.3 ? 12 : 0) : null);
    var beat = 60 / st[1] / 4, base = k === 2 ? 50 : 48, hz = function (n) { return 440 * Math.pow(2, (n - 69) / 12); };
    function note(f, t0, len, type, vol, cut) { var o = a.createOscillator(), e = a.createGain(), fl = a.createBiquadFilter(); o.type = type; o.frequency.value = f; fl.type = "lowpass"; fl.frequency.value = cut || 2400; e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(vol, t0 + 0.012); e.gain.exponentialRampToValueAtTime(0.0008, t0 + len); o.connect(fl); fl.connect(e); e.connect(g); o.start(t0); o.stop(t0 + len + 0.05); }
    function noise(t0, len, vol, f, hp) { var s = a.createBufferSource(), fl = a.createBiquadFilter(), e = a.createGain(); s.buffer = SND.noise; fl.type = hp ? "highpass" : "bandpass"; fl.frequency.value = f; e.gain.setValueAtTime(vol, t0); e.gain.exponentialRampToValueAtTime(0.0008, t0 + len); s.connect(fl); fl.connect(e); e.connect(g); s.start(t0); s.stop(t0 + len + 0.02); }
    function kick(t0) { var o = a.createOscillator(), e = a.createGain(); o.frequency.setValueAtTime(130, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + 0.18); e.gain.setValueAtTime(0.5, t0); e.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3); o.connect(e); e.connect(g); o.start(t0); o.stop(t0 + 0.32); }
    RS.timer = setInterval(function () {
      while (RS.next < a.currentTime + 0.25) {
        var s = RS.step, t0 = RS.next, bar = Math.floor(s / 16) % 4, ch = st[3][bar], q = s % 16;
        if (q % 4 === 0 && (k !== 3 || q % 8 === 0)) kick(t0);
        if (q === 4 || q === 12) noise(t0, k === 3 ? 0.25 : 0.14, k === 3 ? 0.12 : 0.18, 1800);
        if (q % 2 === 0) noise(t0, 0.04, k === 3 ? 0.03 : 0.05, 7000, 1);
        if (k === 2 && (q === 3 || q === 7 || q === 11)) noise(t0, 0.06, 0.08, 900); // a darbuka-like tak
        if (q === 0 || q === 8) ch.forEach(function (n) { note(hz(base + 12 + n), t0, beat * 7.5, k === 3 ? "sine" : "triangle", 0.045, 1600); });
        if (q % 4 === 0 || (k === 1 && q % 4 === 3)) note(hz(base - 12 + ch[0]), t0, beat * 2.5, "sawtooth", 0.11, 380);
        var m = mel[q]; if (m != null && (bar < 3 || q < 12)) note(hz(base + 24 + m + (bar === 2 ? 2 : 0)), t0, beat * (k === 3 ? 3 : 1.6), k === 2 ? "sawtooth" : "square", k === 3 ? 0.03 : 0.035, k === 2 ? 1800 : 2600);
        RS.step++; RS.next += beat;
      }
    }, 60);
    flash(st[0], 1.6);
  }
  M.radio = function () { radio((RS.st + 1) % (RADIO.length + 1)); };
  // ---------- the big map: tap anywhere to drive there ----------
  M.bigMap = function () {
    if (!W) return; var box = $("cMapBig"), cv = $("cBig"), x = cv.getContext("2d"), mc = W.mapC, C = W.C;
    box.hidden = false; W.paused = 1;
    var S2 = Math.min(innerWidth - 24, innerHeight - 110, 900); cv.width = cv.height = S2;
    var k = S2 / mc.cv.width; x.drawImage(mc.cv, 0, 0, S2, S2);
    var P = function (X, Z) { return [(X + C.L) * mc.sc * k, (Z + C.L) * mc.sc * k]; };
    if (W.route) { x.strokeStyle = "rgba(25,113,194,.9)"; x.lineWidth = 4; x.beginPath(); W.route.pts.forEach(function (p, i) { var q = P(p[0], p[1]); if (i) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); }); x.stroke(); }
    W.stars.list.forEach(function (s) { if (s.got) return; var q = P(s.x, s.z); x.fillStyle = "#F59F00"; x.font = "16px sans-serif"; x.fillText("★", q[0] - 6, q[1] + 6); });
    var me = P(W.me.x, W.me.z); x.fillStyle = "#1971C2"; x.beginPath(); x.arc(me[0], me[1], 7, 0, 7); x.fill(); x.strokeStyle = "#fff"; x.lineWidth = 2; x.stroke();
    cv.onclick = function (e) { var r = cv.getBoundingClientRect(), X = (e.clientX - r.left) / r.width * S2 / k / mc.sc - C.L, Z = (e.clientY - r.top) / r.height * S2 / k / mc.sc - C.L, n = C.near(X, Z, 80); if (!n) return; box.hidden = true; W.paused = 0; startGoto(n.x, n.z, C.roads[n.road].name || "הנקודה שבחרת"); };
  };
  $("cmClose").onclick = function () { $("cMapBig").hidden = true; if (W) W.paused = 0; };
  $("cbMis").onclick = function () { M.panel(); };
  $("cbRadio").onclick = function () { M.radio(); };
  $("cbMap").onclick = function () { M.bigMap(); };
  $("cbHorn").onclick = function () { sndBeep(415, 0.35, 0.12); };
  $("cyBack").onclick = function () { A.menu(); };
  $("cyCar").onclick = function () { A.garage(); };
  $("cyGo").onclick = function () { sndInit(); M.start(); };
  M.key = function (code) {
    if (code === "KeyM") { if ($("cMapBig").hidden) M.bigMap(); else $("cmClose").onclick(); }
    if (code === "KeyB") M.radio();
    if (code === "KeyJ") M.panel();
    if (code === "KeyH" && W && W.me.spec.siren) W.me.siren = !W.me.siren;
  };
  M.frame = function (dt, acc) {
    if (!W) return acc;
    if (!W.paused) { acc += dt; var n = 0; while (acc >= 1 / 60 && n < 4) { M.step(1 / 60); acc -= 1 / 60; n++; } if (n === 4) acc = 0; }
    M.render(dt); M.hud(); return acc;
  };
  M.pause = function (on) { if (!W) return; W.paused = on ? 1 : 0; };
  Object.defineProperty(M, "W", { get: function () { return W; } });
  return M;
}
