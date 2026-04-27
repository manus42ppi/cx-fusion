const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

export async function onRequestPost(ctx) {
  try {
    const { domain } = await ctx.request.json();
    if (!domain) return new Response(JSON.stringify({ error: "domain required" }), { status: 400, headers: CORS });

    const aiBody = JSON.stringify({
      model: "claude-sonnet-4-6", max_tokens: 1500,
      messages: [{ role: "user", content: `Führe einen Quick-Scan der Domain "${domain}" durch. Antworte NUR mit JSON:
{"domain":"${domain}","reachable":true,"redirectsToWww":boolean,"hasHttps":boolean,"hasCookieBanner":boolean,"hasNewsletter":boolean,"hasShop":boolean,"hasBlog":boolean,"hasChatbot":boolean,"hasAnalytics":boolean,"hasSocialLinks":boolean,"mobileFriendly":"yes"|"likely"|"unknown","estimatedLoadTime":"fast"|"medium"|"slow","overallHealth":"good"|"fair"|"poor","notes":string[]}` }],
    });

    const apiKey = ctx.env.ANTHROPIC_API_KEY;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: aiBody,
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
