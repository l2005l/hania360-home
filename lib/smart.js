// הבית החכם (smart.hania360.com): a Hebrew front for the family's own Home Assistant. The page talks straight to
// Home Assistant from the phone; its address and key stay on the phone and never reach this server.
import SMART, { FILES as SMART_FILES, IMAGES as SMART_IMAGES } from "../smart/page.js";

const H = { "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };

export function smart(url) {
  const p = url.pathname;
  if (p === "/robots.txt") return new Response("User-agent: *\nAllow: /\nSitemap: https://smart.hania360.com/sitemap.xml\n", { headers: { "content-type": "text/plain" } });
  if (p === "/sitemap.xml") return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://smart.hania360.com/</loc></url></urlset>', { headers: { "content-type": "application/xml" } });
  // /mini: the house's state on the hania360.com home page, in a frame only that page may hold
  if (p === "/mini") return new Response(SMART_FILES[p][1], { headers: { ...H, "content-type": SMART_FILES[p][0], "cache-control": "public, max-age=300", "content-security-policy": "frame-ancestors https://hania360.com https://www.hania360.com", "x-robots-tag": "noindex" } });
  if (SMART_FILES[p]) { const [type, body] = SMART_FILES[p]; return new Response(body, { headers: { ...H, "content-type": type, "cache-control": p === "/ver" ? "no-store" : p === "/sw.js" ? "no-cache" : "public, max-age=3600" } }); }
  if (SMART_IMAGES[p]) return new Response(Uint8Array.from(atob(SMART_IMAGES[p]), (c) => c.charCodeAt(0)), { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" } });
  if (p === "/" || p === "/index.html") return new Response(SMART, { headers: { ...H, "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" } });
  return Response.redirect("https://smart.hania360.com/", 302);
}

// shigra.hania360.com/hsmart: the kids' routine times (when the morning and evening routines start and end), sent to
// the smart-home app that asked, so the kids' room can follow the same times. The routine itself stays on the phone.
const SHIGRA_TIMES = `<!doctype html><meta charset="utf-8"><title>-</title><script>(function(){if(parent===window)return;var S=null;try{S=JSON.parse(localStorage.getItem("haniashigra-v1")||"null")}catch(e){}
var p=function(n){return("0"+n).slice(-2)},t=function(r){if(!r||!/^\\d\\d?:\\d\\d$/.test(r.at||"")||!Array.isArray(r.steps))return null;var a=r.at.split(":"),m=+a[0]*60+(+a[1]),n=r.steps.reduce(function(x,s){return x+(+s[2]||0)},0),s=((m-n)%1440+1440)%1440;return{at:p(+a[0])+":"+a[1],start:p(Math.floor(s/60))+":"+p(s%60)}};
var r=S&&S.r?S.r:null;parent.postMessage({t:"hania-shigra",m:r?t(r.morning):null,e:r?t(r.evening):null},"https://smart.hania360.com")})()</script>`;
export function shigraTimes() {
  return new Response(SHIGRA_TIMES, { headers: { ...H, "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": "frame-ancestors https://smart.hania360.com", "x-robots-tag": "noindex" } });
}
