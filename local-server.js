#!/usr/bin/env node
// Local dev API server – replaces Cloudflare Functions for local testing
// Runs on port 8788 (Vite proxies /analyze, /pagespeed etc. to here)

import http from "node:http";
import { readFileSync, existsSync, appendFileSync, writeFileSync, mkdirSync, watch } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { exec } from "node:child_process";

// ─── Auto-apply helpers ────────────────────────────────────────────────────────

function injectBetweenMarkers(content, startMarker, endMarker, newLines) {
  const si = content.indexOf(startMarker);
  const ei = content.indexOf(endMarker);
  if (si === -1 || ei === -1) return content;
  const before   = content.slice(0, si + startMarker.length);
  const after    = content.slice(ei);
  const existing = content.slice(si + startMarker.length, ei);
  // Deduplicate: only add lines that aren't already present
  const toAdd = newLines.filter(l => !existing.includes(l.trim()));
  if (!toAdd.length) return content;
  return before + "\n" + toAdd.join("\n") + "\n" + after;
}

function toPascalCase(str) {
  return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, c => c.toUpperCase());
}

function autoWireFeature(feat, generatedCode) {
  const id            = feat.id.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const componentName = toPascalCase(id) + "Page";
  const icon          = feat.navIcon || "Globe";
  const label         = feat.navLabel || feat.name;
  const desc          = feat.navDesc  || feat.description?.slice(0, 60) || "";
  const fileName      = `feat_${id}.jsx`;

  // 1. Write page file
  const pagePath = path.join(__dir, "src/pages", fileName);
  writeFileSync(pagePath, generatedCode);
  console.log(`[auto-wire] Geschrieben: src/pages/${fileName}`);

  // 2. Update App.jsx
  const appPath = path.join(__dir, "src/App.jsx");
  let app = readFileSync(appPath, "utf8");

  // Add componentName import if missing
  const importLine = `import ${componentName} from "./pages/${fileName}";`;
  if (!app.includes(importLine)) {
    app = injectBetweenMarkers(app,
      "// ─── AUTO_IMPORTS_START ───────────────────────────────────────────────────────",
      "// ─── AUTO_IMPORTS_END ─────────────────────────────────────────────────────────",
      [importLine]
    );
  }
  // Add route — quote key if it contains hyphens (invalid bare JS identifier)
  const routeKey  = /[^a-z0-9_]/i.test(id) ? `"${id}"` : id;
  const routeLine = `    ${routeKey}: <${componentName} />,`;
  if (!app.includes(routeLine) && !app.includes(`"${id}":`)) {
    app = injectBetweenMarkers(app,
      "// ─── AUTO_ROUTES_START ────────────────────────────────────────────────────────",
      "// ─── AUTO_ROUTES_END ──────────────────────────────────────────────────────────",
      [routeLine]
    );
  }
  writeFileSync(appPath, app);
  console.log(`[auto-wire] App.jsx aktualisiert (Route: ${id})`);

  // 3. Update Sidebar.jsx
  const sidebarPath = path.join(__dir, "src/components/layout/Sidebar.jsx");
  let sidebar = readFileSync(sidebarPath, "utf8");
  const navLine = `      { id: "${id}", label: "${label}", icon: ${icon}, desc: "${desc}" },`;
  if (!sidebar.includes(`id: "${id}"`)) {
    sidebar = injectBetweenMarkers(sidebar,
      "// ─── AUTO_NAV_START ─────────────────────────────────────────────────────",
      "// ─── AUTO_NAV_END ───────────────────────────────────────────────────────",
      [navLine]
    );
    writeFileSync(sidebarPath, sidebar);
    console.log(`[auto-wire] Sidebar.jsx aktualisiert (Nav: ${label})`);
  }

  // 4. Update feature-manifest.json
  try {
    const manifest = JSON.parse(readFileSync(path.join(__dir, "feature-manifest.json"), "utf8"));
    if (!manifest.currentFeatures.some(f => f.id === id)) {
      manifest.currentFeatures.push({ id, name: label, desc, page: fileName, addedAt: new Date().toISOString() });
      writeFileSync(path.join(__dir, "feature-manifest.json"), JSON.stringify(manifest, null, 2));
    }
  } catch {}

  return { id, componentName, fileName };
}

// Load .env.local
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const [k, ...v] = line.split("=");
    const key = k?.trim();
    const val = v.join("=").trim();
    // Only set if value is non-empty AND not already set in the environment
    if (key && !key.startsWith("#") && val && !process.env[key]) {
      process.env[key] = val;
    }
  }
}

const PORT = 8788;
const __dir = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE      = path.join(__dir, "improve-log.ndjson");
const REPORT_FILE   = path.join(__dir, "improve-report.json");
const FEATURES_FILE = path.join(__dir, "improve-features.json");
const MANIFEST_FILE = path.join(__dir, "feature-manifest.json");
const PENDING_DIR   = path.join(__dir, "improve-pending");
const AUTO_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours (once per day)

// Ensure staging dir exists
try { mkdirSync(PENDING_DIR, { recursive: true }); } catch {}

