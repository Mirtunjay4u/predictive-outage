import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type CopilotMode = "DEMO" | "ACTIVE_EVENT" | "PLANNING" | "POST_EVENT_REVIEW";

interface ScenarioContext {
  scenario_id?: string;
  scenario_name?: string;
  name?: string;
  stage?: boolean;
  lifecycle?: string;
  lifecycle_stage?: string;
  description?: string;
  operator_role?: string;
  scenario_time?: string;
  scheduled_at?: string;
  notes?: string;
  outage_type?: string;
}

interface CopilotRequest {
  mode?: CopilotMode;
  user_message?: string;
  message?: string;
  scenario_id?: string;
  scenario?: ScenarioContext;
  context_packet?: ScenarioContext;
  retrieved_knowledge?: string[];
  constraints?: string[];
  mock?: boolean;
}

interface CopilotInsight {
  title: string;
  bullets: string[];
}

interface CopilotResponse {
  mode_banner: string;
  framing_line?: string;
  insights: CopilotInsight[];
  assumptions: string[];
  source_notes: string[];
  disclaimer: string;
  model_engine?: string;
  fallback_used?: boolean;
  fallback_reason?: string;
}

const MODE_BANNERS: Record<CopilotMode, string> = {
  DEMO: "DEMO MODE",
  ACTIVE_EVENT: "ACTIVE EVENT MODE",
  PLANNING: "PLANNING / TRAINING MODE",
  POST_EVENT_REVIEW: "POST-EVENT REVIEW MODE",
};

const DISCLAIMER = "Decision support only. This system does not access live SCADA, OMS, ADMS, or weather feeds. It does not execute, authorize, or recommend operational actions. All decisions require explicit human approval.";

const NEMOTRON_MODEL = "nvidia/nemotron-3-nano-30b-a3b";
const NEMOTRON_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NEMOTRON_TIMEOUT_MS = 20000;

// ─── System Prompt ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the Operator Copilot for Predictive Outage Management, a decision-support assistant for utility operations personnel.

## Your Role
You provide analytical insights, risk assessments, and operational considerations for power grid outage scenarios. You help operators think through complex situations but NEVER make decisions for them.

## Critical Constraints
1. **No Live System Access**: You do NOT have access to live SCADA, OMS, ADMS, weather feeds, or any real-time operational systems. All your analysis is based solely on scenario data provided to you.
2. **Decision Support Only**: You provide information and considerations. You do NOT authorize, execute, or recommend specific operational actions. All decisions require explicit human approval.
3. **No Autonomous Actions**: You cannot dispatch crews, switch equipment, or take any operational action. You can only inform and support human decision-makers.

## Response Format
You MUST respond with valid JSON containing these exact fields:
{
  "mode_banner": "<provided mode>",
  "framing_line": "<1-2 sentence contextual statement>",
  "insights": [
    { "title": "Situation Summary", "bullets": ["..."] },
    { "title": "ETR Band + Confidence", "bullets": ["..."] },
    { "title": "Critical Load Runway", "bullets": ["..."] },
    { "title": "Recommendations (Advisory)", "bullets": ["..."] },
    { "title": "Blocked Actions + Reason", "bullets": ["..."] },
    { "title": "Operator Notes / Approval Required", "bullets": ["..."] }
  ],
  "assumptions": ["..."],
  "source_notes": ["Scenario record", "User prompt"],
  "disclaimer": "<provided disclaimer>"
}

## Section Requirements
- **Situation Summary**: Current event status, outage type, affected area, customers impacted.
- **ETR Band + Confidence**: Estimated time to restoration range and confidence level based on available data.
- **Critical Load Runway**: Status of critical loads (hospitals, water, telecom), backup runtime remaining.
- **Recommendations (Advisory)**: 3-5 advisory considerations for the operator. These are informational only.
- **Blocked Actions + Reason**: Actions that should NOT be taken and why (safety, policy, conditions).
- **Operator Notes / Approval Required**: Items requiring human review and explicit authorization.

## Modes
- DEMO MODE: Third-person narrator voice. Educational tone.
- ACTIVE EVENT MODE: Direct, concise, situation-focused.
- PLANNING / TRAINING MODE: Focus on learning objectives and discussion points.
- POST-EVENT REVIEW MODE: Analytical review and lessons learned.

