const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

export async function onRequestOptions() {
  return new Response(null, { headers: { ...CORS, "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}

export async function onRequestPost(ctx) {
  const { domain } = await ctx.request.json();
  const KEY = ctx.env.PSI_API_KEY || "";
  const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://${domain}&strategy=mobile&key=${KEY}`;
  const urlD = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://${domain}&strategy=desktop&key=${KEY}`;

  const [mob, desk] = await Promise.all([
    fetch(url).then(r => r.json()),
    fetch(urlD).then(r => r.json()),
  ]);

  const extract = (data) => {
    const cats = data?.lighthouseResult?.categories;
    const aud  = data?.lighthouseResult?.audits;
    return {
      performance:    Math.round((cats?.performance?.score || 0) * 100),
      accessibility:  Math.round((cats?.accessibility?.score || 0) * 100),
      seo:            Math.round((cats?.seo?.score || 0) * 100),
      bestPractices:  Math.round((cats?.["best-practices"]?.score || 0) * 100),
      lcp:  aud?.["largest-contentful-paint"]?.displayValue,
      cls:  aud?.["cumulative-layout-shift"]?.displayValue,
      fid:  aud?.["interactive"]?.displayValue,
      ttfb: aud?.["server-response-time"]?.displayValue,
      fcp:  aud?.["first-contentful-paint"]?.displayValue,
    };
  };

  return new Response(JSON.stringify({ mobile: extract(mob), desktop: extract(desk) }), { headers: CORS });
}
