const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

// In production: status is read from KV if available, else returns idle
export async function onRequestGet(ctx) {
  try {
    let status = { featureRunning: false, featureRunError: null, lastFeatures: null, lastReport: null };
    if (ctx.env.CXF_KV) {
      const [featuresRaw, reportRaw] = await Promise.all([
        ctx.env.CXF_KV.get("lastFeatures"),
        ctx.env.CXF_KV.get("lastReport"),
      ]);
      if (featuresRaw) status.lastFeatures = JSON.parse(featuresRaw);
      if (reportRaw)   status.lastReport   = JSON.parse(reportRaw);
    }
    return new Response(JSON.stringify(status), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ featureRunning: false, featureRunError: null }), { headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