// In-memory ring buffer — last 500 error entries
const improveLog = [];
function addImproveEntry(entry) {
  improveLog.push({ ts: Date.now(), ...entry });
  if (improveLog.length > 500) improveLog.shift();
  try { appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n"); } catch {}
}

// ─── Auto-Improvement Engine ───────────────────────────────────────────────
let lastAutoRun  = null;
let nextAutoRun  = Date.now() + AUTO_INTERVAL_MS;

// ─── Feature Research Engine ───────────────────────────────────────────────
let lastResearchRun  = null;
let featureRunning   = false;  // async guard: true while research is in progress
let featureRunError  = null;   // last async error, surfaced via /improve-status

const CODEGEN_SYSTEM = `Du bist ein Senior React-Entwickler für die App "cx-fusion".
WICHTIGE REGELN:
- NUR Inline-Styles (kein CSS, kein Tailwind)
- Farben: import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js"
- UI: import { Card, Btn, Badge } from "../components/ui/index.jsx"
- Icons: import { ... } from "lucide-react"  (strokeWidth={IW} überall)
- Navigation: const { goNav } = useApp() aus "../context/AppContext.jsx"
- KI-Calls: fetch("/ai") mit Fallback auf https://socialflow-pro.pages.dev/ai
- Kein console.log, nur console.error in catch-Blöcken
- Kommentare nur wenn der WHY nicht offensichtlich ist
Erzeuge vollständige, direkt nutzbare React-Komponenten.`;

// Phase 1: Market analysis + gap prioritization (~30s) — returns results to UI immediately
async function runMarketAnalysis(aiKey) {
  console.log("[research] Phase 1: Markt-Analyse gestartet…");
  let manifest = {};
  try { manifest = JSON.parse(readFileSync(MANIFEST_FILE, "utf8")); } catch {}

  const currentFeatures     = manifest.currentFeatures?.map(f => `- ${f.name}: ${f.desc}`).join("\n") || "unbekannt";
  const currentFeatureNames = manifest.currentFeatures?.map(f => f.name).join(", ") || "";
  const competitors         = manifest.competitors?.map(c => `${c.name}: ${c.strengths.join(", ")}`).join("\n") || "";
  const knownGaps           = manifest.knownGaps?.join("\n- ") || "";

  const analysisRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": aiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6", max_tokens: 4096,
      system: `Du bist ein Produkt-Stratege für Web-Intelligence-Tools. Heute ist ${new Date().toLocaleDateString("de-DE")}.
Analysiere Marktlücken und priorisiere Features nach: Nutzer-Impact × Implementierungsaufwand.

ABSOLUTE REGEL: Die folgenden Features sind BEREITS VOLLSTÄNDIG IMPLEMENTIERT.
Sie dürfen unter keinen Umständen in topGaps, quickWins oder nextFeature erscheinen:
${currentFeatureNames}

Antworte NUR mit validem JSON (kein Markdown).
Schema: {
  "marketTrends": string[],
  "topGaps": [{ "id": string, "name": string, "why": string, "competitorHas": string[], "impact": "high"|"medium"|"low", "effort": "low"|"medium"|"high", "priority": number }],
  "quickWins": [{ "id": string, "name": string, "description": string, "uiHint": string }],
  "nextFeature": {
    "id": string,
    "name": string,
    "description": string,
    "targetPage": string,
    "components": string[],
    "navLabel": string,
    "navDesc": string,
    "navIcon": "Globe"|"Shield"|"Zap"|"BarChart2"|"Search"|"Layers"|"Star"|"Code2"|"Globe"
  }
}`,
      messages: [{ role: "user", content: `Produkt: cx-fusion — ${manifest.description || "Web-Intelligence-Plattform"}\nZielgruppe: ${manifest.targetUsers}\n\nBEREITS IMPLEMENTIERTE Features (NICHT als Lücke listen!):\n${currentFeatures}\n\nNoch offene Lücken (nur diese sind relevant):\n- ${knownGaps}\n\nWettbewerber-Features:\n${competitors}\n\nWas sollte als nächstes gebaut werden? Nur Features die NICHT bereits implementiert sind! Fokus auf Quick Wins und hohen Nutzer-Impact.` }],
    }),
    signal: AbortSignal.timeout(50000),
  });
  const analysisData = await analysisRes.json();
  const analysisRaw  = analysisData?.content?.[0]?.text || "{}";
  let analysis = {};
  try { analysis = JSON.parse(analysisRaw.match(/```json\s*([\s\S]*?)```/)?.[1] || analysisRaw.match(/(\{[\s\S]*\})/s)?.[1] || analysisRaw); } catch {}

  const report = {
    generatedAt: Date.now(),
    autoRun: true,
    codegenPending: !!analysis.nextFeature, // signals UI that Phase 2 is still running
    marketTrends: analysis.marketTrends || [],
    topGaps: analysis.topGaps || [],
    quickWins: analysis.quickWins || [],
    nextFeature: analysis.nextFeature || null,
  };

  writeFileSync(FEATURES_FILE, JSON.stringify(report, null, 2));
  lastResearchRun = Date.now();
  console.log(`[research] Phase 1 abgeschlossen — ${report.topGaps.length} Lücken gefunden, starte Phase 2 im Hintergrund…`);
  return { report, analysis };
}

// Phase 2: Code generation + auto-wire (~90s) — runs fully in background, never blocks UI
async function runCodegenBackground(feat, aiKey) {
  console.log(`[codegen] Phase 2: Generiere "${feat.name}" im Hintergrund…`);
  try {
    const codeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": aiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6", max_tokens: 8192,
        system: CODEGEN_SYSTEM,
        messages: [{ role: "user", content: `Implementiere das Feature "${feat.name}" als React-Seite für cx-fusion.
Beschreibung: ${feat.description}
Zielseite: ${feat.targetPage}
Benötigte Komponenten: ${feat.components?.join(", ")}

Gib eine vollständige, funktionierende React-Komponente zurück die:
1. Im Stil der anderen cx-fusion-Seiten aussieht (gleiches Design-System)
2. Die KI via fetch("/ai") nutzt
3. Loading-States, Error-States und Empty-States hat
4. Sofort in App.jsx einbindbar ist

Antworte NUR mit dem vollständigen JSX/JS-Code, ohne Erklärungen.` }],
      }),
      signal: AbortSignal.timeout(120000),
    });
    const codeData = await codeRes.json();
    const rawCode  = codeData?.content?.[0]?.text || "";
    const generatedCode = rawCode.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

    if (generatedCode.length > 200) {
      try { writeFileSync(path.join(PENDING_DIR, `${feat.id}.jsx`), generatedCode); } catch {}
      try {
        autoWireFeature(feat, generatedCode);
        console.log(`[codegen] Phase 2 abgeschlossen: "${feat.name}" eingefügt & Tests laufen…`);
        runTests(); // trigger test run after auto-wire
      } catch (e) { console.error("[codegen] Auto-wire fehlgeschlagen:", e.message); }

      // Update features file: mark codegen as done
      try {
        const saved = JSON.parse(readFileSync(FEATURES_FILE, "utf8"));
        saved.codegenPending = false;
        saved.codegenDoneAt = Date.now();
        writeFileSync(FEATURES_FILE, JSON.stringify(saved, null, 2));
      } catch {}
    }
  } catch (e) {
    console.error("[codegen] Phase 2 Fehler:", e.message);
    try {
      const saved = JSON.parse(readFileSync(FEATURES_FILE, "utf8"));
      saved.codegenPending = false;
      saved.codegenError = e.message;
      writeFileSync(FEATURES_FILE, JSON.stringify(saved, null, 2));
    } catch {}
  }
}

// Entrypoint: Phase 1 first, Phase 2 fires-and-forgets
async function runFeatureResearch(aiKey) {
  const { report, analysis } = await runMarketAnalysis(aiKey);
  // Phase 2 starts immediately in background — does not block caller
  if (analysis.nextFeature) {
    runCodegenBackground(analysis.nextFeature, aiKey).catch(() => {});
  }
  return report;
}

async function runAutoImprovement() {
  const entries = improveLog.filter(e => e.type !== "_ping");
  const aiKey = process.env.ANTHROPIC_API_KEY;
  if (!aiKey) { console.error("[improve] ANTHROPIC_API_KEY nicht gesetzt — übersprungen"); return; }

  // Run both in parallel: error analysis + feature research
  await Promise.allSettled([
    runErrorAnalysis(entries, aiKey),
    runFeatureResearch(aiKey),
  ]);
}

