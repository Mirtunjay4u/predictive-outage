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
  // During ice storms, vegetation (tree branches, ice accumulation on lines)
  // is a primary failure driver. Flag when any asset exceeds 0.5 exposure.
  const isIce = scenario.hazardType === "ICE";
  const iceVegetationAssets = isIce
    ? scenario.assets.filter((a) => typeof a.vegetationExposure === "number" && a.vegetationExposure > 0.5)
    : [];
  const hasIceLoadRisk = isIce && iceVegetationAssets.length > 0;

  if (hasIceLoadRisk) {
    escalationFlags.add("ice_load_risk");
  }

  // Block reroute_load during active ICE events — switching on ice-loaded lines
  // without visual crew confirmation risks equipment damage and crew safety.
  const blockRerouteForIce = isIce && scenario.phase === "ACTIVE";

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
