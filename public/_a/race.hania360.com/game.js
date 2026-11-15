// HaniaRace data: the vehicles and the tracks.
// Vehicles: 3D models from Kenney's Car Kit (CC0, kenney.nl). Each type has its own numbers, close to real cars of
// that kind: top speed (km/h), 0 to 100 (seconds), mass (kg), tyre grip, and how it copes off the road.
var CARS = [
  { id: "race", n: "פורמולה", cls: "מרוץ", top: 300, acc: 2.6, m: 720, grip: 1.25, df: 1.4, off: 0.35, star: 18 },
  { id: "race-future", n: "אב־טיפוס חשמלי", cls: "מרוץ", top: 320, acc: 2.2, m: 900, grip: 1.2, df: 1.2, off: 0.4, star: 30 },
  { id: "sedan-sports", n: "קופה ספורט", cls: "ספורט", top: 270, acc: 3.9, m: 1450, grip: 1.06, df: 0.4, off: 0.5, star: 6 },
  { id: "hatchback-sports", n: "האצ׳בק חם", cls: "ספורט", top: 245, acc: 5.8, m: 1250, grip: 1.02, df: 0.2, off: 0.55, star: 0 },
  { id: "suv-luxury", n: "שטח יוקרתי", cls: "שטח", top: 250, acc: 4.6, m: 2200, grip: 0.95, df: 0.1, off: 0.85, star: 12 },
  { id: "police", n: "ניידת", cls: "חירום", top: 240, acc: 6.2, m: 1700, grip: 0.97, df: 0.1, off: 0.6, star: 3, siren: 1 },
  { id: "sedan", n: "סדאן משפחתית", cls: "כביש", top: 200, acc: 9.5, m: 1400, grip: 0.9, df: 0, off: 0.5, star: 0 },
  { id: "taxi", n: "מונית", cls: "כביש", top: 195, acc: 10.5, m: 1450, grip: 0.9, df: 0, off: 0.5, star: 0 },
  { id: "suv", n: "ג׳יפ שטח", cls: "שטח", top: 185, acc: 9.8, m: 1900, grip: 0.88, df: 0, off: 0.95, star: 0 },
  { id: "truck", n: "טנדר", cls: "שטח", top: 180, acc: 10.5, m: 2100, grip: 0.86, df: 0, off: 0.9, star: 2 },
  { id: "van", n: "מסחרית", cls: "עבודה", top: 170, acc: 12.5, m: 2000, grip: 0.83, df: 0, off: 0.55, star: 0 },
  { id: "truck-flat", n: "טנדר משטח", cls: "עבודה", top: 175, acc: 11.5, m: 2200, grip: 0.84, df: 0, off: 0.85, star: 4 },
  { id: "ambulance", n: "אמבולנס", cls: "חירום", top: 165, acc: 12, m: 3500, grip: 0.82, df: 0, off: 0.6, star: 5, siren: 1 },
  { id: "delivery", n: "משאית חלוקה", cls: "עבודה", top: 140, acc: 16, m: 5500, grip: 0.78, df: 0, off: 0.6, star: 8 },
  { id: "firetruck", n: "כבאית", cls: "חירום", top: 130, acc: 18, m: 12000, grip: 0.75, df: 0, off: 0.7, star: 10, siren: 1 },
  { id: "garbage-truck", n: "משאית זבל", cls: "עבודה", top: 115, acc: 22, m: 16000, grip: 0.72, df: 0, off: 0.65, star: 14 },
  { id: "tractor", n: "טרקטור", cls: "שטח", top: 55, acc: 9, m: 3000, grip: 0.85, df: 0, off: 1, star: 1 },
];
var CAR_BY = {}; CARS.forEach(function (c) { CAR_BY[c.id] = c; });

// Tracks: a closed loop r(θ) = R·(1 + Σ a·sin(kθ + φ)), stretched on x, so it never crosses itself.
// The theme decides the ground, sky, scenery and grip.
var TRACKS = [
  { id: "circuit", n: "מעגל המרוצים", d: "מסלול מרוצים קלאסי: עקומות מהירות, שוליים אדומים־לבנים וטריבונות", R: 300, sx: 1.45, w: 14, laps: 3,
    h: [[0.22, 3, 0.3], [0.12, 5, 1.7], [0.08, 2, 4.0]], theme: "circuit" },
  { id: "coast", n: "כביש החוף", d: "שקיעה לאורך הים, דקלים וחול", R: 380, sx: 1.8, w: 13, laps: 3,
    h: [[0.18, 2, 1.0], [0.14, 4, 0.2], [0.06, 7, 2.2]], theme: "coast" },
  { id: "desert", n: "מכתש רמון", d: "מדבר, סלעים וצוקים כתומים. עקומות חדות", R: 330, sx: 1.3, w: 13, laps: 3,
    h: [[0.25, 3, 2.4], [0.15, 6, 0.9], [0.07, 4, 3.1]], theme: "desert" },
  { id: "city", n: "תל אביב בלילה", d: "רחובות מוארים בין מגדלים, ניאון ופנסים", R: 300, sx: 1.6, w: 15, laps: 3,
    h: [[0.16, 4, 0.0], [0.12, 2, 2.0], [0.1, 6, 1.1]], theme: "city" },
  { id: "snow", n: "חרמון בשלג", d: "שלג, אורנים ופחות אחיזה. זהירות בעקומות!", R: 280, sx: 1.35, w: 13, laps: 3,
    h: [[0.2, 3, 1.4], [0.16, 5, 0.4], [0.05, 8, 2.6]], theme: "snow" },
];
var THEMES = {
  circuit: { sky: ["#5EA8F0", "#CFE7FF"], fog: "#CFE3F5", ground: "#5E9E3A", ground2: "#4E8A30", road: "#3A3D44", sun: 1.25, amb: 0.75, grip: 1, night: 0, scen: ["tree", "stand", "tires"] },
  coast: { sky: ["#F49A5B", "#FFD6A0"], fog: "#F5C99A", ground: "#E3C98F", ground2: "#D7BA7A", road: "#45474E", sun: 1.0, amb: 0.8, grip: 1, night: 0, sea: 1, scen: ["palm", "palm", "rock"], warm: 1 },
  desert: { sky: ["#7DB7E8", "#F1DDBB"], fog: "#EAD3AE", ground: "#D2954F", ground2: "#C1803E", road: "#4A4038", sun: 1.35, amb: 0.7, grip: 0.97, night: 0, scen: ["rock", "rock", "bush", "mesa"] },
  city: { sky: ["#05081A", "#1B2350"], fog: "#141A38", ground: "#2A2C33", ground2: "#25272D", road: "#2E3036", sun: 0.25, amb: 0.42, grip: 1, night: 1, scen: ["tower", "tower", "lamp"] },
  snow: { sky: ["#9FB6CC", "#E6EEF5"], fog: "#DCE6EF", ground: "#F2F6FA", ground2: "#E2EAF2", road: "#4B5057", sun: 0.95, amb: 0.95, grip: 0.8, night: 0, scen: ["pine", "pine", "rock"], snow: 1 },
};
var DIFF = { 1: ["קל", 0.84], 2: ["רגיל", 0.92], 3: ["קשה", 0.985] };

