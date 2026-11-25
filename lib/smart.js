// הבית החכם (smart.hania360.com): a Hebrew front for the family's own Home Assistant. The page talks straight to
// Home Assistant from the phone; its address and key stay on the phone and never reach this server.
import SMART, { FILES as SMART_FILES, IMAGES as SMART_IMAGES } from "../smart/page.js";

const H = { "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };

export function smart(url) {
  const p = url.pathname;
  if (p === "/robots.txt") return new Response("User-agent: *\nAllow: /\nSitemap: https://smart.hania360.com/sitemap.xml\n", { headers: { "content-type": "text/plain" } });
  if (p === "/sitemap.xml") return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://smart.hania360.com/</loc></url></urlset>', { headers: { "content-type": "application/xml" } });
  if (SMART_FILES[p]) { const [type, body] = SMART_FILES[p]; return new Response(body, { headers: { ...H, "content-type": type, "cache-control": p === "/sw.js" ? "no-cache" : "public, max-age=3600" } }); }
  if (SMART_IMAGES[p]) return new Response(Uint8Array.from(atob(SMART_IMAGES[p]), (c) => c.charCodeAt(0)), { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" } });
  if (p === "/" || p === "/index.html") return new Response(SMART, { headers: { ...H, "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
  return Response.redirect("https://smart.hania360.com/", 302);
}
