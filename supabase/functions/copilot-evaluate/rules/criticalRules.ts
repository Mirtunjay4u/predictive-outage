import type { ActionType, NormalizedScenario, SafetyConstraint } from "../types.ts";

const CRITICAL_TYPES = new Set<string>(["HOSPITAL", "WATER", "TELECOM"]);

export interface CriticalRuleResult {
  criticalLoadAtRisk: boolean;
  escalationFlags: string[];
  safetyConstraints: SafetyConstraint[];
  blockedActions: ActionType[];
}

export const evaluateCriticalRules = (scenario: NormalizedScenario, avgLoadCriticality: number): CriticalRuleResult => {
  const escalationFlags = new Set<string>();

  const criticalLoadPresent = scenario.criticalLoads.some((load) => CRITICAL_TYPES.has(load.type));
  const criticalByScore = avgLoadCriticality >= 0.7;
  const criticalLoadAtRisk = criticalLoadPresent || criticalByScore;

  if (criticalLoadAtRisk) {
    escalationFlags.add("critical_load_at_risk");
  }

  const lowBackupLoads = scenario.criticalLoads.filter(
    (load) => typeof load.backupHoursRemaining === "number" && load.backupHoursRemaining < 4,
  );

  if (lowBackupLoads.length > 0) {
    escalationFlags.add("critical_backup_window_short");
  }

  // ── ICE hazard rules ──────────────────────────────────────────────────────────
  const isIce = scenario.hazardType === "ICE";
  const iceVegetationAssets = isIce
    ? scenario.assets.filter((a) => typeof a.vegetationExposure === "number" && a.vegetationExposure > 0.5)
    : [];
  const hasIceLoadRisk = isIce && iceVegetationAssets.length > 0;

  if (hasIceLoadRisk) {
    escalationFlags.add("ice_load_risk");
  }

  const blockRerouteForIce = isIce && scenario.phase === "ACTIVE";

  // ── STORM hazard rules ────────────────────────────────────────────────────────
  const isStormActive = scenario.hazardType === "STORM" && scenario.phase === "ACTIVE";

  // ── HEAT hazard rules ─────────────────────────────────────────────────────────
  const isHeatOverload = scenario.hazardType === "HEAT" && scenario.severity >= 3;

  // ── FLOOD/RAIN hazard rules ───────────────────────────────────────────────────
  const isFloodActive = scenario.hazardType === "RAIN" && scenario.phase === "ACTIVE";
  // Aerial fire line clearance is required before any field switching when
  // average vegetation exposure exceeds 0.60 in an active wildfire event.
  const isWildfire = scenario.hazardType === "WILDFIRE";
  const wildfireHighExposureAssets = isWildfire
    ? scenario.assets.filter((a) => typeof a.vegetationExposure === "number" && a.vegetationExposure > 0.6)
    : [];
  const hasWildfireSwitchingRisk = isWildfire && wildfireHighExposureAssets.length > 0;

  // ── Safety constraints ────────────────────────────────────────────────────────
  const safetyConstraints: SafetyConstraint[] = [
    {
      id: "SC-CRIT-001",
      title: "Critical service continuity",
      description: "Actions must prioritize restoration and continuity for critical services.",
      severity: "HIGH",
      triggered: criticalLoadAtRisk,
      evidence: criticalLoadAtRisk
        ? [
            criticalLoadPresent ? "Critical load types (hospital/water/telecom) detected." : "",
            criticalByScore ? `Average load criticality is ${avgLoadCriticality.toFixed(2)} (>= 0.70).` : "",
          ].filter(Boolean)
        : ["No critical load indicators crossed threshold."],
    },
    {
      id: "SC-CRIT-002",
      title: "Backup power depletion risk",
      description: "If backup windows are short, defer non-essential switching work and accelerate support.",
      severity: "HIGH",
      triggered: lowBackupLoads.length > 0,
      evidence:
        lowBackupLoads.length > 0
          ? lowBackupLoads.map((load) => `${load.type}${load.name ? ` (${load.name})` : ""} backup < 4h.`)
          : ["No backup duration under 4 hours provided."],
    },
    {
      id: "SC-ICE-001",
      title: "Ice storm switching prohibition",
      description:
        "Load rerouting via switching is prohibited during active ICE events without crew visual confirmation of line state.",
      severity: blockRerouteForIce ? "HIGH" : "LOW",
      triggered: blockRerouteForIce,
      evidence: blockRerouteForIce
        ? [
            "Hazard: ICE — phase: ACTIVE.",
            "Remote switching without visual line inspection risks cascading failures on ice-loaded conductors.",
            blockRerouteForIce && hasIceLoadRisk
              ? `${iceVegetationAssets.length} asset(s) with vegetation exposure > 0.5 identified.`
              : "",
          ].filter(Boolean)
        : ["Not triggered — ICE phase not ACTIVE or hazard is not ICE."],
    },
    {
      id: "SC-ICE-002",
      title: "Ice vegetation line loading",
      description:
        "Assets with high vegetation exposure are at elevated risk of conductor failure under ice accumulation.",
      severity: hasIceLoadRisk ? "HIGH" : "LOW",
      triggered: hasIceLoadRisk,
      evidence: hasIceLoadRisk
        ? iceVegetationAssets.map(
            (a) => `Asset ${a.id} (${a.type}) — vegetation exposure: ${(a.vegetationExposure ?? 0).toFixed(2)}.`,
          )
        : ["No ICE hazard or all assets below 0.5 vegetation exposure threshold."],
    },
    {
      id: "SC-HEAT-001",
      title: "Transformer thermal overload risk",
      description: "Sustained heat load may accelerate insulation degradation — review transformer thermal ratings before restoring full load.",
      severity: "HIGH",
      triggered: isHeatOverload,
      evidence: isHeatOverload
        ? [
            `Hazard: HEAT — severity ${scenario.severity}/5 (threshold: 3).`,
            "Sustained ambient heat elevates transformer winding temperature and may accelerate insulation breakdown under full load restoration.",
          ]
        : ["Not triggered — HEAT hazard not active or severity below threshold of 3."],
    },
    {
      id: "SC-FLOOD-001",
      title: "Flood zone equipment access restriction",
      description: "Pad-mount and ground-level equipment access is restricted until flood levels recede and site safety is confirmed.",
      severity: "HIGH",
      triggered: isFloodActive,
      evidence: isFloodActive
        ? [
            "Hazard: FLOOD/RAIN — phase: ACTIVE.",
            "Ground saturation and standing water elevate electrocution risk for field personnel near pad-mount equipment.",
          ]
        : ["Not triggered — FLOOD/RAIN hazard not active or phase is not ACTIVE."],
    },
    {
      id: "SC-STORM-001",
      title: "High wind field crew prohibition",
      description: "Field crew dispatch is deferred until wind speeds drop below operational safety threshold.",
      severity: "HIGH",
      triggered: isStormActive,
      evidence: isStormActive
        ? [
            "Hazard: STORM — phase: ACTIVE.",
            "High wind conditions elevate conductor contact and tree strike risk for field personnel.",
          ]
        : ["Not triggered — STORM hazard not active or phase is not ACTIVE."],
    },
    {
      id: "SC-WILD-001",
      description: "Field switching is prohibited until aerial fire line clearance is confirmed by incident commander.",
      severity: hasWildfireSwitchingRisk ? "HIGH" : "LOW",
      triggered: hasWildfireSwitchingRisk,
      evidence: hasWildfireSwitchingRisk
        ? [
            `Hazard: WILDFIRE — ${wildfireHighExposureAssets.length} asset(s) exceed 0.60 vegetation exposure threshold.`,
            ...wildfireHighExposureAssets.map(
              (a) => `Asset ${a.id} (${a.type}) — vegetation exposure: ${(a.vegetationExposure ?? 0).toFixed(2)}.`,
            ),
          ]
        : ["Not triggered — WILDFIRE hazard not active or all assets at or below 0.60 vegetation exposure."],
    },
  ];

  const blockedActions: ActionType[] = [];
  if (criticalLoadAtRisk) {
    blockedActions.push("deenergize_section");
  }
  if (blockRerouteForIce) {
    blockedActions.push("reroute_load");
  }

  return {
    criticalLoadAtRisk,
    escalationFlags: Array.from(escalationFlags),
    safetyConstraints,
    blockedActions,
  };
};
