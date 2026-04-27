// In-memory circuit breaker — prevents hammering broken targets
const breakers = new Map();

export function canAttempt(key, maxFails = 3, cooldownMs = 5 * 60 * 1000) {
  const b = breakers.get(key);
  if (!b) return true;
  if (b.open && Date.now() - b.lastFail > cooldownMs) {
    breakers.delete(key); return true;
  }
  return !b.open;
}

export function recordSuccess(key) {
  breakers.delete(key);
}

export function recordFailure(key, maxFails = 3) {
  const b = breakers.get(key) || { fails: 0, lastFail: 0, open: false };
  b.fails++; b.lastFail = Date.now();
  if (b.fails >= maxFails) b.open = true;
  breakers.set(key, b);
  return b.open;
}

export function getStatus() {
  return Object.fromEntries(
    [...breakers.entries()].map(([k, v]) => [k, { ...v, since: new Date(v.lastFail).toISOString() }])
  );
}
