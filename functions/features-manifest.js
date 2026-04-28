const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

const MANIFEST = {
  version: "2.0",
  lastUpdated: "2026-04-27",
  currentFeatures: [
    {
      id: "website-analysis", label: "Website-Analyse", category: "Analyse", since: "2026-01",
      desc: "Vollständige Domain-Analyse mit PageSpeed Insights, PageRank, WHOIS-Daten und Tech-Stack-Erkennung. Liefert Performance-Score, Sicherheits-Header-Check, Traffic-Schätzung und KI-generiertes Fazit in einem Durchlauf.",
      highlights: ["PageSpeed Insights (Core Web Vitals)", "PageRank & Domain-Authority", "WHOIS & Registrar-Daten", "KI-Traffic-Prognose"],
    },
    {
      id: "content-audit", label: "Content-Audit", category: "Analyse", since: "2026-01",
      desc: "Analysiert RSS-Feeds und Website-Inhalte auf Tonalität, Sentiment, Themen-Cluster und SEO-Qualität. Zeigt Flesch-Kincaid-Lesbarkeit, Keyword-Dichte und gibt konkrete Verbesserungsvorschläge per KI.",
      highlights: ["RSS-Feed-Analyse", "Sentiment & Tonalität", "Flesch-Kincaid-Lesbarkeit", "KI-Verbesserungsvorschläge"],
    },
    {
      id: "website-compare", label: "Website-Vergleich", category: "Analyse", since: "2026-02",
      desc: "Stellt zwei Domains direkt nebeneinander: Performance, SEO-Metriken, Tech-Stack, Traffic-Schätzung und Stärken/Schwächen im direkten Vergleich. Ideal für Wettbewerbsanalysen.",
      highlights: ["Side-by-Side Metriken", "Performance-Vergleich", "SEO-Score Differenz", "Stärken/Schwächen-Matrix"],
    },
    {
      id: "batch-analysis", label: "Batch-Analyse", category: "Analyse", since: "2026-02",
      desc: "Analysiert bis zu 50 Domains gleichzeitig in einer einzigen Eingabe. Ergebnisse werden parallel verarbeitet und tabellarisch mit Export-Option dargestellt — perfekt für Agenturen mit vielen Kunden.",
      highlights: ["Bis zu 50 Domains parallel", "Tabellarische Übersicht", "Vergleichbare Metriken", "Bulk-Verarbeitung"],
    },
    {
      id: "schema-validator", label: "Structured Data Validator", category: "SEO", since: "2026-03", aiGenerated: true,
      desc: "Überprüft strukturierte Daten (Schema.org) auf Korrektheit und Vollständigkeit. Zeigt Rich-Snippet-Vorschau wie Google sie darstellt, erkennt Fehler und gibt Verbesserungsvorschläge für bessere SERP-Sichtbarkeit.",
      highlights: ["Schema.org-Validierung", "Rich-Snippet-Vorschau", "Fehler & Warnungen", "Google-konforme Prüfung"],
    },
    {
      id: "broken-links", label: "Broken-Link-Checker", category: "SEO", since: "2026-02",
      desc: "Crawlt eine Website und findet alle defekten Links (404, 5xx, Timeouts). Zeigt Quellseite, Ziel-URL und HTTP-Status — priorisiert nach SEO-Relevanz für schnelle Behebung.",
      highlights: ["Vollständiger Site-Crawl", "HTTP-Status-Codes", "Quell- & Ziel-URL", "SEO-Priorisierung"],
    },
    {
      id: "seo-audit", label: "SEO-Audit", category: "SEO", since: "2026-02",
      desc: "Umfassender SEO-Check: Meta-Tags, Canonical-Tags, Title-Längen, Heading-Hierarchie, Keyword-Dichte und Flesch-Kincaid-Score. Ergibt einen Gesamt-SEO-Score mit priorisierten To-dos.",
      highlights: ["Meta-Tags & Canonicals", "Heading-Hierarchie", "Keyword-Dichte", "Priorisierte To-do-Liste"],
    },
    {
      id: "serp-preview", label: "SERP-Vorschau", category: "SEO", since: "2026-02",
      desc: "Zeigt exakt, wie eine Seite in den Google-Suchergebnissen erscheint — mit Title, Meta-Description und URL. Warnt bei zu langen/kurzen Snippets und ermöglicht direktes Bearbeiten für optimale CTR.",
      highlights: ["Pixel-genaue Google-Vorschau", "Title & Description Check", "Zeichenlängen-Validierung", "CTR-Optimierungshinweise"],
    },
    {
      id: "client-management", label: "Kundenverwaltung", category: "CRM", since: "2026-01",
      desc: "Speichert Kundendomains dauerhaft mit Analyse-Historie, Notizen und Verlauf. Schnellzugriff auf alle gespeicherten Reports — zentrale Schaltstelle für Agenturen mit mehreren Kunden.",
      highlights: ["Domain-Verwaltung", "Analyse-Verlauf je Kunde", "Schnellzugriff auf Reports", "KV-persistent (geräteübergreifend)"],
    },
    {
      id: "report-history", label: "Report-Historie", category: "CRM", since: "2026-04",
      desc: "Speichert alle durchgeführten Analysen mit Zeitstempel in Cloudflare KV — geräteübergreifend abrufbar. Zeigt Traffic-Trends, Score-Entwicklung und Tonalitäts-Verlauf über Zeit.",
      highlights: ["Cloudflare KV-Persistenz", "Zeitgestempelter Verlauf", "Score-Entwicklung", "Geräteübergreifend"],
    },
    {
      id: "ai-bug-analysis", label: "KI-Bug-Analyse", category: "System", since: "2026-03",
      desc: "Analysiert die Plattform selbst auf typische Fehler-Muster, Performance-Probleme und Code-Qualität. Claude generiert priorisierte Verbesserungsvorschläge mit konkreten Lösungen — täglich automatisch oder on demand.",
      highlights: ["Automatische Fehler-Erkennung", "Prioritäts-Klassifizierung (P1-P3)", "Konkrete Code-Fixes", "Täglicher Auto-Lauf"],
    },
    {
      id: "market-analysis", label: "Markt-Analyse", category: "System", since: "2026-03",
      desc: "Vergleicht CX Fusion automatisch mit Marktführern (Ahrefs, SEMrush, Sistrix) und identifiziert die wertvollsten fehlenden Features. Ergibt priorisierte Feature-Roadmap und Quick Wins.",
      highlights: ["Wettbewerber-Vergleich", "Marktlücken-Identifikation", "Quick-Win-Priorisierung", "KI-Feature-Roadmap"],
    },
    {
      id: "traffic-estimation", label: "Traffic-Schätzung", category: "Analyse", since: "2026-01",
      desc: "KI-gestützte Schätzung des monatlichen Traffics mit Konfidenz-Level und Bandbreite (Min/Max). Aufgeteilt nach Kanälen (organisch, direkt, Social, Paid) und Top-Ländern.",
      highlights: ["Monatliche Besucher-Prognose", "Kanal-Aufschlüsselung", "Top-Länder-Verteilung", "Konfidenz-Intervall"],
    },
    {
      id: "geo-data", label: "Geo-Daten & Zielgruppe", category: "Analyse", since: "2026-01",
      desc: "Zeigt Herkunftsländer der Besucher, Geräte-Split (Mobile/Desktop/Tablet), Audience-Typ (B2B/B2C) und Nutzerprofil. Inklusive Bounce-Rate, Session-Dauer und Peak-Hours.",
      highlights: ["Top-Länder mit Anteil", "Geräte-Split", "B2B vs. B2C Klassifikation", "Bounce-Rate & Session-Dauer"],
    },
    {
      id: "tech-stack", label: "Tech-Stack-Erkennung", category: "Analyse", since: "2026-01",
      desc: "Erkennt CMS, Frameworks, Analytics-Tools, E-Commerce-Systeme, CDN und Marketing-Tools automatisch aus HTML und HTTP-Headern. Zeigt Sicherheits-Header und TTFB-Messung.",
      highlights: ["CMS & Framework-Erkennung", "Analytics & Marketing-Tools", "CDN-Erkennung", "Security-Header-Check"],
    },
    {
      id: "domain-history", label: "Domain-Historie", category: "Analyse", since: "2026-01",
      desc: "Zeigt WHOIS-Registrierungsdaten, Registrar, Nameserver und Ablaufdatum der Domain. Liefert Kontext über Alter und Eigentümerschaft — wichtig für Trust-Bewertung und SEO.",
      highlights: ["WHOIS-Registrierungsdaten", "Domain-Alter", "Registrar & Nameserver", "Ablaufdatum-Tracking"],
    },
  ],
  knownGaps: [
    { id: "rank-tracker",       label: "Keyword-Rank-Tracker",   priority: "P1", impact: "high",   effort: "high",   desc: "Eigene Keywords täglich ranken und Verlauf über Zeit verfolgen — fehlt gegenüber Ahrefs/SEMrush." },
    { id: "backlink-monitor",   label: "Backlink-Monitor",        priority: "P1", impact: "high",   effort: "high",   desc: "Backlink-Profile analysieren, neue/verlorene Links tracken — Kerndisziplin für Off-Page-SEO." },
    { id: "competitor-alerts",  label: "Wettbewerber-Alerts",     priority: "P2", impact: "high",   effort: "medium", desc: "Push-Benachrichtigungen bei Änderungen bei Wettbewerber-Domains (neue Seiten, Ranking-Sprünge)." },
    { id: "page-speed-monitor", label: "Performance-Monitoring",  priority: "P2", impact: "medium", effort: "medium", desc: "Core Web Vitals täglich messen und Trendkurve über Zeit darstellen." },
    { id: "pdf-export",         label: "PDF-Export",              priority: "P2", impact: "medium", effort: "low",    desc: "Reports als branded PDF exportieren — wichtig für Agenturen und Kundenpräsentationen." },
    { id: "white-label",        label: "White-Label-Reports",     priority: "P2", impact: "high",   effort: "medium", desc: "Reports mit eigenem Logo und Farben für Kunden-Präsentationen anpassen." },
    { id: "api-access",         label: "API-Zugang",              priority: "P3", impact: "high",   effort: "high",   desc: "REST-API für Entwickler — ermöglicht Integration in eigene Tools und Dashboards." },
    { id: "scheduled-reports",  label: "Scheduled Reports",       priority: "P3", impact: "medium", effort: "medium", desc: "Automatisch wöchentliche/monatliche Reports per E-Mail versenden." },
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
