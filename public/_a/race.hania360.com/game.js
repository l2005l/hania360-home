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
  var gtex = canvasTex(512, 512, function (x, W, H) { noiseFill(x, W, H, th.ground, 9000, th.snow ? 0.04 : 0.09); x.globalAlpha = 0.25; for (var k = 0; k < 40; k++) { x.fillStyle = th.ground2; x.beginPath(); x.arc(Math.random() * W, Math.random() * H, 8 + Math.random() * 30, 0, 7); x.fill(); } }, 1);
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
  var rtex = canvasTex(512, 1024, function (x, W, H) {
    x.fillStyle = th.road; x.fillRect(0, 0, W, H);
    var id = x.getImageData(0, 0, W, H), d = id.data; for (var q = 0; q < d.length; q += 4) { var n = (Math.random() - 0.5) * 22; d[q] += n; d[q + 1] += n; d[q + 2] += n; } x.putImageData(id, 0, 0);
    x.globalAlpha = 0.18; x.fillStyle = "#000"; [0.3, 0.42, 0.58, 0.7].forEach(function (f) { x.fillRect(W * f - 14, 0, 28, H); }); x.globalAlpha = 1;
    for (var p = 0; p < 30; p++) { x.globalAlpha = 0.06; x.fillStyle = Math.random() < 0.5 ? "#000" : "#fff"; x.beginPath(); x.ellipse(Math.random() * W, Math.random() * H, 20 + Math.random() * 60, 30 + Math.random() * 90, 0, 0, 7); x.fill(); } x.globalAlpha = 1;
    x.fillStyle = th.night ? "#D8D8C8" : "#F4F4EE"; x.fillRect(14, 0, 12, H); x.fillRect(W - 26, 0, 12, H);
    x.fillStyle = th.snow ? "#E9D96C" : "#F4F4EE"; x.fillRect(W / 2 - 5, 0, 10, H * 0.45);
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
      inst(new THREE.ConeGeometry(pine ? 2.2 : 3, pine ? 8 : 6, 8), new THREE.MeshLambertMaterial({ color: col, flatShading: true }), L, function (o, p) { var s = 0.8 + p[2] * 0.8; o.position.set(p[0], (pine ? 6.5 : 5.5) * s, p[1]); o.scale.set(s, s, s); o.rotation.set(0, p[2] * 5, 0); }, 1);
      inst(new THREE.ConeGeometry(pine ? 1.6 : 2.2, pine ? 5 : 4, 8), new THREE.MeshLambertMaterial({ color: new THREE.Color(col).multiplyScalar(1.18), flatShading: true }), L, function (o, p) { var s = 0.8 + p[2] * 0.8; o.position.set(p[0], (pine ? 9 : 8) * s, p[1]); o.scale.set(s, s, s); o.rotation.set(0, p[2] * 3, 0); });
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
    inst(new THREE.ConeGeometry(1, 1, 7, 3), new THREE.MeshLambertMaterial({ color: th.snow ? 0xE9F0F6 : th.sea ? 0x9C8B76 : T_mount(th), flatShading: true }), M, function (o, p) { var s = 160 + p[2] * 200; o.position.set(p[0], s * 0.4, p[1]); o.scale.set(s * 1.4, s * 0.8 + 40, s * 1.2); o.rotation.set(0, p[2] * 4, 0); });
    if (!th.sea) inst(new THREE.ConeGeometry(1, 1, 7, 1), new THREE.MeshLambertMaterial({ color: 0xF4F7FA, flatShading: true }), M, function (o, p) { var s = 160 + p[2] * 200, h = s * 0.8 + 40; o.position.set(p[0], s * 0.4 + h * 0.36, p[1]); o.scale.set(s * 1.4 * 0.3, h * 0.3, s * 1.2 * 0.3); o.rotation.set(0, p[2] * 4, 0); });
    clouds(scene, B, th);
  } else {
    var S = [], R3 = Math.max(B.maxX - B.minX, B.maxZ - B.minZ) * 0.5 + 300;
    for (var q = 0; q < 70; q++) { var a3 = q / 70 * Math.PI * 2; S.push([B.cx + Math.cos(a3) * R3 * (1 + R() * 0.3), B.cz + Math.sin(a3) * R3 * (1 + R() * 0.3), R()]); }
    var wt2 = canvasTex(64, 128, function (x, W, H) { x.fillStyle = "#121726"; x.fillRect(0, 0, W, H); for (var yy = 4; yy < H; yy += 8) for (var xx = 4; xx < W; xx += 8) { x.fillStyle = Math.random() < 0.5 ? "#FFE8A3" : "#1C2233"; x.fillRect(xx, yy, 5, 5); } }, 1);
    inst(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0x1B2133, emissive: 0xFFFFFF, emissiveMap: wt2, map: wt2 }), S, function (o, p) { var hh = 60 + p[2] * 200; o.position.set(p[0], hh / 2, p[1]); o.scale.set(30 + p[2] * 30, hh, 30); });
  }
}
function clouds(scene, B, th) {
  if (th.night) return;
  var tex = canvasTex(256, 128, function (x, W, H) { for (var i = 0; i < 14; i++) { var cx = 40 + Math.random() * 176, cy = 50 + Math.random() * 40, r = 18 + Math.random() * 30, g = x.createRadialGradient(cx, cy, 2, cx, cy, r); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, W, H); } });
  var R0 = Math.max(B.maxX - B.minX, B.maxZ - B.minZ) * 0.5 + 900;
  for (var i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2 + Math.random() * 0.3, s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, opacity: th.warm ? 0.7 : 0.9, color: th.warm ? 0xFFD9B0 : 0xFFFFFF })); var k = 260 + Math.random() * 260; s.scale.set(k, k / 2, 1); s.position.set(B.cx + Math.cos(a) * R0, 160 + Math.random() * 160, B.cz + Math.sin(a) * R0); scene.add(s); }
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
      amber: { color: 0xC66A00, emissive: 0xFF9A1A, emissiveIntensity: 0.6 }, helmet: { color: 0xF2C200, metalness: 0.3, roughness: 0.25 }, bed: { color: 0x1E2025, metalness: 0.1, roughness: 0.8 }, plate: { color: 0xF2C318, metalness: 0.1, roughness: 0.4 } }[k];
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
    root.add(box(0.52, 0.12, 0.03, mat("plate"), 0, o.deck - 0.32, -L / 2 - 0.1, 0.015));
    root.add(box(0.52, 0.12, 0.03, mat("plate"), 0, gc + 0.3, L / 2 + 0.1, 0.015));
    [1, -1].forEach(function (sd) {
      root.add(box(0.06, 0.1, (fz - ar) - (rz + ar) - 0.1, mat("black"), sd * (o.W / 2 + 0.005), gc + 0.12, (fz - ar + rz + ar) / 2));
      [fz, rz].forEach(function (z) { var li = new THREE.Mesh(new THREE.CylinderGeometry(ar - 0.08, ar - 0.08, 0.1, 20, 1, true, -Math.PI / 2, Math.PI), mat("black")); li.rotation.z = Math.PI / 2; li.rotation.x = Math.PI; li.position.set(sd * (o.W / 2 - 0.08), o.wr, z); root.add(li); });
      root.add(box(0.02, 0.012, 0.9, mat("black"), sd * (o.W / 2 + 0.006), belt - 0.2, (o.ws + o.rg) / 2 + 0.25));
      root.add(box(0.03, 0.03, 0.12, mat("chrome"), sd * (o.W / 2 + 0.012), belt - 0.12, (o.ws + o.rg) / 2 + 0.1));
    });
    if (o.exh !== 0) [1, -1].forEach(function (sd) { var ex = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 12), mat("chrome")); ex.rotation.x = Math.PI / 2; ex.position.set(sd * o.W * 0.28, gc + 0.12, -L / 2 - 0.06); root.add(ex); });
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

