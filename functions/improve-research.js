const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

/** Strip markdown code fences and extract the first JSON object. Never throws. */
function extractJSON(text) {
  if (!text) return null;
  // Remove ```json ... ``` or ``` ... ``` wrappers
  const stripped = text.replace(/^```[\w]*\n?/gm, "").replace(/^```$/gm, "").trim();
  const match = stripped.match(/\{[\s\S]*\}/s);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

const FALLBACK = {
  topGaps: [
    { id: "g1", name: "Keyword-Tracking", why: "Eigene Keyword-Rankings live verfolgen fehlt noch", impact: "high", effort: "medium", priority: "P1", category: "SEO", competitorHas: ["Ahrefs", "SEMrush"] },
    { id: "g2", name: "Backlink-Analyse", why: "Backlink-Profile sind Kerndaten für SEO-Entscheidungen", impact: "high", effort: "high", priority: "P1", category: "SEO", competitorHas: ["Ahrefs", "Majestic"] },
    { id: "g3", name: "Crawl-Budget-Analyse", why: "Zeigt indexierbare vs. blockierte Seiten", impact: "medium", effort: "medium", priority: "P2", category: "Technical", competitorHas: ["Screaming Frog"] },
  ],
  quickWins: [
    { id: "q1", name: "Export als PDF", description: "Reports als PDF exportierbar machen", uiHint: "Export-Button in Report-Header", hours: 6 },
    { id: "q2", name: "Favicons in Domain-Listen", description: "Favicon neben Domain-Namen für schnelle Erkennung", uiHint: "16×16 Favicon vor Domain-Text", hours: 2 },
  ],
  nextFeature: { id: "f1", name: "Keyword-Tracking", description: "Eigene Keywords täglich ranken und Verlauf anzeigen", category: "SEO" },
  marketTrends: ["AI Overviews verdrängen organischen Traffic", "Core Web Vitals als Rankingfaktor steigt", "Zero-Click-Searches nehmen zu"],
  summary: "CX Fusion deckt Basis-Analysen gut ab. Keyword-Tracking und Backlink-Analyse sind die wichtigsten fehlenden Features gegenüber Ahrefs/SEMrush.",
};

export async function onRequestPost(ctx) {
  try {
    // Use /ai proxy (same-origin) — never call api.anthropic.com directly
    const origin = new URL(ctx.request.url).origin;

    const knownFeatures = [
      "Website-Analyse (PSI, PageRank, WHOIS, Tech-Stack, Homepage-Content-Fetch)",
      "Content-Audit (RSS, Tonalität, Sentiment, Themen-Cluster)",
      "Website-Vergleich (2 Domains side-by-side)",
      "Batch-Analyse (bis zu 50 Domains)",
      "Structured Data / Structure-Audit (Schema.org, JSON-LD)",
      "Social Intelligence (Social-Media-Profile & Engagement)",
      "Kundenverwaltung mit Report-Historie (5 Reports pro Domain)",
      "KI-Bug-Analyse & Verbesserungsvorschläge",
      "Traffic-Schätzung & Geo-Daten",
      "Domain-Historie & Archiv-Trends",
      "Zielgruppen-Analyse aus echtem Homepage-Inhalt",
      "Autonome Verbesserung (Markt-Scan + Feature-Generierung)",
    ];

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 55000);

    const res = await fetch(`${origin}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        system: "Du bist ein Produkt-Analyst. Antworte IMMER nur mit reinem JSON, ohne Markdown-Blöcke, ohne Erklärungen, ohne Code-Fences.",
        messages: [{
          role: "user",
          content: `Implementierte Features in CX Fusion: ${knownFeatures.join(", ")}.

Analysiere Marktlücken gegenüber Ahrefs, SEMrush, Sistrix, Screaming Frog.

Gib exakt dieses JSON zurück (fülle alle Felder mit echten Werten, ersetze die Beispielwerte):
{"generatedAt":"${new Date().toISOString()}","topGaps":[{"id":"g1","name":"Echtes Feature","why":"Warum es wichtig ist","impact":"high","effort":"medium","priority":"P1","category":"SEO","competitorHas":["Ahrefs"]},{"id":"g2","name":"Echtes Feature 2","why":"Warum","impact":"medium","effort":"low","priority":"P2","category":"Analytics","competitorHas":["SEMrush"]}],"quickWins":[{"id":"q1","name":"Quick Win","description":"Beschreibung","uiHint":"UI-Hinweis","hours":4}],"nextFeature":{"id":"f1","name":"Top-Priorität Feature","description":"Beschreibung","category":"SEO"},"marketTrends":["Trend 1","Trend 2","Trend 3"],"summary":"2 Sätze Fazit"}

Erstelle 6-8 topGaps und 2-3 quickWins mit echten Inhalten.`,
        }],
      }),
    });
    clearTimeout(timer);

    const apiData = await res.json();
    const text = apiData?.content?.[0]?.text || "";
    const parsed = extractJSON(text) || { ...FALLBACK, generatedAt: new Date().toISOString(), _fallback: true };

    if (ctx.env.CXF_KV) {
      await Promise.all([
        ctx.env.CXF_KV.put("lastFeatures", JSON.stringify(parsed)),
        ctx.env.CXF_KV.put("lastAutoRun", String(Date.now())),
      ]).catch(() => {});
    }

    return new Response(JSON.stringify({ running: false, ...parsed }), { headers: CORS });
  } catch (e) {
    // Even on error: return fallback data so the UI always shows something useful
    const fallback = { running: false, ...FALLBACK, generatedAt: new Date().toISOString(), _fallback: true, _error: e.message };
    return new Response(JSON.stringify(fallback), { headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
