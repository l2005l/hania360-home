// Moves the pictures and the big fixed files out of the Worker into Workers Static Assets (public/_a/<host>/<path>),
// so the Worker itself stays small (its size limit counts every byte of code and of embedded pictures).
// The Worker serves them back at the same addresses (see "Static files" in worker.js), so nothing changes for users.
//
//   node tools/assets.mjs            all the apps (every folder with a page.js)
//   node tools/assets.mjs masach     one app (each app's build.py runs this at its end)
//
// For each app: its IMAGES and every FILES entry over 15 KB are written under public/_a/<its host>/, and page.js is
// written again without them. The host is the page's canonical address.
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "public", "_a");
const BIG = 15000;

function write(host, p, data) {
  const f = path.join(OUT, host, p.replace(/^\/+/, ""));
  if (!f.startsWith(path.join(OUT, host))) throw new Error("bad path " + p);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, data);
}

async function app(dir) {
  const file = path.join(ROOT, dir, "page.js");
  if (!fs.existsSync(file)) return;
  const m = await import(pathToFileURL(file).href + "?t=" + Date.now());
  const extra = Object.keys(m).filter((k) => !["default", "FILES", "IMAGES"].includes(k));
  if (extra.length) { console.log(dir + ": skipped (other exports: " + extra.join(", ") + ")"); return; }
  const canon = /rel="canonical" href="https:\/\/([a-z0-9.-]+)\//.exec(m.default || "");
  const host = canon ? canon[1] : dir + ".hania360.com";
  let moved = 0;
  const images = m.IMAGES || {}, files = Object.assign({}, m.FILES || {});
  for (const [p, b64] of Object.entries(images)) { write(host, p, Buffer.from(b64, "base64")); moved++; }
  for (const [p, v] of Object.entries(files)) {
    const body = Array.isArray(v) ? v[1] : v;
    if (typeof body === "string" && body.length > BIG) { write(host, p, body); delete files[p]; moved++; }
  }
  if (!moved) return;
  // page.js again, the same, without what moved. The first line says where it came from.
  const head = fs.readFileSync(file, "utf8").split("\n")[0];
  const out = [head.startsWith("//") ? head : "// Generated. Do not edit by hand.",
    "// Pictures and big files of this app are in public/_a/" + host + "/ (moved by tools/assets.mjs).",
    "export default " + JSON.stringify(m.default) + ";",
    "export const FILES = " + JSON.stringify(files, null, 0) + ";",
    "export const IMAGES = {};", ""];
  fs.writeFileSync(file, out.join("\n"));
  console.log(dir + " → " + host + ": " + moved + " moved");
}

const only = process.argv[2];
const dirs = only ? [only] : fs.readdirSync(ROOT).filter((d) => fs.existsSync(path.join(ROOT, d, "page.js")));
for (const d of dirs) await app(d);
