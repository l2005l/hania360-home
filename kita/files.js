// HaniaKita: a worksheet's Word file kept for two weeks behind a link, for phones that cannot share a .docx file
// itself (Chrome on Android shares only images, PDF and text). One Durable Object per file; it deletes itself.
// POST /api/kita/file {name, data (base64 of the .docx)} -> {url}; GET /f/<id> -> the file.

const json = (o, s = 200) => Response.json(o, { status: s, headers: { "cache-control": "no-store" } });
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const KEEP = 14 * 864e5, MAX = 400000;

export class KitaFile {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async fetch(req) {
    if (req.method === "PUT") { const b = await req.json(); await this.ctx.storage.put("f", b); await this.ctx.storage.setAlarm(Date.now() + KEEP); return json({ ok: true }); }
    const f = await this.ctx.storage.get("f");
    if (!f) return new Response("הקובץ כבר לא זמין (קבצים נשמרים שבועיים).", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
    const bin = Uint8Array.from(atob(f.data), (c) => c.charCodeAt(0));
    return new Response(bin, { headers: { "content-type": DOCX, "content-disposition": "attachment; filename=\"worksheet.docx\"; filename*=UTF-8''" + encodeURIComponent(f.name), "cache-control": "private, max-age=3600", "x-content-type-options": "nosniff" } });
  }
  async alarm() { await this.ctx.storage.deleteAll(); }
}

export async function kitaFiles(request, env, url) {
  if (!env.KITAFILE) return json({ error: "not configured" }, 503);
  if (request.method === "POST" && url.pathname === "/api/kita/file") {
    const b = await request.json().catch(() => null);
    if (!b || typeof b.data !== "string" || b.data.length > MAX || !/^[A-Za-z0-9+/=]+$/.test(b.data) || !b.data.startsWith("UEsD")) return json({ error: "bad" }, 400);
    const name = String(b.name || "worksheet.docx").replace(/[\u0000-\u001f\\/:*?"<>|]+/g, " ").trim().slice(0, 70).replace(/(\.docx)?$/i, ".docx");
    const a = new Uint8Array(12); crypto.getRandomValues(a);
    const id = Array.from(a, (x) => "abcdefghijkmnpqrstuvwxyz23456789"[x % 32]).join("");
    await env.KITAFILE.get(env.KITAFILE.idFromName(id)).fetch("https://f/", { method: "PUT", body: JSON.stringify({ name, data: b.data, t: Date.now() }) });
    return json({ url: "https://kita.hania360.com/f/" + id });
  }
  const m = /^\/f\/([a-z2-9]{12})$/.exec(url.pathname);
  if (request.method === "GET" && m) return env.KITAFILE.get(env.KITAFILE.idFromName(m[1])).fetch("https://f/");
  return json({ error: "not found" }, 404);
}
