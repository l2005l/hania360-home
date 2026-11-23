/* A tiny stand-in for the few parts of HaniaDat's calendar library (258 KB) that HaniaMatalot,
   HaniaFit and HaniaLimud use to keep reminders out of Shabbat and holidays: sunset and nightfall for a
   place (NOAA's formula, within about a minute) and the Hebrew month and day (the browser's own Hebrew
   calendar). The same names and month numbers as the library: HB.Location, HB.Zmanim(..).shkiah() and
   .tzeit(deg), HB.HDate(d).getMonth() (Nisan 1 … Tishrei 7 … Adar 12, Adar II 13) and .getDate(). */
(function () {
  if (window.HB) return;
  var R = Math.PI / 180;
  // the moment the sun is `alt` degrees below the horizon in the evening of d's calendar day (local)
  function evening(d, lat, lon, alt) {
    var base = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()), n = Math.floor((base - Date.UTC(d.getFullYear(), 0, 0)) / 864e5);
    var g = 2 * Math.PI / 365 * (n - 1 + 0.5);
    var eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    var la = lat * R, x = Math.cos((90 + alt) * R) / (Math.cos(la) * Math.cos(dec)) - Math.tan(la) * Math.tan(dec);
    var ha = Math.acos(Math.max(-1, Math.min(1, x))) / R;
    return new Date(base + (720 - 4 * (lon - ha) - eq) * 6e4);
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
