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
