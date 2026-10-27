// Web Push without a payload, shared by the small apps: the phone is only woken up, and its
// service worker then asks the app what to show. Needs only a VAPID key pair, kept by the caller.

const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = new TextEncoder();
const HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];

export const okEndpoint = (u) => { try { const x = new URL(u); return x.protocol === "https:" && u.length <= 800 && HOSTS.some((h) => h.test(x.hostname)); } catch { return false; } };
export async function subId(endpoint) { return b64u(await crypto.subtle.digest("SHA-256", enc.encode(endpoint))).slice(0, 32); }

/** The key pair, made once and kept in a Durable Object's storage. */
export async function vapidKeys(storage) {
  let v = await storage.get("vapid");
  if (v) return v;
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  v = { pub: b64u(await crypto.subtle.exportKey("raw", kp.publicKey)), jwk: await crypto.subtle.exportKey("jwk", kp.privateKey) };
  await storage.put("vapid", v);
  return v;
}

/** Wakes the phone. Returns false when the subscription is gone and should be forgotten. */
export async function wake(v, endpoint, subject) {
  const key = await crypto.subtle.importKey("jwk", v.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const part = (o) => b64u(enc.encode(JSON.stringify(o)));
  const body = part({ typ: "JWT", alg: "ES256" }) + "." + part({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject });
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(body));
  try {
    const r = await fetch(endpoint, { method: "POST", headers: { Authorization: "vapid t=" + body + "." + b64u(sig) + ", k=" + v.pub, TTL: "7200", Urgency: "high", "Content-Length": "0" } });
    return !(r.status === 404 || r.status === 410);
  } catch { return true; }
}