async function runErrorAnalysis(entries, aiKey) {
  if (entries.length === 0) { console.log("[improve] Keine Fehler geloggt — übersprungen"); return; }
  console.log(`[improve] Fehler-Analyse gestartet (${entries.length} Einträge)…`);
  const logText = entries.slice(-80)
    .map(e => `[${new Date(e.ts).toISOString()}] ${e.type}: ${e.message}${e.context ? " | " + JSON.stringify(e.context) : ""}${e.fingerprint ? " | fp:" + e.fingerprint : ""}`)
    .join("\n");
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": aiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6", max_tokens: 6000,
        system: `Du bist ein Senior-Entwickler für "cx-fusion" (React 18, Vite, Cloudflare Pages, Anthropic Claude, NUR Inline-Styles, kein TypeScript, kein Zod).
Antworte NUR mit validem JSON (kein Markdown).
Schema: {
  "patterns": [{ "type": string, "count": number, "severity": "low"|"medium"|"high", "description": string }],
  "suggestions": [{
    "priority": "P1"|"P2"|"P3",
    "title": string,
    "description": string,
    "file": string,
    "problem": string,
    "solution": string,
    "code": string,
    "autoApply": boolean,
    "utilityFile": string|null
  }]
}
Wichtig: autoApply=true NUR für neue Utility-Files in src/utils/ (sicher anwendbar ohne existierende Dateien zu verändern).
utilityFile = Dateiname z.B. "my-fix.js" wenn code ein komplettes neues Utility-Modul ist.`,
        messages: [{ role: "user", content: `Fehler-Log (${entries.length} Einträge):\n\n${logText}\n\nAnalysiere Muster und schlage Verbesserungen vor. Für wiederholte Fehler: autoApply=true mit vollständigem Utility-JS-Code.` }],
      }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await res.json();
    const raw  = data?.content?.[0]?.text || "{}";
    const parsed = JSON.parse(raw.match(/```json\s*([\s\S]*?)```/)?.[1] || raw.match(/(\{[\s\S]*\})/s)?.[1] || raw);

    // Auto-apply utility files flagged by AI
    const applied = [];
    for (const s of parsed.suggestions || []) {
      if (!s.autoApply || !s.utilityFile || !s.code) continue;
      const utilPath = path.join(__dir, "src/utils", s.utilityFile);
      if (existsSync(utilPath)) continue; // never overwrite existing
      try {
        writeFileSync(utilPath, s.code);
        applied.push(s.utilityFile);
        console.log(`[improve] Auto-applied utility: src/utils/${s.utilityFile}`);
      } catch (e) { console.error(`[improve] Konnte ${s.utilityFile} nicht schreiben:`, e.message); }
    }

    writeFileSync(REPORT_FILE, JSON.stringify({
      ...parsed, logCount: entries.length, generatedAt: Date.now(), autoRun: true, autoApplied: applied,
    }, null, 2));
    nextAutoRun = Date.now() + AUTO_INTERVAL_MS;
    console.log(`[improve] Fehler-Report gespeichert — ${parsed.suggestions?.length ?? 0} Vorschläge, ${applied.length} auto-applied`);
  } catch (e) { console.error("[improve] Fehler-Analyse fehlgeschlagen:", e.message); }
}

setInterval(() => { nextAutoRun = Date.now() + AUTO_INTERVAL_MS; runAutoImprovement(); }, AUTO_INTERVAL_MS);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function respond(res, data, status = 200) {
  res.writeHead(status, CORS);
  res.end(JSON.stringify(data));
}

async function body(req) {
  return new Promise(resolve => {
    let s = "";
    req.on("data", c => s += c);
    req.on("end", () => { try { resolve(JSON.parse(s)); } catch { resolve({}); } });
  });
}