// HaniaRace's open city ("עיר פתוחה"): real Israeli streets. The maps come from OpenStreetMap (© OpenStreetMap
// contributors, ODbL), prepared by tools/osm2city.py into race/city/<id>.json: local metres around the city centre
// (x east, z south, in decimetres), roads on a shared list of points (so junctions are known), buildings, parks,
// sand, water, the coast, traffic lights, stop signs, crossings and places for missions.
// This file reads a map into what the rest of the city needs: the roads as a graph (for traffic and the GPS),
// a 1 m grid of what is where (road, pavement, building, water) for driving and knocks, and lookups by place.
var CITY_LIST = [
  ["tel-aviv", "תל אביב", "רוטשילד, דיזנגוף, אלנבי והטיילת"], ["jerusalem", "ירושלים", "יפו, המלך ג׳ורג׳, בן יהודה ומחנה יהודה"],
  ["haifa", "חיפה", "הדר והעיר התחתית"], ["rishon", "ראשון לציון", "מרכז העיר"], ["petah-tikva", "פתח תקווה", "מרכז העיר"],
  ["ashdod", "אשדוד", "מרכז העיר והים"], ["netanya", "נתניה", "כיכר העצמאות והים"], ["beer-sheva", "באר שבע", "העיר העתיקה והמרכז"],
  ["holon", "חולון", "מרכז העיר"], ["bnei-brak", "בני ברק", "רבי עקיבא וז׳בוטינסקי"], ["ramat-gan", "רמת גן", "מרכז העיר"],
  ["rehovot", "רחובות", "הרצל ומרכז העיר"], ["ashkelon", "אשקלון", "אפרידר והים"], ["bat-yam", "בת ים", "הטיילת ומרכז העיר"],
  ["beit-shemesh", "בית שמש", "מרכז העיר"], ["kfar-saba", "כפר סבא", "ויצמן ומרכז העיר"], ["herzliya", "הרצליה", "מרכז העיר"],
  ["hadera", "חדרה", "מרכז העיר"], ["modiin", "מודיעין", "מרכז העיר"], ["netivot", "נתיבות", "מרכז העיר"]
];
var CITY_V = "b4023644a0"; // the maps' version (race/build.py)
// road kinds (from osm2city.py): 1 highway, 2 main, 3 secondary, 4 tertiary, 5 street, 6 shared street, 7 service lane
var ROAD_W = [0, 15, 13, 11, 9.5, 7.5, 5.5, 4.6], ROAD_V = [0, 90, 60, 55, 50, 40, 25, 20];

