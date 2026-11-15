// The data for the Hania360 home-screen widget (the Android app in android/): GET /api/widget?c=<town index>.
// One small JSON: the day and Hebrew date, the coming Shabbat (candle lighting and its end, by the town), the next
// holiday, the weather now, the dollar, and two breaking headlines. Cached for a few minutes per town.

import { CITIES } from "../lib/cities.js";
import { fxRates, newsItems } from "./live.js";
import { widgetMe } from "./wlink.js";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const TZ = "Asia/Jerusalem";
const hm = (t) => new Date(t).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const ymd = (t) => new Date(t).toLocaleDateString("en-CA", { timeZone: TZ });

// The time the sun is `alt` degrees from the horizon in the evening, on the Israeli calendar day `day` (YYYY-MM-DD). NOAA, about a minute.
function evening(day, lat, lon, alt) {
  const [y, m, d] = day.split("-").map(Number), base = Date.UTC(y, m - 1, d), n = Math.floor((base - Date.UTC(y, 0, 0)) / 864e5);
  const g = 2 * Math.PI / 365 * (n - 1 + 0.5);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const r = Math.PI / 180, la = lat * r;
  const ha = Math.acos(Math.cos((90 + alt) * r) / (Math.cos(la) * Math.cos(dec)) - Math.tan(la) * Math.tan(dec)) / r;
  return base + (720 - 4 * (lon - ha) - eq) * 60e3;
}
const addDay = (day, k) => { const t = new Date(day + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + k); return t.toISOString().slice(0, 10); };

// Hebrew numerals: 15 -> ט״ו, 5787 -> תשפ״ז
function gem(n) {
  const L = [[400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"], [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"], [50, "נ"], [40, "מ"], [30, "ל"], [20, "כ"], [10, "י"], [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"], [5, "ה"], [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"]];
  n %= 1000; let s = "";
  for (const [v, c] of L) while (n >= v) { if (n === 15 || n === 16) { s += n === 15 ? "טו" : "טז"; n = 0; break; } s += c; n -= v; }
  return s.length > 1 ? s.slice(0, -1) + "״" + s.slice(-1) : s + "׳";
}
function hebDate(t) {
  const p = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }).formatToParts(new Date(t));
  const g = (k) => (p.find((x) => x.type === k) || {}).value || "";
  return gem(+g("day")) + " ב" + g("month").replace(/^ב/, "");
}
// The holidays, by Hebrew date (month names as Intl gives them in English)
const HOL = [["Tishri", 1, "ראש השנה"], ["Tishri", 10, "יום כיפור"], ["Tishri", 15, "סוכות"], ["Tishri", 22, "שמחת תורה"], ["Kislev", 25, "חנוכה"], ["Shevat", 15, "ט״ו בשבט"],
  ["Adar", 14, "פורים"], ["Adar II", 14, "פורים"], ["Nisan", 15, "פסח"], ["Iyar", 18, "ל״ג בעומר"], ["Sivan", 6, "שבועות"], ["Av", 9, "תשעה באב"]];
function nextHoliday(t) {
  const f = new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long", timeZone: TZ });
  for (let i = 0; i < 400; i++) {
    const p = f.formatToParts(new Date(t + i * 864e5)), day = +(p.find((x) => x.type === "day") || {}).value, mon = (p.find((x) => x.type === "month") || {}).value;
    const h = HOL.find((x) => x[0] === mon && x[1] === day);
    if (h) return { n: h[2], days: i };
  }
  return null;
}

async function weather(c) {
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c[1]}&longitude=${c[2]}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FJerusalem&forecast_days=1`);
  if (!r.ok) return null;
  const j = await r.json(), w = j.current.weather_code, day = j.current.is_day;
  const d = w === 0 ? (day ? "☀️ בהיר" : "🌙 בהיר") : w <= 2 ? "⛅ מעונן חלקית" : w === 3 ? "☁️ מעונן" : w <= 48 ? "🌫️ ערפל" : w <= 57 ? "🌦️ טפטוף" : w <= 67 ? "🌧️ גשם" : w <= 82 ? "🌦️ ממטרים" : "⛈️ סופה";
  return { t: Math.round(j.current.temperature_2m), d, hi: Math.round(j.daily.temperature_2m_max[0]), lo: Math.round(j.daily.temperature_2m_min[0]) };
}

export async function widgetApi(url, env) {
  const ci = Math.max(0, Math.min(CITIES.length - 1, parseInt(url.searchParams.get("c") || "0", 10) || 0)), c = CITIES[ci];
  const key = new Request("https://hania360.com/widget-cache/v1/" + ci), hit = await caches.default.match(key);
  const t = url.searchParams.get("t") || "";
  const withMe = async (body) => { if (!t) return body; const o2 = JSON.parse(body); o2.me = await widgetMe(env || {}, t).catch(() => null); return JSON.stringify(o2); };
  if (hit) return new Response(await withMe(await hit.text()), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  const now = Date.now(), today = ymd(now), wd = new Date(today + "T12:00:00Z").getUTCDay();
  // the coming Shabbat: candle lighting on Friday (sunset minus the town's minutes), its end at 8.5° below the horizon on Saturday
  const fri = addDay(today, wd === 6 ? -1 : (5 - wd + 7) % 7), sat = addDay(fri, 1);
  const lit = evening(fri, c[1], c[2], 0.833) - c[3] * 60e3, out = evening(sat, c[1], c[2], 8.5);
  const shab = now >= lit && now < out ? { now: 1, out: hm(out) } : { now: 0, in: hm(lit), out: hm(out), day: wd === 5 ? "היום" : "קודש" };
  const [fx, news, wx] = await Promise.all([fxRates().catch(() => null), newsItems().catch(() => null), weather(c).catch(() => null)]);
  const o = { city: c[0], day: "יום " + DAYS[wd], heb: hebDate(now), greg: new Date(now).toLocaleDateString("he-IL", { day: "numeric", month: "long", timeZone: TZ }),
    shab, chag: nextHoliday(now), wx, usd: fx && fx.usd ? fx.usd.v : null, eur: fx && fx.eur ? fx.eur.v : null, news: (news || []).slice(0, 2).map((x) => x.t), at: hm(now) };
  const body = JSON.stringify(o);
  await caches.default.put(key, new Response(body, { headers: { "cache-control": "max-age=600" } }));
  return new Response(await withMe(body), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
export const WIDGET_CITIES = CITIES.map((c) => c[0]);

// The Android app's signing certificate (SHA-256), so it opens Hania360 pages full-screen (Trusted Web Activity).
// Filled in from android/fingerprint.txt, which the build writes the first time it makes the key.
export const APP_SHA = "C8:DD:A5:3E:07:53:BF:35:BA:6A:44:67:FC:69:EC:98:61:5B:6A:01:AD:30:BE:EE:F6:02:69:53:2C:BC:44:83";
export function assetLinks() {
  const fp = APP_SHA ? [APP_SHA] : [];
  return new Response(JSON.stringify([{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: "com.hania360.app", sha256_cert_fingerprints: fp } }]), { headers: { "content-type": "application/json", "cache-control": "max-age=3600" } });
}
