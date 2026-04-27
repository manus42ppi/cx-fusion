const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

export async function onRequestOptions() {
  return new Response(null, { headers: { ...CORS, "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}

export async function onRequestPost(ctx) {
  const { domain } = await ctx.request.json();
  const KEY = ctx.env.OPENPAGERANK_KEY || "";
  const res = await fetch(`https://openpagerank.com/api/v1.0/getPageRank?domains[]=${domain}`, {
    headers: { "API-OPR": KEY },
  });
  const data = await res.json();
  const entry = data?.response?.[0];
  return new Response(JSON.stringify({
    rank:       entry?.page_rank_integer ?? null,
    rankDecimal: entry?.page_rank_decimal ?? null,
    status:     entry?.status ?? null,
  }), { headers: CORS });
}
