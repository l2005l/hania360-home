// HaniaTV's live finder: which official YouTube channels are live right now, and with which video.
// YouTube's own "live_stream?channel=" embed often shows "unavailable" even while a channel is live, so the server
// looks at each channel's public pages and returns the live video ids. Cached at the edge for a few minutes.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36";
const H = { "user-agent": UA, "accept-language": "en-US,en;q=0.8", cookie: "CONSENT=YES+1; SOCS=CAI" };

function fromStreams(h) {
  // The channel's "Live" tab: every video card whose badge says LIVE.
  const out = [], re = /"videoId":"([\w-]{11})"/g; let m;
  while ((m = re.exec(h))) {
    const seg = h.slice(m.index, m.index + 5000), next = seg.indexOf('"videoId":"', 20), card = next > 0 ? seg.slice(0, next) : seg;
    if (/"style":"LIVE"|"label":"LIVE"|BADGE_STYLE_TYPE_LIVE_NOW/.test(card) && out.indexOf(m[1]) < 0) out.push(m[1]);
    if (out.length >= 3) break;
  }
  return out;
}
function fromLive(h) {
  const i = h.indexOf('"videoDetails":{"videoId":"');
  if (i >= 0) { const d = h.slice(i, i + 8000); if (/"isLive":true/.test(d) || /"isLiveContent":true/.test(d) && /"isLiveNow":true/.test(h)) return h.slice(i + 27, i + 38); }
  const c = h.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/);
  if (c && /"isLive":true|"isLiveNow":true/.test(h)) return c[1];
  return "";
}
async function get(u) { try { const r = await fetch(u, { headers: H, cf: { cacheTtl: 120 } }); return r.ok ? await r.text() : ""; } catch (e) { return ""; } }

export async function liveOne(id, debug) {
  const a = await get("https://www.youtube.com/channel/" + id + "/live");
  let v = fromLive(a), via = "live";
  let list = v ? [v] : [];
  if (!v || debug) {
    const b = await get("https://www.youtube.com/channel/" + id + "/streams");
    const s = fromStreams(b);
    if (!v && s.length) { v = s[0]; via = "streams"; list = s; }
    if (debug) return { id, v, via, list, s, alen: a.length, blen: b.length, aLive: /"isLive":true/.test(a), aVD: a.indexOf('"videoDetails"') };
  }
  return v ? { v, list } : null;
}

export async function tvApi(request, env, ctx) {
  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") || "").split(",").filter((x) => /^UC[\w-]{22}$/.test(x)).slice(0, 40);
  if (url.searchParams.get("debug")) return Response.json(await Promise.all(ids.slice(0, 6).map((i) => liveOne(i, true))));
  const key = new Request("https://tv.hania360.com/api/tv/live?ids=" + ids.join(","));
  const hit = await caches.default.match(key); if (hit) return hit;
  const res = await Promise.all(ids.map((i) => liveOne(i).catch(() => null)));
  const out = {}; ids.forEach((i, k) => { out[i] = res[k]; });
  const r = new Response(JSON.stringify({ at: Date.now(), live: out }), { headers: { "content-type": "application/json", "cache-control": "public, max-age=240" } });
  ctx && ctx.waitUntil && ctx.waitUntil(caches.default.put(key, r.clone()));
  return r;
}
