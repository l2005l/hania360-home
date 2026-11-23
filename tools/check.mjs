// The automatic check before every update (.github/workflows/check.yml, also runnable locally:
// node tools/check.mjs <bundle dir>). It opens every app of hania360.com in a phone-sized browser, served by this
// very worker (from the wrangler dry-run bundle), with the internet shut off, and fails if a page throws an error,
// stays empty, or an owner-only app opens to strangers. Nothing here touches the live site.
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DRY = path.resolve(process.argv[2] || path.join(ROOT, "dist"));

// The worker bundle, made importable here: the Durable Object base class stubbed, text files inlined.
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
const failed = [], report = [];
for (const [host, p] of pages) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, serviceWorkers: "block", locale: "he-IL", timezoneId: "Asia/Jerusalem" });
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", (e) => errs.push("error: " + String(e.message).slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error" && !quiet.some((q) => q.test(m.text()))) errs.push("console: " + m.text().slice(0, 200)); });
  let status = 0;
  await page.route("**/*", async (route) => {
    const u = new URL(route.request().url());
    if (!/(^|\.)hania360\.com$/.test(u.hostname)) return route.fulfill({ status: 404, body: "" });
    const f = path.join(ROOT, "public/_a", alias[u.hostname] || u.hostname, decodeURIComponent(u.pathname));
    if (u.pathname !== "/" && fs.existsSync(f) && fs.statSync(f).isFile()) return route.fulfill({ status: 200, body: fs.readFileSync(f) });
    try {
      const req = new Request(u.href, { method: route.request().method(), headers: route.request().headers(), body: ["GET", "HEAD"].includes(route.request().method()) ? undefined : route.request().postDataBuffer() });
      const res = await W.fetch(req, ENV, { waitUntil() {}, passThroughOnException() {} });
      const headers = {}; res.headers.forEach((v, k) => { if (k !== "content-security-policy") headers[k] = v; });
      return route.fulfill({ status: res.status, headers, body: Buffer.from(await res.arrayBuffer()) });
    } catch (e) { errs.push("worker: " + String(e && e.message).slice(0, 200)); return route.fulfill({ status: 500, body: "" }); }
  });
  // a host that only forwards elsewhere: check where it goes, without opening it
  const first = await W.fetch(new Request("https://" + host + p), ENV, { waitUntil() {}, passThroughOnException() {} }).catch(() => null);
  if (first && first.status >= 300 && first.status < 400) {
    const to = first.headers.get("location") || "";
    report.push([host + p + " → " + to.replace(/^https:\/\//, ""), first.status, 0, 0, /^https:\/\/[a-z0-9.]*hania360\.com\//.test(to) ? 0 : 1]);
    if (!/^https:\/\/[a-z0-9.]*hania360\.com\//.test(to)) failed.push([host + p, ["forwards to an unexpected address: " + to]]);
    await ctx.close(); continue;
  }
  const t0 = Date.now();
  try {
    const r = await page.goto("https://" + host + p, { waitUntil: "load", timeout: 20000 });
    status = r ? r.status() : 0;
    await page.waitForTimeout(1200);
  } catch (e) { errs.push("load: " + String(e.message).slice(0, 160)); }
  const ms = Date.now() - t0;
  const text = await page.evaluate(() => (document.body ? document.body.innerText : "").trim().length).catch(() => 0);
  if (OWNER_ONLY.has(host)) { if (status === 200) errs.push("owner-only app opened without an account (status 200)"); }
  else {
    if (status !== 200) errs.push("status " + status);
    if (text < 40) errs.push("the page is empty (" + text + " characters)");
  }
  report.push([host + p, status, ms, text, errs.length]);
  if (errs.length) failed.push([host + p, errs]);
  await ctx.close();
}
await browser.close();
for (const r of report) console.log((r[4] ? "✗ " : "✓ ") + r[0].padEnd(34) + " " + r[1] + "  " + String(r[2]).padStart(5) + "ms  " + r[3] + " chars");
if (failed.length) {
  console.log("\n" + failed.length + " page(s) failed:");
  for (const [p, e] of failed) { console.log("• " + p); for (const x of e) console.log("    " + x); }
  process.exit(1);
}
console.log("\nAll " + report.length + " pages opened cleanly.");
