// Main orchestrator – calls all sub-APIs in parallel and returns combined result

const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

export async function onRequestOptions() {
  return new Response(null, {
    headers: { ...CORS, "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
  });
}

// ── Homepage content fetcher ─────────────────────────────────────────────────
// Fetches the actual homepage HTML and extracts key content signals.
// This is the primary source for category + audience identification –
// prevents the AI from hallucinating based only on the domain name.
async function fetchHomepageContent(domain) {
  const urls = [`https://${domain}`, `https://www.${domain}`];
  for (const url of urls) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CXFusion/1.0; +https://cx-fusion.pages.dev)",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "de,en;q=0.9",
        },
        redirect: "follow",
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("html")) continue;

      // Read max 60 KB to keep it fast
      const buffer = await res.arrayBuffer();
      const html = new TextDecoder("utf-8", { fatal: false })
        .decode(buffer.slice(0, 60000));

      return parseHomepageContent(html, url);
    } catch { /* try next url */ }
  }
  return null;
}

function parseHomepageContent(html, fetchedUrl) {
  // Helper: extract first match of a regex, trim whitespace, decode basic HTML entities
  const get = (pattern) => {
    const m = html.match(pattern);
    if (!m?.[1]) return null;
    return m[1].trim()
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ").slice(0, 200);
  };
  const getAll = (pattern) => {
    const results = [];
    let m;
    const re = new RegExp(pattern.source, "gi");
    while ((m = re.exec(html)) !== null && results.length < 5) {
      const v = m[1]?.trim().replace(/\s+/g, " ").slice(0, 100);
      if (v && v.length > 2) results.push(v);
    }
    return results;
  };

  const title       = get(/<title[^>]*>([^<]{1,200})<\/title>/i);
  const description = get(/<meta\s+name=["']description["'][^>]+content=["']([^"']{1,300})/i)
                   || get(/<meta\s+content=["']([^"']{1,300})["'][^>]+name=["']description/i);
  const ogTitle     = get(/<meta\s+property=["']og:title["'][^>]+content=["']([^"']{1,200})/i)
                   || get(/<meta\s+content=["']([^"']{1,200})["'][^>]+property=["']og:title/i);
  const ogDesc      = get(/<meta\s+property=["']og:description["'][^>]+content=["']([^"']{1,300})/i)
                   || get(/<meta\s+content=["']([^"']{1,300})["'][^>]+property=["']og:description/i);
  const ogSiteName  = get(/<meta\s+property=["']og:site_name["'][^>]+content=["']([^"']{1,100})/i)
                   || get(/<meta\s+content=["']([^"']{1,100})["'][^>]+property=["']og:site_name/i);
  const h1s         = getAll(/<h1[^>]*>([^<]{2,150})<\/h1>/i);
  const h2s         = getAll(/<h2[^>]*>([^<]{2,100})<\/h2>/i);
  const lang        = get(/<html[^>]+lang=["']([^"']{2,10})/i);
  const canonical   = get(/<link\s+rel=["']canonical["'][^>]+href=["']([^"']{1,200})/i);

  // Extract keywords from meta keywords tag (if present)
  const keywords    = get(/<meta\s+name=["']keywords["'][^>]+content=["']([^"']{1,300})/i)
                   || get(/<meta\s+content=["']([^"']{1,300})["'][^>]+name=["']keywords/i);

  // Structured data hints (JSON-LD @type)
  const schemaTypes = [];
  const schemaRe = /"@type"\s*:\s*"([^"]{2,60})"/g;
  let sm;
  while ((sm = schemaRe.exec(html)) !== null && schemaTypes.length < 8) {
    if (!schemaTypes.includes(sm[1])) schemaTypes.push(sm[1]);
  }

  return {
    fetchedUrl,
    title,
    description,
    ogTitle,
    ogDesc,
    ogSiteName,
    h1s,
    h2s: h2s.slice(0, 3),
    lang,
    canonical,
    keywords,
    schemaTypes,
  };
}

// ── Main handler ─────────────────────────────────────────────────────────────

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

  // Fire all requests in parallel – including homepage fetch
  const [psi, pr, whois, crawl, tech, homepage] = await Promise.allSettled([
    post("/pagespeed", 12000),
    post("/pagerank",   8000),
    post("/whois",      8000),
    post("/crawl",     12000),
    post("/tech",      12000),
    fetchHomepageContent(domain),   // ← actual page content
  ]);

  const val = (p) => p.status === "fulfilled" ? p.value : null;

  const homepageData = val(homepage);

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
    homepage:     homepageData,   // expose to frontend for transparency
  };

  // ── AI Prompt ───────────────────────────────────────────────────────────────
  try {
    // Build a concise homepage content block for the prompt
    const hpSection = homepageData
      ? `
═══ TATSÄCHLICHER HOMEPAGE-INHALT (höchste Priorität!) ═══
URL:          ${homepageData.fetchedUrl || "-"}
Title:        ${homepageData.title || "nicht ermittelt"}
Description:  ${homepageData.description || "nicht ermittelt"}
OG-Title:     ${homepageData.ogTitle || "-"}
OG-Desc:      ${homepageData.ogDesc || "-"}
Site-Name:    ${homepageData.ogSiteName || "-"}
H1-Texte:     ${homepageData.h1s?.join(" | ") || "nicht ermittelt"}
H2-Texte:     ${homepageData.h2s?.join(" | ") || "-"}
Keywords-Tag: ${homepageData.keywords || "-"}
Sprache:      ${homepageData.lang || "-"}
Schema-Typen: ${homepageData.schemaTypes?.join(", ") || "-"}
════════════════════════════════════════════════════════`
      : `
WARNUNG: Homepage konnte nicht abgerufen werden.
category und audienceProfile MÜSSEN als "Nicht ermittelbar" gesetzt werden, da keine echten Inhaltsdaten vorliegen.`;

    const prompt = `Du analysierst die Website "${domain}".

${hpSection}

Technische Messdaten (sekundär – für Zahlen wie Traffic, Performance, SEO):
pagerank: ${JSON.stringify(result.pagerank)}
whois: ${JSON.stringify(result.whois)}
crawl: ${JSON.stringify(result.crawl)}
tech: ${JSON.stringify(result.tech)}
pagespeed: ${JSON.stringify(result.pagespeed)}
topPages: ${JSON.stringify(result.topPages)}

PFLICHTREGELN – diese gelten absolut:
1. "category" und "audienceProfile" MÜSSEN auf dem tatsächlichen Homepage-Inhalt basieren (Title, Description, H1, H2, Schema-Typen). Ignoriere den Domain-Namen vollständig für diese Felder.
2. Wenn du dir bei einem Feld nicht sicher bist: schreibe "Nicht ermittelbar" – erfinde KEINE plausibel klingenden Daten.
3. "audienceType" (B2B/B2C/Gemischt) muss mit "audienceProfile" logisch konsistent sein.
4. "trendSignal" und alle numerischen Felder dürfen geschätzt werden, aber nur auf Basis der technischen Daten.

ANFORDERUNGEN AN "audienceProfile" – sehr wichtig:
- Nenne KONKRET welche Produkte/Dienstleistungen angeboten werden (aus dem echten Seiteninhalt)
- Nenne KONKRET welche Zielgruppe das sind: Berufsbezeichnungen, Branchen, oder Personengruppen (nicht nur "gewerbliche Kunden")
- Nenne das KONKRETE BEDÜRFNIS oder den Anlass, warum diese Zielgruppe die Website besucht
- Format: 2 präzise Sätze. Satz 1: Was bietet die Website? Satz 2: Wer sind die typischen Besucher und was suchen sie?
- SCHLECHT: "Gewerbliche Kunden mit technischen Anforderungen" → zu generisch
- GUT: "HEROSE GmbH vertreibt Drahtseile, Seilschlösser und Hebetechnik für industrielle Anwendungen. Typische Besucher sind Einkäufer und Ingenieure aus Maschinenbau, Bergbau und Baugewerbe, die zertifizierte Lastaufnahmemittel beschaffen."
- Wenn der Seiteninhalt zu wenig verrät: schreibe was erkennbar ist + "Details nicht eindeutig ermittelbar"

Gib exakt dieses JSON zurück (kein Markdown, keine Erklärungen):
{
  "trafficEstimate": { "monthly": <zahl>, "confidence": "low"|"medium"|"high", "range": { "min": <zahl>, "max": <zahl> } },
  "globalRank": <zahl oder null>,
  "category": "<spezifische Branche auf Deutsch – NUR aus echtem Seiteninhalt ableiten, z.B. 'Industrielle Hebetechnik' nicht nur 'Industrie'>",
  "summary": "<2-3 Sätze Fazit auf Deutsch – beinhaltet konkrete Fakten aus den Daten>",
  "trafficSources": { "direct": <0-100>, "organic": <0-100>, "social": <0-100>, "referral": <0-100>, "email": <0-100>, "paid": <0-100> },
  "topCountries": [{ "country": "<Ländername DE>", "code": "<ISO2>", "share": <0-100> }],
  "audienceType": "B2B"|"B2C"|"Gemischt",
  "audienceProfile": "<2 präzise Sätze: Was bietet die Seite konkret? + Wer besucht sie und warum? – KEIN Raten, KEINE Generalisierungen>",
  "trendSignal": "wachsend"|"stabil"|"rückläufig",
  "trendReason": "<1 Satz mit konkretem Datenpunkt>",
  "behavior": {
    "bounceRate": <0-100>,
    "avgSessionDuration": <sekunden 60-600>,
    "pagesPerSession": <1.0-10.0>,
    "scrollDepth": { "p25": <0-100>, "p50": <0-100>, "p75": <0-100>, "p100": <0-100> },
    "deviceSplit": { "mobile": <0-100>, "desktop": <0-100>, "tablet": <0-100> },
    "topKeywords": ["<5 Suchbegriffe passend zum tatsächlichen Seitenthema>"],
    "newVsReturn": { "new": <0-100>, "returning": <0-100> },
    "topEntryPages": [{ "path": "<url-pfad>", "share": <0-100>, "label": "<seitenbeschreibung deutsch>", "avgTime": <sekunden> }],
    "topExitPages": [{ "path": "<url-pfad>", "share": <0-100>, "label": "<seitenbeschreibung>" }],
    "topReferrers": [{ "domain": "<referrer-domain>", "type": "search"|"social"|"news"|"partner"|"other", "share": <0-100> }],
    "topSections": [{ "path": "<pfad-prefix>", "label": "<abschnittsname>", "share": <0-100>, "avgTime": <sekunden> }],
    "topTopics": [{ "topic": "<thema passend zum echten Seiteninhalt>", "share": <0-100> }],
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
  "strengths": ["<max 3 – konkret, basierend auf tatsächlichen Daten>"],
  "weaknesses": ["<max 3 – konkret, basierend auf tatsächlichen Daten>"],
  "recommendations": ["<max 3 – konkrete Maßnahmen passend zur tatsächlichen Website>"],
  "dataQuality": {
    "homepageFetched": ${homepageData ? "true" : "false"},
    "categoryConfidence": "high"|"medium"|"low",
    "audienceConfidence": "high"|"medium"|"low",
    "trafficConfidence": "low"|"medium"|"high"
  }
}
Für trafficHistory: genau 8 Einträge für die letzten 8 Monate (aktuellster zuerst).`;

    const aiRes = await fetch(`${origin}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: "Du bist ein Web-Analytics-Experte. Antworte IMMER als valides JSON ohne Markdown-Codeblöcke. Erfinde keine Fakten – nutze ausschließlich die bereitgestellten Daten und den tatsächlichen Homepage-Inhalt.",
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
