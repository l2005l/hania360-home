// לו״ז הצוות (loz.hania360.com): the page, its files, and the calendar file for one event.
// The schedule itself lives only on the manager's device; an event's details reach the server only inside the link of
// /c.ics, to turn them into a calendar file, and are not kept or logged.
import LOZ, { FILES as LOZ_FILES, IMAGES as LOZ_IMAGES } from "../loz/page.js";

const H = { "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };

export function loz(url) {
  const p = url.pathname;
  if (p === "/robots.txt") return new Response("User-agent: *\nAllow: /\nDisallow: /c\nSitemap: https://loz.hania360.com/sitemap.xml\n", { headers: { "content-type": "text/plain" } });
  if (p === "/sitemap.xml") return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://loz.hania360.com/</loc></url></urlset>', { headers: { "content-type": "application/xml" } });
  if (p === "/c.ics") return ics(url);
  if (LOZ_FILES[p]) { const [type, body] = LOZ_FILES[p]; return new Response(body, { headers: { ...H, "content-type": type, "cache-control": p === "/sw.js" ? "no-cache" : "public, max-age=3600" } }); }
  if (LOZ_IMAGES[p]) return new Response(Uint8Array.from(atob(LOZ_IMAGES[p]), (c) => c.charCodeAt(0)), { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" } });
  if (p === "/" || p === "/index.html") return new Response(LOZ, { headers: { ...H, "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
  return Response.redirect("https://loz.hania360.com/", 302);
}

// the event, from the link (base64url of {d, s, e, t, p?, n?, o?, r?})
function event(raw) {
  try {
    let s = String(raw || "").replace(/-/g, "+").replace(/_/g, "/");
    if (s.length > 4000) return null;
    while (s.length % 4) s += "=";
    const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))));
    if (!o || !/^\d{4}-\d{2}-\d{2}$/.test(o.d) || !/^\d{2}:\d{2}$/.test(o.s) || !/^\d{2}:\d{2}$/.test(o.e) || !o.t) return null;
    const str = (v, n) => String(v == null ? "" : v).slice(0, n);
    return { d: o.d, s: o.s, e: o.e, t: str(o.t, 120), p: str(o.p, 80), n: str(o.n, 400), o: str(o.o, 60), r: [10, 15, 30, 60].includes(+o.r) ? +o.r : 0 };
  } catch { return null; }
}

// an Israel wall-clock time as UTC (summer and winter time included)
function utc(d, t) {
  const [y, m, day] = d.split("-").map(Number), [h, mi] = t.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, day, h, mi);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
  const seen = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
  return new Date(guess - (seen - guess));
}
const stamp = (dt) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const txt = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
// lines of at most 75 bytes, continued with a space (RFC 5545)
function fold(line) {
  const enc = new TextEncoder(), out = [];
  let cur = "", n = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; n = 0; }
    cur += ch; n += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function ics(url) {
  const e = event(url.searchParams.get("e"));
  if (!e) return new Response("הקישור לא שלם", { status: 400, headers: { "content-type": "text/plain; charset=utf-8" } });
  const a = utc(e.d, e.s), b = utc(e.d, e.e);
  if (!(b > a)) return new Response("הקישור לא שלם", { status: 400, headers: { "content-type": "text/plain; charset=utf-8" } });
  const uid = [...e.d + e.s + e.t].reduce((h, c) => (h * 33 + c.charCodeAt(0)) >>> 0, 5381).toString(36);
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hania360//loz//HE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${uid}-${e.d}@loz.hania360.com`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(a)}`, `DTEND:${stamp(b)}`, `SUMMARY:${txt(e.t)}`];
  if (e.p) L.push(`LOCATION:${txt(e.p)}`);
  const desc = [e.n, e.o ? "לו״ז " + e.o : ""].filter(Boolean).join("\n");
  if (desc) L.push(`DESCRIPTION:${txt(desc)}`);
  if (e.r) L.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${txt(e.t)}`, `TRIGGER:-PT${e.r}M`, "END:VALARM");
  L.push("END:VEVENT", "END:VCALENDAR");
  return new Response(L.map(fold).join("\r\n") + "\r\n", { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": 'inline; filename="event.ics"', "cache-control": "no-store", "x-robots-tag": "noindex", ...H } });
}
