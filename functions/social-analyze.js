/**
 * POST /social-analyze
 * Deep social media intelligence:
 *  1. Crawl company website → extract real social links from HTML
 *  2. YouTube RSS feed      → real video count, posting frequency, last upload
 *  3. LinkedIn public page  → try to extract follower count
 *  4. OpenGraph metadata    → company description, title, image
 *  5. AI enrichment         → estimates for platforms with no real data
 */

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

// ── 1. Fetch company website HTML ─────────────────────────────────────────────

async function fetchHtml(domain) {
  for (const url of [`https://${domain}`, `https://www.${domain}`]) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CXFusion/1.0; +https://cx-fusion.pages.dev)",
          "Accept": "text/html,application/xhtml+xml",
        },
        cf: { cacheTtl: 1800 },
        signal: AbortSignal.timeout(9000),
      });
      if (r.ok) return await r.text();
    } catch {}
  }
  return "";
}

// ── 2. Extract social profile links from HTML ─────────────────────────────────

const SOCIAL_PATTERNS = {
  linkedin:  { re: /https?:\/\/(?:www\.)?linkedin\.com\/company\/([a-zA-Z0-9_\-.]+)/gi,  base: "https://www.linkedin.com/company/" },
  twitter:   { re: /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(?!intent|share|hashtag|search|home|i\/)([a-zA-Z0-9_]{1,15})/gi, base: "https://x.com/" },
  instagram: { re: /https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/gi,            base: "https://www.instagram.com/" },
  facebook:  { re: /https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share|plugins|login|dialog|photo|permalink|video)([a-zA-Z0-9._\-]+)/gi, base: "https://www.facebook.com/" },
  youtube:   { re: /https?:\/\/(?:www\.)?youtube\.com\/(?:channel\/|user\/|c\/|@)([a-zA-Z0-9_\-]+)/gi, base: "https://www.youtube.com/@" },
  tiktok:    { re: /https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9._\-]+)/gi,            base: "https://www.tiktok.com/@" },
};

function extractSocialLinks(html) {
  if (!html) return {};
  const found = {};
  for (const [platform, { re, base }] of Object.entries(SOCIAL_PATTERNS)) {
    re.lastIndex = 0;
    const m = re.exec(html);
    if (m) {
      const handle = m[1].replace(/\/$/, "");
      found[platform] = { url: base + handle, handle, source: "website_crawl" };
    }
  }
  return found;
}

// ── 3. OpenGraph metadata ─────────────────────────────────────────────────────

