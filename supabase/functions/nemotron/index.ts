import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "nvidia/nemotron-3-nano-30b-a3b";
const BASE_URL = "https://integrate.api.nvidia.com/v1";
const NIM_TIMEOUT_MS = 15000;

type FallbackReason = "rate_limited" | "upstream_error" | "timeout";

function buildFallbackResponse(reason: FallbackReason) {
  return {
    ok: true,
    fallback: true,
    reason,
    data: {
      insights: [
        "Live AI analysis is temporarily unavailable. Showing fallback outage guidance.",
      ],
      actions: [
        "Proceed with baseline runbook checks and retry AI insights shortly.",
      ],
      confidence: "Low",
      updatedAt: new Date().toISOString(),
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const isHealth = url.pathname.endsWith("/health") || url.searchParams.get("health") === "true";

  // Health check
  if (req.method === "GET" || isHealth) {
    const hasKey = !!Deno.env.get("NVAPI_KEY");
    return new Response(
      JSON.stringify({ ok: true, hasKey }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // POST — proxy to NVIDIA NIM
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const NVAPI_KEY = Deno.env.get("NVAPI_KEY");
  if (!NVAPI_KEY) {
    console.error("NVAPI_KEY is missing. Configure environment variables.");
    return new Response(
      JSON.stringify({ ok: false, error: "NVAPI_KEY is missing. Configure environment variables." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { prompt?: string; sessionId?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return new Response(
      JSON.stringify({ ok: false, error: "prompt is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Proxying to NVIDIA NIM, prompt length: ${prompt.length}`);

  try {
    const messages: Array<{ role: string; content: string }> = [];

    if (body.context) {
      messages.push({ role: "system", content: body.context });
    }

    messages.push({ role: "user", content: prompt });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NIM_TIMEOUT_MS);

    const nimResponse = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NVAPI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.2,
        top_p: 1,
        max_tokens: 800,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!nimResponse.ok) {
      const reason: FallbackReason = nimResponse.status === 429
        ? "rate_limited"
        : nimResponse.status >= 500
        ? "upstream_error"
        : "upstream_error";
      console.warn(`[${requestId}] NIM fallback status=${nimResponse.status} reason=${reason}`);

      if (nimResponse.status === 429 || nimResponse.status >= 500) {
        return new Response(
          JSON.stringify(buildFallbackResponse(reason)),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ ok: false, error: `NVIDIA NIM error: ${nimResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nimData = await nimResponse.json();
    const answer = nimData.choices?.[0]?.message?.content ?? "";
    const usage = nimData.usage ?? null;

    console.log(`[${requestId}] Success, tokens used:`, usage?.total_tokens ?? "unknown");

    return new Response(
      JSON.stringify({
        ok: true,
        model: MODEL,
        answer,
        usage,
        requestId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn(`[${requestId}] NIM fallback status=timeout reason=timeout`);
      return new Response(
        JSON.stringify(buildFallbackResponse("timeout")),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.warn(`[${requestId}] NIM fallback status=network_error reason=upstream_error`);
    if (err instanceof TypeError) {
      return new Response(
        JSON.stringify(buildFallbackResponse("upstream_error")),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