// ─── PageSpeed Insights ────────────────────────────────────────────────────
async function pagespeed(domain) {
  const key = process.env.PSI_API_KEY ? `&key=${process.env.PSI_API_KEY}` : "";
  const base = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://${domain}`;
  const extract = d => {
    const err = d?.error?.message;
    if (err) {
      const quotaError = err.includes("Quota") || err.includes("quota");
      return { error: quotaError ? "quota" : err, performance: null, accessibility: null, seo: null, bestPractices: null };
    }
    const c = d?.lighthouseResult?.categories;
    const a = d?.lighthouseResult?.audits;
    return {
      performance:   Math.round((c?.performance?.score   || 0) * 100),
      accessibility: Math.round((c?.accessibility?.score || 0) * 100),
      seo:           Math.round((c?.seo?.score           || 0) * 100),
      bestPractices: Math.round((c?.["best-practices"]?.score || 0) * 100),
      lcp:  a?.["largest-contentful-paint"]?.displayValue,
      cls:  a?.["cumulative-layout-shift"]?.displayValue,
      fid:  a?.["interactive"]?.displayValue,
      ttfb: a?.["server-response-time"]?.displayValue,
      fcp:  a?.["first-contentful-paint"]?.displayValue,
    };
  };
  try {
    const [mob, desk] = await Promise.all([
      fetch(base + `&strategy=mobile${key}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      fetch(base + `&strategy=desktop${key}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
    ]);
    return { mobile: extract(mob), desktop: extract(desk) };
  } catch (e) {
    return { mobile: { error: String(e) }, desktop: { error: String(e) } };
  }
}

// ─── PageRank (OpenPageRank – optional key) ────────────────────────────────
async function pagerank(domain) {
  const key = process.env.OPENPAGERANK_KEY;
  if (!key) return { rank: null, rankDecimal: null, note: "No OPENPAGERANK_KEY set" };
  const r = await fetch(`https://openpagerank.com/api/v1.0/getPageRank?domains[]=${domain}`, {
    headers: { "API-OPR": key },
  });
  const d = await r.json();
  const e = d?.response?.[0];
  return { rank: e?.page_rank_integer ?? null, rankDecimal: e?.page_rank_decimal ?? null };
}

// ─── Domain-Info (Wayback CDX + RDAP) ────────────────────────────────────
async function whois(domain) {
  const result = { registrar: null, createdDate: null, expiresDate: null, nameservers: [], status: null, country: null, firstSeen: null };

  // 1. Wayback CDX – first ever snapshot (reliable for domain age)
  try {
    const r = await fetch(
      `https://web.archive.org/cdx/search/cdx?url=${domain}&output=json&limit=1&fl=timestamp&matchType=domain&collapse=timestamp:4`,
      { signal: AbortSignal.timeout(12000), headers: { "User-Agent": "CXFusion-Bot/1.0" } }
    );
    const text = await r.text();
    const d = JSON.parse(text);
    const ts = d?.[1]?.[0];
    if (ts && ts.length >= 8) {
      result.firstSeen = `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)}`;
      result.createdDate = result.firstSeen;
    }
  } catch (e) { console.error("Wayback CDX error:", e.message); }

  // 2. RDAP via IANA bootstrap – works for .com, .net, .org, .io etc.
  try {
    const r = await fetch(`https://rdap.iana.org/domain/${domain}`, {
      redirect: "follow",
      headers: { "Accept": "application/rdap+json" },
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const d = await r.json();
      const events = d?.events || [];
      const getDate = (type) => events.find(e => e.action === type)?.date?.split("T")[0] ?? null;
      const ns = (d?.nameservers || []).map(n => n.ldhName?.toLowerCase()).filter(Boolean);
      const regEntity = d?.entities?.find(e => e.roles?.includes("registrar"));
      const fn = regEntity?.vcardArray?.[1]?.find?.(v => v[0] === "fn")?.[3];

      if (getDate("registration")) result.createdDate = getDate("registration");
      if (getDate("expiration"))  result.expiresDate  = getDate("expiration");
      if (getDate("last changed")) result.updatedDate  = getDate("last changed");
      if (ns.length) result.nameservers = ns.slice(0, 4);
      if (fn) result.registrar = fn;
      if (d?.status) result.status = Array.isArray(d.status) ? d.status[0] : d.status;
    }
  } catch { /* ignore – many TLDs like .de are not supported */ }

  // 3. DNS nameserver lookup via public DNS-over-HTTPS (Google)
  try {
    const r = await fetch(`https://dns.google/resolve?name=${domain}&type=NS`, { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    if (d?.Answer && !result.nameservers.length) {
      result.nameservers = d.Answer.map(a => a.data?.replace(/\.$/, "").toLowerCase()).filter(Boolean).slice(0, 4);
    }
  } catch { /* ignore */ }

  return result;
}

// ─── Common Crawl CDX ──────────────────────────────────────────────────────
async function crawl(domain) {
  try {
    // Count pages indexed for this domain across two recent crawls
    // Query both with and without www to catch more pages
    const [r1, r2, r3] = await Promise.allSettled([
      fetch(`https://index.commoncrawl.org/CC-MAIN-2024-51-index?url=*.${domain}/*&output=json&limit=500&fl=url`, { signal: AbortSignal.timeout(12000) }).then(r => r.text()),
      fetch(`https://index.commoncrawl.org/CC-MAIN-2024-51-index?url=${domain}/*&output=json&limit=500&fl=url`, { signal: AbortSignal.timeout(12000) }).then(r => r.text()),
      fetch(`https://index.commoncrawl.org/CC-MAIN-2024-38-index?url=*.${domain}/*&output=json&limit=500&fl=url`, { signal: AbortSignal.timeout(12000) }).then(r => r.text()),
    ]);
    const count = (p) => p.status === "fulfilled" ? p.value.trim().split("\n").filter(Boolean).length : 0;
    const indexedPages = Math.max(count(r1) + count(r2), count(r3));
    return { indexedPages };
  } catch (e) {
    return { error: String(e), indexedPages: 0 };
  }
}

// ─── Top Pages from Common Crawl ──────────────────────────────────────────
async function topPages(domain) {
  try {
    const [r1, r2] = await Promise.allSettled([
      fetch(`https://index.commoncrawl.org/CC-MAIN-2024-51-index?url=*.${domain}/*&output=json&limit=400&fl=url`, { signal: AbortSignal.timeout(12000) }).then(r => r.text()),
      fetch(`https://index.commoncrawl.org/CC-MAIN-2024-51-index?url=${domain}/*&output=json&limit=400&fl=url`, { signal: AbortSignal.timeout(12000) }).then(r => r.text()),
    ]);
    const urls = [];
    [r1, r2].forEach(r => {
      if (r.status === "fulfilled") {
        r.value.trim().split("\n").filter(Boolean).forEach(line => {
          try { urls.push(JSON.parse(line).url); } catch {}
        });
      }
    });
    const counts = {};
    urls.forEach(url => {
      try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        const path = u.pathname === "/" ? "/" : u.pathname.replace(/\/$/, "");
        counts[path] = (counts[path] || 0) + 1;
      } catch {}
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));
  } catch { return []; }
}

// ─── Tech-Stack Detection ──────────────────────────────────────────────────
const SIGS = {
  cms: [
    { name: "WordPress",   re: /wp-content|wp-includes|wordpress/i },
    { name: "Shopify",     re: /cdn\.shopify\.com|Shopify\.theme/i },
    { name: "Webflow",     re: /webflow\.com|data-wf-page/i },
    { name: "Wix",         re: /wixsite\.com|_wix_/i },
    { name: "Squarespace", re: /squarespace\.com|squarespace-cdn/i },
    { name: "Drupal",      re: /drupal\.org|Drupal\.settings/i },
    { name: "Joomla",      re: /\/media\/joomla_edge\/|Joomla!/i },
    { name: "Ghost",       re: /ghost\.org|content\.ghost\.io/i },
    { name: "TYPO3",       re: /typo3|TYPO3/i },
    { name: "HubSpot CMS", re: /hs-scripts\.com|hubspot\.com\/hs/i },
    { name: "Contao",      re: /contao/i },
    { name: "NEOS CMS",    re: /neos\.io/i },
  ],
  analytics: [
    { name: "Google Analytics 4",  re: /gtag\(|G-[A-Z0-9]{6,}/i },
    { name: "Google Analytics UA", re: /UA-\d{6,}-\d+/ },
    { name: "Google Tag Manager",  re: /GTM-[A-Z0-9]{6,}|googletagmanager\.com\/gtm/i },
    { name: "Matomo",              re: /matomo\.js|_paq\.push/i },
    { name: "Plausible",           re: /plausible\.io/i },
    { name: "Fathom",              re: /usefathom\.com/i },
    { name: "Hotjar",              re: /hotjar\.com|hjSetting/i },
    { name: "Mixpanel",            re: /mixpanel\.com/i },
    { name: "Clarity",             re: /clarity\.ms/i },
    { name: "Heap",                re: /heapanalytics\.com/i },
  ],
  framework: [
    { name: "Next.js",    re: /__NEXT_DATA__|_next\/static/i },
    { name: "Nuxt.js",    re: /__nuxt|_nuxt\//i },
    { name: "Gatsby",     re: /gatsby-/i },
    { name: "Remix",      re: /\/__remix_manifest/i },
    { name: "Astro",      re: /astro:script|astro:page/i },
    { name: "Angular",    re: /ng-version|angular\.js/i },
    { name: "Vue.js",     re: /vue\.min\.js|__vue_/i },
    { name: "React",      re: /react\.development|__REACT_|react-dom/i },
    { name: "Svelte",     re: /svelte/i },
    { name: "Ember",      re: /ember\.js/i },
  ],
  ecommerce: [
    { name: "WooCommerce",  re: /woocommerce/i },
    { name: "Shopify",      re: /Shopify\.shop|cdn\.shopify/i },
    { name: "Magento",      re: /mage\/|Magento_/i },
    { name: "PrestaShop",   re: /prestashop/i },
    { name: "OXID",         re: /oxid/i },
    { name: "Shopware",     re: /shopware/i },
  ],
  marketing: [
    { name: "Facebook Pixel",     re: /connect\.facebook\.net\/.*\/fbevents/i },
    { name: "LinkedIn Insight",   re: /snap\.licdn\.com/i },
    { name: "TikTok Pixel",       re: /analytics\.tiktok\.com/i },
    { name: "Pinterest Tag",      re: /pintrk\(/i },
    { name: "Intercom",           re: /intercom\.io|intercomSettings/i },
    { name: "Zendesk",            re: /zendesk\.com/i },
    { name: "Hubspot Forms",      re: /forms\.hubspot\.com/i },
    { name: "Mailchimp",          re: /list-manage\.com|mailchimp/i },
    { name: "Klaviyo",            re: /klaviyo\.com/i },
  ],
  cdn: [
    { name: "Cloudflare",   hdr: "cf-ray" },
    { name: "Fastly",       hdr: "x-served-by" },
    { name: "AWS CloudFront", hdr: "x-amz-cf-id" },
    { name: "Vercel",       hdr: "x-vercel-id" },
    { name: "Netlify",      hdr: "x-nf-request-id" },
    { name: "Akamai",       hdr: "x-akamai-transformed" },
    { name: "Azure CDN",    hdr: "x-azure-ref" },
    { name: "Bunny CDN",    hdr: "bunnycdn-cache-status" },
  ],
};

async function tech(domain) {
  try {
    const t0 = Date.now();
    const r = await fetch(`https://${domain}`, {
      headers: { "User-Agent": "CXFusion-Bot/1.0 (internal analytics)" },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    const ttfb = Date.now() - t0;
    const hdrs = Object.fromEntries(r.headers.entries());
    const html = await r.text();
    const totalTime = Date.now() - t0;

    const detected = {};
    for (const [cat, sigs] of Object.entries(SIGS)) {
      detected[cat] = [];
      for (const s of sigs) {
        if (s.re  && s.re.test(html))    detected[cat].push(s.name);
        if (s.hdr && hdrs[s.hdr])        detected[cat].push(s.name);
      }
      detected[cat] = [...new Set(detected[cat])];
    }

    // Security header check
    const secHeaders = {
      hsts:           !!hdrs["strict-transport-security"],
      csp:            !!hdrs["content-security-policy"],
      xFrame:         !!hdrs["x-frame-options"],
      xContentType:   !!hdrs["x-content-type-options"],
      referrerPolicy: !!hdrs["referrer-policy"],
      permissions:    !!hdrs["permissions-policy"],
    };
    const secScore = Object.values(secHeaders).filter(Boolean).length; // 0-6

    // Performance score from our own measurement (0-100)
    const perfScore = (() => {
      let s = 0;
      if (ttfb < 200)       s += 30;
      else if (ttfb < 600)  s += 20;
      else if (ttfb < 1500) s += 10;
      if (hdrs["content-encoding"]?.includes("gzip") || hdrs["content-encoding"]?.includes("br")) s += 20;
      if (secHeaders.hsts)  s += 15;
      if (secHeaders.csp)   s += 10;
      if (!hdrs["x-powered-by"]) s += 10;
      if (r.status === 200) s += 15;
      return Math.min(s, 100);
    })();

    // Count approximate resource hints (images, scripts, styles)
    const scripts  = (html.match(/<script/gi) || []).length;
    const images   = (html.match(/<img/gi) || []).length;
    const styles   = (html.match(/<link[^>]+stylesheet/gi) || []).length;

    return {
      detected,
      perf: {
        ttfb,
        totalTime,
        compression: hdrs["content-encoding"] || null,
        server: hdrs["server"] || null,
        powered: hdrs["x-powered-by"] || null,
        perfScore,
        secScore,
        scripts,
        images,
        styles,
        htmlSizeKb: Math.round(html.length / 1024),
      },
      ssl: {
        hsts:   secHeaders.hsts,
        csp:    secHeaders.csp,
        xFrame: secHeaders.xFrame,
        xContentType: secHeaders.xContentType,
        referrerPolicy: secHeaders.referrerPolicy,
      },
      status: r.status,
    };
  } catch (e) {
    return { error: String(e), detected: {}, ssl: {}, perf: {} };
  }
}

// ─── Wayback Archive Trend ─────────────────────────────────────────────────
async function archiveTrend(domain) {
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const results = await Promise.allSettled(years.map(y =>
    fetch(`https://web.archive.org/cdx/search/cdx?url=${domain}&output=json&fl=timestamp&from=${y}0101&to=${y}1231&limit=200&collapse=timestamp:6`, { signal: AbortSignal.timeout(8000) })
      .then(r => r.json())
      .then(d => ({ year: y, count: Math.max(0, d.length - 1) }))
  ));
  return results
    .filter(r => r.status === "fulfilled")
    .map(r => r.value)
    .filter(r => r.count > 0);
}

// ─── Claude AI ─────────────────────────────────────────────────────────────
// AI proxy: tries local key first, falls back to deployed SocialFlow Pro /ai endpoint
const SF_AI_PROXY = "https://socialflow-pro.pages.dev/ai";

async function aiInsights(domain, data) {
  const prompt = `Analysiere die Website "${domain}". Verfügbare Daten:\n${JSON.stringify({
    pagerank: data.pagerank,
    whois: data.whois,
    crawl: data.crawl,
    tech: { detected: data.tech?.detected, perf: data.tech?.perf, ssl: data.tech?.ssl },
    topPages: data.topPages,
    archiveTrend: data.archiveTrend,
  }, null, 2)}\n\nGib exakt dieses JSON zurück (kein Markdown, keine Erklärungen):\n{\n  "trafficEstimate": { "monthly": <zahl>, "confidence": "low"|"medium"|"high", "range": { "min": <zahl>, "max": <zahl> } },\n  "globalRank": <zahl oder null>,\n  "category": "<Branche auf Deutsch>",\n  "summary": "<2-3 Sätze Fazit auf Deutsch>",\n  "trafficSources": { "direct": <0-100>, "organic": <0-100>, "social": <0-100>, "referral": <0-100>, "email": <0-100>, "paid": <0-100> },\n  "topCountries": [{ "country": "<Ländername DE>", "code": "<ISO2>", "share": <0-100> }],\n  "audienceType": "B2B"|"B2C"|"Gemischt",\n  "audienceProfile": "<1 Satz: Wer besucht diese Seite?>",\n  "trendSignal": "wachsend"|"stabil"|"rückläufig",\n  "trendReason": "<1 Satz warum>",\n  "behavior": {\n    "bounceRate": <0-100>,\n    "avgSessionDuration": <sekunden 60-600>,\n    "pagesPerSession": <1.0-10.0>,\n    "scrollDepth": { "p25": <0-100>, "p50": <0-100>, "p75": <0-100>, "p100": <0-100> },\n    "deviceSplit": { "mobile": <0-100>, "desktop": <0-100>, "tablet": <0-100> },\n    "topKeywords": ["<5 konkrete Suchbegriffe die echte Nutzer eingeben>"],\n    "newVsReturn": { "new": <0-100>, "returning": <0-100> },\n    "topEntryPages": [{ "path": "<url-pfad>", "share": <0-100>, "label": "<seitenbeschreibung deutsch>", "avgTime": <sekunden> }],\n    "topExitPages": [{ "path": "<url-pfad>", "share": <zahl 0-100, PFLICHT>, "label": "<seitenbeschreibung>" }],\n    "topReferrers": [{ "domain": "<referrer-domain z.B. google.de>", "type": "search"|"social"|"news"|"partner"|"other", "share": <0-100> }],\n    "topSections": [{ "path": "<pfad-prefix z.B. /sport/>", "label": "<abschnittsname>", "share": <0-100>, "avgTime": <sekunden> }],\n    "topTopics": [{ "topic": "<thema auf deutsch>", "share": <0-100> }],\n    "peakHours": [{ "hour": <0-23>, "relative": <0-100> }]\n  },\n  "seo": {\n    "organicKeywords": <geschätzte Anzahl rankender Keywords als Zahl>,\n    "organicKeywordsTrend": "wachsend"|"stabil"|"rückläufig",\n    "paidKeywords": <Anzahl bezahlter Keywords oder null>,\n    "seoValue": <monatlicher SEO-Traffic-Wert in EUR als Zahl (CPC-Äquivalent)>\n  },\n  "paid": {\n    "monthlyClicks": <bezahlte Klicks/Monat als Zahl oder null>,\n    "keywords": <Anzahl paid Keywords als Zahl oder null>,\n    "estimatedCost": <geschätzte monatliche Ausgaben in EUR oder null>\n  },\n  "aiOverviews": {\n    "score": <0-100 wie präsent ist die Seite in KI-Suchantworten>,\n    "aioTrafficShare": <0-100 Prozent des Traffics via KI-Overviews>,\n    "assessment": "<1 Satz Bewertung auf Deutsch>"\n  },\n  "trafficHistory": [\n    ["<YYYY-MM>", <organische Besuche als Zahl>, <paid Klicks als Zahl>, <direkte Besuche als Zahl>]\n  ],\n  "strengths": ["<max 3>"],\n  "weaknesses": ["<max 3>"],\n  "recommendations": ["<max 3 konkrete>"]\n}\nFür trafficHistory: genau 8 Einträge für die letzten 8 Monate (aktuellster zuerst), realistische Schätzungen basierend auf Branche und Größe.`;

  const body = {
    system: "Du bist ein Web-Analytics-Experte. Antworte IMMER als valides JSON ohne Markdown-Codeblöcke.",
    messages: [{ role: "user", content: prompt }],
    model: "claude-sonnet-4-6",
  };

  const parse = async (r) => {
    const d = await r.json();
    const text = d?.content?.[0]?.text || "";
    return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "null");
  };

  // 1. Try local key via direct Anthropic API
  const localKey = process.env.ANTHROPIC_API_KEY;
  if (localKey) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": localKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ ...body, max_tokens: 4096 }),
        signal: AbortSignal.timeout(45000),
      });
      return await parse(r);
    } catch (e) { console.error("Direct AI error:", e.message); }
  }

  // 2. Fallback: SocialFlow Pro deployed /ai proxy (shares the same Anthropic account)
  try {
    console.log("  → Using SocialFlow Pro AI proxy...");
    const r = await fetch(SF_AI_PROXY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, max_tokens: 4096 }),
      signal: AbortSignal.timeout(35000),
    });
    if (!r.ok) throw new Error(`SF proxy ${r.status}`);
    return await parse(r);
  } catch (e) {
    console.error("SF proxy AI error:", e.message);
    return null;
  }
}