function cityRead(D) {
  var C = { D: D, name: D.name, names: D.names || [], R: D.r };
  var vs = D.verts, nv = vs.length / 2, VX = new Float32Array(nv), VZ = new Float32Array(nv);
  for (var i = 0; i < nv; i++) { VX[i] = vs[2 * i] / 10; VZ[i] = vs[2 * i + 1] / 10; }
  C.VX = VX; C.VZ = VZ; C.nv = nv;
  // the roads, and every piece between two points as a directed edge (one way where the street is one way)
  var roads = [], E = { a: [], b: [], road: [], len: [], dx: [], dz: [] }, OUT = []; for (i = 0; i < nv; i++) OUT.push([]);
  var deg = new Uint8Array(nv);
  D.roads.forEach(function (r, ri) {
    var t = r[0], lanes = r[2], w = lanes ? Math.max(4.2, Math.min(24, lanes * 3.3 + 1)) : ROAD_W[t];
    if (r[3] && !lanes) w *= 0.8; // a one-way street of unknown lanes is a little narrower
    var R2 = { t: t, name: r[1] >= 0 ? C.names[r[1]] : "", lanes: lanes, ow: r[3], vmax: (r[4] || ROAD_V[t]) / 3.6, ring: r[5], w: w, v: r[6] };
    roads.push(R2);
    for (var k = 0; k < R2.v.length; k++) deg[R2.v[k]] += k === 0 || k === R2.v.length - 1 ? 1 : 2;
    for (k = 0; k + 1 < R2.v.length; k++) {
      var a = R2.v[k], b = R2.v[k + 1], dx = VX[b] - VX[a], dz = VZ[b] - VZ[a], L = Math.hypot(dx, dz);
      if (L < 0.05) continue;
      if (R2.ow >= 0) { OUT[a].push(E.a.length); E.a.push(a); E.b.push(b); E.road.push(ri); E.len.push(L); E.dx.push(dx / L); E.dz.push(dz / L); }
      if (R2.ow <= 0) { OUT[b].push(E.a.length); E.a.push(b); E.b.push(a); E.road.push(ri); E.len.push(L); E.dx.push(-dx / L); E.dz.push(-dz / L); }
    }
  });
  C.roads = roads; C.E = E; C.OUT = OUT; C.deg = deg; C.ne = E.a.length;
  // what is where, on a 1 m grid: 0 ground, 1 road, 2 building, 3 pavement or path, 4 water, 5 green
  var L = Math.ceil(C.R + 130), N = 2 * L, G = new Uint8Array(N * N);
  C.L = L; C.N = N; C.G = G;
  function cell(x, z) { var i = Math.floor(x + L), j = Math.floor(z + L); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; }
  C.cell = cell;
  C.at = function (x, z) { var c = cell(x, z); return c < 0 ? 2 : G[c]; };
  function poly(pts, v, only) { // fill a polygon (flat [x,z,...] in metres)
    var n = pts.length / 2, z0 = 1e9, z1 = -1e9, k;
    for (k = 0; k < n; k++) { z0 = Math.min(z0, pts[2 * k + 1]); z1 = Math.max(z1, pts[2 * k + 1]); }
    for (var z = Math.max(-L, Math.floor(z0)) + 0.5; z < Math.min(L, z1); z++) {
      var xs = [];
      for (k = 0; k < n; k++) {
        var ax = pts[2 * k], az = pts[2 * k + 1], bx = pts[(2 * k + 2) % (2 * n)], bz = pts[(2 * k + 3) % (2 * n)];
        if ((az <= z) !== (bz <= z)) xs.push(ax + (z - az) / (bz - az) * (bx - ax));
      }
      xs.sort(function (p, q) { return p - q; });
      for (k = 0; k + 1 < xs.length; k += 2) {
        var row = (Math.floor(z) + L) * N;
        for (var x = Math.max(-L, Math.ceil(xs[k] - 0.5)); x < Math.min(L, xs[k + 1] - 0.5); x++) { var c2 = row + x + L; if (!only || only(G[c2])) G[c2] = v; }
      }
    }
  }
  function thick(ax, az, bx, bz, r, v, only) { // a thick line
    var x0 = Math.floor(Math.min(ax, bx) - r), x1 = Math.ceil(Math.max(ax, bx) + r), z0 = Math.floor(Math.min(az, bz) - r), z1 = Math.ceil(Math.max(az, bz) + r);
    var dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-6, r2 = r * r;
    for (var z = Math.max(-L, z0); z < Math.min(L, z1); z++) for (var x = Math.max(-L, x0); x < Math.min(L, x1); x++) {
      var px = x + 0.5, pz = z + 0.5, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)), qx = ax + t * dx - px, qz = az + t * dz - pz;
      if (qx * qx + qz * qz <= r2) { var c = (z + L) * N + x + L; if (!only || only(G[c])) G[c] = v; }
    }
  }
  C.poly = poly; C.thick = thick;
  var M = function (a) { var o = new Float32Array(a.length); for (var k = 0; k < a.length; k++) o[k] = a[k] / 10; return o; };
  C.areas = (D.areas || []).map(function (a) { return { k: a[0], p: M(a.slice(1)) }; });
  C.areas.forEach(function (a) { if (a.k === "g") poly(a.p, 5); else if (a.k === "s" || a.k === "l" || a.k === "p") poly(a.p, 3); });
  C.walks = (D.walks || []).map(M);
  C.walks.forEach(function (w) { for (var k = 0; k + 3 < w.length; k += 2) thick(w[k], w[k + 1], w[k + 2], w[k + 3], 1.3, 3, function (g) { return g !== 1; }); });
  // pavements along the streets (not for highways and lanes), then the roads over them
  roads.forEach(function (r) { if (r.t < 2 || r.t > 6) return; for (var k = 0; k + 1 < r.v.length; k++) thick(VX[r.v[k]], VZ[r.v[k]], VX[r.v[k + 1]], VZ[r.v[k + 1]], r.w / 2 + 2.6, 3, function (g) { return g !== 1; }); });
  roads.forEach(function (r) { for (var k = 0; k + 1 < r.v.length; k++) thick(VX[r.v[k]], VZ[r.v[k]], VX[r.v[k + 1]], VZ[r.v[k + 1]], r.w / 2, 1); });
  // the sea: whatever lies to the right of the coastline (OpenStreetMap draws it with the land on its left)
  C.coast = (D.coast || []).map(M);
  C.water = [];
  if (C.coast.length) seaFill(C);
  C.areas.forEach(function (a) { if (a.k === "w") { poly(a.p, 4, function (g) { return g !== 1; }); C.water.push(a.p); } });
  // buildings last: they win over pavements (but never block a road: some outlines overlap the street by a little)
  C.bld = (D.bld || []).map(function (b) { return { h: b[0] / 10, k: b[1], p: M(b.slice(2)) }; });
  C.bld.forEach(function (b) { poly(b.p, 2, function (g) { return g !== 1; }); });
  // points: traffic lights, stop and give-way signs, crossings, bus stops, lamps, trees
  var nd = D.nodes || {}; C.nodes = {}; for (var key in nd) C.nodes[key] = M(nd[key]);
  C.poi = (D.poi || []).map(function (p) { return { k: p[0], name: p[1] >= 0 ? C.names[p[1]] : "", x: p[2] / 10, z: p[3] / 10 }; });
  // a coarse index of the road pieces, to find the nearest street fast
  var B = 40, nb = Math.ceil(N / B), IDX = []; for (i = 0; i < nb * nb; i++) IDX.push(null);
  roads.forEach(function (r, ri) { for (var k = 0; k + 1 < r.v.length; k++) {
    var ax = VX[r.v[k]], az = VZ[r.v[k]], bx = VX[r.v[k + 1]], bz = VZ[r.v[k + 1]];
    var i0 = Math.floor((Math.min(ax, bx) - 8 + L) / B), i1 = Math.floor((Math.max(ax, bx) + 8 + L) / B), j0 = Math.floor((Math.min(az, bz) - 8 + L) / B), j1 = Math.floor((Math.max(az, bz) + 8 + L) / B);
    for (var jj = Math.max(0, j0); jj <= Math.min(nb - 1, j1); jj++) for (var ii = Math.max(0, i0); ii <= Math.min(nb - 1, i1); ii++) (IDX[jj * nb + ii] = IDX[jj * nb + ii] || []).push(ri, k);
  } });
  C.near = function (x, z, maxd, filt) { // the nearest road piece: { road, k, t, x, z, d, dx, dz }
    var ii = Math.floor((x + L) / B), jj = Math.floor((z + L) / B), best = null, bd = (maxd || 30) * (maxd || 30);
    for (var j = jj - 1; j <= jj + 1; j++) for (var i2 = ii - 1; i2 <= ii + 1; i2++) {
      if (i2 < 0 || j < 0 || i2 >= nb || j >= nb) continue; var l = IDX[j * nb + i2]; if (!l) continue;
      for (var q = 0; q < l.length; q += 2) {
        var r = roads[l[q]], k = l[q + 1]; if (filt && !filt(r)) continue;
        var ax = VX[r.v[k]], az = VZ[r.v[k]], dx = VX[r.v[k + 1]] - ax, dz = VZ[r.v[k + 1]] - az, l2 = dx * dx + dz * dz || 1e-6;
        var t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), px = ax + t * dx, pz = az + t * dz, d2 = (px - x) * (px - x) + (pz - z) * (pz - z);
        if (d2 < bd) { bd = d2; var ln = Math.sqrt(l2); best = { road: l[q], k: k, t: t, x: px, z: pz, d: Math.sqrt(d2), dx: dx / ln, dz: dz / ln }; }
      }
    }
    return best;
  };
  return C;
}
// The sea. OpenStreetMap draws the coastline with the land on its left and the water on its right, so along each row
// of the grid every crossing of the coast flips land and water, and its direction says which side is which.
function seaFill(C) {
  var segs = [];
  C.coast.forEach(function (c) { for (var k = 0; k + 3 < c.length; k += 2) segs.push(c[k], c[k + 1], c[k + 2], c[k + 3]); });
  var n = segs.length / 4, L = C.L, N = C.N, G = C.G, any = 0;
  for (var j = 0; j < N; j++) {
    var z = j - L + 0.5, xs = [];
    for (var k = 0; k < n; k++) {
      var az = segs[4 * k + 1], bz = segs[4 * k + 3];
      if ((az <= z) === (bz <= z)) continue;
      var ax = segs[4 * k], bx = segs[4 * k + 2];
      xs.push([ax + (z - az) / (bz - az) * (bx - ax), bz < az ? 1 : -1]); // 1: the coast heads north here, water to the east
    }
    if (!xs.length) continue;
    any = 1; xs.sort(function (p, q) { return p[0] - q[0]; });
    var wet = xs[0][1] < 0, q = 0, row = j * N; // west of the first crossing: water if that crossing heads south
    for (var i = 0; i < N; i++) {
      var x = i - L + 0.5;
      while (q < xs.length && xs[q][0] < x) { wet = xs[q][1] > 0; q++; }
      if (wet && G[row + i] !== 1) G[row + i] = 4;
    }
  }
  C.hasSea = !!any;
}
// The shortest way by car between two points of the road graph (A*), as a list of edges.
function cityRoute(C, fromE, toV) {
  var E = C.E, VX = C.VX, VZ = C.VZ, ne = C.ne, gs = new Float32Array(ne).fill(Infinity), prev = new Int32Array(ne).fill(-1), done = new Uint8Array(ne);
  var tx = VX[toV], tz = VZ[toV], heap = [], push = function (e, f) { heap.push([f, e]); var i = heap.length - 1; while (i > 0) { var p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; var t = heap[p]; heap[p] = heap[i]; heap[i] = t; i = p; } };
  var pop = function () { var top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; var i = 0; for (;;) { var l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; var t = heap[m]; heap[m] = heap[i]; heap[i] = t; i = m; } } return top; };
  var cost = function (e) { var r = C.roads[E.road[e]]; return E.len[e] / Math.max(6, Math.min(r.vmax, 18)); };
  fromE.forEach(function (e) { gs[e] = cost(e) * 0.5; push(e, gs[e]); });
  var found = -1, n = 0;
  while (heap.length && n++ < 200000) {
    var it = pop(), e = it[1]; if (done[e]) continue; done[e] = 1;
    var b = E.b[e]; if (b === toV) { found = e; break; }
    var outs = C.OUT[b];
    for (var q = 0; q < outs.length; q++) {
      var f = outs[q]; if (E.b[f] === E.a[e] && outs.length > 1) continue; // no U-turn unless it is a dead end
      var g = gs[e] + cost(f); if (g < gs[f]) { gs[f] = g; prev[f] = e; push(f, g + Math.hypot(VX[E.b[f]] - tx, VZ[E.b[f]] - tz) / 18); }
    }
  }
  if (found < 0) return null;
  var path = []; for (var x = found; x >= 0; x = prev[x]) path.push(x);
  return path.reverse();
}

