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

Antworte NUR mit diesem JSON (kein Markdown, keine Erklärungen, nur reines JSON):
{
  "generatedAt": "${new Date().toISOString()}",
  "topGaps": [
    {"id":"g1","name":"Feature-Name","why":"Warum wichtig","impact":"high","effort":"low","priority":"P1","category":"SEO","competitorHas":["Ahrefs","SEMrush"]}
  ],
  "quickWins": [{"id":"q1","name":"Quick Win Name","description":"Kurze Beschreibung","uiHint":"UI Hinweis","hours":4}],
  "nextFeature": {"id":"f1","name":"Wichtigstes Feature","description":"Kurze Beschreibung","category":"Analytics"},
  "marketTrends": ["Trend 1","Trend 2","Trend 3"],
  "summary": "Zusammenfassung in 1-2 Sätzen"
}

Regeln: Identifiziere 6-8 echte Marktlücken. nextFeature = höchste Priorität. marketTrends: 3-5 aktuelle Trends. Kein Code-Feld, kein Markdown, nur valides JSON.` }],
      }),
    });

    const data = await res.json();
    if (!res.ok || data?.type === "error") {
      throw new Error(data?.error?.message || `Anthropic API Fehler: ${res.status}`);
    }
    const text = data?.content?.[0]?.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/s)?.[0] || "{}";
    let parsed;
    try {
      parsed = JSON.parse(jsonMatch);
    } catch {
      throw new Error("KI-Antwort konnte nicht als JSON gelesen werden. Bitte erneut versuchen.");
    }

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
