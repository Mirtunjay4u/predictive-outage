import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CopilotRequest {
  mode: "DEMO" | "ACTIVE_EVENT" | "PLANNING" | "POST_EVENT_REVIEW";
  user_message: string;
  context_packet: Record<string, unknown>;
  retrieved_knowledge: string[];
  constraints: string[];
}

interface CopilotResponse {
  mode_banner: string;
  framing_line?: string;
  insights: string[];
  tradeoffs?: string[];
  source_notes?: string[];
  disclaimer: string;
}

function inferMode(userMessage: string): CopilotRequest["mode"] {
  const demoKeywords = ["demo", "walkthrough", "showcase", "executive overview", "presentation"];
  const lowerMessage = userMessage.toLowerCase();
  
  for (const keyword of demoKeywords) {
    if (lowerMessage.includes(keyword)) {
      return "DEMO";
    }
  }
  return "ACTIVE_EVENT";
}

function generateMockResponse(request: CopilotRequest): CopilotResponse {
  const { user_message, context_packet } = request;
  
  // Use provided mode or infer from message
  const mode = request.mode || inferMode(user_message);

  // Mode banners per spec
  const modeBanners: Record<string, string> = {
    DEMO: "MODE: DEMO MODE",
    ACTIVE_EVENT: "MODE: ACTIVE EVENT MODE",
    PLANNING: "MODE: PLANNING / TRAINING MODE",
    POST_EVENT_REVIEW: "MODE: POST-EVENT REVIEW MODE",
  };

  const scenarioContext = context_packet?.scenario_name 
    ? ` for scenario "${context_packet.scenario_name}"`
    : "";

  // DEMO MODE response
  if (mode === "DEMO") {
    return {
      mode_banner: modeBanners.DEMO,
      framing_line: `This demonstration illustrates how the Operator Copilot surfaces actionable intelligence${scenarioContext}.`,
      insights: [
        `The model highlights key operational factors derived from the user query: "${user_message.slice(0, 40)}${user_message.length > 40 ? '...' : ''}"`,
        "This helps surface contextual awareness by synthesizing scenario parameters and historical patterns.",
        "The Copilot identifies decision-relevant trade-offs an operator would typically evaluate.",
        "An operator would then weigh these factors against current constraints and priorities.",
        "The model presents options ranked by operational impact and implementation complexity.",
        "This approach reduces cognitive load during high-tempo decision windows.",
        "Why this helps operators: Rapid synthesis of complex inputs enables faster, more confident decisions.",
      ],
      tradeoffs: [
        "Speed vs. thoroughness: Demo responses prioritize breadth over depth.",
        "Generic vs. specific: Without live data, insights remain illustrative.",
      ],
      source_notes: [],
      disclaimer: "This is a demonstration of Copilot capabilities. No live SCADA, OMS, ADMS, or weather systems were accessed. All insights are illustrative mock data.",
    };
  }

  // ACTIVE_EVENT MODE response
  if (mode === "ACTIVE_EVENT") {
    return {
      mode_banner: modeBanners.ACTIVE_EVENT,
      framing_line: `Real-time operational support active${scenarioContext}.`,
      insights: [
        `**Situation Summary:** Analyzing operational context for query: "${user_message.slice(0, 50)}${user_message.length > 50 ? '...' : ''}"`,
        "Current scenario parameters indicate standard operational conditions with no critical alerts flagged.",
        "**Key Uncertainties:** External factors (weather, demand fluctuations) remain unmeasured in this mock environment.",
        "Resource availability and personnel positioning data would typically inform prioritization.",
        "**Decision Considerations:** Evaluate response timing against operational tempo requirements.",
        "Consider escalation pathways if conditions exceed defined thresholds.",
        "Cross-functional coordination may be required depending on scenario scope.",
      ],
      tradeoffs: [
        "Immediate action vs. information gathering: Balance speed with situational awareness.",
        "Local optimization vs. system-wide impact: Consider downstream effects of decisions.",
      ],
      source_notes: [
        "Source Notes: No external systems accessed; demo mock only.",
      ],
      disclaimer: "Decision support only. No control actions. Human approval required. No live SCADA, OMS, ADMS, or weather feeds were accessed.",
    };
  }

  // PLANNING MODE response
  if (mode === "PLANNING") {
    return {
      mode_banner: modeBanners.PLANNING,
      framing_line: `Strategic planning and training analysis${scenarioContext}.`,
      insights: [
        `The model analyzes planning considerations for: "${user_message.slice(0, 40)}${user_message.length > 40 ? '...' : ''}"`,
        "**Preparation Phase:** Optimal readiness windows identified based on scenario parameters.",
        "Resource allocation models suggest load-balanced distribution across operational zones.",
        "**Risk Assessment:** Potential bottlenecks flagged for proactive mitigation.",
        "Training scenarios can be generated from historical pattern analysis.",
        "**Optimization Opportunities:** Process improvements identified through comparative analysis.",
        "Why this helps operators: Systematic preparation reduces response variance during live events.",
      ],
      tradeoffs: [
        "Comprehensive planning vs. operational flexibility: Over-specification may limit adaptability.",
        "Training fidelity vs. resource investment: Higher-fidelity exercises require more preparation.",
      ],
      source_notes: [
        "Source Notes: No external systems accessed; demo mock only.",
      ],
      disclaimer: "Planning support only. No live SCADA, OMS, ADMS, or weather feeds were accessed. All insights are illustrative.",
    };
  }

  // POST_EVENT_REVIEW MODE response
  return {
    mode_banner: modeBanners.POST_EVENT_REVIEW,
    framing_line: `Post-event analysis and lessons learned${scenarioContext}.`,
    insights: [
      `Reviewing event context: "${user_message.slice(0, 40)}${user_message.length > 40 ? '...' : ''}"`,
      "**Timeline Reconstruction:** Key decision points identified for sequential analysis.",
      "**Performance Metrics:** Response timing and resource utilization tracked against benchmarks.",
      "Deviation analysis highlights variance from standard operating procedures.",
      "**Lessons Learned:** Improvement opportunities catalogued for future reference.",
      "Process refinements suggested based on observed patterns.",
      "Why this helps operators: Structured retrospectives accelerate organizational learning.",
    ],
    tradeoffs: [
      "Depth of analysis vs. time to actionable insights: Balance thoroughness with urgency.",
      "Individual accountability vs. systemic improvement: Focus on process, not blame.",
    ],
    source_notes: [
      "Source Notes: No external systems accessed; demo mock only.",
    ],
    disclaimer: "Review and analysis only. No live SCADA, OMS, ADMS, or weather feeds were accessed. Historical data is simulated.",
  };
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

    // Validate required fields
    if (!body.mode || !body.user_message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: mode and user_message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate mode
    const validModes = ["DEMO", "ACTIVE_EVENT", "PLANNING", "POST_EVENT_REVIEW"];
    if (!validModes.includes(body.mode)) {
      return new Response(
        JSON.stringify({ error: `Invalid mode. Must be one of: ${validModes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate mock response
    const response = generateMockResponse(body);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing copilot request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