// The track as data: points every few meters along the middle of the road, with direction, side and curvature,
// and the fastest safe speed at each point (for the drivers the computer plays).
function makeTrack(T) {
  var raw = [], M = 2400, i;
  for (i = 0; i < M; i++) {
    var th = i / M * Math.PI * 2, r = 1;
    T.h.forEach(function (h) { r += h[0] * Math.sin(h[1] * th + h[2]); });
    raw.push([Math.cos(th) * T.R * r * T.sx, Math.sin(th) * T.R * r]);
  }
  // even spacing along the road
  var len = 0, cum = [0];
  for (i = 1; i <= M; i++) { var a = raw[i - 1], b = raw[i % M]; len += Math.hypot(b[0] - a[0], b[1] - a[1]); cum.push(len); }
  var step = 3, N = Math.round(len / step), X = new Float32Array(N), Z = new Float32Array(N), j = 0;
  for (i = 0; i < N; i++) {
    var s = i / N * len; while (cum[j + 1] < s) j++;
    var f = (s - cum[j]) / (cum[j + 1] - cum[j] || 1), A = raw[j], B = raw[(j + 1) % M];
    X[i] = A[0] + (B[0] - A[0]) * f; Z[i] = A[1] + (B[1] - A[1]) * f;
  }
  // go the other way round if needed, so the road always turns mostly left-and-right the same as it is drawn
  var TX = new Float32Array(N), TZ = new Float32Array(N), RX = new Float32Array(N), RZ = new Float32Array(N), K = new Float32Array(N);
  for (i = 0; i < N; i++) {
    var p = (i - 1 + N) % N, q = (i + 1) % N, dx = X[q] - X[p], dz = Z[q] - Z[p], l = Math.hypot(dx, dz) || 1;
    TX[i] = dx / l; TZ[i] = dz / l; RX[i] = -TZ[i]; RZ[i] = TX[i];
  }
  for (i = 0; i < N; i++) {
    var a1 = Math.atan2(TX[(i - 2 + N) % N], TZ[(i - 2 + N) % N]), a2 = Math.atan2(TX[(i + 2) % N], TZ[(i + 2) % N]), d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    K[i] = d / (4 * step);
  }
  // smooth the curvature a little
  var K2 = new Float32Array(N);
  for (i = 0; i < N; i++) { var t = 0; for (var k = -3; k <= 3; k++) t += K[(i + k + N) % N]; K2[i] = t / 7; }
  // where to drive: a little to the inside before a bend (the line the computer drivers take)
  var LINE = new Float32Array(N);
  for (i = 0; i < N; i++) { var ahead = 0; for (k = 4; k < 24; k++) ahead += K2[(i + k) % N]; LINE[i] = Math.max(-1, Math.min(1, -ahead * 18)) * T.w * 0.28; }
  var L2 = new Float32Array(N); for (i = 0; i < N; i++) { t = 0; for (k = -6; k <= 6; k++) t += LINE[(i + k + N) % N]; L2[i] = t / 13; }
  return { T: T, N: N, len: len, step: step, X: X, Z: Z, TX: TX, TZ: TZ, RX: RX, RZ: RZ, K: K2, LINE: L2, w: T.w };
}
// The fastest speed (m/s) at each point for a car with this much grip and braking, looking ahead at the bends.
function speedProfile(tr, mu, brake, vmax) {
  var N = tr.N, V = new Float32Array(N), i, g = 9.81;
  for (i = 0; i < N; i++) { var k = Math.abs(tr.K[i]); V[i] = Math.min(vmax, k > 1e-5 ? Math.sqrt(0.9 * mu * g / k) : vmax); }
  for (var pass = 0; pass < 2; pass++) for (i = N - 1; i >= 0; i--) { var n = V[(i + 1) % N]; V[i] = Math.min(V[i], Math.sqrt(n * n + 2 * brake * tr.step)); }
  return V;
}
// Where a car is on the track: the nearest point (searching near where it was), and how far it is from the middle.
function locate(tr, c) {
  var N = tr.N, best = 1e18, bi = c.idx, i, k;
  for (k = -40; k <= 40; k++) { i = (c.idx + k + N) % N; var dx = c.x - tr.X[i], dz = c.z - tr.Z[i], d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
  if (best > 900) for (i = 0; i < N; i += 1) { dx = c.x - tr.X[i]; dz = c.z - tr.Z[i]; d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
  var delta = bi - c.idx;
  if (delta < -N / 2) { delta += N; c.lap++; c.lapCross = 1; } else if (delta > N / 2) { delta -= N; c.lap--; }
  c.idx = bi; c.lat = (c.x - tr.X[bi]) * tr.RX[bi] + (c.z - tr.Z[bi]) * tr.RZ[bi];
  c.prog = c.lap * N + bi;
  return delta;
}

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

// Cars built in code (no outside models): a rounded body from a side profile with wheel arches, a cabin with
// pillars and dark glass, lights, grille, mirrors, and wheels with a rounded tyre and a spoked rim. Each type has its
// own proportions (sports coupe, sedan, hatchback, SUV, pickup, van, trucks, formula, tractor) and livery.
// Sizes are in metres; the car faces +z. Wheel groups are named like the old models ("wheel-front-left"), so the
// game turns and steers them the same way.
var GEN = (function () {
  var M = {};
  function paint(col) { var k = "p" + col; if (!M[k]) { var o = { color: new THREE.Color(col).convertSRGBToLinear(), metalness: 0.15, roughness: 0.3, envMapIntensity: 0.75 }; if (G.hi) { o.clearcoat = 1; o.clearcoatRoughness = 0.05; } M[k] = G.hi ? new THREE.MeshPhysicalMaterial(o) : new THREE.MeshStandardMaterial(o); } return M[k]; }
  function mat(k) {
    if (M[k]) return M[k];
    var o = { glass: { color: 0x0A0F18, metalness: 0.1, roughness: 0.04, envMapIntensity: 1.6 }, black: { color: 0x15171C, metalness: 0.2, roughness: 0.6 }, trim: { color: 0x22252C, metalness: 0.5, roughness: 0.35 },
      rubber: { color: 0x141416, metalness: 0, roughness: 0.92 }, rim: { color: 0xC8CDD5, metalness: 0.95, roughness: 0.22 }, rimDark: { color: 0x2A2D33, metalness: 0.9, roughness: 0.3 }, chrome: { color: 0xE6E9EE, metalness: 1, roughness: 0.12 },
      head: { color: 0xFFFFFF, emissive: 0xFFF4D8, emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.1 }, tail: { color: 0x9B0A0A, emissive: 0xFF1A1A, emissiveIntensity: 0.7, roughness: 0.2 },
      amber: { color: 0xC66A00, emissive: 0xFF9A1A, emissiveIntensity: 0.6 }, helmet: { color: 0xF2C200, metalness: 0.3, roughness: 0.25 }, bed: { color: 0x1E2025, metalness: 0.1, roughness: 0.8 } }[k];
    ["color", "emissive"].forEach(function (c) { if (o[c] != null) o[c] = new THREE.Color(o[c]).convertSRGBToLinear(); });
    if (k === "glass" && G.hi) { o.clearcoat = 1; o.clearcoatRoughness = 0.02; return (M[k] = new THREE.MeshPhysicalMaterial(o)); }
    return (M[k] = new THREE.MeshStandardMaterial(o));
  }
  // a side profile (z forward, y up) pushed out sideways to width w, rounded at the edges
  function slab(shape, w, bev, m) {
    var g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.01, w - 2 * bev), bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 14, steps: 1 });
    g.rotateY(-Math.PI / 2); g.translate((w - 2 * bev) / 2, 0, 0); g.computeVertexNormals();
    var me = new THREE.Mesh(g, m); me.castShadow = true; return me;
  }
  function box(w, h, d, m, x, y, z, r) { var b = new THREE.Mesh(r ? roundBox(w, h, d, r) : new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; return b; }
  function roundBox(w, h, d, r) { var s = new THREE.Shape(), a = d / 2 - r, b = h / 2 - r; s.moveTo(-a, -h / 2); s.lineTo(a, -h / 2); s.quadraticCurveTo(d / 2, -h / 2, d / 2, -b); s.lineTo(d / 2, b); s.quadraticCurveTo(d / 2, h / 2, a, h / 2); s.lineTo(-a, h / 2); s.quadraticCurveTo(-d / 2, h / 2, -d / 2, b); s.lineTo(-d / 2, -b); s.quadraticCurveTo(-d / 2, -h / 2, -a, -h / 2);
    var g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.01, w - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: 0, bevelSegments: 3, curveSegments: 6 }); g.rotateY(-Math.PI / 2); g.translate((w - 2 * r) / 2, 0, 0); return g; }
  function quad(a, b, c, d, m) { var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([].concat(a, b, c, a, c, d), 3)); g.computeVertexNormals(); var me = new THREE.Mesh(g, m); me.material.side = THREE.DoubleSide; return me; }
  function poly(pts, m) { var s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); var g = new THREE.ShapeGeometry(s); g.rotateY(-Math.PI / 2); return new THREE.Mesh(g, m); }
  // a wheel: rounded tyre (lathe), spoked rim, brake disc
  function wheel(r, w, dark, spokes) {
    var g = new THREE.Group(), pts = [], i, rr = r * 0.66, edge = Math.min(0.06, w * 0.25);
    pts.push(new THREE.Vector2(rr, -w / 2));
    for (i = 0; i <= 6; i++) { var a = -Math.PI / 2 + i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(r - edge + Math.cos(a) * edge, -w / 2 + edge + Math.sin(a) * edge)); }
    for (i = 0; i <= 6; i++) { a = i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(r - edge + Math.cos(a) * edge, w / 2 - edge + Math.sin(a) * edge)); }
    pts.push(new THREE.Vector2(rr, w / 2));
    var tg = new THREE.LatheGeometry(pts, 28); tg.rotateZ(Math.PI / 2);
    var tire = new THREE.Mesh(tg, mat("rubber")); tire.castShadow = true; g.add(tire);
    var rim = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, w * 0.86, 24, 1, false), mat(dark ? "rimDark" : "rim")); rim.rotation.z = Math.PI / 2; g.add(rim);
    var face = new THREE.Mesh(new THREE.CircleGeometry(rr * 0.97, 24), mat("black")); face.rotation.y = Math.PI / 2; face.position.x = w * 0.44; g.add(face);
    var hub = new THREE.Mesh(new THREE.CylinderGeometry(rr * 0.2, rr * 0.2, w * 0.95, 10), mat(dark ? "rimDark" : "rim")); hub.rotation.z = Math.PI / 2; g.add(hub);
    var n = spokes || 5;
    for (i = 0; i < n; i++) { var sp = new THREE.Mesh(new THREE.BoxGeometry(0.03, rr * 0.92, rr * 0.16), mat(dark ? "rimDark" : "rim")); sp.position.set(w * 0.45, 0, 0); sp.rotation.x = i / n * Math.PI * 2; sp.geometry.translate(0, rr * 0.46, 0); g.add(sp); }
    var out = new THREE.Group(); out.add(g);
    // the other side faces outward too
    return out;
  }
  function addWheels(root, o) {
    [["front", o.wbF], ["back", -o.wbR]].forEach(function (ax) {
      [["left", 1], ["right", -1]].forEach(function (sd) {
        var r = ax[0] === "back" && o.wrR ? o.wrR : o.wr, w = ax[0] === "back" && o.wwR ? o.wwR : o.ww;
        var wg = new THREE.Group(); wg.name = "wheel-" + ax[0] + "-" + sd[0];
        var wh = wheel(r, w, o.darkRims, o.spokes); if (sd[1] < 0) wh.rotation.y = Math.PI; wg.add(wh);
        wg.position.set(sd[1] * (o.track / 2), r, ax[1]); root.add(wg);
      });
    });
  }
  // the body of an ordinary car, from its numbers
  function carBody(root, o, col) {
    var L = o.L, gc = o.gc, wr = o.wr + 0.05, belt = o.belt, s = new THREE.Shape();
    var fz = o.wbF, rz = -o.wbR, ar = (o.arch || wr + 0.04) + 0.1;
    s.moveTo(-L / 2 + 0.12, gc);
    s.lineTo(rz - ar, gc); s.lineTo(rz - ar, o.wr); s.absarc(rz, o.wr, ar, Math.PI, 0, true); s.lineTo(rz + ar, gc);
    s.lineTo(fz - ar, gc); s.lineTo(fz - ar, o.wr); s.absarc(fz, o.wr, ar, Math.PI, 0, true); s.lineTo(fz + ar, gc);
    s.lineTo(L / 2 - 0.15, gc); s.quadraticCurveTo(L / 2, gc, L / 2, gc + 0.15);
    s.lineTo(L / 2, o.nose - 0.08); s.quadraticCurveTo(L / 2, o.nose, L / 2 - 0.18, o.nose + 0.02);
    s.quadraticCurveTo(o.ws + 0.6, o.hood + 0.04, o.ws, belt);
    s.lineTo(o.rg, belt);
    s.quadraticCurveTo(-L / 2 + 0.25, o.deck + 0.03, -L / 2 + 0.05, o.deck - 0.05);
    s.lineTo(-L / 2, gc + 0.18); s.quadraticCurveTo(-L / 2, gc, -L / 2 + 0.12, gc);
    var bodyM = paint(col), b = slab(s, o.W, 0.1, bodyM); root.add(b);
    // the cabin: pillars and roof in the body colour, glass set into it
    if (o.roof) {
      var c = new THREE.Shape(), cw = o.W * 0.86;
      c.moveTo(o.ws + 0.02, belt - 0.02); c.lineTo(o.rf, o.roof - 0.04); c.quadraticCurveTo((o.rf + o.rr) / 2, o.roof + 0.05, o.rr, o.roof - 0.04); c.lineTo(o.rg - 0.02, belt - 0.02); c.lineTo(o.ws + 0.02, belt - 0.02);
      root.add(slab(c, cw, 0.07, bodyM));
      var gx = cw / 2 + 0.072, gm = mat("glass"), inset = 0.09;
      var side = [[o.ws - inset * 1.4, belt + 0.05], [o.rf - inset * 0.5, o.roof - 0.1], [o.rr + inset * 0.6, o.roof - 0.1], [o.rg + inset * 1.5, belt + 0.05]];
      [1, -1].forEach(function (sd) { var p = poly(side, gm); p.position.x = sd * gx; root.add(p); var pil = box(0.02, o.roof - belt - 0.14, 0.07, mat("black"), sd * (gx + 0.002), (o.roof + belt) / 2 - 0.02, (o.rf + o.rr) / 2 - 0.05); root.add(pil); });
      var hw = cw / 2 - 0.02;
      var wn = function (z1, y1, z2, y2, k) { var dz = z2 - z1, dy = y2 - y1, l = Math.hypot(dz, dy); return [dy / l * k, -dz / l * k]; }, fn = wn(o.ws, belt, o.rf, o.roof, 0.085), bn = wn(o.rr, o.roof, o.rg, belt, 0.085);
      root.add(quad([-hw, belt + 0.06 + fn[1], o.ws + fn[0] - 0.02], [hw, belt + 0.06 + fn[1], o.ws + fn[0] - 0.02], [hw * 0.94, o.roof - 0.05 + fn[1], o.rf + fn[0]], [-hw * 0.94, o.roof - 0.05 + fn[1], o.rf + fn[0]], gm));
      root.add(quad([-hw, belt + 0.06 + bn[1], o.rg + bn[0] + 0.02], [hw, belt + 0.06 + bn[1], o.rg + bn[0] + 0.02], [hw * 0.94, o.roof - 0.05 + bn[1], o.rr + bn[0]], [-hw * 0.94, o.roof - 0.05 + bn[1], o.rr + bn[0]], gm));
      [1, -1].forEach(function (sd) { root.add(box(0.12, 0.08, 0.14, bodyM, sd * (o.W / 2 + 0.03), belt + 0.08, o.ws - 0.12, 0.03)); });
    }
    // lights, grille, bumpers
    [1, -1].forEach(function (sd) {
      root.add(box(o.W * 0.24, 0.1, 0.08, mat("head"), sd * o.W * 0.3, o.nose - 0.1, L / 2 + 0.07, 0.03));
      root.add(box(o.W * 0.24, 0.09, 0.07, mat("tail"), sd * o.W * 0.31, o.deck - 0.14, -L / 2 - 0.07, 0.03));
    });
    root.add(box(o.W * 0.38, 0.15, 0.06, mat("trim"), 0, o.nose - 0.27, L / 2 + 0.08, 0.03));
    root.add(box(o.W * 0.62, 0.1, 0.05, mat("black"), 0, gc + 0.16, L / 2 + 0.09, 0.03));
    root.add(box(o.W * 0.94, 0.13, 0.1, mat("black"), 0, gc + 0.06, L / 2 + 0.02, 0.04));
    root.add(box(o.W * 0.94, 0.13, 0.1, mat("black"), 0, gc + 0.06, -L / 2 - 0.02, 0.04));
    root.add(box(o.W * 0.3, 0.12, 0.03, mat("trim"), 0, o.deck - 0.3, -L / 2 - 0.09, 0.02));
    return bodyM;
  }
  // numbers for each kind of car (metres): length, width, wheels, heights along the profile
  var KIND = {
    coupe: { L: 4.5, W: 1.92, wbF: 1.42, wbR: 1.3, wr: 0.34, ww: 0.26, track: 1.66, gc: 0.14, nose: 0.6, hood: 0.86, belt: 0.92, ws: 0.45, rf: -0.25, roof: 1.24, rr: -0.95, rg: -1.75, deck: 0.98, darkRims: 1 },
    sedan: { L: 4.7, W: 1.84, wbF: 1.42, wbR: 1.38, wr: 0.33, ww: 0.22, track: 1.58, gc: 0.17, nose: 0.72, hood: 0.92, belt: 0.98, ws: 0.7, rf: 0.05, roof: 1.46, rr: -1.0, rg: -1.6, deck: 1.02 },
    hatch: { L: 4.1, W: 1.8, wbF: 1.3, wbR: 1.25, wr: 0.32, ww: 0.23, track: 1.56, gc: 0.15, nose: 0.68, hood: 0.88, belt: 0.95, ws: 0.62, rf: 0.0, roof: 1.42, rr: -1.55, rg: -1.98, deck: 1.0, darkRims: 1 },
    suv: { L: 4.75, W: 1.95, wbF: 1.45, wbR: 1.42, wr: 0.4, ww: 0.28, track: 1.68, gc: 0.3, nose: 0.98, hood: 1.16, belt: 1.2, ws: 0.82, rf: 0.25, roof: 1.78, rr: -1.95, rg: -2.3, deck: 1.24, arch: 0.5 },
    lux: { L: 4.85, W: 1.98, wbF: 1.5, wbR: 1.45, wr: 0.4, ww: 0.29, track: 1.7, gc: 0.25, nose: 0.92, hood: 1.1, belt: 1.15, ws: 0.8, rf: 0.2, roof: 1.68, rr: -1.6, rg: -2.25, deck: 1.2, darkRims: 1, arch: 0.48 },
    pickup: { L: 5.3, W: 1.95, wbF: 1.75, wbR: 1.6, wr: 0.4, ww: 0.28, track: 1.68, gc: 0.32, nose: 1.0, hood: 1.18, belt: 1.22, ws: 1.0, rf: 0.45, roof: 1.84, rr: -0.55, rg: -0.6, deck: 1.22, arch: 0.5 },
    van: { L: 5.0, W: 1.95, wbF: 1.6, wbR: 1.55, wr: 0.36, ww: 0.24, track: 1.68, gc: 0.2, nose: 0.85, hood: 1.0, belt: 1.12, ws: 1.15, rf: 0.55, roof: 2.15, rr: -2.4, rg: -2.48, deck: 1.15 },
  };
  function car(spec) {
    var root = new THREE.Group(), id = spec.id, o, col;
    var map = { "sedan-sports": ["coupe", 0xC1121F], "hatchback-sports": ["hatch", 0x1F6FEB], sedan: ["sedan", 0x9AA4B2], taxi: ["sedan", 0xF5C400], police: ["sedan", 0xF2F4F7], suv: ["suv", 0x2F5D3A], "suv-luxury": ["lux", 0x14161B], truck: ["pickup", 0x8C1C13], "truck-flat": ["pickup", 0x3B5B92], van: ["van", 0xF2F2F2], ambulance: ["van", 0xFAFAFA] };
    if (map[id]) {
      o = Object.assign({}, KIND[map[id][0]]); col = map[id][1];
      carBody(root, o, col); addWheels(root, o);
      if (id === "truck" || id === "truck-flat") {
        root.add(box(o.W * 0.8, 0.06, 1.8, mat("bed"), 0, o.belt - 0.04, -1.55));
        if (id === "truck-flat") root.add(box(o.W + 0.1, 0.08, 2.0, mat("trim"), 0, o.belt + 0.05, -1.6));
      }
      if (id === "taxi") { root.add(box(0.7, 0.18, 0.3, mat("head"), 0, o.roof + 0.12, -0.45, 0.04)); }
      if (id === "police") { [1, -1].forEach(function (sd) { root.add(box(0.02, 0.18, o.L * 0.7, paint(0x1E3A8A), sd * (o.W / 2 + 0.01), o.belt - 0.28, -0.05)); }); root.add(box(1.1, 0.12, 0.28, mat("black"), 0, o.roof + 0.06, -0.45, 0.04)); }
      if (id === "ambulance") { [1, -1].forEach(function (sd) { root.add(box(0.02, 0.22, o.L * 0.8, paint(0xD62828), sd * (o.W / 2 + 0.01), o.belt + 0.05, -0.2)); }); root.add(box(1.3, 0.14, 0.3, mat("black"), 0, o.roof + 0.07, 0.4, 0.04)); }
      if (id === "suv") root.add(box(0.9, 0.06, 1.5, mat("trim"), 0, o.roof + 0.06, -0.8));
      return finish(root, o.wr);
    }
    if (id === "race") return formula(root);
    if (id === "race-future") return proto(root);
    if (id === "tractor") return tractor(root);
    return truck(root, id);
  }
  function formula(root) {
    var col = paint(0xD90429), s = new THREE.Shape();
    s.moveTo(-1.9, 0.12); s.lineTo(1.4, 0.12); s.quadraticCurveTo(2.35, 0.14, 2.45, 0.22); s.lineTo(2.4, 0.3); s.quadraticCurveTo(1.6, 0.38, 0.9, 0.56); s.lineTo(0.2, 0.7); s.lineTo(-0.45, 0.72); s.quadraticCurveTo(-0.7, 1.0, -1.0, 0.95); s.lineTo(-1.9, 0.7); s.lineTo(-1.9, 0.12);
    root.add(slab(s, 0.78, 0.12, col));
    root.add(box(0.55, 0.18, 1.4, col, 0.62, 0.36, -0.5, 0.08)); root.add(box(0.55, 0.18, 1.4, col, -0.62, 0.36, -0.5, 0.08));
    root.add(box(1.9, 0.04, 0.42, mat("black"), 0, 0.14, 2.3)); [1, -1].forEach(function (sd) { root.add(box(0.03, 0.18, 0.5, col, sd * 0.95, 0.2, 2.3)); });
    root.add(box(1.0, 0.05, 0.36, mat("black"), 0, 1.02, -1.95)); [1, -1].forEach(function (sd) { root.add(box(0.03, 0.4, 0.5, col, sd * 0.5, 0.85, -1.95)); });
    root.add(box(0.06, 0.4, 0.06, mat("black"), 0, 0.78, -1.75));
    var hel = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 12), mat("helmet")); hel.position.set(0, 0.86, 0.05); root.add(hel);
    root.add(box(0.5, 0.06, 0.6, mat("black"), 0, 0.71, 0.15)); root.add(box(0.08, 0.06, 0.6, mat("trim"), 0, 0.92, 0.4));
    addWheels(root, { wbF: 1.6, wbR: 1.45, wr: 0.34, ww: 0.36, wrR: 0.36, wwR: 0.42, track: 1.62, darkRims: 1, spokes: 7 });
    return finish(root, 0.35);
  }
  function proto(root) {
    var o = { L: 4.7, W: 1.98, wbF: 1.45, wbR: 1.4, wr: 0.35, ww: 0.3, track: 1.7, gc: 0.1, nose: 0.48, hood: 0.66, belt: 0.74, ws: 0.4, rf: -0.15, roof: 1.08, rr: -0.85, rg: -1.75, deck: 0.92, darkRims: 1, spokes: 6 };
    carBody(root, o, 0x00B4D8);
    root.add(box(1.8, 0.05, 0.4, mat("black"), 0, 1.15, -2.15)); [1, -1].forEach(function (sd) { root.add(box(0.04, 0.24, 0.3, mat("black"), sd * 0.6, 1.02, -2.1)); });
    root.add(box(1.7, 0.03, 0.2, mat("head"), 0, 0.5, 2.33));
    addWheels(root, o); return finish(root, o.wr);
  }
  function tractor(root) {
    var g = paint(0x2B9348), s = new THREE.Shape();
    s.moveTo(-0.6, 0.6); s.lineTo(1.6, 0.6); s.lineTo(1.75, 0.75); s.lineTo(1.75, 1.15); s.lineTo(-0.6, 1.25); s.lineTo(-0.6, 0.6);
    root.add(slab(s, 0.95, 0.08, g));
    root.add(box(1.6, 0.12, 1.6, g, 0, 2.45, -0.55, 0.05));
    [[0.7, -1.2], [-0.7, -1.2], [0.7, 0.1], [-0.7, 0.1]].forEach(function (p) { root.add(box(0.06, 1.25, 0.06, mat("black"), p[0], 1.85, p[1])); });
    root.add(box(1.3, 0.8, 0.02, mat("glass"), 0, 1.85, 0.1)); [1, -1].forEach(function (sd) { root.add(box(0.02, 0.8, 1.2, mat("glass"), sd * 0.7, 1.85, -0.55)); });
    root.add(box(1.2, 0.5, 1.2, mat("black"), 0, 1.25, -0.6));
    root.add(box(0.1, 0.7, 0.1, mat("trim"), 0.3, 1.5, 1.3));
    addWheels(root, { wbF: 1.25, wbR: 0.6, wr: 0.45, ww: 0.3, wrR: 0.85, wwR: 0.5, track: 1.55, spokes: 6 });
    root.traverse(function (x) { if (x.name === "wheel-back-left" || x.name === "wheel-back-right") x.position.y = 0.85; });
    return finish(root, 0.6);
  }
  function truck(root, id) {
    var cab = { delivery: 0x1D4ED8, firetruck: 0xC1121F, "garbage-truck": 0x2B9348 }[id] || 0x555555, cm = paint(cab);
    var s = new THREE.Shape(); s.moveTo(1.2, 0.5); s.lineTo(3.3, 0.5); s.quadraticCurveTo(3.45, 0.5, 3.45, 0.7); s.lineTo(3.45, 2.2); s.quadraticCurveTo(3.4, 2.75, 3.0, 2.8); s.lineTo(1.2, 2.8); s.lineTo(1.2, 0.5);
    root.add(slab(s, 2.35, 0.12, cm));
    var gm = mat("glass");
    root.add(quad([-1.02, 1.75, 3.585], [1.02, 1.75, 3.585], [0.98, 2.62, 3.5], [-0.98, 2.62, 3.5], gm));
    [1, -1].forEach(function (sd) { var p = poly([[2.9, 1.75], [2.9, 2.6], [2.1, 2.6], [2.1, 1.75]], gm); p.position.x = sd * 1.19; root.add(p); root.add(box(0.12, 0.5, 0.08, mat("black"), sd * 1.3, 2.1, 3.3)); });
    [1, -1].forEach(function (sd) { root.add(box(0.36, 0.16, 0.06, mat("head"), sd * 0.82, 0.95, 3.59, 0.03)); root.add(box(0.2, 0.2, 0.05, mat("tail"), sd * 1.0, 0.85, -3.25, 0.03)); });
    root.add(box(1.3, 0.45, 0.05, mat("trim"), 0, 1.2, 3.59, 0.04)); root.add(box(2.4, 0.24, 0.16, mat("black"), 0, 0.56, 3.58, 0.05));
    root.add(box(2.1, 0.12, 4.4, mat("black"), 0, 0.62, 0.3));
    if (id === "firetruck") {
      root.add(box(2.36, 2.0, 4.0, cm, 0, 1.6, -0.9, 0.12));
      [1, -1].forEach(function (sd) { for (var i = 0; i < 4; i++) root.add(box(0.03, 0.8, 0.85, mat("chrome"), sd * 1.19, 1.5, 0.75 - i * 0.95)); });
      [0.35, -0.35].forEach(function (x) { root.add(box(0.08, 0.08, 4.4, mat("chrome"), x, 2.75, -0.9)); }); for (var j = 0; j < 9; j++) root.add(box(0.7, 0.05, 0.05, mat("chrome"), 0, 2.75, 1.1 - j * 0.5));
      root.add(box(1.6, 0.14, 0.32, mat("black"), 0, 2.88, 2.4, 0.04));
    } else if (id === "garbage-truck") {
      var b2 = new THREE.Shape(); b2.moveTo(1.1, 0.7); b2.lineTo(1.1, 2.75); b2.lineTo(-2.4, 2.75); b2.lineTo(-3.2, 2.0); b2.lineTo(-3.2, 0.7); b2.lineTo(1.1, 0.7);
      root.add(slab(b2, 2.36, 0.1, paint(0xE9ECEF))); [1, -1].forEach(function (sd) { root.add(box(0.02, 0.35, 4.0, cm, sd * 1.19, 1.4, -1.0)); });
    } else {
      root.add(box(2.36, 2.3, 4.2, paint(0xF4F4F4), 0, 1.85, -0.95, 0.08)); [1, -1].forEach(function (sd) { root.add(box(0.02, 0.5, 3.6, cm, sd * 1.19, 2.3, -0.95)); });
    }
    addWheels(root, { wbF: 2.6, wbR: 1.9, wr: 0.5, ww: 0.34, track: 2.0, spokes: 8 });
    return finish(root, 0.5);
  }
  function finish(root, wr) { root.userData.wr = wr; root.userData.gen = 1; root.traverse(function (x) { if (x.isMesh) { x.castShadow = G.hi; } }); return root; }
  return { car: car };
})();

