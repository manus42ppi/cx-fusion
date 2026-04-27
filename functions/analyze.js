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

  const base = new URL(ctx.request.url);
  const origin = base.origin;

  // Fire all requests in parallel
  const [psi, pr, whois, crawl, tech] = await Promise.allSettled([
    fetch(`${origin}/pagespeed`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain }) }).then(r => r.json()),
    fetch(`${origin}/pagerank`,  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain }) }).then(r => r.json()),
    fetch(`${origin}/whois`,     { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain }) }).then(r => r.json()),
    fetch(`${origin}/crawl`,     { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain }) }).then(r => r.json()),
    fetch(`${origin}/tech`,      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain }) }).then(r => r.json()),
  ]);

  const val = (p) => p.status === "fulfilled" ? p.value : null;

  const result = {
    domain,
    analyzedAt: new Date().toISOString(),
    pagespeed: val(psi),
    pagerank:  val(pr),
    whois:     val(whois),
    crawl:     val(crawl),
    tech:      val(tech),
  };

  // AI traffic estimate + insights
  try {
    const aiRes = await fetch(`${origin}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: "Du bist ein Web-Analytics-Experte. Antworte immer als valides JSON.",
        messages: [{
          role: "user",
          content: `Analysiere die Website "${domain}" basierend auf diesen Daten:\n${JSON.stringify(result, null, 2)}\n\nGib ein JSON zurück mit:\n{\n  "trafficEstimate": { "monthly": number, "confidence": "low"|"medium"|"high", "range": { "min": number, "max": number } },\n  "globalRank": number,\n  "category": string,\n  "summary": string (2-3 Sätze auf Deutsch),\n  "strengths": string[],\n  "weaknesses": string[],\n  "recommendations": string[]\n}`,
        }],
      }),
    });
    const aiData = await aiRes.json();
    const text = aiData?.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) result.ai = JSON.parse(jsonMatch[0]);
  } catch {
    result.ai = null;
  }

  return new Response(JSON.stringify(result), { headers: CORS });
}
