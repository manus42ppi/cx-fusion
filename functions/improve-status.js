const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

const DAY_MS = 24 * 60 * 60 * 1000;

export async function onRequestGet(ctx) {
  try {
    let status = {
      featureRunning: false,
      featureRunError: null,
      lastFeatures: null,
      lastReport: null,
      nextAutoRun: null,
      lastAutoRun: null,
      logCount: 0,
    };

    if (ctx.env.CXF_KV) {
      const [featuresRaw, reportRaw, lastRunRaw, logRaw] = await Promise.all([
        ctx.env.CXF_KV.get("lastFeatures"),
        ctx.env.CXF_KV.get("lastReport"),
        ctx.env.CXF_KV.get("lastAutoRun"),
        ctx.env.CXF_KV.get("improveLog"),
      ]);
      if (featuresRaw) status.lastFeatures = JSON.parse(featuresRaw);
      if (reportRaw)   status.lastReport   = JSON.parse(reportRaw);
      if (lastRunRaw) {
        const lastRun = parseInt(lastRunRaw);
        status.lastAutoRun  = lastRun;
        status.nextAutoRun  = lastRun + DAY_MS;
      }
      if (logRaw) {
        const log = JSON.parse(logRaw);
        status.logCount = Array.isArray(log) ? log.length : 0;
      }
    }

    return new Response(JSON.stringify(status), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ featureRunning: false, featureRunError: null }), { headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
