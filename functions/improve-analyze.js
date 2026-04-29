const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

/** Strip markdown code fences and extract the first JSON object. Never throws. */
function extractJSON(text) {
  if (!text) return null;
  const stripped = text.replace(/^```[\w]*\n?/gm, "").replace(/^```$/gm, "").trim();
  const match = stripped.match(/\{[\s\S]*\}/s);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

const FALLBACK = {
  patterns: [
    { type: "Fehlerbehandlung", count: 3, severity: "medium", description: "API-Fehler werden nicht immer dem Nutzer angezeigt" },
    { type: "Performance", count: 2, severity: "low", description: "Mehrere parallele API-Aufrufe ohne Caching" },
  ],
  suggestions: [
    { title: "Fehler-Toast für API-Timeouts", priority: "P2", file: "src/utils/api.js", problem: "Timeout-Fehler werden ignoriert", description: "Bei API-Timeout sollte ein Toast erscheinen", solution: "Try-catch mit Toast-Notification ergänzen" },
    { title: "Report-Caching verbessern", priority: "P3", file: "src/context/AppContext.jsx", problem: "Gleiche Domain wird mehrfach analysiert", description: "Cache-Invalidierung nach 24h einbauen", solution: "savedAt prüfen und bei >24h neu laden" },
  ],
  summary: "Die Plattform läuft stabil. Hauptverbesserungspotenzial bei Fehlerbehandlung und Caching.",
};

export async function onRequestPost(ctx) {
  try {
    const body = await ctx.request.json().catch(() => ({}));
    const context = body.context || "CX Fusion Web Intelligence Platform";
    // Use /ai proxy (same-origin) — never call api.anthropic.com directly
    const origin = new URL(ctx.request.url).origin;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 55000);

    const res = await fetch(`${origin}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: "Du bist ein Code-Review-Experte. Antworte IMMER nur mit reinem JSON, ohne Markdown-Blöcke, ohne Erklärungen, ohne Code-Fences.",
        messages: [{
          role: "user",
          content: `Analysiere typische Probleme in der ${context} und schlage Verbesserungen vor.

Gib exakt dieses JSON zurück (fülle alle Felder mit echten Werten):
{"generatedAt":"${new Date().toISOString()}","patterns":[{"type":"Fehler-Kategorie","count":3,"severity":"high","description":"Beschreibung"},{"type":"Kategorie 2","count":2,"severity":"medium","description":"Beschreibung"}],"suggestions":[{"title":"Verbesserung 1","priority":"P1","file":"src/pages/Example.jsx","problem":"Problem-Beschreibung","description":"Details","solution":"Lösung"},{"title":"Verbesserung 2","priority":"P2","file":"src/utils/api.js","problem":"Problem","description":"Details","solution":"Lösung"}],"summary":"1-2 Sätze Fazit"}

Erstelle 2-4 patterns und 3-5 suggestions für eine Web-Analyse-Plattform. Keine code-Felder, kein Markdown.`,
        }],
      }),
    });
    clearTimeout(timer);

    const apiData = await res.json();
    const text = apiData?.content?.[0]?.text || "";
    const parsed = extractJSON(text) || { ...FALLBACK, generatedAt: new Date().toISOString(), _fallback: true };

    return new Response(JSON.stringify(parsed), { headers: CORS });
  } catch (e) {
    const fallback = { ...FALLBACK, generatedAt: new Date().toISOString(), _fallback: true };
    return new Response(JSON.stringify(fallback), { headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
