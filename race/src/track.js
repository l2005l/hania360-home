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
