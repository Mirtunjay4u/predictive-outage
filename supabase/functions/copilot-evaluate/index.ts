import { serve } from "https://deno.land/std/http/server.ts";
import type {
  ActionType,
  AllowedAction,
  BlockedAction,
  EvaluationResponse,
  ExplainabilityDriver,
  HazardType,
  NormalizedScenario,
  Phase,
  ScenarioInput,
  SafetyConstraint,
} from "./types.ts";
import { evaluateAssetRules } from "./rules/assetRules.ts";
import { evaluateCriticalRules } from "./rules/criticalRules.ts";
import { evaluateCrewRules } from "./rules/crewRules.ts";
import { evaluateEtrRules } from "./rules/etrRules.ts";

const ENGINE_VERSION = "1.0.0";
const ACTIONS: ActionType[] = [
  "dispatch_crews",
  "reroute_load",
  "deenergize_section",
  "public_advisory",
  "request_mutual_aid",
  "prioritize_critical_load",
  "generate_restoration_plan",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const validHazards: HazardType[] = ["STORM", "WILDFIRE", "RAIN", "HEAT", "ICE", "UNKNOWN"];
const validPhases: Phase[] = ["PRE_EVENT", "ACTIVE", "POST_EVENT", "UNKNOWN"];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const isIsoDate = (value: string): boolean => !Number.isNaN(new Date(value).getTime());

const safeNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) return fallback;
  return value;
};

const normalizeScenario = (input: ScenarioInput): { scenario: NormalizedScenario; warnings: string[] } => {
  const warnings: string[] = [];

  const hazardType = validHazards.includes(input.hazardType ?? "UNKNOWN") ? (input.hazardType ?? "UNKNOWN") : "UNKNOWN";
  if (input.hazardType && !validHazards.includes(input.hazardType)) {
    warnings.push(`Invalid hazardType '${input.hazardType}' normalized to UNKNOWN.`);
  }

  const phase = validPhases.includes(input.phase ?? "UNKNOWN") ? (input.phase ?? "UNKNOWN") : "UNKNOWN";
  if (input.phase && !validPhases.includes(input.phase)) {
    warnings.push(`Invalid phase '${input.phase}' normalized to UNKNOWN.`);
  }

  const severity = clamp(Math.round(safeNumber(input.severity, 3)), 1, 5);
  if (typeof input.severity !== "number") warnings.push("Missing severity; defaulted to 3.");

  const customersAffected = Math.max(0, Math.round(safeNumber(input.customersAffected, 0)));
  if (typeof input.customersAffected !== "number") {
    warnings.push("Missing customersAffected; defaulted to 0.");
  }

  const assets = Array.isArray(input.assets)
    ? input.assets
        .filter((asset) => asset && typeof asset.id === "string" && typeof asset.type === "string")
        .map((asset) => ({
          id: asset.id,
          type: asset.type,
          ageYears: typeof asset.ageYears === "number" ? clamp(asset.ageYears, 0, 120) : undefined,
          vegetationExposure:
            typeof asset.vegetationExposure === "number" ? clamp(asset.vegetationExposure, 0, 1) : undefined,
          loadCriticality: typeof asset.loadCriticality === "number" ? clamp(asset.loadCriticality, 0, 1) : undefined,
        }))
    : [];

  if (!Array.isArray(input.assets) || input.assets.length === 0) {
    warnings.push("No assets provided.");
  }

  const criticalLoads = Array.isArray(input.criticalLoads)
    ? input.criticalLoads
        .filter((load) => typeof load?.type === "string")
        .map((load) => ({
          type: ["HOSPITAL", "WATER", "TELECOM", "SHELTER", "OTHER"].includes(load.type) ? load.type : "OTHER",
          name: load.name,
          backupHoursRemaining:
            typeof load.backupHoursRemaining === "number" ? Math.max(0, load.backupHoursRemaining) : undefined,
        }))
    : [];

  const crewsAvailable = Math.max(0, Math.round(safeNumber(input.crews?.available, 0)));
  const crewsEnRoute = Math.max(0, Math.round(safeNumber(input.crews?.enRoute, 0)));
  if (!input.crews) warnings.push("Crew object missing; defaulted crew counts to 0.");

  const completeness = clamp(safeNumber(input.dataQuality?.completeness, 0.5), 0, 1);
  const freshnessMinutes = Math.max(0, Math.round(safeNumber(input.dataQuality?.freshnessMinutes, 120)));

  if (!input.dataQuality) warnings.push("Data quality missing; using conservative defaults.");

  const lastUpdated = typeof input.lastUpdated === "string" && isIsoDate(input.lastUpdated)
    ? input.lastUpdated
    : undefined;

  if (input.lastUpdated && !lastUpdated) {
    warnings.push("Invalid lastUpdated value ignored; expected ISO timestamp.");
  }

  return {
    scenario: {
      scenarioId: typeof input.scenarioId === "string" && input.scenarioId.trim() ? input.scenarioId : "unknown_scenario",
      hazardType,
      phase,
      severity,
      customersAffected,
      assets,
      criticalLoads,
      crews: {
        available: crewsAvailable,
        enRoute: crewsEnRoute,
        notes: input.crews?.notes,
      },
      lastUpdated,
      dataQuality: {
        completeness,
        freshnessMinutes,
        notes: input.dataQuality?.notes,
      },
      operatorContext: input.operatorContext ?? {},
    },
    warnings,
  };
};

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }

  return JSON.stringify(value);
};

