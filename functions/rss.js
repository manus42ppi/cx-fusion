// GET /rss?domain=spiegel.de
// Tries common feed paths, returns parsed article list

const FEED_PATHS = [
  "/feed", "/feed/", "/rss", "/rss/", "/rss.xml", "/feed.xml",
  "/atom.xml", "/atom", "/feeds/posts/default", "/blog/feed",
  "/news/rss", "/nachrichten/rss", "/aktuell/rss",
];

function parseRSS(xml) {
  const items = [];
  const itemRx = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRx.exec(xml)) !== null && items.length < 30) {
    const block = m[1];
    const get = (tag) => {
      const r = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i");
      const x = r.exec(block);
      return x ? x[1].trim().replace(/<[^>]+>/g, "").slice(0, 400) : null;
    };
    const title = get("title");
    const desc  = get("description") || get("summary") || get("content:encoded");
    const link  = get("link") || get("guid");
    const date  = get("pubDate") || get("published") || get("dc:date");
    if (title) items.push({ title, desc, link, date });
  }
  return items;
}

export async function onRequestGet(ctx) {
  const domain = new URL(ctx.request.url).searchParams.get("domain");
  if (!domain) return new Response(JSON.stringify({ error: "Missing domain" }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

  const base = `https://${domain}`;
  for (const path of FEED_PATHS) {
    try {
      const r = await fetch(base + path, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; FeedFetcher/1.0)", "Accept": "application/rss+xml,application/xml,text/xml,*/*" },
        cf: { cacheTtl: 3600 },
      });
      if (!r.ok) continue;
      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("xml") && !ct.includes("rss") && !ct.includes("atom")) continue;
      const xml = await r.text();
      const items = parseRSS(xml);
      if (items.length > 0) {
        return new Response(JSON.stringify({ feedUrl: base + path, items }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    } catch { continue; }
  }
  return new Response(JSON.stringify({ feedUrl: null, items: [] }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" },
  });
}
