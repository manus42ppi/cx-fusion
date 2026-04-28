const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

export async function onRequestPost(ctx) {
  try {
    const body = await ctx.request.json().catch(() => ({}));
    const context = body.context || "CX Fusion Web Intelligence Platform";
    const apiKey = ctx.env.ANTHROPIC_API_KEY;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6", max_tokens: 2000,
        messages: [{ role: "user", content: `Du bist ein Code-Review-Experte für die ${context}. Analysiere typische Probleme und schlage Verbesserungen vor.

Antworte NUR mit diesem JSON (kein Markdown, keine Erklärungen, nur reines JSON):
{
  "generatedAt": "${new Date().toISOString()}",
  "patterns": [
    {"type":"Fehler-Typ","count":3,"severity":"high","description":"Beschreibung des Musters"}
  ],
  "suggestions": [
    {"title":"Verbesserung Titel","priority":"P1","file":"src/pages/Example.jsx","problem":"Was ist das Problem","description":"Detaillierte Beschreibung","solution":"Wie lösen"}
  ],
  "summary": "Zusammenfassung in 1-2 Sätzen"
}

Erstelle 2-4 realistische Fehler-Muster (patterns) und 3-5 konkrete Verbesserungsvorschläge (suggestions) für eine Web-Analyse-Plattform (Performance, UX, Fehlerbehandlung, Code-Qualität). Kein code-Feld in suggestions, kein Markdown, nur valides JSON.` }],
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
    return new Response(JSON.stringify(parsed), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
