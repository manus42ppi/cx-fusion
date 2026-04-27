const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

const MANIFEST = {
  version: "2.0",
  lastUpdated: "2026-04-27",
  currentFeatures: [
    { id: "website-analysis",    label: "Website-Analyse",           category: "Analyse",   since: "2026-01" },
    { id: "content-audit",       label: "Content-Audit",             category: "Analyse",   since: "2026-01" },
    { id: "website-compare",     label: "Website-Vergleich",         category: "Analyse",   since: "2026-02" },
    { id: "batch-analysis",      label: "Batch-Analyse",             category: "Analyse",   since: "2026-02" },
    { id: "schema-validator",    label: "Structured Data Validator",  category: "SEO",       since: "2026-03", aiGenerated: true },
    { id: "broken-links",        label: "Broken-Link-Checker",       category: "SEO",       since: "2026-02" },
    { id: "seo-audit",           label: "SEO-Audit",                 category: "SEO",       since: "2026-02" },
    { id: "serp-preview",        label: "SERP-Vorschau",             category: "SEO",       since: "2026-02" },
    { id: "client-management",   label: "Kundenverwaltung",          category: "CRM",       since: "2026-01" },
    { id: "report-history",      label: "Report-Historie",           category: "CRM",       since: "2026-04" },
    { id: "ai-bug-analysis",     label: "KI-Bug-Analyse",            category: "System",    since: "2026-03" },
    { id: "market-analysis",     label: "Markt-Analyse",             category: "System",    since: "2026-03" },
    { id: "traffic-estimation",  label: "Traffic-Schätzung",         category: "Analyse",   since: "2026-01" },
    { id: "geo-data",            label: "Geo-Daten",                 category: "Analyse",   since: "2026-01" },
    { id: "tech-stack",          label: "Tech-Stack-Erkennung",      category: "Analyse",   since: "2026-01" },
    { id: "domain-history",      label: "Domain-Historie",           category: "Analyse",   since: "2026-01" },
  ],
  knownGaps: [
    { id: "rank-tracker",        label: "Keyword-Rank-Tracker",      priority: "P1", impact: "high",   effort: "high"   },
    { id: "backlink-monitor",    label: "Backlink-Monitor",          priority: "P1", impact: "high",   effort: "high"   },
    { id: "competitor-alerts",   label: "Wettbewerber-Alerts",       priority: "P2", impact: "high",   effort: "medium" },
    { id: "page-speed-monitor",  label: "Performance-Monitoring",    priority: "P2", impact: "medium", effort: "medium" },
    { id: "pdf-export",          label: "PDF-Export",                priority: "P2", impact: "medium", effort: "low"    },
    { id: "white-label",         label: "White-Label-Reports",       priority: "P2", impact: "high",   effort: "medium" },
    { id: "api-access",          label: "API-Zugang",                priority: "P3", impact: "high",   effort: "high"   },
    { id: "scheduled-reports",   label: "Scheduled Reports",         priority: "P3", impact: "medium", effort: "medium" },
  ],
};

export async function onRequestGet(ctx) {
  // Merge with KV-stored AI-generated updates if available
  let manifest = { ...MANIFEST };
  if (ctx.env.CXF_KV) {
    const aiFeatures = await ctx.env.CXF_KV.get("lastFeatures");
    if (aiFeatures) manifest.lastAiAnalysis = JSON.parse(aiFeatures);
  }
  return new Response(JSON.stringify(manifest), { headers: CORS });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
