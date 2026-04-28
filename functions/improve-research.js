const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

export async function onRequestPost(ctx) {
  try {
    const apiKey = ctx.env.ANTHROPIC_API_KEY;

    const knownFeatures = [
      "Website-Analyse (PSI, PageRank, WHOIS, Tech-Stack)",
      "Content-Audit (RSS, Tonalität, Sentiment, Themen-Cluster)",
      "Website-Vergleich (2 Domains side-by-side)",
      "Batch-Analyse (bis zu 50 Domains)",
      "Structured Data Validator (Schema.org)",
      "Broken-Link-Checker",
      "SEO-Audit (Flesch-Kincaid, Meta-Tags, Canonical)",
      "SERP-Vorschau (Google-Snippets)",
      "Kundenverwaltung mit Report-Historie",
      "KI-Bug-Analyse & Verbesserungsvorschläge",
      "Traffic-Schätzung & Geo-Daten",
      "Domain-Historie & Archiv-Trends",
    ];

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6", max_tokens: 2000,
        messages: [{ role: "user", content: `Du analysierst die Web-Intelligence-Plattform "CX Fusion" mit diesen implementierten Features: ${knownFeatures.join(", ")}.

Analysiere den Markt für Web-Analytics/SEO-Tools (Ahrefs, SEMrush, Sistrix, Screaming Frog, etc.) und identifiziere die wertvollsten FEHLENDEN Features.

Antworte NUR mit JSON:
{
  "generatedAt": "${new Date().toISOString()}",
  "marketGaps": [
    {"id":string,"title":string,"description":string,"impact":"high"|"medium"|"low","effort":"low"|"medium"|"high","priority":"P1"|"P2"|"P3","category":string}
  ],
  "quickWins": [{"id":string,"title":string,"description":string,"hours":number}],
  "nextFeature": {"id":string,"title":string,"description":string,"category":string},
  "summary": string
}

Identifiziere 6-8 echte Marktlücken die noch NICHT in der implementierten Feature-Liste sind. nextFeature = höchste Priorität.` }],
      }),
    });

    const data = await res.json();
    const text = data?.content?.[0]?.text || "{}";
    const json = text.match(/\{[\s\S]*\}/s)?.[0] || "{}";
    const parsed = JSON.parse(json);

    // Store in KV if available
    if (ctx.env.CXF_KV) {
      await Promise.all([
        ctx.env.CXF_KV.put("lastFeatures", JSON.stringify(parsed)),
        ctx.env.CXF_KV.put("lastAutoRun", String(Date.now())),
      ]);
    }

    return new Response(JSON.stringify({ running: false, ...parsed }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
