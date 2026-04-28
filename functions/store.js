const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet(ctx) {
  const key = new URL(ctx.request.url).searchParams.get("key");
  if (!key) {
    return new Response(JSON.stringify({ error: "key required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
  try {
    const raw = await ctx.env.CXF_KV.get(key);
    const value = raw ? JSON.parse(raw) : null;
    return new Response(JSON.stringify({ value }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch {
    return new Response(JSON.stringify({ value: null }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

export async function onRequestPost(ctx) {
  try {
    const { key, value } = await ctx.request.json();
    if (!key) {
      return new Response(JSON.stringify({ error: "key required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }
    await ctx.env.CXF_KV.put(key, JSON.stringify(value));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch {
    return new Response(JSON.stringify({ error: "failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}
