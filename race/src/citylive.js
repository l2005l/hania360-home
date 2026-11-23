// The living city: traffic lights that change, cars that drive on the right along the real streets (they keep their
// distance, stop at red lights, for people on the crossing and for you), and people who walk on the pavements, cross
// at the zebra crossings and step aside when a car comes too close. Nobody gets hurt in this city.
// a car on the hills: up off the ground by its height there, nose up or down and leaning with the slope
function cityTilt(C, V, x, z, h) {
  var r = V.root; r.rotation.order = "YXZ";
  var fx = Math.sin(h), fz = Math.cos(h), lx = Math.cos(h), lz = -Math.sin(h);
  var hf = C.hAt(x + fx * 1.6, z + fz * 1.6), hb = C.hAt(x - fx * 1.6, z - fz * 1.6), hl = C.hAt(x + lx, z + lz), hr = C.hAt(x - lx, z - lz);
  r.position.y = (hf + hb + hl + hr) / 4; r.rotation.x = -Math.atan2(hf - hb, 3.2); r.rotation.z = Math.atan2(hl - hr, 2);
}
var LIGHT_CYCLE = 26; // s: 11 green, 2 yellow, 0 both red… for each of the two directions
function lightState(C, v, axis, t) { // 0 green, 1 yellow, 2 red
  var ph = (t + (v * 7.31) % LIGHT_CYCLE) % LIGHT_CYCLE, a = ph < 13 ? 0 : 1, q = ph % 13;
  if (a !== axis) return 2;
  return q < 10.5 ? 0 : q < 12.5 ? 1 : 2;
}
function cityLive(C, scene, W) {
  var L = { cars: [], peds: [], t: 0 }, E = C.E, VX = C.VX, VZ = C.VZ;
  // ---- traffic lights: colour the lamps every quarter second ----
  var lcol = [new THREE.Color(0xFF2B2B), new THREE.Color(0xFFB020), new THREE.Color(0x2BE36B)], dim = new THREE.Color(0x2A2A2A);
  L.lights = function (t) {
    if (!C.lampMesh) return;
    C.lights.forEach(function (lt, i) {
      var s = lightState(C, lt.v, lt.axis, t);
      C.lampMesh[0].setColorAt(i, s === 2 ? lcol[0] : dim); C.lampMesh[1].setColorAt(i, s === 1 ? lcol[1] : dim); C.lampMesh[2].setColorAt(i, s === 0 ? lcol[2] : dim);
    });
    C.lampMesh.forEach(function (m) { if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  };
  L.lights(0);
  // can a car on edge e go through its end now?
  L.go = function (e, t) {
    var b = E.b[e]; if (!C.sigV[b]) return 2; // 2: no light here
    var axis = Math.abs(E.dx[e]) > Math.abs(E.dz[e]) ? 0 : 1; return lightState(C, b, axis, t) === 0 ? 1 : 0;
  };
  // ---- cars ----
  var KINDS = ["sedan", "taxi", "hatchback-sports", "suv", "van", "sedan", "taxi", "truck", "delivery", "sedan-sports", "suv-luxury", "police", "garbage-truck"];
  function lane(e) { var r = C.roads[E.road[e]]; return r.ow ? (r.w > 7 ? (Math.random() < 0.5 ? -1 : 1) * r.w / 5 : 0) : Math.min(r.w / 4, 2.2); }
  function placeOn(c) {
    var e = c.e, a = E.a[e], f = Math.min(1, c.s / E.len[e]), x = VX[a] + E.dx[e] * c.s, z = VZ[a] + E.dz[e] * c.s, o = c.lane;
    c.x = x - E.dz[e] * o; c.z = z + E.dx[e] * o; var h = Math.atan2(E.dx[e], E.dz[e]), dh = h - c.h; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI; c.h += dh * Math.min(1, 0.18 + f * 0.1);
  }
  function spawn(me, near) {
    for (var tries = 0; tries < 30; tries++) {
      var e = Math.floor(Math.random() * C.ne), r = C.roads[E.road[e]]; if (r.t > 6) continue;
      var a = E.a[e], d = Math.hypot(VX[a] - me.x, VZ[a] - me.z);
      if (d < (near ? 40 : 90) || d > 260) continue;
      var spec = CAR_BY[KINDS[Math.floor(Math.random() * KINDS.length)]];
      var c = { e: e, s: Math.random() * E.len[e], v: 6, spec: spec, lane: 0, h: Math.atan2(E.dx[e], E.dz[e]), x: 0, z: 0, u: 0, steer: 0, r: 0, wait: 0, honk: 0, m: spec.m };
      c.lane = lane(e); c.vmax = Math.min(r.vmax, 16.7) * (0.75 + Math.random() * 0.25); placeOn(c);
      if (C.at(c.x, c.z) === 2) continue;
      L.cars.push(c);
      loadModel(spec.id).then(function (m) { if (L.cars.indexOf(c) < 0 || c.V) return; c.V = carMesh(spec, m); scene.add(c.V.root); });
      return c;
    }
  }
  function nextEdge(e) {
    var b = E.b[e], outs = C.OUT[b].filter(function (f) { return E.b[f] !== E.a[e] && C.roads[E.road[f]].t <= 6; });
    if (!outs.length) return -1;
    // mostly straight on, sometimes a turn
    var w = outs.map(function (f) { var dot = E.dx[e] * E.dx[f] + E.dz[e] * E.dz[f]; return dot > 0.7 ? 3 : 1; }), sum = w.reduce(function (p, q) { return p + q; }, 0), r = Math.random() * sum;
    for (var i = 0; i < outs.length; i++) { r -= w[i]; if (r <= 0) return outs[i]; } return outs[0];
  }
  L.target = G.hi ? 30 : 14;
  L.stepCars = function (dt, me, t) {
    while (L.cars.length < L.target && Math.random() < 0.5) if (!spawn(me, L.cars.length < 4)) break;
    for (var i = L.cars.length - 1; i >= 0; i--) {
      var c = L.cars[i], e = c.e, d0 = Math.hypot(c.x - me.x, c.z - me.z);
      if (d0 > 330) { if (c.V) scene.remove(c.V.root); L.cars.splice(i, 1); continue; }
      var want = c.vmax, left = E.len[e] - c.s, fx = Math.sin(c.h), fz = Math.cos(c.h);
      // a red light at the end of this piece of road
      var go = L.go(e, t), r = C.roads[E.road[e]];
      if (go === 0) { var stopAt = left - (r.w * 0.6 + 3); if (stopAt < 30) want = Math.min(want, Math.max(0, stopAt) * 0.6); }
      // the car (or you) in front
      var gap = 1e9;
      L.cars.forEach(function (o) { if (o === c) return; var dx = o.x - c.x, dz = o.z - c.z, ah = dx * fx + dz * fz, sd = Math.abs(dx * fz - dz * fx); if (ah > 0 && ah < 30 && sd < 2.2) gap = Math.min(gap, ah); });
      var pdx = me.x - c.x, pdz = me.z - c.z, pah = pdx * fx + pdz * fz, psd = Math.abs(pdx * fz - pdz * fx); if (pah > 0 && pah < 30 && psd < 2.6) gap = Math.min(gap, pah);
      // people on a crossing just ahead
      L.peds.forEach(function (p) { if (!p.cross) return; var dx = p.x - c.x, dz = p.z - c.z, ah = dx * fx + dz * fz, sd = Math.abs(dx * fz - dz * fx); if (ah > 0 && ah < 16 && sd < 4) gap = Math.min(gap, ah); });
      if (gap < 1e9) want = Math.min(want, Math.max(0, (gap - 6) * 0.7));
      c.v += Math.max(-8 * dt, Math.min(2.6 * dt, want - c.v)); if (c.v < 0.05) { c.v = 0; c.wait += dt; } else c.wait = 0;
      c.braking = want < c.v - 0.5 || c.v < 0.5;
      // stuck behind you for long: a honk
      if (c.wait > 4 && pah > 0 && pah < 12 && psd < 2.6 && t - c.honk > 6) { c.honk = t; if (d0 < 40) W.honk(c); }
      c.s += c.v * dt;
      while (c.s > E.len[c.e]) {
        var ne = nextEdge(c.e); if (ne < 0) { c.s = E.len[c.e]; c.v = 0; if (c.wait > 3) { if (c.V) scene.remove(c.V.root); L.cars.splice(i, 1); c = null; } break; }
        c.s -= E.len[c.e]; c.e = ne; c.lane = lane(ne); c.vmax = Math.min(C.roads[E.road[ne]].vmax, 16.7) * (0.75 + Math.random() * 0.25);
      }
      if (!c) continue;
      placeOn(c); c.u = c.v;
      if (c.V) { syncCar(c.V, c, dt, W.night, t); cityTilt(C, c.V, c.x, c.z, c.h); }
    }
  };
  // you and the traffic: a soft knock (you bounce, they stop for a moment)
  L.knock = function (me) {
    var hit = 0;
    L.cars.forEach(function (c) {
      var dx = me.x - c.x, dz = me.z - c.z, d = Math.hypot(dx, dz), R2 = c.spec.m > 3000 ? 3.2 : 2.4;
      if (d < R2 && d > 1e-3) {
        var nx = dx / d, nz = dz / d, pen = R2 - d; me.x += nx * pen; me.z += nz * pen;
        var v = vel(me), vn = v[0] * nx + v[1] * nz;
        if (vn < 0) { setVel(me, (v[0] - nx * vn * 1.4) * 0.8, (v[1] - nz * vn * 1.4) * 0.8); hit = Math.max(hit, -vn); }
        c.v = 0; c.wait = 2;
      }
    });
    return hit;
  };
  // ---- people ----
  // people: a body, a head with hair, arms and legs that swing as they walk; grown-ups and children, all kinds of
  // clothes; some walk a dog; a few wait at the bus stops
  var g = function (w, h, d, y) { var b = new THREE.BoxGeometry(w, h, d); b.translate(0, y, 0); return b; };
  var torso = g(0.42, 0.62, 0.24, 1.18), head = new THREE.SphereGeometry(0.135, 10, 8); head.translate(0, 1.64, 0);
  var hair = new THREE.SphereGeometry(0.145, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); hair.translate(0, 1.67, -0.01);
  var long = g(0.3, 0.34, 0.08, 1.5); long.translate(0, 0, -0.12);
  var leg = g(0.15, 0.86, 0.17, -0.43), arm = g(0.1, 0.6, 0.11, -0.3);
  var dogB = g(0.56, 0.24, 0.22, 0.36), dogH = g(0.2, 0.2, 0.2, 0.5); dogB.rotateY(Math.PI / 2); dogH.translate(0, 0, 0.34);
  var NP = G.hi ? 60 : 26, lam = function () { return new THREE.MeshLambertMaterial({ color: 0xFFFFFF }); };
  var P = { torso: new THREE.InstancedMesh(torso, lam(), NP), head: new THREE.InstancedMesh(head, lam(), NP), hair: new THREE.InstancedMesh(hair, lam(), NP), long: new THREE.InstancedMesh(long, lam(), NP),
    legL: new THREE.InstancedMesh(leg, lam(), NP), legR: new THREE.InstancedMesh(leg, lam(), NP), armL: new THREE.InstancedMesh(arm, lam(), NP), armR: new THREE.InstancedMesh(arm, lam(), NP),
    dogB: new THREE.InstancedMesh(dogB, lam(), NP), dogH: new THREE.InstancedMesh(dogH, lam(), NP) };
  for (var k in P) { P[k].frustumCulled = false; P[k].castShadow = false; scene.add(P[k]); }
  var shirt = [0xE03131, 0x1971C2, 0x2F9E44, 0xF08C00, 0xFFFFFF, 0x862E9C, 0x495057, 0xF783AC, 0x0CA678, 0x212529, 0xFFD43B, 0x74C0FC], pants = [0x2F3A4F, 0x1C2A4A, 0x6B5B4B, 0x343A40, 0xCED4DA, 0x5C3D2E],
    skin = [0xF1C27D, 0xE0AC69, 0xC68642, 0x8D5524, 0xFFDBAC, 0xD9A066], hairC = [0x1A1110, 0x3B2416, 0x6A4E2E, 0xC9A15B, 0xB5B5B5, 0x1A1110], dogC = [0xFFFFFF, 0xC69C6D, 0x3B2416, 0xE8D5B0], tmp = new THREE.Color();
  var LOOK = [];
  for (var i = 0; i < NP; i++) {
    var lk = { kid: i % 5 === 0, longHair: i % 3 === 1, bald: i % 11 === 4, kippa: i % 7 === 2, dog: i % 6 === 3, sleeve: i % 2 === 0 };
    LOOK.push(lk);
    var sh = shirt[(i * 7) % shirt.length], sk = skin[(i * 5) % skin.length];
    P.torso.setColorAt(i, tmp.set(sh)); P.head.setColorAt(i, tmp.set(sk)); P.hair.setColorAt(i, tmp.set(lk.kippa ? 0x1C2A4A : hairC[(i * 3) % hairC.length])); P.long.setColorAt(i, tmp.set(hairC[(i * 3) % hairC.length]));
    P.legL.setColorAt(i, tmp.set(pants[(i * 3) % pants.length])); P.legR.setColorAt(i, tmp.set(pants[(i * 3) % pants.length]));
    P.armL.setColorAt(i, tmp.set(lk.sleeve ? sh : sk)); P.armR.setColorAt(i, tmp.set(lk.sleeve ? sh : sk));
    P.dogB.setColorAt(i, tmp.set(dogC[i % dogC.length])); P.dogH.setColorAt(i, tmp.set(dogC[i % dogC.length]));
  }
  var walkable = C.roads.map(function (r, ri) { return r.t >= 2 && r.t <= 6 ? ri : -1; }).filter(function (x) { return x >= 0; });
  function newPed(me, p) {
    p = p || {};
    for (var tries = 0; tries < 20; tries++) {
      if (C.busStops && C.busStops.length && Math.random() < 0.08) { // waiting for the bus
        var bs = C.busStops[Math.floor(Math.random() * C.busStops.length)], db = Math.hypot(bs[0] - me.x, bs[1] - me.z); if (db < 25 || db > 170) continue;
        p.cross = null; p.wait = { x: bs[0] + (Math.random() - 0.5) * 2.4, z: bs[1] + (Math.random() - 0.5) * 0.8, h: bs[2] + Math.PI }; p.x = p.wait.x; p.z = p.wait.z; p.sp = 0; p.dodge = 0; return p;
      }
      if (C.zebras.length && Math.random() < 0.22) { // someone about to cross at a zebra crossing
        var zb = C.zebras[Math.floor(Math.random() * C.zebras.length)], dz0 = Math.hypot(zb.x - me.x, zb.z - me.z); if (dz0 < 30 || dz0 > 160) continue;
        var sd = Math.random() < 0.5 ? 1 : -1, rx = -zb.dz, rz = zb.dx;
        p.cross = { x0: zb.x + rx * (zb.w / 2 + 1.2) * sd, z0: zb.z + rz * (zb.w / 2 + 1.2) * sd, x1: zb.x - rx * (zb.w / 2 + 1.2) * sd, z1: zb.z - rz * (zb.w / 2 + 1.2) * sd, f: -Math.random() * 6 };
        p.wait = null; p.x = p.cross.x0; p.z = p.cross.z0; p.sp = 1.3; p.dodge = 0; return p;
      }
      var ri = walkable[Math.floor(Math.random() * walkable.length)], r = C.roads[ri]; if (!r || r.v.length < 2) continue;
      var k = Math.floor(Math.random() * (r.v.length - 1)), ax = VX[r.v[k]], az = VZ[r.v[k]], d = Math.hypot(ax - me.x, az - me.z);
      if (d < 25 || d > 170) continue;
      p.cross = null; p.wait = null; p.ri = ri; p.k = k; p.t = Math.random(); p.side = Math.random() < 0.5 ? 1 : -1; p.dir = Math.random() < 0.5 ? 1 : -1; p.sp = 1.0 + Math.random() * 0.6; p.dodge = 0; p.ph = Math.random() * 6;
      return p;
    }
    return null;
  }
  L.stepPeds = function (dt, me, t) {
    while (L.peds.length < NP) { var np = newPed(me); if (!np) break; L.peds.push(np); }
    var B = new THREE.Matrix4(), Q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), S1 = new THREE.Vector3(), pos = new THREE.Vector3(), A = new THREE.Matrix4(), T = new THREE.Matrix4(), Z = new THREE.Matrix4().makeScale(0, 0, 0);
    var ms = Math.hypot(me.u, me.v);
    var limb = function (mesh, i, sx, y, ang) { T.makeTranslation(sx, y, 0); A.makeRotationX(ang); T.multiply(A); A.multiplyMatrices(B, T); mesh.setMatrixAt(i, A); };
    L.peds.forEach(function (p, i) {
      if (Math.hypot(p.x - me.x, p.z - me.z) > 200) p.hide = !newPed(me, p); // nowhere near to put them yet: hidden until there is
      if (p.hide) { for (var k4 in P) P[k4].setMatrixAt(i, Z); return; }
      var hx = 0, hz = 1, moving = true;
      if (p.wait) { hx = Math.sin(p.wait.h); hz = Math.cos(p.wait.h); moving = false; p.onRoad = false; }
      else if (p.cross) {
        var cr = p.cross; cr.f += dt * p.sp / Math.hypot(cr.x1 - cr.x0, cr.z1 - cr.z0);
        var f = Math.max(0, Math.min(1, cr.f)); p.x = cr.x0 + (cr.x1 - cr.x0) * f; p.z = cr.z0 + (cr.z1 - cr.z0) * f; hx = cr.x1 - cr.x0; hz = cr.z1 - cr.z0;
        if (cr.f >= 1.15) { p.hide = !newPed(me, p); if (p.hide || !p.cross) return; } moving = cr.f >= 0 && cr.f <= 1;
        p.onRoad = cr.f > 0 && cr.f < 1;
      } else {
        var r = C.roads[p.ri], ia = r.v[p.k], ib = r.v[p.k + 1], ax = VX[ia], az = VZ[ia], bx = VX[ib], bz = VZ[ib], len = Math.hypot(bx - ax, bz - az) || 1;
        p.t += p.dir * p.sp * dt / len;
        if (p.t > 1) { if (p.k + 2 < r.v.length) { p.k++; p.t = 0; } else { p.t = 1; p.dir = -1; } }
        if (p.t < 0) { if (p.k > 0) { p.k--; p.t = 1; } else { p.t = 0; p.dir = 1; } }
        ia = r.v[p.k]; ib = r.v[p.k + 1]; ax = VX[ia]; az = VZ[ia]; bx = VX[ib]; bz = VZ[ib]; len = Math.hypot(bx - ax, bz - az) || 1;
        var dx = (bx - ax) / len, dz = (bz - az) / len, off = (r.w / 2 + 1.3) * p.side;
        p.x = ax + (bx - ax) * p.t - dz * off; p.z = az + (bz - az) * p.t + dx * off; hx = dx * p.dir; hz = dz * p.dir; p.onRoad = false;
      }
      // a car coming at them: step aside
      var ddx = p.x - me.x, ddz = p.z - me.z, dd = Math.hypot(ddx, ddz);
      if (dd < 5.5 && ms > 2) p.dodge = Math.min(1, p.dodge + dt * 4); else p.dodge = Math.max(0, p.dodge - dt * 1.5);
      var px = p.x + (dd > 0.01 ? ddx / dd : 0) * p.dodge * 2.6, pz = p.z + (dd > 0.01 ? ddz / dd : 0) * p.dodge * 2.6;
      if (p.dodge > 0.9 && !p.said && dd < 3) { p.said = 1; W.dodged(p); }
      if (p.dodge === 0) p.said = 0;
      var lk = LOOK[i], sc = lk.kid ? 0.62 : 0.94 + (i % 4) * 0.03, ph = (t * (lk.kid ? 9 : 7) + (p.ph || i)) % (Math.PI * 2), sw = moving ? Math.sin(ph) * (lk.kid ? 0.5 : 0.42) : 0;
      var bob = moving ? Math.abs(Math.sin(ph)) * 0.04 : 0, jump = p.dodge * Math.sin(p.dodge * 3.14) * 0.5;
      Q.setFromAxisAngle(up, Math.atan2(hx, hz)); pos.set(px, C.hAt(px, pz) + bob + jump, pz); S1.set(sc, sc, sc); B.compose(pos, Q, S1);
      P.torso.setMatrixAt(i, B); P.head.setMatrixAt(i, B);
      if (lk.bald && !lk.kippa) P.hair.setMatrixAt(i, Z); else { if (lk.kippa) { T.makeScale(0.75, 0.35, 0.75); T.setPosition(0, 1.12, 0); A.multiplyMatrices(B, T); P.hair.setMatrixAt(i, A); } else P.hair.setMatrixAt(i, B); }
      P.long.setMatrixAt(i, lk.longHair && !lk.kippa ? B : Z);
      limb(P.legL, i, 0.1, 0.88, sw); limb(P.legR, i, -0.1, 0.88, -sw);
      limb(P.armL, i, 0.27, 1.46, -sw * 0.9); limb(P.armR, i, -0.27, 1.46, sw * 0.9);
      if (lk.dog && moving && !p.cross) { T.makeTranslation(0.75 / sc, Math.abs(Math.sin(ph * 1.6)) * 0.05, 0.55 / sc); T.scale(S1.set(1 / sc, 1 / sc, 1 / sc)); A.multiplyMatrices(B, T); P.dogB.setMatrixAt(i, A); P.dogH.setMatrixAt(i, A); }
      else { P.dogB.setMatrixAt(i, Z); P.dogH.setMatrixAt(i, Z); }
    });
    for (var j = L.peds.length; j < NP; j++) for (var k2 in P) P[k2].setMatrixAt(j, Z);
    for (var k3 in P) { P[k3].instanceMatrix.needsUpdate = true; if (P[k3].instanceColor) P[k3].instanceColor.needsUpdate = true; }
  };
  L.dispose = function () { L.cars.forEach(function (c) { if (c.V) scene.remove(c.V.root); }); L.cars = []; };
  return L;
}