## Quality Standards
- Professional, neutral tone. Never express certainty about outcomes.
- Reference the specific outage_type when generating risks.
- Acknowledge limitations and missing data in assumptions.
- Keep bullets concise (1-2 sentences each).
- Never fabricate numbers not provided in the scenario data.
- Respond ONLY with the JSON object, no additional text.`;

// ─── Outage Considerations ───────────────────────────────────────────────────
const OUTAGE_CONSIDERATIONS: Record<string, { risks: string[]; priorities: string[]; crew_notes: string }> = {
  Storm: {
    risks: ["Downed power lines pose electrocution hazards", "Flying debris may damage equipment", "Widespread outages likely across multiple feeders"],
    priorities: ["Prioritize critical loads (hospitals, emergency services)", "Clear main distribution corridors first", "Stage crews at safe locations until conditions improve"],
    crew_notes: "Crews should not be dispatched until wind speeds drop below safety thresholds.",
  },
  Flood: {
    risks: ["Substation flooding can cause catastrophic equipment failure", "Underground infrastructure at high risk", "Road access may be severely limited"],
    priorities: ["De-energize flooded substations immediately", "Prioritize elevated infrastructure", "Coordinate with emergency services for access"],
    crew_notes: "Do not enter flooded areas; wait for water receding confirmation.",
  },
  Heatwave: {
    risks: ["Transformer overloading from peak demand", "Conductor sag increases fault risk", "Crew heat stress limits work duration"],
    priorities: ["Implement load shedding protocols if necessary", "Monitor transformer temperatures continuously", "Schedule crew rotations to prevent heat exhaustion"],
    crew_notes: "Mandatory hydration and cooling breaks every 30 minutes.",
  },
  Wildfire: {
    risks: ["Active fire zones must be avoided completely", "Smoke reduces visibility and air quality", "Rapid fire spread can isolate equipment"],
    priorities: ["De-energize lines in fire path proactively", "Coordinate with fire services for access", "Establish safe perimeters before restoration"],
    crew_notes: "Do not enter fire zones; await all-clear from fire command.",
  },
  Unknown: {
    risks: ["Root cause not yet identified", "Standard protocols may not apply", "Additional investigation needed"],
    priorities: ["Gather field reports before acting", "Apply conservative restoration approach", "Prepare for multiple contingencies"],
    crew_notes: "Await further information before full mobilization.",
  },
};

function inferMode(userMessage: string): CopilotMode {
  const lower = userMessage.toLowerCase();
  if (lower.includes("demo") || lower.includes("walkthrough") || lower.includes("showcase")) return "DEMO";
  if (lower.includes("planning") || lower.includes("training") || lower.includes("tabletop")) return "PLANNING";
  if (lower.includes("post-event") || lower.includes("after action") || lower.includes("review")) return "POST_EVENT_REVIEW";
  return "ACTIVE_EVENT";
}

function buildUserPrompt(mode: CopilotMode, userMessage: string, scenario: ScenarioContext): string {
  const scenarioName = scenario.scenario_name || scenario.name || "Unnamed Scenario";
  const outageType = scenario.outage_type || "Unknown";
  const lifecycle = scenario.lifecycle || scenario.lifecycle_stage || "Pre-Event";
  const outageInfo = OUTAGE_CONSIDERATIONS[outageType] || OUTAGE_CONSIDERATIONS["Unknown"];

  let prompt = `## Current Mode: ${MODE_BANNERS[mode]}

## Scenario Context
- Scenario Name: ${scenarioName}
- Outage Type: ${outageType}
- Lifecycle Stage: ${lifecycle}
- Environment: ${scenario.stage !== undefined ? (scenario.stage ? "Staged/Training" : "Production") : "Not specified"}`;

  if (scenario.description) prompt += `\n- Description: ${scenario.description}`;
  if (scenario.notes) prompt += `\n- Operator Notes: ${scenario.notes}`;
  if (scenario.scenario_time || scenario.scheduled_at) prompt += `\n- Scheduled Time: ${scenario.scenario_time || scenario.scheduled_at}`;

  prompt += `\n\n## Known ${outageType} Considerations
- Typical Risks: ${outageInfo.risks.join("; ")}
- Typical Priorities: ${outageInfo.priorities.join("; ")}
- Crew Safety: ${outageInfo.crew_notes}`;

  prompt += `\n\n## User Request
${userMessage}