const deterministicHash = (value: unknown): string => {
  const input = stableStringify(value);
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a_${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const mergeUnique = <T>(...arrs: T[][]): T[] => Array.from(new Set(arrs.flat()));

const addDefaultActionPolicies = (
  scenario: NormalizedScenario,
  allowedActions: AllowedAction[],
  blockedActions: BlockedAction[],
  criticalLoadAtRisk: boolean,
): { allowedActions: AllowedAction[]; blockedActions: BlockedAction[] } => {
  const allowedByAction = new Map<ActionType, AllowedAction>();
  const blockedByAction = new Map<ActionType, BlockedAction>();

  for (const a of allowedActions) allowedByAction.set(a.action, a);
  for (const b of blockedActions) blockedByAction.set(b.action, b);

  if (!blockedByAction.has("public_advisory")) {
    allowedByAction.set("public_advisory", {
      action: "public_advisory",
      reason: "Public advisory supports transparency and safety messaging.",
      constraints: ["Include ETR confidence band and critical service status in message."],
    });
  }

  if (criticalLoadAtRisk) {
    allowedByAction.set("prioritize_critical_load", {
      action: "prioritize_critical_load",
      reason: "Critical loads require restoration priority.",
      constraints: ["Sequence switching/restoration to protect hospital, water, and telecom loads."],
    });
  }

  if (scenario.phase === "ACTIVE" && scenario.severity >= 4 && !blockedByAction.has("deenergize_section")) {
    allowedByAction.set("deenergize_section", {
      action: "deenergize_section",
      reason: "Controlled de-energization may reduce safety risk during severe active events.",
      constraints: ["Requires safety officer approval and critical load impact review."],
    });
  }

  if (!allowedByAction.has("reroute_load") && !blockedByAction.has("reroute_load")) {
    allowedByAction.set("reroute_load", {
      action: "reroute_load",
      reason: "Load reroute can reduce customer minutes interrupted when safe switching is available.",
      constraints: ["Confirm feeder thermal limits and crew verification prior to switching."],
    });
  }

  for (const action of ACTIONS) {
    if (!allowedByAction.has(action) && !blockedByAction.has(action)) {
      blockedByAction.set(action, {
        action,
        reason: "Action not recommended under current rule state.",
        remediation: ["Review scenario inputs and re-evaluate after operational updates."],
      });
    }
  }

  return {
    allowedActions: ACTIONS.filter((action) => allowedByAction.has(action)).map((action) => allowedByAction.get(action)!),
    blockedActions: ACTIONS.filter((action) => blockedByAction.has(action)).map((action) => blockedByAction.get(action)!),
  };
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed", allowed: ["POST"] }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: ScenarioInput;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "Invalid JSON payload",
        allowedActions: [],
        blockedActions: [],
        escalationFlags: ["invalid_input"],
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { scenario, warnings } = normalizeScenario(payload);
  const evaluatedAt = new Date().toISOString();

  const assetResult = evaluateAssetRules(scenario);
  const avgLoadCriticality = scenario.assets.length
    ? scenario.assets.reduce((sum, asset) => sum + (asset.loadCriticality ?? 0.5), 0) / scenario.assets.length
    : 0.5;

  const criticalResult = evaluateCriticalRules(scenario, avgLoadCriticality);
  const crewResult = evaluateCrewRules(scenario);

  const hazardEscalating = scenario.phase === "ACTIVE" && (scenario.hazardType === "STORM" || scenario.hazardType === "WILDFIRE");

  const etrBand = evaluateEtrRules({
    scenario,
    crewsSufficient: crewResult.crewsSufficient,
    hasStormLikeActiveHazard: hazardEscalating,
    dataQualityWarnings: warnings,
  });

  const additionalEscalations: string[] = [];
  if (hazardEscalating) additionalEscalations.push("storm_active");
  if (etrBand.band === "LOW") additionalEscalations.push("low_confidence_etr");
  // STORM active phase: high wind elevates conductor contact and tree strike risk.
  if (scenario.hazardType === "STORM" && scenario.phase === "ACTIVE") {
    additionalEscalations.push("high_wind_conductor_risk");
  }
  // FLOOD/RAIN active phase: ground saturation restricts pad-mount equipment access.
  if (scenario.hazardType === "RAIN" && scenario.phase === "ACTIVE") {
    additionalEscalations.push("flood_access_risk");
  }
  // HEAT severe phase: extreme temperatures drive peak load conditions and transformer thermal stress.
  if (scenario.hazardType === "HEAT" && scenario.severity >= 4) {
    additionalEscalations.push("heat_load_spike");
  }
  // Asset-rule escalation flags (e.g. transformer_thermal_stress for HEAT, vegetation_fire_risk for WILDFIRE)
  additionalEscalations.push(...assetResult.escalationFlags);

  // ── Wildfire field-switching block ────────────────────────────────────────────
  // When vegetation_fire_risk is active, deenergize_section must be blocked:
  // aerial fire assessment is required before any field switching is permitted.
  const vegetationFireBlocked = assetResult.escalationFlags.includes("vegetation_fire_risk");
  const vegetationFireBlock: BlockedAction[] = vegetationFireBlocked
    ? [
        {
          action: "deenergize_section",
          reason: "Vegetation fire risk active — aerial assessment required before field switching.",
          remediation: [
            "Complete aerial fire line clearance.",
            "Obtain confirmation from incident commander.",
            "Re-evaluate once vegetation exposure drops below 0.60 threshold.",
          ],
        },
      ]
    : [];

  // ── ICE active-phase switching block ─────────────────────────────────────────
  const iceActiveBlock: BlockedAction[] =
    scenario.hazardType === "ICE" && scenario.phase === "ACTIVE"
      ? [
          {
            action: "deenergize_section",
            reason: "Active ice storm — remote switching prohibited without crew visual confirmation of line state.",
            remediation: [
              "Await crew visual confirmation of line state before any switching action.",
              "Re-evaluate after ice accumulation assessment is complete.",
              "Coordinate with field supervisor; do not switch remotely on ice-loaded conductors.",
            ],
          },
        ]
      : [];

  // ── STORM active-phase crew dispatch block ────────────────────────────────────
  // High wind conditions elevate conductor contact and tree strike risk for
  // field personnel. Crew dispatch is deferred until conditions stabilise.
  const stormActiveBlock: BlockedAction[] =
    scenario.hazardType === "STORM" && scenario.phase === "ACTIVE"
      ? [
          {
            action: "dispatch_crews",
            reason: "Active storm conditions — field crew dispatch deferred until wind speeds drop below operational safety threshold.",
            remediation: [
              "Monitor wind speed telemetry and await all-clear from safety officer.",
              "Stage crews at a safe distance from the affected zone.",
              "Re-evaluate dispatch readiness after conditions stabilise.",
            ],
          },
          {
            action: "reroute_load",
            reason: "Active storm conditions — remote load rerouting deferred until storm clears and feeder integrity can be confirmed.",
            remediation: [
              "Await storm clearance before initiating any remote switching.",
              "Confirm feeder integrity and thermal limits post-storm before rerouting.",
              "Coordinate with field supervisor once wind speeds drop below operational threshold.",
            ],
          },
        ]
      : [];

  // ── HEAT thermal overload reroute block ──────────────────────────────────────
  // SC-HEAT-001 triggers at severity >= 3. Load rerouting risks pushing already
  // thermally stressed transformers into insulation degradation territory.
  const heatOverloadBlock: BlockedAction[] =
    scenario.hazardType === "HEAT" && scenario.severity >= 3
      ? [
          {
            action: "reroute_load",
            reason: "Transformer thermal overload risk — load rerouting deferred until thermal ratings are confirmed.",
            remediation: [
              "Review transformer thermal ratings for affected feeders.",
              "Confirm adequate cooling margins before switching.",
              "Coordinate with asset management before restoring full load.",
            ],
          },
        ]
      : [];

  // ── FLOOD/RAIN active-phase crew dispatch block ───────────────────────────────
  // Ground saturation and standing water restrict safe field access near
  // pad-mount and substation equipment.
  const floodActiveBlock: BlockedAction[] =
    scenario.hazardType === "RAIN" && scenario.phase === "ACTIVE"
      ? [
          {
            action: "dispatch_crews",
            reason: "Active flood conditions — field crew ground access deferred until flood levels recede and site safety is confirmed.",
            remediation: [
              "Monitor flood level telemetry and await site safety clearance.",
              "Stage crews away from flood-affected zones.",
              "Re-evaluate access once water levels recede and SC-FLOOD-001 constraint is lifted.",
            ],
          },
        ]
      : [];

  const baseBlocked: BlockedAction[] = [
    ...vegetationFireBlock,
    ...iceActiveBlock,
    ...stormActiveBlock,
    ...heatOverloadBlock,
    ...floodActiveBlock,
    ...crewResult.blockedActions,
    ...criticalResult.blockedActions.map((action) => ({
      action,
      reason: "Action blocked due to critical load risk.",
      remediation: ["Prioritize critical load restoration path before this action."],
    })),
  ];

  const actionPolicy = addDefaultActionPolicies(
    scenario,
    crewResult.allowedActions,
    baseBlocked,
    criticalResult.criticalLoadAtRisk,
  );

  const safetyConstraints: SafetyConstraint[] = [
    ...criticalResult.safetyConstraints,
    {
      id: "SC-CREW-001",
      title: "Field crew sufficiency",
      description: "High-risk switching and restoration actions require adequate crew staffing.",
      severity: crewResult.crewsSufficient ? "LOW" : "HIGH",
      triggered: !crewResult.crewsSufficient,
      evidence: [
        `Crews available + en-route: ${crewResult.crewsAvailableTotal}.`,
        `Estimated crews needed: ${crewResult.estimatedCrewsNeeded}.`,
      ],
    },
  ];

  const drivers: ExplainabilityDriver[] = [
    ...assetResult.drivers,
    { key: "severity", value: scenario.severity, weight: 0.3 },
    { key: "customers_affected", value: scenario.customersAffected, weight: 0.25 },
    { key: "crews_sufficient", value: crewResult.crewsSufficient, weight: 0.35 },
    { key: "etr_band", value: etrBand.band, weight: 0.4 },
  ];

  const response: EvaluationResponse = {
    allowedActions: actionPolicy.allowedActions,
    blockedActions: actionPolicy.blockedActions,
    escalationFlags: mergeUnique(criticalResult.escalationFlags, crewResult.escalationFlags, additionalEscalations),
    etrBand,
    safetyConstraints,
    explainability: {
      drivers,
      assumptions: mergeUnique(assetResult.assumptions, [
        "Estimated crew need is derived from customers affected and severity.",
        "Missing fields are normalized to conservative defaults.",
      ]),
      dataQualityWarnings: warnings,
    },
    timestamps: {
      evaluatedAt,
      inputLastUpdated: scenario.lastUpdated,
    },
    meta: {
      engineVersion: ENGINE_VERSION,
      deterministicHash: deterministicHash({
        scenario,
        warnings,
      }),
    },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
});
