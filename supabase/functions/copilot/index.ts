import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Server-side Context Packet - Permanent grounding knowledge
const CONTEXT_PACKET = `
CONTEXT PACKET (PERMANENT GROUNDING)

SAFETY & COMPLIANCE REMINDER:
- This is a decision-support tool only; it does not control systems or authorize actions.
- All switching, restoration, and crew dispatch decisions require human approval.
- Never imply access to live SCADA, OMS, ADMS, or weather feeds.

DEFINITIONS:
- Feeder: A distribution circuit originating from a substation that delivers power to customers.
- Substation: A facility that transforms voltage and distributes power to feeders.
- Critical Load: High-priority customers (hospitals, emergency services, water treatment) requiring expedited restoration.
- Restoration Priority: A ranked order for re-energizing circuits based on customer count, critical loads, and safety.

TYPICAL OPERATOR CONSIDERATIONS:
- Crew availability: Number, location, and estimated travel time of field personnel.
- Access constraints: Road closures, flooding, downed trees affecting equipment access.
- Sectionalizing: Isolating faulted sections to restore power to unaffected customers.
- Weather uncertainty: Evolving conditions may change restoration priorities and crew safety.
- Customer impact: Number of customers affected; time without power.

OUTPUT EXPECTATION:
Always respond with structured JSON containing: mode_banner, framing_line (optional), insights (array of {title, bullets[]}), disclaimer.
`;

interface ScenarioContext {
  name?: string;
  stage?: boolean;
  lifecycle?: string;
  lifecycle_stage?: string;
  description?: string;
  operator_role?: string;
  scenario_time?: string;
  notes?: string;
  outage_type?: string;
}

interface CopilotRequest {
  mode?: "DEMO" | "ACTIVE_EVENT" | "PLANNING" | "POST_EVENT_REVIEW";
  user_message?: string;
  message?: string;
  scenario?: ScenarioContext;
  context_packet?: Record<string, unknown>;
  retrieved_knowledge?: string[];
  constraints?: string[];
}

interface CopilotInsight {
  title: string;
  bullets: string[];
}

interface CopilotResponse {
  mode_banner: string;
  framing_line?: string;
  insights: CopilotInsight[];
  disclaimer: string;
}

const SYSTEM_PROMPT = `You are "Operator Copilot – Predictive Outage Management."

Your purpose is to support utility operators and stakeholders by explaining predictive analytics, restoration prioritization, trade-offs, and post-event outcomes. You provide decision support only.

You are not a control system. You do not execute, authorize, or recommend autonomous switching or field actions. All operational decisions require explicit human approval.

OPERATING MODES (INCLUDING DEMO)

The GPT operates in one declared mode and surfaces the active mode at the top of each response.

MODE SELECTION

• If the user uses phrases such as: "demo", "walkthrough", "showcase", "executive overview", or "presentation" → DEMO MODE

• Otherwise → ACTIVE EVENT MODE

1) DEMO MODE (SIMPLIFIED, NON-OPERATIONAL)

   • Intended for demos, walkthroughs, and stakeholder presentations.

   • Emphasize clarity, narrative flow, and value explanation.

   • Assumed or illustrative inputs are allowed only if clearly labeled as demo-only.

   • No implication of live data or real-time control.

   DEMO OUTPUT STYLE (EXECUTIVE FLOW)

   • Begin with a one-line framing statement (what the system is helping explain).

   • Use 5–7 concise bullet points focused on insight, not procedure.

   • End with a short "Why this helps operators" summary.

   • Detailed sections (Trade-offs, Source Notes) are optional and may be summarized.

   DEMO NARRATOR VOICE

   • Explain what the operator would consider, not what the operator should do.

   • Use phrases like "This helps surface…", "The model highlights…", "An operator would then weigh…".

2) ACTIVE EVENT MODE (MANDATORY RIGOR)

   • Intended for live or near-live outage situations.

   • Full guardrails, sourcing rules, and structured outputs are mandatory.

   • No illustrative examples unless explicitly requested and clearly labeled.

3) PLANNING / TRAINING MODE

4) POST-EVENT REVIEW MODE

SOURCE OF TRUTH & KNOWLEDGE ENFORCEMENT

• Use the active Context Packet and uploaded knowledge documents as primary references.

• In DEMO MODE only, clearly labeled assumed inputs may be used for illustration.

• Never imply access to live SCADA, OMS, ADMS, weather feeds, or field systems.

OUTAGE TYPE HANDLING

• If an outage_type is provided in the scenario context, the FIRST insight section must explicitly reference it.
• Title format: "Outage Driver: [OutageType] — Key Considerations"
• Include outage-specific implications (e.g., flood = access issues, heatwave = transformer stress).

OUTPUT REQUIREMENTS

• Always display the active mode at the top of the response.

• In ACTIVE EVENT MODE, full structured sections and Source Notes are required.

• In DEMO MODE, structure may be simplified but demo labeling and safety language must remain clear.

COMPLIANCE & TONE

• Maintain neutral, professional language.

• Avoid certainty claims.

• Reinforce that no actions occur without human approval.

• Clearly label anything that is illustrative, assumed, or demo-only.

RESPONSE FORMAT REQUIREMENT:

You MUST respond with valid JSON in exactly this format (no markdown, no code blocks, just raw JSON):
{
  "mode_banner": "DEMO MODE" or "ACTIVE EVENT MODE",
  "framing_line": "A one-line framing statement about what the system is helping explain",
  "insights": [
    {
      "title": "Section Title",
      "bullets": ["Bullet point 1", "Bullet point 2", "Bullet point 3"]
    }
  ],
  "disclaimer": "Decision support only. This system does not execute, authorize, or recommend operational actions. All decisions require explicit human approval. No live utility feeds were accessed."
}

The insights array should contain 2-4 sections, each with 2-5 bullet points.
If outage_type is present, the first insight MUST be about that outage type.`;

