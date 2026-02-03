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

  // Mode banners per spec (without "MODE:" prefix)
  const modeBanners: Record<string, string> = {
    DEMO: "DEMO MODE",
    ACTIVE_EVENT: "ACTIVE EVENT MODE",
    PLANNING: "PLANNING / TRAINING MODE",
    POST_EVENT_REVIEW: "POST-EVENT REVIEW MODE",
  };

  // DEMO MODE response
  if (mode === "DEMO") {
    return {
      mode_banner: modeBanners.DEMO,
      framing_line: "This response demonstrates what an operator would consider when reviewing a predictive outage scenario.",
      insights: [
        {
          title: "Scenario Overview",
          bullets: [
            "This helps surface potential feeder exposure and customer impact at a high level.",
            "The model highlights uncertainty in cause until confirmed by field or OMS records.",
            "No live SCADA, OMS, ADMS, or weather feeds are accessed in this demonstration."
          ]
        },
        {
          title: "Operator Considerations",
          bullets: [
            "An operator would weigh restoration prioritization against crew availability and critical loads.",
            "Trade-offs between speed, safety, and customer impact are made explicit for review.",
            "Decision points are surfaced to support—not replace—human judgment."
          ]
        },
        {
          title: "Value to Stakeholders",
          bullets: [
            "Operators and stakeholders receive a consistent, auditable summary.",
            "No automation or control is implied; this is decision support only."
          ]
        }
      ],
      disclaimer: "Decision support only. This system does not execute, authorize, or recommend operational actions. All decisions require explicit human approval. No live utility feeds were accessed."
    };
  }

  // ACTIVE_EVENT MODE response
  if (mode === "ACTIVE_EVENT") {
    return {
      mode_banner: modeBanners.ACTIVE_EVENT,
      framing_line: "Real-time operational support is active. Situation awareness and decision considerations follow.",
      insights: [
        {
          title: "Situation Summary",
          bullets: [
            "Current scenario parameters indicate active conditions requiring operator attention.",
            "System state reflects available data; external factors may not be fully represented."
          ]
        },
        {
          title: "Key Uncertainties",
          bullets: [
            "External factors such as weather and demand fluctuations remain unmeasured in this environment.",
            "Cause confirmation pending field verification or OMS correlation."
          ]
        },
        {
          title: "Decision Considerations",
          bullets: [
            "Evaluate response timing against operational tempo requirements.",
            "Consider escalation pathways if conditions exceed defined thresholds.",
            "Cross-functional coordination may be required depending on scenario scope."
          ]
        }
      ],
      disclaimer: "Decision support only. No control actions are executed by this system. Human approval is required for all operational decisions. No live SCADA, OMS, ADMS, or weather feeds were accessed."
    };
  }

  // PLANNING MODE response
  if (mode === "PLANNING") {
    return {
      mode_banner: modeBanners.PLANNING,
      framing_line: "Strategic planning and training analysis mode. Preparation considerations follow.",
      insights: [
        {
          title: "Preparation Phase",
          bullets: [
            "Optimal readiness windows identified based on scenario parameters.",
            "Resource allocation models suggest load-balanced distribution across operational zones."
          ]
        },
        {
          title: "Risk Assessment",
          bullets: [
            "Potential bottlenecks flagged for proactive mitigation.",
            "Training scenarios can be generated from historical pattern analysis."
          ]
        },
        {
          title: "Optimization Opportunities",
          bullets: [
            "Process improvements identified through comparative analysis.",
            "Systematic preparation reduces response variance during live events."
          ]
        }
      ],
      disclaimer: "Planning support only. No live SCADA, OMS, ADMS, or weather feeds were accessed. All insights are illustrative and require validation before operational use."
    };
  }

  // POST_EVENT_REVIEW MODE response
  return {
    mode_banner: modeBanners.POST_EVENT_REVIEW,
    framing_line: "Post-event analysis mode. Reviewing decision points and lessons learned.",
    insights: [
      {
        title: "Timeline Reconstruction",
        bullets: [
          "Key decision points identified for sequential analysis.",
          "Performance metrics tracked against established benchmarks."
        ]
      },
      {
        title: "Deviation Analysis",
        bullets: [
          "Variance from standard operating procedures highlighted for review.",
          "Response timing and resource utilization compared to expectations."
        ]
      },
      {
        title: "Lessons Learned",
        bullets: [
          "Improvement opportunities catalogued for future reference.",
          "Process refinements suggested based on observed patterns.",
          "Structured retrospectives accelerate organizational learning."
        ]
      }
    ],
    disclaimer: "Review and analysis only. No live SCADA, OMS, ADMS, or weather feeds were accessed. Historical data in this demonstration is simulated."
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
