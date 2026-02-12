import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── In-memory token cache (will be used once credentials are available) ──
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getDataverseToken(url: string, tenantId: string, clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: `${url}/.default`,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Token request failed with status", res.status);
    throw new Error(`OAuth2 token request failed (${res.status})`);
  }

  const json = await res.json();
  cachedToken = {
    token: json.access_token,
    expiresAt: now + (json.expires_in - 60) * 1000, // 60s buffer
  };
  return cachedToken.token;
}

function dataverseHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
    "Content-Type": "application/json; charset=utf-8",
  };
}

// ── Check if all required env vars are present ──
function getConfig() {
  const url = Deno.env.get("DATAVERSE_URL");
  const tenantId = Deno.env.get("DATAVERSE_TENANT_ID");
  const clientId = Deno.env.get("DATAVERSE_CLIENT_ID");
  const clientSecret = Deno.env.get("DATAVERSE_CLIENT_SECRET");

  if (!url || !tenantId || !clientId || !clientSecret) {
    return null;
  }
  return { url, tenantId, clientId, clientSecret };
}

// ── Action handlers (scaffolded, activate once credentials are set) ──
async function handleAction(action: string, params: Record<string, unknown>, config: { url: string; tenantId: string; clientId: string; clientSecret: string }) {
  const token = await getDataverseToken(config.url, config.tenantId, config.clientId, config.clientSecret);
  const base = `${config.url}/api/data/v9.2`;
  const headers = dataverseHeaders(token);

  switch (action) {
    case "listScenarios": {
      const res = await fetch(
        `${base}/cr277_scenarios?$select=cr277_scenarioid,cr277_name,createdon&$orderby=createdon desc&$top=25`,
        { headers }
      );
      if (!res.ok) {
        const text = await res.text();
        console.error("Dataverse listScenarios failed:", res.status);
        return { ok: false, error: "Failed to list scenarios from Dataverse.", details: { status: res.status } };
      }
      const json = await res.json();
      const items = (json.value || []).map((row: Record<string, unknown>) => ({
        id: row.cr277_scenarioid,
        name: row.cr277_name || "(unnamed)",
        createdOn: row.createdon,
      }));
      return { ok: true, items, source: "dataverse" };
    }

    case "getScenario": {
      const id = params?.id;
      if (!id) return { ok: false, error: "Missing required param: id" };
      const res = await fetch(
        `${base}/cr277_scenarios(${id})?$select=cr277_scenarioid,cr277_name,createdon`,
        { headers }
      );
      if (!res.ok) {
        console.error("Dataverse getScenario failed:", res.status);
        return { ok: false, error: "Failed to retrieve scenario from Dataverse.", details: { status: res.status } };
      }
      const row = await res.json();
      return {
        ok: true,
        item: {
          id: row.cr277_scenarioid,
          name: row.cr277_name || "(unnamed)",
          createdOn: row.createdon,
        },
        source: "dataverse",
      };
    }

    default:
      return { ok: false, error: `Unknown action: ${action}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── Health check ──
  if (req.method === "GET" && url.pathname.endsWith("/health")) {
    const config = getConfig();
    return new Response(
      JSON.stringify({ ok: true, hasDataverse: !!config }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── POST action dispatcher ──
  if (req.method === "POST") {
    const config = getConfig();

    // Credentials not yet configured — return safe placeholder
    if (!config) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Dataverse integration pending Azure app registration.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const { action, params } = await req.json();
      if (!action) {
        return new Response(
          JSON.stringify({ ok: false, error: "Missing required field: action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await handleAction(action, params || {}, config);
      return new Response(JSON.stringify(result), {
        status: result.ok ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Dataverse proxy error:", (err as Error).message);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal proxy error." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({ ok: false, error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
