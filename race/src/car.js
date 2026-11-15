// Car physics: a two-axle model with tyre slip (so cars can slide and drift), engine and brakes by the car's numbers,
// grip by the track (snow is slippery) and by the ground (off the road is slow), downforce for racing cars, nitro,
// the barriers at the sides of the road, and knocks between cars (heavy trucks push small cars).
var WB = 2.7, HA = 1.35, HB = 1.35;
function makeCar(spec, tr, idx, lat) {
  var c = { spec: spec, idx: idx, lap: 0, prog: 0, lat: lat, u: 0, v: 0, r: 0, steer: 0, nitro: 1, boost: 0, off: 0, slip: 0, hit: 0, spin: 0, t: 0,
    vmax: spec.top / 3.6, A0: 27.78 / spec.acc * 1.32, m: spec.m, I: spec.m * 1.6, fin: 0, lapT: [], lapStart: 0, stuck: 0, wrong: 0, avoid: 0, gear: 1, rpm: 0.2 };
  place(c, tr, idx, lat);
  return c;
}
function place(c, tr, idx, lat) {
  idx = (idx + tr.N) % tr.N;
  c.idx = idx; c.x = tr.X[idx] + tr.RX[idx] * lat; c.z = tr.Z[idx] + tr.RZ[idx] * lat;
  c.h = Math.atan2(tr.TX[idx], tr.TZ[idx]); c.u = c.v = c.r = c.steer = 0;
}
function maxSteer(u) { return 0.62 / (1 + Math.abs(u) / 16); }
// One step of the car: inp = { thr 0..1, brk 0..1, steer -1..1 (left +), hand, nitro }
function drive(c, inp, dt, tr, tgrip) {
  var sp = c.spec, n = 4, h = dt / n;
  var off = Math.abs(c.lat) > tr.w / 2 + 0.6;
  c.off = off ? 1 : 0;
  var target = inp.steer * maxSteer(c.u), rate = inp.analog ? 6 : (Math.sign(target - c.steer) === Math.sign(c.steer) || !c.steer ? 2.6 : 5.5);
  c.steer += Math.max(-rate * dt, Math.min(rate * dt, target - c.steer));
  var nit = inp.nitro && c.nitro > 0.02 && c.u > 3;
  if (nit) { c.nitro = Math.max(0, c.nitro - dt / 3.2); c.boost = 1; } else { c.boost = Math.max(0, c.boost - dt * 3); c.nitro = Math.min(1, c.nitro + dt / 28); }
  for (var s = 0; s < n; s++) {
    var u = c.u, v = c.v, r = c.r, d = c.steer, g = 9.81;
    var mu = sp.grip * tgrip * (off ? 0.55 + 0.35 * sp.off : 1) * (1 + sp.df * u * u / 6000);
    var Fm = mu * c.m * g / 2, Cf = Fm * 7.5, Cr = Fm * 10, Frm = Fm * 1.12;
    if (inp.hand) { Frm *= 0.42; Cr *= 0.45; }
    var au = Math.max(Math.abs(u), 0.5);
    var af = Math.atan2(v + HA * r, au) - d * Math.sign(u || 1), ar = Math.atan2(v - HB * r, au);
    var Ff = Math.max(-Fm, Math.min(Fm, -Cf * af)), Fr = Math.max(-Frm, Math.min(Frm, -Cr * ar));
    // engine, brakes, drag
    var vm = c.vmax * (nit ? 1.16 : 1), Fx = 0;
    if (inp.brk > 0) {
      if (u > 0.8) Fx -= inp.brk * c.m * 9.2 * Math.min(1.05, mu);
      else if (u > -8) Fx -= inp.brk * c.m * 3.2;
    }
    if (inp.thr > 0) {
      if (u < -0.8) Fx += inp.thr * c.m * 9;
      else Fx += inp.thr * c.m * c.A0 * Math.max(0, 1 - Math.pow(Math.max(0, u) / vm, 2)) * (off ? 0.55 + 0.45 * sp.off : 1);
    }
    if (nit) Fx += c.m * c.A0 * 0.6 * Math.max(0, 1 - u / vm);
    Fx -= Math.sign(u) * c.m * (0.22 + (off ? 1.6 * (1 - sp.off) : 0)) + c.m * 0.0003 * u * Math.abs(u) * (off ? 2.5 - sp.off * 1.5 : 1);
    if (inp.hand) Fx -= Math.sign(u) * c.m * 2.2;
    var Fx2 = Math.max(-mu * c.m * g * 1.05, Math.min(mu * c.m * g, Fx));
    var du = Fx2 / c.m + v * r, dv = (Ff * Math.cos(d) + Fr) / c.m - u * r, dr = (HA * Ff * Math.cos(d) - HB * Fr) / c.I;
    c.u += du * h; c.v += dv * h; c.r += dr * h;
    if (Math.abs(c.u) < 0.25 && !inp.thr && !(inp.brk > 0)) c.u = 0;
    // stability assist (like ESP): pulls the car back toward where the wheels point, unless the handbrake is on
    if (!inp.hand && Math.abs(c.u) > 3) { var rk = c.u * Math.tan(d) / WB; c.r += (rk - c.r) * Math.min(1, 2.2 * h * (1 + Math.abs(c.v) / 3)); c.v *= 1 - Math.min(0.5, 1.2 * h); }
    if (Math.abs(c.u) < 3) { var k = Math.abs(c.u) / 3; c.r = c.r * k + (c.u * Math.tan(d) / WB) * (1 - k); c.v *= 0.85 + 0.15 * k; }
    var fx = Math.sin(c.h), fz = Math.cos(c.h), lx = Math.cos(c.h), lz = -Math.sin(c.h);
    c.x += (c.u * fx + c.v * lx) * h; c.z += (c.u * fz + c.v * lz) * h; c.h += c.r * h;
  }
  c.slip = Math.min(1, Math.abs(c.v) / 6 + (inp.hand && Math.abs(c.u) > 6 ? 0.4 : 0) + (inp.brk > 0.5 && c.u > 15 && !off ? 0.15 : 0));
  if (c.slip > 0.45 && Math.abs(c.u) > 12) c.nitro = Math.min(1, c.nitro + dt * 0.05);
  // gears and engine speed, for the sound and the dial
  var kmh = Math.abs(c.u) * 3.6, top = sp.top, gears = 6, gw = top / gears;
  c.gear = Math.min(gears, Math.max(1, Math.ceil(kmh / gw + 0.001)));
  c.rpm = Math.min(1, 0.18 + 0.82 * ((kmh - (c.gear - 1) * gw) / gw) * (c.gear === 1 ? 1 : 0.75) + (c.gear > 1 ? 0.2 : 0));
}
// The barriers: the car cannot leave the strip; hitting the side slows it and bounces it back.
function walls(c, tr) {
  var lim = tr.w / 2 + 5.5;
  if (Math.abs(c.lat) <= lim) return 0;
  var i = c.idx, sgn = Math.sign(c.lat), over = Math.abs(c.lat) - lim, RX = tr.RX[i], RZ = tr.RZ[i];
  c.x -= RX * over * sgn; c.z -= RZ * over * sgn; c.lat = lim * sgn;
  var fx = Math.sin(c.h), fz = Math.cos(c.h), lx = Math.cos(c.h), lz = -Math.sin(c.h);
  var vx = c.u * fx + c.v * lx, vz = c.u * fz + c.v * lz, vn = (vx * RX + vz * RZ) * sgn;
  if (vn > 0) {
    vx -= RX * sgn * vn * 1.35; vz -= RZ * sgn * vn * 1.35;
    var k = Math.max(0.55, 1 - vn / 40); vx *= k; vz *= k;
    c.u = vx * fx + vz * fz; c.v = vx * lx + vz * lz; c.r *= 0.5;
    // turn the car a little toward the road
    var th = Math.atan2(tr.TX[i], tr.TZ[i]), dh = th - c.h; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI;
    if (Math.abs(dh) < 1.3) c.h += dh * 0.25;
    c.hit = Math.min(1, vn / 15);
    return vn;
  }
  return 0;
}
// Knocks between cars: two circles each (front and back); heavier cars push lighter ones.
function knock(a, b) {
  var best = 0, nx = 0, nz = 0, R = 1.15;
  for (var i = -1; i <= 1; i += 2) for (var j = -1; j <= 1; j += 2) {
    var ax = a.x + Math.sin(a.h) * 1.2 * i, az = a.z + Math.cos(a.h) * 1.2 * i, bx = b.x + Math.sin(b.h) * 1.2 * j, bz = b.z + Math.cos(b.h) * 1.2 * j;
    var dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz), pen = 2 * R - d;
    if (pen > best && d > 1e-4) { best = pen; nx = dx / d; nz = dz / d; }
  }
  if (best <= 0) return 0;
  var ma = a.m, mb = b.m, wa = mb / (ma + mb), wb = ma / (ma + mb);
  a.x -= nx * best * wa; a.z -= nz * best * wa; b.x += nx * best * wb; b.z += nz * best * wb;
  var va = vel(a), vb = vel(b), rel = (vb[0] - va[0]) * nx + (vb[1] - va[1]) * nz;
  if (rel < 0) {
    var j2 = -(1.25) * rel / (1 / ma + 1 / mb);
    setVel(a, va[0] - j2 / ma * nx, va[1] - j2 / ma * nz); setVel(b, vb[0] + j2 / mb * nx, vb[1] + j2 / mb * nz);
    a.r += (Math.random() - 0.5) * Math.min(0.6, -rel / 25) * wa; b.r += (Math.random() - 0.5) * Math.min(0.6, -rel / 25) * wb;
    return -rel;
  }
  return 0;
}
function vel(c) { var fx = Math.sin(c.h), fz = Math.cos(c.h), lx = Math.cos(c.h), lz = -Math.sin(c.h); return [c.u * fx + c.v * lx, c.u * fz + c.v * lz]; }
function setVel(c, vx, vz) { var fx = Math.sin(c.h), fz = Math.cos(c.h), lx = Math.cos(c.h), lz = -Math.sin(c.h); c.u = vx * fx + vz * fz; c.v = vx * lx + vz * lz; }

