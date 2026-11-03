// HaniaDat's siddur: the weekday prayers by nusach, read from Sefaria's open texts (and cached here).
// Ashkenaz and Sefard: The Metsudah Siddur (1981), CC-BY. Edot HaMizrach: Torat Emet, public domain.
//   GET /api/siddur/toc?n=ashkenaz&p=shacharit  → { sections: [{ ref, he }], hallel: [{ ref, he }], source }
//   GET /api/siddur/text?n=ashkenaz&ref=...     → { paras: [html] }   (only <b>, <i>, <small>, <big>, <br> kept)

const NUS = {
  ashkenaz: { book: "Siddur Ashkenaz", ver: "The Metsudah siddur, 1981", src: "סידור מצודה (1981), דרך ספריא · CC-BY", path: { shacharit: ["Weekday", "Shacharit"], mincha: ["Weekday", "Minchah"], arvit: ["Weekday", "Maariv"] } },
  sefard: { book: "Siddur Sefard", ver: "The Metsudah siddur, 1981", src: "סידור מצודה נוסח ספרד (1981), דרך ספריא · CC-BY", path: { shacharit: ["Weekday Shacharit"], mincha: ["Weekday Mincha"], arvit: ["Weekday Maariv"] } },
  mizrach: { book: "Siddur Edot HaMizrach", ver: "Torat Emet 357", src: "סידור עדות המזרח, תורת אמת, דרך ספריא · נחלת הכלל", path: { shacharit: ["Weekday Shacharit"], mincha: ["Weekday Mincha"], arvit: ["Weekday Arvit"] } },
};
const UA = { "user-agent": "HaniaDat/1 (+https://dat.hania360.com)", accept: "application/json" };
const json = (o, s = 200, ttl = 0) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": ttl ? "public, max-age=" + ttl : "no-store" } });

async function cached(key, ttl, make) {
  const cache = caches.default, k = new Request("https://dat.hania360.com/__siddur/" + encodeURIComponent(key));
  const hit = await cache.match(k).catch(() => null);
  if (hit) return hit.json();
  const val = await make();
  if (val) await cache.put(k, new Response(JSON.stringify(val), { headers: { "content-type": "application/json", "cache-control": "public, max-age=" + ttl } })).catch(() => {});
  return val;
}
const title = (node, lang) => ((node.titles || []).find((t) => t.lang === lang && t.primary) || {}).text || "";
async function index(book) {
  return cached("index:" + book, 7 * 86400, async () => {
    const r = await fetch("https://www.sefaria.org/api/v2/raw/index/" + encodeURIComponent(book.replace(/ /g, "_")), { headers: UA });
    return r.ok ? r.json() : null;
  });
}
// The leaves under a node, in order, with their reference and a Hebrew heading.
function leaves(node, prefix, heTrail, out) {
  const en = title(node, "en"), he = title(node, "he"), ref = en ? prefix + ", " + en : prefix;
  if (node.nodes && node.nodes.length) { for (const k of node.nodes) leaves(k, ref, he || heTrail, out); }
  else out.push({ ref, he: heTrail && he && heTrail !== he ? heTrail + " · " + he : he || heTrail });
  return out;
}
function find(nodes, path) {
  let cur = { nodes }, trail = [];
  for (const p of path) { cur = (cur.nodes || []).find((n) => title(n, "en") === p); if (!cur) return null; trail.push(p); }
  return { node: cur, trail };
}
function findByTitle(node, re, trail) {
  for (const k of node.nodes || []) {
    const t = title(k, "en"), tr = trail.concat([t]);
    if (re.test(t)) return { node: k, trail: tr };
    const f = findByTitle(k, re, tr); if (f) return f;
  }
  return null;
}
function clean(s) {
  return String(s || "").replace(/<(?!\/?(b|i|small|big|br)\b)[^>]*>/gi, "").replace(/<(\/?)(b|i|small|big|br)\b[^>]*>/gi, "<$1$2>").replace(/&nbsp;/g, " ").trim();
}

export async function siddurApi(req, url) {
  const n = url.searchParams.get("n"), cfg = NUS[n];
  if (!cfg) return json({ error: "nusach" }, 400);
  const what = url.pathname.split("/").pop();
  try {
    if (what === "toc") {
      const p = url.searchParams.get("p"); if (!cfg.path[p]) return json({ error: "prayer" }, 400);
      const idx = await index(cfg.book); if (!idx) return json({ error: "source" }, 502);
      const f = find(idx.schema.nodes, cfg.path[p]); if (!f) return json({ error: "missing" }, 502);
      const sections = (f.node.nodes || [f.node]).flatMap((k) => leaves(k, cfg.book + ", " + f.trail.join(", "), "", []));
      const h = findByTitle(idx.schema, /^Hallel$/, []), hallel = h ? leaves(h.node, cfg.book + ", " + h.trail.slice(0, -1).join(", "), "", []) : [];
      return json({ sections, hallel, source: cfg.src }, 200, 86400);
    }
    if (what === "text") {
      const ref = String(url.searchParams.get("ref") || "");
      if (!ref.startsWith(cfg.book + ", ") || ref.length > 200) return json({ error: "ref" }, 400);
      const val = await cached("text:" + n + ":" + ref, 30 * 86400, async () => {
        const r = await fetch("https://www.sefaria.org/api/v3/texts/" + encodeURIComponent(ref) + "?version=" + encodeURIComponent("hebrew|" + cfg.ver), { headers: UA });
        if (!r.ok) return null;
        const j = await r.json(), v = (j.versions || [])[0];
        if (!v) return { paras: [] };
        const flat = []; (function walk(x) { if (Array.isArray(x)) x.forEach(walk); else if (typeof x === "string" && x.trim()) flat.push(clean(x)); })(v.text);
        return { paras: flat.filter(Boolean) };
      });
      return val ? json(val, 200, 86400) : json({ error: "source" }, 502);
    }
  } catch (e) { return json({ error: "source" }, 502); }
  return json({ error: "not found" }, 404);
}
