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
}

const MODE_BANNERS: Record<CopilotMode, string> = {
  DEMO: "DEMO MODE",
  ACTIVE_EVENT: "ACTIVE EVENT MODE",
  PLANNING: "PLANNING / TRAINING MODE",
  POST_EVENT_REVIEW: "POST-EVENT REVIEW MODE",
};

const DISCLAIMER = "Decision support only. This system does not access live SCADA, OMS, ADMS, or weather feeds. It does not execute, authorize, or recommend operational actions. All decisions require explicit human approval.";

// Outage-specific considerations for generating contextual insights
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
  "Heavy Rain": {
    risks: ["Reduced visibility affects field operations", "Soil saturation may destabilize poles", "Increased likelihood of vegetation contact"],
    priorities: ["Monitor pole stability in saturated areas", "Delay non-critical switching until conditions improve", "Pre-position replacement equipment"],
    crew_notes: "Crews should use enhanced PPE and maintain communication check-ins.",
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
  Lightning: {
    risks: ["Direct strikes can damage transformers and arresters", "Induced surges may affect multiple circuits", "Intermittent faults common after strikes"],
    priorities: ["Patrol strike-prone corridors for damage", "Test protective devices before re-energizing", "Replace suspected failed arresters"],
    crew_notes: "Wait 30 minutes after last strike before resuming outdoor work.",
  },
  "Ice/Snow": {
    risks: ["Ice loading can collapse lines and poles", "Freezing conditions slow repair work", "Access roads may be impassable"],
    priorities: ["Clear critical feeders of ice accumulation", "Pre-position de-icing equipment", "Coordinate with road crews for access"],
    crew_notes: "Crews require cold-weather gear; limit outdoor exposure time.",
  },
  "High Wind": {
    risks: ["Wind-blown debris causes line faults", "Bucket truck operations unsafe above thresholds", "Vegetation contact increases significantly"],
    priorities: ["Suspend aerial work until winds subside", "Focus on ground-level accessible repairs", "Pre-stage crews for rapid post-wind response"],
    crew_notes: "No bucket truck operations above 35 mph sustained winds.",
  },
  "Equipment Failure": {
    risks: ["Root cause may affect similar equipment", "Cascading failures possible", "Spare parts availability uncertain"],
    priorities: ["Isolate failed equipment immediately", "Inspect adjacent equipment for stress indicators", "Order replacement parts if not in stock"],
    crew_notes: "Document failure mode thoroughly for post-event analysis.",
  },
  Vegetation: {
    risks: ["Tree contact often recurs without trimming", "Hidden damage may exist beyond visible contact", "Wildlife may be involved in fault"],
    priorities: ["Clear vegetation before re-energizing", "Patrol circuit for additional contacts", "Schedule follow-up trimming crew"],
    crew_notes: "Use proper chainsaw and climbing protocols.",
  },
  Unknown: {
    risks: ["Root cause not yet identified", "Standard protocols may not apply", "Additional investigation needed"],
    priorities: ["Gather field reports before acting", "Apply conservative restoration approach", "Prepare for multiple contingencies"],
    crew_notes: "Await further information before full mobilization.",
  },
};

function inferMode(userMessage: string): CopilotMode {
  const lower = userMessage.toLowerCase();
  if (lower.includes("demo") || lower.includes("walkthrough") || lower.includes("showcase") || lower.includes("presentation")) {
    return "DEMO";
  }
  if (lower.includes("planning") || lower.includes("training") || lower.includes("tabletop")) {
    return "PLANNING";
  }
  if (lower.includes("post-event") || lower.includes("after action") || lower.includes("review") || lower.includes("debrief")) {
    return "POST_EVENT_REVIEW";
  }
  return "ACTIVE_EVENT";
}

