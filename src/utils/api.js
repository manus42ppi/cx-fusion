export function cleanDomain(input) {
  try {
    let d = input.trim().toLowerCase();
    if (!d.startsWith("http")) d = "https://" + d;
    const url = new URL(d);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return input.trim().toLowerCase().replace(/^www\./, "");
  }
}

export async function analyzeDomain(domain) {
  const res = await fetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
  });
  if (!res.ok) throw new Error(`Analyze failed: ${res.status}`);
  return res.json();
}

export function fmtNum(n) {
  if (n == null) return "–";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function fmtDate(iso) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

export function scoreGrade(score) {
  if (score >= 90) return { grade: "A", color: "#10b981" };
  if (score >= 75) return { grade: "B", color: "#6366f1" };
  if (score >= 50) return { grade: "C", color: "#f59e0b" };
  if (score >= 25) return { grade: "D", color: "#f97316" };
  return { grade: "F", color: "#ef4444" };
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// KV helpers – sync with Cloudflare KV (graceful fallback on error / local dev)
// ---------------------------------------------------------------------------

async function kvGet(key) {
  try {
    const res = await fetch(`/store?key=${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const d = await res.json();
    return d.value ?? null;
  } catch {
    return null;
  }
}

async function kvSet(key, value) {
  try {
    await fetch("/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  } catch {}
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const STORAGE_KEY = "cxf_clients";

/** Load from localStorage immediately (sync fast path). */
export function loadClientsSync() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

/**
 * Load clients – tries KV first, falls back to localStorage.
 * Returns a Promise<Array>.
 */
export async function loadClients() {
  const kv = await kvGet(STORAGE_KEY);
  if (kv !== null) {
    // Keep localStorage in sync for offline fallback
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(kv)); } catch {}
    return kv;
  }
  return loadClientsSync();
}

export function saveClients(clients) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  kvSet(STORAGE_KEY, clients);
}

// ---------------------------------------------------------------------------
// Website analysis reports
// ---------------------------------------------------------------------------

const REPORTS_KEY = "cxf_reports";

/** Sync fast path for initial render. */
export function loadReportsSync() {
  try { return JSON.parse(localStorage.getItem(REPORTS_KEY) || "{}"); }
  catch { return {}; }
}

/** Load reports – tries KV first, falls back to localStorage. */
export async function loadReports() {
  const kv = await kvGet(REPORTS_KEY);
  if (kv !== null) {
    try { localStorage.setItem(REPORTS_KEY, JSON.stringify(kv)); } catch {}
    return kv;
  }
  return loadReportsSync();
}

export function saveReport(domain, data) {
  const all = loadReportsSync();
  const savedAt = new Date().toISOString();
  all[domain] = { ...data, savedAt };
  localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
  kvSet(REPORTS_KEY, all);
  _addToHistory(domain, "website", savedAt, data);
  _pushToFullHistory(domain, "website", savedAt, data);
}

// ---------------------------------------------------------------------------
// Content audit reports
// ---------------------------------------------------------------------------

const CONTENT_REPORTS_KEY = "cxf_content_reports";

export function loadContentReportsSync() {
  try { return JSON.parse(localStorage.getItem(CONTENT_REPORTS_KEY) || "{}"); }
  catch { return {}; }
}

export async function loadContentReports() {
  const kv = await kvGet(CONTENT_REPORTS_KEY);
  if (kv !== null) {
    try { localStorage.setItem(CONTENT_REPORTS_KEY, JSON.stringify(kv)); } catch {}
    return kv;
  }
  return loadContentReportsSync();
}

export function saveContentReport(domain, data) {
  const all = loadContentReportsSync();
  const savedAt = new Date().toISOString();
  all[domain] = { ...data, savedAt };
  localStorage.setItem(CONTENT_REPORTS_KEY, JSON.stringify(all));
  kvSet(CONTENT_REPORTS_KEY, all);
  _addToHistory(domain, "content", savedAt, data);
  _pushToFullHistory(domain, "content", savedAt, data);
}

// ---------------------------------------------------------------------------
// Structure-Audit (schema-validate) reports
// ---------------------------------------------------------------------------

const SCHEMA_REPORTS_KEY = "cxf_schema_reports";

export function loadSchemaReportsSync() {
  try { return JSON.parse(localStorage.getItem(SCHEMA_REPORTS_KEY) || "{}"); }
  catch { return {}; }
}

export async function loadSchemaReports() {
  const kv = await kvGet(SCHEMA_REPORTS_KEY);
  if (kv !== null) {
    try { localStorage.setItem(SCHEMA_REPORTS_KEY, JSON.stringify(kv)); } catch {}
    return kv;
  }
  return loadSchemaReportsSync();
}

export function saveSchemaReport(domain, data) {
  const all = loadSchemaReportsSync();
  const savedAt = new Date().toISOString();
  all[domain] = { ...data, savedAt };
  localStorage.setItem(SCHEMA_REPORTS_KEY, JSON.stringify(all));
  kvSet(SCHEMA_REPORTS_KEY, all);
  _addToHistory(domain, "schema", savedAt, data);
  _pushToFullHistory(domain, "schema", savedAt, data);
}

// ---------------------------------------------------------------------------
// Social Intelligence reports
// ---------------------------------------------------------------------------

const SOCIAL_REPORTS_KEY = "cxf_social_reports";

export function loadSocialReportsSync() {
  try { return JSON.parse(localStorage.getItem(SOCIAL_REPORTS_KEY) || "{}"); }
  catch { return {}; }
}

export async function loadSocialReports() {
  const kv = await kvGet(SOCIAL_REPORTS_KEY);
  if (kv !== null) {
    try { localStorage.setItem(SOCIAL_REPORTS_KEY, JSON.stringify(kv)); } catch {}
    return kv;
  }
  return loadSocialReportsSync();
}

export function saveSocialReport(domain, data) {
  const all = loadSocialReportsSync();
  const savedAt = new Date().toISOString();
  all[domain] = { ...data, savedAt };
  localStorage.setItem(SOCIAL_REPORTS_KEY, JSON.stringify(all));
  kvSet(SOCIAL_REPORTS_KEY, all);
  _addToHistory(domain, "social", savedAt, data);
  _pushToFullHistory(domain, "social", savedAt, data);
}

// ---------------------------------------------------------------------------
// Full report history – up to 5 complete reports per domain
// ---------------------------------------------------------------------------

const HISTORY_KEY    = "cxf_history";    // legacy summary (kept for compat)
const FULLHIST_MAX   = 5;

function _fullHistKey(domain) { return `cxf_fullhist_${domain.replace(/\./g, "_")}`; }

/** Load full-report history for one domain (sync, from localStorage). */
export function loadFullHistorySync(domain) {
  try { return JSON.parse(localStorage.getItem(_fullHistKey(domain)) || "[]"); }
  catch { return []; }
}

/** Load full-report history for one domain (async, KV-first). */
export async function loadFullHistory(domain) {
  const kv = await kvGet(_fullHistKey(domain));
  if (kv !== null) {
    try { localStorage.setItem(_fullHistKey(domain), JSON.stringify(kv)); } catch {}
    return kv;
  }
  return loadFullHistorySync(domain);
}

/** Save one full report into the domain's history (keeps last 5). */
function _pushToFullHistory(domain, type, savedAt, data) {
  const key      = _fullHistKey(domain);
  const existing = loadFullHistorySync(domain);

  let summary;
  if (type === "website") {
    summary = { traffic: data?.ai?.trafficEstimate?.monthly, score: data?.pagespeed?.score ?? data?.psi?.score, trendSignal: data?.ai?.trendSignal, category: data?.ai?.category };
  } else if (type === "content") {
    summary = { articles: data?.articles?.length, tone: data?.ai?.overallTone, sentiment: data?.ai?.sentimentLabel };
  } else if (type === "schema") {
    const validCount = data?.pages?.filter(p => p.status === "valid").length ?? 0;
    const warnCount  = data?.pages?.filter(p => p.status === "warning").length ?? 0;
    const errCount   = data?.pages?.filter(p => p.status === "error").length ?? 0;
    const schemaCount = data?.pages?.reduce((s, p) => s + (p.schemas?.length ?? 0), 0) ?? 0;
    summary = { schemaCount, validCount, warnCount, errCount, overallScore: data?.overallScore };
  } else if (type === "social") {
    const activeCount = Object.values(data?.profiles || {}).filter(p => p?.url).length;
    const primaryPlatform = data?.primary_platform ?? null;
    const topFollowers = Math.max(...Object.values(data?.metrics || {}).map(m => m?.followers ?? 0), 0) || null;
    summary = { score: data?.score, activeCount, primaryPlatform, topFollowers };
  } else {
    summary = {};
  }

  const entry = { id: uid(), type, savedAt, summary, data };
  const next  = [entry, ...existing].slice(0, FULLHIST_MAX);

  localStorage.setItem(key, JSON.stringify(next));
  kvSet(key, next);
}

// Legacy compact history (for HistoryPanel count badge)
export function loadClientHistorySync() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}"); }
  catch { return {}; }
}

export async function loadClientHistory() {
  const kv = await kvGet(HISTORY_KEY);
  if (kv !== null) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(kv)); } catch {}
    return kv;
  }
  return loadClientHistorySync();
}

function _addToHistory(domain, type, savedAt, data) {
  const all      = loadClientHistorySync();
  const existing = all[domain] || [];
  let summary;
  if (type === "website") {
    summary = { traffic: data?.ai?.trafficEstimate?.monthly, score: data?.pagespeed?.score ?? data?.psi?.score, trendSignal: data?.ai?.trendSignal };
  } else if (type === "content") {
    summary = { articles: data?.articles?.length, tone: data?.ai?.overallTone, sentiment: data?.ai?.sentimentLabel };
  } else if (type === "schema") {
    summary = { schemaCount: data?.pages?.reduce((s, p) => s + (p.schemas?.length ?? 0), 0) ?? 0, overallScore: data?.overallScore };
  } else if (type === "social") {
    const activeCount = Object.values(data?.profiles || {}).filter(p => p?.url).length;
    const topFollowers = Math.max(...Object.values(data?.metrics || {}).map(m => m?.followers ?? 0), 0) || null;
    summary = { score: data?.score, activeCount, primaryPlatform: data?.primary_platform, topFollowers };
  } else {
    summary = {};
  }
  all[domain] = [{ id: uid(), type, savedAt, summary }, ...existing].slice(0, FULLHIST_MAX);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
  kvSet(HISTORY_KEY, all);
}