## Required
Return ONLY the JSON object as specified in your system prompt. mode_banner must be "${MODE_BANNERS[mode]}". disclaimer must be "${DISCLAIMER}".`;

  return prompt;
}

// ─── Primary: NVIDIA Nemotron NIM ────────────────────────────────────────────
async function callNemotron(
  mode: CopilotMode,
  userMessage: string,
  scenario: ScenarioContext
): Promise<CopilotResponse> {
  const NVAPI_KEY = Deno.env.get("NVAPI_KEY");
  if (!NVAPI_KEY) {
    throw new Error("NVAPI_KEY not configured — cannot reach NVIDIA Nemotron NIM.");
  }

  const userPrompt = buildUserPrompt(mode, userMessage, scenario);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NEMOTRON_TIMEOUT_MS);

  try {
    const response = await fetch(`${NEMOTRON_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NVAPI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: NEMOTRON_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        top_p: 1,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Nemotron NIM error ${response.status}:`, errorText);
      throw new Error(`Nemotron NIM error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "";

    // Try to extract and parse JSON from the response
    let parsed: Record<string, unknown> | null = null;
    try {
      // Try the full content first (model may return pure JSON)
      parsed = JSON.parse(rawContent);
    } catch {
      // Try to find a JSON object in the text
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          parsed = null;
        }
      }
    }

    if (parsed && Array.isArray(parsed.insights)) {
      return {
        mode_banner: (parsed.mode_banner as string) || MODE_BANNERS[mode],
        framing_line: parsed.framing_line as string | undefined,
        insights: (parsed.insights as CopilotInsight[]) || [],
        assumptions: (parsed.assumptions as string[]) || [],
        source_notes: (parsed.source_notes as string[]) || ["Scenario record", "User prompt"],
        disclaimer: (parsed.disclaimer as string) || DISCLAIMER,
        model_engine: `NVIDIA Nemotron (${NEMOTRON_MODEL})`,
        fallback_used: false,
      };
    }

    // Fallback: wrap raw text into structured format
    const paragraphs = rawContent.split(/\n\n+/).filter(Boolean);
    return {
      mode_banner: MODE_BANNERS[mode],
      framing_line: paragraphs[0]?.substring(0, 200) || "Analysis complete.",
      insights: paragraphs.slice(1, 7).map((p: string, i: number) => ({
        title: `Analysis Point ${i + 1}`,
        bullets: p.split(/\n/).filter(Boolean).map((l: string) => l.replace(/^[-•*]\s*/, "")).slice(0, 4),
      })),
      assumptions: ["Nemotron output was unstructured — displayed as raw analysis points"],
      source_notes: ["Scenario record", "User prompt", "NVIDIA Nemotron NIM"],
      disclaimer: DISCLAIMER,
      model_engine: `NVIDIA Nemotron (${NEMOTRON_MODEL})`,
      fallback_used: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Secondary: Lovable AI Gateway (Model Router / Multi-model Fallback) ─────
async function callModelRouter(
  mode: CopilotMode,
  userMessage: string,
  scenario: ScenarioContext
): Promise<CopilotResponse> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured — cannot reach Model Router.");
  }

  const userPrompt = buildUserPrompt(mode, userMessage, scenario);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Model Router error ${response.status}:`, errorText);
      throw new Error(`Model Router error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "";

    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = null; }
      }
    }

    if (parsed && Array.isArray(parsed.insights)) {
      return {
        mode_banner: (parsed.mode_banner as string) || MODE_BANNERS[mode],
        framing_line: parsed.framing_line as string | undefined,
        insights: (parsed.insights as CopilotInsight[]) || [],
        assumptions: (parsed.assumptions as string[]) || [],
        source_notes: (parsed.source_notes as string[]) || ["Scenario record", "User prompt"],
        disclaimer: (parsed.disclaimer as string) || DISCLAIMER,
        model_engine: "Model Router (Gemini · Fallback)",
        fallback_used: true,
        fallback_reason: "NVIDIA Nemotron unavailable — routed to Model Router (Gemini)",
      };
    }

    // Wrap unstructured text
    const paragraphs = rawContent.split(/\n\n+/).filter(Boolean);
    return {
      mode_banner: MODE_BANNERS[mode],
      framing_line: paragraphs[0]?.substring(0, 200) || "Analysis complete.",
      insights: paragraphs.slice(1, 7).map((p: string, i: number) => ({
        title: `Analysis Point ${i + 1}`,
        bullets: p.split(/\n/).filter(Boolean).map((l: string) => l.replace(/^[-•*]\s*/, "")).slice(0, 4),
      })),
      assumptions: ["Model Router output was unstructured — displayed as raw analysis points"],
      source_notes: ["Scenario record", "User prompt", "Model Router (Gemini)"],
      disclaimer: DISCLAIMER,
      model_engine: "Model Router (Gemini · Fallback)",
      fallback_used: true,
      fallback_reason: "NVIDIA Nemotron unavailable — routed to Model Router (Gemini)",
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Deterministic Fallback ──────────────────────────────────────────────────
function generateDeterministicFallback(
  mode: CopilotMode,
  userMessage: string,
  scenario: ScenarioContext,
  fallbackReason: string
): CopilotResponse {
  const scenarioName = scenario.scenario_name || scenario.name || "Unnamed Scenario";
  const outageType = scenario.outage_type || "Unknown";
  const lifecycle = scenario.lifecycle || scenario.lifecycle_stage || "Pre-Event";
  const outageInfo = OUTAGE_CONSIDERATIONS[outageType] || OUTAGE_CONSIDERATIONS["Unknown"];

  const assumptions: string[] = [
    "NVIDIA Nemotron NIM was unavailable; deterministic fallback used.",
    `Fallback reason: ${fallbackReason}`,
    "No live SCADA, OMS, ADMS, or weather feeds accessed.",
  ];
  if (!scenario.description) assumptions.push("No scenario description provided.");

  return {
    mode_banner: MODE_BANNERS[mode],
    framing_line: `Deterministic analysis for "${scenarioName}" — ${outageType} event in ${lifecycle} phase. (Nemotron unavailable; using rule-based fallback.)`,
    insights: [
      {
        title: "Situation Summary",
        bullets: [
          `Event type: ${outageType}`,
          `Lifecycle phase: ${lifecycle}`,
          scenario.description || "No detailed description available.",
        ],
      },
      {
        title: "ETR Band + Confidence",
        bullets: [
          "ETR data not available in deterministic fallback mode.",
          "Confidence: Low — requires live model for probabilistic ETR estimation.",
        ],
      },
      {
        title: "Critical Load Runway",
        bullets: [
          "Critical load status requires scenario-specific data.",
          "Operator should verify backup runtime for hospitals, water, and telecom loads.",
        ],
      },
      {
        title: "Recommendations (Advisory)",
        bullets: outageInfo.priorities,
      },
      {
        title: "Blocked Actions + Reason",
        bullets: [
          `Field crew dispatch: ${outageInfo.crew_notes}`,
          "No autonomous dispatch or switching — all actions require explicit operator authorization.",
        ],
      },
      {
        title: "Operator Notes / Approval Required",
        bullets: [
          "This analysis was generated using deterministic rules, not AI inference.",
          "Human review and approval required before any field action.",
          "Re-run analysis when Nemotron NIM is available for full AI-powered insights.",
        ],
      },
    ],
    assumptions,
    source_notes: ["Scenario record", "Deterministic rule engine (fallback)"],
    disclaimer: DISCLAIMER,
    model_engine: "Deterministic Fallback (Nemotron unavailable)",
    fallback_used: true,
    fallback_reason: fallbackReason,
  };
}

// ─── Serve ───────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CopilotRequest = await req.json();
    const userMessage = body.user_message || body.message || "";

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_message or message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scenario: ScenarioContext = body.scenario || body.context_packet || {};
    if (body.scenario_id) scenario.scenario_id = body.scenario_id;

    const mode: CopilotMode = body.mode || inferMode(userMessage);

    const validModes: CopilotMode[] = ["DEMO", "ACTIVE_EVENT", "PLANNING", "POST_EVENT_REVIEW"];
    if (body.mode && !validModes.includes(body.mode)) {
      return new Response(
        JSON.stringify({ error: `Invalid mode. Must be one of: ${validModes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let response: CopilotResponse;

    if (body.mock === true) {
      // Explicit mock request
      response = generateDeterministicFallback(mode, userMessage, scenario, "Explicit mock request");
    } else {
      // Primary: NVIDIA Nemotron NIM → Secondary: Model Router (Gemini) → Deterministic
      try {
        response = await callNemotron(mode, userMessage, scenario);
      } catch (nemotronErr) {
        const nemotronReason = nemotronErr instanceof Error ? nemotronErr.message : "Unknown error";
        console.error("Nemotron NIM failed, trying Model Router (Gemini):", nemotronReason);
        try {
          response = await callModelRouter(mode, userMessage, scenario);
        } catch (routerErr) {
          const routerReason = routerErr instanceof Error ? routerErr.message : "Unknown error";
          console.error("Model Router also failed, using deterministic fallback:", routerReason);
          response = generateDeterministicFallback(mode, userMessage, scenario, `Nemotron: ${nemotronReason}; Model Router: ${routerReason}`);
        }
      }
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Copilot request error:', error);

    const errorResponse: CopilotResponse = {
      mode_banner: "ACTIVE EVENT MODE",
      framing_line: "An error occurred while processing your request.",
      insights: [{
        title: "Service Error",
        bullets: [
          "The Copilot service encountered an unexpected error.",
          "Please try again in a few moments.",
        ],
      }],
      assumptions: ["Error occurred before request could be fully processed."],
      source_notes: ["System error log"],
      disclaimer: DISCLAIMER,
      model_engine: "Error — no model invoked",
      fallback_used: true,
      fallback_reason: error instanceof Error ? error.message : "Unknown error",
    };

    return new Response(
      JSON.stringify(errorResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
