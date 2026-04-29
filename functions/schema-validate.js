// Schema.org Structured Data Validator
// Fetches the target page, extracts real JSON-LD, validates with AI

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

export async function onRequestOptions() {
  return new Response(null, {
    headers: { ...CORS, "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
  });
}

// ── Extract JSON-LD blocks from HTML ──────────────────────────────────────────
function extractJsonLd(html) {
  const blocks = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      blocks.push({ parsed, raw: raw.slice(0, 600), valid: true });
    } catch (e) {
      blocks.push({ parsed: null, raw: raw.slice(0, 400), valid: false, parseError: e.message });
    }
  }
  return blocks;
}

// ── Extract basic meta signals ────────────────────────────────────────────────
function extractMeta(html) {
  const get = (pat) => { const m = html.match(pat); return m?.[1]?.trim().slice(0, 200) || null; };
  return {
    title:       get(/<title[^>]*>([^<]{1,200})<\/title>/i),
    description: get(/<meta\s+name=["']description["'][^>]+content=["']([^"']{1,300})/i)
                 || get(/<meta\s+content=["']([^"']{1,300})["'][^>]+name=["']description/i),
    ogType:      get(/<meta\s+property=["']og:type["'][^>]+content=["']([^"']{1,60})/i)
                 || get(/<meta\s+content=["']([^"']{1,60})["'][^>]+property=["']og:type/i),
  };
}

// ── Fetch page HTML ───────────────────────────────────────────────────────────
async function fetchPage(domain, path) {
  const urls = [`https://${domain}${path}`, `https://www.${domain}${path}`];
  for (const url of urls) {
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 7000);
      const res   = await fetch(url, {
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CXFusion/1.0)", "Accept": "text/html" },
        redirect: "follow",
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      if (!(res.headers.get("content-type") || "").includes("html")) continue;
      const buf  = await res.arrayBuffer();
      const html = new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, 80000));
      return { html, finalUrl: url };
    } catch { /* try next */ }
  }
  return null;
}

// ── Robust JSON extraction from AI text ──────────────────────────────────────
function extractJSON(text) {
  if (!text) return null;
  // Strip markdown code fences
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  // Find the outermost { ... } - greedy to get the full object
  const start = stripped.indexOf("{");
  if (start === -1) return null;
  // Walk forward to find the matching closing brace
  let depth = 0, i = start, inStr = false, esc = false;
  for (; i < stripped.length; i++) {
    const ch = stripped[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\" && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) break; }
  }
  const candidate = stripped.slice(start, i + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    // Last resort: try to find a shorter valid JSON
    const simpleMatch = stripped.match(/\{[\s\S]{10,}\}/);
    if (simpleMatch) {
      try { return JSON.parse(simpleMatch[0]); } catch {}
    }
    return null;
  }
}

// ── Build concise schema summary for AI (no large objects) ───────────────────
function summarizeSchemas(blocks) {
  return blocks.map((b, i) => {
    if (!b.valid) return `  Block ${i + 1}: [SYNTAXFEHLER] ${b.parseError} | Raw: ${b.raw.slice(0, 100)}`;
    const obj = b.parsed;
    if (!obj) return `  Block ${i + 1}: [leer]`;
    // Handle @graph arrays
    if (obj["@graph"]) {
      const types = obj["@graph"].map(n => n["@type"]).filter(Boolean).join(", ");
      const fields = obj["@graph"].map(n => Object.keys(n).join(", ")).join(" | ");
      return `  Block ${i + 1}: @graph mit Typen [${types}], Felder: ${fields}`;
    }
    const type   = Array.isArray(obj["@type"]) ? obj["@type"].join("|") : (obj["@type"] || "unbekannt");
    const fields = Object.keys(obj).join(", ");
    const sample = JSON.stringify(obj).slice(0, 200);
    return `  Block ${i + 1}: @type=${type} | Felder: ${fields}\n    Auszug: ${sample}`;
  }).join("\n");
}

const EXTRA_PATHS = ["/produkte", "/products", "/blog", "/about", "/ueber-uns", "/faq", "/kontakt"];

// ── Main handler ──────────────────────────────────────────────────────────────
export async function onRequestPost(ctx) {
  const { domain } = await ctx.request.json();
  if (!domain) return new Response(JSON.stringify({ error: "domain required" }), { status: 400, headers: CORS });

  const origin = new URL(ctx.request.url).origin;
  const clean  = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\/$/, "").toLowerCase();

  // 1. Fetch homepage + secondary pages in parallel
  const [homeRes, ...extraRes] = await Promise.allSettled([
    fetchPage(clean, "/"),
    ...EXTRA_PATHS.slice(0, 3).map(p => fetchPage(clean, p)),
  ]);

  const homePage = homeRes.status === "fulfilled" ? homeRes.value : null;
  if (!homePage) {
    return new Response(JSON.stringify({ error: `Website "${clean}" nicht erreichbar. Bitte Domain prüfen.` }), { status: 422, headers: CORS });
  }

  // 2. Extract structured data
  const pages = [];

  const homeJsonLd = extractJsonLd(homePage.html);
  const homeMeta   = extractMeta(homePage.html);
  pages.push({ url: homePage.finalUrl, path: "/", jsonLd: homeJsonLd, meta: homeMeta });

  for (let i = 0; i < extraRes.length; i++) {
    const r = extraRes[i];
    if (r.status !== "fulfilled" || !r.value) continue;
    const jl = extractJsonLd(r.value.html);
    const mt = extractMeta(r.value.html);
    if (jl.length > 0) {  // only include pages that actually have schemas
      pages.push({ url: r.value.finalUrl, path: EXTRA_PATHS[i], jsonLd: jl, meta: mt });
    }
  }

  const totalSchemas = pages.reduce((n, p) => n + p.jsonLd.length, 0);
  const brokenSchemas = pages.reduce((n, p) => n + p.jsonLd.filter(b => !b.valid).length, 0);

  // 3. Build compact prompt — no raw JSON objects in required response
  const pageDescriptions = pages.map(p => {
    const schemaCount = p.jsonLd.length;
    return [
      `Seite: ${p.url}`,
      `  Meta-Title: ${p.meta.title || "nicht gefunden"}`,
      `  Meta-Description: ${p.meta.description?.slice(0, 100) || "–"}`,
      `  JSON-LD-Blöcke: ${schemaCount}`,
      schemaCount > 0 ? summarizeSchemas(p.jsonLd) : "  [Keine Structured Data gefunden]",
    ].join("\n");
  }).join("\n\n");

  const prompt = `Schema.org Structured Data Analyse für: ${clean}

EXTRAHIERTE DATEN (${pages.length} Seiten, ${totalSchemas} JSON-LD-Blöcke, davon ${brokenSchemas} mit Syntaxfehlern):

${pageDescriptions}

${totalSchemas === 0 ? "HINWEIS: Keine JSON-LD-Blöcke gefunden – fehlende Structured Data ist selbst ein kritischer Befund." : ""}

Analysiere die obigen Daten und antworte mit folgendem JSON:
{
  "domain": "${clean}",
  "overallScore": 35,
  "pagesAnalyzed": ${pages.length},
  "totalSchemasFound": ${totalSchemas},
  "summary": "Kurze Bewertung in 1-2 Sätzen auf Deutsch",
  "pages": [
    {
      "url": "https://${clean}/",
      "schemaTypes": ["Organization"],
      "status": "warning",
      "issues": [
        { "type": "MISSING_FIELD", "message": "Beschreibung des Problems", "field": "Organization.logo" }
      ],
      "richSnippetPreview": "Welche Rich Snippets wären hier möglich?"
    }
  ],
  "missingOpportunities": [
    { "type": "BreadcrumbList", "priority": "high", "reason": "Grund warum sinnvoll" }
  ],
  "recommendations": [
    "Konkrete Empfehlung 1",
    "Konkrete Empfehlung 2"
  ]
}

Regeln:
- Genau 1 Eintrag pro analysierter Seite in "pages"
- "status": "valid" = alle Pflichtfelder OK | "warning" = empfohlene Felder fehlen | "error" = Pflichtfelder fehlen oder Syntaxfehler
- Kein schemaRaw-Feld im Response (spart Token)
- Keine Markdown-Codeblöcke, kein Text außerhalb des JSON`;

  try {
    const aiRes = await fetch(`${origin}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: "Du bist ein Schema.org-Validator. Antworte NUR mit gültigem JSON, ohne Markdown, ohne Text außerhalb des JSON-Objekts.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) throw new Error(`KI-Anfrage fehlgeschlagen (${aiRes.status})`);
    const aiData = await aiRes.json();
    const text   = aiData?.content?.[0]?.text || "";

    if (!text) throw new Error("KI hat keine Antwort zurückgegeben");

    const parsed = extractJSON(text);
    if (!parsed) {
      throw new Error("KI-Antwort konnte nicht als JSON gelesen werden. Bitte erneut versuchen.");
    }

    // Attach the real extracted schemas back for frontend display
    parsed._pages_raw = pages.map(p => ({
      url: p.url,
      schemas: p.jsonLd.map(b => ({ type: b.valid ? (b.parsed?.["@type"] || "unbekannt") : "SYNTAXFEHLER", raw: b.parsed, parseError: b.parseError || null })),
    }));

    return new Response(JSON.stringify(parsed), { headers: CORS });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message || "Analyse fehlgeschlagen. Bitte erneut versuchen." }),
      { status: 500, headers: CORS }
    );
  }
}