function generateDeterministicResponse(
  mode: CopilotMode,
  userMessage: string,
  scenario: ScenarioContext
): CopilotResponse {
  const scenarioName = scenario.scenario_name || scenario.name || "Unnamed Scenario";
  const outageType = scenario.outage_type || "Unknown";
  const lifecycle = scenario.lifecycle || scenario.lifecycle_stage || "Pre-Event";
  const stage = scenario.stage;
  const operatorRole = scenario.operator_role;
  const scheduledAt = scenario.scheduled_at || scenario.scenario_time;
  const description = scenario.description;
  const notes = scenario.notes;

  const outageInfo = OUTAGE_CONSIDERATIONS[outageType] || OUTAGE_CONSIDERATIONS["Unknown"];
  const assumptions: string[] = [];
  const sourceNotes: string[] = [
    "Scenario record (Supabase scenarios table)",
    "User prompt",
  ];

  // Build assumptions based on missing data
  if (!scenario.outage_type) {
    assumptions.push("Outage cause details not provided; using outage_type: Unknown.");
  }
  if (!description) {
    assumptions.push("No scenario description provided; analysis based on available metadata only.");
  }
  if (!operatorRole) {
    assumptions.push("Operator role not specified; general guidance applies.");
  }
  if (!scheduledAt) {
    assumptions.push("Scenario timing not specified; temporal constraints not considered.");
  }
  if (!notes) {
    assumptions.push("No additional operator notes provided.");
  }
  if (stage === undefined) {
    assumptions.push("Staged/live status not specified; treating as production scenario.");
  }

  // Always add this assumption
  assumptions.push("No live SCADA, OMS, ADMS, or weather feeds accessed; all data from scenario record.");

  // Generate mode-specific framing and insights
  let framingLine: string;
  const insights: CopilotInsight[] = [];

  switch (mode) {
    case "DEMO":
      framingLine = `Demonstrating Copilot analysis for "${scenarioName}" — a ${outageType} scenario in ${lifecycle} phase.`;
      
      // Insight 1: Outage driver
      insights.push({
        title: `Outage Driver: ${outageType} — Key Considerations`,
        bullets: [
          `This scenario involves a ${outageType.toLowerCase()} event, which typically presents specific operational challenges.`,
          ...outageInfo.risks.slice(0, 2),
          `An operator would assess these factors before dispatching crews.`,
        ],
      });

      // Insight 2: What the system highlights
      insights.push({
        title: "What Copilot Surfaces",
        bullets: [
          "The model identifies affected feeders and customer counts from scenario data.",
          "Restoration priority is suggested based on critical load definitions.",
          `Lifecycle stage (${lifecycle}) informs appropriate response posture.`,
          "Trade-offs between speed and safety are surfaced for operator review.",
        ],
      });

      // Insight 3: Operator considerations
      insights.push({
        title: "How an Operator Would Proceed",
        bullets: [
          outageInfo.crew_notes,
          ...outageInfo.priorities.slice(0, 2),
        ],
      });

      // Insight 4: Why this helps
      insights.push({
        title: "Why This Helps Operators",
        bullets: [
          "Reduces cognitive load by pre-computing restoration sequences.",
          "Surfaces trade-offs that might otherwise be overlooked under pressure.",
          "Provides consistent decision-support across all operators.",
        ],
      });
      break;

    case "ACTIVE_EVENT":
      framingLine = `Active event analysis for "${scenarioName}" — ${outageType} event in ${lifecycle} phase. Immediate decision support follows.`;
      
      // Insight 1: Situation summary
      insights.push({
        title: "Situation Summary",
        bullets: [
          `Event type: ${outageType}`,
          `Lifecycle phase: ${lifecycle}`,
          stage !== undefined ? `Environment: ${stage ? "Staged/Training" : "Production"}` : "Environment: Not specified",
          description || "No detailed description available.",
        ],
      });

      // Insight 2: Outage-specific risks
      insights.push({
        title: `${outageType} — Identified Risks`,
        bullets: outageInfo.risks,
      });

      // Insight 3: Key uncertainties
      insights.push({
        title: "Key Uncertainties",
        bullets: [
          "Actual field conditions may differ from scenario record.",
          "Crew availability and travel times are not confirmed.",
          "Weather evolution may require plan adjustments.",
          "Equipment status post-event requires field verification.",
        ],
      });

      // Insight 4: Decision considerations
      insights.push({
        title: "Decision Considerations",
        bullets: outageInfo.priorities,
      });

      // Insight 5: Crew guidance
      insights.push({
        title: "Crew Guidance",
        bullets: [
          outageInfo.crew_notes,
          "Maintain regular check-ins with dispatch.",
          "Report any conditions that differ from scenario assumptions.",
        ],
      });
      break;

    case "PLANNING":
      framingLine = `Planning/training analysis for "${scenarioName}" — ${outageType} tabletop exercise.`;
      
      insights.push({
        title: `Training Scenario: ${outageType} Event`,
        bullets: [
          `This exercise simulates a ${outageType.toLowerCase()} scenario in the ${lifecycle} phase.`,
          "Participants should consider how they would prioritize restoration.",
          "Discuss trade-offs between different approaches.",
        ],
      });

      insights.push({
        title: "Learning Objectives",
        bullets: [
          `Understand ${outageType.toLowerCase()}-specific operational challenges.`,
          "Practice prioritization of critical loads.",
          "Develop communication protocols between dispatch and field.",
          "Identify gaps in current procedures.",
        ],
      });

      insights.push({
        title: "Discussion Points",
        bullets: outageInfo.risks.map(r => `How would you mitigate: "${r}"?`),
      });

      insights.push({
        title: "Recommended Actions",
        bullets: outageInfo.priorities,
      });
      break;

    case "POST_EVENT_REVIEW":
      framingLine = `Post-event review for "${scenarioName}" — ${outageType} event analysis and lessons learned.`;
      
      insights.push({
        title: "Event Overview",
        bullets: [
          `Scenario: ${scenarioName}`,
          `Outage type: ${outageType}`,
          `Lifecycle at review: ${lifecycle}`,
          description || "No event description recorded.",
        ],
      });

      insights.push({
        title: "Expected Challenges (Per Outage Type)",
        bullets: outageInfo.risks,
      });

      insights.push({
        title: "Recommended Priorities (Were These Followed?)",
        bullets: outageInfo.priorities,
      });

      insights.push({
        title: "Review Questions",
        bullets: [
          "Were the expected risks realized? Any unexpected issues?",
          "How effective was crew coordination?",
          "What would we do differently next time?",
          "Are procedure updates needed?",
        ],
      });
      break;
  }

  // Add user message context if it provides additional direction
  if (userMessage && userMessage.length > 20) {
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes("risk") || lowerMessage.includes("hazard")) {
      sourceNotes.push("User specifically requested risk/hazard analysis.");
    }
    if (lowerMessage.includes("trade-off") || lowerMessage.includes("priorit")) {
      sourceNotes.push("User focus: prioritization and trade-offs.");
    }
    if (lowerMessage.includes("crew") || lowerMessage.includes("dispatch")) {
      sourceNotes.push("User focus: crew operations and dispatch.");
    }
  }

  return {
    mode_banner: MODE_BANNERS[mode],
    framing_line: framingLine,
    insights,
    assumptions,
    source_notes: sourceNotes,
    disclaimer: DISCLAIMER,
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
    const userMessage = body.user_message || body.message || "";

    // Validate required fields
    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_message or message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get scenario context from either scenario or context_packet
    const scenario: ScenarioContext = body.scenario || body.context_packet || {};
    if (body.scenario_id) {
      scenario.scenario_id = body.scenario_id;
    }

    // Infer mode from message if not provided
    const mode: CopilotMode = body.mode || inferMode(userMessage);

    // Validate mode if provided
    const validModes: CopilotMode[] = ["DEMO", "ACTIVE_EVENT", "PLANNING", "POST_EVENT_REVIEW"];
    if (body.mode && !validModes.includes(body.mode)) {
      return new Response(
        JSON.stringify({ error: `Invalid mode. Must be one of: ${validModes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate deterministic response based on mode, outage_type, and scenario fields
    const response = generateDeterministicResponse(mode, userMessage, scenario);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing copilot request:', error);
    
    const errorResponse: CopilotResponse = {
      mode_banner: "ACTIVE EVENT MODE",
      framing_line: "An error occurred while processing your request.",
      insights: [
        {
          title: "Service Error",
          bullets: [
            "The Copilot service encountered an unexpected error.",
            "Please try again in a few moments.",
            "If the issue persists, contact system support.",
          ],
        },
      ],
      assumptions: ["Error occurred before request could be fully processed."],
      source_notes: ["System error log"],
      disclaimer: DISCLAIMER,
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