function extractOG(html) {
  if (!html) return {};
  const prop = (p) =>
    html.match(new RegExp(`<meta[^>]*property=["']og:${p}["'][^>]*content=["']([^"']+)["']`, "i"))?.[1]?.trim()
    || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${p}["']`, "i"))?.[1]?.trim()
    || null;
  const name = (n) =>
    html.match(new RegExp(`<meta[^>]*name=["']${n}["'][^>]*content=["']([^"']+)["']`, "i"))?.[1]?.trim() || null;
  return {
    title:       prop("title") || name("title") || null,
    description: prop("description") || name("description") || null,
    image:       prop("image") || null,
    locale:      prop("locale") || null,
  };
}

// ── 4. YouTube: get channel ID then RSS ───────────────────────────────────────

async function fetchYoutubeData(youtubeUrl) {
  let channelId = null;

  // Try to get the YouTube page to extract channelId
  try {
    const r = await fetch(youtubeUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CXFusion/1.0)" },
      cf: { cacheTtl: 3600 },
      signal: AbortSignal.timeout(7000),
    });
    if (r.ok) {
      const html = await r.text();
      // YouTube embeds channelId in JSON blobs
      const m = html.match(/"channelId"\s*:\s*"(UC[a-zA-Z0-9_\-]{22})"/);
      if (m) channelId = m[1];

      // Also try to get subscriber count from page
      const subMatch = html.match(/"subscriberCountText"\s*:\s*\{"simpleText"\s*:\s*"([^"]+)"/);
      // e.g. "12,4 Tsd. Abonnenten"
    }
  } catch {}

  if (!channelId) return null;

  // Fetch RSS feed
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const r = await fetch(rssUrl, {
      cf: { cacheTtl: 3600 },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return null;
    const xml = await r.text();

    // Parse video entries
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
    const videos = entries.map(e => {
      const b = e[1];
      const get = (tag) => b.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`))?.[1]?.trim() || "";
      const viewMatch = b.match(/yt:statistics[^>]+viewCount="(\d+)"/);
      return {
        title:     get("title"),
        published: get("published"),
        videoId:   get("yt:videoId"),
        views:     viewMatch ? parseInt(viewMatch[1]) : null,
      };
    }).filter(v => v.published);

    if (videos.length === 0) return null;

    const now = Date.now();
    const msDay = 86_400_000;
    const last30 = videos.filter(v => (now - new Date(v.published).getTime()) < 30 * msDay).length;
    const last90 = videos.filter(v => (now - new Date(v.published).getTime()) < 90 * msDay).length;
    const daysSinceLast = Math.floor((now - new Date(videos[0].published).getTime()) / msDay);

    return {
      channelId,
      last_post:      videos[0].published,
      posts_per_month: Math.round(last90 / 3),
      recentVideos:   videos.slice(0, 5).map(v => ({
        title:     v.title,
        published: v.published,
        url:       v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : null,
        views:     v.views,
      })),
      last30Days:    last30,
      last90Days:    last90,
      daysSinceLast,
      source: "youtube_rss",
    };
  } catch {
    return null;
  }
}

// ── 5. LinkedIn: try to scrape public company page ────────────────────────────

async function fetchLinkedInData(handle) {
  try {
    const r = await fetch(`https://www.linkedin.com/company/${handle}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CXFusion/1.0)",
        "Accept": "text/html",
        "Accept-Language": "de-DE,de;q=0.9",
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!r.ok) return null;
    const html = await r.text();

    const fMatch =
      html.match(/["']followerCount["']\s*:\s*(\d+)/) ||
      html.match(/(\d[\d.,]+)\s+(?:Follower|followers)/i);
    const followers = fMatch
      ? parseInt(fMatch[1].replace(/[.,]/g, ""))
      : null;

    const empMatch = html.match(/["']staffCountRange["']\s*:\s*["']([^"']+)["']/);
    const employees = empMatch ? empMatch[1] : null;

    return followers || employees
      ? { followers, employees, source: "linkedin_public" }
      : null;
  } catch {
    return null;
  }
}

// ── 6. AI enrichment with real context ───────────────────────────────────────

async function enrichWithAI(origin, domain, crawledProfiles, realMetrics, ogData) {
  const foundList = Object.entries(crawledProfiles)
    .map(([p, d]) => `  ${p}: @${d.handle} → ${d.url}`)
    .join("\n") || "  (no social links found on website)";

  const realList = Object.entries(realMetrics)
    .map(([p, d]) => `  ${p}: ${JSON.stringify(d)}`)
    .join("\n") || "  (no real data retrieved)";

  const prompt = `Du bist ein Social-Media-Analyst. Du hast ECHTE gecrawlte Daten von der Website der Domain "${domain}".

Unternehmensdaten von der Website:
  Titel: ${ogData?.title || domain}
  Beschreibung: ${ogData?.description || "nicht verfügbar"}

ECHTE Social-Profile (per Website-Crawl gefunden):
${foundList}

ECHTE Metriken aus echten Datenquellen (YouTube RSS, LinkedIn Public):
${realList}

Aufgabe: Fehlende Metriken auf Basis von Unternehmensgröße, Branche und bekanntem Kontext schätzen. Für nicht gecrawlte Plattformen: schätzen ob Profil wahrscheinlich existiert.

"ai_summary" Schreibregel – STRIKT:
• Kurze Sätze, max. 12 Wörter. Aufteilen wenn länger.
• Mit konkreter Zahl beginnen ("3 Plattformen aktiv.", "LinkedIn: 1.200 Follower.")
• Imperativ für Empfehlungen ("Erstelle...", "Schalte ein...", "Poste...")
• VERBOTEN: ganzheitlich, optimieren, zielgerichtet, nachhaltig, maßgeblich, "sollte", "es gilt", "wichtig", "effektiv", "bietet", "umfassend"
• Beispiel GUT: "LinkedIn: 1.200 Follower, 8 Posts/Monat. YouTube-Kanal inaktiv seit 6 Monaten. Starte Instagram — Branche hat 4,2% Engagement."
• Beispiel SCHLECHT: "Das Unternehmen sollte seine Social-Media-Präsenz ganzheitlich optimieren und nachhaltig ausbauen."

Antworte NUR mit gültigem JSON (kein Markdown):
{
  "metrics": {
    "linkedin":  { "followers": <int|null>, "posts_per_month": <int|null>, "engagement_rate": <0.001-0.1|null>, "last_post": "<ISO-Datum|null>" },
    "twitter":   { "followers": <int|null>, "posts_per_month": <int|null>, "engagement_rate": <0.001-0.1|null>, "last_post": "<ISO-Datum|null>" },
    "instagram": { "followers": <int|null>, "posts_per_month": <int|null>, "engagement_rate": <0.001-0.1|null>, "last_post": "<ISO-Datum|null>" },
    "facebook":  { "followers": <int|null>, "posts_per_month": <int|null>, "engagement_rate": <0.001-0.1|null>, "last_post": "<ISO-Datum|null>" },
    "youtube":   { "followers": <int|null>, "posts_per_month": <int|null>, "engagement_rate": <0.001-0.1|null>, "last_post": "<ISO-Datum|null>" },
    "tiktok":    { "followers": <int|null>, "posts_per_month": <int|null>, "engagement_rate": <0.001-0.1|null>, "last_post": "<ISO-Datum|null>" }
  },
  "score": <0-100>,
  "company_type": "<B2B|B2C|Mixed>",
  "primary_platform": "<platform key>",
  "company_size": "<startup|smb|mid_market|enterprise>",
  "industry": "<Branche auf Deutsch>",
  "maturity": "<beginner|developing|established|leader>",
  "ai_summary": "<2-3 Sätze auf Deutsch – konkret, direkt, mit Zahlen, kein KI-Jargon>"
}`;

  try {
    const r = await fetch(`${origin}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }], max_tokens: 1800 }),
      signal: AbortSignal.timeout(45000),
    });
    if (!r.ok) return {};
    const d = await r.json();
    const text = d.content?.[0]?.text ?? d.choices?.[0]?.message?.content ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : {};
  } catch {
    return {};
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function onRequestPost(ctx) {
  const body = await ctx.request.json().catch(() => ({}));
  const domain = (body.domain || "").trim().replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  if (!domain) return json({ error: "Missing domain" }, 400);

  const origin = new URL(ctx.request.url).origin;

  // Step 1: Crawl website
  const html = await fetchHtml(domain);
  const crawledProfiles = extractSocialLinks(html);
  const ogData = extractOG(html);

  // Step 2: Real data in parallel
  const realMetrics = {};
  const tasks = [];

  if (crawledProfiles.youtube) {
    tasks.push(
      fetchYoutubeData(crawledProfiles.youtube.url)
        .then(d => { if (d) realMetrics.youtube = d; })
        .catch(() => {})
    );
  }
  if (crawledProfiles.linkedin) {
    tasks.push(
      fetchLinkedInData(crawledProfiles.linkedin.handle)
        .then(d => { if (d) realMetrics.linkedin = d; })
        .catch(() => {})
    );
  }

  await Promise.allSettled(tasks);

  // Step 3: AI enrichment
  const ai = await enrichWithAI(origin, domain, crawledProfiles, realMetrics, ogData);

  // Step 4: Merge (real data wins over AI)
  const platforms = ["linkedin", "twitter", "instagram", "facebook", "youtube", "tiktok"];
  const finalProfiles = {};
  const finalMetrics  = {};

  for (const p of platforms) {
    finalProfiles[p] = crawledProfiles[p] || null;
    // Merge AI metrics with real overwrites
    const aiM  = ai.metrics?.[p] || {};
    const realM = realMetrics[p] || {};
    finalMetrics[p] = {
      ...aiM,
      // Real data overrides AI estimates field by field
      ...(realM.followers     != null ? { followers:      realM.followers }      : {}),
      ...(realM.last_post     != null ? { last_post:       realM.last_post }      : {}),
      ...(realM.posts_per_month!=null ? { posts_per_month: realM.posts_per_month }: {}),
      source: realM.source || (finalProfiles[p] ? "ai_estimate_real_handle" : "ai_estimate"),
    };
  }

  // Attach YouTube detail to youtube metrics
  if (realMetrics.youtube) {
    finalMetrics.youtube.recentVideos = realMetrics.youtube.recentVideos;
    finalMetrics.youtube.last30Days   = realMetrics.youtube.last30Days;
    finalMetrics.youtube.daysSinceLast = realMetrics.youtube.daysSinceLast;
  }

  return json({
    profiles: finalProfiles,
    metrics:  finalMetrics,
    score:    ai.score ?? 0,
    company_type:    ai.company_type    || null,
    primary_platform:ai.primary_platform|| null,
    company_size:    ai.company_size    || null,
    industry:        ai.industry        || null,
    maturity:        ai.maturity        || null,
    ai_summary:      ai.ai_summary      || null,
    ogData,
    dataSource: {
      crawled:  Object.keys(crawledProfiles),
      realData: Object.keys(realMetrics),
      aiOnly:   platforms.filter(p => !crawledProfiles[p]),
    },
    crawledAt: new Date().toISOString(),
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