function inferMode(userMessage: string): "DEMO" | "ACTIVE_EVENT" {
  const demoKeywords = ["demo", "walkthrough", "showcase", "executive overview", "presentation"];
  const lowerMessage = userMessage.toLowerCase();
  
  for (const keyword of demoKeywords) {
    if (lowerMessage.includes(keyword)) {
      return "DEMO";
    }
  }
  return "ACTIVE_EVENT";
}

function buildUserPrompt(request: CopilotRequest): string {
  const userMessage = request.user_message || request.message || "";
  const scenario = request.scenario;
  const contextPacket = request.context_packet;
  
  let prompt = "";
  
  // Always include the permanent Context Packet
  prompt += CONTEXT_PACKET + "\n\n";
  
  // Build scenario context from either scenario object or context_packet
  const scenarioName = scenario?.name || (contextPacket?.scenario_name as string);
  const lifecycle = scenario?.lifecycle || scenario?.lifecycle_stage || (contextPacket?.lifecycle_stage as string);
  const stage = scenario?.stage ?? contextPacket?.stage;
  const description = scenario?.description || (contextPacket?.description as string);
  const operatorRole = scenario?.operator_role || (contextPacket?.operator_role as string);
  const scenarioTime = scenario?.scenario_time || (contextPacket?.scenario_time as string);
  const notes = scenario?.notes || (contextPacket?.notes as string);
  const outageType = scenario?.outage_type || (contextPacket?.outage_type as string);
  
  if (scenarioName || lifecycle || description || outageType) {
    prompt += "SCENARIO CONTEXT:\n";
    if (scenarioName) prompt += `- Name: ${scenarioName}\n`;
    if (outageType) prompt += `- Outage Type: ${outageType}\n`;
    if (lifecycle) prompt += `- Lifecycle Stage: ${lifecycle}\n`;
    if (stage !== undefined) prompt += `- Staged: ${stage ? "Yes" : "No"}\n`;
    if (description) prompt += `- Description: ${description}\n`;
    if (operatorRole) prompt += `- Operator Role: ${operatorRole}\n`;
    if (scenarioTime) prompt += `- Scenario Time: ${scenarioTime}\n`;
    if (notes) prompt += `- Notes: ${notes}\n`;
    prompt += "\n";
  }
  
  prompt += `USER REQUEST: ${userMessage}`;
  
  return prompt;
}

