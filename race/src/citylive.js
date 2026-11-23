// The living city: traffic lights that change, cars that drive on the right along the real streets (they keep their
// distance, stop at red lights, for people on the crossing and for you), and people who walk on the pavements, cross
// at the zebra crossings and step aside when a car comes too close. Nobody gets hurt in this city.
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
      if (c.V) syncCar(c.V, c, dt, W.night, t);
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
  var body = new THREE.CylinderGeometry(0.22, 0.26, 1.15, 6); body.translate(0, 0.95, 0);
  var head = new THREE.SphereGeometry(0.17, 8, 6); head.translate(0, 1.72, 0);
  var legs = new THREE.BoxGeometry(0.3, 0.45, 0.16); legs.translate(0, 0.22, 0);
  var NP = G.hi ? 60 : 26, mats = [new THREE.MeshLambertMaterial({ color: 0xFFFFFF }), new THREE.MeshLambertMaterial({ color: 0xE6B48A }), new THREE.MeshLambertMaterial({ color: 0x2F3A4F })];
  var IB = new THREE.InstancedMesh(body, mats[0], NP), IH = new THREE.InstancedMesh(head, mats[1], NP), IL = new THREE.InstancedMesh(legs, mats[2], NP);
  [IB, IH, IL].forEach(function (m) { m.frustumCulled = false; scene.add(m); });
  var shirt = [0xE03131, 0x1971C2, 0x2F9E44, 0xF08C00, 0xFFFFFF, 0x862E9C, 0x495057, 0xF783AC, 0x0CA678], skin = [0xF1C27D, 0xE0AC69, 0xC68642, 0x8D5524, 0xFFDBAC], tmp = new THREE.Color();
  for (var i = 0; i < NP; i++) { IB.setColorAt(i, tmp.set(shirt[i % shirt.length])); IH.setColorAt(i, tmp.set(skin[i % skin.length])); IL.setColorAt(i, tmp.set(i % 3 ? 0x2F3A4F : 0x6B5B4B)); }
  var walkable = C.roads.map(function (r, ri) { return r.t >= 2 && r.t <= 6 ? ri : -1; }).filter(function (x) { return x >= 0; });
  function newPed(me, p) {
    p = p || {};
    for (var tries = 0; tries < 20; tries++) {
      if (C.zebras.length && Math.random() < 0.22) { // someone about to cross at a zebra crossing
        var zb = C.zebras[Math.floor(Math.random() * C.zebras.length)], dz0 = Math.hypot(zb.x - me.x, zb.z - me.z); if (dz0 < 30 || dz0 > 160) continue;
        var sd = Math.random() < 0.5 ? 1 : -1, rx = -zb.dz, rz = zb.dx;
        p.cross = { x0: zb.x + rx * (zb.w / 2 + 1.2) * sd, z0: zb.z + rz * (zb.w / 2 + 1.2) * sd, x1: zb.x - rx * (zb.w / 2 + 1.2) * sd, z1: zb.z - rz * (zb.w / 2 + 1.2) * sd, f: -Math.random() * 6 };
        p.x = p.cross.x0; p.z = p.cross.z0; p.sp = 1.3; p.dodge = 0; return p;
      }
      var ri = walkable[Math.floor(Math.random() * walkable.length)], r = C.roads[ri]; if (!r || r.v.length < 2) continue;
      var k = Math.floor(Math.random() * (r.v.length - 1)), ax = VX[r.v[k]], az = VZ[r.v[k]], d = Math.hypot(ax - me.x, az - me.z);
      if (d < 25 || d > 170) continue;
      p.cross = null; p.ri = ri; p.k = k; p.t = Math.random(); p.side = Math.random() < 0.5 ? 1 : -1; p.dir = Math.random() < 0.5 ? 1 : -1; p.sp = 1.0 + Math.random() * 0.6; p.dodge = 0; p.ph = Math.random() * 6;
      return p;
    }
    return null;
  }
  L.stepPeds = function (dt, me, t) {
    while (L.peds.length < NP) { var np = newPed(me); if (!np) break; L.peds.push(np); }
    var m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), s1 = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();
    var ms = Math.hypot(me.u, me.v);
    L.peds.forEach(function (p, i) {
      if (Math.hypot(p.x - me.x, p.z - me.z) > 200) { newPed(me, p); }
      var hx = 0, hz = 1;
      if (p.cross) {
        var cr = p.cross; cr.f += dt * p.sp / Math.hypot(cr.x1 - cr.x0, cr.z1 - cr.z0);
        var f = Math.max(0, Math.min(1, cr.f)); p.x = cr.x0 + (cr.x1 - cr.x0) * f; p.z = cr.z0 + (cr.z1 - cr.z0) * f; hx = cr.x1 - cr.x0; hz = cr.z1 - cr.z0;
        if (cr.f >= 1.15) newPed(me, p); else if (cr.f < 0) { hx = cr.x1 - cr.x0; hz = cr.z1 - cr.z0; }
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
      var wait = p.cross && p.cross.f < 0, bob = wait ? 0 : Math.abs(Math.sin((t + (p.ph || i)) * 7)) * 0.06 + p.dodge * Math.sin(p.dodge * 3.14) * 0.5;
      q.setFromAxisAngle(up, Math.atan2(hx, hz)); pos.set(px, bob, pz); m.compose(pos, q, s1);
      IB.setMatrixAt(i, m); IH.setMatrixAt(i, m); IL.setMatrixAt(i, m);
    });
    for (var j = L.peds.length; j < NP; j++) { m.makeScale(0, 0, 0); IB.setMatrixAt(j, m); IH.setMatrixAt(j, m); IL.setMatrixAt(j, m); }
    IB.instanceMatrix.needsUpdate = IH.instanceMatrix.needsUpdate = IL.instanceMatrix.needsUpdate = true;
    if (IB.instanceColor) IB.instanceColor.needsUpdate = IH.instanceColor.needsUpdate = IL.instanceColor.needsUpdate = true;
  };
  L.dispose = function () { L.cars.forEach(function (c) { if (c.V) scene.remove(c.V.root); }); L.cars = []; };
  return L;
}
