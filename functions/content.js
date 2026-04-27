const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();
}

async function fetchPage(url) {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CXFusion-Bot/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("html")) return null;
    const html = await r.text();
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    const descM = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']{1,300})["']/i)
      || html.match(/<meta[^>]*content=["']([^"']{1,300})["'][^>]*name=["']description["']/i);
    const desc = descM?.[1] || "";
    const text = extractText(html).slice(0, 4000);
    if (text.length < 80) return null;
    return { url, title, desc, text };
  } catch { return null; }
}

export async function onRequestPost(ctx) {
  const { domain } = await ctx.request.json();
  if (!domain) return new Response(JSON.stringify({ error: "domain required" }), { status: 400, headers: CORS });

  const base = `https://${domain}`;
  const home = await fetchPage(base);
  if (!home) return new Response(JSON.stringify({ pages: [], error: "Homepage nicht erreichbar" }), { headers: CORS });

  const linkRe = /href=["'](\/[a-z0-9/_-]{2,60})["']/gi;
  const internalPaths = [...new Set([...home.text.matchAll(linkRe)].map(m => m[1]))]
    .filter(p => !/\.(jpg|png|gif|svg|pdf|css|js|ico|xml|json)$/i.test(p))
    .slice(0, 6);

  const extras = (await Promise.allSettled(
    internalPaths.map(p => fetchPage(base + p))
  )).filter(r => r.status === "fulfilled" && r.value).map(r => r.value);

  return new Response(JSON.stringify({ pages: [home, ...extras.slice(0, 4)] }), { headers: CORS });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
