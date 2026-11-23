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
