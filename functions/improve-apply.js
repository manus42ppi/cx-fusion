const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

// In production: auto-apply is not available (dev-only feature)
export async function onRequestPost() {
  return new Response(JSON.stringify({
    ok: false,
    message: "Auto-Apply ist nur in der lokalen Entwicklungsumgebung verfügbar.",
  }), { status: 200, headers: CORS });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