// The computer drivers: follow the racing line ahead, at the speed the next bends allow, and go round slower cars.
function aiInput(c, tr, V, skill, cars) {
  var N = tr.N, look = 7 + Math.abs(c.u) * 0.5, ti = (c.idx + Math.round(look / tr.step)) % N;
  // a slower car just ahead on our line: move to its other side
  var want = tr.LINE[ti] * 0.9;
  cars.forEach(function (o) {
    if (o === c) return;
    var ahead = (o.idx - c.idx + N) % N * tr.step;
    if (ahead > 0 && ahead < 22 && Math.abs(o.lat - (want + c.avoid)) < 2.6 && o.u < c.u + 2) want = o.lat + (o.lat > 0 ? -3.2 : 3.2);
  });
  want = Math.max(-tr.w / 2 + 1.4, Math.min(tr.w / 2 - 1.4, want));
  c.avoid += (want - tr.LINE[ti] * 0.9 - c.avoid) * 0.04;
  var off = tr.LINE[ti] * 0.9 + c.avoid, px = tr.X[ti] + tr.RX[ti] * off, pz = tr.Z[ti] + tr.RZ[ti] * off;
  var dx = px - c.x, dz = pz - c.z, fx = Math.sin(c.h), fz = Math.cos(c.h);
  var alpha = Math.atan2(dx * fz - dz * fx, dx * fx + dz * fz), ld = Math.hypot(dx, dz) || 1;
  var delta = Math.atan2(2 * WB * Math.sin(alpha), ld);
  var vt = V[(c.idx + 4) % N] * skill, thr = 0, brk = 0;
  if (c.u < vt - 0.5) thr = Math.min(1, (vt - c.u) / 4 + 0.35); else if (c.u > vt + 1.2) brk = Math.min(1, (c.u - vt) / 7);
  // stuck against something: back up and straighten
  if (c.u < 1.5 && c.started) c.stuck += 1 / 60; else c.stuck = Math.max(0, c.stuck - 0.05);
  if (c.stuck > 2.2 && c.stuck < 3.6) return { thr: 0, brk: 1, steer: -Math.sign(delta), hand: 0, nitro: 0 };
  if (c.stuck >= 3.6) { place(c, tr, c.idx, tr.LINE[c.idx]); c.stuck = 0; }
  var nit = c.nitro > 0.5 && Math.abs(tr.K[ti]) < 0.002 && c.u < vt - 8 && Math.random() < 0.02;
  return { thr: thr, brk: brk, steer: Math.max(-1, Math.min(1, delta / maxSteer(c.u))), hand: 0, nitro: nit || (c.boost > 0 && c.nitro > 0.1), analog: 1 };
}
