const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

export async function onRequestOptions() {
  return new Response(null, { headers: { ...CORS, "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}

export async function onRequestPost(_ctx) {
  const { domain } = await _ctx.request.json();

  try {
    // Common Crawl CDX API – count indexed pages for this domain
    const cdxUrl = `https://index.commoncrawl.org/CC-MAIN-2024-51-index?url=*.${domain}&output=json&limit=1000&fl=url`;
    const res = await fetch(cdxUrl);
    const text = await res.text();
    const lines = text.trim().split("\n").filter(Boolean);
    const pages = lines.length;

    // Backlink discovery via Common Crawl CDX: find pages linking TO this domain
    const blUrl = `https://index.commoncrawl.org/CC-MAIN-2024-51-index?url=*&output=json&limit=200&fl=url&filter=links:${domain}`;
    // Note: CDX doesn't support link filter directly – use a simpler approach
    // Query for pages that have the domain in their URL links (approximation)
    const referringRes = await fetch(
      `https://index.commoncrawl.org/CC-MAIN-2024-51-index?url=*${domain}*&output=json&limit=50&fl=url`
    );
    const refText = await referringRes.text();
    const refLines = refText.trim().split("\n").filter(Boolean);

    const backlinks = refLines
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean)
      .map(e => e.url)
      .filter(u => !u.includes(domain))
      .slice(0, 20);

    return new Response(JSON.stringify({ indexedPages: pages, backlinks }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), indexedPages: 0, backlinks: [] }), { headers: CORS });
  }
}