// Sound, made in the browser (no sound files): the engine (pitch by engine speed and gear, deeper for trucks),
// the nearest rival's engine, tyre squeal, wind, knocks, the countdown beeps and the siren.
var SND = { on: true, ctx: null };
function sndInit() {
  if (SND.ctx || !SND.on) return;
  try { SND.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  var a = SND.ctx, master = a.createGain(); master.gain.value = 0.55; master.connect(a.destination); SND.master = master;
  var noise = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), d = noise.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  SND.noise = noise;
  SND.eng = engineVoice(0.5); SND.eng2 = engineVoice(0);
  var loop = function (f, q, type) { var s = a.createBufferSource(); s.buffer = noise; s.loop = true; var b = a.createBiquadFilter(); b.type = type || "bandpass"; b.frequency.value = f; b.Q.value = q; var g = a.createGain(); g.gain.value = 0; s.connect(b); b.connect(g); g.connect(master); s.start(); return g; };
  SND.skid = loop(1100, 6); SND.wind = loop(500, 0.6, "lowpass"); SND.offg = loop(220, 1);
  var so = a.createOscillator(), sg = a.createGain(); so.type = "triangle"; sg.gain.value = 0; so.connect(sg); sg.connect(master); so.start(); SND.siren = { o: so, g: sg };
}
function engineVoice(vol) {
  var a = SND.ctx, o1 = a.createOscillator(), o2 = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
  o1.type = "sawtooth"; o2.type = "square"; o2.detune.value = -1200 + 7; f.type = "lowpass"; f.Q.value = 3; g.gain.value = vol * 0.1;
  o1.connect(f); o2.connect(f); f.connect(g); g.connect(SND.master); o1.start(); o2.start();
  return { o1: o1, o2: o2, f: f, g: g };
}
function sndEngine(v, c, vol, base) {
  if (!SND.ctx) return;
  var t = SND.ctx.currentTime, fr = base * (0.55 + c.rpm * 1.6) * (1 + c.boost * 0.15);
  v.o1.frequency.setTargetAtTime(fr, t, 0.05); v.o2.frequency.setTargetAtTime(fr, t, 0.05);
  v.f.frequency.setTargetAtTime(300 + c.rpm * 1800 + (c.thr || 0) * 900, t, 0.05);
  v.g.gain.setTargetAtTime(vol * (0.05 + (c.thr || 0) * 0.07 + c.rpm * 0.03), t, 0.08);
}
function sndFrame(me, other, dist, paused) {
  if (!SND.ctx) return;
  var t = SND.ctx.currentTime, base = me.spec.m > 3000 ? 38 : me.spec.cls === "מרוץ" ? 95 : me.spec.cls === "ספורט" ? 70 : 55;
  if (paused) { [SND.eng.g, SND.eng2.g, SND.skid, SND.wind, SND.offg, SND.siren.g].forEach(function (g) { g.gain.setTargetAtTime(0, t, 0.05); }); return; }
  sndEngine(SND.eng, me, 1, base);
  if (other) sndEngine(SND.eng2, other, Math.max(0, 1 - dist / 45) * 0.7, other.spec.m > 3000 ? 38 : other.spec.cls === "מרוץ" ? 95 : 60); else SND.eng2.g.gain.setTargetAtTime(0, t, 0.1);
  SND.skid.gain.setTargetAtTime(me.slip > 0.45 && Math.abs(me.u) > 6 && !me.off ? (me.slip - 0.4) * 0.5 : 0, t, 0.04);
  SND.wind.gain.setTargetAtTime(Math.min(0.25, Math.abs(me.u) / 300), t, 0.2);
  SND.offg.gain.setTargetAtTime(me.off && Math.abs(me.u) > 2 ? Math.min(0.35, Math.abs(me.u) / 60) : 0, t, 0.1);
  if (me.siren) { SND.siren.o.frequency.setTargetAtTime(Math.floor(t * 1.6) % 2 ? 960 : 720, t, 0.02); SND.siren.g.gain.setTargetAtTime(0.06, t, 0.05); } else SND.siren.g.gain.setTargetAtTime(0, t, 0.05);
}
function sndBeep(f, len, vol) {
  if (!SND.ctx) return; var a = SND.ctx, o = a.createOscillator(), g = a.createGain(); o.frequency.value = f; o.type = "square";
  g.gain.setValueAtTime(vol || 0.12, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + (len || 0.2)); o.connect(g); g.connect(SND.master); o.start(); o.stop(a.currentTime + (len || 0.2));
}
function sndHit(k) {
  if (!SND.ctx) return; var a = SND.ctx, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = SND.noise; f.type = "lowpass"; f.frequency.value = 400 + k * 600; g.gain.setValueAtTime(Math.min(0.6, 0.15 + k * 0.5), a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.35);
  s.connect(f); f.connect(g); g.connect(SND.master); s.start(); s.stop(a.currentTime + 0.4);
}

