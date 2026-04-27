const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

export async function onRequestPost(ctx) {
  try {
    const { domain, urls } = await ctx.request.json();
    if (!domain) return new Response(JSON.stringify({ error: "domain required" }), { status: 400, headers: CORS });

    const checkUrls = urls?.length ? urls.slice(0, 20) : [`https://${domain}`];
    const results = [];

    for (const url of checkUrls) {
      try {
        const r = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(8000) });
        results.push({ url, status: r.status, ok: r.ok, redirected: r.redirected, finalUrl: r.url });
      } catch (e) {
        results.push({ url, status: 0, ok: false, error: e.message });
      }
    }

    const broken = results.filter(r => !r.ok);
    return new Response(JSON.stringify({ domain, checked: results.length, broken: broken.length, results }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
