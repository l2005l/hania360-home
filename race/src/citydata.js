// HaniaRace's open city ("עיר פתוחה"): real Israeli streets. The maps come from OpenStreetMap (© OpenStreetMap
// contributors, ODbL) and the heights from open terrain tiles (SRTM and others, via AWS Open Data), prepared by
// tools/pbf2city.py, tools/osm2city.py and tools/elev.py into race/city/<id>.json: local metres around the city centre
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
var CITY_V = "@CITYV@"; // the maps' version (race/build.py)
// road kinds (from osm2city.py): 1 highway, 2 main, 3 secondary, 4 tertiary, 5 street, 6 shared street, 7 service lane
var ROAD_W = [0, 15, 13, 11, 9.5, 7.5, 5.5, 4.6], ROAD_V = [0, 90, 60, 55, 50, 40, 25, 20];

function cityRead(D) {
  var C = { D: D, name: D.name, names: D.names || [], R: D.r };
  var vs = D.verts, nv = vs.length / 2, VX = new Float32Array(nv), VZ = new Float32Array(nv);
  for (var i = 0; i < nv; i++) { VX[i] = vs[2 * i] / 10; VZ[i] = vs[2 * i + 1] / 10; }
  C.VX = VX; C.VZ = VZ; C.nv = nv;
  // heights (tools/elev.py): metres above the lowest point of the map, every `step` metres; the sea is at -min
  C.hAt = function () { return 0; }; C.seaY = 0;
  if (D.elev && D.elev.h) {
    var el = D.elev, bin = atob(el.h), en = el.n, EH = new Float32Array(en * en);
    for (var q = 0; q < en * en; q++) { var v16 = bin.charCodeAt(2 * q) | (bin.charCodeAt(2 * q + 1) << 8); EH[q] = (v16 << 16 >> 16) / 10; }
    var es = el.step, eL = el.L;
    C.EL = { n: en, step: es, L: eL, H: EH, min: el.min }; C.seaY = -el.min;
    C.hAt = function (x, z) {
      var fx = (x + eL) / es, fz = (z + eL) / es;
      if (fx < 0) fx = 0; if (fz < 0) fz = 0; if (fx > en - 1.001) fx = en - 1.001; if (fz > en - 1.001) fz = en - 1.001;
      var i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j, o = j * en + i;
      // the same two triangles per square as the ground's mesh (split from (i, j+1) to (i+1, j)), so things stand on it exactly
      if (tx + tz <= 1) return EH[o] + (EH[o + 1] - EH[o]) * tx + (EH[o + en] - EH[o]) * tz;
      return EH[o + en + 1] + (EH[o + en] - EH[o + en + 1]) * (1 - tx) + (EH[o + 1] - EH[o + en + 1]) * (1 - tz);
    };
  }
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
  // places; a name that doesn't suit a family game is dropped (the sign then says only what the place is)
  var BADNAME = /sex|erot|adult|xxx|porn|סקס|ארוט|מין |vape|smoke|טבק|סיגר|casino|קזינו|הימור|weed|קנאביס|cannabis/i;
  C.poi = (D.poi || []).map(function (p) { var nm = p[1] >= 0 ? C.names[p[1]] : ""; if (BADNAME.test(nm)) nm = ""; return { k: p[0], name: nm, x: p[2] / 10, z: p[3] / 10, chain: !!p[4] }; });
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
