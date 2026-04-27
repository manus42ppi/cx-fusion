// Client-side error logging for the autonomous improvement loop.

// Fingerprint = stable key for a recurring error (type + message prefix + page)
function fingerprint(type, message, page) {
  const msg = (message || "").slice(0, 60).replace(/https?:\/\/[^\s]+/g, "<url>").replace(/\d+/g, "N");
  return `${type}::${msg}::${page}`;
}

const _recentFps = new Map(); // fingerprint → timestamp (dedup within session)

export async function logError(type, message, context = {}) {
  const page = window.location.hash || window.location.pathname;
  const fp   = fingerprint(type, message, page);

  // Deduplicate: same fingerprint within 60 seconds → skip
  const last = _recentFps.get(fp) || 0;
  if (Date.now() - last < 60_000) return;
  _recentFps.set(fp, Date.now());

  try {
    await fetch("/improve-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type, message, context, page,
        fingerprint: fp,
        ua: navigator.userAgent.slice(0, 80),
        ts: new Date().toISOString(),
      }),
    });
  } catch {}
}

// Convenience wrappers
export const logWarn  = (msg, ctx) => logError("warning", msg, ctx);
export const logInfo  = (msg, ctx) => logError("info",    msg, ctx);
