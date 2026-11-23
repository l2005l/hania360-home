// How fast and how heavy every app is (node tools/perf.mjs <bundle dir> [--json out.json]).
// Same harness as tools/check.mjs: every page served by this very worker from the wrangler dry-run bundle, with the
// internet shut off, on a phone-sized screen with the processor slowed four times (like a mid-range phone).
// For each page: bytes by kind, requests, time to first paint and to the largest paint, blocking time (long tasks),
// DOM size, errors, and whether it has a manifest and a service worker. Nothing here touches the live site.
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DRY = path.resolve(process.argv[2] || path.join(ROOT, "dist"));

// The worker bundle, made importable here (as in check.mjs): the Durable Object base class stubbed, text files inlined.
let code = fs.readFileSync(path.join(DRY, "worker.js"), "utf8");
fs.writeFileSync(path.join(DRY, "cfstub.mjs"), "export class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }\n");
code = code.replace(/from "cloudflare:workers";/g, 'from "./cfstub.mjs";');
code = code.replace(/import (\w+) from "\.\/([\w.-]+\.(?:txt|html))";/g, (m, name, file) => "const " + name + " = " + JSON.stringify(fs.readFileSync(path.join(DRY, file), "utf8")) + ";");
fs.writeFileSync(path.join(DRY, "check-worker.mjs"), code);
globalThis.caches = { default: { match: async () => null, put: async () => {} } };
const W = (await import(path.join(DRY, "check-worker.mjs"))).default;

// Every app the worker answers for, read from worker.js itself, so a new app is checked without touching this file.
const src = fs.readFileSync(path.join(ROOT, "worker.js"), "utf8");
const hosts = [...new Set([...src.matchAll(/url\.hostname === "([a-z0-9]+\.hania360\.com)"/g)].map((m) => m[1]))].filter((h) => h !== "www.hania360.com");
const OWNER_ONLY = new Set(["ai.hania360.com", "kasefet.hania360.com"]);
const pages = [["hania360.com", "/"], ["hania360.com", "/classic"], ["kids.hania360.com", "/"], ["bayit.hania360.com", "/"], ["yahadut.hania360.com", "/"]].concat(hosts.map((h) => [h, "/"]));