// HaniaRace: the screens, the race itself (countdown, laps, positions, finish), the controls (keyboard, touch,
// tilting the phone, game pad), the dashboard, and what is saved on the phone (stars, best laps, ghost, settings).
(function () {
  "use strict";
  var $ = function (i) { return document.getElementById(i); };
  var NAMES = ["דנה", "יואב", "נועה", "איתי", "מאיה", "עומר", "שירה", "אורי", "ליאור", "תמר", "גיל", "רוני"];
  var S = (function () { try { return JSON.parse(localStorage.getItem("race-v1")) || {}; } catch (e) { return {}; } })();
  S.stars = S.stars || {}; S.best = S.best || {}; S.ghost = S.ghost || {}; S.car = S.car || "hatchback-sports"; S.set = S.set || { gfx: "", ctl: "btn", snd: 1, cam: 0 }; S.bonus = S.bonus || 0; S.track = S.track || "circuit"; S.diff = S.diff || 2;
  function save() { try { localStorage.setItem("race-v1", JSON.stringify(S)); } catch (e) { try { S.ghost = {}; localStorage.setItem("race-v1", JSON.stringify(S)); } catch (e2) {} } }
  function stars() { var n = S.bonus; for (var k in S.stars) n += S.stars[k]; return n; }
  function fmt(t) { if (t == null || !isFinite(t)) return "--:--.--"; var m = Math.floor(t / 60), s = t - m * 60; return m + ":" + (s < 10 ? "0" : "") + s.toFixed(2); }
  var touch = matchMedia("(pointer: coarse)").matches;
  if (!S.set.gfx) S.set.gfx = touch && (navigator.hardwareConcurrency || 4) <= 4 ? "low" : "hi";
  G.hi = S.set.gfx === "hi"; SND.on = !!S.set.snd;

  // ---------- renderer ----------
  var cv = $("cv"), R = new THREE.WebGLRenderer({ canvas: cv, antialias: G.hi, powerPreference: "high-performance" });
  R.outputEncoding = THREE.sRGBEncoding; R.shadowMap.enabled = G.hi; R.shadowMap.type = THREE.PCFSoftShadowMap; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0; G.R = R;
  var cam = new THREE.PerspectiveCamera(62, 1, 0.3, 3000);
  function size() { var w = innerWidth, h = innerHeight; R.setPixelRatio(Math.min(devicePixelRatio || 1, G.hi ? 1.75 : 1.1)); R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  addEventListener("resize", size); size();

  // ---------- screens ----------
  var SCR = ["menu", "garage", "track", "settings", "results", "champ", "pause", "loading"];
  function show(id) { SCR.forEach(function (s) { $("s-" + s).hidden = s !== id; }); $("hud").hidden = !!id && id !== "pause"; $("touch").hidden = !(G.state && !id && touch && S.set.ctl !== "kb"); if (id) document.body.classList.add("menu"); else document.body.classList.remove("menu"); }
  function el(t, cls, txt) { var e = document.createElement(t); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  // ---------- the garage (a turning car on a stand) ----------
  var GS = new THREE.Scene(), gcar = null, gi = Math.max(0, CARS.findIndex(function (c) { return c.id === S.car; }));
  GS.background = new THREE.Color(0x0E1424); GS.environment = makeEnv(null);
  GS.add(new THREE.HemisphereLight(0xBFD4FF, 0x202838, 0.9));
  var spot = new THREE.SpotLight(0xFFFFFF, 1.4, 60, 0.6, 0.5); spot.position.set(6, 12, 8); spot.castShadow = G.hi; GS.add(spot); GS.add(spot.target);
  var disc = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.4, 0.3, 48), new THREE.MeshStandardMaterial({ color: 0x1D2539, metalness: 0.6, roughness: 0.25 })); disc.position.y = -0.15; disc.receiveShadow = true; GS.add(disc);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(5.3, 0.06, 6, 64), new THREE.MeshBasicMaterial({ color: 0xFFC53D })); ring.rotation.x = Math.PI / 2; GS.add(ring);
  var gcam = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  function garage() {
    show("garage"); G.state = null;
    var c = CARS[gi], lock = stars() < c.star;
    $("gName").textContent = c.n; $("gCls").textContent = c.cls + (c.siren ? " · עם סירנה 🚨" : "");
    var bars = [["מהירות", c.top / 320, c.top + " קמ״ש"], ["תאוצה", Math.min(1, 2.2 / c.acc * 1.1), "0–100 ב־" + c.acc + " שנ׳"], ["אחיזה", (c.grip - 0.65) / 0.62, ""], ["שטח", c.off, ""], ["משקל", Math.log(c.m / 600) / Math.log(30), c.m.toLocaleString("he-IL") + " ק״ג"]];
    $("gStats").replaceChildren.apply($("gStats"), bars.map(function (b) { var r = el("div", "bar"); r.append(el("span", "", b[0])); var t = el("i"); var f = el("b"); f.style.width = Math.round(Math.max(0.05, Math.min(1, b[1])) * 100) + "%"; t.append(f); r.append(t, el("small", "", b[2])); return r; }));
    $("gPick").disabled = lock; $("gPick").textContent = lock ? "🔒 נפתח ב־" + c.star + " ⭐ (יש לך " + stars() + ")" : S.car === c.id ? "✓ הרכב שלך · לבחירת מסלול" : "לבחור את הרכב הזה";
    $("gCount").textContent = (gi + 1) + " / " + CARS.length;
    if (gcar) GS.remove(gcar); gcar = null;
    loadModel(c.id).then(function (m) { if (CARS[gi] !== c) return; var V = carMesh(c, m); gcar = V.root; V.lights.siren.forEach(function (s) { s.visible = true; }); V.lights.head.forEach(function (h) { h.visible = true; }); gcar.traverse(function (o) { if (o.isMesh && lock) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.25); } }); GS.add(gcar); }).catch(function () {});
  }
  $("gPrev").onclick = function () { gi = (gi - 1 + CARS.length) % CARS.length; garage(); };
  $("gNext").onclick = function () { gi = (gi + 1) % CARS.length; garage(); };
  $("gPick").onclick = function () { var c = CARS[gi]; if (stars() < c.star) return; S.car = c.id; save(); trackScreen(); };
  $("gBack").onclick = menu;

  // ---------- menu ----------
  var MODE = "quick";
  function menu() {
    show("menu"); G.state = null; endScene();
    $("mStars").textContent = "⭐ " + stars() + " כוכבים · " + CARS.filter(function (c) { return stars() >= c.star; }).length + "/" + CARS.length + " רכבים";
    $("mCar").textContent = "🚗 " + CAR_BY[S.car].n;
  }
  [].forEach.call(document.querySelectorAll("[data-mode]"), function (b) { b.onclick = function () { sndInit(); MODE = b.dataset.mode; if (MODE === "champ") trackScreen(); else trackScreen(); }; });
  $("mGarage").onclick = function () { sndInit(); garage(); };
  $("mSettings").onclick = settings;

  // ---------- choosing a track ----------
  function mini(tr, cv2, dots) {
    var x = cv2.getContext("2d"), W = cv2.width, H = cv2.height, mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9, i;
    for (i = 0; i < tr.N; i++) { mnx = Math.min(mnx, tr.X[i]); mxx = Math.max(mxx, tr.X[i]); mnz = Math.min(mnz, tr.Z[i]); mxz = Math.max(mxz, tr.Z[i]); }
    var sc = Math.min((W - 16) / (mxx - mnx), (H - 16) / (mxz - mnz)), ox = (W - (mxx - mnx) * sc) / 2, oz = (H - (mxz - mnz) * sc) / 2;
    var P = function (X, Z) { return [W - (ox + (X - mnx) * sc), oz + (Z - mnz) * sc]; };
    if (!dots) {
      x.clearRect(0, 0, W, H); x.lineJoin = "round"; x.lineWidth = Math.max(4, W / 30); x.strokeStyle = "rgba(255,255,255,.9)"; x.beginPath();
      for (i = 0; i <= tr.N; i += 2) { var p = P(tr.X[i % tr.N], tr.Z[i % tr.N]); i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); } x.closePath(); x.stroke();
      var s0 = P(tr.X[0], tr.Z[0]); x.fillStyle = "#FFC53D"; x.fillRect(s0[0] - 4, s0[1] - 4, 8, 8);
    }
    return P;
  }
  var TRC = {};
  function trackData(id) { return TRC[id] || (TRC[id] = makeTrack(TRACKS.find(function (t) { return t.id === id; }))); }
  function trackScreen() {
    show("track"); G.state = null;
    $("tTitle").textContent = MODE === "champ" ? "🏆 אליפות: 5 מסלולים ברצף" : MODE === "trial" ? "⏱️ נגד השעון: בחרו מסלול" : MODE === "free" ? "🚗 נהיגה חופשית: בחרו מסלול" : "🏁 מרוץ מהיר: בחרו מסלול";
    $("tCar").textContent = "🚗 " + CAR_BY[S.car].n + " · להחלפה ←";
    var box = $("tList"); box.replaceChildren();
    TRACKS.forEach(function (T) {
      var b = el("button", "tcard" + (S.track === T.id ? " on" : "")), c2 = el("canvas"); c2.width = 160; c2.height = 110;
      b.style.background = "linear-gradient(135deg," + THEMES[T.theme].sky[0] + "," + THEMES[T.theme].ground + ")";
      mini(trackData(T.id), c2);
      var st = S.stars[T.id] || 0;
      b.append(c2, el("b", "", T.n), el("small", "", T.d), el("span", "tmeta", "⭐".repeat(st) + "☆".repeat(3 - st) + (S.best[T.id] ? " · הקפה הכי טובה " + fmt(S.best[T.id]) : "")));
      b.onclick = function () { S.track = T.id; save(); [].forEach.call(box.children, function (x) { x.classList.toggle("on", x === b); }); };
      if (MODE === "champ") b.disabled = true;
      box.append(b);
    });
    $("tDiff").replaceChildren.apply($("tDiff"), [1, 2, 3].map(function (d) { var b = el("button", "chip" + (S.diff === d ? " on" : ""), DIFF[d][0]); b.onclick = function () { S.diff = d; save(); trackScreen(); }; return b; }));
    $("tDiff").hidden = MODE === "trial" || MODE === "free";
  }
  $("tCar").onclick = function () { garage(); };
  $("tBack").onclick = menu;
  $("tGo").onclick = function () { sndInit(); if (MODE === "champ") { CH = { i: 0, pts: {}, field: null }; start(TRACKS[0].id); } else start(S.track); };

  // ---------- settings ----------
  function settings() {
    show("settings");
    var rows = [["גרפיקה", "gfx", [["hi", "✨ גבוהה"], ["low", "🔋 חסכונית"]]], ["שליטה בטלפון", "ctl", [["btn", "🕹️ כפתורים"], ["tilt", "📱 הטיית הטלפון"], ["kb", "⌨️ מקלדת בלבד"]]], ["צליל", "snd", [[1, "🔊 פועל"], [0, "🔇 כבוי"]]], ["מצלמה", "cam", [[0, "מאחור"], [1, "רחוקה"], [2, "מכסה המנוע"]]]];
    $("setRows").replaceChildren.apply($("setRows"), rows.map(function (r) {
      var d = el("div", "setrow"); d.append(el("b", "", r[0]));
      var g = el("div", "chips"); r[2].forEach(function (o) { var b = el("button", "chip" + (S.set[r[1]] === o[0] ? " on" : ""), o[1]); b.onclick = function () { S.set[r[1]] = o[0]; save(); if (r[1] === "gfx") { location.reload(); return; } if (r[1] === "snd") { SND.on = !!o[0]; if (SND.master) SND.master.gain.value = o[0] ? 0.55 : 0; } if (r[1] === "ctl") { document.body.classList.toggle("tilt", o[0] === "tilt"); if (o[0] === "tilt") askTilt(); } settings(); }; g.append(b); });
      d.append(g); return d;
    }));
  }
  $("setBack").onclick = menu;
  $("setReset").onclick = function () { if (confirm("למחוק את כל הכוכבים, השיאים והרכבים שנפתחו?")) { localStorage.removeItem("race-v1"); location.reload(); } };
  function askTilt() { try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().catch(function () {}); } catch (e) {} }

  // ---------- the race ----------
  var W = null, CH = null;
  function endScene() { if (!W) return; W.scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); W = null; }
  function pickRivals(me, n) {
    var list = CARS.filter(function (c) { return c.id !== me.id && c.top <= me.top * 1.12 && c.top >= me.top * 0.8 && c.acc >= me.acc * 0.75; });
    list.sort(function () { return Math.random() - 0.5; });
    var more = CARS.filter(function (c) { return c.id !== me.id && list.indexOf(c) < 0; }).sort(function (a, b) { return Math.abs(a.top * (a.top > me.top ? 1.6 : 1) - me.top) - Math.abs(b.top * (b.top > me.top ? 1.6 : 1) - me.top); });
    var out = list.concat(more).slice(0, n);
    while (out.length < n) out.push(out[out.length % Math.max(1, out.length)] || me);
    return out;
  }
  function start(tid) {
    show("loading"); $("ldText").textContent = "טוען את המסלול…";
    endScene();
    var T = TRACKS.find(function (t) { return t.id === tid; }), th = THEMES[T.theme], tr = trackData(tid), me = CAR_BY[S.car];
    var rivals = MODE === "trial" || MODE === "free" ? [] : CH && CH.field ? CH.field : pickRivals(me, 5);
    if (CH && !CH.field) CH.field = rivals;
    var ids = [me.id].concat(rivals.map(function (r) { return r.id; })).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var laps = MODE === "free" ? 999 : me.top >= 150 ? T.laps : me.top >= 90 ? 2 : 1;
    Promise.all(ids.map(loadModel)).then(function () {
      var scene = new THREE.Scene(), env = buildWorld(tr, th, scene), cars = [], views = []; scene.environment = makeEnv(th);
      var grid = [me].concat(rivals);
      grid.forEach(function (sp, k) {
        // the player starts at the back in a race (more fun to overtake), first in time trial
        var slot = MODE === "trial" || MODE === "free" ? 0 : (k === 0 ? grid.length - 1 : k - 1);
        var row = Math.floor(slot / 2), side = slot % 2 ? 1 : -1, back = 4 + row * 3;
        var c = makeCar(sp, tr, tr.N - back, side * tr.w * 0.22); c.lap = -1; c.name = k ? NAMES[(k * 3 + (CH ? 1 : tid.length)) % NAMES.length] : "אתה"; c.ai = k > 0;
        c.skill = DIFF[S.diff][1] * (0.96 + (k % 3) * 0.02);
        cars.push(c);
        G.models[sp.id].then(function (m) { var V = carMesh(sp, m); scene.add(V.root); views[k] = V; });
      });
      var VP = {}; grid.forEach(function (sp) { if (!VP[sp.id]) VP[sp.id] = speedProfile(tr, sp.grip * th.grip, 8.2 * Math.min(1, sp.grip * th.grip), sp.top / 3.6); });
      var ghost = null;
      if (MODE === "trial" && S.ghost[tid] && S.ghost[tid].car) { G.models[S.ghost[tid].car] ? 0 : 0; loadModel(S.ghost[tid].car).then(function (m) { ghost = carMesh(CAR_BY[S.ghost[tid].car], m, true); scene.add(ghost.root); W && (W.ghostV = ghost); }); }
      if (th.night) { var hl = new THREE.SpotLight(0xFFF1D0, 2.2, 90, 0.5, 0.6, 1.2); scene.add(hl); scene.add(hl.target); env.head = hl; }
      W = { T: T, th: th, tr: tr, scene: scene, env: env, cars: cars, views: views, me: cars[0], VP: VP, laps: laps, t: -3.2, state: "count", order: 0, fx: makeFx(scene), snow: th.snow ? makeSnow(scene) : null,
        camH: cars[0].h, camP: new THREE.Vector3(), shake: 0, msg: "", msgT: 0, best: null, rec: [], ghostT: 0, wrongT: 0, lastBeep: 4, finT: 0 };
      var c0 = cars[0]; W.camP.set(c0.x - Math.sin(c0.h) * 9, 4, c0.z - Math.cos(c0.h) * 9);
      mini(tr, $("hMap"));
      G.state = "race"; show(null); hud(true);
      if (portraitPhone()) flash("💡 טיפ: הכי נוח לשחק כשהטלפון לרוחב", 3);
    }).catch(function (e) { $("ldText").textContent = "לא הצלחנו לטעון. בדקו את החיבור ונסו שוב."; console.error(e); setTimeout(menu, 2500); });
  }
  function portraitPhone() { return touch && innerHeight > innerWidth; }
  function flash(t, sec) { if (!W) return; W.msg = t; W.msgT = sec || 2; $("hMsg").textContent = t; $("hMsg").hidden = false; }

  // ---------- controls ----------
  var K = {}, TB = {}, tilt = 0;
  addEventListener("keydown", function (e) {
    K[e.code] = 1; sndInit();
    if (!W) return;
    if (e.code === "KeyC") { S.set.cam = (S.set.cam + 1) % 3; save(); }
    if (e.code === "KeyR") resetCar();
    if (e.code === "KeyH" && W.me.spec.siren) W.me.siren = !W.me.siren;
    if (e.code === "Escape" || e.code === "KeyP") pause();
    if (/Arrow|Space/.test(e.code)) e.preventDefault();
  });
  addEventListener("keyup", function (e) { K[e.code] = 0; });
  [].forEach.call(document.querySelectorAll("#touch [data-k]"), function (b) {
    var k = b.dataset.k, on = function (e) { e.preventDefault(); sndInit(); TB[k] = 1; b.classList.add("down"); }, off = function (e) { e.preventDefault(); TB[k] = 0; b.classList.remove("down"); };
    b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("pointerleave", off);
  });
  addEventListener("deviceorientation", function (e) {
    var a = (screen.orientation && screen.orientation.angle) || window.orientation || 0, v = a === 90 ? e.beta : a === -90 || a === 270 ? -e.beta : e.gamma;
    tilt = Math.max(-1, Math.min(1, -(v || 0) / 25));
  });
  function input() {
    var gp = navigator.getGamepads ? [].filter.call(navigator.getGamepads(), Boolean)[0] : null;
    var thr = K.ArrowUp || K.KeyW || TB.gas ? 1 : 0, brk = K.ArrowDown || K.KeyS || TB.brk ? 1 : 0, st = (K.ArrowLeft || K.KeyA || TB.left ? 1 : 0) - (K.ArrowRight || K.KeyD || TB.right ? 1 : 0), analog = 0;
    if (touch && S.set.ctl === "tilt") { st = Math.abs(tilt) < 0.06 ? 0 : tilt; analog = 1; }
    if (gp) { var ax = gp.axes[0] || 0; if (Math.abs(ax) > 0.12) { st = -ax; analog = 1; } if (gp.buttons[7] && gp.buttons[7].value > 0.05) thr = gp.buttons[7].value; if (gp.buttons[6] && gp.buttons[6].value > 0.05) brk = gp.buttons[6].value; if (gp.buttons[0] && gp.buttons[0].pressed) thr = 1; }
    return { thr: thr, brk: brk, steer: st, analog: analog, hand: K.Space || TB.hand || (gp && gp.buttons[1] && gp.buttons[1].pressed) ? 1 : 0, nitro: K.ShiftLeft || K.ShiftRight || K.KeyN || TB.nitro || (gp && gp.buttons[2] && gp.buttons[2].pressed) ? 1 : 0 };
  }
  function resetCar() { if (!W || W.state !== "race") return; var c = W.me; place(c, W.tr, c.idx, 0); flash("🔄 חזרה לכביש", 1.2); }
  $("tbPause").onclick = pause; $("tbCam").onclick = function () { S.set.cam = (S.set.cam + 1) % 3; save(); }; $("tbReset").onclick = resetCar;
  function pause() { if (!W || W.state === "done") return; if (W.paused) { W.paused = 0; show(null); return; } W.paused = 1; show("pause"); }
  $("pCont").onclick = pause; $("pRestart").onclick = function () { start(W.T.id); }; $("pExit").onclick = function () { CH = null; menu(); };

  // ---------- one step of the race (1/60 s) ----------
  function step(dt) {
    var w = W, tr = w.tr, me = w.me;
    if (w.paused) return;
    w.t += dt;
    if (w.state === "count") {
      var n = Math.ceil(-w.t);
      if (n !== w.lastBeep && n >= 0) { w.lastBeep = n; if (n > 0) { sndBeep(520, 0.25); flash(String(n), 0.9); } }
      if (w.t >= 0) { w.state = "go"; sndBeep(1040, 0.5); flash(MODE === "free" ? "🚗 סעו!" : "יאללה! 🏁", 1); w.cars.forEach(function (c) { c.started = 1; }); }
    }
    var racing = w.state !== "count", pin = input();
    w.cars.forEach(function (c) {
      var inp = c.ai ? aiInput(c, tr, w.VP[c.spec.id], c.skill * rubber(c), w.cars) : (c.fin && MODE !== "free" ? { thr: 0, brk: 0.4, steer: 0 } : pin);
      if (c.ai && c.fin) inp = aiInput(c, tr, w.VP[c.spec.id], 0.6, w.cars);
      if (!racing) { c.u = c.v = c.r = 0; c.thr = pin.thr; c.rpm = c.ai ? 0.25 : Math.min(1, (c.rpm || 0.2) * 0.96 + pin.thr * 0.06); return; }
      c.thr = inp.thr; c.braking = inp.brk > 0.2 && c.u > 1;
      var u0 = c.u; drive(c, inp, dt, tr, w.th.grip); c.acc = (c.u - u0) / dt;
      var d = locate(tr, c), hit = walls(c, tr);
      if (!c.ai && hit > 4) { sndHit(Math.min(1, hit / 25)); w.shake = Math.min(1, hit / 20); if (navigator.vibrate && touch) navigator.vibrate(30); }
      if (c.lapCross) {
        c.lapCross = 0;
        if (c.lap === 0) c.lapStart = Math.max(0, w.t);
        else if (c.lap >= 1 && !c.fin) {
          var lt = w.t - c.lapStart; c.lapT.push(lt); c.lapStart = w.t;
          if (c === w.me) lapDone(lt);
          if (c.lap >= w.laps && MODE !== "free" && MODE !== "trial") { c.fin = w.t; c.place = ++w.order; if (c === w.me) finish(); }
        }
      }
    });
    for (var i = 0; i < w.cars.length; i++) for (var j = i + 1; j < w.cars.length; j++) { var k = knock(w.cars[i], w.cars[j]); if (k > 3 && (i === 0)) { sndHit(Math.min(1, k / 20)); w.shake = Math.min(1, k / 15); } }
    // wrong way
    var fdot = Math.sin(me.h) * tr.TX[me.idx] + Math.cos(me.h) * tr.TZ[me.idx];
    w.wrongT = fdot < -0.3 && me.u > 3 ? w.wrongT + dt : 0;
    // ghost recording (time trial)
    if (MODE === "trial" && me.lap >= 0) { w.ghostT += dt; if (w.ghostT >= 0.1) { w.ghostT = 0; w.rec.push(Math.round(me.x * 10) / 10, Math.round(me.z * 10) / 10, Math.round(me.h * 100) / 100); } }
    if (w.state === "done") { w.finT += dt; }
  }
  function rubber(c) { var d = (c.prog - W.me.prog) * W.tr.step; return d > 120 ? 0.97 : d < -150 ? 1.035 : 1; }
  function lapDone(lt) {
    var w = W, id = w.T.id, rec = !S.best[id] || lt < S.best[id];
    if (rec) { S.best[id] = lt; if (MODE === "trial" && w.rec.length > 20) S.ghost[id] = { car: w.me.spec.id, p: w.rec, t: lt }; save(); }
    w.rec = [];
    if (MODE === "trial" && W.ghostV) W.ghostStart = w.t;
    var left = w.laps - w.me.lap;
    flash((rec ? "🏆 שיא חדש! " : "⏱️ ") + fmt(lt) + (MODE !== "trial" && MODE !== "free" ? left === 1 ? " · הקפה אחרונה!" : left > 1 ? " · עוד " + left + " הקפות" : "" : ""), 2.2);
    if (rec) sndBeep(880, 0.15);
  }
  function standings() {
    var w = W; return w.cars.slice().sort(function (a, b) { if (a.fin && b.fin) return a.fin - b.fin; if (a.fin) return -1; if (b.fin) return 1; return b.prog - a.prog; });
  }
  function finish() {
    var w = W; w.state = "done"; w.finT = 0; sndBeep(784, 0.2); setTimeout(function () { sndBeep(1046, 0.4); }, 220);
    flash(w.me.place === 1 ? "🏆 ניצחת!" : "🏁 סיימת במקום " + w.me.place, 3);
    setTimeout(results, 2600);
  }
  function results() {
    var w = W; if (!w) return;
    // the rivals still on the track: finish time from their pace so far
    w.cars.forEach(function (c) { if (!c.fin) { var done = Math.max(0.05, (c.prog + 5) / (w.laps * w.tr.N)); c.fin = w.t / done + Math.random() * 0.5; } });
    var S2 = standings(), pos = S2.indexOf(w.me) + 1, st = pos === 1 ? 3 : pos === 2 ? 2 : pos === 3 ? 1 : 0, id = w.T.id, gain = Math.max(0, st - (S.stars[id] || 0));
    if (st > (S.stars[id] || 0)) S.stars[id] = st; save();
    var before = CARS.filter(function (c) { return stars() - gain >= c.star; }).length, after = CARS.filter(function (c) { return stars() >= c.star; }).length;
    show("results");
    $("rTitle").textContent = pos === 1 ? "🏆 מקום ראשון!" : pos === 2 ? "🥈 מקום שני!" : pos === 3 ? "🥉 מקום שלישי!" : "🏁 מקום " + pos;
    $("rStars").textContent = "⭐".repeat(st) + "☆".repeat(3 - st) + (gain ? "  +" + gain + " כוכבים" : "") + (after > before ? " · 🔓 נפתח רכב חדש במוסך!" : "");
    var tb = $("rTable"); tb.replaceChildren();
    S2.forEach(function (c, k) { var r = el("tr", c === w.me ? "me" : ""); [k + 1, c.name, c.spec.n, fmt(c.fin), fmt(Math.min.apply(null, c.lapT.length ? c.lapT : [NaN]))].forEach(function (v) { r.append(el("td", "", String(v))); }); tb.append(r); });
    if (CH) {
      var P = [10, 8, 6, 5, 4, 3]; S2.forEach(function (c, k) { CH.pts[c.name] = (CH.pts[c.name] || 0) + P[k]; CH.cars = CH.cars || {}; CH.cars[c.name] = c.spec.n; });
      CH.i++;
      $("rNext").textContent = CH.i < TRACKS.length ? "🏆 לטבלת האליפות" : "🏆 התוצאה הסופית";
      $("rNext").hidden = false; $("rAgain").hidden = true;
    } else { $("rNext").hidden = true; $("rAgain").hidden = false; }
  }
  $("rAgain").onclick = function () { start(W.T.id); };
  $("rMenu").onclick = function () { CH = null; menu(); };
  $("rNext").onclick = function () {
    show("champ");
    var list = Object.keys(CH.pts).sort(function (a, b) { return CH.pts[b] - CH.pts[a]; }), done = CH.i >= TRACKS.length;
    $("cTitle").textContent = done ? (list[0] === "אתה" ? "🏆 זכית באליפות!" : "🏁 האליפות הסתיימה · מקום " + (list.indexOf("אתה") + 1)) : "🏆 אחרי " + CH.i + " מתוך " + TRACKS.length + " מרוצים";
    var tb = $("cTable"); tb.replaceChildren();
    list.forEach(function (n, k) { var r = el("tr", n === "אתה" ? "me" : ""); [k + 1, n, CH.cars[n], CH.pts[n]].forEach(function (v) { r.append(el("td", "", String(v))); }); tb.append(r); });
    if (done && list[0] === "אתה") { S.bonus += 3; save(); $("cNote").textContent = "🎁 +3 כוכבי בונוס!"; confetti(); } else $("cNote").textContent = done ? "" : "המרוץ הבא: " + TRACKS[CH.i].n;
    $("cGo").textContent = done ? "לתפריט" : "▶ למרוץ הבא";
    $("cGo").onclick = function () { if (done) { CH = null; menu(); } else start(TRACKS[CH.i].id); };
  };
  function confetti() { var b = $("conf"); b.replaceChildren(); for (var i = 0; i < 40; i++) { var s = el("span", "", ["🏆", "⭐", "🏁", "🎉"][i % 4]); s.style.left = Math.random() * 100 + "%"; s.style.animationDelay = Math.random() + "s"; b.append(s); } b.hidden = false; setTimeout(function () { b.hidden = true; }, 4000); }

  // ---------- the dashboard ----------
  var HC = {};
  function set(id, v) { if (HC[id] !== v) { HC[id] = v; $(id).textContent = v; } }
  function hud(reset) {
    if (reset) HC = {};
    var w = W, me = w.me, st = standings(), pos = st.indexOf(me) + 1;
    set("hSpd", String(Math.round(Math.abs(me.u) * 3.6))); set("hGear", me.u < -0.5 ? "R" : String(me.gear));
    set("hPos", MODE === "trial" || MODE === "free" ? "" : pos + "/" + w.cars.length);
    set("hLap", MODE === "free" ? "נהיגה חופשית" : MODE === "trial" ? "הקפה " + Math.max(1, me.lap + 1) : "הקפה " + Math.min(w.laps, Math.max(1, me.lap + 1)) + "/" + w.laps);
    set("hTime", fmt(Math.max(0, w.t - Math.max(0, me.lapStart || 0))));
    set("hBest", S.best[w.T.id] ? "שיא " + fmt(S.best[w.T.id]) : "");
    $("hNitro").style.width = Math.round(me.nitro * 100) + "%";
    $("hRpm").style.width = Math.round(me.rpm * 100) + "%";
    $("hWrong").hidden = w.wrongT < 1.5;
    $("tbSiren").hidden = !me.spec.siren;
    if (w.msgT > 0) { w.msgT -= 1 / 60; if (w.msgT <= 0) $("hMsg").hidden = true; }
    var x = $("hMap").getContext("2d"), P = w.mapP || (w.mapP = mini(w.tr, $("hMap"))), img = w.mapImg || (w.mapImg = x.getImageData(0, 0, $("hMap").width, $("hMap").height));
    x.putImageData(img, 0, 0);
    w.cars.slice().reverse().forEach(function (c) { var p = P(c.x, c.z); x.fillStyle = c.ai ? "#FF6B6B" : "#FFD43B"; x.beginPath(); x.arc(p[0], p[1], c.ai ? 4 : 6, 0, 7); x.fill(); if (!c.ai) { x.strokeStyle = "#000"; x.lineWidth = 1.5; x.stroke(); } });
  }
  $("tbSiren").onclick = function () { if (W) W.me.siren = !W.me.siren; };

  // ---------- drawing a frame ----------
  function render(dt) {
    var w = W, me = w.me, t = w.t;
    w.cars.forEach(function (c, k) {
      var V = w.views[k]; if (!V) return; syncCar(V, c, dt, w.th.night, t);
      var near = !c.ai || Math.hypot(c.x - me.x, c.z - me.z) < 70;
      if (near && Math.abs(c.u) > 5 && (c.slip > 0.5 || c.off)) {
        var bx = c.x - Math.sin(c.h) * 1.3, bz = c.z - Math.cos(c.h) * 1.3, lx = Math.cos(c.h) * 0.85, lz = -Math.sin(c.h) * 0.85;
        if (Math.random() < (c.off ? 0.5 : 0.7)) w.fx.puff(bx + lx, bz + lz, c.off ? (w.th.snow ? "#FFFFFF" : w.th.ground) : "#DDDDDD", c.off);
        if (!c.off && c.slip > 0.55) { w.fx.mark(bx + lx, bz + lz, c.h); w.fx.mark(bx - lx, bz - lz, c.h); }
      }
    });
    if (w.ghostV && S.ghost[w.T.id]) {
      var gh = S.ghost[w.T.id].p, gi2 = Math.floor((t - (w.ghostStart != null ? w.ghostStart : me.lapStart || 0)) * 10) * 3;
      w.ghostV.root.visible = me.lap >= 0 && gi2 >= 0 && gi2 < gh.length - 3;
      if (w.ghostV.root.visible) { w.ghostV.root.position.set(gh[gi2], 0, gh[gi2 + 1]); w.ghostV.root.rotation.y = gh[gi2 + 2]; }
    }
    w.fx.step(dt);
    if (w.snow) w.snow(me.x, me.z, dt);
    // camera
    var mode = S.set.cam, dh = me.h - w.camH; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI;
    w.camH += dh * Math.min(1, dt * (mode === 2 ? 12 : 3.2));
    var fx = Math.sin(w.camH), fz = Math.cos(w.camH), sp = Math.abs(me.u);
    var dist = mode === 1 ? 12 : 7.2 + sp * 0.025, hgt = mode === 1 ? 4.6 : 2.7 + sp * 0.006;
    if (mode === 2) { cam.position.set(me.x + Math.sin(me.h) * 0.4, 1.75, me.z + Math.cos(me.h) * 0.4); cam.lookAt(me.x + Math.sin(me.h) * 20, 1.2, me.z + Math.cos(me.h) * 20); }
    else {
      var tx = me.x - fx * dist, tz = me.z - fz * dist; w.camP.x += (tx - w.camP.x) * Math.min(1, dt * 9); w.camP.z += (tz - w.camP.z) * Math.min(1, dt * 9); w.camP.y += (hgt - w.camP.y) * Math.min(1, dt * 5);
      cam.position.copy(w.camP); cam.lookAt(me.x + fx * 4, 1.1, me.z + fz * 4);
    }
    if (w.shake > 0) { cam.position.x += (Math.random() - 0.5) * w.shake * 0.5; cam.position.y += (Math.random() - 0.5) * w.shake * 0.4; w.shake = Math.max(0, w.shake - dt * 2.5); }
    var fov = 62 + Math.min(14, sp * 0.13) + me.boost * 7; if (Math.abs(cam.fov - fov) > 0.1) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix(); }
    var sun = w.env.sun; sun.position.set(me.x + 60, 160, me.z + 40); sun.target.position.set(me.x, 0, me.z);
    if (w.env.head) { var hl = w.env.head; hl.position.set(me.x + Math.sin(me.h) * 1.5, 1.4, me.z + Math.cos(me.h) * 1.5); hl.target.position.set(me.x + Math.sin(me.h) * 30, 0, me.z + Math.cos(me.h) * 30); }
    // sound: the nearest rival too
    var near2 = null, nd = 1e9; w.cars.forEach(function (c) { if (c.ai) { var d = Math.hypot(c.x - me.x, c.z - me.z); if (d < nd) { nd = d; near2 = c; } } });
    sndFrame(me, near2, nd, w.paused);
    R.render(w.scene, cam);
  }

  // ---------- the main loop ----------
  var last = performance.now(), acc = 0, ga = 0;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (W && G.state === "race") {
      acc += dt; var n = 0; while (acc >= 1 / 60 && n < 4) { step(1 / 60); acc -= 1 / 60; n++; }
      if (n === 4) acc = 0;
      render(dt); hud();
    } else if (!$("s-garage").hidden) {
      ga += dt * 0.5; if (gcar) gcar.rotation.y = ga;
      var w = innerWidth, h = innerHeight; gcam.aspect = w / h; gcam.position.set(Math.sin(0.6) * 10.5, 3.4, Math.cos(0.6) * 10.5); gcam.lookAt(0, 0.7, 0); gcam.fov = w < h ? 60 : 36; gcam.setViewOffset(w, h, 0, h * (w < h ? 0.2 : 0.27), w, h); gcam.updateProjectionMatrix();
      R.render(GS, gcam); if (SND.ctx) sndFrame({ u: 0, slip: 0, off: 0, rpm: 0, boost: 0, thr: 0, spec: CAR_BY[S.car] }, null, 1e9, true);
    } else if (SND.ctx) sndFrame({ u: 0, slip: 0, off: 0, rpm: 0, boost: 0, spec: CAR_BY[S.car] }, null, 1e9, true);
    requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden && W && G.state === "race" && !W.paused && W.state !== "done") pause(); });
  menu(); requestAnimationFrame(frame);
  window.__race = { get W() { return W; }, start: start, menu: menu, S: S, setMode: function (m) { MODE = m; }, sim: function (sec) { for (var i = 0; i < sec * 60 && W; i++) step(1 / 60); if (W) hud(); } };
})();
