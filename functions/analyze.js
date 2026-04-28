// Main orchestrator – calls all sub-APIs in parallel and returns combined result

const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

export async function onRequestOptions() {
  return new Response(null, {
    headers: { ...CORS, "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
  });
}

export async function onRequestPost(ctx) {
  const { domain } = await ctx.request.json();
  if (!domain) return new Response(JSON.stringify({ error: "domain required" }), { status: 400, headers: CORS });

  const base   = new URL(ctx.request.url);
  const origin = base.origin;

  const post = (path, ms = 10000) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    return fetch(`${origin}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
      signal: ctrl.signal,
    }).then(r => r.json()).finally(() => clearTimeout(timer));
  };

  // Fire all requests in parallel with individual timeouts
  const [psi, pr, whois, crawl, tech] = await Promise.allSettled([
    post("/pagespeed", 12000),
    post("/pagerank",   8000),
    post("/whois",      8000),
    post("/crawl",     12000),
    post("/tech",      12000),
  ]);

  const val = (p) => p.status === "fulfilled" ? p.value : null;

  const result = {
    domain,
    analyzedAt:   new Date().toISOString(),
    pagespeed:    val(psi),
    pagerank:     val(pr),
    whois:        val(whois),
    crawl:        val(crawl),
    tech:         val(tech),
    topPages:     val(crawl)?.topPages || [],
    archiveTrend: [],
  };

  // Full AI prompt – identical to local-server.js
  try {
    const prompt = `Analysiere die Website "${domain}" basierend auf diesen realen Daten:
pagerank: ${JSON.stringify(result.pagerank)},
whois: ${JSON.stringify(result.whois)},
crawl: ${JSON.stringify(result.crawl)},
tech: ${JSON.stringify(result.tech)},
pagespeed: ${JSON.stringify(result.pagespeed)},
topPages: ${JSON.stringify(result.topPages)},
archiveTrend: ${JSON.stringify(result.archiveTrend)}

Gib exakt dieses JSON zurück (kein Markdown, keine Erklärungen):
{
  "trafficEstimate": { "monthly": <zahl>, "confidence": "low"|"medium"|"high", "range": { "min": <zahl>, "max": <zahl> } },
  "globalRank": <zahl oder null>,
  "category": "<Branche auf Deutsch>",
  "summary": "<2-3 Sätze Fazit auf Deutsch>",
  "trafficSources": { "direct": <0-100>, "organic": <0-100>, "social": <0-100>, "referral": <0-100>, "email": <0-100>, "paid": <0-100> },
  "topCountries": [{ "country": "<Ländername DE>", "code": "<ISO2>", "share": <0-100> }],
  "audienceType": "B2B"|"B2C"|"Gemischt",
  "audienceProfile": "<1 Satz: Wer besucht diese Seite?>",
  "trendSignal": "wachsend"|"stabil"|"rückläufig",
  "trendReason": "<1 Satz warum>",
  "behavior": {
    "bounceRate": <0-100>,
    "avgSessionDuration": <sekunden 60-600>,
    "pagesPerSession": <1.0-10.0>,
    "scrollDepth": { "p25": <0-100>, "p50": <0-100>, "p75": <0-100>, "p100": <0-100> },
    "deviceSplit": { "mobile": <0-100>, "desktop": <0-100>, "tablet": <0-100> },
    "topKeywords": ["<5 konkrete Suchbegriffe die echte Nutzer eingeben>"],
    "newVsReturn": { "new": <0-100>, "returning": <0-100> },
    "topEntryPages": [{ "path": "<url-pfad>", "share": <0-100>, "label": "<seitenbeschreibung deutsch>", "avgTime": <sekunden> }],
    "topExitPages": [{ "path": "<url-pfad>", "share": <0-100>, "label": "<seitenbeschreibung>" }],
    "topReferrers": [{ "domain": "<referrer-domain>", "type": "search"|"social"|"news"|"partner"|"other", "share": <0-100> }],
    "topSections": [{ "path": "<pfad-prefix>", "label": "<abschnittsname>", "share": <0-100>, "avgTime": <sekunden> }],
    "topTopics": [{ "topic": "<thema auf deutsch>", "share": <0-100> }],
    "peakHours": [{ "hour": <0-23>, "relative": <0-100> }]
  },
  "seo": {
    "organicKeywords": <geschätzte Anzahl rankender Keywords>,
    "organicKeywordsTrend": "wachsend"|"stabil"|"rückläufig",
    "paidKeywords": <Anzahl oder null>,
    "seoValue": <monatlicher SEO-Traffic-Wert in EUR>
  },
  "paid": {
    "monthlyClicks": <bezahlte Klicks/Monat oder null>,
    "keywords": <Anzahl paid Keywords oder null>,
    "estimatedCost": <geschätzte monatliche Ausgaben in EUR oder null>
  },
  "aiOverviews": {
    "score": <0-100>,
    "aioTrafficShare": <0-100>,
    "assessment": "<1 Satz Bewertung auf Deutsch>"
  },
  "trafficHistory": [
    ["<YYYY-MM>", <organische Besuche>, <paid Klicks>, <direkte Besuche>]
  ],
  "strengths": ["<max 3>"],
  "weaknesses": ["<max 3>"],
  "recommendations": ["<max 3 konkrete>"]
}
Für trafficHistory: genau 8 Einträge für die letzten 8 Monate (aktuellster zuerst).`;

    const aiRes = await fetch(`${origin}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: "Du bist ein Web-Analytics-Experte. Antworte IMMER als valides JSON ohne Markdown-Codeblöcke.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const aiData  = await aiRes.json();
    const text    = aiData?.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) result.ai = JSON.parse(jsonMatch[0]);
    else result.ai = null;
  } catch {
    result.ai = null;
  }

  return new Response(JSON.stringify(result), { headers: CORS });
}