// ─── Main analyze orchestrator ─────────────────────────────────────────────
async function analyze(domain) {
  console.log(`→ Analyzing: ${domain}`);
  const t0 = Date.now();

  // Parallel batch: pagerank, crawl, tech, topPages
  const [pr, cr, tc, tp] = await Promise.allSettled([
    pagerank(domain),
    crawl(domain),
    tech(domain),
    topPages(domain),
  ]);

  // Sequential: whois + archive trend (both use Wayback, avoid parallel throttling)
  const wh  = await whois(domain).catch(() => null);
  const arc = await archiveTrend(domain).catch(() => []);

  const val = p => (p && p.status === "fulfilled") ? p.value : null;

  const result = {
    domain,
    analyzedAt: new Date().toISOString(),
    pagespeed:    null,
    pagerank:     val(pr),
    whois:        wh,
    crawl:        val(cr),
    tech:         val(tc),
    topPages:     val(tp) || [],
    archiveTrend: arc,
  };

  result.ai = await aiInsights(domain, result);
  console.log(`✓ Done in ${Date.now() - t0}ms`);
  return result;
}

// ─── Content Fetcher ───────────────────────────────────────────────────────
async function fetchContent(domain) {
  const extractText = (html) => html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();

  const extractMeta = (html, name) => {
    const m = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']{1,300})["']`, "i"))
      || html.match(new RegExp(`<meta[^>]*content=["']([^"']{1,300})["'][^>]*name=["']${name}["']`, "i"));
    return m?.[1] || "";
  };

  const fetchPage = async (url) => {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CXFusion-Bot/1.0)" },
        signal: AbortSignal.timeout(10000), redirect: "follow",
      });
      if (!r.ok) return null;
      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("html")) return null;
      const html = await r.text();
      const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
      const desc  = extractMeta(html, "description");
      const text  = extractText(html).slice(0, 4000);
      if (text.length < 80) return null;
      return { url, title, desc, text, _html: html }; // _html for link extraction only
    } catch { return null; }
  };

  const base = `https://${domain}`;
  const home = await fetchPage(base);
  if (!home) return { pages: [], error: "Homepage nicht erreichbar" };

  // Extract internal paths from raw HTML (not stripped text!)
  const rawHtml = home._html;
  const relRe  = /href=["'](\/[^\s"'?#]{2,80})["']/gi;
  const absRe  = new RegExp(`href=["']https?://${domain.replace(/\./g, "\\.")}(/[^\\s"'?#]{2,80})["']`, "gi");
  const paths  = new Set([
    ...[...rawHtml.matchAll(relRe)].map(m => m[1]),
    ...[...rawHtml.matchAll(absRe)].map(m => m[1]),
  ]);
  const internalPaths = [...paths]
    .filter(p => !/\.(jpg|jpeg|png|gif|svg|pdf|css|js|ico|xml|json|woff|mp4|webp)(\?|$)/i.test(p))
    .filter(p => !/^\/?(wp-content|wp-admin|#|javascript|mailto|tel:)/i.test(p))
    .slice(0, 18);

  // Also try sitemap.xml to discover more paths
  const sitemapPaths = [];
  try {
    const sr = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "CXFusion-Bot/1.0" } });
    if (sr.ok) {
      const sxml = await sr.text();
      const locs = [...sxml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/gi)].map(m => m[1]);
      for (const loc of locs.slice(0, 30)) {
        try {
          const u = new URL(loc);
          if (u.hostname === domain || u.hostname === `www.${domain}`) {
            const p = u.pathname;
            if (p.length > 1 && !/\.(jpg|png|pdf|css|js)$/i.test(p)) sitemapPaths.push(p);
          }
        } catch {}
      }
    }
  } catch {}

  const allPaths = [...new Set([...internalPaths, ...sitemapPaths])].slice(0, 20);

  const extras = (await Promise.allSettled(
    allPaths.map(p => fetchPage(base + p))
  )).filter(r => r.status === "fulfilled" && r.value).map(r => r.value);

  // Strip _html before returning (not needed by caller)
  const stripHtml = p => { const { _html, ...rest } = p; return rest; };
  return { pages: [stripHtml(home), ...extras.slice(0, 15).map(stripHtml)] };
}

