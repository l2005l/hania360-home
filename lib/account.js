// The optional Hania360 account, shared by the small apps. Who is signed in is asked of Hania Pass
// over a Service Binding (env.PASS) with the browser's own cookie; with no binding it is simply off.
// What a signed-in person keeps here (their flights in HaniaTisa, their cars in HaniaCheck) is
// read by Hania Today through /api/me/summary.

export async function passUser(req, env) {
  if (!env.PASS) return undefined;
  const cookie = req.headers.get("cookie") || "";
  if (!/(^|;\s*)hp_session=/.test(cookie)) return null;
  try {
    const res = await env.PASS.fetch("https://pass.internal/api/session", { headers: { cookie } });
    if (!res.ok) return null;
    const d = await res.json();
    return d && d.signedIn && d.user && typeof d.user.id === "string" ? { id: d.user.id, email: String(d.user.email || "") } : null;
  } catch { return null; }
}

/** Credentialed CORS for Hania360 sites only (Today reads the summary from another subdomain). */
export function hanCors(origin) {
  if (!origin) return null;
  let u; try { u = new URL(origin); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const h = u.hostname, ok = h === "hania360.com" || h.endsWith(".hania360.com") || h.endsWith(".lior-hania.workers.dev");
  return ok ? { "access-control-allow-origin": u.origin, "access-control-allow-credentials": "true", vary: "Origin" } : null;
}
