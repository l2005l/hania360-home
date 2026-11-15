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