// ─── HTTP Server ───────────────────────────────────────────────────────────
const ROUTES = {
  "/analyze":   async b => analyze(b.domain),
  "/pagespeed": async b => pagespeed(b.domain),
  "/pagerank":  async b => pagerank(b.domain),
  "/whois":     async b => whois(b.domain),
  "/crawl":     async b => crawl(b.domain),
  "/tech":      async b => tech(b.domain),
  "/content":   async b => fetchContent(b.domain),
};

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  // ─── /ai proxy ─────────────────────────────────────────────────────────────
  if (req.url === "/ai" && req.method === "POST") {
    try {
      const b = await body(req);
      const localKey = process.env.ANTHROPIC_API_KEY;
      if (localKey) {
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": localKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2048, ...b }),
          signal: AbortSignal.timeout(60000),
        });
        const data = await r.json();
        respond(res, data);
      } else {
        const r = await fetch(SF_AI_PROXY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(b),
          signal: AbortSignal.timeout(60000),
        });
        const data = await r.json();
        respond(res, data);
      }
    } catch (e) {
      console.error("AI proxy error:", e.message);
      respond(res, { error: { message: String(e) } }, 500);
    }
    return;
  }

  // ─── /broken-links ─────────────────────────────────────────────────────────
  if (req.url === "/broken-links" && req.method === "POST") {
    try {
      const b = await body(req);
      const domain = b.domain;
      if (!domain) { respond(res, { error: "domain required" }, 400); return; }

      // Get pages from content scanner
      const contentData = await fetchContent(domain);
      const pages = contentData?.pages || [];

      // Extract all unique links from page HTML (internal + external)
      const allLinks = new Set();
      for (const p of pages.slice(0, 5)) {
        // internal links from URL patterns
        allLinks.add(p.url);
      }
      // Add common paths to check
      const commonPaths = ["/", "/sitemap.xml", "/robots.txt", "/impressum", "/datenschutz", "/kontakt", "/about", "/ueber-uns"];
      for (const path of commonPaths) {
        allLinks.add(`https://${domain}${path}`);
      }
      // Also add all page URLs
      for (const p of pages) allLinks.add(p.url);

      const urls = [...allLinks].filter(u => u.startsWith("http")).slice(0, 30);

      // Check each URL concurrently (batches of 5)
      const results = [];
      const batch = 5;
      for (let i = 0; i < urls.length; i += batch) {
        const chunk = urls.slice(i, i + batch);
        const checks = await Promise.all(chunk.map(async (url) => {
          try {
            const r = await fetch(url, {
              method: "HEAD",
              signal: AbortSignal.timeout(8000),
              redirect: "follow",
              headers: { "User-Agent": "Mozilla/5.0 (compatible; LinkChecker/1.0)" },
            });
            return { url, status: r.status, ok: r.ok, redirect: r.redirected, finalUrl: r.url };
          } catch (e) {
            return { url, status: 0, ok: false, error: e.message?.slice(0, 50) };
          }
        }));
        results.push(...checks);
      }

      respond(res, { domain, results, checkedAt: new Date().toISOString() });
    } catch (e) {
      console.error("broken-links error:", e.message);
      respond(res, { error: String(e) }, 500);
    }
    return;
  }

  // ─── /rss proxy ────────────────────────────────────────────────────────────
  if (req.url?.startsWith("/rss") && req.method === "GET") {
    const domain = new URL("http://localhost" + req.url).searchParams.get("domain");
    if (!domain) { respond(res, { error: "domain required" }, 400); return; }
    const feedPaths = ["/feed", "/rss", "/rss.xml", "/atom.xml", "/feed.xml", "/rss/feed", "/blog/rss", "/news/rss", "/feed/rss2", "/sitemap.xml", "/rss2.xml", "/rss/news", "/blog/feed"];
    const parseItems = (xml) => {
      const items = [];
      const blocks = [...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi), ...xml.matchAll(/<entry[\s>]([\s\S]*?)<\/entry>/gi)];
      for (const [, block] of blocks.slice(0, 20)) {
        const g = (tag) => { const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")); return (m?.[1] || m?.[2] || "").trim().replace(/<[^>]+>/g, ""); };
        const title = g("title");
        const desc = g("description") || g("summary") || g("content");
        const link = (block.match(/<link[^>]*href="([^"]+)"/i) || block.match(/<link[^>]*>(https?:[^<]+)<\/link>/i) || [])[1] || "";
        const date = g("pubDate") || g("published") || g("updated") || g("dc:date") || "";
        if (title) items.push({ title, desc: desc.slice(0, 200), link, date });
      }
      return items;
    };
    try {
      for (const fp of feedPaths) {
        try {
          const r = await fetch(`https://${domain}${fp}`, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "CXFusion-Bot/1.0" } });
          if (!r.ok) continue;
          const ct = r.headers.get("content-type") || "";
          if (!ct.includes("xml") && !ct.includes("rss") && !ct.includes("atom") && !ct.includes("feed")) continue;
          const xml = await r.text();
          const items = parseItems(xml);
          if (items.length > 0) { respond(res, { feedUrl: `https://${domain}${fp}`, items }); return; }
        } catch {}
      }
      respond(res, { feedUrl: null, items: [] });
    } catch (e) {
      respond(res, { feedUrl: null, items: [], error: String(e) });
    }
    return;
  }

  // ─── /features-manifest  (GET) ───────────────────────────────────────────
  if (req.url === "/features-manifest" && req.method === "GET") {
    try {
      const manifest = JSON.parse(readFileSync(path.join(__dir, "feature-manifest.json"), "utf8"));
      respond(res, manifest);
    } catch (e) { respond(res, { error: String(e) }, 500); }
    return;
  }

  // ─── /improve-status  (GET) ───────────────────────────────────────────────
  if (req.url === "/improve-status" && req.method === "GET") {
    let lastReport   = null;
    let lastFeatures = null;
    try { lastReport   = JSON.parse(readFileSync(REPORT_FILE,   "utf8")); } catch {}
    try { lastFeatures = JSON.parse(readFileSync(FEATURES_FILE, "utf8")); } catch {}
    respond(res, {
      logCount: improveLog.filter(e => e.type !== "_ping").length,
      lastAutoRun, lastResearchRun,
      nextAutoRun, intervalMs: AUTO_INTERVAL_MS,
      lastReport, lastFeatures,
      featureRunning, featureRunError,
      tests: lastTestResult,
    });
    return;
  }

  // ─── /improve-research  (GET) — fires async, returns immediately ──────────
  if (req.url === "/improve-research" && req.method === "GET") {
    const aiKey = process.env.ANTHROPIC_API_KEY;
    if (!aiKey) { respond(res, { error: "ANTHROPIC_API_KEY nicht gesetzt" }, 500); return; }
    if (featureRunning) {
      respond(res, { running: true, message: "Analyse läuft bereits, bitte warten…" });
      return;
    }
    // Kick off async — client polls /improve-status for result
    featureRunning  = true;
    featureRunError = null;
    respond(res, { running: true, started: true, message: "Analyse gestartet — Ergebnis erscheint in ~2 Min automatisch" });
    runFeatureResearch(aiKey)
      .then(() => { featureRunning = false; featureRunError = null; })
      .catch(e => { featureRunning = false; featureRunError = String(e); console.error("[research] async error:", e.message); });
    return;
  }

  // ─── /improve-apply  (POST) ───────────────────────────────────────────────
  // Moves a staged file from improve-pending/ to src/pages/
  if (req.url === "/improve-apply" && req.method === "POST") {
    const b = await body(req);
    const fileName = (b.file || "").replace(/\.\./g, "").replace(/[^a-zA-Z0-9._-]/g, "");
    if (!fileName) { respond(res, { error: "Kein Dateiname" }, 400); return; }
    const src  = path.join(PENDING_DIR, fileName);
    const dest = path.join(__dir, "src", "pages", fileName);
    try {
      if (!existsSync(src)) { respond(res, { error: "Staged-Datei nicht gefunden" }, 404); return; }
      const code = readFileSync(src, "utf8");
      // Safety: backup existing file if it exists
      if (existsSync(dest)) writeFileSync(dest + ".bak", readFileSync(dest));
      writeFileSync(dest, code);
      respond(res, { ok: true, dest: `src/pages/${fileName}`, backed_up: existsSync(dest + ".bak") });
    } catch (e) {
      respond(res, { error: String(e) }, 500);
    }
    return;
  }

  // ─── /improve-log  (POST) ──────────────────────────────────────────────────
  if (req.url === "/improve-log" && req.method === "POST") {
    const b = await body(req);
    addImproveEntry(b);
    respond(res, { ok: true });
    return;
  }

  // ─── /improve-analyze  (GET) ───────────────────────────────────────────────
  if (req.url === "/improve-analyze" && req.method === "GET") {
    const entries = improveLog.slice(-80);
    if (entries.length === 0) {
      respond(res, { patterns: [], suggestions: [], message: "Noch keine Fehler geloggt. Nutze die App, um Daten zu sammeln." });
      return;
    }
    const logText = entries
      .map(e => `[${new Date(e.ts).toISOString()}] ${e.type}: ${e.message}${e.context ? " | " + JSON.stringify(e.context) : ""}`)
      .join("\n");
    try {
      const aiKey = process.env.ANTHROPIC_API_KEY;
      if (!aiKey) { respond(res, { error: "ANTHROPIC_API_KEY nicht gesetzt" }, 500); return; }
      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": aiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: `Du bist ein Senior-Entwickler, der die Web-App "cx-fusion" (React 18 + Vite, ausschließlich Inline-Styles, Cloudflare Functions, Anthropic Claude AI) analysiert.
Deine Aufgabe: Fehler-Logs auswerten und konkrete, umsetzbare Code-Verbesserungen vorschlagen.
Antworte AUSSCHLIESSLICH mit validem JSON ohne Markdown-Wrapper.
Schema:
{
  "patterns": [{ "type": string, "count": number, "severity": "low"|"medium"|"high", "description": string }],
  "suggestions": [{
    "priority": "P1"|"P2"|"P3",
    "title": string,
    "description": string,
    "file": string,
    "problem": string,
    "solution": string,
    "code": string
  }]
}`,
          messages: [{ role: "user", content: `Fehler-Log (${entries.length} Einträge):\n\n${logText}\n\nAnalysiere die Muster und schlage die wichtigsten Verbesserungen vor.` }],
        }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await aiRes.json();
      const raw = data?.content?.[0]?.text || "{}";
      try {
        const parsed = JSON.parse(raw.match(/```json\s*([\s\S]*?)```/)?.[1] || raw.match(/(\{[\s\S]*\})/s)?.[1] || raw);
        respond(res, { ...parsed, logCount: entries.length });
      } catch {
        respond(res, { patterns: [], suggestions: [{ priority: "P1", title: "KI-Rohantwort", description: raw, file: "-", problem: "-", solution: raw, code: "" }], logCount: entries.length });
      }
    } catch (e) {
      console.error("improve-analyze error:", e.message);
      respond(res, { error: String(e) }, 500);
    }
    return;
  }

  const route = ROUTES[req.url];
  if (!route) { respond(res, { error: "Not found" }, 404); return; }
  try {
    const b = await body(req);
    if (!b.domain) { respond(res, { error: "domain required" }, 400); return; }
    const result = await route(b);
    respond(res, result);
  } catch (e) {
    console.error(e);
    respond(res, { error: String(e) }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 CX Fusion local API server`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "✓ gesetzt" : "✗ fehlt (.env.local)"}`);
  console.log(`   PSI_API_KEY:       ${process.env.PSI_API_KEY ? "✓ gesetzt" : "– optional"}`);
  console.log(`   OPENPAGERANK_KEY:  ${process.env.OPENPAGERANK_KEY ? "✓ gesetzt" : "– optional"}\n`);
  startTestWatcher();
});

// ─── Auto-Test Watcher ────────────────────────────────────────────────────────
// Runs vitest after every change to src/utils/ or src/__tests__/
let testDebounce = null;
let lastTestResult = { passed: 0, failed: 0, ts: null };

function runTests() {
  exec("npm test", { cwd: __dir }, (err, stdout, stderr) => {
    const out = stdout + stderr;
    const passMatch = out.match(/Tests\s+(\d+) passed/);
    const failMatch = out.match(/(\d+) failed/);
    lastTestResult = {
      passed: passMatch ? parseInt(passMatch[1]) : 0,
      failed: failMatch ? parseInt(failMatch[1]) : 0,
      ts: new Date().toISOString(),
      output: out.slice(-800),
    };
    if (lastTestResult.failed > 0) {
      console.error(`[tests] ❌ ${lastTestResult.failed} fehlgeschlagen — bitte fixen vor Deploy!`);
      console.error(out.slice(-400));
    } else {
      console.log(`[tests] ✓ ${lastTestResult.passed} Tests grün`);
    }
  });
}

function startTestWatcher() {
  const srcDir = path.join(__dir, "src");
  try {
    watch(srcDir, { recursive: true }, (_, filename) => {
      if (!filename || !filename.endsWith(".js") && !filename.endsWith(".jsx")) return;
      clearTimeout(testDebounce);
      testDebounce = setTimeout(() => {
        console.log(`[tests] Änderung erkannt (${filename}) — Tests starten…`);
        runTests();
      }, 800); // debounce: warte bis Speichern abgeschlossen
    });
    console.log(`[tests] Auto-Test-Watcher aktiv (src/)`);
    runTests(); // run once at startup
  } catch (e) {
    console.error("[tests] Watcher konnte nicht gestartet werden:", e.message);
  }
}
