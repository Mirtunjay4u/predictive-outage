import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "nvidia/nemotron-3-nano-30b-a3b";
const BASE_URL = "https://integrate.api.nvidia.com/v1";
const NIM_TIMEOUT_MS = 15000;
const ROUTER_TIMEOUT_MS = 20000;

type FallbackReason = "rate_limited" | "upstream_error" | "timeout" | "missing_key";

// ── Domain-constrained system prompt for executive briefings ──
const EXECUTIVE_BRIEFING_SYSTEM_PROMPT = `You are an AI analyst for a utility company's Predictive Outage Management system.

## Your ONLY Domain
You provide executive briefing insights about **electric power grid outages, restoration operations, and utility service disruptions**. You MUST stay strictly within this domain.

## NEVER Discuss
- Software/API performance, latency, throttling, or IT infrastructure
- Non-utility topics (finance, marketing, general business)
- Any topic outside electric utility operations

## Response Format
Respond with ONLY a valid JSON object (no markdown fences, no extra text):
{
  "insights": [
    "<insight about current outage situation or restoration status>",
    "<insight about crew deployment, ETR, or customer impact>",
    "<insight about risk exposure, critical loads, or weather impact>"
  ],
  "actions": [
    "<advisory action for operations leadership>",
    "<advisory action for customer communications or crew staging>"
  ],
  "confidence": "High|Med|Low"
}

## Content Guidelines
- **insights**: 1-3 sentences each about outage events, restoration progress, crew status, ETR bands, critical load runway, weather threats, or customer impact.
- **actions**: Advisory only. Use phrasing like "consider", "evaluate", "review". Never directive.
- **confidence**: Based on data completeness. "High" = rich event data, "Med" = partial data, "Low" = sparse or stale data.
- Reference specific event counts, customer numbers, and outage types from the provided data.
- If data is sparse, say so honestly rather than inventing details.`;

function buildFallbackResponse(reason: FallbackReason) {
  return {
    ok: true,
    fallback: true,
    reason,
    data: {
      insights: [
        "Active outage events are under monitoring with standard operational posture.",
        "Crew staging and ETR bands are being tracked per current restoration runbooks.",
        "Critical load runway status is being evaluated across affected feeder zones.",
      ],
      actions: [
        "Review crew deployment against highest-risk clusters and validate switching plans.",
        "Refresh customer messaging cadence and confirm next ETR update window.",
      ],
      confidence: "Med",
      updatedAt: new Date().toISOString(),
    },
  };
}

// ── Model Router fallback (Lovable AI Gateway) ──
async function callModelRouter(
  prompt: string,
  context: string | undefined
): Promise<{ ok: true; model: string; answer: string; usage: unknown; requestId: string } | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.warn("LOVABLE_API_KEY not configured — Model Router unavailable");
    return null;
  }

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: EXECUTIVE_BRIEFING_SYSTEM_PROMPT },
  ];
  if (context) {
    messages.push({ role: "system", content: `Active event data:\n${context}` });
  }
  messages.push({ role: "user", content: prompt });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ROUTER_TIMEOUT_MS);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.2,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Model Router error ${response.status}: ${errText}`);
      return null;
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content ?? "";
    return {
      ok: true,
      model: "Model Router (Gemini · Fallback)",
      answer,
      usage: data.usage ?? null,
      requestId: crypto.randomUUID(),
    };
  } catch (err) {
    console.warn("Model Router call failed:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
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
    const hasRouter = !!Deno.env.get("LOVABLE_API_KEY");
    return new Response(
      JSON.stringify({ ok: true, hasKey, hasRouter }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // POST — proxy to NVIDIA NIM, fallback to Model Router
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

  // ── Try NVIDIA Nemotron first ──
  const NVAPI_KEY = Deno.env.get("NVAPI_KEY");
  if (NVAPI_KEY) {
    console.log(`[${requestId}] Proxying to NVIDIA NIM, prompt length: ${prompt.length}`);
    try {
      const messages: Array<{ role: string; content: string }> = [
        { role: "system", content: EXECUTIVE_BRIEFING_SYSTEM_PROMPT },
      ];
      if (body.context) {
        messages.push({ role: "system", content: `Active event data:\n${body.context}` });
      }
      messages.push({ role: "user", content: prompt });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), NIM_TIMEOUT_MS);

      const nimResponse = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NVAPI_KEY}`,
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

      if (nimResponse.ok) {
        const nimData = await nimResponse.json();
        const answer = nimData.choices?.[0]?.message?.content ?? "";
        const usage = nimData.usage ?? null;
        console.log(`[${requestId}] Nemotron success, tokens: ${usage?.total_tokens ?? "unknown"}`);

        return new Response(
          JSON.stringify({ ok: true, model: MODEL, answer, usage, requestId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Nemotron returned an error — log and fall through to Model Router
      const nimStatus = nimResponse.status;
      const nimErr = await nimResponse.text();
      console.warn(`[${requestId}] Nemotron error ${nimStatus}, falling back to Model Router. Detail: ${nimErr.slice(0, 200)}`);
    } catch (err) {
      const reason = err instanceof DOMException && err.name === "AbortError" ? "timeout" : "upstream_error";
      console.warn(`[${requestId}] Nemotron ${reason}, falling back to Model Router`);
    }
  } else {
    console.log(`[${requestId}] NVAPI_KEY missing, routing directly to Model Router`);
  }

  // ── Fallback: Model Router (Lovable AI) ──
  console.log(`[${requestId}] Attempting Model Router fallback`);
  const routerResult = await callModelRouter(prompt, body.context);

  if (routerResult) {
    console.log(`[${requestId}] Model Router success`);
    return new Response(
      JSON.stringify(routerResult),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Both engines failed — deterministic fallback ──
  console.warn(`[${requestId}] All AI engines failed, returning deterministic fallback`);
  return new Response(
    JSON.stringify(buildFallbackResponse("upstream_error")),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
