import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NIM_MODEL = "nvidia/nemotron-3-nano-30b-a3b";
const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NIM_TIMEOUT_MS = 15000;
const ROUTER_TIMEOUT_MS = 20000;

const SYSTEM_PROMPT = `You are the Executive Intelligence Console for a utility company's Operator Copilot — Predictive Outage Management platform.

## Strict Constraints
- Respond ONLY within Operator Copilot Phase 1 capabilities.
- Phase 1 includes: ETR confidence band estimation, critical load prioritization, weather hazard correlation, crew allocation insight, operator-approved communication drafting.
- Phase 1 does NOT include: breaker switching automation, SCADA command execution, protection relay coordination, load flow simulation, autonomous dispatch.
- NEVER imply SCADA integration, autonomous switching, or direct control actions.
- NEVER invent system integrations that do not exist.
- If the question is outside Phase 1 scope, respond: "Not available within current Phase 1 implementation."
- Maintain executive technical tone. No hype. No conversational fluff. No emojis.

## Mandatory Response Format
Every answer MUST use this exact structure as a JSON object:
{
  "context": "Brief situational explanation.",
  "technical_mechanism": ["Bullet 1 describing system component involved", "Bullet 2..."],
  "governance_controls": "Clear safety boundary statement.",
  "strategic_value": "Business or operational implication."
}

No markdown fences. No extra text outside JSON.`;

// Internal logging (console only, not exposed to UI)
function logQuery(question: string, model: string, success: boolean) {
  console.log(JSON.stringify({
    type: "executive_console_query",
    timestamp: new Date().toISOString(),
    question: question.slice(0, 200),
    model,
    success,
  }));
}

async function callNemotron(prompt: string): Promise<{ answer: string; model: string } | null> {
  const NVAPI_KEY = Deno.env.get("NVAPI_KEY");
  if (!NVAPI_KEY) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NIM_TIMEOUT_MS);

  try {
    const res = await fetch(NIM_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NVAPI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: NIM_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.15,
        max_tokens: 1200,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      console.warn(`Nemotron error ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      answer: data.choices?.[0]?.message?.content ?? "",
      model: "NVIDIA Nemotron (NIM)",
    };
  } catch (err) {
    console.warn("Nemotron failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function callLovableAI(prompt: string): Promise<{ answer: string; model: string } | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ROUTER_TIMEOUT_MS);

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.15,
        max_tokens: 1200,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      console.warn(`Lovable AI error ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      answer: data.choices?.[0]?.message?.content ?? "",
      model: "Model Router (Gemini)",
    };
  } catch (err) {
    console.warn("Lovable AI failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { question?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const question = body.question?.trim();
  if (!question) {
    return new Response(JSON.stringify({ error: "question is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Try Nemotron first
  const nimResult = await callNemotron(question);
  if (nimResult) {
    logQuery(question, nimResult.model, true);
    return new Response(JSON.stringify({ ok: true, ...nimResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fallback to Lovable AI
  const aiResult = await callLovableAI(question);
  if (aiResult) {
    logQuery(question, aiResult.model, true);
    return new Response(JSON.stringify({ ok: true, ...aiResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Both failed
  logQuery(question, "none", false);
  return new Response(
    JSON.stringify({
      ok: true,
      model: "Deterministic Fallback",
      answer: JSON.stringify({
        context: "AI inference engines are temporarily unavailable. The deterministic rule engine continues to operate.",
        technical_mechanism: [
          "The copilot-evaluate rule engine processes all events independently of AI inference.",
          "ETR bands, critical load flags, and safety constraints remain fully operational.",
        ],
        governance_controls: "All safety rules and Phase 1 scope boundaries remain enforced. No autonomous actions are possible.",
        strategic_value: "System resilience is demonstrated through multi-tier fallback architecture.",
      }),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