function createErrorResponse(mode: "DEMO" | "ACTIVE_EVENT", errorMessage: string): CopilotResponse {
  const modeBanners: Record<string, string> = {
    DEMO: "DEMO MODE",
    ACTIVE_EVENT: "ACTIVE EVENT MODE",
  };
  
  return {
    mode_banner: modeBanners[mode],
    framing_line: "An error occurred while processing your request.",
    insights: [
      {
        title: "Service Unavailable",
        bullets: [
          errorMessage,
          "Please try again in a few moments.",
          "If the issue persists, contact system support."
        ]
      }
    ],
    disclaimer: "Decision support only. This system does not execute, authorize, or recommend operational actions. All decisions require explicit human approval. No live utility feeds were accessed."
  };
}

function parseAIResponse(rawContent: string, mode: "DEMO" | "ACTIVE_EVENT"): CopilotResponse {
  const modeBanners: Record<string, string> = {
    DEMO: "DEMO MODE",
    ACTIVE_EVENT: "ACTIVE EVENT MODE",
  };
  
  try {
    // Try to extract JSON from the response
    let jsonStr = rawContent.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();
    
    const parsed = JSON.parse(jsonStr);
    
    // Validate and normalize the response
    return {
      mode_banner: parsed.mode_banner || modeBanners[mode],
      framing_line: parsed.framing_line || undefined,
      insights: Array.isArray(parsed.insights) ? parsed.insights.map((insight: any) => ({
        title: String(insight.title || "Insight"),
        bullets: Array.isArray(insight.bullets) ? insight.bullets.map(String) : []
      })) : [],
      disclaimer: parsed.disclaimer || "Decision support only. This system does not execute, authorize, or recommend operational actions. All decisions require explicit human approval. No live utility feeds were accessed."
    };
  } catch (e) {
    console.error("Failed to parse AI response:", e, "Raw content:", rawContent);
    
    // Fallback: create a response from raw text
    return {
      mode_banner: modeBanners[mode],
      framing_line: "AI response received but format was unexpected.",
      insights: [
        {
          title: "Response",
          bullets: rawContent.split('\n').filter(line => line.trim()).slice(0, 5)
        }
      ],
      disclaimer: "Decision support only. This system does not execute, authorize, or recommend operational actions. All decisions require explicit human approval. No live utility feeds were accessed."
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Validate required fields
    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_message or message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Infer mode from message if not provided
    const mode = body.mode || inferMode(userMessage);

    // Validate mode if provided
    const validModes = ["DEMO", "ACTIVE_EVENT", "PLANNING", "POST_EVENT_REVIEW"];
    if (body.mode && !validModes.includes(body.mode)) {
      return new Response(
        JSON.stringify({ error: `Invalid mode. Must be one of: ${validModes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      const errorResponse = createErrorResponse(mode as "DEMO" | "ACTIVE_EVENT", "AI service is not configured. Please contact system administrator.");
      return new Response(
        JSON.stringify(errorResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the user prompt with scenario context and CONTEXT_PACKET
    const userPrompt = buildUserPrompt(body);

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        const errorResponse = createErrorResponse(mode as "DEMO" | "ACTIVE_EVENT", "Rate limit exceeded. Please wait a moment before trying again.");
        return new Response(
          JSON.stringify(errorResponse),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        const errorResponse = createErrorResponse(mode as "DEMO" | "ACTIVE_EVENT", "AI service quota exceeded. Please contact system administrator.");
        return new Response(
          JSON.stringify(errorResponse),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorResponse = createErrorResponse(mode as "DEMO" | "ACTIVE_EVENT", "Failed to get AI response. Please try again.");
      return new Response(
        JSON.stringify(errorResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    if (!rawContent) {
      const errorResponse = createErrorResponse(mode as "DEMO" | "ACTIVE_EVENT", "AI returned an empty response. Please try again.");
      return new Response(
        JSON.stringify(errorResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate the AI response
    const response = parseAIResponse(rawContent, mode as "DEMO" | "ACTIVE_EVENT");

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing copilot request:', error);
    const errorResponse = createErrorResponse("ACTIVE_EVENT", "An unexpected error occurred. Please try again.");
    return new Response(
      JSON.stringify(errorResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});