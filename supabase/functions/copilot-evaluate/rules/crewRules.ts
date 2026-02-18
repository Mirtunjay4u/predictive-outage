import type { AllowedAction, BlockedAction, NormalizedScenario } from "../types.ts";

const clampMin = (value: number, min: number): number => (Number.isFinite(value) ? Math.max(value, min) : min);

export interface CrewRuleResult {
  crewsAvailableTotal: number;
  estimatedCrewsNeeded: number;
  crewsSufficient: boolean;
  escalationFlags: string[];
  allowedActions: AllowedAction[];
  blockedActions: BlockedAction[];
}

export const evaluateCrewRules = (scenario: NormalizedScenario): CrewRuleResult => {
  const available = clampMin(scenario.crews.available, 0);
  const enRoute = clampMin(scenario.crews.enRoute, 0);
  const crewsAvailableTotal = available + enRoute;

  const customerFactor = clampMin(Math.ceil(scenario.customersAffected / 1500), 0);
  const severityFactor = clampMin(Math.ceil(scenario.severity * 1.2), 1);
  const estimatedCrewsNeeded = Math.max(1, customerFactor + severityFactor);

  const crewsSufficient = crewsAvailableTotal >= estimatedCrewsNeeded;

  const escalationFlags: string[] = [];
  if (!crewsSufficient) {
    escalationFlags.push("insufficient_crews");
  }

  const allowedActions: AllowedAction[] = [
    {
      action: "dispatch_crews",
      reason: crewsSufficient
        ? "Crew coverage meets estimated restoration demand."
        : "Dispatch is still allowed to optimize available workforce under constrained conditions.",
      constraints: [
        `Use incident command priority; estimated crews needed: ${estimatedCrewsNeeded}.`,
        "Assign at least one crew to critical load corridors first.",
      ],
    },
    {
      action: "request_mutual_aid",
      reason: crewsSufficient
        ? "Mutual aid can improve restoration speed even when crews are currently sufficient."
        : "Mutual aid recommended because available + en-route crews are below estimated need.",
      constraints: ["Coordinate with neighboring districts and validate travel ETA before commitment."],
    },
    {
      action: "generate_restoration_plan",
      reason: "Planning action is always permitted and improves dispatch sequencing.",
      constraints: ["Recompute plan when crew counts or hazard phase changes."],
    },
  ];

  const blockedActions: BlockedAction[] = crewsSufficient
    ? []
    : [
        {
          action: "reroute_load",
          reason: "Crew shortfall increases operational switching risk and slows verification loops.",
          remediation: [
            "Stage additional switching-qualified crews.",
            "Use mutual aid or postpone reroute until minimum crew threshold is met.",
          ],
        },
      ];

  return {
    crewsAvailableTotal,
    estimatedCrewsNeeded,
    crewsSufficient,
    escalationFlags,
    allowedActions,
    blockedActions,
  };
};
