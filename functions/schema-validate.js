// Schema.org Structured Data Validator
// Fetches the target page, extracts real JSON-LD + microdata, validates with AI

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

export async function onRequestOptions() {
  return new Response(null, {
    headers: { ...CORS, "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
  });
}

// ── Extract JSON-LD blocks from HTML ─────────────────────────────────────────
function extractJsonLd(html) {
  const blocks = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      blocks.push(parsed);
    } catch {
      // Include broken JSON as string so AI can spot the syntax error
      blocks.push({ _raw: raw.slice(0, 800), _parseError: true });
    }
  }
  return blocks;
}

// ── Extract Open Graph + basic meta for context ───────────────────────────────
function extractMeta(html) {
  const get = (pat) => { const m = html.match(pat); return m?.[1]?.trim().slice(0, 200) || null; };
  return {
    title:       get(/<title[^>]*>([^<]{1,200})<\/title>/i),
    description: get(/<meta\s+name=["']description["'][^>]+content=["']([^"']{1,300})/i)
                 || get(/<meta\s+content=["']([^"']{1,300})["'][^>]+name=["']description/i),
    ogType:      get(/<meta\s+property=["']og:type["'][^>]+content=["']([^"']{1,60})/i)
                 || get(/<meta\s+content=["']([^"']{1,60})["'][^>]+property=["']og:type/i),
    canonical:   get(/<link\s+rel=["']canonical["'][^>]+href=["']([^"']{1,300})/i),
  };
}

// ── Fetch page HTML (tries https + www) ──────────────────────────────────────
async function fetchPage(domain, path = "/") {
  const urls = [`https://${domain}${path}`, `https://www.${domain}${path}`];
  for (const url of urls) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CXFusion/1.0; +https://cx-fusion.pages.dev)",
          "Accept": "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("html")) continue;
      const buf = await res.arrayBuffer();
      const html = new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, 80000));
      return { html, finalUrl: url };
    } catch { /* try next */ }
  }
  return null;
}

// ── Pages to check ────────────────────────────────────────────────────────────
const EXTRA_PATHS = ["/produkte", "/products", "/blog", "/ueber-uns", "/about", "/kontakt", "/contact", "/faq", "/shop"];

export async function onRequestPost(ctx) {
  const { domain } = await ctx.request.json();
  if (!domain) return new Response(JSON.stringify({ error: "domain required" }), { status: 400, headers: CORS });

  const origin = new URL(ctx.request.url).origin;
  const clean = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();

  // 1. Fetch homepage + a few secondary pages in parallel
  const [homeResult, ...extraResults] = await Promise.allSettled([
    fetchPage(clean, "/"),
    ...EXTRA_PATHS.slice(0, 4).map(p => fetchPage(clean, p)),
  ]);

  const homePage = homeResult.status === "fulfilled" ? homeResult.value : null;

  if (!homePage) {
    return new Response(JSON.stringify({ error: "Website nicht erreichbar. Bitte prüfe die Domain." }), { status: 422, headers: CORS });
  }

  // 2. Extract structured data from all fetched pages
  const pages = [];

  // Homepage
  {
    const { html, finalUrl } = homePage;
    const jsonLd = extractJsonLd(html);
    const meta   = extractMeta(html);
    pages.push({ url: finalUrl, path: "/", jsonLd, meta, htmlSize: html.length });
  }

  // Extra pages (only those that actually loaded)
  for (let i = 0; i < extraResults.length; i++) {
    const res = extraResults[i];
    if (res.status !== "fulfilled" || !res.value) continue;
    const { html, finalUrl } = res.value;
    const jsonLd = extractJsonLd(html);
    const meta   = extractMeta(html);
    if (jsonLd.length > 0 || meta.title) {
      pages.push({ url: finalUrl, path: EXTRA_PATHS[i], jsonLd, meta, htmlSize: html.length });
    }
  }

  // 3. Build AI prompt with real extracted data
  const pagesSummary = pages.map(p =>
    `URL: ${p.url}\nJSON-LD Blöcke (${p.jsonLd.length}): ${JSON.stringify(p.jsonLd).slice(0, 1200)}\nMeta: ${JSON.stringify(p.meta)}`
  ).join("\n---\n");

  const totalSchemas = pages.reduce((n, p) => n + p.jsonLd.length, 0);
  const hasSchemas   = totalSchemas > 0;

  const prompt = `Du bist ein Schema.org-Experte. Analysiere die folgenden ECHTEN extrahierten Structured-Data-Blöcke von "${clean}".

ECHTE SEITENDATEN (${pages.length} Seiten gecrawlt, ${totalSchemas} JSON-LD-Blöcke gefunden):
${pagesSummary}

${!hasSchemas ? "WICHTIG: Es wurden KEINE JSON-LD-Blöcke gefunden. Das ist selbst ein kritischer Befund – fehlende Structured Data." : ""}

Aufgabe:
1. Prüfe jeden gefundenen JSON-LD-Block auf Schema.org-Konformität
2. Identifiziere fehlende Pflichtfelder, veraltete Typen, Syntaxfehler
3. Bewerte welche Rich-Snippet-Typen möglich wären (aber fehlen oder fehlerhaft sind)
4. Gib konkrete Verbesserungsempfehlungen

Antworte mit exakt diesem JSON (ohne Markdown-Codeblöcke, ohne Erklärungen außerhalb des JSON):
{
  "domain": "${clean}",
  "overallScore": 45,
  "pagesAnalyzed": 3,
  "totalSchemasFound": 2,
  "summary": "2 JSON-LD-Blöcke gefunden, davon 1 mit fehlendem Pflichtfeld. Organisation-Schema vorhanden, Product-Schema fehlt trotz Shop.",
  "pages": [
    {
      "url": "https://example.com/",
      "schemaTypes": ["Organization", "WebSite"],
      "status": "warning",
      "issues": [
        { "type": "MISSING_FIELD", "message": "logo-Feld fehlt im Organization-Schema", "field": "Organization.logo" },
        { "type": "RECOMMENDED", "message": "sameAs-Links zu Social Media fehlen", "field": "Organization.sameAs" }
      ],
      "richSnippetPreview": "Sitelinks Searchbox möglich wenn SearchAction korrekt implementiert",
      "schemaRaw": {}
    }
  ],
  "missingOpportunities": [
    { "type": "BreadcrumbList", "priority": "high", "reason": "Würde Breadcrumbs in Google-Suchergebnissen aktivieren" },
    { "type": "FAQPage", "priority": "medium", "reason": "FAQ-Bereich gefunden aber nicht als Schema markiert" }
  ],
  "recommendations": [
    "Organization-Schema um logo, sameAs und contactPoint ergänzen",
    "Für jedes Produkt ein Product-Schema mit price, availability und image hinzufügen"
  ]
}

Nutze NUR die tatsächlich extrahierten Daten. Erfinde keine Schemas die nicht vorhanden sind.
Für "schemaRaw" bei jedem page-Eintrag: gib das tatsächliche JSON-LD-Objekt an (oder null wenn keines gefunden).
Für "status": "valid" wenn alle Pflichtfelder OK, "warning" bei fehlenden empfohlenen Feldern, "error" bei Syntaxfehlern oder fehlenden Pflichtfeldern.`;

  try {
    const aiRes = await fetch(`${origin}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        system: "Du bist ein Schema.org-Validator. Antworte ausschließlich mit validem JSON ohne Markdown.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    const text   = aiData?.content?.[0]?.text || "";

    // Robust JSON extraction: strip fences, find outermost { }
    const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const match    = stripped.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("KI hat kein gültiges JSON zurückgegeben");

    const parsed = JSON.parse(match[0]);
    // Attach raw extracted data for debugging/transparency
    parsed._extracted = { pagesCount: pages.length, totalSchemas, hasSchemasOnHomepage: pages[0]?.jsonLd?.length > 0 };

    return new Response(JSON.stringify(parsed), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || "Analyse fehlgeschlagen" }), { status: 500, headers: CORS });
  }
}
