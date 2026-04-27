// CORS-Proxy rotation with health tracking and retry-backoff
const PROXIES = [
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

const health = new Map(); // index → { fails, lastFail, avgMs }

function getHealth(i) { return health.get(i) || { fails: 0, lastFail: 0, avgMs: 999 }; }

function sorted() {
  return PROXIES
    .map((fn, i) => ({ fn, i, h: getHealth(i) }))
    .sort((a, b) => {
      // Prefer healthy proxies; among healthy ones, prefer faster ones
      const aDown = a.h.fails >= 3 && Date.now() - a.h.lastFail < 5 * 60 * 1000;
      const bDown = b.h.fails >= 3 && Date.now() - b.h.lastFail < 5 * 60 * 1000;
      if (aDown !== bDown) return aDown ? 1 : -1;
      return a.h.avgMs - b.h.avgMs;
    });
}

export async function fetchWithProxy(url, opts = {}) {
  const tried = [];
  for (const { fn, i } of sorted()) {
    const h = getHealth(i);
    if (h.fails >= 3 && Date.now() - h.lastFail < 5 * 60 * 1000) continue;
    const t0 = Date.now();
    try {
      const r = await fetch(fn(url), { signal: AbortSignal.timeout(12000), ...opts });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const ms = Date.now() - t0;
      health.set(i, { fails: 0, lastFail: 0, avgMs: ms });
      return r;
    } catch (e) {
      health.set(i, { ...h, fails: h.fails + 1, lastFail: Date.now() });
      tried.push(`proxy${i}: ${e.message}`);
    }
  }
  throw new Error(`Alle CORS-Proxies fehlgeschlagen (${tried.join("; ")})`);
}

export function proxyStatus() {
  return PROXIES.map((_, i) => {
    const h = getHealth(i);
    const down = h.fails >= 3 && Date.now() - h.lastFail < 5 * 60 * 1000;
    return { index: i, fails: h.fails, avgMs: h.avgMs, down };
  });
}
