/* A tiny stand-in for the few parts of HaniaDat's calendar library (258 KB) that HaniaMatalot,
   HaniaFit and HaniaLimud use to keep reminders out of Shabbat and holidays: sunset and nightfall for a
   place (NOAA's full solar equations, within a second of the library) and the Hebrew month and day (the browser's own Hebrew
   calendar). The same names and month numbers as the library: HB.Location, HB.Zmanim(..).shkiah() and
   .tzeit(deg), HB.HDate(d).getMonth() (Nisan 1 … Tishrei 7 … Adar 12, Adar II 13) and .getDate(). */
(function () {
  if (window.HB) return;
  var R = Math.PI / 180;
  // the moment the sun is `alt` degrees below the horizon in the evening of d's calendar day (local), with NOAA's full
  // solar equations, as the library computes them (within a second)
  function evening(d, lat, lon, alt) {
    var y = d.getFullYear(), mo = d.getMonth() + 1, dd = d.getDate(), Y = y, M = mo; if (M <= 2) { Y -= 1; M += 12; }
    var A = Math.floor(Y / 100), jd = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + dd + 2 - A + Math.floor(A / 4) - 1524.5;
    function jc(j) { return (j - 2451545) / 36525; } function jdOf(t) { return t * 36525 + 2451545; }
    function L0(t) { var l = (280.46646 + t * (36000.76983 + 0.0003032 * t)) % 360; return l < 0 ? l + 360 : l; }
    function Ma(t) { return 357.52911 + t * (35999.05029 - 0.0001537 * t); } function ecc(t) { return 0.016708634 - t * (0.000042037 + 0.0000001267 * t); }
    function C(t) { var m = Ma(t) * R; return Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(2 * m) * (0.019993 - 0.000101 * t) + Math.sin(3 * m) * 0.000289; }
    function app(t) { return L0(t) + C(t) - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * t) * R); }
    function obl(t) { return 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60 + 0.00256 * Math.cos((125.04 - 1934.136 * t) * R); }
    function dec(t) { return Math.asin(Math.sin(obl(t) * R) * Math.sin(app(t) * R)) / R; }
    function eqt(t) { var e = ecc(t), l0 = L0(t) * R, m = Ma(t) * R, q = Math.pow(Math.tan(obl(t) * R / 2), 2); return 4 / R * (q * Math.sin(2 * l0) - 2 * e * Math.sin(m) + 4 * e * q * Math.sin(m) * Math.cos(2 * l0) - 0.5 * q * q * Math.sin(4 * l0) - 1.25 * e * e * Math.sin(2 * m)); }
    function ha(sd) { var la = lat * R, s = sd * R; return -Math.acos(Math.max(-1, Math.min(1, Math.cos((90 + alt) * R) / (Math.cos(la) * Math.cos(s)) - Math.tan(la) * Math.tan(s)))) / R; }
    var W = -lon, t0 = jc(jd);
    var noon = 720 + W * 4 - eqt(jc(jdOf(t0) - 0.5 + (720 + W * 4 - eqt(jc(jdOf(t0) + W / 360))) / 1440));
    var u = 720 + 4 * (W - ha(dec(jc(jd + noon / 1440)))) - eqt(jc(jd + noon / 1440)), nt = jc(jdOf(t0) + u / 1440);
    u = 720 + 4 * (W - ha(dec(nt))) - eqt(nt);
    return new Date(Math.floor((Date.UTC(y, mo - 1, dd) + u * 6e4) / 1000) * 1000);
  }
  function Location(lat, lon) { this.lat = +lat; this.lon = +lon; }
  function Zmanim(loc, d) { this.l = loc; this.d = new Date(d); }
  Zmanim.prototype.shkiah = function () { return evening(this.d, this.l.lat, this.l.lon, 0.833); };
  Zmanim.prototype.tzeit = function (deg) { return evening(this.d, this.l.lat, this.l.lon, deg == null ? 8.5 : +deg); };
  var M = { Nisan: 1, Iyar: 2, Iyyar: 2, Sivan: 3, Tamuz: 4, Tammuz: 4, Av: 5, Elul: 6, Tishri: 7, Tishrei: 7, Heshvan: 8, Cheshvan: 8, Kislev: 9, Tevet: 10, Shevat: 11, "Sh'vat": 11, Shvat: 11, "Adar I": 12, Adar: 12, "Adar II": 13 };
  var F = null; try { F = new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long" }); } catch (e) {}
  function HDate(d) {
    this.m = 0; this.dd = 0;
    if (!F) return;
    var p = F.formatToParts(new Date(d)), mon = "", day = 0;
    for (var i = 0; i < p.length; i++) { if (p[i].type === "month") mon = p[i].value; if (p[i].type === "day") day = +p[i].value; }
    this.m = M[mon] || 0; this.dd = day;
  }
  HDate.prototype.getMonth = function () { return this.m; };
  HDate.prototype.getDate = function () { return this.dd; };
  window.HB = { Location: Location, Zmanim: Zmanim, HDate: HDate, lite: 1 };
})();
