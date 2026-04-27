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
        messages: [{ role: "user", content: `Du bist ein Code-Review-Experte für die ${context}. Analysiere typische Probleme und schlage Verbesserungen vor. Antworte NUR mit JSON:
{"suggestions":[{"title":string,"priority":"P1"|"P2"|"P3","file":string,"problem":string,"description":string,"solution":string}],"summary":string}
Erstelle 3-5 realistische, konkrete Verbesserungsvorschläge für eine Web-Analyse-Plattform (Performance, UX, Fehlerbehandlung, Code-Qualität).` }],
      }),
    });
    const data = await res.json();
    const text = data?.content?.[0]?.text || "{}";
    const json = text.match(/\{[\s\S]*\}/s)?.[0] || "{}";
    return new Response(json, { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
