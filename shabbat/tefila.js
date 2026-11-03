// HaniaDat: what changes in today's prayers (Israel), by nusach: Ashkenaz, Sefard (Chassidim), Edot HaMizrach.
// TEFILA.day(date, nusach, place) → { kind, head, notes, prayers: { shacharit, mincha, arvit }, food }.
// Shacharit and Mincha belong to the Hebrew date of the day; Arvit (in the evening) to the next one.
// Where customs differ between communities, the text says so ("לפי המנהג הרווח").
(function () {
  "use strict";
  var HB = window.HB;
  var NISAN = 1, IYAR = 2, SIVAN = 3, AV = 5, ELUL = 6, TISHREI = 7, CHESHVAN = 8, KISLEV = 9, TEVET = 10, SHVAT = 11;
  var hd = function (d, m, y) { return new HB.HDate(d, m, y); };
  function evs(h) { try { return HB.HebrewCalendar.getHolidaysOnDate(h, true) || []; } catch (e) { return []; } }
  function has(h, re) { return evs(h).some(function (e) { return re.test(e.getDesc()); }); }
  function flag(h, f) { return evs(h).some(function (e) { return e.getFlags() & f; }); }
  var isShabbat = function (h) { return h.getDay() === 6; };
  var isYomTov = function (h) { return flag(h, HB.flags.CHAG); };
  var isRC = function (h) { return flag(h, HB.flags.ROSH_CHODESH); };
  var isCHM = function (h) { return flag(h, HB.flags.CHOL_HAMOED); };
  var adar = function (y) { return HB.HDate.isLeapYear(y) ? 13 : 12; };
  // Chanukah: 25 Kislev and the 7 days after it (into Tevet of the same Hebrew year).
  function isChanukah(h) { var y = h.getFullYear(), a = h.abs() - hd(25, KISLEV, y).abs(); return a >= 0 && a <= 7; }
  function isPurim(h, jlm) { var y = h.getFullYear(); return h.getMonth() === adar(y) && h.getDate() === (jlm ? 15 : 14); }
  function between(h, a, b) { var x = h.abs(); return x >= a.abs() && x <= b.abs(); }
  // Rain: "משיב הרוח" from 22 Tishrei to 14 Nisan; "ותן טל ומטר" in Israel from 7 Cheshvan to 14 Nisan.
  function rain(h) { var y = h.getFullYear(); return between(h, hd(22, TISHREI, y), hd(14, NISAN, y)); }
  function rainAsk(h) { var y = h.getFullYear(); return between(h, hd(7, CHESHVAN, y), hd(14, NISAN, y)); }
  var since = function (h, d, m) { return h.abs() - hd(d, m, h.getFullYear()).abs(); };
  function isAYT(h) { return h.getMonth() === TISHREI && h.getDate() >= 3 && h.getDate() <= 9; }
  function fastName(h) { var f = evs(h).filter(function (e) { return /^(Tzom Gedaliah|Asara B'Tevet|Ta'anit Esther|Tzom Tammuz|Tish'a B'Av)$/.test(e.getDesc()); })[0]; return f ? f.getDesc() : ""; }
  function modern(h) { return evs(h).filter(function (e) { return /^(Yom HaAtzma'ut|Yom Yerushalayim)$/.test(e.getDesc()); }).map(function (e) { return e.getDesc(); })[0] || ""; }

  // Days without Tachanun (the custom most communities in Israel keep).
  function noTachanun(h) {
    var m = h.getMonth(), d = h.getDate(), y = h.getFullYear();
    if (isShabbat(h) || isYomTov(h) || isRC(h) || isCHM(h) || isChanukah(h)) return true;
    if (m === NISAN) return true;
    if (m === IYAR && (d === 14 || d === 18)) return true; // Pesach Sheni, Lag BaOmer
    if (m === SIVAN && d <= 12) return true;
    if (m === AV && (d === 9 || d === 15)) return true;
    if (m === SHVAT && d === 15) return true;
    if ((m === adar(y) || m === 12) && (d === 14 || d === 15)) return true; // Purim, Shushan Purim (and Purim Katan)
    if (m === ELUL && d === 29) return true;
    if (m === TISHREI && (d === 9 || d >= 11)) return true;
    return false;
  }

  function item(t, n, isNew) { return { t: t, n: n || "", isNew: !!isNew }; }

  // What is added in the Amida (and around it) on Hebrew date h, for one prayer.
  function amida(h, prayer, N, jlm) {
    var out = [], y = h.getFullYear();
    if (isShabbat(h) || isYomTov(h)) return out;
    var rc = isRC(h), chm = isCHM(h);
    if (rc || chm) out.push(item("יעלה ויבוא", "ב\"רצה\". שכח? בשחרית ובמנחה חוזרים ל\"רצה\" אם עוד לא סיים, ואחרי סיום התפילה חוזרים לראשה" + (prayer === "arvit" && rc ? ". בערבית של ראש חודש מי ששכח לא חוזר" : "")));
    // Rain and dew
    if (rain(h)) { var n1 = since(h, 22, TISHREI); out.push(item("משיב הרוח ומוריד הגשם", n1 < 30 ? "התחלנו לומר בשמיני עצרת. ב־30 הימים הראשונים כדאי לשים לב במיוחד" : "", n1 < 30)); }
    else { var n2 = since(h, 15, NISAN); out.push(item("מוריד הטל", n2 >= 0 && n2 < 30 ? "הפסקנו את \"משיב הרוח\" בפסח" : "", n2 >= 0 && n2 < 30)); }
    var ask = rainAsk(h), n3 = since(h, 7, CHESHVAN), n4 = since(h, 15, NISAN), fresh = ask ? n3 >= 0 && n3 < 30 : n4 >= 0 && n4 < 30;
    if (N === "mizrach") out.push(item(ask ? "ברך עלינו (נוסח החורף)" : "ברכנו (נוסח הקיץ)", ask ? "מז' בחשוון ועד פסח" : "", fresh));
    else out.push(item(ask ? "ותן טל ומטר לברכה" : "ותן ברכה", ask ? "בברכת השנים, מז' בחשוון ועד פסח" : "", fresh));
    if (isAYT(h)) {
      out.push(item("המלך הקדוש", "במקום \"האל הקדוש\". שכח? חוזר לראש התפילה"));
      out.push(item("המלך המשפט", "במקום \"מלך אוהב צדקה ומשפט\""));
      out.push(item("זכרנו לחיים, מי כמוך, וכתוב לחיים, בספר חיים", "התוספות של עשרת ימי תשובה"));
      out.push(item("עושה השלום", "בסוף התפילה ובקדיש, במקום \"עושה שלום\""));
    }
    if (isChanukah(h)) out.push(item("על הניסים (חנוכה)", "בברכת \"מודים\". שכח? לא חוזר"));
    if (isPurim(h, jlm)) out.push(item("על הניסים (פורים)", "בברכת \"מודים\". שכח? לא חוזר"));
    var fast = fastName(h);
    if (fast) {
      if (fast === "Tish'a B'Av") {
        if (N === "mizrach" || prayer === "mincha") out.push(item("נחם", N === "mizrach" ? "בברכת \"בונה ירושלים\", בכל התפילות של תשעה באב" : "בברכת \"בונה ירושלים\", במנחה"));
        if (N === "mizrach" || prayer === "mincha") out.push(item("עננו", "בברכת \"שומע תפילה\", למי שמתענה"));
      } else if (prayer !== "arvit" && (N === "mizrach" || prayer === "mincha")) out.push(item("עננו", "בברכת \"שומע תפילה\", למי שמתענה" + (N === "mizrach" ? " (בשחרית ובמנחה)" : " (רק במנחה)")));
    }
    return out;
  }

  // Around the Amida: Hallel, Musaf, Tachanun, Avinu Malkeinu, Selichot, Elul.
  function around(h, prayer, N, jlm) {
    var out = [], m = h.getMonth(), d = h.getDate();
    if (isShabbat(h) || isYomTov(h)) return out;
    var rc = isRC(h), chm = isCHM(h), ch = isChanukah(h), fast = fastName(h), mod = modern(h);
    if (prayer === "shacharit") {
      if (ch) out.push(item("הלל שלם", "בברכה"));
      else if (chm && m === TISHREI) out.push(item("הלל שלם", "ולפניו נטילת לולב (לא בשבת), ואחרי מוסף הושענות"));
      else if (chm && m === NISAN) out.push(item("חצי הלל", N === "mizrach" ? "בלי ברכה" : "בברכה"));
      else if (rc) out.push(item("חצי הלל", N === "mizrach" ? "בלי ברכה, כמנהג עדות המזרח" : "בברכה"));
      if (mod) out.push(item("הלל", "יש קהילות שאומרות הלל ב" + (mod === "Yom HaAtzma'ut" ? "יום העצמאות" : "יום ירושלים") + ", לפי המנהג"));
      if (rc || chm) out.push(item("מוסף", rc ? "של ראש חודש" : "של חול המועד"));
      if (chm) out.push(item("בלי תפילין", "בחול המועד לא מניחים תפילין, כמנהג ארץ ישראל"));
      if (fast && fast !== "Tish'a B'Av") out.push(item("סליחות", "של יום הצום"));
      if (fast === "Tish'a B'Av") out.push(item("קינות, ותפילין רק במנחה", "לפי המנהג הרווח"));
      if (m === ELUL && N !== "mizrach" && d <= 28) out.push(item("תקיעת שופר", "אחרי התפילה, בחודש אלול"));
      if (m === ELUL && N === "mizrach" && d >= 2) out.push(item("סליחות", "לפני שחרית, מב' באלול"));
    }
    if ((m === ELUL || (m === TISHREI && d <= 21)) && N !== "mizrach" && prayer !== "arvit") out.push(item("לדוד ה' אורי", "מר\"ח אלול עד הושענא רבה"));
    if (isAYT(h) && prayer !== "arvit") {
      var skip = prayer === "mincha" && (d === 9 || h.getDay() === 5);
      if (!skip) out.push(item("אבינו מלכנו", N === "mizrach" ? "אחרי שחרית, ויש נוהגים גם במנחה" : "אחרי חזרת הש\"ץ"));
    }
    if (fast && fast !== "Tish'a B'Av" && N !== "mizrach" && prayer !== "arvit") out.push(item("אבינו מלכנו", "ביום הצום"));
    if (prayer !== "arvit") {
      var nt = noTachanun(h) || (prayer === "mincha" && noTachanun(h.next()));
      if (nt) out.push(item("בלי תחנון", ""));
      else if (mod) out.push(item("תחנון", "יש קהילות שלא אומרות תחנון היום, לפי המנהג"));
      else if (prayer === "shacharit" && (h.getDay() === 1 || h.getDay() === 4)) out.push(item("קריאת התורה" + (N === "ashkenaz" ? " ו\"והוא רחום\"" : ""), "יום שני וחמישי"));
    }
    return out;
  }

  function omer(hNight, N) {
    var n = hNight.abs() - hd(16, NISAN, hNight.getFullYear()).abs() + 1;
    if (n < 1 || n > 49) return null;
    var t = String(new HB.OmerEvent(hNight, n).getTodayIs("he")).replace(/[֑-ׇ]/g, "");
    if (N === "ashkenaz") t = t.replace("לעומר", "בעומר");
    return item("ספירת העומר: יום " + n, t + ". סופרים אחרי צאת הכוכבים, עם ברכה");
  }

  function day(date, N, place) {
    var jlm = /ירושלים/.test(place || ""), h = new HB.HDate(date), next = h.next(), y = h.getFullYear();
    var res = { kind: isYomTov(h) ? "yomtov" : isShabbat(h) ? "shabbat" : "weekday", prayers: {}, food: [], notes: [] };
    res.prayers.shacharit = amida(h, "shacharit", N, jlm).concat(around(h, "shacharit", N, jlm));
    res.prayers.mincha = amida(h, "mincha", N, jlm).concat(around(h, "mincha", N, jlm));
    var ar = amida(next, "arvit", N, jlm).concat(around(next, "arvit", N, jlm));
    if ((isShabbat(h) || isYomTov(h)) && !isShabbat(next) && !isYomTov(next)) ar.unshift(item("אתה חוננתנו", "הבדלה בתפילה, במוצאי " + (isShabbat(h) ? "שבת" : "החג")));
    var om = omer(next, N); if (om) ar.push(om);
    res.prayers.arvit = ar;
    if (res.kind !== "weekday") res.notes.push(res.kind === "shabbat" ? "היום שבת: סדר התפילה של שבת" + (isRC(h) ? ", עם יעלה ויבוא ומוסף של שבת ראש חודש" : "") : "היום חג: סדר התפילה של החג");
    if (isRC(h) || isCHM(h)) res.food.push("יעלה ויבוא בברכת המזון");
    if (isChanukah(h) || isPurim(h, jlm)) res.food.push("על הניסים בברכת המזון");
    if (res.kind === "weekday" && noTachanun(h) && !isRC(h) && !isCHM(h) && !isChanukah(h)) { /* shown per prayer */ }
    return res;
  }
  // The one change worth a reminder for a prayer, or "" on an ordinary day.
  function headline(list) {
    var special = list.filter(function (x) { return x.isNew || !/^(מוריד הטל|ותן ברכה|ברכנו|משיב הרוח|ותן טל ומטר|ברך עלינו|קריאת התורה|בלי תחנון)/.test(x.t); });
    var newOnes = list.filter(function (x) { return x.isNew; });
    return special.concat(newOnes.filter(function (x) { return special.indexOf(x) < 0; })).map(function (x) { return x.t.replace(/ \(.*\)$/, ""); }).slice(0, 2).join(", ");
  }
  // Plain facts about a prayer (Arvit looks at the night's date), for showing only what is said that day.
  function facts(date, prayer, place) {
    var jlm = /ירושלים/.test(place || ""), h0 = new HB.HDate(date), h = prayer === "arvit" ? h0.next() : h0, f = fastName(h);
    var n = h.abs() - hd(16, NISAN, h.getFullYear()).abs() + 1;
    return { rc: isRC(h), chm: isCHM(h), chanukah: isChanukah(h), purim: isPurim(h, jlm), ayt: isAYT(h), fast: !!f, av9: f === "Tish'a B'Av", rain: rain(h), rainAsk: rainAsk(h),
      omer: prayer === "arvit" && n >= 1 && n <= 49, motzash: prayer === "arvit" && (isShabbat(h0) || isYomTov(h0)), monthu: prayer === "shacharit" && (h.getDay() === 1 || h.getDay() === 4),
      elul: h.getMonth() === ELUL || (h.getMonth() === TISHREI && h.getDate() <= 21), noTach: noTachanun(h) || (prayer === "mincha" && noTachanun(h.next())) };
  }
  // ---- Showing only what is said today, in siddur texts (HTML paragraphs from Sefaria) ----
  var nrm = function (h) { return String(h).replace(/<[^>]+>/g, " ").replace(/[֑-ׇ]/g, "").replace(/\s+/g, " ").trim(); };
  // Is an instruction ("בראש חודש:", "בחורף:", "בליל ראש חודש יש הנוהגים...") true today? null = not a condition.
  function cond(t0, nextT, F) {
    var t = t0.replace(/\([^)]*\)|\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
    if (!t || !(/^(ו?ב|ל|יש |אם |מ)/.test(t) || /אומרים|מוסיפים|אומר כאן|יש לומר|לומר /.test(t))) return null;
    if (/מלבד מוצאי שבת|חוץ ממוצאי שבת/.test(t)) return !F.motzash;
    if (/בחול(?!\s*המועד)|בכל |מלבד|כל השנה|בימות החול/.test(t)) return null;
    if (/חורף|גשמים/.test(t) && /קיץ|החמה/.test(t)) return null;
    var k = function (re) { return re.test(t); }, r = null, or = function (v) { r = (r === true) || v; };
    if (k(/ראש חודש|ראש חדש|ר"ח|ראש החודש|ראש החדש/)) or(F.rc || (k(/חול המועד|חוה"מ/) && F.chm));
    else if (k(/חול המועד|חוה"מ/)) or(F.chm);
    if (k(/חנוכה|חנכה/)) or(F.chanukah);
    if (k(/פורים/)) or(F.purim);
    if (k(/עשרת ימי תשובה|עשי"ת|שבת שובה|ראש השנה עד יום הכפורים/)) or(F.ayt);
    if (k(/תשעה באב|ט' באב/)) or(F.av9); else if (k(/תענית|תעניות|בצום/)) or(F.fast);
    if (k(/מוצאי שבת|מוצ"ש/)) or(F.motzash);
    if (k(/ספירת העומר/)) or(F.omer);
    if (k(/שני וחמישי|ב' וה'/)) or(F.monthu);
    if (k(/חורף|ימות הגשמים/)) r = /טל ומטר|ברך עלינו/.test(nextT) ? F.rainAsk : F.rain;
    if (k(/ימות החמה|קיץ/)) r = /ברכה|ברכנו/.test(nextT) && !/משיב|מוריד/.test(nextT) ? !F.rainAsk : !F.rain;
    if (r !== null && /אין אומרים|לא אומרים|אין לומר|אינו אומר/.test(t)) r = !r;
    return r;
  }
  // Prayer text that belongs only to some days, recognised by its own words.
  function sig(t, F) {
    var short = t.length < 160;
    if (/יעלה ויבו?א/.test(t) && t.length < 900 && !(F.rc || F.chm)) return false;
    if (/בימי מתתיהו?/.test(t) && !F.chanukah) return false;
    if (/בימי מרדכי/.test(t) && !F.purim) return false;
    if (/^ו?על הנסים/.test(t) && !(F.chanukah || F.purim)) return false;
    if (/^עננו/.test(t) && !F.fast) return false;
    if (/^נחם/.test(t) && !F.av9) return false;
    if (short && /^(זכרנו לחיים|מי כמוך אב הרחמ|וכתוב לחיים|וכתב לחיים|בספר חיים)/.test(t) && !F.ayt) return false;
    if (t.length < 40 && /^משיב הרוח ומוריד הגשם/.test(t) && !F.rain) return false;
    if (t.length < 40 && /^מוריד הטל/.test(t) && F.rain) return false;
    if (/^ברך עלינו/.test(t) && !F.rainAsk && t.length > 60) return false;
    if (/^ברכנו /.test(t) && F.rainAsk && t.length > 60) return false;
    if (short && /^ותן טל ומטר/.test(t) && !F.rainAsk) return false;
    if (short && /^ותן ברכה/.test(t) && F.rainAsk) return false;
    return true;
  }
  // A paragraph as top-level pieces: <small>…</small> blocks (nested ones included), <br>, and the rest.
  function pieces(h) {
    var out = [], re = /<small\b[^>]*>|<\/small>|<br\s*\/?>/gi, m, depth = 0, start = 0, last = 0;
    while ((m = re.exec(h))) {
      var tag = m[0].toLowerCase();
      if (tag.indexOf("<br") === 0) { if (depth === 0) { if (m.index > last) out.push({ k: "t", h: h.slice(last, m.index) }); out.push({ k: "br", h: m[0] }); last = re.lastIndex; } continue; }
      if (tag === "</small>") { if (depth > 0 && --depth === 0) { out.push({ k: "s", h: h.slice(start, re.lastIndex) }); last = re.lastIndex; } continue; }
      if (depth === 0) { if (m.index > last) out.push({ k: "t", h: h.slice(last, m.index) }); start = m.index; }
      depth++;
    }
    if (last < h.length && depth === 0) out.push({ k: "t", h: h.slice(last) });
    else if (depth > 0) out.push({ k: "t", h: h.slice(start) });
    return out;
  }
  var blank = function (p) { return p.k === "t" && !nrm(p.h); };
  // Inside one paragraph: an instruction in small letters, and the words it covers.
  function inline(h, F) {
    var ps = pieces(h), out = [], i = 0;
    while (i < ps.length) {
      var p = ps[i];
      if (p.k !== "s") { out.push(p.h); i++; continue; }
      var txt = nrm(p.h), m = txt.match(/^([^:]{2,60}):\s*(.*)$/), head = m ? m[1] : txt, rest = m ? m[2] : "";
      var after = ps.slice(i + 1).map(function (x) { return nrm(x.h); }).join(" ").slice(0, 80);
      var c = head.length <= 70 ? cond(head, after || rest, F) : null;
      if (c === null) { out.push(p.h); i++; continue; }
      // The words the instruction covers: the small blocks right after it (up to a blank line), or a few plain words.
      var j = i + 1, cover = [];
      if (!rest || rest.length < 2) {
        while (j < ps.length) {
          var q = ps[j];
          if (q.k === "br" && ps[j + 1] && ps[j + 1].k === "br") break;
          if (q.k === "s" || q.k === "br" || blank(q)) { if (q.k === "s" && cond(nrm(q.h).split(":")[0], "", F) !== null && nrm(q.h).split(":")[0].length <= 70 && cover.length) break; cover.push(j); j++; continue; }
          if (q.k === "t" && !cover.some(function (x) { return ps[x].k === "s"; }) && nrm(q.h).length <= 40) { cover.push(j); j++; continue; }
          break;
        }
        while (cover.length && ps[cover[cover.length - 1]].k !== "s" && ps[cover[cover.length - 1]].k !== "t") cover.pop();
        while (cover.length && blank(ps[cover[cover.length - 1]])) cover.pop();
      }
      if (c === false) { i = cover.length ? cover[cover.length - 1] + 1 : i + 1; while (out.length && /^\s*(<br\s*\/?>)?\s*$/i.test(out[out.length - 1]) && ps[i] && ps[i].k === "br") out.pop(); continue; }
      out.push(rest && rest.length > 1 ? '<span class="ins">' + p.h + "</span>" : p.h);
      if (cover.length) { out.push('<span class="ins">' + cover.map(function (x) { return ps[x].h; }).join("") + "</span>"); i = cover[cover.length - 1] + 1; } else i++;
    }
    return out.join("").replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>").replace(/^(\s*<br\s*\/?>)+|(<br\s*\/?>\s*)+$/gi, "");
  }
  // The paragraphs of a section, each with show (said today?) and ins (an addition for today, to stand out).
  function filter(paras, F) {
    // After an instruction that is false today: hide the block it covers (the small-print paragraphs right after it,
    // or the one line after it, or a whole psalm); after a true one, mark the same block as today's addition.
    var res = [], mode = "", first = false, many = 0, rest = false;
    var small = function (h) { return /^\s*<small/i.test(h); };
    paras.forEach(function (h, idx) {
      var t = nrm(h), show = true, ins = false, html = h, label = false;
      if (rest) {
        if (small(h) || /^(תתקבל|יהא שלמא|עושה שלום)/.test(t)) { res.push({ html: h, show: false }); return; }
        rest = false;
      }
      var c = t.length < 90 ? cond(t, nrm(paras[idx + 1] || ""), F) : null, paren = /^\(.*\)$/.test(t);
      if (c !== null) {
        label = true; show = c;
        var own = /^[^:]{2,60}:\s*\S/.test(t.replace(/\s*:\s*$/, ""));
        if (!c) {
          rest = /מוצאי שבת|מוצ"ש/.test(t) && !/מלבד|חוץ/.test(t);
          if (!rest && !paren && !own && !/\.\.\.|…/.test(t)) { mode = "hide"; first = true; many = /מזמור|תפילה זו|ברכי נפשי|לדוד|פרק|נוהגים לומר/.test(t) ? 1 : 0; }
          else if (own && mode === "hide") { /* stays inside the block it belongs to */ }
          else mode = "";
        } else {
          if (own) ins = !/מלבד|חוץ/.test(t);
          mode = paren || /מלבד|חוץ/.test(t) ? "" : "mark"; first = true; many = 0;
        }
      } else if (mode === "hide") {
        if (many) {
          var stop = /^<(b|big|small)>/.test(h.trim()) || /החזן|הקהל|ואומר|אומרים|קדיש|^לשם יחוד/.test(t) || many > 40;
          if (stop && many > 1) mode = ""; else { show = false; many++; }
        } else if (small(h) || first) { show = false; if (!small(h)) mode = ""; }
        else mode = "";
        first = false;
      } else if (mode === "mark") {
        if (small(h) || first) { ins = true; if (!small(h)) mode = ""; } else mode = "";
        first = false;
      }
      if (show && !label) {
        show = sig(t, F);
        if (show) { html = inline(h, F); if (!nrm(html)) show = false; }
      }
      res.push({ html: html, show: show, ins: ins && show });
    });
    return res;
  }
  window.TEFILA = { day: day, headline: headline, facts: facts, filter: filter };
})();
