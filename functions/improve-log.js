const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

export async function onRequestGet(ctx) {
  try {
    let log = [];
    if (ctx.env.CXF_KV) {
      const raw = await ctx.env.CXF_KV.get("improveLog");
      if (raw) log = JSON.parse(raw);
    }
    return new Response(JSON.stringify(log), { headers: CORS });
  } catch (e) {
    return new Response("[]", { headers: CORS });
  }
}

export async function onRequestPost(ctx) {
  try {
    const entry = await ctx.request.json();
    if (ctx.env.CXF_KV) {
      const raw = await ctx.env.CXF_KV.get("improveLog");
      const log = raw ? JSON.parse(raw) : [];
      log.unshift({ ...entry, ts: new Date().toISOString() });
      await ctx.env.CXF_KV.put("improveLog", JSON.stringify(log.slice(0, 200)));
    }
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
