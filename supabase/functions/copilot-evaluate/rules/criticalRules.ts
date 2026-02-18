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
  ];

  const blockedActions: ActionType[] = [];
  if (criticalLoadAtRisk) {
    blockedActions.push("deenergize_section");
  }

  return {
    criticalLoadAtRisk,
    escalationFlags: Array.from(escalationFlags),
    safetyConstraints,
    blockedActions,
  };
};