// The open city in 3D, from the map read by citydata.js: the ground, sea and parks; the roads with pavements, the
// painted kerbs (red-white and blue-white, as in Israel), lane lines and zebra crossings; the buildings (by the city:
// Jerusalem stone, Tel Aviv's white plaster, glass towers), with solar water heaters on the roofs and windows lit at
// night; street-name signs at the junctions, stop and give-way signs, speed limits, traffic lights, bus stops, lamps,
// trees and palms. Everything is merged into a few meshes per area of the city (so the far parts are skipped).
var CB = { tile: 400 };
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
// a polygon on the ground (flat [x,z,...]), triangulated
function cbFlat(b, pts, y, s) {
  var v = []; for (var i = 0; i < pts.length; i += 2) v.push(new THREE.Vector2(pts[i], pts[i + 1]));
  if (v.length < 3) return;
  if (THREE.ShapeUtils.isClockWise(v)) v.reverse();
  var tri; try { tri = THREE.ShapeUtils.triangulateShape(v, []); } catch (e) { return; }
  s = s || 4;
  tri.forEach(function (t) { cbTri(b, [v[t[0]].x, y, v[t[0]].y], [v[t[2]].x, y, v[t[2]].y], [v[t[1]].x, y, v[t[1]].y], [[v[t[0]].x / s, v[t[0]].y / s], [v[t[2]].x / s, v[t[2]].y / s], [v[t[1]].x / s, v[t[1]].y / s]]); });
}
// a strip along a polyline (points as [x,z] pairs): from offset o1 to o2 to its right, at height y, texture every `rep` m
function cbStrip(b, P, o1, o2, y, rep, col) {
  var acc = 0;
  for (var k = 0; k + 1 < P.length; k++) {
    var ax = P[k][0], az = P[k][1], bx = P[k + 1][0], bz = P[k + 1][1], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz); if (L < 0.01) continue;
    // mitred sides: average the directions at the joints
    var n0 = cbNormal(P, k), n1 = cbNormal(P, k + 1);
    var u0 = acc / rep, u1 = (acc + L) / rep; acc += L;
    cbQuad(b, [ax + n0[0] * o1, y, az + n0[1] * o1], [bx + n1[0] * o1, y, bz + n1[1] * o1], [bx + n1[0] * o2, y, bz + n1[1] * o2], [ax + n0[0] * o2, y, az + n0[1] * o2], [0, 1, 0], [u0, 0, u1, 1], col);
  }
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
// ---------- the whole city ----------
function cityBuild(C, scene, cityId) {
  var VX = C.VX, VZ = C.VZ, R = cbRand(C.nv + 7), M = {}, hi = G.hi;
  var lam = function (o) { return new THREE.MeshLambertMaterial(o); };
  // ground and sea
  var big = (C.L + 1800) * 2;
  var gTex = cbCanvas(256, 256, function (x, w, h) { cbNoise(x, w, h, "#CBBF9F", 3000, 0.08); }); gTex.repeat.set(big / 12, big / 12);
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(big, big), lam({ map: gTex })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  M.sea = new THREE.MeshPhongMaterial({ color: 0x1D6FA3, shininess: 90, specular: 0x88AACC, transparent: true, opacity: 0.94 });
  var sea = cbBatch(), G2 = C.G, N = C.N, L = C.L;
  // the sea and lakes from the grid: runs of water cells per row (4 m rows), plus the open sea beyond the map edge
  for (var j = 0; j < N; j += 4) {
    var row = Math.min(N - 1, j + 2) * N, i0 = -1;
    for (var i = 0; i <= N; i++) {
      var wet = i < N && G2[row + i] === 4;
      if (wet && i0 < 0) i0 = i; if (!wet && i0 >= 0) {
        var xa = i0 - L - (i0 === 0 ? 1800 : 0.6), xb = i - L + (i === N ? 1800 : 0.6), za = j - L - (j === 0 ? 1800 : 0), zb = j + 4 - L + (j + 4 >= N ? 1800 : 0);
        cbQuad(sea.get((xa + xb) / 2, (za + zb) / 2), [xa, 0.05, za], [xb, 0.05, za], [xb, 0.05, zb], [xa, 0.05, zb], [0, 1, 0], [0, 0, 1, 1]); i0 = -1;
      }
    }
  }
  if (C.hasSea) { // the far sea: extend the first and last rows outwards
    for (var side = 0; side < 2; side++) {
      var jr = side ? N - 1 : 0, rr = jr * N, s0 = -1;
      for (i = 0; i <= N; i++) { var w2 = i < N && G2[rr + i] === 4; if (w2 && s0 < 0) s0 = i; if (!w2 && s0 >= 0) { var xa2 = s0 - L - (s0 === 0 ? 1800 : 0), xb2 = i - L + (i === N ? 1800 : 0), za2 = side ? L : -L - 1800, zb2 = side ? L + 1800 : -L; cbQuad(sea.get(xa2, za2), [xa2, 0.05, za2], [xb2, 0.05, za2], [xb2, 0.05, zb2], [xa2, 0.05, zb2], [0, 1, 0], [0, 0, 1, 1]); s0 = -1; } }
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
    for (var a = 0; a < 12; a++) { var a0 = a / 12 * Math.PI * 2, a1 = (a + 1) / 12 * Math.PI * 2; cbTri(b2, [cx, 0.081, cz], [cx + Math.cos(a1) * rr2, 0.081, cz + Math.sin(a1) * rr2], [cx + Math.cos(a0) * rr2, 0.081, cz + Math.sin(a0) * rr2]); }
  }
  // zebra crossings and stop lines
  var cross = C.nodes.cross || [];
  C.zebras = [];
  for (var k = 0; k < cross.length; k += 2) {
    var nr = C.near(cross[k], cross[k + 1], 6); if (!nr) continue; var rd = C.roads[nr.road]; if (rd.t > 6) continue;
    var dx = nr.dx, dz = nr.dz, rx = -dz, rz = dx, bw = bW.get(nr.x, nr.z), hw = rd.w / 2 - 0.3;
    C.zebras.push({ x: nr.x, z: nr.z, dx: dx, dz: dz, w: rd.w });
    for (var s = -hw; s < hw - 0.3; s += 1.0) cbQuad(bw, [nr.x + rx * s - dx * 1.6, 0.11, nr.z + rz * s - dz * 1.6], [nr.x + rx * (s + 0.5) - dx * 1.6, 0.11, nr.z + rz * (s + 0.5) - dz * 1.6], [nr.x + rx * (s + 0.5) + dx * 1.6, 0.11, nr.z + rz * (s + 0.5) + dz * 1.6], [nr.x + rx * s + dx * 1.6, 0.11, nr.z + rz * s + dz * 1.6], [0, 1, 0], [0, 0, 1, 1]);
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
    var tw = FACADE.cols * FACADE.cw, th = FACADE.rows * FACADE.fh, acc2 = R() * 4;
    for (q2 = 0; q2 < n; q2++) {
      var ia = ccw ? q2 : (q2 + 1) % n, ib = ccw ? (q2 + 1) % n : q2;
      var ax = p[2 * ia], az = p[2 * ia + 1], bx = p[2 * ib], bz = p[2 * ib + 1], el = Math.hypot(bx - ax, bz - az); if (el < 0.05) continue;
      // outward normal: with the outline counter-clockwise in (x, z) the outside is to the right of each edge
      var nx = (bz - az) / el, nz = -(bx - ax) / el;
      if (!ccw) { nx = -nx; nz = -nz; }
      cbQuad(bb, [bx, 0, bz], [ax, 0, az], [ax, h, az], [bx, h, bz], [nx, 0, nz], [(acc2 + el) / tw, 0, acc2 / tw, h / th], col);
      acc2 += el;
    }
    cbFlat(bRf.get(cx, cz), p, h, 6);
    if (h < 40 && area > 70 && b.k !== 3 && b.k !== 4 && R() < 0.8) { var nh = Math.min(6, 1 + Math.floor(area / 160)); for (var hh = 0; hh < nh; hh++) heaters.push([cx + (R() - 0.5) * Math.sqrt(area) * 0.5, h, cz + (R() - 0.5) * Math.sqrt(area) * 0.5, R() * 0.4]); }
  });
  C.facMeshes = [];
  bF.forEach(function (b, i4) { C.facMeshes = C.facMeshes.concat(cbFlush(scene, b, M.fac[i4], { cast: hi })); });
  cbFlush(scene, bRf, M.roof, { cast: false });
  // solar water heaters (a white tank and a dark panel) on the roofs: one instanced mesh each
  if (heaters.length) {
    var tankG = new THREE.CylinderGeometry(0.32, 0.32, 1.4, 8); tankG.rotateZ(Math.PI / 2); tankG.translate(0, 0.9, -0.4);
    var panG = new THREE.BoxGeometry(1.1, 0.06, 1.8); panG.rotateX(-0.5); panG.translate(0, 0.55, 0.5);
    var tank = new THREE.InstancedMesh(tankG, lam({ color: 0xF2F2EE }), heaters.length), pan = new THREE.InstancedMesh(panG, new THREE.MeshPhongMaterial({ color: 0x1D2C4A, shininess: 80 }), heaters.length), mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
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
      signs.push([cxp, 2.75 + m2 * 0.42, czp, -C.E.dz[it.e], C.E.dx[it.e], 1.5, 0.38, 0, idx, 1]);
    });
  }
  // traffic signs on the right side of the road, facing the drivers coming toward the point
  var ts = cbTrafficSigns();
  function roadside(x, z, maxd, slot, hgt) {
    var nr2 = C.near(x, z, maxd || 8); if (!nr2) return null; var rd2 = C.roads[nr2.road];
    var dir = rd2.ow < 0 ? -1 : 1, dx2 = nr2.dx * dir, dz2 = nr2.dz * dir, rx2 = -dz2, rz2 = dx2, off = rd2.w / 2 + 0.9;
    var px = nr2.x + rx2 * off - dx2 * 4, pz = nr2.z + rz2 * off - dz2 * 4;
    poles.push([px, pz, hgt || 2.4]); signs.push([px, (hgt || 2.4) - 0.35, pz, -dx2, -dz2, 0.7, 0.7, 1, slot, 0]);
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
    var boxes = new THREE.InstancedMesh(box, lam({ color: 0x23262B }), lights.length), lampG = new THREE.SphereGeometry(0.11, 8, 6);
    var mk = function (y) { var g2 = lampG.clone(); g2.translate(0, y, 0.17); return g2; };
    C.lampMesh = [mk(3.67), mk(3.35), mk(3.03)].map(function (g3) { var im = new THREE.InstancedMesh(g3, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }), lights.length); scene.add(im); return im; });
    var m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one2 = new THREE.Vector3(1, 1, 1);
    lights.forEach(function (lt, i6) { q4.setFromAxisAngle(up, lt.h); m4.compose(new THREE.Vector3(lt.x, 0, lt.z), q4, one2); boxes.setMatrixAt(i6, m4); C.lampMesh.forEach(function (im) { im.setMatrixAt(i6, m4); }); });
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
    lamps.forEach(function (lp, i7) { q5.setFromAxisAngle(up2, lp[2]); m5.compose(new THREE.Vector3(lp[0], 0, lp[1]), q5, o5); lpM.setMatrixAt(i7, m5); arM.setMatrixAt(i7, m5); C.lampHeads.setMatrixAt(i7, m5); });
    scene.add(lpM); scene.add(arM); scene.add(C.lampHeads);
  }
  // poles for the signs
  if (poles.length) { var pm = new THREE.InstancedMesh(poleG, lam({ color: 0x9AA0A6 }), poles.length), m6 = new THREE.Matrix4(); poles.forEach(function (p2, i8) { m6.makeScale(1, p2[2], 1); m6.setPosition(p2[0], 0, p2[1]); pm.setMatrixAt(i8, m6); }); scene.add(pm); }
  // bus shelters
  if (shelters.length) {
    var shG = new THREE.BoxGeometry(3.2, 0.12, 1.5); shG.translate(0, 2.5, 0); var bkG = new THREE.BoxGeometry(3.2, 2.2, 0.06); bkG.translate(0, 1.3, -0.7);
    var shM = new THREE.InstancedMesh(shG, lam({ color: 0x2F6FC0 }), shelters.length), bkM = new THREE.InstancedMesh(bkG, new THREE.MeshLambertMaterial({ color: 0xBFD9F2, transparent: true, opacity: 0.55 }), shelters.length), m7 = new THREE.Matrix4(), q7 = new THREE.Quaternion(), up3 = new THREE.Vector3(0, 1, 0), o7 = new THREE.Vector3(1, 1, 1);
    shelters.forEach(function (s2, i9) { q7.setFromAxisAngle(up3, s2[2]); m7.compose(new THREE.Vector3(s2[0], 0, s2[1]), q7, o7); shM.setMatrixAt(i9, m7); bkM.setMatrixAt(i9, m7); });
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
    trees.forEach(function (t3, i10) { m8.makeScale(t3[2], t3[2], t3[2]); m8.setPosition(t3[0], 0, t3[1]); tM.setMatrixAt(i10, m8); cM.setMatrixAt(i10, m8); col2.setHSL(0.24 + R() * 0.06, 0.45, 0.32 + R() * 0.1); cM.setColorAt(i10, col2); });
    cM.castShadow = hi; scene.add(tM); scene.add(cM);
  }
  if (palms.length) {
    var ptG = new THREE.CylinderGeometry(0.14, 0.22, 7, 6); ptG.translate(0, 3.5, 0); var lf = new THREE.ConeGeometry(2.6, 1.2, 7, 1, true); lf.translate(0, 6.9, 0);
    var pT = new THREE.InstancedMesh(ptG, lam({ color: 0x8A6B47 }), palms.length), pL = new THREE.InstancedMesh(lf, new THREE.MeshLambertMaterial({ color: 0x3E7A34, side: THREE.DoubleSide }), palms.length), m9 = new THREE.Matrix4();
    palms.forEach(function (p3, i11) { m9.makeScale(p3[2], p3[2], p3[2]); m9.setPosition(p3[0], 0, p3[1]); pT.setMatrixAt(i11, m9); pL.setMatrixAt(i11, m9); });
    scene.add(pT); scene.add(pL);
  }
  C.M = M;
  return C;
}

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
  function size() { var w = innerWidth, h = innerHeight; R.setPixelRatio(Math.min(devicePixelRatio || 1, G.hi ? 1.5 : 1, 2600 / Math.max(w, h))); R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  addEventListener("resize", size); size();
  cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); setTimeout(function () { location.reload(); }, 600); });

  // ---------- screens ----------
  var SCR = ["menu", "garage", "track", "settings", "results", "champ", "pause", "loading", "city"];
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
  $("gPick").onclick = function () { var c = CARS[gi]; if (stars() < c.star) return; S.car = c.id; save(); if (MODE === "city") CM.screen(); else trackScreen(); };
  $("gBack").onclick = function () { if (MODE === "city") CM.screen(); else menu(); };

  // ---------- menu ----------
  var MODE = "quick";
  function menu() {
    if (CM && CM.on) CM.exit(true);
    show("menu"); G.state = null; endScene(); if (MODE === "city") MODE = "quick";
    $("mStars").textContent = "⭐ " + stars() + " כוכבים · " + CARS.filter(function (c) { return stars() >= c.star; }).length + "/" + CARS.length + " רכבים";
    $("mCar").textContent = "🚗 " + CAR_BY[S.car].n;
  }
  [].forEach.call(document.querySelectorAll("[data-mode]"), function (b) { b.onclick = function () { sndInit(); MODE = b.dataset.mode; if (MODE === "champ") trackScreen(); else trackScreen(); }; });
  $("mGarage").onclick = function () { sndInit(); garage(); };
  $("mCity").onclick = function () { sndInit(); MODE = "city"; CM.screen(); };
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
    if (CM.on) {
      if (e.code === "KeyC") { S.set.cam = (S.set.cam + 1) % 3; save(); }
      if (e.code === "KeyR") CM.resetCar();
      if (e.code === "Escape" || e.code === "KeyP") pause();
      CM.key(e.code);
      if (/Arrow|Space/.test(e.code)) e.preventDefault();
      return;
    }
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
  $("tbPause").onclick = pause; $("tbCam").onclick = function () { S.set.cam = (S.set.cam + 1) % 3; save(); }; $("tbReset").onclick = function () { if (CM.on) CM.resetCar(); else resetCar(); };
  function pause() {
    if (CM.on) { var cw = CM.W; if (!cw) return; if (cw.paused && !$("s-pause").hidden) { CM.pause(0); show(null); } else if (!cw.paused) { CM.pause(1); show("pause"); } return; }
    if (!W || W.state === "done") return; if (W.paused) { W.paused = 0; show(null); return; } W.paused = 1; show("pause");
  }
  $("pCont").onclick = pause; $("pRestart").onclick = function () { if (CM.on) CM.start(); else start(W.T.id); }; $("pExit").onclick = function () { CH = null; if (CM.on) CM.exit(); else menu(); };

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
    var por = innerHeight > innerWidth, dist = (mode === 1 ? 12 : 7.2 + sp * 0.025) * (por ? 1.3 : 1), hgt = (mode === 1 ? 4.6 : 2.7 + sp * 0.006) + (por ? 0.9 : 0);
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
    if (CM.on) { acc = CM.frame(dt, acc); requestAnimationFrame(frame); return; }
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
  document.addEventListener("visibilitychange", function () { if (document.hidden && ((W && G.state === "race" && !W.paused && W.state !== "done") || (CM.on && CM.W && !CM.W.paused))) pause(); });
  // the open city (citymode.js) shares the renderer, the camera, the controls and the screens
  var CM = cityMode({ R: R, cam: cam, input: input, show: show, S: S, save: save, menu: menu, garage: garage });
  menu(); requestAnimationFrame(frame);
  window.__race = { get W() { return W; }, CM: CM, start: start, menu: menu, S: S, setMode: function (m) { MODE = m; }, sim: function (sec) { for (var i = 0; i < sec * 60 && W; i++) step(1 / 60); if (W) hud(); } };
})();
