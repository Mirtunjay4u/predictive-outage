import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CopilotRequest {
  mode?: "DEMO" | "ACTIVE_EVENT" | "PLANNING" | "POST_EVENT_REVIEW";
  user_message: string;
  context_packet: Record<string, unknown>;
  retrieved_knowledge: string[];
  constraints: string[];
}

interface CopilotResponse {
  mode_banner: string;
  framing_line: string;
  insights: string[];
  why_it_helps: string;
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
  const { user_message } = request;
  
  // Use provided mode or infer from message
  const mode = request.mode || inferMode(user_message);

  // Mode banners per spec
  const modeBanners: Record<string, string> = {
    DEMO: "MODE: DEMO MODE",
    ACTIVE_EVENT: "MODE: ACTIVE EVENT MODE",
    PLANNING: "MODE: PLANNING / TRAINING MODE",
    POST_EVENT_REVIEW: "MODE: POST-EVENT REVIEW MODE",
  };

  // DEMO MODE response
  if (mode === "DEMO") {
    return {
      mode_banner: modeBanners.DEMO,
      framing_line: "This response helps explain what an operator would consider when reviewing a predictive outage scenario (demo-only).",
      insights: [
        "This helps surface potential feeder exposure and customer impact at a high level.",
        "The model highlights uncertainty in cause until confirmed by field/OMS records (not assumed live).",
        "An operator would weigh restoration prioritization vs. crew availability and critical loads.",
        "Trade-offs between speed, safety, and customer impact are made explicit for review.",
        "No live SCADA/OMS/ADMS/weather access is implied; this is decision support only.",
      ],
      why_it_helps: "Operators and stakeholders get a consistent, auditable summary without implying automation or control.",
      disclaimer: "Decision support only. This system does not execute, authorize, or recommend operational actions. All decisions require explicit human approval.",
    };
  }

  // ACTIVE_EVENT MODE response
  if (mode === "ACTIVE_EVENT") {
    return {
      mode_banner: modeBanners.ACTIVE_EVENT,
      framing_line: "Real-time operational support is active. Situation awareness and decision considerations follow.",
      insights: [
        "Situation Summary: Current scenario parameters indicate active conditions requiring operator attention.",
        "Key Uncertainties: External factors (weather, demand fluctuations) remain unmeasured in this mock environment.",
        "Decision Considerations: Evaluate response timing against operational tempo requirements.",
        "Consider escalation pathways if conditions exceed defined thresholds.",
        "Cross-functional coordination may be required depending on scenario scope.",
      ],
      why_it_helps: "Operators receive structured situation awareness with clear decision points and uncertainty flags.",
      disclaimer: "Decision support only. No control actions. Human approval required. No live SCADA, OMS, ADMS, or weather feeds were accessed.",
    };
  }

  // PLANNING MODE response
  if (mode === "PLANNING") {
    return {
      mode_banner: modeBanners.PLANNING,
      framing_line: "Strategic planning and training analysis mode. Preparation considerations follow.",
      insights: [
        "Preparation Phase: Optimal readiness windows identified based on scenario parameters.",
        "Resource allocation models suggest load-balanced distribution across operational zones.",
        "Risk Assessment: Potential bottlenecks flagged for proactive mitigation.",
        "Training scenarios can be generated from historical pattern analysis.",
        "Optimization Opportunities: Process improvements identified through comparative analysis.",
      ],
      why_it_helps: "Systematic preparation reduces response variance during live events and improves team readiness.",
      disclaimer: "Planning support only. No live SCADA, OMS, ADMS, or weather feeds were accessed. All insights are illustrative.",
    };
  }

  // POST_EVENT_REVIEW MODE response
  return {
    mode_banner: modeBanners.POST_EVENT_REVIEW,
    framing_line: "Post-event analysis mode. Reviewing decision points and lessons learned.",
    insights: [
      "Timeline Reconstruction: Key decision points identified for sequential analysis.",
      "Performance Metrics: Response timing and resource utilization tracked against benchmarks.",
      "Deviation analysis highlights variance from standard operating procedures.",
      "Lessons Learned: Improvement opportunities catalogued for future reference.",
      "Process refinements suggested based on observed patterns.",
    ],
    why_it_helps: "Structured retrospectives accelerate organizational learning and improve future response.",
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
    if (!body.user_message) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate mode if provided
    const validModes = ["DEMO", "ACTIVE_EVENT", "PLANNING", "POST_EVENT_REVIEW"];
    if (body.mode && !validModes.includes(body.mode)) {
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
