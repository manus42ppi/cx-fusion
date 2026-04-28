const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

export async function onRequestOptions() {
  return new Response(null, { headers: { ...CORS, "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}

// Lightweight tech detection from HTML + HTTP headers
const SIGNATURES = {
  cms: [
    { name: "WordPress",  pattern: /wp-content|wp-includes|wordpress/i },
    { name: "Shopify",    pattern: /cdn\.shopify\.com|shopify/i },
    { name: "Webflow",    pattern: /webflow\.com|data-wf-/i },
    { name: "Wix",        pattern: /wix\.com|wixsite/i },
    { name: "Squarespace",pattern: /squarespace\.com/i },
    { name: "Drupal",     pattern: /drupal/i },
    { name: "Joomla",     pattern: /joomla/i },
    { name: "Ghost",      pattern: /ghost\.org|content\.ghost/i },
    { name: "TYPO3",      pattern: /typo3/i },
    { name: "HubSpot",    pattern: /hs-scripts\.com|hubspot/i },
  ],
  analytics: [
    { name: "Google Analytics 4", pattern: /gtag\('config'|G-[A-Z0-9]+/i },
    { name: "Google Analytics UA",pattern: /UA-[0-9]+-[0-9]+/i },
    { name: "Matomo",     pattern: /matomo\.js|_paq/i },
    { name: "Plausible",  pattern: /plausible\.io/i },
    { name: "Hotjar",     pattern: /hotjar\.com/i },
    { name: "Mixpanel",   pattern: /mixpanel\.com/i },
    { name: "Segment",    pattern: /segment\.com|analytics\.js/i },
    { name: "Clarity",    pattern: /clarity\.ms/i },
    { name: "Fathom",     pattern: /usefathom\.com/i },
  ],
  framework: [
    { name: "React",      pattern: /__REACT_|react\.development|react\.production/i },
    { name: "Next.js",    pattern: /_next\/static|__NEXT_DATA__/i },
    { name: "Nuxt.js",    pattern: /__nuxt|_nuxt\//i },
    { name: "Vue.js",     pattern: /vue\.min\.js|vue@/i },
    { name: "Angular",    pattern: /ng-version|angular\.min/i },
    { name: "Svelte",     pattern: /svelte/i },
    { name: "Gatsby",     pattern: /gatsby-/i },
    { name: "Astro",      pattern: /astro/i },
    { name: "Remix",      pattern: /remix/i },
  ],
  cdn: [
    { name: "Cloudflare", header: "cf-ray" },
    { name: "Fastly",     header: "x-served-by" },
    { name: "Akamai",     header: "x-akamai-transformed" },
    { name: "AWS CloudFront", header: "x-amz-cf-id" },
    { name: "Vercel",     header: "x-vercel-id" },
    { name: "Netlify",    header: "x-nf-request-id" },
  ],
  ecommerce: [
    { name: "WooCommerce",pattern: /woocommerce/i },
    { name: "Shopify",    pattern: /shopify/i },
    { name: "Magento",    pattern: /magento/i },
    { name: "PrestaShop", pattern: /prestashop/i },
    { name: "BigCommerce",pattern: /bigcommerce/i },
  ],
  marketing: [
    { name: "Google Tag Manager", pattern: /gtm\.js|GTM-/i },
    { name: "Facebook Pixel",     pattern: /connect\.facebook\.net|fbevents/i },
    { name: "LinkedIn Insight",   pattern: /snap\.licdn\.com/i },
    { name: "TikTok Pixel",       pattern: /analytics\.tiktok\.com/i },
    { name: "Mailchimp",          pattern: /mailchimp\.com/i },
    { name: "Klaviyo",            pattern: /klaviyo\.com/i },
    { name: "Intercom",           pattern: /intercom\.io/i },
    { name: "Zendesk",            pattern: /zendesk\.com/i },
  ],
};

export async function onRequestPost(_ctx) {
  const { domain } = await _ctx.request.json();

  try {
    const t0 = Date.now();
    const res = await fetch(`https://${domain}`, {
      headers: { "User-Agent": "CXFusion-Bot/1.0 (web analytics; contact@cxfusion.io)" },
      redirect: "follow",
    });
    const ttfb = Date.now() - t0;

    const headers = Object.fromEntries(res.headers.entries());
    const html = await res.text();
    const totalTime = Date.now() - t0;
    const combined = html;

    const detected = {};
    for (const [cat, sigs] of Object.entries(SIGNATURES)) {
      detected[cat] = [];
      for (const sig of sigs) {
        if (sig.pattern && sig.pattern.test(combined)) detected[cat].push(sig.name);
        if (sig.header && headers[sig.header])          detected[cat].push(sig.name);
      }
      detected[cat] = [...new Set(detected[cat])];
    }

    // Security headers
    const secHeaders = {
      hsts:           !!headers["strict-transport-security"],
      csp:            !!headers["content-security-policy"],
      xFrame:         !!headers["x-frame-options"],
      xContentType:   !!headers["x-content-type-options"],
      referrerPolicy: !!headers["referrer-policy"],
      permissions:    !!headers["permissions-policy"],
    };
    const secScore = Object.values(secHeaders).filter(Boolean).length; // 0-6

    // Performance score from TTFB + headers
    const perfScore = (() => {
      let s = 0;
      if (ttfb < 200)       s += 30;
      else if (ttfb < 600)  s += 20;
      else if (ttfb < 1500) s += 10;
      if (headers["content-encoding"]?.includes("gzip") || headers["content-encoding"]?.includes("br")) s += 20;
      if (secHeaders.hsts)  s += 15;
      if (secHeaders.csp)   s += 10;
      if (!headers["x-powered-by"]) s += 10;
      if (res.status === 200) s += 15;
      return Math.min(s, 100);
    })();

    const scripts = (html.match(/<script/gi) || []).length;
    const images  = (html.match(/<img/gi) || []).length;
    const styles  = (html.match(/<link[^>]+stylesheet/gi) || []).length;

    const ssl = {
      hsts:          secHeaders.hsts,
      csp:           secHeaders.csp,
      xFrame:        secHeaders.xFrame,
      xContentType:  secHeaders.xContentType,
      referrerPolicy:secHeaders.referrerPolicy,
      protocol:      "HTTPS",
      server:        headers["server"] || null,
      powered:       headers["x-powered-by"] || null,
    };

    const perf = {
      ttfb,
      totalTime,
      compression:  headers["content-encoding"] || null,
      server:       headers["server"] || null,
      powered:      headers["x-powered-by"] || null,
      perfScore,
      secScore,
      scripts,
      images,
      styles,
      htmlSizeKb:   Math.round(html.length / 1024),
    };

    return new Response(JSON.stringify({ detected, ssl, perf, status: res.status }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), detected: {}, ssl: {}, perf: {} }), { headers: CORS });
  }
}
