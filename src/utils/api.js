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

const STORAGE_KEY = "cxf_clients";

export function loadClients() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

export function saveClients(clients) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

const REPORTS_KEY = "cxf_reports";

export function loadReports() {
  try { return JSON.parse(localStorage.getItem(REPORTS_KEY) || "{}"); }
  catch { return {}; }
}

export function saveReport(domain, data) {
  const all = loadReports();
  const savedAt = new Date().toISOString();
  all[domain] = { ...data, savedAt };
  localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
  _addToHistory(domain, "website", savedAt, data);
}

const CONTENT_REPORTS_KEY = "cxf_content_reports";

export function loadContentReports() {
  try { return JSON.parse(localStorage.getItem(CONTENT_REPORTS_KEY) || "{}"); }
  catch { return {}; }
}

export function saveContentReport(domain, data) {
  const all = loadContentReports();
  const savedAt = new Date().toISOString();
  all[domain] = { ...data, savedAt };
  localStorage.setItem(CONTENT_REPORTS_KEY, JSON.stringify(all));
  _addToHistory(domain, "content", savedAt, data);
}

const HISTORY_KEY = "cxf_history";
const HISTORY_MAX = 20;

function _addToHistory(domain, type, savedAt, data) {
  const all = loadClientHistory();
  const existing = all[domain] || [];
  const summary = type === "website"
    ? { traffic: data?.ai?.trafficEstimate?.monthly, score: data?.psi?.score, trendSignal: data?.ai?.trendSignal }
    : { articles: data?.articles?.length, tone: data?.ai?.overallTone, sentiment: data?.ai?.sentimentLabel };
  all[domain] = [{ id: uid(), type, savedAt, summary }, ...existing].slice(0, HISTORY_MAX);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
}

export function loadClientHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}"); }
  catch { return {}; }
}
