const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

export async function onRequestOptions() {
  return new Response(null, { headers: { ...CORS, "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}

export async function onRequestPost(ctx) {
  const { domain } = await ctx.request.json();
  const KEY = ctx.env.WHOISJSON_KEY || "";

  // Primary: WhoisJSON
  try {
    const res = await fetch(`https://whoisjson.com/api/v1/whois?domain=${domain}`, {
      headers: { "Authorization": `TOKEN=${KEY}` },
    });
    const data = await res.json();
    const created = data?.created_date || data?.creation_date;
    const expires = data?.expiration_date;

    // Also fetch Wayback Machine for first snapshot date
    let firstSeen = null;
    try {
      const wb = await fetch(`https://archive.org/wayback/available?url=${domain}&timestamp=19960101`);
      const wbData = await wb.json();
      const ts = wbData?.archived_snapshots?.closest?.timestamp;
      if (ts) firstSeen = `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)}`;
    } catch { /* ignore */ }

    return new Response(JSON.stringify({
      registrar:    data?.registrar,
      createdDate:  created,
      expiresDate:  expires,
      updatedDate:  data?.updated_date,
      nameservers:  Array.isArray(data?.name_servers) ? data.name_servers.slice(0, 4) : [],
      status:       Array.isArray(data?.status) ? data.status[0] : data?.status,
      country:      data?.registrant_country || data?.admin_country,
      firstSeen,
    }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { headers: CORS });
  }
}