// Static files live under public/_a/<host>; a few hosts borrow another's folder (STATIC_HOST in worker.js).
const alias = {}; { const m = /const STATIC_HOST = (\{[^}]*\})/.exec(src); if (m) Object.assign(alias, JSON.parse(m[1])); }
// Bindings (Durable Objects, KV): every one answers "{}", so pages that read state on the server still render.
const SECRETS = /OWNER|KEY|TOKEN|SECRET|MODEL|PASS$/;
const fakeNs = () => { const stub = { fetch: async () => new Response("{}", { headers: { "content-type": "application/json" } }) }; return { idFromName: () => "id", idFromString: () => "id", newUniqueId: () => "id", get: () => stub, getByName: () => stub, fetch: stub.fetch }; };
const ENV = new Proxy({}, { get: (t, k) => (typeof k !== "string" || SECRETS.test(k) || !/^[A-Z][A-Z0-9_]*$/.test(k) ? undefined : (t[k] = t[k] || fakeNs())) });
const quiet = [/Failed to load resource/i, /net::ERR/i, /ERR_FAILED/i, /favicon/i, /status of 404/i, /Content Security Policy/i, /service ?worker/i, /Notification/i];
const browser = await chromium.launch();
const rows = [];
for (const [host, p] of pages) {
  const first = await W.fetch(new Request("https://" + host + p), ENV, { waitUntil() {}, passThroughOnException() {} }).catch(() => null);
  if (!first || first.status >= 300 && first.status < 400 || OWNER_ONLY.has(host)) continue;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: "block", locale: "he-IL", timezoneId: "Asia/Jerusalem", isMobile: true, hasTouch: true });
  const page = await ctx.newPage(), errs = [], bytes = { html: 0, js: 0, css: 0, img: 0, font: 0, data: 0, other: 0 }, ext = new Set();
  let reqs = 0;
  page.on("pageerror", (e) => errs.push("error: " + String(e.message).slice(0, 160)));
  page.on("console", (m) => { if (m.type() === "error" && !quiet.some((q) => q.test(m.text()))) errs.push("console: " + m.text().slice(0, 160)); });
  await page.addInitScript(() => {
    window.__perf = { lcp: 0, cls: 0, tbt: 0, long: 0 };
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); } catch (e) {}
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value; }).observe({ type: "layout-shift", buffered: true }); } catch (e) {}
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__perf.long++; window.__perf.tbt += Math.max(0, e.duration - 50); } }).observe({ type: "longtask", buffered: true }); } catch (e) {}
  });
  const cdp = await ctx.newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.route("**/*", async (route) => {
    const u = new URL(route.request().url()); reqs++;
    if (!/(^|\.)hania360\.com$/.test(u.hostname)) { ext.add(u.hostname); return route.fulfill({ status: 404, body: "" }); }
    let body, type = "";
    const f = path.join(ROOT, "public/_a", alias[u.hostname] || u.hostname, decodeURIComponent(u.pathname));
    if (u.pathname !== "/" && fs.existsSync(f) && fs.statSync(f).isFile()) { body = fs.readFileSync(f); }
    else {
      try {
        const req = new Request(u.href, { method: route.request().method(), headers: route.request().headers(), body: ["GET", "HEAD"].includes(route.request().method()) ? undefined : route.request().postDataBuffer() });
        const res = await W.fetch(req, ENV, { waitUntil() {}, passThroughOnException() {} });
        type = res.headers.get("content-type") || ""; body = Buffer.from(await res.arrayBuffer());
        const headers = {}; res.headers.forEach((v, k) => { if (k !== "content-security-policy") headers[k] = v; });
        count(u.pathname, type, body.length);
        return route.fulfill({ status: res.status, headers, body });
      } catch (e) { return route.fulfill({ status: 500, body: "" }); }
    }
    count(u.pathname, type, body.length);
    return route.fulfill({ status: 200, body });
  });
  function count(p, type, n) {
    const k = /html/.test(type) || p === "/" ? "html" : /\.m?js$/.test(p) || /javascript/.test(type) ? "js" : /\.css$/.test(p) ? "css" : /\.(png|jpe?g|webp|gif|svg|ico)$/.test(p) || /image/.test(type) ? "img" : /\.(woff2?|ttf)$/.test(p) ? "font" : /json|^\/api\//.test(type + p) ? "data" : "other";
    bytes[k] += n;
  }
  const t0 = Date.now();
  try { await page.goto("https://" + host + p, { waitUntil: "load", timeout: 30000 }); await page.waitForTimeout(2500); } catch (e) { errs.push("load: " + String(e.message).slice(0, 120)); }
  const m = await page.evaluate(() => {
    const n = performance.getEntriesByType("navigation")[0] || {}, fcp = (performance.getEntriesByName("first-contentful-paint")[0] || {}).startTime || 0;
    const html = document.documentElement.outerHTML;
    return { dcl: Math.round(n.domContentLoadedEventEnd || 0), load: Math.round(n.loadEventEnd || 0), fcp: Math.round(fcp), lcp: Math.round(window.__perf.lcp), cls: +window.__perf.cls.toFixed(3), tbt: Math.round(window.__perf.tbt), long: window.__perf.long,
      dom: document.getElementsByTagName("*").length, manifest: !!document.querySelector('link[rel="manifest"]'), sw: /serviceWorker\.register/.test(html), inline: [].reduce.call(document.scripts, (s, x) => s + (x.src ? 0 : x.textContent.length), 0) };
  }).catch(() => ({}));
  rows.push(Object.assign({ page: host + p, reqs, kb: Math.round(Object.values(bytes).reduce((a, b) => a + b, 0) / 1024), bytes, ext: [...ext], errs, ms: Date.now() - t0 }, m));
  await ctx.close();
}
await browser.close();
rows.sort((a, b) => b.tbt + b.lcp / 4 - (a.tbt + a.lcp / 4));
const k = (n) => Math.round(n / 1024);
console.log("page".padEnd(30) + " KB   html   js  img  req   FCP   LCP   TBT  long   DOM  CLS   sw  ext  errs");
for (const r of rows) console.log(r.page.padEnd(30) + String(r.kb).padStart(4) + String(k(r.bytes.html)).padStart(6) + String(k(r.bytes.js)).padStart(5) + String(k(r.bytes.img)).padStart(5) + String(r.reqs).padStart(5) + String(r.fcp).padStart(6) + String(r.lcp).padStart(6) + String(r.tbt).padStart(6) + String(r.long).padStart(6) + String(r.dom).padStart(6) + String(r.cls).padStart(5) + (r.sw ? "   ✓" : "   ✗") + String(r.ext.length).padStart(5) + "  " + (r.errs.length ? r.errs.join(" | ").slice(0, 120) : ""));
const out = process.argv.indexOf("--json"); if (out > 0) fs.writeFileSync(process.argv[out + 1], JSON.stringify(rows, null, 1));
